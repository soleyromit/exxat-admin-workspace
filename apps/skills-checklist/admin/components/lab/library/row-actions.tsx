"use client"

/**
 * Row actions for one skill and the lifecycle dialogs (strategy/03 section 9, REQ SL-11, IM-14):
 * - Deactivate is a confirm that shows what it withdraws first (REQ SL-11: courses, students who have it, evaluations kept).
 * - Evaluation settings are edited in the panel (map D1a), not from this menu.
 * - Delete exists only while nothing is tracked against a skill (D-X15); its courses are listed and unmapped on delete.
 *   When blocked, the entry stays disabled with its reason in view under it and in aria-describedby.
 */
import * as React from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import type { LibraryRow } from "@/lib/lab/library"
import { reactivateImpact } from "@/lib/lab/program-settings"
import { evalsOfSkill, skillById } from "@/lib/v2/evidence-index"
import { ImpactDialog } from "./times-needed"
import { countSkills } from "@/lib/lab/terms"
import type { LibraryApi } from "./use-library"
import { RowMenu, type RowMenuEntry } from "@/components/lab/shared/row-menu"
import { useLists, useMappingOverlay } from "@/components/lab/admin-a/use-admin-data"
import { skillCourseLabels, skillReach } from "@/lib/lab/mapping"
import { assignedSkillIdsByStudent } from "@/lib/lab/lists"
import { holdSecondPress, returnFocus } from "@/components/lab/shared/focus"
import { fmt, plural } from "@/lib/v2/format"
import { useV2State } from "@/lib/v2/react"
import { retireImpact } from "@/lib/lab/retire"
import { TYPE } from "@/components/lab/type-scale"


/** These dialogs also open from the skill detail panel, so they sit on the DS layer above FloatingSheetPanel (z-80),
 *  the same layer the DS gives the panel's own menus. */
const ABOVE_SHEET = "z-[90]"

export function deleteBlockReason(r: LibraryRow): string | null {
  if (r.evidence > 0) return `Has ${plural(r.evidence, "evaluation", "evaluations")}`
  if (!r.canDelete) return "Has requests or log entries"
  return null
}

export interface RowActionHandlers {
  onEdit: (r: LibraryRow) => void
  /** `done`: runs once it is confirmed, not if the admin keeps them active. */
  onDeactivate: (rows: LibraryRow[], done?: () => void) => void
  onReactivate: (rows: LibraryRow[]) => void
  onDelete: (r: LibraryRow) => void
  /** From the panel, beside Status: its own dialog, and unsaved form edits stay in the form (map D1a) [INFER]. */
  onStatusFromPanel?: (row: LibraryRow) => void
}

/**
 * The row menu (map D1 and section E rule 8): Edit, Deactivate or Reactivate, then Delete. Configure and Map to
 * courses live in the edit panel. `inPanel`: the panel's header "...", which holds the rare and heavy one only (map D1a); status has its own
 * control there.
 */
export function RowActions({ row, handlers, inPanel = false }: { row: LibraryRow; handlers: RowActionHandlers; inPanel?: boolean }) {
  const block = deleteBlockReason(row)
  const inactive = row.status === "inactive"
  const entries: RowMenuEntry[] = [
    ...(inPanel ? [] : [
      { slot: "edit" as const, label: "Edit", icon: "fa-pen", onSelect: () => handlers.onEdit(row) },
      inactive
        ? { slot: "status" as const, label: "Reactivate", icon: "fa-circle-play", onSelect: () => handlers.onReactivate([row]) }
        : { slot: "status" as const, label: "Deactivate", icon: "fa-circle-pause", onSelect: () => handlers.onDeactivate([row]) },
    ]),
    { slot: "delete", label: "Delete", icon: "fa-trash", onSelect: () => handlers.onDelete(row), blockedBecause: block ? `${block}, so it cannot be deleted` : null },
  ]
  return <RowMenu label={`${inPanel ? "More actions" : "Actions"} for ${row.name}`} entries={entries} />
}

export interface DeactivateImpact { courses: number; assignedTo: number; evidence: number }

