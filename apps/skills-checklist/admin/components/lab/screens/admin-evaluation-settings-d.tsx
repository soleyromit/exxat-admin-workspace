"use client"

/**
 * Evaluation settings, variant D: one sentence (chosen 2026-11-03, D-L38; decluttered 2026-11-03, D-L43, after Romit:
 * "evaluation settings looks crowded and confusing").
 *
 * - The spine: the program rule as one sentence of inline pickers. Unset pickers read as placeholders that complete the sentence
 *   ("choose who", "choose how it's judged", "how many"); nothing is preselected [REQ SC-02]. The model sets the verb and the
 *   criterion picker after it.
 * - Progressive disclosure: until "how it's judged" is chosen the sentence stands alone. Nothing locked or placeholder is drawn.
 * - Each thing once: the number lives only in the sentence; "Set a different number for some skills" under it opens the number
 *   per skill (dialog) with "Change one skill" in its footer (the per-skill page, minimums at each level and setting
 *   [REQ SC-10, SC-11]). Who signs lives only in the sentence.
 * - One surface for the rest: Evaluator (the outcomes, levels or questions, feedback, group check-off) and Student (fields,
 *   self-rating), titled sections split by a Separator, no card per section.
 * - Beside it, one preview at a time (Evaluator | Student) for a labelled example skill (`program-preview.tsx`) [REQ SC-17, SC-19].
 * - Save settings is the only filled button (DS P3). A failed save marks every unset picker amber and names the first problem
 *   under the sentence. No helper text (D-L34, D-L36).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Separator } from "@exxatdesignux/ui/components/ui/separator"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { useRouter } from "next/navigation"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { buildLibrary } from "@/lib/lab/library"
import { useV2State } from "@/lib/v2/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import {
  FeedbackToggle,
  GroupCheckOffSection,
  OutcomesSection,
  QuestionRuleField,
  ScoredRuleField,
  SelfRatingToggle,
  SignersField,
  StudentFieldsField,
  type SectionProps,
} from "@/components/lab/configure/fields"
import { ContextSettingsFrame, failsOn, NEED_FIELDS, SIGNER_FIELDS, signerPhrase, TimesNeededButton, useModelChoice, WARN_TEXT, type ContextPage } from "@/components/lab/configure/program-context"
import { ProgramPreview } from "@/components/lab/configure/program-preview"
import { exceptionCount } from "@/components/lab/configure/program-parts"
import { countsFromOption, LAB_MODEL_LABEL, LAB_MODELS, MODEL_STEP_LABEL, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import type { EvalModel } from "@/lib/v2/types"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"

type Slot = "signers" | "criterion"

/** The verb each way of judging puts in the sentence. */
const VERB: Record<EvalModel, string> = { binary: "marks it", question: "answers the questions", demonstration: "rates it", scored: "scores each question" }

const WARN_BORDER = "border-[var(--status-badge-warning-fg)]"
const ERROR_ID = "d-rule-error"
const PICKER = "h-9 gap-2"

/** The fields the sentence holds (a failed save on one marks its picker and names it under the sentence). */
const SENTENCE_FIELDS = ["cfg-model", "cfg-role", "cfg-need", "cfg-qualifying", "cfg-counts-from", "cfg-qrule", "cfg-srule"]
const QUESTION_RULE_FIELDS = ["cfg-qrule"]
const SCORED_RULE_FIELDS = ["cfg-srule"]

/** An unset picker: the words that complete the sentence, muted; amber with a glyph once a save failed on it. */
function Placeholder({ text, warn }: { text: string; warn?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-normal", warn ? WARN_TEXT : "text-muted-foreground")}>
      {warn ? <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> : null}
      {text}
    </span>
  )
}

/** A picker inside the sentence that opens a small editor: its value, or the placeholder that completes the sentence. */
function PickerPopover({ id, label, value, placeholder, warn, open, onOpenChange, children, wide }: { id: string; label: string; value: string | null; placeholder: string; warn: boolean; open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size="default"
          aria-label={`${label}: ${value ?? placeholder}`}
          aria-describedby={warn ? ERROR_ID : undefined}
          className={cn(PICKER, !value && "border-dashed", warn && WARN_BORDER)}
        >
          {value ?? <Placeholder text={placeholder} warn={warn} />}
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("flex max-h-[70vh] flex-col gap-4 overflow-auto p-4", wide ? "w-[min(32rem,calc(100vw-2rem))]" : "w-80")} aria-label={label}>
        {children}
        <Button type="button" variant="outline" size="sm" className="self-end" onClick={() => onOpenChange(false)}>Done</Button>
      </PopoverContent>
    </Popover>
  )
}

