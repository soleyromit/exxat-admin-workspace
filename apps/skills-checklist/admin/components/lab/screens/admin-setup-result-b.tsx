"use client"

/**
 * Setup summary, variant B (Proposed 2026-11-02): the chain drawn per student group. Each group is one row of three linked steps,
 * left to right in the order the admin set them up: groups of skills, the student group, the courses that expect them, ending in
 * what is left (amber). Tests whether seeing the chain beats a table for "what does my setup add up to". A group opens the same
 * detail as A.
 *
 * Regions: header, summary, chains (or one group's detail). URL: ?group= · ?state=loading.
 */
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { PageFrame } from "@/components/skills/page-header"
import { capitalize, countSkills, skillNounPlural } from "@/lib/lab/terms"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { TYPE } from "@/components/lab/type-scale"
import { LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"
import { GroupDetail, NoCourseBadge, RESULT_SCREEN, useSetupResult } from "@/components/lab/admin-a/result-parts"
import { RESULT_TITLE } from "./admin-setup-result-a"

function Step({ label, children, href }: { label: string; children: React.ReactNode; href?: string }) {
  return (
    <Card size="sm" className="min-w-0 flex-1">
      <CardContent className="flex flex-col gap-1">
        <span className={TYPE.meta}>{label}</span>
        <div className={TYPE.body}>{href ? <Link href={href} className={LINK_IN_TABLE}>{children}</Link> : children}</div>
      </CardContent>
    </Card>
  )
}

const Arrow = () => <i className="fa-light fa-arrow-right hidden shrink-0 self-center text-muted-foreground md:block" aria-hidden="true" />

export function AdminSetupResultB() {
  const { ready, result } = useSetupResult()
  const params = useSearchParams()
  const to = useLabHref()
  const loading = !ready || params?.get("state") === "loading"
  const groupId = params?.get("sg")
  const chosen = groupId ? result.groups.find((g) => g.group.id === groupId) : undefined
  return (
    <PageFrame title={RESULT_TITLE}>
      {loading ? (
        <Skeleton className="h-80 w-full" aria-label="Loading" />
      ) : chosen ? (
        <GroupDetail g={chosen} />
      ) : (
        <div className="flex flex-col gap-4" data-setup-result>
          <h2 className={TYPE.section}>By student group</h2>
          <ol className="flex flex-col gap-3">
            {result.groups.map((g) => (
              <li key={g.group.id} className="flex flex-col gap-2 md:flex-row md:items-stretch" data-result-group={g.group.id}>
                <Step label={`Groups of ${skillNounPlural()}`} href={to("admin/lists-cohorts")}>{g.lists.join(", ")}</Step>
                <Arrow />
                <Step label="Student group" href={to(RESULT_SCREEN, { sg: g.group.id })}>{g.group.label}</Step>
                <Arrow />
                <Step label="In a course">{`${g.placed.toLocaleString("en-US")} of ${g.skills.length.toLocaleString("en-US")}`}</Step>
                <Arrow />
                <Card size="sm" className="min-w-0 flex-1">
                  <CardContent className="flex flex-col gap-1">
                    <span className={TYPE.meta}>Left to do</span>
                    {g.unplaced ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <NoCourseBadge n={g.unplaced} />
                      </span>
                    ) : (
                      <span className={TYPE.body}>Nothing</span>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
          {result.unassigned.length ? (
            <p className={TYPE.body}>
              {`${capitalize(countSkills(result.unassigned.length))} not assigned to any student group. `}
              <Link href={to("admin/lists-cohorts", { view: "assign" })} className={LINK}>Assign them</Link>
            </p>
          ) : null}
        </div>
      )}
    </PageFrame>
  )
}
