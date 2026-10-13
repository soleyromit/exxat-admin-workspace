"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageFrame } from "@/components/skills"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { LibraryDialogHost } from "@/components/configure"
import { r1 } from "@/lib/copy/r1-library"
import { useDb } from "@/lib/store/react"
import { LIBRARY_PATH } from "./dialog-bridge"
import { PLACEHOLDERS } from "@/lib/skills-routes"
import { PlaceholderBody } from "@/components/placeholder-page"
import { LabTab } from "./lab-tab"
import { SettingsTab } from "./settings-tab"
import { SkillsTab } from "./skills-tab"
import { TaxonTab } from "./taxon-tab"

export const LIBRARY_TABS = ["skills", "kits", "categories", "tags", "settings", "labInstructors"] as const
export type LibraryTab = (typeof LIBRARY_TABS)[number]

/** URL value for each tab. `skills` is the default and carries no `tab` key. */
export const TAB_PARAM: Record<LibraryTab, string> = { skills: "skills", kits: "kits", categories: "categories", tags: "tags", settings: "settings", labInstructors: "lab-instructors" }
export const libraryTabHref = (tab: LibraryTab) => (tab === "skills" ? LIBRARY_PATH : `${LIBRARY_PATH}?tab=${TAB_PARAM[tab]}`)

export function parseTab(raw: string | null | undefined): LibraryTab {
  return (LIBRARY_TABS.find((t) => TAB_PARAM[t] === raw) ?? "skills") as LibraryTab
}

const ICON: Record<LibraryTab, string> = {
  skills: "fa-list-check",
  kits: "fa-layer-group",
  categories: "fa-folder",
  tags: "fa-tag",
  settings: "fa-location-dot",
  labInstructors: "fa-user-group",
}

/**
 * Skills (P-04, P-05): ONE page and ONE left-nav row. Page header, six tabs with a leading icon (counts in the label except Kits,
 * which is not built yet: HY-02 placeholder), then the active tab's content. The tab lives in `?tab=` so a tab is linkable; the old
 * /skills/<tab> routes redirect here (lib/redirects.ts).
 */
export function LibraryPage() {
  const router = useRouter()
  const params = useSearchParams()
  const db = useDb()
  const tab = parseTab(params?.get("tab"))
  const counts: Record<Exclude<LibraryTab, "kits">, number> = {
    skills: db.skills.length,
    categories: db.categories.length,
    tags: db.tags.length,
    settings: db.clinicalSettings.length,
    labInstructors: db.labInstructors.length,
  }

  return (
    <PageFrame title={r1.title} subtitle={r1.subtitle}>
      <Tabs value={tab} onValueChange={(v) => router.push(libraryTabHref(v as LibraryTab), { scroll: false })}>
        <TabsList variant="line" ariaLabel={r1.tabsLabel}>
          {LIBRARY_TABS.map((k) => (
            <TabsTrigger key={k} value={k}>
              <i className={`fa-light ${ICON[k]}`} aria-hidden="true" />
              {k === "kits" ? r1.tabs.kits : r1.tabLabel(r1.tabs[k], counts[k])}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="skills" className="mt-4 flex min-w-0 flex-col gap-4 outline-none">
          <SkillsTab />
        </TabsContent>
        <TabsContent value="kits" className="mt-4 flex min-w-0 flex-col gap-4 outline-none">
          <PlaceholderBody meta={PLACEHOLDERS.kits} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4 flex min-w-0 flex-col gap-4 outline-none">
          <TaxonTab kind="category" />
        </TabsContent>
        <TabsContent value="tags" className="mt-4 flex min-w-0 flex-col gap-4 outline-none">
          <TaxonTab kind="tag" />
        </TabsContent>
        <TabsContent value="settings" className="mt-4 flex min-w-0 flex-col gap-4 outline-none">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="labInstructors" className="mt-4 flex min-w-0 flex-col gap-4 outline-none">
          <LabTab />
        </TabsContent>
      </Tabs>
      <LibraryDialogHost />
    </PageFrame>
  )
}
