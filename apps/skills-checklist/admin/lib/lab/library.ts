import HGTC_JSON from "@/lib/v2/hgtc-library.json"
// One name per model on every screen: the Configure step names (decision D-X31 wording sweep), not the v2 labels.
import { LAB_MODEL_LABEL as MODEL_LABEL } from "./configure"
import { evalsOfSkill } from "@/lib/v2/evidence-index"
import { allCourses, courseLabel, trackedAgainst } from "@/lib/v2/admin-actions"
import { isConfigured } from "@/lib/v2/population"
import { skillNoun, skillNounPlural } from "./terms"
import type { EvalModel, ImportBatch, Skill, V2State } from "@/lib/v2/types"
import { activeNames, getVocabulary } from "@/lib/v2/vocabulary"
import { appendAudit } from "@/lib/v2/store"
import { configurationOf, resolveRule, timesCellOf, type Configuration, type SkillStatus } from "./program-settings"
import { programRuleIn, toSkillConfig, validateRule } from "./configure"

/**
 * Skills library model for the design lab (admin "Skills library" and "Add a skill" screens).
 * Pure functions over the shared v2 store plus a lab-local overlay for skills added by hand in this tab (and their edits).
 * Deactivate, reactivate and delete of library skills are written to the shared store (lib/v2/admin-actions.ts
 * setSkillsActive, deleteSkill) so every report figure changes with them (decisions D-X14, D-X15).
 *
 * Sources: REQ SL-01..11, IM-09..14, SC-01..02, CM-03..05. Strategy/03 section 5.3 (configuration states) and
 * section 9 (deactivate vs delete vs new list). Status and Configuration words live only in STATUS_META and CONFIGURATION_META.
 */

export const LAB_ADMIN = "/lab/admin"

// ---------------------------------------------------------------------------------------------------------------------
// Status

/**
 * Two separate fields (map D0, D-L88, D-L89): Status and Configuration. The only place their words live. Active and Default are plain text
 * with no badge, so that Custom (info), Not configured (amber, never red) and Inactive read as the exceptions they are; Inactive differs by glyph and word on a muted row (the
 * DS has no quiet tone besides neutral) (D-L94, D-L97) [INFER on tones].
 */
export type { SkillStatus, Configuration }
export type LibraryStatus = SkillStatus

export type StatusTone = "warning" | "info" | "success" | "neutral"

interface WordMeta { label: string; tone: StatusTone; icon: string }

export const STATUS_META: Record<SkillStatus, WordMeta> = {
  active: { label: "Active", tone: "success", icon: "fa-circle-check" },
  inactive: { label: "Inactive", tone: "neutral", icon: "fa-circle-minus" },
}

export const CONFIGURATION_ORDER: Configuration[] = ["default", "edited", "not-configured"]

export const CONFIGURATION_META: Record<Configuration, WordMeta> = {
  default: { label: "Default", tone: "neutral", icon: "fa-circle-check" },
  edited: { label: "Custom", tone: "info", icon: "fa-sliders" },
  "not-configured": { label: "Not configured", tone: "warning", icon: "fa-triangle-exclamation" },
}

export const isConfiguration = (v: string | null | undefined): v is Configuration => v === "default" || v === "edited" || v === "not-configured"

/** Can be mapped and submitted against (D0) [REQ IM-09, SL-11]. */
export const isUsableRow = (r: Pick<LibraryRow, "status" | "configuration">): boolean => r.status === "active" && r.configuration !== "not-configured"

/**
 * The one sentence for the IM-09 hard stop, shared by the library banner and course mapping (comprehension audit 2026-10-27:
 * two wordings of one rule read as two rules). `one` for a single skill.
 */
export function notConfiguredBlock(one = false): string {
  const noun = skillNoun()
  return one ? `This ${noun} is not configured, so it cannot be sent or mapped.` : `${noun.charAt(0).toUpperCase()}${skillNounPlural().slice(1)} not configured cannot be sent or mapped.`
}

export const MODEL_OPTIONS: Array<{ value: EvalModel; label: string }> = (Object.keys(MODEL_LABEL) as EvalModel[]).map((m) => ({ value: m, label: MODEL_LABEL[m] }))

// ---------------------------------------------------------------------------------------------------------------------
// Rows

export interface LibraryRow extends Record<string, unknown> {
  id: string
  name: string
  /** What the skill is, in the program's words [REQ SL-02]. Empty when none was given. */
  description: string
  /** The program's top level; shown as "Category" in the UI. */
  section: string
  /** Second level under the section; empty when the program's list has none. */
  group: string
  category: string
  tags: string[]
  status: SkillStatus
  configuration: Configuration
  /** The skill's Times needed is not the program's number. */
  timesDiffer: boolean
  model: EvalModel | null
  modelLabel: string
  /** Course offerings the skill is mapped to (mandatory or non-mandatory). */
  courses: number
  mandatoryCourses: number
  /** Evaluations recorded against the skill. Drives whether delete is allowed. */
  evidence: number
  source: string
  /** Delete exists only while nothing is tracked against the skill (decision D-X15; `trackedAgainst`). Mapping does not block it. */
  canDelete: boolean
  /** Courses the skill is mapped to, as "CODE Name" labels: what delete would unmap it from (decision D-X15). */
  unmapFrom: string[]
  /** Added in this lab session. */
  isNew: boolean
  /** How many of the program's skill lists hold it (filled by the library hook, which reads the lists). */
  onLists?: number
  /** The add several this skill arrived in [REQ IM-11], so Show them can filter to it. */
  batchId?: string
  /** On a row just added, `section` holds the group that keeps it at the top; this keeps its real category for the Category cell. */
  categoryName?: string
  /** The category shown on the row has been deactivated since it was assigned [REQ SL-06]: it stays, marked "Inactive". */
  categoryInactive: boolean
  /** Tags on the row that have been deactivated since they were assigned [REQ SL-06]: they stay, marked "Inactive". */
  inactiveTags: string[]
}

