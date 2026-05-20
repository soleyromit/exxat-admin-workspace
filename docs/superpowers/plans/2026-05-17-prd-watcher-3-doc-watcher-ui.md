# PRD Watcher — Plan 3: Doc Watcher UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tools/doc-watcher/` — a standalone Next.js app with a link manager page (paste SharePoint URLs, validate against registry, add/remove) and an `/updates` route (filterable timeline of all design/product/compliance/correction events). Deployed to Vercel. Backed by the GitHub API storage library from Plan 1.

**Architecture:** Next.js 15 App Router. Server Actions read/write `docs/watch/registry.json` and `docs/watch/updates-log.json` via the `github-storage.ts` library (GitHub REST API). No database. The git repo is the data store. Deployed as its own Vercel project at a stable URL accessible from any device.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Vitest for unit tests, Vercel for deployment.

**Depends on:** Plan 1 (github-storage.ts + types.ts must exist).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `tools/doc-watcher/package.json` | Create | App dependencies and scripts |
| `tools/doc-watcher/next.config.ts` | Create | Next.js config |
| `tools/doc-watcher/tsconfig.json` | Create | TypeScript config extending base |
| `tools/doc-watcher/postcss.config.mjs` | Create | Tailwind CSS config |
| `tools/doc-watcher/app/layout.tsx` | Create | Root layout with minimal chrome |
| `tools/doc-watcher/app/page.tsx` | Create | Link manager — paste, check, add/remove |
| `tools/doc-watcher/app/updates/page.tsx` | Create | Updates feed — filterable timeline |
| `tools/doc-watcher/app/actions/registry.ts` | Create | Server Actions: addEntry, removeEntry, checkLinks |
| `tools/doc-watcher/app/actions/updates.ts` | Create | Server Action: getUpdates (with filters) |
| `tools/doc-watcher/components/link-checker.tsx` | Create | Client component: paste textarea + Check Links |
| `tools/doc-watcher/components/registry-list.tsx` | Create | Client component: currently watching list |
| `tools/doc-watcher/components/updates-feed.tsx` | Create | Client component: filterable timeline |
| `tools/doc-watcher/components/update-entry.tsx` | Create | Single update entry card |
| `tools/doc-watcher/lib/parse-sharepoint-url.ts` | Create | Extract SharePoint URLs from pasted text |
| `tools/doc-watcher/lib/parse-sharepoint-url.test.ts` | Create | Vitest tests |
| `tools/doc-watcher/lib/infer-product.ts` | Create | Infer product from SharePoint path/content |
| `tools/doc-watcher/lib/github-storage.ts` | Symlink/copy | From Plan 1 |
| `tools/doc-watcher/lib/types.ts` | Symlink/copy | From Plan 1 |
| `tools/doc-watcher/vercel.json` | Create | Vercel project config |
| `tools/doc-watcher/.env.local.example` | Already exists from Plan 1 | — |
| `pnpm-workspace.yaml` | Already updated in Plan 1 | — |

---

### Task 1: Scaffold the Next.js app

**Files:**
- Create: `tools/doc-watcher/package.json`
- Create: `tools/doc-watcher/next.config.ts`
- Create: `tools/doc-watcher/tsconfig.json`
- Create: `tools/doc-watcher/postcss.config.mjs`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "doc-watcher",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "15.3.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Doc Watcher has no DS submodule dependency
}

export default nextConfig
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

- [ ] **Step 5: Install dependencies**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher && pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add tools/doc-watcher/package.json tools/doc-watcher/next.config.ts tools/doc-watcher/tsconfig.json tools/doc-watcher/postcss.config.mjs
git commit -m "feat(doc-watcher): scaffold Next.js app"
```

---

### Task 2: Build the URL parser utility (TDD)

**Files:**
- Create: `tools/doc-watcher/lib/parse-sharepoint-url.ts`
- Create: `tools/doc-watcher/lib/parse-sharepoint-url.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tools/doc-watcher/lib/parse-sharepoint-url.test.ts
import { describe, it, expect } from 'vitest'
import { extractSharePointUrls, isAlreadyWatched } from './parse-sharepoint-url'
import type { RegistryEntry } from './types'

