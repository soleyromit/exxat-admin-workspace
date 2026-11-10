"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { BTN } from "@/components/v2/preceptor/evaluation-form"
import { downloadBytes, fileSlug } from "@/lib/v2/download"
import { checkPdf, signPdf, type CheckResult, type SignedContent } from "@/lib/v2/pdf"
import { cohortReportContent, studentReportContent } from "@/lib/v2/report-docs"
import type { ReportFilters } from "@/lib/v2/reports"
import type { V2State } from "@/lib/v2/types"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

interface Done {
  name: string
  pages: number
  hash: string
  fileHash: string
}

/** Export: sign a cohort or student PDF, and check a PDF made here. One DS Sheet opened from one button on the page. */
export function ExportSheet({ s, f, students, open, onOpenChange }: { s: V2State; f: ReportFilters; students: Array<{ id: string; name: string }>; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [studentId, setStudentId] = React.useState("")
  const [done, setDone] = React.useState<Done | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<"cohort" | "student" | null>(null)
  const running = React.useRef(false)
  const [check, setCheck] = React.useState<{ name: string; result: CheckResult } | null>(null)
  const lastDownload = React.useRef<(() => void) | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const chosen = students.find((p) => p.id === studentId)

  // A new filter set makes a new report: the last download no longer describes what is on screen.
  React.useEffect(() => setDone(null), [f])

  const download = async (content: SignedContent | null, file: string, which: "cohort" | "student") => {
    if (running.current) return
    lastDownload.current = () => void download(content, file, which)
    setError(null)
    if (!content) {
      setError("Choose a student first.")
      return
    }
    running.current = true
    setBusy(which)
    try {
      const signed = await signPdf(content)
      downloadBytes(file, "application/pdf", signed.bytes)
      setDone({ name: file, pages: signed.pages, hash: signed.hash, fileHash: signed.fileHash })
    } catch {
      setError("The PDF could not be made in this browser. Try again, or open the page in a current version of Chrome, Edge, Firefox or Safari.")
    } finally {
      running.current = false
      setBusy(null)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setCheck({ name: file.name, result: await checkPdf(new Uint8Array(await file.arrayBuffer())) })
    } catch {
      setCheck({ name: file.name, result: { ok: false, reason: "unreadable", message: "This file could not be read." } })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex flex-col gap-0 p-0" data-export-sheet>
        <SheetHeader className="border-b border-border p-4 pe-12">
          <SheetTitle>Export</SheetTitle>
          <SheetDescription>PDFs carry the filters on screen and a signature.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
          <section aria-labelledby="export-sign" className="flex flex-col gap-3">
            <h3 id="export-sign" className="text-base font-semibold text-foreground">Signed PDF</h3>
            <div role="status" aria-live="polite" className="flex flex-col gap-2">
              {done ? (
                <LocalBanner variant="success" title="PDF downloaded" data-pdf-done data-pdf-hash={done.hash} data-pdf-file-hash={done.fileHash}>
                  <p>{`${done.name}, ${done.pages} ${plural(done.pages, "page", "pages")}.`}</p>
                  <p className="font-mono text-xs break-all">{`Content hash ${done.hash}`}</p>
                  <p className="font-mono text-xs break-all">{`File hash ${done.fileHash}`}</p>
                </LocalBanner>
              ) : null}
            </div>
            {error ? <LocalBanner variant="error" title="No PDF was made" retry={{ label: "Try the PDF again", onClick: () => lastDownload.current?.() }}>{error}</LocalBanner> : null}
            <div>
              <Button type="button" variant="default" size="lg" className={BTN} disabled={students.length === 0 || busy !== null} aria-busy={busy === "cohort" || undefined} data-download="cohort" onClick={() => download(cohortReportContent(s, f, new Date().toISOString()), `cohort-skills-report-${fileSlug(s.course.code, s.course.term)}.pdf`, "cohort")}>
                {busy === "cohort" ? "Signing the PDF" : "Download cohort PDF"}
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="pdf-student">Student</Label>
              <Select value={studentId} onValueChange={(v) => { setStudentId(v); setError(null) }}>
                <SelectTrigger id="pdf-student" className="w-full"><SelectValue placeholder="Choose a student" /></SelectTrigger>
                <SelectContent>
                  {students.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="button" variant="outline" size="lg" className={BTN} disabled={busy !== null} aria-busy={busy === "student" || undefined} data-download="student" onClick={() => download(studentReportContent(s, studentId, f, new Date().toISOString()), `skills-report-${fileSlug(chosen?.name ?? "student")}.pdf`, "student")}>
                {busy === "student" ? "Signing the PDF" : chosen ? `Download PDF for ${chosen.name}` : "Download PDF for one student"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" data-signature-note>
              A signature shows the file is unchanged since it was signed here. It does not show who made it. Concerns, self-ratings, notes and evaluator feedback are never included.
            </p>
          </section>

          <section aria-labelledby="export-check" className="flex flex-col gap-3 border-t border-border pt-4">
            <h3 id="export-check" className="text-base font-semibold text-foreground">Check a PDF</h3>
            <input ref={fileRef} id="check-file" type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = "" }} />
            <div>
              <Button type="button" variant="outline" size="lg" className={BTN} data-check-open onClick={() => fileRef.current?.click()}>
                Choose a PDF to check
              </Button>
            </div>
            <div role="status" aria-live="polite" className="flex flex-col gap-2">
              {check ? (
                check.result.ok ? (
                  <LocalBanner variant="success" title="This file is unchanged" data-check-result="ok">
                    <p>{`${check.name} matches what was signed: ${check.result.content.title}, ${check.result.content.subject} Made ${check.result.content.generatedAt.slice(0, 10)}.`}</p>
                    <p className="font-mono text-xs break-all">{`Content hash ${check.result.hash}`}</p>
                    <p>This does not show who made it.</p>
                  </LocalBanner>
                ) : (
                  <LocalBanner variant="warning" title="This file does not pass the check" data-check-result={check.result.reason}>
                    {`${check.name}. ${check.result.message}`}
                  </LocalBanner>
                )
              ) : null}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
