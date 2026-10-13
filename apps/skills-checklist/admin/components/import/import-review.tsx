"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox, CheckboxLabel } from "@exxatdesignux/ui/components/ui/checkbox"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { RadioGroup, RadioGroupItem, RadioGroupLabel } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader } from "@exxatdesignux/ui/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { InlineInputCell, InlineSelectCell, RowActionsCell } from "@exxatdesignux/ui/components/data-views"
import { EmptyState } from "@/components/skills"
import {
  addImportRow,
  cancelImport,
  confirmImport,
  mergeImportRows,
  norm,
  resolveUnreadLine,
  setImportCreateCategories,
  setImportRowsIncluded,
  skillHasEvidence,
  splitImportRow,
  updateImportRow,
  type ImportRowPatch,
  type Result,
} from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import type { Db, Id, ImportBatch, ImportRow } from "@/lib/domain/types"
import { buttons, importAiCopy, importReviewCopy, surface } from "@/lib/copy"
import { r2i } from "@/lib/copy/r2-import"
import { ROUTES } from "@/lib/skills-routes"
import { useReady } from "./use-ready"

const NONE = "__none__"



/** Query keys S-04 reads when the admin returns to the library after an import (T8, T15). Reported to the manager. */
export const importReturnHref = {
  configure: () => `${ROUTES.skills}?status=unconfigured`,
  batch: (batchId: Id) => `${ROUTES.skills}?batch=${batchId}`,
}

type ViewRow = {
  id: string
  row: ImportRow
  existingName: string | null
  hasEvidence: boolean
  conflict: boolean
}

function categoryOptions(db: Db, batch: ImportBatch, extra: string[]): Array<{ value: string; label: string }> {
  const seen = new Set<string>()
  const out: Array<{ value: string; label: string }> = [{ value: NONE, label: importReviewCopy.noCategory }]
  const add = (name: string) => {
    const key = norm(name)
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push({ value: name, label: name })
  }
  for (const c of db.categories) if (c.active) add(c.name)
  for (const r of batch.rows) if (r.categoryName) add(r.categoryName)
  for (const n of extra) add(n)
  return out
}

/** Names proposed from headings that do not yet exist in the library (IM-07). */
function proposedNewCategories(db: Db, batch: ImportBatch, extra: string[]): string[] {
  const have = new Set(db.categories.map((c) => norm(c.name)))
  const out = new Map<string, string>()
  for (const r of batch.rows) if (r.categoryName && !have.has(norm(r.categoryName))) out.set(norm(r.categoryName), r.categoryName)
  for (const n of extra) if (!have.has(norm(n))) out.set(norm(n), n)
  return [...out.values()]
}

/** What the host needs after Create: the batch (S-04 shows its banners from `?imported=`), and what the confirm did. */
export interface ImportedInfo {
  batchId: Id
  created: number
  categories: number
  skipped: number
  replaced: number
}

export interface ImportReviewStepProps {
  batchId: string
  /** Back from the review: discards the draft (nothing was added) and returns to the input step. */
  onBack: () => void
  /** Closes the dialog without creating anything (X, Escape, outside click go through the discard prompt when dirty). */
  onClose: () => void
  onConfirmed: (info: ImportedInfo) => void
  /** Lets the dialog shell ask the step whether closing needs the discard prompt, and run it. */
  registerCloseGuard?: (guard: (() => boolean) | null) => void
}

/**
 * S-08 review (P-06 step 2) inside the 1024px dialog, the trust moment (IM-05..IM-09, IM-11, IM-13). A draft only: nothing
 * exists in the library until the admin confirms. Interpreted rows are editable, mergeable, splittable and excludable;
 * duplicates need a decision; anything not read is listed with its original text and is never dropped silently (IM-08).
 */
