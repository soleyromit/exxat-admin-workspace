/**
 * Library folder tree (mock) — OS-style icon folders with appearance + hierarchy.
 * Production: replace with API + optimistic updates.
 */

export type LibraryFolderColorKey =
  | "brand"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "chart1"
  | "chart2"
  | "chart3"

export interface LibraryFolder {
  id: string
  name: string
  /** `null` = top-level folder */
  parentId: string | null
  /** Font Awesome icon without weight prefix (e.g. `fa-folder`, `fa-flask`). */
  icon: string
  colorKey: LibraryFolderColorKey
}

/** Tile + icon tint classes (semantic tokens). */
export const LIBRARY_FOLDER_COLOR_STYLES: Record<
  LibraryFolderColorKey,
  { tile: string; iconWrap: string; icon: string }
> = {
  brand: {
    tile: "border-brand/35 bg-brand/10",
    iconWrap: "bg-brand/20",
    icon: "text-brand",
  },
  success: {
    tile: "border-emerald-500/35 bg-emerald-500/10",
    iconWrap: "bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    tile: "border-amber-500/35 bg-amber-500/10",
    iconWrap: "bg-amber-500/15",
    icon: "text-amber-700 dark:text-amber-400",
  },
  destructive: {
    tile: "border-destructive/35 bg-destructive/10",
    iconWrap: "bg-destructive/15",
    icon: "text-destructive",
  },
  muted: {
    tile: "border-border bg-muted/50",
    iconWrap: "bg-muted",
    icon: "text-muted-foreground",
  },
  chart1: {
    tile: "border-[color-mix(in_oklab,var(--color-chart-1)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-chart-1)_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_oklab,var(--color-chart-1)_20%,transparent)]",
    icon: "text-[var(--color-chart-1)]",
  },
  chart2: {
    tile: "border-[color-mix(in_oklab,var(--color-chart-2)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-chart-2)_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_oklab,var(--color-chart-2)_20%,transparent)]",
    icon: "text-[var(--color-chart-2)]",
  },
  chart3: {
    tile: "border-[color-mix(in_oklab,var(--color-chart-3)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-chart-3)_12%,transparent)]",
    iconWrap: "bg-[color-mix(in_oklab,var(--color-chart-3)_20%,transparent)]",
    icon: "text-[var(--color-chart-3)]",
  },
}

/** Icon color classes using Tailwind — for use in text-based contexts (list views, panels). */
export const LIBRARY_FOLDER_ICON_COLORS: Record<LibraryFolderColorKey, string> = {
  brand: "text-orange-600 dark:text-orange-400",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-red-600 dark:text-red-400",
  muted: "text-slate-500 dark:text-slate-400",
  chart1: "text-blue-600 dark:text-blue-400",
  chart2: "text-lime-600 dark:text-lime-400",
  chart3: "text-purple-600 dark:text-purple-400",
}

/** Preset icons for folder appearance picker. */
export const LIBRARY_FOLDER_ICON_OPTIONS: readonly string[] = [
  "fa-folder",
  "fa-folder-open",
  "fa-book",
  "fa-bookmark",
  "fa-box",
  "fa-box-archive",
  "fa-tag",
  "fa-flag",
  "fa-star",
  "fa-file-lines",
  "fa-layer-group",
  "fa-clipboard-check",
  "fa-list-check",
  "fa-grid-2",
  "fa-folder-tree",
] as const

export const DEFAULT_LIBRARY_FOLDERS: LibraryFolder[] = [
  {
    id: "fld-favorites",
    name: "Favorites",
    parentId: null,
    icon: "fa-star",
    colorKey: "warning",
  },
  {
    id: "fld-clinical",
    name: "Folder 1",
    parentId: null,
    icon: "fa-folder",
    colorKey: "brand",
  },
  {
    id: "fld-science",
    name: "Folder 2",
    parentId: null,
    icon: "fa-folder",
    colorKey: "chart2",
  },
  {
    id: "fld-ops",
    name: "Folder 3",
    parentId: null,
    icon: "fa-folder",
    colorKey: "warning",
  },
  {
    id: "fld-ethics",
    name: "Folder 4",
    parentId: null,
    icon: "fa-folder",
    colorKey: "muted",
  },
  {
    id: "fld-skills-lab",
    name: "Folder 1.A",
    parentId: "fld-clinical",
    icon: "fa-folder",
    colorKey: "success",
  },
]

export function newFolderId(): string {
  return `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function collectFolderDescendantIds(folders: LibraryFolder[], rootId: string): Set<string> {
  const out = new Set<string>()
  function walk(id: string) {
    out.add(id)
    for (const f of folders) {
      if (f.parentId === id) walk(f.id)
    }
  }
  walk(rootId)
  return out
}

export function isValidFolderMove(
  folders: LibraryFolder[],
  folderId: string,
  newParentId: string | null,
): boolean {
  if (folderId === newParentId) return false
  if (newParentId === null) return true
  const desc = collectFolderDescendantIds(folders, folderId)
  return !desc.has(newParentId)
}
