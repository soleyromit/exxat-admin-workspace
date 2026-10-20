"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Block, StudentPage } from "@/components/v2/student/student-frame"
import { SkillCard } from "@/components/v2/student/skill-card"
import { TOUCH, BTN } from "@/components/v2/student/use-student"
import { useV2State } from "@/lib/v2/react"
import { courseWork, STUDENT_ID } from "@/lib/v2/student"
import { plansOf, PLAN_STATUS_LABEL } from "@/lib/v2/outcomes"

/** Student role home: what is left in the course, per-skill progress against the published rule, and the best next action. */
export function StudentHome() {
  const s = useV2State()
  const w = courseWork(s)
  const [open, setOpen] = React.useState(false)
  const sum = w.summary
  const left = sum.mandatory - sum.achieved
  return (
    <StudentPage title={`What's left in ${s.course.code}`} subtitle={`${s.course.name}, ${s.course.term}. Evidence from any course counts toward your record.`}>
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

      <Card size="sm">
        <CardContent>
          <dl className="grid grid-cols-3 gap-3 text-sm" aria-label="Mandatory skills summary">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Mandatory left</dt>
              <dd className="text-2xl font-semibold tabular-nums" data-summary="left">
                {left}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Achieved</dt>
              <dd className="text-2xl font-semibold tabular-nums" data-summary="achieved">
                {`${sum.achieved} of ${sum.mandatory}`}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Waiting</dt>
              <dd className="text-2xl font-semibold tabular-nums" data-summary="waiting">
                {sum.waiting}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {w.notOpen.length > 0 ? (
        <LocalBanner variant="info" title={`${w.notOpen.length} ${w.notOpen.length === 1 ? "skill is" : "skills are"} not open yet`} data-not-open>
          <ul className="mt-1 flex flex-col gap-1">
            {w.notOpen.map((n) => (
              <li key={n.skill.id}>{`${n.skill.name} (${n.level}). ${n.reason}`}</li>
            ))}
          </ul>
        </LocalBanner>
      ) : null}

      <Block id="mandatory" title={`Mandatory (${w.mandatory.length})`} description="What NURS 350 expects of every student.">
        {w.mandatory.length === 0 ? <p className="text-sm text-muted-foreground">{`${s.course.code} has no mandatory skills open to you yet.`}</p> : null}
        <ul className="flex flex-col gap-3">
          {w.mandatory.map((i) => (
            <li key={i.skill.id}>
              <SkillCard item={i} />
            </li>
          ))}
        </ul>
      </Block>

      <Block id="optional" title={`Optional (${w.optional.length})`} description="Not required. More evidence still counts toward your record.">
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
