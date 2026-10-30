"use client"

/**
 * Row actions for one skill and the lifecycle dialogs (strategy/03 section 9, REQ SL-11, IM-14):
 * - Deactivate asks for the intent first: a mistake (deactivate, evidence kept) or a new standard (start a new list).
 * - Delete exists only while nothing is tracked against a skill (D-X15); its courses are listed and unmapped on delete.
 * - Copy settings applies one skill's configuration to several selected skills.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { configureHref, mappingHref, newListHref, type LibraryRow } from "@/lib/lab/library"
import { countSkills, skillNoun } from "@/lib/lab/terms"
import type { LibraryApi } from "./use-library"
import { draftFromRow } from "./skill-sheet"
import { plural } from "@/lib/v2/format"


export function deleteBlockReason(r: LibraryRow): string | null {
  if (r.evidence > 0) return `Has ${plural(r.evidence, "evaluation", "evaluations")}`
  if (!r.canDelete) return "Has requests or log entries"
  return null
}

export interface RowActionHandlers {
  onEdit: (r: LibraryRow) => void
  onDeactivate: (rows: LibraryRow[]) => void
  onReactivate: (rows: LibraryRow[]) => void
  onDelete: (r: LibraryRow) => void
  /** Save a new description from the skill panel [REQ SL-02]; the other details stay as they are. */
  onSaveDescription?: (r: LibraryRow, description: string) => void
}

