"use client"

/**
 * Row actions for one skill and the lifecycle dialogs (strategy/03 section 9, REQ SL-11, IM-14):
 * - Deactivate is a confirm that shows what it withdraws first (REQ SL-11: courses, students who have it, evaluations kept).
 * - "Replace with a new version" opens "Replace {skill}" over the library (replace-sheet.tsx, ?replace=), carrying the skill.
 * - A configured skill's settings come from Evaluation settings; its row offers "Change for this skill" (the per-skill page,
 *   "Change one skill", D-L37) rather than "Open configuration".
 * - Delete exists only while nothing is tracked against a skill (D-X15); its courses are listed and unmapped on delete.
 *   When blocked, the item stays disabled and its reason sits in a tooltip and in aria-describedby.
 * - Copy settings applies one skill's configuration to several selected skills.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, useTooltipProvided } from "@exxatdesignux/ui/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { configureHref, mappingHref, replaceHref, type LibraryRow } from "@/lib/lab/library"
import { countSkills, skillNoun } from "@/lib/lab/terms"
import type { LibraryApi } from "./use-library"
import { draftFromRow } from "./skill-sheet"
import { fmt, plural } from "@/lib/v2/format"
import { useV2State } from "@/lib/v2/react"
import { retireImpact, type RetireImpact } from "@/lib/lab/retire"
import { TYPE } from "@/components/lab/type-scale"
import { useUrlParam } from "./library-chrome"
import { ReplaceSheet } from "./replace-sheet"


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
  onDeactivate: (rows: LibraryRow[]) => void
  onReactivate: (rows: LibraryRow[]) => void
  onDelete: (r: LibraryRow) => void
  /** Open "Replace {skill}" in place. Without it the item links to the library with ?replace=. */
  onReplace?: (r: LibraryRow) => void
  /** Save a new description from the skill panel [REQ SL-02]; the other details stay as they are. */
  onSaveDescription?: (r: LibraryRow, description: string) => void
}

/** Uses the app's TooltipProvider when there is one, and supplies its own otherwise (tests, stand-alone screens). */
function TipScope({ children }: { children: React.ReactNode }) {
  return useTooltipProvided() ? <>{children}</> : <TooltipProvider>{children}</TooltipProvider>
}

const stopRowClick = (e: React.MouseEvent) => e.stopPropagation()

