"use client"

/**
 * Evaluator directory building blocks: the summary line, the directory table (paginated, 174 rows), the adopt or merge decision,
 * add an evaluator by name and email, and the by-site table. The adopt or merge decision goes through the reviewer decisions overlay,
 * so the held evaluations count on Approvals and the student record at once [REQ SL-09; LEDGER].
 */
import { skillNoun } from "@/lib/lab/terms"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Tip } from "@exxatdesignux/ui/components/ui/tip"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DataTablePaginated } from "@exxatdesignux/ui/components/data-table/pagination"
import { PersonIdentityCell } from "@exxatdesignux/ui/components/data-views/person-identity-cell"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { decide } from "@/components/lab/reviewer/use-reviewer"
import { approvalsHref } from "@/lib/lab/reviewer"
import { opsHref } from "@/lib/lab/dashboard"
import { EMPTY_SCOPE } from "@/lib/lab/scope"
import { mergeCandidates, pct, ROLE_LABEL, MIN_EVALUATIONS, MIN_EVENTS, type DirectorySummary, type EvaluatorRoleKey, type EvaluatorRow } from "@/lib/lab/evaluators"
import type { Person, V2State } from "@/lib/v2/types"
import { AmberMark, FilterSelect, LINK, NUM_LINK, SearchPicker, fmt, plural, type Opt } from "./parts"
import { addedEvaluatorsStore } from "./use-admin-data"
import { EmptyBlock } from "@/components/lab/empty-block"
import { EvaluatorNameBadge } from "@/components/lab/status-pill"
import { EVALUATOR_NAME_LABEL } from "@/lib/v2/labels"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { NEW_EVALUATORS_HREF } from "@/lib/lab/admin-ia"

export { initialsOf } from "@/lib/v2/format"
import { initialsOf } from "@/lib/v2/format"

const Grid = DataTablePaginated as unknown as React.ComponentType<Record<string, unknown>>

// ---------------------------------------------------------------------------------------------------------------------
// Summary line (three figures, one line; the unverified figure filters the table, and is plain text when there are none, so
// no disabled control shows)

export function DirectorySummaryLine({ summary, onAwaiting }: { summary: DirectorySummary; onAwaiting: () => void }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm" data-region="summary">
      <span data-figure><span className="font-semibold tabular-nums">{fmt(summary.evaluators)}</span> <span className="text-muted-foreground">evaluators</span></span>
      <span data-figure>
        {summary.awaiting === 0 ? (
          <span className="text-muted-foreground">No unverified names</span>
        ) : (
          <Button type="button" variant="link" size="sm" className={`h-auto p-0 text-sm font-normal ${NUM_LINK}`} onClick={onAwaiting}>
            {plural(summary.awaiting, "unverified name", "unverified names")}
          </Button>
        )}
      </span>
      <span data-figure>
        <span className="font-semibold tabular-nums">{pct(summary.verifiedShare)}</span> <span className="text-muted-foreground">of evaluations by adopted evaluators</span>
      </span>
    </p>
  )
}

/** Evaluator name status: the canonical pill ("Unverified" / "Adopted", consistency audit item 1). */
export function VerifiedBadge({ verified }: { verified: boolean }) {
  return <EvaluatorNameBadge verified={verified} />
}

