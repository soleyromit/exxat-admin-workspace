"use client"

import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { cn } from "@exxatdesignux/ui/lib/utils"
import type { LabSkillRow, RosterRow } from "@/lib/lab/evaluator"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { StickyBar } from "@/components/lab/evaluator/frame"
import type { LabGridModel } from "@/components/lab/evaluator/use-lab-grid"

/** Who, what and where, and the lab label said once. */
export function LabHeader({ g }: { g: LabGridModel }) {
  return (
    <div data-region="summary" className="flex flex-col gap-1.5">
      {/* The session is the title: course and date, no subtitle (Romit 2026-10-30, D-L8b). The instructor is the viewer. */}
      <PageHeader title={`${g.course} lab, ${g.date}`} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" />
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
      <Input type="search" value={g.query} onChange={(e) => g.setQuery(e.target.value)} placeholder="Search students" aria-label="Search students" className="h-8 min-w-0 flex-1 sm:w-56 sm:flex-none" />
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

/**
 * Feedback for one result (EV-06), disclosed per row so the grid keeps one answer control per cell: a small button opens a
 * text box. Shown only once a result is recorded (feedback belongs to a result). Required skills say so in the box; after a
 * failed save a missing one is marked on its own button and named in the save bar.
 */
export function LabFeedback({ g, row, skill, variant = "icon" }: { g: LabGridModel; row: RosterRow; skill: LabSkillRow; variant?: "icon" | "text" }) {
  const text = g.feedbackFor(row.id, skill.id)
  const missing = g.isMissing(row.id, skill.id)
  const id = `lab-fb-${row.id}-${skill.id}`
  const name = `Feedback for ${row.name}, ${skill.name}${skill.feedbackRequired ? ", required" : ""}${text ? ", written" : ""}`
  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === "icon" ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={name} aria-invalid={missing || undefined} data-lab-feedback={text ? "written" : missing ? "missing" : "empty"} className={cn("shrink-0 max-sm:size-(--control-height-touch)", missing ? "text-destructive" : !text && "text-muted-foreground")}>
            <i className={cn(text ? "fa-solid" : "fa-light", missing ? "fa-circle-exclamation" : "fa-comment")} aria-hidden="true" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" aria-label={name} aria-invalid={missing || undefined} data-lab-feedback={text ? "written" : missing ? "missing" : "empty"} className={cn("max-sm:min-h-(--control-height-touch)", missing && "border-destructive text-destructive")}>
            {text ? "Edit feedback" : "Feedback"}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-2 p-3">
        <Label htmlFor={id} className="text-sm font-medium">
          {`Feedback for ${row.name}`} <span className="font-normal text-muted-foreground">{skill.feedbackRequired ? "(required)" : "(optional)"}</span>
        </Label>
        <p className="text-xs text-muted-foreground">{skill.name}</p>
        <Textarea id={id} rows={3} value={text} onChange={(e) => g.setFeedback(row.id, skill.id, e.target.value)} aria-invalid={missing || undefined} className="min-h-20" />
      </PopoverContent>
    </Popover>
  )
}

/** "Feedback required" said once per skill, where the skill is named (column head or the roll-call skill line). */
export function FeedbackRequiredCue({ skill }: { skill: LabSkillRow }) {
  if (!skill.feedbackRequired) return null
  return <span className="text-xs font-normal text-muted-foreground" data-feedback-required>Feedback required</span>
}

/** The count, said once, and the one primary action. A blocked save names what is missing (EV-06) in the same line. */
export function LabSaveBar({ g }: { g: LabGridModel }) {
  return (
    <StickyBar width="wide">
      <p className={cn("min-w-0 flex-1 text-sm tabular-nums", g.blocker ? "text-destructive" : "text-muted-foreground")} aria-live="polite" data-lab-save-status>
        {g.blocker ?? `${g.tally.done} of ${g.cohortCount - g.tally.absent} students done${g.tally.absent ? ` · ${g.tally.absent} absent` : ""}`}
      </p>
      <Button type="button" variant="default" size="lg" className="min-h-(--control-height-touch)" onClick={() => g.save()}>Save session</Button>
    </StickyBar>
  )
}

export function LabSaved({ g }: { g: LabGridModel }) {
  if (!g.saved) return null
  return (
    <LocalBanner variant="success" title="Session saved">
      {`${g.saved.results} results recorded${g.saved.withFeedback ? `, ${g.saved.withFeedback} with feedback` : ""}. ${g.saved.counts} Saved sessions are not edited.`}
    </LocalBanner>
  )
}
