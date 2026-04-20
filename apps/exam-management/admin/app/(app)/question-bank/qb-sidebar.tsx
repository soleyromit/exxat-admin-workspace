'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useQB } from './qb-state'
import { Portal } from '@/components/qb/portal'
import type { FolderNode } from '@/lib/qb-types'

function getAccentColor(node: FolderNode) {
  if (node.isQuestionSet) return 'var(--qb-question-set)'
  return 'var(--brand-color)'
}

function getFolderIcon(node: FolderNode, depth: number, expanded: boolean, selected: boolean) {
  if (node.isCourse)         return { cls: 'fa-solid fa-graduation-cap', color: selected ? 'var(--brand-color)' : 'var(--muted-foreground)' }
  if (node.isCourseOffering) return { cls: expanded ? 'fa-solid fa-calendar-days' : 'fa-regular fa-calendar-days', color: selected ? 'var(--brand-color)' : 'var(--muted-foreground)' }
  if (node.isQuestionSet)    return { cls: 'fa-solid fa-rectangle-list', color: 'var(--qb-question-set)' }
  if (node.locked)           return { cls: 'fa-solid fa-lock', color: 'var(--qb-locked)' }
  return {
    cls: expanded ? 'fa-solid fa-folder-open' : (selected ? 'fa-solid fa-folder' : 'fa-regular fa-folder'),
    color: selected ? getAccentColor(node) : 'var(--muted-foreground)',
  }
}

interface MenuPos { x: number; y: number }

function FolderContextMenu({
  node,
  pos,
  onClose,
  isAdmin,
  depth,
}: {
  node: FolderNode
  pos: MenuPos
  onClose: () => void
  isAdmin: boolean
  depth: number
}) {
  if (!isAdmin) return null

  const menuItem = (
    icon: string,
    label: string,
    color?: string,
    onClick?: () => void,
    danger = false,
  ) => (
    <button
      key={label}
      className="qb-menu-btn"
      onClick={(e) => { e.stopPropagation(); onClick?.(); onClose() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', width: '100%', background: 'none', border: 'none',
        cursor: 'pointer', fontSize: 13, textAlign: 'left',
        color: danger ? 'var(--destructive)' : (color ?? 'var(--foreground)'),
      }}
    >
      <i className={`fa-regular ${icon}`} aria-hidden="true"
        style={{ width: 16, textAlign: 'center', fontSize: 13, color: danger ? 'var(--destructive)' : (color ?? 'var(--muted-foreground)') }} />
      {label}
    </button>
  )

  const sep = () => <div style={{ height: 1, margin: '4px 0', background: 'var(--border)' }} />

  return (
    <Portal>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99997 }} />
      <div style={{
        position: 'fixed',
        top: pos.y + 4,
        left: pos.x,
        zIndex: 99998,
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        minWidth: 200,
        padding: '4px 0',
      }}>
        {node.locked ? (
          <>
            <div style={{ padding: '4px 14px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>
              Locked
            </div>
            {menuItem('fa-lock-open', 'Unlock folder', 'var(--qb-locked)')}
          </>
        ) : node.isCourseOffering ? (
          <>
            {menuItem('fa-pen', 'Rename Offering')}
            {menuItem('fa-folder-plus', 'Add Folder')}
            {menuItem('fa-rectangle-list', 'New Question Set', 'var(--qb-question-set)')}
            {menuItem('fa-user-plus', 'Manage Members')}
            {menuItem('fa-share-nodes', 'Share / Access')}
            {sep()}
            {menuItem('fa-box-archive', 'Archive Offering')}
            {menuItem('fa-trash-can', 'Delete Offering', undefined, undefined, true)}
          </>
        ) : (
          <>
            {menuItem('fa-pen', 'Rename')}
            {depth < 4 && !node.isQuestionSet && menuItem('fa-folder-plus', 'Add Subfolder')}
            {depth < 4 && !node.isQuestionSet && menuItem('fa-rectangle-list', 'New Question Set', 'var(--qb-question-set)')}
            {node.isQuestionSet && menuItem('fa-users', 'Manage Collaborators', 'var(--qb-question-set)')}
            {menuItem('fa-share-nodes', 'Share / Access')}
            {sep()}
            {!node.isQuestionSet && menuItem('fa-lock', 'Lock folder', 'var(--qb-locked)')}
            {sep()}
            {menuItem('fa-box-archive', 'Archive')}
            {menuItem('fa-trash-can', 'Delete', undefined, undefined, true)}
          </>
        )}
      </div>
    </Portal>
  )
}

