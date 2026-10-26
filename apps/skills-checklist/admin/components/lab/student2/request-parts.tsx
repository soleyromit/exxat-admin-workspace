"use client"

/**
 * Send for evaluation: the draft (skills, where, who, how), its checks, and the result. One request carries every skill from one
 * sitting to one evaluator with one link [REQ EV-05; LEDGER D-L2]. Sending is local to the lab (the shared store stays read only);
 * the result says once what happens next, then hands off to My requests [REQ ST-13, EV-07].
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { SelectedSkills, SkillPicker, TOUCH_ROW, type WhoValue } from "@/components/lab/student2/log-parts"
import { QrSvg } from "@/components/lab/student2/qr"
import { SectionTitle } from "@/components/lab/student/parts"
import type { Student2Ctx } from "@/components/lab/student2/frame"
import type { SignoffMethod } from "@/lib/v2/types"
import { aNoun, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import {
  evaluatorsFor,
  methodById,
  needsApproval,
  newEvaluatorErrors,
  nextSentence,
  pickRows,
  student2Href,
  whereChoices,
  type EvaluatorOption,
  type NewEvaluator,
  type PickRow,
  type WhereChoice,
} from "@/lib/lab/student2"

export interface RequestResultInfo {
  id: string
  method: SignoffMethod
  who: string
  skillIds: string[]
  sentence: string
  queued: boolean
}

export function useRequestDraft(ctx: Student2Ctx) {
  const { state: s, model: m, studentId, param, offline } = ctx
  const picks = React.useMemo(() => pickRows(s, m), [s, m])
  const clinicalWhere = React.useMemo(() => whereChoices(s, studentId).filter((w) => w.setting === "clinical"), [s, studentId])
  const initialSkills = React.useMemo(() => {
    const asked = (param("skills") ?? param("skill") ?? "").split(",").filter((id) => picks.some((p) => p.id === id))
    return asked.length ? asked : picks.filter((p) => p.likely && !p.waiting).slice(0, 2).map((p) => p.id)
  }, [param, picks])
  const [skills, setSkills] = React.useState<string[]>(initialSkills)
  const [whereVal, setWhere] = React.useState(clinicalWhere[0]?.value ?? "")
  const where = clinicalWhere.find((w) => w.value === whereVal) ?? null
  const options = React.useMemo(() => evaluatorsFor(s, skills, where?.location ?? null), [s, skills, where])
  const [who, setWho] = React.useState<WhoValue>(null)
  const [fresh, setFresh] = React.useState<NewEvaluator>({ name: "", email: "" })
  const [method, setMethod] = React.useState<SignoffMethod>("qr")
  const [photo, setPhoto] = React.useState<{ name: string; sizeKb: number } | null>(null)
  const [tried, setTried] = React.useState(false)
  const [result, setResult] = React.useState<RequestResultInfo | null>(null)

  // A picked person who stops qualifying when the skills change is cleared, never silently kept.
  React.useEffect(() => {
    if (who?.kind === "person" && !options.some((o) => o.id === who.id && o.eligible)) setWho(null)
  }, [options, who])

  const freshErrors = who?.kind === "new" ? newEvaluatorErrors(fresh) : {}
  const errors = {
    skills: skills.length === 0 ? `Pick at least one ${skillNoun()}.` : null,
    who: who === null ? (method === "photo" ? "Choose who signed the form." : "Choose who signs off.") : null,
    photo: method === "photo" && !photo ? "Add a photo of the signed form." : null,
  }
  const valid = !errors.skills && !errors.who && !errors.photo && Object.keys(freshErrors).length === 0
  const whoName = who?.kind === "person" ? options.find((o) => o.id === who.id)?.name ?? "your evaluator" : who?.kind === "new" ? fresh.name.trim() || "your evaluator" : "your evaluator"

  const send = () => {
    setTried(true)
    if (!valid) return false
    const queued = offline && !methodById(method).offline
    setResult({ id: `req-lab-${Date.now().toString(36)}`, method, who: whoName, skillIds: skills, queued, sentence: nextSentence({ method, who: whoName, approval: needsApproval(s, skills), offline, newName: who?.kind === "new" }) })
    return true
  }
  const toggle = (id: string) => setSkills((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))
  const reset = () => {
    setResult(null)
    setTried(false)
    setWho(null)
    setPhoto(null)
  }
  return { s, studentId, offline, picks, clinicalWhere, where, whereVal, setWhere, skills, toggle, options, who, setWho, fresh, setFresh, freshErrors, method, setMethod, photo, setPhoto, tried, errors, valid, send, result, reset, whoName }
}

export type RequestDraft = ReturnType<typeof useRequestDraft>

/**
 * What the evaluator sees, said once before Send [CALL 10-26]: only the chosen skills, and the student's self-rating where the
 * program asks for one (it sits beside the evaluator's answer). Preceptors and lab instructors open the same link, no account.
 */