interface HgtcRow {
  id: string
  section: string
  group?: string
}

const HGTC_BY_ID = new Map((HGTC_JSON as HgtcRow[]).map((h) => [h.id, h]))

/** Lab-local changes on top of the seed. */
export interface LibraryOverlay {
  added: AddedSkill[]
  /** Skills added by hand in this session that were deactivated (store skills carry `Skill.active` instead). */
  inactive: string[]
  /** Kept for compatibility; store skills are reactivated through the shared store. */
  reactivated: string[]
  deleted: string[]
  /** Name, description, section, group, category and tag edits by skill id. */
  edits: Record<string, Partial<Pick<AddedSkill, "name" | "description" | "section" | "group" | "category" | "tags">>>
  /** Configuration copied from another skill (IM-14): target id -> source id. The target holds it as a draft to check and save. */
  copiedFrom: Record<string, string>
  /** Skills added by hand in this session (now in the store): their rows read "New". */
  fresh?: string[]
}

export interface AddedSkill {
  id: string
  name: string
  /** Optional [REQ SL-02 "a skill has a name, a description and an active/inactive status"]. */
  description?: string
  section: string
  group: string
  category: string
  tags: string[]
  model: EvalModel | null
  mandatoryDefault: "mandatory" | "non-mandatory" | null
  /** Optional on older overlays. */
}

/** Group name for a skill with no category (category is optional, REQ SL-03). */
export const NO_CATEGORY = "No category"

/**
 * Deactivated skills from the data layer (Skill.active === false). The generated seed deactivates two skills (dataset spec
 * section 12, the rule this screen used as a demo overlay), so every report figure excludes the same skills (decision D-X14).
 */
export function demoInactiveIds(state: V2State): string[] {
  return state.skills.filter((k) => k.active === false).map((k) => k.id)
}

export const EMPTY_OVERLAY: LibraryOverlay = { added: [], inactive: [], reactivated: [], deleted: [], edits: {}, copiedFrom: {} }

/** The category a skill shows under, the same one the Categories and tags page counts it in (D-L66). */
export function sectionOf(k: Pick<Skill, "category" | "hgtc">): string {
  const h = k.hgtc ? HGTC_BY_ID.get(k.hgtc.id) : undefined
  return k.category || (h?.section ?? "No section")
}

export function groupOf(k: Pick<Skill, "category" | "hgtc">): string {
  const h = k.hgtc ? HGTC_BY_ID.get(k.hgtc.id) : undefined
  const group = h?.group ?? k.hgtc?.group ?? ""
  // The category already names it: no second line saying the same word under every skill.
  return group === k.category ? "" : group
}

/**
 * Deactivated categories and tags, by lower-case name, from the ONE shared vocabulary (lib/v2/vocabulary.ts) [REQ SL-06: "One
 * already assigned but since deactivated remains on the skill, identifiable as inactive"].
 */
export function inactiveVocab(state: V2State): { categories: Set<string>; tags: Set<string> } {
  const v = getVocabulary(state)
  return {
    categories: new Set(v.categories.filter((e) => !e.active).map((e) => normName(e.name))),
    tags: new Set(v.tags.filter((e) => !e.active).map((e) => normName(e.name))),
  }
}

export function buildLibrary(state: V2State, overlay: LibraryOverlay = EMPTY_OVERLAY): LibraryRow[] {
  const off = inactiveVocab(state)
  const vocabMarks = (r: Pick<LibraryRow, "section" | "category" | "tags">) => ({
    categoryInactive: [r.section, r.category].some((c) => !!c && c !== NO_CATEGORY && off.categories.has(normName(c))),
    inactiveTags: r.tags.filter((t) => off.tags.has(normName(t))),
  })
  const inactive = new Set([...demoInactiveIds(state), ...overlay.inactive].filter((id) => !overlay.reactivated.includes(id)))
  const deleted = new Set(overlay.deleted)
  const courseCount = new Map<string, { all: Set<string>; mandatory: Set<string> }>()
  for (const m of state.mappings) {
    // Stored Optional reads as Not mapped (D-L76).
    if (m.level !== "mandatory" && m.level !== "recommended") continue
    const c = courseCount.get(m.skillId) ?? { all: new Set<string>(), mandatory: new Set<string>() }
    c.all.add(m.courseId)
    if (m.level === "mandatory") c.mandatory.add(m.courseId)
    courseCount.set(m.skillId, c)
  }
  const courseName = new Map(allCourses(state).map((c) => [c.id, courseLabel(c)]))
  const batchLabel = new Map(state.batches.map((b) => [b.id, b.label]))
  const modelOf = new Map<string, EvalModel | null>([...state.skills.map((k) => [k.id, k.model] as const), ...overlay.added.map((a) => [a.id, a.model] as const)])
  const copied = (id: string): EvalModel | null | undefined => (overlay.copiedFrom[id] ? modelOf.get(overlay.copiedFrom[id]!) ?? null : undefined)
  const rows: LibraryRow[] = state.skills
    .filter((k) => !deleted.has(k.id))
    .map((k0) => {
      const e = overlay.edits[k0.id]
      const cm = copied(k0.id)
      const k = { ...k0, ...(cm !== undefined && !isConfigured(k0) ? { model: cm } : {}) }
      const c = courseCount.get(k.id)
      const evidence = evalsOfSkill(state, k.id).length
      const courses = c?.all.size ?? 0
      const status: SkillStatus = inactive.has(k.id) ? "inactive" : "active"
      const base = {
        id: k.id,
        name: e?.name ?? k.name,
        description: e?.description ?? k.description ?? "",
        // An edit that cleared the category reads "No category" (an empty section rendered a blank Category fact).
        section: e?.section !== undefined ? e.section || NO_CATEGORY : sectionOf(k),
        group: e?.group ?? groupOf(k),
        category: e?.category ?? (k.category && k.category !== "No category" ? k.category : ""),
        tags: e?.tags ?? k.tags ?? [],
        status,
        configuration: configurationOf(state, k),
        timesDiffer: timesCellOf(state, k.id).differs,
        model: k.model,
        modelLabel: k.model ? MODEL_LABEL[k.model] : "",
        courses,
        mandatoryCourses: c?.mandatory.size ?? 0,
        evidence,
        source: k.batchId ? batchLabel.get(k.batchId) ?? "Import" : k.addedByHand ? "Added by hand" : "Program list",
        canDelete: trackedAgainst(state, k.id).total === 0,
        unmapFrom: [...(c?.all ?? [])].map((id) => courseName.get(id) ?? id).sort(),
        isNew: !!overlay.fresh?.includes(k.id),
        ...(k.batchId ? { batchId: k.batchId } : {}),
      }
      return { ...base, ...vocabMarks(base) }
    })
  const added: LibraryRow[] = overlay.added
    .filter((a) => !deleted.has(a.id))
    .map((a0) => {
      const a = { ...a0, ...overlay.edits[a0.id] }
      const cm = copied(a.id)
      const model = cm !== undefined ? cm : a.model
      const status: SkillStatus = inactive.has(a.id) ? "inactive" : "active"
      const base = {
        id: a.id,
        name: a.name,
        description: a.description ?? "",
        section: a.section || NO_CATEGORY,
        group: a.group,
        category: a.category,
        tags: a.tags,
        status,
        configuration: "not-configured" as Configuration,
        timesDiffer: false,
        model,
        modelLabel: model ? MODEL_LABEL[model] : "",
        courses: 0,
        mandatoryCourses: 0,
        evidence: 0,
        source: "Added by hand",
        canDelete: true,
        unmapFrom: [],
        isNew: true,
      }
      return { ...base, ...vocabMarks(base) }
    })
  return [...added, ...rows]
}

