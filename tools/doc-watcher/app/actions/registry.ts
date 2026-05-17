'use server'

import { readRegistry, writeRegistry } from '@/lib/github-storage'
import { extractSharePointUrls, isAlreadyWatched } from '@/lib/parse-sharepoint-url'
import type { RegistryEntry } from '@/lib/types'

export async function getRegistry() {
  const { data } = await readRegistry()
  return data.entries.filter(e => e.active)
}

export interface CheckResult {
  url: string
  status: 'watching' | 'new'
  entry?: RegistryEntry
}

export async function checkLinks(rawText: string): Promise<CheckResult[]> {
  const urls = extractSharePointUrls(rawText)
  const { data: registry } = await readRegistry()
  const active = registry.entries.filter(e => e.active)
  return urls.map(url => {
    const existing = isAlreadyWatched(url, active)
    if (existing) return { url, status: 'watching' as const, entry: existing }
    return { url, status: 'new' as const }
  })
}

export async function addEntry(url: string, product: string, label: string): Promise<void> {
  const { data: registry, sha } = await readRegistry()
  const id = `${product}-${Date.now()}`
  const newEntry: RegistryEntry = {
    id, product, label, type: 'direct', sourceUrl: url,
    snapshot: `docs/watch/snapshots/${id}.txt`,
    flags: `docs/watch/flags/${product}.md`,
    lastSynced: null, active: true,
  }
  registry.entries.push(newEntry)
  await writeRegistry(registry, sha, `chore(watch): register ${label}`)
}

export async function removeEntry(id: string): Promise<void> {
  const { data: registry, sha } = await readRegistry()
  const entry = registry.entries.find(e => e.id === id)
  if (!entry) throw new Error(`Entry ${id} not found`)
  entry.active = false
  await writeRegistry(registry, sha, `chore(watch): deactivate ${entry.label}`)
}
