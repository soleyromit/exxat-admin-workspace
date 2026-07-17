'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQB } from './qb-state'
import {
  Button, Badge, Avatar, AvatarFallback, Input,
  Popover, PopoverTrigger, PopoverContent,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxatdesignux/ui'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'
import { FolderContextMenu, MoveFolderDialog, DeleteFolderDialog, ManageShellAccessDialog } from './qb-sidebar'

import type { FolderNode } from '@/lib/qb-types'

function courseFolderLabel(name: string): string {
  const match = name.match(/^([A-Z0-9]+)\s/)
  if (!match) return name
  return `${match[1]} · Question Bank`
}

function getDescendantIds(id: string, folders: FolderNode[]): Set<string> {
  const result = new Set<string>([id])
  folders.filter(f => f.parentId === id).forEach(f => {
    getDescendantIds(f.id, folders).forEach(d => result.add(d))
  })
  return result
}

// Collaborator avatar stack
function CollaboratorAvatars({ collaboratorIds }: { collaboratorIds: string[] }) {
  const { currentPersona } = useQB()
  const isAdmin = currentPersona.role === 'exam_admin'
  const MAX_SHOWN = 3
  const personas = MOCK_QB_PERSONAS.filter(p => collaboratorIds.includes(p.id))
  const shown = personas.slice(0, MAX_SHOWN)
  const overflow = personas.length - MAX_SHOWN

  const overflowPersonas = personas.slice(MAX_SHOWN)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${personas.length} collaborators`}
          className="inline-flex items-center p-0 h-auto"
        >
          {shown.map((p, i) => (
            <Tooltip key={p.id}>
              <TooltipTrigger asChild>
                <Avatar style={{ width: 28, height: 28, marginLeft: i === 0 ? 0 : -6, border: '2px solid var(--background)', borderRadius: '50%', zIndex: shown.length - i, position: 'relative' }}>
                  <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-medium">{p.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {overflow > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="rounded-full text-xs" style={{ height: 28, minWidth: 28, marginLeft: -6, border: '2px solid var(--background)', position: 'relative', padding: '0 5px', cursor: 'pointer' }}>
                  +{overflow}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {overflowPersonas.map(p => (
                  <p key={p.id} className="text-xs font-medium">{p.name}</p>
                ))}
              </TooltipContent>
            </Tooltip>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3">
        <div className="text-xs font-medium text-muted-foreground" style={{ marginBottom: 8 }}>
          {personas.length} Collaborator{personas.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {personas.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{i === 0 ? 'Owner' : p.role}</div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function QBTitle() {
  const router = useRouter()
  const {
    selectedFolder, visibleQuestions, navView,
    folders, questions, renameFolder,
    currentPersona, selectedFolderId,
  } = useQB()
  const isAdmin = currentPersona.role === 'exam_admin'
  const count = visibleQuestions.length

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState('')
  const [moveFolderDialogOpen, setMoveFolderDialogOpen] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const [manageAccessOpen, setManageAccessOpen] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)

  function folderCount(folderId: string): number {
    const ids = getDescendantIds(folderId, folders)
    return questions.filter(q =>
      ids.has(q.folder) &&
      (isAdmin || q.status === 'Saved' || q.creator === currentPersona.id)
    ).length
  }

  const titleLabel = navView === 'folder' && selectedFolder
    ? (selectedFolder.isCourse ? courseFolderLabel(selectedFolder.name) : selectedFolder.name)
    : navView === 'my' ? 'My Questions' : 'All Questions'

  const collaboratorIds = (() => {
    if (!selectedFolder) return []
    const ids = new Set<string>()
    let node: typeof selectedFolder | undefined = selectedFolder
    while (node) {
      for (const id of node.collaborators ?? []) ids.add(id)
      node = node.parentId ? folders.find(f => f.id === node!.parentId) : undefined
    }
    return Array.from(ids)
  })()

  return (
    <div className="qb-title-bar" style={{ padding: '6px 16px 4px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="qb-title-text" style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
          {isRenaming && selectedFolder ? (
            <Input
              ref={renameRef}
              value={renameName}
              onChange={e => setRenameName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); renameRef.current?.blur() }
                if (e.key === 'Escape') { setIsRenaming(false) }
              }}
              onBlur={() => {
                if (renameName.trim()) renameFolder(selectedFolder.id, renameName.trim())
                setIsRenaming(false)
              }}
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', flex: 1, minWidth: 0 }}
            />
          ) : (
            <h1 className="text-xl font-semibold text-foreground" style={{
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
              minWidth: 0,
            }}>
              {titleLabel}
            </h1>
          )}

          {/* Context menu — always reserves its slot so heading width never shifts */}
          <span style={{ visibility: (navView === 'folder' && selectedFolder) ? 'visible' : 'hidden', flexShrink: 0 }}>
            {navView === 'folder' && selectedFolder ? (
              <FolderContextMenu
                node={selectedFolder}
                isAdmin={isAdmin}
                alwaysVisible
                onRename={() => {
                  setRenameName(selectedFolder.isCourse ? courseFolderLabel(selectedFolder.name) : selectedFolder.name)
                  setIsRenaming(true)
                  setTimeout(() => { renameRef.current?.focus(); renameRef.current?.select() }, 80)
                }}
                onAddSubfolder={() => {/* no-op: use sidebar to add subfolders */}}
                onMove={() => setMoveFolderDialogOpen(true)}
                onDelete={() => setDeleteFolderDialogOpen(true)}
                onManageAccess={() => setManageAccessOpen(true)}
              />
            ) : (
              /* Placeholder keeps the slot width identical — icon-xs button is 24px */
              <span style={{ display: 'inline-flex', width: 24, height: 24 }} aria-hidden="true" />
            )}
          </span>
        </div>

        <Button variant="default" size="default" onClick={() => router.push(selectedFolderId ? `/questions/new?folder=${selectedFolderId}` : '/questions/new')} style={{ flexShrink: 0 }}>
          Add Question
        </Button>
      </div>

      {/* Subtitle: count + collaborators — fixed 28px height so layout never shifts */}
      <div className="qb-title-text" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1, minHeight: 28 }}>
        <span className="text-sm text-muted-foreground">
          {count} question{count !== 1 ? 's' : ''} · Last updated now
        </span>
        {collaboratorIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />
            <CollaboratorAvatars collaboratorIds={collaboratorIds} />
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedFolder && (
        <>
          <MoveFolderDialog
            node={selectedFolder}
            open={moveFolderDialogOpen}
            onClose={() => setMoveFolderDialogOpen(false)}
          />
          <DeleteFolderDialog
            node={selectedFolder}
            open={deleteFolderDialogOpen}
            onClose={() => setDeleteFolderDialogOpen(false)}
          />
          {selectedFolder.isCourse && (
            <ManageShellAccessDialog
              node={selectedFolder}
              open={manageAccessOpen}
              onClose={() => setManageAccessOpen(false)}
            />
          )}
        </>
      )}
    </div>
  )
}
