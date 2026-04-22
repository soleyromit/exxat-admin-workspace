'use client'
import { useRouter } from 'next/navigation'
import { useQB } from './qb-state'
import {
  Button, Badge, Avatar, AvatarFallback,
  Popover, PopoverTrigger, PopoverContent,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem,
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
            <Avatar key={p.id} style={{ width: 22, height: 22, marginLeft: i === 0 ? 0 : -7, border: '2px solid var(--background)', borderRadius: '50%', zIndex: shown.length - i, position: 'relative' }}>
              <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 8, fontWeight: 700 }}>
                {p.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflow > 0 && (
            <Badge variant="secondary" className="rounded-full" style={{ fontSize: 9, height: 22, minWidth: 22, marginLeft: -7, border: '2px solid var(--background)', position: 'relative', padding: '0 4px' }}>
              +{overflow}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3">
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 8 }}>
          {personas.length} Collaborator{personas.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {personas.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 10, fontWeight: 700 }}>
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{i === 0 ? 'Owner' : p.role}</div>
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
    <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden' }}>
          {/* Heading: current node name */}
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em',
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {titleLabel}
          </span>

          {/* Sibling switcher — only in folder view */}
          {navView === 'folder' && siblings.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Switch to sibling folder" style={{ color: 'var(--muted-foreground)', width: 18, height: 18, flexShrink: 0 }}>
                  <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 9 }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {siblings.map(s => (
                  <DropdownMenuItem key={s.id} onClick={() => navigateToFolder(s.id)}>
                    <i className="fa-light fa-folder" aria-hidden="true" />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }}>{folderCount(s.id)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Button variant="default" size="default" onClick={() => router.push(selectedFolderId ? `/questions/new?folder=${selectedFolderId}` : '/questions/new')} style={{ flexShrink: 0 }}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add Question
        </Button>
      </div>

      {/* Subtitle: count + collaborators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          {count} question{count !== 1 ? 's' : ''} · Last updated now
        </span>
        {collaboratorIds.length > 0 && (
          <>
            <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />
            <CollaboratorAvatars collaboratorIds={collaboratorIds} />
          </>
        )}
        {isAdmin && selectedFolder && (
          <Button
            variant="ghost" size="icon-xs"
            aria-label="Manage access"
            style={{ color: 'var(--muted-foreground)' }}
            onClick={() => setCollaboratorsModalFolderId(selectedFolderId)}
          >
            <i className="fa-light fa-user-plus" aria-hidden="true" style={{ fontSize: 11 }} />
          </Button>
        )}
      </div>
    </div>
  )
}
