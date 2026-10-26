"use client"

import { LoadingBlocks } from "@/components/v2/shared-loading"
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { SelectionTileGrid } from "@exxatdesignux/ui/components/ui/selection-tile-grid"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { Block, StudentPage } from "@/components/v2/student/student-frame"
import { QrCode } from "@/components/v2/student/qr-code"
import { ReturnedPanel } from "@/components/v2/student/returned-panel"
import { SyncChip } from "@/components/v2/student/sync-chip"
import { Announce, BANNER_TOUCH, fmtDate, TOUCH, useStudentRun, BTN } from "@/components/v2/student/use-student"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { createRequest, evaluatorChoices, METHOD_WORD, PHOTO_MAX_KB, requestPath, requestsOf, requestWaitText, STUDENT_ID } from "@/lib/v2/student"
import { syncBlock, syncStateOf } from "@/lib/v2/sync"
import type { SignoffMethod, Submission, V2State } from "@/lib/v2/types"

const METHODS: Array<{ value: SignoffMethod; label: string; icon: string; description: string }> = [
  { value: "qr", label: "QR code", icon: "fa-qrcode", description: "The evaluator scans it with their phone." },
  { value: "handover", label: "Hand over phone", icon: "fa-hand-holding", description: "The evaluator signs on this phone." },
  { value: "link", label: "Link", icon: "fa-link", description: "Send it to one or several evaluators." },
  { value: "photo", label: "Photo of paper form", icon: "fa-camera", description: "A signed form goes to review." },
]

const BIG = "min-h-14 w-full text-base"

function useOrigin(): string {
  const [o, setO] = React.useState("")
  React.useEffect(() => setO(window.location.origin), [])
  return o
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const nameList = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? ""))

interface Photo {
  url: string
  name: string
  sizeKb: number
  type: string
}

