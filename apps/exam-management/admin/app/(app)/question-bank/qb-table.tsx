'use client'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useQB } from './qb-state'
import { StatusBadge, DiffBadge, PBisCell, BloomsBadge } from '@/components/qb/badges'
import { QBToggle } from '@/components/qb/toggle'
import {
  Button, Badge, Checkbox, Input,
  Avatar, AvatarFallback,
  Sheet, SheetContent, SheetTitle,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel,
  Popover, PopoverTrigger, PopoverContent,
  Tooltip, TooltipTrigger, TooltipContent, Tip,
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  TableHeader, TableBody, TableRow, TableHead, TableCell,
  FieldError,
} from '@exxat/ds/packages/ui/src'
import type { Question, QStatus, ColumnId } from '@/lib/qb-types'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'
import { RequestEditAccessModal } from './qb-modals'
import { QBTitle } from './qb-title'
import { EmptyState } from '@/components/empty-state'

/**
 * `DropdownMenuContent` re-typed with `onOpenAutoFocus`. Radix's
 * `react-menu@2.1.16` intentionally OMITs this prop from its public types
 * (it lives in `MenuContentImplPrivateProps`, which `MenuRootContentTypeProps`
 * Omits), but the prop is still wired through at runtime — `MenuContentImpl`
 * accepts it via spread. The DS wrapper spreads all `...props` to
 * `DropdownMenuPrimitive.Content`, so the callback reaches the FocusScope
 * intact. We need this to keep focus on the inline column-search input when
 * a column-header menu opens (without it, Radix grabs focus and the
 * `autoFocus` race steals back inconsistently). Caught 2026-05-11 by typecheck.
 */
type DropdownMenuContentWithOpenFocusProps =
  React.ComponentProps<typeof DropdownMenuContent> & {
    onOpenAutoFocus?: (event: Event) => void
  }
const DropdownMenuContentEx = DropdownMenuContent as unknown as React.FC<
  DropdownMenuContentWithOpenFocusProps
>

// ── Folder Tree Picker (shared by single + bulk move dialogs) ─────────────────
function courseFolderShortLabel(name: string): string {
  const match = name.match(/^([A-Z0-9]+)\s/)
  return match ? `${match[1]} · Question Bank` : name
}

function FolderTreePicker({
  currentFolderId,
  value,
  onChange,
  inlineCreateInFolderId,
  onInlineCreateDone,
  multiSelect = false,
  selectedIds = [],
  onToggle,
}: {
  currentFolderId: string | null
  value: string | null
  onChange: (id: string) => void
  inlineCreateInFolderId: string | null
  onInlineCreateDone: () => void
  multiSelect?: boolean
  selectedIds?: string[]
  onToggle?: (id: string) => void
}) {
  const { folders, accessibleFolderIds, currentPersona, createFolder } = useQB()
  const isExamAdmin = currentPersona.role === 'exam_admin'
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const [inlineNewName, setInlineNewName] = useState('')
  const inlineInputRef = useRef<HTMLInputElement>(null)

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const init = new Set<string>()
    folders.filter(f => f.isCourse).forEach(f => init.add(f.id))
    return init
  })

  // When inline create activates, expand the target folder and focus the input
  useEffect(() => {
    if (inlineCreateInFolderId) {
      setExpanded(prev => { const n = new Set(prev); n.add(inlineCreateInFolderId); return n })
      setInlineNewName('')
      setTimeout(() => inlineInputRef.current?.focus(), 50)
    }
  }, [inlineCreateInFolderId])

  function toggle(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function getFolderLabel(node: typeof folders[number]) {
    return node.isCourse ? courseFolderShortLabel(node.name) : node.name
  }

  function getAncestorPath(node: typeof folders[number]): string {
    const parts: string[] = []
    let cur = folders.find(f => f.id === node.parentId)
    while (cur) {
      parts.unshift(getFolderLabel(cur))
      cur = cur.parentId ? folders.find(f => f.id === cur!.parentId) : undefined
    }
    return parts.join(' › ')
  }

  function handleInlineCreate() {
    const name = inlineNewName.trim()
    if (!name || !inlineCreateInFolderId) return
    createFolder(name, inlineCreateInFolderId)
    setInlineNewName('')
    onInlineCreateDone()
  }

  function cancelInlineCreate() {
    setInlineNewName('')
    onInlineCreateDone()
  }

  function renderNode(node: typeof folders[number], depth: number): React.ReactNode {
    const children = folders.filter(f => f.parentId === node.id)
    const showingInline = inlineCreateInFolderId === node.id
    const hasChildren = children.length > 0 || showingInline
    const isExpanded = expanded.has(node.id)
    const isCurrent = node.id === currentFolderId
    const isSelected = multiSelect ? selectedIds.includes(node.id) : value === node.id
    const isEligible = !isCurrent && (isExamAdmin || accessibleFolderIds.has(node.id))
    const indentPx = 8 + depth * 20
    const childIndentPx = 8 + (depth + 1) * 20

    return (
      <React.Fragment key={node.id}>
        <div
          onClick={() => { if (isEligible) { multiSelect ? onToggle?.(node.id) : onChange(node.id); if (!multiSelect && hasChildren) setExpanded(prev => { const n = new Set(prev); n.add(node.id); return n }) } }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            paddingLeft: indentPx, paddingRight: 8, height: 36,
            borderRadius: 6, margin: '1px 0',
            cursor: (isCurrent || !isEligible) ? 'default' : 'pointer',
            backgroundColor: isSelected ? 'var(--sidebar-accent)' : 'transparent',
            border: `1px solid ${isSelected ? 'var(--sidebar-border)' : 'transparent'}`,
            opacity: isCurrent ? 0.45 : 1,
            transition: 'background 80ms',
          }}
          onMouseEnter={e => { if (isEligible && !isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--accent)' }}
          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
        >
          <Button
            variant="ghost" size="icon-xs"
            tabIndex={-1}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            onClick={e => toggle(node.id, e)}
            style={{
              width: 16, height: 16, padding: 0, flexShrink: 0,
              cursor: hasChildren ? 'pointer' : 'default', opacity: hasChildren ? 1 : 0,
            }}
            className="text-muted-foreground"
          >
            <i className="fa-light fa-chevron-right" aria-hidden="true"
              style={{ fontSize: 9, transition: 'transform 150ms', transform: isExpanded ? 'rotate(90deg)' : 'none' }} />
          </Button>
          <i className={`fa-light ${node.isCourse ? 'fa-graduation-cap' : isExpanded && hasChildren ? 'fa-folder-open' : 'fa-folder'} ${isSelected ? '' : 'text-muted-foreground'}`}
            aria-hidden="true"
            style={{ fontSize: 12, flexShrink: 0, color: isSelected ? 'var(--sidebar-accent-foreground)' : undefined }}
          />
          <span className={`flex-1 text-sm truncate ${isSelected ? 'font-medium' : 'font-normal text-foreground'}`}
            style={{ color: isSelected ? 'var(--sidebar-accent-foreground)' : undefined }}>
            {getFolderLabel(node)}
          </span>
          {isCurrent && <span className="text-[10px] text-muted-foreground shrink-0">current</span>}
          {isSelected && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--sidebar-accent-foreground)', flexShrink: 0 }} />}
        </div>
        {isExpanded && (
          <>
            {children.map(child => renderNode(child, depth + 1))}
            {/* Inline new folder row — appears at the bottom of children, correctly indented */}
            {showingInline && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                paddingLeft: childIndentPx, paddingRight: 8, height: 34,
                borderRadius: 6, margin: '1px 0',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--muted)',
              }}>
                <div style={{ width: 16, flexShrink: 0 }} />
                <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                <Input
                  ref={inlineInputRef}
                  value={inlineNewName}
                  onChange={e => setInlineNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleInlineCreate(); if (e.key === 'Escape') cancelInlineCreate() }}
                  placeholder="Folder name…"
                  className="text-sm text-foreground"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', minWidth: 0, height: 'auto', padding: 0 }}
                  aria-label="New folder name"
                />
                <Button size="icon-xs" variant="ghost" onClick={handleInlineCreate} disabled={!inlineNewName.trim()} aria-label="Create folder"
                  style={{ color: 'var(--brand-color)', flexShrink: 0 }}>
                  <i className="fa-light fa-check" aria-hidden="true" style={{ fontSize: 11 }} />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={cancelInlineCreate} aria-label="Cancel"
                  style={{ flexShrink: 0 }}>
                  <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                </Button>
              </div>
            )}
          </>
        )}
      </React.Fragment>
    )
  }

  const query = search.trim().toLowerCase()
  const searchResults = query
    ? folders.filter(f => {
        if (f.id === currentFolderId) return false
        if (!isExamAdmin && !accessibleFolderIds.has(f.id)) return false
        return getFolderLabel(f).toLowerCase().includes(query)
      })
    : null

  const courseFolders = folders.filter(f => f.isCourse && f.parentId === null)

  return (
    <div>
      {/* Search */}
      <div style={{ padding: '8px 12px' }}>
        <InputGroup style={{ borderColor: 'var(--brand-color)', boxShadow: '0 0 0 3px color-mix(in oklch, var(--brand-color) 18%, transparent)' }}>
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-magnifying-glass" aria-hidden="true"
              style={{ fontSize: 12, color: 'var(--brand-color)', padding: '0 6px' }} />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            placeholder="Search folders…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm"
            style={{ height: 36 }}
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" tabIndex={-1}
                onClick={() => { setSearch(''); searchRef.current?.focus() }}
                aria-label="Clear search"
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      {/* Tree or search results */}
      <div style={{ height: 256, overflowY: 'auto', padding: '0 8px 8px' }}>
        {searchResults ? (
          searchResults.length > 0 ? searchResults.map(f => {
            const isSelected = multiSelect ? selectedIds.includes(f.id) : value === f.id
            const ancestorPath = getAncestorPath(f)
            return (
              <div key={f.id}
                onClick={() => multiSelect ? onToggle?.(f.id) : onChange(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 8px', borderRadius: 6, margin: '1px 0', cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--sidebar-accent)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--sidebar-border)' : 'transparent'}`,
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--accent)' }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
              >
                <i className={`fa-light ${f.isCourse ? 'fa-graduation-cap' : 'fa-folder'} ${isSelected ? '' : 'text-muted-foreground'}`} aria-hidden="true"
                  style={{ fontSize: 12, color: isSelected ? 'var(--sidebar-accent-foreground)' : undefined, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={`text-sm truncate ${isSelected ? 'font-medium' : 'font-normal text-foreground'}`}
                    style={{ color: isSelected ? 'var(--sidebar-accent-foreground)' : undefined }}>
                    {getFolderLabel(f)}
                  </div>
                  {ancestorPath && (
                    <div className="text-xs text-muted-foreground truncate">
                      {ancestorPath}
                    </div>
                  )}
                </div>
                {isSelected && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--sidebar-accent-foreground)', flexShrink: 0 }} />}
              </div>
            )
          }) : (
            <p className="text-sm text-muted-foreground text-center" style={{ padding: '24px 0' }}>
              No folders match &ldquo;{search}&rdquo;
            </p>
          )
        ) : (
          courseFolders.map(course => renderNode(course, 0))
        )}
      </div>
    </div>
  )
}

// ── Move dialog shell (shared by single-question + bulk move) ─────────────────
function MoveFolderDialog({
  title,
  subtitle,
  currentFolderId,
  onCancel,
  onConfirm,
  open,
  onOpenChange,
}: {
  title: string
  subtitle?: string
  currentFolderId: string | null
  onCancel: () => void
  onConfirm: (targetId: string) => void
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [targetId, setTargetId] = useState<string | null>(null)
  const [inlineCreateInFolderId, setInlineCreateInFolderId] = useState<string | null>(null)
  // Validation surface (modal-deep-study §2). Fires on submit attempt
  // without selection; clears as soon as a folder is picked.
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setTargetId(null); setInlineCreateInFolderId(null); setSubmitError(null) }
  }, [open])

  function handleConfirm() {
    if (!targetId) {
      setSubmitError('Pick a destination folder before moving.')
      return
    }
    onConfirm(targetId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0" style={{ overflow: 'hidden' }}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate" style={{ marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </DialogHeader>

        <FolderTreePicker
          currentFolderId={currentFolderId}
          value={targetId}
          onChange={(v) => { setTargetId(v); if (v) setSubmitError(null) }}
          inlineCreateInFolderId={inlineCreateInFolderId}
          onInlineCreateDone={() => setInlineCreateInFolderId(null)}
        />

        {/* Inline error surface — under tree picker, above footer. */}
        {submitError && (
          <div style={{ padding: '4px 16px 8px' }}>
            <FieldError id="move-folder-error">{submitError}</FieldError>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 8 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { if (targetId) setInlineCreateInFolderId(targetId) }}
                  disabled={!targetId || !!inlineCreateInFolderId}
                  className="text-xs"
                  style={{ gap: 6 }}
                >
                  <i className="fa-light fa-folder-plus" aria-hidden="true" style={{ fontSize: 12 }} />
                  New folder
                </Button>
              </span>
            </TooltipTrigger>
            {!targetId && <TooltipContent>Select a folder first</TooltipContent>}
          </Tooltip>
          <div style={{ flex: 1 }} />
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConfirm}
            aria-invalid={!!submitError}
            aria-describedby={submitError ? 'move-folder-error' : undefined}
          >
            Move here
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Move Question Dialog ───────────────────────────────────────────────────────
function MoveQuestionDialog({ question, open, onClose }: { question: { id: string; title: string; folder: string }; open: boolean; onClose: () => void }) {
  const { moveQuestionToFolder, folders } = useQB()
  return (
    <MoveFolderDialog
      title="Move to folder"
      subtitle={question.title.length > 72 ? question.title.slice(0, 72) + '…' : question.title}
      currentFolderId={question.folder}
      onCancel={onClose}
      onConfirm={targetId => {
        moveQuestionToFolder(question.id, targetId)
        const name = folders.find(f => f.id === targetId)?.name ?? 'folder'
        toast.success(`Moved to ${name}`)
        onClose()
      }}
      open={open}
      onOpenChange={v => { if (!v) onClose() }}
    />
  )
}

// ── Bulk Move Dialog ──────────────────────────────────────────────────────────
function BulkMoveDialog({ count, onConfirm, onClose }: { count: number; onConfirm: (targetId: string) => void; onClose: () => void }) {
  return (
    <MoveFolderDialog
      title={`Move ${count} question${count !== 1 ? 's' : ''} to folder`}
      currentFolderId={null}
      onCancel={onClose}
      onConfirm={onConfirm}
      open
      onOpenChange={v => { if (!v) onClose() }}
    />
  )
}

// ── Copy to Folder Dialog ─────────────────────────────────────────────────────
function CopyToFolderDialog({ question, open, onClose, onConfirmOverride }: {
  question: { id: string; title: string } | null
  open: boolean
  onClose: () => void
  onConfirmOverride?: (folderIds: string[]) => void
}) {
  const { copyQuestionToFolder } = useQB()
  const [pickedIds, setPickedIds] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => { if (open) { setPickedIds([]); setSubmitError(null) } }, [open])

  function handleToggle(id: string) {
    setPickedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setSubmitError(null)
  }

  function handleConfirm() {
    if (pickedIds.length === 0) { setSubmitError('Select at least one folder.'); return }
    if (onConfirmOverride) {
      onConfirmOverride(pickedIds)
    } else if (question) {
      copyQuestionToFolder(question.id, pickedIds)
      toast.success(`Copied to ${pickedIds.length} folder${pickedIds.length > 1 ? 's' : ''}`)
    }
    onClose()
  }

  if (!question) return null
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md p-0 gap-0" style={{ overflow: 'hidden' }}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle>Copy to folder</DialogTitle>
          <p className="text-xs text-muted-foreground truncate" style={{ marginTop: 2 }}>
            {question.title.length > 72 ? question.title.slice(0, 72) + '…' : question.title}
          </p>
        </DialogHeader>
        <FolderTreePicker
          currentFolderId={null}
          value={null}
          onChange={() => {}}
          inlineCreateInFolderId={null}
          onInlineCreateDone={() => {}}
          multiSelect
          selectedIds={pickedIds}
          onToggle={handleToggle}
        />
        {submitError && (
          <div style={{ padding: '4px 16px 8px' }}>
            <FieldError id="copy-folder-error">{submitError}</FieldError>
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 8 }}>
          <div style={{ flex: 1 }} />
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="default" size="sm" onClick={handleConfirm}>
            Copy to {pickedIds.length > 1 ? `${pickedIds.length} folders` : 'folder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Archive Question Dialog ───────────────────────────────────────────────────
function ArchiveQuestionDialog({ question, open, onClose, currentFolderId }: {
  question: { id: string; title: string } | null
  open: boolean
  onClose: () => void
  currentFolderId?: string | null
}) {
  const { archiveQuestion, removeQuestionFromFolder } = useQB()
  const [removeFromFolder, setRemoveFromFolder] = useState(false)

  useEffect(() => { if (open) setRemoveFromFolder(false) }, [open])

  if (!question) return null

  function handleArchive() {
    if (!question) return
    archiveQuestion(question.id)
    if (removeFromFolder && currentFolderId) removeQuestionFromFolder(question.id, currentFolderId)
    toast.success('Question archived')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive question?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &ldquo;{question.title.slice(0, 80)}{question.title.length > 80 ? '…' : ''}&rdquo; will be marked as Archived. You can restore it at any time.
        </p>
        {currentFolderId && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Checkbox
              checked={removeFromFolder}
              onCheckedChange={v => setRemoveFromFolder(!!v)}
              id="archive-remove-folder"
            />
            <span className="text-sm text-foreground">Also remove from this folder</span>
          </label>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="default" size="sm" onClick={handleArchive}>Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Question Dialog ────────────────────────────────────────────────────
function DeleteQuestionDialog({ question, open, onClose }: { question: { id: string; title: string }; open: boolean; onClose: () => void }) {
  const { deleteQuestion } = useQB()
  function handleDelete() { deleteQuestion(question.id); toast.success('Question deleted'); onClose() }
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete question?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &ldquo;{question.title.slice(0, 80)}{question.title.length > 80 ? '…' : ''}&rdquo; will be permanently removed.
        </p>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── DS DataTable source (apps/web/components/data-table/index.tsx):
// ── TH = h-9 px-3 text-left align-middle text-xs font-medium text-muted-foreground tracking-wide select-none
// ── TD default = px-3 py-2.5 | compact = py-1 | comfortable = py-4
const TH = 'h-9 px-3 text-start align-middle text-xs font-medium text-muted-foreground tracking-wide bg-dt-header-bg border-b border-border select-none whitespace-nowrap'
const TD = 'px-3 py-2.5 align-middle border-b border-border group-last/row:border-b-0 whitespace-nowrap'

// Clean toggle — uses brand-color for ON state, neutral for OFF
// ── Column definitions ────────────────────────────────────────────────────────
const QB_COLS = [
  { key: 'select',       label: '',               sortKey: null,          hideable: false, sortable: false },
  { key: 'title',        label: 'Question',       sortKey: 'title',       hideable: false },
  { key: 'status',       label: 'Status',         sortKey: 'status',      hideable: false },
  { key: 'type',         label: 'Type',           sortKey: 'type',        hideable: true  },
  { key: 'difficulty',   label: 'Difficulty',     sortKey: 'difficulty',  hideable: true  },
  { key: 'blooms',       label: "Bloom's",        sortKey: 'blooms',      hideable: true  },
  { key: 'location',     label: 'Location',       sortKey: null,          hideable: true  },
  { key: 'creator',      label: 'Creator',        sortKey: 'creator',     hideable: true  },
  { key: 'lastEditedBy', label: 'Last Edited By', sortKey: null,          hideable: true  },
  { key: 'usage',        label: 'Usage',          sortKey: 'usage',       hideable: true  },
  { key: 'pbis',         label: 'P-Biserial',     sortKey: 'pbis',        hideable: true  },
  { key: 'version',      label: 'Ver.',           sortKey: null,          hideable: true  },
  { key: 'actions',      label: '',               sortKey: null,          hideable: false, sortable: false },
] as const

type ColKey = (typeof QB_COLS)[number]['key']

// ── Location path cell ───────────────────────────────────────────────────────
function LocationCell({ question }: { question: Question }) {
  const { folders, navigateToFolder, accessibleFolderIds, setNavView, setAnchorQuestionId } = useQB()

  // Collect all locations: primary + extras
  const allLocations = [
    { folder: question.folder, folderPath: question.folderPath },
    ...(question.extraFolders ?? []),
  ].filter(l => l.folderPath)

  // Untagged (no folder assignments) — link to All Questions with row anchor (ADR-003)
  if (allLocations.length === 0) {
    return (
      <Button
        variant="ghost" size="sm"
        className="h-auto p-0 font-normal text-left text-sm"
        style={{ color: 'var(--brand-color)', textDecoration: 'underline', textUnderlineOffset: 2 }}
        onClick={e => {
          e.stopPropagation()
          setNavView('all')
          setAnchorQuestionId(question.id)
        }}
        aria-label="View in All Questions"
      >
        All Questions
      </Button>
    )
  }

  const LocationLink = ({ loc }: { loc: { folder: string; folderPath: string } }) => {
    const displayName = loc.folderPath.split(' / ').pop() ?? loc.folderPath
    const targetFolder = folders.find(f => f.id === loc.folder)
    const canAccess = accessibleFolderIds.has(loc.folder)

    if (!canAccess) {
      return (
        <Tip label="You don't have access to this folder">
          <span
            className="text-sm"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              color: 'var(--muted-foreground)', fontSize: '0.875rem',
              maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            <i className="fa-light fa-lock" aria-hidden="true" style={{ fontSize: 10, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
          </span>
        </Tip>
      )
    }

    return (
      <Button
        variant="ghost" size="sm"
        onClick={(e) => { e.stopPropagation(); if (targetFolder) navigateToFolder(targetFolder.id) }}
        className="h-auto p-0 font-normal text-left text-sm"
        style={{ color: 'var(--brand-color)', textDecoration: 'underline', textUnderlineOffset: 2 }}
        aria-label={`Navigate to ${displayName}`}
        title={loc.folderPath}
      >
        <span style={{ display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
      </Button>
    )
  }

  if (allLocations.length === 1) return <LocationLink loc={allLocations[0]} />

  // Multiple locations: show first + "+N more" popover
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <LocationLink loc={allLocations[0]} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost" size="xs"
            onClick={e => e.stopPropagation()}
            className="text-[10px] text-muted-foreground font-medium shrink-0"
            style={{ height: 18, padding: '0 5px', borderRadius: 99, backgroundColor: 'var(--muted)' }}
          >
            +{allLocations.length - 1}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-2" style={{ width: 260 }} onClick={e => e.stopPropagation()}>
          <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground mb-1.5">
            {allLocations.length} locations
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {allLocations.map((loc, i) => {
              const name = loc.folderPath.split(' / ').pop() ?? loc.folderPath
              const target = folders.find(f => f.id === loc.folder)
              const canAccess = accessibleFolderIds.has(loc.folder)

              if (!canAccess) {
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 w-full rounded px-2 py-1.5"
                    style={{ cursor: 'default' }}
                  >
                    <i className="fa-light fa-lock text-muted-foreground shrink-0" aria-hidden="true" style={{ fontSize: 12 }} />
                    <div style={{ minWidth: 0 }}>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--muted-foreground)' }}>{name}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>{loc.folderPath}</p>
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); if (target) navigateToFolder(target.id) }}
                  className="flex items-center gap-2 text-left w-full rounded px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  <i className="fa-light fa-folder text-muted-foreground shrink-0" aria-hidden="true" style={{ fontSize: 12 }} />
                  <div style={{ minWidth: 0 }}>
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{loc.folderPath}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ── Favorited star cell ───────────────────────────────────────────────────────
function FavoritedCell({ questionId }: { questionId: string }) {
  const { favoritedIds, toggleQuestionFavorited } = useQB()
  const isFav = favoritedIds.has(questionId)
  return (
    <Button
      variant="ghost" size="icon-xs"
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      onClick={e => { e.stopPropagation(); e.preventDefault(); toggleQuestionFavorited(questionId) }}
      style={{ color: isFav ? 'var(--chart-4)' : undefined, flexShrink: 0 }}
      className={`transition-all ${isFav ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-60 hover:!opacity-100 text-muted-foreground'}`}
    >
      <i className={isFav ? 'fa-solid fa-star' : 'fa-light fa-star'} aria-hidden="true" style={{ fontSize: 13 }} />
    </Button>
  )
}

// ── Inline filter chips (toolbar left side) ───────────────────────────────────
type ChipDef = { key: string; icon: string; label: string; onRemove: () => void }

// Simple chip — bookmark, no popover
function SimpleChip({ chip }: { chip: ChipDef }) {
  return (
    <div className="text-xs text-foreground" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 'var(--qb-chip-height)', padding: '0 4px 0 8px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--background)', flexShrink: 0 }}>
      <i className={`fa-light ${chip.icon}`} aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
      <span className="font-medium">{chip.label}</span>
      <Button variant="ghost" size="icon-xs" aria-label={`Remove ${chip.label}`} onClick={chip.onRemove} className="text-muted-foreground" style={{ width: 16, height: 16, padding: 0, marginLeft: 2 }}>
        <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 9 }} />
      </Button>
    </div>
  )
}

// Per-filter pill with inline popover editor
function FilterPill({ filter, onUpdate, onRemove, autoOpen = false, fieldDefs = QB_FILTER_FIELDS }: {
  filter: QBFilter
  onUpdate: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemove: (id: string) => void
  autoOpen?: boolean
  fieldDefs?: typeof QB_FILTER_FIELDS
}) {
  const [open, setOpen] = useState(autoOpen)
  const [optSearch, setOptSearch] = useState('')
  const fieldDef = fieldDefs.find(f => f.key === filter.fieldKey)!
  const hasValues = filter.values.length > 0
  const pillLabel = hasValues
    ? filter.values.length === 1
      ? `${fieldDef.label} ${filter.values[0]}`
      : `${fieldDef.label} ${filter.values[0]} +${filter.values.length - 1}`
    : fieldDef.label
  const filteredOpts = optSearch
    ? fieldDef.options.filter(o => o.toLowerCase().includes(optSearch.toLowerCase()))
    : fieldDef.options

  function toggleValue(v: string) {
    const newValues = filter.values.includes(v) ? filter.values.filter(x => x !== v) : [...filter.values, v]
    onUpdate(filter.id, { values: newValues })
  }

  const chipColor = hasValues ? 'var(--foreground)' : 'var(--muted-foreground)'

  return (
    // Wrapper div owns the chip border/bg — trigger and close are siblings, never nested buttons
    <div style={{
      display: 'inline-flex',
      borderRadius: 4,
      border: hasValues ? '1px solid var(--border-control-3)' : '1.5px dashed var(--border)',
      backgroundColor: hasValues ? 'var(--muted)' : 'var(--background)',
      flexShrink: 0, userSelect: 'none', overflow: 'hidden',
    }}>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="text-xs gap-1 shrink-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{
            height: 'var(--qb-chip-height)', padding: '0 2px 0 8px',
            borderRadius: 0,
            color: chipColor,
          }}
        >
          <i className={`fa-light ${fieldDef.icon}`} aria-hidden="true" style={{ fontSize: 10 }} />
          <span className="font-medium">{pillLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" style={{ width: 260, padding: 0, overflow: 'hidden' }}>
        {/* Header: field + operator + delete */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px 8px', gap: 4, borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-semibold text-foreground">{fieldDef.label}</span>
          <Button
            variant="ghost" size="xs"
            onClick={() => onUpdate(filter.id, { operator: filter.operator === 'is' ? 'is_not' : 'is' })}
            className="text-xs text-muted-foreground"
            style={{ height: 20, padding: '0 4px', gap: 2 }}
          >
            {filter.operator === 'is' ? 'is' : 'is not'}
            <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 8 }} />
          </Button>
          <div style={{ flex: 1 }} />
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => { onRemove(filter.id); setOpen(false) }}
            aria-label={`Remove ${fieldDef.label} filter`}
          >
            <i className="fa-light fa-trash" aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
          </Button>
        </div>
        {/* Search options */}
        <div style={{ padding: '8px 10px 6px' }}>
          <Input placeholder="Search options…" value={optSearch} onChange={e => setOptSearch(e.target.value)} className="h-8 text-sm" />
        </div>
        {/* Checkbox list */}
        <div role="listbox" aria-multiselectable="true" style={{ maxHeight: 232, overflowY: 'auto', padding: '2px 0 8px' }}>
          {filteredOpts.length === 0
            ? <p className="text-xs text-muted-foreground" style={{ padding: '8px 12px' }}>No matches</p>
            : filteredOpts.map(opt => {
              const checked = filter.values.includes(opt)
              return (
                <div
                  key={opt}
                  role="option" aria-selected={checked} tabIndex={0}
                  onClick={() => toggleValue(opt)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleValue(opt) } }}
                  className="text-sm text-foreground"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--interactive-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleValue(opt)} onClick={e => e.stopPropagation()} style={{ width: 16, height: 16, minWidth: 16, minHeight: 16, flexShrink: 0 }} />
                  <span>{opt}</span>
                </div>
              )
            })}
        </div>
      </PopoverContent>
    </Popover>
    {/* Close button — sibling of Popover, NOT inside the trigger button */}
    <Button
      variant="ghost" size="icon-xs"
      aria-label={`Remove ${fieldDef.label} filter`}
      onClick={e => { e.stopPropagation(); onRemove(filter.id) }}
      className="hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 hover:opacity-60"
      style={{ width: 20, height: 'var(--qb-chip-height)', padding: 0, borderRadius: 0, color: chipColor }}
    >
      <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 9 }} />
    </Button>
    </div>
  )
}

