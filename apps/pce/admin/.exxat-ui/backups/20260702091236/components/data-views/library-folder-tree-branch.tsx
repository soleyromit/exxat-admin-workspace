'use client'

import * as React from 'react'

interface LibraryFolderTreeBranchProps {
  folder: { id: string; name: string; icon?: string; colorKey?: string }
  folders: unknown[]
  pathname?: string | null
  hubSearchParams?: unknown
  nav?: unknown
  canManageFolders?: boolean
  canManageAccess?: boolean
  onAddSubfolder?: (folder: unknown) => void
  onCustomizeFolder?: (folder: unknown) => void
  onManageAccess?: () => void
  onDeleteFolder?: (folder: unknown) => void
  [key: string]: unknown
}

export function LibraryFolderTreeBranch({ folder }: LibraryFolderTreeBranchProps) {
  return (
    <span className="flex items-center gap-2 text-sm px-2 py-1">
      <i className={`fa-light ${folder.icon ?? 'fa-folder'}`} aria-hidden="true" />
      {folder.name}
    </span>
  )
}
