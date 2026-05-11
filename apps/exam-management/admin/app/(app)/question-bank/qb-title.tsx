'use client'
import { useRouter } from 'next/navigation'
import { useQB } from './qb-state'
import {
  Button, Badge, Avatar, AvatarFallback,
  Popover, PopoverTrigger, PopoverContent,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxat/ds/packages/ui/src'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

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
  const { currentPersona, setCollaboratorsModalFolderId, selectedFolderId } = useQB()
  const isAdmin = currentPersona.role === 'exam_admin'
  const MAX_SHOWN = 3
  const personas = MOCK_QB_PERSONAS.filter(p => collaboratorIds.includes(p.id))
  const shown = personas.slice(0, MAX_SHOWN)
  const overflow = personas.length - MAX_SHOWN

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost" size="sm"
          className="p-0 h-auto gap-0"
          aria-label={`${personas.length} collaborators`}
          style={{ display: 'inline-flex', alignItems: 'center' }}
        >
          {shown.map((p, i) => (
            <Tooltip key={p.id}>
              <TooltipTrigger asChild>
                <Avatar style={{ width: 28, height: 28, marginLeft: i === 0 ? 0 : -6, border: '2px solid var(--background)', borderRadius: '50%', zIndex: shown.length - i, position: 'relative', cursor: 'pointer' }}>
                  <AvatarFallback className="text-[10px] font-bold" style={{ backgroundColor: 'color-mix(in oklch, var(--foreground) 8%, var(--background))', color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))' }}>
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
            <Badge variant="secondary" className="rounded-full text-[10px]" style={{ height: 28, minWidth: 28, marginLeft: -6, border: '2px solid var(--background)', position: 'relative', padding: '0 5px' }}>
              +{overflow}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3">
        <div className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground" style={{ marginBottom: 8 }}>
          {personas.length} Collaborator{personas.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {personas.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                <AvatarFallback className="text-[10px] font-bold" style={{ backgroundColor: 'color-mix(in oklch, var(--foreground) 8%, var(--background))', color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))' }}>
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
        {isAdmin && (
          <Button
            variant="outline" size="sm"
            className="w-full mt-3 gap-1.5 text-xs"
            onClick={() => setCollaboratorsModalFolderId(selectedFolderId)}
          >
            <i className="fa-light fa-user-plus" aria-hidden="true" />
            Manage access
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function QBTitle() {
  const router = useRouter()
  const {
    selectedFolder, visibleQuestions, navView,
    folders, questions, navigateToFolder,
    currentPersona, selectedFolderId,
    setCollaboratorsModalFolderId,
  } = useQB()
  const isAdmin = currentPersona.role === 'exam_admin'
  const count = visibleQuestions.length

  // Compute live question count for any folder (same logic as sidebar)
  function folderCount(folderId: string): number {
    const ids = getDescendantIds(folderId, folders)
    return questions.filter(q =>
      ids.has(q.folder) &&
      (isAdmin || q.status === 'Saved' || q.creator === currentPersona.id)
    ).length
  }

  // Siblings of the current node for the switcher dropdown
  const siblings = selectedFolder
    ? folders.filter(f => f.parentId === selectedFolder.parentId && f.id !== selectedFolder.id)
    : []

  // Title label for the current view
  const titleLabel = navView === 'folder' && selectedFolder
    ? (selectedFolder.isCourse ? courseFolderLabel(selectedFolder.name) : selectedFolder.name)
    : navView === 'my' ? 'My Questions' : 'All Questions'

  // Collaborators: from selected folder + inherited from ancestors
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
      {/* Title row: h1 + chevron + avatars + user-plus (left, flex:1) | Add Question (right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="qb-title-text" style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
          <h1 className="text-xl font-bold text-foreground" style={{
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

          {/* Sibling switcher */}
          {navView === 'folder' && siblings.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Switch to sibling folder" className="text-muted-foreground" style={{ width: 18, height: 18, flexShrink: 0 }}>
                  <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 9 }} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-1" style={{ width: 240 }}>
                {siblings.map(s => (
                  <Button key={s.id} variant="ghost" size="sm" onClick={() => navigateToFolder(s.id)} className="w-full justify-start text-foreground" style={{ height: 32, padding: '0 8px', borderRadius: 6, gap: 4 }}>
                    <span style={{ width: 16, flexShrink: 0 }} />
                    <i className={`fa-regular ${s.isCourse ? 'fa-graduation-cap' : 'fa-folder'} text-muted-foreground`} aria-hidden="true" style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }} />
                    <span className="flex-1 text-sm text-left truncate">{s.isCourse ? courseFolderLabel(s.name) : s.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{folderCount(s.id)}</span>
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>

        <Button variant="default" size="default" onClick={() => router.push(selectedFolderId ? `/questions/new?folder=${selectedFolderId}` : '/questions/new')} style={{ flexShrink: 0 }}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add Question
        </Button>
      </div>

      {/* Subtitle: count + collaborators + manage access */}
      <div className="qb-title-text" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
        <span className="text-sm text-muted-foreground">
          {count} question{count !== 1 ? 's' : ''} · Last updated now
        </span>
        {(collaboratorIds.length > 0 || (isAdmin && selectedFolder)) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />
            {collaboratorIds.length > 0 && (
              <CollaboratorAvatars collaboratorIds={collaboratorIds} />
            )}
            {isAdmin && selectedFolder && (
              <Button
                variant="ghost" size="icon-xs"
                aria-label="Manage access"
                className="text-muted-foreground"
                style={{ width: 28, height: 28 }}
                onClick={() => setCollaboratorsModalFolderId(selectedFolderId)}
              >
                <i className="fa-light fa-user-plus" aria-hidden="true" style={{ fontSize: 14 }} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
