"use client"

/**
 * Rule-change impact pieces for Check and the rule impact pages [REQ SC-19, AE-02; strategy 03 section 9]: one headline figure,
 * the before and after counts, the students grouped by the move they make with what they share said ONCE (J7), and the open
 * choice of how evidence already held is treated (PENDING-ROMIT AE-02 versus option B: nothing preselected, marked "Decision
 * pending"). Check itself and the receipt after "Save configuration" live in ./check.tsx (decisions D-X31, D-X32).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { FieldError, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import {
  attemptLine,
  computeImpact,
  partSentence,
  fromV2,
  groupImpact,
  groupReason,
  RECORD_STATES,
  STATE_SPEC,
  type Impact,
  type ImpactGroup,
  type LabRule,
  type PublishMode,
} from "@/lib/lab/configure"
import { studentHref } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { skillNoun } from "@/lib/lab/terms"
import type { Skill, V2State } from "@/lib/v2/types"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"
import { fmt } from "@/lib/v2/format"
import { StateBadge } from "./live-panel"

const NONE = fromV2({ model: null, config: null })

export function useLiveImpact(state: V2State, skill: Skill | undefined, current: LabRule | null, rule: LabRule): Impact | null {
  return React.useMemo(() => (skill && rule.model ? computeImpact(state, skill.id, current ?? NONE, rule, "reapply") : null), [state, skill, current, rule])
}

/** The evidence choice is asked only when a saved rule changes who qualifies and someone has evidence [REQ AE-02, AE-06]. */
export const needsEvidenceChoice = (current: LabRule | null, impact: Impact | null) => !!current && !!impact?.ruleChanged && impact.withEvidence > 0

/** One figure (wizard budget): the headline above the table. */
export function impactHeadline(current: LabRule | null, impact: Impact | null): string {
  if (!current) return "Not configured yet, so saving changes nobody's status."
  if (!impact || impact.withEvidence === 0) return "No evidence recorded yet, so saving changes nobody's status."
  if (!impact.ruleChanged || impact.changed.length === 0) return "Nobody's status changes."
  return `${fmt(impact.changed.length)} of ${fmt(impact.withEvidence)} students with evidence change status.`
}

function changeWord(n: number): string {
  if (n === 0) return "No change"
  return n > 0 ? `${n} more` : `${-n} fewer`
}

