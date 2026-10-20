"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { requestWaitText, STATUS_LABEL, type CourseItem } from "@/lib/v2/student"
import { useV2State } from "@/lib/v2/react"
import { TOUCH, BTN } from "@/components/v2/student/use-student"

const STATUS_TONE = { achieved: "success", "in-progress": "info", "not-started": "neutral" } as const
const STATUS_ICON = { achieved: "fa-circle-check", "in-progress": "fa-hourglass-half", "not-started": "fa-circle" } as const

/** Progress dots: one per successful evaluation needed. Hidden from assistive tech because the same facts are in the text. */
export function Pips({ have, need }: { have: number; need: number }) {
  const n = Math.min(need, 10)
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1 text-xs">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i < have ? "fa-solid fa-circle text-foreground" : "fa-light fa-circle text-muted-foreground"} />
      ))}
    </span>
  )
}

/** Mobile skill card: one skill, its status in words, what is left and one primary action. Replaces a table on a phone. */
export function SkillCard({ item }: { item: CourseItem }) {
  const s = useV2State()
  const p = item.progress
  const locked = item.prereq.required && !item.prereq.met
  const firstTodo = item.prereq.items.find((i) => !i.met)
  return (
    <Card size="sm" role="article" aria-labelledby={`sk-${item.skill.id}`} data-skill-card={item.skill.id}>
        <CardHeader className="gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle asChild className="text-base">
              <h3 id={`sk-${item.skill.id}`}>{item.skill.name}</h3>
            </CardTitle>
            <StatusBadge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} icon={STATUS_ICON[item.status]} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">{item.skill.category}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Pips have={p.counted} need={p.need} />
            <span data-progress>{p.summary}</span>
          </div>
          {item.status !== "achieved" ? <p className="text-foreground">{p.left.length ? `Left: ${p.left.join(", ")}.` : p.rule}</p> : <p className="text-muted-foreground">Rule met. More evidence still counts toward your record.</p>}
          {item.status !== "achieved" ? <p className="text-xs text-muted-foreground" data-rule>{p.rule}</p> : null}
          {p.notes.map((n) => (
            <p key={n} className="text-xs text-muted-foreground">
              {n}
            </p>
          ))}
          {item.request ? (
            <p className="flex items-center gap-2 text-foreground" data-request-line>
              <i className="fa-light fa-paper-plane" aria-hidden="true" />
              <span>{requestWaitText(s, item.request)}</span>
            </p>
          ) : null}
          {item.prereq.required ? (
            <div className="flex flex-col gap-1 rounded-md bg-muted px-3 py-2" data-prereq={locked ? "locked" : "met"}>
              <p className="text-xs font-medium text-foreground">{locked ? "Clinical attempt locked" : "Before a clinical attempt: all done"}</p>
              <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {item.prereq.items.map((i) => (
                  <li key={i.id} className="flex items-start gap-1.5">
                    <i className={`mt-0.5 fa-light ${i.met ? "fa-circle-check" : "fa-circle"}`} aria-hidden="true" />
                    <span>
                      {i.label}: {i.detail}
                      <span className="sr-only">{i.met ? ", done" : ", not done"}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {locked && firstTodo?.todo ? <p className="text-xs text-foreground">{firstTodo.todo}</p> : null}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button asChild variant={item.status === "achieved" ? "outline" : locked ? "outline" : "default"} size="lg" className={`${BTN} h-auto w-full whitespace-normal py-2`}>
              <Link href={`/v2/student/pick-and-rate?skill=${item.skill.id}`}>{locked ? `Log a practice trial of ${item.skill.name}` : item.status === "achieved" ? `Log ${item.skill.name} again` : `Log ${item.skill.name}`}</Link>
            </Button>
            {item.unsent > 0 ? (
              <Badge variant="secondary">{`${item.unsent} logged, not sent`}</Badge>
            ) : null}
          </div>
        </CardContent>
    </Card>
  )
}
