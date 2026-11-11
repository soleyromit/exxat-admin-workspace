"use client"

/**
 * The two dialogs Evaluation settings and the Library edit panel share (map D3, D1a): Student adds and Preview. One component each, so the page and the panel say the same thing. They open at the
 * layer `FieldLayerContext` gives, which is what lets the panel use them above its sheet.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { holdSecondPress } from "@/components/lab/shared/focus"
import { useDialogDiscard } from "@/components/lab/shared/unsaved-guard"
import { FIELD_TYPE_LABEL, hasNeed, ruleSaysWhatCounts, studentNeedsSentence, type LabRule } from "@/lib/lab/configure"
import { plural } from "@/lib/v2/format"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { buildLibrary } from "@/lib/lab/library"
import { resolveRule, ruleNeedsQuestions, skillRuleOf, TIMES_MAX } from "@/lib/lab/program-settings"
import { useV2State } from "@/lib/v2/react"
import { StudentFieldsField, type SectionProps } from "./fields"
import { useFieldLayer, useFocusBack } from "./field-layer"
import { useFitToScroller } from "./settings-rows"
import { EvaluatorScreen, ExamplePicker, StudentScreen, evaluatorScreenText, studentScreenText, type Example } from "./program-preview"

export { useFocusBack }

/** Student adds: a summary with Edit fields, the dialog listing label, type and mandatory [REQ SC-13]. `labelled`: the row beside it already carries the words. */
export function StudentAddsRow({ rule, setRule, issues, showErrors, settings, error, labelled, heading = "Student adds", title = "What the student adds" }: SectionProps & { error?: string; labelled?: boolean; /** The setting's name above what it holds. */ heading?: string; /** The dialog's title: the same words as the row that opens it. */ title?: string }) {
  const layer = useFieldLayer()
  const [draft, setDraft] = React.useState<LabRule | null>(null)
  const summary = rule.studentFields.map((f) => `${f.label.trim()}, ${f.mandatory ? "required" : "optional"}`).join("; ") || "Nothing"
  const changed = !!draft && JSON.stringify(draft.studentFields) !== JSON.stringify(rule.studentFields)
  const guard = useDialogDiscard(changed, () => setDraft(null))
  const focus = useFocusBack()
  return (
    <div className="flex flex-col gap-1" data-student-adds>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="flex min-w-0 flex-col gap-0.5">
          {labelled ? null : <span className={TYPE.label}>{heading}</span>}
          <span className="text-sm text-muted-foreground">{summary}</span>
        </span>
        <Button id="cfg-edit-fields" type="button" variant="outline" size="sm" aria-describedby={error ? "cfg-edit-fields-error" : undefined} onClick={() => setDraft(rule)}>Edit fields</Button>
      </div>
      {error ? <FieldError id="cfg-edit-fields-error">{error}</FieldError> : null}
      {guard.question}
      <Dialog open={!!draft} onOpenChange={(o) => { if (!o) guard.close() }}>
        <DialogContent className={cn("flex max-h-[85dvh] flex-col sm:max-w-xl", layer.content)} overlayClassName={layer.content} data-fields-dialog {...focus}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">{`Fields the student fills in. ${Object.keys(FIELD_TYPE_LABEL).length} types.`}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {draft ? <StudentFieldsField inTitledDialog legend={title} rule={draft} setRule={(fn) => setDraft((d) => (d ? fn(d) : d))} issues={issues} showErrors={showErrors} settings={settings} /> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={guard.close}>Cancel</Button>
            <Button type="button" variant="default" size="sm" disabled={!changed} onClick={(e) => { holdSecondPress(e); if (draft) setRule((r) => ({ ...r, studentFields: draft.studentFields })); setDraft(null) }}>Save fields</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** With nothing to preview it looks unavailable and says why. Not the disabled attribute: that would take it out of the keyboard's way along with the reason. */
function PreviewButton({ ready, onOpen }: { ready: boolean; onOpen: () => void }) {
  if (ready) return <Button type="button" variant="outline" size="sm" onClick={onOpen}>Preview</Button>
  return (
    <Tip label="Choose how it is judged first.">
      <Button type="button" variant="outline" size="sm" aria-disabled className="cursor-not-allowed text-muted-foreground hover:bg-transparent hover:text-muted-foreground">Preview</Button>
    </Tip>
  )
}

/** The dialog itself: both sides of one skill under one rule. `head` sits above them: the page's Example picker. */
function PreviewFrame({ open, setOpen, title, rule, example, head }: { open: boolean; setOpen: (o: boolean) => void; title: string; rule: LabRule; example: Example; head?: React.ReactNode }) {
  const state = useV2State()
  const layer = useFieldLayer()
  const focus = useFocusBack()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={cn("flex max-h-[90dvh] flex-col sm:max-w-3xl", layer.content)} overlayClassName={layer.content} data-panel-preview {...focus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{`${evaluatorScreenText(rule, rule.evaluatorRoles, example.name)} ${studentScreenText(rule, example.name)}`}</DialogDescription>
        </DialogHeader>
        {head}
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2">
          <section className="flex min-w-0 flex-col gap-2" aria-label="Student view">
            <h3 className={TYPE.label}>Student</h3>
            <StudentScreen rule={rule} example={example} />
          </section>
          <section className="flex min-w-0 flex-col gap-2" aria-label="Evaluator view">
            <h3 className={TYPE.label}>Evaluator</h3>
            <EvaluatorScreen rule={rule} example={example} program={`${state.program.school} ${state.program.name}`} />
          </section>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** One skill's draft, from the panel. Closing keeps the draft [REQ SC-19]. */
export function PreviewDialog({ name, id, rule }: { name: string; id: string; rule: LabRule }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <PreviewButton ready={!!rule.model} onOpen={() => setOpen(true)} />
      {rule.model ? <PreviewFrame open={open} setOpen={setOpen} title={`Preview ${name}`} rule={rule} example={{ id, name, rule }} /> : null}
    </>
  )
}

/**
 * The program's draft, from Evaluation settings [REQ SC-19]: the same dialog, on a real library skill that takes these settings, as that skill would read them (its own number and questions stay). An
 * Edited skill keeps its own settings, so it is not offered.
 */
function useProgramExample(draft: LabRule, active: boolean) {
  const state = useV2State()
  const [pick, setPick] = React.useState<string | null>(null)
  const examples = React.useMemo<Example[]>(() => {
    if (!active) return []
    const skills = new Map(state.skills.map((k) => [k.id, k]))
    return buildLibrary(state).filter((r) => r.status !== "inactive" && skills.has(r.id) && !skills.get(r.id)!.edited).map((r) => ({ id: r.id, name: r.name, rule: skillRuleOf(skills.get(r.id)!) }))
  }, [active, state])
  const example = examples.find((x) => x.id === pick) ?? examples[0] ?? null
  const shown = React.useMemo<Example>(() => example ?? { id: "sample", name: "A skill", rule: null }, [example])
  const rule = React.useMemo(() => (draft.model ? resolveRule(draft, shown.rule) : draft), [draft, shown])
  const picker = example ? <ExamplePicker options={examples} value={example} onChange={setPick} /> : null
  return { rule, shown, picker, program: `${state.program.school} ${state.program.name}` }
}

export function ProgramPreviewDialog({ draft }: { draft: LabRule }) {
  const [open, setOpen] = React.useState(false)
  const { rule, shown, picker } = useProgramExample(draft, open)
  return (
    <>
      <PreviewButton ready={!!draft.model} onOpen={() => setOpen(true)} />
      {draft.model && open ? <PreviewFrame open={open} setOpen={setOpen} title="Preview" rule={rule} example={shown} head={picker ? <div>{picker}</div> : null} /> : null}
    </>
  )
}

/**
 * The same two forms as the Preview dialog, beside the settings from 1100 px, so the width is filled by what the settings produce (map D3, D-L5). Live from the draft, read only: the
 * forms are pictures (`Screen` is inert), with their text equivalents for a screen reader. The rule sentence leads, because it is what the settings add up to [REQ SC-17, SC-19].
 */
export function ProgramPreviewPanel({ draft, onClose }: { draft: LabRule; /** The page says the rule once, above; a panel opened from a button adds the way to close it. */ onClose?: () => void }) {
  const { rule, shown, picker, program } = useProgramExample(draft, true)
  const [who, setWho] = React.useState("student")
  return (
    <section className="sticky top-4 flex max-h-[calc(100dvh-7rem)] min-w-0 flex-col gap-3 border-s border-border ps-6" aria-labelledby="cfg-preview-title" data-preview-panel>
      <div className="flex items-center justify-between gap-2">
        <h2 id="cfg-preview-title" className={TYPE.section}>What they will see</h2>
        {onClose ? <Button type="button" variant="ghost" size="icon-sm" aria-label="Close preview" onClick={onClose}><i className="fa-light fa-xmark" aria-hidden="true" /></Button> : null}
      </div>
      {!draft.model ? <p className={TYPE.helper}>{`Choose how ${skillNounPlural()} are judged first.`}</p> : (
        <>
          {!onClose && hasNeed(draft) && draft.need <= TIMES_MAX && ruleSaysWhatCounts(draft) ? <p className={TYPE.label} data-rule-sentence>{studentNeedsSentence(draft)}</p> : null}
          <Tabs value={who} onValueChange={setWho} className="flex min-h-0 flex-1 flex-col gap-3">
            <TabsList variant="line" ariaLabel="What they will see">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="evaluator">Evaluator</TabsTrigger>
            </TabsList>
            {/* A long form scrolls inside the panel, so the panel stays in view beside the settings. */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
              {picker ? <div>{picker}</div> : null}
              <TabsContent value="student" className="mt-0">
                <p className="sr-only">{studentScreenText(rule, shown.name)}</p>
                <StudentScreen rule={rule} example={shown} />
              </TabsContent>
              <TabsContent value="evaluator" className="mt-0">
                <p className="sr-only">{evaluatorScreenText(rule, rule.evaluatorRoles, shown.name)}</p>
                <EvaluatorScreen rule={rule} example={shown} program={program} />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}
    </section>
  )
}

/** The rule sentence for one skill, as far as it exists [REQ SC-17]: a number that cannot be saved stays out of it. Under Not configured (b) only the count. */
export function SkillRuleSentence({ rule, className }: { rule: LabRule; className?: string }) {
  if (!rule.model || !hasNeed(rule) || rule.need > TIMES_MAX) return null
  if (ruleNeedsQuestions(rule)) return <p className={className ?? TYPE.label} data-rule-sentence>{`Student needs ${plural(rule.need, "evaluation", "evaluations")}.`}</p>
  return ruleSaysWhatCounts(rule) ? <p className={className ?? TYPE.label} data-rule-sentence>{studentNeedsSentence(rule)}</p> : null
}

/**
 * One skill's two forms beside the form (map D1c) [REQ SC-19]: the rule sentence, Student and Evaluator tabs, and a muted tray so the fields read as a picture rather than as more to fill in. Live from the draft, read only. With no model, or a model short of questions, one line says what comes first.
 */
export function SkillPreviewPanel({ id, name, rule, sentence = true }: { id: string; name: string; rule: LabRule; /** The page states the rule above its cards: the panel does not say it again. */ sentence?: boolean }) {
  const state = useV2State()
  const [who, setWho] = React.useState("student")
  const example = React.useMemo<Example>(() => ({ id, name, rule }), [id, name, rule])
  const ready = !!rule.model && !ruleNeedsQuestions(rule)
  const fitted = useFitToScroller<HTMLElement>()
  return (
    <section ref={fitted} className="sticky top-4 flex min-w-0 flex-col gap-3 border-s border-border ps-6" aria-labelledby="cfg-preview-title" data-preview-panel>
      <h2 id="cfg-preview-title" className={TYPE.section}>What they will see</h2>
      {sentence ? <SkillRuleSentence rule={rule} /> : null}
      {!rule.model ? <p className={TYPE.helper} data-preview-line>{`Choose how this ${skillNoun()} is judged first.`}</p> : null}
      {rule.model && !ready ? <p className={TYPE.helper} data-preview-line>Add questions to see the evaluator&apos;s form.</p> : null}
      {ready ? (
        <Tabs value={who} onValueChange={setWho} className="flex min-h-0 flex-1 flex-col gap-3">
          <TabsList variant="line" ariaLabel="What they will see">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="evaluator">Evaluator</TabsTrigger>
          </TabsList>
          {/* A long form scrolls inside the tray, so the panel stays in view beside the form. Focusable, since a keyboard can reach nothing else inside it. */}
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[var(--radius)] bg-muted p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="group" aria-label={who === "student" ? "Student form, read only" : "Evaluator form, read only"} data-preview-tray>
            <TabsContent value="student" className="mt-0">
              <p className="sr-only">{studentScreenText(rule, name)}</p>
              <StudentScreen condensed rule={rule} example={example} />
            </TabsContent>
            <TabsContent value="evaluator" className="mt-0">
              <p className="sr-only">{evaluatorScreenText(rule, rule.evaluatorRoles, name)}</p>
              <EvaluatorScreen rule={rule} example={example} program={`${state.program.school} ${state.program.name}`} />
            </TabsContent>
          </div>
        </Tabs>
      ) : null}
    </section>
  )
}
