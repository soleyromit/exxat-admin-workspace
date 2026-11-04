"use client"

/**
 * Evaluation settings, variant F: edit on the form (Proposed 2026-11-03, rework after Romit: "i don't see much of a difference").
 * The page is two large live drawings, what the evaluator gets and what the student gets. Every part that a setting controls is an
 * editable region: an outline on hover, a pen button (keyboard), and a popover with that one setting's control. Before a way of
 * judging is chosen, the evaluator drawing holds an empty slot, "Choose how skills are judged" [REQ SC-02]. No settings column and
 * no helper text (D-L36) [REQ SC-17, SC-19].
 *
 * Regions: header with scope line, the two drawings, footer. URL: ?state=loading.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { ApprovalToggle, FeedbackToggle, GroupCheckOffSection, OutcomesSection, RuleSection, SelfRatingToggle, SignersField, StudentFieldsField, type SectionProps } from "@/components/lab/configure/fields"
import {
  ContextSettingsFrame,
  CRITERIA_FIELDS,
  failsOn,
  MODEL_ICON,
  NEED_FIELDS,
  NotSet,
  Pills,
  sampleName,
  SIGNER_FIELDS,
  STUDENT_FIELDS,
  TimesNeededButton,
  useModelChoice,
  WARN_TEXT,
  type ContextPage,
} from "@/components/lab/configure/program-context"
import { countingLevels, CRITERIA_LABEL, hasNeed, LAB_MODEL_LABEL, LAB_MODELS, MODEL_STEP_LABEL, ROLE_LABEL, ruleAllowsCheckOff, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { countSkills, skillNounPlural } from "@/lib/lab/terms"

type RegionId = "judged" | "criterion" | "signers" | "feedback" | "checkoff" | "need" | "fields" | "self" | "approval"

const WARN_BORDER = "border-[var(--status-badge-warning-fg)]"

/**
 * One editable part of a drawing: the drawn content, a pen button (named for the setting) and a popover with that setting's control.
 * The whole region opens on click; the pen button is the keyboard path.
 */
