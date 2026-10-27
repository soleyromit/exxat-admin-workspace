"use client"

/**
 * Settings (recommended layout): Clinical settings with site counts and what uses them, Evaluators (everyone who signs, lab
 * instructors included, D-L24), as tabs; the program noun has no UI (D-L25). Categories and tags is its own page under Skills (D-L21). See
 * components/lab/admin-b/settings-page.tsx.
 */
import { SettingsPage } from "@/components/lab/admin-b/settings-page"

export function AdminSettingsA() {
  return <SettingsPage />
}