export function ImportReviewStep({ batchId, onBack, onClose, onConfirmed, registerCloseGuard }: ImportReviewStepProps) {
  const db = useDb()
  const { run } = useActions()
  const ready = useReady()

  const [dirty, setDirty] = React.useState(false)
  const [rowErrors, setRowErrors] = React.useState<Record<string, string>>({})
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [onlyAttention, setOnlyAttention] = React.useState(false)
  const [onlyCheck, setOnlyCheck] = React.useState(false)
  const [extraCategories, setExtraCategories] = React.useState<string[]>([])
  const [categoryNote, setCategoryNote] = React.useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = React.useState(false)
  const [discardTo, setDiscardTo] = React.useState<"back" | "close">("back")
  const [mergeFor, setMergeFor] = React.useState<Id | null>(null)
  const [splitFor, setSplitFor] = React.useState<Id | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

  const batch = db.importBatches.find((b) => b.id === batchId)
  const inReview = batch?.status === "review"

  // The dialog shell asks before closing with edits: returning true means "handled, show the discard prompt".
  React.useEffect(() => {
    registerCloseGuard?.(() => {
      if (!inReview) return false
      if (!dirty) {
        // Closing an untouched review also discards the draft, silently: nothing was added.
        run((d) => cancelImport(d, batchId))
        return false
      }
      setDiscardTo("close")
      setDiscardOpen(true)
      return true
    })
    return () => registerCloseGuard?.(null)
  }, [registerCloseGuard, dirty, inReview, batchId, run])

  // Leaving with unsaved edits warns (browser level). In-app Back and close use the discard dialog below.
  React.useEffect(() => {
    if (!dirty || !inReview) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty, inReview])

  if (!ready) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3 p-4">
        <DialogHeader className="sr-only">
          <DialogTitle>{surface.s08.title}</DialogTitle>
          <DialogDescription>Loading the draft</DialogDescription>
        </DialogHeader>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!batch || batch.status !== "review") {
    return (
      <div className="flex flex-col gap-4 p-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{surface.s08.title}</DialogTitle>
          <DialogDescription>{importReviewCopy.notFoundTitle}</DialogDescription>
        </DialogHeader>
        <EmptyState
          icon="fa-file-import"
          title={importReviewCopy.notFoundTitle}
          description={importReviewCopy.notFoundBody}
          footer={
            <Button type="button" variant="default" size="default" onClick={onBack}>
              {buttons.import}
            </Button>
          }
        />
      </div>
    )
  }

  // ---------------------------------------------------------------- review state
  const includedNames = new Map<string, number>()
  for (const r of batch.rows) if (r.include) includedNames.set(norm(r.name), (includedNames.get(norm(r.name)) ?? 0) + 1)
  const views: ViewRow[] = batch.rows.map((row) => {
    const existing = row.match.status === "duplicate" ? db.skills.find((s) => s.id === (row.match as { existingSkillId: Id }).existingSkillId) : undefined
    return {
      id: row.id,
      row,
      existingName: existing?.name ?? null,
      hasEvidence: existing ? skillHasEvidence(db, existing.id) : false,
      conflict: row.include && (includedNames.get(norm(row.name)) ?? 0) > 1,
    }
  })
  const rowById = new Map(views.map((v) => [v.id, v]))

  const creates = views.filter((v) => v.row.include && (v.row.match.status === "new" || v.row.duplicateChoice === "keepBoth")).length
  const replaces = views.filter((v) => v.row.include && v.row.match.status === "duplicate" && v.row.duplicateChoice === "replace").length
  const excluded = views.filter((v) => !v.row.include).length
  const duplicates = views.filter((v) => v.row.match.status === "duplicate").length
  const conflicts = views.filter((v) => v.conflict).length
  const attention = views.filter((v) => v.row.match.status === "duplicate" || v.conflict)
  const cued = views.filter((v) => (v.row.cue?.reasons.length ?? 0) > 0)
  const shown = views.filter((v) => (!onlyAttention || attention.includes(v)) && (!onlyCheck || cued.includes(v)))
  const newCategories = proposedNewCategories(db, batch, extraCategories)
  const options = categoryOptions(db, batch, extraCategories)

  let blockedReason: string | null = null
  if (creates + replaces === 0) blockedReason = importReviewCopy.noRowsIncluded
  else if (conflicts > 0) blockedReason = importReviewCopy.nameConflictHelp

  // ---------------------------------------------------------------- handlers (every edit marks the draft dirty)
  const apply = <T,>(action: (d: Db) => Result<T>, rowId?: Id): Result<T> => {
    const r = run((d) => action(d))
    if (r.ok) {
      setDirty(true)
      if (rowId) setRowErrors((e) => (rowId in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== rowId)) : e))
    } else if (rowId) {
      setRowErrors((e) => ({ ...e, [rowId]: r.error.message }))
    }
    return r
  }
  const patch = (rowId: Id, p: ImportRowPatch) => apply((d) => updateImportRow(d, batch.id, rowId, p), rowId)
  const bulkInclude = (ids: Id[], include: boolean) => apply((d) => setImportRowsIncluded(d, batch.id, ids, include))

  const onBackClick = () => {
    if (dirty) {
      setDiscardTo("back")
      setDiscardOpen(true)
      return
    }
    run((d) => cancelImport(d, batch.id))
    onBack()
  }
  const discard = () => {
    run((d) => cancelImport(d, batch.id))
    setDiscardOpen(false)
    if (discardTo === "back") onBack()
    else onClose()
  }
  const create = () => {
    setCreateError(null)
    const r = run((d, ctx) => confirmImport(d, batch.id, ctx))
    if (!r.ok) {
      setCreateError(r.error.message || importReviewCopy.createFailed)
      return
    }
    onConfirmed({ batchId: batch.id, created: r.value.created, categories: r.value.categoriesCreated, skipped: r.value.skipped, replaced: r.value.replaced })
  }

  const rowActions = (v: ViewRow) => [
    { label: v.row.include ? importReviewCopy.exclude : importReviewCopy.include, icon: v.row.include ? "fa-ban" : "fa-circle-check", onSelect: () => bulkInclude([v.id], !v.row.include) },
    { label: importReviewCopy.merge, icon: "fa-code-merge", onSelect: () => setMergeFor(v.id), disabled: views.length < 2 },
    { label: importReviewCopy.split, icon: "fa-scissors", onSelect: () => setSplitFor(v.id) },
    { label: importReviewCopy.addHere, icon: "fa-plus", onSelect: () => setAddOpen(true) },
  ]

  // Prototype P-06 columns: [checkbox] Skill | Description | Category. The duplicate decision (IM-06) sits under the skill name only when the
  // row is a duplicate; the row actions menu (merge, split, add, exclude) is the one narrow extra column (IM-05).
  const columns = [
    {
      key: "include",
      label: "",
      width: 44,
      resizable: false,
      cell: (v: ViewRow) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={v.row.include} onCheckedChange={(c) => bulkInclude([v.id], c === true)} aria-label={`Include ${v.row.name}`} />
        </span>
      ),
    },
    {
      key: "name",
      label: r2i.review.columns.skill,
      width: 300,
      cell: (v: ViewRow) => (
        <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
          <InlineInputCell
            label={`Skill name for ${v.row.name}`}
            value={v.row.name}
            onCommit={(value) => patch(v.id, { name: value })}
            aria-invalid={rowErrors[v.id] ? true : undefined}
            aria-describedby={rowErrors[v.id] ? `row-err-${v.id}` : undefined}
          />
          {v.row.cue && v.row.cue.reasons.length > 0 ? (
            <div className="flex flex-col gap-1" data-testid="row-cue">
              <span>
                <StatusBadge label={importAiCopy.cueLabel} tone="warning" icon="fa-triangle-exclamation" size="sm" />
              </span>
              <p className="text-xs text-muted-foreground">{v.row.cue.reasons.map((r) => importAiCopy.cueReasons[r]).join(" ")}</p>
            </div>
          ) : null}
          {rowErrors[v.id] ? (
            <FieldError id={`row-err-${v.id}`} role={undefined}>
              {rowErrors[v.id]}
            </FieldError>
          ) : null}
          {v.row.match.status === "duplicate" ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-foreground">
                <Badge variant="secondary">{importReviewCopy.statusDuplicate}</Badge> {surface.s08.duplicateRow(v.existingName ?? v.row.name)}
              </p>
              <RadioGroup aria-label={`Decision for ${v.row.name}`} value={v.row.duplicateChoice} onValueChange={(value) => patch(v.id, { duplicateChoice: value as ImportRow["duplicateChoice"] })} className="flex flex-wrap gap-3">
                {(["skip", "replace", "keepBoth"] as const).map((choice) => {
                  const disabled = choice === "replace" && v.hasEvidence
                  const id = `dup-${v.id}-${choice}`
                  return (
                    <div key={choice} className="flex items-center gap-1.5">
                      <RadioGroupItem id={id} value={choice} disabled={disabled} aria-describedby={disabled ? `${id}-why` : undefined} />
                      <RadioGroupLabel htmlFor={id}>{surface.s08.duplicateChoices[choice]}</RadioGroupLabel>
                      {disabled ? (
                        <span id={`${id}-why`} className="sr-only">
                          {surface.s08.replaceDisabled}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </RadioGroup>
              {v.hasEvidence ? <p className="text-xs text-muted-foreground">{surface.s08.replaceDisabled}</p> : null}
            </div>
          ) : v.conflict ? (
            <span className="text-xs text-foreground">{importReviewCopy.nameConflict}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "description",
      label: r2i.review.columns.description,
      width: 300,
      cell: (v: ViewRow) => <InlineInputCell label={`Description for ${v.row.name}`} value={v.row.description} emptyLabel={importReviewCopy.noDescription} onCommit={(value) => patch(v.id, { description: value })} />,
    },
    {
      key: "category",
      label: r2i.review.columns.category,
      width: 190,
      cell: (v: ViewRow) => (
        <InlineSelectCell label={`Category for ${v.row.name}`} value={v.row.categoryName ?? NONE} options={options} onCommit={(value) => patch(v.id, { categoryName: value === NONE ? null : value })} />
      ),
    },
    {
      key: "actions",
      label: "",
      width: 52,
      resizable: false,
      cell: (v: ViewRow) => <RowActionsCell row={v} triggerLabel={`Actions for ${v.row.name}`} actions={rowActions(v)} />,
    },
  ]

  const mergeRow = mergeFor ? rowById.get(mergeFor) : undefined
  const splitRow = splitFor ? rowById.get(splitFor) : undefined
  const stat = (label: string, value: number, caption: string, tone?: boolean) => (
    <Card size="sm" className="flex-1">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <p className={tone ? "text-2xl font-semibold text-foreground" : "text-2xl font-semibold text-foreground"} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </p>
        <CardDescription>{caption}</CardDescription>
      </CardHeader>
    </Card>
  )

  return (
    <>
      <DialogHeader className="shrink-0 border-b border-border p-4 pe-12">
        <DialogTitle className="text-base font-semibold">{r2i.review.title(batch.rows.length, batch.sourceKind === "paste" ? "pasted list" : batch.sourceName)}</DialogTitle>
        <DialogDescription>{r2i.review.subtitle}</DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* IM-13: the only framing is that this is a draft (the subtitle). No accuracy claim. */}
        <ul aria-live="polite" aria-label="Import counters" className="grid gap-3 sm:grid-cols-3">
          <li className="flex">{stat(r2i.review.found, batch.rows.length, r2i.review.foundCaption)}</li>
          <li className="flex">{stat(r2i.review.willBeCreated, creates, r2i.review.excludedCaption(excluded), true)}</li>
          <li className="flex">{stat(r2i.review.duplicates, duplicates, r2i.review.duplicatesCaption)}</li>
        </ul>

        {batch.interpretation?.mode === "ai" ? <LocalBanner variant="info">{cued.length > 0 ? importAiCopy.info : importAiCopy.infoNoCue}</LocalBanner> : null}
        {batch.interpretation?.mode === "ai-fallback" ? <LocalBanner variant="info">{importAiCopy.fallbackBanner}</LocalBanner> : null}
        {batch.rows.length === 0 ? <LocalBanner variant="warning">{importReviewCopy.nothingRead}</LocalBanner> : null}
        {createError ? <LocalBanner variant="error" retry={{ label: buttons.retry, onClick: create }}>{createError}</LocalBanner> : null}
        {categoryNote ? <LocalBanner variant="info" dismissible onDismiss={() => setCategoryNote(null)}>{categoryNote}</LocalBanner> : null}

        {newCategories.length > 0 ? (
          <Card size="sm" className="gap-0 py-0">
            <CardContent className="flex items-start gap-2 p-3">
              <Checkbox id="create-categories" checked={batch.createCategories} onCheckedChange={(c) => apply((d) => setImportCreateCategories(d, batch.id, c === true))} aria-describedby="create-categories-names" />
              <div className="flex flex-col">
                <CheckboxLabel htmlFor="create-categories">{r2i.review.createCategories(newCategories.length)}</CheckboxLabel>
                <span id="create-categories-names" className="text-xs text-muted-foreground">
                  {r2i.review.createCategoriesNames(newCategories)}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {batch.rows.length > 0 ? (
          <section aria-label="Proposed skills" id="proposed" className="flex flex-col gap-2">
            {attention.length > 0 ? (
              <div className="flex items-center gap-2">
                <Checkbox id="attention-only" checked={onlyAttention} onCheckedChange={(c) => setOnlyAttention(c === true)} />
                <CheckboxLabel htmlFor="attention-only">{importReviewCopy.needsAttentionOnly}</CheckboxLabel>
              </div>
            ) : null}
            {cued.length > 0 ? (
              <div className="flex items-center gap-2">
                <Checkbox id="check-only" checked={onlyCheck} onCheckedChange={(c) => setOnlyCheck(c === true)} />
                <CheckboxLabel htmlFor="check-only">{importAiCopy.onlyCheck}</CheckboxLabel>
              </div>
            ) : null}
            <DataTable<ViewRow>
              data={shown}
              columns={columns}
              getRowId={(v) => v.id}
              getRowSelectionLabel={(v) => v.row.name}
              selectable={false}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              lazyLoading={{ enabled: shown.length > 150, threshold: 150 }}
              emptyState={<p className="p-6 text-sm text-muted-foreground">{surface.s08.unreadNone}</p>}
            />
          </section>
        ) : null}

        {/* IM-08: always rendered, so "nothing was missed" is stated rather than implied. */}
        {batch.unread.length > 0 ? (
          <section id="not-read" aria-labelledby="not-read-title" className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <h3 id="not-read-title" className="text-sm font-semibold text-foreground">
              {r2i.review.unreadTitle(batch.unread.length)}
            </h3>
            <p className="text-xs text-muted-foreground">{r2i.review.unreadBody}</p>
            <ul className="flex flex-col gap-2">
              {batch.unread.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">{u.location}: </span>
                      <span className="font-mono">{u.text}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{surface.s08.unreadReason[u.reason]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => apply((d) => resolveUnreadLine(d, batch.id, u.id, "skill"))}>{importReviewCopy.unreadAddSkill}</Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // The store has no "add as category" action: the name becomes a category choice for rows, and the
                        // create-categories opt-in is switched on so an assigned name is created on confirm.
                        const name = u.text.trim().replace(/^#{1,6}\s+/, "").replace(/:$/, "")
                        setExtraCategories((c) => [...c, name])
                        apply((d) => {
                          const r = resolveUnreadLine(d, batch.id, u.id, "ignore")
                          return r.ok ? setImportCreateCategories(r.db, batch.id, true) : r
                        })
                        setCategoryNote(importReviewCopy.unreadCategoryAdded(name))
                      }}
                    >
                      {importReviewCopy.unreadAddCategory}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => apply((d) => resolveUnreadLine(d, batch.id, u.id, "ignore"))}>{importReviewCopy.unreadIgnore}</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p id="not-read" className="text-xs text-muted-foreground">
            {surface.s08.unreadNone}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border p-4">
        {blockedReason ? (
          <p id="create-blocked" className="max-w-xl text-sm text-foreground">
            {blockedReason}
          </p>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="default" onClick={onBackClick}>
            {r2i.review.back}
          </Button>
          <Button type="button" variant="default" size="default" onClick={create} disabled={blockedReason !== null} aria-describedby={blockedReason ? "create-blocked" : undefined}>
            <i className="fa-light fa-check" aria-hidden="true" />
            {creates > 0 || replaces === 0 ? r2i.review.create(creates) : importReviewCopy.updateSkills(replaces)}
          </Button>
        </div>
      </div>

      {/* IM-13: leaving with edits asks first. Nothing has been added to the library. */}
      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{surface.s08.discard.title}</DialogTitle>
            <DialogDescription>{surface.s08.discard.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="default" onClick={() => setDiscardOpen(false)}>{surface.s08.discard.keep}</Button>
            <Button type="button" variant="destructive" size="default" onClick={discard}>{surface.s08.discard.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mergeRow ? (
        <MergeDialog
          source={mergeRow}
          others={views.filter((v) => v.id !== mergeRow.id)}
          onClose={() => setMergeFor(null)}
          onMerge={(otherId, name) => {
            const r = apply((d) => mergeImportRows(d, batch.id, [mergeRow.id, otherId], name || undefined))
            if (r.ok) setMergeFor(null)
            return r.ok ? null : r.error.message
          }}
        />
      ) : null}
      {splitRow ? (
        <SplitDialog
          source={splitRow}
          onClose={() => setSplitFor(null)}
          onSplit={(names) => {
            const r = apply((d) => splitImportRow(d, batch.id, splitRow.id, names))
            if (r.ok) setSplitFor(null)
            return r.ok ? null : r.error.message
          }}
        />
      ) : null}
      {addOpen ? (
        <AddDialog
          onClose={() => setAddOpen(false)}
          onAdd={(name, description) => {
            const r = apply((d) => addImportRow(d, batch.id, { name, description }))
            if (r.ok) setAddOpen(false)
            return r.ok ? null : r.error.message
          }}
        />
      ) : null}
    </>
  )
}

function MergeDialog({ source, others, onClose, onMerge }: { source: ViewRow; others: ViewRow[]; onClose: () => void; onMerge: (otherId: Id, name: string) => string | null }) {
  const [other, setOther] = React.useState<string>(others[0]?.id ?? "")
  const [name, setName] = React.useState(source.row.name)
  const [error, setError] = React.useState<string | null>(null)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{importReviewCopy.mergeTitle}</DialogTitle>
          <DialogDescription>{importReviewCopy.mergeBody}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="merge-with">{importReviewCopy.mergeWith}</FieldLabel>
          <Select value={other} onValueChange={setOther}>
            <SelectTrigger id="merge-with" aria-label={importReviewCopy.mergeWith}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {others.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.row.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="merge-name">{importReviewCopy.mergeName}</FieldLabel>
          <Input id="merge-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={onClose}>{buttons.cancel}</Button>
          <Button type="button" variant="default" size="default" disabled={!other} onClick={() => setError(onMerge(other, name))}>{importReviewCopy.mergeAction}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SplitDialog({ source, onClose, onSplit }: { source: ViewRow; onClose: () => void; onSplit: (names: string[]) => string | null }) {
  const [text, setText] = React.useState(source.row.name)
  const [error, setError] = React.useState<string | null>(null)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{importReviewCopy.splitTitle}</DialogTitle>
          <DialogDescription>{importReviewCopy.splitBody}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="split-names">{importReviewCopy.splitNames}</FieldLabel>
          <Textarea id="split-names" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={onClose}>{buttons.cancel}</Button>
          <Button type="button" variant="default" size="default" onClick={() => setError(onSplit(text.split(/\r?\n/)))}>{importReviewCopy.splitAction}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, description: string) => string | null }) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{importReviewCopy.addTitle}</DialogTitle>
          <DialogDescription>{importReviewCopy.addBody}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="add-name">{importReviewCopy.addName}</FieldLabel>
          <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="add-description">{importReviewCopy.addDescription}</FieldLabel>
          <Input id="add-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={onClose}>{buttons.cancel}</Button>
          <Button type="button" variant="default" size="default" onClick={() => setError(onAdd(name, description))}>{importReviewCopy.addAction}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
