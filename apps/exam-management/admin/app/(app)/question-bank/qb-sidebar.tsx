'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useQB } from './qb-state'
import type { FolderNode } from '@/lib/qb-types'
import {
  Button, Tip,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  InputGroup, InputGroupAddon, InputGroupInput, Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Separator,
  Popover, PopoverTrigger, PopoverContent,
  FieldError,
  Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty,
} from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings } from '@/lib/qb-mock-data'

const ACTIVE_SEMESTER = 'Spring 2026'

// Determine active/inactive status for a course folder via offerings data
function isCourseActive(folderId: string): boolean {
  const course = mockCourses.find(c => c.questionBankFolderId === folderId)
  if (!course) return false
  return mockCourseOfferings.some(o => o.courseId === course.id && o.semester === ACTIVE_SEMESTER)
}

function courseLabel(folder: FolderNode): string {
  const course = mockCourses.find(c => c.questionBankFolderId === folder.id)
  return course ? `${course.code} · ${course.name}` : folder.name
}


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
  const colorCls = selected ? 'text-foreground' : 'text-muted-foreground'
  if (node.icon) {
    return { cls: `${selected ? 'fa-solid' : 'fa-light'} ${node.icon}`, colorCls }
  }
  if (node.isCourse) return { cls: selected ? 'fa-solid fa-graduation-cap' : 'fa-light fa-graduation-cap', colorCls }
  return {
    cls: expanded ? 'fa-solid fa-folder-open' : (selected ? 'fa-solid fa-folder' : 'fa-regular fa-folder'),
    colorCls,
  }
}

