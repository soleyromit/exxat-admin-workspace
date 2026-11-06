"use client"

/**
 * Configure several skills on one page (variant B with ?skills=a,b,c, from the Library selection bar; D-L48, map D4, G9) [REQ IM-14]. The same
 * sections as one skill (skill-sections.tsx), one open at a time, with the page's actions in the header: Use default configuration, Preview (which holds the steps panel), Cancel, Save. No numbered steps, no footer, no Default or Custom switch.
 * Start from takes the settings package of a skill or the default as the values to begin from; each skill keeps its own number and minimums (the old Copy settings) [REQ IM-14].
 * Identical values show as normal. Where the selected skills differ the field reads Mixed and stays as each
 * skill has it unless the admin sets it; only touched fields are written (lib/lab/configure-many.ts). Nothing is preselected
 * [REQ SC-02]. Save first shows the rule change impact when a rule being written has evaluations behind it [REQ AE-02], then returns
 * to the Library with a banner. Completed evaluations are never written.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { PAGE_TITLE_TYPE_CLASS } from "@exxatdesignux/ui/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { focusTitleAfterLeaving } from "@/components/lab/shared/focus"
import { markReturn, publishShownSkill } from "@/lib/lab/configure-origin"
import { skillById } from "@/lib/v2/evidence-index"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { FormPage } from "@/components/lab/layout"
import { TYPE } from "@/components/lab/type-scale"
import { CHECKOFF_LABEL, computeImpact, fromV2, programRuleIn, validateRule, withCheckOffDecided, withModel, type Impact, type LabRule, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import { blankField, blankRule, configurableSkills, copyField, issueField, mergeRules, ownRule, planMany, saveMany, touchedFields, type BulkField } from "@/lib/lab/configure-many"
import { CONFIGURATION_META, LAB_ADMIN } from "@/lib/lab/library"
import { aNoun, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { fmt } from "@/lib/v2/format"
import { isConfigured } from "@/lib/v2/population"
import { applyDefaultConfiguration, configurationOf, defaultDraftOf, inPanelWords, modelChangeClears, panelRuleOf } from "@/lib/lab/program-settings"
import type { Skill } from "@/lib/v2/types"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { type SectionProps } from "@/components/lab/configure/fields"
import { ImpactGroups } from "./impact"
import { IssueSummary } from "./issue-summary"
import { MinimumsField, RuleNumber } from "./rule-conditions"
import { ConfigureSections, fieldOfIssue, SECTION_TITLE, sectionOfIssue, STUDENT_FIELDS_LABEL, type SectionSlot, type SkillSection } from "./skill-sections"
import { useFitToScroller, useWide } from "./settings-rows"
import { focusField } from "./use-configure"
import { ConfigurePanel, pathNodes, type PathNodeId } from "./steps-panel"
import { ImpactDialog as DefaultImpactDialog } from "@/components/lab/library/times-needed"
import { ConfigureLoading, ConfigureNotFound, useWayBack } from "./shell"
import { useFocusBack } from "./field-layer"
import { ConfigureOneSkillPage } from "./one-skill-page"

const MixedBadge = () => <Badge variant="outline" data-mixed>Mixed</Badge>

const SetForAll = ({ label, field, onOpen }: { label: string; field: BulkField; onOpen: (f: BulkField) => void }) => (
  <Button type="button" variant="outline" size="sm" aria-label={`Set ${label.toLowerCase()} for all`} onClick={() => onOpen(field)}>Set for all</Button>
)

/** A list or group the skills differ on: Mixed, until the admin chooses to set it for all. */
function MixedGate({ label, field, mixed, opened, onOpen, onKeep, children }: { label: string; field: BulkField; mixed: ReadonlySet<BulkField>; opened: ReadonlySet<BulkField>; onOpen: (f: BulkField) => void; onKeep: (f: BulkField) => void; children: React.ReactNode }) {
  if (!mixed.has(field)) return <>{children}</>
  if (!opened.has(field)) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-mixed-field={field}>
        <span className={TYPE.label}>{label}</span>
        <MixedBadge />
        <SetForAll label={label} field={field} onOpen={onOpen} />
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start gap-2" data-mixed-field={field}>
      <div className="w-full">{children}</div>
      <Button type="button" variant="ghost" size="sm" aria-label={`Keep ${label.toLowerCase()} as is`} onClick={() => onKeep(field)}>Keep as is</Button>
    </div>
  )
}

