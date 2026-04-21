'use client'
import { useState, useRef, useEffect } from 'react'
import { useQB } from './qb-state'
import type { FolderNode } from '@/lib/qb-types'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  InputGroup, InputGroupAddon, Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Popover, PopoverTrigger, PopoverContent,
} from '@exxat/ds/packages/ui/src'

const ICON_OPTIONS = [
  { icon: 'fa-folder', label: 'Folder' },
  { icon: 'fa-book', label: 'Book' },
  { icon: 'fa-graduation-cap', label: 'Course' },
  { icon: 'fa-star', label: 'Star' },
  { icon: 'fa-flag', label: 'Flag' },
  { icon: 'fa-file-lines', label: 'File' },
  { icon: 'fa-rectangle-list', label: 'List' },
  { icon: 'fa-layer-group', label: 'Stack' },
]

function courseFolderLabel(name: string): string {
  // Input: "PHAR101 Question Bank (QB)" → Output: "PHAR101 · Question Bank"
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

function getFolderIcon(node: FolderNode, expanded: boolean, selected: boolean) {
  if (node.icon) {
    return { cls: `fa-light ${node.icon}`, color: selected ? 'var(--brand-color)' : 'var(--muted-foreground)' }
  }
  if (node.isCourse) return { cls: 'fa-solid fa-graduation-cap', color: selected ? 'var(--brand-color)' : 'var(--muted-foreground)' }
  return {
    cls: expanded ? 'fa-solid fa-folder-open' : (selected ? 'fa-solid fa-folder' : 'fa-regular fa-folder'),
    color: selected ? 'var(--brand-color)' : 'var(--muted-foreground)',
  }
}

function DeleteFolderDialog({
  node,
  open,
  onClose,
}: {
  node: FolderNode
  open: boolean
  onClose: () => void
}) {
  const { folders, questions, deleteFolder } = useQB()

  const affectedFolderIds = getDescendantIds(node.id, folders)
  const affectedQuestions = questions.filter(q => affectedFolderIds.has(q.folder))
  const usedQuestions = affectedQuestions.filter(q => (q.usedInSections?.length ?? 0) > 0)

  function handleDelete() {
    deleteFolder(node.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &quot;{node.name}&quot;?</DialogTitle>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--foreground)' }}>
            This will permanently delete the folder and all subfolders.
          </p>
          {affectedQuestions.length > 0 && (
            <div style={{
              padding: 12, borderRadius: 8,
              backgroundColor: 'var(--qb-delete-impact-bg)',
              border: '1px solid var(--qb-delete-impact-border)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--destructive)', marginBottom: 6 }}>
                <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ marginRight: 6 }} />
                Impact: {affectedQuestions.length} question{affectedQuestions.length !== 1 ? 's' : ''} will be removed
              </p>
              {usedQuestions.length > 0 && (
                <>
                  <p style={{ fontSize: 11, color: 'var(--destructive)', marginBottom: 4 }}>
                    {usedQuestions.length} question{usedQuestions.length !== 1 ? 's are' : ' is'} used in assessments:
                  </p>
                  <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {usedQuestions.map(q => (
                      <div key={q.id} style={{ fontSize: 11, color: 'var(--foreground)' }}>
                        · {q.title.slice(0, 60)}{q.title.length > 60 ? '…' : ''}{' '}
                        <span style={{ color: 'var(--muted-foreground)' }}>
                          ({(q.usedInSections ?? []).join(', ')})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete folder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MoveFolderDialog({
  node,
  open,
  onClose,
}: {
  node: FolderNode
  open: boolean
  onClose: () => void
}) {
  const { folders, moveFolder } = useQB()
  const [targetId, setTargetId] = useState<string | null>(null)

  const excluded = getDescendantIds(node.id, folders)
  const eligible = folders.filter(f => !excluded.has(f.id) && f.id !== node.parentId)

  function getFolderPath(f: FolderNode): string {
    const parts: string[] = [f.isCourse ? courseFolderLabel(f.name) : f.name]
    let cur: FolderNode | undefined = f
    while (cur?.parentId) {
      cur = folders.find(x => x.id === cur!.parentId)
      if (cur) parts.unshift(cur.isCourse ? courseFolderLabel(cur.name) : cur.name)
    }
    return parts.join(' / ')
  }

  function handleConfirm() {
    if (targetId) {
      moveFolder(node.id, targetId)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move &quot;{node.name}&quot;</DialogTitle>
        </DialogHeader>
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {eligible.map(f => (
            <Button
              key={f.id}
              variant="ghost"
              onClick={() => setTargetId(f.id)}
              className="w-full justify-start"
              style={{
                background: targetId === f.id ? 'var(--brand-tint)' : 'transparent',
                border: targetId === f.id ? '1px solid var(--brand-color)' : '1px solid transparent',
                borderRadius: 6,
                fontSize: 12,
                height: 'auto',
                padding: '6px 10px',
              }}
            >
              <i
                className={`fa-light ${f.isCourse ? 'fa-graduation-cap' : 'fa-folder'}`}
                aria-hidden="true"
                style={{ fontSize: 12, color: 'var(--muted-foreground)', width: 14, flexShrink: 0 }}
              />
              <span style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getFolderPath(f)}
              </span>
            </Button>
          ))}
          {eligible.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', padding: '8px 0' }}>
              No valid move targets available.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!targetId}>Move here</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FolderContextMenu({
  node,
  isAdmin,
  onRename,
  onAddSubfolder,
  onChangeIcon,
  onMove,
  onDelete,
}: {
  node: FolderNode
  isAdmin: boolean
  onRename: () => void
  onAddSubfolder: () => void
  onChangeIcon: (icon: string) => void
  onMove: () => void
  onDelete: () => void
}) {
  const { setCollaboratorsModalFolderId } = useQB()
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  if (!isAdmin) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Folder options"
          className="qb-folder-menu-btn shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onAddSubfolder()}>
          <i className="fa-light fa-folder-plus" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          New Subfolder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCollaboratorsModalFolderId(node.id)}>
          <i className="fa-light fa-users" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          Manage Access
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRename()}>
          <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIconPickerOpen((v) => !v) }}>
          <i className="fa-light fa-palette" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          Change icon
          {iconPickerOpen && (
            <div
              style={{
                position: 'absolute',
                left: '100%',
                top: 0,
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 8,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 4,
                boxShadow: 'var(--shadow-md)',
                zIndex: 200,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {ICON_OPTIONS.map((o) => (
                <Button
                  key={o.icon}
                  variant="ghost"
                  size="icon-xs"
                  aria-label={o.label}
                  onClick={() => {
                    onChangeIcon(o.icon)
                    setIconPickerOpen(false)
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    background: node.icon === o.icon ? 'var(--brand-tint)' : 'transparent',
                    border: node.icon === o.icon ? '1px solid var(--brand-color)' : '1px solid transparent',
                    borderRadius: 6,
                  }}
                >
                  <i className={`fa-light ${o.icon}`} aria-hidden="true" style={{ fontSize: 13 }} />
                </Button>
              ))}
            </div>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove()}>
          <i className="fa-light fa-arrow-right-to-bracket" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          Move to subfolder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete()}>
          <i className="fa-light fa-trash-can" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InlineFolderInput({
  depth,
  onConfirm,
  onCancel,
}: {
  depth: number
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  function confirm() {
    if (cancelledRef.current) return
    if (name.trim()) onConfirm(name.trim())
    else onCancel()
  }

  function cancel() {
    cancelledRef.current = true
    onCancel()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      paddingLeft: 8 + depth * 16,
      paddingRight: 8,
      height: 32,
    }}>
      <i
        className="fa-regular fa-folder"
        aria-hidden="true"
        style={{ fontSize: 13, color: 'var(--brand-color)', width: 16, textAlign: 'center' }}
      />
      <Input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') confirm()
          if (e.key === 'Escape') cancel()
        }}
        onBlur={confirm}
        style={{ flex: 1, fontSize: 12 }}
        placeholder="Folder name…"
      />
      <Button variant="ghost" size="icon-xs" onClick={confirm} aria-label="Confirm">
        <i className="fa-regular fa-check" aria-hidden="true" style={{ fontSize: 12, color: 'var(--brand-color)' }} />
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={cancel} aria-label="Cancel">
        <i className="fa-regular fa-xmark" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
      </Button>
    </div>
  )
}

function FolderDiffPopover({ folderId }: { folderId: string }) {
  const { folders, questions } = useQB()

  const folderIds = getDescendantIds(folderId, folders)
  const folderQuestions = questions.filter(q => folderIds.has(q.folder))

  if (folderQuestions.length === 0) {
    return <p style={{ fontSize: 11, color: 'var(--muted-foreground)', padding: '2px 0' }}>No questions yet</p>
  }

  const total  = folderQuestions.length
  const easy   = folderQuestions.filter(q => q.difficulty === 'Easy').length
  const medium = folderQuestions.filter(q => q.difficulty === 'Medium').length
  const hard   = folderQuestions.filter(q => q.difficulty === 'Hard').length

  const withPbis = folderQuestions.filter(q => q.pbis !== null)
  const avgPbis  = withPbis.length > 0
    ? (withPbis.reduce((sum, q) => sum + (q.pbis ?? 0), 0) / withPbis.length)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>
        {total} question{total !== 1 ? 's' : ''}
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 4 }}>Difficulty</div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
          {easy   > 0 && <div style={{ flex: easy,   background: 'var(--qb-diff-bar-easy)' }} />}
          {medium > 0 && <div style={{ flex: medium, background: 'var(--qb-diff-bar-medium)' }} />}
          {hard   > 0 && <div style={{ flex: hard,   background: 'var(--qb-diff-bar-hard)' }} />}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {([['Easy', easy, 'var(--qb-diff-bar-easy)'], ['Medium', medium, 'var(--qb-diff-bar-medium)'], ['Hard', hard, 'var(--qb-diff-bar-hard)']] as const).map(([label, count, color]) =>
            count > 0 && (
              <span key={label} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                {label}: {count}
              </span>
            )
          )}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
        Avg. pBIS:{' '}
        <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
          {avgPbis !== null ? avgPbis.toFixed(2) : '—'}
        </span>
        {withPbis.length < total && ` (${withPbis.length} of ${total} scored)`}
      </div>
    </div>
  )
}

function FolderRow({
  node,
  depth,
  isAdmin,
}: {
  node: FolderNode
  depth: number
  isAdmin: boolean
}) {
  const {
    selectedFolderId, setSelectedFolderId,
    expandedFolderIds, toggleFolder,
    folders,
    questions,
    draggedQuestionId, setDragOverFolderId, dragOverFolderId,
    draggedFolderId, setDraggedFolderId,
    highlightedFolderId,
    renameFolder,
    createFolder,
    setFolderIcon,
  } = useQB()

  const subtreeIds = getDescendantIds(node.id, folders)
  const folderQuestionCount = questions.filter(q => subtreeIds.has(q.folder)).length

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState(node.name)
  const [showingInlineCreate, setShowingInlineCreate] = useState(false)
  const [moveFolderDialogOpen, setMoveFolderDialogOpen] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleMouseEnter() {
    hoverTimerRef.current = setTimeout(() => setHoverOpen(true), 600)
  }
  function handleMouseLeave() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoverOpen(false)
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const isSelected = selectedFolderId === node.id
  const isExpanded = expandedFolderIds.has(node.id)
  const isDragOver = dragOverFolderId === node.id
  const hasChildren = folders.some(f => f.parentId === node.id)
  const icon = getFolderIcon(node, isExpanded, isSelected)

  const indentPx = 8 + depth * 16

  return (
    <div style={{ position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Popover open={hoverOpen} onOpenChange={setHoverOpen}>
        <PopoverTrigger asChild>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-52 p-3">
          <FolderDiffPopover folderId={node.id} />
        </PopoverContent>
      </Popover>
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className={highlightedFolderId === node.id ? 'folder-highlight' : undefined}
        onClick={() => {
          if (!isRenaming) {
            setSelectedFolderId(node.id)
            if (hasChildren) toggleFolder(node.id)
          }
        }}
        draggable={isAdmin && !isRenaming}
        onDragStart={(e) => {
          e.stopPropagation()
          setDraggedFolderId(node.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragEnd={() => setDraggedFolderId(null)}
        onDragOver={(e) => {
          if (draggedQuestionId) {
            e.preventDefault()
            setDragOverFolderId(node.id)
          }
        }}
        onDragLeave={() => {
          if (dragOverFolderId === node.id) setDragOverFolderId(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOverFolderId(null)
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          height: 32,
          paddingLeft: indentPx,
          paddingRight: 8,
          cursor: 'pointer',
          borderRadius: 6,
          margin: '1px 4px',
          backgroundColor: isSelected ? 'var(--qb-folder-selected-bg)' : isDragOver ? `color-mix(in oklch, var(--brand-color) 15%, var(--background))` : 'transparent',
          outline: isDragOver ? '2px dashed var(--brand-color)' : 'none',
          transition: 'background-color 100ms',
          userSelect: 'none',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setSelectedFolderId(node.id)
          if (e.key === 'ArrowRight' && hasChildren && !isExpanded) toggleFolder(node.id)
          if (e.key === 'ArrowLeft' && isExpanded) toggleFolder(node.id)
        }}
      >
        {/* Chevron */}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) toggleFolder(node.id)
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          style={{
            opacity: hasChildren ? 1 : 0,
            cursor: hasChildren ? 'pointer' : 'default',
            width: 16,
            height: 16,
            padding: 0,
            flexShrink: 0,
          }}
          tabIndex={-1}
        >
          <i
            className={`fa-light ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}
            aria-hidden="true"
            style={{ fontSize: 9 }}
          />
        </Button>

        {/* Icon */}
        <i className={icon.cls} aria-hidden="true"
          style={{ fontSize: 13, color: icon.color, width: 16, textAlign: 'center', flexShrink: 0 }} />

        {/* Name */}
        {isRenaming ? (
          <Input
            ref={renameRef}
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                renameRef.current?.blur()
              }
              if (e.key === 'Escape') {
                setIsRenaming(false)
                setRenameName(node.name)
              }
            }}
            onBlur={() => {
              if (renameName.trim()) {
                renameFolder(node.id, renameName.trim())
                setRenameName(renameName.trim())
              } else {
                setRenameName(node.name)
              }
              setIsRenaming(false)
            }}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, fontSize: 12, color: 'var(--brand-color)', fontWeight: 500 }}
          />
        ) : (
          <span style={{
            flex: 1,
            fontSize: 13,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontWeight: isSelected ? 500 : 400,
            color: isSelected ? 'var(--brand-color)' : 'var(--foreground)',
          }}>
            {node.isCourse ? courseFolderLabel(node.name) : node.name}
          </span>
        )}

        {/* Count */}
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)', flexShrink: 0 }}>
          {folderQuestionCount}
        </span>

        {/* ⋯ context menu — admin only */}
        <FolderContextMenu
          node={node}
          isAdmin={isAdmin}
          onRename={() => {
            setIsRenaming(true)
            setRenameName(node.name)
            setTimeout(() => renameRef.current?.focus(), 50)
          }}
          onAddSubfolder={() => setShowingInlineCreate(true)}
          onChangeIcon={(icon) => setFolderIcon(node.id, icon)}
          onMove={() => setMoveFolderDialogOpen(true)}
          onDelete={() => setDeleteFolderDialogOpen(true)}
        />
      </div>
      {showingInlineCreate && (
        <InlineFolderInput
          depth={depth + 1}
          onConfirm={(name) => {
            createFolder(name, node.id)
            setShowingInlineCreate(false)
          }}
          onCancel={() => setShowingInlineCreate(false)}
        />
      )}
      {moveFolderDialogOpen && (
        <MoveFolderDialog
          node={node}
          open={moveFolderDialogOpen}
          onClose={() => setMoveFolderDialogOpen(false)}
        />
      )}
      {deleteFolderDialogOpen && (
        <DeleteFolderDialog
          node={node}
          open={deleteFolderDialogOpen}
          onClose={() => setDeleteFolderDialogOpen(false)}
        />
      )}
    </div>
  )
}

function FolderTree({
  nodes,
  parentId,
  depth,
  isAdmin,
}: {
  nodes: FolderNode[]
  parentId: string | null
  depth: number
  isAdmin: boolean
}) {
  const { expandedFolderIds } = useQB()
  const children = nodes.filter(n => n.parentId === parentId)

  return (
    <>
      {children.map(node => (
        <div key={node.id}>
          <FolderRow node={node} depth={depth} isAdmin={isAdmin} />
          {expandedFolderIds.has(node.id) && (
            <FolderTree nodes={nodes} parentId={node.id} depth={depth + 1} isAdmin={isAdmin} />
          )}
        </div>
      ))}
    </>
  )
}

export function QBSidebar() {
  const {
    sidebarOpen,
    folders,
    selectedFolderId, setSelectedFolderId,
    navView, setNavView,
    currentPersona,
    expandedFolderIds,
    questions,
    sidebarSearch, setSidebarSearch,
  } = useQB()

  const [inlineCreateParent, setInlineCreateParent] = useState<string | 'root' | null>(null)
  const [searchExpanded, setSearchExpanded] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) {
      setSearchExpanded(false)
      setSidebarSearch('')
    }
  }, [sidebarOpen, setSidebarSearch])

  const isAdmin = currentPersona.role === 'Admin'

  const courseFolders = folders.filter(f => f.isCourse && f.parentId === null)

  const allQCount = questions.length
  const myQCount = questions.filter(q => q.creator === currentPersona.id).length

  const isAllSelected = navView === 'all'
  const isMySelected = navView === 'my'

  // Filter root course folders by search
  const rootFolders = courseFolders
  const filteredRoots = sidebarSearch.trim()
    ? rootFolders.filter(f => {
        const matchesSelf = f.name.toLowerCase().includes(sidebarSearch.toLowerCase())
        const childMatches = folders.some(
          child => child.parentId === f.id && child.name.toLowerCase().includes(sidebarSearch.toLowerCase())
        )
        return matchesSelf || childMatches
      })
    : rootFolders

  // Nav item shared style
  const navItem = (
    active: boolean,
    icon: string,
    label: string,
    count: number,
    onClick: () => void,
  ) => (
    <Button
      variant="ghost"
      onClick={onClick}
      className="w-full justify-start"
      style={{
        padding: '7px 12px',
        height: 34,
        backgroundColor: active ? 'var(--brand-tint)' : 'transparent',
        borderRadius: active ? 6 : 0,
        margin: active ? '0 4px' : '0',
        width: active ? 'calc(100% - 8px)' : '100%',
        color: active ? 'var(--brand-color)' : 'var(--foreground)',
      }}
    >
      <i
        className={active ? `fa-solid ${icon}` : `fa-regular ${icon}`}
        aria-hidden="true"
        style={{ fontSize: 13, color: active ? 'var(--brand-color)' : 'var(--muted-foreground)', width: 16, textAlign: 'center' }}
      />
      <span style={{
        flex: 1, fontSize: 13, textAlign: 'left',
        color: active ? 'var(--brand-color)' : 'var(--foreground)',
        fontWeight: active ? 500 : 400,
      }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: active ? 'var(--brand-color)' : 'var(--muted-foreground)' }}>
        {count}
      </span>
    </Button>
  )

  return (
    <aside
      aria-label="Question Bank Library"
      style={{
        width: sidebarOpen ? 248 : 0,
        minWidth: sidebarOpen ? 248 : 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        overflow: 'hidden',
        transition: 'width 200ms ease, min-width 200ms ease',
        flexShrink: 0,
      }}
    >
      {/* Library header strip */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center',
        padding: '0 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--muted-foreground)',
        }}>
          Library
        </span>
      </div>

      {/* ── Quick Nav: All Questions + My Questions ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '4px 0', flexShrink: 0 }}>
        {navItem(isAllSelected, 'fa-book-open', 'All Questions', allQCount, () => setNavView('all'))}
        {navItem(isMySelected, 'fa-user', 'My Questions', myQCount, () => setNavView('my'))}
      </div>

      {/* Scrollable tree area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>

        {/* ── Question Bank section header with icon-only search ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '4px 8px 4px 12px',
          gap: 4,
          minHeight: 30,
        }}>
          {searchExpanded ? (
            /* Expanded: full search input inline */
            <>
              <InputGroup style={{ flex: 1 }}>
                <Input
                  autoFocus
                  placeholder="Search folders…"
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setSidebarSearch(''); setSearchExpanded(false) } }}
                  style={{ height: 26, fontSize: 12 }}
                />
                <InputGroupAddon align="inline-end">
                  <i className="fa-light fa-magnifying-glass" aria-hidden="true"
                    style={{ fontSize: 11, color: 'var(--muted-foreground)', padding: '0 6px' }} />
                </InputGroupAddon>
              </InputGroup>
              <Button
                variant="ghost" size="icon-xs"
                aria-label="Close search"
                onClick={() => { setSidebarSearch(''); setSearchExpanded(false) }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
              </Button>
            </>
          ) : (
            /* Collapsed: label + search icon button */
            <>
              <span style={{
                flex: 1,
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.07em', color: 'var(--muted-foreground)',
              }}>
                {isAdmin ? 'Question Bank' : 'My Question Bank'}
              </span>
              <Button
                variant="ghost" size="icon-xs"
                aria-label="Search folders"
                onClick={() => setSearchExpanded(true)}
              >
                <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 12 }} />
              </Button>
            </>
          )}
        </div>

        {/* Course → Folders tree */}
        <div role="tree" aria-label="Course tree">
          {filteredRoots.map(course => (
            <div key={course.id}>
              <FolderRow node={course} depth={0} isAdmin={isAdmin} />
              {expandedFolderIds.has(course.id) && (
                <FolderTree nodes={folders} parentId={course.id} depth={1} isAdmin={isAdmin} />
              )}
            </div>
          ))}
        </div>

        {inlineCreateParent === 'root' && (
          <InlineFolderInput
            depth={0}
            onConfirm={() => setInlineCreateParent(null)}
            onCancel={() => setInlineCreateParent(null)}
          />
        )}
      </div>
    </aside>
  )
}