export function RowActions({ row, handlers, hideConfigure = false, hideMap = false }: { row: LibraryRow; handlers: RowActionHandlers; hideConfigure?: boolean; /** The detail panel's primary already maps a configured row. */ hideMap?: boolean }) {
  const block = deleteBlockReason(row)
  const inactive = row.status === "inactive"
  const mappable = row.status === "configured" && !hideMap
  const blockId = `delete-block-${React.useId()}`
  const blockText = block ? `${block}, so it cannot be deleted` : ""
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`} onClick={stopRowClick} {...railTriggerProps()}>
          <i className="fa-light fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      {/* Marked as a rail trigger: choosing an action from the detail panel must not dismiss the panel first. */}
      {/* React events bubble through the menu's portal to the table row; stop them so a choice does not also open the skill panel. */}
      <DropdownMenuContent align="end" className="w-60" onClick={stopRowClick} {...railTriggerProps()}>
        {hideConfigure ? null : (
          <DropdownMenuItem asChild>
            <Link href={configureHref(row.id)}><i className="fa-light fa-sliders" aria-hidden="true" />{row.status === "not-configured" ? (row.draft ? "Continue configuring" : "Configure") : `Change for this ${skillNoun()}`}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => handlers.onEdit(row)}><i className="fa-light fa-pen" aria-hidden="true" />Edit details</DropdownMenuItem>
        {mappable ? (
          <DropdownMenuItem asChild>
            <Link href={mappingHref(row.id)}><i className="fa-light fa-sitemap" aria-hidden="true" />Map to courses</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {inactive ? (
          <DropdownMenuItem onSelect={() => handlers.onReactivate([row])}><i className="fa-light fa-circle-play" aria-hidden="true" />Reactivate</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => handlers.onDeactivate([row])}><i className="fa-light fa-circle-pause" aria-hidden="true" />Deactivate</DropdownMenuItem>
        )}
        {inactive ? null : handlers.onReplace ? (
          <DropdownMenuItem onSelect={() => handlers.onReplace!(row)}><i className="fa-light fa-arrows-rotate" aria-hidden="true" />Replace with a new version</DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={replaceHref(row.id)}><i className="fa-light fa-arrows-rotate" aria-hidden="true" />Replace with a new version</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {block ? (
          /* A disabled item takes no pointer events, so the wrapping span carries the tooltip;
             the reason also reaches assistive tech through aria-describedby. */
          <TipScope>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <DropdownMenuItem variant="destructive" disabled aria-describedby={blockId}><i className="fa-light fa-trash" aria-hidden="true" />Delete</DropdownMenuItem>
                  <span id={blockId} className="sr-only">{blockText}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="z-[100] max-w-64">{blockText}</TooltipContent>
            </Tooltip>
          </TipScope>
        ) : (
          <DropdownMenuItem variant="destructive" onSelect={() => handlers.onDelete(row)}><i className="fa-light fa-trash" aria-hidden="true" />Delete</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DeactivateDialog({ rows, onOpenChange, onConfirm, impactOf }: { rows: LibraryRow[] | null; onOpenChange: (o: boolean) => void; onConfirm: (ids: string[]) => void; /** What deactivating one skill withdraws (REQ SL-11); omitted, the dialog shows the sentence only. */ impactOf?: (id: string) => RetireImpact | null }) {
  const open = !!rows && rows.length > 0
  const list = rows ?? []
  const evidence = list.reduce((n, r) => n + r.evidence, 0)
  const one = list.length === 1
  // What deactivating withdraws [REQ SL-11], before confirm: one skill only (the same figures as the retire flow).
  const impact = open && one && impactOf ? impactOf(list[0]!.id) : null
  const subject = one ? list[0]!.name : countSkills(list.length)
  const pronoun = one ? "it" : "them"
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={ABOVE_SHEET} overlayClassName={ABOVE_SHEET}>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Deactivate ${subject}?`}</AlertDialogTitle>
          <AlertDialogDescription>{evidence ? `Evaluations are kept, and you can reactivate ${pronoun} later.` : `No evaluations yet, and you can reactivate ${pronoun} later.`}</AlertDialogDescription>
        </AlertDialogHeader>
        {impact ? (
          <dl className="grid grid-cols-3 gap-4" data-deactivate-impact>
            {[
              { label: "Leaves courses", n: impact.courses },
              { label: "Students who have it", n: impact.requiredFor },
              { label: "Evaluations kept", n: impact.evidence },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <dt className={TYPE.meta}>{f.label}</dt>
                <dd className={`${TYPE.figure} text-foreground`}>{fmt(f.n)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" size="sm">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="default" size="sm" onClick={() => onConfirm(list.map((r) => r.id))}>
            {one ? "Deactivate" : `Deactivate ${countSkills(list.length)}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteDialog({ row, onOpenChange, onConfirm }: { row: LibraryRow | null; onOpenChange: (o: boolean) => void; onConfirm: (r: LibraryRow) => void }) {
  return (
    <AlertDialog open={!!row} onOpenChange={onOpenChange}>
      <AlertDialogContent className={ABOVE_SHEET} overlayClassName={ABOVE_SHEET}>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete ${row?.name ?? ""}?`}</AlertDialogTitle>
          <AlertDialogDescription>{row?.unmapFrom.length ? `Unmaps it from ${row.unmapFrom.join(", ")}. This cannot be undone.` : "This cannot be undone."}</AlertDialogDescription>
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
      <DialogContent className={`${ABOVE_SHEET} sm:max-w-lg`} overlayClassName={ABOVE_SHEET}>
        <DialogHeader>
          <DialogTitle>{`Copy settings to ${countSkills(list.length)}`}</DialogTitle>
          <DialogDescription>Copied as a draft, not configured.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="copy-source">Copy from</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger id="copy-source" className="w-full">
              <SelectValue placeholder={`Choose a configured ${skillNoun()}`} />
            </SelectTrigger>
            <SelectContent className={`${ABOVE_SHEET} max-h-72`}>
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
    onReplace: (r) => ref.current.life.replace(r),
    onSaveDescription: (r, description) => ref.current.api.edit(r.id, { ...draftFromRow(r), description }),
  }), [])
}

/** One place that owns the dialog state, so every variant wires the same lifecycle. */
export function useLifecycle(api: LibraryApi) {
  const [deactivating, setDeactivating] = React.useState<LibraryRow[] | null>(null)
  const [deleting, setDeleting] = React.useState<LibraryRow | null>(null)
  const [copying, setCopying] = React.useState<LibraryRow[] | null>(null)
  // The skill being replaced lives in the URL (?replace=), so a link from elsewhere, reload and Back all reopen the flow.
  const [replacingId, setReplacingId] = useUrlParam("replace")
  const replacing = replacingId ? api.byId.get(replacingId) ?? null : null
  const state = useV2State()
  const impactOf = React.useCallback((id: string) => retireImpact(state, id), [state])
  const sources = React.useMemo(() => api.rows.filter((r) => r.status === "configured" && r.model), [api.rows])
  const dialogs = (
    <>
      <DeactivateDialog rows={deactivating} impactOf={impactOf} onOpenChange={(o) => !o && setDeactivating(null)} onConfirm={(ids) => api.deactivate(ids)} />
      <DeleteDialog row={deleting} onOpenChange={(o) => !o && setDeleting(null)} onConfirm={(r) => { api.remove(r.id, r.name); setDeleting(null) }} />
      <CopySettingsDialog targets={copying} sources={sources} onOpenChange={(o) => !o && setCopying(null)} onConfirm={(s, t) => api.copyConfig(s, t)} />
      <ReplaceSheet row={replacing && replacing.status !== "inactive" ? replacing : null} rows={api.rows} onOpenChange={(o) => !o && setReplacingId(null)} onReplace={(id, d) => api.replace(id, d)} />
    </>
  )
  return { dialogs, deactivate: setDeactivating, del: setDeleting, copy: setCopying, replace: (r: LibraryRow) => setReplacingId(r.id) }
}