/** A choice inside the sentence (DS Select): its value, or the placeholder that completes the sentence. */
function PickerSelect({ id, label, value, display, placeholder, warn = false, options, onChange, emptyText }: { id: string; label: string; value: string; /** What the sentence shows for the value, when the option names it differently. */ display?: string; placeholder?: string; warn?: boolean; options: Array<{ value: string; text: string; meta?: string }>; onChange: (v: string) => void; emptyText?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={label} aria-describedby={warn ? ERROR_ID : undefined} aria-invalid={warn || undefined} className={cn(PICKER, "w-auto", !value && "border-dashed", warn && WARN_BORDER)}>
        <SelectValue placeholder={placeholder ? <Placeholder text={placeholder} warn={warn} /> : undefined}>{value && display ? display : undefined}</SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {options.length ? (
          options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.meta ? (
                <span className="flex w-full items-center justify-between gap-6">
                  <span>{o.text}</span>
                  <span className={cn(TYPE.meta, "tabular-nums")}>{o.meta}</span>
                </span>
              ) : (
                o.text
              )}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="none" disabled>{emptyText}</SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

/** "every answer Yes", "at least 3 answered Yes": the question rule inside the sentence, or null. */
function questionPhrase(r: LabRule): string | null {
  const q = r.questionRule
  if (!q) return null
  if (q.kind === "all") return "every answer Yes"
  if (q.kind === "atLeast") return Number.isFinite(q.n) ? `at least ${q.n} answered Yes` : null
  const n = q.indices.filter((i) => i < r.questions.length).length
  return n ? `${n} named ${n === 1 ? "question" : "questions"} Yes` : null
}

/** "an average of 4 or more": the scored rule inside the sentence, or null. */
function scoredPhrase(r: LabRule): string | null {
  const s = r.scoredRule
  if (!s || !Number.isFinite(s.value)) return null
  if (s.kind === "average") return `an average of ${s.value} or more`
  if (s.kind === "minEach") return `every score ${s.value} or more`
  return `a total of ${s.value} or more`
}

function RuleSentence({ p, slot, setSlot }: { p: ContextPage; slot: Slot | null; setSlot: (s: Slot | null) => void }) {
  const { m } = p
  const r = m.rule
  const model = r.model
  const { onValue, confirm } = useModelChoice(m)
  const props: SectionProps = { rule: r, setRule: m.setRule, issues: m.issues, showErrors: m.showErrors, settings: [], legendHidden: true }
  const err = (f: string) => (m.showErrors ? m.issues.find((i) => i.field === f)?.message : undefined)
  const slotProps = (s: Slot) => ({ open: slot === s, onOpenChange: (o: boolean) => setSlot(o ? s : null) })
  const first = m.showErrors ? m.issues.find((i) => SENTENCE_FIELDS.some((f) => i.field.startsWith(f))) : undefined
  const needWarn = failsOn(m, NEED_FIELDS)
  const levels = r.levels.map((l) => l.trim())
  return (
    <Card data-region="rule">
      <CardContent className="flex flex-col gap-3">
        <h2 className="sr-only">When a {skillNoun()} is achieved</h2>
        <div className={cn(TYPE.section, "flex flex-wrap items-center gap-x-2 gap-y-2 leading-9")} data-rule-sentence>
          <span>{`${capitalize(aNoun())} is achieved when`}</span>
          <PickerPopover id="d-signers" label="Who can sign off" value={signerPhrase(r.evaluatorRoles)} placeholder="choose who" warn={failsOn(m, SIGNER_FIELDS)} {...slotProps("signers")}>
            <SignersField {...props} />
          </PickerPopover>
          <PickerSelect
            id="cfg-model"
            label={MODEL_STEP_LABEL}
            value={model ?? ""}
            display={model ? VERB[model] : undefined}
            placeholder="choose how it's judged"
            warn={failsOn(m, ["cfg-model"])}
            onChange={onValue}
            options={LAB_MODELS.map((x) => ({ value: x, text: LAB_MODEL_LABEL[x], meta: countSkills(p.facts.byModel[x]) }))}
          />
          {model === "binary" ? (
            <PickerSelect
              id="cfg-qualifying"
              label="Which outcome counts"
              value={r.qualifyingLabel === null ? "" : String(r.qualifyingLabel)}
              placeholder="choose which outcome"
              warn={failsOn(m, ["cfg-qualifying"])}
              onChange={(v) => m.setRule((x) => ({ ...x, qualifyingLabel: v === "1" ? 1 : 0 }))}
              options={[0, 1].map((i) => ({ value: String(i), text: r.outcomeLabels[i]!.trim() || (i === 0 ? "First outcome" : "Second outcome") }))}
            />
          ) : null}
          {model === "demonstration" ? (
            <PickerSelect
              id="cfg-counts-from"
              label="Which levels count"
              value={r.carried.minLevelIndex !== null && r.carried.minLevelIndex < levels.length ? String(r.carried.minLevelIndex) : ""}
              placeholder="choose which levels"
              warn={failsOn(m, ["cfg-counts-from"])}
              onChange={(v) => m.setRule((x) => ({ ...x, carried: { ...x.carried, minLevelIndex: Number(v) } }))}
              options={levels.length >= 2 && levels.every(Boolean) ? levels.map((_, i) => ({ value: String(i), text: countsFromOption(r.levels, i) })) : []}
              emptyText="Name the levels first"
            />
          ) : null}
          {model === "question" || model === "scored" ? (
            <>
              <span>with</span>
              <PickerPopover
                id="d-criterion"
                label={model === "question" ? "Which answers count" : "Which score counts"}
                value={model === "question" ? questionPhrase(r) : scoredPhrase(r)}
                placeholder={model === "question" ? "choose which answers" : "choose a pass mark"}
                warn={failsOn(m, model === "question" ? QUESTION_RULE_FIELDS : SCORED_RULE_FIELDS)}
                wide
                {...slotProps("criterion")}
              >
                {model === "question" ? <QuestionRuleField rule={r} setRule={m.setRule} err={err} /> : <ScoredRuleField rule={r} setRule={m.setRule} err={err} />}
              </PickerPopover>
            </>
          ) : null}
          <span>on</span>
          <Input
            id="cfg-need"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="how many"
            aria-label="Evaluations needed"
            aria-describedby={needWarn ? ERROR_ID : undefined}
            aria-invalid={needWarn || undefined}
            className={cn("h-9 w-28 tabular-nums", needWarn && WARN_BORDER)}
            value={Number.isFinite(r.need) ? String(r.need) : ""}
            onChange={(e) => m.setRule((x) => ({ ...x, need: e.target.value.trim() === "" ? Number.NaN : Number(e.target.value) }))}
          />
          <span>{r.need === 1 ? "evaluation," : "evaluations,"}</span>
          <span className="inline-flex items-center">
            <PickerSelect
              id="d-approval"
              label="Approval before it counts"
              value={r.approvalRequired ? "yes" : "no"}
              onChange={(v) => m.setRule((x) => ({ ...x, approvalRequired: v === "yes" }))}
              options={[{ value: "no", text: "then it counts" }, { value: "yes", text: "then an admin approves" }]}
            />
            <span aria-hidden="true">.</span>
          </span>
        </div>
        {model ? <DifferentNumberLink p={p} /> : null}
        {first ? (
          <p id={ERROR_ID} role="alert" className={cn("flex items-center gap-2 text-sm", WARN_TEXT)}>
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            {first.message}
          </p>
        ) : null}
        {confirm}
      </CardContent>
    </Card>
  )
}

/**
 * "Change one skill": the per-skill page for a skill chosen here (type-to-search, the library is 100+). Its header links to
 * Evaluation settings (no back control, navigation model A, D-L42). That page keeps the skill's
 * own number and its minimums at each level and setting [REQ SC-10, SC-11].
 */
function OneSkillPicker() {
  const state = useV2State()
  const to = useLabHref()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const rows = React.useMemo(() => buildLibrary(state).filter((r) => r.status !== "inactive"), [state])
  const label = `Change one ${skillNoun()}`
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" data-one-skill-picker>
          {label}
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" aria-label={label}>
        <Command>
          <CommandInput placeholder={`Search ${rows.length} ${skillNounPlural()}`} />
          <CommandList className="max-h-72">
            <CommandEmpty>{`No ${skillNoun()} matches.`}</CommandEmpty>
            <CommandGroup>
              {rows.map((r) => (
                <CommandItem key={r.id} value={`${r.name} ${r.id}`} onSelect={() => { setOpen(false); router.push(to("admin/configure-skill", { skill: r.id })) }}>
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** "Set a different number for some skills": the number per skill in a dialog, with Change one skill in its footer. */
function DifferentNumberLink({ p }: { p: ContextPage }) {
  const n = exceptionCount(p.m, p.edits)
  return (
    <div>
      <TimesNeededButton p={p} label={n ? `${countSkills(n)} with a different number` : `Set a different number for some ${skillNounPlural()}`} footer={<OneSkillPicker />} />
    </div>
  )
}

/** A titled part of the settings surface: heading and fields, no frame of its own. */
function SettingsSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby={id} data-settings-section>
      <h3 id={id} className={TYPE.card}>{title}</h3>
      {children}
    </section>
  )
}

/** Everything the sentence does not say, on one surface: Evaluator, then Student. Only drawn once a model is chosen. */
function SettingsSurface({ p }: { p: ContextPage }) {
  const { m } = p
  const r = m.rule
  const props: SectionProps = { rule: r, setRule: m.setRule, issues: m.issues, showErrors: m.showErrors, settings: [], legendHidden: true, qualifyingInRule: true, countsFromInRule: true }
  // No defaults [REQ SC-02]: on first-time settings group check-off starts off, written into the draft so the switch, the save and
  // every later reading agree (the engine's model default would otherwise read an unset value as on). A saved rule is left as is.
  const unset = r.checkOff?.enabled == null
  React.useEffect(() => {
    if (!m.saved && unset) m.setRule((x) => ({ ...x, checkOff: { ...(x.checkOff ?? { enabled: null, levelIndex: null, score: null }), enabled: false } }))
  }, [m, unset])
  return (
    <Card className="min-w-0" data-settings-surface>
      <CardContent className="flex flex-col gap-6">
        <SettingsSection id="d-sec-evaluator" title="Evaluator">
          <OutcomesSection {...props} />
          <FeedbackToggle rule={r} setRule={m.setRule} />
          <GroupCheckOffSection rule={r} setRule={m.setRule} bare />
        </SettingsSection>
        <Separator />
        <SettingsSection id="d-sec-student" title="Student">
          <StudentFieldsField {...props} />
          <SelfRatingToggle rule={r} setRule={m.setRule} />
        </SettingsSection>
      </CardContent>
    </Card>
  )
}

/** The picker that holds the field a failed save named (fields in the cards are focused where they are). */
function slotOfIssue(i: RuleIssue): Slot | null {
  if (QUESTION_RULE_FIELDS.some((f) => i.field.startsWith(f)) || SCORED_RULE_FIELDS.some((f) => i.field.startsWith(f))) return "criterion"
  if (SIGNER_FIELDS.some((f) => i.field.startsWith(f))) return "signers"
  return null
}

export function AdminEvaluationSettingsD() {
  const [slot, setSlot] = React.useState<Slot | null>(null)
  return (
    <ContextSettingsFrame onIssue={(i) => setSlot(slotOfIssue(i))}>
      {(p) => (
        <div className="flex flex-col gap-6">
          <RuleSentence p={p} slot={slot} setSlot={setSlot} />
          {/* Progressive disclosure (D-L43): the rest appears once "how it's judged" is chosen, since every part of it depends on
              the model. One region: the settings surface and one preview beside it from 1200 px, under it below. */}
          {p.m.rule.model ? (
            <div className="grid items-start gap-6 min-[1200px]:grid-cols-[minmax(0,1fr)_25rem] min-[1800px]:grid-cols-[minmax(0,1fr)_32rem]" data-region="settings">
              <SettingsSurface p={p} />
              <aside className="min-w-0 min-[1200px]:sticky min-[1200px]:top-4" aria-label="Preview">
                <ProgramPreview draft={p.m.rule} />
              </aside>
            </div>
          ) : null}
        </div>
      )}
    </ContextSettingsFrame>
  )
}
