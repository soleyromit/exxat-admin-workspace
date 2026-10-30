"use client"

/**
 * Verification detail pieces shared by the record view (A) and the checklist view (B).
 * Rules (strategy/03 D3 and the ledger): gaps never block, each gap needs its own named acknowledgement, the verified record states
 * its own gaps, there is no "ready for practice" claim. Evidence in flux blocks (the record may still change). Verifying adds a
 * numbered version; the earlier version stays on file. The lab keeps the result on the page only (no store write).
 */
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox, CheckboxLabel } from "@exxatdesignux/ui/components/ui/checkbox"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { DIRECTOR_NAME, detailHref, directorHref, evidenceHref, plural, shortDate, type DetailModel, type SkillLine } from "@/lib/lab/director"
import { StateBadge } from "@/components/lab/status-pill"
import type { LabScope } from "@/lib/lab/scope"
import { LINK, LINK_U, StatusMark } from "@/components/lab/director/parts"
import type { V2State } from "@/lib/v2/types"
import { evaluationViewsFor } from "@/lib/lab/evaluation-view"
import { EvaluationSheet } from "@/components/lab/evaluation/evaluation-view"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const NOTE_MAX = 1000

export interface VerifyFlow {
  acked: Set<string>
  toggle: (skillId: string, on: boolean) => void
  note: string
  setNote: (v: string) => void
  done: { version: number; at: string } | null
  verify: () => void
  /** Every gap acknowledged and nothing in flux. */
  canVerify: boolean
  remaining: number
}

export function useVerifyFlow(d: DetailModel): VerifyFlow {
  const [acked, setAcked] = React.useState<Set<string>>(new Set())
  const [note, setNote] = React.useState("")
  const [done, setDone] = React.useState<{ version: number; at: string } | null>(null)
  React.useEffect(() => {
    setAcked(new Set())
    setNote("")
    setDone(null)
  }, [d.row.id])
  const remaining = d.row.gaps.filter((g) => !acked.has(g.skillId)).length
  const canVerify = d.row.flux.length === 0 && remaining === 0 && d.row.status !== "verified" && note.length <= NOTE_MAX
  return {
    acked,
    toggle: (id, on) =>
      setAcked((prev) => {
        const next = new Set(prev)
        if (on) next.add(id)
        else next.delete(id)
        return next
      }),
    note,
    setNote,
    done,
    verify: () => canVerify && setDone({ version: (d.row.version ?? 0) + 1, at: DEMO_TODAY }),
    canVerify,
    remaining,
  }
}

/** State of one skill: the canonical StateBadge (components/lab/status-pill.tsx). In progress is the neutral half circle with
 * its numbers; amber only where the evidence does not qualify. */
export function SkillState({ l }: { l: SkillLine }) {
  return <StateBadge state={l.state} detail={l.state === "progress" ? `(${l.counted} of ${l.need})` : undefined} />
}

/**
 * The evidence count behind one skill. With the state it opens every evaluation of that skill in full, beside the record, read
 * only [REQ RP-07]: the director verifies from the evidence itself, not from a count. Without it, it links to the student record.
 */
export function EvidenceLink({ l, scope, studentId, state }: { l: SkillLine; scope: LabScope; studentId: string; state?: V2State | null }) {
  // RP-07: the count is a text link that opens every counted evaluation of this skill, read-only, in the shared sheet. The open
  // sheet lives in the URL (?evidence=<skill id>) so Back closes it and the link can be shared; a link, not a button, so a list of
  // 50 skills stays a list of links (strategy/07 detail budget).
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const router = useRouter()
  const open = params?.get(EVIDENCE_PARAM) === l.skillId
  const views = React.useMemo(() => (open && state ? evaluationViewsFor(state, studentId, l.skillId, true) : null), [open, state, studentId, l.skillId])
  if (l.evaluations === 0) return <span className="text-sm text-muted-foreground">No evaluations</span>
  const text = `${plural(l.evaluations, "evaluation", "evaluations")}${l.unmet ? `, ${l.unmet} Unmet` : ""}`
  if (state) {
    const withParam = (v: string | null) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      if (v) q.set(EVIDENCE_PARAM, v)
      else q.delete(EVIDENCE_PARAM)
      const qs = q.toString()
      return qs ? `${pathname}?${qs}` : pathname
    }
    return (
      <>
        <Link className={`${LINK} text-sm`} href={withParam(l.skillId)} scroll={false} aria-label={`View ${text} of ${l.name}`}>
          {text}
        </Link>
        {open ? <EvaluationSheet views={views} title={l.name} onClose={() => router.replace(withParam(null), { scroll: false })} /> : null}
      </>
    )
  }
  return (
    <Link className={`${LINK} text-sm`} href={evidenceHref(scope, studentId, l.skillId)}>
      {text}
    </Link>
  )
}

const EVIDENCE_PARAM = "evidence"

/** One line under a gap: why it is a gap and what is already moving. */
export function gapWhy(l: SkillLine): string {
  const parts = [l.unmet ? `${plural(l.unmet, "Unmet evaluation", "Unmet evaluations")}` : l.evaluations ? `${l.counted} of ${l.need} counted` : "No evidence yet"]
  if (l.request) parts.push(`request open with ${l.request.evaluator}, ${plural(l.request.days, "day", "days")}`)
  return parts.join("; ")
}