export function scopeSentence(d: Pick<RequestDraft, "picks" | "skills">): string {
  const self = d.picks.some((p) => p.selfEval && d.skills.includes(p.id))
  return self ? `They see only the ${skillNounPlural()} you chose, with your self-rating.` : `They see only the ${skillNounPlural()} you chose.`
}

/** Skills as chips with an "Add" search, so the request can carry several from one sitting [REQ ST-04, EV-05]. */
export function SkillsField({ d, picks }: { d: RequestDraft; picks: PickRow[] }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="flex flex-col gap-2" data-region="skills">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle count={d.skills.length}>{skillNounPlural().replace(/^./, (c) => c.toUpperCase())}</SectionTitle>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">{`Add ${aNoun()}`}</Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(28rem,calc(100vw-2rem))] p-1">
            <SkillPicker rows={picks} selected={d.skills} onToggle={d.toggle} autoFocus listClassName="max-h-80" />
          </PopoverContent>
        </Popover>
      </div>
      <SelectedSkills s={d.s} ids={d.skills} onRemove={d.toggle} />
      {d.tried && d.errors.skills ? <FieldError>{d.errors.skills}</FieldError> : null}
    </div>
  )
}

/** The placement the evaluators come from. Hidden when there is one placement (inferred, REQ ST-06). */
export function PlacementSelect({ choices, value, onChange }: { choices: WhereChoice[]; value: string; onChange: (v: string) => void }) {
  if (choices.length < 2) return null
  return (
    <Field className="sm:max-w-xs">
      <FieldLabel htmlFor="req-where">At</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="req-where" size="sm" className={cn("w-full", TOUCH_ROW)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((w) => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function PhotoField({ d }: { d: RequestDraft }) {
  return (
    <Field data-invalid={d.tried && !!d.errors.photo}>
      <FieldLabel htmlFor="req-photo">Photo of the signed form</FieldLabel>
      <Input
        id="req-photo"
        type="file"
        accept="image/*"
        capture="environment"
        className={TOUCH_ROW}
        aria-invalid={(d.tried && !!d.errors.photo) || undefined}
        onChange={(e) => {
          const f = e.target.files?.[0]
          d.setPhoto(f ? { name: f.name, sizeKb: Math.round(f.size / 1024) } : null)
        }}
      />
      {d.photo ? <FieldDescription>{`${d.photo.name}, ${d.photo.sizeKb.toLocaleString("en-US")} KB`}</FieldDescription> : <FieldDescription>Goes to your program for review.</FieldDescription>}
      {d.tried && d.errors.photo ? <FieldError>{d.errors.photo}</FieldError> : null}
    </Field>
  )
}

export const evaluatorLink = (id: string) => (typeof window === "undefined" ? `/lab/evaluator/evaluation-form?request=${id}` : `${window.location.origin}/lab/evaluator/evaluation-form?request=${id}`)

/**
 * After Send: the one thing to do now (scan, hand over, nothing for a link, nothing for a photo), the "what happens next"
 * sentence said once, then My requests. A sent request has no QR or link controls left anywhere else [AUDIT T2 RV-05 UI].
 */
export function RequestResult({ d, r }: { d: RequestDraft; r: RequestResultInfo }) {
  const link = evaluatorLink(r.id)
  const [copied, setCopied] = React.useState(false)
  const title = r.queued ? "Kept on this device" : r.method === "qr" ? `Ready for ${r.who} to scan` : r.method === "handover" ? `Hand your device to ${r.who}` : r.method === "photo" ? "Sent for review" : `Sent to ${r.who}`
  return (
    <Card className="gap-0 py-0" data-region="result">
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{`${countSkills(r.skillIds.length)} in one request.`}</p>
        </div>
        {!r.queued && r.method === "qr" ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <QrSvg text={link} label={`QR code that opens this request for ${r.who}`} className="size-44 border border-border p-1" />
            <InputGroup className="w-full sm:max-w-sm">
              <InputGroupInput readOnly value={link} aria-label="Request link" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    void navigator.clipboard?.writeText(link)
                    setCopied(true)
                  }}
                >
                  {copied ? "Copied" : "Copy link"}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        ) : null}
        {!r.queued && r.method === "handover" ? (
          <Button asChild variant="outline" size="sm" className="self-start">
            <Link href={`/lab/evaluator/evaluation-form?request=${r.id}`}>Open the sign-off for them</Link>
          </Button>
        ) : null}
        <LocalBanner variant={r.queued ? "info" : "success"}>{r.sentence}</LocalBanner>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="default" size="default" className="max-sm:h-11">
            <Link href={student2Href("my-requests", {}, d.studentId)}>Go to My requests</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="max-sm:h-11" onClick={d.reset}>Send another</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export type { EvaluatorOption }
