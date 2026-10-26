"use client"

/**
 * Share record pieces: the preview of exactly what leaves the program (achieved skills with each evaluator sign-off, gaps stated,
 * what stays private), the status, the link with an expiry, and the two exports (PDF, CLR 2.0). Verification is a v2 proposal,
 * not REQ [glossary]; the lab keeps it because sharing depends on it.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@exxatdesignux/ui/components/ui/input-group"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { StateLabel, stateWord } from "@/components/lab/student/parts"
import { shortDate } from "@/lib/lab/student"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { Person } from "@/lib/v2/types"
import { EXPIRY_OPTIONS, clrDocument, expiryDate, type ShareModel } from "@/lib/lab/student2"

const SKILL_LIMIT = 8

export function ShareStatus({ share }: { share: ShareModel }) {
  return (
    <div className="flex flex-col gap-1.5" data-region="status">
      <StatusBadge label={share.statusLabel} tone="neutral" icon={share.status === "verified" ? "fa-badge-check" : "fa-lock"} size="md" />
      <p className="text-sm text-muted-foreground">{share.blocked ?? `By ${share.verifiedBy ?? "your program director"}, ${shortDate(share.verifiedAt ?? "")}.`}</p>
    </div>
  )
}

/** The document a reader gets. Same content as the PDF and the CLR file. */
export function SharePreview({ student, share, school }: { student: Person; share: ShareModel; school: string }) {
  const [all, setAll] = React.useState(false)
  const list = all ? share.skills : share.skills.slice(0, SKILL_LIMIT)
  return (
    <article className="flex flex-col gap-5" aria-label="What the reader sees" data-region="preview">
      <header className="flex flex-col gap-0.5 border-b border-border pb-4">
        <h2 className="text-base font-semibold text-foreground">{student.name}</h2>
        <p className="text-sm text-muted-foreground" data-viz-label>{`${student.cohort ?? student.title} · ${school}`}</p>
        <p className="text-sm text-muted-foreground">{`${share.skills.length} ${skillNounPlural()} achieved · ${share.evidence} sign-offs from ${share.evaluators} evaluators`}</p>
      </header>
      <section className="flex flex-col gap-2" aria-labelledby="pv-achieved">
        <h3 id="pv-achieved" className="text-sm font-semibold text-foreground">{`Achieved (${share.skills.length})`}</h3>
        <ul className="flex flex-col divide-y divide-border">
          {list.map((k) => (
            <li key={k.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="flex items-center gap-1.5 text-sm text-foreground sm:w-64 sm:shrink-0" data-viz-label>
                <i className="fa-solid fa-circle-check text-xs" aria-hidden="true" />
                {k.name}
              </span>
              <span className="text-xs text-muted-foreground" data-viz-label>
                {k.attestations.slice(0, 2).map((a) => `${a.evaluatorName}, ${a.setting}, ${shortDate(a.date)}`).join(" · ")}
                {k.attestations.length > 2 ? ` · and ${k.attestations.length - 2} more` : ""}
              </span>
            </li>
          ))}
        </ul>
        {share.skills.length > SKILL_LIMIT ? (
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setAll((v) => !v)}>{all ? "Show fewer" : `Show all ${share.skills.length}`}</Button>
        ) : null}
      </section>
      <section className="flex flex-col gap-2" aria-labelledby="pv-gaps">
        <h3 id="pv-gaps" className="text-sm font-semibold text-foreground">{`Required, not achieved yet (${share.gaps.length})`}</h3>
        {share.gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{`Every required ${skillNoun()} is achieved.`}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {share.gaps.map((g) => (
              <li key={g.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <span className="text-foreground sm:w-64" data-viz-label>{g.name}</span>
                <StateLabel record={{ state: g.label.startsWith("In progress") ? "progress" : g.label === stateWord("dnq") ? "dnq" : "none", label: g.label }} className="text-xs" />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-1" aria-labelledby="pv-private">
        <h3 id="pv-private" className="text-sm font-semibold text-foreground">Not shared</h3>
        <p className="text-sm text-muted-foreground">{share.withheld.map((w) => w.label).join(" · ")}</p>
      </section>
    </article>
  )
}

export function downloadClr(student: Person, share: ShareModel) {
  const blob = new Blob([JSON.stringify(clrDocument(student, share), null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${student.name.toLowerCase().replace(/\s+/g, "-")}-skills-record.clr.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function useShareLink() {
  const [days, setDays] = React.useState("30")
  const [link, setLink] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const create = (studentId: string) => setLink(`${typeof window === "undefined" ? "" : window.location.origin}/r/${studentId}-${Date.now().toString(36)}`)
  return { days, setDays, link, setLink, copied, setCopied, create }
}

/**
 * Expiry, create, copy, turn off. The link opens a read-only page with the preview's content. While sharing is closed the
 * controls are not shown at all (no disabled controls; ShareStatus states the reason once).
 */
export function LinkPanel({ api, studentId, blocked }: { api: ReturnType<typeof useShareLink>; studentId: string; blocked: boolean }) {
  if (blocked) return null
  if (api.link) {
    return (
      <div className="flex flex-col gap-2" data-region="link">
        <InputGroup>
          <InputGroupInput readOnly value={api.link} aria-label="Share link" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton variant="ghost" size="xs" onClick={() => { void navigator.clipboard?.writeText(api.link ?? ""); api.setCopied(true) }}>{api.copied ? "Copied" : "Copy"}</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <LocalBanner variant="success">{`Anyone with the link can view it until ${shortDate(expiryDate(Number(api.days)))}.`}</LocalBanner>
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => { api.setLink(null); api.setCopied(false) }}>Turn off link</Button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2" data-region="link">
      <Field>
        <FieldLabel htmlFor="share-expiry">Link expires after</FieldLabel>
        <Select value={api.days} onValueChange={api.setDays}>
          <SelectTrigger id="share-expiry" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPIRY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Button type="button" variant="default" size="default" className="w-full max-sm:h-11" onClick={() => api.create(studentId)}>Create link</Button>
    </div>
  )
}

export function ExportButtons({ student, share, blocked }: { student: Person; share: ShareModel; blocked: boolean }) {
  if (blocked) return null
  return (
    <div className="grid grid-cols-2 gap-2" data-region="exports">
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>Download PDF</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => downloadClr(student, share)}>CLR 2.0 file</Button>
    </div>
  )
}