/** A switch the skills differ on: Mixed until the admin answers. A switch cannot say Mixed, so this is a Select. */
function MixedYesNo({ id, label, value, onChange }: { id: string; label: string; value: "mixed" | boolean; onChange: (v: "mixed" | boolean) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-1" data-mixed-field={id}>
      <Select value={value === "mixed" ? "mixed" : value ? "yes" : "no"} onValueChange={(v) => onChange(v === "mixed" ? "mixed" : v === "yes")}>
        <SelectTrigger id={id} className="w-28" aria-labelledby={`${id}-label`}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="mixed">Mixed</SelectItem>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
      <Label id={`${id}-label`} htmlFor={id}>{label}</Label>
    </div>
  )
}

/** The selected skills, one row each; a badge only for the exceptions (D-L97). Long selections scroll in place: a selection can be 150. */
function SkillNames({ skills, className }: { skills: ReadonlyArray<Skill>; className?: string }) {
  const state = useV2State()
  return (
    <ul className={cn("divide-y divide-border overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} tabIndex={0} aria-label={`Selected ${skillNounPlural()}`} data-many-names>
      {skills.map((k) => {
        const word = configurationOf(state, k)
        const spec = CONFIGURATION_META[word]
        return (
          <li key={k.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="min-w-0 truncate" title={k.name}>{k.name}</span>
            {word === "default" ? null : <StatusBadge label={spec.label} tone={spec.tone} icon={spec.icon} size="sm" />}
          </li>
        )
      })}
    </ul>
  )
}

/** The title says what the page does and how many; the names are always on the page (SelectedSkills). */
function ManyTitle({ skills }: { skills: ReadonlyArray<Skill> }) {
  return (
    <div className="flex min-w-0 items-center gap-3" data-skill-title>
      <h1 className={`${PAGE_TITLE_TYPE_CLASS} whitespace-nowrap`}>{`Configure ${countSkills(skills.length)}`}</h1>
    </div>
  )
}

type ImpactLine = { id: string; name: string; impact: Impact }
interface ImpactAsk { lines: ImpactLine[]; cleared: string[]; others: number }

/** Asked only when a save moves someone's progress or clears something [REQ AE-02, SC-09]: who moves, on which skill, and how many others are saved with nobody moving. Never a table of zeros. */
function ImpactDialog({ ask, onClose, saveLabel, onSave }: { ask: ImpactAsk | null; onClose: () => void; saveLabel: string; onSave: () => void }) {
  const focus = useFocusBack()
  const lines = ask?.lines ?? []
  const changing = new Set(lines.flatMap((l) => l.impact.changed.map((c) => c.studentId))).size
  return (
    <Dialog open={!!ask} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-2xl" aria-describedby={undefined} data-many-impact {...focus}>
        <DialogHeader>
          <DialogTitle>{changing ? `${fmt(changing)} ${changing === 1 ? "student's" : "students'"} progress changes` : `${saveLabel}?`}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {lines.map(({ id, name, impact }) => (
            <section key={id} className="flex flex-col gap-2" aria-label={name} data-impact-row={id}>
              <h3 className={TYPE.label}>{name}</h3>
              <ImpactGroups impact={impact} />
            </section>
          ))}
          {ask?.cleared.length ? <p className={TYPE.body} data-impact-cleared>{`Cleared: ${ask.cleared.join(", ")}.`}</p> : null}
          {ask?.others ? <p className={TYPE.helper} data-impact-others>{`${countSkills(ask.others)} also ${ask.others === 1 ? "saves" : "save"}, with no student's progress changing.`}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={onClose}>Keep editing</Button>
          <Button type="button" variant="default" size="default" onClick={onSave}>{saveLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The selection beside the sections from 1100 px (D-L5, map D4): ends inside the page's scroll area, and a long one scrolls in its own box. */
function SelectedSkills({ skills }: { skills: ReadonlyArray<Skill> }) {
  const fitted = useFitToScroller<HTMLElement>()
  return (
    <section ref={fitted} className="sticky top-4 flex min-w-0 flex-col gap-3 border-s border-border ps-6" aria-labelledby="cfg-selected-title" data-many-list>
      <h2 id="cfg-selected-title" className={TYPE.section}>{`Selected ${skillNounPlural()}`}</h2>
      <SkillNames skills={skills} className="min-h-0 flex-1 rounded-[var(--radius)] border border-border" />
    </section>
  )
}

/** Start from, a searchable list: a selection can start from any of the program's skills. Two skills can share a name, so those read with their category. */
function StartFromPicker({ value, sources, hasDefault, onChange }: { value: string; sources: ReadonlyArray<Skill>; hasDefault: boolean; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const counts = new Map<string, number>()
  for (const k of sources) counts.set(k.name, (counts.get(k.name) ?? 0) + 1)
  const labelOf = (k: Skill) => ((counts.get(k.name) ?? 0) > 1 ? `${k.name} (${k.category?.trim() || "No category"})` : k.name)
  const each = "Do not copy"
  const shown = value === "each" ? each : value === "default" ? "Default configuration" : (() => { const k = sources.find((x) => x.id === value); return k ? labelOf(k) : each })()
  const pick = (v: string) => { setOpen(false); onChange(v) }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id="cfg-start" type="button" variant="outline" size="default" role="combobox" aria-expanded={open} aria-label={`Copy settings from: ${shown}`} className="w-80 max-w-full justify-between gap-2 font-normal">
          <span className="truncate">{shown}</span>
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <Command>
          <CommandInput placeholder={`Find ${aNoun(skillNoun())}`} aria-label={`Find ${aNoun(skillNoun())}`} />
          <CommandList className="max-h-64">
            <CommandEmpty>{`No ${skillNoun()} matches.`}</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__each" keywords={[each]} onSelect={() => pick("each")}>{each}</CommandItem>
              {hasDefault ? <CommandItem value="__default" keywords={["Default configuration"]} onSelect={() => pick("default")}>Default configuration</CommandItem> : null}
              {sources.map((k) => <CommandItem key={k.id} value={`${labelOf(k)} ${k.id}`} onSelect={() => pick(k.id)}><span className="truncate">{labelOf(k)}</span></CommandItem>)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ConfigureManyPage({ ids }: { ids: string[] }) {
  const state = useV2State()
  const store = useV2Store()
  const hydrated = useV2Hydrated()
  // The way back is an address already written for the page's flow (useWayBack): no second rewrite.
  const router = useRouter()
  const params = useSearchParams()
  const back = useWayBack(ids.join(","))
  const wide = useWide()
  const previewFocus = useFocusBack()
  const key = ids.join(",")
  const skills = React.useMemo(() => (hydrated ? configurableSkills(state, ids) : []), [hydrated, state, ids])

  // The starting point is read once for this selection, so a Mixed field cannot shift while the page is open.
  const [start, setStart] = React.useState<{ key: string; merged: ReturnType<typeof mergeRules> } | null>(null)
  const [rule, setRuleState] = React.useState<LabRule>(blankRule)
  const [opened, setOpened] = React.useState<ReadonlySet<BulkField>>(new Set())
  const [showErrors, setShowErrors] = React.useState(false)
  const [impactAsk, setImpactAsk] = React.useState<ImpactAsk | null>(null)
  const [startFrom, setStartFrom] = React.useState("each")
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [askDefault, setAskDefault] = React.useState<{ students: Array<{ id: string; name: string }>; cleared: string[] } | null>(null)
  const [openSection, setOpenSection] = React.useState<SkillSection | "">("counts")

  const begin = React.useCallback(() => {
    const merged = mergeRules(skills.map((k) => ownRule(state, k)))
    setStart({ key, merged })
    setRuleState(merged.base)
    setOpened(new Set())
    setShowErrors(false)
    setStartFrom("each")
    setOpenSection(merged.base.model || merged.mixed.has("model") ? "counts" : "judged")
  }, [skills, state, key])
  React.useEffect(() => {
    if (skills.length > 0 && start?.key !== key) begin()
  }, [skills.length, start?.key, key, begin])
  React.useEffect(() => {
    window.addEventListener("lab:reset", begin)
    return () => window.removeEventListener("lab:reset", begin)
  }, [begin])

  const hasModel = !!rule.model
  const showSections = hasModel || !!start?.merged.mixed.has("model")

  // Every selected skill is new, so none has a saved rule: group check-off starts off once there is a model, as on one skill.
  const allNewSkills = skills.length > 0 && skills.every((k) => !isConfigured(k))
  const undecided = allNewSkills && !!rule.model && rule.checkOff?.enabled == null
  React.useEffect(() => {
    if (undecided) setRuleState(withCheckOffDecided)
  }, [undecided])

  const merged = start?.merged
  const touched = React.useMemo(() => (merged ? touchedFields(rule, merged, opened) : new Set<BulkField>()), [rule, merged, opened])
  // Skills that differ on their minimums keep them: an added one adds to each (map D4).
  const addMinimums = !!merged?.mixed.has("conditions")
  const rows = React.useMemo(() => (merged ? planMany(state, skills, rule, touched, addMinimums) : []), [merged, state, skills, rule, touched, addMinimums])
  // Every selected skill is new: the page behaves as for one skill and asks for all of it. Otherwise it only asks for what was touched.
  const allNew = allNewSkills
  const issues = React.useMemo(() => validateRule(rule).filter((i) => allNew || touched.has(issueField(i))).map(inPanelWords), [rule, allNew, touched])
  const blocked = rows.filter((r) => r.outcome === "blocked")
  const titleName = skills.length ? countSkills(skills.length) : null
  // The frame sits outside a new program's store, so the crumb takes the count from here.
  React.useEffect(() => {
    if (!titleName || skills.length < 2) return
    publishShownSkill({ id: key, name: titleName })
    return () => publishShownSkill(null)
  }, [key, titleName, skills.length])

  // One id left that can be configured: the page for one skill (bad ids and Inactive ones are ignored).
  if (hydrated && skills.length === 1) return <ConfigureOneSkillPage skillId={skills[0]!.id} />
  if (!hydrated || !merged) {
    if (hydrated && skills.length === 0) return <ConfigureNotFound skillId={key} />
    return <ConfigureLoading />
  }
  const mixed = merged.mixed
  const dirty = touched.size > 0
  const setRule: SectionProps["setRule"] = (fn) => setRuleState(fn)
  const err = (f: string) => (showErrors ? issues.find((i) => i.field === f)?.message : undefined)
  const openField = (f: BulkField) => {
    setOpened((s) => new Set(s).add(f))
    // A Mixed list starts blank, never from one skill's values; a model's criteria need that model's empty rows.
    if (f === "criteria") setRuleState((r) => (r.model ? copyField(r, "criteria", withModel(blankRule(), r.model)) : r))
  }
  const keepField = (f: BulkField) => {
    setOpened((s) => {
      const n = new Set(s)
      n.delete(f)
      return n
    })
    setRuleState((r) => blankField(r, f))
  }
  const yesNo = (f: "selfEvaluation" | "feedbackRequired" | "approvalRequired") => (v: "mixed" | boolean) => {
    if (v === "mixed") return keepField(f)
    setOpened((s) => new Set(s).add(f))
    setRuleState((r) => ({ ...r, [f]: v }))
  }
  const yesNoValue = (f: "selfEvaluation" | "feedbackRequired" | "approvalRequired"): "mixed" | boolean => (opened.has(f) ? rule[f] : "mixed")
  const gate = { mixed, opened, onOpen: openField, onKeep: keepField }
  const modelTouched = touched.has("model")

  const finish = (m: PublishMode | null, heldBack?: ReadonlySet<string>) => {
    const at = `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`
    let result = { configured: 0, kept: 0, held: 0 }
    store.update((s) => {
      const r = saveMany(s, rows, { at, byId: IDS.ross, mode: m, heldBack })
      result = { configured: r.configured.length, kept: r.kept.length, held: r.held.length }
      return r.state
    })
    leave({ saved: String(result.configured), ...(result.kept ? { kept: String(result.kept) } : {}), ...(result.held ? { held: String(result.held) } : {}) })
  }
  /** Skills in the link that are Inactive, left out of this page. */
  const leftOutIds = [...new Set([...(params?.get("inactive") ?? "").split(",").filter(Boolean), ...ids.filter((id) => skillById(state, id)?.active === false)])]
  const leftOut = leftOutIds.map((id) => skillById(state, id)?.name).filter((x): x is string => !!x)
  /** To the Library at the filters, search and scroll the admin left, or the plain Library; focus to its title. A panel left open there is not this result's. */
  const leave = (result: Record<string, string>) => {
    markReturn({ scrollTop: back.fromLibrary ? back.origin!.scrollTop : 0, focusConfigure: null, search: back.fromLibrary ? back.origin!.search : "" })
    focusTitleAfterLeaving()
    router.push(back.landHref({ skill: "", selected: "", ...result, ...(leftOutIds.length ? { inactive: leftOutIds.join(",") } : {}) }))
  }
  /** Open the section holding the problem, then focus the field: its controls are not in the page while it is closed. */
  const goTo = (i: RuleIssue) => {
    setOpenSection(sectionOfIssue(i))
    // A skill's own row is not on this page: its fix is the Add minimum that raised it.
    window.setTimeout(() => { const id = fieldOfIssue(i); focusField(document.getElementById(id) || document.querySelector(`[id^="${id}-"]`) ? id : "cfg-add-minimum") }, 60)
  }
  const save = () => {
    if (issues.length > 0 || blocked.length > 0) {
      setShowErrors(true)
      // The problem's own field, not the summary: the summary is there to read, and the fix is here.
      const target = issues[0] ?? blocked[0]?.issues[0]
      if (target) goTo(target)
      return
    }
    // Asked only when someone's progress moves or something is cleared (map D4). Otherwise it saves, and the banner says so.
    const saving = rows.filter((r) => r.outcome === "save")
    const lines = saving.filter((r) => r.evaluations > 0).map((r) => ({ id: r.id, name: r.name, impact: computeImpact(state, r.id, r.own, r.next, "reapply") })).filter((l) => l.impact.changed.length > 0)
    const cleared = [...new Set(saving.flatMap((r) => modelChangeClears(r.own.model, r.next.model)))]
    if (lines.length || cleared.length) { setImpactAsk({ lines, cleared, others: saving.length - lines.length }); return }
    finish(null)
  }

  const program = programRuleIn(state)
  // Start from [REQ IM-14]: a skill's package, or the default's, as the values to begin from. Each skill keeps its own number and minimums.
  const STARTABLE: BulkField[] = ["criteria", "studentFields", "selfEvaluation", "evaluatorRoles", "feedbackRequired", "approvalRequired", "checkOff"]
  const chooseStart = (v: string) => {
    setStartFrom(v)
    if (v === "each") return begin()
    const from = v === "default" ? program : (() => { const k = state.skills.find((x) => x.id === v); return k ? fromV2(k) : null })()
    if (!from) return
    setRuleState((r) => ({ ...from, need: r.need, levelMinimums: r.levelMinimums, settingMinimums: r.settingMinimums, distinctEvaluators: r.distinctEvaluators }))
    setOpened(new Set(STARTABLE))
  }
  const useDefault = () => {
    if (!program) return
    const seen = new Map<string, { id: string; name: string }>()
    for (const k of skills) for (const c of computeImpact(state, k.id, ownRule(state, k), defaultDraftOf(panelRuleOf(k), program), "reapply").changed) seen.set(c.studentId, { id: c.studentId, name: c.name })
    const cleared = [...new Set(skills.flatMap((k) => modelChangeClears(k.model, program.model)))]
    if (seen.size || cleared.length) setAskDefault({ students: [...seen.values()], cleared })
    else applyDefault()
  }
  const applyDefault = () => {
    const at = `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`
    let done = 0
    store.update((s) => skills.reduce((acc, k) => { const r = applyDefaultConfiguration(acc, k.id, { at, byId: IDS.ross }); if (r.ok) done += 1; return r.ok ? r.state : acc }, s))
    setAskDefault(null)
    leave({ saved: String(done), default: "1" })
  }

  // One line per field, however many skills it stops, naming them: a selection can be 150.
  const byField = new Map<string, { issue: RuleIssue; names: string[] }>()
  for (const i of issues) if (!byField.has(i.field)) byField.set(i.field, { issue: i, names: [] })
  for (const r of blocked) {
    const i = r.issues[0]
    if (!i) continue
    const had = byField.get(i.field)
    if (had) had.names.push(r.name)
    else byField.set(i.field, { issue: inPanelWords(i), names: [r.name] })
  }
  const summaryIssues: RuleIssue[] = [...byField.values()].map(({ issue, names }) => (names.length ? { ...issue, message: `${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""}: ${issue.message}` } : issue))
  const banner = showErrors && summaryIssues.length > 0 ? <IssueSummary id="cfg-many-issues" issues={summaryIssues} autoFocus={false} labelOf={(i) => SECTION_TITLE[sectionOfIssue(i)]()} onGo={goTo} /> : null
  const saveLabel = `Save ${countSkills(skills.length)}`
  const needMixed = mixed.has("need")
  const stillMixed = (f: BulkField) => mixed.has(f) && !touched.has(f)
  const pathMixed = new Set<PathNodeId>()
  if (stillMixed("studentFields")) pathMixed.add("student")
  if (stillMixed("selfEvaluation")) pathMixed.add("self")
  if (stillMixed("model") || stillMixed("criteria") || stillMixed("evaluatorRoles") || stillMixed("feedbackRequired") || stillMixed("checkOff")) pathMixed.add("evaluator")
  if (stillMixed("approvalRequired")) pathMixed.add("approval")
  if (stillMixed("model") || stillMixed("criteria") || stillMixed("need") || stillMixed("conditions")) pathMixed.add("achieved")
  const nodes = pathNodes(rule, { mixed: pathMixed, showErrors })
  // The previews: each selected skill with this draft resolved on it.
  const examples = rows.map((r) => ({ id: r.id, name: r.name, rule: r.next }))
  // A row that depends on a Mixed model, or whose whole value is Mixed, is its label and one badge: nothing inside.
  const criteriaClosed = !modelTouched && mixed.has("criteria") && !opened.has("criteria")
  const countsTitle = SECTION_TITLE.counts()
  const sources = state.skills.filter((k) => isConfigured(k) && k.active !== false).sort((a, b) => a.name.localeCompare(b.name))

  const SECTION_MIXED: Record<SkillSection, BulkField[]> = { judged: ["model"], counts: ["criteria", "need", "conditions"], student: ["studentFields", "selfEvaluation"], who: ["evaluatorRoles", "feedbackRequired", "checkOff", "approvalRequired"] }
  /** Nothing can be set here until the model is: the way forward, not a lone chip (map D4). */
  const NeedsModel = ({ field, label }: { field: string; label: string }) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3" data-mixed-field={field} data-needs-model>
      <span className={TYPE.label}>{label}</span>
      <MixedBadge />
      <Button type="button" variant="link" size="sm" className="h-auto min-h-6 px-0" onClick={() => { setOpenSection("judged"); window.setTimeout(() => focusField("cfg-model-demonstration"), 60) }}>{`Choose how these ${skillNounPlural()} are judged first`}</Button>
    </div>
  )
  /** Where a row reads Mixed, its Mixed form: the same rows otherwise (map D4). */
  const slot = (name: SectionSlot, control: React.ReactNode): React.ReactNode => {
    switch (name) {
      case "model":
        return (
          <div className="flex flex-col items-start gap-3">
            {mixed.has("model") && !hasModel ? <MixedBadge /> : null}
            <div className="w-full">{control}</div>
            {mixed.has("model") && hasModel ? <Button type="button" variant="ghost" size="sm" onClick={() => setRuleState((r) => blankField(blankField(r, "model"), "criteria"))}>Keep as is</Button> : null}
          </div>
        )
      case "criteria":
        if (!hasModel) return <NeedsModel field="criteria" label={countsTitle} />
        if (criteriaClosed) return <div className="flex items-center gap-2 py-3" data-mixed-field="criteria"><span className={TYPE.label}>{countsTitle}</span><MixedBadge /><SetForAll label={countsTitle} field="criteria" onOpen={openField} /></div>
        return <MixedGate label={countsTitle} field="criteria" {...gate} mixed={modelTouched ? new Set() : mixed}>{control}</MixedGate>
      case "need":
        return (
          <div className="flex flex-col gap-1">
            <RuleNumber id="cfg-need" label="Times needed" placeholder={needMixed ? "Mixed" : undefined} value={rule.need} error={!!err("cfg-need")} onChange={(n) => setRuleState((r) => ({ ...r, need: n }))} />
            {err("cfg-need") ? <FieldError id="cfg-need-error">{err("cfg-need")}</FieldError> : null}
          </div>
        )
      case "minimums":
        return (
          <div className="flex flex-col gap-2" data-mixed-field={mixed.has("conditions") ? "conditions" : undefined}>
            {mixed.has("conditions") && !opened.has("conditions") ? <span><MixedBadge /></span> : null}
            {/* Added to each skill; each keeps its own minimums (map D4). */}
            {/* An Add is the choice to set them for all, so a Mixed field takes one press, not two (map D4). */}
            <MinimumsField rule={rule} setRule={(fn) => { if (mixed.has("conditions")) setOpened((s) => new Set(s).add("conditions")); setRuleState(fn) }} noNone={mixed.has("conditions")} issues={summaryIssues} showErrors={showErrors} settings={state.program.clinicalSettings} />
            {mixed.has("conditions") && opened.has("conditions") ? <Button type="button" variant="ghost" size="sm" className="self-start" aria-label="Keep minimums as is" onClick={() => keepField("conditions")}>Keep as is</Button> : null}
          </div>
        )
      case "studentFields":
        return <MixedGate label={STUDENT_FIELDS_LABEL} field="studentFields" {...gate}>{control}</MixedGate>
      case "self":
        return mixed.has("selfEvaluation") ? <MixedYesNo id="cfg-self" label="Student rates themselves first" value={yesNoValue("selfEvaluation")} onChange={yesNo("selfEvaluation")} /> : control
      case "signers":
        return <MixedGate label="Who can sign off" field="evaluatorRoles" {...gate}>{control}</MixedGate>
      case "feedback":
        return mixed.has("feedbackRequired") ? <MixedYesNo id="cfg-feedback" label="Feedback is required" value={yesNoValue("feedbackRequired")} onChange={yesNo("feedbackRequired")} /> : control
      case "checkOff":
        return hasModel ? <MixedGate label={CHECKOFF_LABEL} field="checkOff" {...gate}>{control}</MixedGate> : <NeedsModel field="checkOff" label={CHECKOFF_LABEL} />
      case "approval":
        return mixed.has("approvalRequired") ? <MixedYesNo id="cfg-approval" label="Approval before it counts" value={yesNoValue("approvalRequired")} onChange={yesNo("approvalRequired")} /> : control
    }
  }

  const secondary = (
    <>
      <Button type="button" variant="outline" size="sm" disabled={!showSections} onClick={() => setPreviewOpen(true)}>Preview</Button>
      <Button asChild variant="outline" size="sm"><NextLink href={back.cancelHref({ selected: ids.join(",") })} data-configure-cancel={key}>Cancel</NextLink></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions" data-many-more><i className="fa-light fa-ellipsis" aria-hidden="true" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!program} onSelect={useDefault}>Use default configuration</DropdownMenuItem>
          {program ? null : <DropdownMenuLabel className="max-w-64 font-normal text-muted-foreground" data-no-default-why>{`Set how ${skillNounPlural()} are judged first.`}</DropdownMenuLabel>}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <>
      <FormPage
        title={<ManyTitle skills={skills} />}
        actions={
          <span className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden flex-wrap items-center justify-end gap-2 sm:flex">{secondary}</span>
            <Button type="button" variant="default" size="sm" disabled={!dirty} onClick={save}>{saveLabel}</Button>
          </span>
        }
        banner={banner}
      >
        {/* A phone's header holds the title and Save; the other actions start the page. */}
        <div className="flex flex-wrap items-center gap-2 sm:hidden" data-many-actions>{secondary}</div>
        {/* From 1100 px the selection fills the width beside the sections (D-L5, map D4), as the preview does for one skill. */}
        <div className={cn("grid min-w-0 gap-8", wide && "grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start min-[1600px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")} data-settings-columns>
          <div className="flex min-w-0 flex-col gap-8">
            {program ? null : (
              <div className="flex flex-wrap items-center justify-between gap-3" data-no-program>
                <p className={TYPE.body}>{`Your program has not set how ${skillNounPlural()} are judged.`}</p>
                <Button asChild variant="outline" size="sm"><Link href={`${LAB_ADMIN}/evaluation-settings${params?.get("program") ? `?program=${params.get("program")}` : ""}`}>{`Set how ${skillNounPlural()} are judged`}</Link></Button>
              </div>
            )}
            {wide ? null : (
              <section className="flex min-w-0 flex-col gap-2" aria-labelledby="cfg-selected-title" data-many-list>
                <h2 id="cfg-selected-title" className={TYPE.section}>{`Selected ${skillNounPlural()}`}</h2>
                <SkillNames skills={skills} className="max-h-40 rounded-[var(--radius)] border border-border" />
              </section>
            )}
            {leftOut.length ? <p className={TYPE.body} data-many-left-out>{`Left out, Inactive: ${leftOut.slice(0, 3).join(", ")}${leftOut.length > 3 ? ` and ${leftOut.length - 3} more` : ""}.`}</p> : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-start-from>
<Label id="cfg-start-label" htmlFor="cfg-start">Copy settings from</Label>
              <StartFromPicker value={startFrom} sources={sources} hasDefault={!!program} onChange={chooseStart} />
            </div>
            <ConfigureSections
              rule={rule}
              setRule={setRule}
              issues={[...issues, ...blocked.flatMap((r) => r.issues)]}
              showErrors={showErrors}
              settings={state.program.clinicalSettings}
              open={openSection}
              onOpen={setOpenSection}
              onlyJudged={!showSections}
              judgedTitle={`How these ${skillNounPlural()} are judged`}
              slot={slot}
              summaryOf={(section, normal) => (SECTION_MIXED[section].some(stillMixed) ? "Mixed" : normal)}
            />
          </div>
          {wide ? <SelectedSkills skills={skills} /> : null}
        </div>
      </FormPage>
      <UnsavedChangesGuard dirty={dirty} onDiscard={begin} />
      <ImpactDialog ask={impactAsk} onClose={() => setImpactAsk(null)} saveLabel={saveLabel} onSave={() => finish(null)} />
      <DefaultImpactDialog open={!!askDefault} listed title={`Use default configuration for ${countSkills(skills.length)}?`} students={askDefault?.students ?? []} cleared={askDefault?.cleared ?? []} confirm="Use default configuration" onCancel={() => setAskDefault(null)} onConfirm={applyDefault} />
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[85dvh] flex-col overflow-y-auto sm:max-w-2xl" aria-describedby={undefined} data-many-preview {...previewFocus}>
          <DialogHeader><DialogTitle>Preview</DialogTitle></DialogHeader>
          <ConfigurePanel nodes={nodes} rule={rule} examples={examples} />
        </DialogContent>
      </Dialog>
    </>
  )
}