// ---------------------------------------------------------------------------------------------------------------------
// Counts and roll-ups

export interface LibraryCounts {
  total: number
  active: number
  inactive: number
  /** Configuration, among every row (Status and Configuration move independently, D0 rule 10). */
  defaultConfiguration: number
  edited: number
  notConfigured: number
  /** Active and not Not configured: skills that can be mapped and submitted. */
  ready: number
}

export function countLibrary(rows: readonly LibraryRow[]): LibraryCounts {
  const by = (c: Configuration) => rows.filter((r) => r.configuration === c).length
  const inactive = rows.filter((r) => r.status === "inactive").length
  return { total: rows.length, active: rows.length - inactive, inactive, defaultConfiguration: by("default"), edited: by("edited"), notConfigured: by("not-configured"), ready: rows.filter(isUsableRow).length }
}

export interface GroupNode {
  key: string
  name: string
  rows: LibraryRow[]
  counts: LibraryCounts
}

export interface SectionNode {
  key: string
  name: string
  /** Skills directly under the section (no group). */
  rows: LibraryRow[]
  groups: GroupNode[]
  counts: LibraryCounts
}

/** Section > Group > Skill, in library order, with "x of y configured" roll-ups at each level. */
export function buildTree(rows: readonly LibraryRow[]): SectionNode[] {
  const sections = new Map<string, { rows: LibraryRow[]; groups: Map<string, LibraryRow[]> }>()
  for (const r of rows) {
    const s = sections.get(r.section) ?? { rows: [], groups: new Map<string, LibraryRow[]>() }
    if (r.group) {
      const g = s.groups.get(r.group) ?? []
      g.push(r)
      s.groups.set(r.group, g)
    } else s.rows.push(r)
    sections.set(r.section, s)
  }
  return [...sections.entries()].map(([name, s]) => {
    const all = [...s.rows, ...[...s.groups.values()].flat()]
    return {
      key: slug(name),
      name,
      rows: s.rows,
      groups: [...s.groups.entries()].map(([g, gr]) => ({ key: `${slug(name)}--${slug(g)}`, name: g, rows: gr, counts: countLibrary(gr) })),
      counts: countLibrary(all),
    }
  })
}

/** "12 of 14 configured" counts configured among active skills. */
export function rollupLabel(c: LibraryCounts): string {
  const active = c.total - c.inactive
  return `${c.ready} of ${active} configured`
}

export const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

// ---------------------------------------------------------------------------------------------------------------------
// Board

/** The board's columns (Skills library variant C): one for each Configuration among Active skills, one for Inactive. */
export type BoardColumn = Configuration | "inactive"
export const BOARD_ORDER: BoardColumn[] = ["not-configured", "default", "edited", "inactive"]
export const boardColumnOf = (r: Pick<LibraryRow, "status" | "configuration">): BoardColumn => (r.status === "inactive" ? "inactive" : r.configuration)
export const byBoardColumn = (rows: readonly LibraryRow[]): Record<BoardColumn, LibraryRow[]> => {
  const out: Record<BoardColumn, LibraryRow[]> = { "not-configured": [], default: [], edited: [], inactive: [] }
  for (const r of rows) out[boardColumnOf(r)].push(r)
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Status tabs (list template T1: the tabs carry the counts; there is no KPI strip). The tabs are Status and nothing else (map D1): Configuration is
// its own column and its own filter. tests/lab/library.test.ts ties the counts to lib/v2/facts.ts.

export type LibraryTab = "all" | SkillStatus

export const LIBRARY_TABS: Array<{ value: LibraryTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: STATUS_META.active.label },
  { value: "inactive", label: STATUS_META.inactive.label },
]

