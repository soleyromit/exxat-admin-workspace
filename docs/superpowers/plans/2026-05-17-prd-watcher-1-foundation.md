# PRD Watcher — Plan 1: Foundation (Shared Data Layer)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the shared data schemas, directory structure, and GitHub API storage library that Plans 3 and 4 depend on.

**Architecture:** All persistent state (registry, updates log, violation inventory, flags) lives in the git repo under `docs/watch/`. A TypeScript library (`github-storage.ts`) reads and writes these files via the GitHub REST API — making the same code work both locally and on Vercel. The scheduled agents (Plan 4) continue to use the local filesystem directly.

**Tech Stack:** TypeScript, GitHub REST API v3, Node.js `Buffer` for base64, Vitest for tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `docs/watch/registry.json` | Create | Single registry of all watched SharePoint docs |
| `docs/watch/updates-log.json` | Create | Append-only log of all design/product/correction events |
| `docs/watch/violation-inventory.json` | Create | Persistent compliance violation tracker |
| `docs/watch/flags/pce.md` | Create | Ambiguous PRD delta log for PCE |
| `docs/watch/flags/exam-management.md` | Create | Ambiguous PRD delta log for Exam Management |
| `docs/watch/flags/system.md` | Create | Auth failure and system error log |
| `docs/watch/digest-latest.md` | Create | Template — overwritten by agent each morning |
| `docs/watch/snapshots/.gitkeep` | Create | Keep snapshots dir in git |
| `tools/doc-watcher/lib/types.ts` | Create | TypeScript types for all schemas |
| `tools/doc-watcher/lib/github-storage.ts` | Create | GitHub REST API read/write for all watch files |
| `tools/doc-watcher/lib/github-storage.test.ts` | Create | Vitest tests for storage library |

---

### Task 1: Create `docs/watch/` directory structure

**Files:**
- Create: `docs/watch/registry.json`
- Create: `docs/watch/updates-log.json`
- Create: `docs/watch/violation-inventory.json`
- Create: `docs/watch/flags/pce.md`
- Create: `docs/watch/flags/exam-management.md`
- Create: `docs/watch/flags/system.md`
- Create: `docs/watch/digest-latest.md`
- Create: `docs/watch/snapshots/.gitkeep`

- [ ] **Step 1: Create registry.json** with the PCE PRD entry we already know (URI confirmed working in session):

```json
{
  "entries": [
    {
      "id": "pce-prd-monil",
      "product": "pce",
      "label": "PCE PRD — Monil Pokar",
      "type": "direct",
      "uri": "file:///b!6y2xwNLVd0aUyo9sxCyb6XmDI-2SiVVBlBxcEI6ONSKXRD9miglXSK85dbahfq2-/01GF5FXBAL7WM2D6SQWFDLODM52CGDI7OL",
      "snapshot": "docs/watch/snapshots/pce-prd-monil.txt",
      "flags": "docs/watch/flags/pce.md",
      "lastSynced": null,
      "active": true
    },
    {
      "id": "exam-roadmap-nipun",
      "product": "exam-management",
      "label": "Exam Mgmt Roadmap — Nipun (Excel manifest)",
      "type": "excel-manifest",
      "uri": "file:///b!_2xYksJpY02i2c_IMdywfj_GsYw4nixMmuYHQiw9DyEF5rFuOn4TQp2p2E75ioRS/01TEBFVP5ENZ6VUDVB2VEZ3HKAATCI4SBQ",
      "snapshot": "docs/watch/snapshots/exam-roadmap-nipun.txt",
      "flags": "docs/watch/flags/exam-management.md",
      "lastSynced": null,
      "active": true
    },
    {
      "id": "exam-prd-nipun",
      "product": "exam-management",
      "label": "Assessment Builder PRD — Nipun",
      "type": "direct",
      "uri": "file:///b!_2xYksJpY02i2c_IMdywfj_GsYw4nixMmuYHQiw9DyEF5rFuOn4TQp2p2E75ioRS/01TEBFVPY3QVDJN2NMZNDINUOQKMMIWG6R",
      "snapshot": "docs/watch/snapshots/exam-prd-nipun.txt",
      "flags": "docs/watch/flags/exam-management.md",
      "lastSynced": null,
      "active": true
    }
  ]
}
```

- [ ] **Step 2: Create updates-log.json** — empty log, array ready to receive entries:

```json
{
  "entries": []
}
```

- [ ] **Step 3: Create violation-inventory.json** — empty inventory:

```json
{
  "violations": []
}
```

- [ ] **Step 4: Create flag files** — each with a header comment so they're not empty:

`docs/watch/flags/pce.md`:
```markdown
# PRD Watch Flags — PCE

Ambiguous PRD deltas and system notices. Append-only. Agent writes, Romit resolves.

---
```

