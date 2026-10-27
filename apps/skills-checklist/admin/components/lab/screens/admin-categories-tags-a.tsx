"use client"

/**
 * Categories and tags, variant A (REQ SL-03 to SL-06; Thursday step A2): its own page under Skills (D-L21, Romit 2026-10-27:
 * "why are categories and tags at Settings? When I click on them, it switches to the Skills navigation"). Two tabs, Categories
 * and Tags, each a table over the SHARED vocabulary with inline create, rename, deactivate and delete-only-unused. The same
 * component renders Settings A on its program scope. See components/lab/admin-b/settings-page.tsx.
 */
import { SettingsPage } from "@/components/lab/admin-b/settings-page"

export function AdminCategoriesTagsA() {
  return <SettingsPage scope="vocabulary" />
}
