"use client"
// DS adoption: composition of DS Sheet, Dialog, Toggle, Button and LocalBanner with the v2 V2Grid (DS DataTable) and StatusPill (DS StatusBadge).
// See docs/build/contracts/V2-reports-ledger.md. Read only: a completed evaluation cannot be edited (RV-03, RV-05).

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { Toggle } from "@exxatdesignux/ui/components/ui/toggle"
import { StatusPill } from "@/components/v2/status-pill"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { BTN } from "@/components/v2/preceptor/evaluation-form"
import { linkTo } from "@/lib/v2/link-to"
import {
  appliedFilters,
  COUNTER_IDS,
  COUNTER_LABEL,
  fmtLedgerDate,
  LEDGER_RESULT_LABEL,
  ledgerView,
  skillLedger,
  studentLedger,
  type CounterId,
  type LedgerRow,
  type LedgerResult,
  type ReportFilters,
  type SkillLedger,
} from "@/lib/v2/reports"
import type { Evaluation, EvaluationVersion, RoleId, Skill, V2State } from "@/lib/v2/types"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** What opened the sheet: a student on a skill (a heat-grid cell or a table row). `opener` is the control to give focus back to. */
export interface LedgerTarget {
  studentId: string
  skillId: string
  opener: HTMLElement | null
}

const EVIDENCE_FILTERS = new Set(["course", "location", "setting", "clinicalSetting"])

/** Give focus back to what opened the sheet. A heat-grid cell is found again by its name when the control was not focused on click. */
function focusOpener(t: LedgerTarget, skillName: string | undefined) {
  if (t.opener?.isConnected) return t.opener.focus(), true
  const row = document.querySelector(`[data-heat-row="${CSS.escape(t.studentId)}"]`)
  const btn = Array.from(row?.querySelectorAll("button") ?? []).find((b) => skillName && (b.getAttribute("aria-label") ?? "").includes(`, ${skillName}:`))
  if (btn) return (btn as HTMLElement).focus(), true
  return false
}