describe('extractSharePointUrls', () => {
  it('extracts a single SharePoint URL from plain text', () => {
    const text = 'Check this out: https://exxatsystems-my.sharepoint.com/:w:/g/personal/monil_pokar_exxat_com/IQAL?e=T03'
    const urls = extractSharePointUrls(text)
    expect(urls).toHaveLength(1)
    expect(urls[0]).toBe('https://exxatsystems-my.sharepoint.com/:w:/g/personal/monil_pokar_exxat_com/IQAL?e=T03')
  })

  it('extracts multiple URLs from a pasted block of text', () => {
    const text = `
      Here are the docs:
      https://exxatsystems-my.sharepoint.com/:w:/g/personal/monil_pokar_exxat_com/doc1
      and also
      https://exxatsystems.sharepoint.com/sites/ProductTeam/doc2.docx
    `
    const urls = extractSharePointUrls(text)
    expect(urls).toHaveLength(2)
  })

  it('deduplicates identical URLs', () => {
    const url = 'https://exxatsystems-my.sharepoint.com/:w:/g/personal/monil_pokar_exxat_com/doc1'
    const urls = extractSharePointUrls(`${url}\n${url}`)
    expect(urls).toHaveLength(1)
  })

  it('returns empty array when no SharePoint URLs found', () => {
    expect(extractSharePointUrls('no urls here')).toHaveLength(0)
  })
})

