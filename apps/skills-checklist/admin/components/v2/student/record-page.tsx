"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { statusLabel, STATUS_TONE } from "@/components/v2/director/verification-pages"
import { Block, StudentPage } from "@/components/v2/student/student-frame"
import { BTN, fmtDate } from "@/components/v2/student/use-student"
import { downloadBytes, fileSlug } from "@/lib/v2/download"
import { signPdf } from "@/lib/v2/pdf"
import { clrOf, recordContent, verifiedRecord } from "@/lib/v2/record"
import { useV2State } from "@/lib/v2/react"
import { STUDENT_ID } from "@/lib/v2/student"
import { HISTORY_PATH } from "@/lib/v2/paths"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const settingWord = (e: { setting: string; clinicalSetting?: string }) => (e.setting === "clinical" ? `Clinical${e.clinicalSetting ? `, ${e.clinicalSetting}` : ""}` : e.setting === "lab" ? "Lab" : "Simulation")

/** Scenario step 13: what the program verified, what is left out and why, and the two files Maya can share. */
export function RecordPage() {
  const s = useV2State()
  const r = verifiedRecord(s, STUDENT_ID)
  const [done, setDone] = React.useState<{ kind: "pdf" | "clr"; name: string; hash: string } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const tone = STATUS_TONE[r.status]
  const slug = fileSlug(r.student?.name ?? "student", `v${r.verification?.version ?? 0}`)

  const pdf = async () => {
    setError(null)
    const c = recordContent(s, STUDENT_ID, new Date().toISOString())
    if (!c) return setError("Nothing can be shared yet.")
    try {
      const signed = await signPdf(c)
      const name = `verified-skills-record-${slug}.pdf`
      downloadBytes(name, "application/pdf", signed.bytes)
      setDone({ kind: "pdf", name, hash: signed.hash })
    } catch {
      setError("The PDF could not be made in this browser. Try again in a current version of Chrome, Edge, Firefox or Safari.")
    }
  }

  const clr = () => {
    setError(null)
    const doc = clrOf(s, STUDENT_ID, new Date().toISOString())
    if (!doc) return setError("Nothing can be shared yet.")
    const name = `verified-skills-record-${slug}.clr.json`
    downloadBytes(name, "application/json", JSON.stringify(doc, null, 2))
    setDone({ kind: "clr", name, hash: "" })
  }

  return (
    <StudentPage title="Share your verified record" subtitle="Only what your program director verified can leave the program. See what is in it before you share.">
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {done ? (
          <LocalBanner variant="success" title="Verified record downloaded" data-record-done={done.kind}>
            {done.kind === "pdf" ? `${done.name}. Content hash starts ${done.hash.slice(0, 12)}.` : `${done.name}. It is unsigned.`}
          </LocalBanner>
        ) : null}
      </div>
      {error ? <LocalBanner variant="error" title="Nothing was downloaded">{error}</LocalBanner> : null}

      <Card size="sm" data-record-status={r.status}>
        <CardContent className="flex flex-col gap-2 text-sm">
          <StatusBadge label={statusLabel(r.status, r.verification?.version ?? null)} tone={tone.tone} icon={tone.icon} size="sm" />
          <p className="text-foreground">{r.verification ? `This record was verified by ${r.verifiedBy} on ${fmtDate(r.verification.at)}, version ${r.verification.version}.` : "Your program director has not verified your record yet."}</p>
        </CardContent>
      </Card>

      {r.blocked ? (
        <LocalBanner variant={r.status === "changed" ? "warning" : "info"} title="Sharing is off" data-record-blocked>
          <p>{r.blocked}</p>
          <Button asChild variant="outline" size="lg" className={`${BTN} mt-2`}>
            <Link href={HISTORY_PATH}>Back to your record</Link>
          </Button>
        </LocalBanner>
      ) : null}

      {r.canShare ? (
        <>
          <Block id="included" title="What is included" description="Met evaluations your director verified, for skills you had achieved at that time.">
            {r.included.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-included-empty>No skill is achieved yet. The file would be a verified record with no skills in it.</p>
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Included skills" data-included>
                {r.included.map((k) => (
                  <li key={k.skill.id}>
                    <Card size="sm" data-included-skill={k.skill.id}>
                      <CardContent className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-foreground">{k.skill.name}</span>
                        <ul className="flex flex-col gap-0.5 text-muted-foreground" aria-label={`Evaluations for ${k.skill.name}`}>
                          {k.evaluations.map((e) => (
                            <li key={e.id}>{`${fmtDate(e.date)}, ${settingWord(e)}, ${s.people.find((p) => p.id === e.evaluatorId)?.name ?? "Unknown person"}: Met`}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block id="excluded" title="What is not included" description="Each item with the reason it stays with you or the program.">
            {r.excluded.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing was left out.</p>
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Not included" data-excluded>
                {r.excluded.map((x) => (
                  <li key={x.key}>
                    <Card size="sm" data-excluded-item={x.key}>
                      <CardContent className="flex flex-col gap-0.5 text-sm">
                        <span className="font-medium text-foreground">{x.label}</span>
                        <span className="text-muted-foreground">{x.reason}</span>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block id="download" title="Download" description={`${r.included.reduce((n, k) => n + k.evaluations.length, 0)} ${plural(r.included.reduce((n, k) => n + k.evaluations.length, 0), "evaluation", "evaluations")} in ${r.included.length} ${plural(r.included.length, "skill", "skills")}.`}>
            <Card size="sm">
              <CardContent className="flex flex-col gap-2 text-sm">
                <Button type="button" variant="default" size="lg" className={BTN} data-download-pdf onClick={pdf}>Download PDF</Button>
                <p className="text-muted-foreground">A signed PDF. Whoever receives it can check it has not changed. This prototype signs with a demo key, so the check shows the file is unchanged, not who made it.</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-2 text-sm">
                <Button type="button" variant="outline" size="lg" className={BTN} data-download-clr onClick={clr}>Download CLR 2.0 file</Button>
                <p className="text-muted-foreground">A JSON file in the 1EdTech Comprehensive Learner Record 2.0 shape, one achievement for each skill above. It is unsigned. A receiving system will not treat it as a verifiable credential until the program signs it.</p>
              </CardContent>
            </Card>
          </Block>
        </>
      ) : null}
    </StudentPage>
  )
}