export function DeactivateDialog({ rows, onOpenChange, onConfirm, impactOf }: { rows: LibraryRow[] | null; onOpenChange: (o: boolean) => void; onConfirm: (ids: string[]) => void; /** What deactivating these skills withdraws (REQ SL-11); omitted, the dialog shows the sentence only. */ impactOf?: (ids: string[]) => DeactivateImpact | null }) {
  const open = !!rows && rows.length > 0
  // While it fades the dialog still reads what it asked, and a late press has nothing left to do (a double click once reported "0 skills deactivated").
  const last = React.useRef<LibraryRow[]>([])
  if (open) last.current = rows
  const list = last.current
  const evidence = list.reduce((n, r) => n + r.evidence, 0)
  const one = list.length === 1
  const impact = React.useMemo(() => (open && impactOf ? impactOf(rows.map((r) => r.id)) : null), [open, rows, impactOf])
  const shownImpact = React.useRef<DeactivateImpact | null>(null)
  if (impact) shownImpact.current = impact
  const subject = one ? list[0]!.name : countSkills(list.length)
  const pronoun = one ? "it" : "them"
  const had = React.useRef<Element | null>(null)
  const skillOf = React.useRef<string | null>(null)
  if (list[0]) skillOf.current = list[0].id
  const figures = shownImpact.current
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={ABOVE_SHEET} overlayClassName={ABOVE_SHEET} {...railTriggerProps()} onOpenAutoFocus={() => { had.current = document.activeElement }} onCloseAutoFocus={(e) => { e.preventDefault(); returnFocus(had.current, skillOf.current) }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Deactivate ${subject}?`}</AlertDialogTitle>
          <AlertDialogDescription>{evidence ? `Evaluations are kept, and you can reactivate ${pronoun} later.` : `No evaluations yet, and you can reactivate ${pronoun} later.`}</AlertDialogDescription>
        </AlertDialogHeader>
        {figures ? (
          <dl className="grid grid-cols-3 gap-4" data-deactivate-impact>
            {[
              { label: "Leaves courses", n: figures.courses },
              { label: one ? "Students who have it" : "Students who have them", n: figures.assignedTo },
              { label: "Evaluations kept", n: figures.evidence },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <dt className={TYPE.meta}>{f.label}</dt>
                <dd className={`${TYPE.figure} text-foreground`}>{fmt(f.n)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Keep active</AlertDialogCancel>
          <AlertDialogAction variant="default" size="sm" onClick={(e) => { holdSecondPress(e); if (open) onConfirm(rows.map((r) => r.id)) }}>
            {one ? "Deactivate" : `Deactivate ${countSkills(list.length)}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Delete names every course it leaves [D-X15, map E rule 11], the same courses Course mapping shows. */
export function DeleteDialog({ row, coursesOf, onOpenChange, onConfirm }: { row: LibraryRow | null; coursesOf?: (id: string) => string[]; onOpenChange: (o: boolean) => void; onConfirm: (r: LibraryRow) => void }) {
  const courses = row ? coursesOf?.(row.id) ?? row.unmapFrom : []
  const had = React.useRef<Element | null>(null)
  return (
    <AlertDialog open={!!row} onOpenChange={onOpenChange}>
      <AlertDialogContent className={ABOVE_SHEET} overlayClassName={ABOVE_SHEET} {...railTriggerProps()} onOpenAutoFocus={() => { had.current = document.activeElement }} onCloseAutoFocus={(e) => { e.preventDefault(); returnFocus(had.current, row?.id) }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete ${row?.name ?? ""}?`}</AlertDialogTitle>
          <AlertDialogDescription>{courses.length ? `It leaves ${plural(courses.length, "course", "courses")}. This cannot be undone.` : "It is in no course. This cannot be undone."}</AlertDialogDescription>
        </AlertDialogHeader>
        {courses.length ? (
          <ul className="max-h-40 overflow-y-auto rounded-[var(--radius)] border border-border p-2 text-sm text-foreground" data-delete-courses>
            {courses.map((c) => <li key={c}>{c}</li>)}
          </ul>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" size="sm" onClick={() => row && onConfirm(row)}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Row handlers with a stable identity, so table columns are not rebuilt on every render. */
export function useStableHandlers(api: LibraryApi, life: ReturnType<typeof useLifecycle>, onEdit: (r: LibraryRow) => void, attempt: (action: () => void) => void = (a) => a()): RowActionHandlers {
  const ref = React.useRef({ api, life, onEdit, attempt })
  ref.current = { api, life, onEdit, attempt }
  // Each one asks first while the panel has unsaved changes, so an edit never carries into a state that drops it (rework item 10).
  return React.useMemo<RowActionHandlers>(() => ({
    onEdit: (r) => ref.current.onEdit(r),
    onDeactivate: (rows, done) => ref.current.attempt(() => ref.current.life.deactivate(rows, done)),
    onReactivate: (rows) => ref.current.attempt(() => ref.current.life.reactivate(rows)),
    onStatusFromPanel: (r) => { if (r.status === "inactive") ref.current.life.reactivate([r]); else ref.current.life.deactivate([r]) },
    onDelete: (r) => ref.current.attempt(() => ref.current.life.del(r)),
  }), [])
}

/** One place that owns the dialog state, so every variant wires the same lifecycle. */
export function useLifecycle(api: LibraryApi) {
  const [deactivating, setDeactivating] = React.useState<LibraryRow[] | null>(null)
  const afterDeactivate = React.useRef<(() => void) | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<LibraryRow | null>(null)
  const state = useV2State()
  // One course count on every page (audit L8): the same figure the panel and Course mapping show, lists included, one course per cohort.
  // Students who have it come from the lists too: retireImpact's requiredFor counts only those a course makes it mandatory for this term.
  const [overlay] = useMappingOverlay()
  const { lists } = useLists(state)
  // The figures of one skill, added up for several (map D1b). Courses and students are counted once each, not once per skill: 3 skills on the same 123 students is 123 students [INFER]. Evaluations are distinct by nature.
  const impactOf = React.useCallback((ids: string[]): DeactivateImpact | null => {
    const set = new Set(ids)
    const courses = new Set(ids.flatMap((id) => skillCourseLabels(state, overlay, id)))
    const reach = skillReach(state, overlay, "", lists).filter((r) => set.has(r.id))
    let assignedTo = 0
    for (const held of assignedSkillIdsByStudent(state, lists).values()) if ([...set].some((id) => held.has(id))) assignedTo += 1
    const one = ids.length === 1
    const evidence = ids.reduce((n, id) => n + (retireImpact(state, id)?.evidence ?? 0), 0)
    return { courses: one ? reach[0]?.courses ?? 0 : Math.max(courses.size, ...reach.map((r) => r.courses)), assignedTo, evidence }
  }, [state, overlay, lists])
  const coursesOf = React.useCallback((id: string) => skillCourseLabels(state, overlay, id), [state, overlay])
  // Reactivate is direct when it reaches nobody. Otherwise it names them first: an Inactive skill is outside reporting scope, so coming back changes the page of everyone holding evidence on it (map D0 rule 9, map D1a).
  const [askReactivate, setAskReactivate] = React.useState<{ rows: LibraryRow[]; students: Array<{ id: string; name: string }> } | null>(null)
  const reactivate = React.useCallback((rows: LibraryRow[]) => {
    const seen = new Map<string, { id: string; name: string }>()
    const nameOf = new Map(state.people.map((p) => [p.id, p.name]))
    for (const r of rows) {
      const k = skillById(state, r.id)
      if (!k) continue
      for (const p of reactivateImpact(state, k)) seen.set(p.id, p)
      for (const e of evalsOfSkill(state, r.id)) if (!seen.has(e.studentId)) seen.set(e.studentId, { id: e.studentId, name: nameOf.get(e.studentId) ?? e.studentId })
    }
    const students = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
    if (students.length) setAskReactivate({ rows, students })
    else api.reactivate(rows.map((r) => r.id))
  }, [state, api])
  const dialogs = (
    <>
      <DeactivateDialog rows={deactivating} impactOf={impactOf} onOpenChange={(o) => !o && setDeactivating(null)} onConfirm={(ids) => { api.deactivate(ids); afterDeactivate.current?.(); afterDeactivate.current = undefined; setDeactivating(null) }} />
      <DeleteDialog row={deleting} coursesOf={coursesOf} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={(r) => { api.remove(r.id, r.name); setDeleting(null) }} />
      <ImpactDialog
        open={!!askReactivate}
        title={`Reactivate ${askReactivate?.rows.length === 1 ? askReactivate.rows[0]!.name : countSkills(askReactivate?.rows.length ?? 0)}?`}
        students={askReactivate?.students ?? []}
        confirm="Reactivate"
        skillId={askReactivate?.rows[0]?.id}
        onCancel={() => setAskReactivate(null)}
        onConfirm={() => { if (askReactivate) api.reactivate(askReactivate.rows.map((r) => r.id)); setAskReactivate(null) }}
      />
    </>
  )
  const deactivate = React.useCallback((rows: LibraryRow[], done?: () => void) => { afterDeactivate.current = done; setDeactivating(rows) }, [])
  return { dialogs, reactivate, deactivate, del: setDeleting }
}
