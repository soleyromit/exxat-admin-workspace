"use client"

/**
 * Details collected with every evaluation (Proposed, D-EM1116-c; prototype 2026-11-16 F6): one program-wide table on Evaluation settings G, tab Details.
 * Built-in rows are locked; program rows are added, edited, moved, stopped (values kept) or deleted (only while never used) [REQ SC-13].
 * Sankalp [CALL 11-16]: forms belong to the Prism form builder later, so this stays a plain table.
 * Framing (Romit 2026-11-17: "if you check the prototype it gives some idea of what it's about, which I don't see here"): the prototype's heading,
 * its one purpose line and its closing line, nothing more. Filled in by and Required are always columns (who fills each detail in is the point
 * of the table); a dropdown lists its choices under its name. The closing line opens the first method, where Preview shows the details in place
 * (Q holds its panel tab in state, so the link cannot land on Preview itself).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { TYPE } from "@/components/lab/type-scale"
import { LINK } from "@/components/lab/link-styles"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { EmptyBlock } from "@/components/lab/empty-block"
import { RowMenu, type RowMenuEntry } from "@/components/lab/shared/row-menu"
import type { ResultBannerValue } from "@/components/lab/shared/result-banner"
import { useV2State, useV2Store } from "@/lib/v2/react"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { methodsOf } from "@/lib/lab/methods"
import {
  DETAIL_BY_LABEL, DETAIL_TYPE_LABEL, addDetail, deleteDetail, detailDeleteBlocked, detailsOf, editDetail, moveDetail, setDetailStopped,
  type DetailBy, type DetailType, type ProgramDetail,
} from "@/lib/lab/details"

interface Row extends Record<string, unknown> {
  id: string
  d: ProgramDetail
  name: string
  type: string
  by: string
  required: string
}

const EDITABLE_TYPES: DetailType[] = ["short", "long", "number", "date", "choice"]

interface Draft { name: string; type: DetailType; by: DetailBy; required: boolean; choices: string }
const emptyDraft: Draft = { name: "", type: "short", by: "student", required: false, choices: "" }
const draftOf = (d: ProgramDetail): Draft => ({ name: d.name, type: d.type, by: d.by, required: d.required, choices: (d.choices ?? []).join(", ") })
const choicesOf = (raw: string) => raw.split(",").map((x) => x.trim()).filter(Boolean)

/** A method's page on this screen, keeping the variant and return context (the same keys the methods list keeps). */
function useMethodHref(): (id: string) => string {
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const to = useLabHref()
  return React.useCallback((id: string) => {
    const q = new URLSearchParams()
    for (const k of ["variant", "from", "list"]) { const v = params?.get(k); if (v) q.set(k, v) }
    q.set("method", id)
    return `${pathname}${to(`?${q.toString()}`)}`
  }, [params, pathname, to])
}