/** Walkthrough step 6: ask for sign-off by QR code, handing over the phone, a link, or a photo of a signed paper form. */
export function RequestSignoff() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const run = useStudentRun()
  const origin = useOrigin()
  const params = useSearchParams()
  const wanted = params?.get("entries")?.split(",").filter(Boolean) ?? null
  const unsent = s.logEntries.filter((e) => e.studentId === STUDENT_ID && e.setting === "clinical" && e.requestId === null)
  const [picked, setPicked] = React.useState<string[] | null>(null)
  const selected = (picked ?? wanted ?? unsent.map((e) => e.id)).filter((id) => unsent.some((e) => e.id === id))
  const [method, setMethod] = React.useState<SignoffMethod>("qr")
  const [chosenRaw, setChosen] = React.useState<string[]>([])
  const [photo, setPhoto] = React.useState<Photo | null>(null)
  const [photoError, setPhotoError] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<{ id: string; text: string } | null>(null)
  const [manual, setManual] = React.useState<string | null>(null)
  const [qrFor, setQrFor] = React.useState<string | null>(null)
  const [handoverFor, setHandoverFor] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState("")
  const fileRef = React.useRef<HTMLInputElement>(null)
  const cameraRef = React.useRef<HTMLInputElement>(null)

  const skillIds = [...new Set(selected.map((id) => unsent.find((e) => e.id === id)?.skillId).filter((x): x is string => !!x))]
  const choices = React.useMemo(() => evaluatorChoices(s, skillIds), [s, skillIds.join("|")]) // eslint-disable-line react-hooks/exhaustive-deps
  const eligibleIds = new Set(choices.filter((c) => c.eligible).map((c) => c.person.id))
  const chosen = chosenRaw.filter((id) => eligibleIds.has(id))
  const nobody = skillIds.length > 0 && eligibleIds.size === 0
  const skillName = (id: string) => s.skills.find((k) => k.id === id)?.name ?? "A skill"

  const pickPhoto = (file: File | undefined) => {
    setPhotoError(null)
    if (!file) return
    if (!file.type.startsWith("image/")) {
      const kind = file.type === "application/pdf" ? "a PDF" : file.type ? `a ${file.type.split("/")[1]?.toUpperCase()} file` : "not a photo"
      setPhotoError(`That file is ${kind}. Choose a photo (JPG, PNG, HEIC or WebP) under ${PHOTO_MAX_KB / 1024} MB.`)
      return
    }
    if (file.size / 1024 > PHOTO_MAX_KB) {
      setPhotoError(`That photo is ${Math.round(file.size / 1024 / 1024)} MB. Choose one under ${PHOTO_MAX_KB / 1024} MB.`)
      return
    }
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto({ url: URL.createObjectURL(file), name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), type: file.type })
  }
  React.useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])

  const create = async () => {
    setError(null)
    setManual(null)
    const offline = syncBlock(s.device)
    const entryNames = nameList(skillIds.map(skillName))
    const place = unsent.find((e) => e.id === selected[0])
    const r = run((st, at) => createRequest(st, { entryIds: selected, method, evaluatorIds: chosen, photo: photo ? { name: photo.name, sizeKb: photo.sizeKb, type: photo.type } : undefined }, at))
    if (!r.ok) return setError(r.error)
    const who = nameList(chosen.map((id) => s.people.find((p) => p.id === id)?.name ?? "an evaluator"))
    const where = place ? `${place.clinicalSetting}, ${place.location}` : ""
    const saved = offline ? " Saved on this phone. It is sent when you are online and signed in." : ""
    const role = chosen.length === 1 ? ` (${s.people.find((p) => p.id === chosen[0])?.title})` : ""
    const text =
      method === "photo"
        ? `Photo sent for review. ${who} signed the paper form for ${entryNames}. Setting: ${where}.${saved}`
        : `Request sent to ${who}${role} for ${entryNames}. Setting: ${where}.${saved}`
    setDone({ id: r.submissionId, text })
    setStatus(text)
    setPicked(null)
    setChosen([])
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto(null)
    if (method === "qr") setQrFor(r.submissionId)
    if (method === "handover") setHandoverFor(r.submissionId)
    if (method === "link") {
      const ok = await copyText(`${origin}${requestPath(r.submissionId)}`)
      if (!ok) setManual(r.submissionId)
    }
  }

  const actionLabel = { qr: "Create request and show QR code", handover: "Create request and hand over phone", link: chosen.length > 1 ? `Create one request and copy link for ${chosen.length} evaluators` : "Create request and copy link", photo: "Send photo for review" }[method]
  const needPhoto = method === "photo" && !photo
  const ready = selected.length > 0 && chosen.length > 0 && !needPhoto && !nobody
  const why = selected.length === 0 ? "Choose at least one logged skill." : nobody ? "" : chosen.length === 0 ? (method === "photo" ? "Choose who signed the paper form." : "Choose an evaluator.") : needPhoto ? "Add a photo of the signed form." : ""

  const requests = requestsOf(s)

  if (!hydrated) return <StudentPage title="Requests"><LoadingBlocks label="Opening requests" rows={4} /></StudentPage>
  return (
    <StudentPage title="Requests">
      <Announce message={status} />
      {done ? (
        <LocalBanner variant="success" title="Request created" dismissible onDismiss={() => setDone(null)} data-request-done>
          <p>{done.text}</p>
          {manual ? <CopyManual id={manual} origin={origin} /> : null}
        </LocalBanner>
      ) : null}
      {error ? (
        <LocalBanner className={BANNER_TOUCH} variant="error" title="Not sent" retry={{ label: "Send the request again", onClick: () => void create() }} data-request-error>
          {error}
        </LocalBanner>
      ) : null}

      <Block id="entries" title={`Ready to send (${unsent.length})`} description="Lab and simulation practice trials are not sent.">
        {unsent.length === 0 ? (
          <Card size="sm">
            <CardContent className="flex flex-col gap-2 text-sm">
              <p className="font-medium text-foreground">Nothing to send yet</p>
              <p className="text-muted-foreground">Log a skill first. It appears here.</p>
              <Button asChild variant="default" size="lg" className={BTN}>
                <Link href="/v2/student/pick-and-rate">Log a skill</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {unsent.map((e) => {
              const conflict = s.syncQueue.some((i) => i.entryId === e.id && i.state === "conflict")
              const id = `entry-${e.id}`
              return (
                <li key={e.id} className={`${TOUCH} flex items-start gap-3 rounded-lg border border-border bg-card p-3`}>
                  <Checkbox id={id} checked={selected.includes(e.id)} disabled={conflict} aria-describedby={`${id}-d`} className="mt-0.5" onCheckedChange={(v) => { setError(null); setPicked(v === true ? [...selected, e.id] : selected.filter((x) => x !== e.id)) }} />
                  <Label htmlFor={id} className="flex flex-1 flex-col items-start gap-0.5 text-start font-normal">
                    <span className="text-sm font-medium text-foreground">{skillName(e.skillId)}</span>
                    <span id={`${id}-d`} className="text-xs text-muted-foreground">
                      {conflict ? "This entry has a sync conflict. Fix it before you send it." : `Clinical, ${e.clinicalSetting}, ${e.location}. ${e.rating ? `You rated yourself: ${e.rating}.` : ""}`}
                    </span>
                  </Label>
                  <SyncChip state={syncStateOf(s, { entryId: e.id })} />
                </li>
              )
            })}
          </ul>
        )}
      </Block>

      {unsent.length > 0 ? (
        <>
          <Block id="method" title="How do you want to ask?">
            <SelectionTileGrid<SignoffMethod> sectionLabel="How do you want to ask?" options={METHODS} columns={2} value={method} onValueChange={(v) => { setMethod(v); setChosen([]); setError(null) }} interaction="radio" idPrefix="method" />
          </Block>

          <Block id="who" title={method === "photo" ? "Who signed the paper form?" : method === "link" ? "Who can open the link?" : "Who signs off?"} description={method === "link" ? "Pick several. The first to finish completes it for all." : "Only qualified evaluators are listed. No account needed."}>
            {skillIds.length === 0 ? <p className="text-sm text-muted-foreground">Choose a logged skill above to see who can sign it off.</p> : null}
            {nobody ? (
              <LocalBanner variant="warning" title="No evaluator can sign this off">
                {`No evaluator on record is qualified to sign off ${nameList(skillIds.map(skillName))}. Ask your program to add one, or send the skills separately.`}
              </LocalBanner>
            ) : null}
            {skillIds.length > 0 ? <EvaluatorPicker choices={choices} multiple={method === "link"} value={chosen} onChange={(v) => { setError(null); setChosen(v) }} /> : null}
          </Block>

          {method === "photo" ? (
            <Block id="photo" title="Photo of the signed form" description={`JPG, PNG, HEIC or WebP, under ${PHOTO_MAX_KB / 1024} MB.`}>
              <input ref={fileRef} id="photo-file" type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = "" }} />
              <input ref={cameraRef} id="photo-camera" type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = "" }} />
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => fileRef.current?.click()}>
                  Choose a photo
                </Button>
                <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => cameraRef.current?.click()}>
                  Take a photo
                </Button>
              </div>
              {photoError ? <FieldError errors={[{ message: photoError }]} /> : null}
              {photo ? (
                <Card size="sm" data-photo-preview>
                  <CardContent className="flex flex-col gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="Preview of the signed paper form you chose" className="max-h-64 w-full rounded-md object-contain" />
                    <p className="text-sm text-foreground">{`${photo.name}, ${photo.sizeKb} KB`}</p>
                    <Button type="button" variant="outline" size="lg" className={BTN} onClick={() => { URL.revokeObjectURL(photo.url); setPhoto(null) }}>
                      Remove photo
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </Block>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button type="button" variant="default" size="lg" className={BTN} disabled={!ready} aria-describedby={why ? "request-why" : undefined} onClick={create} data-create-request>
              {actionLabel}
            </Button>
            {why ? (
              <p id="request-why" className="text-sm text-muted-foreground">
                {why}
              </p>
            ) : null}
            {s.device.offline || s.device.signedOut ? <p className="text-sm text-muted-foreground">{s.device.offline ? "Offline: saved on this phone and sent later. QR code and link work once sent. Handing over the phone works now." : "Signed out: saved on this phone and sent after you sign in."}</p> : null}
          </div>
        </>
      ) : null}

      <Block id="requests" title={`Your requests (${requests.length})`}>
        {requests.length === 0 ? <p className="text-sm text-muted-foreground" data-requests-empty>No requests yet. A request you send appears here.</p> : null}
        <ul className="flex flex-col gap-3">
          {requests.map((x) => (
            <li key={x.id}>
              <RequestCard s={s} x={x} origin={origin} onQr={() => setQrFor(x.id)} onHandover={() => setHandoverFor(x.id)} onCopy={async () => { const ok = await copyText(`${origin}${requestPath(x.id)}`); setStatus(ok ? "Link copied." : ""); if (!ok) setManual(x.id) }} manual={manual === x.id} />
            </li>
          ))}
        </ul>
      </Block>

      <QrDialog s={s} id={qrFor} origin={origin} onClose={() => setQrFor(null)} />
      <HandoverSheet s={s} id={handoverFor} onClose={() => setHandoverFor(null)} />
    </StudentPage>
  )
}

