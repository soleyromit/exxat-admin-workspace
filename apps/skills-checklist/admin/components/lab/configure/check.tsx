"use client"

/**
 * Check, the last review before a configuration is saved, and the receipt the same page becomes after "Save configuration"
 * (decisions D-X31, D-X32; redesign 2026-10-27, Romit: "doesn't have proper hierarchy and layout, therefore causing lack of
 * understanding for selections that need to get done"). Check answers four questions, in this order of prominence:
 *   1. What still needs a decision or is wrong: each problem names its step and has Fix, which opens the exact field and
 *      comes back to Check; the evidence choice on a rule change is a decision too [REQ SC-18, AE-02].
 *   2. What did I choose: one group per step, label and value pairs, Edit per group [REQ SC-17, SC-19].
 *   3. Who it affects: a new skill reaches nobody until it is mapped (lists that would pick it up are named, D-X27); a skill in
 *      use shows the before and after counts with the students one click away [REQ AE-02].
 *   4. What people will see: the student and evaluator views, secondary [REQ SC-19, EV-03].
 * Three layouts of the same answers, one per option set: `sheet` (set 1, Guided: problems first, choices beside a sticky
 * aside), `checklist` (set 2, One page: a review table with a sticky decision panel) and `ledger` (set 3, Many at once: review
 * cards with the problem inside its card, problem cards first).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner as DsLocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { FormPage, StickyFooter } from "@/components/lab/layout"
import { affectedStudentLine, bulkImpact, checkGroups, openDecisions, saveBlockedReason, SECTIONS, type CheckGroup, type CheckRow, type Impact, type LabRule, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import { listsCarrying } from "@/lib/lab/lists"
import { MAPPING_LEVEL_LABEL } from "@/lib/v2/labels"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { shortDate } from "@/lib/v2/format"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import type { LibraryRow } from "@/lib/lab/library"
import type { Skill, V2State } from "@/lib/v2/types"
import { isConfigured } from "@/lib/v2/population"
import { AttemptExample, EvidenceChoice, ImpactSummary, WhoSees } from "./impact"
import { EvaluatorPreview, StudentPreview } from "./live-panel"
import { configureSkillHref, LIBRARY_HREF, libraryReturnHref, mappingHref, SkillTitle } from "./shell"
import type { SavedResult } from "./use-configure"

type StepId = CheckGroup["step"]

export type SummaryLayout = "sheet" | "checklist" | "ledger"

const stepLabel = (id: StepId) => SECTIONS.find((s) => s.id === id)?.label ?? ""
const things = (n: number) => `${n} ${n === 1 ? "thing" : "things"}`

export { openDecisions, saveBlockedReason }

/** The one readiness word on Check: amber "n to fix" or neutral "Ready to save". */
export function Readiness({ open }: { open: number }) {
  return open > 0 ? (
    <StatusBadge label={`${open} to fix`} tone="warning" icon="fa-triangle-exclamation" size="sm" />
  ) : (
    <StatusBadge label="Ready to save" tone="success" icon="fa-circle-check" size="sm" />
  )
}

/** Fix: opens the exact field, the step's primary then reads "Back to Check". */
function FixButton({ issue, onFix }: { issue: RuleIssue; onFix: (i: RuleIssue) => void }) {
  return (
    <Button type="button" variant="link" size="sm" className="h-auto shrink-0 p-0" onClick={() => onFix(issue)} aria-label={`Fix: ${issue.message}`}>
      Fix
    </Button>
  )
}

/**
 * Question 1 as the banner under the stepper (set 1): one row per problem, step name, what to do, Fix. Takes focus when the
 * list changes so the reader starts there.
 */
