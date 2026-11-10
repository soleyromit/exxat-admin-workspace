"use client"

import { LoadingBlocks } from "@/components/v2/shared-loading"
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import type { ActiveFilter } from "@exxatdesignux/ui/lib/table-properties-types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { ChartCard } from "@/components/chart-card"
import { StackedBar } from "@/components/v2/viz"
import { filterValue, setFilter, V2FilterBar, v2SelectField } from "@/components/v2/v2-filter-bar"
import { StatusPill } from "@/components/v2/status-pill"
import { skillPillValue } from "@/lib/v2/status-pill"
import { contextLine } from "@/lib/v2/page-context"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { ADMIN_ID, LiveStatus, useAdminRun } from "@/components/v2/admin/use-admin"
import { LEVEL_LABEL, setMapping } from "@/lib/v2/admin-actions"
import { coverageWarnings, mapBlockReason } from "@/lib/v2/coverage"
import { courseCoverage } from "@/lib/v2/home"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { SPECIALTY_LABEL } from "@/lib/v2/starter-libraries"
import type { MappingRow, Skill, Specialty } from "@/lib/v2/types"

type LevelValue = MappingRow["level"] | "none"

/** map skills to the course and see where the course is not covered. */
export function MapCoursesPage() {
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const run = useAdminRun()
  const [filters, setFilters] = React.useState<ActiveFilter[]>(() => setFilter([], "library", "bsn-med-surg"))
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState("")
  const coverage = courseCoverage(state)
  const warnings = coverageWarnings(state)
  const levelOf = (k: Skill): LevelValue => state.mappings.find((m) => m.courseId === state.course.id && m.skillId === k.id)?.level ?? "none"
  const fields = [
    v2SelectField("library", "Library", (Object.keys(SPECIALTY_LABEL) as Specialty[]).map((sp) => ({ value: sp, label: SPECIALTY_LABEL[sp] })), "fa-book"),
    v2SelectField("level", "Requirement level", [
      { value: "mandatory", label: "Mandatory" },
      { value: "optional", label: "Optional" },
      { value: "not-expected", label: "Not expected" },
      { value: "none", label: "Not mapped" },
    ], "fa-list-check"),
  ]
  const skills = state.skills.filter((k) => {
    const lib = filterValue(filters, "library")
    const lvl = filterValue(filters, "level")
    return (!lib || k.specialty === lib) && (!lvl || levelOf(k) === lvl)
  })
  const warnedIds = new Set(warnings.map((w) => w.skillId).filter(Boolean))

  const lastChange = React.useRef<(() => void) | null>(null)
  const change = (k: Skill, value: LevelValue) => {
    lastChange.current = () => change(k, value)
    setError(null)
    const r = run((s, at) => setMapping(s, k.id, value === "none" ? null : value, ADMIN_ID, at))
    if (!r.ok) {
      setError(r.error)
      return
    }
    setStatus(value === "none" ? `Removed ${k.name} from ${state.course.code}.` : `Mapped ${k.name} as ${LEVEL_LABEL[value].toLowerCase()}.`)
  }

  if (!hydrated) return <PageFrame title="Courses"><LoadingBlocks label="Opening courses" rows={5} /></PageFrame>
  return (
    <PageFrame title="Courses" subtitle={contextLine(state)}>
      <LiveStatus message={status} />
      <ChartCard title={`Coverage of ${state.course.code}`} description="What the course expects from the library." className="h-auto">
        <StackedBar
          label={`Library skills in ${state.course.code}`}
          unit="skill"
          segments={[
            { id: "mandatory", label: "Mandatory", value: coverage.mandatory, tone: "magnitude" },
            { id: "other", label: "Optional or not expected", value: coverage.other, tone: "series2" },
            { id: "unmapped", label: "Not mapped", value: coverage.unmapped, tone: "muted" },
            { id: "blocked", label: "Not configured", value: coverage.blocked, tone: "neutral", hatched: true },
          ]}
        />
      </ChartCard>

      <PageSection title={`Coverage warnings (${warnings.length})`} id="coverage" description="Warnings do not block students.">
        {warnings.length === 0 ? (
          <LocalBanner variant="success" title="No coverage gaps found">
            {`Every mandatory skill in ${state.course.code} is in use, can be completed in the course's settings and has a qualified evaluator.`}
          </LocalBanner>
        ) : (
          <LocalBanner variant="warning" title={`${warnings.length} ${warnings.length === 1 ? "warning" : "warnings"} for ${state.course.code}`}>
            <ul className="mt-1 flex flex-col gap-2" aria-label="Coverage warnings">
              {warnings.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{w.message}</span>
                  {w.skillId ? (
                    <Button asChild variant="link" size="sm" className="h-auto p-0">
                      <Link href={`/v2/admin/configure-skill?skill=${w.skillId}`}>Open the skill</Link>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </LocalBanner>
        )}
      </PageSection>

      <PageSection title="Skills" id="skills">
        <V2FilterBar fields={fields} filters={filters} onChange={setFilters} resultCount={skills.length} resultNoun="skills" emptyMessage="No skills match these filters." />
        {error ? (
          <LocalBanner variant="error" title="The mapping was not saved" retry={{ label: "Save the mapping again", onClick: () => lastChange.current?.() }} dismissible onDismiss={() => setError(null)}>
            {error}
          </LocalBanner>
        ) : null}
        <V2Grid<Skill>
          selectable={false}
          caption={`Skills and their requirement level in ${state.course.code}`}
          rows={skills}
          emptyText="No skills in this library yet. Choose another library or add skills first."
          id={(k) => k.id}
          columns={[
            v2col<Skill>("name", "Skill", 280, (k) => (
              <span className="flex flex-col">
                <span className="font-medium text-foreground">{k.name}</span>
                <span className="text-xs text-muted-foreground">{k.category}</span>
              </span>
            )),
            v2col<Skill>("library", "Library", 160, (k) => SPECIALTY_LABEL[k.specialty]),
            v2col<Skill>("status", "Status", 210, (k) => <StatusPill kind="skill" value={skillPillValue(k)} />),
            v2col<Skill>("level", `In ${state.course.code}`, 200, (k) => {
              const blocked = mapBlockReason(k)
              return (
                <Select value={levelOf(k)} disabled={!!blocked && levelOf(k) === "none"} onValueChange={(v) => change(k, v as LevelValue)}>
                  <SelectTrigger aria-label={`Requirement for ${k.name}`} aria-describedby={blocked ? `why-${k.id}` : undefined} className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandatory">Mandatory</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                    <SelectItem value="not-expected">Not expected</SelectItem>
                    <SelectItem value="none">Not mapped</SelectItem>
                  </SelectContent>
                </Select>
              )
            }),
            v2col<Skill>("note", "Note", 330, (k) => {
              const blocked = mapBlockReason(k)
              if (blocked) {
                return (
                  <span id={`why-${k.id}`} className="flex flex-col items-start gap-1 text-sm text-muted-foreground">
                    <span>Not configured, so it cannot be mapped.</span>
                    <Button asChild variant="link" size="sm" className="h-auto p-0">
                      <Link href={`/v2/admin/configure-skill?skill=${k.id}`} aria-label={`Configure ${k.name}`}>
                        Configure this skill
                      </Link>
                    </Button>
                  </span>
                )
              }
              return warnedIds.has(k.id) ? <span className="text-sm text-muted-foreground">See the coverage warnings above.</span> : <span className="text-sm text-muted-foreground">No gaps found.</span>
            }),
          ]}
        />
      </PageSection>
    </PageFrame>
  )
}
