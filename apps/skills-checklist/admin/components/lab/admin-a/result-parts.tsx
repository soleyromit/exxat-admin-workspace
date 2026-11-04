"use client"

/**
 * The setup chain and its end state (Proposed 2026-11-02; lib/lab/setup-result.ts). Romit: "The group of skills flow doesn't
 * feel connected to course mapping, like I don't know what the end state looks like considering I have selected student groups".
 *
 * - SetupChain: one line on Groups of skills, Assign and Course mapping that carries what was set up forward (group of skills, the
 *   student group, how many of its skills a course expects) and links to the result. Nothing starts fresh.
 * - GroupDetail: one student group's skills, where each is expected (course, term, Mandatory or Recommended) and what has no course
 *   yet, amber with glyph and word.
 */
import * as React from "react"
import Link from "next/link"
import { StatusBadge } from "@exxatdesignux/ui"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { buildLibrary, countLibrary } from "@/lib/lab/library"
import { programSettingsOf } from "@/lib/lab/program-settings"
import { studentGroups } from "@/lib/lab/lists"
import { setupRecap, setupResult, type GroupResult, type RecapRow, type SetupResult } from "@/lib/lab/setup-result"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { useTerms } from "@/components/lab/library/use-terms"
import { TYPE } from "@/components/lab/type-scale"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { EmptyBlock } from "@/components/lab/empty-block"
import { customGroupsStore, useLists, useMappingOverlay } from "./use-admin-data"

export const RESULT_SCREEN = "admin/setup-result"
/** The summary's one name: its page title, its walkthrough step and the course mapping link to it. */
export const RESULT_LABEL = "Setup summary"

export function useSetupResult(): { ready: boolean; result: SetupResult; recap: RecapRow[] } {
  useTerms()
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const { lists } = useLists(hydrated ? state : null)
  const [overlay] = useMappingOverlay()
  const custom = customGroupsStore.use()
  return React.useMemo(() => {
    const rows = buildLibrary(state)
    const live = rows.filter((r) => r.status !== "inactive")
    const result = setupResult(state, lists, overlay, studentGroups(state, custom), live.map((r) => r.id))
    const counts = countLibrary(rows)
    const recap = setupRecap({
      library: { total: counts.total, notConfigured: counts.notConfigured, inactive: counts.inactive },
      categories: new Set(live.map((r) => r.category).filter(Boolean)).size,
      tags: new Set(live.flatMap((r) => r.tags ?? [])).size,
      settingsAt: programSettingsOf(state)?.at ?? null,
      lists,
      result,
    })
    return { ready: hydrated, result, recap }
  }, [state, lists, overlay, custom, hydrated])
}

/** The student group a page is about: `?group=` or the cohort in scope, else the first with skills that have no course yet. */
export function pickGroup(r: SetupResult, params: { get(k: string): string | null } | null | undefined): GroupResult | undefined {
  const asked = params?.get("sg") ?? (params?.get("cohort") ? `coh:${params.get("cohort")}` : null)
  return r.groups.find((g) => g.group.id === asked) ?? r.groups.find((g) => g.unplaced > 0) ?? r.groups[0]
}

/** "No course yet": amber, glyph and word. */
export function NoCourseBadge({ n }: { n?: number }) {
  return <StatusBadge label={n === undefined ? "No course yet" : `${n.toLocaleString("en-US")} no course yet`} tone="warning" icon="fa-triangle-exclamation" size="sm" surface="table" />
}

type Show = "unplaced" | "placed" | "all"
type SkillRow = GroupResult["skills"][number] & Record<string, unknown>

/** One student group: the chain as three facts, the summary sentence, then each skill and where it is expected. */
export function GroupDetail({ g }: { g: GroupResult }) {
  const to = useLabHref()
  const [show, setShow] = React.useState<Show>(g.unplaced ? "unplaced" : "all")
  const rows = show === "all" ? g.skills : g.skills.filter((k) => (show === "placed" ? k.courses.length > 0 : k.courses.length === 0))
  const columns: ColumnDef<SkillRow>[] = [
    {
      key: "name",
      label: capitalize(skillNoun()),
      width: 360,
      cell: (k) => (
        <span className="flex min-w-0 flex-col whitespace-normal" data-result-skill={k.skillId}>
          {k.courses.length ? <span>{k.name}</span> : <Link href={to("admin/course-mapping", { by: "skill", skill: k.skillId })} className={LINK_IN_TABLE}>{k.name}</Link>}
          <span className={TYPE.meta}>{[k.required ? "Required to graduate" : "", g.lists.length > 1 ? k.from.join(", ") : ""].filter(Boolean).join(" · ") || null}</span>
        </span>
      ),
    },
    {
      key: "courses",
      label: "Expected in",
      width: 360,
      cell: (k) =>
        k.courses.length ? (
          <ul className="flex flex-col gap-0.5 whitespace-normal">
            {k.courses.slice(0, 4).map((c) => (
              <li key={c.offeringId} className={TYPE.body}>{`${c.code}, ${c.term}: `}<span className="font-medium">{c.level === "mandatory" ? "Mandatory" : "Recommended"}</span></li>
            ))}
            {k.courses.length > 4 ? <li className={TYPE.meta}>{`and ${k.courses.length - 4} more`}</li> : null}
          </ul>
        ) : (
          <span className={TYPE.helper}>None yet</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      width: 176,
      cell: (k) => (k.courses.length ? <StatusBadge label="In a course" tone="neutral" icon="fa-circle-check" size="sm" surface="table" /> : <NoCourseBadge />),
    },
  ]
  return (
    <section aria-labelledby="group-detail-h" className="flex flex-col gap-4" data-group-detail={g.group.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="group-detail-h" className={TYPE.section}>{g.group.label}</h2>
      </div>
      <Tabs value={show} onValueChange={(v) => setShow(v === "placed" || v === "all" ? v : "unplaced")}>
        <TabsList variant="line" ariaLabel={`${capitalize(skillNounPlural())} by course`}>
          <TabsTrigger value="unplaced">No course yet<TabsCountBadge count={g.unplaced} /></TabsTrigger>
          <TabsTrigger value="placed">In a course<TabsCountBadge count={g.placed} /></TabsTrigger>
          <TabsTrigger value="all">All<TabsCountBadge count={g.skills.length} /></TabsTrigger>
        </TabsList>
        <TabsContent value={show} className="mt-3 flex flex-col gap-3">
          <div role="region" aria-label={`${capitalize(skillNounPlural())} for ${g.group.label}`}>
            <DataTable<SkillRow>
              data={rows as SkillRow[]}
              columns={columns}
              getRowId={(k) => k.skillId}
              selectable={false}
              searchable={false}
              showQueryControls={false}
              edgeInset={false}
              lazyLoading={{ enabled: true, threshold: 80, chunkSize: 40, loadingLabel: "Loading more" }}
              emptyState={<EmptyBlock compact title={show === "unplaced" ? `Every ${skillNoun()} for this group is expected in a course` : `No ${skillNounPlural()} here yet`} />}
            />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
