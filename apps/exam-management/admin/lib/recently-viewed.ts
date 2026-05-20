'use client'

/**
 * Recently-viewed entity store — per entity type, per browser session.
 *
 * Each entity detail page records a view on mount. The SearchInput reads
 * the store for the matching entity type and shows items in the dropdown
 * above recent search queries.
 *
 * Storage: localStorage, keyed by entity type. Max 6 items per type.
 *
 * Usage (in a detail page):
 *   useEffect(() => {
 *     recordView('students', { id, name, subtitle, href, icon: 'fa-graduation-cap' })
 *   }, [])
 */

export interface RecentlyViewedItem {
  id: string
  name: string
  subtitle: string  // short secondary line — e.g. "STU-2024-1013 · PT Class of 2027"
  href: string
  icon: string      // FA icon name — e.g. "fa-graduation-cap"
  viewedAt: number  // timestamp for ordering
}

const MAX_PER_TYPE = 6
const PREFIX = 'exam-recently-viewed-'

export function recordView(
  entityType: string,
  item: Omit<RecentlyViewedItem, 'viewedAt'>,
): void {
  try {
    const prev = loadRecentlyViewed(entityType).filter(i => i.id !== item.id)
    const updated = [{ ...item, viewedAt: Date.now() }, ...prev].slice(0, MAX_PER_TYPE)
    localStorage.setItem(PREFIX + entityType, JSON.stringify(updated))
  } catch { /* SSR guard */ }
}

export function loadRecentlyViewed(entityType: string): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(PREFIX + entityType)
    return raw ? (JSON.parse(raw) as RecentlyViewedItem[]) : []
  } catch {
    return []
  }
}

export function clearRecentlyViewed(entityType: string): void {
  try { localStorage.removeItem(PREFIX + entityType) } catch {}
}
