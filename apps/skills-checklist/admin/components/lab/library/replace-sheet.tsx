"use client"

/**
 * "Replace {skill}": the library row's "Replace with a new version", as one continuous flow over the library (Romit 2026-11-03:
 * "the flow doesn't show continuity"). Semantics are CALL 10-09 / INFER (lib/lab/replace.ts); deactivation effects are REQ SL-11.
 *
 * - A MODAL DS FloatingSheetPanel (md), like Add a skill: a half-filled flow is a door in front of the work, so the page behind
 *   is inert, but the library and the row it came from stay in view. The record is in the URL (?replace=), so Back and reload work.
 * - Three steps in the DS Wizard (horizontal, compact): New version (prefilled from the old one: name, category, tags; settings
 *   and courses carried over), Student groups (which move; the rest keep the old version), Impact (figures before confirm).
 * - One primary per step in the footer; Back beside it. Confirm names its scope ("Replace for 2 groups").
 * - The result is a LocalBanner on the library naming both versions with a link to each row and Undo; the old row carries
 *   "Replaced by {new}" (library table, skill panel).
 * - No helper lines or descriptions (D-L34, D-L36): labels, values, figures and the primary only.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Checkbox, CheckboxLabel } from "@exxatdesignux/ui/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Wizard, WizardNav, WizardProgress, type WizardStep } from "@exxatdesignux/ui/components/ui/wizard"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { useV2State } from "@/lib/v2/react"
import { fmt, plural } from "@/lib/v2/format"
import { MAPPING_LEVEL_LABEL } from "@/lib/v2/labels"
import { bothVersionsIn, initialReplaceDraft, replaceImpact, replaceSource, studentsByGroup, validateReplace, versionOf, type ReplaceDraft, type ReplaceError } from "@/lib/lab/replace"
import type { LibraryRow } from "@/lib/lab/library"
import { TYPE } from "@/components/lab/type-scale"
import { CategoryPicker, TagsPicker, useVocabOptions } from "./category-tag-pickers"

const STEPS: WizardStep[] = [
  { id: "version", label: "New version" },
  { id: "groups", label: "Student groups" },
  { id: "impact", label: "Impact" },
]

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-3 py-2">
      <dt className={TYPE.helper}>{term}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  )
}

export function ReplaceSheet({ row, rows, onOpenChange, onReplace }: {
  /** The skill being replaced; null when closed. */
  row: LibraryRow | null
  rows: readonly LibraryRow[]
  onOpenChange: (open: boolean) => void
  onReplace: (oldId: string, d: ReplaceDraft) => void
}) {
  const state = useV2State()
  const opts = useVocabOptions()
  const src = React.useMemo(() => (row ? replaceSource(state, row.id) : null), [state, row])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])
  const initial = React.useMemo(() => (src ? initialReplaceDraft(src) : null), [src])
  const [d, setD] = React.useState<ReplaceDraft | null>(initial)
  const [step, setStep] = React.useState(0)
  const [errors, setErrors] = React.useState<ReplaceError>({})
  const [guard, setGuard] = React.useState(false)
  // Reset when a different skill opens; a store change while open (the draft's own vocabulary) must not wipe the draft.
  const openId = row?.id ?? null
  React.useEffect(() => { setD(initial); setStep(0); setErrors({}) }, [openId]) // eslint-disable-line react-hooks/exhaustive-deps
  const byGroup = React.useMemo(() => (row ? studentsByGroup(state, row.id) : new Map<string, number>()), [state, row])
  const impact = React.useMemo(() => (row && d ? replaceImpact(state, row.id, d.cohorts) : null), [state, row, d])
  const both = React.useMemo(() => (d ? bothVersionsIn(state, d) : []), [state, d])
  const vOld = row ? versionOf(state, row.id) : 1
  const vNew = vOld + 1

  if (!row || !src || !d) return <FloatingSheetPanel open={false} onOpenChange={onOpenChange}><FloatingSheetPanelContent contentSlot="lab-replace-skill" size="md" /></FloatingSheetPanel>

  const dirty = JSON.stringify(d) !== JSON.stringify(initial)
  const set = <K extends keyof ReplaceDraft>(k: K, v: ReplaceDraft[K]) => setD((p) => (p ? { ...p, [k]: v } : p))
  const requestClose = () => (dirty ? setGuard(true) : onOpenChange(false))
  const all = d.cohorts.length === src.cohorts.length
  const next = () => {
    const e = validateReplace(d, names, row.name)
    if (step === 0 && e.name) { setErrors({ name: e.name }); document.getElementById("replace-name")?.focus(); return }
    if (step === 1 && e.cohorts) { setErrors({ cohorts: e.cohorts }); return }
    setErrors({})
    if (step < 2) { setStep(step + 1); return }
    if (e.name || e.cohorts) { setErrors(e); setStep(e.name ? 0 : 1); return }
    onReplace(row.id, d)
    onOpenChange(false)
  }
  const primary = step === 0 ? "Continue" : step === 1 ? "Check impact" : all ? "Replace for every group" : `Replace for ${plural(d.cohorts.length, "group", "groups")}`

  const figures = impact ? [
    { label: "Students who move", n: impact.moving },
    { label: "Students who stay", n: impact.staying },
    { label: `Evaluations stay on Version ${vOld}`, n: impact.evidence },
    { label: `Open requests stay on Version ${vOld}`, n: impact.openRequests },
  ] : []
  // A staying group with no students this term is named as such, so "stays for" never reads as if someone still uses it.
  const staying = src.cohorts.filter((c) => !d.cohorts.includes(c))
  const changes = [
    src.configured ? `Version ${vNew} has the same settings` : `Version ${vNew} is not configured, like Version ${vOld}`,
    d.courseIds.length ? `Mapped to ${plural(d.courseIds.length, "course", "courses")}` : "Not mapped to a course",
    ...(impact?.allMove
      ? [`Version ${vOld} becomes inactive`]
      : staying.map((c) => ((byGroup.get(c) ?? 0) > 0 ? `${c} stays on Version ${vOld}` : `${c} stays on Version ${vOld}, no students yet`))),
  ]

  return (
    <>
      <FloatingSheetPanel open onOpenChange={(o) => (o ? undefined : requestClose())} modal>
        <FloatingSheetPanelContent
          contentSlot="lab-replace-skill"
          side="right"
          size="md"
          aria-modal="true"
          data-replace-flow={STEPS[step]!.id}
          // Height follows the step (no half-empty rail); the DS inset style is otherwise kept, and the body scrolls past the cap.
          style={{ height: "auto", bottom: "auto", maxHeight: "calc(100svh - 1rem)" }}
        >
          <FloatingSheetPanelHeader title={`Replace ${row.name}`} onClose={requestClose} />
          <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pt-1 pb-4">
            <Wizard steps={STEPS} current={step} orientation="horizontal" variant="compact" onStepClick={(i) => { if (i < step) setStep(i) }}>
              <WizardNav className="hidden sm:block" />
              <WizardProgress className="sm:hidden" />
            </Wizard>

            {step === 0 ? (
              <div className="flex flex-col gap-5" data-step="version">
                <Field data-invalid={!!errors.name || undefined}>
                  <FieldLabel htmlFor="replace-name">Name</FieldLabel>
                  <Input id="replace-name" autoFocus value={d.name} maxLength={160} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name || undefined} aria-describedby={errors.name ? "replace-name-error" : undefined} />
                  {errors.name ? <FieldError id="replace-name-error">{errors.name}</FieldError> : null}
                </Field>
                <Field>
                  <FieldLabel id="replace-category-label" htmlFor="replace-category">Category</FieldLabel>
                  <CategoryPicker id="replace-category" labelId="replace-category-label" value={d.category} options={opts.categories} inactive={opts.inactiveCategories} onChange={(v) => set("category", v)} className="w-full" />
                </Field>
                <Field>
                  <FieldLabel id="replace-tags-label" htmlFor="replace-tags">Tags (optional)</FieldLabel>
                  <TagsPicker id="replace-tags" labelId="replace-tags-label" value={d.tags} options={opts.tags} inactive={opts.inactiveTags} onChange={(t) => set("tags", t)} />
                </Field>
                <section aria-labelledby="replace-carried" className="flex flex-col gap-1 border-t border-border pt-4">
                  <h3 id="replace-carried" className={TYPE.group}>Carried over</h3>
                  <dl className="flex flex-col">
                    <Fact term="How it's judged">{row.modelLabel || <span className="text-muted-foreground">Not chosen</span>}</Fact>
                  </dl>
                  {src.courses.length ? (
                    <fieldset className="flex flex-col gap-2 pt-1">
                      <legend className={`${TYPE.label} mb-2`}>Courses</legend>
                      {src.courses.map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <Checkbox id={`replace-course-${c.id}`} checked={d.courseIds.includes(c.id)} onCheckedChange={(v) => set("courseIds", v ? [...d.courseIds, c.id] : d.courseIds.filter((x) => x !== c.id))} />
                          <CheckboxLabel htmlFor={`replace-course-${c.id}`} className="flex-1">{c.label}</CheckboxLabel>
                          <span className={TYPE.meta}>{MAPPING_LEVEL_LABEL[c.level]}</span>
                        </div>
                      ))}
                    </fieldset>
                  ) : (
                    <dl className="flex flex-col"><Fact term="Courses"><span className="text-muted-foreground">Not mapped</span></Fact></dl>
                  )}
                </section>
              </div>
            ) : null}

            {step === 1 ? (
              <fieldset className="flex flex-col gap-2" data-step="groups" aria-describedby={errors.cohorts ? "replace-groups-error" : undefined}>
                <legend className={`${TYPE.group} mb-2`}>{`Move to Version ${vNew}`}</legend>
                {src.cohorts.map((c) => (
                  <div key={c} className="flex items-center gap-2 border-b border-border py-2 last:border-b-0">
                    <Checkbox id={`replace-group-${c}`} checked={d.cohorts.includes(c)} onCheckedChange={(v) => set("cohorts", v ? src.cohorts.filter((x) => x === c || d.cohorts.includes(x)) : d.cohorts.filter((x) => x !== c))} />
                    <CheckboxLabel htmlFor={`replace-group-${c}`} className="flex-1">{c}</CheckboxLabel>
                    <span className={`${TYPE.meta} tabular-nums`}>{(byGroup.get(c) ?? 0) > 0 ? plural(byGroup.get(c)!, "student", "students") : "No students yet"}</span>
                  </div>
                ))}
                {errors.cohorts ? <p id="replace-groups-error" role="alert" className="text-sm text-destructive">{errors.cohorts}</p> : null}
              </fieldset>
            ) : null}

            {step === 2 && impact ? (
              <section aria-labelledby="replace-impact" className="flex flex-col gap-4" data-step="impact">
                <h3 id="replace-impact" className="sr-only">Impact</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {figures.map((f) => (
                    <div key={f.label} className="flex flex-col gap-1" data-impact-figure={f.label}>
                      <dt className={TYPE.meta}>{f.label}</dt>
                      <dd className={`${TYPE.figure} text-foreground`}>{fmt(f.n)}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm text-foreground" aria-label="What changes">
                  {changes.map((c) => (
                    <li key={c} className="flex items-start gap-2"><i className="fa-light fa-arrow-right mt-1 text-xs text-muted-foreground" aria-hidden="true" />{c}</li>
                  ))}
                  {/* Mapping is per offering, so a staying group in a mapped course has both versions there (open question, not decided). */}
                  {both.map((b) => (
                    <li key={b.cohort} className="flex items-start gap-2 text-[var(--status-badge-warning-fg)]" data-both-versions={b.cohort}>
                      <i className="fa-light fa-triangle-exclamation mt-1 text-xs" aria-hidden="true" />{`${b.cohort} sees both versions in ${b.courses.join(", ")}`}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </FloatingSheetPanelBody>
          <FloatingSheetPanelFooter className="flex items-center justify-end gap-2">
            {step > 0 ? <Button type="button" variant="outline" size="sm" onClick={() => { setErrors({}); setStep(step - 1) }}>Back</Button> : null}
            <Button type="button" variant="default" size="sm" onClick={next} data-replace-primary>{primary}</Button>
          </FloatingSheetPanelFooter>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <AlertDialog open={guard} onOpenChange={setGuard}>
        <AlertDialogContent className="z-[90]" overlayClassName="z-[90]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard the new version?</AlertDialogTitle>
            <AlertDialogDescription>{`${row.name} has not been replaced.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="sm">Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="default" size="sm" onClick={() => { setGuard(false); onOpenChange(false) }}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
