"use client"

/**
 * Evaluation settings D preview (rebuilt 2026-11-03; decluttered the same day, D-L43): what the evaluator or the student gets, one
 * at a time, drawn with the REAL lab components, not sketches.
 *
 * - One screen at a time: "Evaluator | Student" (DS ViewSegmentedControl) and the Example picker share the preview header.
 * - Evaluator: the evaluator form's own controls (`ChoiceTiles` for outcome, level or question answers, then feedback, as
 *   `SkillFields` orders them) under the link page's light header. "No account needed" shows only when a preceptor signs
 *   (preceptors sign through a link; clinical faculty and lab instructors have a Prism login, D-L29).
 * - Student: the student request's own `DetailsFields` (the program's fields) and self-evaluation choices.
 * - One level of framing: the screen frame, with the skill name as a plain heading inside it; no card in it.
 * - The screen's own button (Submit, Ask for sign-off) is drawn as an outline button, so the page keeps one filled button, Save
 *   settings (DS P3). The frame is a picture: inert and hidden from assistive tech, with a one-line text equivalent.
 * - Content: the rule a real library skill would get under the draft (`resolveRule`: the program part, with the skill's own
 *   questions and number), the skill chosen in a labelled "Example" picker of real library skills. The page draws this only once a
 *   model is chosen; parts the program has not filled are left out, never drawn as placeholders.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { TYPE } from "@/components/lab/type-scale"
import { ChoiceTiles } from "@/components/lab/evaluator/fields"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { DetailsFields } from "@/components/lab/student2/log-parts"
import type { DetailField } from "@/lib/lab/student2"
import { buildLibrary } from "@/lib/lab/library"
import { resolveRule, skillRuleOf } from "@/lib/lab/program-settings"
import { ROLE_LABEL, type LabRule } from "@/lib/lab/configure"
import { useV2State } from "@/lib/v2/react"
import type { EvalModel } from "@/lib/v2/types"
import { skillNoun } from "@/lib/lab/terms"

export interface Example {
  id: string
  name: string
  rule: LabRule | null
}

const usesQuestions = (m: EvalModel | null) => m === "question" || m === "scored"

/**
 * Real library skills to preview with: every active skill, not configured ones first.
 */
function useExamples(model: EvalModel | null): Example[] {
  const state = useV2State()
  return React.useMemo(() => {
    const skills = new Map(state.skills.map((k) => [k.id, k]))
    const rows = buildLibrary(state).filter((r) => r.status !== "inactive" && skills.has(r.id))
    const all: Example[] = rows.map((r) => ({ id: r.id, name: r.name, rule: skillRuleOf(skills.get(r.id)!) }))
    // First, a skill not configured yet: it takes these settings exactly as drawn, so the preview matches the page. Under a
    // question or scored model, skills already on that model keep their own questions; they follow, named in the picker.
    const fresh = all.filter((x) => !x.rule)
    const own = usesQuestions(model) ? all.filter((x) => x.rule?.model === model && x.rule.questions.some((q) => q.trim())) : []
    const rest = all.filter((x) => x.rule && !own.includes(x))
    return [...fresh, ...own, ...rest]
  }, [state, model])
}