export const isLibraryTab = (v: string | null | undefined): v is LibraryTab => LIBRARY_TABS.some((t) => t.value === v)

export function tabCount(c: LibraryCounts, tab: LibraryTab): number {
  return tab === "all" ? c.total : tab === "active" ? c.active : c.inactive
}

export const rowsForTab = (rows: readonly LibraryRow[], tab: LibraryTab): LibraryRow[] => (tab === "all" ? [...rows] : rows.filter((r) => r.status === tab))

// ---------------------------------------------------------------------------------------------------------------------
// Saved views (variant A). Kept small: a view is a layout (grouping and columns), never a status filter, because the
// status tabs already filter by status (say it once). Coordinators can save their own on top of these two.

export interface SavedView {
  id: string
  label: string
  /** Kept for views saved before the tabs existed; ignored (the tabs own status). */
  status: string[]
  groupBy: string | null
  hiddenColumns: string[]
}

export const SAVED_VIEWS: SavedView[] = [
  // What setup needs in the table: name, times needed, status. How it's judged and Courses open with the row (D-L65).
  { id: "by-category", label: "By category", status: [], groupBy: "section", hiddenColumns: ["tags", "source", "modelLabel", "courses"] },
  { id: "flat", label: "Plain list", status: [], groupBy: null, hiddenColumns: ["tags", "source", "modelLabel", "courses"] },
]

// ---------------------------------------------------------------------------------------------------------------------
// Links (lab routes; the real app maps these to linkTo)

/**
 * The next skill to configure after `afterId`: the first Not configured, active row in library order (the order the library's
 * "Configure next" banner works through), never the skill just saved. Null when every skill is configured.
 */
export function nextToConfigure(rows: readonly LibraryRow[], afterId: string): LibraryRow | null {
  return rows.find((r) => r.status === "active" && r.configuration === "not-configured" && r.id !== afterId) ?? null
}

/** One skill is edited in its panel (map D1a, D-L91). */
export const configureHref = (id: string): string => `${LAB_ADMIN}/skills-library?skill=${encodeURIComponent(id)}`
/** `by=skill`: a flow with a skill-first mapping step (course mapping B) lands there; elsewhere the skill is the selected record. */
export const mappingHref = (id: string): string => `${LAB_ADMIN}/course-mapping?skill=${encodeURIComponent(id)}&by=skill`
export const evidenceHref = (id: string): string => `${LAB_ADMIN}/attainment?skill=${encodeURIComponent(id)}`
export const importHref = `${LAB_ADMIN}/import-ai-review`
export const starterHref = `${LAB_ADMIN}/starter-library`
export const newListHref = `${LAB_ADMIN}/lists-cohorts`

// ---------------------------------------------------------------------------------------------------------------------
// Add a skill: draft, validation

/**
 * What adding a skill asks for. In the UI the program's top level ("section" in the HGTC file) is called Category
 * (glossary: category is the REQ word; the split between category and section is open, see build-notes-b3).
 * There is no evaluation model here: configure owns it and no model is ever preselected (REQ SC-01, SC-02). `model` stays
 * on the type, always null from the add forms, so a copied configuration can still fill it.
 */
export interface SkillDraft {
  name: string
  /** Optional [REQ SL-02]. */
  description: string
  /** Shown as "Category". Optional (REQ SL-03). */
  section: string
  group: string
  category: string
  tags: string[]
  model: EvalModel | null
  mandatoryDefault: "mandatory" | "non-mandatory" | null
}

export const EMPTY_DRAFT: SkillDraft = { name: "", description: "", section: "", group: "", category: "", tags: [], model: null, mandatoryDefault: null }

export type DraftErrors = Partial<Record<"name" | "section", string>>

export const normName = (s: string): string => s.trim().replace(/\s+/g, " ").toLowerCase()

export const MAX_NAME = 120

/**
 * Where the skills being added live, for the duplicate wording: the hub Library says "library"; inside Set up skills the step
 * builds the new program's list, so it says "list" (the wizard never says "library").
 */
export type ListPlace = "library" | "list"

/** Inline errors: `{What failed}. {What to do}.` (strategy/02). Duplicate names are checked case and space insensitive. */
export function validateDraft(d: SkillDraft, existingNames: readonly string[], place: ListPlace = "library"): DraftErrors {
  const e: DraftErrors = {}
  const name = d.name.trim().replace(/\s+/g, " ")
  if (!name) e.name = "Enter a name."
  else if (name.length > MAX_NAME) e.name = `Name is too long. Use ${MAX_NAME} characters or fewer.`
  else {
    const same = existingNames.find((n) => normName(n) === normName(name))
    if (same) e.name = `${same} is already in the ${place}.`
  }
  return e
}

/** The library row a typed name repeats, so the error can offer "Open it". */
export function findDuplicate(name: string, rows: readonly Pick<LibraryRow, "id" | "name">[]): Pick<LibraryRow, "id" | "name"> | null {
  const n = normName(name)
  return n ? rows.find((r) => normName(r.name) === n) ?? null : null
}

export const isDirty = (d: SkillDraft): boolean => JSON.stringify(d) !== JSON.stringify(EMPTY_DRAFT)

export function draftToSkill(d: SkillDraft, id: string): AddedSkill {
  return {
    id,
    name: d.name.trim().replace(/\s+/g, " "),
    ...(d.description.trim() ? { description: d.description.trim() } : {}),
    section: d.section.trim(),
    group: d.group.trim(),
    // The picked Category (the shared vocabulary's word) is the skill's category; a skill added by hand also sits under it in
    // the library tree, so section follows when no file section was given.
    category: (d.category.trim() || d.section.trim()),
    tags: mergeTags([], d.tags),
    model: d.model,
    mandatoryDefault: d.mandatoryDefault,
  }
}