function CopyManual({ id, origin }: { id: string; origin: string }) {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => ref.current?.select(), [])
  return (
    <div className="mt-2 flex flex-col gap-1">
      <Label htmlFor={`manual-${id}`}>Your phone blocked copying. Copy this link by hand.</Label>
      <Input ref={ref} id={`manual-${id}`} readOnly value={`${origin}${requestPath(id)}`} className={TOUCH} onFocus={(e) => e.currentTarget.select()} />
    </div>
  )
}

function EvaluatorPicker({ choices, multiple, value, onChange }: { choices: ReturnType<typeof evaluatorChoices>; multiple: boolean; value: string[]; onChange: (v: string[]) => void }) {
  const row = (c: (typeof choices)[number], control: React.ReactNode, id: string) => (
    <Label key={c.person.id} htmlFor={id} className={`${TOUCH} flex items-start gap-3 rounded-lg border border-border bg-card p-3 font-normal`}>
      {control}
      <span className="flex flex-1 flex-col items-start gap-0.5 text-start">
        <span className="text-sm font-medium text-foreground">{c.person.name}</span>
        <span className="text-xs text-muted-foreground">{c.person.title}</span>
        <span id={`${id}-d`} className="text-xs text-foreground" data-reason={c.eligible ? undefined : "unqualified"}>
          {c.eligible ? "Qualified for the skills you picked" : c.reasons.map((r) => (r.endsWith(".") ? r : `${r}.`)).join(" ")}
        </span>
      </span>
    </Label>
  )
  if (multiple) {
    return (
      <div className="flex flex-col gap-2" role="group" aria-label="Evaluators">
        {choices.map((c) => {
          const id = `eval-${c.person.id}`
          return row(c, <Checkbox id={id} checked={value.includes(c.person.id)} disabled={!c.eligible} aria-describedby={`${id}-d`} className="mt-0.5" onCheckedChange={(v) => onChange(v === true ? [...value, c.person.id] : value.filter((x) => x !== c.person.id))} />, id)
        })}
      </div>
    )
  }
  return (
    <RadioGroup aria-label="Evaluator" value={value[0] ?? ""} onValueChange={(v) => onChange([v])} className="flex flex-col gap-2">
      {choices.map((c) => {
        const id = `eval-${c.person.id}`
        return row(c, <RadioGroupItem id={id} value={c.person.id} disabled={!c.eligible} aria-describedby={`${id}-d`} className="mt-0.5" />, id)
      })}
    </RadioGroup>
  )
}