/** Header line: status, version, required achieved. */
export function RecordLine({ d, flow }: { d: DetailModel; flow: VerifyFlow }) {
  const r = d.row
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" data-region="record-line">
      {flow.done ? <StatusBadge label="Verified" tone="neutral" icon="fa-badge-check" size="sm" /> : <StatusMark status={r.status} />}
      <span className="text-muted-foreground">{r.cohort}</span>
      <span className="tabular-nums" data-figure>
        <span className="font-semibold text-foreground">{`${r.achieved} of ${r.required}`}</span>
        <span className="text-muted-foreground">{` required ${skillNounPlural()} achieved`}</span>
      </span>
      <span className="text-muted-foreground">
        {flow.done ? `Version ${flow.done.version}, ${shortDate(flow.done.at)}` : r.verifiedAt ? `Version ${r.version}, ${shortDate(r.verifiedAt)}, ${DIRECTOR_NAME}` : "Never verified"}
      </span>
    </div>
  )
}

export function ChangedBanner({ d }: { d: DetailModel }) {
  if (d.row.status !== "changed") return null
  return (
    <LocalBanner variant="info" data-region="changed" aria-label="Changed since verified">
      <span className="flex flex-col gap-1">
        {d.row.changes.map((c) => (
          <span key={c}>{c}</span>
        ))}
        <span className="text-muted-foreground">{`Version ${d.row.version} stays on file.`}</span>
      </span>
    </LocalBanner>
  )
}

export function GapChecks({ d, flow, idPrefix }: { d: DetailModel; flow: VerifyFlow; idPrefix: string }) {
  if (d.row.gaps.length === 0) return <p className="text-sm text-muted-foreground">No gaps.</p>
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Acknowledge each gap</legend>
      {d.row.gaps.map((g) => {
        const id = `${idPrefix}-${g.skillId}`
        const on = flow.acked.has(g.skillId)
        return (
          <div key={g.skillId} className="flex flex-col gap-0.5 rounded-md border border-border px-3 py-2">
            <div className="flex items-start gap-2">
              <Checkbox id={id} checked={on} disabled={!!flow.done} onCheckedChange={(v) => flow.toggle(g.skillId, v === true)} className="mt-3" aria-describedby={`${id}-why`} />
              <CheckboxLabel htmlFor={id} className="font-normal">
                <span>
                  <span className="font-medium">{g.name}</span> not achieved
                </span>
              </CheckboxLabel>
            </div>
            <span id={`${id}-why`} className="ps-6 text-xs text-muted-foreground">
              {on ? `Acknowledged by ${DIRECTOR_NAME}, ${shortDate(DEMO_TODAY)}. ` : ""}
              {gapWhy(g)}
            </span>
          </div>
        )
      })}
    </fieldset>
  )
}

export function VerifyAction({ d, flow, scope, idPrefix, queue }: { d: DetailModel; flow: VerifyFlow; scope: LabScope; idPrefix: string; queue: string[] }) {
  const r = d.row
  const why = r.flux.length ? "Verify opens when nothing is in flux." : flow.remaining ? `Acknowledge ${flow.remaining === 1 ? "the gap" : `${flow.remaining} gaps`} to verify.` : r.status === "verified" ? "Already verified. Nothing changed since." : ""
  const at = queue.indexOf(r.id)
  const next = at >= 0 && at < queue.length - 1 ? queue[at + 1] : null
  const [tried, setTried] = React.useState(false)
  if (flow.done)
    return (
      <div className="flex flex-col gap-3">
        <LocalBanner variant="success" title={`Verified, version ${flow.done.version}`}>
          {r.gaps.length ? `The record states its ${r.gaps.length === 1 ? "gap" : "gaps"}.` : `The record states every required ${skillNoun()} achieved.`}
        </LocalBanner>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link href={next ? detailHref(scope, next, { queue: queue.join(",") }) : directorHref("dashboard", scope)}>{next ? `Next record, ${at + 2} of ${queue.length}` : "Back to the dashboard"}</Link>
        </Button>
      </div>
    )
  return (
    <div className="flex flex-col gap-3">
      {/* No "The verified record will state" preview: it repeated the record line's figure and the gap list above (anatomy A5,
          Romit 2026-10-30). The statement is still written on verify (lib/lab/director.ts detailModel). */}
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-note`}>Note, optional</Label>
        <Textarea id={`${idPrefix}-note`} rows={2} value={flow.note} maxLength={NOTE_MAX} onChange={(e) => flow.setNote(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {/* Enabled until the first failed attempt (strategy/07 interaction rule): a blocked click names what is left, it never
            verifies (flow.verify checks canVerify). */}
        <Button type="button" variant="default" size="sm" onClick={() => (flow.canVerify ? flow.verify() : setTried(true))} aria-describedby={why ? `${idPrefix}-why` : undefined}>
          Verify record
        </Button>
        {why ? (
          <span id={`${idPrefix}-why`} role={tried ? "alert" : undefined} className={tried ? "text-xs font-medium text-foreground" : "text-xs text-muted-foreground"}>
            {why}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function FluxList({ d, scope }: { d: DetailModel; scope: LabScope }) {
  if (d.row.flux.length === 0) return null
  return (
    <div className="flex flex-col gap-1" data-flux>
      <span className="text-sm font-medium text-foreground">What stops verification now</span>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {d.row.flux.map((f, i) => {
          // Open requests are listed last in flux, in the same order as row.open.
          const o = d.row.open[i - (d.row.flux.length - d.row.open.length)]
          return (
          <li key={f} className="flex items-start gap-2">
            <i className="fa-light fa-lock mt-1 text-xs" aria-hidden="true" />
            {o ? (
              <Link className={LINK_U} href={evidenceHref(scope, d.row.id, o.skillIds[0])}>{f}</Link>
            ) : (
              <span>{f}</span>
            )}
          </li>
          )
        })}
      </ul>
    </div>
  )
}