/**
 * Writes skills added by hand (the sheet, the inline row, add several) to the SHARED store, so every count moves with them. Nothing is asked
 * about evaluation [REQ SC-01]. Once the program has saved its settings a new skill is on the default configuration at once (D-L72, D0 rule 3);
 * before that, or when the program's model needs questions it does not have, it is Not configured [REQ IM-09]. A blank category is stored as
 * "No category" (category is optional, REQ SL-03). It joins no live list on its own (map C3).
 */
export function addSkillsToStore(s: V2State, added: readonly AddedSkill[], actorId: string, at: string, batch?: Pick<ImportBatch, "id" | "kind" | "label">): V2State {
  if (!added.length) return s
  const specialty = s.skills[0]?.specialty ?? "bsn-med-surg"
  const program = programRuleIn(s)
  const inherited = program ? resolveRule(program, null) : null
  const usable = !!inherited && validateRule(inherited).length === 0
  const skills: Skill[] = added.map((a) => ({
    id: a.id,
    specialty,
    name: a.name,
    category: a.category.trim() || NO_CATEGORY,
    model: inherited ? inherited.model : null,
    configured: usable,
    published: usable,
    config: inherited ? toSkillConfig(null, inherited) : null,
    addedByHand: true,
    ...(batch ? { batchId: batch.id } : {}),
    ...(a.description ? { description: a.description } : {}),
    tags: [...a.tags],
  }))
  const label = skills.length === 1 ? skills[0]!.name : `${skills.length} ${skillNounPlural()}`
  const batches = batch ? [...s.batches, { ...batch, at, actorId, skillIds: skills.map((k) => k.id) }] : s.batches
  return appendAudit({ ...s, batches, skills: [...s.skills, ...skills] }, actorId, skills.length === 1 ? `Added ${skillNoun()}` : `Added ${skillNounPlural()}`, label, at)
}

/** One wording for what a new skill gets, on the Add several summary and on the result banner: the words that will really apply. */
export function configurationWords(count: number, configuration: "default" | "not-configured"): string {
  if (configuration === "not-configured") return "Not configured."
  return `${count === 1 ? "Uses" : "They use"} the default configuration.`
}

// ---------------------------------------------------------------------------------------------------------------------
// Add several (add a skill, variant C): a pasted or typed list of names becomes skills that are not configured.

export interface PastedLine {
  /** 1-based line number in the pasted text. */
  line: number
  name: string
  /**
   * ready: will be added; in-library: repeats a skill already in the library; in-paste: repeats an earlier line; too-long;
   * not-read: has no letter or digit to name a skill by ("---", "•") [REQ IM-08].
   */
  kind: "ready" | "in-library" | "in-paste" | "too-long" | "not-read"
  /** The line exactly as pasted, so a line that is not added can be listed with its original text [REQ IM-08]. */
  raw: string
  /** Other cells on a line pasted from a sheet. Never read as anything [REQ IM-03], and reported with their text [REQ IM-08]. */
  extra?: string[]
  /** Why a line with text was not read, when it is more than having no letter or digit: a column heading, or only a number [INFER]. */
  notRead?: "heading" | "number" | "short"
}

/** One name to add (add several). Category and tags come from the "for all" fields; a description from Review each line. */
export interface SeveralItem {
  name: string
  description?: string
  category?: string
  tags?: string[]
  /** The library skill this line replaces, kept with its id, settings and course mapping [REQ IM-06]. Only what this line supplies changes. */
  replaces?: string
  /** The pasted name this item came from, when it differs or replaces (keep both, replace), so its line's description follows. */
  source?: string
  /** The pasted line a keep both or replace came from, so that line can show the name it will produce. */
  line?: number
}

/** What to do with a pasted name already in the library [REQ IM-06]: the program decides; skip is the starting choice. */
export type DuplicateChoice = "skip" | "keep-both" | "replace"

/**
 * The one duplicate rule, for Add a skill and Add several. Replace is offered whenever the library skill has no evidence; with evidence it
 * is not offered, because what a re-import may do to evidence is still open (OD-13) [REQ IM-06]. Two library skills sharing the name leave
 * nothing to say which is meant, so they offer no Replace either [INFER]. A line repeating an earlier line has no library skill to replace.
 */
export function duplicateChoices(twin: { evidence: number; several?: boolean } | undefined): DuplicateChoice[] {
  return twin && !twin.several && twin.evidence === 0 ? ["skip", "replace", "keep-both"] : ["skip", "keep-both"]
}

/** Library skills by normalised name. A name held by more than one is marked `several` and counts the evidence of them all. */
export function libraryTwins<T extends { name: string; evidence: number }>(rows: readonly T[]): Map<string, T & { several?: boolean }> {
  const out = new Map<string, T & { several?: boolean }>()
  for (const r of rows) {
    const k = normName(r.name)
    const seen = out.get(k)
    out.set(k, seen ? { ...seen, evidence: seen.evidence + r.evidence, several: true } : r)
  }
  return out
}

/**
 * What a repeated line does until the program chooses. A name already in the library stays as it is, so nothing is duplicated or changed
 * unasked. A line repeated inside the paste is added under its "(2)" name and flagged, as the map's line check counts it [INFER].
 */
export const defaultDuplicateChoice = (kind: PastedLine["kind"]): DuplicateChoice => (kind === "in-paste" ? "keep-both" : "skip")

/** "Keep both" needs two names: the pasted one gets the first free "(2)", "(3)" … suffix. */
export function keepBothSeveralName(name: string, taken: readonly string[]): string {
  const used = new Set(taken.map(normName))
  for (let k = 2; k < 100; k++) {
    const next = `${name} (${k})`
    if (!used.has(normName(next))) return next
  }
  return `${name} (copy)`
}

