"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { ROLE_BY_ID } from "@/lib/v2/roles"
import { stepsForRole } from "@/lib/v2/scenario"
import { personName } from "@/lib/v2/selectors"
import { useV2State } from "@/lib/v2/react"
import { StudentHome } from "@/components/v2/student/student-home"
import type { RoleId } from "@/lib/v2/types"

export function RoleHome({ role }: { role: RoleId }) {
  const def = ROLE_BY_ID[role]
  const state = useV2State()
  const steps = stepsForRole(role)
  if (role === "student") return <StudentHome />
  return (
    <PageFrame title={`${def.label} home`} subtitle={`Acting as ${personName(state, def.personId)}. ${def.blurb}`}>
      <PageSection title="Your steps in the story" id="steps">
        <ul className="grid gap-3 sm:grid-cols-2">
          {steps.map((s) => (
            <li key={s.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle asChild className="text-base">
                    <h3>
                      <Link href={s.route} className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {s.n}. {s.title}
                      </Link>
                    </h3>
                  </CardTitle>
                  <CardDescription>{s.summary}</CardDescription>
                </CardHeader>
                <CardContent>{s.id in state.stepsReviewed ? <Badge variant="secondary">Reviewed</Badge> : <Badge variant="outline">Not reviewed</Badge>}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </PageSection>
    </PageFrame>
  )
}
