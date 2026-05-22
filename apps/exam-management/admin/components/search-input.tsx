'use client'

/**
 * SmartSearchInput — entity search box with recent-search + recently-viewed dropdown.
 *
 * Drop-in replacement for the InputGroup+InputGroupInput pattern used in
 * every entity list page. Adds:
 *   - Recently viewed entities shown when focused (recorded by entity detail pages)
 *   - Recent search terms shown below recently viewed
 *   - Both sections filtered as you type
 *   - × per item to remove; "Clear all" for search terms
 *   - Saves search term on blur / Enter (≥ 2 chars)
 *   - Escape clears query; second Escape closes dropdown
 *
 * Usage:
 *   <SearchInput
 *     entityKey="students"
 *     value={query}
 *     onChange={setQuery}
 *     placeholder="Search by name, ID, cohort…"
 *   />
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  InputGroup, InputGroupAddon, InputGroupInput, Button,
} from '@exxat/ds/packages/ui/src'
import {
  loadRecentlyViewed, clearRecentlyViewed,
  type RecentlyViewedItem,
} from '@/lib/recently-viewed'

const MAX_RECENT = 8
const MIN_SAVE_LENGTH = 2

function storageKey(entity: string) {
  return `exam-search-recent-${entity}`
}

function loadRecent(entity: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(entity))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function persistRecent(entity: string, query: string) {
  if (query.trim().length < MIN_SAVE_LENGTH) return
  try {
    const prev = loadRecent(entity).filter((q) => q !== query.trim())
    localStorage.setItem(
      storageKey(entity),
      JSON.stringify([query.trim(), ...prev].slice(0, MAX_RECENT)),
    )
  } catch {}
}

function deleteRecent(entity: string, query: string) {
  try {
    const updated = loadRecent(entity).filter((q) => q !== query)
    localStorage.setItem(storageKey(entity), JSON.stringify(updated))
  } catch {}
}

function clearAllRecent(entity: string) {
  try { localStorage.removeItem(storageKey(entity)) } catch {}
}

// ── Component ────────────────────────────────────────────────────────────────

export interface SearchInputProps {
  /** Used as the localStorage namespace key — must be stable per entity */
  entityKey: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  'aria-label'?: string
  className?: string
  /** Width class on the outer InputGroup — default 'w-full max-w-sm' */
  width?: string
}

export function SearchInput({
  entityKey,
  value,
  onChange,
  placeholder = 'Search…',
  'aria-label': ariaLabel,
  className,
  width = 'w-full max-w-sm',
}: SearchInputProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => {
    setRecent(loadRecent(entityKey))
    setRecentlyViewed(loadRecentlyViewed(entityKey))
  }, [entityKey])

  useEffect(() => { if (open) reload() }, [open, reload])

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  function handleFocus() { reload(); setOpen(true) }

  function handleBlur() {
    if (value.trim().length >= MIN_SAVE_LENGTH) {
      persistRecent(entityKey, value.trim())
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (value) { onChange('') } else { setOpen(false); inputRef.current?.blur() }
      e.stopPropagation()
    }
    if (e.key === 'Enter' && value.trim().length >= MIN_SAVE_LENGTH) {
      persistRecent(entityKey, value.trim()); reload()
    }
  }

  function handleRecentClick(term: string) {
    onChange(term); setOpen(false); inputRef.current?.focus()
  }

  function handleViewedClick(item: RecentlyViewedItem) {
    setOpen(false); router.push(item.href)
  }

  function handleRemoveRecent(e: React.MouseEvent, term: string) {
    e.stopPropagation(); deleteRecent(entityKey, term); reload()
  }

  function handleClearSearches(e: React.MouseEvent) {
    e.preventDefault(); clearAllRecent(entityKey); setRecent([])
  }

  function handleClearViewed(e: React.MouseEvent) {
    e.preventDefault(); clearRecentlyViewed(entityKey); setRecentlyViewed([])
  }

  const q = value.trim().toLowerCase()

  const visibleViewed = q
    ? recentlyViewed.filter(i =>
        i.name.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q)
      )
    : recentlyViewed

  const visibleRecent = q
    ? recent.filter(r => r.toLowerCase().includes(q) && r !== value.trim())
    : recent

  const showDropdown = open && (visibleViewed.length > 0 || visibleRecent.length > 0)

  return (
    <div ref={containerRef} className={`relative ${width} ${className ?? ''}`}>
      <InputGroup className="w-full">
        <InputGroupAddon align="inline-start">
          <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          type="search"
          role="combobox"
          placeholder={placeholder}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={showDropdown ? `search-suggestions-${entityKey}` : undefined}
          aria-activedescendant={undefined}
          autoComplete="off"
        />
      </InputGroup>

      {showDropdown && (
        <div
          id={`search-suggestions-${entityKey}`}
          role="listbox"
          aria-label="Search history"
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* ── Recently Viewed ─────────────────────────────────────────── */}
          {visibleViewed.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recently Viewed
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearViewed}
                  className="h-auto py-0 px-1 text-[10px] text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
              <ul>
                {visibleViewed.map((item) => (
                  <li key={item.id}>
                    <div
                      role="option"
                      aria-selected={false}
                      onClick={() => handleViewedClick(item)}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: 'var(--muted)' }}
                        aria-hidden="true"
                      >
                        <i
                          className={`fa-light ${item.icon} text-muted-foreground`}
                          style={{ fontSize: 12 }}
                        />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      <i
                        className="fa-light fa-arrow-up-right-from-square text-muted-foreground shrink-0"
                        aria-hidden="true"
                        style={{ fontSize: 10 }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ── Recent Searches ──────────────────────────────────────────── */}
          {visibleRecent.length > 0 && (
            <>
              <div className={`flex items-center justify-between px-3 pb-1 ${visibleViewed.length > 0 ? 'pt-2 border-t border-border' : 'pt-2.5'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Searches
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearches}
                  className="h-auto py-0 px-1 text-[10px] text-muted-foreground"
                >
                  Clear all
                </Button>
              </div>
              <ul className="pb-1">
                {visibleRecent.map((term) => (
                  <li key={term}>
                    <div
                      role="option"
                      aria-selected={false}
                      onClick={() => handleRecentClick(term)}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/60 transition-colors cursor-pointer group"
                    >
                      <i
                        className="fa-light fa-clock-rotate-left text-muted-foreground shrink-0"
                        aria-hidden="true"
                        style={{ fontSize: 12, width: 14 }}
                      />
                      <span className="flex-1 text-sm text-foreground truncate">{term}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleRemoveRecent(e, term)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove "${term}" from recent searches`}
                      >
                        <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
