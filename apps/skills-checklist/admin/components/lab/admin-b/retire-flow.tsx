"use client"

/**
 * Deactivate, start a new list, or delete one skill (REQ SL-02, SL-11; CALL 10-09; strategy/03 section 5.3).
 *
 * Order of the panel (one column in a sheet, two columns on the page):
 * 1. Intent first, in the admin's words: "It was a mistake" (deactivate, reversible, evidence kept, hidden from students and
 *    reports) or "The standard changed" (a new list with chosen cohorts; the old list keeps its history).
 * 2. Impact before confirm: students who have it now, courses it is mapped to, evaluations kept, open requests. Four figures,
 *    then what confirming changes, as short facts.
 * 3. One primary action named for the intent. The result is a LocalBanner in place with the undo where one exists.
 * 4. Delete is separate and quiet, offered only while nothing is recorded against the skill; otherwise the evidence count
 *    is the reason it is off.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox, CheckboxLabel } from "@exxatdesignux/ui/components/ui/checkbox"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { intentEffects, validateListName, type Intent, type RetireImpact } from "@/lib/lab/retire"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { fmt } from "@/lib/v2/format"
import { NUM_LINK } from "@/components/lab/link-styles"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { attainmentHref, peekParam } from "@/lib/lab/attainment"
import { TYPE } from "@/components/lab/type-scale"


export interface RetireResult {
  kind: "deactivated" | "list" | "deleted"
  text: string
}

export function RetireFlow({ impact, cohorts, existingLists, layout, partial, inactive, onDeactivate, onReactivate, onNewList, onDelete }: {
  impact: RetireImpact
  cohorts: string[]
  existingLists: string[]
  layout: "page" | "panel"
  partial?: boolean
  inactive: boolean
  onDeactivate: () => void
  onReactivate: () => void
  onNewList: (name: string, cohorts: string[]) => void
  onDelete: () => void
}) {
  const [intent, setIntent] = React.useState<Intent | null>(null)
  const [name, setName] = React.useState("")
  const [picked, setPicked] = React.useState<string[]>([])
  const [error, setError] = React.useState<{ name?: string; cohorts?: string }>({})
  const [result, setResult] = React.useState<RetireResult | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const noun = skillNoun()
  React.useEffect(() => { setIntent(null); setResult(null); setName(""); setPicked([]); setError({}) }, [impact.skillId])

  const confirm = () => {
    if (intent === "mistake") {
      onDeactivate()
      setResult({ kind: "deactivated", text: `${impact.name} is inactive. Its ${fmt(impact.evidence)} evaluations are kept and left out of reports.` })
      return
    }
    if (intent === "standard") {
      const e = { name: validateListName(name, existingLists) ?? undefined, cohorts: picked.length ? undefined : "Choose at least one cohort for the new list." }
      setError(e)
      if (e.name || e.cohorts) return
      onNewList(name.trim(), picked)
      setResult({ kind: "list", text: `"${name.trim()}" is created for ${picked.join(", ")}. The current list keeps its history for everyone else.` })
    }
  }

  const choice = (value: Intent, title: string, detail: string) => (
    <Label htmlFor={`intent-${value}-${layout}`} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal", intent === value ? "border-foreground" : "border-border")}>
      <RadioGroupItem id={`intent-${value}-${layout}`} value={value} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{detail}</span>
      </span>
    </Label>
  )

  const figures = [
    { label: "Students who have it now", n: impact.requiredFor, href: impact.requiredFor ? attainmentHref(EMPTY_SCOPE, { tab: "skills", peek: peekParam({ kind: "skill", id: impact.skillId }) }) : null },
    { label: "Courses it is mapped to", n: impact.courses, href: null },
    { label: "Evaluations recorded", n: impact.evidence, href: null },
    // No request list filters by skill yet, so this figure is not a link (a link must open a list of the same length).
    { label: "Open requests", n: impact.openRequests, href: null },
  ]

  const impactBlock = (
    <section aria-labelledby={`impact-${layout}`} className="flex flex-col gap-3" data-impact>
      <h2 id={`impact-${layout}`} className="text-base font-semibold text-foreground">Impact</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5" data-impact-figure={f.label}>
            <dt className="text-xs text-muted-foreground">{f.label}</dt>
            <dd className={`${TYPE.figure} text-foreground`}>
              {partial ? <Skeleton aria-hidden="true" className="h-7 w-12" /> : f.href ? <Link href={f.href} className={NUM_LINK}>{fmt(f.n)}</Link> : fmt(f.n)}
            </dd>
          </div>
        ))}
      </dl>
      {intent ? (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm text-foreground" aria-label="What changes" data-effects={intent}>
          {intentEffects(intent, impact, noun).map((e) => (
            <li key={e} className="flex items-start gap-2"><i className="fa-light fa-arrow-right mt-1 text-xs text-muted-foreground" aria-hidden="true" />{e}</li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-border pt-3 text-sm text-muted-foreground">Choose why to see what changes.</p>
      )}
    </section>
  )

  const deleteBlock = (
    <section aria-labelledby={`delete-${layout}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4" data-delete={impact.canDelete ? "allowed" : "blocked"}>
      <div className="flex min-w-0 flex-col">
        <h2 id={`delete-${layout}`} className="text-base font-semibold text-foreground">{`Delete the ${noun}`}</h2>
        <p className="text-sm text-muted-foreground">{impact.canDelete ? "Nothing is recorded against it yet, so it can be removed for good." : `${impact.deleteBlocked}, so it cannot be deleted.`}</p>
      </div>
      {/* Shown only when deleting is possible; otherwise the line above says why (no disabled controls, strategy/07 trap). */}
      {impact.canDelete && !result ? <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Button> : null}
    </section>
  )

  if (inactive && !result) {
    return (
      <div className="flex flex-col gap-4">
        <LocalBanner variant="info" title={`${impact.name} is inactive`} action={{ label: "Reactivate", onClick: onReactivate }}>
          {`Students cannot choose it and reports leave it out. Its ${fmt(impact.evidence)} evaluations are kept.`}
        </LocalBanner>
        {deleteBlock}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", layout === "page" && "lg:grid lg:grid-cols-12 lg:items-start lg:gap-8")} data-retire-flow={layout}>
      <div className={cn("flex flex-col gap-5", layout === "page" && "lg:col-span-7")}>
        {result ? (
          <LocalBanner variant="success" title={result.kind === "list" ? "New list created" : "Deactivated"} action={result.kind === "deactivated" ? { label: "Undo", onClick: () => { onReactivate(); setResult(null) } } : undefined}>
            {result.text}
          </LocalBanner>
        ) : null}
        <fieldset className="flex flex-col gap-2" disabled={!!result}>
          <legend className="mb-2 text-sm font-medium text-foreground">{`Why change this ${noun}?`}</legend>
          <RadioGroup value={intent ?? ""} onValueChange={(v) => setIntent(v as Intent)} className="flex flex-col gap-2" aria-label={`Why change this ${noun}`}>
            {choice("mistake", "It was a mistake", "Deactivate it. Reversible; evaluations are kept but hidden.")}
            {choice("standard", "The standard changed", "Start a new list for new cohorts. The current list keeps its history.")}
          </RadioGroup>
        </fieldset>
        {intent === "standard" && !result ? (
          <div className="flex flex-col gap-4" data-new-list>
            <Field data-invalid={!!error.name || undefined}>
              <FieldLabel htmlFor={`list-name-${layout}`}>New list name</FieldLabel>
              <Input id={`list-name-${layout}`} className="h-8 max-w-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder={`For example, Standard 6 ${skillNounPlural()}`} aria-invalid={!!error.name || undefined} aria-describedby={error.name ? `list-name-error-${layout}` : undefined} />
              {error.name ? <FieldError id={`list-name-error-${layout}`}>{error.name}</FieldError> : null}
            </Field>
            <fieldset className="flex flex-col gap-2" aria-describedby={error.cohorts ? `cohorts-error-${layout}` : undefined}>
              <legend className="mb-1 text-sm font-medium text-foreground">Cohorts that move to it</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {cohorts.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox id={`coh-${c}-${layout}`} checked={picked.includes(c)} onCheckedChange={(v) => setPicked((p) => (v ? [...p, c] : p.filter((x) => x !== c)))} />
                    <CheckboxLabel htmlFor={`coh-${c}-${layout}`}>{c}</CheckboxLabel>
                  </div>
                ))}
              </div>
              {error.cohorts ? <p id={`cohorts-error-${layout}`} role="alert" className="text-sm text-destructive">{error.cohorts}</p> : null}
            </fieldset>
          </div>
        ) : null}
        {layout === "panel" ? impactBlock : null}
        {/* The confirm action appears once a reason is chosen and the impact has loaded. */}
        {!result && intent && !partial ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="default" size="sm" onClick={confirm} data-confirm={intent}>
              {intent === "standard" ? "Create the new list" : "Deactivate"}
            </Button>
          </div>
        ) : null}
        {layout === "page" ? deleteBlock : null}
      </div>
      {layout === "page" ? <Card className="lg:col-span-5"><CardContent>{impactBlock}</CardContent></Card> : null}
      {layout === "panel" ? deleteBlock : null}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="z-[90]" overlayClassName="z-[90]">
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete ${impact.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>Nothing is recorded against it. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="sm">Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="sm" onClick={() => { setConfirmDelete(false); onDelete() }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
