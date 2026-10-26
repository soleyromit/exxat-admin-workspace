"use client"

/** Copy a configuration from another skill, or apply this one to several skills at once [REQ IM-14]. */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { bulkImpact, copySources, fromV2, ruleSentence, type LabRule } from "@/lib/lab/configure"
import { pillSpec, skillPillValue } from "@/lib/v2/status-pill"
import type { V2State } from "@/lib/v2/types"

/** "Copy from another skill" (title overflow): search the configured skills, pick one, its configuration replaces the draft. */
export function CopyFromDialog({ open, onOpenChange, state, skillId, onCopy }: { open: boolean; onOpenChange: (o: boolean) => void; state: V2State; skillId: string; onCopy: (rule: LabRule, name: string) => void }) {
  const sources = React.useMemo(() => copySources(state, skillId), [state, skillId])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Copy from another skill</DialogTitle>
          <DialogDescription>{`Its configuration replaces this draft. ${sources.length} configured skills.`}</DialogDescription>
        </DialogHeader>
        <Command className="border-t border-border">
          <CommandInput placeholder="Search configured skills" />
          <CommandList className="max-h-80">
            <CommandEmpty>No configured skill matches.</CommandEmpty>
            <CommandGroup>
              {sources.map((k) => (
                <CommandItem
                  key={k.id}
                  value={`${k.name} ${k.category}`}
                  onSelect={() => {
                    onCopy(fromV2(k), k.name)
                    onOpenChange(false)
                  }}
                >
                  <span className="min-w-0 flex-1 truncate">{k.name}</span>
                  <span className="text-xs text-muted-foreground">{k.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function BulkApplySheet({ open, onOpenChange, state, skillId, rule, onApplied }: { open: boolean; onOpenChange: (o: boolean) => void; state: V2State; skillId: string; rule: LabRule; onApplied: (summary: { skills: number; inUse: number; students: number }) => void }) {
  const [q, setQ] = React.useState("")
  const [picked, setPicked] = React.useState<string[]>([])
  React.useEffect(() => { if (open) { setQ(""); setPicked([]) } }, [open])
  const all = React.useMemo(() => state.skills.filter((k) => k.id !== skillId).sort((a, b) => Number(!!a.config) - Number(!!b.config) || a.name.localeCompare(b.name)), [state, skillId])
  const shown = q.trim() ? all.filter((k) => `${k.name} ${k.category}`.toLowerCase().includes(q.trim().toLowerCase())) : all
  const rows = React.useMemo(() => bulkImpact(state, picked, rule), [state, picked, rule])
  const inUse = rows.filter((r) => r.published)
  const students = inUse.reduce((n, r) => n + r.changed, 0)
  const unconfigured = all.filter((k) => !k.config).length
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Apply to other skills</SheetTitle>
          <SheetDescription>{ruleSentence(rule)}</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
          <Input type="search" aria-label="Search skills" placeholder="Search skills" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{`${unconfigured} not configured, listed first.`}</span>
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setPicked(all.filter((k) => !k.config).map((k) => k.id))}>Select all not configured</Button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border" aria-label="Skills">
            {shown.map((k) => {
              const spec = pillSpec("skill", skillPillValue(k))
              const id = `cfg-bulk-${k.id}`
              return (
                <li key={k.id} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                  <Checkbox id={id} checked={picked.includes(k.id)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, k.id] : p.filter((x) => x !== k.id)))} />
                  <Label htmlFor={id} className="min-w-0 flex-1 font-normal">
                    <span className="block truncate">{k.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{k.category}</span>
                  </Label>
                  <StatusBadge label={spec.label} tone={spec.tone} icon={spec.icon} size="sm" />
                </li>
              )
            })}
            {shown.length === 0 ? <li className="p-3 text-sm text-muted-foreground">{`No skills match "${q}".`}</li> : null}
          </ul>
          {inUse.length ? (
            <Table containerClassName="max-h-48 overflow-y-auto rounded-md border border-border" scrollLabel="Skills in use that change">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">In use</TableHead>
                  <TableHead scope="col" className="text-end">Students who change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inUse.map((r) => (
                  <TableRow key={r.skillId}>
                    <TableCell className="whitespace-normal">{r.name}</TableCell>
                    <TableCell className="text-end tabular-nums">{r.changed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </div>
        <SheetFooter className="flex-row flex-wrap items-center justify-end gap-2">
          <p className="me-auto text-sm text-muted-foreground">{picked.length ? `${picked.length} selected${inUse.length ? `, ${students} students change status` : ""}` : "Nothing selected"}</p>
          <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={picked.length === 0}
            onClick={() => {
              onApplied({ skills: picked.length, inUse: inUse.length, students })
              onOpenChange(false)
            }}
          >
            {picked.length ? `Apply to ${picked.length} ${picked.length === 1 ? "skill" : "skills"}` : "Apply"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