function RequestCard({ s, x, origin, onQr, onHandover, onCopy, manual }: { s: V2State; x: Submission; origin: string; onQr: () => void; onHandover: () => void; onCopy: () => void; manual: boolean }) {
  const names = x.skillIds.map((id) => s.skills.find((k) => k.id === id)?.name ?? "A skill")
  const open = x.status !== "done" && x.status !== "returned"
  return (
    <Card size="sm" role="article" aria-label={`Request for ${nameList(names)}`} data-request={x.id} data-request-status={x.status}>
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle asChild className="text-base">
            <h3>{nameList(names)}</h3>
          </CardTitle>
          <SyncChip state={syncStateOf(s, { requestId: x.id })} />
        </div>
        <CardDescription>{`${METHOD_WORD[x.method][0].toUpperCase()}${METHOD_WORD[x.method].slice(1)}, ${fmtDate(x.createdAt)}`}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {x.status === "returned" ? null : <p className="text-foreground">{requestWaitText(s, x)}</p>}
        {x.photo ? <p className="text-muted-foreground">{`Photo: ${x.photo.name}, ${x.photo.sizeKb} KB`}</p> : null}
        {x.status === "returned" ? <ReturnedPanel s={s} x={x} /> : null}
        {open && x.method !== "photo" ? (
          <div className="flex flex-col gap-2">
            {x.method === "qr" ? (
              <Button type="button" variant="outline" size="lg" className={BTN} onClick={onQr}>
                {`Show QR code for ${names[0]}${names.length > 1 ? ` and ${names.length - 1} more` : ""}`}
              </Button>
            ) : null}
            {x.method === "handover" ? (
              <Button type="button" variant="outline" size="lg" className={BTN} onClick={onHandover}>
                Hand over phone again
              </Button>
            ) : null}
            {x.method === "link" ? (
              <Button type="button" variant="outline" size="lg" className={BTN} onClick={onCopy}>
                {`Copy link for ${names[0]}${names.length > 1 ? ` and ${names.length - 1} more` : ""}`}
              </Button>
            ) : null}
          </div>
        ) : null}
        {manual ? <CopyManual id={x.id} origin={origin} /> : null}
      </CardContent>
    </Card>
  )
}

