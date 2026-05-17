import type { RegistryEntry } from './types'

const SHAREPOINT_PATTERN = /https:\/\/exxatsystems(?:-my)?\.sharepoint\.com\/[^\s"'<>)]+/g

export function extractSharePointUrls(text: string): string[] {
  const matches = text.match(SHAREPOINT_PATTERN) ?? []
  return [...new Set(matches)]
}

export function isAlreadyWatched(url: string, entries: RegistryEntry[]): RegistryEntry | null {
  return entries.filter(e => e.active).find(e => e.sourceUrl === url) ?? null
}
