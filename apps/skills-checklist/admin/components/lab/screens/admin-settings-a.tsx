"use client"

/**
 * Settings (single recommended layout): categories, tags, clinical settings with site counts and what uses them, lab
 * instructors. Inline create, delete only while unused, deactivate keeps history. See components/lab/admin-b/settings-page.tsx.
 */
import { SettingsPage } from "@/components/lab/admin-b/settings-page"

export function AdminSettingsA() {
  return <SettingsPage />
}