/** "Example: <skill>": a searchable list of real library skills (more than 7, so type-to-search). */
export function ExamplePicker({ options, value, onChange }: { options: Example[]; value: Example | null; onChange: (id: string) => void }) {
  const [open, setOpen] = React.useState(false)
  if (!value) return null
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="max-w-full min-w-0 gap-1.5" data-example-picker>
          <span className="text-muted-foreground">Example:</span>
          <span className="min-w-0 truncate">{value.name}</span>
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Command>
          <CommandInput placeholder={`Search ${options.length} ${options.length === 1 ? skillNoun() : `${skillNoun()}s`}`} />
          <CommandList className="max-h-72">
            <CommandEmpty>{`No ${skillNoun()} matches.`}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.id} value={`${o.name} ${o.id}`} onSelect={() => { onChange(o.id); setOpen(false) }}>
                  <span className="min-w-0 flex-1 truncate">{o.name}</span>
                  {o.id === value.id ? <i className="fa-solid fa-check text-xs" aria-hidden="true" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * A phone-width screen, flat: the page's own header strip, the skill name, its content, its button. One frame, no card inside.
 * A picture (inert, hidden from assistive tech).
 */
function Screen({ header, title, children, footer }: { header?: React.ReactNode; title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-[var(--radius)] border border-border bg-background" aria-hidden="true" inert data-artifact-preview>
      {header ? <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border px-4 py-2.5">{header}</div> : null}
      <div className="flex flex-col gap-4 p-4">
        <p className={TYPE.card}>{title}</p>
        {children}
      </div>
      <div className="border-t border-border px-4 py-3">{footer}</div>
    </div>
  )
}

/**
 * The evaluator form's answers for one skill, in the order and with the controls of the form itself (`SkillFields`: the outcome on the
 * binary model only, the level, or the questions, then feedback), all unanswered, so nothing reads as preselected [REQ SC-02]. The question and
 * scored models have no final result: the result comes from the answers (D-L73; Sankalp 11-04). Levels or questions not named yet are left out.
 */
function EvaluatorAnswers({ rule, id }: { rule: LabRule; id: string }) {
  const model = rule.model
  const outcomes = rule.outcomeLabels.map((x, i) => x.trim() || (i === 0 ? "Met" : "Unmet"))
  const levels = rule.levels.map((l) => l.trim()).filter(Boolean)
  const questions = rule.questions.map((q) => q.trim()).filter(Boolean)
  const top = Number.isInteger(rule.scaleMax) && rule.scaleMax >= 2 ? rule.scaleMax : 5
  const none = () => {}
  return (
    <div className="flex flex-col gap-4">
      {model === "binary" ? (
        <div className="flex flex-col gap-2">
          <Label id={`${id}-out`} className="text-sm font-medium">Outcome</Label>
          <ChoiceTiles id={`${id}-out-0`} labelId={`${id}-out`} options={outcomes.map((l, i) => ({ value: String(i), label: l }))} value={null} onChange={none} />
        </div>
      ) : null}
      {model === "demonstration" && levels.length >= 2 ? (
        <div className="flex flex-col gap-2">
          <Label id={`${id}-lvl`} className="text-sm font-medium">Level observed</Label>
          <ChoiceTiles id={`${id}-lvl-0`} labelId={`${id}-lvl`} options={levels.map((l, i) => ({ value: String(i), label: l }))} value={null} onChange={none} cols={1} />
        </div>
      ) : null}
      {(model === "question" || model === "scored") && questions.length ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">{model === "scored" ? `Score each, 1 to ${top}` : "Criteria"}</p>
          {questions.map((q, i) => (
            <div key={i} className="flex flex-col gap-2">
              <p id={`${id}-q-${i}`} className="text-sm text-foreground">{q}</p>
              {rule.selfEvaluation ? <p className="text-xs text-muted-foreground">{model === "scored" ? "Student's own score shows here" : "Student's own answer shows here"}</p> : null}
              <ChoiceTiles
                id={`${id}-q-${i}-0`}
                labelId={`${id}-q-${i}`}
                options={model === "scored" ? Array.from({ length: top }, (_, n) => ({ value: String(n + 1), label: String(n + 1) })) : [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
                value={null}
                onChange={none}
                cols={model === "scored" ? "scale" : 2}
              />
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-fb`} className="text-sm font-medium">
          Feedback <span className="font-normal text-muted-foreground">{rule.feedbackRequired ? "(required)" : "(optional)"}</span>
        </Label>
        <Textarea id={`${id}-fb`} rows={2} className="min-h-16" readOnly />
      </div>
    </div>
  )
}

/** The text equivalents of the two screens (the screens themselves are pictures, hidden from assistive tech). */
/** The same answer the form gives after submit: on Approved or not approved, which label counts is the program's [REQ SC-03]. */
function toldAfterSubmit(rule: LabRule): string {
  if (rule.approvalRequired) return "Told after submit: waits for program approval before it counts."
  const q = rule.model === "binary" && rule.qualifyingLabel !== null ? rule.outcomeLabels[rule.qualifyingLabel]?.trim() : ""
  return q ? `Told after submit: ${q} counts now. The other label does not count.` : "Told after submit: it counts now."
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const evaluatorScreenText = (rule: LabRule, roles: LabRule["evaluatorRoles"], name: string): string => `${whoLine(roles)}. ${name}: sees what the student supplied, answers as set, feedback ${rule.feedbackRequired ? "required" : "optional"}. ${capitalize(toldAfterSubmit(rule).replace("Told after submit: ", ""))}`
export const studentScreenText = (rule: LabRule, name: string): string => `Student asks for sign-off on ${name}${rule.studentFields.length ? `, adding ${rule.studentFields.map((f) => f.label.trim()).filter(Boolean).join(", ")}` : ""}${rule.selfEvaluation ? ", after rating themselves" : ""}, choosing where and who, with an optional note.`

export function whoLine(roles: LabRule["evaluatorRoles"]): string {
  if (!roles.length) return "Who can sign off is not chosen"
  const parts: string[] = []
  if (roles.includes("preceptor")) parts.push("Preceptor by emailed link")
  const inPrism = roles.filter((r) => r !== "preceptor").map((r) => ROLE_LABEL[r])
  if (inPrism.length) parts.push(`${inPrism.join(" and ")} in Prism`)
  return parts.join(" · ")
}

/** What the student supplied, as the evaluator sees it above their own answers [REQ EV-04]: a picture, so the values are named, not invented. */
function FromStudent({ rule }: { rule: LabRule }) {
  const fields = rule.studentFields.map((f) => f.label.trim()).filter(Boolean)
  const levelOrOutcome = rule.model === "demonstration" || rule.model === "binary"
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2 text-sm" data-preview-from-student>
      <p className="text-muted-foreground">From the student</p>
      <p className="text-foreground">{["Course", "where it was done", ...fields].join(" · ")}</p>
      <p className="text-muted-foreground">Their note, if they wrote one</p>
      {rule.selfEvaluation && levelOrOutcome ? <p className="text-foreground">Their self-evaluation</p> : null}
    </div>
  )
}

export function EvaluatorScreen({ rule, example, program }: { rule: LabRule; example: Example; program: string }) {
  const link = rule.evaluatorRoles.includes("preceptor")
  return (
    <Screen
      header={
        <>
          <span className="min-w-0 text-sm font-semibold text-foreground">{program}</span>
          {link ? (
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <i className="fa-light fa-lock" aria-hidden="true" />
              No account needed
            </span>
          ) : null}
        </>
      }
      title={example.name}
      footer={
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="default" className="w-full" tabIndex={-1}>{`Submit 1 ${skillNoun()}`}</Button>
          <p className="text-sm text-muted-foreground" data-preview-approval>{toldAfterSubmit(rule)}</p>
        </div>
      }
    >
      <FromStudent rule={rule} />
      <EvaluatorAnswers rule={rule} id={`pv-ev-${example.id}`} />
    </Screen>
  )
}

/** A closed select, drawn: the student's choice of where and who depends on the student, so the picture names the choice rather than a person. */
function PictureSelect({ label, value }: { label: string; value: string }) {
  const id = `pv-${label.toLowerCase().replace(/\s+/g, "-")}`
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Select>
        <SelectTrigger id={id} className="w-full"><SelectValue placeholder={value} /></SelectTrigger>
        <SelectContent><SelectItem value="sample">{value}</SelectItem></SelectContent>
      </Select>
    </div>
  )
}

export function StudentScreen({ rule, example, condensed }: { rule: LabRule; example: Example; /** The panel beside the form (map D1c): a count stands for the questions, whatever their length or the scale, and the button alone names the form. The Preview dialog and the Evaluator tab show it all. */ condensed?: boolean }) {
  const fields: DetailField[] = rule.studentFields
    .filter((f) => f.label.trim())
    .map((f, i) => ({ id: `f${i}`, label: f.label.trim(), type: f.type, required: f.mandatory, options: f.choices }))
  // The same form the evaluator gets [REQ ST-11]: one choice for a level or a label, an answer per question otherwise, never a final result.
  const scale = rule.model === "demonstration" ? rule.levels.filter((l) => l.trim()) : rule.model === "binary" ? rule.outcomeLabels.map((l) => l.trim()).filter(Boolean) : []
  const questions = rule.model === "question" || rule.model === "scored" ? rule.questions.map((q) => q.trim()).filter(Boolean) : []
  const top = Number.isInteger(rule.scaleMax) && rule.scaleMax >= 2 ? rule.scaleMax : 5
  const answers = rule.model === "scored" ? Array.from({ length: top }, (_, n) => String(n + 1)) : ["Yes", "No"]
  return (
    <Screen
      header={condensed ? undefined : <span className="truncate text-sm font-semibold text-foreground">Send for evaluation</span>}
      title={example.name}
      footer={<Button type="button" variant="outline" size="default" className="w-full" tabIndex={-1}>Send for evaluation</Button>}
    >
      <PictureSelect label="Where" value={rule.evaluatorRoles.includes("lab-instructor") ? (rule.evaluatorRoles.length > 1 ? "Clinical setting, lab or simulation" : "Lab or simulation") : "Clinical setting, lab or simulation"} />
      {fields.length ? <DetailsFields values={{}} onChange={() => {}} errors={{}} showErrors={false} idPrefix="pv-student" columns={false} fields={fields} /> : null}
      {rule.selfEvaluation && scale.length ? (
        <FieldSet>
          <FieldLegend variant="label">Self-evaluation</FieldLegend>
          <ToggleGroup type="single" variant="outline" spacing={2} className="flex w-full flex-wrap justify-start">
            {/* By position: two levels can share a name until the form says so, and a long name wraps inside the panel. */}
            {scale.map((o, i) => <ToggleGroupItem key={i} value={String(i)} size="sm" className="h-auto min-h-8 max-w-full whitespace-normal break-words px-2.5 py-1 text-start">{o}</ToggleGroupItem>)}
          </ToggleGroup>
        </FieldSet>
      ) : null}
      {rule.selfEvaluation && questions.length && condensed ? (
        <FieldSet>
          <FieldLegend variant="label">Self-evaluation</FieldLegend>
          <p className="text-sm text-muted-foreground" data-question-count>{`${questions.length} ${questions.length === 1 ? "question" : "questions"}, ${rule.model === "scored" ? `score 1 to ${top}` : "Yes or No"}`}</p>
        </FieldSet>
      ) : null}
      {rule.selfEvaluation && questions.length && !condensed ? (
        <FieldSet>
          <FieldLegend variant="label">Self-evaluation</FieldLegend>
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-sm text-foreground">{q}</p>
                <ToggleGroup type="single" variant="outline" spacing={2} className="flex w-full flex-wrap justify-start">
                  {answers.map((o) => <ToggleGroupItem key={o} value={o} size="sm" className="px-2.5">{o}</ToggleGroupItem>)}
                </ToggleGroup>
              </div>
            ))}
          </div>
        </FieldSet>
      ) : null}
      <PictureSelect label="Who signs off" value={rule.evaluatorRoles.length ? rule.evaluatorRoles.map((r) => ROLE_LABEL[r]).join(" or ") : "Who signs is not set"} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="pv-student-note" className="text-sm font-medium">Note <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea id="pv-student-note" rows={2} className="min-h-16" readOnly />
      </div>
    </Screen>
  )
}

type Who = "evaluator" | "student"
const WHO_OPTIONS = [
  { value: "evaluator", label: "Evaluator" },
  { value: "student", label: "Student" },
] as const

/** The preview column: Evaluator | Student and the Example picker in its header, then that one screen [REQ SC-17, SC-19]. */
export function ProgramPreview({ draft }: { draft: LabRule }) {
  const state = useV2State()
  const examples = useExamples(draft.model)
  const [pick, setPick] = React.useState<string | null>(null)
  const [who, setWho] = React.useState<Who>("evaluator")
  const example = examples.find((x) => x.id === pick) ?? examples[0] ?? null
  const rule = React.useMemo(() => (example ? resolveRule(draft, example.rule) : draft), [draft, example])
  const program = `${state.program.school} ${state.program.name}`
  if (!example) return null
  return (
    <section className="flex flex-col gap-4" aria-labelledby="d-preview-title" data-preview>
      <h2 id="d-preview-title" className="sr-only">Preview</h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ViewSegmentedControl<Who> aria-label="Preview for" value={who} onValueChange={setWho} options={WHO_OPTIONS} />
        <ExamplePicker options={examples} value={example} onChange={setPick} />
      </div>
      <p className="sr-only">{who === "evaluator" ? evaluatorScreenText(rule, draft.evaluatorRoles, example.name) : studentScreenText(rule, example.name)}</p>
      {who === "evaluator" ? <EvaluatorScreen rule={rule} example={example} program={program} /> : <StudentScreen rule={rule} example={example} />}
    </section>
  )
}