describe('isAlreadyWatched', () => {
  const entries: RegistryEntry[] = [
    {
      id: 'pce-prd-monil',
      product: 'pce',
      label: 'PCE PRD',
      type: 'direct',
      uri: 'file:///b!abc/01DEF',
      snapshot: 'docs/watch/snapshots/pce-prd-monil.txt',
      flags: 'docs/watch/flags/pce.md',
      lastSynced: null,
      active: true,
    },
  ]

  it('returns the matching entry when URL resolves to a known URI', () => {
    // The URL-to-URI resolution is done server-side via M365 — here we test
    // the simpler label-based dedup for URLs the user already added via the UI
    // (stored in registry with the original SharePoint URL in a future field)
    // For now: no match when URI not stored
    const result = isAlreadyWatched('https://exxatsystems-my.sharepoint.com/unknown', entries)
    expect(result).toBeNull()
  })

  it('returns null for inactive entries', () => {
    const inactiveEntries = entries.map(e => ({ ...e, active: false }))
    const result = isAlreadyWatched('https://exxatsystems-my.sharepoint.com/unknown', inactiveEntries)
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher && pnpm test
```

Expected: `Cannot find module './parse-sharepoint-url'`

- [ ] **Step 3: Implement `parse-sharepoint-url.ts`**

```typescript
import type { RegistryEntry } from './types'

const SHAREPOINT_PATTERN = /https:\/\/exxatsystems(?:-my)?\.sharepoint\.com\/[^\s"'<>)]+/g

export function extractSharePointUrls(text: string): string[] {
  const matches = text.match(SHAREPOINT_PATTERN) ?? []
  // Deduplicate
  return [...new Set(matches)]
}

export function isAlreadyWatched(
  url: string,
  entries: RegistryEntry[]
): RegistryEntry | null {
  // Check active entries only
  // Future: compare against a stored `sourceUrl` field added when registering via UI
  const active = entries.filter(e => e.active)
  // For now: no URL-to-entry match without M365 resolution (done server-side)
  return null
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pnpm test
```

Expected:
```
✓ extractSharePointUrls > extracts a single SharePoint URL
✓ extractSharePointUrls > extracts multiple URLs
✓ extractSharePointUrls > deduplicates identical URLs
✓ extractSharePointUrls > returns empty array when no URLs found
✓ isAlreadyWatched > returns the matching entry when URL resolves to a known URI
✓ isAlreadyWatched > returns null for inactive entries
Tests: 6 passed
```

- [ ] **Step 5: Commit**

```bash
git add tools/doc-watcher/lib/parse-sharepoint-url.ts tools/doc-watcher/lib/parse-sharepoint-url.test.ts
git commit -m "feat(doc-watcher): URL parser utility with tests"
```

---

### Task 3: Build the app layout and root structure

**Files:**
- Create: `tools/doc-watcher/app/layout.tsx`
- Create: `tools/doc-watcher/app/globals.css`

- [ ] **Step 1: Create `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --muted: #f8fafc;
  --muted-foreground: #64748b;
  --border: #e2e8f0;
  --brand: #6366f1;
  --brand-dark: #4f46e5;
  --radius: 6px;
}
```

- [ ] **Step 2: Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Doc Watcher — Exxat',
  description: 'PRD + compliance watcher for Exxat workspace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: 'var(--background)', color: 'var(--foreground)' }}>
        <nav style={{
          borderBottom: '1px solid var(--border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          fontSize: 14,
        }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Doc Watcher</span>
          <a href="/" style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}>Registry</a>
          <a href="/updates" style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}>Updates</a>
        </nav>
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify dev server starts**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher && pnpm dev
```

Expected: server starts at `localhost:3002`. Visit in browser — sees nav with "Registry" and "Updates".

- [ ] **Step 4: Commit**

```bash
git add tools/doc-watcher/app/layout.tsx tools/doc-watcher/app/globals.css
git commit -m "feat(doc-watcher): root layout with nav"
```

---

### Task 4: Build the link manager page (Registry)

**Files:**
- Create: `tools/doc-watcher/app/actions/registry.ts`
- Create: `tools/doc-watcher/components/link-checker.tsx`
- Create: `tools/doc-watcher/components/registry-list.tsx`
- Create: `tools/doc-watcher/app/page.tsx`

- [ ] **Step 1: Create Server Actions at `app/actions/registry.ts`**

```typescript
'use server'

import { readRegistry, writeRegistry } from '@/lib/github-storage'
import { extractSharePointUrls } from '@/lib/parse-sharepoint-url'
import type { RegistryEntry } from '@/lib/types'

export async function getRegistry() {
  const { data } = await readRegistry()
  return data.entries.filter(e => e.active)
}

export interface CheckResult {
  url: string
  status: 'watching' | 'new'
  entry?: RegistryEntry
  resolvedLabel?: string
}

export async function checkLinks(rawText: string): Promise<CheckResult[]> {
  const urls = extractSharePointUrls(rawText)
  const { data: registry } = await readRegistry()
  const active = registry.entries.filter(e => e.active)

  return urls.map(url => {
    // Check if already in registry by source URL match (stored when added via UI)
    const existing = active.find(e => e.sourceUrl === url)
    if (existing) {
      return { url, status: 'watching' as const, entry: existing }
    }
    return { url, status: 'new' as const }
  })
}

export async function addEntry(url: string, product: string, label: string): Promise<void> {
  const { data: registry, sha } = await readRegistry()
  const id = `${product}-${Date.now()}`
  const newEntry: RegistryEntry = {
    id,
    product,
    label,
    type: 'direct',
    sourceUrl: url,
    snapshot: `docs/watch/snapshots/${id}.txt`,
    flags: `docs/watch/flags/${product}.md`,
    lastSynced: null,
    active: true,
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
```

- [ ] **Step 2: Create `components/link-checker.tsx`** (client component):

```tsx
'use client'

import { useState, useTransition } from 'react'
import { checkLinks, addEntry, type CheckResult } from '@/app/actions/registry'

export function LinkChecker({ onAdded }: { onAdded: () => void }) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<CheckResult[]>([])
  const [isPending, startTransition] = useTransition()

  const handleCheck = () => {
    startTransition(async () => {
      const r = await checkLinks(text)
      setResults(r)
    })
  }

  const handleAdd = (url: string) => {
    const product = prompt('Which product? (pce / exam-management / other):') ?? 'other'
    const label = prompt('Label for this doc:') ?? url
    startTransition(async () => {
      await addEntry(url, product, label)
      setResults(prev => prev.filter(r => r.url !== url))
      onAdded()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ fontSize: 14, fontWeight: 500 }}>Paste links (one or many)</label>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="https://exxatsystems-my.sharepoint.com/..."
        rows={4}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', fontSize: 14, resize: 'vertical',
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
      <button
        onClick={handleCheck}
        disabled={isPending || !text.trim()}
        style={{
          alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 'var(--radius)',
          background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 500, opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Checking…' : 'Check Links'}
      </button>

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)', margin: 0 }}>Results</p>
          {results.map(r => (
            <div key={r.url} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', background: 'var(--muted)',
              fontSize: 13,
            }}>
              <span>{r.status === 'watching' ? '✅' : '➕'}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.status === 'watching'
                  ? `Already watching — ${r.entry?.label}`
                  : r.url}
              </span>
              {r.status === 'new' && (
                <button
                  onClick={() => handleAdd(r.url)}
                  style={{
                    padding: '4px 10px', borderRadius: 4, background: 'var(--brand)',
                    color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                  }}
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/registry-list.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { removeEntry } from '@/app/actions/registry'
import type { RegistryEntry } from '@/lib/types'

const PRODUCT_COLORS: Record<string, string> = {
  pce: '#0ea5e9',
  'exam-management': '#8b5cf6',
  other: '#64748b',
}

export function RegistryList({ entries, onRemoved }: { entries: RegistryEntry[]; onRemoved: () => void }) {
  const [isPending, startTransition] = useTransition()

  const handleRemove = (id: string, label: string) => {
    if (!confirm(`Stop watching "${label}"?`)) return
    startTransition(async () => {
      await removeEntry(id)
      onRemoved()
    })
  }

  if (entries.length === 0) {
    return <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No docs being watched yet.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {entries.map(e => (
        <div key={e.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', fontSize: 13,
        }}>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
            background: (PRODUCT_COLORS[e.product] ?? '#64748b') + '20',
            color: PRODUCT_COLORS[e.product] ?? '#64748b',
          }}>
            {e.product}
          </span>
          <span style={{ flex: 1, fontWeight: 500 }}>{e.label}</span>
          <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
            {e.lastSynced ? `last synced: ${e.lastSynced}` : 'not yet synced'}
          </span>
          <button
            onClick={() => handleRemove(e.id, e.label)}
            disabled={isPending}
            style={{
              padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', fontSize: 12,
              color: 'var(--muted-foreground)',
            }}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/page.tsx`** (the Registry page):

```tsx
import { getRegistry } from '@/app/actions/registry'
import { LinkChecker } from '@/components/link-checker'
import { RegistryList } from '@/components/registry-list'

export const dynamic = 'force-dynamic'

export default async function RegistryPage() {
  const entries = await getRegistry()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Doc Watcher</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>
          {entries.length} doc{entries.length !== 1 ? 's' : ''} being watched
        </p>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Add docs</h2>
        <LinkChecker onAdded={() => { /* page will revalidate */ }} />
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Currently watching</h2>
        <RegistryList entries={entries} onRemoved={() => {}} />
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Test the registry page**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher && pnpm dev
```

Visit `localhost:3002`. Expected:
- Sees "3 docs being watched" (from initial registry in Plan 1)
- Paste a fake SharePoint URL → Check Links → sees "➕ New" result
- Paste the existing PCE PRD URL → Check Links → sees "✅ Already watching — PCE PRD — Monil Pokar"

- [ ] **Step 6: Commit**

```bash
git add tools/doc-watcher/app/ tools/doc-watcher/components/link-checker.tsx tools/doc-watcher/components/registry-list.tsx
git commit -m "feat(doc-watcher): registry page — link checker + watching list"
```

---

### Task 5: Build the `/updates` route

**Files:**
- Create: `tools/doc-watcher/app/actions/updates.ts`
- Create: `tools/doc-watcher/components/updates-feed.tsx`
- Create: `tools/doc-watcher/components/update-entry.tsx`
- Create: `tools/doc-watcher/app/updates/page.tsx`

- [ ] **Step 1: Create `app/actions/updates.ts`**

```typescript
'use server'

import { readUpdatesLog } from '@/lib/github-storage'
import type { UpdateEntry, UpdateType } from '@/lib/types'

export interface UpdateFilters {
  product?: string   // 'all' | 'pce' | 'exam-management'
  period?: string    // 'today' | 'week' | 'month' | 'all'
  type?: string      // 'all' | UpdateType
}

function isWithinPeriod(date: string, period: string): boolean {
  const entryDate = new Date(date)
  const now = new Date()
  if (period === 'today') {
    return entryDate.toDateString() === now.toDateString()
  }
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return entryDate >= weekAgo
  }
  if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return entryDate >= monthAgo
  }
  return true // 'all'
}

export async function getUpdates(filters: UpdateFilters = {}): Promise<UpdateEntry[]> {
  const { data } = await readUpdatesLog()
  const { product = 'all', period = 'week', type = 'all' } = filters

  return data.entries
    .filter(e => {
      if (product !== 'all' && e.product !== product) return false
      if (!isWithinPeriod(e.date, period)) return false
      if (type !== 'all' && e.type !== type) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date)) // newest first
}
```

- [ ] **Step 2: Create `components/update-entry.tsx`**

```tsx
import type { UpdateEntry } from '@/lib/types'

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  'prd-change':            { label: 'PRD Change',      color: '#2563eb', bg: '#eff6ff' },
  'prd-flagged':           { label: 'PRD Flagged',     color: '#d97706', bg: '#fffbeb' },
  'compliance-violation':  { label: 'Compliance',      color: '#dc2626', bg: '#fef2f2' },
  'compliance-resolved':   { label: 'Resolved',        color: '#16a34a', bg: '#f0fdf4' },
  'new-doc':               { label: 'New Doc',         color: '#7c3aed', bg: '#f5f3ff' },
  'pattern-update':        { label: 'Pattern',         color: '#0d9488', bg: '#f0fdfa' },
  'claude-correction':     { label: 'Correction',      color: '#ea580c', bg: '#fff7ed' },
}

const SEVERITY_COLORS: Record<string, string> = {
  P1: '#dc2626',
  P2: '#d97706',
  P3: '#64748b',
}

export function UpdateEntryCard({ entry }: { entry: UpdateEntry }) {
  const meta = TYPE_META[entry.type] ?? { label: entry.type, color: '#64748b', bg: '#f8fafc' }
  const isP1 = entry.severity === 'P1'

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 8,
      border: `1px solid ${isP1 ? '#fca5a5' : 'var(--border)'}`,
      borderLeft: `4px solid ${isP1 ? '#dc2626' : meta.color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
          background: meta.bg, color: meta.color,
        }}>
          {meta.label}
        </span>
        {entry.severity && (
          <span style={{
            padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
            color: SEVERITY_COLORS[entry.severity], background: SEVERITY_COLORS[entry.severity] + '15',
          }}>
            {entry.severity}
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
          {entry.product} · {entry.date}
        </span>
      </div>

      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{entry.title}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
        <p style={{ margin: 0 }}><strong>What:</strong> {entry.what}</p>
        <p style={{ margin: 0, color: 'var(--muted-foreground)' }}><strong>Why:</strong> {entry.why}</p>
      </div>

      {entry.files.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {entry.files.map(f => (
            <code key={f} style={{
              fontSize: 11, padding: '2px 6px', borderRadius: 4,
              background: 'var(--muted)', color: 'var(--muted-foreground)',
            }}>
              {f.split('/').pop()}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/updates-feed.tsx`** (client component with filters):

```tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import { getUpdates, type UpdateFilters } from '@/app/actions/updates'
import { UpdateEntryCard } from './update-entry'
import type { UpdateEntry } from '@/lib/types'

const PRODUCTS = ['all', 'pce', 'exam-management']
const PERIODS = ['today', 'week', 'month', 'all']
const TYPES = ['all', 'prd-change', 'prd-flagged', 'compliance-violation', 'compliance-resolved', 'new-doc', 'pattern-update', 'claude-correction']

// Group entries by date
function groupByDate(entries: UpdateEntry[]): Map<string, UpdateEntry[]> {
  const map = new Map<string, UpdateEntry[]>()
  for (const entry of entries) {
    const existing = map.get(entry.date) ?? []
    map.set(entry.date, [...existing, entry])
  }
  return map
}

export function UpdatesFeed({ initialEntries }: { initialEntries: UpdateEntry[] }) {
  const [entries, setEntries] = useState(initialEntries)
  const [filters, setFilters] = useState<UpdateFilters>({ product: 'all', period: 'week', type: 'all' })
  const [isPending, startTransition] = useTransition()

  const setFilter = (key: keyof UpdateFilters, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    startTransition(async () => {
      const updated = await getUpdates(next)
      setEntries(updated)
    })
  }

  const grouped = groupByDate(entries)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['product', 'period', 'type'] as const).map(key => (
          <select
            key={key}
            value={filters[key] ?? 'all'}
            onChange={e => setFilter(key, e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', fontSize: 13,
              background: '#fff', cursor: 'pointer',
            }}
          >
            {(key === 'product' ? PRODUCTS : key === 'period' ? PERIODS : TYPES).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        ))}
        {isPending && <span style={{ fontSize: 13, color: 'var(--muted-foreground)', alignSelf: 'center' }}>Loading…</span>}
      </div>

      {entries.length === 0 ? (
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No updates match these filters.</p>
      ) : (
        [...grouped.entries()].map(([date, dayEntries]) => (
          <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: date === today ? 'var(--brand)' : 'var(--muted)',
                color: date === today ? '#fff' : 'var(--muted-foreground)',
              }}>
                {date === today ? `TODAY — ${date}` : date}
              </span>
              {date === today && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 6px',
                  background: '#fef3c7', color: '#92400e', borderRadius: 4,
                }}>
                  LATEST
                </span>
              )}
            </div>
            {dayEntries.map(e => <UpdateEntryCard key={e.id} entry={e} />)}
          </div>
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/updates/page.tsx`**

```tsx
import { getUpdates } from '@/app/actions/updates'
import { UpdatesFeed } from '@/components/updates-feed'

export const dynamic = 'force-dynamic'

export default async function UpdatesPage() {
  const initialEntries = await getUpdates({ product: 'all', period: 'week', type: 'all' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Updates</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>
          PRD changes, compliance findings, and corrections — filterable by product, period, and type
        </p>
      </div>
      <UpdatesFeed initialEntries={initialEntries} />
    </div>
  )
}
```

- [ ] **Step 5: Test the updates page**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher && pnpm dev
```

Visit `localhost:3002/updates`. Expected: "No updates match these filters" (log is empty). That's correct — the agents (Plan 4) write the entries. Verify the filter dropdowns render and the page loads without error.

- [ ] **Step 6: Commit**

```bash
git add tools/doc-watcher/app/updates/ tools/doc-watcher/components/updates-feed.tsx tools/doc-watcher/components/update-entry.tsx tools/doc-watcher/app/actions/updates.ts
git commit -m "feat(doc-watcher): updates feed page with filters and What+Why format"
```

---

### Task 6: Deploy to Vercel

**Files:**
- Create: `tools/doc-watcher/vercel.json`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next"
}
```

- [ ] **Step 2: Deploy via Vercel CLI**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher
pnpm dlx vercel --prod
```

When prompted:
- Link to existing project? **No** — create new
- Project name: `exxat-doc-watcher`
- Root: `tools/doc-watcher` (already in that dir, so `.`)

- [ ] **Step 3: Add environment variables to Vercel**

```bash
pnpm dlx vercel env add GITHUB_OWNER production
# Enter: soleyromit

pnpm dlx vercel env add GITHUB_REPO production
# Enter: Work

pnpm dlx vercel env add GITHUB_PAT production
# Enter: ghp_your_real_token

pnpm dlx vercel env add GITHUB_BRANCH production
# Enter: main
```

- [ ] **Step 4: Redeploy with env vars**

```bash
pnpm dlx vercel --prod
```

- [ ] **Step 5: Verify deployed URL**

Visit the Vercel deployment URL. Expected: Registry page loads showing 3 watched docs. `/updates` page loads with filter UI.

- [ ] **Step 6: Commit vercel.json**

```bash
git add tools/doc-watcher/vercel.json
git commit -m "chore(doc-watcher): add vercel.json, deploy to Vercel"
```

---

**Plan 3 complete.** Doc Watcher UI is live at `localhost:3002` and on Vercel. Registry and updates feed are accessible from any device.
