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
import { isConfigured } from "@/lib/v2/population"
import { STATUS_META } from "@/lib/lab/library"
import type { V2State } from "@/lib/v2/types"
import { capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"

/** "Copy from another skill" (title overflow): search the configured skills, pick one, its configuration replaces the draft. */
export function CopyFromDialog({ open, onOpenChange, state, skillId, onCopy }: { open: boolean; onOpenChange: (o: boolean) => void; state: V2State; skillId: string; onCopy: (rule: LabRule, name: string) => void }) {
  const sources = React.useMemo(() => copySources(state, skillId), [state, skillId])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{`Copy from another ${skillNoun()}`}</DialogTitle>
          <DialogDescription>{`Its configuration replaces this draft. ${sources.length} configured ${skillNounPlural()}.`}</DialogDescription>
        </DialogHeader>
        <Command className="border-t border-border">
          <CommandInput placeholder={`Search configured ${skillNounPlural()}`} />
          <CommandList className="max-h-80">
            <CommandEmpty>{`No configured ${skillNoun()} matches.`}</CommandEmpty>
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

/**
 * "Apply to other skills": the rule is saved to each skill picked (decision D-X31: each becomes Configured, with its own rule
 * version). `onApplied` receives the ids so the caller writes them; Apply is disabled while the rule has problems.
 */
export function BulkApplySheet({ open, onOpenChange, state, skillId, rule, blocked = false, onApplied }: { open: boolean; onOpenChange: (o: boolean) => void; state: V2State; skillId: string; rule: LabRule; /** The rule still has problems, so it cannot be saved anywhere. */ blocked?: boolean; onApplied: (summary: { ids: string[]; skills: number; configured: number; students: number }) => void }) {
  const [q, setQ] = React.useState("")
  const [picked, setPicked] = React.useState<string[]>([])
  React.useEffect(() => { if (open) { setQ(""); setPicked([]) } }, [open])
  const all = React.useMemo(() => state.skills.filter((k) => k.id !== skillId).sort((a, b) => Number(isConfigured(a)) - Number(isConfigured(b)) || a.name.localeCompare(b.name)), [state, skillId])
  const shown = q.trim() ? all.filter((k) => `${k.name} ${k.category}`.toLowerCase().includes(q.trim().toLowerCase())) : all
  const rows = React.useMemo(() => bulkImpact(state, picked, rule), [state, picked, rule])
  const inUse = rows.filter((r) => r.configured)
  const students = inUse.reduce((n, r) => n + r.changed, 0)
  const unconfigured = all.filter((k) => !isConfigured(k)).length
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{`Apply to other ${skillNounPlural()}`}</SheetTitle>
          <SheetDescription>{ruleSentence(rule)}</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
          <Input type="search" aria-label={`Search ${skillNounPlural()}`} placeholder={`Search ${skillNounPlural()}`} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{`${unconfigured} not configured, listed first.`}</span>
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setPicked(all.filter((k) => !isConfigured(k)).map((k) => k.id))}>Select all not configured</Button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border" aria-label={capitalize(skillNounPlural())}>
            {shown.map((k) => {
              const spec = STATUS_META[isConfigured(k) ? "configured" : "not-configured"]
              const id = `cfg-bulk-${k.id}`
              return (
                <li key={k.id} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                  <Checkbox id={id} checked={picked.includes(k.id)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, k.id] : p.filter((x) => x !== k.id)))} />
                  <Label htmlFor={id} className="min-w-0 flex-1 font-normal">
                    <span className="block truncate">{k.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{k.category}</span>
                  </Label>
                  <StatusBadge label={spec.short} tone={spec.tone === "warning" ? "warning" : "neutral"} icon={spec.icon} size="sm" />
                </li>
              )
            })}
            {shown.length === 0 ? <li className="p-3 text-sm text-muted-foreground">{`No ${skillNounPlural()} match "${q}".`}</li> : null}
          </ul>
          {inUse.length ? (
            <Table containerClassName="max-h-48 overflow-y-auto rounded-md border border-border" scrollLabel={`Configured ${skillNounPlural()} that change`}>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Already configured</TableHead>
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
            disabled={picked.length === 0 || blocked}
            onClick={() => {
              onApplied({ ids: picked, skills: picked.length, configured: inUse.length, students })
              onOpenChange(false)
            }}
          >
            {picked.length ? `Apply to ${countSkills(picked.length)}` : "Apply"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
