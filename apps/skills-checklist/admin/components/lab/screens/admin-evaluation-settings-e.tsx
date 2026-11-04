"use client"

/**
 * Evaluation settings, variant E: the journey (Proposed 2026-11-03, rework after Romit: "i don't see much of a difference").
 * One horizontal stage diagram across the page, in the order the work happens: Student logs, Evaluator rates, Admin approves
 * (optional, switched on the card) and Achieved. Each stage card carries its current values as chips (or Not set) and a small
 * drawing of that person's screen. Choosing a stage opens its settings below the diagram, one stage at a time, beside a larger
 * drawing of the same screen [REQ SC-17, SC-19]. The order says who does what and when; no helper text (D-L36).
 *
 * Regions: header with scope line, the journey, the open stage, footer. URL: ?stage=student|evaluator|achieved · ?state=loading.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { useUrlParams } from "@/components/lab/admin-a/parts"
import { FeedbackToggle, GroupCheckOffSection, OutcomesSection, RuleSection, SelfRatingToggle, SignersField, StudentFieldsField, type SectionProps } from "@/components/lab/configure/fields"
import {
  ContextSettingsFrame,
  CRITERIA_FIELDS,
  criterionValue,
  EvaluatorSketch,
  failsOn,
  LockedShape,
  MODEL_ICON,
  NEED_FIELDS,
  NotSet,
  previewRule,
  sampleName,
  SIGNER_FIELDS,
  STUDENT_FIELDS,
  StudentSketch,
  TimesNeededButton,
  useModelChoice,
  type ContextPage,
} from "@/components/lab/configure/program-context"
import { hasNeed, LAB_MODEL_LABEL, LAB_MODELS, MODEL_STEP_LABEL, ROLE_LABEL, type LabRule, type RuleIssue } from "@/lib/lab/configure"
import { countSkills } from "@/lib/lab/terms"

type StageId = "student" | "evaluator" | "achieved"
const isStage = (v: string | null): v is StageId => v === "student" || v === "evaluator" || v === "achieved"
const PANEL_ID = "e-stage"

const CHIP = "inline-flex h-6 max-w-full items-center truncate rounded-full border border-border bg-background px-2 text-xs text-foreground"

function Chip({ children }: { children: React.ReactNode }) {
  return <span className={CHIP}>{children}</span>
}

/** Values as chips; an unset value names what is missing ("Who signs", then Not set). */
function Chips({ values, warn }: { values: Array<string | { missing: string }>; warn?: boolean }) {
  return (
    <span className="flex min-h-6 flex-wrap gap-1">
      {values.map((v, i) =>
        typeof v === "string" ? (
          <Chip key={i}>{v}</Chip>
        ) : (
          <span key={i} className={cn(CHIP, "gap-1.5 border-dashed")}>
            <span className="text-foreground">{v.missing}</span>
            <NotSet warn={warn} />
          </span>
        ),
      )}
    </span>
  )
}

/** One stage of the journey: icon, name, its values as chips and a small drawing of that person's screen. */
function StageCard({ id, icon, title, chips, thumb, selected, onSelect, last, warn, action }: {
  id: string
  icon: string
  title: string
  chips: React.ReactNode
  thumb: React.ReactNode
  selected?: boolean
  onSelect?: () => void
  last?: boolean
  warn?: boolean
  action?: React.ReactNode
}) {
  return (
    <li className="relative flex min-w-0" data-stage={id}>
      <div
        onClick={onSelect}
        className={cn(
          "flex w-full min-w-0 flex-col gap-3 rounded-[var(--radius)] border bg-background p-3",
          onSelect && "cursor-pointer hover:border-foreground",
          selected ? "border-[var(--brand-color)] bg-[var(--brand-tint)]" : "border-border",
          warn && !selected && "border-[var(--status-badge-warning-fg)]",
        )}
      >
        <div className="flex h-8 items-center gap-2">
          <i className={cn("fa-light", icon, "text-muted-foreground")} aria-hidden="true" />
          <h3 id={`${id}-h`} className={cn(TYPE.group, "flex-1 truncate")}>{title}</h3>
          {action}
        </div>
        {chips}
        <div className="mt-auto" aria-hidden="true">{thumb}</div>
      </div>
      {last ? null : (
        <span className="absolute -end-8 top-1/2 hidden w-8 -translate-y-1/2 justify-center text-muted-foreground lg:flex" aria-hidden="true">
          <i className="fa-solid fa-arrow-right" />
        </span>
      )}
    </li>
  )
}