`docs/watch/flags/exam-management.md`:
```markdown
# PRD Watch Flags — Exam Management

Ambiguous PRD deltas and system notices. Append-only. Agent writes, Romit resolves.

---
```

`docs/watch/flags/system.md`:
```markdown
# System Notices

Auth failures and agent errors. Append-only.

---
```

- [ ] **Step 5: Create digest-latest.md** — template (agent overwrites each morning):

```markdown
# PRD Watcher Digest — (not yet run)

Run the daily PRD watcher agent to populate this file.
```

- [ ] **Step 6: Create snapshots/.gitkeep**

```bash
touch /Users/romitsoley/Work/docs/watch/snapshots/.gitkeep
```

- [ ] **Step 7: Commit**

```bash
git add docs/watch/
git commit -m "chore(watch): initialise docs/watch directory structure and seed registry"
```

---

### Task 2: Define TypeScript types for all schemas

**Files:**
- Create: `tools/doc-watcher/lib/types.ts`

Note: `tools/doc-watcher/` does not exist yet — create the directory first. The full Next.js app scaffold is in Plan 3; this task creates only the `lib/` directory and types file.

- [ ] **Step 1: Create the lib directory**

```bash
mkdir -p /Users/romitsoley/Work/tools/doc-watcher/lib
```

- [ ] **Step 2: Write `tools/doc-watcher/lib/types.ts`**

```typescript
// Registry types
export type EntryType = 'direct' | 'excel-manifest' | 'search'

export interface RegistryEntry {
  id: string
  product: string
  label: string
  type: EntryType
  uri?: string       // direct + excel-manifest types
  query?: string     // search type
  author?: string    // search type (partial email match)
  snapshot: string   // path relative to repo root
  flags: string      // path relative to repo root
  lastSynced: string | null
  active: boolean    // false = removed, kept for audit trail
  sourceUrl?: string // original SharePoint URL when registered via the UI (for dedup)
}

export interface Registry {
  entries: RegistryEntry[]
}

// Updates log types
export type UpdateType =
  | 'prd-change'
  | 'prd-flagged'
  | 'compliance-violation'
  | 'compliance-resolved'
  | 'new-doc'
  | 'pattern-update'
  | 'claude-correction'

export type Severity = 'P1' | 'P2' | 'P3' | null

export interface UpdateEntry {
  id: string          // YYYY-MM-DD-{product}-{seq} e.g. "2026-05-19-pce-001"
  date: string        // YYYY-MM-DD
  product: string
  type: UpdateType
  title: string
  what: string        // what changed
  why: string         // why it changed (PRD section, regulation, Romit's correction)
  source: string      // "PCE PRD — Monil Pokar" | "Weekly compliance sweep" | "Romit"
  severity: Severity  // only for compliance-violation type
  files: string[]     // repo-relative file paths affected
}

export interface UpdatesLog {
  entries: UpdateEntry[]
}

// Violation inventory types
export type ViolationStatus = 'open' | 'fixed'
export type FixLevel = 'ui' | 'architecture'

export interface ViolationEntry {
  id: string          // "{product}-{rule-slug}-{file-slug}"
  product: string
  file: string        // repo-relative path
  line: number
  rule: string        // e.g. "WCAG 4.1.2", "FERPA §99.31"
  severity: 'P1' | 'P2' | 'P3'
  consequence: string // plain language consequence
  fixLevel: FixLevel
  firstSeen: string   // ISO date
  lastSeen: string    // ISO date (updated each sweep)
  status: ViolationStatus
}

export interface ViolationInventory {
  violations: ViolationEntry[]
}

// GitHub storage response types
export interface GitHubFileResponse {
  content: string   // base64 encoded
  sha: string
  name: string
  path: string
}

export interface StorageFile<T> {
  data: T
  sha: string
}
```

- [ ] **Step 3: Commit**

```bash
git add tools/doc-watcher/lib/types.ts
git commit -m "feat(watch): add TypeScript types for registry, updates-log, violation-inventory"
```

---

### Task 3: Implement GitHub API storage library

**Files:**
- Create: `tools/doc-watcher/lib/github-storage.ts`

**Context:** The GitHub REST API PUT endpoint requires the current file SHA to prevent overwrite conflicts. The storage library always fetches the current SHA immediately before writing — making each write a read-then-write pair. This is safe because writes only happen from the Doc Watcher UI (single user, no concurrent writes).

- [ ] **Step 1: Write the test file first** (TDD):

