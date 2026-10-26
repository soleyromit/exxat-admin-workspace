"use client"

/**
 * Director Dashboard, variant C: verification worklist. The landing is the list itself: status tabs with counts (Ready, Changed
 * since verified, Blocked, All), then one DataTable row per student with what stops the record. Bulk "Open for verification"
 * works only on like rows. This page is also where every figure on A and B lands: ?list= and ?skill= narrow the rows (a removable
 * chip names the narrowing), and the count shown equals the figure that linked here.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { DirectorPage } from "@/components/lab/director/frame"
import { WorklistTable } from "@/components/lab/director/worklist"
import { LIST_LABEL, STATUS_LABEL, filterRows, isListKey, isStatus, type ReadinessRow, type VerifyStatus } from "@/lib/lab/director"

const TABS: Array<VerifyStatus | "all"> = ["ready", "changed", "blocked", "all"]
const rank = { changed: 0, ready: 1, blocked: 2, verified: 3 } as const

export function DirectorDashboardC() {
  return (
    <DirectorPage title="Dashboard" variant="C" pageType="list" courseInFilters announce={(m) => `${m.readyToVerify} records ready to verify`}>
      {({ model: m, scope, param, setParams, demo }) => {
        const listRaw = param("list")
        const list = isListKey(listRaw) ? listRaw : null
        const skill = param("skill")
        const skillIds = (skill ?? "").split(",").filter((id) => m.required.some((k) => k.id === id))
        const skillName = skillIds.length ? `${m.required.find((k) => k.id === skillIds[0])!.name}${skillIds.length > 1 ? ` and ${skillIds.length - 1} more` : ""}` : null
        const statusRaw = param("status")
        const narrowed = filterRows(m.rows, { list, skill: skillName ? skill : null })
        const counts = Object.fromEntries(TABS.map((t) => [t, t === "all" ? narrowed.length : narrowed.filter((r) => r.status === t).length])) as Record<string, number>
        // Default tab: Ready when it has rows, else the first non-empty tab; a figure link that narrows the list opens All.
        const fallback = list || skillName ? "all" : TABS.find((t) => counts[t] > 0) ?? "all"
        const tab = statusRaw === "all" || isStatus(statusRaw) ? statusRaw : fallback
        const rows: ReadinessRow[] = (tab === "all" ? narrowed : narrowed.filter((r) => r.status === tab)).slice().sort((a, b) => rank[a.status] - rank[b.status] || b.gaps.length - a.gaps.length || a.name.localeCompare(b.name))
        const skillState = list === "has" || list === "progress" || list === "notmet"
        const chip = skillState && skillName ? `${LIST_LABEL[list!]}: ${skillName}` : [list ? LIST_LABEL[list] : null, skillName ? `Not achieved: ${skillName}` : null].filter(Boolean).join(", ") || null
        return (
          <div className="flex flex-col gap-3">
            {chip ? (
              <div className="flex flex-wrap items-center gap-2 text-sm" data-region="narrowed">
                <span className="text-muted-foreground">{`Showing ${narrowed.length} of ${m.rows.length}`}</span>
                <Button type="button" variant="secondary" size="sm" aria-label={`Remove ${chip}`} onClick={() => setParams({ list: null, skill: null, status: null })}>
                  {chip}
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                </Button>
              </div>
            ) : null}
            <Tabs value={tab} onValueChange={(v) => setParams({ status: v })}>
              <TabsList ariaLabel="Verification status" data-region="tabs">
                {TABS.map((t) => (
                  <TabsTrigger key={t} value={t} className="gap-1.5">
                    {t === "all" ? "All" : STATUS_LABEL[t]}
                    <TabsCountBadge count={counts[t]} />
                  </TabsTrigger>
                ))}
              </TabsList>
              {/* The active panel, so the selected trigger's aria-controls resolves (axe aria-valid-attr-value). */}
              <TabsContent key={tab} value={tab} className="mt-1">
                {demo === "error" ? (
                  <LocalBanner variant="warning" title="The worklist could not load" retry={{ label: "Try again", onClick: () => setParams({ state: null }) }}>
                    The scope and counts above are current.
                  </LocalBanner>
                ) : (
                  <div data-region="table">
                    <WorklistTable key={`${tab}-${list}-${skill}`} rows={rows} scope={scope} selectable empty={tab === "ready" ? "Nothing is ready to verify in this scope." : "No records with this status in this scope."} />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )
      }}
    </DirectorPage>
  )
}