/** The reviewer's queue row, drawn: what an admin sees when approval is on. */
function ApprovalThumb({ on }: { on: boolean }) {
  if (!on) {
    return (
      <span className="flex h-16 items-center justify-center rounded-[var(--radius)] border border-dashed border-border text-xs text-muted-foreground">Skipped</span>
    )
  }
  return (
    <span className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-muted p-3">
      <span className="flex items-center justify-between gap-2">
        <span className="block h-2.5 w-20 rounded-full bg-border" />
        <span className="inline-flex h-6 items-center rounded-[var(--radius)] bg-foreground px-2 text-xs font-medium text-background">Approve</span>
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="block h-2.5 w-16 rounded-full bg-border" />
        <span className="inline-flex h-6 items-center rounded-[var(--radius)] border border-border bg-background px-2 text-xs text-foreground">Approve</span>
      </span>
    </span>
  )
}

/** The student's record, drawn: one dot per evaluation needed, then Achieved. */
function AchievedSketch({ rule, skillName, size = "sm" }: { rule: LabRule; skillName: string; size?: "sm" | "md" }) {
  const n = hasNeed(rule) ? Math.min(rule.need, 8) : 3
  return (
    <span role={size === "md" ? "img" : undefined} aria-label={size === "md" ? "Sample student record" : undefined} className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-muted p-3">
      <span className={cn("truncate font-medium text-foreground", size === "sm" ? "text-xs" : "text-sm")}>{skillName}</span>
      <span className="flex items-center gap-1.5">
        {Array.from({ length: n }).map((_, i) => (
          <span key={i} className={cn("block size-3 rounded-full border", hasNeed(rule) ? "border-foreground bg-foreground" : "border-dashed border-border")} />
        ))}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-foreground">
        <i className="fa-light fa-circle-check" aria-hidden="true" />
        {hasNeed(rule) ? `${rule.need} of ${rule.need}, Achieved` : "Achieved"}
      </span>
    </span>
  )
}

function ModelChoice({ p }: { p: ContextPage }) {
  const { onValue, confirm } = useModelChoice(p.m)
  const err = p.m.showErrors ? p.m.issues.find((i) => i.field === "cfg-model")?.message : undefined
  return (
    <div className="flex flex-col gap-2">
      <h3 className={TYPE.label}>{MODEL_STEP_LABEL}</h3>
      <RadioGroup id="cfg-model" tabIndex={-1} value={p.m.rule.model ?? ""} onValueChange={onValue} aria-label={MODEL_STEP_LABEL} aria-invalid={err ? true : undefined} aria-describedby={err ? "cfg-model-error" : undefined} className="grid gap-x-6 gap-y-2 outline-none sm:grid-cols-2">
        {LAB_MODELS.map((x) => (
          <div key={x} className="flex items-center gap-2">
            <RadioGroupItem id={`e-model-${x}`} value={x} />
            <Label htmlFor={`e-model-${x}`} className="font-normal">{LAB_MODEL_LABEL[x]}</Label>
            <span className={cn(TYPE.meta, "tabular-nums")}>{countSkills(p.facts.byModel[x])}</span>
          </div>
        ))}
      </RadioGroup>
      {err ? <FieldError id="cfg-model-error">{err}</FieldError> : null}
      {confirm}
    </div>
  )
}

function StagePanel({ stage, p }: { stage: StageId; p: ContextPage }) {
  const { m } = p
  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors: m.showErrors, settings: [], legendHidden: true }
  const rule = previewRule(p)
  const name = sampleName(p)
  const title = stage === "student" ? "Student logs" : stage === "evaluator" ? "Evaluator rates" : "Achieved"
  let controls: React.ReactNode
  let drawing: React.ReactNode
  if (stage === "student") {
    controls = (
      <>
        <StudentFieldsField {...props} />
        <SelfRatingToggle rule={m.rule} setRule={m.setRule} />
      </>
    )
    drawing = <StudentSketch rule={rule} skillName={name} />
  } else if (stage === "evaluator") {
    controls = (
      <>
        <ModelChoice p={p} />
        {m.rule.model ? <OutcomesSection {...props} /> : null}
        <SignersField {...props} />
        <FeedbackToggle rule={m.rule} setRule={m.setRule} />
        {m.rule.model ? <GroupCheckOffSection rule={m.rule} setRule={m.setRule} bare /> : null}
      </>
    )
    drawing = <EvaluatorSketch rule={rule} skillName={name} />
  } else {
    controls = m.rule.model ? (
      <>
        <RuleSection {...props} conditions={false} />
        <TimesNeededButton p={p} className="self-start" />
      </>
    ) : (
      <LockedShape after={MODEL_STEP_LABEL} parts={["number"]} />
    )
    drawing = <AchievedSketch rule={m.rule} skillName={name} size="md" />
  }
  return (
    <div id={PANEL_ID} role="region" aria-labelledby={`${PANEL_ID}-h`} className="flex flex-col gap-4 border-t border-border pt-6" data-region="stage">
      <h2 id={`${PANEL_ID}-h`} className={TYPE.section}>{title}</h2>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="flex min-w-0 flex-col gap-6">{controls}</div>
        <div className="hidden lg:block">
          <div className="sticky top-4 flex flex-col gap-2" role="group" aria-label="Preview">
            {drawing}
          </div>
        </div>
      </div>
    </div>
  )
}

