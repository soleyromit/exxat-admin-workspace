"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { labExtra as LX, settingsExtra as SX, surface, taxonExtra as TX, validation } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import { isEmail, norm, type TaxonKind } from "@/lib/store"
import { ROUTES } from "@/lib/skills-routes"

const D = r1.dialog

/** The prototype's small dialogs are 672px wide (P-05). Applied through the DS Dialog's own className seam. */
export const SMALL_DIALOG = "sm:max-w-[672px]"

/** SC-12: lab and simulation are recorded as lab; they are never clinical settings, so those names are refused. */
const RESERVED = new Set(["lab", "simulation", "labsimulation", "simulationlab", "labandsimulation", "laborsimulation", "labandsim", "sim", "simlab"])
export const isReservedSettingName = (name: string) => RESERVED.has(name.toLowerCase().replace(/[^a-z]/g, ""))

/** What a dialog's save reports back: null on success, otherwise a message and, for an OD-26 block, the skills that name the setting. */
export type SaveOutcome = null | { message: string; skills?: Array<{ id: string; name: string }> }

function StatusField({ id, value, onChange, helper }: { id: string; value: boolean; onChange: (active: boolean) => void; helper?: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{D.statusLabel}</FieldLabel>
      <Select value={value ? "active" : "inactive"} onValueChange={(v) => onChange(v === "active")}>
        <SelectTrigger id={id} size="default" className="w-full" aria-describedby={helper ? `${id}-help` : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">{D.active}</SelectItem>
          <SelectItem value="inactive">{D.inactive}</SelectItem>
        </SelectContent>
      </Select>
      {helper ? <FieldDescription id={`${id}-help`}>{helper}</FieldDescription> : null}
    </Field>
  )
}

function Footer({ onClose, submitting }: { onClose: () => void; submitting?: boolean }) {
  return (
    <DialogFooter>
      <Button size="default" type="button" variant="outline" onClick={onClose}>
        {D.cancel}
      </Button>
      {/* The one filled button while the dialog is open. */}
      <Button size="default" type="submit" variant="default" disabled={submitting}>
        {D.save}
      </Button>
    </DialogFooter>
  )
}

// ------------------------------------------------------------------ category and tag

export function TaxonDialog({
  kind,
  existing,
  names,
  onClose,
  onSave,
}: {
  kind: TaxonKind
  existing: { id: string; name: string; description: string; active: boolean } | null
  names: string[]
  onClose: () => void
  onSave: (v: { name: string; description: string; active: boolean }) => SaveOutcome
}) {
  const copy = D[kind]
  const [name, setName] = React.useState(existing?.name ?? "")
  const [description, setDescription] = React.useState(existing?.description ?? "")
  const [active, setActive] = React.useState(existing?.active ?? true)
  const [touched, setTouched] = React.useState(false)
  const [failure, setFailure] = React.useState<string | null>(null)

  const problem = (): string | null => {
    const n = name.trim()
    if (!n) return TX.nameRequired
    if (names.some((x) => norm(x) === norm(n))) return surface.s05.duplicate(kind, n)
    return null
  }
  const shown = touched ? problem() : null
  const errId = `taxon-name-error-${kind}`
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (problem()) return
    const out = onSave({ name: name.trim(), description: description.trim(), active })
    if (out) setFailure(out.message)
    else onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={SMALL_DIALOG}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{existing ? copy.editTitle : copy.addTitle}</DialogTitle>
            <DialogDescription>{copy.subtitle}</DialogDescription>
          </DialogHeader>
          {failure ? (
            <LocalBanner variant="error" retry={{ onClick: () => submit() }}>
              {TX.failed(kind)} {failure}
            </LocalBanner>
          ) : null}
          <Field data-invalid={shown ? true : undefined}>
            <FieldLabel htmlFor={`taxon-name-${kind}`}>
              {D.nameLabel} <span aria-hidden="true">*</span>
            </FieldLabel>
            <Input id={`taxon-name-${kind}`} value={name} placeholder={D.namePlaceholder} aria-required="true" aria-invalid={shown ? true : undefined} aria-describedby={shown ? errId : undefined} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} autoFocus />
            {shown ? <FieldError id={errId}>{shown}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor={`taxon-desc-${kind}`}>{D.descriptionLabel}</FieldLabel>
            <Textarea id={`taxon-desc-${kind}`} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Field>
          <StatusField id={`taxon-status-${kind}`} value={active} onChange={setActive} />
          <Footer onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------ clinical setting

export function SettingDialog({
  existing,
  names,
  onClose,
  onSave,
}: {
  existing: { id: string; name: string; active: boolean } | null
  names: string[]
  onClose: () => void
  onSave: (v: { name: string; active: boolean }) => SaveOutcome
}) {
  const [name, setName] = React.useState(existing?.name ?? "")
  const [active, setActive] = React.useState(existing?.active ?? true)
  const [touched, setTouched] = React.useState(false)
  const [outcome, setOutcome] = React.useState<NonNullable<SaveOutcome> | null>(null)

  const problem = (): string | null => {
    const n = name.trim()
    if (!n) return SX.nameRequired
    if (isReservedSettingName(n)) return SX.reserved
    if (names.some((x) => norm(x) === norm(n))) return `A setting named "${n}" already exists. Use a different name.`
    return null
  }
  const shown = touched ? problem() : null
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setTouched(true)
    if (problem()) return
    const out = onSave({ name: name.trim(), active })
    if (out) setOutcome(out)
    else onClose()
  }
  const blockedCopy = outcome?.skills && existing ? surface.s06.blocked(existing.name, outcome.skills.map((s) => s.name)) : null

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={SMALL_DIALOG}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{existing ? D.setting.editTitle : D.setting.addTitle}</DialogTitle>
          </DialogHeader>
          {/* Bl: deactivation blocked by a skill minimum (OD-26, proposed). States the reason and names the skills. */}
          {blockedCopy ? (
            <LocalBanner variant="warning" title={blockedCopy.title}>
              <p>{blockedCopy.body}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {outcome!.skills!.map((s) => (
                  <li key={s.id}>
                    <Link className="underline underline-offset-2" href={ROUTES.skillConfigure(s.id)}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </LocalBanner>
          ) : outcome ? (
            <LocalBanner variant="error" retry={{ onClick: () => submit() }}>
              {SX.failed} {outcome.message}
            </LocalBanner>
          ) : null}
          <Field data-invalid={shown ? true : undefined}>
            <FieldLabel htmlFor="setting-name">
              {D.nameLabel} <span aria-hidden="true">*</span>
            </FieldLabel>
            <Input id="setting-name" value={name} placeholder={D.settingPlaceholder} aria-required="true" aria-invalid={shown ? true : undefined} aria-describedby={shown ? "setting-name-error" : undefined} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} autoFocus />
            {shown ? <FieldError id="setting-name-error">{shown}</FieldError> : null}
          </Field>
          <StatusField id="setting-status" value={active} onChange={setActive} helper={D.setting.statusHelper} />
          <Footer onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------ lab instructor

export function InstructorDialog({
  existing,
  prefill,
  others,
  onClose,
  onOpenExisting,
  onSave,
}: {
  existing: { id: string; name: string; email: string; active: boolean } | null
  /** Adoption (SL-09): the student-named entry opens this same dialog prefilled; Save moves it onto the roster. */
  prefill?: { name: string; email: string } | null
  others: Array<{ id: string; name: string; email: string }>
  onClose: () => void
  onOpenExisting: (id: string) => void
  onSave: (v: { name: string; email: string; active: boolean }) => SaveOutcome
}) {
  const editing = !!existing || !!prefill
  const [name, setName] = React.useState(existing?.name ?? prefill?.name ?? "")
  const [email, setEmail] = React.useState(existing?.email ?? prefill?.email ?? "")
  const [active, setActive] = React.useState(existing?.active ?? true)
  const [touched, setTouched] = React.useState({ name: false, email: false })
  const [failure, setFailure] = React.useState<string | null>(null)

  const clash = others.find((o) => o.email.toLowerCase() === email.trim().toLowerCase())
  const nameError = !name.trim() ? validation.name : null
  const emailError = !email.trim() ? validation.required("Email") : !isEmail(email) ? validation.email : clash ? LX.emailExists : null
  const errors = { name: touched.name ? nameError : null, email: touched.email ? emailError : null }
  const count = [errors.name, errors.email].filter(Boolean).length

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setTouched({ name: true, email: true })
    if (nameError || emailError) return
    const out = onSave({ name: name.trim(), email: email.trim(), active })
    if (out) setFailure(out.message)
    else onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={SMALL_DIALOG}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? D.lab.editTitle : D.lab.addTitle}</DialogTitle>
            <DialogDescription>{D.lab.subtitle}</DialogDescription>
          </DialogHeader>
          {count > 1 ? (
            <LocalBanner variant="error" title={LX.summaryTitle}>
              <ul className="list-disc ps-4">
                {errors.name ? <li>{errors.name}</li> : null}
                {errors.email ? <li>{errors.email}</li> : null}
              </ul>
            </LocalBanner>
          ) : null}
          {failure ? (
            <LocalBanner variant="error" retry={{ onClick: () => submit() }}>
              {LX.failed} {failure}
            </LocalBanner>
          ) : null}
          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor="lab-name">
              {D.nameLabel} <span aria-hidden="true">*</span>
            </FieldLabel>
            <Input id="lab-name" value={name} aria-required="true" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "lab-name-error" : undefined} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} autoFocus />
            {errors.name ? <FieldError id="lab-name-error">{errors.name}</FieldError> : null}
          </Field>
          <Field data-invalid={errors.email ? true : undefined}>
            <FieldLabel htmlFor="lab-email">{D.emailLabel}</FieldLabel>
            <Input id="lab-email" type="email" value={email} placeholder={D.emailPlaceholder} aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "lab-email-error" : "lab-email-help"} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
            {errors.email ? (
              <FieldError id="lab-email-error">
                {errors.email}
                {clash && touched.email && !editing ? (
                  <>
                    {" "}
                    <Button type="button" variant="link" size="sm" onClick={() => onOpenExisting(clash.id)}>
                      {LX.openExisting}
                    </Button>
                  </>
                ) : null}
              </FieldError>
            ) : (
              <FieldDescription id="lab-email-help">{D.lab.emailHelper}</FieldDescription>
            )}
          </Field>
          <StatusField id="lab-status" value={active} onChange={setActive} />
          <Footer onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** SL-09: merge a student-typed name into a different roster entry. Not in the prototype; shown only when a similar roster entry exists. */
export function MergeDialog({
  named,
  roster,
  impact,
  onClose,
  onConfirm,
}: {
  named: { id: string; name: string }
  roster: Array<{ id: string; name: string; email: string }>
  impact: (targetName: string) => string
  onClose: () => void
  onConfirm: (targetId: string) => void
}) {
  const [target, setTarget] = React.useState<string>("")
  const chosen = roster.find((r) => r.id === target)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={SMALL_DIALOG}>
        <DialogHeader>
          <DialogTitle>{LX.mergeTitle(named.name)}</DialogTitle>
          <DialogDescription>{LX.mergeBody}</DialogDescription>
        </DialogHeader>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">{LX.mergeTarget}</legend>
          <RadioGroup value={target} onValueChange={setTarget} aria-label={LX.mergeTarget}>
            {roster.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <RadioGroupItem id={`merge-${r.id}`} value={r.id} />
                <Label htmlFor={`merge-${r.id}`} className="text-sm">
                  {r.name} <span className="text-muted-foreground">({r.email})</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
        {chosen ? <p className="text-sm text-muted-foreground">{impact(chosen.name)}</p> : <p className="text-sm text-muted-foreground">{LX.chooseTarget}</p>}
        <DialogFooter>
          <Button size="default" type="button" variant="outline" onClick={onClose}>
            {D.cancel}
          </Button>
          <Button size="default" type="button" variant="default" disabled={!target} onClick={() => target && onConfirm(target)}>
            {LX.mergeConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
