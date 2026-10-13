"use client"

/**
 * Dev-only page: the OD-03 display flag toggle, the acting student for the student shell, and a reset to the seed.
 * Everything in the demo database is SAMPLE data (SL-01: Prism ships no skills). Not a product surface.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { PageFrame, PageSection, SkillStatusBadgeView } from "@/components/skills"
import type { SkillStatusDisplay } from "@/lib/domain/types"
import { HOME_SCENARIOS, scenarioDb, type HomeScenario } from "@/lib/home/scenarios"
import { ok } from "@/lib/store"
import { ROUTES } from "@/lib/skills-routes"
import type { SkillState } from "@/lib/engine"
import { useActions, useDb, usePrefs } from "@/lib/store/react"

const STATES: SkillState[] = ["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"]

export function DevState() {
  const db = useDb()
  const prefs = usePrefs()
  const { reset, run, setPrefs } = useActions()
  const [scenario, setScenario] = React.useState<HomeScenario | null>(null)
  const [resetDone, setResetDone] = React.useState(false)
  const counts = [
    ["Skills", db.skills.length],
    ["Students", db.students.length],
    ["Course offerings", db.offerings.length],
    ["Submissions", db.submissions.length],
    ["Evaluations", db.evaluations.length],
  ] as const

  return (
    <PageFrame title="Sample data and display settings" subtitle="For development and demos only. Every record here is sample data, and Prism ships no skills of its own.">
      <PageSection id="display" title="Skill status display" description="One setting, read by every status badge and table. Both renderings stay available while the decision on reporting no evidence and evidence that does not qualify is open.">
        <RadioGroup value={prefs.skillStatusDisplay} onValueChange={(v) => setPrefs({ skillStatusDisplay: v as SkillStatusDisplay })} aria-label="Skill status display" className="gap-3">
          <div className="flex min-h-11 items-center gap-2">
            <RadioGroupItem id="display-four" value="four" />
            <Label htmlFor="display-four">Four states</Label>
          </div>
          <div className="flex min-h-11 items-center gap-2">
            <RadioGroupItem id="display-merged" value="merged" />
            <Label htmlFor="display-merged">Merged: no evidence yet and evidence does not qualify both show as Not met</Label>
          </div>
        </RadioGroup>
        <div className="flex flex-wrap gap-2" aria-label="Preview">
          {STATES.map((s) => (
            <SkillStatusBadgeView key={s} state={s} display={prefs.skillStatusDisplay} />
          ))}
        </div>
      </PageSection>

      <PageSection id="student" title="Acting student" description="The student shell shows this student's record.">
        <div className="max-w-sm">
          <Label htmlFor="acting-student" className="mb-1 block text-sm">
            Student
          </Label>
          <Select value={prefs.currentStudentId ?? undefined} onValueChange={(v) => setPrefs({ currentStudentId: v })}>
            <SelectTrigger id="acting-student" className="w-full">
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent position="popper">
              {db.students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}, {db.cohorts.find((c) => c.id === s.cohortId)?.name}, {db.groups.find((g) => g.id === s.groupId)?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageSection>

      <PageSection id="home-scenario" title="Home scenario" description="Loads a sample program so each state of Home can be reviewed. Replaces the sample data in this browser; Reset sample data restores it.">
        <RadioGroup value={scenario ?? ""} onValueChange={(v) => { const k = v as HomeScenario; setScenario(k); run((cur) => ok({ ...scenarioDb(k), seq: cur.seq }, undefined)) }} aria-label="Home scenario" className="gap-3">
          {HOME_SCENARIOS.map((h) => (
            <div key={h.id} className="flex min-h-11 items-start gap-2">
              <RadioGroupItem id={`home-scenario-${h.id}`} value={h.id} className="mt-1" />
              <Label htmlFor={`home-scenario-${h.id}`} className="flex flex-col items-start gap-0.5 font-normal">
                <span className="font-medium">{h.label}</span>
                <span className="text-muted-foreground">{h.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="default"><a href={ROUTES.home}>Open Home</a></Button>
          <Button asChild variant="outline" size="default"><a href={`${ROUTES.home}?preview=loading`}>Home loading state</a></Button>
          <Button asChild variant="outline" size="default"><a href={`${ROUTES.home}?preview=error`}>Home error state</a></Button>
        </div>
      </PageSection>

      <PageSection id="data" title="Sample data" description="Stored in this browser only. Resetting returns every record to the original sample.">
        <dl className="grid max-w-md grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {counts.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-foreground">{v}</dd>
            </React.Fragment>
          ))}
        </dl>
        <div>
          <Button size="default"
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              setResetDone(true)
            }}
          >
            Reset sample data
          </Button>
        </div>
        {resetDone ? <LocalBanner variant="success" dismissible onDismiss={() => setResetDone(false)}>Sample data was reset.</LocalBanner> : null}
      </PageSection>
    </PageFrame>
  )
}
