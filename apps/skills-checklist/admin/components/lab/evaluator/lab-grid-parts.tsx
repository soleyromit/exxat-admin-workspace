"use client"

import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { StickyBar } from "@/components/lab/evaluator/frame"
import type { LabGridModel } from "@/components/lab/evaluator/use-lab-grid"

/** Who, what and where, and the lab label said once. */
export function LabHeader({ g }: { g: LabGridModel }) {
  return (
    <div data-region="summary" className="flex flex-col gap-1.5">
      <PageHeader title="Skills lab" subtitle={`${g.course} · ${g.date} · ${g.instructor}`} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">Lab evidence</Badge>
        Never counts toward a clinical setting.
      </p>
    </div>
  )
}

/** Search, group and skills for the session. Compact controls: these are not answer choices. */
export function LabToolbar({ g, showSkills = true }: { g: LabGridModel; showSkills?: boolean }) {
  return (
    <div data-region="toolbar" className="flex flex-wrap items-center gap-2">
      <Input type="search" value={g.query} onChange={(e) => g.setQuery(e.target.value)} placeholder="Search students" aria-label="Search students" className="h-8 w-full sm:w-56" />
      <Select value={g.group || "all"} onValueChange={(v) => g.setGroup(v === "all" ? "" : v)}>
        <SelectTrigger size="sm" className="w-[calc(50%-0.25rem)] sm:w-52" aria-label="Group">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All groups</SelectItem>
          {g.groups.map((x) => <SelectItem key={x.value} value={x.value}>{`${x.label} (${x.count})`}</SelectItem>)}
        </SelectContent>
      </Select>
      {showSkills ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-[calc(50%-0.25rem)] sm:w-auto">{`${capitalize(skillNounPlural())} (${g.skillIds.length})`}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{`${capitalize(skillNounPlural())} in this session`}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {g.skills.map((k) => (
              <DropdownMenuCheckboxItem key={k.id} checked={g.skillIds.includes(k.id)} disabled={!!k.blocked} onCheckedChange={(c) => g.toggleSkill(k.id, !!c)} onSelect={(e) => e.preventDefault()}>
                <span className="flex flex-col">
                  <span>{k.name}</span>
                  {k.blocked ? <span className="text-xs text-muted-foreground">{k.blocked}</span> : null}
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

/** The count, said once, and the one primary action. */
export function LabSaveBar({ g }: { g: LabGridModel }) {
  const [tried, setTried] = React.useState(false)
  return (
    <StickyBar width="wide">
      <p className="min-w-0 flex-1 text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {tried && g.tally.results === 0 ? "Record at least one result to save." : `${g.tally.done} of ${g.cohortCount - g.tally.absent} students done${g.tally.absent ? ` · ${g.tally.absent} absent` : ""}`}
      </p>
      <Button type="button" variant="default" size="lg" className="min-h-(--control-height-touch)" onClick={() => setTried(!g.save())}>Save session</Button>
    </StickyBar>
  )
}

export function LabSaved({ g }: { g: LabGridModel }) {
  if (!g.saved) return null
  return (
    <LocalBanner variant="success" title="Session saved">
      {`${g.saved.results} results recorded. Saved sessions are not edited.`}
    </LocalBanner>
  )
}
