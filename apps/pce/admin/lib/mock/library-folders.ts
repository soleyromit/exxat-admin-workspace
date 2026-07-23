export type LibraryFolderColorKey =
  | 'brand'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted'
  | 'chart1'
  | 'chart2'
  | 'chart3'

export interface LibraryFolder {
  id: string
  name: string
  icon: string
  colorKey: LibraryFolderColorKey
  parentId: string | null
}

export const LIBRARY_FOLDER_COLOR_STYLES: Record<LibraryFolderColorKey, { tile: string }> = {
  brand:       { tile: 'bg-brand/10 text-brand border-brand/20' },
  success:     { tile: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)] border-[var(--chart-2)]/20' },
  warning:     { tile: 'bg-[var(--chart-4)]/10 text-[var(--chart-4)] border-[var(--chart-4)]/20' },
  destructive: { tile: 'bg-destructive/10 text-destructive border-destructive/20' },
  muted:       { tile: 'bg-muted text-muted-foreground border-border' },
  chart1:      { tile: 'bg-[var(--chart-1)]/10 text-[var(--chart-1)] border-[var(--chart-1)]/20' },
  chart2:      { tile: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)] border-[var(--chart-2)]/20' },
  chart3:      { tile: 'bg-[var(--chart-3)]/10 text-[var(--chart-3)] border-[var(--chart-3)]/20' },
}

export const LIBRARY_FOLDER_ICON_COLORS: Record<LibraryFolderColorKey, string> = {
  brand:       'text-[var(--brand-color)]',
  success:     'text-[var(--chart-2)]',
  warning:     'text-[var(--chart-4)]',
  destructive: 'text-destructive',
  muted:       'text-muted-foreground',
  chart1:      'text-[var(--chart-1)]',
  chart2:      'text-[var(--chart-2)]',
  chart3:      'text-[var(--chart-3)]',
}

export const LIBRARY_FOLDER_ICON_OPTIONS: string[] = [
  'fa-folder',
  'fa-book',
  'fa-book-open',
  'fa-bookmark',
  'fa-graduation-cap',
  'fa-file-lines',
  'fa-clipboard',
  'fa-notes',
  'fa-star',
  'fa-heart',
  'fa-tag',
  'fa-briefcase',
  'fa-flask',
  'fa-stethoscope',
  'fa-brain',
]

let _nextId = 1000
export function newFolderId(): string {
  return `folder-${_nextId++}`
}

export const DEFAULT_LIBRARY_FOLDERS: LibraryFolder[] = [
  { id: 'fld-clinical',  name: 'Clinical',  icon: 'fa-stethoscope',   colorKey: 'brand',   parentId: null },
  { id: 'fld-didactic',  name: 'Didactic',  icon: 'fa-book',          colorKey: 'success', parentId: null },
  { id: 'fld-favorites', name: 'Favorites', icon: 'fa-star',          colorKey: 'warning', parentId: null },
]

export function collectFolderDescendantIds(
  folders: LibraryFolder[],
  folderId: string,
): Set<string> {
  const result = new Set<string>([folderId])
  let frontier = [folderId]
  while (frontier.length > 0) {
    const next: string[] = []
    for (const f of folders) {
      if (f.parentId !== null && frontier.includes(f.parentId) && !result.has(f.id)) {
        result.add(f.id)
        next.push(f.id)
      }
    }
    frontier = next
  }
  return result
}