/** Rewrites one pasted line's name (per-line edit, REQ IM-05); its other cells stay. `null` leaves the line out. */
export function editPastedLine(text: string, line: number, name: string | null): string {
  const lines = text.split(/\r?\n/)
  const i = line - 1
  if (i < 0 || i >= lines.length) return text
  if (name === null) {
    lines.splice(i, 1)
    return lines.join("\n")
  }
  const cells = lines[i]!.split("\t")
  cells[0] = name
  lines[i] = cells.join("\t")
  return lines.join("\n")
}

/**
 * The items add several creates, with the program's choice for each repeated line applied [REQ IM-06]: skipped lines add nothing, keep both
 * adds the line under a "(2)" name, replace updates the library skill in place.
 */
export function severalItemsWithChoices(parsed: { lines: PastedLine[]; items: SeveralItem[] }, rows: readonly Pick<LibraryRow, "id" | "name" | "evidence">[], choices: Record<string, DuplicateChoice>): SeveralItem[] {
  const twins = libraryTwins(rows)
  const taken = [...rows.map((r) => r.name), ...parsed.items.map((i) => i.name)]
  const out: SeveralItem[] = [...parsed.items]
  const replaced = new Set<string>()
  for (const l of parsed.lines) {
    if (l.kind !== "in-library" && l.kind !== "in-paste") continue
    const twin = l.kind === "in-library" ? twins.get(normName(l.name)) : undefined
    const choice = choices[normName(l.name)] ?? defaultDuplicateChoice(l.kind)
    if (choice === "skip" || !duplicateChoices(twin).includes(choice)) continue
    if (choice === "replace") {
      if (twin && !replaced.has(twin.id)) { replaced.add(twin.id); out.push({ name: l.name, replaces: twin.id, source: l.name, line: l.line }) }
      continue
    }
    const name = keepBothSeveralName(l.name, taken)
    taken.push(name)
    out.push({ name, source: l.name, line: l.line })
  }
  return out
}

/** Strips bullets, numbering and tabs a spreadsheet or email adds ("1. ", "- ", "* ", "•"). */
const cleanLine = (raw: string): string => raw.replace(/\t+/g, " ").replace(/^\s*(?:[-*•]+|\(?\d{1,3}[.)])\s+/, "").trim().replace(/\s+/g, " ")

/** A spreadsheet wraps some cells in quotation marks and doubles any inside them: "Foley ""two way"" care" is the name Foley "two way" care. */
const unquote = (cell: string): string => {
  const m = /^"(.*)"$|^\u201c(.*)\u201d$|^'(.*)'$/su.exec(cell)
  if (!m) return cell
  return (m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2] ?? m[3] ?? "").trim().replace(/\s+/g, " ")
}

/** A name needs a letter or a digit; a line of only symbols ("---", "•") is listed as not read [REQ IM-08]. */
const readable = (name: string): boolean => /[\p{L}\p{N}]/u.test(name)