Create `tools/doc-watcher/lib/github-storage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Set required env vars before importing the module
process.env.GITHUB_OWNER = 'soleyromit'
process.env.GITHUB_REPO = 'Work'
process.env.GITHUB_PAT = 'ghp_test_token'
process.env.GITHUB_BRANCH = 'main'

import {
  readRegistry,
  writeRegistry,
  readUpdatesLog,
  appendUpdate,
  readViolationInventory,
} from './github-storage'
import type { Registry, UpdateEntry, UpdatesLog } from './types'

const makeGetResponse = (data: unknown, sha = 'abc123') => ({
  ok: true,
  json: async () => ({
    content: Buffer.from(JSON.stringify(data)).toString('base64'),
    sha,
  }),
})

const makePutResponse = () => ({
  ok: true,
  json: async () => ({ commit: { sha: 'new-sha' } }),
})

beforeEach(() => {
  mockFetch.mockReset()
})

describe('readRegistry', () => {
  it('fetches registry.json and returns parsed registry with sha', async () => {
    const registry: Registry = { entries: [] }
    mockFetch.mockResolvedValueOnce(makeGetResponse(registry, 'sha-1'))

    const result = await readRegistry()

    expect(result.data).toEqual(registry)
    expect(result.sha).toBe('sha-1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('docs/watch/registry.json'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer ghp_test_token' }) })
    )
  })

  it('throws when GitHub returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(readRegistry()).rejects.toThrow('GitHub GET docs/watch/registry.json failed: 404')
  })
})

describe('writeRegistry', () => {
  it('PUTs updated registry with correct sha and commit message', async () => {
    const registry: Registry = { entries: [] }
    mockFetch.mockResolvedValueOnce(makePutResponse())

    await writeRegistry(registry, 'sha-existing', 'chore(watch): test write')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('docs/watch/registry.json')
    expect(options.method).toBe('PUT')
    const body = JSON.parse(options.body)
    expect(body.sha).toBe('sha-existing')
    expect(body.message).toBe('chore(watch): test write')
    expect(Buffer.from(body.content, 'base64').toString()).toEqual(JSON.stringify(registry, null, 2))
  })
})

describe('appendUpdate', () => {
  it('reads current log, appends entry, writes back', async () => {
    const existing: UpdatesLog = { entries: [] }
    const entry: UpdateEntry = {
      id: '2026-05-19-pce-001',
      date: '2026-05-19',
      product: 'pce',
      type: 'prd-change',
      title: 'Test entry',
      what: 'Something changed',
      why: 'PRD updated',
      source: 'PCE PRD — Monil',
      severity: null,
      files: ['apps/pce/admin/app/(app)/surveys/page.tsx'],
    }

    // First call: read current log
    mockFetch.mockResolvedValueOnce(makeGetResponse(existing, 'sha-log'))
    // Second call: write updated log
    mockFetch.mockResolvedValueOnce(makePutResponse())

    await appendUpdate(entry)

    const putCall = mockFetch.mock.calls[1]
    const body = JSON.parse(putCall[1].body)
    const written: UpdatesLog = JSON.parse(Buffer.from(body.content, 'base64').toString())
    expect(written.entries).toHaveLength(1)
    expect(written.entries[0]).toEqual(entry)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher
# If package.json doesn't exist yet, create minimal one for vitest:
cat > package.json << 'EOF'
{
  "name": "doc-watcher",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "dev": "next dev --port 3002"
  },
  "dependencies": {},
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
pnpm install
pnpm test
```

Expected output: `Cannot find module './github-storage'`

- [ ] **Step 3: Implement `tools/doc-watcher/lib/github-storage.ts`**

```typescript
import type {
  Registry,
  UpdateEntry,
  UpdatesLog,
  ViolationInventory,
  StorageFile,
} from './types'

const OWNER = process.env.GITHUB_OWNER!
const REPO = process.env.GITHUB_REPO!
const PAT = process.env.GITHUB_PAT!
const BRANCH = process.env.GITHUB_BRANCH ?? 'main'

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents`
const HEADERS = {
  Authorization: `Bearer ${PAT}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

async function getFile(path: string): Promise<StorageFile<string>> {
  const res = await fetch(`${BASE}/${path}?ref=${BRANCH}`, {
    headers: HEADERS,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`)
  const data = await res.json()
  return {
    data: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  }
}

async function putFile(
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PUT',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch: BRANCH,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`GitHub PUT ${path} failed: ${res.status} — ${JSON.stringify(err)}`)
  }
}

export async function readRegistry(): Promise<StorageFile<Registry>> {
  const file = await getFile('docs/watch/registry.json')
  return { data: JSON.parse(file.data), sha: file.sha }
}

export async function writeRegistry(
  registry: Registry,
  sha: string,
  message: string
): Promise<void> {
  await putFile('docs/watch/registry.json', JSON.stringify(registry, null, 2), sha, message)
}

export async function readUpdatesLog(): Promise<StorageFile<UpdatesLog>> {
  const file = await getFile('docs/watch/updates-log.json')
  return { data: JSON.parse(file.data), sha: file.sha }
}

