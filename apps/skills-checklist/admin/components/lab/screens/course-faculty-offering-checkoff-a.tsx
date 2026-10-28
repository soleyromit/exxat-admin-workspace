"use client"

/**
 * Course offering, Skills: group check-off, variant A (grid; PROTO `GS`, recommended). Staff signed in to Prism (faculty or a lab
 * instructor; role is a permission, D-X8) open the offering and tick skills off for the registered group in one sitting: students
 * down, the offering's mapped skills across. A skill is available only when its configuration allows group check-off (Configure,
 * "Group check-off"); the rest show greyed "Not available" with the reason. Cells already holding qualifying evidence, or with an
 * evaluation already out, are flagged and stay tickable. Record writes ordinary evaluations; skills that need approval go to
 * Approvals. At 141 mapped skills the columns are chosen with a searchable picker (default: the first six, mandatory first).
 * Contract: docs/build/contracts/V2-05d-course-checkoff.md. URL: ?offering=.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { CheckCell, Legend, NothingToCheck, RecordBar, RecordedBanner, SelfEvalNote, SessionControls, SkillHead } from "@/components/lab/checkoff/checkoff-parts"
import { shortReason } from "@/lib/lab/course-checkoff"
import { useCheckoff, type CheckoffModel } from "@/components/lab/checkoff/use-checkoff"

const DEFAULT_COLUMNS = 6

export function CourseFacultyOfferingCheckoffA() {
  const m = useCheckoff()
  if (!m.hydrated) return <PageFrame title="Group check-off"><Skeleton className="h-96 w-full" /></PageFrame>
  if (!m.offering || !m.offeringRow) {
    return (
      <PageFrame title="Group check-off">
        <p className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground">No offering is ready for a check-off. It needs students registered to it and {skillNounPlural()} mapped to it.</p>
      </PageFrame>
    )
  }
  return <Grid m={m} key={m.offering.id} />
}

function Grid({ m }: { m: CheckoffModel }) {
  const o = m.offeringRow!
  const [chosen, setChosen] = React.useState<string[] | null>(null)
  const columnIds = chosen ?? m.skills.slice(0, DEFAULT_COLUMNS).map((k) => k.skill.id)
  const columns = columnIds.map((id) => m.skills.find((k) => k.skill.id === id)).filter((k): k is NonNullable<typeof k> => !!k)
  const toggleColumn = (id: string) => setChosen(columnIds.includes(id) ? columnIds.filter((x) => x !== id) : [...columnIds, id])
  const page = m.rows.slice(0, m.shown)

  return (
    <PageFrame title={`${o.code} ${o.name}, ${o.term}`}>
      <div className="flex flex-col gap-4 pb-4" data-page-type="list" data-faculty-lab="offering-checkoff-A">
        <section data-region="summary" className="flex flex-col gap-3" aria-label="Session">
          <SessionControls m={m} />
          <SelfEvalNote shown={columns} />
        </section>
        <RecordedBanner m={m} />
        {m.eligible.length === 0 ? <NothingToCheck /> : null}
        <Card size="sm" className="gap-0 overflow-hidden py-0" data-region="grid">
          <CardContent className="flex flex-wrap items-center gap-2 border-b border-border py-2">
            <Input type="search" value={m.query} onChange={(e) => m.setQuery(e.target.value)} placeholder="Search the roster" aria-label="Search the roster" className="h-8 w-full sm:w-56" />
            <ColumnPicker m={m} columnIds={columnIds} onToggle={toggleColumn} />
            <div className="sm:ms-auto"><Legend /></div>
          </CardContent>
          <Table scrollLabel={`Students by ${skillNounPlural()}`} containerClassName="max-h-[min(62dvh,640px)] overflow-auto">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead scope="col" className="sticky left-0 z-10 min-w-48 bg-card ps-3">{`Student (${m.rows.length})`}</TableHead>
                {columns.map((k) => (
                  <TableHead key={k.skill.id} scope="col" className="min-w-40 align-bottom whitespace-normal" data-column-state={k.reason ? "unavailable" : "available"}>
                    <SkillHead k={k} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.map((p) => (
                <TableRow key={p.id}>
                  <TableHead scope="row" className="sticky left-0 z-[1] bg-card ps-3 py-1.5 font-normal">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{[p.cohort, p.group].filter(Boolean).join(" · ")}</p>
                  </TableHead>
                  {columns.map((k) => (
                    <TableCell key={k.skill.id} className="py-1.5">
                      <CheckCell m={m} studentId={p.id} studentName={p.name} k={k} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {m.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="py-8 text-center text-sm text-muted-foreground">No student matches that search. Clear it to see the whole roster.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          {m.shown < m.rows.length ? (
            <CardContent className="flex items-center justify-between gap-3 border-t border-border py-2">
              <p className="text-xs text-muted-foreground">{`Showing ${Math.min(m.shown, m.rows.length)} of ${m.rows.length} students`}</p>
              <Button type="button" variant="ghost" size="sm" onClick={m.showMore}>Show 25 more</Button>
            </CardContent>
          ) : null}
        </Card>
      </div>
      <RecordBar m={m} />
    </PageFrame>
  )
}

/** Which mapped skills are columns: searchable, grouped available first; an unavailable one shows greyed with its reason. */
function ColumnPicker({ m, columnIds, onToggle }: { m: CheckoffModel; columnIds: string[]; onToggle: (id: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">{`${capitalize(skillNounPlural())} shown (${columnIds.length})`}</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-0">
        <Command>
          <CommandInput placeholder={`Find a mapped ${skillNoun()}`} aria-label={`Find a mapped ${skillNoun()}`} />
          <CommandList className="max-h-80">
            <CommandEmpty>Nothing matches.</CommandEmpty>
            {[
              { heading: `Can be checked off (${m.eligible.length})`, list: m.eligible },
              { heading: `Not available (${m.unavailable.length})`, list: m.unavailable },
            ].map((g) =>
              g.list.length ? (
                <CommandGroup key={g.heading} heading={g.heading}>
                  {g.list.map((k) => {
                    const on = columnIds.includes(k.skill.id)
                    return (
                      <CommandItem key={k.skill.id} value={`${k.skill.name} ${k.skill.id}`} onSelect={() => onToggle(k.skill.id)} aria-selected={on}>
                        <i className={cn("fa-light", on ? "fa-square-check" : "fa-square")} aria-hidden="true" />
                        <span className="flex min-w-0 flex-col">
                          <span className={cn("truncate", k.reason && "text-muted-foreground")}>{k.skill.name}</span>
                          <span className="text-xs text-muted-foreground">{k.reason ? `${k.levelLabel} · ${shortReason(k.reason)}` : k.levelLabel}</span>
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ) : null,
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
