"use client"

/**
 * Fills the packaged DS shell's slots (`@exxatdesignux/ui/components/shell`) with this product's
 * nav. Same approach as apps/pce/admin/components/app-shell-wiring.tsx, reduced to what the
 * scaffold needs: nav only. Product switching, scope picker, notifications and Ask Leo slots are
 * intentionally unfilled (every AppShellData/AppShellSlots entry is optional) until a contract
 * asks for them.
 */
import * as React from "react"
import { usePathname } from "next/navigation"
import {
  AppShellSlotsProvider,
  type AppShellData,
  type AppShellRoutePolicy,
  type AppShellSlots,
  type ShellNav,
} from "@exxatdesignux/ui/components/shell"

import { buildSkillsNav } from "@/lib/skills-nav"
import { useDb } from "@/lib/store/react"
import { reviewNavVisible, reviewQueue } from "@/lib/store"
import { viewForPath } from "@/components/shell/view"

function collectUrls(items: { url: string; children?: { url: string }[] }[]): string[] {
  const urls: string[] = []
  for (const it of items) {
    if (it.url && it.url !== "#") urls.push(it.url)
    if (it.children) urls.push(...collectUrls(it.children))
  }
  return urls
}

function useNav(): ShellNav {
  const db = useDb()
  const view = viewForPath(usePathname() ?? "")
  // SC-15: Review and approve is shown only when at least one skill has administrator approval turned on.
  const showReview = reviewNavVisible(db)
  const reviewCount = showReview ? reviewQueue(db).length : 0
  return React.useMemo(() => {
    const { primary } = buildSkillsNav({ showReview, view, reviewCount })
    return {
      primary,
      // One flat, ungrouped list of rows (Exxat Design OS hierarchy); personas are views, not nav groups.
      primaryLayout: { preamble: primary, sections: [] },
      quickActions: [],
      documents: [],
      secondary: [],
      user: { name: "Sample user", email: "", avatar: "" },
      knownUrls: Array.from(new Set(collectUrls([...buildSkillsNav({ showReview: true, view: "admin" }).primary, ...buildSkillsNav({ showReview: true, view: "student" }).primary, ...buildSkillsNav({ showReview: true, view: "evaluator" }).primary]))),
    }
  }, [showReview, reviewCount, view])
}

const SHELL_DATA: AppShellData = { useNav }
const SHELL_SLOTS: AppShellSlots = {}
const SHELL_ROUTES: AppShellRoutePolicy = {}

export function AppShellWiring({ children }: { children: React.ReactNode }) {
  const on = React.useMemo(() => ({}), [])
  return (
    <AppShellSlotsProvider slots={SHELL_SLOTS} on={on} routes={SHELL_ROUTES} data={SHELL_DATA}>
      {children}
    </AppShellSlotsProvider>
  )
}
