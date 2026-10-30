import HGTC_JSON from "@/lib/v2/hgtc-library.json"
// One name per model on every screen: the Configure step names (decision D-X31 wording sweep), not the v2 labels.
import { LAB_MODEL_LABEL as MODEL_LABEL } from "./configure"
import { evalsOfSkill } from "@/lib/v2/evidence-index"
import { allCourses, courseLabel, trackedAgainst } from "@/lib/v2/admin-actions"
import { isConfigured } from "@/lib/v2/population"
import { skillNoun, skillNounPlural } from "./terms"
import type { EvalModel, Skill, V2State } from "@/lib/v2/types"
import { activeNames, getVocabulary } from "@/lib/v2/vocabulary"
import { appendAudit } from "@/lib/v2/store"

/**
 * Skills library model for the design lab (admin "Skills library" and "Add a skill" screens).
 * Pure functions over the shared v2 store plus a lab-local overlay for skills added by hand in this tab (and their edits).
 * Deactivate, reactivate and delete of library skills are written to the shared store (lib/v2/admin-actions.ts
 * setSkillsActive, deleteSkill) so every report figure changes with them (decisions D-X14, D-X15).
 *
 * Sources: REQ SL-01..11, IM-09..14, SC-01..02, CM-03..05. Strategy/03 section 5.3 (configuration states) and
 * section 9 (deactivate vs delete vs new list). Labels in STATUS_META are the only place status words live.
 */

export const LAB_ADMIN = "/lab/admin"

// ---------------------------------------------------------------------------------------------------------------------
// Status

/**
 * Three library states, the requirement's own (decision D-X31): Not configured [REQ IM-09, IM-10], Configured [REQ SC-01] and
 * Inactive [REQ SL-02, SL-11]. There is no "published" stage in REQ; a configuration saved for use is Configured and can be
 * mapped. A configuration saved part way ("Save draft") keeps the skill Not configured, with `draft` set so the row says so.
 * The lab brief asked for "Retired"; REQ SL-02 and strategy/03 5.3 say "Inactive", so the label is Inactive here.
 * Swap the label in one place if Romit prefers Retired.
 * Tones (docs/knowledge/design/visual-language.md): only "Not configured" carries a hue (amber), because it is the one state
 * the coordinator must act on; the other three are neutral and differ by glyph and word, so a page holds one state colour.
 */
export type LibraryStatus = "not-configured" | "configured" | "inactive"

export type StatusTone = "warning" | "info" | "success" | "neutral"

export const STATUS_ORDER: LibraryStatus[] = ["not-configured", "configured", "inactive"]

export const STATUS_META: Record<LibraryStatus, { label: string; tone: StatusTone; icon: string; short: string }> = {
  "not-configured": { label: "Not configured", short: "Not configured", tone: "warning", icon: "fa-triangle-exclamation" },
  configured: { label: "Configured", short: "Configured", tone: "neutral", icon: "fa-circle-check" },
  inactive: { label: "Inactive", short: "Inactive", tone: "neutral", icon: "fa-circle-minus" },
}

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
  status: LibraryStatus
  statusLabel: string
  /** Not configured, with a configuration saved part way (or a rule held but never saved for use): the row says "Draft saved". */
  draft: boolean
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
  /** On the program list's required-before-graduation set (glossary "Required to graduate"; seed: hgtc.required). */
  requiredToGraduate: boolean
  /** Added in this lab session. */
  isNew: boolean
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
  /** Skills added by hand in this session marked "Required to graduate" (a lab flag; the store has no field for it yet). */
  required?: string[]
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
  requiredToGraduate?: boolean
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

export function sectionOf(k: Pick<Skill, "category" | "hgtc">): string {
  const h = k.hgtc ? HGTC_BY_ID.get(k.hgtc.id) : undefined
  return h?.section ?? k.category ?? "No section"
}

export function groupOf(k: Pick<Skill, "hgtc">): string {
  const h = k.hgtc ? HGTC_BY_ID.get(k.hgtc.id) : undefined
  return h?.group ?? k.hgtc?.group ?? ""
}

