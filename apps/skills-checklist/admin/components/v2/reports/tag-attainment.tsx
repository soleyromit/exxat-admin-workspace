"use client"
// DS adoption: composition of DS Sheet, Button, LocalBanner, StatusBadge with the vendored ChartCard and the v2 StackedBar and V2Grid. See docs/build/contracts/V2-reports-by-tag.md.

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { ChartCard } from "@/components/chart-card"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { StackedBar, TONE_COLOR, type StackedSegment, type VizTone } from "@/components/v2/viz"
import type { SkillAttainment, TagAttainment, TagReport } from "@/lib/v2/reports"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

const ATTAINMENT_KEY: Array<{ label: string; tone: VizTone; hatched?: boolean }> = [
  { label: "Achieved", tone: "met" },
  { label: "In progress", tone: "notYet" },
  { label: "Did not meet", tone: "notMet" },
  { label: "Not started", tone: "neutral", hatched: true },
]

/** The four-state key shared by the Skills tab and the Tags tab. */
export function AttainmentKey() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-hidden="true" data-attainment-key>
      {ATTAINMENT_KEY.map((k) => (
        <li key={k.label} className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={k.hatched ? { background: "var(--background)", border: `1px solid ${TONE_COLOR[k.tone]}`, backgroundImage: `repeating-linear-gradient(45deg, ${TONE_COLOR[k.tone]} 0 2px, transparent 2px 6px)` } : { background: TONE_COLOR[k.tone] }} />
          <span className="text-foreground">{k.label}</span>
        </li>
      ))}
    </ul>
  )
}

const segmentsOf = (r: { achieved: number; inProgress: number; attempted: number; notStarted: number }): StackedSegment[] =>
  [
    { id: "met", label: "Achieved", value: r.achieved, tone: "met" as const },
    { id: "prog", label: "In progress", value: r.inProgress, tone: "notYet" as const },
    { id: "att", label: "Did not meet", value: r.attempted, tone: "notMet" as const },
    { id: "none", label: "Not started", value: r.notStarted, tone: "neutral" as const, hatched: true },
  ].filter((x) => x.value > 0)

const recordsLine = (r: TagAttainment) => (r.records === 0 ? "No students in view" : `${r.achieved} of ${r.records} records achieved (${r.pct}%)`)

const overlapLabel = (n: number) => `${n} ${plural(n, "skill", "skills")} also in another tag`

