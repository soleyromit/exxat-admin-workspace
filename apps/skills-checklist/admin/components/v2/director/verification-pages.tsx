"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { KeyMetrics, type MetricItem } from "@exxatdesignux/ui/components/ui/key-metrics"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import type { ActiveFilter } from "@exxatdesignux/ui/lib/table-properties-types"
import { StatusPill } from "@/components/v2/status-pill"
import { V2FilterBar, filterValue, v2SelectField } from "@/components/v2/v2-filter-bar"
import { contextLine } from "@/lib/v2/page-context"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { useStaff } from "@/components/v2/outcomes/staff"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { BTN } from "@/components/v2/preceptor/evaluation-form"
import { BulletMeter } from "@/components/v2/viz"
import { recordGroups } from "@/lib/v2/queue-viz"
import { OUTCOME_WORD } from "@/lib/v2/outcomes"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { RoleId, V2State, Verification } from "@/lib/v2/types"
import { gaps, isDirector, mandatoryProgress, NOTE_MAX, pendingReasons, STATUS_LABEL, verificationRows, verificationsOf, verificationStatus, verifyBlockers, verifyRecord, type VerificationRow, type VerifyStatus } from "@/lib/v2/verification"
import { LoadingBlocks } from "@/components/v2/shared-loading"

export const statusLabel = (st: VerifyStatus, version: number | null) => (st === "verified" && version ? `Verified, version ${version}` : STATUS_LABEL[st])

