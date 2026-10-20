"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { ADMIN_ID, LiveStatus, useAdminRun } from "@/components/v2/admin/use-admin"
import { LEVEL_LABEL, setMapping } from "@/lib/v2/admin-actions"
import { coverageWarnings, mapBlockReason, mappingSummary } from "@/lib/v2/coverage"
import { useV2State } from "@/lib/v2/react"
import { SPECIALTY_LABEL } from "@/lib/v2/starter-libraries"
import type { MappingRow, Skill, Specialty } from "@/lib/v2/types"

type LevelValue = MappingRow["level"] | "none"
const ALL = "all"

const statusOf = (k: Skill) => (k.published ? "In use" : k.configured ? "Configured, not in use" : "Not configured")

/** Scenario step 4: map skills to the course and see where the course is not covered. */
export function MapCoursesPage() {
  const state = useV2State()
  const run = useAdminRun()
  const [library, setLibrary] = React.useState<string>("bsn-med-surg")
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState("")
  const { mapped, mandatory } = mappingSummary(state)
  const warnings = coverageWarnings(state)
  const optional = state.mappings.filter((m) => m.level === "optional").length
  const skills = state.skills.filter((k) => library === ALL || k.specialty === library)
  const levelOf = (k: Skill): LevelValue => state.mappings.find((m) => m.courseId === state.course.id && m.skillId === k.id)?.level ?? "none"
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

  return (
    <PageFrame title={`Map skills to ${state.course.code}`} subtitle={`${state.course.name}, ${state.course.term}, ${state.course.cohort}.`}>
      <LiveStatus message={status} />
      <Card>
        <CardContent>
          <dl className="grid grid-cols-3 gap-4 text-sm" aria-label="Mapping summary">
            {[
              ["Skills mapped", mapped],
              ["Mandatory", mandatory],
              ["Optional", optional],
            ].map(([label, n]) => (
              <div key={String(label)} className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-semibold tabular-nums text-foreground" data-summary={String(label).toLowerCase().replace(/\s+/g, "-")}>
                  {n}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <PageSection title={`Coverage warnings (${warnings.length})`} id="coverage" description="Gaps in how this course is covered. They do not block anything. Fix them or decide to accept them.">
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-muted-foreground">Mapping says what is expected. A student can still submit a skill that is not mapped. Skills that are not configured cannot be mapped, so configure them first.</p>
          <div className="flex flex-col gap-1">
            <Label htmlFor="map-library" className="text-sm">
              Library
            </Label>
            <Select value={library} onValueChange={setLibrary}>
              <SelectTrigger id="map-library" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All libraries</SelectItem>
                {(Object.keys(SPECIALTY_LABEL) as Specialty[]).map((sp) => (
                  <SelectItem key={sp} value={sp}>
                    {SPECIALTY_LABEL[sp]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error ? (
          <LocalBanner variant="error" title="The mapping was not saved" retry={{ label: "Save the mapping again", onClick: () => lastChange.current?.() }} dismissible onDismiss={() => setError(null)}>
            {error}
          </LocalBanner>
        ) : null}
        <V2Grid<Skill>
          caption={`Skills and their requirement level in ${state.course.code}`}
          rows={skills}
          id={(k) => k.id}
          columns={[
            v2col<Skill>("name", "Skill", 280, (k) => (
              <span className="flex flex-col">
                <span className="font-medium text-foreground">{k.name}</span>
                <span className="text-xs text-muted-foreground">{k.category}</span>
              </span>
            )),
            v2col<Skill>("library", "Library", 160, (k) => SPECIALTY_LABEL[k.specialty]),
            v2col<Skill>("status", "Status", 180, (k) => <Badge variant={k.configured ? "secondary" : "outline"}>{statusOf(k)}</Badge>),
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