export async function appendUpdate(entry: UpdateEntry): Promise<void> {
  const current = await readUpdatesLog()
  current.data.entries.push(entry)
  await putFile(
    'docs/watch/updates-log.json',
    JSON.stringify(current.data, null, 2),
    current.sha,
    `chore(updates): ${entry.type} — ${entry.title.slice(0, 60)}`
  )
}

export async function readViolationInventory(): Promise<StorageFile<ViolationInventory>> {
  const file = await getFile('docs/watch/violation-inventory.json')
  return { data: JSON.parse(file.data), sha: file.sha }
}

export async function writeViolationInventory(
  inventory: ViolationInventory,
  sha: string
): Promise<void> {
  await putFile(
    'docs/watch/violation-inventory.json',
    JSON.stringify(inventory, null, 2),
    sha,
    'chore(compliance): update violation inventory'
  )
}

export async function appendFlag(
  flagsPath: string,
  content: string,
  sha: string
): Promise<void> {
  // flagsPath is repo-relative e.g. "docs/watch/flags/pce.md"
  await putFile(flagsPath, content, sha, `chore(flags): append to ${flagsPath}`)
}

export async function readFile(path: string): Promise<StorageFile<string>> {
  return getFile(path)
}

export async function writeFile(
  path: string,
  content: string,
  sha: string,
  message: string
): Promise<void> {
  return putFile(path, content, sha, message)
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher && pnpm test
```

Expected output:
```
✓ readRegistry > fetches registry.json and returns parsed registry with sha
✓ readRegistry > throws when GitHub returns non-ok status
✓ writeRegistry > PUTs updated registry with correct sha and commit message
✓ appendUpdate > reads current log, appends entry, writes back
Tests: 4 passed
```

- [ ] **Step 5: Commit**

```bash
git add tools/doc-watcher/lib/github-storage.ts tools/doc-watcher/lib/github-storage.test.ts tools/doc-watcher/package.json
git commit -m "feat(watch): implement GitHub API storage library with tests"
```

---

### Task 4: Create `.env.local` template and add to workspace

**Files:**
- Create: `tools/doc-watcher/.env.local.example`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Create `.env.local.example`** (committed; actual `.env.local` is gitignored):

```bash
# Copy to .env.local and fill in values
GITHUB_OWNER=soleyromit
GITHUB_REPO=Work
GITHUB_PAT=ghp_your_fine_grained_pat_here
GITHUB_BRANCH=main
```

- [ ] **Step 2: Ensure `.env.local` is gitignored** — check `tools/doc-watcher/.gitignore` (create if missing):

```
.env.local
.next/
node_modules/
```

- [ ] **Step 3: Add `tools/doc-watcher` to workspace** — open `/Users/romitsoley/Work/pnpm-workspace.yaml` and add:

Current file content includes:
```yaml
packages:
  - 'exxat-ds/packages/*'
  - 'apps/exam-management/*'
  - 'apps/patient-log/*'
  - 'apps/pce/*'
  - 'apps/skills-checklist/*'
  - 'apps/learning-contracts/*'
```

Add `- 'tools/doc-watcher'` to the list.

- [ ] **Step 4: Commit**

```bash
git add tools/doc-watcher/.env.local.example tools/doc-watcher/.gitignore pnpm-workspace.yaml
git commit -m "chore(watch): add doc-watcher to workspace, env template"
```

---

### Task 5: Verify end-to-end read from GitHub

**Context:** This confirms the storage library works against the real GitHub API before Plans 3 and 4 build on top of it.

- [ ] **Step 1: Create `.env.local`** from the template and fill in real values. Get a PAT from github.com → Settings → Developer settings → Fine-grained tokens. Scopes needed: `Contents: Read and write` on the `soleyromit/Work` repo.

- [ ] **Step 2: Write a quick smoke test script** at `tools/doc-watcher/lib/smoke.ts`:

```typescript
// Run with: npx tsx lib/smoke.ts
import { readRegistry } from './github-storage'

async function main() {
  const { data, sha } = await readRegistry()
  console.log('Registry SHA:', sha)
  console.log('Entries:', data.entries.map(e => `${e.id} (${e.active ? 'active' : 'inactive'})`))
}

main().catch(console.error)
```

- [ ] **Step 3: Run the smoke test**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher
npx tsx lib/smoke.ts
```

Expected output:
```
Registry SHA: <some sha string>
Entries: [ 'pce-prd-monil (active)', 'exam-roadmap-nipun (active)', 'exam-prd-nipun (active)' ]
```

If you see an auth error: verify the PAT is correct and has `Contents: read` permission.

- [ ] **Step 4: Delete smoke test file** (it was for verification only, not permanent):

```bash
rm tools/doc-watcher/lib/smoke.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(watch): plan 1 complete — foundation, schemas, GitHub storage"
```

---

**Plan 1 complete.** Plans 3 and 4 can now build on `github-storage.ts` and the `docs/watch/` data layer.
