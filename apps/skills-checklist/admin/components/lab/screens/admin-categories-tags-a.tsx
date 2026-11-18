"use client"

/**
 * Categories and tags, variant A (REQ SL-03 to SL-06; Thursday step A2). Two tabs, Categories and Tags, each a table over the SHARED vocabulary
 * with inline create, rename, deactivate and delete-only-unused. The same component renders Settings A on its program scope. See
 * components/lab/admin-b/settings-page.tsx.
 *
 * Since 2026-11-16 (Romit: "Categories and Tags are going to be a tab in the skill list page") it lives as the Categories and tags tab of Skill lists
 * (components/lab/admin-a/lists-frame.tsx). The old address stays for links saved before, and opens that tab (`CategoriesTagsMoved`); the Set up
 * skills wizard still mounts `AdminCategoriesTagsA` as its own step.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { SettingsPage } from "@/components/lab/admin-b/settings-page"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { VOCABULARY_TAB_SCREEN, vocabularyTabParams } from "@/lib/lab/admin-ia"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { LoadingState } from "@/components/lab/admin-a/parts"

export function AdminCategoriesTagsA() {
  return <SettingsPage scope="vocabulary" />
}

/** The old Categories and tags address: the Categories and tags tab of Skill lists, on the same section. */
export function CategoriesTagsMoved() {
  const router = useLabRouter()
  const to = useLabHref()
  const params = useSearchParams()
  const section = (params?.get("tab") ?? params?.get("list")) === "tags" ? "tags" : "categories"
  React.useEffect(() => {
    router.replace(to(VOCABULARY_TAB_SCREEN, vocabularyTabParams(section)))
  }, [section]) // eslint-disable-line react-hooks/exhaustive-deps
  return <LoadingState label="Loading categories and tags" />
}
