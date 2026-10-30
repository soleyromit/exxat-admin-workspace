"use client"

/**
 * Deactivate, retire or new list, variant A (recommended): its own page, reached from a skill (?skill=). One 32 px toolbar row
 * picks the skill; the left column asks why (mistake or new standard) and holds the one primary action; the right column
 * previews the impact before confirm. Delete sits apart at the foot, off while evidence exists, with the count as the reason.
 * Demo states: ?state=loading, error, partial (impact still calculating), empty (no skill chosen).
 */
import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { PageFrame } from "@/components/skills/page-header"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { RetireFlow } from "@/components/lab/admin-b/retire-flow"
import { useRetire } from "@/components/lab/admin-b/use-retire"
import { aNoun, capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"

export function AdminDeactivateA() {
  const r = useRetire()
  const skillId = r.demo === "empty" ? null : (r.skillParam ?? r.defaultSkill)
  const impact = skillId ? r.impactOf(skillId) : null
  const skills = React.useMemo(() => [...r.data.skills].filter((k) => !r.deleted.includes(k.id)).sort((a, b) => a.name.localeCompare(b.name)), [r.data.skills, r.deleted])

  if (!r.hydrated || r.demo === "loading") {
    return (
      <PageFrame title={`Deactivate or replace ${aNoun()}`} actions={<SampleDataBadge />}>
        <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
          <Skeleton aria-hidden="true" className="h-8 w-80" />
          <div className="grid gap-8 lg:grid-cols-12">
            <Skeleton aria-hidden="true" className="h-64 lg:col-span-7" />
            <Skeleton aria-hidden="true" className="h-48 lg:col-span-5" />
          </div>
        </div>
      </PageFrame>
    )
  }
  const deleted = skillId ? r.deleted.includes(skillId) : false

  return (
    <PageFrame title={`Deactivate or replace ${aNoun()}`} actions={<SampleDataBadge />}>
      <div className="flex flex-col gap-5" data-retire-lab="A" data-page-type="form">
        <div className="flex flex-wrap items-center gap-3">
          {/* The shell breadcrumb carries the path; a body breadcrumb said it twice (anatomy A3). */}
          <Select value={skillId ?? undefined} onValueChange={(v) => r.setSkill(v)}>
            <SelectTrigger size="sm" className="h-8 w-80 gap-1.5 text-sm" aria-label={capitalize(skillNoun())}>
              <span className="text-muted-foreground" aria-hidden="true">{capitalize(skillNoun())}</span>
              <SelectValue placeholder={`Choose ${aNoun()}`} />
            </SelectTrigger>
            <SelectContent align="end" className="max-h-80">
              {skills.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {r.demo === "error" ? (
          <LocalBanner variant="error" title="The impact could not be calculated" retry={{ label: "Try again", onClick: () => r.setSkill(skillId) }}>Nothing was changed.</LocalBanner>
        ) : deleted ? (
          <LocalBanner variant="success" title="Deleted">{`${impact?.name ?? capitalize(skillNoun())} is removed from the library.`}</LocalBanner>
        ) : !impact ? (
          <LocalBanner variant="info" title={`Choose ${aNoun()}`}>{`Pick the ${skillNoun()} to change from the list above, or open it from the ${skillNounPlural()} library.`}</LocalBanner>
        ) : (
          <RetireFlow
            impact={impact}
            cohorts={r.cohorts}
            existingLists={r.lists.map((l) => l.name)}
            layout="page"
            partial={r.demo === "partial"}
            inactive={r.isInactive(impact.skillId)}
            onDeactivate={() => r.deactivate(impact.skillId)}
            onReactivate={() => r.reactivate(impact.skillId)}
            onNewList={r.addList}
            onDelete={() => r.remove(impact.skillId)}
          />
        )}
      </div>
    </PageFrame>
  )
}