export function FixList({ issues, onFix, autoFocus = true }: { issues: RuleIssue[]; onFix: (i: RuleIssue) => void; autoFocus?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const key = issues.map((i) => i.id).join("|")
  React.useEffect(() => {
    if (key && autoFocus) ref.current?.focus()
  }, [key, autoFocus])
  if (issues.length === 0) return null
  return (
    <div ref={ref} id="cfg-issues" tabIndex={-1} className="@container outline-none" data-region="validation-summary" data-fix-list>
      <DsLocalBanner variant="error" title={`Fix ${things(issues.length)} before saving`}>
        <ul className="flex flex-col divide-y divide-border" aria-label="To fix">
          {issues.map((i) => (
            <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 py-1.5 @min-[40rem]:grid-cols-[11rem_minmax(0,1fr)_auto]">
              <span className="font-medium text-foreground">{stepLabel(i.section)}</span>
              <span className="col-start-1 text-foreground @min-[40rem]:col-start-2">{i.message}</span>
              <span className="col-start-2 row-span-2 row-start-1 self-center @min-[40rem]:col-start-3 @min-[40rem]:row-span-1">
                <FixButton issue={i} onFix={onFix} />
              </span>
            </li>
          ))}
        </ul>
      </DsLocalBanner>
    </div>
  )
}

/** Label and value pairs. A value still to choose reads as a gap (amber glyph, "Not chosen"), never as an answer. */
function Pairs({ rows, compact = false }: { rows: CheckRow[]; compact?: boolean }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-4 text-sm sm:grid-cols-[minmax(7rem,auto)_minmax(0,1fr)]", compact ? "gap-y-1" : "gap-y-2")}>
      {rows.map((r) => (
        <React.Fragment key={r.label}>
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="min-w-0 text-foreground">
            {r.missing ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--status-badge-warning-fg)]">
                <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />
                {r.value}
              </span>
            ) : (
              r.value
            )}
            {r.was ? <span className="block text-muted-foreground">{`Was: ${r.was}`}</span> : null}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  )
}

/**
 * Question 2. Without `onEdit` (the receipt) there is no Edit and no problem marking.
 * `sheet`: one card per step in a two-column grid. `checklist`: one review table, a row per step. `ledger`: one card per step,
 * each problem inside its card with Fix, cards with problems first.
 */