export function ImpactTable({ impact }: { impact: Impact }) {
  return (
    <Table containerClassName="rounded-md border border-border" scrollLabel="Status now and after saving">
      <TableCaption className="sr-only">{`Students by status on this ${skillNoun()}, now and after saving. ${impact.students} students.`}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="text-end">
            Now
          </TableHead>
          <TableHead scope="col" className="text-end">
            After
          </TableHead>
          <TableHead scope="col" className="text-end">
            Change
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {RECORD_STATES.map((st) => {
          const d = impact.after[st] - impact.before[st]
          const fall = st === "achieved" && d < 0
          return (
            <TableRow key={st}>
              <TableCell>
                <StateBadge state={st} />
              </TableCell>
              <TableCell className="text-end tabular-nums">{impact.before[st]}</TableCell>
              <TableCell className="text-end font-medium tabular-nums">{impact.after[st]}</TableCell>
              <TableCell className="text-end tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  {fall ? <i className="fa-light fa-triangle-exclamation text-[var(--status-badge-warning-fg)]" aria-hidden="true" /> : null}
                  {changeWord(d)}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

/**
 * The students in one move. When their needs differ, rows are split under one header row per combination of needs, so a reason
 * is printed once per combination and never once per student (J7).
 */
function GroupStudents({ g }: { g: ImpactGroup }) {
  const split = g.parts.length > 1
  return (
    <Table containerClassName="max-h-80 overflow-y-auto rounded-md border border-border" scrollLabel={`Students moving from ${STATE_SPEC[g.from].label} to ${STATE_SPEC[g.to].label}`}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Student</TableHead>
          <TableHead scope="col">Cohort</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {g.parts.map((p) => (
          <React.Fragment key={p.gaps.map((x) => x.key).join("|") || "none"}>
            {split ? (
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead scope="colgroup" colSpan={2} className="h-9 text-sm font-medium text-foreground">
                  {partSentence(p)}
                </TableHead>
              </TableRow>
            ) : null}
            {p.rows.map((r) => (
              <TableRow key={r.studentId}>
                <TableCell>
                  <Link className={LINK} href={studentHref(EMPTY_SCOPE, r.studentId)}>
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.cohort}</TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  )
}

/** Students grouped by move. The reason they share is said once per group, never per row (defect J7). */
export function ImpactGroups({ impact, expanded = false }: { impact: Impact; expanded?: boolean }) {
  const groups = React.useMemo(() => groupImpact(impact), [impact])
  if (groups.length === 0) return null
  return (
    <div className="flex flex-col gap-4" data-impact-groups>
      {groups.map((g) => (
        <ImpactGroupBlock key={`${g.from}>${g.to}`} g={g} expanded={expanded} />
      ))}
    </div>
  )
}

function ImpactGroupBlock({ g, expanded }: { g: ImpactGroup; expanded: boolean }) {
  const [open, setOpen] = React.useState(expanded)
  const id = `cfg-move-${g.from}-${g.to}`
  const n = g.rows.length
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2" data-transition={`${g.from}>${g.to}`} data-transition-count={n}>
      <h3 id={id} className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
        <StateBadge state={g.from} />
        <i className="fa-light fa-arrow-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">to</span>
        <StateBadge state={g.to} />
        <span className="tabular-nums text-muted-foreground">{`${n} ${n === 1 ? "student" : "students"}`}</span>
      </h3>
      {/* Open and split, the header rows in the table carry each reason; the sentence would say them twice. */}
      {open && g.parts.length > 1 ? null : (
        <p className="text-sm text-foreground" data-tie>
          {groupReason(g)}
        </p>
      )}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-expanded={open}>
            {open ? `Hide the ${n} ${n === 1 ? "student" : "students"}` : `Show the ${n} ${n === 1 ? "student" : "students"}`}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <GroupStudents g={g} />
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}

/** The open choice. Neither option is preselected; saving asks for it explicitly. */
export function EvidenceChoice({ value, onChange, error }: { value: PublishMode | null; onChange: (m: PublishMode) => void; error?: string }) {
  // The open decision (D-X27) is a lab note only (screens.json); the product shows the two options, never a "pending" label.
  return (
    <FieldSet className="flex flex-col gap-3" data-pending-choice>
      <FieldLegend variant="label" className="mb-0">
        Evidence already held
      </FieldLegend>
      <RadioGroup
        id="cfg-mode"
        tabIndex={-1}
        value={value ?? ""}
        onValueChange={(v) => onChange(v as PublishMode)}
        className="flex flex-col gap-3 outline-none"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "cfg-mode-error" : undefined}
      >
        <div className="flex items-start gap-2">
          <RadioGroupItem id="cfg-mode-reapply" value="reapply" className="mt-0.5" />
          <div className="flex flex-col">
            <Label htmlFor="cfg-mode-reapply">Re-evaluate it now</Label>
            <span className="text-sm text-muted-foreground">Status is recalculated now.</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <RadioGroupItem id="cfg-mode-new" value="new-only" className="mt-0.5" />
          <div className="flex flex-col">
            <Label htmlFor="cfg-mode-new">Apply to new evidence only</Label>
            <span className="text-sm text-muted-foreground">Status stays; later evaluations use it.</span>
          </div>
        </div>
      </RadioGroup>
      {error ? <FieldError id="cfg-mode-error">{error}</FieldError> : null}
    </FieldSet>
  )
}

export const EVIDENCE_CHOICE_MISSING = "Choose how evidence already held is treated."

/**
 * Impact for one skill: headline, then counts or people first. `lead="counts"` opens on the before and after table with the
 * groups folded; `lead="people"` opens on the groups with their students listed and folds the table.
 */
export function ImpactSummary({ current, impact, lead = "counts", expandPeople = true }: { current: LabRule | null; impact: Impact | null; lead?: "counts" | "people"; /** False keeps each group's students one click away (Check side column). */ expandPeople?: boolean }) {
  const show = !!current && !!impact && impact.ruleChanged && impact.withEvidence > 0
  const [tableOpen, setTableOpen] = React.useState(false)
  return (
    <div className="flex flex-col gap-4" data-impact>
      <p className="text-base font-medium text-foreground" data-figure>
        {impactHeadline(current, impact)}
      </p>
      {show && impact ? (
        lead === "counts" ? (
          <>
            <ImpactTable impact={impact} />
            <ImpactGroups impact={impact} />
          </>
        ) : (
          <>
            <ImpactGroups impact={impact} expanded={expandPeople} />
            <Collapsible open={tableOpen} onOpenChange={setTableOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-expanded={tableOpen}>
                  {tableOpen ? "Hide the counts by status" : "Show the counts by status"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <ImpactTable impact={impact} />
              </CollapsibleContent>
            </Collapsible>
          </>
        )
      ) : null}
    </div>
  )
}

/**
 * How attempts are counted, as one plain line from a real record under the draft rule [CALL 10-26 B.4]:
 * "One student's record: 5 attempts, 2 not approved: 3 count." Nothing when no record has a non-qualifying attempt.
 */
export function AttemptExample({ rule, impact }: { rule: LabRule; impact: Impact | null }) {
  const line = impact?.example && rule.model ? attemptLine(rule, impact.example) : ""
  if (!line) return null
  return (
    <p className="text-sm text-foreground" data-attempt-line>
      <span className="text-muted-foreground">One student&apos;s record: </span>
      <span className="tabular-nums">{`${line}.`}</span>
    </p>
  )
}

/** Who sees the change, said once. */
export function WhoSees({ impact }: { impact: Impact | null }) {
  const verified = impact?.changedVerified ?? 0
  return (
    <p className="text-sm text-muted-foreground" data-who-sees>
      {`Completed evaluations stay as recorded.${verified > 0 ? ` ${verified} verified ${verified === 1 ? "record shows" : "records show"} Changed since verified.` : ""}`}
    </p>
  )
}
