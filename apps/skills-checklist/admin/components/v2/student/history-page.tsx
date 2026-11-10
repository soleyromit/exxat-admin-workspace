"use client"

import { LoadingBlocks } from "@/components/v2/shared-loading"
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { StatusPill } from "@/components/v2/status-pill"
import { ChartCard } from "@/components/chart-card"
import { Block, StudentPage } from "@/components/v2/student/student-frame"
import { SkillProgressViz } from "@/components/v2/student/skill-card"
import { CumulativeLine } from "@/components/v2/viz"
import { paceSeries } from "@/lib/v2/student-viz"
import { fmtDate, TOUCH, BTN } from "@/components/v2/student/use-student"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { STUDENT_ID, studentHistory, type Attempt, type AttemptKind, type SkillHistory } from "@/lib/v2/student"
import { verificationStatus } from "@/lib/v2/verification"
import { RECORD_PATH } from "@/lib/v2/paths"
import type { V2State } from "@/lib/v2/types"

const verifyLabel = (status: string, version: number | null) => (status === "verified" && version ? `Verified, version ${version}` : undefined)

/** Student history: every attempt per skill in order, with an explicit outcome, who it is with, the rule not met, and what counted. */
export function HistoryPage() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const h = studentHistory(s)
  const [open, setOpen] = React.useState<{ skill: SkillHistory; attempt: Attempt } | null>(null)
  const sum = h.summary
  const pace = paceSeries(s)
  if (!hydrated) return <StudentPage title="Record"><LoadingBlocks label="Opening your record" rows={4} /></StudentPage>
  return (
    <StudentPage title="Record">
      <div data-pace-card>
        <ChartCard title="Pace this term" description="Evaluations counted against the expected pace." className="h-auto">
          <CumulativeLine label="Counted evaluations and the expected pace" data={pace.data} unit="evaluation" caption={pace.caption} height={180} />
        </ChartCard>
      </div>
      <Card size="sm">
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm" aria-label="Record summary">
            {[
              ["Counted", sum.counted, "counted"],
              ["Waiting", sum.waiting, "waiting"],
              ["Did not meet", sum.didNotMeet, "did-not-meet"],
              ["Not yet, feedback only", sum.notYet, "not-yet"],
              ["Returned or reopened", sum.returned, "returned"],
            ].map(([label, n, key]) => (
              <div key={String(key)} className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums" data-history-count={String(key)}>
                  {n}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <VerificationCard s={s} />

      {h.skills.length === 0 ? (
        <Card size="sm">
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="font-medium text-foreground">You have not sent anything yet</p>
            <p className="text-muted-foreground">Log a skill and ask for sign-off. Each attempt shows here with what counted.</p>
            <Button asChild variant="default" size="lg" className={BTN}>
              <Link href="/v2/student/pick-and-rate">Log a skill</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ul className="flex flex-col gap-4">
        {h.skills.map((sk) => (
          <li key={sk.skill.id}>
            <Card role="article" aria-labelledby={`hist-${sk.skill.id}`} data-history-skill={sk.skill.id}>
              <CardHeader className="gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle asChild className="text-base">
                    <h2 id={`hist-${sk.skill.id}`}>{sk.skill.name}</h2>
                  </CardTitle>
                  <StatusPill kind="skill-progress" value={sk.progress.achieved ? "achieved" : "in-progress"} />
                </div>
                <p className="text-sm text-muted-foreground">{sk.progress.summary}</p>
                <SkillProgressViz progress={sk.progress} name={sk.skill.name} />
              </CardHeader>
              <CardContent>
                <ol className="flex flex-col gap-3" aria-label={`Attempts at ${sk.skill.name}`}>
                  {sk.attempts.map((a) => (
                    <li key={a.key} className="flex flex-col gap-1.5 border-t border-border pt-3 first:border-t-0 first:pt-0" data-attempt={a.kind}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{`Attempt ${a.attempt}, ${fmtDate(a.date)}`}</span>
                        <StatusPill kind="attempt" value={a.kind} label={a.outcome} />
                      </div>
                      <p className="text-xs text-muted-foreground">{`${a.setting}. ${a.kind === "waiting" ? `With ${a.who}.` : `Evaluator: ${a.who}.`}`}</p>
                      <p className="text-sm text-foreground">{a.counted}</p>
                      {a.returnReason ? (
                        <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground" data-return-reason>
                          {`Your reviewer returned it: ${a.returnReason}`}
                        </p>
                      ) : null}
                      {a.failedRule ? (
                        <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground" data-failed-rule>
                          {a.failedRule}
                        </p>
                      ) : null}
                      {a.evaluation ? (
                        <div>
                          <Button type="button" variant="outline" size="sm" className={BTN} aria-label={`See details of attempt ${a.attempt} at ${sk.skill.name}`} onClick={() => setOpen({ skill: sk, attempt: a })}>
                            See details
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <Detail s={s} open={open} onClose={() => setOpen(null)} />
    </StudentPage>
  )
}

const OUT = { met: "Met", "not-met": "Did not meet the criteria", "not-yet": "Not yet, feedback only" } as const

function Detail({ s, open, onClose }: { s: V2State; open: { skill: SkillHistory; attempt: Attempt } | null; onClose: () => void }) {
  const e = open?.attempt.evaluation ?? null
  const name = (id: string) => s.people.find((p) => p.id === id)?.name ?? "an evaluator"
  return (
    <Dialog open={!!e} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        {e && open ? (
          <>
            <DialogHeader>
              <DialogTitle>{`${open.skill.skill.name}, attempt ${open.attempt.attempt}`}</DialogTitle>
              <DialogDescription>{open.attempt.counted}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Outcome</dt>
              <dd>{open.attempt.outcome}</dd>
              <dt className="text-muted-foreground">Evaluator</dt>
              <dd>{name(e.evaluatorId)}</dd>
              <dt className="text-muted-foreground">Setting</dt>
              <dd>{open.attempt.setting}</dd>
              <dt className="text-muted-foreground">Date</dt>
              <dd>{fmtDate(e.date)}</dd>
            </dl>
            <section aria-labelledby="versions-h" className="flex flex-col gap-2">
              <h3 id="versions-h" className="text-sm font-semibold">{`Versions (${e.versions.length})`}</h3>
              <ol className="flex flex-col gap-2" data-versions>
                {e.versions.slice().reverse().map((v) => (
                  <li key={v.version} className="rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="font-medium">{`Version ${v.version}, ${fmtDate(v.at)}: ${OUT[v.outcome]}`}</span>
                    <span className="block text-xs text-muted-foreground">{`By ${name(v.by)}. ${v.reason ?? "First version."}${v.version < e.currentVersion ? " Earlier version, kept as it was." : ""}`}</span>
                  </li>
                ))}
              </ol>
            </section>
            <p className="text-xs text-muted-foreground">A completed evaluation is never edited. A correction adds a version and keeps the earlier ones.</p>
            <Button asChild variant="outline" size="lg" className={BTN}>
              <Link href={`/v2/student/evaluation/${e.id}`}>See the full evaluation and versions</Link>
            </Button>
          </>
        ) : (
          <DialogHeader className="sr-only">
            <DialogTitle>Attempt details</DialogTitle>
            <DialogDescription>No attempt is selected.</DialogDescription>
          </DialogHeader>
        )}
        <DialogFooter>
          <Button type="button" variant="default" size="lg" className={BTN} onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Whether the program director has verified this record, by whom and when, and whether it changed since. */
function VerificationCard({ s }: { s: V2State }) {
  const st = verificationStatus(s, STUDENT_ID)
  const by = st.latest ? (s.people.find((p) => p.id === st.latest?.byId)?.name ?? "the program director") : ""
  return (
    <Card size="sm" data-verification-card={st.status}>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-foreground">Program verification</span>
          <StatusPill kind="verify" value={st.status} label={verifyLabel(st.status, st.latest?.version ?? null)} />
        </div>
        {st.latest ? (
          <p className="text-foreground">{`Verified by ${by} on ${fmtDate(st.latest.at)}, version ${st.latest.version}, based on ${st.latest.evidence.length} ${st.latest.evidence.length === 1 ? "evaluation" : "evaluations"}.`}</p>
        ) : (
          <p className="text-muted-foreground">Your program director has not verified your record yet. You can share a verified record once they do.</p>
        )}
        {st.status === "changed" ? <p className="text-foreground">Your program changed an evaluation after it was verified. The earlier verification is kept, and your director verifies the new version.</p> : null}
        <Button asChild variant={st.status === "verified" ? "default" : "outline"} size="lg" className={BTN} data-share-record>
          <Link href={RECORD_PATH}>Share your verified record</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
