"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { useStaff } from "@/components/v2/outcomes/staff"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { BTN } from "@/components/v2/preceptor/evaluation-form"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { OUTCOME_WORD } from "@/lib/v2/outcomes"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { RoleId, V2State, Verification } from "@/lib/v2/types"
import { gaps, isDirector, mandatoryProgress, NOTE_MAX, pendingReasons, STATUS_LABEL, verificationRows, verificationsOf, verificationStatus, verifyBlockers, verifyRecord, type VerificationRow, type VerifyStatus } from "@/lib/v2/verification"

export const STATUS_TONE: Record<VerifyStatus, { tone: "success" | "warning" | "neutral"; icon: string }> = {
  verified: { tone: "success", icon: "fa-badge-check" },
  changed: { tone: "warning", icon: "fa-triangle-exclamation" },
  "not-verified": { tone: "neutral", icon: "fa-circle" },
}

export const statusLabel = (st: VerifyStatus, version: number | null) => (st === "verified" && version ? `Verified, version ${version}` : STATUS_LABEL[st])

const name = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** Scenario step 11 for the director (and a read-only list for staff): every student and the state of their verification. */
export function VerificationListPage({ role }: { role: RoleId }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const rows = verificationRows(s)
  const verified = rows.filter((r) => r.status === "verified").length
  const changed = rows.filter((r) => r.status === "changed").length
  const director = role === "director"
  const summary: Array<[string, number, string]> = [
    ["Records verified", verified, "verified"],
    ["Changed since verified", changed, "changed"],
    ["Not verified yet", rows.length - verified - changed, "not-verified"],
    ["Students in the cohort", rows.length, "students"],
  ]
  if (!hydrated && rows.length === 0) return <PageFrame title="Verify the program record"><p role="status" className="text-sm text-muted-foreground">Opening the list</p></PageFrame>
  return (
    <PageFrame title="Verify the program record" subtitle={`${s.course.code}, ${s.course.term}. ${director ? "Check a student's record and verify it before it is shared outside the program." : "The director verifies records. You can read the status and the evidence."}`}>
      <div className="flex flex-col gap-6" data-verification-list>
        <Card>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4" aria-label="Verification summary">
              {summary.map(([label, n, key]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-foreground" data-summary={key}>{n}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <PageSection title="Students" id="students" description="Open a name to read the record. A verification names the director, the date and the exact evaluations it rests on. It is never edited; a later change adds a new version.">
          <V2Grid<VerificationRow>
            caption="Students and their verification status"
            rows={rows}
            id={(r) => r.studentId}
            selectable={false}
            emptyText="No students are enrolled in this course."
            columns={[
              v2col<VerificationRow>("student", "Student", 180, (r) => (
                <Link href={`/v2/${role}/verification/${r.studentId}`} aria-label={`${director ? "Review the record of" : "Read the record of"} ${r.name}`} className="rounded-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {r.name}
                </Link>
              )),
              v2col<VerificationRow>("mandatory", "Mandatory skills achieved", 190, (r) => `${r.mandatoryAchieved} of ${r.mandatoryTotal}`),
              v2col<VerificationRow>("counted", "Evaluations that count", 170, (r) => String(r.counted)),
              v2col<VerificationRow>("pending", "Still to resolve", 140, (r) => (r.pending === 0 ? "Nothing" : `${r.pending} ${plural(r.pending, "item", "items")}`)),
              v2col<VerificationRow>("status", "Status", 220, (r) => <StatusBadge label={statusLabel(r.status, r.version)} tone={STATUS_TONE[r.status].tone} icon={STATUS_TONE[r.status].icon} size="sm" />),
              v2col<VerificationRow>("by", "Verified by", 200, (r) => (r.verifiedAt ? `${r.verifiedBy}, ${fmtDay(r.verifiedAt)}` : "Not yet")),
            ]}
          />
        </PageSection>
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
    if (!hydrated) return <PageFrame title="Opening the record"><p role="status" className="text-sm text-muted-foreground">Opening the record</p></PageFrame>
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
  const tone = STATUS_TONE[st.status]

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
    setDone(`${student.name}'s record is verified, version ${r.verification.version}. The student sees it on their record, and report data now carries it.`)
  }

  return (
    <PageFrame title={`${student.name}, program record`} subtitle={`${s.course.code}, ${s.course.term}. The evidence a verification rests on, and everything that has to be settled first.`}>
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
                <StatusBadge label={statusLabel(st.status, st.latest?.version ?? null)} tone={tone.tone} icon={tone.icon} size="sm" />
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
            They count toward the record. A new version would include them.
          </LocalBanner>
        ) : null}

        <PageSection title="Mandatory skills" id="skills" description="Each skill, against its own rule. Open an evaluation to read it in full.">
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
                        <StatusBadge label={m.achieved ? "Achieved" : "Not achieved yet"} tone={m.achieved ? "success" : "warning"} icon={m.achieved ? "fa-circle-check" : "fa-circle-minus"} size="sm" />
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

        <PageSection title="Verify this record" id="verify" description={canAct ? "You verify what counts today. Anything still waiting must be settled first." : "Only the program director can verify a record."}>
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
                  <p className="mt-1">The verification states these gaps. It does not say the program is complete.</p>
                </LocalBanner>
              ) : null}
              <Field>
                <FieldLabel htmlFor="verify-note">Note for the record (optional)</FieldLabel>
                <Textarea id="verify-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                <FieldDescription>{`${note.trim().length} of ${NOTE_MAX} characters. Kept with this version.`}</FieldDescription>
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

        <PageSection title={`Verification history (${versions.length})`} id="history" description="Newest first. Each version is read-only.">
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