function QrDialog({ s, id, origin, onClose }: { s: V2State; id: string | null; origin: string; onClose: () => void }) {
  const x = id ? s.submissions.find((y) => y.id === id) : null
  const link = x ? `${origin}${requestPath(x.id)}` : ""
  const [copied, setCopied] = React.useState(false)
  const who = x ? (s.people.find((p) => p.id === x.assignedToId)?.name ?? "the evaluator") : ""
  const names = x ? nameList(x.skillIds.map((k) => s.skills.find((z) => z.id === k)?.name ?? "A skill")) : ""
  const waiting = x?.status === "on-device"
  return (
    <Dialog open={!!x} onOpenChange={(o) => { if (!o) { setCopied(false); onClose() } }}>
      <DialogContent className="sm:max-w-sm" data-qr-dialog>
        <DialogHeader>
          <DialogTitle>{`Show this to ${who}`}</DialogTitle>
          <DialogDescription>{`They scan it with their phone camera to sign off ${names}. No account is needed.`}</DialogDescription>
        </DialogHeader>
        {x && origin ? <QrCode text={link} label={`QR code that opens the sign-off request for ${names}`} /> : null}
        <div className="flex flex-col gap-1">
          <Label htmlFor="qr-link">Link in the code</Label>
          <Input id="qr-link" readOnly value={link} className={TOUCH} onFocus={(e) => e.currentTarget.select()} data-qr-link />
        </div>
        {waiting ? <p className="text-sm text-foreground">This request is saved on your phone. The code works once it is sent.</p> : null}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" variant="outline" size="lg" className={BTN} onClick={async () => setCopied(await copyText(link))}>
            {copied ? "Link copied" : "Copy link"}
          </Button>
          {x ? (
            <Button asChild variant="outline" size="lg" className={BTN}>
              <Link href={requestPath(x.id)}>Open what the evaluator sees</Link>
            </Button>
          ) : null}
          <Button type="button" variant="default" size="lg" className={BTN} onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Full-screen handover: the student view, the evaluator view with large controls, and the way back. */
function HandoverSheet({ s, id, onClose }: { s: V2State; id: string | null; onClose: () => void }) {
  const x = id ? s.submissions.find((y) => y.id === id) : null
  const [phase, setPhase] = React.useState<"student" | "evaluator" | "back">("student")
  React.useEffect(() => { if (id) setPhase("student") }, [id])
  const who = x ? (s.people.find((p) => p.id === x.assignedToId)?.name ?? "the evaluator") : ""
  const maya = s.people.find((p) => p.id === STUDENT_ID)?.name ?? "the student"
  const names = x ? x.skillIds.map((k) => s.skills.find((z) => z.id === k)?.name ?? "A skill") : []
  return (
    <Sheet open={!!x} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" size="full" showCloseButton data-handover={phase}>
        <SheetHeader>
          <SheetTitle>{phase === "student" ? `Hand your phone to ${who}` : phase === "evaluator" ? `Hello ${who}` : `Welcome back, ${maya.split(" ")[0]}`}</SheetTitle>
          <SheetDescription>{phase === "student" ? "Handover mode keeps the next screen simple for the evaluator." : phase === "evaluator" ? `${maya} asks you to sign off ${names.length === 1 ? "1 skill" : `${names.length} skills`}. You do not need an account.` : "The phone is back with you."}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 px-4 pb-6">
          {phase === "student" ? (
            <>
              <p className="text-base text-foreground">{`${who} will see only what they need to sign off ${nameList(names)}. You will not see their answers until they give the phone back.`}</p>
              <Button type="button" variant="default" size="lg" className={BIG} onClick={() => setPhase("evaluator")}>
                {`Hand over to ${who}`}
              </Button>
              <Button type="button" variant="outline" size="lg" className={BIG} onClick={onClose}>
                Cancel handover
              </Button>
            </>
          ) : null}
          {phase === "evaluator" && x ? (
            <>
              <ul className="flex flex-col gap-2" aria-label="Skills to sign off">
                {names.map((n) => (
                  <li key={n} className="rounded-lg border border-border bg-card p-4 text-lg font-medium text-foreground">
                    {n}
                  </li>
                ))}
              </ul>
              <Button asChild variant="default" size="lg" className={BIG}>
                <Link href={`${requestPath(x.id)}&handover=1`}>Start the evaluation</Link>
              </Button>
              <Button type="button" variant="outline" size="lg" className={BIG} onClick={() => setPhase("back")}>
                {`Give the phone back to ${maya.split(" ")[0]}`}
              </Button>
            </>
          ) : null}
          {phase === "back" && x ? (
            <>
              <p className="text-base text-foreground" data-handover-back>{`Your request is with ${who}. ${requestWaitText(s, x)}.`}</p>
              <Button type="button" variant="default" size="lg" className={BIG} onClick={onClose}>
                Back to your requests
              </Button>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
