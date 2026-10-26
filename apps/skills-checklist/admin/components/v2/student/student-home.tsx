"use client"

import { LoadingBlocks } from "@/components/v2/shared-loading"
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Block, StudentPage } from "@/components/v2/student/student-frame"
import { SkillCard } from "@/components/v2/student/skill-card"
import { BTN } from "@/components/v2/student/use-student"
import { contextLine } from "@/lib/v2/page-context"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { courseWork, STUDENT_ID } from "@/lib/v2/student"
import { mandatoryWaffle } from "@/lib/v2/student-viz"
import { Waffle } from "@/components/v2/viz"
import { ChartCard } from "@/components/chart-card"
import { plansOf, PLAN_STATUS_LABEL } from "@/lib/v2/outcomes"

/** Student role home: what is left in the course, per-skill progress against the published rule, and the best next action. */
export function StudentHome() {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const w = courseWork(s)
  const [open, setOpen] = React.useState(false)
  if (!hydrated) return <StudentPage title="Your course"><LoadingBlocks label="Opening your course" rows={4} /></StudentPage>
  const sum = w.summary
  const wf = mandatoryWaffle(s)
  const skillRuns = (sq: { label: string }[]) => {
    const runs: number[] = []
    let last = ""
    for (const q of sq) {
      const key = q.label.replace(/, evaluation \d+$/, "")
      if (key === last) runs[runs.length - 1] += 1
      else { runs.push(1); last = key }
    }
    return runs
  }
  return (
    <StudentPage title={`What's left in ${s.course.code}`} subtitle={contextLine(s)}>
      <Card data-next-action={w.next.kind}>
        <CardHeader>
          <CardDescription>Do this next</CardDescription>
          <CardTitle asChild className="text-lg">
            <h2>{w.next.title}</h2>
          </CardTitle>
          <CardDescription>{w.next.reason}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="default" size="lg" className={`${BTN} w-full`}>
            <Link href={w.next.href}>{w.next.label}</Link>
          </Button>
        </CardContent>
      </Card>

      {plansOf(s, STUDENT_ID).filter((r) => r.status !== "closed").map((r) => (
        <Card size="sm" key={r.id} data-plan-card={r.id}>
          <CardHeader>
            <CardDescription>Remediation plan</CardDescription>
            <CardTitle asChild className="text-base">
              <h2>{s.skills.find((k) => k.id === r.skillId)?.name ?? "Skill"}</h2>
            </CardTitle>
            <CardDescription>{`${PLAN_STATUS_LABEL[r.status]}. ${r.steps.filter((x) => x.done).length} of ${r.steps.length} steps done.`}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="lg" className={`${BTN} w-full`}>
              <Link href={`/v2/student/remediation/${r.id}`}>See your plan</Link>
            </Button>
          </CardContent>
        </Card>
      ))}

      <div data-mandatory-progress>
        <ChartCard title="Mandatory skills" description="What is counted, waiting and left." className="h-auto">
          <Waffle
            unit="evaluation"
            size={20}
            squares={wf.squares}
            groups={skillRuns(wf.squares)}
            countLabel={`${wf.line} ${wf.waiting > 0 ? `${wf.waiting} waiting for review. ` : ""}${sum.achieved} of ${sum.mandatory} ${sum.mandatory === 1 ? "skill" : "skills"} achieved.`}
          />
        </ChartCard>
      </div>

      {w.notOpen.length > 0 ? (
        <LocalBanner variant="info" title={`${w.notOpen.length} ${w.notOpen.length === 1 ? "skill is" : "skills are"} not open yet`} data-not-open>
          <ul className="mt-1 flex flex-col gap-1">
            {w.notOpen.map((n) => (
              <li key={n.skill.id}>{`${n.skill.name} (${n.level}). ${n.reason}`}</li>
            ))}
          </ul>
        </LocalBanner>
      ) : null}

      <Block id="mandatory" title={`Mandatory (${w.mandatory.length})`}>
        {w.mandatory.length === 0 ? <p className="text-sm text-muted-foreground">{`${s.course.code} has no mandatory skills open to you yet.`}</p> : null}
        <ul className="flex flex-col gap-3">
          {w.mandatory.map((i) => (
            <li key={i.skill.id}>
              <SkillCard item={i} />
            </li>
          ))}
        </ul>
      </Block>

      <Block id="optional" title={`Optional (${w.optional.length})`}>
        {w.optional.length === 0 ? <p className="text-sm text-muted-foreground" data-optional-empty>{`${s.course.code} has no optional skills for you yet.`}</p> : null}
        <ul className="flex flex-col gap-3">
          {w.optional.map((i) => (
            <li key={i.skill.id}>
              <SkillCard item={i} />
            </li>
          ))}
        </ul>
      </Block>

      {w.notExpected.length > 0 ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" size="lg" className={`${BTN} w-full justify-between`} aria-expanded={open}>
              {`Not expected for ${s.course.code} (${w.notExpected.length})`}
              <i className={`fa-light fa-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className="flex flex-col gap-3">
              {w.notExpected.map((i) => (
                <li key={i.skill.id}>
                  <SkillCard item={i} />
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </StudentPage>
  )
}