function EditRegion({ id, label, open, onOpenChange, warn, editor, children, className, wide }: {
  id: RegionId
  label: string
  open: boolean
  onOpenChange: (o: boolean) => void
  warn?: boolean
  editor: React.ReactNode
  children: React.ReactNode
  className?: string
  wide?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div
          ref={ref}
          data-edit-region={id}
          onClick={() => onOpenChange(true)}
          className={cn(
            "group relative cursor-pointer rounded-[var(--radius)] border border-dashed border-transparent p-2 pe-10 transition-colors hover:border-foreground hover:bg-background focus-within:border-foreground",
            open && "border-solid border-[var(--brand-color)] bg-background",
            warn && !open && WARN_BORDER,
            className,
          )}
        >
          {children}
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${label.toLowerCase()}`} className="absolute end-1 top-1" onClick={(e) => e.stopPropagation()}>
              <i className={cn("fa-light fa-pen", warn ? WARN_TEXT : "text-muted-foreground")} aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        className={cn("flex max-h-[70vh] flex-col gap-4 overflow-auto p-4", wide ? "w-[min(36rem,calc(100vw-2rem))]" : "w-80")}
        aria-label={label}
        onInteractOutside={(e) => {
          // A click on the region itself keeps the popover open (it would close, then reopen).
          if (ref.current && e.target instanceof Node && ref.current.contains(e.target)) e.preventDefault()
        }}
      >
        <h3 className={TYPE.group}>{label}</h3>
        {editor}
        <Button type="button" variant="outline" size="sm" className="self-end" onClick={() => onOpenChange(false)}>Done</Button>
      </PopoverContent>
    </Popover>
  )
}

function ModelEditor({ p }: { p: ContextPage }) {
  const { onValue, confirm } = useModelChoice(p.m)
  const err = p.m.showErrors ? p.m.issues.find((i) => i.field === "cfg-model")?.message : undefined
  return (
    <div className="flex flex-col gap-2">
      <RadioGroup id="cfg-model" tabIndex={-1} value={p.m.rule.model ?? ""} onValueChange={onValue} aria-label={MODEL_STEP_LABEL} aria-invalid={err ? true : undefined} aria-describedby={err ? "cfg-model-error" : undefined} className="grid gap-2 outline-none">
        {LAB_MODELS.map((x) => (
          <div key={x} className="flex items-center gap-3">
            <RadioGroupItem id={`f-model-${x}`} value={x} />
            <i className={`fa-light ${MODEL_ICON[x]} text-muted-foreground`} aria-hidden="true" />
            <Label htmlFor={`f-model-${x}`} className="flex-1 font-normal">{LAB_MODEL_LABEL[x]}</Label>
            <span className={cn(TYPE.meta, "tabular-nums")}>{countSkills(p.facts.byModel[x])}</span>
          </div>
        ))}
      </RadioGroup>
      {err ? <FieldError id="cfg-model-error">{err}</FieldError> : null}
      {confirm}
    </div>
  )
}

/** What the evaluator taps, drawn from the rule: outcomes, levels (counting ones ticked), or questions with Yes/No or a scale. */
function DrawnJudgement({ rule }: { rule: LabRule }) {
  const m = rule.model
  if (m === "binary") {
    const labels = rule.outcomeLabels.map((x, i) => x.trim() || (i === 0 ? "First outcome" : "Second outcome"))
    return <Pills labels={labels} on={rule.qualifyingLabel === null ? [] : [rule.qualifyingLabel]} />
  }
  if (m === "demonstration") {
    const counting = new Set(countingLevels(rule))
    const levels = rule.levels.map((l, i) => l.trim() || `Level ${i + 1}`)
    return (
      <span className="flex flex-col gap-1.5">
        {[...levels].reverse().map((l, i) => (
          <span key={i} className="flex items-center gap-2 text-sm text-foreground">
            <i className={cn("fa-light", counting.has(l) ? "fa-circle-check" : "fa-circle")} aria-hidden="true" />
            <span className={cn(counting.has(l) && "font-medium")}>{l}</span>
          </span>
        ))}
      </span>
    )
  }
  const qs = rule.questions.map((q, i) => q.trim() || `Question ${i + 1}`)
  return (
    <span className="flex flex-col gap-2">
      {qs.slice(0, 5).map((q, i) => (
        <span key={i} className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm text-foreground">{`${i + 1}. ${q}`}</span>
          {m === "question" ? (
            <Pills labels={["Yes", "No"]} nowrap />
          ) : (
            <span className="flex shrink-0 gap-0.5">
              {Array.from({ length: Math.min(rule.scaleMax || 5, 10) }).map((_, k) => (
                <span key={k} className="inline-flex size-6 items-center justify-center rounded-[var(--radius)] border border-border bg-background text-xs tabular-nums text-foreground">{k + 1}</span>
              ))}
            </span>
          )}
        </span>
      ))}
      {qs.length > 5 ? <span className={TYPE.meta}>{`${qs.length - 5} more`}</span> : null}
    </span>
  )
}

const Box = ({ className }: { className?: string }) => <span aria-hidden="true" className={cn("block h-8 rounded-[var(--radius)] border border-border bg-background", className)} />

function EvaluatorForm({ p, region, setRegion }: { p: ContextPage; region: RegionId | null; setRegion: (r: RegionId | null) => void }) {
  const { m } = p
  const r = m.rule
  const props: SectionProps = { rule: r, setRule: m.setRule, issues: m.issues, showErrors: m.showErrors, settings: [], legendHidden: true }
  const ctl = (id: RegionId) => ({ open: region === id, onOpenChange: (o: boolean) => setRegion(o ? id : null) })
  const modelWarn = failsOn(m, ["cfg-model"])
  return (
    <div className="flex flex-col gap-3">
      <span className="text-base font-semibold text-foreground">{sampleName(p)}</span>
      <EditRegion id="signers" label="Who can sign off" warn={failsOn(m, SIGNER_FIELDS)} editor={<SignersField {...props} />} {...ctl("signers")}>
        <span className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Signed by</span>
          {r.evaluatorRoles.length ? <span className="font-medium text-foreground">{r.evaluatorRoles.map((x) => ROLE_LABEL[x]).join(", ")}</span> : <NotSet warn={failsOn(m, SIGNER_FIELDS)} />}
        </span>
      </EditRegion>
      {r.model ? (
        <>
          <EditRegion id="judged" label={MODEL_STEP_LABEL} editor={<ModelEditor p={p} />} {...ctl("judged")}>
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <i className={`fa-light ${MODEL_ICON[r.model]} text-muted-foreground`} aria-hidden="true" />
              {LAB_MODEL_LABEL[r.model]}
            </span>
          </EditRegion>
          <EditRegion id="criterion" label={CRITERIA_LABEL} wide warn={failsOn(m, CRITERIA_FIELDS.filter((f) => f !== "cfg-qrule" && f !== "cfg-srule"))} editor={<OutcomesSection {...props} />} {...ctl("criterion")} className="min-h-24">
            <DrawnJudgement rule={r} />
          </EditRegion>
        </>
      ) : (
        <EditRegion id="judged" label={MODEL_STEP_LABEL} warn={modelWarn} editor={<ModelEditor p={p} />} {...ctl("judged")} className={cn("border-dashed border-border", modelWarn && WARN_BORDER)}>
          <span className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
            <i className={cn("fa-light fa-square-dashed text-xl", modelWarn ? WARN_TEXT : "text-muted-foreground")} aria-hidden="true" />
            <span className={cn("text-sm font-medium", modelWarn ? WARN_TEXT : "text-foreground")}>{`Choose how ${skillNounPlural()} are judged`}</span>
          </span>
        </EditRegion>
      )}
      <EditRegion id="feedback" label="Feedback" editor={<FeedbackToggle rule={r} setRule={m.setRule} />} {...ctl("feedback")}>
        <span className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">{r.feedbackRequired ? "Feedback (required)" : "Feedback (optional)"}</span>
          <Box className="h-14" />
        </span>
      </EditRegion>
      {r.model ? (
        <EditRegion id="checkoff" label="Group check-off" editor={<GroupCheckOffSection rule={r} setRule={m.setRule} bare />} {...ctl("checkoff")}>
          <span className="flex items-center gap-2 text-sm">
            <i className="fa-light fa-users" aria-hidden="true" />
            <span className="text-foreground">Group check-off</span>
            <span className="font-medium text-foreground">{ruleAllowsCheckOff(r) ? "On" : "Off"}</span>
          </span>
        </EditRegion>
      ) : null}
      <span aria-hidden="true" className="ms-auto inline-flex h-8 items-center rounded-[var(--radius)] bg-foreground px-3 text-sm font-medium text-background">Sign and submit</span>
    </div>
  )
}

function StudentForm({ p, region, setRegion }: { p: ContextPage; region: RegionId | null; setRegion: (r: RegionId | null) => void }) {
  const { m } = p
  const r = m.rule
  const props: SectionProps = { rule: r, setRule: m.setRule, issues: m.issues, showErrors: m.showErrors, settings: [], legendHidden: true }
  const ctl = (id: RegionId) => ({ open: region === id, onOpenChange: (o: boolean) => setRegion(o ? id : null) })
  const fields = r.studentFields.filter((f) => f.label.trim())
  const needWarn = failsOn(m, [...NEED_FIELDS, "cfg-qrule", "cfg-srule"])
  return (
    <div className="flex flex-col gap-3">
      <span className="text-base font-semibold text-foreground">{sampleName(p)}</span>
      <EditRegion
        id="need"
        label="How many evaluations"
        wide
        warn={needWarn}
        editor={
          r.model ? (
            <>
              <RuleSection {...props} conditions={false} />
              <TimesNeededButton p={p} className="self-start" />
            </>
          ) : (
            <p className={TYPE.helper}>{`After ${MODEL_STEP_LABEL.toLowerCase()}`}</p>
          )
        }
        {...ctl("need")}
      >
        <span className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: hasNeed(r) ? Math.min(r.need, 8) : 3 }).map((_, i) => (
              <span key={i} className={cn("block size-3 rounded-full border", hasNeed(r) ? "border-foreground" : "border-dashed border-border")} />
            ))}
          </span>
          {hasNeed(r) ? <span className="text-sm tabular-nums text-foreground">{`0 of ${r.need}`}</span> : <span className="flex items-center gap-1 text-sm"><span className="text-foreground">0 of</span><NotSet warn={needWarn} /></span>}
        </span>
      </EditRegion>
      <EditRegion id="fields" label="What the student adds" wide warn={failsOn(m, STUDENT_FIELDS)} editor={<StudentFieldsField {...props} />} {...ctl("fields")}>
        <span className="flex flex-col gap-2">
          {fields.length ? fields.map((f, i) => (
            <span key={i} className="flex flex-col gap-1">
              <span className="text-sm text-foreground">{f.mandatory ? f.label.trim() : `${f.label.trim()} (optional)`}</span>
              <Box />
            </span>
          )) : <span className="text-sm text-muted-foreground">Nothing to add</span>}
        </span>
      </EditRegion>
      <EditRegion id="self" label="Student rates themselves first" editor={<SelfRatingToggle rule={r} setRule={m.setRule} />} {...ctl("self")}>
        <span className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm">
            <span className="text-foreground">Own rating</span>
            <span className="font-medium text-foreground">{r.selfEvaluation ? "On" : "Off"}</span>
          </span>
          {r.selfEvaluation ? (r.model === "demonstration" && r.levels.some((l) => l.trim()) ? <Pills labels={r.levels.map((l, i) => l.trim() || `Level ${i + 1}`)} /> : <Box />) : null}
        </span>
      </EditRegion>
      <span aria-hidden="true" className="ms-auto inline-flex h-8 items-center rounded-[var(--radius)] bg-foreground px-3 text-sm font-medium text-background">Ask for sign-off</span>
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className={TYPE.meta}>After the evaluator signs</span>
        <EditRegion id="approval" label="Approval before it counts" editor={<ApprovalToggle rule={r} setRule={m.setRule} />} {...ctl("approval")}>
          {r.approvalRequired ? (
            <StatusBadge label="Awaiting approval" tone="info" icon="fa-hourglass-half" size="md" />
          ) : (
            <StatusBadge label="Counted" tone="success" icon="fa-circle-check" size="md" />
          )}
        </EditRegion>
      </div>
    </div>
  )
}

function regionOfIssue(i: RuleIssue): RegionId {
  if (i.field === "cfg-model") return "judged"
  if (i.section === "outcomes") return "criterion"
  if (i.section === "rule") return "need"
  if (STUDENT_FIELDS.some((f) => i.field.startsWith(f))) return "fields"
  return "signers"
}

export function AdminEvaluationSettingsF() {
  const [region, setRegion] = React.useState<RegionId | null>(null)
  return (
    <ContextSettingsFrame onIssue={(i) => setRegion(regionOfIssue(i))}>
      {(p) => (
        <div className="grid gap-6 lg:grid-cols-2" data-layout="on-the-form">
          <Card data-region="evaluator-preview" role="group" aria-label="Evaluator form preview">
            <CardHeader>
              <CardTitle className={TYPE.card}>What the evaluator gets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-[var(--radius)] bg-muted p-4">
                <EvaluatorForm p={p} region={region} setRegion={setRegion} />
              </div>
            </CardContent>
          </Card>
          <Card data-region="student-preview" role="group" aria-label="Student request preview">
            <CardHeader>
              <CardTitle className={TYPE.card}>What the student gets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-[var(--radius)] bg-muted p-4">
                <StudentForm p={p} region={region} setRegion={setRegion} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ContextSettingsFrame>
  )
}
