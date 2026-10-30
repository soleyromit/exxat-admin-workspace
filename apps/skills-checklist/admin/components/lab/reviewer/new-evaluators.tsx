"use client"

/**
 * Admin Approvals, "New evaluators" tab (Romit 2026-10-27, "sure"). The evaluator names students typed through "Someone not listed",
 * one row each: the name and email, who added it and for which request, and how many sign-offs wait on it. Two decisions per row,
 * Confirm (adopt as a new evaluator) and Merge with... (pick an existing evaluator in a DS dialog with search), each with an
 * optional reviewer note kept with the released evaluations. Both are the existing reviewer `adopt` decision, so the Approvals
 * queue, the dashboard tile and the evaluator directory change together. Where evaluator records live stays OD-05 (undecided).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"
import { TYPE } from "@/components/lab/type-scale"
import { decide } from "@/components/lab/reviewer/use-reviewer"
import { mergeCandidates } from "@/lib/lab/evaluators"
import { mergeTargets, type NewEvaluatorRow } from "@/lib/lab/new-evaluators"
import { recordHref } from "@/lib/lab/reviewer"
import type { LabScope } from "@/lib/lab/scope"
import { skillNoun } from "@/lib/lab/terms"
import { initialsOf, plural } from "@/lib/v2/format"
import type { V2State } from "@/lib/v2/types"

export const NEW_EVALUATORS_LEAD = "Students added these names. Confirm or merge them so their sign-offs can be trusted."

type Open = { row: NewEvaluatorRow; mode: "confirm" | "merge" } | null

export function NewEvaluatorsPanel({ state, rows, scope }: { state: V2State; rows: NewEvaluatorRow[]; scope: LabScope }) {
  const [open, setOpen] = React.useState<Open>(null)
  const [done, setDone] = React.useState<{ title: string; body: string } | null>(null)
  const columns = React.useMemo<ColumnDef<NewEvaluatorRow>[]>(
    () => [
      {
        key: "name",
        label: "Evaluator name",
        width: 260,
        sortable: true,
        cell: (r) => (
          <PersonIdentityCell
            name={r.name}
            initials={initialsOf(r.name)}
            renderName={(n) => (
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{n}</span>
                <span className={`truncate ${TYPE.meta}`}>{r.email}</span>
              </span>
            )}
          />
        ),
      },
      {
        key: "addedBy",
        label: "Added by",
        width: 280,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            {r.addedById ? <Link className={`${LINK} whitespace-normal`} href={recordHref(scope, r.addedById)}>{r.addedBy}</Link> : <span className="truncate">{r.addedBy}</span>}
            <span className={`truncate ${TYPE.meta}`} title={r.request}>{r.request ? `For ${r.request}` : "No request on record"}</span>
          </span>
        ),
      },
      {
        key: "waiting",
        label: "Sign-offs waiting",
        width: 150,
        sortable: true,
        cell: (r) => <span className="text-sm tabular-nums">{r.waiting}</span>,
      },
      {
        key: "actions",
        label: "Decide",
        width: 220,
        resizable: false,
        defaultPin: "right",
        lockPin: true,
        header: () => <span className="sr-only">Decide</span>,
        cell: (r) => (
          <span className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen({ row: r, mode: "confirm" })} aria-label={`Confirm ${r.name} as a new evaluator`}>Confirm</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen({ row: r, mode: "merge" })} aria-label={`Merge ${r.name} with an existing evaluator`}>Merge with…</Button>
          </span>
        ),
      },
    ],
    [scope],
  )
  return (
    <div className="flex flex-col gap-4" data-new-evaluators>
      {done ? (
        <div role="status" aria-live="polite" data-region="banner">
          <LocalBanner variant="promo" title={done.title} dismissible onDismiss={() => setDone(null)}>{done.body}</LocalBanner>
        </div>
      ) : null}
      <div data-region="table">
        <DataTable<NewEvaluatorRow>
          data={rows}
          columns={columns}
          getRowId={(r) => r.id}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          emptyState={<EmptyBlock compact title="Every evaluator name is confirmed" />}
        />
      </div>
      <DecideDialog state={state} open={open} onClose={() => setOpen(null)} onDone={setDone} />
    </div>
  )
}

function DecideDialog({ state, open, onClose, onDone }: { state: V2State; open: Open; onClose: () => void; onDone: (d: { title: string; body: string }) => void }) {
  const [into, setInto] = React.useState("")
  const [note, setNote] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    setInto("")
    setNote("")
    setError(null)
  }, [open])
  const row = open?.row ?? null
  const merge = open?.mode === "merge"
  const targets = React.useMemo(() => (row && merge ? mergeTargets(state, mergeCandidates(state, row.id).map((c) => c.id)) : []), [state, row, merge])
  const chosen = targets.find((t) => t.id === into)
  const released = row ? plural(row.waiting, "sign-off now counts", "sign-offs now count") : ""
  const submit = () => {
    if (!row) return
    if (merge && !chosen) return setError("Choose the evaluator this name belongs to.")
    decide({ kind: "adopt", evaluatorId: row.id, mode: merge ? "merge" : "adopt", ...(merge && chosen ? { intoId: chosen.id } : {}), ...(note.trim() ? { note: note.trim() } : {}) })
    onDone(merge && chosen ? { title: `${row.name} merged into ${chosen.name}`, body: `${released} under each ${skillNoun()} rule.` } : { title: `${row.name} confirmed`, body: `${released} under each ${skillNoun()} rule.` })
    onClose()
  }
  return (
    <Dialog open={!!open} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? (merge ? `Merge ${row.name} with…` : `Confirm ${row.name}`) : ""}</DialogTitle>
          <DialogDescription>
            {row ? (merge ? `${row.name}'s sign-offs move to the evaluator you choose and count under each ${skillNoun()} rule.` : `${row.name} joins your evaluators. ${released} under each ${skillNoun()} rule.`) : ""}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
          {row ? <p className={TYPE.helper}>{`${row.email} · ${row.site} · added by ${row.addedBy}`}</p> : null}
          {merge ? (
            <div className="flex flex-col gap-1.5">
              <Label id="merge-into-label" className={TYPE.group}>Existing evaluator</Label>
              <Command className="rounded-md border border-border" aria-labelledby="merge-into-label">
                <CommandInput placeholder="Search by name, email or site" />
                <CommandList className="max-h-56">
                  <CommandEmpty>No evaluator matches.</CommandEmpty>
                  <CommandGroup>
                    {targets.map((t) => (
                      <CommandItem key={t.id} value={`${t.name} ${t.email} ${t.site} ${t.id}`} onSelect={() => { setInto(t.id); setError(null) }} data-merge-target={t.id}>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{t.name}</span>
                          <span className={`truncate ${TYPE.meta}`}>{t.suggested ? `Suggested · ${t.site}` : t.site}</span>
                        </span>
                        {t.id === into ? <i className="fa-light fa-check ms-auto" aria-hidden="true" /> : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              {chosen ? <p className={TYPE.meta}>{`Merging into ${chosen.name}`}</p> : null}
              {error ? <p className="text-xs text-foreground" role="alert"><i className="fa-solid fa-triangle-exclamation me-1" style={{ color: "var(--lab-viz-behind-ink)" }} aria-hidden="true" />{error}</p> : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-eval-note" className={TYPE.group}>Reviewer note, kept with the sign-offs</Label>
            <Textarea id="new-eval-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">{merge ? "Merge" : "Confirm"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