// Field-picker dropdown — opens when clicking "+ Add filter"
function AddFilterDropdown({ onAdd, fieldDefs = QB_FILTER_FIELDS }: {
  onAdd: (fieldKey: QBFilterKey) => void
  fieldDefs?: typeof QB_FILTER_FIELDS
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost" size="xs"
          className="qb-add-filter-btn text-xs text-muted-foreground"
          style={{ height: 'var(--qb-chip-height)', padding: '0 10px', borderRadius: 4, border: '1.5px dashed var(--border)', gap: 4, flexShrink: 0 }}
        >
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 9 }} />
          Add filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Filter by field</DropdownMenuLabel>
        {fieldDefs.map(f => (
          <DropdownMenuItem key={f.key} onClick={() => onAdd(f.key)}>
            <i className={`fa-light ${f.icon}`} aria-hidden="true" />
            {f.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FilterChips({
  activeFilters, bookmarkChips, lastAddedId,
  onAddFilter, onUpdateFilter, onRemoveFilter, onClearAll,
  filterFields = QB_FILTER_FIELDS,
}: {
  activeFilters: QBFilter[]
  bookmarkChips: ChipDef[]
  lastAddedId: string | null
  onAddFilter: (fieldKey: QBFilterKey) => void
  onUpdateFilter: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemoveFilter: (id: string) => void
  onClearAll: () => void
  filterFields?: typeof QB_FILTER_FIELDS
}) {
  const hasActive = activeFilters.some(f => f.values.length > 0) || bookmarkChips.length > 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
      {activeFilters.map(filter => (
        <FilterPill
          key={filter.id}
          filter={filter}
          onUpdate={onUpdateFilter}
          onRemove={onRemoveFilter}
          autoOpen={filter.id === lastAddedId}
          fieldDefs={filterFields}
        />
      ))}
      {bookmarkChips.map(chip => <SimpleChip key={chip.key} chip={chip} />)}
      <AddFilterDropdown onAdd={onAddFilter} fieldDefs={filterFields} />
      {hasActive && (
        <Button variant="ghost" size="xs" onClick={onClearAll} className="text-xs text-muted-foreground" style={{ height: 'var(--qb-chip-height)', padding: '0 6px', flexShrink: 0 }}>
          Clear all
        </Button>
      )}
    </div>
  )
}

// ── QB filter types ───────────────────────────────────────────────────────────
type QBFilterKey = 'status' | 'type' | 'difficulty' | 'blooms' | 'creator' | 'lastEditedBy' | 'location'
type QBFilterOp  = 'is' | 'is_not'
type QBFilter    = { id: string; fieldKey: QBFilterKey; operator: QBFilterOp; values: string[] }

const QB_FILTER_FIELDS: { key: QBFilterKey; label: string; icon: string; options: string[]; counts?: Map<string, number> }[] = [
  { key: 'status',       label: 'Status',          icon: 'fa-circle-dot',      options: ['Saved', 'Draft', 'In Review', 'Archived'] },
  { key: 'type',         label: 'Type',             icon: 'fa-rectangle-list',  options: ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching'] },
  { key: 'difficulty',   label: 'Difficulty',       icon: 'fa-signal',          options: ['Easy', 'Medium', 'Hard'] },
  { key: 'blooms',       label: "Bloom's",          icon: 'fa-brain',           options: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
  { key: 'creator',      label: 'Creator',          icon: 'fa-user',            options: [] },
  { key: 'lastEditedBy', label: 'Last Edited By',   icon: 'fa-pen-to-square',   options: [] },
  { key: 'location',     label: 'Location',         icon: 'fa-folder',          options: [] },
]

// ── QB filter card (DS DrawerFilterCard pattern) ──────────────────────────────
function QBFilterCard({
  filter, fieldDef, expanded, onToggleExpand, onUpdate, onRemove,
}: {
  filter: QBFilter
  fieldDef: typeof QB_FILTER_FIELDS[number]
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemove: (id: string) => void
}) {
  const [optSearch, setOptSearch] = useState('')
  const filteredOpts = optSearch
    ? fieldDef.options.filter(o => o.toLowerCase().includes(optSearch.toLowerCase()))
    : fieldDef.options

  function toggleValue(v: string) {
    const newValues = filter.values.includes(v)
      ? filter.values.filter(x => x !== v)
      : [...filter.values, v]
    onUpdate(filter.id, { values: newValues })
  }

  function cycleOperator() {
    onUpdate(filter.id, { operator: filter.operator === 'is' ? 'is_not' : 'is' })
  }

  const OPERATOR_LABEL: Record<QBFilterOp, string> = { is: 'is', is_not: 'is not' }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{fieldDef.label}</p>
          <Button
            variant="ghost" size="xs"
            onClick={cycleOperator}
            className="h-auto py-0 px-1 -ms-1 text-xs text-muted-foreground font-normal gap-1"
            aria-label={`Operator: ${OPERATOR_LABEL[filter.operator]} — click to cycle`}
          >
            {OPERATOR_LABEL[filter.operator]}
            <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 self-start">
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => onRemove(filter.id)}
            aria-label={`Remove ${fieldDef.label} filter`}
            className="text-muted-foreground hover:text-destructive"
          >
            <i className="fa-light fa-trash text-xs" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost" size="icon-sm"
            onClick={onToggleExpand}
            aria-label={expanded ? `Collapse ${fieldDef.label}` : `Expand ${fieldDef.label}`}
          >
            <i className={`fa-light ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border">
          <div className="px-3 pt-2 pb-1">
            <Input
              placeholder="Search options…"
              value={optSearch}
              onChange={e => setOptSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div role="listbox" aria-multiselectable="true" aria-label={`${fieldDef.label} options`}
            className="py-1 max-h-52 overflow-y-auto">
            {filteredOpts.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
            ) : filteredOpts.map(opt => {
              const checked = filter.values.includes(opt)
              return (
                <div
                  key={opt}
                  role="option" aria-selected={checked}
                  tabIndex={0}
                  onClick={() => toggleValue(opt)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleValue(opt) } }}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground cursor-pointer select-none focus-visible:outline-none"
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--interactive-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center shrink-0 rounded-[3px] border transition-colors"
                    style={{
                      width: 14, height: 14,
                      background: checked ? 'var(--primary)' : 'var(--background)',
                      borderColor: checked ? 'var(--primary)' : 'var(--border-control-3)',
                    }}
                  >
                    {checked && <i className="fa-solid fa-check text-primary-foreground" aria-hidden="true" style={{ fontSize: 7 }} />}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {fieldDef.counts?.has(opt) && (
                    <span className="text-xs text-muted-foreground tabular-nums">{fieldDef.counts.get(opt)}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Properties Sheet (DS TablePropertiesDrawer-inspired) ─────────────────────
type SheetPanel = 'main' | 'table-display' | 'filter' | 'sort' | 'group' | 'columns' | 'conditional'
type QBConditionalRule = { id: string; fieldKey: QBFilterKey; operator: QBFilterOp; values: string[]; bgColor: string }
type QBRowHeight = 'compact' | 'default' | 'comfortable'

const QB_RULE_COLORS = [
  { name: 'Green',  bg: 'var(--conditional-rule-green)'  },
  { name: 'Yellow', bg: 'var(--conditional-rule-yellow)' },
  { name: 'Blue',   bg: 'var(--conditional-rule-blue)'   },
  { name: 'Red',    bg: 'var(--conditional-rule-red)'    },
  { name: 'Purple', bg: 'var(--conditional-rule-purple)' },
  { name: 'Orange', bg: 'var(--conditional-rule-orange)' },
]

function FilterPropertiesSheet({
  open, onOpenChange,
  activeFilters, onAddFilter, onUpdateFilter, onRemoveFilter,
  expandedFilterIds, onExpandedFilterIdsChange,
  filterLogic, onToggleFilterLogic,
  filterBarVisible, onFilterBarVisibleChange,
  bookmarkOnly, setBookmarkOnly,
  hiddenCols, setHiddenCols,
  filteredCount, totalCount,
  sortCol, sortDir, sortRules, onSort, onToggleSortDir, onRemoveSortRule, onClearAllSorts,
  groupBy, onGroupByChange,
  showGridlines, onShowGridlinesChange,
  paginationEnabled, onPaginationEnabledChange,
  rowHeight, onRowHeightChange,
  showTableTitle, onShowTableTitleChange,
  showColumnLabels, onShowColumnLabelsChange,
  showSearch, onShowSearchChange,
  conditionalRules, onAddConditionalRule, onRemoveConditionalRule, onUpdateConditionalRule,
  columnOrder, onColumnOrderChange,
  initialPanel,
  filterFields = QB_FILTER_FIELDS,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  activeFilters: QBFilter[]
  onAddFilter: (fieldKey: QBFilterKey) => void
  onUpdateFilter: (id: string, patch: Partial<Omit<QBFilter, 'id'>>) => void
  onRemoveFilter: (id: string) => void
  expandedFilterIds: Set<string>
  onExpandedFilterIdsChange: React.Dispatch<React.SetStateAction<Set<string>>>
  filterLogic: 'and' | 'or'
  onToggleFilterLogic: () => void
  filterBarVisible: boolean
  onFilterBarVisibleChange: (v: boolean) => void
  bookmarkOnly: boolean
  setBookmarkOnly: React.Dispatch<React.SetStateAction<boolean>>
  hiddenCols: Set<ColKey>
  setHiddenCols: React.Dispatch<React.SetStateAction<Set<ColKey>>>
  filteredCount: number
  totalCount: number
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  sortRules: { col: string; dir: 'asc' | 'desc' }[]
  onSort: (key: string, dir: 'asc' | 'desc') => void
  onToggleSortDir: (col: string) => void
  onRemoveSortRule: (col: string) => void
  onClearAllSorts: () => void
  groupBy: string | null
  onGroupByChange: (key: string | null) => void
  showGridlines: boolean
  onShowGridlinesChange: (v: boolean) => void
  paginationEnabled: boolean
  onPaginationEnabledChange: (v: boolean) => void
  rowHeight: QBRowHeight
  onRowHeightChange: (v: QBRowHeight) => void
  showTableTitle: boolean
  onShowTableTitleChange: (v: boolean) => void
  showColumnLabels: boolean
  onShowColumnLabelsChange: (v: boolean) => void
  showSearch: boolean
  onShowSearchChange: (v: boolean) => void
  conditionalRules: QBConditionalRule[]
  onAddConditionalRule: (rule: QBConditionalRule) => void
  onRemoveConditionalRule: (id: string) => void
  onUpdateConditionalRule: (id: string, patch: Partial<Omit<QBConditionalRule, 'id'>>) => void
  columnOrder: ColumnId[]
  onColumnOrderChange: (order: ColumnId[]) => void
  initialPanel?: SheetPanel
  filterFields?: typeof QB_FILTER_FIELDS
}) {
  const [panel, setPanel] = useState<SheetPanel>('main')
  const [condExpandedIds, setCondExpandedIds] = useState<Set<string>>(new Set())
  const sheetDragColRef = useRef<string | null>(null)
  const [dragOverColSheet, setDragOverColSheet] = useState<string | null>(null)

  // WCAG 1.4.10 (Reflow): at narrow viewports the floating-panel pattern
  // overlaps the table. Switch to a default tray (with overlay, full-edge)
  // so content stays reachable at 200% zoom.
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1024px)')
    const apply = () => setIsNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!open) { setPanel('main'); return }
    if (initialPanel) setPanel(initialPanel)
  }, [open, initialPanel])

  const activeFilterCount = activeFilters.filter(f => f.values.length > 0).length + (bookmarkOnly ? 1 : 0)
  const hiddenColCount = hiddenCols.size
  const activeSortLabel = sortRules.length > 0
    ? sortRules.map(r => QB_COLS.find(c => c.key === r.col)?.label ?? r.col).join(', ')
    : null
  const groupByLabel = groupBy ? QB_COLS.find(c => c.key === groupBy)?.label ?? groupBy : null

  const PANEL_LABELS: Record<SheetPanel, string> = {
    main: 'Properties', 'table-display': 'Table', filter: 'Filter', sort: 'Sort', group: 'Group', columns: 'Columns', conditional: 'Conditional Rules',
  }

  const BackClose = ({ onBack, subtitle, helpTooltip }: { onBack: () => void; subtitle?: string; helpTooltip?: string }) => (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border" style={{ flexShrink: 0 }}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to Properties">
          <i className="fa-light fa-chevron-left text-[13px]" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <SheetTitle className="text-sm font-semibold leading-tight">{PANEL_LABELS[panel]}</SheetTitle>
            {helpTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <i className="fa-light fa-circle-question text-muted-foreground cursor-help" aria-hidden="true" style={{ fontSize: 12 }} />
                </TooltipTrigger>
                <TooltipContent className="max-w-48">{helpTooltip}</TooltipContent>
              </Tooltip>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5" aria-live="polite">{subtitle}</p>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close">
        <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
      </Button>
    </div>
  )

  const MAIN_ITEMS: { id: SheetPanel; icon: string; label: string; desc: string }[] = [
    { id: 'table-display', icon: 'fa-table',             label: 'Table',             desc: [showGridlines ? 'Gridlines' : null, rowHeight !== 'default' ? rowHeight : null].filter(Boolean).join(' · ') || 'Default appearance.' },
    { id: 'filter',        icon: 'fa-filter',            label: 'Filter',            desc: activeFilterCount === 0 ? `Showing all ${totalCount} questions.` : `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} · ${filteredCount} shown.` },
    { id: 'sort',          icon: 'fa-arrow-up-arrow-down', label: 'Sort',            desc: sortRules.length > 0 ? `${sortRules.length} sort rule${sortRules.length > 1 ? 's' : ''}: ${activeSortLabel}.` : 'No sort applied.' },
    { id: 'group',         icon: 'fa-layer-group',       label: 'Group',             desc: groupByLabel ? `Grouped by ${groupByLabel}.` : 'No grouping.' },
    { id: 'columns',       icon: 'fa-table-columns',     label: 'Columns',           desc: hiddenColCount === 0 ? 'All columns visible.' : `${hiddenColCount} column${hiddenColCount !== 1 ? 's' : ''} hidden.` },
    { id: 'conditional',   icon: 'fa-palette',           label: 'Conditional rules', desc: conditionalRules.length === 0 ? 'No rules active.' : `${conditionalRules.length} rule${conditionalRules.length !== 1 ? 's' : ''} active.` },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={isNarrow}
        className={isNarrow
          ? 'w-80 sm:max-w-80 p-0 gap-0 flex flex-col'
          : 'w-80 sm:max-w-80 p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden'}
        style={isNarrow
          ? undefined
          : { top: '0.5rem', bottom: '0.5rem', right: '0.5rem', height: 'calc(100vh - 1rem)' }}
      >

        {/* ── Main panel ── */}
        {panel === 'main' && (
          <>
            <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3" style={{ flexShrink: 0 }}>
              <SheetTitle className="text-base font-semibold">Properties</SheetTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close">
                <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
              {MAIN_ITEMS.map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => setPanel(item.id)}
                  className="w-full h-auto justify-start gap-3 px-3 py-3 rounded-2xl font-normal hover:bg-muted/60 hover:text-foreground"
                >
                  <span className="inline-flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--secondary)', border: '1px solid var(--border)' }}>
                    <i className={`fa-light ${item.icon} text-[14px] text-secondary-foreground`} aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block text-sm font-medium text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{item.desc}</span>
                  </span>
                  <i className="fa-light fa-chevron-right text-xs text-muted-foreground shrink-0" aria-hidden="true" />
                </Button>
              ))}
            </div>
          </>
        )}

        {/* ── Table display sub-panel ── */}
        {panel === 'table-display' && (
          <>
            <BackClose onBack={() => setPanel('main')} />
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Appearance */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Appearance</p>
                <div className="space-y-0.5">
                  {([
                    { id: 'gridlines',  icon: 'fa-border-all',  label: 'Gridlines',  checked: showGridlines,     onChange: onShowGridlinesChange },
                    { id: 'pagination', icon: 'fa-table-list',  label: 'Pagination', checked: paginationEnabled, onChange: onPaginationEnabledChange },
                  ] as { id: string; icon: string; label: string; checked: boolean; onChange: (v: boolean) => void }[]).map(row => (
                    <div key={row.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <i className={`fa-light ${row.icon} text-muted-foreground w-4 text-center`} aria-hidden="true" />
                        <label htmlFor={`toggle-${row.id}`} className="cursor-pointer select-none">{row.label}</label>
                      </div>
                      <QBToggle id={`toggle-${row.id}`} checked={row.checked} onChange={row.onChange} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Row height */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Row height</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { h: 'compact',     icon: 'fa-arrow-down-to-line' },
                    { h: 'default',     icon: 'fa-arrows-up-down' },
                    { h: 'comfortable', icon: 'fa-arrow-up-to-line' },
                  ] as { h: QBRowHeight; icon: string }[]).map(({ h, icon }) => (
                    <Button
                      key={h}
                      variant="ghost"
                      onClick={() => onRowHeightChange(h)}
                      className="flex flex-col items-center gap-1.5 h-auto py-3 px-2 rounded-lg border transition-colors"
                      style={{
                        borderColor: rowHeight === h ? 'var(--brand-color)' : 'var(--border)',
                        backgroundColor: rowHeight === h ? 'var(--sidebar-accent)' : 'var(--background)',
                      }}
                    >
                      <i className={`fa-light ${icon} ${rowHeight === h ? '' : 'text-muted-foreground'}`} aria-hidden="true"
                        style={{ fontSize: 16, color: rowHeight === h ? 'var(--brand-color)' : undefined }} />
                      <span className={`text-xs capitalize ${rowHeight === h ? 'font-semibold' : 'font-normal text-foreground'}`} style={{ color: rowHeight === h ? 'var(--brand-color)' : undefined }}>{h}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Display options */}
              <div className="border-t border-border pt-4 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Display options</p>
                {([
                  { id: 'table-title', icon: 'fa-heading',         label: 'Table title',   desc: 'Show the page heading and subtitle.', checked: showTableTitle,    onChange: onShowTableTitleChange },
                  { id: 'col-labels',  icon: 'fa-table-columns',   label: 'Column labels', desc: 'Column headers in the table.',        checked: showColumnLabels,  onChange: onShowColumnLabelsChange },
                  { id: 'search',      icon: 'fa-magnifying-glass', label: 'Search',        desc: 'Toolbar search for this view.',       checked: showSearch,        onChange: onShowSearchChange },
                ] as { id: string; icon: string; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }[]).map(row => (
                  <div key={row.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="inline-flex items-center justify-center shrink-0"
                        style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--secondary)', border: '1px solid var(--border)' }}>
                        <i className={`fa-light ${row.icon} text-secondary-foreground`} aria-hidden="true" style={{ fontSize: 13 }} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{row.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{row.desc}</p>
                      </div>
                    </div>
                    <QBToggle id={`toggle-display-${row.id}`} checked={row.checked} onChange={row.onChange} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Filter sub-panel ── */}
        {panel === 'filter' && (
          <>
            <BackClose
              onBack={() => setPanel('main')}
              subtitle={activeFilterCount === 0 ? `Showing all ${totalCount} questions` : `${filteredCount} of ${totalCount} match · ${activeFilterCount} active`}
              helpTooltip="Use AND to match all filters; use OR to match any filter."
            />
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-4">
              {activeFilters.length === 0 && !bookmarkOnly ? (
                <EmptyState
                  icon="fa-filter"
                  title="No filters yet"
                  description={
                    <>
                      Use filters to show only the questions you need. With multiple filters, use{' '}
                      <strong className="text-foreground">and</strong> or{' '}
                      <strong className="text-foreground">or</strong> between them to control how they combine.
                    </>
                  }
                  steps={[
                    'Click “Add filter” below',
                    'Choose a field to filter by',
                    'Pick a condition and value',
                  ]}
                />
              ) : (
                <>
                  {activeFilters.map((f, idx) => {
                    const fieldDef = filterFields.find(fd => fd.key === f.fieldKey)
                    if (!fieldDef) return null
                    return (
                      <React.Fragment key={f.id}>
                        {idx > 0 && (
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={onToggleFilterLogic}
                              className="rounded-full text-xs font-semibold text-muted-foreground"
                            >
                              {filterLogic.toUpperCase()}
                            </Button>
                          </div>
                        )}
                        <QBFilterCard
                          filter={f}
                          fieldDef={fieldDef}
                          expanded={expandedFilterIds.has(f.id)}
                          onToggleExpand={() => onExpandedFilterIdsChange(prev => {
                            const next = new Set(prev)
                            next.has(f.id) ? next.delete(f.id) : next.add(f.id)
                            return next
                          })}
                          onUpdate={onUpdateFilter}
                          onRemove={id => {
                            onRemoveFilter(id)
                            onExpandedFilterIdsChange(prev => { const next = new Set(prev); next.delete(id); return next })
                          }}
                        />
                      </React.Fragment>
                    )
                  })}

                  {/* Bookmarked toggle as a special filter — role/tabIndex/
                      onKeyDown + focus-visible so the clickable wrapper is
                      keyboard- and screen-reader accessible (was raw <div
                      onClick> with no a11y semantics). */}
                  {bookmarkOnly && (
                    <div
                      className="rounded-lg border border-border overflow-hidden cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      onClick={() => setBookmarkOnly(v => !v)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={true}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setBookmarkOnly(v => !v)
                        }
                      }}
                      style={{ background: 'color-mix(in oklch, var(--brand-color) 6%, var(--background))' }}
                    >
                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                        <span aria-hidden="true" className="inline-flex items-center justify-center shrink-0 rounded-[3px] border transition-colors"
                          style={{ width: 14, height: 14, background: 'var(--primary)', borderColor: 'var(--primary)' }}>
                          <i className="fa-solid fa-check text-primary-foreground" aria-hidden="true" style={{ fontSize: 7 }} />
                        </span>
                        <span className="text-sm font-medium text-foreground flex-1">Bookmarked only</span>
                        <Button variant="ghost" size="icon-xs" onClick={e => { e.stopPropagation(); setBookmarkOnly(false) }}
                          aria-label="Remove bookmarked filter" className="text-muted-foreground hover:text-destructive">
                          <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Add filter + Remove all — inline in scroll area */}
              <div className="flex items-center gap-2 pt-1">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-dashed text-muted-foreground">
                      <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                      Add filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Filter by field</DropdownMenuLabel>
                    {filterFields.map(f => (
                      <DropdownMenuItem key={f.key} onClick={() => onAddFilter(f.key)}>
                        <i className={`fa-light ${f.icon}`} aria-hidden="true" />
                        {f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      activeFilters.forEach(f => onRemoveFilter(f.id))
                      onExpandedFilterIdsChange(new Set())
                      setBookmarkOnly(false)
                    }}>
                    Remove all
                  </Button>
                )}
              </div>

              {/* Enable filter bar — separator + toggle */}
              <div className="border-t border-border pt-3 mt-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Enable filter bar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Show filters above the table.</p>
                  </div>
                  <QBToggle id="toggle-filter-bar" checked={filterBarVisible} onChange={onFilterBarVisibleChange} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Sort sub-panel — multi-column ── */}
        {panel === 'sort' && (
          <>
            <BackClose onBack={() => setPanel('main')} />
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-4">
              {/* Active sort rules */}
              {sortRules.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                  {sortRules.map((rule, idx) => {
                    const col = QB_COLS.find(c => c.key === rule.col)
                    const rankLabel = idx === 0 ? 'PRIMARY' : idx === 1 ? 'THEN BY' : `THEN BY ${idx + 1}`
                    return (
                      <div key={rule.col} className="flex items-center gap-2 px-3 py-2.5">
                        <i className="fa-light fa-grip-dots-vertical text-muted-foreground/40 shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
                        <Badge variant="secondary" className="rounded text-[10px] px-1.5 py-0.5 shrink-0"
                          style={{ backgroundColor: idx === 0 ? 'var(--sidebar-accent)' : 'var(--muted)', color: idx === 0 ? 'var(--sidebar-accent-foreground)' : 'var(--muted-foreground)' }}>
                          {rankLabel}
                        </Badge>
                        <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{col?.label ?? rule.col}</span>
                        <Button variant="ghost" size="xs"
                          onClick={() => onToggleSortDir(rule.col)}
                          className="gap-1 text-xs text-muted-foreground shrink-0">
                          {rule.dir === 'asc' ? 'Ascending' : 'Descending'}
                          <i className="fa-light fa-chevron-down text-[10px]" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => onRemoveSortRule(rule.col)}
                          aria-label={`Remove ${col?.label ?? rule.col} sort`}
                          className="text-muted-foreground hover:text-destructive shrink-0">
                          <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon="fa-arrow-up-arrow-down"
                  title="No sort applied"
                  description="Add sort rules below. Multiple rules apply in order — primary, then secondary."
                />
              )}

              {/* Add sort + Remove all */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-dashed text-muted-foreground">
                      <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                      {sortRules.length === 0 ? 'Add sort' : 'Add another sort'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {QB_COLS.filter(c => c.sortKey).map(col => {
                      const inRules = sortRules.some(r => r.col === col.key)
                      return (
                        <DropdownMenuItem key={col.key}
                          disabled={inRules}
                          onClick={() => !inRules && onSort(col.key, 'asc')}
                          style={{ color: inRules ? 'var(--muted-foreground)' : undefined }}>
                          <i className={`fa-light ${inRules ? 'fa-check' : 'fa-minus'} text-xs`} aria-hidden="true"
                            style={{ width: 14, color: inRules ? 'var(--brand-color)' : undefined }} />
                          {col.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {sortRules.length > 0 && (
                  <Button variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={onClearAllSorts}>
                    Remove all
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Group sub-panel ── */}
        {panel === 'group' && (
          <>
            <BackClose onBack={() => setPanel('main')} subtitle={groupByLabel ? `Grouped by ${groupByLabel}.` : undefined} />
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              {/* None */}
              <Button
                variant="ghost"
                onClick={() => onGroupByChange(null)}
                className="w-full h-auto justify-start gap-3 px-3 py-2.5 rounded-lg font-normal"
                style={{ backgroundColor: groupBy === null ? 'var(--accent)' : undefined }}
              >
                <i className="fa-light fa-ban text-sm shrink-0 text-muted-foreground" aria-hidden="true"
                  style={{ width: 16 }} />
                <span className={`flex-1 text-sm text-left ${groupBy === null ? 'font-medium' : 'font-normal text-foreground'}`} style={{ color: groupBy === null ? 'var(--brand-color)' : undefined }}>
                  None
                </span>
                {groupBy === null && <i className="fa-solid fa-check text-xs shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />}
              </Button>

              <div className="h-px bg-border mx-1 my-1" />

              {QB_COLS.filter(c => c.key !== 'select' && c.key !== 'actions' && c.key !== 'title').map(col => (
                <Button
                  key={col.key}
                  variant="ghost"
                  onClick={() => onGroupByChange(col.key)}
                  className="w-full h-auto justify-start gap-3 px-3 py-2.5 rounded-lg font-normal"
                  style={{ backgroundColor: groupBy === col.key ? 'var(--accent)' : undefined }}
                >
                  <i className={`fa-light fa-layer-group text-sm shrink-0 ${groupBy === col.key ? '' : 'text-muted-foreground'}`} aria-hidden="true"
                    style={{ width: 16, color: groupBy === col.key ? 'var(--brand-color)' : undefined }} />
                  <span className={`flex-1 text-sm text-left ${groupBy === col.key ? 'font-medium' : 'font-normal text-foreground'}`} style={{ color: groupBy === col.key ? 'var(--brand-color)' : undefined }}>
                    {col.label}
                  </span>
                  {groupBy === col.key && <i className="fa-solid fa-check text-xs shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />}
                </Button>
              ))}
            </div>
          </>
        )}

        {/* ── Columns sub-panel ── */}
        {panel === 'columns' && (
          <>
            <BackClose onBack={() => setPanel('main')} />
            <div className="px-4 py-2 text-xs text-muted-foreground" style={{ flexShrink: 0 }}>
              {hiddenColCount === 0 ? 'All columns visible.' : `${hiddenColCount} column${hiddenColCount !== 1 ? 's' : ''} hidden.`}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
              {columnOrder.map(key => {
                const col = QB_COLS.find(c => c.key === key && c.hideable)
                if (!col) return null
                const visible = !hiddenCols.has(col.key as ColKey)
                const isDragTarget = dragOverColSheet === col.key
                return (
                  <div
                    key={col.key}
                    draggable
                    onDragStart={e => { sheetDragColRef.current = col.key; e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={e => { e.preventDefault(); setDragOverColSheet(col.key) }}
                    onDragLeave={() => { if (dragOverColSheet === col.key) setDragOverColSheet(null) }}
                    onDrop={e => {
                      e.preventDefault()
                      const from = sheetDragColRef.current
                      const to = col.key
                      if (!from || from === to) { sheetDragColRef.current = null; setDragOverColSheet(null); return }
                      const next = [...columnOrder]
                      const fromIdx = next.indexOf(from as ColumnId)
                      const toIdx = next.indexOf(to as ColumnId)
                      if (fromIdx >= 0 && toIdx >= 0) {
                        next.splice(fromIdx, 1)
                        next.splice(toIdx, 0, from as ColumnId)
                        onColumnOrderChange(next)
                      }
                      sheetDragColRef.current = null
                      setDragOverColSheet(null)
                    }}
                    onDragEnd={() => { sheetDragColRef.current = null; setDragOverColSheet(null) }}
                    className="flex items-center gap-2 px-2 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                    style={{
                      outline: isDragTarget ? '2px dashed var(--brand-color)' : undefined,
                      outlineOffset: isDragTarget ? '-2px' : undefined,
                    }}
                  >
                    <i className="fa-light fa-grip-dots-vertical text-muted-foreground/50 shrink-0" aria-hidden="true" style={{ fontSize: 13, cursor: 'grab' }} />
                    <span className={`flex-1 text-sm ${visible ? 'text-foreground' : 'text-muted-foreground'}`}>{col.label}</span>
                    <QBToggle
                      id={`col-toggle-${col.key}`}
                      checked={visible}
                      onChange={() => setHiddenCols(prev => {
                        const next = new Set(prev)
                        if (next.has(col.key as ColKey)) next.delete(col.key as ColKey); else next.add(col.key as ColKey)
                        return next
                      })}
                    />
                  </div>
                )
              })}
            </div>
            {hiddenColCount > 0 && (
              <div className="p-3 border-t border-border" style={{ flexShrink: 0 }}>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setHiddenCols(new Set())}>Show all columns</Button>
              </div>
            )}
          </>
        )}

        {/* ── Conditional rules sub-panel ── */}
        {panel === 'conditional' && (
          <>
            <BackClose onBack={() => setPanel('main')} />
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-4">
              {conditionalRules.length === 0 ? (
                <EmptyState
                  icon="fa-palette"
                  title="No rules yet"
                  description="Highlight rows automatically based on status, difficulty, or Bloom's level."
                />
              ) : (
                conditionalRules.map(rule => {
                  const fieldDef = filterFields.find(fd => fd.key === rule.fieldKey)
                  if (!fieldDef) return null
                  const isExpanded = condExpandedIds.has(rule.id)
                  return (
                    <div key={rule.id} className="rounded-lg border border-border overflow-hidden">
                      {/* Card header */}
                      <div className="flex items-start justify-between px-3 pt-2.5 pb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{fieldDef.label}</p>
                          <div className="flex items-center gap-1 flex-wrap min-w-0">
                            <Button
                              variant="ghost" size="xs"
                              onClick={() => onUpdateConditionalRule(rule.id, { operator: rule.operator === 'is' ? 'is_not' : 'is' })}
                              className="h-auto py-0 px-1 -ms-1 text-xs text-muted-foreground font-normal gap-1"
                              aria-label={`Operator: ${rule.operator === 'is' ? 'is' : 'is not'} — click to cycle`}
                            >
                              {rule.operator === 'is' ? 'is' : 'is not'}
                              <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                            </Button>
                            <span className="text-xs text-muted-foreground truncate">
                              {rule.values.join(', ') || '—'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 self-start">
                          <Button variant="ghost" size="icon-sm" onClick={() => onRemoveConditionalRule(rule.id)} aria-label="Remove rule"
                            className="text-muted-foreground hover:text-destructive">
                            <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setCondExpandedIds(prev => {
                            const next = new Set(prev); next.has(rule.id) ? next.delete(rule.id) : next.add(rule.id); return next
                          })} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
                            <i className={`fa-light ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`} aria-hidden="true" />
                          </Button>
                        </div>
                      </div>

                      {/* Highlight color swatch row — always visible */}
                      <div className="border-t border-border px-3 py-2.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Highlight color</p>
                        <div className="flex flex-wrap gap-2">
                          {QB_RULE_COLORS.map(c => (
                            <Button
                              key={c.name}
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={c.name}
                              onClick={() => onUpdateConditionalRule(rule.id, { bgColor: c.bg })}
                              className="rounded-xl border-2 transition-all p-0"
                              style={{
                                width: 28, height: 28,
                                background: c.bg,
                                borderColor: rule.bgColor === c.bg ? 'var(--foreground)' : 'transparent',
                                transform: rule.bgColor === c.bg ? 'scale(1.1)' : undefined,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Expanded body: value picker */}
                      {isExpanded && (
                        <div className="border-t border-border">
                          <div role="listbox" aria-multiselectable="true" className="py-1 max-h-48 overflow-y-auto">
                            {fieldDef.options.map(opt => {
                              const checked = rule.values.includes(opt)
                              return (
                                <div
                                  key={opt}
                                  role="option"
                                  aria-selected={checked}
                                  tabIndex={0}
                                  onClick={() => {
                                    const next = checked ? rule.values.filter(v => v !== opt) : [...rule.values, opt]
                                    onUpdateConditionalRule(rule.id, { values: next })
                                  }}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const next = checked ? rule.values.filter(v => v !== opt) : [...rule.values, opt]; onUpdateConditionalRule(rule.id, { values: next }) } }}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-interactive-hover cursor-pointer select-none focus-visible:outline-none focus-visible:bg-interactive-hover"
                                >
                                  <span aria-hidden="true" className="inline-flex items-center justify-center shrink-0 rounded-[3px] border transition-colors"
                                    style={{ width: 14, height: 14, background: checked ? 'var(--primary)' : 'var(--background)', borderColor: checked ? 'var(--primary)' : 'var(--border-control-3)' }}>
                                    {checked && <i className="fa-solid fa-check text-primary-foreground" aria-hidden="true" style={{ fontSize: 7 }} />}
                                  </span>
                                  <span className="text-foreground">{opt}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Add rule + Remove all — inline */}
              <div className="flex items-center gap-2 pt-1">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-dashed text-muted-foreground">
                      <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                      Add rule
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {filterFields.map(f => (
                      <DropdownMenuItem key={f.key} onClick={() => {
                        const id = `cond-${f.key}-${Date.now()}`
                        onAddConditionalRule({ id, fieldKey: f.key, operator: 'is', values: [], bgColor: QB_RULE_COLORS[0].bg })
                        setCondExpandedIds(prev => new Set([...prev, id]))
                      }}>
                        <i className={`fa-light ${f.icon}`} aria-hidden="true" />
                        {f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {conditionalRules.length > 0 && (
                  <Button
                    variant="ghost" size="sm"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { conditionalRules.forEach(r => onRemoveConditionalRule(r.id)); setCondExpandedIds(new Set()) }}
                  >
                    Remove all
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

      </SheetContent>
    </Sheet>
  )
}

// ── Detail sheet helpers ──────────────────────────────────────────────────────
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBlock: 5 }}>
      <span className="text-sm text-muted-foreground" style={{ width: 100, flexShrink: 0 }}>{label}</span>
      <span className="text-sm text-foreground" style={{ flex: 1 }}>{children}</span>
    </div>
  )
}

// Mock version history entries per version number
function mockVersionHistory(q: Question): { v: number; editor: string; date: string; summary: string; pbis: number | null; score: number | null }[] {
  const editors = ['persona-thompson', 'persona-chen', 'persona-patel']
  const summaries = [
    'Revised stem for clarity, updated distractors',
    'Adjusted difficulty level, added new distractor option',
    'Initial creation — stem and 4 answer choices',
    'Reformatted question stem, fixed typo',
    'Updated scoring rationale, adjusted key',
  ]
  return Array.from({ length: q.version }, (_, i) => {
    const vNum = q.version - i
    const editorId = editors[i % editors.length]
    const persona = MOCK_QB_PERSONAS.find(p => p.id === editorId)
    return {
      v: vNum,
      editor: persona?.name ?? editorId,
      date: i === 0 ? q.age : `${i + 1} months ago`,
      summary: summaries[i] ?? 'Minor edits',
      pbis: vNum === q.version ? q.pbis : q.pbis !== null ? +(q.pbis! - i * 0.04).toFixed(2) : null,
      score: q.usage > 0 ? Math.max(60, 88 - i * 3) : null,
    }
  })
}

// ── Question Detail Sheet ─────────────────────────────────────────────────────
function QuestionDetailSheet({ question, open, onClose, onMove }: { question: Question | null; open: boolean; onClose: () => void; onMove: (q: { id: string; title: string; folder: string }) => void }) {
  const { folders, updateQuestion, duplicateQuestion, currentPersona, accessibleFolderIds } = useQB()
  const router = useRouter()
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)

  useEffect(() => { if (!open) setVersionHistoryOpen(false) }, [open])

  if (!question) return null

  const isExamAdmin = currentPersona.role === 'exam_admin'
  const isCourseDirector = currentPersona.role === 'course_director'
  const isOwner = question.creator === currentPersona.id
  const canEdit = isOwner || isExamAdmin ||
    (isCourseDirector && question.status === 'Saved' && accessibleFolderIds.has(question.folder))

  const folder = folders.find(f => f.id === question.folder)
  const folderLabel = folder?.name ?? question.folderPath?.split(' / ').pop() ?? '—'

  const creatorPersona = MOCK_QB_PERSONAS.find(p => p.id === question.creator)
  const editorPersona  = MOCK_QB_PERSONAS.find(p => p.id === (question.lastEditedBy ?? question.creator))

  const visibleTags = question.tags.filter(t => t !== 'private')
  const versionHistory = mockVersionHistory(question)
  const lastUsed = question.usedInSections?.[0] ?? null
  const avgScore = question.usage > 0 ? 88 : null

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className="w-96 sm:max-w-96 p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden"
        style={{ top: '0.5rem', bottom: '0.5rem', right: '0.5rem', height: 'calc(100vh - 1rem)' }}
      >
        <SheetTitle className="sr-only">{question.title}</SheetTitle>

        {/* ── Header ── */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={question.status} />
              {question.tags.includes('private') && (
                <Badge variant="secondary" className="rounded text-[10px]" style={{ backgroundColor: 'color-mix(in oklch, var(--qb-private) 12%, var(--background))', color: 'var(--qb-private)' }}>
                  <i className="fa-solid fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 8, marginRight: 3 }} />Private
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
              <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          </div>
          <p className="text-sm font-semibold text-foreground" style={{ lineHeight: 1.45, marginBottom: 10 }}>
            {question.title}
          </p>
          {canEdit ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Button size="sm" variant="default" style={{ flex: 1, minWidth: 0 }} onClick={() => router.push(`/questions/${question.id}`)}>
                <i className="fa-light fa-pen" aria-hidden="true" />
                Edit question
              </Button>
              {question.status === 'Draft' ? (
                <Button size="sm" variant="outline"
                  onClick={() => updateQuestion(question.id, { status: 'Saved' })}>
                  <i className="fa-light fa-circle-check" aria-hidden="true" />
                  Mark as Saved
                </Button>
              ) : (
                <Button size="sm" variant="outline"
                  onClick={() => updateQuestion(question.id, { status: 'Draft' })}>
                  <i className="fa-light fa-hourglass" aria-hidden="true" />
                  Revert to Draft
                </Button>
              )}
              <Button size="sm" variant="outline"
                onClick={() => onMove({ id: question.id, title: question.title, folder: question.folder })}>
                <i className="fa-light fa-arrow-right-to-bracket" aria-hidden="true" />
                Move
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full"
              onClick={() => duplicateQuestion(question.id)}>
              <i className="fa-light fa-copy" aria-hidden="true" />
              Duplicate as Draft
            </Button>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Section 1: Tags & Classification ── */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground" style={{ marginBottom: 10 }}>Tags &amp; Classification</p>
            <DetailRow label="Bloom's"><BloomsBadge blooms={question.blooms} /></DetailRow>
            <DetailRow label="Difficulty"><DiffBadge diff={question.difficulty} /></DetailRow>
            <DetailRow label="Type"><span>{question.type}</span></DetailRow>
            <DetailRow label="Folder"><span>{folderLabel}</span></DetailRow>
            <DetailRow label="Code">
              <Badge variant="secondary" className="rounded font-mono border border-border text-[10px]" style={{ padding: '1px 5px' }}>{question.code}</Badge>
            </DetailRow>
            {visibleTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                {visibleTags.map(tag => (
                  <Badge key={tag} variant="outline" className="rounded text-xs" style={{ padding: '2px 7px' }}>#{tag}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 2: Creator & History ── */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground" style={{ marginBottom: 10 }}>Creator &amp; History</p>

            <DetailRow label="Created by">
              {creatorPersona ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="text-[8px] font-bold" style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {creatorPersona.initials}
                  </span>
                  {creatorPersona.name}
                </span>
              ) : <span className="text-sm text-muted-foreground">—</span>}
            </DetailRow>

            <DetailRow label="Last edited">
              <span>
                {question.age}{editorPersona && editorPersona.id !== question.creator ? ` by ${editorPersona.name}` : editorPersona ? ` by ${editorPersona.name}` : ''}
              </span>
            </DetailRow>

            <DetailRow label="Version">
              <span>v{question.version}</span>
            </DetailRow>

            {/* Version history toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 gap-1.5 px-0 font-medium text-sm"
              style={{ color: 'var(--brand-color)' }}
              onClick={() => setVersionHistoryOpen(v => !v)}
            >
              <i className={`fa-light fa-chevron-${versionHistoryOpen ? 'down' : 'right'}`} aria-hidden="true" style={{ fontSize: 10 }} />
              Version history
            </Button>

            {versionHistoryOpen && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {versionHistory.map((vh, i) => (
                  <div key={vh.v} style={{ padding: '10px 0', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Version badge */}
                    <Badge
                      variant="secondary"
                      className="rounded font-mono shrink-0 text-[9px]"
                      style={{ padding: '2px 6px', marginTop: 1, ...(i === 0 ? { backgroundColor: 'var(--sidebar-accent)', color: 'var(--sidebar-accent-foreground)' } : {}) }}
                    >
                      v{vh.v}
                    </Badge>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-xs font-medium text-foreground" style={{ marginBottom: 2 }}>{vh.summary}</div>
                      <div className="text-xs text-muted-foreground" style={{ marginBottom: vh.pbis !== null || vh.score !== null ? 6 : 0 }}>
                        {vh.editor} · {vh.date}
                      </div>
                      {/* Metrics for this version */}
                      {(vh.pbis !== null || vh.score !== null) && (
                        <div style={{ display: 'flex', gap: 10 }}>
                          {vh.pbis !== null && (
                            <span className="text-xs text-muted-foreground">
                              P-bis <span className="font-semibold text-foreground">{vh.pbis.toFixed(2)}</span>
                            </span>
                          )}
                          {vh.score !== null && (
                            <span className="text-xs text-muted-foreground">
                              Avg <span className="font-semibold text-foreground">{vh.score}%</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 3: Usage ── */}
          <div style={{ padding: '16px 18px' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground" style={{ marginBottom: 10 }}>Usage</p>
            <DetailRow label="Used in">
              <span>{question.usage > 0 ? `${question.usage} exam${question.usage !== 1 ? 's' : ''}` : '—'}</span>
            </DetailRow>
            {question.pbis !== null && (
              <DetailRow label="PBis">
                <span className="font-semibold text-foreground">
                  {question.pbis?.toFixed(2)}
                </span>
              </DetailRow>
            )}
            {avgScore !== null && (
              <DetailRow label="Avg score">
                <span>{avgScore}% correct</span>
              </DetailRow>
            )}
            {lastUsed && (
              <DetailRow label="Last used">
                <span>{lastUsed} · {question.age}</span>
              </DetailRow>
            )}
            {question.usage === 0 && question.pbis === null && (
              <p className="text-xs text-muted-foreground" style={{ marginTop: 4 }}>Not yet used in any assessment.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Pinned column sticky style helper ────────────────────────────────────────
function pinnedStyle(colKey: string, pinnedLeftCols: Set<string>, pinnedRightCols?: Set<string>): React.CSSProperties {
  if (pinnedLeftCols.has(colKey)) return { position: 'sticky', left: 0, background: 'var(--dt-row-bg)', boxShadow: '2px 0 4px var(--sticky-edge-fade)' }
  if (pinnedRightCols?.has(colKey)) return { position: 'sticky', right: 0, background: 'var(--dt-row-bg)', boxShadow: '-2px 0 4px var(--sticky-edge-fade)' }
  return {}
}

// ── Bloom's distribution popover content ─────────────────────────────────────
const BLOOMS_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const

function BloomsDistributionPopover({ questions }: { questions: Question[] }) {
  const total = questions.length
  if (total === 0) return <p className="text-xs text-muted-foreground">No questions visible</p>

  const entries = BLOOMS_ORDER
    .map(level => ({ level, count: questions.filter(q => q.blooms === level).length }))
    .sort((a, b) => b.count - a.count)
  const maxCount = entries[0]?.count ?? 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="text-xs font-semibold text-foreground">
        Bloom&apos;s — {total} visible
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map(({ level, count }) => {
          const pct = maxCount > 0 ? Math.round(count / maxCount * 100) : 0
          return (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="text-xs text-muted-foreground" style={{ width: 68, flexShrink: 0 }}>{level}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--muted)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--qb-blooms-bar)', borderRadius: 3 }} />
              </div>
              <span className="text-xs font-medium text-foreground" style={{ width: 20, textAlign: 'right', flexShrink: 0 }}>
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Difficulty distribution popover content ───────────────────────────────────
function DiffDistributionPopover({ questions }: { questions: Question[] }) {
  const total  = questions.length
  const easy   = questions.filter(q => q.difficulty === 'Easy').length
  const medium = questions.filter(q => q.difficulty === 'Medium').length
  const hard   = questions.filter(q => q.difficulty === 'Hard').length

  if (total === 0) return <p className="text-xs text-muted-foreground">No questions visible</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="text-xs font-semibold text-foreground">
        Difficulty — {total} visible
      </div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
        {easy   > 0 && <div style={{ flex: easy,   background: 'var(--qb-diff-bar-easy)' }} />}
        {medium > 0 && <div style={{ flex: medium, background: 'var(--qb-diff-bar-medium)' }} />}
        {hard   > 0 && <div style={{ flex: hard,   background: 'var(--qb-diff-bar-hard)' }} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {([
          ['Easy',   easy,   'var(--qb-diff-bar-easy)'],
          ['Medium', medium, 'var(--qb-diff-bar-medium)'],
          ['Hard',   hard,   'var(--qb-diff-bar-hard)'],
        ] as const).map(([label, count, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span className="flex-1 text-xs text-foreground">{label}</span>
            <span className="text-xs font-medium text-muted-foreground">
              {count} ({Math.round(count / total * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Column header with sort indicator + contextual menu ───────────────────────
function ColHeader({
  col, sortCol, sortDir, sortRules, onSort, onHide,
  onPinLeft, onPinRight, onUnpin,
  pinnedLeft, pinnedRight,
  wrapText, onToggleWrapText,
  onOpenFilterPanel,
  className,
  distQuestions,
  bloomsQuestions,
  filterOptions,
  filterSet,
  onFilterToggle,
  onSetFilter,
  filterOptionCounts,
  draggable, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverStyle,
  thClass,
  onRemoveSort,
}: {
  col: typeof QB_COLS[number]
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  sortRules?: { col: string; dir: 'asc' | 'desc' }[]
  onSort: (key: string, dir: 'asc' | 'desc') => void
  onHide: (key: ColKey) => void
  onPinLeft: (key: string) => void
  onPinRight: (key: string) => void
  onUnpin: (key: string) => void
  pinnedLeft?: boolean
  pinnedRight?: boolean
  wrapText?: boolean
  onToggleWrapText?: () => void
  onOpenFilterPanel?: () => void
  className?: string
  distQuestions?: Question[]
  bloomsQuestions?: Question[]
  filterOptions?: string[]
  filterSet?: Set<string>
  onFilterToggle?: (v: string) => void
  onSetFilter?: (values: string[]) => void
  /** Per-option question counts — when provided with filterOptions, switches to toggleable name list UX */
  filterOptionCounts?: Map<string, number>
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: () => void
  onDragEnd?: () => void
  dragOverStyle?: React.CSSProperties
  thClass?: string
  onRemoveSort?: (key: string) => void
}) {
  const isActive = sortCol === col.key
  const sortRuleIndex = sortRules?.findIndex(r => r.col === col.key) ?? -1
  const sortRank = sortRuleIndex >= 0 ? sortRuleIndex + 1 : null
  // Column-specific sort rule — may differ from the primary sort shims (sortCol/sortDir)
  const thisColRule = sortRules?.find(r => r.col === col.key)
  const thisColSortDir = thisColRule?.dir
  const stickyStyle: React.CSSProperties = pinnedLeft
    ? { position: 'sticky', left: 0, zIndex: 2, background: 'var(--dt-header-bg)', boxShadow: '2px 0 4px var(--sticky-edge-fade)' }
    : pinnedRight
    ? { position: 'sticky', right: 0, zIndex: 2, background: 'var(--dt-header-bg)', boxShadow: '-2px 0 4px var(--sticky-edge-fade)' }
    : {}

  const [diffHoverOpen, setDiffHoverOpen] = useState(false)
  const diffHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [bloomsHoverOpen, setBloomsHoverOpen] = useState(false)
  const bloomsHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [colSearch, setColSearch] = useState('')
  const hasInlineFilter = !!filterOptions && filterOptions.length > 0
  // Unselected options matching the current search — drives the dropdown list
  const filteredUnselectedOptions = (filterOptions ?? []).filter(o =>
    !(filterSet?.has(o)) && (!colSearch || o.toLowerCase().includes(colSearch.toLowerCase()))
  )
  const [dropdownFocusIdx, setDropdownFocusIdx] = useState(-1)
  // Ref so the Enter handler always reads the current index (avoids stale closure)
  const dropdownFocusIdxRef = useRef(-1)
  const setFocusIdx = (n: number) => { dropdownFocusIdxRef.current = n; setDropdownFocusIdx(n) }
  // Reset when search changes
  useEffect(() => { setFocusIdx(-1) }, [colSearch])

  useEffect(() => {
    return () => {
      if (diffHoverTimerRef.current) clearTimeout(diffHoverTimerRef.current)
      if (bloomsHoverTimerRef.current) clearTimeout(bloomsHoverTimerRef.current)
    }
  }, [])

  return (
    <TableHead
      className={`${thClass ?? TH} ${className ?? ''}`}
      style={{ ...(dragOverStyle ?? stickyStyle), ...(draggable ? { cursor: 'grab' } : {}) }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <DropdownMenu onOpenChange={open => { if (!open) setColSearch('') }}>
        {/* Sortable column header — role/tabIndex/onKeyDown + focus-visible
            ring so keyboard users can trigger sort (was raw <div onClick>
            with no a11y). The inner Popover trigger keeps its own focus. */}
        <div
          className="flex items-center gap-1 group/col-hdr cursor-pointer select-none w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          onClick={() => col.sortKey && onSort(col.key, isActive && sortDir === 'asc' ? 'desc' : 'asc')}
          role={col.sortKey ? 'button' : undefined}
          tabIndex={col.sortKey ? 0 : undefined}
          aria-label={
            col.sortKey
              ? `Sort by ${col.label}, ${
                  isActive
                    ? sortDir === 'asc'
                      ? 'currently ascending'
                      : 'currently descending'
                    : 'not sorted'
                }`
              : undefined
          }
          onKeyDown={e => {
            if (col.sortKey && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onSort(col.key, isActive && sortDir === 'asc' ? 'desc' : 'asc')
            }
          }}
        >
          {col.key === 'difficulty' ? (
            <Popover open={diffHoverOpen} onOpenChange={setDiffHoverOpen}>
              <PopoverTrigger asChild>
                <span
                  className={`flex-1 truncate cursor-default${isActive ? ' text-foreground' : ''}`}
                  onMouseEnter={() => {
                    if (diffHoverTimerRef.current) clearTimeout(diffHoverTimerRef.current)
                    diffHoverTimerRef.current = setTimeout(() => setDiffHoverOpen(true), 400)
                  }}
                  onMouseLeave={() => { if (diffHoverTimerRef.current) clearTimeout(diffHoverTimerRef.current); setDiffHoverOpen(false) }}
                >
                  {col.label}
                </span>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-52 p-3">
                <DiffDistributionPopover questions={distQuestions ?? []} />
              </PopoverContent>
            </Popover>
          ) : col.key === 'blooms' ? (
            <Popover open={bloomsHoverOpen} onOpenChange={setBloomsHoverOpen}>
              <PopoverTrigger asChild>
                <span
                  className={`flex-1 truncate cursor-default${isActive ? ' text-foreground' : ''}`}
                  onMouseEnter={() => {
                    if (bloomsHoverTimerRef.current) clearTimeout(bloomsHoverTimerRef.current)
                    bloomsHoverTimerRef.current = setTimeout(() => setBloomsHoverOpen(true), 400)
                  }}
                  onMouseLeave={() => { if (bloomsHoverTimerRef.current) clearTimeout(bloomsHoverTimerRef.current); setBloomsHoverOpen(false) }}
                >
                  {col.label}
                </span>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-52 p-3">
                <BloomsDistributionPopover questions={bloomsQuestions ?? []} />
              </PopoverContent>
            </Popover>
          ) : (
            <span className={`flex-1 truncate${isActive ? ' text-foreground' : ''}`}>{col.label}</span>
          )}
          {sortRank !== null && (
            <span className="flex items-center gap-0.5 ml-1 shrink-0">
              <i
                className={`fa-solid ${(sortRules?.find(r => r.col === col.key)?.dir ?? 'asc') === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'} text-xs`}
                aria-hidden="true"
              />
              {(sortRules?.length ?? 0) > 1 && (
                <span className="text-[9px] font-bold leading-none" style={{ color: 'var(--brand-color)' }}>
                  {sortRank}
                </span>
              )}
            </span>
          )}
          <DropdownMenuTrigger
            className="opacity-0 group-hover/col-hdr:opacity-100 transition-opacity flex items-center justify-center"
            onClick={e => e.stopPropagation()}
            asChild
          >
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Column options for ${col.label}`}
            >
              <i className="fa-light fa-chevron-down text-[9px] text-muted-foreground" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </div>

        <DropdownMenuContentEx
          align="start"
          className="w-52"
          onCloseAutoFocus={e => e.preventDefault()}
          onOpenAutoFocus={e => { if (hasInlineFilter) e.preventDefault() }}
        >
          {/* Column filter — tag search */}
          {hasInlineFilter && (
            <>
              {/* Search input wrapper — key handler in bubble phase fires before Radix's DropdownMenuContent handler */}
              <div
                className="px-2 pt-2 pb-1"
                style={{ position: 'relative' }}
                onKeyDown={e => {
                  // stopPropagation here (bubble) prevents Radix's onKeyDown on DropdownMenuContent from firing
                  e.stopPropagation()
                  const opts = filteredUnselectedOptions
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    setFocusIdx(e.key === 'ArrowDown'
                      ? Math.min(dropdownFocusIdxRef.current + 1, opts.length - 1)
                      : Math.max(dropdownFocusIdxRef.current - 1, 0))
                  } else if (e.key === 'Enter' && opts.length > 0) {
                    const idx = dropdownFocusIdxRef.current
                    const pick = idx >= 0 ? opts[idx] : opts[0]
                    if (pick) { onFilterToggle?.(pick); setColSearch(''); setFocusIdx(-1) }
                  } else if (e.key === 'Backspace' && !colSearch && filterSet && filterSet.size > 0) {
                    onFilterToggle?.([...filterSet].at(-1)!)
                  }
                }}
              >
                <InputGroup style={{ height: 28 }}>
                  <InputGroupAddon align="inline-start">
                    <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted-foreground)', padding: '0 4px' }} />
                  </InputGroupAddon>
                  <InputGroupInput
                    autoFocus
                    placeholder={`Search ${col.label.toLowerCase()}…`}
                    value={colSearch}
                    onChange={e => setColSearch(e.target.value)}
                    className="text-xs"
                    style={{ height: 28 }}
                  />
                </InputGroup>

                {/* Floating dropdown — z-index overlay, no effect on menu height */}
                {colSearch && filteredUnselectedOptions.length > 0 && (
                  <div
                    role="listbox"
                    aria-multiselectable="true"
                    aria-label={`Filter by ${col.label}`}
                    style={{
                      position: 'absolute', top: 'calc(100% - 4px)', left: 8, right: 8,
                      zIndex: 9999,
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px oklch(0 0 0 / 0.12)',
                      maxHeight: 160, overflowY: 'auto',
                    }}
                  >
                    {filteredUnselectedOptions.map((opt, idx) => (
                      <div
                        key={opt}
                        role="option"
                        aria-selected={false}
                        tabIndex={-1}
                        onMouseDown={e => e.preventDefault()}
                        onMouseEnter={() => setFocusIdx(idx)}
                        onMouseLeave={() => setFocusIdx(-1)}
                        onClick={() => { onFilterToggle?.(opt); setColSearch(''); setFocusIdx(-1) }}
                        className="text-xs text-foreground truncate"
                        style={{
                          padding: '6px 12px', cursor: 'pointer', userSelect: 'none',
                          backgroundColor: idx === dropdownFocusIdx ? 'var(--interactive-hover)' : undefined,
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
                {colSearch && filteredUnselectedOptions.length === 0 && (
                  <p className="text-[11px] text-muted-foreground" style={{ position: 'absolute', top: 'calc(100% - 4px)', left: 8, padding: '4px 4px 6px' }}>No matches</p>
                )}
              </div>
              {/* Selected tags — below search, always visible when something is selected */}
              {filterSet && filterSet.size > 0 && (
                <div className="px-2 pt-0.5 pb-2 flex flex-wrap gap-1" onKeyDownCapture={e => e.stopPropagation()}>
                  {[...filterSet].map(opt => (
                    <span
                      key={opt}
                      className="inline-flex items-center gap-0.5 text-[11px] shrink-0 select-none"
                      style={{
                        padding: '2px 4px 2px 8px', borderRadius: 4,
                        backgroundColor: 'var(--muted)', border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                      }}
                    >
                      <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
                      <span
                        role="button"
                        aria-label={`Remove ${opt}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={e => { e.stopPropagation(); onFilterToggle?.(opt) }}
                        style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '0 2px', color: 'var(--muted-foreground)' }}
                      >
                        <i className="fa-solid fa-xmark" aria-hidden="true" style={{ fontSize: 7 }} />
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          {/* Pin actions */}
          {pinnedLeft || pinnedRight ? (
            <DropdownMenuItem onClick={() => onUnpin(col.key)}>
              <i className="fa-light fa-arrows-left-right" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
              Unpin column
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onPinLeft(col.key)}>
                <i className="fa-light fa-arrow-left-to-line" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
                Pin Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPinRight(col.key)}>
                <i className="fa-light fa-arrow-right-to-line" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
                Pin Right
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />

          {/* Sort */}
          {col.sortKey && (
            <>
              <DropdownMenuItem onClick={() => {
                if (thisColRule && thisColSortDir === 'asc') { onRemoveSort?.(col.key) }
                else { onSort(col.key, 'asc') }
              }}>
                <i className="fa-light fa-arrow-up-a-z" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
                Sort Ascending
                {thisColSortDir === 'asc' && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (thisColRule && thisColSortDir === 'desc') { onRemoveSort?.(col.key) }
                else { onSort(col.key, 'desc') }
              }}>
                <i className="fa-light fa-arrow-down-z-a" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
                Sort Descending
                {thisColSortDir === 'desc' && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Wrap text */}
          <DropdownMenuItem onClick={onToggleWrapText}>
            <i className="fa-light fa-text-width" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
            Wrap Text
            {wrapText && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {/* Filter / group / conditional */}
          <DropdownMenuItem onClick={onOpenFilterPanel}>
            <i className="fa-light fa-filter" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
            Filter by this column
          </DropdownMenuItem>
          <DropdownMenuItem>
            <i className="fa-light fa-layer-group" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
            Group by this Column
          </DropdownMenuItem>
          <DropdownMenuItem>
            <i className="fa-light fa-palette" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
            Add Conditional Rule
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {/* Hide */}
          <DropdownMenuItem
            onClick={() => col.hideable && onHide(col.key)}
            disabled={!col.hideable}
          >
            <i className="fa-light fa-eye-slash" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
            Hide column
          </DropdownMenuItem>
        </DropdownMenuContentEx>
      </DropdownMenu>
    </TableHead>
  )
}

// ── Question Table ────────────────────────────────────────────────────────────
export function QBTable() {
  const router = useRouter()
  const {
    visibleQuestions,
    selectedQuestionIds, toggleQuestionSelection, selectAllQuestions, clearSelection,
    rowHoverId, setRowHoverId,
    currentPersona,
    setDraggedQuestionId,
    openMenuQuestionId, setOpenMenuQuestionId,
    myQuestionsOnly, setMyQuestionsOnly,
    favoritedIds, toggleQuestionFavorited,
    columnOrder, setColumnOrder,
    updateQuestion, deleteQuestion,
    duplicateQuestion,
    moveQuestionToFolder,
    archiveQuestion,
    removeQuestionFromFolder,
    copyQuestionToFolder,
    anchorQuestionId, setAnchorQuestionId,
    folders,
    setCollaboratorsModalFolderId,
    selectedFolderId,
    selectedFolder,
    navView,
    setNavView,
    personas,
    accessibleFolderIds,
  } = useQB()

  const compactTitle = navView === 'folder' && selectedFolder
    ? (selectedFolder.isCourse ? courseFolderShortLabel(selectedFolder.name) : selectedFolder.name)
    : navView === 'my' ? 'My Questions' : 'All Questions'

  // Collaborator ids inherited up the folder ancestry (same logic as QBTitle)
  const compactCollaboratorIds = (() => {
    if (!selectedFolder) return []
    const ids = new Set<string>()
    let node: typeof selectedFolder | undefined = selectedFolder
    while (node) {
      for (const id of node.collaborators ?? []) ids.add(id)
      node = node.parentId ? folders.find(f => f.id === node!.parentId) : undefined
    }
    return Array.from(ids)
  })()

  const isExamAdmin = currentPersona.role === 'exam_admin'
  const isCourseDirector = currentPersona.role === 'course_director'

  const [reqAccessQuestion, setReqAccessQuestion] = useState<{ id: string; title: string } | null>(null)
  const [moveTarget, setMoveTarget] = useState<{ id: string; title: string; folder: string } | null>(null)
  const [copyTarget, setCopyTarget] = useState<{ id: string; title: string } | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [detailQuestionId, setDetailQuestionId] = useState<string | null>(null)
  const detailQuestion = detailQuestionId ? (visibleQuestions.find(q => q.id === detailQuestionId) ?? null) : null

  // ── Bulk action state ─────────────────────────────────────────────────────
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false)
  const [bulkCopyOpen, setBulkCopyOpen] = useState(false)
  const [bulkStatusTarget, setBulkStatusTarget] = useState<QStatus | null>(null)

  // ── Toolbar state ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<QBFilter[]>([])
  const [lastAddedFilterId, setLastAddedFilterId] = useState<string | null>(null)
  const [expandedFilterIds, setExpandedFilterIds] = useState<Set<string>>(new Set())
  const [bookmarkOnly, setBookmarkOnly] = useState(false)
  // Multi-column sort: ordered array of rules (primary first).
  const [sortRules, setSortRules] = useState<{ col: string; dir: 'asc' | 'desc' }[]>([])
  // Derived shims so call-sites that read sortCol/sortDir still work.
  const sortCol = sortRules[0]?.col ?? null
  const sortDir = sortRules[0]?.dir ?? 'asc'
  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set())
  const [pinnedCols, setPinnedCols] = useState<Set<string>>(new Set())
  const [pinnedRightCols, setPinnedRightCols] = useState<Set<string>>(new Set())
  const [wrapText, setWrapText] = useState(false)
  const [initialPropertiesPanel, setInitialPropertiesPanel] = useState<SheetPanel>('main')
  const [filterBarVisible, setFilterBarVisible] = useState(true)
  const [filterLogic, setFilterLogic] = useState<'and' | 'or'>('and')
  const [groupBy, setGroupBy] = useState<string | null>(null)
  const [showGridlines, setShowGridlines] = useState(true)
  const [rowHeight, setRowHeight] = useState<QBRowHeight>('default')
  const rowPy = rowHeight === 'compact' ? 'py-1' : rowHeight === 'comfortable' ? 'py-4' : 'py-2.5'
  // Shadow the module-level TD so all cells pick up the current density + optional gridlines
  const TD = `px-3 ${rowPy} align-middle border-b border-border group-last/row:border-b-0 whitespace-nowrap${showGridlines ? ' border-r border-border last:border-r-0' : ''}`
  // Shadow TH so header cells get matching vertical gridlines
  const TH_CLS = `h-9 px-3 text-start align-middle text-xs font-medium text-muted-foreground tracking-wide bg-dt-header-bg border-b border-border select-none whitespace-nowrap${showGridlines ? ' border-r border-border last:border-r-0' : ''}`
  const [paginationEnabled, setPaginationEnabled] = useState(true)
  const [showTableTitle, setShowTableTitle] = useState(true)
  const [showColumnLabels, setShowColumnLabels] = useState(true)
  const [showSearch, setShowSearch] = useState(true)
  // Zoom ≥ ~350% regardless of monitor size: screen.width / innerWidth detects zoom
  // independently of whether the display is 1080p, 4K, or Retina.
  const [isHighZoom, setIsHighZoom] = useState(false)

  useEffect(() => {
    const check = () => {
      const ratio = window.screen.width / window.innerWidth
      const high = ratio >= 3.5
      setIsHighZoom(high)
      if (high) setSearchOpen(true)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 960px)')
    const update = () => setShowTableTitle(!mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const [conditionalRules, setConditionalRules] = useState<QBConditionalRule[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  // ── Column drag-reorder state ─────────────────────────────────────────────
  const dragColRef = useRef<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  // ── Visible columns ordered by columnOrder (hideable) + fixed positions ──
  const visibleCols = useMemo(() => {
    const FIXED_START = ['select', 'title', 'status'] as const
    const FIXED_END   = ['actions'] as const
    const reorderable = columnOrder.filter(k => !hiddenCols.has(k as ColKey))
    return [
      ...QB_COLS.filter(c => FIXED_START.includes(c.key as typeof FIXED_START[number]) && !hiddenCols.has(c.key as ColKey)),
      ...QB_COLS.filter(c =>
        reorderable.includes(c.key) &&
        !FIXED_START.includes(c.key as typeof FIXED_START[number]) &&
        !FIXED_END.includes(c.key as typeof FIXED_END[number])
      ).sort((a, b) => reorderable.indexOf(a.key) - reorderable.indexOf(b.key)),
      ...QB_COLS.filter(c => FIXED_END.includes(c.key as typeof FIXED_END[number]) && !hiddenCols.has(c.key as ColKey)),
    ]
  }, [columnOrder, hiddenCols])

  function handleSort(key: string, dir: 'asc' | 'desc') {
    if (!key) { setSortRules([]); return }
    setSortRules(prev => {
      const existing = prev.find(r => r.col === key)
      if (existing) {
        // Toggle direction if already in rules
        return prev.map(r => r.col === key ? { ...r, dir } : r)
      }
      // Add as new rule (primary if list empty, secondary/tertiary otherwise)
      return [...prev, { col: key, dir }]
    })
  }
  function removeSortRule(col: string) {
    setSortRules(prev => prev.filter(r => r.col !== col))
  }
  function toggleSortDir(col: string) {
    setSortRules(prev => prev.map(r => r.col === col ? { ...r, dir: r.dir === 'asc' ? 'desc' : 'asc' } : r))
  }
  function clearAllSorts() { setSortRules([]) }

  function addFilter(fieldKey: QBFilterKey) {
    const id = `${fieldKey}-${Date.now()}`
    setActiveFilters(prev => [...prev, { id, fieldKey, operator: 'is', values: [] }])
    setExpandedFilterIds(prev => new Set([...prev, id]))
    setLastAddedFilterId(id)
  }

  function updateFilter(id: string, patch: Partial<Omit<QBFilter, 'id'>>) {
    setActiveFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  function removeFilter(id: string) {
    setActiveFilters(prev => prev.filter(f => f.id !== id))
    setExpandedFilterIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function addConditionalRule(rule: QBConditionalRule) {
    setConditionalRules(prev => [...prev, rule])
  }

  function removeConditionalRule(id: string) {
    setConditionalRules(prev => prev.filter(r => r.id !== id))
  }

  function updateConditionalRule(id: string, patch: Partial<Omit<QBConditionalRule, 'id'>>) {
    setConditionalRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  function getConditionalRowBg(question: Question): string | undefined {
    for (const rule of conditionalRules) {
      if (rule.values.length === 0) continue
      let val = ''
      if (rule.fieldKey === 'status')        val = question.status
      if (rule.fieldKey === 'type')          val = question.type
      if (rule.fieldKey === 'difficulty')    val = question.difficulty
      if (rule.fieldKey === 'blooms')        val = question.blooms
      if (rule.fieldKey === 'creator')       val = personas.find(p => p.id === question.creator)?.name ?? ''
      if (rule.fieldKey === 'lastEditedBy')  val = personas.find(p => p.id === question.lastEditedBy)?.name ?? ''
      const matches = rule.values.includes(val)
      if ((rule.operator === 'is' && matches) || (rule.operator === 'is_not' && !matches)) {
        return rule.bgColor
      }
    }
    return undefined
  }

  const qbFilterFields = QB_FILTER_FIELDS.map(f => {
    if (f.key === 'status') {
      const counts = new Map<string, number>()
      for (const q of visibleQuestions) counts.set(q.status, (counts.get(q.status) ?? 0) + 1)
      return { ...f, counts }
    }
    if (f.key === 'creator' || f.key === 'lastEditedBy') {
      const ids = [...new Set(
        visibleQuestions.map(q => f.key === 'creator' ? q.creator : q.lastEditedBy).filter((id): id is string => !!id)
      )]
      const options = ids.map(id => personas.find(p => p.id === id)?.name ?? id).sort()
      return { ...f, options }
    }
    if (f.key === 'location') {
      const paths = [...new Set(visibleQuestions.map(q => q.folderPath).filter(Boolean))].sort() as string[]
      return { ...f, options: paths }
    }
    return f
  })

  /** Returns per-option question counts for creator/lastEditedBy column headers (toggle-list mode) */
  function getColFilterOptionCounts(colKey: ColKey): Map<string, number> | undefined {
    if (colKey !== 'creator' && colKey !== 'lastEditedBy') return undefined
    const counts = new Map<string, number>()
    for (const q of visibleQuestions) {
      const personaId = colKey === 'creator' ? q.creator : q.lastEditedBy
      if (!personaId) continue
      const name = personas.find(p => p.id === personaId)?.name ?? personaId
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    return counts
  }

  function getColFilterSet(colKey: ColKey): Set<string> | undefined {
    const fieldKey = colKey as QBFilterKey
    if (!QB_FILTER_FIELDS.some(f => f.key === fieldKey)) return undefined
    const f = activeFilters.find(f => f.fieldKey === fieldKey)
    return new Set(f?.values ?? [])
  }

  function getColFilterToggler(colKey: ColKey): ((v: string) => void) | undefined {
    const fieldKey = colKey as QBFilterKey
    if (!QB_FILTER_FIELDS.some(f => f.key === fieldKey)) return undefined
    return v => {
      setActiveFilters(prev => {
        const existing = prev.find(f => f.fieldKey === fieldKey)
        if (existing) {
          const newValues = existing.values.includes(v) ? existing.values.filter(x => x !== v) : [...existing.values, v]
          if (newValues.length === 0) return prev.filter(f => f.fieldKey !== fieldKey)
          return prev.map(f => f.fieldKey === fieldKey ? { ...f, values: newValues } : f)
        }
        const id = `${fieldKey}-${Date.now()}`
        return [...prev, { id, fieldKey, operator: 'is', values: [v] }]
      })
    }
  }

  function getColFilterSetter(colKey: ColKey): ((values: string[]) => void) | undefined {
    const fieldKey = colKey as QBFilterKey
    if (!QB_FILTER_FIELDS.some(f => f.key === fieldKey)) return undefined
    return values => {
      setActiveFilters(prev => {
        if (values.length === 0) return prev.filter(f => f.fieldKey !== fieldKey)
        const existing = prev.find(f => f.fieldKey === fieldKey)
        if (existing) return prev.map(f => f.fieldKey === fieldKey ? { ...f, values } : f)
        const id = `${fieldKey}-${Date.now()}`
        return [...prev, { id, fieldKey, operator: 'is', values }]
      })
    }
  }

  const activeNonEmptyFilters = activeFilters.filter(f => f.values.length > 0)
  const hasActiveFilters = activeNonEmptyFilters.length > 0
  const activeFilterCount = activeNonEmptyFilters.length + (bookmarkOnly ? 1 : 0)
  const hasAnyFilter = search || hasActiveFilters || bookmarkOnly

  function clearAllFilters() {
    setSearch('')
    setActiveFilters([])
    setExpandedFilterIds(new Set())
    setBookmarkOnly(false)
  }

  const activeFilterChips: ChipDef[] = [
    ...activeNonEmptyFilters.map(f => {
      const fieldDef = qbFilterFields.find(fd => fd.key === f.fieldKey)!
      const countLabel = f.values.length === 1 ? f.values[0] : `${f.values.length} selected`
      return {
        key: `filter-${f.id}`,
        icon: fieldDef.icon,
        label: `${fieldDef.label}: ${countLabel}`,
        onRemove: () => removeFilter(f.id),
      }
    }),
    ...(bookmarkOnly ? [{ key: 'bookmark', icon: 'fa-star', label: 'Bookmarked', onRemove: () => setBookmarkOnly(false) }] : []),
  ]

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filteredQuestions = visibleQuestions.filter(q => {
    if (search) {
      const s = search.toLowerCase()
      const creatorName = personas.find(p => p.id === q.creator)?.name ?? ''
      const editorName  = personas.find(p => p.id === q.lastEditedBy)?.name ?? ''
      const allLocations = [q.folderPath, ...(q.extraFolders ?? []).map(e => e.folderPath)].join(' ')
      const searchable = [
        q.title, q.code, q.type, q.status, q.difficulty, q.blooms,
        creatorName, editorName, allLocations, ...(q.tags ?? []),
        ...(q.usedInSections ?? []),
      ].join(' ').toLowerCase()
      if (!searchable.includes(s)) return false
    }
    if (bookmarkOnly && !favoritedIds.has(q.id)) return false
    for (const f of activeNonEmptyFilters) {
      let val = ''
      if (f.fieldKey === 'status')        val = q.status
      if (f.fieldKey === 'type')          val = q.type
      if (f.fieldKey === 'difficulty')    val = q.difficulty
      if (f.fieldKey === 'blooms')        val = q.blooms
      if (f.fieldKey === 'creator')       val = personas.find(p => p.id === q.creator)?.name ?? ''
      if (f.fieldKey === 'lastEditedBy')  val = personas.find(p => p.id === q.lastEditedBy)?.name ?? ''
      if (f.fieldKey === 'location')      val = q.folderPath ?? ''
      const matches = f.values.includes(val)
      if (f.operator === 'is'     && !matches) return false
      if (f.operator === 'is_not' &&  matches) return false
    }
    return true
  })

  // ── Sort — multi-column, rules applied in order ───────────────────────────
  const DIFF_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 }
  function sortValue(q: Question, col: string): string | number {
    if (col === 'title')      return q.title ?? ''
    if (col === 'status')     return q.status ?? ''
    if (col === 'type')       return q.type ?? ''
    if (col === 'difficulty') return DIFF_ORDER[q.difficulty] ?? 0
    if (col === 'blooms')     return q.blooms ?? ''
    if (col === 'creator')    return q.creator ?? ''
    if (col === 'usage')      return q.usage ?? 0
    if (col === 'pbis')       return q.pbis ?? 0
    return ''
  }
  const sortedQuestions = (() => {
    const base = sortRules.length === 0
      ? filteredQuestions
      : [...filteredQuestions].sort((a, b) => {
          for (const rule of sortRules) {
            const va = sortValue(a, rule.col)
            const vb = sortValue(b, rule.col)
            const cmp = typeof va === 'number' && typeof vb === 'number'
              ? va - vb
              : String(va).localeCompare(String(vb))
            if (cmp !== 0) return rule.dir === 'asc' ? cmp : -cmp
          }
          return 0
        })
    // Archived always sinks to end regardless of sort rules (ADR-002)
    if (!base.some(q => q.status === 'Archived')) return base
    return [...base].sort((a, b) => {
      if (a.status === 'Archived' && b.status !== 'Archived') return 1
      if (b.status === 'Archived' && a.status !== 'Archived') return -1
      return 0
    })
  })()

  // ── Group value extractor ─────────────────────────────────────────────────
  function getGroupValue(q: Question): string {
    if (!groupBy) return ''
    if (groupBy === 'status')       return q.status ?? 'Unknown'
    if (groupBy === 'type')         return q.type ?? 'Unknown'
    if (groupBy === 'difficulty')   return q.difficulty ?? 'Unknown'
    if (groupBy === 'blooms')       return q.blooms ?? 'Unknown'
    if (groupBy === 'creator')      return MOCK_QB_PERSONAS.find(p => p.id === q.creator)?.name ?? q.creator ?? 'Unknown'
    if (groupBy === 'lastEditedBy') return MOCK_QB_PERSONAS.find(p => p.id === q.lastEditedBy)?.name ?? q.lastEditedBy ?? 'Unknown'
    return 'Unknown'
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const totalPages = paginationEnabled ? Math.ceil(sortedQuestions.length / perPage) : 1
  const pageQuestions = paginationEnabled
    ? sortedQuestions.slice((page - 1) * perPage, page * perPage)
    : sortedQuestions

  // Reset to page 1 when filters/sort/pagination/perPage change
  useEffect(() => { setPage(1) }, [search, activeFilters, bookmarkOnly, sortRules, paginationEnabled, perPage, visibleQuestions])

  // Clear row anchor after animation completes (2s, matches CSS)
  useEffect(() => {
    if (!anchorQuestionId) return
    const t = setTimeout(() => setAnchorQuestionId(null), 2000)
    return () => clearTimeout(t)
  }, [anchorQuestionId, setAnchorQuestionId])

  // ── Grouped table rows ────────────────────────────────────────────────────
  type TableRowItem =
    | { type: 'header'; label: string; count: number }
    | { type: 'row'; question: Question }

  const tableRows: TableRowItem[] = groupBy
    ? (() => {
        const buckets = new Map<string, Question[]>()
        for (const q of pageQuestions) {
          const key = getGroupValue(q)
          if (!buckets.has(key)) buckets.set(key, [])
          buckets.get(key)!.push(q)
        }
        const rows: TableRowItem[] = []
        for (const [label, qs] of buckets) {
          rows.push({ type: 'header', label, count: qs.length })
          for (const q of qs) rows.push({ type: 'row', question: q })
        }
        return rows
      })()
    : pageQuestions.map(q => ({ type: 'row' as const, question: q }))

  const allSelected = pageQuestions.length > 0 && pageQuestions.every(q => selectedQuestionIds.has(q.id))
  const someSelected = pageQuestions.some(q => selectedQuestionIds.has(q.id)) && !allSelected
  const anySelected = selectedQuestionIds.size > 0

  function handleSelectAll() {
    if (allSelected) clearSelection()
    else selectAllQuestions()
  }

  const isTrulyEmpty = visibleQuestions.length === 0 && activeFilters.length === 0 && !search && !bookmarkOnly

  return (
    <div className={`qb-table-outer${isHighZoom ? ' qb-high-zoom' : ''}`} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <QBTitle />

      {/* ── Toolbar: pinned outside scroll — filter chips left, icon controls right ── */}
      {!isTrulyEmpty && (
      <div className="qb-toolbar" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: '6px 16px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>

        {/* Compact title + collaborators + Add Question — hidden at normal zoom,
            shown at ≤960px (CSS) or when JS detects zoom ≥350% (qb-high-zoom class) */}
        <div className="qb-toolbar-add-btn" style={{ display: 'none', alignItems: 'center', gap: 8, flexShrink: 0, minWidth: 0, maxWidth: 320 }}>

          {/* Left group: title + avatars + icon sit together, title shrinks when long */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Tip label={compactTitle}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--foreground)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                  flexShrink: 1,
                  cursor: 'default',
                }}
              >
                {compactTitle}
              </span>
            </Tip>

            {/* Collaborator avatar stack — max 3, overflow as +N */}
            {compactCollaboratorIds.length > 0 && (() => {
              const MAX = 3
              const personas = MOCK_QB_PERSONAS.filter(p => compactCollaboratorIds.includes(p.id))
              const shown = personas.slice(0, MAX)
              const extra = personas.length - MAX
              return (
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {shown.map((p, i) => (
                    <Tip key={p.id} label={p.name}>
                      <Avatar style={{ width: 22, height: 22, marginLeft: i === 0 ? 0 : -6, border: '2px solid var(--background)', borderRadius: '50%', zIndex: shown.length - i, position: 'relative', flexShrink: 0 }}>
                        <AvatarFallback className="text-[8px] font-bold" style={{ backgroundColor: 'color-mix(in oklch, var(--foreground) 8%, var(--background))', color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))' }}>
                          {p.initials}
                        </AvatarFallback>
                      </Avatar>
                    </Tip>
                  ))}
                  {extra > 0 && (
                    <Tip label={personas.slice(MAX).map(p => p.name).join(', ')}>
                      <span className="text-[10px] font-semibold text-muted-foreground" style={{ marginLeft: 4, flexShrink: 0, cursor: 'default' }}>
                        +{extra}
                      </span>
                    </Tip>
                  )}
                </div>
              )
            })()}

            {/* Manage access icon */}
            {isExamAdmin && selectedFolder && (
              <Tip label="Manage access">
                <Button
                  variant="ghost" size="icon-xs"
                  aria-label="Manage access"
                  className="text-muted-foreground"
                  style={{ width: 26, height: 26, flexShrink: 0 }}
                  onClick={() => setCollaboratorsModalFolderId(selectedFolderId)}
                >
                  <i className="fa-light fa-user-plus" aria-hidden="true" style={{ fontSize: 12 }} />
                </Button>
              </Tip>
            )}
          </div>

          {/* Add Question — icon-only at high zoom to save space, labelled at normal zoom */}
          {isHighZoom ? (
            <Tip label="Add Question">
              <Button
                variant="default" size="icon-sm"
                aria-label="Add Question"
                style={{ flexShrink: 0 }}
                onClick={() => router.push(selectedFolderId ? `/questions/new?folder=${selectedFolderId}` : '/questions/new')}
              >
                <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 13 }} />
              </Button>
            </Tip>
          ) : (
            <Button
              variant="default" size="sm"
              style={{ gap: 5, flexShrink: 0 }}
              onClick={() => router.push(selectedFolderId ? `/questions/new?folder=${selectedFolderId}` : '/questions/new')}
            >
              <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
              Add Question
            </Button>
          )}
        </div>

        {/* Filter chips — shown at normal zoom; hidden at ≤960px via CSS */}
        <div className="qb-toolbar-chips" style={{ display: 'contents' }}>
          {filterBarVisible ? (
            <FilterChips
              activeFilters={activeFilters}
              bookmarkChips={bookmarkOnly ? [{ key: 'bookmark', icon: 'fa-star', label: 'Bookmarked', onRemove: () => setBookmarkOnly(false) }] : []}
              lastAddedId={lastAddedFilterId}
              onAddFilter={addFilter}
              onUpdateFilter={updateFilter}
              onRemoveFilter={removeFilter}
              onClearAll={clearAllFilters}
              filterFields={qbFilterFields}
            />
          ) : <div style={{ flex: 1 }} />}
        </div>

        {/* Right: icon controls */}
        <div className="qb-toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

          {/* Search — at high zoom: always open, full-width; otherwise: expand on click */}
          {showSearch && <div style={{
            display: 'flex', alignItems: 'center',
            width: isHighZoom ? '100%' : searchOpen ? 204 : 32,
            flex: isHighZoom ? 1 : undefined,
            overflow: 'hidden',
            transition: 'width 200ms ease',
            flexShrink: isHighZoom ? 1 : 0,
          }}>
            {searchOpen ? (
              <InputGroup style={{ width: isHighZoom ? '100%' : 200, flexShrink: isHighZoom ? 1 : 0, borderColor: 'var(--brand-color)', boxShadow: '0 0 0 3px color-mix(in oklch, var(--brand-color) 18%, transparent)' }}>
                <InputGroupAddon align="inline-start">
                  <i
                    className="fa-light fa-magnifying-glass"
                    aria-hidden="true"
                    style={{ fontSize: 12, color: 'var(--brand-color)' }}
                  />
                </InputGroupAddon>
                <InputGroupInput
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape' && !isHighZoom) { setSearch(''); setSearchOpen(false) } }}
                  placeholder="Search questions…"
                  aria-label="Search questions"
                  autoFocus={!isHighZoom}
                />
                {!isHighZoom && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => { if (search) { setSearch(''); searchRef.current?.focus() } else { setSearchOpen(false) } }}
                      aria-label={search ? 'Clear search' : 'Close search'}
                    >
                      <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
                {isHighZoom && search && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => { setSearch(''); searchRef.current?.focus() }}
                      aria-label="Clear search"
                    >
                      <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>
            ) : (
              <Tip label="Search">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search questions"
                  style={search ? { color: 'var(--brand-color)' } : {}}
                >
                  <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 13 }} />
                </Button>
              </Tip>
            )}
          </div>}

          {/* Bookmark toggle */}
          <Tip label={bookmarkOnly ? 'Show all questions' : 'Bookmarked only'}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setBookmarkOnly(v => !v)}
              aria-pressed={bookmarkOnly}
              aria-label={bookmarkOnly ? 'Show all questions' : 'Show bookmarked only'}
              style={bookmarkOnly ? {
                borderColor: 'var(--chart-4)',
                color: 'var(--chart-4)',
                backgroundColor: 'color-mix(in oklch, var(--chart-4) 10%, var(--background))',
              } : {}}
            >
              <i
                className={bookmarkOnly ? 'fa-solid fa-star' : 'fa-light fa-star'}
                aria-hidden="true"
                style={{ fontSize: 13 }}
              />
            </Button>
          </Tip>

          {/* My Questions toggle */}
          <Tip label="My questions only">
            <Button
              variant="ghost" size="icon-sm"
              aria-label="My questions"
              aria-pressed={myQuestionsOnly}
              onClick={() => setMyQuestionsOnly(!myQuestionsOnly)}
              style={myQuestionsOnly ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
            >
              <i className="fa-light fa-user" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          </Tip>

          {/* Properties / filter sheet trigger */}
          <div style={{ position: 'relative' }}>
            <Tip label="Filters & properties">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPropertiesOpen(true)}
                aria-label="Table properties"
                style={activeFilterCount > 0 || hiddenCols.size > 0 || sortRules.length > 0 ? { borderColor: 'var(--border-control-3)', color: 'var(--foreground)', backgroundColor: 'var(--muted)' } : {}}
              >
                <i className="fa-light fa-sliders" aria-hidden="true" style={{ fontSize: 13 }} />
              </Button>
            </Tip>
            {(activeFilterCount + sortRules.length) > 0 && (
              <span className="text-[8px] font-bold" style={{
                position: 'absolute', top: -4, right: -4,
                width: 14, height: 14, borderRadius: '50%',
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
                boxShadow: '0 0 0 2px var(--background)',
              }}>
                {activeFilterCount + sortRules.length}
              </span>
            )}
          </div>

        </div>
      </div>
      )}

      {/* ── Content area: provides padding context, does not scroll ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {filteredQuestions.length === 0 ? (
        visibleQuestions.length === 0 ? (
          /* ── Truly empty: admin empty folder vs faculty no-access ── */
          isExamAdmin ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', gap: 20 }}>
              <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-light fa-rectangle-list" aria-hidden="true" style={{ fontSize: 28, color: 'var(--brand-color)', opacity: 0.85 }} />
                <span style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%', backgroundColor: 'var(--background)', border: '1.5px solid var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 9, color: 'var(--brand-color)' }} />
                </span>
              </div>
              <div style={{ textAlign: 'center', maxWidth: 360 }}>
                <p className="text-base text-foreground font-bold" style={{ marginBottom: 8, fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                  This folder is empty
                </p>
                <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.6 }}>
                  Add your first question to start building this bank — or move existing questions in from another folder.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Button variant="default" size="sm" style={{ gap: 6 }}
                  onClick={() => router.push(selectedFolderId ? `/questions/new?folder=${selectedFolderId}` : '/questions/new')}>
                  <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
                  Add first question
                </Button>
                <Button variant="ghost" size="xs" className="text-xs text-muted-foreground"
                  onClick={() => setNavView('all')}>
                  Or browse other folders to move questions in
                </Button>
              </div>
            </div>
          ) : (
            /* ── Faculty: no questions in this folder ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', gap: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'color-mix(in oklch, var(--muted-foreground) 8%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-light fa-books" aria-hidden="true" style={{ fontSize: 28, color: 'var(--muted-foreground)', opacity: 0.6 }} />
              </div>
              <div style={{ textAlign: 'center', maxWidth: 340 }}>
                <p className="text-base text-foreground font-bold" style={{ marginBottom: 8, fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                  No questions here yet
                </p>
                <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.6 }}>
                  This folder doesn&apos;t have any questions yet. Your department admin can add questions or give you edit access.
                </p>
              </div>
              <Button variant="ghost" size="sm"
                style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))', color: 'var(--brand-color)', gap: 5 }}>
                <i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 11 }} />
                Contact your admin
              </Button>
            </div>
          )
        ) : (
          /* ── Filtered empty — with suggested filter shortcuts ── */
          (() => {
            // Compute filter suggestions from unfiltered visible questions
            type Suggestion = { label: string; icon: string; fieldKey: QBFilterKey; values: string[]; count: number }
            const suggestions: Suggestion[] = []
            ;(['Easy', 'Medium', 'Hard'] as const).forEach(diff => {
              const count = visibleQuestions.filter(q => q.difficulty === diff).length
              if (count > 0) suggestions.push({ label: diff, icon: 'fa-signal', fieldKey: 'difficulty', values: [diff], count })
            })
            ;(['Saved', 'Draft'] as const).forEach(status => {
              const count = visibleQuestions.filter(q => q.status === status).length
              if (count > 0) suggestions.push({ label: status, icon: 'fa-circle-dot', fieldKey: 'status', values: [status], count })
            })
            const typeGroups = new Map<string, number>()
            visibleQuestions.forEach(q => typeGroups.set(q.type, (typeGroups.get(q.type) ?? 0) + 1))
            Array.from(typeGroups.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([type, count]) => {
              suggestions.push({ label: type, icon: 'fa-rectangle-list', fieldKey: 'type', values: [type], count })
            })
            const topSuggestions = suggestions.slice(0, 5)

            function applySuggestion(s: Suggestion) {
              clearAllFilters()
              const id = `${s.fieldKey}-${Date.now()}`
              setActiveFilters([{ id, fieldKey: s.fieldKey, operator: 'is', values: s.values }])
              setLastAddedFilterId(null)
            }

            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', gap: 24 }}>
                {/* Illustration */}
                <div style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', backgroundColor: 'color-mix(in oklch, var(--muted-foreground) 8%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fa-light fa-sliders" aria-hidden="true" style={{ fontSize: 26, color: 'var(--muted-foreground)', opacity: 0.6 }} />
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'var(--background)', border: '1.5px solid var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 8, color: 'var(--muted-foreground)' }} />
                  </span>
                </div>

                {/* Copy */}
                <div style={{ textAlign: 'center', maxWidth: 340 }}>
                  <p className="text-[15px] text-foreground font-bold" style={{ marginBottom: 6, fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                    Nothing matches these filters
                  </p>
                  <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.6 }}>
                    Try a different combination — or pick one of these to see results right away.
                  </p>
                </div>

                {/* Suggested filter shortcuts */}
                {topSuggestions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 380 }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                      Try these instead
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                      {topSuggestions.map(s => (
                        <Button
                          key={`${s.fieldKey}-${s.values[0]}`}
                          variant="outline"
                          size="sm"
                          onClick={() => applySuggestion(s)}
                          className="text-xs font-medium text-foreground gap-1.5"
                          style={{ height: 30, paddingInline: 10 }}
                        >
                          <i className={`fa-light ${s.icon}`} aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
                          {s.label}
                          <span className="text-[10px] text-muted-foreground font-normal">({s.count})</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear action */}
                {hasAnyFilter && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters} style={{ gap: 6 }}>
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
                    Clear all filters
                  </Button>
                )}
              </div>
            )
          })()
        )
      ) : (
        <>
          {/* Padding wrapper — at high zoom: flex-none so rows flow into page scroll; normal: flex-1 with internal scroll */}
          <div className="qb-table-padding-wrapper" style={{ flex: isHighZoom ? 'none' : 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 0 }}>
          {/* Border: at high zoom maxHeight is unconstrained; normal: capped at 100% so inner can scroll */}
          <div className="border border-border overflow-hidden rounded-lg" style={{ maxHeight: isHighZoom ? 'none' : '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Table scroll: at high zoom vertical overflow visible (page scrolls); normal: auto (internal scroll) */}
          <div className="qb-table-scroll" style={{ flex: isHighZoom ? 'none' : 1, minHeight: 0, overflowX: 'auto', overflowY: isHighZoom ? 'visible' : 'auto' }}>
            <table className="text-sm border-separate border-spacing-0 table-fixed" style={{ minWidth: '100%' }}>
              {showColumnLabels && <TableHeader style={{ position: 'sticky', top: 0, zIndex: 4 }}>
                <TableRow>
                  {/* Select all */}
                  <TableHead className={TH_CLS} style={{ width: 40, minWidth: 40, maxWidth: 40, paddingInline: 0, position: 'sticky', left: 0, zIndex: 3, backgroundColor: 'var(--dt-header-bg)', boxShadow: '2px 0 4px var(--sticky-edge-fade)' }}>
                    <div className="flex items-center justify-center">
                      <span className="sr-only">Select all</span>
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                        style={{ width: 16, height: 16, minWidth: 16, minHeight: 16, flexShrink: 0 }}
                      />
                    </div>
                  </TableHead>
                  {visibleCols.filter(c => c.key !== 'select' && c.key !== 'actions').map(col => {
                    const isPinnedLeft = pinnedCols.has(col.key)
                    const isPinnedRight = pinnedRightCols.has(col.key)
                    const stickyStyle: React.CSSProperties = isPinnedLeft
                      ? { position: 'sticky', left: 0, zIndex: 2, background: 'var(--dt-header-bg)', boxShadow: '2px 0 4px var(--sticky-edge-fade)' }
                      : isPinnedRight
                      ? { position: 'sticky', right: 0, zIndex: 2, background: 'var(--dt-header-bg)', boxShadow: '-2px 0 4px var(--sticky-edge-fade)' }
                      : {}
                    const isDragOver = dragOverCol === col.key
                    return (
                      <ColHeader
                        key={col.key}
                        col={col}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        sortRules={sortRules}
                        onSort={handleSort}
                        onHide={key => setHiddenCols(prev => new Set([...prev, key as ColKey]))}
                        onPinLeft={key => setPinnedCols(prev => { const next = new Set(prev); next.add(key); return next })}
                        onPinRight={key => setPinnedRightCols(prev => { const next = new Set(prev); next.add(key); return next })}
                        onUnpin={key => {
                          setPinnedCols(prev => { const next = new Set(prev); next.delete(key); return next })
                          setPinnedRightCols(prev => { const next = new Set(prev); next.delete(key); return next })
                        }}
                        pinnedLeft={isPinnedLeft}
                        pinnedRight={isPinnedRight}
                        wrapText={wrapText}
                        onToggleWrapText={() => setWrapText(v => !v)}
                        onOpenFilterPanel={() => { setInitialPropertiesPanel('filter'); setPropertiesOpen(true) }}
                        distQuestions={col.key === 'difficulty' ? filteredQuestions : undefined}
                        bloomsQuestions={col.key === 'blooms' ? filteredQuestions : undefined}
                        filterOptions={qbFilterFields.find(f => f.key === col.key)?.options}
                        filterSet={getColFilterSet(col.key)}
                        onFilterToggle={getColFilterToggler(col.key)}
                        onSetFilter={getColFilterSetter(col.key)}
                        filterOptionCounts={getColFilterOptionCounts(col.key)}
                        onRemoveSort={removeSortRule}
                        className={
                          col.key === 'status'       ? 'w-28' :
                          col.key === 'type'         ? 'w-24' :
                          col.key === 'difficulty'   ? 'w-24' :
                          col.key === 'blooms'       ? 'w-28' :
                          col.key === 'location'     ? 'w-44' :
                          col.key === 'creator'      ? 'w-40' :
                          col.key === 'lastEditedBy' ? 'w-32' :
                          col.key === 'usage'        ? 'w-16' :
                          col.key === 'pbis'         ? 'w-24' :
                          col.key === 'version'      ? 'w-16' : ''
                        }
                        draggable={col.hideable}
                        onDragStart={col.hideable ? () => { dragColRef.current = col.key } : undefined}
                        onDragOver={col.hideable ? (e: React.DragEvent) => { e.preventDefault(); setDragOverCol(col.key) } : undefined}
                        onDragLeave={col.hideable ? () => setDragOverCol(null) : undefined}
                        onDrop={col.hideable ? () => {
                          const from = dragColRef.current
                          if (!from || from === col.key) { setDragOverCol(null); return }
                          const next = [...columnOrder]
                          const fromIdx = next.indexOf(from as typeof next[number])
                          const toIdx = next.indexOf(col.key as typeof next[number])
                          if (fromIdx >= 0 && toIdx >= 0) {
                            next.splice(fromIdx, 1)
                            next.splice(toIdx, 0, from as typeof next[number])
                            setColumnOrder(next)
                          }
                          dragColRef.current = null
                          setDragOverCol(null)
                        } : undefined}
                        onDragEnd={col.hideable ? () => { dragColRef.current = null; setDragOverCol(null) } : undefined}
                        dragOverStyle={isDragOver ? {
                          outline: '2px dashed var(--brand-color)',
                          outlineOffset: '-2px',
                          ...stickyStyle,
                        } : stickyStyle}
                        thClass={TH_CLS}
                      />
                    )
                  })}
                  <TableHead
                    className={TH_CLS}
                    style={{ width: 40, minWidth: 40, maxWidth: 40, paddingInline: 0, position: 'sticky', right: 0, zIndex: 2, background: 'var(--dt-header-bg)', boxShadow: '-2px 0 4px var(--sticky-edge-fade)' }}
                  />
                </TableRow>
              </TableHeader>}
              <TableBody className="[&_tr:last-child]:border-b-0">
                {tableRows.map((item) => {
                  if (item.type === 'header') {
                    return (
                      <TableRow key={`group-header-${item.label}`} className="select-none">
                        <TableCell
                          colSpan={visibleCols.length + 1}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--sidebar)',
                            borderBottom: '1px solid var(--sidebar-border)',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <i className="fa-light fa-layer-group text-muted-foreground" aria-hidden="true" style={{ fontSize: 11 }} />
                            <span className="text-sm font-semibold text-foreground">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.count} question{item.count !== 1 ? 's' : ''}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }
                  const q = item.question
                  const isSelected = selectedQuestionIds.has(q.id)
                  const isHovered = rowHoverId === q.id
                  const isOwner = q.creator === currentPersona.id
                  const isPrivate = q.tags.includes('private')
                  const canEditRow = isOwner || isExamAdmin ||
                    (isCourseDirector && q.status === 'Saved' && accessibleFolderIds.has(q.folder))
                  const canDeleteRow = isOwner || isExamAdmin

                  const creatorPersona = MOCK_QB_PERSONAS.find(p => p.id === (q.creator ?? ''))
                    ?? { initials: '?', color: 'var(--muted)', name: 'Unknown', trustLevel: 'junior' as const, id: '', role: 'instructor' as const }

                  const condBg = getConditionalRowBg(q)
                  const rowBg = isSelected ? 'var(--dt-row-selected)' : condBg

                  return (
                    <TableRow
                      key={q.id}
                      data-state={isSelected ? 'selected' : undefined}
                      onMouseEnter={() => setRowHoverId(q.id)}
                      onMouseLeave={() => setRowHoverId(null)}
                      onClick={() => setDetailQuestionId(q.id)}
                      draggable={isExamAdmin}
                      onDragStart={() => setDraggedQuestionId(q.id)}
                      onDragEnd={() => setDraggedQuestionId(null)}
                      className={`group/row transition-colors hover:!bg-interactive-hover-subtle${anchorQuestionId === q.id ? ' qb-row-anchored' : ''}`}
                      style={{
                        backgroundColor: rowBg,
                        opacity: (!isExamAdmin && !isCourseDirector && !isOwner) ? 0.72 : 1,
                        borderLeft: isPrivate ? '3px solid var(--qb-private)' : undefined,
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      {/* Cells — ordered by visibleCols to respect drag-reorder */}
                      {visibleCols.map(col => {
                        switch (col.key) {
                          case 'select':
                            return (
                              <TableCell key="select" className={TD} style={{ width: 40, minWidth: 40, maxWidth: 40, paddingInline: 0, position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'var(--dt-row-bg)' }}>
                                <div
                                  className={`qb-row-checkbox flex items-center justify-center transition-opacity ${
                                    anySelected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
                                  }`}
                                  onClick={(e) => { e.stopPropagation(); toggleQuestionSelection(q.id) }}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleQuestionSelection(q.id)}
                                    aria-label={`Select ${q.title}`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ width: 16, height: 16, minWidth: 16, minHeight: 16, flexShrink: 0 }}
                                  />
                                </div>
                              </TableCell>
                            )
                          case 'title':
                            return (
                              <TableCell key="title" className={TD} style={{ minWidth: 280, maxWidth: 380, ...pinnedStyle('title', pinnedCols, pinnedRightCols) }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    {isPrivate && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                        <Badge
                                          variant="secondary"
                                          className="rounded shrink-0 text-[9px] font-semibold"
                                          style={{
                                            padding: '1px 5px',
                                            backgroundColor: 'color-mix(in oklch, var(--qb-private) 12%, var(--background))',
                                            color: 'var(--qb-private)',
                                            border: '1px solid color-mix(in oklch, var(--qb-private) 25%, var(--background))',
                                          }}
                                        >
                                          <i className="fa-solid fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 7 }} /> Private
                                        </Badge>
                                      </div>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-sm font-medium text-foreground leading-snug line-clamp-2 whitespace-normal" style={{
                                          cursor: 'default'
                                        }}>
                                          {q.title}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        {q.title}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  {/* Star — show on hover, always show when favorited */}
                                  <FavoritedCell questionId={q.id} />
                                </div>
                              </TableCell>
                            )
                          case 'status':
                            return (
                              <TableCell key="status" className={`${TD} w-28`} style={pinnedStyle('status', pinnedCols, pinnedRightCols)}>
                                <StatusBadge status={q.status} />
                              </TableCell>
                            )
                          case 'type':
                            return (
                              <TableCell key="type" className={`${TD} w-24`} style={pinnedStyle('type', pinnedCols, pinnedRightCols)}>
                                <span className="text-sm text-foreground">{q.type}</span>
                              </TableCell>
                            )
                          case 'difficulty':
                            return (
                              <TableCell key="difficulty" className={`${TD} w-24`} style={pinnedStyle('difficulty', pinnedCols, pinnedRightCols)}>
                                <DiffBadge diff={q.difficulty} />
                              </TableCell>
                            )
                          case 'blooms':
                            return (
                              <TableCell key="blooms" className={`${TD} w-28`} style={pinnedStyle('blooms', pinnedCols, pinnedRightCols)}>
                                <BloomsBadge blooms={q.blooms} />
                              </TableCell>
                            )
                          case 'location':
                            return (
                              <TableCell key="location" className={`${TD} w-44`} style={pinnedStyle('location', pinnedCols, pinnedRightCols)}>
                                <LocationCell question={q} />
                              </TableCell>
                            )
                          case 'creator':
                            return (
                              <TableCell key="creator" className={`${TD} w-40`} style={pinnedStyle('creator', pinnedCols, pinnedRightCols)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                  <Avatar className="shrink-0">
                                    <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                                      {creatorPersona.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-foreground truncate min-w-0">{creatorPersona.name}</span>
                                </div>
                              </TableCell>
                            )
                          case 'lastEditedBy': {
                            const editorId = q.lastEditedBy ?? q.creator
                            if (!editorId) return (
                              <TableCell key="lastEditedBy" className={`${TD} w-32`} style={pinnedStyle('lastEditedBy', pinnedCols, pinnedRightCols)}>
                                <span className="text-sm text-muted-foreground">—</span>
                              </TableCell>
                            )
                            const editorPersona = MOCK_QB_PERSONAS.find(p => p.id === editorId)
                              ?? { initials: editorId.slice(0, 2).toUpperCase(), color: 'var(--muted)', name: editorId, trustLevel: 'junior' as const, id: editorId, role: 'instructor' as const }
                            return (
                              <TableCell key="lastEditedBy" className={`${TD} w-32`} style={pinnedStyle('lastEditedBy', pinnedCols, pinnedRightCols)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                  <Avatar className="shrink-0">
                                    <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                                      {editorPersona.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-foreground truncate min-w-0">{editorPersona.name}</span>
                                </div>
                              </TableCell>
                            )
                          }
                          case 'usage':
                            return (
                              <TableCell key="usage" className={`${TD} w-16`} style={pinnedStyle('usage', pinnedCols, pinnedRightCols)}>
                                {(q.usage ?? 0) === 0
                                  ? <span className="text-sm text-muted-foreground">—</span>
                                  : <span className="text-sm font-medium text-foreground">×{q.usage}</span>}
                              </TableCell>
                            )
                          case 'pbis':
                            return (
                              <TableCell key="pbis" className={`${TD} w-20`} style={pinnedStyle('pbis', pinnedCols, pinnedRightCols)}>
                                <PBisCell pbis={q.pbis} />
                              </TableCell>
                            )
                          case 'version':
                            return (
                              <TableCell key="version" className={`${TD} w-16`} style={pinnedStyle('version', pinnedCols, pinnedRightCols)}>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon-xs" aria-label="Version history">
                                      <Badge variant="secondary" className="rounded font-mono text-[10px]" style={{ padding: '1px 5px', cursor: 'pointer' }}>
                                        V{q.version}
                                      </Badge>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-72 p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground" style={{ marginBottom: 10 }}>
                                      Version History
                                    </div>
                                    {Array.from({ length: q.version }, (_, i) => {
                                      const vNum = q.version - i
                                      const isLatest = i === 0
                                      return (
                                        <div key={vNum} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                          <Badge variant="secondary" className="rounded font-mono shrink-0 text-[9px]" style={{ padding: '1px 5px', backgroundColor: isLatest ? 'var(--sidebar-accent)' : undefined, color: isLatest ? 'var(--sidebar-accent-foreground)' : undefined }}>
                                            V{vNum}
                                          </Badge>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="text-xs font-medium text-foreground truncate">
                                              {isLatest ? q.title.slice(0, 55) : `Revision ${vNum}`}
                                            </div>
                                            <div className="text-xs text-muted-foreground" style={{ marginTop: 1 }}>
                                              {isLatest ? (q.lastEditedBy ?? q.creator ?? 'Unknown') : q.creator ?? 'Unknown'} · {isLatest ? q.age : `${i + 1} months ago`}
                                            </div>
                                          </div>
                                          {isOwner && (
                                            <Button variant="ghost" size="icon-xs" aria-label="Use this version">
                                              <i className="fa-light fa-rotate-left" aria-hidden="true" style={{ fontSize: 11 }} />
                                            </Button>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            )
                          case 'actions':
                            return null
                          default:
                            return null
                        }
                      })}

                      {/* Actions ⋯ — sticky right, always visible, narrower column */}
                      <TableCell
                        className={TD}
                        onClick={e => e.stopPropagation()}
                        style={{
                          width: 40, minWidth: 40, maxWidth: 40, paddingInline: 0,
                          position: 'sticky', right: 0,
                          background: isSelected ? 'var(--dt-row-selected)' : isHovered ? 'var(--dt-row-hover)' : 'var(--dt-row-bg)',
                          boxShadow: '-2px 0 4px var(--sticky-edge-fade)',
                        }}
                      >
                        <div className="flex items-center justify-center">
                        <DropdownMenu open={openMenuQuestionId === q.id} onOpenChange={open => setOpenMenuQuestionId(open ? q.id : null)}>
                          <Tip label="More options">
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost" size="icon-xs"
                                aria-label={`More options for ${q.title}`}
                                onClick={e => e.stopPropagation()}
                              >
                                <i className={`fa-${openMenuQuestionId === q.id ? 'solid' : 'regular'} fa-ellipsis`} aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                          </Tip>
                          <DropdownMenuContent align="end" className="w-56">
                            {/* Edit */}
                            <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); router.push(`/questions/${q.id}/edit`) }}>
                              <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                              Edit question
                            </DropdownMenuItem>
                            {/* Duplicate */}
                            <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); duplicateQuestion(q.id); toast.success('Duplicated as Draft') }}>
                              <i className="fa-light fa-copy" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                              Use as template
                            </DropdownMenuItem>
                            {/* Copy to folder */}
                            <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); setCopyTarget({ id: q.id, title: q.title }) }}>
                              <i className="fa-light fa-folder-arrow-up" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                              Copy to folder
                            </DropdownMenuItem>
                            {/* Move to folder */}
                            {canEditRow && (
                              <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); setMoveTarget({ id: q.id, title: q.title, folder: q.folder }) }}>
                                <i className="fa-light fa-arrow-right-to-bracket" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                Move to folder
                              </DropdownMenuItem>
                            )}
                            {/* Remove from folder — only when viewing a specific folder */}
                            {navView === 'folder' && selectedFolderId && canEditRow && (
                              <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); removeQuestionFromFolder(q.id, selectedFolderId); toast.success('Removed from folder') }}>
                                <i className="fa-light fa-folder-minus" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                Remove from folder
                              </DropdownMenuItem>
                            )}
                            {/* Status changes — only when not archived */}
                            {canEditRow && q.status !== 'Archived' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); updateQuestion(q.id, { status: 'Saved' }); toast.success('Marked as Saved') }} disabled={q.status === 'Saved'}>
                                  <i className="fa-light fa-circle-check" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                  Mark as Saved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); updateQuestion(q.id, { status: 'Draft' }); toast('Reverted to Draft') }} disabled={q.status === 'Draft'}>
                                  <i className="fa-light fa-rotate-left" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                  Revert to Draft
                                </DropdownMenuItem>
                              </>
                            )}
                            {/* Archive (for active questions) */}
                            {canEditRow && q.status !== 'Archived' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); setArchiveTarget({ id: q.id, title: q.title }) }}>
                                  <i className="fa-light fa-box-archive" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                            {/* Restore (for archived questions) */}
                            {q.status === 'Archived' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); updateQuestion(q.id, { status: 'Saved' }); toast.success('Restored as Saved') }}>
                                  <i className="fa-light fa-box-open" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                  Restore as Saved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); updateQuestion(q.id, { status: 'Draft' }); toast('Restored as Draft') }}>
                                  <i className="fa-light fa-box-open" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                  Restore as Draft
                                </DropdownMenuItem>
                              </>
                            )}
                            {/* Admin: manage folder access */}
                            {isExamAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setOpenMenuQuestionId(null); setCollaboratorsModalFolderId(q.folder) }}>
                                  <i className="fa-light fa-users" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                  Manage folder access
                                </DropdownMenuItem>
                              </>
                            )}
                            {/* Delete — Draft + never used in assessment only (PRD §4.6) */}
                            {canDeleteRow && q.status === 'Draft' && (q.usedInSections?.length ?? 0) === 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => { setOpenMenuQuestionId(null); setDeleteTarget({ id: q.id, title: q.title }) }}>
                                  <i className="fa-light fa-trash-can" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                                  Delete question
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </table>
          </div>{/* inner scroll */}
          {/* ── Pagination footer — inside clip, border-t separates from table rows */}
          {paginationEnabled && sortedQuestions.length > 0 && (
            <div className="border-t border-border flex items-center justify-between flex-wrap gap-y-1 px-4 py-2 bg-background select-none text-sm" style={{ flexShrink: 0 }}>
              {/* Left: Rows per page */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="whitespace-nowrap">Rows per page</span>
                <Select value={String(perPage)} onValueChange={v => setPerPage(Number(v))}>
                  <SelectTrigger className="inline-flex items-center gap-1 px-2 py-1 rounded border border-input bg-background hover:bg-interactive-hover text-foreground text-sm h-auto focus-visible:ring-ring" style={{ width: 64 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Right: count + first/prev/page-indicator/next/last */}
              <div className="flex items-center gap-3">
                <span role="status" aria-live="polite" className="text-muted-foreground tabular-nums whitespace-nowrap">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, sortedQuestions.length)} of {sortedQuestions.length}
                </span>
                <div className="flex items-center gap-1">
                  <Tip label="First page">
                    <Button variant="ghost" size="icon-xs" disabled={page === 1} onClick={() => setPage(1)} aria-label="First page">
                      <i className="fa-light fa-chevrons-left text-xs" aria-hidden="true" />
                    </Button>
                  </Tip>
                  <Tip label="Previous page">
                    <Button variant="ghost" size="icon-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
                      <i className="fa-light fa-chevron-left text-xs" aria-hidden="true" />
                    </Button>
                  </Tip>
                  <span className="px-2 text-muted-foreground tabular-nums whitespace-nowrap">{page} / {totalPages}</span>
                  <Tip label="Next page">
                    <Button variant="ghost" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
                      <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
                    </Button>
                  </Tip>
                  <Tip label="Last page">
                    <Button variant="ghost" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(totalPages)} aria-label="Last page">
                      <i className="fa-light fa-chevrons-right text-xs" aria-hidden="true" />
                    </Button>
                  </Tip>
                </div>
              </div>
            </div>
          )}
          </div>{/* outer clip+border */}
          </div>{/* padding wrapper */}
        </>
      )}
      </div>

      {/* ── Floating bulk-action bar ── */}
      {anySelected && (() => {
        const selectedQs = visibleQuestions.filter(q => selectedQuestionIds.has(q.id))
        const allFavorited = selectedQs.every(q => favoritedIds.has(q.id))
        const savedCount = selectedQs.filter(q => q.status === 'Saved').length
        const draftCount = selectedQs.filter(q => q.status === 'Draft').length
        return (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-xl border border-border bg-background shadow-xl px-3 py-2 animate-in fade-in-0 slide-in-from-bottom-3 duration-150"
            style={{ boxShadow: 'var(--qb-bulk-bar-shadow)', minWidth: 0 }}
          >
            {/* Count */}
            <span className="text-xs font-semibold text-foreground" style={{ paddingInline: 6, whiteSpace: 'nowrap' }}>
              {selectedQuestionIds.size} selected
            </span>
            <div className="h-4 w-px bg-border mx-0.5" aria-hidden="true" />

            {/* Favorite */}
            <Button
              variant="ghost" size="sm"
              aria-label={allFavorited ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => selectedQs.forEach(q => {
                if (allFavorited ? favoritedIds.has(q.id) : !favoritedIds.has(q.id)) toggleQuestionFavorited(q.id)
              })}
              className="text-xs gap-1.5"
              style={{ height: 32, ...(allFavorited ? { color: 'var(--chart-4)' } : {}) }}
            >
              <i className={`${allFavorited ? 'fa-solid' : 'fa-light'} fa-star`} aria-hidden="true" style={{ fontSize: 12 }} />
              {allFavorited ? 'Unfavorite' : 'Favorite'}
            </Button>

            <div className="h-4 w-px bg-border mx-0.5" aria-hidden="true" />

            {/* Folder actions dropdown — modal={false} avoids Radix nested-modal conflict */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs gap-1.5" style={{ height: 32 }}>
                  <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 12 }} />
                  Folder
                  <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 9 }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={() => { selectedQs.forEach(q => duplicateQuestion(q.id)); toast.success(`${selectedQs.length} question${selectedQs.length > 1 ? 's' : ''} duplicated`); clearSelection() }}>
                  <i className="fa-light fa-copy" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                  Use as template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* setTimeout lets dropdown fully close before dialog mounts (Radix nested-modal fix) */}
                <DropdownMenuItem onClick={() => setTimeout(() => setBulkCopyOpen(true), 0)}>
                  <i className="fa-light fa-folder-arrow-up" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                  Copy to folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeout(() => setBulkMoveOpen(true), 0)}>
                  <i className="fa-light fa-arrow-right-to-bracket" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                  Move to folder
                </DropdownMenuItem>
                {navView === 'folder' && selectedFolderId && (
                  <DropdownMenuItem onClick={() => { selectedQs.forEach(q => removeQuestionFromFolder(q.id, selectedFolderId)); toast.success(`${selectedQs.length} question${selectedQs.length > 1 ? 's' : ''} removed from folder`); clearSelection() }}>
                    <i className="fa-light fa-folder-minus" aria-hidden="true" style={{ fontSize: 12, width: 14 }} />
                    Remove from folder
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status change dropdown */}
            {(() => {
              const activeCount = selectedQs.filter(q => q.status !== 'Archived').length
              return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5" style={{ height: 32 }}>
                    <i className="fa-light fa-circle-half-stroke" aria-hidden="true" style={{ fontSize: 12 }} />
                    Status
                    <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 9 }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-52">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.06em]">
                    Change status to
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => draftCount > 0 && setBulkStatusTarget('Saved')}
                    disabled={draftCount === 0}
                  >
                    <i className="fa-light fa-circle-check" aria-hidden="true" style={{ fontSize: 12, width: 14, color: 'var(--qb-status-saved-fg)' }} />
                    <span style={{ flex: 1 }}>Mark as Saved</span>
                    {draftCount > 0 && <span className="text-xs text-muted-foreground" style={{ marginLeft: 8 }}>{draftCount}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => savedCount > 0 && setBulkStatusTarget('Draft')}
                    disabled={savedCount === 0}
                  >
                    <i className="fa-light fa-hourglass" aria-hidden="true" style={{ fontSize: 12, width: 14, color: 'var(--qb-status-draft-fg)' }} />
                    <span style={{ flex: 1 }}>Revert to Draft</span>
                    {savedCount > 0 && <span className="text-xs text-muted-foreground" style={{ marginLeft: 8 }}>{savedCount}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { if (activeCount > 0) { selectedQs.filter(q => q.status !== 'Archived').forEach(q => archiveQuestion(q.id)); toast.success(`${activeCount} question${activeCount > 1 ? 's' : ''} archived`); clearSelection() } }}
                    disabled={activeCount === 0}
                  >
                    <i className="fa-light fa-box-archive" aria-hidden="true" style={{ fontSize: 12, width: 14, color: 'var(--qb-status-archived-fg)' }} />
                    <span style={{ flex: 1 }}>Archive</span>
                    {activeCount > 0 && <span className="text-xs text-muted-foreground" style={{ marginLeft: 8 }}>{activeCount}</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )
            })()}

            <div className="h-4 w-px bg-border mx-0.5" aria-hidden="true" />

            {/* Delete */}
            <Button
              variant="ghost" size="sm"
              aria-label="Delete selected"
              onClick={() => setBulkDeleteOpen(true)}
              className="text-xs gap-1.5 text-destructive"
              style={{ height: 32 }}
            >
              <i className="fa-light fa-trash-can" aria-hidden="true" style={{ fontSize: 12 }} />
              Delete
            </Button>

            <div className="h-4 w-px bg-border mx-0.5" aria-hidden="true" />

            {/* Clear — icon only */}
            <Tip label="Clear selection">
              <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={clearSelection}>
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
              </Button>
            </Tip>
          </div>
        )
      })()}

      {/* ── Bulk status change confirmation ── */}
      {bulkStatusTarget && (() => {
        const selectedQs = visibleQuestions.filter(q => selectedQuestionIds.has(q.id))
        const affected = selectedQs.filter(q => q.status !== bulkStatusTarget)
        const statusLabel = bulkStatusTarget === 'Saved' ? 'Saved' : 'Draft'
        const statusIcon = bulkStatusTarget === 'Saved' ? 'fa-circle-check' : 'fa-hourglass'
        return (
          <Dialog open onOpenChange={v => { if (!v) setBulkStatusTarget(null) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change status to {statusLabel}?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground" style={{ marginBottom: 8 }}>
                {affected.length} question{affected.length !== 1 ? 's' : ''} will be marked as{' '}
                <span className="font-semibold text-foreground">{statusLabel}</span>.
              </p>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                {affected.slice(0, 12).map(q => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className={`fa-light ${statusIcon}`} aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                    <span className="text-xs text-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</span>
                  </div>
                ))}
                {affected.length > 12 && (
                  <p className="text-xs text-muted-foreground italic" style={{ margin: 0 }}>
                    and {affected.length - 12} more…
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setBulkStatusTarget(null)}>Cancel</Button>
                <Button variant="default" size="sm" onClick={() => {
                  affected.forEach(q => updateQuestion(q.id, { status: bulkStatusTarget }))
                  toast.success(`${affected.length} question${affected.length > 1 ? 's' : ''} marked as ${statusLabel}`)
                  setBulkStatusTarget(null)
                }}>
                  <i className={`fa-light ${statusIcon}`} aria-hidden="true" />
                  Mark as {statusLabel}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })()}

      {/* ── Bulk delete confirmation ── */}
      {bulkDeleteOpen && (() => {
        const selectedQs = visibleQuestions.filter(q => selectedQuestionIds.has(q.id))
        const withUsage = selectedQs.filter(q => q.usage > 0)
        const totalUsage = selectedQs.reduce((sum, q) => sum + q.usage, 0)
        const allSections = Array.from(new Set(selectedQs.flatMap(q => q.usedInSections ?? [])))
        return (
          <Dialog open onOpenChange={v => { if (!v) setBulkDeleteOpen(false) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete {selectedQs.length} question{selectedQs.length !== 1 ? 's' : ''}?</DialogTitle>
              </DialogHeader>
              {withUsage.length > 0 && (
                <div style={{ borderRadius: 8, border: '1px solid color-mix(in oklch, var(--destructive) 30%, transparent)', backgroundColor: 'color-mix(in oklch, var(--destructive) 6%, var(--background))', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 13, color: 'var(--destructive)', flexShrink: 0 }} />
                    <span className="text-xs font-semibold text-destructive">Impact summary</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--destructive)', flexShrink: 0 }} />
                      <span className="text-xs text-foreground">
                        <span className="font-semibold">{withUsage.length}</span> question{withUsage.length !== 1 ? 's are' : ' is'} used in active assessments
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--destructive)', flexShrink: 0 }} />
                      <span className="text-xs text-foreground">
                        <span className="font-semibold">{totalUsage}</span> total usage{totalUsage !== 1 ? 's' : ''} across all assessments
                      </span>
                    </div>
                    {allSections.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--destructive)', flexShrink: 0 }} />
                        <span className="text-xs text-foreground">
                          Affects <span className="font-semibold">{allSections.length}</span> section{allSections.length !== 1 ? 's' : ''}:{' '}
                          <span className="text-muted-foreground">{allSections.slice(0, 3).join(', ')}{allSections.length > 3 ? ` +${allSections.length - 3} more` : ''}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                {selectedQs.slice(0, 10).map(q => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-light fa-rectangle-list" aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                    <span className="flex-1 text-xs text-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</span>
                    {q.usage > 0 && (
                      <span className="text-xs font-semibold shrink-0 text-destructive">{q.usage}×</span>
                    )}
                  </div>
                ))}
                {selectedQs.length > 10 && (
                  <p className="text-xs text-muted-foreground italic" style={{ margin: 0 }}>
                    and {selectedQs.length - 10} more…
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground" style={{ margin: 0 }}>This action cannot be undone.</p>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={() => {
                  selectedQs.forEach(q => deleteQuestion(q.id))
                  toast.success(`${selectedQs.length} question${selectedQs.length > 1 ? 's' : ''} deleted`)
                  clearSelection()
                  setBulkDeleteOpen(false)
                }}>
                  <i className="fa-light fa-trash-can" aria-hidden="true" />
                  Delete {selectedQs.length} question{selectedQs.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })()}

      {/* ── Bulk move to folder ── */}
      {bulkMoveOpen && (() => {
        const selectedQs = visibleQuestions.filter(q => selectedQuestionIds.has(q.id))
        return (
          <BulkMoveDialog
            count={selectedQs.length}
            onConfirm={targetId => {
              selectedQs.forEach(q => moveQuestionToFolder(q.id, targetId))
              toast.success(`${selectedQs.length} question${selectedQs.length > 1 ? 's' : ''} moved`)
              clearSelection()
              setBulkMoveOpen(false)
            }}
            onClose={() => setBulkMoveOpen(false)}
          />
        )
      })()}

      {/* ── Bulk copy to folder ── */}
      {bulkCopyOpen && (() => {
        const selectedQs = visibleQuestions.filter(q => selectedQuestionIds.has(q.id))
        return (
          <CopyToFolderDialog
            question={{ id: '__bulk__', title: `${selectedQs.length} question${selectedQs.length !== 1 ? 's' : ''}` }}
            open
            onClose={() => setBulkCopyOpen(false)}
            onConfirmOverride={(folderIds) => {
              selectedQs.forEach(q => copyQuestionToFolder(q.id, folderIds))
              toast.success(`${selectedQs.length} question${selectedQs.length > 1 ? 's' : ''} copied to ${folderIds.length} folder${folderIds.length > 1 ? 's' : ''}`)
              clearSelection()
              setBulkCopyOpen(false)
            }}
          />
        )
      })()}

      {/* ── Properties / filter sheet ── */}
      <FilterPropertiesSheet
        open={propertiesOpen}
        onOpenChange={v => { setPropertiesOpen(v); if (!v) setInitialPropertiesPanel('main') }}
        activeFilters={activeFilters}
        onAddFilter={addFilter}
        onUpdateFilter={updateFilter}
        onRemoveFilter={removeFilter}
        expandedFilterIds={expandedFilterIds}
        onExpandedFilterIdsChange={setExpandedFilterIds}
        filterLogic={filterLogic}
        onToggleFilterLogic={() => setFilterLogic(v => v === 'and' ? 'or' : 'and')}
        filterBarVisible={filterBarVisible}
        onFilterBarVisibleChange={setFilterBarVisible}
        bookmarkOnly={bookmarkOnly}
        setBookmarkOnly={setBookmarkOnly}
        hiddenCols={hiddenCols}
        setHiddenCols={setHiddenCols}
        filteredCount={filteredQuestions.length}
        totalCount={visibleQuestions.length}
        sortCol={sortCol}
        sortDir={sortDir}
        sortRules={sortRules}
        onSort={handleSort}
        onToggleSortDir={toggleSortDir}
        onRemoveSortRule={removeSortRule}
        onClearAllSorts={clearAllSorts}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        showGridlines={showGridlines}
        onShowGridlinesChange={setShowGridlines}
        paginationEnabled={paginationEnabled}
        onPaginationEnabledChange={setPaginationEnabled}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
        showTableTitle={showTableTitle}
        onShowTableTitleChange={setShowTableTitle}
        showColumnLabels={showColumnLabels}
        onShowColumnLabelsChange={setShowColumnLabels}
        showSearch={showSearch}
        onShowSearchChange={setShowSearch}
        conditionalRules={conditionalRules}
        onAddConditionalRule={addConditionalRule}
        onRemoveConditionalRule={removeConditionalRule}
        onUpdateConditionalRule={updateConditionalRule}
        columnOrder={columnOrder}
        onColumnOrderChange={order => setColumnOrder(order)}
        initialPanel={initialPropertiesPanel}
        filterFields={qbFilterFields}
      />

      {/* ── Question Detail Sheet ── */}
      <QuestionDetailSheet
        question={detailQuestion}
        open={!!detailQuestionId}
        onClose={() => setDetailQuestionId(null)}
        onMove={q => { setDetailQuestionId(null); setMoveTarget(q) }}
      />

      {/* ── Request Edit Access Modal ── */}
      {reqAccessQuestion && (
        <RequestEditAccessModal
          questionTitle={reqAccessQuestion.title}
          open={!!reqAccessQuestion}
          onOpenChange={open => !open && setReqAccessQuestion(null)}
        />
      )}

      {/* ── Move to Folder Dialog ── */}
      {moveTarget && (
        <MoveQuestionDialog
          question={moveTarget}
          open
          onClose={() => setMoveTarget(null)}
        />
      )}

      {/* ── Copy to Folder Dialog ── */}
      <CopyToFolderDialog
        question={copyTarget}
        open={!!copyTarget}
        onClose={() => setCopyTarget(null)}
      />

      {/* ── Archive Confirmation Dialog ── */}
      <ArchiveQuestionDialog
        question={archiveTarget}
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        currentFolderId={navView === 'folder' ? selectedFolderId : null}
      />

      {/* ── Delete Confirmation Dialog ── */}
      {deleteTarget && (
        <DeleteQuestionDialog
          question={deleteTarget}
          open
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