function DetailDialog({ open, editing, onOpenChange, onSubmit }: { open: boolean; editing: ProgramDetail | null; onOpenChange: (o: boolean) => void; onSubmit: (d: Draft) => string | null }) {
  const [draft, setDraft] = React.useState<Draft>(emptyDraft)
  const [error, setError] = React.useState<{ field: "name" | "choices"; text: string } | null>(null)
  React.useEffect(() => { if (open) { setDraft(editing ? draftOf(editing) : emptyDraft); setError(null) } }, [open, editing])
  const patch = (p: Partial<Draft>) => { setDraft((d) => ({ ...d, ...p })); setError(null) }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (draft.type === "choice" && choicesOf(draft.choices).length < 2) {
      setError({ field: "choices", text: "Enter at least two choices, separated by commas." })
      requestAnimationFrame(() => document.getElementById("detail-choices")?.focus())
      return
    }
    const err = onSubmit(draft)
    if (err) { setError({ field: "name", text: err }); requestAnimationFrame(() => document.getElementById("detail-name")?.focus()) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-detail-dialog>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add a detail"}</DialogTitle>
            <DialogDescription className="sr-only">{`Every evaluation, for every ${skillNoun()}, asks for this detail.`}</DialogDescription>
          </DialogHeader>
          <Field data-invalid={error?.field === "name" ? true : undefined}>
            <FieldLabel htmlFor="detail-name">Name</FieldLabel>
            <Input id="detail-name" autoFocus maxLength={80} value={draft.name} placeholder="For example, Unit" aria-invalid={error?.field === "name" || undefined} aria-describedby={error?.field === "name" ? "detail-name-error" : undefined} onChange={(e) => patch({ name: e.target.value })} />
            {error?.field === "name" ? <FieldError id="detail-name-error">{error.text}</FieldError> : null}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="detail-type">Type</FieldLabel>
              <Select value={draft.type} onValueChange={(v) => patch({ type: v as DetailType })}>
                <SelectTrigger id="detail-type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{EDITABLE_TYPES.map((t) => <SelectItem key={t} value={t}>{DETAIL_TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="detail-by">Filled in by</FieldLabel>
              <Select value={draft.by} onValueChange={(v) => patch({ by: v as DetailBy })}>
                <SelectTrigger id="detail-by" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{(["student", "evaluator"] as DetailBy[]).map((b) => <SelectItem key={b} value={b}>{DETAIL_BY_LABEL[b]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          {draft.type === "choice" ? (
            <Field data-invalid={error?.field === "choices" ? true : undefined}>
              <FieldLabel htmlFor="detail-choices">Choices</FieldLabel>
              <Input id="detail-choices" value={draft.choices} placeholder="Day, Evening, Night" aria-invalid={error?.field === "choices" || undefined} aria-describedby={error?.field === "choices" ? "detail-choices-error" : undefined} onChange={(e) => patch({ choices: e.target.value })} />
              {error?.field === "choices" ? <FieldError id="detail-choices-error">{error.text}</FieldError> : null}
            </Field>
          ) : null}
          <div className="flex items-center gap-2">
            <Checkbox id="detail-required" checked={draft.required} onCheckedChange={(c) => patch({ required: c === true })} />
            <Label htmlFor="detail-required" className="font-normal">Required</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">{editing ? "Save detail" : "Add detail"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** The Details tab body; `adding` is driven by the page's one primary action, Add detail. */
export function DetailsTable({ adding, setAdding, onBanner }: { adding: boolean; setAdding: (v: boolean) => void; onBanner: (b: ResultBannerValue | null) => void }) {
  const state = useV2State()
  const store = useV2Store()
  const isMobile = useIsMobile()
  const [editing, setEditing] = React.useState<ProgramDetail | null>(null)
  const [deleting, setDeleting] = React.useState<ProgramDetail | null>(null)
  const details = React.useMemo(() => detailsOf(state), [state])
  const program = details.filter((d) => !d.builtIn)
  const write = (r: { ok: true; state: typeof state } | { ok: false; error: string }, done?: string): string | null => {
    if (!r.ok) return r.error
    store.update(() => r.state)
    if (done) onBanner({ variant: "success", title: done })
    return null
  }
  const methodHref = useMethodHref()
  const firstMethod = React.useMemo(() => methodsOf(state)[0] ?? null, [state])
  const rows: Row[] = details.map((d) => ({ id: d.id, d, name: d.name, type: DETAIL_TYPE_LABEL[d.type], by: DETAIL_BY_LABEL[d.by], required: d.required ? "Yes" : "No" }))
  const entries = (d: ProgramDetail): RowMenuEntry[] => {
    const i = program.findIndex((x) => x.id === d.id)
    return [
      { slot: "edit", label: "Edit", icon: "fa-pen", onSelect: () => setEditing(d) },
      { slot: "lifecycle", label: "Move up", icon: "fa-arrow-up", onSelect: () => { write(moveDetail(state, d.id, -1)) }, blockedBecause: i <= 0 ? "Already first" : undefined },
      { slot: "lifecycle", label: "Move down", icon: "fa-arrow-down", onSelect: () => { write(moveDetail(state, d.id, 1)) }, blockedBecause: i >= program.length - 1 ? "Already last" : undefined },
      d.stopped
        ? { slot: "status", label: "Collect again", icon: "fa-rotate-left", onSelect: () => { write(setDetailStopped(state, d.id, false), `${d.name} is collected again.`) } }
        : { slot: "status", label: "Stop collecting", icon: "fa-circle-pause", onSelect: () => { write(setDetailStopped(state, d.id, true), `Stopped collecting ${d.name}. Values already recorded are kept.`) } },
      { slot: "delete", label: "Delete", icon: "fa-trash", onSelect: () => setDeleting(d), blockedBecause: detailDeleteBlocked(state, d) ?? undefined },
    ]
  }
  const columns: ColumnDef<Row>[] = [
    {
      key: "name",
      label: "Detail",
      width: isMobile ? 220 : 420,
      defaultPin: "left",
      cell: (r) => (
        <span className="flex min-w-0 flex-col gap-0.5 py-1">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className={r.d.stopped ? "text-sm text-muted-foreground" : "text-sm text-foreground"}>{r.name}</span>
            {r.d.builtIn ? <StatusBadge label="Built in" tone="neutral" size="sm" surface="table" /> : null}
            {r.d.stopped ? <StatusBadge label="Stopped" tone="neutral" icon="fa-circle-pause" size="sm" surface="table" /> : null}
          </span>
          {/* A built-in name already says its choices ("Graded or practice"); a program dropdown lists them, as the prototype does. */}
          {!r.d.builtIn && r.d.choices?.length ? <span className={TYPE.meta} data-detail-choices>{r.d.choices.join(" · ")}</span> : null}
        </span>
      ),
    },
    { key: "type", label: "Type", width: 240, cell: (r) => <span className="text-sm">{r.type}</span> },
    { key: "by", label: "Filled in by", width: 140, cell: (r: Row) => <span className="text-sm">{r.by}</span> },
    { key: "required", label: "Required", width: 110, cell: (r: Row) => <span className="text-sm">{r.required}</span> },
    // No program rows yet: no menu column (every built-in row is locked, so it would be empty).
    ...(program.length ? [{
      key: "actions",
      label: "",
      width: 48,
      minWidth: 48,
      defaultPin: "right",
      lockPin: true,
      cell: (r: Row) => (r.d.builtIn ? <span className="sr-only">Built in, cannot be changed</span> : <div className="flex items-center justify-center"><RowMenu label={`Actions for ${r.name}`} entries={entries(r.d)} /></div>),
    } satisfies ColumnDef<Row>] : []),
  ]
  return (
    <section className="flex min-w-0 flex-col gap-4" data-region="details" aria-labelledby="details-heading">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="details-heading" className={TYPE.section}>Details collected with every evaluation</h2>
        <p className={TYPE.helper}>{`Set up once for the program. Every ${skillNoun()}, every method and every evaluation asks for these.`}</p>
      </div>
      <div className="min-w-0">
        <DataTable<Row> key={isMobile ? "phone" : "wide"} data={rows} columns={isMobile ? columns.filter((c) => c.key !== "type") : columns} getRowId={(r) => r.id} selectable={false} edgeInset={false} emptyState={<EmptyBlock compact title="No details match" body="Clear the search or filter to see every detail." />} />
      </div>
      <p className={TYPE.helper} data-details-closing>
        {`A student sending several ${skillNounPlural()} fills these in once. On the check-off grid they are entered once for the session. `}
        {firstMethod ? (
          <>To see them in place, <Link href={methodHref(firstMethod.id)} scroll={false} className={LINK} data-details-preview>open any method</Link> and choose Preview.</>
        ) : "Once a method exists, its Preview shows them in place."}
      </p>
      <DetailDialog
        open={adding || !!editing}
        editing={editing}
        onOpenChange={(o) => { if (!o) { setAdding(false); setEditing(null) } }}
        onSubmit={(dr) => {
          const body = { name: dr.name, type: dr.type, by: dr.by, required: dr.required, ...(dr.type === "choice" ? { choices: choicesOf(dr.choices) } : { choices: undefined }) }
          const err = editing ? write(editDetail(state, editing.id, body), `Saved ${dr.name.trim()}.`) : write(addDetail(state, body), `Added ${dr.name.trim()}. Every evaluation asks for it from now on.`)
          if (!err) { setAdding(false); setEditing(null) }
          return err
        }}
      />
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete ${deleting?.name ?? "this detail"}?`}</AlertDialogTitle>
            <AlertDialogDescription>No evaluation has used it. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if (deleting) { const name = deleting.name; const err = write(deleteDetail(state, deleting.id)); onBanner(err ? { variant: "warning", title: err } : { variant: "success", title: `Deleted ${name}.` }) } setDeleting(null) }}>Delete detail</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