export function EvidenceLedgerSheet({ s, f, role, target, onClose }: { s: V2State; f: ReportFilters; role: RoleId; target: LedgerTarget | null; onClose: () => void }) {
  // The target is cleared as the sheet closes, so the last one is kept to know where focus goes back to.
  const last = React.useRef<LedgerTarget | null>(null)
  if (target) last.current = target
  return (
    <Sheet open={!!target} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        size="xl"
        style={{ width: "min(58rem, 100vw)", maxWidth: "100vw" }}
        className="flex flex-col gap-0 p-0"
        data-cell-sheet
        onCloseAutoFocus={(e) => {
          const t = last.current
          if (t && focusOpener(t, s.skills.find((k) => k.id === t.skillId)?.name)) e.preventDefault()
        }}
      >
        {target ? <LedgerBody key={`${target.studentId}|${target.skillId}`} s={s} f={f} role={role} target={target} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function LedgerBody({ s, f, role, target, onClose }: { s: V2State; f: ReportFilters; role: RoleId; target: LedgerTarget; onClose: () => void }) {
  const [only, setOnly] = React.useState<CounterId | null>(null)
  const [chip, setChip] = React.useState<string | null>(target.skillId)
  const [formId, setFormId] = React.useState<string | null>(null)
  const formOpener = React.useRef<string | null>(null)

  const ledger = studentLedger(s, f, target.studentId)
  const focused: SkillLedger | null = chip ? skillLedger(s, f, target.studentId, chip) : null

  // Error: the student or the skill left the view while the sheet was open (a filter changed, or it was removed).
  if (!ledger || (chip && !focused)) {
    return (
      <>
        <SheetHeader className="border-b border-border p-4 pe-12">
          <SheetTitle>Evidence ledger</SheetTitle>
          <SheetDescription>This evidence is no longer in view.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-4">
          <LocalBanner variant="warning" title="This evidence is no longer in view" data-ledger-missing>
            The student or the skill does not match the report filters now. Close this and open the figure again.
          </LocalBanner>
          <Button type="button" variant="outline" size="lg" className={BTN} onClick={onClose}>Close</Button>
        </div>
      </>
    )
  }

  const view = ledgerView(ledger, { skillId: chip, only })
  const evidenceApplied = appliedFilters(f).filter((a) => EVIDENCE_FILTERS.has(a.key))
  const emptySkills = view.skills.filter((k) => k.rows.length === 0)
  const stateWord = focused ? COUNTER_LABEL[focused.counter] : ""
  const scopeName = focused ? `${ledger.name}, ${focused.skillName}` : ledger.name

  const columns = [
    v2col<LedgerRow>("date", "Date", 110, (r) => fmtLedgerDate(r.date)),
    ...(chip ? [] : [v2col<LedgerRow>("skill", "Skill", 160, (r) => r.skillName)]),
    v2col<LedgerRow>("setting", "Setting", 160, (r) => (
      <span className="flex flex-col">
        <span>{r.settingLabel}</span>
        {r.location ? <span className="text-muted-foreground">{r.location}</span> : null}
      </span>
    )),
    v2col<LedgerRow>("evaluator", "Evaluator", 160, (r) => (
      <span className="flex flex-col">
        <span>{r.evaluator}</span>
        {r.evaluatorRole ? <span className="text-muted-foreground">{r.evaluatorRole}</span> : null}
      </span>
    )),
    v2col<LedgerRow>("recorded", "Recorded", 160, (r) => (
      <span className="flex flex-col">
        <span>{`${r.recordedBy}, ${fmtLedgerDate(r.recordedAt)}`}</span>
        {r.recordedNote ? <span className="text-muted-foreground">{r.recordedNote}</span> : null}
      </span>
    )),
    v2col<LedgerRow>("result", "Result", 200, (r) => (
      <span className="flex flex-col items-start gap-1" data-ledger-result={r.result}>
        <ResultPill result={r.result} />
        {r.reason ? <span className="text-muted-foreground">{r.reason}</span> : null}
      </span>
    )),
    v2col<LedgerRow>("form", "Form", 100, (r) => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-form-button={r.evaluationId}
        aria-label={`View form, ${r.skillName}, ${fmtLedgerDate(r.date)}`}
        onClick={(e) => { formOpener.current = r.evaluationId; e.currentTarget.focus(); setFormId(r.evaluationId) }}
      >
        View form
      </Button>
    )),
  ]

  return (
    <>
      <SheetHeader className="border-b border-border p-4 pe-12">
        <SheetTitle>{scopeName}</SheetTitle>
        <SheetDescription>
          {focused
            ? `${focused.counted} of ${focused.need} counted ${plural(focused.need, "evaluation", "evaluations")}. ${stateWord}.${focused.left.length ? ` Still needed: ${focused.left.join("; ")}.` : ""}`
            : `${ledger.skills.length} ${plural(ledger.skills.length, "skill", "skills")} in view, ${ledger.counters.achieved} achieved.`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={`${ledger.name}, skills by state`} data-ledger-counters>
          {COUNTER_IDS.map((id) => (
            <li key={id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3" data-counter={id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-semibold tabular-nums text-foreground">{ledger.counters[id]}</span>
                <CounterPill id={id} />
              </div>
              <Toggle
                variant="outline"
                size="sm"
                pressed={only === id}
                disabled={ledger.counters[id] === 0}
                onPressedChange={(p) => setOnly(p ? id : null)}
                aria-label={`Show these only: ${COUNTER_LABEL[id]}`}
                className="min-h-(--control-height-touch) justify-start sm:min-h-0"
              >
                Show these only
              </Toggle>
            </li>
          ))}
        </ul>

        {chip && focused ? (
          <div className="flex flex-wrap items-center gap-2" data-ledger-chip>
            <Button type="button" variant="outline" size="sm" aria-label={`Remove filter Skill: ${focused.skillName}`} onClick={() => setChip(null)}>
              {`Skill: ${focused.skillName}`}
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        {evidenceApplied.length > 0 ? (
          <p className="text-sm text-muted-foreground" data-ledger-filters>{`Only evidence that matches the report filters is listed: ${evidenceApplied.map((a) => a.label).join(", ")}.`}</p>
        ) : null}

        {view.skills.length === 0 ? (
          <LocalBanner variant="info" title="No skill matches these choices" data-ledger-empty>
            Turn off Show these only or remove the skill filter to see more.
          </LocalBanner>
        ) : view.rows.length === 0 ? (
          <LocalBanner variant="info" title="No evidence yet" data-ledger-empty>
            {view.skills.length === 1
              ? `No evaluation has been counted for ${view.skills[0].skillName}${evidenceApplied.length ? " with these filters" : " yet"}.${view.skills[0].left.length ? ` Still needed: ${view.skills[0].left.join("; ")}.` : ""}`
              : `No evaluation has been counted for ${emptySkills.map((k) => k.skillName).join(", ")}${evidenceApplied.length ? " with these filters" : " yet"}.`}
            {evidenceApplied.length ? " Remove a filter to see more." : ""}
          </LocalBanner>
        ) : (
          <>
            <div className="overflow-x-auto overscroll-x-contain" data-ledger-table>
            <V2Grid<LedgerRow>
              caption={`Evidence ledger for ${scopeName}`}
              rows={view.rows}
              id={(r) => r.evaluationId}
              selectable={false}
              emptyText="No counted evaluations."
              columns={columns}
            />
            </div>
            {emptySkills.length > 0 ? (
              <p className="text-sm text-muted-foreground" data-ledger-none-yet>{`No evaluation yet for ${emptySkills.map((k) => k.skillName).join(", ")}.`}</p>
            ) : null}
          </>
        )}

        <div>
          <Button asChild variant="outline" size="lg" className={BTN}>
            <Link href={linkTo({ role, kind: "student", id: ledger.studentId })} aria-label={`Open record of ${ledger.name}`}>Open record</Link>
          </Button>
        </div>
      </div>

      <FormDialog
        s={s}
        role={role}
        evaluationId={formId}
        onClose={() => setFormId(null)}
        onCloseAutoFocus={(e) => {
          const id = formOpener.current
          const btn = id ? document.querySelector<HTMLElement>(`[data-form-button="${CSS.escape(id)}"]`) : null
          if (btn) { e.preventDefault(); btn.focus() }
        }}
      />
    </>
  )
}

function ResultPill({ result }: { result: LedgerResult }) {
  const label = LEDGER_RESULT_LABEL[result]
  if (result === "counts") return <StatusPill kind="outcome" value="met" label={label} />
  if (result === "not-used") return <StatusPill kind="cell" value="half" label={label} />
  if (result === "did-not-meet") return <StatusPill kind="outcome" value="not-met" label={label} />
  return <StatusPill kind="outcome" value="not-yet" label={label} />
}

function CounterPill({ id }: { id: CounterId }) {
  if (id === "achieved") return <StatusPill kind="skill-progress" value="achieved" />
  if (id === "in-progress") return <StatusPill kind="skill-progress" value="in-progress" />
  if (id === "did-not-meet") return <StatusPill kind="cell" value="attempted" label={COUNTER_LABEL[id]} />
  return <StatusPill kind="skill-progress" value="not-started" />
}

// ---------------------------------------------------------------------------------------------------------------------
// The submitted form, read only. No edit, reopen or resend control (RV-03, RV-05). Reviewer notes and concern flags are never read.

function FormFields({ skill, v }: { skill: Skill | undefined; v: EvaluationVersion }) {
  const d = v.detail
  if (!d) return <p className="text-sm text-muted-foreground" data-form-plain>Only the outcome was recorded for this evaluation.</p>
  const c = skill?.config
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm" data-form-detail>
      {d.answers && c ? (
        <>
          <dt className="text-muted-foreground">Answers</dt>
          <dd>
            <ul className="flex flex-col gap-1">
              {c.questions.map((q, i) => <li key={i}>{`${q}: ${d.answers?.[i] === "yes" ? "Yes" : d.answers?.[i] === "no" ? "No" : "Not answered"}`}</li>)}
            </ul>
          </dd>
        </>
      ) : null}
      {d.scores && c ? (
        <>
          <dt className="text-muted-foreground">Scores</dt>
          <dd>
            <ul className="flex flex-col gap-1">
              {c.questions.map((q, i) => <li key={i}>{`${q}: ${d.scores?.[i] ?? "Not scored"}`}</li>)}
            </ul>
          </dd>
        </>
      ) : null}
      {d.levelIndex !== undefined && d.levelIndex !== null && c ? (
        <>
          <dt className="text-muted-foreground">Level</dt>
          <dd>{c.levels[d.levelIndex] ?? "Level removed from the skill"}</dd>
        </>
      ) : null}
      <dt className="text-muted-foreground">Feedback</dt>
      <dd>{d.feedback || "No feedback written."}</dd>
      {d.attested ? (
        <>
          <dt className="text-muted-foreground">Attestation</dt>
          <dd>{`${d.attested.text} (${fmtLedgerDate(d.attested.at)})`}</dd>
        </>
      ) : null}
    </dl>
  )
}

function FormDialog({ s, role, evaluationId, onClose, onCloseAutoFocus }: { s: V2State; role: RoleId; evaluationId: string | null; onClose: () => void; onCloseAutoFocus: (e: Event) => void }) {
  const e: Evaluation | undefined = evaluationId ? s.evaluations.find((x) => x.id === evaluationId && x.status === "counted") : undefined
  const skill = e ? s.skills.find((k) => k.id === e.skillId) : undefined
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
  const v = e?.versions.find((x) => x.version === e.currentVersion)
  return (
    <Dialog open={!!evaluationId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl" data-form-dialog onCloseAutoFocus={onCloseAutoFocus}>
        {e && v ? (
          <>
            <DialogHeader className="pe-8">
              <DialogTitle>{`${skill?.name ?? "Skill"}, ${name(e.studentId)}`}</DialogTitle>
              <DialogDescription>{`${fmtLedgerDate(e.date)}, ${e.setting === "clinical" ? `Clinical${e.clinicalSetting ? `, ${e.clinicalSetting}` : ""}` : e.setting === "lab" ? "Lab" : "Simulation"}${e.location ? `, ${e.location}` : ""}`}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm" aria-label="Evaluation facts">
                <dt className="text-muted-foreground">Evaluator</dt>
                <dd>{`${name(e.evaluatorId)}${s.people.find((p) => p.id === e.evaluatorId)?.title ? `, ${s.people.find((p) => p.id === e.evaluatorId)?.title}` : ""}`}</dd>
                <dt className="text-muted-foreground">Recorded</dt>
                <dd>{`${name(v.by)}, ${fmtLedgerDate(v.at)}${e.source === "paper-form" && e.enteredById ? `. Entered from a paper form by ${name(e.enteredById)}` : ""}`}</dd>
                <dt className="text-muted-foreground">Outcome</dt>
                <dd>
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusPill kind="outcome" value={e.outcome} label={e.outcome === "not-met" ? "Did not meet criteria" : undefined} />
                    <StatusPill kind="attempt" value="counted" />
                  </span>
                </dd>
              </dl>
              <section aria-labelledby="form-recorded-h" className="flex flex-col gap-2">
                <h3 id="form-recorded-h" className="text-sm font-semibold text-foreground">What the evaluator recorded</h3>
                <FormFields skill={skill} v={v} />
              </section>
              {e.versions.length > 1 ? (
                <p className="text-sm text-muted-foreground" data-form-versions>
                  {`Version ${e.currentVersion} of ${e.versions.length} is shown. Earlier versions are kept as they were. `}
                  <Link href={linkTo({ role, kind: "record", id: e.id })} className="rounded-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">See every version</Link>
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">A completed evaluation cannot be edited.</p>
            </div>
          </>
        ) : (
          <DialogHeader>
            <DialogTitle>Evaluation not available</DialogTitle>
            <DialogDescription>This evaluation is no longer available.</DialogDescription>
          </DialogHeader>
        )}
        <DialogFooter showCloseButton={false}>
          <Button type="button" variant="outline" size="lg" className={BTN} onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
