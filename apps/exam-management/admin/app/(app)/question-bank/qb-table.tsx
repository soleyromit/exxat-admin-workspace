'use client'
import { useState, useRef, useEffect } from 'react'
import { useQB } from './qb-state'
import { StatusBadge, DiffBadge, PBisCell, BloomsBadge } from '@/components/qb/badges'
import {
  Button, Badge, Checkbox,
  Sheet, SheetContent, SheetTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Popover, PopoverTrigger, PopoverContent,
  Tooltip, TooltipTrigger, TooltipContent,
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@exxat/ds/packages/ui/src'
import type { Question } from '@/lib/qb-types'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'
import { RequestEditAccessModal } from './qb-modals'

// ── Shared header cell class (matches DS DataTable th) ───────────────────────
const TH = '!h-9 px-3 text-left align-middle text-xs font-medium text-muted-foreground tracking-wide bg-dt-header-bg border-b border-border select-none whitespace-nowrap'

// ── Shared body cell class (matches DS DataTable td) ─────────────────────────
const TD = 'px-3 py-2.5 align-middle border-b border-border group-last/row:border-b-0 whitespace-nowrap'

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
  { key: 'pbis',         label: 'P–',             sortKey: 'pbis',        hideable: true  },
  { key: 'version',      label: 'Ver.',           sortKey: null,          hideable: true  },
  { key: 'favorited',    label: '★',              sortKey: null,          hideable: false },
  { key: 'actions',      label: '',               sortKey: null,          hideable: false, sortable: false },
] as const

type ColKey = (typeof QB_COLS)[number]['key']

// ── Location path cell ───────────────────────────────────────────────────────
function LocationCell({ question }: { question: Question }) {
  const { folders, navigateToFolder } = useQB()
  if (!question.folderPath) return <span style={{ color: 'var(--muted-foreground)' }}>—</span>
  const parts = question.folderPath.split(' / ')
  const courseRoot = parts[0]   // e.g. "PHAR101 QB"
  const sub = parts.slice(1).join(' / ')  // e.g. "Antibiotics & Antimicrobials"
  const courseCode = courseRoot.split(' ')[0]  // e.g. "PHAR101"
  const rootFolder = folders.find(f => f.isCourse && f.name.startsWith(courseCode))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => { e.stopPropagation(); if (rootFolder) navigateToFolder(rootFolder.id) }}
        className="h-auto w-auto p-0 font-normal"
        style={{ color: 'var(--brand-color)', textDecoration: 'underline', textUnderlineOffset: 2, fontSize: 11 }}
        aria-label={`Navigate to ${courseRoot}`}
      >
        {courseRoot}
      </Button>
      {sub && (
        <>
          <span style={{ opacity: 0.4, fontSize: 11 }}>›</span>
          <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{sub}</span>
        </>
      )}
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
      onClick={e => { e.stopPropagation(); toggleQuestionFavorited(questionId) }}
      style={{ color: isFav ? 'var(--chart-4)' : 'var(--muted-foreground)', opacity: isFav ? 1 : 0 }}
      className="transition-opacity group-hover/row:opacity-100"
    >
      <i className={isFav ? 'fa-solid fa-star' : 'fa-light fa-star'} aria-hidden="true" style={{ fontSize: 13 }} />
    </Button>
  )
}