/** A first line that names the column rather than a skill ("Name", "Skills:"), from a spreadsheet's header row [INFER]. */
const HEADING_WORDS = ["name", "names", "skill", "skills", "skill name", "skill names", "skill title", "skills list", "skill list", "list of skills", "title", "competency", "competencies", "procedure", "procedures", "task", "tasks"]
const isHeading = (name: string): boolean => {
  const n = normName(name).replace(/[:*#.]+$/, "")
  const noun = normName(skillNoun())
  return HEADING_WORDS.includes(n) || n === noun || n === normName(skillNounPlural()) || n === `${noun} name`
}
/** A line of only digits ("12", "(3)", "4.") is a row number or a stray total, never a skill [INFER]. */
const onlyNumber = (name: string): boolean => /^\(?\d+[.)]?$/.test(name)

/** The reason a line stays in the box [REQ IM-08], in words the program can act on. */
export function notReadReason(l: Pick<PastedLine, "kind" | "notRead">): string {
  if (l.kind === "too-long") return `longer than ${MAX_NAME} characters`
  if (l.notRead === "heading") return "looks like a column heading"
  if (l.notRead === "number") return "only a number"
  if (l.notRead === "short") return "only one character"
  return "could not be read"
}

/** Splits a tags cell ("Infection prevention; Invasive procedures") into distinct tags, first spelling kept. */
export function splitTags(cell: string): string[] {
  return mergeTags([], cell.split(/[;,]/))
}

/** Adds tags to a list once each, case and space insensitive, keeping the first spelling and the order. */
export function mergeTags(base: readonly string[], more: readonly string[]): string[] {
  const out = [...base]
  for (const raw of more) {
    const t = raw.trim().replace(/\s+/g, " ")
    if (t && !out.some((x) => normName(x) === normName(t))) out.push(t)
  }
  return out
}

/**
 * Reads pasted names. Only the first cell of a line is the name [REQ IM-03]: no column has a fixed meaning, so a sheet cannot create a category
 * or a tag by accident [REQ IM-13]. Other cells are kept on the line as `extra` and reported, never read as anything [REQ IM-08].
 */
export function parseSeveral(text: string, existingNames: readonly string[]): { lines: PastedLine[]; ready: string[]; items: SeveralItem[] } {
  const known = new Set(existingNames.map(normName))
  const seen = new Set<string>()
  const lines: PastedLine[] = []
  text.split(/\r?\n/).forEach((raw, i) => {
    // Leading tabs and spaces are indentation (an outline copied from a document), not an empty first cell: before this, a line
    // starting with a tab read its empty first cell as the name and was dropped without a word.
    const [first = "", ...rest] = raw.replace(/^[\t ]+/, "").split("\t")
    const name = unquote(cleanLine(first))
    if (!name) {
      // Blank lines are ignored; a line with text but no name cell is listed as not read, with its text.
      if (raw.trim()) lines.push({ line: i + 1, name: raw.trim(), kind: "not-read", raw })
      return
    }
    const n = normName(name)
    // Only the first line can be a heading: further down, "Skills" could be what the program calls one.
    const notRead: PastedLine["notRead"] = lines.length === 0 && isHeading(name) ? "heading" : onlyNumber(name) ? "number" : readable(name) && [...name].length === 1 ? "short" : undefined
    const kind: PastedLine["kind"] = notRead || !readable(name) ? "not-read" : name.length > MAX_NAME ? "too-long" : known.has(n) ? "in-library" : seen.has(n) ? "in-paste" : "ready"
    if (kind !== "not-read" && kind !== "too-long") seen.add(n)
    const extra = rest.map((c) => c.trim().replace(/\s+/g, " ")).filter(Boolean)
    lines.push({ line: i + 1, name, kind, raw, ...(notRead ? { notRead } : {}), ...(extra.length ? { extra } : {}) })
  })
  const ready = lines.filter((l) => l.kind === "ready")
  return { lines, ready: ready.map((l) => l.name), items: ready.map((l) => ({ name: l.name })) }
}

/**
 * The drafts add several creates: the category and tags chosen for all, and a description typed on the line. An item's own category or tags
 * win or merge (a caller outside the paste box may hand them over). Never a model (REQ SC-02).
 */
export function severalDrafts(items: readonly SeveralItem[], defaults: { category: string; tags: readonly string[] }): SkillDraft[] {
  return items.map((it) => ({ ...EMPTY_DRAFT, name: it.name, description: it.description ?? "", section: it.category?.trim() || defaults.category.trim(), tags: mergeTags(defaults.tags, it.tags ?? []) }))
}

// ---------------------------------------------------------------------------------------------------------------------
// Category and tag filter (REQ SL-10: searchable and filterable by name, category, tag and status). One category and one
// tag at a time, like the report filters (lib/v2/reports.ts), so a filter reads as one sentence.

export interface LibraryFilter {
  /** A category name, or NO_CATEGORY for skills without one. */
  cat: string | null
  tag: string | null
  /** One Configuration value (map D1: its own filter, not a tab). */
  config?: Configuration | null
  /** Only skills whose Times needed is not the program's number. */
  different?: boolean
  /** Only the skills of one add several (Show them) [REQ IM-11]. */
  added?: string | null
  /** Came from: where the skill entered the library (map D1) [REQ IM-11]. */
  from?: string | null
  /** Only skills on no skill list (map D1). */
  noList?: boolean
}

export function filterLibrary(rows: readonly LibraryRow[], f: LibraryFilter): LibraryRow[] {
  return rows.filter((r) => (!f.cat || r.section === f.cat) && (!f.tag || r.tags.some((t) => normName(t) === normName(f.tag!))) && (!f.config || r.configuration === f.config) && (!f.different || r.timesDiffer) && (!f.added || r.batchId === f.added) && (!f.from || r.source === f.from) && (!f.noList || !r.onLists))
}

/** The library as a CSV, for header More, Export (map D1): one row per skill, in the words the table uses. */
export function libraryCsv(rows: readonly LibraryRow[], timesOf: (id: string) => number | null): string {
  const cell = (v: string | number | null) => {
    const t = v === null ? "" : String(v)
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const head = ["Name", "Description", "Category", "Tags", "Times needed", "Configuration", "Status", "Came from"]
  const body = rows.map((r) => [r.name, r.description, r.section === NO_CATEGORY ? "" : r.section, r.tags.join("; "), timesOf(r.id), CONFIGURATION_META[r.configuration].label, STATUS_META[r.status].label, r.source].map(cell).join(","))
  return [head.join(","), ...body].join("\n")
}

/** Categories (with "No category" last when any skill has none) and tags, with how many skills carry each. */
export function filterOptions(rows: readonly LibraryRow[]): { categories: Array<{ name: string; count: number }>; tags: Array<{ name: string; count: number }>; sources: Array<{ name: string; count: number }> } {
  const cats = new Map<string, number>()
  const tags = new Map<string, number>()
  const sources = new Map<string, number>()
  for (const r of rows) {
    cats.set(r.section, (cats.get(r.section) ?? 0) + 1)
    sources.set(r.source, (sources.get(r.source) ?? 0) + 1)
    for (const t of r.tags) tags.set(t, (tags.get(t) ?? 0) + 1)
  }
  const sorted = (m: Map<string, number>) => [...m].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
  const categories = sorted(cats)
  const none = categories.findIndex((c) => c.name === NO_CATEGORY)
  if (none >= 0) categories.push(...categories.splice(none, 1))
  return { categories, tags: sorted(tags), sources: sorted(sources) }
}

/**
 * The Category and Tags picker options for every Add a skill path and the edit sheet, from the ONE shared vocabulary that
 * Settings edits (lib/v2/vocabulary.ts) [REQ SL-03 to SL-06]. Only active entries are offered for new assignment; the inactive
 * names are returned so a skill that already carries one can show it marked "Inactive" (SL-06).
 */
export function vocabPickerOptions(state: V2State): { categories: string[]; tags: string[]; inactiveCategories: string[]; inactiveTags: string[] } {
  const v = getVocabulary(state)
  return {
    categories: activeNames(state, "categories"),
    tags: activeNames(state, "tags"),
    inactiveCategories: v.categories.filter((e) => !e.active).map((e) => e.name),
    inactiveTags: v.tags.filter((e) => !e.active).map((e) => e.name),
  }
}

/** Options for the section, group, category and tag pickers, from the live library. */
export function pickerOptions(rows: readonly LibraryRow[]) {
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const groupsBySection: Record<string, string[]> = {}
  for (const r of rows) if (r.group) groupsBySection[r.section] = uniq([...(groupsBySection[r.section] ?? []), r.group])
  return {
    sections: uniq(rows.map((r) => r.section).filter((s) => s !== NO_CATEGORY)),
    groupsBySection,
    categories: uniq(rows.map((r) => r.category)),
    tags: mergeTags([], rows.flatMap((r) => r.tags)).sort((a, b) => a.localeCompare(b)),
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Set up skills step 1, list variant (D-L46, Proposed): the paste check, possible duplicates, and the store writes the list's
// inline edits and Undo need. Exact matches only, ignoring case and spaces (normName); no fuzzy matching (Romit 2026-11-04).

/** The one line a multi-line paste shows: new, repeated (in the paste or already in the list) and not read [REQ IM-06, IM-08, IM-13]. */
export interface PasteSummary {
  /** Names that are new to the list. */
  fresh: number
  /** Names that repeat an earlier line or a skill already in the list: added too, flagged as possible duplicates. */
  repeated: number
  /** Lines that cannot be a skill name (too long, or no letter or digit), with their original text. */
  notRead: PastedLine[]
  /** What "Add n skills" adds: every line that was read, new or repeated. */
  toAdd: SeveralItem[]
}

export function pasteSummary(text: string, existingNames: readonly string[]): PasteSummary {
  const { lines } = parseSeveral(text, existingNames)
  const read = lines.filter((l) => l.kind === "ready" || l.kind === "in-paste" || l.kind === "in-library")
  return {
    fresh: lines.filter((l) => l.kind === "ready").length,
    repeated: lines.filter((l) => l.kind === "in-paste" || l.kind === "in-library").length,
    notRead: lines.filter((l) => l.kind === "not-read" || l.kind === "too-long"),
    toAdd: read.map((l) => ({ name: l.name })),
  }
}

/**
 * Rows that share a name (case and spaces ignored), as groups of ids in list order (oldest first). Shared by the list step's
 * "Possible duplicate" flag and filter; the add several sheet reads the same `normName`.
 */
export function duplicateGroups(rows: readonly Pick<LibraryRow, "id" | "name">[]): string[][] {
  const by = new Map<string, string[]>()
  for (const r of rows) {
    const k = normName(r.name)
    if (!k) continue
    by.set(k, [...(by.get(k) ?? []), r.id])
  }
  return [...by.values()].filter((g) => g.length > 1)
}

/** The rows flagged "Possible duplicate": every member of a group after the first, unless the program chose Keep both for it. */
export function possibleDuplicates(rows: readonly Pick<LibraryRow, "id" | "name">[], kept: readonly string[] = []): Set<string> {
  const keep = new Set(kept)
  return new Set(duplicateGroups(rows).flatMap((g) => g.slice(1)).filter((id) => !keep.has(id)))
}

/** Name, category, tags or description of skills in the store, edited where they sit in the list (no overlay: they persist). */
export interface SkillDetailsPatch {
  name?: string
  category?: string
  tags?: string[]
  description?: string
}

export function setSkillDetailsInStore(s: V2State, ids: readonly string[], patch: SkillDetailsPatch, actorId: string, at: string): V2State {
  const set = new Set(ids)
  const name = patch.name?.trim().replace(/\s+/g, " ")
  if (patch.name !== undefined && !name) return s
  let changed = 0
  const skills = s.skills.map((k) => {
    if (!set.has(k.id)) return k
    changed += 1
    return {
      ...k,
      ...(name ? { name } : {}),
      ...(patch.category !== undefined ? { category: patch.category.trim() || NO_CATEGORY } : {}),
      ...(patch.tags !== undefined ? { tags: mergeTags([], patch.tags) } : {}),
      ...(patch.description !== undefined ? { description: patch.description.trim() || undefined } : {}),
    }
  })
  if (!changed) return s
  const label = changed === 1 ? skills.find((k) => set.has(k.id))!.name : `${changed} ${skillNounPlural()}`
  return appendAudit({ ...s, skills }, actorId, `Edited ${changed === 1 ? skillNoun() : skillNounPlural()}`, label, at)
}

/** What a removal took out of the store, with each skill's place, so Undo puts it back where it was. */
export interface Removal {
  skills: Array<{ skill: Skill; index: number }>
}

/** Takes skills out of the list (nothing is tracked against a skill in a new program, D-X15) and returns what Undo needs. */
export function removeSkillsFromStore(s: V2State, ids: readonly string[], actorId: string, at: string): { state: V2State; removal: Removal } {
  const set = new Set(ids)
  const taken = s.skills.map((skill, index) => ({ skill, index })).filter((e) => set.has(e.skill.id))
  if (!taken.length) return { state: s, removal: { skills: [] } }
  const label = taken.length === 1 ? taken[0]!.skill.name : `${taken.length} ${skillNounPlural()}`
  const next: V2State = { ...s, skills: s.skills.filter((k) => !set.has(k.id)), mappings: s.mappings.filter((m) => !set.has(m.skillId)) }
  return { state: appendAudit(next, actorId, taken.length === 1 ? `Removed ${skillNoun()}` : `Removed ${skillNounPlural()}`, label, at), removal: { skills: taken } }
}

/** Undo: the removed skills go back at their old places, with their name, category, tags and description. */
export function restoreSkillsToStore(s: V2State, removal: Removal, actorId: string, at: string): V2State {
  if (!removal.skills.length) return s
  const present = new Set(s.skills.map((k) => k.id))
  const skills = [...s.skills]
  for (const e of [...removal.skills].sort((a, b) => a.index - b.index)) {
    if (present.has(e.skill.id)) continue
    skills.splice(Math.min(e.index, skills.length), 0, e.skill)
  }
  return appendAudit({ ...s, skills }, actorId, "Undid a removal", removal.skills.length === 1 ? removal.skills[0]!.skill.name : `${removal.skills.length} ${skillNounPlural()}`, at)
}