export function RowActions({ row, handlers, hideConfigure = false, hideMap = false }: { row: LibraryRow; handlers: RowActionHandlers; hideConfigure?: boolean; /** The detail panel's primary already maps a configured row. */ hideMap?: boolean }) {
  const block = deleteBlockReason(row)
  const inactive = row.status === "inactive"
  const mappable = row.status === "configured" && !hideMap
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`} {...railTriggerProps()}>
          <i className="fa-light fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      {/* Marked as a rail trigger: choosing an action from the detail panel must not dismiss the panel first. */}
      <DropdownMenuContent align="end" className="w-60" {...railTriggerProps()}>
        {hideConfigure ? null : (
          <DropdownMenuItem asChild>
            <Link href={configureHref(row.id)}>{row.status === "not-configured" ? (row.draft ? "Continue configuring" : "Configure") : "Open configuration"}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => handlers.onEdit(row)}>Edit details</DropdownMenuItem>
        {mappable ? (
          <DropdownMenuItem asChild>
            <Link href={mappingHref(row.id)}>Map to courses</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {inactive ? (
          <DropdownMenuItem onSelect={() => handlers.onReactivate([row])}>Reactivate</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => handlers.onDeactivate([row])}>Deactivate or replace</DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={!!block} onSelect={() => handlers.onDelete(row)} className="flex flex-col items-start gap-0">
          <span>Delete</span>
          {block ? <span className="text-xs text-muted-foreground">{`${block}, so it cannot be deleted`}</span> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DeactivateDialog({ rows, onOpenChange, onConfirm }: { rows: LibraryRow[] | null; onOpenChange: (o: boolean) => void; onConfirm: (ids: string[]) => void }) {
  const [intent, setIntent] = React.useState<"mistake" | "standard" | "">("")
  React.useEffect(() => { if (rows) setIntent("") }, [rows])
  const open = !!rows && rows.length > 0
  const list = rows ?? []
  const evidence = list.reduce((n, r) => n + r.evidence, 0)
  const courses = list.reduce((n, r) => n + r.courses, 0)
  const subject = list.length === 1 ? list[0]!.name : countSkills(list.length)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{`Why remove ${subject}?`}</DialogTitle>
          <DialogDescription>{evidence ? `${plural(evidence, "evaluation stays", "evaluations stay")} on student records either way.` : "No evaluations are recorded against it yet."}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={intent} onValueChange={(v) => setIntent(v as "mistake" | "standard")} aria-label="Reason" className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-md border border-border p-3">
            <RadioGroupItem id="intent-mistake" value="mistake" className="mt-0.5" />
            <Label htmlFor="intent-mistake" className="flex flex-col items-start gap-1 font-normal">
              <span className="font-medium text-foreground">It was added by mistake</span>
              <span className="text-sm text-muted-foreground">{`Deactivate. It leaves mapping${courses ? ` on ${plural(courses, "course", "courses")}` : ""}, student selection and reports. You can reactivate it.`}</span>
            </Label>
          </div>
          <div className="flex items-start gap-3 rounded-md border border-border p-3">
            <RadioGroupItem id="intent-standard" value="standard" className="mt-0.5" />
            <Label htmlFor="intent-standard" className="flex flex-col items-start gap-1 font-normal">
              <span className="font-medium text-foreground">A new standard replaces it</span>
              <span className="text-sm text-muted-foreground">Keep it for current cohorts and start a new list for the next one.</span>
            </Label>
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          {intent === "standard" ? (
            <Button asChild variant="default" size="sm">
              <Link href={newListHref}>Start a new list</Link>
            </Button>
          ) : (
            <Button type="button" variant="default" size="sm" disabled={intent !== "mistake"} onClick={() => { onConfirm(list.map((r) => r.id)); onOpenChange(false) }}>
              {list.length === 1 ? "Deactivate" : `Deactivate ${countSkills(list.length)}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteDialog({ row, onOpenChange, onConfirm }: { row: LibraryRow | null; onOpenChange: (o: boolean) => void; onConfirm: (r: LibraryRow) => void }) {
  return (
    <AlertDialog open={!!row} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete ${row?.name ?? ""}?`}</AlertDialogTitle>
          <AlertDialogDescription>{row?.unmapFrom.length ? `It has no evidence. It will be unmapped from ${row.unmapFrom.join(", ")}. Deleting cannot be undone.` : "It has no evidence and no course. Deleting cannot be undone."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" size="sm" onClick={() => row && onConfirm(row)}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function CopySettingsDialog({ targets, sources, onOpenChange, onConfirm }: { targets: LibraryRow[] | null; sources: LibraryRow[]; onOpenChange: (o: boolean) => void; onConfirm: (sourceId: string, targetIds: string[]) => void }) {
  const [source, setSource] = React.useState("")
  React.useEffect(() => { if (targets) setSource("") }, [targets])
  const list = targets ?? []
  return (
    <Dialog open={list.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{`Copy settings to ${countSkills(list.length)}`}</DialogTitle>
          <DialogDescription>The model, achievement rule and evaluator roles are copied as a draft. Each stays not configured until you check and save it.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="copy-source">Copy from</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger id="copy-source" className="w-full">
              <SelectValue placeholder={`Choose a configured ${skillNoun()}`} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>{`${s.name}, ${s.modelLabel}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="default" size="sm" disabled={!source} onClick={() => { onConfirm(source, list.map((r) => r.id)); onOpenChange(false) }}>Copy settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Row handlers with a stable identity, so table columns are not rebuilt on every render. */
export function useStableHandlers(api: LibraryApi, life: ReturnType<typeof useLifecycle>, onEdit: (r: LibraryRow) => void): RowActionHandlers {
  const ref = React.useRef({ api, life, onEdit })
  ref.current = { api, life, onEdit }
  return React.useMemo<RowActionHandlers>(() => ({
    onEdit: (r) => ref.current.onEdit(r),
    onDeactivate: (rows) => ref.current.life.deactivate(rows),
    onReactivate: (rows) => ref.current.api.reactivate(rows.map((r) => r.id)),
    onDelete: (r) => ref.current.life.del(r),
    onSaveDescription: (r, description) => ref.current.api.edit(r.id, { ...draftFromRow(r), description }),
  }), [])
}

/** One place that owns the dialog state, so every variant wires the same lifecycle. */
export function useLifecycle(api: LibraryApi) {
  const [deactivating, setDeactivating] = React.useState<LibraryRow[] | null>(null)
  const [deleting, setDeleting] = React.useState<LibraryRow | null>(null)
  const [copying, setCopying] = React.useState<LibraryRow[] | null>(null)
  const sources = React.useMemo(() => api.rows.filter((r) => r.status === "configured" && r.model), [api.rows])
  const dialogs = (
    <>
      <DeactivateDialog rows={deactivating} onOpenChange={(o) => !o && setDeactivating(null)} onConfirm={(ids) => api.deactivate(ids)} />
      <DeleteDialog row={deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={(r) => { api.remove(r.id, r.name); setDeleting(null) }} />
      <CopySettingsDialog targets={copying} sources={sources} onOpenChange={(o) => !o && setCopying(null)} onConfirm={(s, t) => api.copyConfig(s, t)} />
    </>
  )
  return { dialogs, deactivate: setDeactivating, del: setDeleting, copy: setCopying }
}
