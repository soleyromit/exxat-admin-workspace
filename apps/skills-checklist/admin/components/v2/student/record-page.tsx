"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { StatusPill } from "@/components/v2/status-pill"
import { Block, StudentPage } from "@/components/v2/student/student-frame"
import { BANNER_TOUCH, BTN, fmtDate } from "@/components/v2/student/use-student"
import { downloadBytes, fileSlug } from "@/lib/v2/download"
import { signPdf } from "@/lib/v2/pdf"
import { clrOf, recordContent, verifiedRecord } from "@/lib/v2/record"
import { LoadingBlocks } from "@/components/v2/shared-loading"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { STUDENT_ID } from "@/lib/v2/student"
import { HISTORY_PATH } from "@/lib/v2/paths"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const settingWord = (e: { setting: string; clinicalSetting?: string }) => (e.setting === "clinical" ? `Clinical${e.clinicalSetting ? `, ${e.clinicalSetting}` : ""}` : e.setting === "lab" ? "Lab" : "Simulation")

/** What the program verified, what is left out and why, and the two files Maya can share. */
export function RecordPage() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const r = verifiedRecord(s, STUDENT_ID)
  const [done, setDone] = React.useState<{ kind: "pdf" | "clr"; name: string; hash: string } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [failed, setFailed] = React.useState<"pdf" | "clr">("pdf")
  const [busy, setBusy] = React.useState<"pdf" | "clr" | null>(null)
  const slug = fileSlug(r.student?.name ?? "student", `v${r.verification?.version ?? 0}`)

  const pdf = async () => {
    if (busy) return
    setError(null)
    setFailed("pdf")
    const c = recordContent(s, STUDENT_ID, new Date().toISOString())
    if (!c) return setError("Nothing can be shared yet.")
    setBusy("pdf")
    try {
      const signed = await signPdf(c)
      const name = `verified-skills-record-${slug}.pdf`
      downloadBytes(name, "application/pdf", signed.bytes)
      setDone({ kind: "pdf", name, hash: signed.hash })
    } catch {
      setError("The PDF could not be made in this browser. Try again in a current version of Chrome, Edge, Firefox or Safari.")
    } finally {
      setBusy(null)
    }
  }

  const clr = () => {
    if (busy) return
    setError(null)
    setFailed("clr")
    const doc = clrOf(s, STUDENT_ID, new Date().toISOString())
    if (!doc) return setError("Nothing can be shared yet.")
    setBusy("clr")
    const name = `verified-skills-record-${slug}.clr.json`
    downloadBytes(name, "application/json", JSON.stringify(doc, null, 2))
    setDone({ kind: "clr", name, hash: "" })
    setBusy(null)
  }

  if (!hydrated) return <StudentPage title="Share your verified record"><LoadingBlocks label="Opening your record" rows={4} /></StudentPage>

  return (
    <StudentPage title="Share your verified record" subtitle="Only verified evidence can be shared.">
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {done ? (
          <LocalBanner variant="success" title="Verified record downloaded" data-record-done={done.kind}>
            {done.kind === "pdf" ? `${done.name}. Content hash starts ${done.hash.slice(0, 12)}.` : `${done.name}. It is unsigned.`}
          </LocalBanner>
        ) : null}
      </div>
      {error ? <LocalBanner className={BANNER_TOUCH} variant="error" title="Nothing was downloaded" retry={{ label: failed === "pdf" ? "Try the PDF again" : "Try the CLR file again", onClick: () => (failed === "pdf" ? void pdf() : clr()) }}>{error}</LocalBanner> : null}

      <Card size="sm" data-record-status={r.status}>
        <CardContent className="flex flex-col gap-2 text-sm">
          <StatusPill kind="verify" value={r.status} label={r.status === "verified" && r.verification?.version ? `Verified, version ${r.verification.version}` : undefined} />
          <p className="text-foreground">{r.verification ? `This record was verified by ${r.verifiedBy} on ${fmtDate(r.verification.at)}, version ${r.verification.version}.` : "Your program director has not verified your record yet."}</p>
        </CardContent>
      </Card>

      {r.blocked ? (
        <LocalBanner variant={r.status === "changed" ? "warning" : "info"} title="Sharing is off" data-record-blocked>
          <p>{r.blocked}</p>
          <Button asChild variant="outline" size="lg" className={`${BTN} mt-2`}>
            <Link href={HISTORY_PATH}>Back to Record</Link>
          </Button>
        </LocalBanner>
      ) : null}

      {r.canShare ? (
        <>
          <Block id="included" title="What is included" description="Verified Met evaluations for achieved skills.">
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

          <Block id="excluded" title="What is not included">
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
                <Button type="button" variant="default" size="lg" className={BTN} data-download-pdf disabled={busy !== null} aria-busy={busy === "pdf" || undefined} onClick={pdf}>{busy === "pdf" ? "Making the PDF" : "Download PDF"}</Button>
                <p className="text-muted-foreground">A signed PDF. Whoever receives it can check that it has not changed since it was issued.</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex flex-col gap-2 text-sm">
                <Button type="button" variant="outline" size="lg" className={BTN} data-download-clr disabled={busy !== null} aria-busy={busy === "clr" || undefined} onClick={clr}>Download CLR 2.0 file</Button>
                <p className="text-muted-foreground">CLR 2.0 JSON, one achievement per skill. Unsigned, so not a verifiable credential yet.</p>
              </CardContent>
            </Card>
          </Block>
        </>
      ) : null}
    </StudentPage>
  )
}