// ── Active filter chips ───────────────────────────────────────────────────────
function ActiveFilterChips() {
  const { myQuestionsOnly, setMyQuestionsOnly, favoritesFilter, setFavoritesFilter } = useQB()
  const chips: { label: string; onRemove: () => void }[] = []
  if (myQuestionsOnly) chips.push({ label: 'My Questions', onRemove: () => setMyQuestionsOnly(false) })
  if (favoritesFilter) chips.push({ label: 'Favorites', onRemove: () => setFavoritesFilter(false) })
  if (chips.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      {chips.map(chip => (
        <Badge key={chip.label} variant="secondary" className="rounded gap-1 px-2 py-0.5 text-xs" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {chip.label}
          <Button
            variant="ghost" size="icon-xs"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter`}
            className="h-auto w-auto p-0 ml-1"
            style={{ color: 'inherit' }}
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
          </Button>
        </Badge>
      ))}
    </div>
  )
}

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
    <TableHead className={`${TH} ${className ?? ''}`}>
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
    </TableHead>
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
    openMenuQuestionId, setOpenMenuQuestionId,
    myQuestionsOnly, setMyQuestionsOnly,
    favoritesFilter, setFavoritesFilter,
  } = useQB()

  const isAdmin = currentPersona.role === 'Admin'

  const [reqAccessQuestion, setReqAccessQuestion] = useState<{ id: string; title: string } | null>(null)

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
    if (bookmarkOnly && !q.favorited) return false
    return true
  })

  // ── Sort ─────────────────────────────────────────────────────────────────
  const DIFF_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 }
  const sortedQuestions = (() => {
    if (!sortCol) return filteredQuestions
    return [...filteredQuestions].sort((a, b) => {
      let va: string | number = '', vb: string | number = ''
      if (sortCol === 'title')       { va = a.title ?? '';         vb = b.title ?? ''         }
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

  const allSelected = pageQuestions.length > 0 && pageQuestions.every(q => selectedQuestionIds.has(q.id))
  const someSelected = pageQuestions.some(q => selectedQuestionIds.has(q.id)) && !allSelected
  const anySelected = selectedQuestionIds.size > 0

  function handleSelectAll() {
    if (allSelected) clearSelection()
    else selectAllQuestions()
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

          {/* Bookmark toggle — star icon */}
          <Button
            variant="outline"
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

          {/* My Questions toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline" size="icon-sm"
                aria-label="My questions"
                aria-pressed={myQuestionsOnly}
                onClick={() => setMyQuestionsOnly(!myQuestionsOnly)}
                style={myQuestionsOnly ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
              >
                <i className="fa-light fa-user" aria-hidden="true" style={{ fontSize: 13 }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>My questions only</TooltipContent>
          </Tooltip>

          {/* Favorites toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline" size="icon-sm"
                aria-label="Favorites"
                aria-pressed={favoritesFilter}
                onClick={() => setFavoritesFilter(!favoritesFilter)}
                style={favoritesFilter ? { borderColor: 'var(--chart-4)', color: 'var(--chart-4)', backgroundColor: 'color-mix(in oklch, var(--chart-4) 10%, var(--background))' } : {}}
              >
                <i className={favoritesFilter ? 'fa-solid fa-star' : 'fa-light fa-star'} aria-hidden="true" style={{ fontSize: 13 }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Favorites only</TooltipContent>
          </Tooltip>

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

      {/* ── Active filter chips ── */}
      <ActiveFilterChips />

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
          <div className="border border-border rounded-lg">
            <Table className="w-full text-sm border-separate border-spacing-0">
              <TableHeader>
                <TableRow>
                  {/* Select all */}
                  <TableHead className={`${TH} w-10 text-center`}>
                    <div className="flex items-center justify-center">
                      <span className="sr-only">Select all</span>
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    </div>
                  </TableHead>
                  {QB_COLS.filter(c => !hiddenCols.has(c.key)).map(col => (
                    <ColHeader
                      key={col.key}
                      col={col}
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onSort={handleSort}
                      onHide={key => setHiddenCols(prev => new Set([...prev, key]))}
                      className={
                        col.key === 'status'       ? 'w-28' :
                        col.key === 'type'         ? 'w-24' :
                        col.key === 'difficulty'   ? 'w-24' :
                        col.key === 'blooms'       ? 'w-28' :
                        col.key === 'location'     ? 'w-44' :
                        col.key === 'creator'      ? 'w-40' :
                        col.key === 'lastEditedBy' ? 'w-32' :
                        col.key === 'usage'        ? 'w-16' :
                        col.key === 'pbis'         ? 'w-20' :
                        col.key === 'version'      ? 'w-16' :
                        col.key === 'favorited'    ? 'w-8'  : ''
                      }
                    />
                  ))}
                  <TableHead className={`${TH} w-10`} />
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:border-b-0">
                {pageQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.has(q.id)
                  const isHovered = rowHoverId === q.id
                  const isOwner = q.creator === currentPersona.id
                  const isPrivate = q.tags.includes('private')

                  const creatorPersona = MOCK_QB_PERSONAS.find(p => p.id === (q.creator ?? ''))
                    ?? { initials: '?', color: 'var(--muted)', name: 'Unknown', trustLevel: 'junior' as const, id: '', role: 'Faculty' as const }

                  // Row background: QB-specific state overrides DS defaults
                  const rowBg = isSelected
                    ? 'var(--dt-row-selected)'
                    : q.pinned
                      ? 'color-mix(in oklch, var(--brand-color) 4%, var(--background))'
                      : undefined

                  return (
                    <TableRow
                      key={q.id}
                      data-state={isSelected ? 'selected' : undefined}
                      onMouseEnter={() => setRowHoverId(q.id)}
                      onMouseLeave={() => setRowHoverId(null)}
                      draggable={isAdmin}
                      onDragStart={() => setDraggedQuestionId(q.id)}
                      onDragEnd={() => setDraggedQuestionId(null)}
                      className="group/row transition-colors hover:!bg-dt-row-hover"
                      style={{
                        backgroundColor: rowBg,
                        opacity: (!isAdmin && !isOwner) ? 0.72 : 1,
                        borderLeft: isPrivate ? '3px solid var(--qb-private)' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Checkbox */}
                      <TableCell className={`${TD} w-10 text-center`}>
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
                      </TableCell>

                      {/* Question cell — title + code only (no type pill) */}
                      <TableCell className={TD} style={{ minWidth: 280, maxWidth: 380 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          {q.pinned && (
                            <i className="fa-solid fa-thumbtack" aria-hidden="true"
                              style={{ fontSize: 10, color: 'var(--brand-color)', marginTop: 3, transform: 'rotate(45deg)', flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
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
                            </div>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.4 }}>
                              {q.title}
                            </div>
                            <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Badge
                                variant="secondary"
                                className="rounded font-mono border border-border"
                                style={{ fontSize: 10, padding: '1px 5px' }}
                              >
                                {q.code}
                              </Badge>
                              {!isAdmin && !isOwner && isHovered && (
                                <Badge
                                  variant="secondary"
                                  className="rounded"
                                  style={{ fontSize: 10, padding: '1px 5px', backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                                >
                                  View only
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      {!hiddenCols.has('status') && (
                        <TableCell className={`${TD} w-28`}>
                          <StatusBadge status={q.status} />
                        </TableCell>
                      )}

                      {/* Type — plain neutral text, no pill */}
                      {!hiddenCols.has('type') && (
                        <TableCell className={`${TD} w-24`}>
                          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted-foreground)' }}>
                            {q.type}
                          </span>
                        </TableCell>
                      )}

                      {/* Difficulty */}
                      {!hiddenCols.has('difficulty') && (
                        <TableCell className={`${TD} w-24`}>
                          <DiffBadge diff={q.difficulty} />
                        </TableCell>
                      )}

                      {/* Bloom's */}
                      {!hiddenCols.has('blooms') && (
                        <TableCell className={`${TD} w-28`}>
                          <BloomsBadge blooms={q.blooms} />
                        </TableCell>
                      )}

                      {/* Location — folder path as clickable breadcrumb */}
                      {!hiddenCols.has('location') && (
                        <TableCell className={`${TD} w-44`}>
                          <LocationCell question={q} />
                        </TableCell>
                      )}

                      {/* Creator */}
                      {!hiddenCols.has('creator') && (
                        <TableCell className={`${TD} w-40`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', background: creatorPersona.color,
                              color: 'white', fontSize: 8, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              {creatorPersona.initials}
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--foreground)' }}>{creatorPersona.name}</span>
                          </div>
                        </TableCell>
                      )}

                      {/* Last Edited By */}
                      {!hiddenCols.has('lastEditedBy') && (
                        <TableCell className={`${TD} w-32`}>
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                            {q.lastEditedBy ?? q.creator ?? '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* Usage */}
                      {!hiddenCols.has('usage') && (
                        <TableCell className={`${TD} w-16 text-sm text-foreground`}>
                          {q.usage}
                        </TableCell>
                      )}

                      {/* P-Bis */}
                      {!hiddenCols.has('pbis') && (
                        <TableCell className={`${TD} w-20`}>
                          <PBisCell pbis={q.pbis} pbisDir={q.pbisDir} />
                        </TableCell>
                      )}

                      {/* Version — DS Popover */}
                      {!hiddenCols.has('version') && (
                        <TableCell className={`${TD} w-16`}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon-xs" aria-label="Version history">
                                <Badge variant="secondary" className="rounded font-mono" style={{ fontSize: 10, padding: '1px 5px', cursor: 'pointer' }}>
                                  V{q.version}
                                </Badge>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-72 p-3">
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 10 }}>
                                Version History
                              </div>
                              {Array.from({ length: q.version }, (_, i) => {
                                const vNum = q.version - i
                                const isLatest = i === 0
                                return (
                                  <div key={vNum} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                    <Badge variant="secondary" className="rounded font-mono shrink-0" style={{ fontSize: 9, padding: '1px 5px', backgroundColor: isLatest ? 'var(--brand-tint)' : undefined, color: isLatest ? 'var(--brand-color-dark)' : undefined }}>
                                      V{vNum}
                                    </Badge>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {isLatest ? q.title.slice(0, 55) : `Revision ${vNum}`}
                                      </div>
                                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>
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
                      )}

                      {/* Favorited star */}
                      {!hiddenCols.has('favorited') && (
                        <TableCell className={`${TD} w-8`}>
                          <FavoritedCell questionId={q.id} />
                        </TableCell>
                      )}

                      {/* Actions ⋯ — DS DropdownMenu */}
                      <TableCell className={`${TD} w-10 text-right`}>
                        <DropdownMenu open={openMenuQuestionId === q.id} onOpenChange={open => setOpenMenuQuestionId(open ? q.id : null)}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${q.title}`} onClick={e => e.stopPropagation()}>
                              <i className={`fa-${openMenuQuestionId === q.id ? 'solid' : 'regular'} fa-ellipsis`} aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {(isAdmin || isOwner) && (
                              <DropdownMenuItem onClick={() => {}}>
                                <i className="fa-light fa-pen" aria-hidden="true" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {}}>
                              <i className="fa-light fa-copy" aria-hidden="true" />
                              Duplicate
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => {}}>
                                <i className="fa-light fa-folder-plus" aria-hidden="true" />
                                Move to Folder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {!isAdmin && !isOwner && (
                              <DropdownMenuItem onClick={() => { setReqAccessQuestion({ id: q.id, title: q.title }); setOpenMenuQuestionId(null) }}>
                                <i className="fa-light fa-lock-keyhole-open" aria-hidden="true" />
                                Request Edit Access
                              </DropdownMenuItem>
                            )}
                            {(isAdmin || isOwner) && (
                              <DropdownMenuItem variant="destructive" onClick={() => {}}>
                                <i className="fa-light fa-trash-can" aria-hidden="true" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
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

      {/* ── Request Edit Access Modal ── */}
      {reqAccessQuestion && (
        <RequestEditAccessModal
          questionTitle={reqAccessQuestion.title}
          open={!!reqAccessQuestion}
          onOpenChange={open => !open && setReqAccessQuestion(null)}
        />
      )}
    </div>
  )
}
