'use client'
import { useState, useRef, useEffect } from 'react'
import { useQB } from './qb-state'
import type { FolderNode } from '@/lib/qb-types'
import {
  Button,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  InputGroup, InputGroupAddon, Input,
} from '@exxat/ds/packages/ui/src'

function getFolderIcon(node: FolderNode, _depth: number, expanded: boolean, selected: boolean) {
  if (node.isCourse) return { cls: 'fa-solid fa-graduation-cap', color: selected ? 'var(--brand-color)' : 'var(--muted-foreground)' }
  if (node.locked)   return { cls: 'fa-solid fa-lock', color: 'var(--qb-locked)' }
  return {
    cls: expanded ? 'fa-solid fa-folder-open' : (selected ? 'fa-solid fa-folder' : 'fa-regular fa-folder'),
    color: selected ? 'var(--brand-color)' : 'var(--muted-foreground)',
  }
}

function FolderContextMenu({ node, isAdmin }: { node: FolderNode; isAdmin: boolean }) {
  const { setCollaboratorsModalFolderId } = useQB()
  if (!isAdmin) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost" size="icon-xs"
          aria-label="Folder options"
          className="qb-folder-menu-btn shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => {}}>
          <i className="fa-light fa-folder-plus" aria-hidden="true" />
          New Subfolder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCollaboratorsModalFolderId(node.id)}>
          <i className="fa-light fa-users" aria-hidden="true" />
          Manage Access
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          <i className="fa-light fa-pen" aria-hidden="true" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => {}}>
          <i className="fa-light fa-trash-can" aria-hidden="true" />
          Delete Folder
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

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  function confirm() {
    if (name.trim()) onConfirm(name.trim())
    else onCancel()
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
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') confirm()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={confirm}
        style={{
          flex: 1, fontSize: 12, padding: '2px 6px', borderRadius: 4,
          border: 'none', outline: '2px solid var(--brand-color)',
          background: 'var(--background)', color: 'var(--foreground)',
        }}
        placeholder="Folder name…"
      />
      <Button variant="ghost" size="icon-xs" onClick={confirm} aria-label="Confirm">
        <i className="fa-regular fa-check" aria-hidden="true" style={{ fontSize: 12, color: 'var(--brand-color)' }} />
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={onCancel} aria-label="Cancel">
        <i className="fa-regular fa-xmark" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
      </Button>
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
    draggedQuestionId, setDragOverFolderId, dragOverFolderId,
    draggedFolderId, setDraggedFolderId,
    highlightedFolderId,
  } = useQB()

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState(node.name)
  const renameRef = useRef<HTMLInputElement>(null)

  const isSelected = selectedFolderId === node.id
  const isExpanded = expandedFolderIds.has(node.id)
  const isDragOver = dragOverFolderId === node.id
  const hasChildren = folders.some(f => f.parentId === node.id)
  const icon = getFolderIcon(node, depth, isExpanded, isSelected)

  const selectedBg = `color-mix(in oklch, var(--brand-color) 10%, var(--background))`

  const indentPx = 8 + depth * 16

  return (
    <div style={{ position: 'relative' }}>
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        className={highlightedFolderId === node.id ? 'folder-highlight' : undefined}
        onClick={() => {
          if (!isRenaming) {
            setSelectedFolderId(node.id)
            if (hasChildren && !node.locked) toggleFolder(node.id)
          }
        }}
        draggable={isAdmin && !isRenaming && !node.locked}
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
          backgroundColor: isSelected ? selectedBg : isDragOver ? `color-mix(in oklch, var(--brand-color) 15%, var(--background))` : 'transparent',
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
            if (hasChildren && !node.locked) toggleFolder(node.id)
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          style={{
            opacity: hasChildren && !node.locked ? 1 : 0,
            cursor: hasChildren && !node.locked ? 'pointer' : 'default',
            width: 16,
            height: 16,
            padding: 0,
            flexShrink: 0,
          }}
          tabIndex={-1}
        >
          <i
            className={`fa-regular ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}
            aria-hidden="true"
            style={{ fontSize: 9 }}
          />
        </Button>

        {/* Icon */}
        <i className={icon.cls} aria-hidden="true"
          style={{ fontSize: 13, color: icon.color, width: 16, textAlign: 'center', flexShrink: 0 }} />

        {/* Name */}
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') setIsRenaming(false)
              if (e.key === 'Escape') { setIsRenaming(false); setRenameName(node.name) }
            }}
            onBlur={() => setIsRenaming(false)}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, fontSize: 12, padding: '1px 4px', borderRadius: 3,
              border: 'none', outline: '2px solid var(--brand-color)',
              background: 'var(--background)', color: 'var(--brand-color)',
              fontWeight: 500,
            }}
          />
        ) : (
          <span style={{
            flex: 1,
            fontSize: 13,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontWeight: isSelected ? 500 : 400,
            color: isSelected ? 'var(--brand-color)' : node.locked ? 'var(--muted-foreground)' : 'var(--foreground)',
            fontStyle: node.locked ? 'italic' : 'normal',
          }}>
            {node.name}
          </span>
        )}

        {/* Count */}
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)', flexShrink: 0 }}>
          {node.count}
        </span>

        {/* ⋯ context menu — admin only */}
        <FolderContextMenu node={node} isAdmin={isAdmin} />
      </div>
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

        {/* ── Courses section header ── */}
        <div style={{ padding: '4px 12px 6px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>
            {isAdmin ? 'Courses' : 'My Courses'}
          </span>
        </div>

        {/* Search bar */}
        <div style={{ padding: '0 8px 8px' }}>
          <InputGroup>
            <Input
              placeholder="Search folders…"
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              style={{ height: 28, fontSize: 12 }}
            />
            <InputGroupAddon align="inline-end">
              {sidebarSearch
                ? (
                  <Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSidebarSearch('')}>
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                  </Button>
                )
                : <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted-foreground)', padding: '0 6px' }} />
              }
            </InputGroupAddon>
          </InputGroup>
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