function InlineFolderInput({
  depth,
  isQSet,
  onConfirm,
  onCancel,
}: {
  depth: number
  isQSet: boolean
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const accentColor = isQSet ? 'var(--qb-question-set)' : 'var(--brand-color)'

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
        className={isQSet ? 'fa-solid fa-rectangle-list' : 'fa-regular fa-folder'}
        aria-hidden="true"
        style={{ fontSize: 13, color: accentColor, width: 16, textAlign: 'center' }}
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
          border: 'none', outline: `2px solid ${accentColor}`,
          background: 'var(--background)', color: 'var(--foreground)',
        }}
        placeholder={isQSet ? 'Question set name…' : 'Folder name…'}
      />
      <button onClick={confirm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
        <i className="fa-regular fa-check" aria-hidden="true" style={{ fontSize: 12, color: accentColor }} />
      </button>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
        <i className="fa-regular fa-xmark" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
      </button>
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
    openMenuFolderId, setOpenMenuFolderId,
    draggedFolderId, setDraggedFolderId,
  } = useQB()

  const [menuPos, setMenuPos] = useState<MenuPos | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameName, setRenameName] = useState(node.name)
  const renameRef = useRef<HTMLInputElement>(null)

  const isSelected = selectedFolderId === node.id
  const isExpanded = expandedFolderIds.has(node.id)
  const isDragOver = dragOverFolderId === node.id
  const hasChildren = folders.some(f => f.parentId === node.id)
  const accentColor = getAccentColor(node)
  const icon = getFolderIcon(node, depth, isExpanded, isSelected)

  // Offering badge colour — teal at depth 1 (offerings)
  const isOffering = !!node.isCourseOffering

  const selectedBg = isOffering
    ? `color-mix(in oklch, var(--brand-color) 8%, var(--background))`
    : `color-mix(in oklch, ${accentColor} 10%, var(--background))`

  function handleContextMenu(e: React.MouseEvent) {
    if (!isAdmin) return
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setOpenMenuFolderId(node.id)
  }

  function handleEllipsis(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ x: rect.right, y: rect.bottom })
    setOpenMenuFolderId(node.id)
  }

  function closeMenu() {
    setOpenMenuFolderId(null)
    setMenuPos(null)
  }

  const showMenu = openMenuFolderId === node.id && menuPos !== null

  const indentPx = isOffering ? 8 + (depth - 1) * 16 : 8 + depth * 16

  return (
    <div style={{ position: 'relative' }}>
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        onClick={() => {
          if (!isRenaming) {
            setSelectedFolderId(node.id)
            if (hasChildren && !node.locked) toggleFolder(node.id)
          }
        }}
        onContextMenu={handleContextMenu}
        draggable={isAdmin && !isRenaming && !node.locked && !isOffering}
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
          height: isOffering ? 28 : 32,
          paddingLeft: indentPx,
          paddingRight: 8,
          cursor: 'pointer',
          borderRadius: 6,
          margin: isOffering ? '0 4px' : '1px 4px',
          backgroundColor: isSelected ? selectedBg : isDragOver ? `color-mix(in oklch, ${accentColor} 15%, var(--background))` : 'transparent',
          outline: isDragOver ? `2px dashed ${accentColor}` : 'none',
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
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren && !node.locked) toggleFolder(node.id)
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          style={{
            background: 'none', border: 'none', cursor: hasChildren && !node.locked ? 'pointer' : 'default',
            padding: 0, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: 'var(--muted-foreground)',
            opacity: hasChildren && !node.locked ? 1 : 0,
          }}
          tabIndex={-1}
        >
          <i
            className={`fa-regular ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`}
            aria-hidden="true"
            style={{ fontSize: 9 }}
          />
        </button>

        {/* Icon */}
        <i className={icon.cls} aria-hidden="true"
          style={{ fontSize: isOffering ? 11 : 13, color: icon.color, width: 16, textAlign: 'center', flexShrink: 0 }} />

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
              border: 'none', outline: `2px solid ${accentColor}`,
              background: 'var(--background)', color: accentColor,
              fontWeight: 500,
            }}
          />
        ) : (
          <span style={{
            flex: 1,
            fontSize: isOffering ? 11 : 13,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontWeight: isSelected ? 500 : isOffering ? 500 : 400,
            color: isSelected ? (isOffering ? 'var(--brand-color)' : accentColor) : node.locked ? 'var(--muted-foreground)' : isOffering ? 'var(--foreground)' : 'var(--foreground)',
            fontStyle: node.locked ? 'italic' : 'normal',
            letterSpacing: isOffering ? '0.01em' : undefined,
          }}>
            {node.name}
          </span>
        )}

        {/* Offering badge */}
        {isOffering && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
            backgroundColor: `color-mix(in oklch, var(--brand-color) 12%, var(--background))`,
            color: 'var(--brand-color)', flexShrink: 0, letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            Offering
          </span>
        )}

        {/* SET badge */}
        {node.isQuestionSet && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
            backgroundColor: 'color-mix(in oklch, var(--qb-question-set) 15%, var(--background))',
            color: 'var(--qb-question-set)', flexShrink: 0,
          }}>
            SET
          </span>
        )}

        {/* Count */}
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)', flexShrink: 0 }}>
          {node.count}
        </span>

        {/* ⋯ button — admin only */}
        {isAdmin && (
          <button
            onClick={handleEllipsis}
            aria-label={`Actions for ${node.name}`}
            className="qb-folder-menu-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 3, borderRadius: 4, flexShrink: 0,
              color: showMenu ? accentColor : 'var(--muted-foreground)',
              fontSize: 12,
            }}
          >
            <i className={showMenu ? 'fa-solid fa-ellipsis' : 'fa-regular fa-ellipsis'} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Context menu */}
      {showMenu && (
        <FolderContextMenu
          node={node}
          pos={menuPos!}
          onClose={closeMenu}
          isAdmin={isAdmin}
          depth={depth}
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
  const children = nodes.filter(n => n.parentId === parentId && !n.isQuestionSet)

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
  } = useQB()

  const [inlineCreateParent, setInlineCreateParent] = useState<string | 'root' | null>(null)
  const [inlineCreateQSet, setInlineCreateQSet] = useState(false)

  const isAdmin = currentPersona.role === 'Admin'

  const questionSets = folders.filter(f => f.isQuestionSet)
  const courseFolders = folders.filter(f => f.isCourse && f.parentId === null)

  const allQCount = questions.length
  const myQCount = questions.filter(q => q.creator === currentPersona.id).length

  const isAllSelected = navView === 'all'
  const isMySelected = navView === 'my'

  // Nav item shared style
  const navItem = (
    active: boolean,
    icon: string,
    label: string,
    count: number,
    onClick: () => void,
  ) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: 'none', cursor: 'pointer',
        padding: '7px 12px', height: 34,
        background: active ? 'var(--brand-tint)' : 'none',
        borderRadius: active ? 6 : 0,
        margin: active ? '0 4px' : '0',
        width: active ? 'calc(100% - 8px)' : '100%',
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
    </button>
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
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--muted-foreground)',
        }}>
          Library
        </span>
        {isAdmin && (
          <button
            onClick={() => { setInlineCreateParent('root'); setInlineCreateQSet(false) }}
            aria-label="Create top-level folder"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 4, color: 'var(--muted-foreground)' }}
          >
            <i className="fa-regular fa-plus" aria-hidden="true" style={{ fontSize: 13 }} />
          </button>
        )}
      </div>

      {/* ── Quick Nav: All Questions + My Questions ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '4px 0', flexShrink: 0 }}>
        {navItem(isAllSelected, 'fa-book-open', 'All Questions', allQCount, () => setNavView('all'))}
        {navItem(isMySelected, 'fa-user', 'My Questions', myQCount, () => setNavView('my'))}
      </div>

      {/* Scrollable tree area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>

        {/* ── Courses ── */}
        <div style={{ padding: '4px 12px 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>
            {isAdmin ? 'Courses' : 'My Courses'}
          </span>
          {isAdmin && (
            <button
              onClick={() => { setInlineCreateParent('root'); setInlineCreateQSet(false) }}
              aria-label="Add course"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 3, color: 'var(--muted-foreground)' }}
            >
              <i className="fa-regular fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
            </button>
          )}
        </div>

        {/* Course → Offering → Folders tree */}
        <div role="tree" aria-label="Course tree">
          {courseFolders.map(course => (
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
            isQSet={inlineCreateQSet}
            onConfirm={() => setInlineCreateParent(null)}
            onCancel={() => setInlineCreateParent(null)}
          />
        )}

        {/* ── Question Sets section (admin only) ── */}
        {isAdmin && questionSets.length > 0 && (
          <>
            <div style={{ height: 1, margin: '8px 12px', background: 'var(--border)' }} />
            <div style={{ padding: '4px 12px 2px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>
                Question Sets
              </span>
            </div>
            {questionSets.map(node => (
              <FolderRow key={node.id} node={node} depth={0} isAdmin={isAdmin} />
            ))}
          </>
        )}
      </div>
    </aside>
  )
}
