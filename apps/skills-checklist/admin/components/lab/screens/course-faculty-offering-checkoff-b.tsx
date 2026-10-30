"use client"

/**
 * Course offering, Skills: group check-off, variant B (one skill at a time). Same session, availability rules, cells, record bar
 * and confirmation as A (components/lab/checkoff/*); the mental model is the paper sign-off sheet: pick one skill from the
 * offering's available skills (searchable, with how many are ticked), then tick the students who showed it, with the flag said in
 * words on each row; a student who already qualifies shows that status in place of a checkbox (D-L8d). Ticks on several skills are kept and recorded together. Unavailable skills are listed behind the same
 * "Why N cannot" disclosure. Contract: docs/build/contracts/V2-05d-course-checkoff.md. URL: ?offering=.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { FLAG_WORD, cellKey, shortReason } from "@/lib/lab/course-checkoff"
import { aNoun, skillNounPlural } from "@/lib/lab/terms"
import { CheckCell, NothingToCheck, RecordBar, RecordedBanner, SelfEvalNote, SessionControls, SkillHead } from "@/components/lab/checkoff/checkoff-parts"
import { useCheckoff, type CheckoffModel } from "@/components/lab/checkoff/use-checkoff"

export function CourseFacultyOfferingCheckoffB() {
  const m = useCheckoff()
  if (!m.hydrated) return <PageFrame title="Group check-off"><Skeleton className="h-96 w-full" /></PageFrame>
  if (!m.offering || !m.offeringRow) {
    return (
      <PageFrame title="Group check-off">
        <p className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground">No offering is ready for a check-off. It needs students registered to it and {skillNounPlural()} mapped to it.</p>
      </PageFrame>
    )
  }
  return <Sheet m={m} key={m.offering.id} />
}

function Sheet({ m }: { m: CheckoffModel }) {
  const o = m.offeringRow!
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const active = m.eligible.find((k) => k.skill.id === activeId) ?? m.eligible[0] ?? null
  const page = m.rows.slice(0, m.shown)
  const tickedOn = (skillId: string) => Object.keys(m.ticked).filter((k) => k.endsWith(`|${skillId}`)).length

  return (
    <PageFrame title={`${o.code} ${o.name}, ${o.term}`}>
      <div className="flex flex-col gap-4 pb-4" data-page-type="list" data-faculty-lab="offering-checkoff-B">
        <section data-region="summary" className="flex flex-col gap-3" aria-label="Session">
          <SessionControls m={m} />
          <SelfEvalNote shown={active ? [active] : []} />
        </section>
        <RecordedBanner m={m} />
        {!active ? (
          <NothingToCheck />
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]" data-region="sheet">
            {/* The offering's available skills: pick one, the sheet on the right is its sign-off list. */}
            <Card size="sm" className="gap-0 overflow-hidden py-0">
              <Command className="rounded-none" value={active.skill.id}>
                <CommandInput placeholder={`Find ${aNoun()}`} aria-label={`Find ${aNoun()} to check off`} />
                <CommandList className="max-h-[min(56dvh,560px)]">
                  <CommandEmpty>Nothing matches.</CommandEmpty>
                  <CommandGroup heading={`Can be checked off (${m.eligible.length})`}>
                    {m.eligible.map((k) => {
                      const c = tickedOn(k.skill.id)
                      const on = k.skill.id === active.skill.id
                      return (
                        <CommandItem key={k.skill.id} value={`${k.skill.name} ${k.skill.id}`} onSelect={() => setActiveId(k.skill.id)} aria-selected={on} aria-current={on ? "true" : undefined} data-sheet-skill={k.skill.id} className={cn(on && "bg-accent")}>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate">{k.skill.name}</span>
                            <span className="text-xs text-muted-foreground">{k.levelLabel}</span>
                          </span>
                          {c ? <span className="text-xs tabular-nums text-muted-foreground">{`${c} ticked`}</span> : null}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  {/* Mapped skills that cannot be checked off, with the reason, so nothing the old summary said is lost. */}
                  {m.unavailable.length ? (
                    <CommandGroup heading={`Not available (${m.unavailable.length})`}>
                      {m.unavailable.map((k) => (
                        <CommandItem key={k.skill.id} value={`${k.skill.name} ${k.skill.id}`} disabled data-sheet-unavailable={k.skill.id}>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-muted-foreground">{k.skill.name}</span>
                            <span className="text-xs text-muted-foreground">{`${k.levelLabel} · ${shortReason(k.reason ?? "")}`}</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : null}
                </CommandList>
              </Command>
            </Card>

            <Card size="sm" className="min-w-0 gap-0 overflow-hidden py-0">
              <CardContent className="flex flex-col gap-2 border-b border-border py-2">
                <SkillHead k={active} />
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="search" value={m.query} onChange={(e) => m.setQuery(e.target.value)} placeholder="Search the roster" aria-label="Search the roster" className="h-8 w-full sm:w-56" />
                </div>
              </CardContent>
              <Table scrollLabel={`Students for ${active.skill.name}`} containerClassName="max-h-[min(56dvh,560px)] overflow-auto">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead scope="col" className="w-40 ps-3">Check-off</TableHead>
                    <TableHead scope="col">{`Student (${m.rows.length})`}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.map((p) => {
                    const f = m.flags(p.id, active.skill.id)
                    // "Already qualifies" is the cell itself (no checkbox, D-L8d). The waiting flag, in words, joins the row's own
                    // line, so there is no mostly-empty column (review 2026-10-30 CP-3).
                    const word = m.recorded[cellKey(p.id, active.skill.id)] || f.hasEvidence ? "" : f.awaiting ? FLAG_WORD.awaiting : ""
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="ps-3 py-1.5"><CheckCell m={m} studentId={p.id} studentName={p.name} k={active} /></TableCell>
                        <TableCell className="py-1.5">
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{[p.cohort, p.group, word].filter(Boolean).join(" · ")}</p>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {m.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">No student matches that search. Clear it to see the whole roster.</TableCell>
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
        )}
      </div>
      <RecordBar m={m} />
    </PageFrame>
  )
}
