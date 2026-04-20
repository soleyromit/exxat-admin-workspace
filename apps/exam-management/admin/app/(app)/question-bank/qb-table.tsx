'use client'
import { useState, useRef, useEffect } from 'react'
import { useQB } from './qb-state'
import { StatusBadge, TypeBadge, DiffBadge, PBisCell, BloomsBadge } from '@/components/qb/badges'
import { Portal } from '@/components/qb/portal'
import {
  Button, Badge, Checkbox,
  Sheet, SheetContent, SheetTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
} from '@exxat/ds/packages/ui/src'
import type { Question } from '@/lib/qb-types'

// ── Shared header cell class (matches DS DataTable th) ───────────────────────
const TH = 'h-9 px-3 text-left align-middle text-xs font-medium text-muted-foreground tracking-wide bg-dt-header-bg border-b border-border select-none whitespace-nowrap'

// ── Shared body cell class (matches DS DataTable td) ─────────────────────────
const TD = 'px-3 py-2.5 align-middle border-b border-border group-last/row:border-b-0 whitespace-nowrap'

// ── Version Popover ──────────────────────────────────────────────────────────
function VersionPopover({ question, pos, onClose }: {
  question: Question
  pos: { x: number; y: number }
  onClose: () => void
}) {
  const { currentPersona } = useQB()
  const isOwner = question.creator === currentPersona.id

  const versions = Array.from({ length: question.version }, (_, i) => ({
    v: question.version - i,
    label: i === 0 ? question.title.slice(0, 60) : `Revision ${question.version - i}`,
    author: i === 0 ? (question.lastEditedBy ?? question.creator ?? 'Unknown') : question.creator ?? 'Unknown',
    date: i === 0 ? question.age : `${i + 1} months ago`,
    isLatest: i === 0,
  }))

  return (
    <Portal>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99997 }} />
      <div style={{
        position: 'fixed',
        top: pos.y + 4,
        right: window.innerWidth - pos.x,
        zIndex: 99999,
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        minWidth: 260,
        padding: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 10 }}>
          Version History
        </div>
        {versions.map(v => (
          <div key={v.v} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
              backgroundColor: v.isLatest ? 'var(--brand-tint)' : 'var(--muted)',
              color: v.isLatest ? 'var(--brand-color-dark)' : 'var(--muted-foreground)',
            }}>
              V{v.v}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>
                {v.author} · {v.date}
              </div>
            </div>
          </div>
        ))}
        {!isOwner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--muted-foreground)' }}>
            <i className="fa-regular fa-lock" aria-hidden="true" />
            Only the creator can restore versions.
          </div>
        )}
      </div>
    </Portal>
  )
}