export function SetupSummary({ rule, current = null, issues = [], onEdit, onFix, layout = "sheet", headingId }: {
  rule: LabRule
  current?: LabRule | null
  issues?: RuleIssue[]
  onEdit?: (step: StepId) => void
  onFix?: (i: RuleIssue) => void
  layout?: SummaryLayout
  headingId?: string
}) {
  const groups = checkGroups(rule, current)
  const issuesOf = (step: StepId) => (onEdit ? issues.filter((i) => i.section === step) : [])
  const edit = (g: CheckGroup) =>
    onEdit ? (
      <Button type="button" variant="link" size="sm" className="h-auto shrink-0 p-0" onClick={() => onEdit(g.step)} aria-label={`Edit ${g.label.toLowerCase()}`}>
        Edit
      </Button>
    ) : null
  const toFix = (g: CheckGroup) => (issuesOf(g.step).length ? <StatusBadge label="To fix" tone="warning" icon="fa-triangle-exclamation" size="sm" /> : null)

  if (layout === "checklist") {
    return (
      <Table containerClassName="rounded-md border border-border" aria-labelledby={headingId} data-setup-summary="checklist">
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-28 sm:w-48">Step</TableHead>
            <TableHead scope="col">Your choices</TableHead>
            <TableHead scope="col" className="w-16 text-end">
              <span className="sr-only">Edit</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((g) => (
            <TableRow key={g.step} data-group={g.step} className="align-top">
              <TableCell className="whitespace-normal">
                <span className="flex flex-col items-start gap-1">
                  <span className="font-medium text-foreground">{g.label}</span>
                  {toFix(g)}
                </span>
              </TableCell>
              <TableCell className="whitespace-normal">
                <Pairs rows={g.rows} compact />
              </TableCell>
              <TableCell className="text-end">{edit(g)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const ordered = layout === "ledger" ? [...groups].sort((a, b) => Number(issuesOf(b.step).length > 0) - Number(issuesOf(a.step).length > 0)) : groups
  return (
    <div className={cn("grid grid-cols-1 gap-4 @min-[44rem]:grid-cols-2", layout === "ledger" && "items-start")} aria-labelledby={headingId} role="list" data-setup-summary={layout}>
      {ordered.map((g) => {
        const own = issuesOf(g.step)
        return (
          <Card key={g.step} size="sm" role="listitem" data-group={g.step} className={g.step === "signoff" && layout === "sheet" ? "@min-[44rem]:row-span-2" : undefined}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {g.label}
                {toFix(g)}
              </CardTitle>
              {onEdit ? <CardAction>{edit(g)}</CardAction> : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {layout === "ledger" && own.length && onFix ? (
                <ul className="flex flex-col gap-1.5" aria-label={`To fix in ${g.label.toLowerCase()}`} data-inline-issues>
                  {own.map((i) => (
                    <li key={i.id} className="flex items-baseline justify-between gap-3 text-sm text-[var(--status-badge-warning-fg)]">
                      <span className="inline-flex items-baseline gap-1.5">
                        <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />
                        {i.message}
                      </span>
                      <FixButton issue={i} onFix={onFix} />
                    </li>
                  ))}
                </ul>
              ) : null}
              <Pairs rows={g.rows} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/** Question 3 for a skill that is not configured yet: nobody is affected until it is mapped; name the lists that pick it up. */
function ReachesNobodyYet({ state, skill, saved = false }: { state: V2State; skill: Skill; saved?: boolean }) {
  const carriers = React.useMemo(() => listsCarrying(state, skill.id), [state, skill.id])
  return (
    <div className="flex flex-col gap-2" data-affects="not-configured">
      <p className="text-base font-medium text-foreground" data-figure>
        {saved ? "Ready to map to courses." : "Nobody yet. It reaches students once mapped."}
      </p>
      {carriers.length ? (
        <dl className="grid w-fit max-w-full grid-cols-[minmax(0,auto)_auto] gap-x-6 gap-y-1 text-sm" aria-label={`Groups of ${skillNounPlural()} that carry it`}>
          {carriers.map((c) => (
            <React.Fragment key={c.list.id}>
              <dt className="text-foreground">{`${c.list.name}${c.groups.length ? ` (${c.groups.join(", ")})` : ""}`}</dt>
              <dd className="text-muted-foreground">{`${MAPPING_LEVEL_LABEL[c.level]} in clinical courses`}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

/** Question 3. The evidence choice is asked separately, as a decision (EvidenceDecision). */
export function WhoItAffects({ state, skill, current, rule, impact, mode, lead = "counts" }: {
  state: V2State
  skill: Skill
  current: LabRule | null
  rule: LabRule
  impact: Impact | null
  mode: PublishMode | null
  /** "people" in a narrow column: the students grouped by the move they make first, the counts table one click away. */
  lead?: "counts" | "people"
}) {
  if (!current) return <ReachesNobodyYet state={state} skill={skill} />
  return (
    <div className="flex flex-col gap-4" data-affects="configured">
      <ImpactSummary current={current} impact={impact} lead={lead} expandPeople={false} />
      <AttemptExample rule={rule} impact={impact} />
      <WhoSees impact={mode === "new-only" ? null : impact} />
    </div>
  )
}

/** The evidence choice on a rule change, shown with the decisions, not inside the impact. */
export function EvidenceDecision({ mode, onMode, error, className }: { mode: PublishMode | null; onMode: (m: PublishMode) => void; error?: string; className?: string }) {
  return (
    <Card size="sm" className={className} data-decision="evidence">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          Decide before saving
          {mode ? null : <StatusBadge label="To fix" tone="warning" icon="fa-triangle-exclamation" size="sm" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EvidenceChoice value={mode} onChange={onMode} error={error} />
      </CardContent>
    </Card>
  )
}

/** A titled card on Check (question 3 or 4). */
export function CheckCard({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/** Question 4 in the side column: both views stacked, last on the page (secondary). */
export function PreviewCard({ skillName, rule }: { skillName: string; rule: LabRule }) {
  return (
    <CheckCard title="Preview">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2" aria-label="Student sees">
          <h4 className="text-sm font-medium text-foreground">Student sees</h4>
          <StudentPreview skillName={skillName} rule={rule} />
        </section>
        <section className="flex flex-col gap-2" aria-label="Evaluator sees">
          <h4 className="text-sm font-medium text-foreground">Evaluator sees</h4>
          <EvaluatorPreview skillName={skillName} rule={rule} />
        </section>
      </div>
    </CheckCard>
  )
}

/** Question 4: both views at once, side by side, built from the same rule (receipt, and Check on sets 2 and 3). */
export function PeopleSee({ skillName, rule, className }: { skillName: string; rule: LabRule; className?: string }) {
  const id = React.useId()
  return (
    <section aria-labelledby={`${id}-h`} className={cn("@container flex flex-col gap-3", className)} data-region="people-see">
      <h3 id={`${id}-h`} className="text-sm font-semibold text-foreground">
        Preview
      </h3>
      <div className="grid grid-cols-1 gap-4 @min-[40rem]:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-foreground">Student sees</h4>
          <StudentPreview skillName={skillName} rule={rule} />
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-foreground">Evaluator sees</h4>
          <EvaluatorPreview skillName={skillName} rule={rule} />
        </div>
      </div>
    </section>
  )
}

/** A titled block on Check or the receipt. */
export function CheckSection({ title, children, className, badge }: { title: string; children: React.ReactNode; className?: string; badge?: React.ReactNode }) {
  const hid = React.useId()
  return (
    <section aria-labelledby={hid} className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={hid} className="text-sm font-semibold text-foreground">
          {title}
        </h3>
        {badge}
      </div>
      {children}
    </section>
  )
}

/** True from `px` up; false on the server and the first paint. Used where one region must render once, not twice. */
export function useMinWidth(px: number): boolean {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`)
    const sync = () => setOn(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [px])
  return on
}

/**
 * Set 2's sticky decision panel: readiness, each problem with Fix, the evidence choice when asked, then who it affects.
 * Sits in the page's side column from 1280 px while Check is in view, inline above the review table below that.
 */
export function DecisionPanel({ issues, onFix, choiceAsked, mode, onMode, modeError, affects }: {
  issues: RuleIssue[]
  onFix: (i: RuleIssue) => void
  choiceAsked: boolean
  mode: PublishMode | null
  onMode: (m: PublishMode) => void
  modeError?: string
  affects: React.ReactNode
}) {
  const open = openDecisions(issues, choiceAsked, mode)
  const id = React.useId()
  return (
    <section aria-labelledby={`${id}-h`} className="flex flex-col gap-4" data-decision-panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`${id}-h`} className="text-sm font-semibold text-foreground">
          Before you save
        </h3>
        <Readiness open={open} />
      </div>
      {issues.length ? (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border" aria-label="To fix" data-fix-list>
          {issues.map((i) => (
            <li key={i.id} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-foreground">{stepLabel(i.section)}</span>
                <span className="text-foreground">{i.message}</span>
              </span>
              <FixButton issue={i} onFix={onFix} />
            </li>
          ))}
        </ul>
      ) : null}
      {choiceAsked ? <EvidenceChoice value={mode} onChange={onMode} error={modeError} /> : null}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h4 className="text-sm font-semibold text-foreground">Who it affects</h4>
        {affects}
      </div>
    </section>
  )
}

/** Set 3: one row per skill the rule goes to, with its status now and after saving and the students who change. */
export function ManyLedger({ state, ids, rule, saved = false }: { state: V2State; ids: string[]; rule: LabRule; saved?: boolean }) {
  const rows = React.useMemo(() => bulkImpact(state, ids, rule), [state, ids, rule])
  return (
    <Table containerClassName="max-h-96 overflow-y-auto rounded-md border border-border" scrollLabel={`What changes, per ${skillNoun()}`}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{skillNoun().charAt(0).toUpperCase() + skillNoun().slice(1)}</TableHead>
          <TableHead scope="col">{saved ? "Was" : "Now"}</TableHead>
          <TableHead scope="col">{saved ? "Now" : "After saving"}</TableHead>
          <TableHead scope="col" className="text-end">
            Students who change
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.skillId}>
            <TableCell className="whitespace-normal">{r.name}</TableCell>
            <TableCell>{r.configured ? "Configured" : "Not configured"}</TableCell>
            <TableCell>Configured</TableCell>
            <TableCell className="text-end tabular-nums">{r.configured ? r.changed : "None yet"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** The success banner at the top of the receipt; takes focus once so the outcome is read first. */
export function SavedBanner({ title, body }: { title: string; body: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    // The receipt opens at the top, so the title (now Configured) and the banner are read first.
    window.scrollTo({ top: 0 })
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <div ref={ref} tabIndex={-1} role="status" className="outline-none" data-saved>
      <LocalBanner variant="success" title={title}>
        {body}
      </LocalBanner>
    </div>
  )
}

/** The receipt's banner copy for one skill. */
export function savedCopy(skill: Skill, result: SavedResult): { title: string; body: string } {
  if (!result.written) return { title: `${skill.name} keeps its saved rule`, body: "Applying a rule to new evidence only is not decided yet, so nothing changed." }
  const n = result.impact.changed.length
  if (n > 0) return { title: `${skill.name} is configured`, body: `${n} ${n === 1 ? "student now sees" : "students now see"} what is left on it.` }
  return { title: `${skill.name} is configured`, body: "It can now be mapped to courses." }
}

/**
 * The receipt for one skill (the page after Save configuration): what was saved beside who it reaches, then the two views.
 */
export function ConfigureReceipt({ state, skill, result, layout }: { state: V2State; skill: Skill; result: SavedResult; layout: SummaryLayout }) {
  const first = result.impact.changed[0] ?? null
  return (
    <div className="@container flex flex-col gap-8" data-receipt data-written={result.written ? "true" : "false"} data-changed-count={result.impact.changed.length} data-gained-achieved={result.impact.gainedAchieved} data-lost-achieved={result.impact.lostAchieved}>
      <div className="grid grid-cols-1 gap-8 @min-[64rem]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <CheckSection title="What was saved">
          <SetupSummary rule={result.rule} layout={layout} />
        </CheckSection>
        <CheckSection title="Who it reaches">
          {result.impact.changed.length > 0 ? (
            <p className="rounded-md border border-border p-3 text-sm text-foreground" data-affected-line>
              {affectedStudentLine(skill.name, result.rule, first, shortDate(DEMO_TODAY))}
            </p>
          ) : (
            <ReachesNobodyYet state={state} skill={skill} saved />
          )}
        </CheckSection>
      </div>
      <PeopleSee skillName={skill.name} rule={result.rule} />
    </div>
  )
}

/**
 * The whole page after Save configuration, for every option set: the skill's title (status now Configured), the success banner,
 * the receipt and its footer. No stepper, no Close, no Back: there is nothing left to cancel.
 */
export function ConfigureReceiptPage({ state, skill, result, layout, nextSkill }: { state: V2State; skill: Skill; result: SavedResult; layout: SummaryLayout; nextSkill: LibraryRow | null }) {
  const copy = savedCopy(skill, result)
  // The same count as the library's Not configured tab (one definition, lib/v2/population.ts isConfigured), active skills only.
  const leftToConfigure = state.skills.filter((k) => k.active !== false && !isConfigured(k)).length
  return (
    <FormPage title={<SkillTitle state={state} skill={skill} />} banner={<SavedBanner title={copy.title} body={copy.body} />} footer={<ReceiptFooter skillIds={[skill.id]} nextSkill={nextSkill} left={leftToConfigure} />}>
      <ConfigureReceipt state={state} skill={skill} result={result} layout={layout} />
    </FormPage>
  )
}

/**
 * The receipt footer: everything is saved, so no Back and no Cancel. One primary, Done (back to the library with the skill open
 * and a banner), then Map to courses and, when one is left, the next skill that is not configured.
 */
export function ReceiptFooter({ skillIds, nextSkill, left }: { skillIds: string[]; nextSkill: LibraryRow | null; /** Skills still not configured [REQ IM-10]. */ left?: number }) {
  const one = skillIds.length === 1 ? skillIds[0]! : null
  return (
    <StickyFooter
      context={left ? `All changes saved. ${left} left to configure.` : "All changes saved."}
      primary={{ label: "Done", href: one ? libraryReturnHref(one, "saved") : `${LIBRARY_HREF}?saved=${skillIds.length}` }}
      secondary={[
        { label: "Map to courses", href: one ? mappingHref(one) : "/lab/admin/course-mapping" },
        ...(nextSkill ? [{ label: `Configure next ${skillNoun()}`, href: configureSkillHref(nextSkill.id) }] : []),
      ]}
    />
  )
}