function stageOfIssue(i: RuleIssue): StageId {
  if (i.section === "rule") return "achieved"
  if (STUDENT_FIELDS.some((f) => i.field.startsWith(f))) return "student"
  return "evaluator"
}

function Journey({ p, stage, setStage }: { p: ContextPage; stage: StageId; setStage: (s: StageId) => void }) {
  const { m } = p
  const r = m.rule
  const rule = previewRule(p)
  const name = sampleName(p)
  const fields = r.studentFields.map((f) => f.label.trim()).filter(Boolean)
  const edit = (id: StageId, title: string) => (
    <Button type="button" variant="ghost" size="sm" aria-label={`Edit ${title.toLowerCase()}`} aria-expanded={stage === id} aria-controls={PANEL_ID} onClick={(e) => { e.stopPropagation(); setStage(id) }}>
      Edit
    </Button>
  )
  return (
    <ol className="grid gap-4 lg:grid-cols-4 lg:gap-12" data-region="journey" aria-label="Who does what">
      <StageCard
        id="student"
        icon="fa-user-graduate"
        title="Student logs"
        selected={stage === "student"}
        onSelect={() => setStage("student")}
        warn={failsOn(m, STUDENT_FIELDS)}
        action={edit("student", "Student logs")}
        chips={<Chips values={[...(fields.length ? fields : ["Nothing to add"]), ...(r.selfEvaluation ? ["Rates themselves"] : [])]} />}
        thumb={<StudentSketch rule={rule} skillName={name} size="sm" />}
      />
      <StageCard
        id="evaluator"
        icon="fa-clipboard-check"
        title="Evaluator rates"
        selected={stage === "evaluator"}
        onSelect={() => setStage("evaluator")}
        warn={failsOn(m, ["cfg-model", ...CRITERIA_FIELDS.filter((f) => f !== "cfg-qrule" && f !== "cfg-srule"), ...SIGNER_FIELDS])}
        action={edit("evaluator", "Evaluator rates")}
        chips={
          <Chips
            warn={m.showErrors}
            values={[
              r.model ? LAB_MODEL_LABEL[r.model] : { missing: "Judged by" },
              ...(r.model ? [criterionValue(r) ?? { missing: "Counts" }] : []),
              r.evaluatorRoles.length ? r.evaluatorRoles.map((x) => ROLE_LABEL[x]).join(", ") : { missing: "Who signs" },
            ]}
          />
        }
        thumb={<EvaluatorSketch rule={rule} skillName={name} size="sm" />}
      />
      <StageCard
        id="approval"
        icon="fa-stamp"
        title="Admin approves"
        action={<ToggleSwitch id="e-approval" checked={r.approvalRequired} onChange={(v) => m.setRule((x) => ({ ...x, approvalRequired: v }))} aria-labelledby="approval-h" />}
        chips={<Chips values={[r.approvalRequired ? "On" : "Off"]} />}
        thumb={<ApprovalThumb on={r.approvalRequired} />}
      />
      <StageCard
        id="achieved"
        icon="fa-flag-checkered"
        title="Achieved"
        last
        selected={stage === "achieved"}
        onSelect={() => setStage("achieved")}
        warn={failsOn(m, [...NEED_FIELDS, "cfg-qrule", "cfg-srule"])}
        action={edit("achieved", "Achieved")}
        chips={<Chips warn={m.showErrors} values={[hasNeed(r) ? `${r.need} ${r.need === 1 ? "evaluation" : "evaluations"}` : { missing: "How many" }]} />}
        thumb={<AchievedSketch rule={r} skillName={name} />}
      />
    </ol>
  )
}

export function AdminEvaluationSettingsE() {
  const q = useUrlParams()
  const raw = q.get("stage")
  // Local state renders the stage at once (a failed save focuses a field inside it two frames later); the URL follows.
  const [stage, setStageState] = React.useState<StageId>(isStage(raw) ? raw : "evaluator")
  const setStage = (s: StageId) => {
    setStageState(s)
    q.set({ stage: s === "evaluator" ? null : s })
  }
  return (
    <ContextSettingsFrame onIssue={(i) => setStage(stageOfIssue(i))}>
      {(p) => (
        <div className="flex flex-col gap-6">
          <Journey p={p} stage={stage} setStage={setStage} />
          <StagePanel stage={stage} p={p} />
        </div>
      )}
    </ContextSettingsFrame>
  )
}
