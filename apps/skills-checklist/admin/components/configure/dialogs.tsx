"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import * as C from "@/lib/copy"
import type { SkillStatusDisplay } from "@/lib/domain/types"
import type { Dropped, ImpactPreview, SkillState } from "@/lib/engine"

const s = C.surface.s09

/** Dialog whose default focus is the SAFE action (P-01, P-03, P-17: Cancel/Keep is the default, never the destructive one). */
export function SafeDialog({ open, onOpenChange, title, description, safeLabel, onSafe, confirmLabel, onConfirm, confirmDisabled, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; safeLabel: string; onSafe: () => void; confirmLabel: string; onConfirm: () => void; confirmDisabled?: boolean; children?: React.ReactNode }) {
  const safeRef = React.useRef<HTMLButtonElement>(null)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          safeRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button size="default" ref={safeRef} type="button" variant="outline" onClick={onSafe}>
            {safeLabel}
          </Button>
          <Button size="default" type="button" variant="default" disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DROPPED: Record<Dropped["field"], string> = {
  labels: "The outcome labels",
  questions: "The questions",
  qualificationRule: "The qualification rule",
  scale: "The scale",
  levels: "The levels",
  requiredCount: "The required number of evaluations",
  levelMinimums: "The minimum at each level",
  settingMinimums: "The minimums by clinical setting",
}

export function droppedText(d: Dropped): string {
  return `${DROPPED[d.field]}${d.count > 1 ? ` (${d.count})` : ""}`
}

/** P-01: confirm a model change. Lists exactly what will be rebuilt and what is kept. */
export function ModelChangeDialog({ open, dropped, hasEvidence, onKeep, onConfirm }: { open: boolean; dropped: Dropped[]; hasEvidence: boolean; onKeep: () => void; onConfirm: () => void }) {
  return (
    <SafeDialog open={open} onOpenChange={(o) => !o && onKeep()} title={s.modelChange.title} description={s.modelChange.body} safeLabel="Keep current model" onSafe={onKeep} confirmLabel={s.modelChange.confirm} onConfirm={onConfirm}>
      <div className="flex flex-col gap-2 text-sm">
        {dropped.length > 0 ? (
          <div>
            <p className="font-medium">Will be rebuilt</p>
            <ul className="list-disc pl-5">
              {dropped.map((d) => (
                <li key={d.field}>{droppedText(d)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <p className="font-medium">Kept</p>
          <ul className="list-disc pl-5">
            <li>The student fields, comment setting, workflow and allowed roles</li>
            {hasEvidence ? <li>Existing evaluations. How they count is recalculated when you save.</li> : null}
          </ul>
        </div>
      </div>
    </SafeDialog>
  )
}

const STATE_ORDER: SkillState[] = ["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"]

function merged(counts: Record<SkillState, number>, display: SkillStatusDisplay): { label: string; n: number }[] {
  if (display === "four") return STATE_ORDER.map((st) => ({ label: C.statusLabel(st, display), n: counts[st] }))
  return [
    { label: C.statusLabel("noEvidence", display), n: counts.noEvidence + counts.evidenceDoesNotQualify },
    { label: C.statusLabel("partial", display), n: counts.partial },
    { label: C.statusLabel("achieved", display), n: counts.achieved },
  ]
}

/** P-03 [INFER]: the consequence of a rule change on records that already exist, before the admin saves. */
export function ImpactDialog({ open, preview, evaluations, display, onBack, onConfirm }: { open: boolean; preview: ImpactPreview | null; evaluations: number; display: SkillStatusDisplay; onBack: () => void; onConfirm: () => void }) {
  const before = preview ? merged(preview.before, display) : []
  const after = preview ? merged(preview.after, display) : []
  const students = preview ? Object.values(preview.before).reduce((a, b) => a + b, 0) : 0
  return (
    <SafeDialog open={open} onOpenChange={(o) => !o && onBack()} title="Review the effect of this change" description={s.impact(evaluations, preview?.changed ?? 0)} safeLabel="Back to editing" onSafe={onBack} confirmLabel="Save change" onConfirm={onConfirm} confirmDisabled={!preview}>
      {preview ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-muted-foreground">
            {preview.changed === 0 ? `No student changes status across ${students} student records. The rule change is still applied to existing evaluations.` : `${preview.changed} of ${students} student records change status.`}
          </p>
          <ul aria-label="Records by status before and after" className="flex flex-col gap-1">
            {before.map((b, i) => (
              <li key={b.label} className="flex justify-between gap-4">
                <span>{b.label}</span>
                <span>
                  {b.n} to {after[i].n}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">The effect could not be calculated. Go back and try again; saving without it is not offered.</p>
      )}
    </SafeDialog>
  )
}

/** P-17: leaving with edits. Default focus is Keep editing. */
export function UnsavedDialog({ open, onKeep, onDiscard }: { open: boolean; onKeep: () => void; onDiscard: () => void }) {
  return <SafeDialog open={open} onOpenChange={(o) => !o && onKeep()} title="Discard changes?" description="Your edits to this skill have not been saved." safeLabel="Keep editing" onSafe={onKeep} confirmLabel="Discard changes" onConfirm={onDiscard} />
}