// ── Row Context Menu ──────────────────────────────────────────────────────────
function RowContextMenu({ question, pos, onClose }: {
  question: Question
  pos: { x: number; y: number }
  onClose: () => void
}) {
  const { currentPersona, setRequestEditAccessQuestionId } = useQB()
  const isAdmin = currentPersona.role === 'Admin'
  const isOwner = question.creator === currentPersona.id

  const sep = () => <div key={Math.random()} style={{ height: 1, margin: '4px 0', background: 'var(--border)' }} />

  function menuItem(icon: string, label: string, color?: string, danger = false, onClick?: () => void) {
    return (
      <button
        key={label}
        className="qb-menu-btn"
        onClick={(e) => { e.stopPropagation(); onClick?.(); onClose() }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, textAlign: 'left',
          color: danger ? 'var(--destructive)' : (color ?? 'var(--foreground)'),
        }}
      >
        <i className={`fa-regular ${icon}`} aria-hidden="true"
          style={{ width: 16, textAlign: 'center', fontSize: 13,
            color: danger ? 'var(--destructive)' : (color ?? 'var(--muted-foreground)') }} />
        {label}
      </button>
    )
  }

  const adminItems = [
    menuItem('fa-eye', 'View Details'),
    menuItem('fa-users', 'Collaborate', 'var(--qb-trust-senior-color)'),
    menuItem('fa-thumbtack', question.pinned ? 'Unfix from top' : 'Fix to top', 'var(--brand-color)'),
    sep(),
    menuItem('fa-folder-plus', 'Add to Folder'),
    menuItem('fa-arrow-right-arrow-left', 'Transfer to Course'),
    menuItem('fa-share-nodes', 'Share'),
    menuItem('fa-circle-check', 'Mark Reviewed'),
    menuItem('fa-clock-rotate-left', 'Version History'),
    sep(),
    menuItem('fa-box-archive', 'Archive'),
    menuItem('fa-trash-can', 'Delete', undefined, true),
  ]

  const facultyOwnItems = [
    menuItem('fa-pen', 'Edit Question'),
    menuItem('fa-users', 'Collaborate', 'var(--qb-trust-senior-color)'),
    menuItem('fa-thumbtack', question.pinned ? 'Unfix from top' : 'Fix to top', 'var(--brand-color)'),
    sep(),
    ...(question.tags.includes('private') ? [menuItem('fa-arrow-up-from-bracket', 'Promote to Pool', 'var(--qb-private)')] : []),
    menuItem('fa-clock-rotate-left', 'Version History'),
    sep(),
    menuItem('fa-copy', 'Save as Copy'),
    menuItem(question.shortlisted ? 'fa-bookmark-slash' : 'fa-bookmark', question.shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist', 'var(--qb-locked)'),
  ]

  const facultyViewOnlyItems = [
    menuItem('fa-eye', 'View Details'),
    menuItem('fa-key', 'Request Edit Access', undefined, false, () => setRequestEditAccessQuestionId(question.id)),
    menuItem('fa-clock-rotate-left', 'Version History'),
    sep(),
    menuItem('fa-copy', 'Save as Copy'),
    menuItem(question.shortlisted ? 'fa-bookmark-slash' : 'fa-bookmark', question.shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist', 'var(--qb-locked)'),
  ]

  const items = isAdmin ? adminItems : isOwner ? facultyOwnItems : facultyViewOnlyItems

  return (
    <Portal>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99997 }} />
      <div style={{
        position: 'fixed',
        top: pos.y + 4,
        right: window.innerWidth - pos.x,
        zIndex: 99999,
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        minWidth: 200,
        padding: '4px 0',
        overflow: 'hidden',
      }}>
        {!isAdmin && (
          <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
              <i className={`fa-regular ${isOwner ? 'fa-user' : 'fa-user-lock'}`} aria-hidden="true" />
              {isOwner ? 'Your question' : `View only — ${question.creator ?? 'Unknown'}`}
            </div>
          </div>
        )}
        {items}
      </div>
    </Portal>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────
const QB_COLS = [
  { key: 'question',   label: 'Question',   sortKey: 'title',       hideable: false },
  { key: 'status',     label: 'Status',     sortKey: 'status',      hideable: true  },
  { key: 'type',       label: 'Type',       sortKey: 'type',        hideable: true  },
  { key: 'difficulty', label: 'Difficulty', sortKey: 'difficulty',  hideable: true  },
  { key: 'blooms',     label: "Bloom's",    sortKey: 'blooms',      hideable: true  },
  { key: 'creator',    label: 'Creator',    sortKey: 'creator',     hideable: true  },
  { key: 'usage',      label: 'Usage',      sortKey: 'usage',       hideable: true  },
  { key: 'pbis',       label: 'P-Bis',      sortKey: 'pbis',        hideable: true  },
  { key: 'version',    label: 'Ver.',       sortKey: null,          hideable: true  },
] as const

type ColKey = (typeof QB_COLS)[number]['key']

// ── Filter section (used inside FilterPropertiesSheet) ────────────────────────
function FilterSection<T extends string>({
  label, options, selected, onToggle,
}: {
  label: string
  options: readonly T[]
  selected: Set<T>
  onToggle: (v: T) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">{label}</p>
      <div className="space-y-0.5">
        {options.map(opt => {
          const on = selected.has(opt)
          return (
            <button
              key={opt}
              role="option"
              aria-selected={on}
              onClick={() => onToggle(opt)}
              className="flex items-center gap-2.5 w-full px-1 py-1.5 rounded-lg text-sm text-left transition-colors hover:bg-muted/60"
              style={{ color: 'var(--foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="flex items-center justify-center shrink-0" style={{
                width: 14, height: 14, borderRadius: 3,
                border: on ? 'none' : '1.5px solid var(--border-control-3)',
                background: on ? 'var(--brand-color)' : 'transparent',
              }}>
                {on && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 8, color: 'var(--primary-foreground)' }} />}
              </span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Properties Sheet (filter + columns, DS TablePropertiesDrawer-inspired) ───
function FilterPropertiesSheet({
  open, onOpenChange,
  statusFilter, setStatusFilter,
  typeFilter, setTypeFilter,
  diffFilter, setDiffFilter,
  bookmarkOnly, setBookmarkOnly,
  hiddenCols, setHiddenCols,
  filteredCount, totalCount,
  toggleFilter,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  statusFilter: Set<string>
  setStatusFilter: React.Dispatch<React.SetStateAction<Set<string>>>
  typeFilter: Set<string>
  setTypeFilter: React.Dispatch<React.SetStateAction<Set<string>>>
  diffFilter: Set<string>
  setDiffFilter: React.Dispatch<React.SetStateAction<Set<string>>>
  bookmarkOnly: boolean
  setBookmarkOnly: React.Dispatch<React.SetStateAction<boolean>>
  hiddenCols: Set<ColKey>
  setHiddenCols: React.Dispatch<React.SetStateAction<Set<ColKey>>>
  filteredCount: number
  totalCount: number
  toggleFilter: <T extends string>(set: Set<T>, value: T) => Set<T>
}) {
  const [panel, setPanel] = useState<'main' | 'filter' | 'columns'>('main')
  useEffect(() => { if (!open) setPanel('main') }, [open])

  const activeFilterCount = statusFilter.size + typeFilter.size + diffFilter.size + (bookmarkOnly ? 1 : 0)
  const hiddenColCount = hiddenCols.size

  const sheetContentClass = "w-80 sm:max-w-80 p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden"
  const sheetContentStyle = { top: '0.5rem', bottom: '0.5rem', right: '0.5rem', height: 'calc(100vh - 1rem)' }

  const BackClose = ({ onBack }: { onBack: () => void }) => (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to Properties">
          <i className="fa-light fa-chevron-left text-[13px]" aria-hidden="true" />
        </Button>
        <SheetTitle className="text-sm font-semibold">
          {panel === 'filter' ? 'Filter' : 'Columns'}
        </SheetTitle>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close">
        <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
      </Button>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} showOverlay={false}
        className={sheetContentClass} style={sheetContentStyle}>

        {/* ── Main panel ── */}
        {panel === 'main' && (
          <>
            <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
              <SheetTitle className="text-base font-semibold">Properties</SheetTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label="Close">
                <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
              {([
                {
                  id: 'filter' as const,
                  icon: 'fa-filter',
                  label: 'Filter',
                  desc: activeFilterCount === 0
                    ? `Showing all ${totalCount} questions.`
                    : `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active · ${filteredCount} questions.`,
                },
                {
                  id: 'columns' as const,
                  icon: 'fa-table-columns',
                  label: 'Columns',
                  desc: hiddenColCount === 0 ? 'All columns visible.' : `${hiddenColCount} column${hiddenColCount !== 1 ? 's' : ''} hidden.`,
                },
              ] as { id: 'filter' | 'columns'; icon: string; label: string; desc: string }[]).map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => setPanel(item.id)}
                  className="w-full h-auto justify-start gap-3 px-3 py-3 rounded-2xl font-normal border border-transparent hover:bg-muted/60 hover:text-foreground"
                >
                  <span className="inline-flex items-center justify-center size-9 rounded-lg bg-secondary border border-border shrink-0">
                    <i className={`fa-light ${item.icon} text-[15px] text-secondary-foreground`} aria-hidden="true" />
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

        {/* ── Filter sub-panel ── */}
        {panel === 'filter' && (
          <>
            <BackClose onBack={() => setPanel('main')} />
            <div className="px-2 py-1 text-xs text-muted-foreground text-center" aria-live="polite">
              {activeFilterCount === 0
                ? `Showing all ${totalCount} questions`
                : `${filteredCount} of ${totalCount} · ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              <FilterSection
                label="Status"
                options={['Draft', 'Active', 'Ready', 'In Review', 'Flagged', 'Approved', 'Locked'] as const}
                selected={statusFilter}
                onToggle={v => setStatusFilter(prev => toggleFilter(prev, v))}
              />
              <FilterSection
                label="Type"
                options={['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching'] as const}
                selected={typeFilter}
                onToggle={v => setTypeFilter(prev => toggleFilter(prev, v))}
              />
              <FilterSection
                label="Difficulty"
                options={['Easy', 'Medium', 'Hard'] as const}
                selected={diffFilter}
                onToggle={v => setDiffFilter(prev => toggleFilter(prev, v))}
              />
              {/* Bookmarked */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">Saved</p>
                <button
                  onClick={() => setBookmarkOnly(v => !v)}
                  className="flex items-center gap-2.5 w-full px-1 py-1.5 rounded-lg text-sm text-left transition-colors hover:bg-muted/60"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span className="flex items-center justify-center shrink-0" style={{
                    width: 14, height: 14, borderRadius: 3,
                    border: bookmarkOnly ? 'none' : '1.5px solid var(--border-control-3)',
                    background: bookmarkOnly ? 'var(--brand-color)' : 'transparent',
                  }}>
                    {bookmarkOnly && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 8, color: 'var(--primary-foreground)' }} />}
                  </span>
                  <span style={{ color: 'var(--foreground)' }}>Bookmarked only</span>
                </button>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost" size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setStatusFilter(new Set())
                    setTypeFilter(new Set())
                    setDiffFilter(new Set())
                    setBookmarkOnly(false)
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Columns sub-panel ── */}
        {panel === 'columns' && (
          <>
            <BackClose onBack={() => setPanel('main')} />
            <div className="px-2 py-1 text-xs text-muted-foreground text-center">
              {hiddenColCount === 0 ? 'All columns visible.' : `${hiddenColCount} column${hiddenColCount !== 1 ? 's' : ''} hidden.`}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
              {QB_COLS.filter(c => c.hideable).map(col => {
                const visible = !hiddenCols.has(col.key)
                return (
                  <button
                    key={col.key}
                    onClick={() => setHiddenCols(prev => {
                      const next = new Set(prev)
                      if (next.has(col.key)) next.delete(col.key)
                      else next.add(col.key)
                      return next
                    })}
                    className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg transition-colors hover:bg-muted/60"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <i
                      className={`fa-light ${visible ? 'fa-eye' : 'fa-eye-slash'} text-sm`}
                      aria-hidden="true"
                      style={{ color: visible ? 'var(--foreground)' : 'var(--muted-foreground)', width: 16 }}
                    />
                    <span className="text-sm" style={{ color: visible ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                      {col.label}
                    </span>
                    {!visible && (
                      <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>Hidden</span>
                    )}
                  </button>
                )
              })}
            </div>
            {hiddenColCount > 0 && (
              <div className="p-3 border-t border-border">
                <Button
                  variant="ghost" size="sm"
                  className="w-full"
                  onClick={() => setHiddenCols(new Set())}
                >
                  Show all columns
                </Button>
              </div>
            )}
          </>
        )}

      </SheetContent>
    </Sheet>
  )
}

// ── Column header with sort indicator + contextual menu ───────────────────────
function ColHeader({
  col, sortCol, sortDir, onSort, onHide, className,
}: {
  col: typeof QB_COLS[number]
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  onSort: (key: string, dir: 'asc' | 'desc') => void
  onHide: (key: ColKey) => void
  className?: string
}) {
  const isActive = sortCol === col.key
  return (
    <th className={`${TH} ${className ?? ''}`}>
      <DropdownMenu>
        <div
          className="flex items-center gap-1 group/col-hdr cursor-pointer select-none w-full"
          onClick={() => col.sortKey && onSort(col.key, isActive && sortDir === 'asc' ? 'desc' : 'asc')}
        >
          <span className="flex-1 truncate">{col.label}</span>
          {isActive && (
            <i
              className={`fa-solid ${sortDir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'} text-[9px]`}
              style={{ color: 'var(--brand-color)' }}
              aria-hidden="true"
            />
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

        <DropdownMenuContent align="start" className="w-44">
          {col.sortKey && (
            <>
              <DropdownMenuItem onClick={() => onSort(col.key, 'asc')}>
                <i className="fa-light fa-arrow-up text-xs" aria-hidden="true" />
                Sort ascending
                {isActive && sortDir === 'asc' && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSort(col.key, 'desc')}>
                <i className="fa-light fa-arrow-down text-xs" aria-hidden="true" />
                Sort descending
                {isActive && sortDir === 'desc' && <i className="fa-solid fa-check text-xs ml-auto" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />}
              </DropdownMenuItem>
              {col.hideable && <DropdownMenuSeparator />}
            </>
          )}
          {col.hideable && (
            <DropdownMenuItem onClick={() => onHide(col.key)}>
              <i className="fa-light fa-eye-slash text-xs" aria-hidden="true" />
              Hide column
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </th>
  )
}

// ── Question Table ────────────────────────────────────────────────────────────
export function QBTable() {
  const {
    visibleQuestions,
    selectedQuestionIds, toggleQuestionSelection, selectAllQuestions, clearSelection,
    rowHoverId, setRowHoverId,
    currentPersona,
    setDraggedQuestionId,
    openVersionPopoverId, setOpenVersionPopoverId,
    openMenuQuestionId, setOpenMenuQuestionId,
  } = useQB()

  const isAdmin = currentPersona.role === 'Admin'

  // ── Toolbar state ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set())
  const [diffFilter, setDiffFilter] = useState<Set<string>>(new Set())
  const [bookmarkOnly, setBookmarkOnly] = useState(false)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  function toggleFilter<T extends string>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSortCol(key)
    setSortDir(dir)
  }

  const hasActiveFilters = statusFilter.size > 0 || typeFilter.size > 0 || diffFilter.size > 0
  const activeFilterCount = statusFilter.size + typeFilter.size + diffFilter.size + (bookmarkOnly ? 1 : 0)
  const hasAnyFilter = search || hasActiveFilters || bookmarkOnly

  function clearAllFilters() {
    setSearch('')
    setStatusFilter(new Set())
    setTypeFilter(new Set())
    setDiffFilter(new Set())
    setBookmarkOnly(false)
  }

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filteredQuestions = visibleQuestions.filter(q => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.code.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter.size > 0 && !statusFilter.has(q.status)) return false
    if (typeFilter.size > 0 && !typeFilter.has(q.type)) return false
    if (diffFilter.size > 0 && !diffFilter.has(q.difficulty)) return false
    if (bookmarkOnly && !q.shortlisted) return false
    return true
  })

  // ── Sort ─────────────────────────────────────────────────────────────────
  const DIFF_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 }
  const sortedQuestions = (() => {
    if (!sortCol) return filteredQuestions
    return [...filteredQuestions].sort((a, b) => {
      let va: string | number = '', vb: string | number = ''
      if (sortCol === 'question')   { va = a.title ?? '';         vb = b.title ?? ''         }
      else if (sortCol === 'status')     { va = a.status ?? '';        vb = b.status ?? ''        }
      else if (sortCol === 'type')       { va = a.type ?? '';          vb = b.type ?? ''          }
      else if (sortCol === 'difficulty') { va = DIFF_ORDER[a.difficulty] ?? 0; vb = DIFF_ORDER[b.difficulty] ?? 0 }
      else if (sortCol === 'blooms')     { va = a.blooms ?? '';        vb = b.blooms ?? ''        }
      else if (sortCol === 'creator')    { va = a.creator ?? '';       vb = b.creator ?? ''       }
      else if (sortCol === 'usage')      { va = a.usage ?? 0;          vb = b.usage ?? 0          }
      else if (sortCol === 'pbis')       { va = a.pbis ?? 0;           vb = b.pbis ?? 0           }
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  })()

  const [page, setPage] = useState(1)
  const perPage = 20
  const totalPages = Math.ceil(sortedQuestions.length / perPage)
  const pageQuestions = sortedQuestions.slice((page - 1) * perPage, page * perPage)

  // Reset to page 1 when filters/sort change
  useEffect(() => { setPage(1) }, [search, statusFilter, typeFilter, diffFilter, bookmarkOnly, sortCol, sortDir])

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [versionPopoverPos, setVersionPopoverPos] = useState<{ x: number; y: number } | null>(null)
  const [contextMenuQuestion, setContextMenuQuestion] = useState<Question | null>(null)
  const [versionPopoverQuestion, setVersionPopoverQuestion] = useState<Question | null>(null)

  const allSelected = pageQuestions.length > 0 && pageQuestions.every(q => selectedQuestionIds.has(q.id))
  const someSelected = pageQuestions.some(q => selectedQuestionIds.has(q.id)) && !allSelected
  const anySelected = selectedQuestionIds.size > 0

  function handleSelectAll() {
    if (allSelected) clearSelection()
    else selectAllQuestions()
  }

  function openContextMenu(e: React.MouseEvent, question: Question) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setContextMenuPos({ x: rect.right, y: rect.bottom })
    setContextMenuQuestion(question)
    setOpenMenuQuestionId(question.id)
  }

  function openVersionPopover(e: React.MouseEvent, question: Question) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setVersionPopoverPos({ x: rect.right, y: rect.bottom })
    setVersionPopoverQuestion(question)
    setOpenVersionPopoverId(question.id)
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto pb-4" style={{ padding: '16px 16px 0' }}>
      {/* ── Toolbar: count left, icon controls right ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, minHeight: 32 }}>
        {/* Count */}
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', flex: 1 }}>
          {hasAnyFilter
            ? `${filteredQuestions.length} of ${visibleQuestions.length} questions`
            : `${visibleQuestions.length} questions`}
        </span>

        {/* Right: icon controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

          {/* Search — expandable */}
          {searchOpen ? (
            <InputGroup style={{ width: 220 }}>
              <InputGroupAddon align="inline-start">
                <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 12 }} />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); setSearchOpen(false) } }}
                onBlur={() => { if (!search) setSearchOpen(false) }}
                placeholder="Search questions…"
                aria-label="Search questions"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => { setSearch(''); setSearchOpen(false) }}
                  aria-label="Close search"
                >
                  <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 30) }}
              aria-label="Search questions"
              style={search ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
            >
              <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          )}

          {/* Bookmark toggle */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setBookmarkOnly(v => !v)}
            aria-pressed={bookmarkOnly}
            aria-label={bookmarkOnly ? 'Show all questions' : 'Show bookmarked only'}
            style={bookmarkOnly ? { borderColor: 'var(--qb-locked)', color: 'var(--qb-locked)', backgroundColor: 'color-mix(in oklch, var(--qb-locked) 10%, var(--background))' } : {}}
          >
            <i
              className={bookmarkOnly ? 'fa-solid fa-bookmark' : 'fa-light fa-bookmark'}
              aria-hidden="true"
              style={{ fontSize: 13 }}
            />
          </Button>

          {/* Properties / filter sheet trigger */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPropertiesOpen(true)}
              aria-label="Table properties"
              style={activeFilterCount > 0 || hiddenCols.size > 0 ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
            >
              <i className="fa-light fa-sliders" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                width: 15, height: 15, borderRadius: '50%',
                backgroundColor: 'var(--brand-color)', color: 'var(--primary-foreground)',
                fontSize: 8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                {activeFilterCount}
              </span>
            )}
          </div>

        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <i className="fa-regular fa-inbox text-3xl opacity-35 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">No questions match your filters</span>
          {hasAnyFilter && (
            <button onClick={clearAllFilters}
              style={{ fontSize: 12, color: 'var(--brand-color)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Table container — matches DS DataTable visual ── */}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  {/* Select all */}
                  <th className={`${TH} w-10 text-center`}>
                    <div className="flex items-center justify-center">
                      <span className="sr-only">Select all</span>
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    </div>
                  </th>
                  {QB_COLS.filter(c => !hiddenCols.has(c.key)).map(col => (
                    <ColHeader
                      key={col.key}
                      col={col}
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                      onHide={key => setHiddenCols(prev => new Set([...prev, key]))}
                      className={
                        col.key === 'status'     ? 'w-28' :
                        col.key === 'type'       ? 'w-24' :
                        col.key === 'difficulty' ? 'w-24' :
                        col.key === 'blooms'     ? 'w-28' :
                        col.key === 'creator'    ? 'w-40' :
                        col.key === 'usage'      ? 'w-16' :
                        col.key === 'pbis'       ? 'w-20' :
                        col.key === 'version'    ? 'w-16' : ''
                      }
                    />
                  ))}
                  <th className={`${TH} w-10`} />
                </tr>
              </thead>
              <tbody>
                {pageQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.has(q.id)
                  const isHovered = rowHoverId === q.id
                  const isOwner = q.creator === currentPersona.id
                  const isPrivate = q.tags.includes('private')

                  const creatorPersona = (() => {
                    const map: Record<string, { initials: string; color: string; name: string; trust: string }> = {
                      'persona-thompson': { initials: 'DT', color: 'var(--brand-color)', name: 'Dr. Thompson', trust: 'senior' },
                      'persona-chen':     { initials: 'SC', color: 'var(--qb-question-set)', name: 'Dr. Chen', trust: 'senior' },
                      'persona-patel':    { initials: 'JP', color: 'var(--chart-5)', name: 'Dr. Patel', trust: 'junior' },
                    }
                    return map[q.creator ?? ''] ?? { initials: '?', color: 'var(--muted)', name: 'Unknown', trust: 'junior' }
                  })()

                  const trustColor = { senior: 'var(--qb-trust-senior-color)', mid: 'var(--qb-trust-mid-color)', junior: 'var(--qb-trust-junior-color)' }[creatorPersona.trust as 'senior' | 'mid' | 'junior'] ?? 'var(--qb-trust-junior-color)'
                  const trustBg   = { senior: 'var(--qb-trust-senior-bg)', mid: 'var(--qb-trust-mid-bg)', junior: 'var(--muted)' }[creatorPersona.trust as 'senior' | 'mid' | 'junior'] ?? 'var(--muted)'

                  // Row background: QB-specific state overrides DS defaults
                  const rowBg = isSelected
                    ? 'var(--dt-row-selected)'
                    : q.pinned
                      ? 'color-mix(in oklch, var(--brand-color) 4%, var(--background))'
                      : undefined

                  return (
                    <tr
                      key={q.id}
                      data-state={isSelected ? 'selected' : undefined}
                      onMouseEnter={() => setRowHoverId(q.id)}
                      onMouseLeave={() => setRowHoverId(null)}
                      draggable={isAdmin}
                      onDragStart={() => setDraggedQuestionId(q.id)}
                      onDragEnd={() => setDraggedQuestionId(null)}
                      className="group/row transition-colors hover:bg-dt-row-hover"
                      style={{
                        backgroundColor: rowBg,
                        opacity: (!isAdmin && !isOwner) ? 0.72 : 1,
                        borderLeft: isPrivate ? '3px solid var(--qb-private)' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Checkbox */}
                      <td className={`${TD} w-10 text-center`}>
                        <div
                          className={`flex items-center justify-center transition-opacity ${
                            anySelected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
                          }`}
                          onClick={(e) => { e.stopPropagation(); toggleQuestionSelection(q.id) }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleQuestionSelection(q.id)}
                            aria-label={`Select ${q.title}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </td>

                      {/* Question cell */}
                      <td className={TD} style={{ minWidth: 200 }}>
                        {/* Title row */}
                        <div className="flex items-center gap-1.5 mb-1">
                          {q.pinned && (
                            <i className="fa-solid fa-thumbtack text-brand-color flex-shrink-0" aria-hidden="true"
                              style={{ fontSize: 9, color: 'var(--brand-color)', transform: 'rotate(45deg)' }} />
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={q.shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                            className={`shrink-0 transition-opacity ${q.shortlisted || isHovered ? 'opacity-100' : 'opacity-0'}`}
                            style={{ color: 'var(--qb-locked)' }}
                          >
                            <i
                              className={q.shortlisted ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}
                              aria-hidden="true"
                              style={{ fontSize: 11 }}
                            />
                          </Button>
                          {isPrivate && (
                            <Badge
                              variant="secondary"
                              className="rounded shrink-0"
                              style={{
                                fontSize: 9, fontWeight: 600, padding: '1px 5px',
                                backgroundColor: 'color-mix(in oklch, var(--qb-private) 12%, var(--background))',
                                color: 'var(--qb-private)',
                                border: '1px solid color-mix(in oklch, var(--qb-private) 25%, var(--background))',
                              }}
                            >
                              <i className="fa-solid fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 7 }} /> Private
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-foreground truncate">
                            {q.title}
                          </span>
                        </div>
                        {/* Sub-row: code + type + ownership */}
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="rounded font-mono border border-border"
                            style={{ fontSize: 10, padding: '1px 5px' }}
                          >
                            {q.code}
                          </Badge>
                          <TypeBadge type={q.type} />
                          {!isAdmin && !isOwner && isHovered && (
                            <Badge
                              variant="secondary"
                              className="rounded"
                              style={{
                                fontSize: 10, padding: '1px 5px',
                                backgroundColor: 'var(--muted)',
                                color: 'var(--muted-foreground)',
                              }}
                            >
                              View only
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      {!hiddenCols.has('status') && (
                        <td className={`${TD} w-28`}>
                          <StatusBadge status={q.status} />
                        </td>
                      )}

                      {/* Type */}
                      {!hiddenCols.has('type') && (
                        <td className={`${TD} w-24`}>
                          <TypeBadge type={q.type} />
                        </td>
                      )}

                      {/* Difficulty */}
                      {!hiddenCols.has('difficulty') && (
                        <td className={`${TD} w-24`}>
                          <DiffBadge diff={q.difficulty} />
                        </td>
                      )}

                      {/* Bloom's */}
                      {!hiddenCols.has('blooms') && (
                        <td className={`${TD} w-28`}>
                          <BloomsBadge blooms={q.blooms} />
                        </td>
                      )}

                      {/* Creator */}
                      {!hiddenCols.has('creator') && (
                        <td className={`${TD} w-40`}>
                          <div className="flex items-center gap-2">
                            <span style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              backgroundColor: creatorPersona.color,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 700, color: 'var(--primary-foreground)',
                            }}>
                              {creatorPersona.initials}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div className="text-xs font-semibold text-foreground truncate">
                                {creatorPersona.name}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">Faculty</span>
                                <Badge
                                  variant="secondary"
                                  className="rounded"
                                  style={{ fontSize: 9, fontWeight: 700, padding: '0 4px', backgroundColor: trustBg, color: trustColor }}
                                >
                                  {creatorPersona.trust}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Usage */}
                      {!hiddenCols.has('usage') && (
                        <td className={`${TD} w-16 text-sm text-foreground`}>
                          {q.usage}
                        </td>
                      )}

                      {/* P-Bis */}
                      {!hiddenCols.has('pbis') && (
                        <td className={`${TD} w-20`}>
                          <PBisCell value={q.pbis} dir={q.pbisDir} />
                        </td>
                      )}

                      {/* Version */}
                      {!hiddenCols.has('version') && <td className={`${TD} w-16`}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => openVersionPopover(e, q)}
                          aria-label={`Version history for ${q.title}`}
                          style={{
                            fontSize: 10, fontWeight: 600, gap: 4,
                            backgroundColor: openVersionPopoverId === q.id ? 'var(--brand-tint)' : 'var(--muted)',
                            color: openVersionPopoverId === q.id ? 'var(--brand-color-dark)' : 'var(--muted-foreground)',
                          }}
                        >
                          <i
                            className={openVersionPopoverId === q.id ? 'fa-solid fa-clock-rotate-left' : 'fa-regular fa-clock-rotate-left'}
                            aria-hidden="true"
                            style={{ fontSize: 9 }}
                          />
                          V{q.version}
                        </Button>
                      </td>}

                      {/* Actions ⋯ */}
                      <td className={`${TD} w-10 text-right`}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => openContextMenu(e, q)}
                          aria-label={`Actions for ${q.title}`}
                        >
                          <i
                            className={`fa-${openMenuQuestionId === q.id ? 'solid' : 'regular'} fa-ellipsis`}
                            aria-hidden="true"
                          />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, sortedQuestions.length)} of {sortedQuestions.length}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === page ? 'default' : 'outline'} size="xs" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Floating bulk-action bar ── */}
      {anySelected && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border border-border bg-background shadow-lg px-4 py-2.5 animate-in fade-in-0 slide-in-from-bottom-3 duration-150"
        >
          <span className="text-sm font-medium text-foreground mr-1">{selectedQuestionIds.size} selected</span>
          <div className="h-4 w-px bg-border mx-1" aria-hidden="true" />
          <Button size="sm" variant="outline" onClick={() => {}}>
            <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={() => {}}>
            <i className="fa-light fa-folder-plus" aria-hidden="true" /> Add to Folder
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Clear selection" onClick={clearSelection} className="ml-1">
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* ── Version popover ── */}
      {versionPopoverQuestion && versionPopoverPos && (
        <VersionPopover
          question={versionPopoverQuestion}
          pos={versionPopoverPos}
          onClose={() => { setVersionPopoverQuestion(null); setVersionPopoverPos(null); setOpenVersionPopoverId(null) }}
        />
      )}

      {/* ── Row context menu ── */}
      {contextMenuQuestion && contextMenuPos && (
        <RowContextMenu
          question={contextMenuQuestion}
          pos={contextMenuPos}
          onClose={() => { setContextMenuQuestion(null); setContextMenuPos(null); setOpenMenuQuestionId(null) }}
        />
      )}

      {/* ── Properties / filter sheet ── */}
      <FilterPropertiesSheet
        open={propertiesOpen}
        onOpenChange={setPropertiesOpen}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        diffFilter={diffFilter}
        setDiffFilter={setDiffFilter}
        bookmarkOnly={bookmarkOnly}
        setBookmarkOnly={setBookmarkOnly}
        hiddenCols={hiddenCols}
        setHiddenCols={setHiddenCols}
        filteredCount={filteredQuestions.length}
        totalCount={visibleQuestions.length}
        toggleFilter={toggleFilter}
      />
    </div>
  )
}