const name = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** The director (and a read-only list for staff): every student and the state of their verification. */
export function VerificationListPage({ role }: { role: RoleId }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const allRows = verificationRows(s)
  const [filters, setFilters] = React.useState<ActiveFilter[]>([])
  const needsAction = filterValue(filters, "needs-action") === "yes"
  const rows = allRows
  const verified = rows.filter((r) => r.status === "verified").length
  const changed = rows.filter((r) => r.status === "changed").length
  const director = role === "director"
  const groups = recordGroups(needsAction ? rows.filter((r) => r.status === "changed" || r.pending > 0) : rows)
  const shownCount = groups.reduce((n, g) => n + g.rows.length, 0)
  const metrics: MetricItem[] = [
    { id: "verified", label: "Records verified", value: verified, delta: "", trend: "neutral" },
    { id: "changed", label: "Changed since verified", value: changed, delta: "", trend: "neutral" },
    { id: "not-verified", label: "Not verified yet", value: rows.length - verified - changed, delta: "", trend: "neutral" },
    { id: "students", label: "Students in the cohort", value: rows.length, delta: "", trend: "neutral" },
  ]
  const base = `/v2/${role}/${director ? "director-verification" : "verification"}`
  if (!hydrated && rows.length === 0) return <PageFrame title="Records"><LoadingBlocks label="Opening the list" rows={5} /></PageFrame>
  return (
    <PageFrame title="Records" subtitle={contextLine(s)}>
      <div className="flex flex-col gap-6" data-verification-list>
        <section aria-label="Records summary">
          <KeyMetrics variant="cards" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
        </section>
        {rows.length > 0 ? (
          <V2FilterBar fields={[v2SelectField("needs-action", "Needs action", [{ value: "yes", label: "Changed since verified or items to resolve" }], "fa-bolt")]} filters={filters} onChange={setFilters} resultCount={shownCount} resultNoun="students" emptyMessage="No student needs action." />
        ) : null}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No students are enrolled in this course.</p> : null}
        {groups.map((g) => (
          <PageSection key={g.id} title={`${g.title} (${g.rows.length})`} id={`records-${g.id}`}>
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card" aria-label={g.title} data-record-group={g.id}>
              {g.rows.map((r) => (
                <li key={r.studentId} className="grid grid-cols-1 items-center gap-2 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-4" data-record-row={r.studentId}>
                  <BulletMeter label={r.name} value={r.mandatoryAchieved} required={Math.max(r.mandatoryTotal, 1)} valueText={`${r.mandatoryAchieved} of ${r.mandatoryTotal} mandatory`} />
                  <div className="flex flex-col items-start gap-1 md:w-52">
                    <StatusPill kind="verify" value={r.status} label={statusLabel(r.status, r.version)} />
                    <span className="text-xs text-muted-foreground">{r.verifiedAt ? `${r.verifiedBy}, ${fmtDay(r.verifiedAt)}` : r.pending > 0 ? `${r.pending} ${plural(r.pending, "item", "items")} to resolve` : `${r.counted} counted`}</span>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${base}/${r.studentId}`} aria-label={`${director ? "Review the record of" : "Read the record of"} ${r.name}`}>{director ? "Review record" : "Read record"}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </PageSection>
        ))}
      </div>
    </PageFrame>
  )
}

/** One student's record: the evidence by mandatory skill, anything that blocks, the verification form, and every version verified so far. */
export function VerificationRecordPage({ role, studentId }: { role: RoleId; studentId: string }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const { actorId, run } = useStaff(role)
  const student = s.people.find((p) => p.id === studentId && p.kind === "student")
  const [note, setNote] = React.useState("")
  const [confirmed, setConfirmed] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<string | null>(null)
  const list = `/v2/${role}/${role === "director" ? "director-verification" : "verification"}`
  if (!student) {
    if (!hydrated) return <PageFrame title="Opening the record"><LoadingBlocks label="Opening the record" rows={5} /></PageFrame>
    return (
      <PageFrame title="Student not found">
        <LocalBanner variant="warning" title="This student is not in the course.">
          <Button asChild variant="outline" size="lg" className={`${BTN} mt-2`}>
            <Link href={list}>Back to the list</Link>
          </Button>
        </LocalBanner>
      </PageFrame>
    )
  }
  const st = verificationStatus(s, studentId)
  const mandatory = mandatoryProgress(s, studentId)
  const missing = gaps(s, studentId)
  const blockers = verifyBlockers(s, studentId)
  const pending = pendingReasons(s, studentId)
  const versions = verificationsOf(s).filter((v) => v.studentId === studentId).slice().reverse()
  const canAct = isDirector(s.people.find((p) => p.id === actorId))
  const nextVersion = (st.latest?.version ?? 0) + 1

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(null)
    if (!confirmed) {
      setError("Confirm that you reviewed the evidence and the gaps listed before you verify.")
      requestAnimationFrame(() => document.getElementById("verify-confirm")?.focus())
      return
    }
    const r = run((state, a, at) => verifyRecord(state, studentId, { note, confirmed }, a, at))
    if (!r.ok) {
      setError(r.error)
      return
    }
    setNote("")
    setConfirmed(false)
    setDone(`${student.name}'s record is verified, version ${r.verification.version}.`)
  }

  return (
    <PageFrame title={`${student.name}, program record`} subtitle={contextLine(s)}>
      <div className="flex max-w-4xl flex-col gap-6" data-verification-record={studentId}>
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          {done ? (
            <LocalBanner variant="success" title="Verified" data-verify-message>
              {done}
            </LocalBanner>
          ) : null}
        </div>

        <Card size="sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Status</span>
              <span data-verify-status={st.status}>
                <StatusPill kind="verify" value={st.status} label={statusLabel(st.status, st.latest?.version ?? null)} />
              </span>
            </div>
            <p className="text-foreground">
              {st.latest ? `Version ${st.latest.version} was verified by ${name(s, st.latest.byId)} on ${fmtDay(st.latest.at)}.` : "No version has been verified yet."}
            </p>
          </CardContent>
        </Card>

        {st.status === "changed" ? (
          <LocalBanner variant="warning" title="The record changed after it was verified" data-changed-banner>
            <p>{`Version ${st.latest?.version} is kept exactly as it was. Verify again to add version ${nextVersion}.`}</p>
            <ul className="mt-1 flex list-disc flex-col gap-1 ps-5">
              {st.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </LocalBanner>
        ) : null}
        {st.newer > 0 && st.status !== "not-verified" ? (
          <LocalBanner variant="info" title={`${st.newer} ${plural(st.newer, "evaluation is", "evaluations are")} not part of version ${st.latest?.version}`} data-newer-banner>
            A new version would include them.
          </LocalBanner>
        ) : null}

        <PageSection title="Mandatory skills" id="skills">
          {mandatory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No mandatory skills are open for this course yet.</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label="Mandatory skills">
              {mandatory.map((m) => (
                <li key={m.skill.id}>
                  <Card size="sm" role="article" aria-labelledby={`vs-${m.skill.id}`} data-skill-row={m.skill.id}>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span id={`vs-${m.skill.id}`} className="font-medium text-foreground">{m.skill.name}</span>
                        <StatusPill kind="skill-progress" value={m.achieved ? "achieved" : "in-progress"} label={m.achieved ? "Achieved" : "Not achieved yet"} />
                      </div>
                      <p className="text-muted-foreground">{`${m.counted} of ${m.need} successful ${m.need === 1 ? "evaluation" : "evaluations"} counted.`}</p>
                      {m.evaluations.length > 0 ? (
                        <ul className="flex flex-col gap-1" aria-label={`Evaluations for ${m.skill.name}`}>
                          {m.evaluations.map((e) => (
                            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-foreground">{`${fmtDay(e.date)}, ${name(s, e.evaluatorId)}: ${OUTCOME_WORD[e.outcome]}, version ${e.currentVersion}`}</span>
                              <Button asChild variant="link" size="sm" className="h-auto p-0">
                                <Link href={`/v2/${role}/evaluation/${e.id}`} aria-label={`Read the evaluation of ${m.skill.name} on ${fmtDay(e.date)}`}>Read in full</Link>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No evaluation counts for this skill yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </PageSection>

        <PageSection title="Verify this record" id="verify" description={canAct ? undefined : "Only the program director can verify a record."}>
          {pending.length > 0 ? (
            <LocalBanner variant="warning" title="Settle these first" data-blockers>
              <ul className="mt-1 flex list-disc flex-col gap-1 ps-5">
                {pending.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="lg" className={BTN}>
                  <Link href="/v2/reviewer/review-queue">Open the review queue</Link>
                </Button>
              </div>
            </LocalBanner>
          ) : blockers.length > 0 ? (
            <LocalBanner variant="info" title="Nothing to verify right now" data-blockers>
              {blockers.join(" ")}
            </LocalBanner>
          ) : null}
          {canAct && blockers.length === 0 ? (
            <form onSubmit={submit} noValidate className="flex flex-col gap-4" aria-label={`Verify the record of ${student.name}`} data-verify-form>
              {missing.length > 0 ? (
                <LocalBanner variant="warning" title={`${missing.length} mandatory ${plural(missing.length, "skill is", "skills are")} not achieved yet`} data-gaps>
                  <ul className="mt-1 flex list-disc flex-col gap-1 ps-5">
                    {missing.map((m) => (
                      <li key={m.skill.id}>{`${m.skill.name}: ${m.counted} of ${m.need}`}</li>
                    ))}
                  </ul>
                  <p className="mt-1">The verification lists these gaps.</p>
                </LocalBanner>
              ) : null}
              <Field>
                <FieldLabel htmlFor="verify-note">Note for the record (optional)</FieldLabel>
                <Textarea id="verify-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                <FieldDescription>{`${note.trim().length} of ${NOTE_MAX} characters. A verification is never edited. A later change adds a version.`}</FieldDescription>
              </Field>
              <div className="flex flex-col gap-1">
                <Card size="sm">
                  <CardContent className="flex min-h-(--control-height-touch) items-start gap-3">
                  <Checkbox id="verify-confirm" checked={confirmed} className="mt-0.5" aria-invalid={error && !confirmed ? true : undefined} aria-describedby={error && !confirmed ? "verify-error" : undefined} onCheckedChange={(v) => { setConfirmed(v === true); setError(null) }} />
                  <Label htmlFor="verify-confirm" className="flex-1 text-start text-sm font-normal text-foreground">
                    {missing.length > 0 ? "I reviewed this student's evidence and the gaps listed above." : "I reviewed this student's evidence."}
                  </Label>
                  </CardContent>
                </Card>
                {error ? <FieldError id="verify-error" errors={[{ message: error }]} /> : null}
              </div>
              <div>
                <Button type="submit" variant="default" size="lg" className={BTN} data-verify>
                  {`Verify ${student.name}'s record as version ${nextVersion}`}
                </Button>
              </div>
            </form>
          ) : null}
        </PageSection>

        <PageSection title={`Verification history (${versions.length})`} id="history">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-history-empty>Not verified yet.</p>
          ) : (
            <ol className="flex flex-col gap-2" aria-label="Verification versions, newest first" data-history>
              {versions.map((v) => (
                <VersionRow key={v.id} s={s} v={v} />
              ))}
            </ol>
          )}
        </PageSection>

        <div>
          <Button asChild variant="outline" size="lg" className={BTN}>
            <Link href={list}>Back to the list</Link>
          </Button>
        </div>
      </div>
    </PageFrame>
  )
}

function VersionRow({ s, v }: { s: V2State; v: Verification }) {
  const achieved = v.skills.filter((k) => k.achieved).length
  return (
    <li className="rounded-lg border border-border bg-card p-3 text-sm" data-verification-version={v.version}>
      <p className="font-medium text-foreground">{`Version ${v.version}, ${fmtDay(v.at)}, by ${name(s, v.byId)}`}</p>
      <p className="text-muted-foreground">{`Rests on ${v.evidence.length} ${plural(v.evidence.length, "evaluation", "evaluations")}. ${achieved} of ${v.skills.length} mandatory ${plural(v.skills.length, "skill", "skills")} achieved at the time.`}</p>
      {v.note ? <p className="text-foreground">{`Note: ${v.note}`}</p> : null}
    </li>
  )
}