export function DeleteFolderDialog({
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
          <p className="text-sm text-foreground">
            This will permanently delete the folder and all subfolders.
          </p>
          {affectedQuestions.length > 0 && (
            <div style={{
              padding: 12, borderRadius: 8,
              backgroundColor: 'var(--qb-delete-impact-bg)',
              border: '1px solid var(--qb-delete-impact-border)',
            }}>
              <p className="text-xs font-semibold text-destructive" style={{ marginBottom: 6 }}>
                <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ marginRight: 6 }} />
                Impact: {affectedQuestions.length} question{affectedQuestions.length !== 1 ? 's' : ''} will be removed
              </p>
              {usedQuestions.length > 0 && (
                <>
                  <p className="text-xs text-destructive" style={{ marginBottom: 4 }}>
                    {usedQuestions.length} question{usedQuestions.length !== 1 ? 's are' : ' is'} used in assessments:
                  </p>
                  <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {usedQuestions.map(q => (
                      <div key={q.id} className="text-xs text-foreground">
                        · {q.title.slice(0, 60)}{q.title.length > 60 ? '…' : ''}{' '}
                        <span className="text-muted-foreground">
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
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Delete folder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MoveFolderDialog({ node, open, onClose }: { node: FolderNode; open: boolean; onClose: () => void }) {
  const { folders, moveFolder, createFolder, navigateToFolder } = useQB()

  // currentId = null means root (all course folders)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)
  // Validation surface (modal-deep-study §2). Fires on submit attempt
  // when destination isn't a valid move target; clears as soon as navigation
  // moves into a valid destination.
  const [submitError, setSubmitError] = useState<string | null>(null)

  const excludedIds = useMemo(() => getDescendantIds(node.id, folders), [node.id, folders])

  // Breadcrumb path to currentId
  const breadcrumbs = useMemo(() => {
    const path: FolderNode[] = []
    let id: string | null = currentId
    while (id) {
      const f = folders.find(f => f.id === id)
      if (!f) break
      path.unshift(f)
      id = f.parentId
    }
    return path
  }, [currentId, folders])

  // Immediate children of currentId (excluding the folder being moved + its descendants)
  const children = useMemo(() =>
    folders.filter(f => f.parentId === currentId && !excludedIds.has(f.id))
  , [currentId, folders, excludedIds])

  // Reset when dialog reopens
  useEffect(() => {
    if (open) { setCurrentId(null); setIsCreating(false); setNewName(''); setSubmitError(null) }
  }, [open])

  function navigate(id: string | null) {
    setCurrentId(id)
    setIsCreating(false)
    setNewName('')
    setSubmitError(null)
  }

  function handleCreateFolder() {
    const trimmed = newName.trim()
    if (!trimmed || currentId === null) return
    createFolder(trimmed, currentId)
    setIsCreating(false)
    setNewName('')
  }

  const canMoveHere = currentId !== null && currentId !== node.parentId && !excludedIds.has(currentId)

  function handleMoveHere() {
    if (!canMoveHere || !currentId) {
      if (currentId === null) {
        setSubmitError('Pick a destination folder before moving.')
      } else if (currentId === node.parentId) {
        setSubmitError('This is already the current parent folder. Navigate elsewhere.')
      } else {
        setSubmitError('Pick a valid destination folder before moving.')
      }
      return
    }
    const nodeId = node.id
    moveFolder(nodeId, currentId)
    setTimeout(() => navigateToFolder(nodeId), 50)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden"
        style={{ width: 480, height: 500, display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle>Move &quot;{node.name}&quot;</DialogTitle>
        </DialogHeader>

        {/* ── Breadcrumb nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, padding: '0 16px 10px', flexShrink: 0 }}>
          <Button
            variant="ghost" size="xs"
            onClick={() => navigate(null)}
            className={currentId === null ? 'text-xs font-semibold text-foreground' : 'text-xs font-normal'}
          style={{ height: 24, padding: '0 6px', gap: 4, color: currentId !== null ? 'var(--brand-color)' : undefined }}
          >
            <i className="fa-light fa-graduation-cap" aria-hidden="true" style={{ fontSize: 11 }} />
            Question Bank
          </Button>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true" style={{ fontSize: 9 }} />
              <Button
                variant="ghost" size="xs"
                onClick={() => navigate(crumb.id)}
                className={i === breadcrumbs.length - 1 ? 'text-xs font-semibold text-foreground' : 'text-xs font-normal'}
                style={{ height: 24, padding: '0 6px', color: i !== breadcrumbs.length - 1 ? 'var(--brand-color)' : undefined }}
              >
                {crumb.isCourse ? courseFolderLabel(crumb.name) : crumb.name}
              </Button>
            </span>
          ))}
        </div>

        <Separator className="shrink-0" />

        {/* ── Folder list ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children.length === 0 && !isCreating ? (
            <div className="text-muted-foreground" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
              <i className="fa-light fa-folder-open" aria-hidden="true" style={{ fontSize: 28, opacity: 0.35 }} />
              <span className="text-xs">No subfolders here</span>
            </div>
          ) : (
            <div style={{ padding: '4px 0' }}>
              {children.map(f => {
                const hasChildren = folders.some(c => c.parentId === f.id && !excludedIds.has(c.id))
                const label = f.isCourse ? courseFolderLabel(f.name) : f.name
                return (
                  <Button
                    key={f.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(f.id)}
                    className="w-full justify-start gap-[10px]"
                    style={{ padding: '9px 20px', height: 'auto', userSelect: 'none' }}
                  >
                    <i
                      className={`fa-light ${f.isCourse ? 'fa-graduation-cap' : 'fa-folder'} text-muted-foreground`}
                      aria-hidden="true"
                      style={{ fontSize: 14, width: 16, textAlign: 'center', flexShrink: 0 }}
                    />
                    <span className="flex-1 text-sm text-foreground text-left">{label}</span>
                    {hasChildren && (
                      <i className="fa-light fa-chevron-right" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
                    )}
                  </Button>
                )
              })}
              {/* Inline new folder input */}
              {isCreating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px' }}>
                  <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 14, color: 'var(--brand-color)', width: 16, textAlign: 'center', flexShrink: 0 }} />
                  <Input
                    ref={newInputRef}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setIsCreating(false) }}
                    onBlur={() => { if (!newName.trim()) setIsCreating(false) }}
                    placeholder="New folder name…"
                    autoFocus
                    className="text-sm"
                    style={{ flex: 1, height: 30 }}
                  />
                  <Button variant="ghost" size="icon-xs" onClick={handleCreateFolder} aria-label="Confirm">
                    <i className="fa-light fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => setIsCreating(false)} aria-label="Cancel">
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator className="shrink-0" />

        {/* Inline error surface — under list, above footer. */}
        {submitError && (
          <div style={{ padding: '4px 16px 8px', flexShrink: 0 }}>
            <FieldError id="move-folder-sb-error">{submitError}</FieldError>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0 }}>
          <Button
            variant="ghost" size="sm"
            onClick={() => { setIsCreating(true); setTimeout(() => newInputRef.current?.focus(), 50) }}
            disabled={currentId === null || isCreating}
            className="text-xs"
            style={{ gap: 6 }}
          >
            <i className="fa-light fa-folder-plus" aria-hidden="true" style={{ fontSize: 12 }} />
            New folder
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleMoveHere}
              aria-invalid={!!submitError}
              aria-describedby={submitError ? 'move-folder-sb-error' : undefined}
            >
              Move here
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function FolderContextMenu({
  node,
  isAdmin,
  onRename,
  onAddSubfolder,
  onMove,
  onDelete,
  onOpenChange,
  alwaysVisible = false,
}: {
  node: FolderNode
  isAdmin: boolean
  onRename: () => void
  onAddSubfolder: () => void
  onMove: () => void
  onDelete: () => void
  onOpenChange?: (open: boolean) => void
  alwaysVisible?: boolean
}) {
  const { setCollaboratorsModalFolderId, setFolderPrivacy, pinnedFolderIds, toggleFolderPin } = useQB()
  const isPrivate = !!node.isPrivateSpace
  const isPinned = pinnedFolderIds.has(node.id)

  return (
    <DropdownMenu modal={false} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Folder options"
          className={alwaysVisible ? 'shrink-0' : 'qb-folder-menu-btn shrink-0'}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis-vertical" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onCloseAutoFocus={e => e.preventDefault()}>
        {/* Pin / Unpin — available on course shells and subfolders */}
        <DropdownMenuItem onClick={() => toggleFolderPin(node.id)}>
          <i className={`fa-light ${isPinned ? 'fa-thumbtack-slash' : 'fa-thumbtack'}`} aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          {isPinned ? 'Unpin' : 'Pin to top'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAddSubfolder()}>
          <i className="fa-light fa-folder-plus" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          New Subfolder
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => setCollaboratorsModalFolderId(node.id)}>
              <i className="fa-light fa-users" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
              Manage Access
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFolderPrivacy(node.id, !isPrivate)}>
              <i
                className={`fa-light ${isPrivate ? 'fa-lock-open' : 'fa-lock'}`}
                aria-hidden="true"
                style={{ fontSize: 12, width: 14 }}
              />
              {isPrivate ? 'Make public' : 'Make private'}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onRename()}>
          <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
          Rename
        </DropdownMenuItem>
        {!node.isCourse && (
          <DropdownMenuItem onClick={() => onMove()}>
            <i className="fa-light fa-arrow-right-to-bracket" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
            Move to subfolder
          </DropdownMenuItem>
        )}
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
    // 200ms delay lets Radix DropdownMenu finish focus restoration before we steal focus
    const t = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [])

  function confirm() {
    if (cancelledRef.current) return
    if (name.trim()) onConfirm(name.trim())
    else onCancel()
  }

  function handleBlur() {
    if (cancelledRef.current) return
    // Only auto-confirm on blur if the user typed something — never dismiss empty input on blur
    // (Radix returns focus to the ⋯ trigger after DropdownMenu closes, which would fire blur
    // before the user has a chance to type, causing the input to vanish immediately)
    if (name.trim()) onConfirm(name.trim())
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
        onBlur={handleBlur}
        className="text-xs"
        style={{ flex: 1 }}
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

const BLOOMS_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const

function FolderDiffPopover({ folderId }: { folderId: string }) {
  const { folders, questions } = useQB()

  const folder = folders.find(f => f.id === folderId)
  const folderLabel = folder ? (folder.isCourse ? courseFolderLabel(folder.name) : folder.name) : ''

  const folderIds = getDescendantIds(folderId, folders)
  const folderQuestions = questions.filter(q => folderIds.has(q.folder))

  const total  = folderQuestions.length
  const easy   = folderQuestions.filter(q => q.difficulty === 'Easy').length
  const medium = folderQuestions.filter(q => q.difficulty === 'Medium').length
  const hard   = folderQuestions.filter(q => q.difficulty === 'Hard').length

  const withPbis = folderQuestions.filter(q => q.pbis !== null)
  const avgPbis  = withPbis.length > 0
    ? (withPbis.reduce((sum, q) => sum + (q.pbis ?? 0), 0) / withPbis.length)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="text-sm font-semibold text-foreground" style={{ lineHeight: 1.35, wordBreak: 'break-word', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {folderLabel}
      </div>

      {total === 0 ? (
        <p className="text-xs text-muted-foreground">No questions yet</p>
      ) : (
        <>
          <div className="text-xs font-semibold text-foreground">
            {total} question{total !== 1 ? 's' : ''}
          </div>

          {/* Difficulty */}
          <div>
            <div className="text-xs font-medium text-muted-foreground" style={{ marginBottom: 5 }}>Difficulty</div>
            <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
              {easy   > 0 && <div style={{ flex: easy,   background: 'var(--qb-diff-bar-easy)' }} />}
              {medium > 0 && <div style={{ flex: medium, background: 'var(--qb-diff-bar-medium)' }} />}
              {hard   > 0 && <div style={{ flex: hard,   background: 'var(--qb-diff-bar-hard)' }} />}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'nowrap' }}>
              {([['Easy', easy, 'var(--qb-diff-bar-easy)'], ['Medium', medium, 'var(--qb-diff-bar-medium)'], ['Hard', hard, 'var(--qb-diff-bar-hard)']] as const).map(([label, count, color]) =>
                count > 0 && (
                  <span key={label} className="text-xs inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
                    {label}: {count}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Bloom's */}
          <div>
            <div className="text-xs font-medium text-muted-foreground" style={{ marginBottom: 5 }}>Bloom&apos;s</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {BLOOMS_ORDER.map(level => {
                const count = folderQuestions.filter(q => q.blooms === level).length
                if (count === 0) return null
                const pct = Math.round(count / total * 100)
                return (
                  <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="text-xs text-muted-foreground" style={{ width: 62, flexShrink: 0 }}>{level}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--muted)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--qb-blooms-bar)', borderRadius: 2 }} />
                    </div>
                    <span className="text-xs font-medium text-foreground" style={{ width: 18, textAlign: 'right', flexShrink: 0 }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Avg. pBIS:{' '}
            <span className="font-semibold text-foreground">
              {avgPbis !== null ? avgPbis.toFixed(2) : '—'}
            </span>
            {withPbis.length < total && ` (${withPbis.length} of ${total} scored)`}
          </div>
        </>
      )}
    </div>
  )
}

function FolderRow({
  node,
  depth,
  isAdmin,
  subtitle,
  fullSubtitle,
}: {
  node: FolderNode
  depth: number
  isAdmin: boolean
  subtitle?: string
  fullSubtitle?: string
}) {
  const {
    selectedFolderId, setSelectedFolderId,
    expandedFolderIds, toggleFolder,
    folders,
    questions,
    currentPersona,
    draggedQuestionId, setDragOverFolderId, dragOverFolderId,
    draggedFolderId, setDraggedFolderId,
    highlightedFolderId,
    renameFolder,
    createFolder,
    setFolderIcon,
    dialogActive, setDialogActive,
    accessibleFolderIds,
    pinnedFolderIds,
  } = useQB()

  const subtreeIds = getDescendantIds(node.id, folders)
  const folderQuestionCount = questions.filter(q =>
    subtreeIds.has(q.folder) &&
    (isAdmin || q.status === 'Saved' || q.creator === currentPersona.id)
  ).length

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState(node.name)
  const [showingInlineCreate, setShowingInlineCreate] = useState(false)
  const [moveFolderDialogOpen, setMoveFolderDialogOpen] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showFullPath, setShowFullPath] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)
  const [hoverOpen, setHoverOpen] = useState(false)
  const [isRowHovered, setIsRowHovered] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleMouseEnter() {
    if (dialogActive) return
    setIsRowHovered(true)
    hoverTimerRef.current = setTimeout(() => setHoverOpen(true), 600)
  }
  function handleMouseLeave() {
    if (dialogActive || menuOpen) return
    setIsRowHovered(false)
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoverOpen(false)
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  // Sync global dialogActive when this row's dialogs open or close
  useEffect(() => {
    setDialogActive(moveFolderDialogOpen || deleteFolderDialogOpen)
  }, [moveFolderDialogOpen, deleteFolderDialogOpen, setDialogActive])

  // Reset hover state when a dialog becomes active (from any row)
  useEffect(() => {
    if (dialogActive) {
      setIsRowHovered(false)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      setHoverOpen(false)
    }
  }, [dialogActive])

  const isSelected = selectedFolderId === node.id
  const isExpanded = expandedFolderIds.has(node.id)
  const isDragOver = dragOverFolderId === node.id
  const hasChildren = folders.some(f => f.parentId === node.id)
  const icon = getFolderIcon(node, isExpanded, isSelected)

  const clampedDepth = Math.min(depth, 3)
  const indentPx = 8 + clampedDepth * 16

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocused(false) }}
    >
      <Popover open={hoverOpen} onOpenChange={setHoverOpen}>
        <PopoverTrigger asChild>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="center"
          sideOffset={10}
          className="w-64 p-3"
          style={{ overflow: 'visible' }}
        >
          {/* Caret pointing left toward the tree node */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
              width: 0, height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: '7px solid var(--popover)',
              filter: 'drop-shadow(-2px 0 0 var(--border))',
            }}
          />
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
          position: 'relative',
          display: 'flex', alignItems: 'center', gap: 4,
          minHeight: 28,
          paddingBlock: 2,
          paddingLeft: indentPx,
          paddingRight: 8,
          cursor: 'pointer',
          borderRadius: 6,
          margin: '0 4px',
          backgroundColor: isSelected
            ? 'var(--qb-folder-selected-bg)'
            : isDragOver
            ? `color-mix(in oklch, var(--brand-color) 15%, var(--background))`
            : isRowHovered
            ? 'var(--interactive-hover)'
            : 'transparent',
          outline: isDragOver ? '2px dashed var(--brand-color)' : 'none',
          transition: 'background-color 100ms',
          userSelect: 'none',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFolderId(node.id) }
          if (e.key === 'ArrowRight' && hasChildren && !isExpanded) { e.preventDefault(); toggleFolder(node.id) }
          if (e.key === 'ArrowLeft' && isExpanded) { e.preventDefault(); toggleFolder(node.id) }
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            const items = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'))
            const idx = items.indexOf(e.currentTarget as HTMLElement)
            const next = e.key === 'ArrowDown' ? items[idx + 1] : items[idx - 1]
            next?.focus()
          }
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

        {/* Pin indicator — left of folder icon, only when pinned */}
        {pinnedFolderIds.has(node.id) && (
          <i className="fa-solid fa-thumbtack" aria-label="Pinned to top" style={{ fontSize: 8, color: 'var(--brand-color)', opacity: 0.75, flexShrink: 0, marginRight: -2 }} />
        )}

        {/* Icon */}
        <i className={`${icon.cls} ${icon.colorCls}`} aria-hidden="true"
          style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }} />

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
            className="text-xs font-medium"
            style={{ flex: 1, color: 'var(--brand-color)' }}
          />
        ) : (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span className={`text-sm text-foreground ${isSelected ? 'font-medium' : 'font-normal'}`}
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.isCourse ? courseFolderLabel(node.name) : node.name}
            </span>
            {subtitle && (() => {
              const canExpand = !!(fullSubtitle && fullSubtitle !== subtitle)
              const displayed = (showFullPath && fullSubtitle) ? fullSubtitle : subtitle
              const toggle = (e: React.SyntheticEvent) => { e.stopPropagation(); if (canExpand) setShowFullPath(v => !v) }
              return (
                <span
                  className="text-xs text-muted-foreground"
                  role={canExpand ? 'button' : undefined}
                  tabIndex={canExpand ? 0 : undefined}
                  aria-label={canExpand ? (showFullPath ? 'Collapse path' : 'Expand full path') : undefined}
                  aria-expanded={canExpand ? showFullPath : undefined}
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: canExpand ? 'pointer' : 'default' }}
                  onClick={toggle}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e) } }}
                >
                  {displayed}{!showFullPath && canExpand && ' ···'}
                </span>
              )
            })()}
          </div>
        )}

        {/* Count + lock icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          {node.isPrivateSpace && (
            <i className="fa-light fa-lock text-muted-foreground shrink-0" aria-label="Private folder" style={{ fontSize: 10 }} />
          )}
          <span className="text-[10px] text-muted-foreground shrink-0">{folderQuestionCount}</span>
        </div>

        {/* ⋯ context menu — absolute overlay on the right, appears on hover */}
        {(isAdmin || accessibleFolderIds.has(node.id)) && (
          <div style={{
            position: 'absolute',
            right: 4,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: (isRowHovered || isFocused || menuOpen) ? 1 : 0,
            pointerEvents: (isRowHovered || isFocused || menuOpen) ? 'auto' : 'none',
            transition: 'opacity 100ms',
            zIndex: 1,
            backgroundColor: isSelected ? 'var(--qb-folder-selected-bg)' : isRowHovered ? 'var(--interactive-hover)' : 'transparent',
            borderRadius: 4,
          }}>
            <FolderContextMenu
              node={node}
              isAdmin={isAdmin}
              onOpenChange={setMenuOpen}
              onRename={() => {
                setIsRenaming(true)
                setRenameName(node.name)
                setTimeout(() => { renameRef.current?.focus(); renameRef.current?.select() }, 80)
              }}
              onAddSubfolder={() => setShowingInlineCreate(true)}
              onMove={() => setMoveFolderDialogOpen(true)}
              onDelete={() => setDeleteFolderDialogOpen(true)}
            />
          </div>
        )}
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
    sidebarOpen, setSidebarOpen,
    folders,
    selectedFolderId, setSelectedFolderId,
    navView, setNavView,
    currentPersona,
    expandedFolderIds,
    questions,
    sidebarSearch, setSidebarSearch,
    accessibleFolderIds,
    createFolder,
    navigateToFolder,
    pinnedFolderIds,
  } = useQB()

  // Switch between search UIs: 'input' = always-visible InputGroup (Option A),
  // 'command' = DS Command component (Option B). Change to switch.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const SEARCH_VARIANT = ('input' as 'input' | 'command')

  const [inlineCreateParent, setInlineCreateParent] = useState<string | 'root' | null>(null)
  const [isNarrow, setIsNarrow] = useState(false)
  // Zoom ≥ ~350% regardless of monitor size — sidebar tree switches to page scroll.
  const [isHighZoom, setIsHighZoom] = useState(false)
  // Inactive section collapsed by default — toggle to expand.
  // To revert to flat list: remove this state + the grouping render below.
  const [inactiveExpanded, setInactiveExpanded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1280px)')
    const update = () => setIsNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => {
      const ratio = window.screen.width / window.innerWidth
      setIsHighZoom(ratio >= 3.5)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!sidebarOpen) {
      setSidebarSearch('')
    }
  }, [sidebarOpen, setSidebarSearch])

  const isAdmin = currentPersona.role === 'exam_admin'

  const courseFolders = folders.filter(f => f.isCourse && f.parentId === null)

  // All personas (including admins) respect accessibleFolderIds — private folders
  // are excluded from accessibleFolderIds for personas not in their collaborators list
  const visibleFolders = folders.filter(f => accessibleFolderIds.has(f.id))
  const visibleCourseFolders = courseFolders.filter(f => accessibleFolderIds.has(f.id))

  const accessibleQuestions = isAdmin
    ? questions
    : questions.filter(q => accessibleFolderIds.has(q.folder))
  // Only count questions visible to this user (Saved + own Drafts)
  const countableQuestions = accessibleQuestions.filter(q =>
    q.status === 'Saved' || (q.status === 'Draft' && q.creator === currentPersona.id)
  )
  const allQCount = countableQuestions.length
  const myQCount = countableQuestions.filter(q => q.creator === currentPersona.id).length

  const isAllSelected = navView === 'all'
  const isMySelected = navView === 'my'

  // Filter root course folders by search (used for normal grouped tree when not deep-searching)
  const filteredRoots = sidebarSearch.trim()
    ? visibleCourseFolders.filter(f => {
        const matchesSelf = f.name.toLowerCase().includes(sidebarSearch.toLowerCase())
        const childMatches = visibleFolders.some(
          child => child.parentId === f.id && child.name.toLowerCase().includes(sidebarSearch.toLowerCase())
        )
        return matchesSelf || childMatches
      })
    : visibleCourseFolders

  // Full ancestor path — used for tooltip / detail
  function getFolderParentPath(folderId: string): string {
    const parts: string[] = []
    let current = visibleFolders.find(f => f.id === folderId)
    let parentId = current?.parentId ?? null
    while (parentId) {
      const parent = visibleFolders.find(f => f.id === parentId)
      if (!parent) break
      parts.unshift(parent.isCourse ? courseFolderLabel(parent.name) : parent.name)
      parentId = parent.parentId
    }
    return parts.join(' / ')
  }

  // Last 2 ancestor segments for the short subtitle
  function getFolderShortPath(folderId: string): string | null {
    const parts: string[] = []
    let current = visibleFolders.find(f => f.id === folderId)
    let parentId = current?.parentId ?? null
    while (parentId) {
      const parent = visibleFolders.find(f => f.id === parentId)
      if (!parent) break
      parts.unshift(parent.isCourse ? courseFolderLabel(parent.name) : parent.name)
      parentId = parent.parentId
    }
    if (!parts.length) return null
    return parts.slice(-2).join(' / ')
  }

  // Full path with … midway if more than 3 segments
  function getFolderFullPath(folderId: string): string | null {
    const parts: string[] = []
    let current = visibleFolders.find(f => f.id === folderId)
    let parentId = current?.parentId ?? null
    while (parentId) {
      const parent = visibleFolders.find(f => f.id === parentId)
      if (!parent) break
      parts.unshift(parent.isCourse ? courseFolderLabel(parent.name) : parent.name)
      parentId = parent.parentId
    }
    if (!parts.length) return null
    if (parts.length <= 3) return parts.join(' / ')
    return `${parts[0]} / … / ${parts[parts.length - 2]} / ${parts[parts.length - 1]}`
  }

  const flatSearchResults = sidebarSearch.trim()
    ? visibleFolders.filter(f =>
        f.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        courseFolderLabel(f.name).toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : []

  // Nav item — consistent layout, active state is visual-only (no size change)
  const navItem = (
    active: boolean,
    icon: string,
    label: string,
    count: number,
    onClick: () => void,
  ) => (
    <div style={{ margin: '0 4px' }}>
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="w-full justify-start text-foreground"
      style={{
        paddingLeft: 8,
        paddingRight: 8,
        height: 28,
        backgroundColor: active ? 'var(--sidebar-accent)' : 'transparent',
        borderRadius: 6,
      }}
    >
      <i
        className={`${active ? `fa-solid ${icon}` : `fa-regular ${icon}`} ${active ? 'text-foreground' : 'text-muted-foreground'}`}
        aria-hidden="true"
        style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}
      />
      <span className={`flex-1 text-sm text-left text-foreground ${active ? 'font-medium' : 'font-normal'}`}>
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {count}
      </span>
    </Button>
    </div>
  )

  // ── Active / Inactive grouping ──────────────────────────────────────────
  // Split filteredRoots by semester. Pinned courses always sort first within each group.
  const sortByPin = (a: typeof filteredRoots[0], b: typeof filteredRoots[0]) => {
    const aPin = pinnedFolderIds.has(a.id) ? 0 : 1
    const bPin = pinnedFolderIds.has(b.id) ? 0 : 1
    return aPin - bPin
  }
  const activeCourses   = filteredRoots.filter(f => isCourseActive(f.id)).sort(sortByPin)
  const inactiveCourses = filteredRoots.filter(f => !isCourseActive(f.id)).sort(sortByPin)
  const isSearching     = sidebarSearch.trim().length > 0

  return (
    <>

      {/* Backdrop — only visible when sidebar is open and overlaying the table */}
      {isNarrow && sidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 40,
            backgroundColor: 'oklch(0 0 0 / 0.25)',
          }}
        />
      )}
    <aside
      aria-label="Question Bank Library"
      style={{
        width: sidebarOpen ? 248 : 0,
        minWidth: sidebarOpen ? 248 : 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
        backgroundColor: 'var(--background)',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollbarWidth: 'thin' as const,
        scrollbarColor: 'var(--border) transparent',
        transition: 'width 200ms ease, min-width 200ms ease',
        flexShrink: 0,
        ...(isNarrow ? {
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          boxShadow: sidebarOpen ? '4px 0 16px oklch(0 0 0 / 0.12)' : 'none',
        } : {}),
      }}
    >
      {/* Library header strip */}
      <div style={{
        height: 28, display: 'flex', alignItems: 'center',
        padding: '0 12px', flexShrink: 0,
      }}>
        <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
          Library
        </span>
      </div>

      {/* ── Quick Nav: All Questions + My Questions ── */}
      <div style={{ padding: '1px 0 8px', flexShrink: 0 }}>
        {navItem(isAllSelected, 'fa-book-open', 'All Questions', allQCount, () => setNavView('all'))}
        {navItem(isMySelected, 'fa-user', 'My Questions', myQCount, () => setNavView('my'))}
      </div>

      {/* ── Question Bank label + search — fixed, never scrolls ── */}
      {SEARCH_VARIANT === 'input' ? (
        <div style={{ flexShrink: 0, padding: '4px 8px 4px' }}>
          <div style={{ padding: '0 4px 3px' }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Question Bank
            </span>
          </div>
          {/* Subtle sidebar search — same scale as nav items */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i
              className="fa-light fa-magnifying-glass text-muted-foreground"
              aria-hidden="true"
              style={{ position: 'absolute', left: 8, fontSize: 11, pointerEvents: 'none', zIndex: 1 }}
            />
            <Input
              placeholder="Search folders…"
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setSidebarSearch('') }}
              aria-label="Search folders"
              style={{
                height: 28,
                paddingLeft: 26,
                paddingRight: sidebarSearch ? 28 : 8,
                fontSize: 12,
                backgroundColor: 'var(--muted)',
                border: '1px solid transparent',
                borderRadius: 5,
              }}
            />
            {sidebarSearch && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => setSidebarSearch('')}
                style={{ position: 'absolute', right: 2, width: 22, height: 22 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
              </Button>
            )}
          </div>
          {isSearching && (
            <div style={{ padding: '3px 4px 0' }}>
              <span className="text-[10px] text-muted-foreground">
                {flatSearchResults.length} result{flatSearchResults.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Option B: DS Command search */
        <div style={{ flexShrink: 0 }}>
          <Command className="rounded-none border-0 shadow-none bg-transparent">
            <CommandInput
              placeholder="Search folders…"
              value={sidebarSearch}
              onValueChange={setSidebarSearch}
              className="text-xs h-8"
            />
          </Command>
        </div>
      )}

      {/* Tree — at normal zoom: own scroll container (flex:1); at 400% zoom: flows into aside scroll */}
      <div style={isHighZoom
        ? { flexShrink: 0, overflowX: 'hidden', paddingTop: 2, paddingBottom: 8 }
        : { flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 2, paddingBottom: 8 }
      }>

        {/* Command variant search results */}
        {SEARCH_VARIANT === 'command' && isSearching ? (
          <Command className="rounded-none border-0 shadow-none bg-transparent">
            <CommandList>
              <CommandEmpty>No folders match</CommandEmpty>
              <CommandGroup heading="Active">
                {flatSearchResults.filter(f => f.isCourse && isCourseActive(f.id)).map(f => {
                  const parentPath = getFolderParentPath(f.id)
                  return (
                    <CommandItem
                      key={f.id}
                      onSelect={() => { navigateToFolder(f.id); setSidebarSearch('') }}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <i className="fa-light fa-graduation-cap" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                        <span className="text-sm text-foreground">{f.isCourse ? courseFolderLabel(f.name) : f.name}</span>
                      </div>
                      {parentPath && <span className="text-xs text-muted-foreground pl-5">{parentPath}</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              <CommandGroup heading="Folders">
                {flatSearchResults.filter(f => !f.isCourse).map(f => {
                  const parentPath = getFolderParentPath(f.id)
                  return (
                    <CommandItem
                      key={f.id}
                      onSelect={() => { navigateToFolder(f.id); setSidebarSearch('') }}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                        <span className="text-sm text-foreground">{f.name}</span>
                      </div>
                      {parentPath && <span className="text-xs text-muted-foreground pl-5">{parentPath}</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : null}

        {/* Input variant search results (flat deep-search list) */}
        {SEARCH_VARIANT === 'input' && isSearching && (
          flatSearchResults.length === 0 ? (
            <div className="text-xs text-muted-foreground" style={{ padding: '8px 12px' }}>
              No folders match
            </div>
          ) : (
            flatSearchResults.map(f => (
              <div key={f.id}>
                <FolderRow
                  node={f}
                  depth={0}
                  isAdmin={isAdmin}
                  subtitle={getFolderShortPath(f.id) || undefined}
                  fullSubtitle={getFolderFullPath(f.id) || undefined}
                />
                {expandedFolderIds.has(f.id) && (
                  <FolderTree nodes={visibleFolders} parentId={f.id} depth={1} isAdmin={isAdmin} />
                )}
              </div>
            ))
          )
        )}

        <div role="tree" aria-label="Course tree">

          {/* All courses — pinned first, then active, then inactive */}
          {!(SEARCH_VARIANT === 'input' && isSearching) && [...filteredRoots].sort(sortByPin).map(course => (
            <div key={course.id}>
              <FolderRow node={course} depth={0} isAdmin={isAdmin} />
              {expandedFolderIds.has(course.id) && (
                <FolderTree nodes={visibleFolders} parentId={course.id} depth={1} isAdmin={isAdmin} />
              )}
            </div>
          ))}

          {!isAdmin && accessibleFolderIds.size === 0 && (
            <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              {/* Illustration */}
              <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 22, color: 'var(--brand-color)' }} />
                <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', border: '1.5px solid var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 8, color: 'var(--brand-color)' }} />
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground" style={{ marginBottom: 4, lineHeight: 1.4 }}>Your question banks will appear here</p>
                <p className="text-xs text-muted-foreground" style={{ lineHeight: 1.5 }}>Once your department admin shares a course folder with you, it&apos;ll show up right here — ready to use.</p>
              </div>
            </div>
          )}
        </div>

        {inlineCreateParent !== null && (
          <InlineFolderInput
            depth={inlineCreateParent === 'root' ? 0 : 1}
            onConfirm={(name) => {
              createFolder(name, inlineCreateParent === 'root' ? null : inlineCreateParent)
              setInlineCreateParent(null)
            }}
            onCancel={() => setInlineCreateParent(null)}
          />
        )}
      </div>{/* end tree scroll div */}
    </aside>
    </>
  )
}