function statusOf(k: Pick<Skill, "configured" | "published">, inactive: boolean): LibraryStatus {
  if (inactive) return "inactive"
  return isConfigured(k) ? "configured" : "not-configured"
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
    if (m.level === "not-expected") continue
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
      const status = statusOf(k, inactive.has(k.id))
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
        statusLabel: STATUS_META[status].short,
        draft: status === "not-configured" && (cm !== undefined || !!state.configDrafts?.[k.id] || (k.configured && !!k.config)),
        model: k.model,
        modelLabel: k.model ? MODEL_LABEL[k.model] : "",
        courses,
        mandatoryCourses: c?.mandatory.size ?? 0,
        evidence,
        source: k.batchId ? batchLabel.get(k.batchId) ?? "Import" : "Program list",
        canDelete: trackedAgainst(state, k.id).total === 0,
        unmapFrom: [...(c?.all ?? [])].map((id) => courseName.get(id) ?? id).sort(),
        requiredToGraduate: !!k.hgtc?.required || !!overlay.required?.includes(k.id),
        isNew: !!overlay.fresh?.includes(k.id),
      }
      return { ...base, ...vocabMarks(base) }
    })
  const added: LibraryRow[] = overlay.added
    .filter((a) => !deleted.has(a.id))
    .map((a0) => {
      const a = { ...a0, ...overlay.edits[a0.id] }
      const cm = copied(a.id)
      const model = cm !== undefined ? cm : a.model
      const status: LibraryStatus = inactive.has(a.id) ? "inactive" : "not-configured"
      const base = {
        id: a.id,
        name: a.name,
        description: a.description ?? "",
        section: a.section || NO_CATEGORY,
        group: a.group,
        category: a.category,
        tags: a.tags,
        status,
        statusLabel: STATUS_META[status].short,
        draft: status === "not-configured" && (cm !== undefined || !!state.configDrafts?.[a.id]),
        model,
        modelLabel: model ? MODEL_LABEL[model] : "",
        courses: 0,
        mandatoryCourses: 0,
        evidence: 0,
        source: "Added by hand",
        canDelete: true,
        unmapFrom: [],
        requiredToGraduate: !!a.requiredToGraduate,
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
  notConfigured: number
  configured: number
  inactive: number
  /** Configured (ready to map), excluding inactive. Same as `configured`; kept for the roll-up label. */
  ready: number
}

export function countLibrary(rows: readonly LibraryRow[]): LibraryCounts {
  const by = (s: LibraryStatus) => rows.filter((r) => r.status === s).length
  const configured = by("configured")
  return { total: rows.length, notConfigured: by("not-configured"), configured, inactive: by("inactive"), ready: configured }
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

export function byStatus(rows: readonly LibraryRow[]): Record<LibraryStatus, LibraryRow[]> {
  const out: Record<LibraryStatus, LibraryRow[]> = { "not-configured": [], configured: [], inactive: [] }
  for (const r of rows) out[r.status].push(r)
  return out
}

// ---------------------------------------------------------------------------------------------------------------------
// Status tabs (list template T1: the tabs carry the counts; there is no KPI strip). Counts come from countLibrary over the
// same rows the table shows, and tests/lab/library.test.ts ties them to lib/v2/facts.ts (skillsNotConfigured, skillsInactive).

export type LibraryTab = "all" | LibraryStatus

export const LIBRARY_TABS: Array<{ value: LibraryTab; label: string }> = [
  { value: "all", label: "All" },
  ...STATUS_ORDER.map((s) => ({ value: s as LibraryTab, label: STATUS_META[s].short })),
]

export const isLibraryTab = (v: string | null | undefined): v is LibraryTab => LIBRARY_TABS.some((t) => t.value === v)

export function tabCount(c: LibraryCounts, tab: LibraryTab): number {
  switch (tab) {
    case "all": return c.total
    case "not-configured": return c.notConfigured
    case "configured": return c.configured
    case "inactive": return c.inactive
  }
}

export const rowsForTab = (rows: readonly LibraryRow[], tab: LibraryTab): LibraryRow[] => (tab === "all" ? [...rows] : rows.filter((r) => r.status === tab))

// ---------------------------------------------------------------------------------------------------------------------
// Saved views (variant A). Kept small: a view is a layout (grouping and columns), never a status filter, because the
// status tabs already filter by status (say it once). Coordinators can save their own on top of these two.

export interface SavedView {
  id: string
  label: string
  /** Kept for views saved before the tabs existed; ignored (the tabs own status). */
  status: LibraryStatus[]
  groupBy: string | null
  hiddenColumns: string[]
}

export const SAVED_VIEWS: SavedView[] = [
  { id: "by-category", label: "By category", status: [], groupBy: "section", hiddenColumns: ["section", "tags", "source"] },
  { id: "flat", label: "One list", status: [], groupBy: null, hiddenColumns: ["tags", "source"] },
]

// ---------------------------------------------------------------------------------------------------------------------
// Links (lab routes; the real app maps these to linkTo)

/**
 * The next skill to configure after `afterId`: the first Not configured, active row in library order (the order the library's
 * "Configure next" banner works through), never the skill just saved. Null when every skill is configured.
 */
export function nextToConfigure(rows: readonly LibraryRow[], afterId: string): LibraryRow | null {
  return rows.find((r) => r.status === "not-configured" && r.id !== afterId) ?? null
}

export const configureHref = (id: string): string => `${LAB_ADMIN}/configure-skill?skill=${encodeURIComponent(id)}`
export const mappingHref = (id: string): string => `${LAB_ADMIN}/course-mapping?skill=${encodeURIComponent(id)}`
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
  requiredToGraduate: boolean
}

export const EMPTY_DRAFT: SkillDraft = { name: "", description: "", section: "", group: "", category: "", tags: [], model: null, mandatoryDefault: null, requiredToGraduate: false }

export type DraftErrors = Partial<Record<"name" | "section", string>>

export const normName = (s: string): string => s.trim().replace(/\s+/g, " ").toLowerCase()

export const MAX_NAME = 120

/** Inline errors: `{What failed}. {What to do}.` (strategy/02). Duplicate names are checked case and space insensitive. */
export function validateDraft(d: SkillDraft, existingNames: readonly string[]): DraftErrors {
  const e: DraftErrors = {}
  const name = d.name.trim().replace(/\s+/g, " ")
  if (!name) e.name = "Enter a name."
  else if (name.length > MAX_NAME) e.name = `Name is too long. Use ${MAX_NAME} characters or fewer.`
  else {
    const same = existingNames.find((n) => normName(n) === normName(name))
    if (same) e.name = `${same} is already in the library.`
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
    requiredToGraduate: d.requiredToGraduate,
  }
}

/**
 * Writes skills added by hand (the sheet, the inline row, add several) to the SHARED store, Not configured, no model
 * [REQ IM-09, IM-12, SC-01, SC-02], so "Save and configure" opens Configure on the new skill and every count (Not configured,
 * library tabs) moves with it. A blank category is stored as "No category" (category is optional, REQ SL-03).
 */
export function addSkillsToStore(s: V2State, added: readonly AddedSkill[], actorId: string, at: string): V2State {
  if (!added.length) return s
  const specialty = s.skills[0]?.specialty ?? "bsn-med-surg"
  const skills: Skill[] = added.map((a) => ({
    id: a.id,
    specialty,
    name: a.name,
    category: a.category.trim() || NO_CATEGORY,
    model: null,
    configured: false,
    published: false,
    config: null,
    ...(a.description ? { description: a.description } : {}),
    tags: [...a.tags],
  }))
  const label = skills.length === 1 ? skills[0]!.name : `${skills.length} ${skillNounPlural()}`
  return appendAudit({ ...s, skills: [...s.skills, ...skills] }, actorId, skills.length === 1 ? `Added ${skillNoun()}` : `Added ${skillNounPlural()}`, label, at)
}

// ---------------------------------------------------------------------------------------------------------------------
// Add several (add a skill, variant C): a pasted or typed list of names becomes skills that are not configured.

export interface PastedLine {
  /** 1-based line number in the pasted text. */
  line: number
  name: string
  /** ready: will be added; in-library: repeats a skill already in the library; in-paste: repeats an earlier line; too-long. */
  kind: "ready" | "in-library" | "in-paste" | "too-long"
  /** Second spreadsheet column, when the line was pasted from one (Name, Category, Tags). */
  category?: string
  /** Third spreadsheet column, split on ";" or ",". */
  tags?: string[]
  /** Fourth spreadsheet column [REQ SL-02]. */
  description?: string
}

/** One name to add, with the category and tags its own line carried (add several). */
export interface SeveralItem {
  name: string
  description?: string
  category?: string
  tags?: string[]
  /** The library skill this line replaces (its name, category, tags and description), kept with its id and evidence [REQ IM-06]. */
  replaces?: string
  /** The pasted name this item came from, when it differs or replaces (keep both, replace), so its line's description follows. */
  source?: string
}

/** What to do with a pasted name already in the library [REQ IM-06]: the program decides; skip is the starting choice. */
export type DuplicateChoice = "skip" | "keep-both" | "replace"

/**
 * The choices a library twin offers. Replace only while the library skill is not configured and holds no evidence, the same
 * guard as import (a configured skill's rule and evidence are never overwritten by a pasted line).
 */
export function duplicateChoices(twin: { status: LibraryStatus; evidence: number } | undefined): DuplicateChoice[] {
  return twin && twin.status === "not-configured" && twin.evidence === 0 ? ["skip", "keep-both", "replace"] : ["skip", "keep-both"]
}

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
 * The items add several creates, with the program's choice for each library twin applied [REQ IM-06]: skipped lines add
 * nothing, keep both adds the line under a "(2)" name, replace updates the library skill in place.
 */
export function severalItemsWithChoices(parsed: { lines: PastedLine[]; items: SeveralItem[] }, rows: readonly Pick<LibraryRow, "id" | "name" | "status" | "evidence">[], choices: Record<string, DuplicateChoice>): SeveralItem[] {
  const byName = new Map(rows.map((r) => [normName(r.name), r]))
  const taken = [...rows.map((r) => r.name), ...parsed.items.map((i) => i.name)]
  const out: SeveralItem[] = [...parsed.items]
  for (const l of parsed.lines) {
    if (l.kind !== "in-library") continue
    const twin = byName.get(normName(l.name))
    const choice = choices[normName(l.name)] ?? "skip"
    if (choice === "skip" || !duplicateChoices(twin).includes(choice)) continue
    const base = { ...(l.category ? { category: l.category } : {}), ...(l.tags ? { tags: l.tags } : {}), ...(l.description ? { description: l.description } : {}) }
    if (choice === "replace" && twin) out.push({ name: twin.name, ...base, replaces: twin.id, source: l.name })
    else {
      const name = keepBothSeveralName(l.name, taken)
      taken.push(name)
      out.push({ name, ...base, source: l.name })
    }
  }
  return out
}

/** Strips bullets, numbering and tabs a spreadsheet or email adds ("1. ", "- ", "* ", "•"). */
const cleanLine = (raw: string): string => raw.replace(/\t+/g, " ").replace(/^\s*(?:[-*•]+|\(?\d{1,3}[.)])\s+/, "").trim().replace(/\s+/g, " ")

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
 * Reads pasted names. A line copied from a spreadsheet keeps its cells: the first is the name, the second the category and
 * the third the tags (REQ SL-03, SL-04, SL-05) and the fourth the description (REQ SL-02), so a sheet maps without a mapping
 * step. Plain lines are names only.
 */
export function parseSeveral(text: string, existingNames: readonly string[]): { lines: PastedLine[]; ready: string[]; items: SeveralItem[] } {
  const known = new Set(existingNames.map(normName))
  const seen = new Set<string>()
  const lines: PastedLine[] = []
  text.split(/\r?\n/).forEach((raw, i) => {
    const cells = raw.split("\t")
    const name = cleanLine(cells.length > 1 ? cells[0]! : raw)
    if (!name) return
    const n = normName(name)
    const kind: PastedLine["kind"] = name.length > MAX_NAME ? "too-long" : known.has(n) ? "in-library" : seen.has(n) ? "in-paste" : "ready"
    seen.add(n)
    const category = cells.length > 1 ? cells[1]!.trim().replace(/\s+/g, " ") : ""
    const tags = cells.length > 2 ? splitTags(cells[2]!) : []
    const description = cells.length > 3 ? cells.slice(3).join(" ").trim().replace(/\s+/g, " ") : ""
    lines.push({ line: i + 1, name, kind, ...(category ? { category } : {}), ...(tags.length ? { tags } : {}), ...(description ? { description } : {}) })
  })
  const ready = lines.filter((l) => l.kind === "ready")
  return { lines, ready: ready.map((l) => l.name), items: ready.map((l) => ({ name: l.name, ...(l.category ? { category: l.category } : {}), ...(l.tags ? { tags: l.tags } : {}), ...(l.description ? { description: l.description } : {}) })) }
}

/**
 * The drafts add several creates: a line's own category wins over the one chosen for all; tags from the line and the
 * tags chosen for all are both kept, once each. Never a model (REQ SC-02).
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
}

export function filterLibrary(rows: readonly LibraryRow[], f: LibraryFilter): LibraryRow[] {
  return rows.filter((r) => (!f.cat || r.section === f.cat) && (!f.tag || r.tags.some((t) => normName(t) === normName(f.tag!))))
}

/** Categories (with "No category" last when any skill has none) and tags, with how many skills carry each. */
export function filterOptions(rows: readonly LibraryRow[]): { categories: Array<{ name: string; count: number }>; tags: Array<{ name: string; count: number }> } {
  const cats = new Map<string, number>()
  const tags = new Map<string, number>()
  for (const r of rows) {
    cats.set(r.section, (cats.get(r.section) ?? 0) + 1)
    for (const t of r.tags) tags.set(t, (tags.get(t) ?? 0) + 1)
  }
  const sorted = (m: Map<string, number>) => [...m].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name))
  const categories = sorted(cats)
  const none = categories.findIndex((c) => c.name === NO_CATEGORY)
  if (none >= 0) categories.push(...categories.splice(none, 1))
  return { categories, tags: sorted(tags) }
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
