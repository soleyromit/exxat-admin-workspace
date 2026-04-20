'use client'
import { useQB } from './qb-state'
import {
  Button, Badge, Avatar, AvatarFallback,
  Popover, PopoverTrigger, PopoverContent,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem,
} from '@exxat/ds/packages/ui/src'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'
import type { FolderNode } from '@/lib/qb-types'

// Breadcrumb segment: clickable label with hover snapshot popover + chevron sibling switcher
function BreadcrumbSegment({ label, folderId, siblings, onNavigate, isLast }: {
  label: string
  folderId: string | null
  siblings: { id: string; name: string; count: number }[]
  onNavigate: (id: string | null) => void
  isLast: boolean
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost" size="sm"
            className="h-auto px-1.5 py-0.5"
            style={{
              fontSize: 20,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
              color: isLast ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontWeight: isLast ? 700 : 500,
            }}
            onClick={() => onNavigate(folderId)}
          >
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-3">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            {folderId ? 'Click to navigate to this folder.' : 'Top-level Question Bank.'}
          </div>
        </PopoverContent>
      </Popover>

      {siblings.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Switch folder" style={{ color: 'var(--muted-foreground)', width: 18, height: 18 }}>
              <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 9 }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {siblings.map(s => (
              <DropdownMenuItem key={s.id} onClick={() => onNavigate(s.id)}>
                <i className="fa-light fa-folder" aria-hidden="true" />
                <span style={{ flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.count}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  )
}

// Collaborator avatar stack (Figma-style negative margin)
function CollaboratorAvatars({ collaboratorIds }: { collaboratorIds: string[] }) {
  const { currentPersona, setCollaboratorsModalFolderId, selectedFolderId } = useQB()
  const isAdmin = currentPersona.role === 'Admin'
  const MAX_SHOWN = 3
  const personas = MOCK_QB_PERSONAS.filter(p => collaboratorIds.includes(p.id))
  const shown = personas.slice(0, MAX_SHOWN)
  const overflow = personas.length - MAX_SHOWN

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
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
  const {
    selectedFolder, visibleQuestions, navView,
    setNavView, folders, navigateToFolder,
    currentPersona, setSelectedFolderId,
  } = useQB()
  const isAdmin = currentPersona.role === 'Admin'
  const count = visibleQuestions.length

  // Build breadcrumb segments
  type Segment = { label: string; folderId: string | null; siblings: { id: string; name: string; count: number }[] }
  const segments: Segment[] = [
    { label: 'Question Bank', folderId: null, siblings: [] },
  ]

  if (navView === 'my') {
    segments.push({ label: 'My Questions', folderId: null, siblings: [] })
  } else if (navView === 'all') {
    segments.push({ label: 'All Questions', folderId: null, siblings: [] })
  } else if (selectedFolder) {
    // Build ancestor chain from root to selectedFolder
    const chain: Segment[] = []
    let node: FolderNode | undefined = selectedFolder
    while (node) {
      const siblings = folders
        .filter(f => f.parentId === node!.parentId && f.id !== node!.id)
        .map(f => ({ id: f.id, name: f.name, count: f.count }))
      chain.unshift({ label: node.name, folderId: node.id, siblings })
      if (!node.parentId) break
      node = folders.find(f => f.id === node!.parentId)
    }
    segments.push(...chain)
  }

  const collaboratorIds = selectedFolder?.collaborators ?? []

  function handleSegmentNavigate(folderId: string | null, segmentIndex: number) {
    if (segmentIndex === 0) {
      // Root "Question Bank" clicked → reset to My Questions
      setNavView('my')
    } else if (folderId === null) {
      // "My Questions" or "All Questions" labels — no-op on click (handled by root)
    } else {
      navigateToFolder(folderId)
    }
  }

  return (
    <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {/* Breadcrumb title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, minWidth: 0 }}>
          {segments.map((seg, i) => (
            <span key={seg.folderId ?? seg.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && (
                <i className="fa-light fa-chevron-right" aria-hidden="true"
                  style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              )}
              <BreadcrumbSegment
                label={seg.label}
                folderId={seg.folderId}
                siblings={seg.siblings}
                isLast={i === segments.length - 1}
                onNavigate={(id) => handleSegmentNavigate(id, i)}
              />
            </span>
          ))}
        </div>

        {/* Single Add Question CTA — no split, no dropdown */}
        <Button variant="default" size="default" onClick={() => {}} style={{ flexShrink: 0 }}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add Question
        </Button>
      </div>

      {/* Subtitle row: count + collaborator avatars */}
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
          <Button variant="ghost" size="icon-xs" aria-label="Add collaborator" style={{ color: 'var(--muted-foreground)' }}>
            <i className="fa-light fa-user-plus" aria-hidden="true" style={{ fontSize: 11 }} />
          </Button>
        )}
      </div>
    </div>
  )
}
