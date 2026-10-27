"use client"

/**
 * Categories and tags, variant B (REQ SL-03 to SL-06): master and detail on its own page under Skills (D-L21). The two lists
 * on the left, the entries of the chosen list in the middle, the chosen entry with every skill that uses it on the right, so
 * deactivate or delete is decided next to the evidence. The same component renders Settings B on its program scope.
 */
import { SettingsMasterDetail } from "@/components/lab/screens/admin-settings-b"

export function AdminCategoriesTagsB() {
  return <SettingsMasterDetail scope="vocabulary" />
}