/** Return or not-qualifying rate: compared only with enough evidence, amber only when well above the program average. */
export function RateCell({ row, programRate }: { row: EvaluatorRow; programRate: number }) {
  if (row.evaluations === 0) return <span className="text-sm text-muted-foreground">None yet</span>
  if (row.consistency === "too-few") return <span className="text-sm text-muted-foreground">Not compared</span>
  return row.consistency === "above" ? (
    <span className="flex items-center gap-2">
      <AmberMark label={pct(row.rate)} />
      <span className="text-xs text-muted-foreground">{`vs ${pct(programRate)}`}</span>
    </span>
  ) : (
    <span className="text-sm tabular-nums">{pct(row.rate)}</span>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Directory table (variant A, and inside a site in variant B)

/**
 * An unverified name in the Settings list (D-L24): a small "Not verified" badge that opens Approvals, New evaluators, where the
 * name is adopted or merged. The list is for lookup and edits; the decision lives in Approvals.
 */
export function NotVerifiedLink({ name }: { name: string }) {
  return (
    <Badge asChild variant="outline">
      <Link href={NEW_EVALUATORS_HREF} aria-label={`${name}: not verified. Decide in Approvals, New evaluators`} data-not-verified>
        Not verified
      </Link>
    </Badge>
  )
}

/** Without `onAdopt` (the Settings list) unverified rows link to Approvals instead of deciding in place, and there is no Decide column. */
export function directoryColumns(programRate: number, onAdopt: ((r: EvaluatorRow) => void) | undefined, opts: { showSite?: boolean } = {}): ColumnDef<EvaluatorRow>[] {
  const cols: ColumnDef<EvaluatorRow>[] = [
    {
      key: "name",
      label: "Evaluator",
      width: 210,
      sortable: true,
      cell: (r) => <PersonIdentityCell name={r.name} email={r.email} initials={initialsOf(r.name)} />,
    },
  ]
  const compact = opts.showSite === false
  if (!compact) cols.push({ key: "site", label: "Role and site", width: 190, sortable: true, cell: (r) => <span className="flex min-w-0 flex-col py-0.5"><span className="truncate">{r.roleLabel}</span><span className="truncate text-xs text-muted-foreground">{r.site}</span></span> })
  cols.push(
    !onAdopt
      ? { key: "verified", label: "Status", width: 150, cell: (r) => (r.verified ? <VerifiedBadge verified /> : <NotVerifiedLink name={r.name} />) }
      : compact
      ? { key: "verified", label: "Status", width: 160, cell: (r) => (r.verified ? <VerifiedBadge verified /> : <Button type="button" variant="outline" size="sm" onClick={() => onAdopt(r)} aria-label={`Adopt or merge ${r.name}, ${EVALUATOR_NAME_LABEL.unverified.toLowerCase()}`}>Adopt or merge</Button>) }
      : { key: "verified", label: "Status", width: 172, cell: (r) => <VerifiedBadge verified={r.verified} /> },
    {
      key: "evaluations",
      label: "Evaluations",
      width: 96,
      sortable: true,
      cell: (r) =>
        r.held > 0 ? (
          <Link className={`${LINK} text-sm tabular-nums`} href={approvalsHref(EMPTY_SCOPE)} aria-label={`${fmt(r.held)} held: evaluations by ${r.name} awaiting approval. Open Approvals`}>{`${fmt(r.held)} held`}</Link>
        ) : (
          <span className="text-sm tabular-nums">{fmt(r.evaluations)}</span>
        ),
    },
    {
      key: "rate",
      label: "Not qualifying",
      width: 156,
      sortable: true,
      header: () => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          Not qualifying
          <Tip label={`Share of evaluations that did not meet criteria or were returned. Program average ${pct(programRate)}. Compared only with ${MIN_EVALUATIONS} or more evaluations and ${MIN_EVENTS} or more that did not qualify or were returned.`}>
            <i className="fa-light fa-circle-info text-muted-foreground" aria-hidden="true" />
          </Tip>
        </span>
      ),
      cell: (r) => <RateCell row={r} programRate={programRate} />,
    },
  )
  if (!compact)
    cols.push(
    {
      key: "openRequests",
      label: "Open requests",
      width: 120,
      sortable: true,
      cell: (r) =>
        r.openRequests > 0 ? (
          <Link className={`${LINK} text-sm tabular-nums`} href={opsHref(EMPTY_SCOPE, { list: "holder", evaluator: r.id })} aria-label={`${fmt(r.openRequests)}, oldest ${r.oldestDays} d: open requests with ${r.name}, the oldest ${r.oldestDays} days. Open them`}>
            {`${fmt(r.openRequests)}`}
            <span className="font-normal text-muted-foreground">{`, oldest ${r.oldestDays} d`}</span>
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">None</span>
        ),
    },
    {
      key: "actions",
      label: "Decide",
      width: 128,
      resizable: false,
      defaultPin: "right",
      lockPin: true,
      header: () => <span className="sr-only">Decide</span>,
      cell: (r) => (!r.verified && onAdopt ? <Button type="button" variant="outline" size="sm" onClick={() => onAdopt(r)} aria-label={`Adopt or merge ${r.name}`}>Adopt or merge</Button> : null),
    },
    )
  return onAdopt ? cols : cols.filter((c) => c.key !== "actions")
}

export function DirectoryTable({ rows, programRate, onAdopt, showSite, pageSize = 25 }: { rows: EvaluatorRow[]; programRate: number; onAdopt?: (r: EvaluatorRow) => void; showSite?: boolean; pageSize?: number }) {
  const columns = React.useMemo(() => directoryColumns(programRate, onAdopt, { showSite }), [programRate, onAdopt, showSite])
  return (
    <div data-region="table">
      <Grid
        key={rows.length}
        data={rows}
        columns={columns}
        getRowId={(r: EvaluatorRow) => r.id}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        pagination={{ pageSize, pageSizeOptions: [25, 50, 100] }}
        emptyState={<EmptyBlock compact title="No evaluators match these filters" body="Clear a filter to see more." />}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Toolbar filters

export const ROLE_OPTS: Opt[] = (Object.keys(ROLE_LABEL) as EvaluatorRoleKey[]).map((k) => ({ value: k, label: ROLE_LABEL[k] }))
export const STATUS_OPTS: Opt[] = [
  { value: "awaiting", label: EVALUATOR_NAME_LABEL.unverified },
  { value: "verified", label: EVALUATOR_NAME_LABEL.verified },
  { value: "above", label: "Rate above average" },
]

export function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <FilterSelect value={value} onChange={onChange} label="Role" allLabel="All roles" options={ROLE_OPTS} className="w-40" />
}

export function SiteSelect({ value, onChange, sites }: { value: string; onChange: (v: string) => void; sites: Opt[] }) {
  return <SearchPicker value={value} onChange={onChange} label="Site" allLabel="All sites" options={sites} className="w-56" />
}

// ---------------------------------------------------------------------------------------------------------------------
// Adopt or merge

export function useAdoptDialog(state: V2State | null) {
  const [row, setRow] = React.useState<EvaluatorRow | null>(null)
  const [done, setDone] = React.useState<{ title: string; body: string } | null>(null)
  const dialog = <AdoptDialog state={state} row={row} onClose={() => setRow(null)} onDone={setDone} />
  const banner = done ? (
    <div role="status" aria-live="polite">
      <LocalBanner variant="promo" title={done.title} dismissible onDismiss={() => setDone(null)}>
        {done.body}
      </LocalBanner>
    </div>
  ) : null
  return { open: setRow, dialog, banner, setDone }
}

function AdoptDialog({ state, row, onClose, onDone }: { state: V2State | null; row: EvaluatorRow | null; onClose: () => void; onDone: (d: { title: string; body: string }) => void }) {
  const [choice, setChoice] = React.useState<string>("adopt")
  React.useEffect(() => setChoice("adopt"), [row])
  const candidates = React.useMemo(() => (state && row ? mergeCandidates(state, row.id) : []), [state, row])
  return (
    <Dialog open={!!row} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? `${row.name}: adopt or merge` : "Adopt or merge"}</DialogTitle>
          <DialogDescription>{row ? `A student named this evaluator. ${plural(row.held, "evaluation waits", "evaluations wait")} on your decision.` : ""}</DialogDescription>
        </DialogHeader>
        {row ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{`${row.email} · ${row.site}`}</p>
            <RadioGroup value={choice} onValueChange={setChoice} className="gap-2" aria-label="Decision">
              <div className="flex items-start gap-2">
                <RadioGroupItem id="adopt-new" value="adopt" className="mt-0.5" />
                <Label htmlFor="adopt-new" className="flex flex-col items-start gap-0.5 font-normal">
                  <span className="font-medium">Adopt as a new evaluator</span>
                  <span className="text-xs text-muted-foreground">{`Their evaluations count under each ${skillNoun()} rule.`}</span>
                </Label>
              </div>
              {candidates.length ? <p className="pt-2 text-xs font-medium text-muted-foreground">Or merge with someone already on the list</p> : null}
              {candidates.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <RadioGroupItem id={`merge-${c.id}`} value={c.id} className="mt-0.5" />
                  <Label htmlFor={`merge-${c.id}`} className="flex flex-col items-start gap-0.5 font-normal">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{`${c.why} · ${c.site}`}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {!candidates.length ? <p className="text-xs text-muted-foreground">No one on the list shares this surname or site.</p> : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              if (!row) return
              const merge = choice !== "adopt"
              decide({ kind: "adopt", evaluatorId: row.id, mode: merge ? "merge" : "adopt", ...(merge ? { intoId: choice } : {}) })
              const into = candidates.find((c) => c.id === choice)
              onDone({ title: merge ? `${row.name} merged into ${into?.name ?? "an evaluator"}` : `${row.name} adopted`, body: `${plural(row.held, "held evaluation now counts", "held evaluations now count")} under each ${skillNoun()} rule.` })
              onClose()
            }}
          >
            {choice === "adopt" ? "Adopt" : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Add an evaluator by name and email [REQ SL-08]

export function AddEvaluatorDialog({ open, onOpenChange, existing, onAdded, sites }: { open: boolean; onOpenChange: (o: boolean) => void; existing: EvaluatorRow[]; onAdded: (name: string) => void; sites: Opt[] }) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<EvaluatorRoleKey>("lab-instructor")
  const [site, setSite] = React.useState("")
  // Each message belongs to the field it is about, so it is announced with that field (aria-describedby) and the field is
  // marked invalid; only one field is checked at a time, so no summary banner is needed.
  const [error, setError] = React.useState<{ field: "name" | "email"; message: string } | null>(null)
  React.useEffect(() => {
    if (open) {
      setName("")
      setEmail("")
      setRole("lab-instructor")
      setSite("")
      setError(null)
    }
  }, [open])
  const submit = () => {
    const n = name.trim()
    const e = email.trim().toLowerCase()
    if (!n) return setError({ field: "name", message: "Enter a name." })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setError({ field: "email", message: "Enter an email address. Evaluation requests go to it." })
    const dup = existing.find((r) => r.email.toLowerCase() === e)
    if (dup) return setError({ field: "email", message: `${dup.name} already uses this email.` })
    const p: Person = { id: `added-${Date.now().toString(36)}`, name: n, title: ROLE_LABEL[role], kind: role, email: e, ...(site ? { homeSiteId: site } : {}) }
    addedEvaluatorsStore.set((prev) => [...prev, p])
    onAdded(n)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an evaluator</DialogTitle>
          <DialogDescription>A name and an email are enough. They need no account.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(ev) => { ev.preventDefault(); submit() }}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-name">Name</Label>
            <Input id="ev-name" value={name} onChange={(e) => { setName(e.target.value); setError(null) }} autoFocus maxLength={80} aria-invalid={error?.field === "name" ? true : undefined} aria-describedby={error?.field === "name" ? "ev-name-error" : undefined} />
            {error?.field === "name" ? <FieldError id="ev-name-error">{error.message}</FieldError> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-email">Email</Label>
            <Input id="ev-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} maxLength={120} aria-invalid={error?.field === "email" ? true : undefined} aria-describedby={error?.field === "email" ? "ev-email-error" : undefined} />
            {error?.field === "email" ? <FieldError id="ev-email-error">{error.message}</FieldError> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" id="ev-role-label">Role</span>
              <FilterSelect value={role} onChange={(v) => setRole((v || "lab-instructor") as EvaluatorRoleKey)} label="Role" options={ROLE_OPTS} className="w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Site</span>
              <SearchPicker value={site} onChange={setSite} label="Site" allLabel="No site" options={sites} className="w-full" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="default" size="sm">Add evaluator</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
