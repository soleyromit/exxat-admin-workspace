/**
 * Structured Basic-mode Library search recents (keyword + type + difficulty).
 * Separate from Leo string recents so a facet search is not flattened into a keyword.
 */

import type { LibraryItemType, LibraryLevel } from "@/lib/mock/library"

const STORAGE_KEY = "exxat-ds.library.basic-search.recents.v1"
const EVENT_NAME = "exxat-library-basic-search-recents"
const MAX_RECENTS = 12

export type LibraryBasicSearchSnapshot = {
  keyword: string
  type: LibraryItemType | ""
  difficulty: LibraryLevel | ""
}

const TYPE_LABELS: Record<LibraryItemType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / false",
  short_answer: "Short answer",
}

const DIFFICULTY_LABELS: Record<LibraryLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
}

function isItemType(value: unknown): value is LibraryItemType | "" {
  return (
    value === "" ||
    value === "multiple_choice" ||
    value === "true_false" ||
    value === "short_answer"
  )
}

function isLevel(value: unknown): value is LibraryLevel | "" {
  return value === "" || value === "easy" || value === "medium" || value === "hard"
}

function isSnapshot(value: unknown): value is LibraryBasicSearchSnapshot {
  if (!value || typeof value !== "object") return false
  const row = value as Record<string, unknown>
  return (
    typeof row.keyword === "string" &&
    isItemType(row.type) &&
    isLevel(row.difficulty)
  )
}

export function normalizeLibraryBasicSearchSnapshot(
  next: LibraryBasicSearchSnapshot,
): LibraryBasicSearchSnapshot | null {
  const keyword = next.keyword.trim()
  const type = next.type
  const difficulty = next.difficulty
  if (!keyword && !type && !difficulty) return null
  return { keyword, type, difficulty }
}

export function formatLibraryBasicSearchLabel(
  snapshot: LibraryBasicSearchSnapshot,
): string {
  const parts: string[] = []
  if (snapshot.keyword.trim()) parts.push(snapshot.keyword.trim())
  if (snapshot.type) parts.push(TYPE_LABELS[snapshot.type])
  if (snapshot.difficulty) parts.push(DIFFICULTY_LABELS[snapshot.difficulty])
  return parts.join(", ")
}

function snapshotKey(snapshot: LibraryBasicSearchSnapshot): string {
  return [
    snapshot.keyword.trim().toLowerCase(),
    snapshot.type,
    snapshot.difficulty,
  ].join("\0")
}

function parseStored(raw: string | null): LibraryBasicSearchSnapshot[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(isSnapshot)
      .map((row) => ({
        keyword: row.keyword.trim(),
        type: row.type,
        difficulty: row.difficulty,
      }))
      .filter((row) => Boolean(normalizeLibraryBasicSearchSnapshot(row)))
      .slice(0, MAX_RECENTS)
  } catch {
    return []
  }
}

export interface LibraryBasicSearchRecentsController {
  readonly eventName: string
  read: () => LibraryBasicSearchSnapshot[]
  record: (next: LibraryBasicSearchSnapshot) => void
  clear: () => void
}

export function createLibraryBasicSearchRecentsController(options?: {
  storageKey?: string
  eventName?: string
}): LibraryBasicSearchRecentsController {
  const storageKey = options?.storageKey ?? STORAGE_KEY
  const eventName = options?.eventName ?? EVENT_NAME

  const read = (): LibraryBasicSearchSnapshot[] => {
    if (typeof window === "undefined") return []
    return parseStored(window.localStorage.getItem(storageKey))
  }

  const record = (next: LibraryBasicSearchSnapshot): void => {
    const snapshot = normalizeLibraryBasicSearchSnapshot(next)
    if (!snapshot || typeof window === "undefined") return
    const key = snapshotKey(snapshot)
    const prev = read()
    const deduped = [
      snapshot,
      ...prev.filter((row) => snapshotKey(row) !== key),
    ].slice(0, MAX_RECENTS)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(deduped))
    } catch {
      /* ignore quota / private mode */
    }
    window.dispatchEvent(new CustomEvent(eventName))
  }

  const clear = (): void => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(eventName))
  }

  return { eventName, read, record, clear }
}

export const libraryBasicSearchRecents =
  createLibraryBasicSearchRecentsController()

export function recordLibraryBasicSearch(
  next: LibraryBasicSearchSnapshot,
): void {
  libraryBasicSearchRecents.record(next)
}
