/**
 * Learning activity groups — folder tree (mock). Same shape as library folders.
 */

import type { LibraryFolder } from "@/lib/mock/library-folders"
import { newFolderId } from "@/lib/mock/library-folders"

export { newFolderId }

export const DEFAULT_LEARNING_ACTIVITY_GROUPS: LibraryFolder[] = [
  {
    id: "lag-eval-cohort",
    name: "DPT Class of 2026 — Evaluations",
    parentId: null,
    icon: "fa-folder",
    colorKey: "brand",
  },
  {
    id: "lag-0104",
    name: "DPT Class of 2027",
    parentId: null,
    icon: "fa-folder",
    colorKey: "chart1",
  },
  {
    id: "lag-class-2025",
    name: "DPT Class of 2025",
    parentId: null,
    icon: "fa-folder",
    colorKey: "success",
  },
  {
    id: "lag-cohort-1",
    name: "DPT Cohort A",
    parentId: null,
    icon: "fa-folder",
    colorKey: "chart2",
  },
  {
    id: "lag-dpt-2023",
    name: "DPT Class of 2023",
    parentId: null,
    icon: "fa-folder",
    colorKey: "warning",
  },
  {
    id: "lag-july-2023",
    name: "DPT Summer 2023 Cohort",
    parentId: null,
    icon: "fa-folder",
    colorKey: "muted",
  },
]
