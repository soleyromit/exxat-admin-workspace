"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { BTN, fmtDate, useStudentRun } from "@/components/v2/student/use-student"
import { evaluatorOf, lastReturn, NOTE_MAX, resendSubmission, returnNextStep } from "@/lib/v2/queue"
import { PHOTO_MAX_KB, STUDENT_ID } from "@/lib/v2/student"
import type { Submission, V2State } from "@/lib/v2/types"

/**
 * What a reviewer sent back, in the reviewer's own words, what to do next, and the way to send it again (RV-01). Sending again continues
 * the same record (RV-02): the revision count rises and the reason stays on file.
 */
export function ReturnedPanel({ s, x }: { s: V2State; x: Submission }) {
  const run = useStudentRun()
  const r = lastReturn(x)
  const reviewer = s.people.find((p) => p.id === r?.byId)?.name ?? "Your reviewer"
  const [note, setNote] = React.useState("")
  const [file, setFile] = React.useState<{ name: string; sizeKb: number; type: string } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const photo = x.method === "photo"
  const send = () => {
    setError(null)
    const res = run((st, at) => resendSubmission(st, x.id, { photo: file ?? undefined, note }, at, STUDENT_ID))
    if (!res.ok) setError(res.error)
  }
  return (
    <div className="flex flex-col gap-3" data-returned-panel={x.id}>
      <LocalBanner variant="warning" title="Returned to you for correction">
        <p data-returned-reason>{r?.reason ?? "Your reviewer returned this request."}</p>
        <p className="mt-1 text-xs">{`${reviewer}, ${r ? fmtDate(r.at) : ""}${(x.revisions ?? 0) > 0 ? `. You have sent it again ${x.revisions} ${x.revisions === 1 ? "time" : "times"} already` : ""}.`}</p>
      </LocalBanner>
      <p className="text-sm text-foreground" data-returned-next>{`What to do: ${returnNextStep(s, x, evaluatorOf(x))}`}</p>
      {photo ? (
        <div className="flex flex-col gap-2">
          <input ref={fileRef} id={`resend-photo-${x.id}`} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (!f) return
            setError(null)
            setFile({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)), type: f.type })
          }} />
          <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => fileRef.current?.click()}>
            {file ? "Choose a different photo" : "Choose a new photo"}
          </Button>
          <p className="text-xs text-muted-foreground">{file ? `${file.name}, ${file.sizeKb} KB` : `A JPG, PNG, HEIC or WebP under ${PHOTO_MAX_KB / 1024} MB.`}</p>
        </div>
      ) : null}
      <Field>
        <FieldLabel htmlFor={`resend-note-${x.id}`}>Note to your reviewer (optional)</FieldLabel>
        <Textarea id={`resend-note-${x.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <FieldDescription>{`${note.trim().length} of ${NOTE_MAX} characters.`}</FieldDescription>
      </Field>
      <div role="alert">
        {error ? (
          <LocalBanner variant="error" title="Not sent" data-resend-error>
            {error}
          </LocalBanner>
        ) : null}
      </div>
      <Button type="button" variant="default" size="lg" className={BTN} onClick={send} data-resend>
        {photo ? "Send the corrected photo for review" : "Send it again"}
      </Button>
    </div>
  )
}