export function TagsTab({ report, onShowSkill }: { report: TagReport; onShowSkill: (skillId: string) => void }) {
  const [asTable, setAsTable] = React.useState(false)
  const [open, setOpen] = React.useState<string | null>(null)
  const picked = report.rows.find((r) => r.tag === open)
  const trigger = React.useRef<HTMLElement | null>(null)
  const openTag = (tag: string, el: HTMLElement) => {
    trigger.current = el
    setOpen(tag)
  }

  return (
    <>
      <ChartCard title="Attainment by tag" description="Student-to-skill records achieved, in progress, did not meet and not started, for the skills that carry each tag." className="h-auto">
        {report.rows.length === 0 ? (
          <LocalBanner variant="info" title={report.missingTag ? `No skill in view carries the tag ${report.missingTag}` : "No skill in view carries a tag"} data-tags-empty>
            Tags are set on a skill when it is defined in the library.
          </LocalBanner>
        ) : (
          <div className="flex flex-col gap-3" data-tags-view>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AttainmentKey />
              <Button type="button" variant="outline" size="sm" aria-pressed={asTable} data-tags-as-table onClick={() => setAsTable((v) => !v)}>
                {asTable ? "Show as bars" : "Show as table"}
              </Button>
            </div>
            {asTable ? (
              <V2Grid<TagAttainment>
                caption="Attainment by tag, in words"
                rows={report.rows}
                id={(r) => r.tag}
                columns={[
                  v2col<TagAttainment>("tag", "Tag", 200, (r) => (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-label={`Open the skills for ${r.tag}`} onClick={(e) => openTag(r.tag, e.currentTarget)}>{r.tag}</Button>
                  )),
                  v2col<TagAttainment>("skills", "Skills", 90, (r) => String(r.skills.length)),
                  v2col<TagAttainment>("achieved", "Achieved", 110, (r) => String(r.achieved)),
                  v2col<TagAttainment>("progress", "In progress", 120, (r) => String(r.inProgress)),
                  v2col<TagAttainment>("notmet", "Did not meet", 130, (r) => String(r.attempted)),
                  v2col<TagAttainment>("none", "Not started", 120, (r) => String(r.notStarted)),
                  v2col<TagAttainment>("pct", "Records achieved", 160, (r) => (r.pct === null ? "No students in view" : `${r.pct}%`)),
                  v2col<TagAttainment>("overlap", "Also in another tag", 180, (r) => (r.shared > 0 ? `${r.shared} of ${r.skills.length} skills` : "None")),
                ]}
              />
            ) : (
              <ul className="flex flex-col" aria-label="Tags" data-tags>
                {report.rows.map((r) => (
                  <li key={r.tag} className="grid gap-2 border-b border-border py-3 last:border-b-0 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-6" data-tag-row={r.tag}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">{r.tag}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {`${r.skills.length} ${plural(r.skills.length, "skill", "skills")}`}
                        {r.shared > 0 ? <StatusBadge label={overlapLabel(r.shared)} tone="neutral" icon="fa-layer-group" size="sm" /> : null}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {r.records === 0 ? null : <StackedBar label={r.tag} segments={segmentsOf(r)} unit="record" showLegend={false} />}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="tabular-nums text-muted-foreground">{recordsLine(r)}</span>
                        <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-label={`Open the skills for ${r.tag}`} onClick={(e) => openTag(r.tag, e.currentTarget)}>See the skills</Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-muted-foreground" data-tags-note>
              {`A skill can carry several tags and is counted under each of them, so these rows overlap. Do not add them up. They count student-to-skill records, not students. ${report.distinctSkills} ${plural(report.distinctSkills, "skill", "skills")} in view, ${report.pairs} tag-skill ${plural(report.pairs, "pair", "pairs")}${report.untagged > 0 ? `, ${report.untagged} with no tag` : ""}.`}
            </p>
          </div>
        )}
      </ChartCard>

      <Sheet open={!!picked} onOpenChange={(o) => { if (!o) setOpen(null) }}>
        <SheetContent side="right" size="lg" className="flex flex-col gap-0 p-0" data-tag-sheet onCloseAutoFocus={(e) => { if (trigger.current?.isConnected) { e.preventDefault(); trigger.current.focus() } }}>
          <SheetHeader className="border-b border-border p-4 pe-12">
            <SheetTitle>{picked?.tag ?? ""}</SheetTitle>
            <SheetDescription>{picked ? `${picked.skills.length} ${plural(picked.skills.length, "skill", "skills")}, ${recordsLine(picked)}` : ""}</SheetDescription>
          </SheetHeader>
          {picked ? (
            <div className="flex flex-col gap-4 overflow-y-auto p-4">
              {picked.records > 0 ? <StackedBar label={picked.tag} segments={segmentsOf(picked)} unit="record" showLegend /> : null}
              {picked.shared > 0 ? <p className="text-sm text-muted-foreground" data-tag-overlap>{`${picked.shared} of these ${plural(picked.skills.length, "skill", "skills")} also carry another tag: ${picked.alsoTags.join(", ")}.`}</p> : null}
              <V2Grid<SkillAttainment>
                caption={`Skills tagged ${picked.tag}`}
                rows={picked.skills}
                id={(a) => a.skill.id}
                columns={[
                  v2col<SkillAttainment>("skill", "Skill", 220, (a) => (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-left" aria-label={`Show the students for ${a.skill.name}`} onClick={() => { setOpen(null); onShowSkill(a.skill.id) }}>{a.skill.name}</Button>
                  )),
                  v2col<SkillAttainment>("level", "In this course", 130, (a) => (a.level === "mandatory" ? "Mandatory" : "Optional")),
                  v2col<SkillAttainment>("other", "Other tags", 190, (a) => (a.skill.tags ?? []).filter((t) => t !== picked.tag).join(", ") || "None"),
                  v2col<SkillAttainment>("achieved", "Achieved", 100, (a) => String(a.achieved)),
                  v2col<SkillAttainment>("progress", "In progress", 110, (a) => String(a.inProgress)),
                  v2col<SkillAttainment>("notmet", "Did not meet", 120, (a) => String(a.attempted)),
                  v2col<SkillAttainment>("none", "Not started", 110, (a) => String(a.notStarted)),
                ]}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
