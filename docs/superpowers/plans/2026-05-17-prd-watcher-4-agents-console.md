# PRD Watcher — Plan 4: Scheduled Agents + Console Injection

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the daily PRD watcher scheduled agent, the weekly compliance sweep agent, and the dev-only browser console injection (`__updates()`) in each product app. After this plan, the system runs autonomously every day and Romit can query all updates from DevTools without any UI changes.

**Architecture:** Two scheduled Claude Code routines (via `/schedule` skill). The PRD watcher reads SharePoint via M365 MCP, diffs against filesystem snapshots, applies clear changes, appends to `updates-log.json`. The compliance sweep runs Playwright + grep across all product pages, updates `violation-inventory.json`, writes `compliance-report.md`. The console injection is a dev-only Next.js module that fetches the updates log via a local API route and registers `window.__updates`.

**Tech Stack:** Claude Code `/schedule` skill, M365 MCP tools, Playwright (existing in tools/visual-check), Next.js API Routes, TypeScript.

**Depends on:** Plan 1 (data layer), Plan 2 (pattern docs + compliance-reviewer agent).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| Scheduled routine (daily 9am) | Create via `/schedule` | PRD watcher: read SharePoint → diff → apply/flag → digest |
| Scheduled routine (Monday 8am) | Create via `/schedule` | Compliance sweep: grep + Playwright → violation inventory → report |
| `apps/pce/admin/app/dev-updates.ts` | Create | Dev console injection module for PCE |
| `apps/pce/admin/app/api/dev/updates/route.ts` | Create | Local API route serving filtered updates-log.json (dev only) |
| `apps/exam-management/admin/app/dev-updates.ts` | Create | Same for Exam Management |
| `apps/exam-management/admin/app/api/dev/updates/route.ts` | Create | Same for Exam Management |
| `apps/pce/admin/app/layout.tsx` | Modify | Load dev-updates in dev mode |
| `apps/exam-management/admin/app/layout.tsx` | Modify | Load dev-updates in dev mode |

---

### Task 1: Write and test the daily PRD watcher prompt

The scheduled agent runs as a Claude Code routine. Before setting up the schedule, write and manually test the prompt once.

- [ ] **Step 1: Write the prompt to a reference file** at `docs/watch/agent-prompts/prd-watcher.md`:

```bash
mkdir -p /Users/romitsoley/Work/docs/watch/agent-prompts
```

```markdown
# PRD Watcher — Daily Agent Prompt

You are the daily PRD watcher. Run this entire prompt from top to bottom every time. Do not skip steps.

## Step 0: Auth check

Use `mcp__claude_ai_Microsoft_365__sharepoint_search` to search for "PCE PRD Monil" with limit 1.
If the call fails or returns an error, append to `docs/watch/flags/system.md`:
```
## AUTH FAILURE — {today's date} {time}
M365 auth expired. PRD watcher did not run. Re-authenticate in Claude Code.
```
Then stop — do not proceed.

## Step 1: Process inbox

Read `docs/watch/inbox.txt`. For each non-empty line:
1. Extract any SharePoint URL
2. Use `mcp__claude_ai_Microsoft_365__sharepoint_search` to resolve it (search by URL fragment)
3. Infer product from path keywords (PCE/Post Course → pce, Exam Management/Assessment → exam-management, else → ask in flags file)
4. Add an entry to `docs/watch/registry.json` with type: "direct"
5. Append to `docs/watch/updates-log.json`: type "new-doc"

After processing all lines, clear `docs/watch/inbox.txt`.

## Step 2: For each active registry entry, fetch and diff

Read `docs/watch/registry.json`. For each entry where `active: true`:

### If type == "direct":
Use `mcp__claude_ai_Microsoft_365__read_resource` with the `uri` field.

### If type == "excel-manifest":
Use `mcp__claude_ai_Microsoft_365__read_resource` with the `uri` field to read the Excel.
Extract all URLs matching `https://exxatsystems.*` from the returned text.
Process each extracted URL as a sub-doc (fetch it too).

### If type == "search":
Use `mcp__claude_ai_Microsoft_365__sharepoint_search` with `query` and `author` fields.
Take the first result URI. Fetch with `read_resource`.

### First-run bootstrap:
If no snapshot exists at `entry.snapshot` path: write the full content there, append a bootstrap notice to the flags file, update `entry.lastSynced` to today, skip to next entry.

### Diff:
Compare new content to the snapshot. Identify changed paragraphs (paragraphs separated by blank lines or section headers).

### Classify each changed paragraph as CLEAR or AMBIGUOUS:
AMBIGUOUS if the paragraph contains any of:
- "TBD", "To be added", "<To be added>", "In Progress", "In Review", "in progress"
- A sentence ending in "?" within a requirements section
- "Dependency on", "will not be covered", "requires X to exist first"
- The section body says only "In Progress"

CLEAR if it renames a specific field/label/status, adds/removes a column, changes a concrete value.

### For CLEAR changes — apply scoped edits:
Based on which PRD section changed, edit the relevant product file:

| PRD section | Edit target |
|---|---|
| Status label / group name | `GROUP_ORDER` / `GROUP_LABELS` constants in the relevant page file |
| New column/field | Add to mock data type + `ColumnDef` |
| Removed column/field | Remove from `ColumnDef` and mock data type |
| Renamed tab/section | Page `<h1>` and `app-sidebar.tsx` label |
| Min N threshold | Constant in mock data + UI warning text |
| Non-functional requirement | Flag only — never auto-edit |

After editing: append a `prd-change` entry to `docs/watch/updates-log.json` with what/why/files.

### For AMBIGUOUS changes:
Append to `docs/watch/flags/{product}.md`:
```
## {date} — Flagged: {entry.label}
**Changed text (before):** ...
**Changed text (after):** ...
**Why flagged:** contains "TBD" / open question / dependency statement
**Suggested action:** [your suggestion for Romit]
```
Append a `prd-flagged` entry to `docs/watch/updates-log.json`.

### For FERPA/HIPAA implications:
If a CLEAR change involves student identifiers, response text, or data retention, flag it instead of auto-applying. Note the specific regulation in the flags file.

## Step 3: Update snapshots

For each processed entry, overwrite `entry.snapshot` with the newly fetched content.
Update `entry.lastSynced` to today in `docs/watch/registry.json`.

## Step 4: Write morning digest

Overwrite `docs/watch/digest-latest.md` with:
```
# PRD Watcher Digest — {date} {time}

## Changes applied (N)
{list of prd-change entries applied this run}

## Flagged for your review (N)
{list of prd-flagged entries}

## FERPA/HIPAA alerts
{any flags involving these regulations, or "None today."}

## New docs auto-discovered (N)
{any new-doc entries}

## Auth status
✅ M365 authenticated — all N docs synced
```

## Step 5: Commit if anything changed

If any files were modified:
```bash
git add apps/ docs/watch/
git commit -m "chore(prd-sync): {date} — N clear changes, N flagged"
```
```

- [ ] **Step 2: Manually run the prompt once** in a Claude Code session to verify it works end-to-end before scheduling:

In Claude Code terminal, paste the prompt and run it. Verify:
- PCE PRD is fetched from SharePoint ✓
- Snapshot is created at `docs/watch/snapshots/pce-prd-monil.txt` ✓
- Bootstrap notice appears in `docs/watch/flags/pce.md` ✓
- `digest-latest.md` is written ✓
- No errors ✓

- [ ] **Step 3: Commit the agent prompt file**

```bash
git add docs/watch/agent-prompts/prd-watcher.md docs/watch/snapshots/
git commit -m "chore(watch): add PRD watcher agent prompt + first snapshots"
```

---

### Task 2: Schedule the daily PRD watcher

- [ ] **Step 1: Invoke the schedule skill**

In Claude Code, run:
```
/schedule
```

When prompted:
- **Prompt:** Paste the full content of `docs/watch/agent-prompts/prd-watcher.md`
- **Schedule:** `0 9 * * *` (daily at 9am)
- **Name:** `prd-watcher-daily`

- [ ] **Step 2: Verify the schedule was created**

```
/schedule list
```

Expected: `prd-watcher-daily` appears with cron `0 9 * * *`.

---

### Task 3: Write and test the weekly compliance sweep prompt

- [ ] **Step 1: Write the prompt** at `docs/watch/agent-prompts/compliance-sweep.md`:

```markdown
# Compliance Sweep — Weekly Agent Prompt

You are the weekly compliance sweep agent. Run every Monday at 8am.

## Step 1: Read existing violation inventory

Read `docs/watch/violation-inventory.json`. Parse all open violations — you'll compare against them to detect resolved issues.

## Step 2: Run grep checks across all product pages

For each product in ['pce', 'exam-management']:

### Files to check:
```bash
find apps/{product}/admin/app -name "*.tsx"
find apps/{product}/admin/components -name "*.tsx"
```

### Grep checks to run on each file:

```bash
# WCAG 4.1.2 — FA icons without aria-hidden
grep -rn "className=\"fa-" apps/{product}/admin/ | grep -v "aria-hidden" | grep -v "node_modules"

# WCAG 4.1.2 — icon-only buttons without aria-label
grep -rn 'size="icon\b\|size="icon-sm' apps/{product}/admin/ | grep -v "aria-label" | grep -v "node_modules"

# WCAG 4.1.2 — DropdownMenu without modal={false}
grep -rn "<DropdownMenu" apps/{product}/admin/ | grep -v "modal={false}" | grep -v "node_modules"

# Guardrail — raw <button>
grep -rn "<button" apps/{product}/admin/app/ apps/{product}/admin/components/ | grep -v "node_modules"

# Guardrail — opacity-60 on parent (contrast risk)
grep -rn "opacity-60" apps/{product}/admin/ | grep -v "node_modules"

# Guardrail — toast usage (banned)
grep -rn "toast(" apps/{product}/admin/ | grep -v "node_modules"

# FERPA — student identifier + response text co-location
# Files containing both studentId/studentName AND responseText/responseBody
for f in $(find apps/{product}/admin -name "*.tsx"); do
  if grep -q "studentId\|studentName" "$f" && grep -q "responseText\|responseBody" "$f"; then
    echo "FERPA: $f"
  fi
done
```

## Step 3: Update violation inventory

For each grep hit:
- If violation already in inventory (match by file + rule): update `lastSeen` to today
- If violation is new: add new entry with `status: "open"`, `firstSeen: today`, `lastSeen: today`
- If a previously open violation no longer appears in grep: set `status: "fixed"`

Write updated inventory back to `docs/watch/violation-inventory.json`.

## Step 4: Append resolved violations to updates-log

For each violation that changed from open → fixed:
Append a `compliance-resolved` entry to `docs/watch/updates-log.json`.

For each new violation:
Append a `compliance-violation` entry with severity (P1/P2/P3 per spec §6.3) and consequence.

## Step 5: Write compliance report

Overwrite `docs/watch/compliance-report.md`:
```
# Compliance Report — {date}

## Summary
P1 (blocks release): N
P2 (fix before next audit): N
P3 (advisory): N
Resolved since last sweep: N

## P1 Violations
{list each with file, rule, consequence, fix level, first seen, status}

## P2 Violations
{list each}

## P3 Violations
{list each}

## Resolved since last report
{list each}
```

Severity assignment:
- P1: FERPA violation, HIPAA violation, icon button with no aria-label on a user-facing action
- P2: DropdownMenu without modal={false}, toast usage, raw <button>
- P3: opacity-60 contrast risk, advisory items

## Step 6: Commit

```bash
git add docs/watch/violation-inventory.json docs/watch/compliance-report.md docs/watch/updates-log.json
git commit -m "chore(compliance): weekly sweep {date} — N open violations, N resolved"
```
```

- [ ] **Step 2: Manually run the sweep once** to verify it produces correct output. Check:
- `docs/watch/violation-inventory.json` has real violations from the codebase ✓
- `docs/watch/compliance-report.md` is written ✓
- `docs/watch/updates-log.json` has new compliance-violation entries ✓

- [ ] **Step 3: Commit**

```bash
git add docs/watch/agent-prompts/compliance-sweep.md
git commit -m "chore(watch): add compliance sweep agent prompt"
```

---

### Task 4: Schedule the weekly compliance sweep

- [ ] **Step 1: Invoke the schedule skill**

```
/schedule
```

When prompted:
- **Prompt:** Paste the full content of `docs/watch/agent-prompts/compliance-sweep.md`
- **Schedule:** `0 8 * * 1` (Monday at 8am)
- **Name:** `compliance-sweep-weekly`

- [ ] **Step 2: Verify**

```
/schedule list
```

Expected: both `prd-watcher-daily` and `compliance-sweep-weekly` appear.

---

### Task 5: Build the dev console injection for PCE

**Files:**
- Create: `apps/pce/admin/app/api/dev/updates/route.ts`
- Create: `apps/pce/admin/app/dev-updates.ts`
- Modify: `apps/pce/admin/app/layout.tsx`

- [ ] **Step 1: Create the API route** at `apps/pce/admin/app/api/dev/updates/route.ts`

This route reads `docs/watch/updates-log.json` from the local filesystem (dev only) and returns filtered entries.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
// UpdatesLog type is inlined here to avoid cross-app import — this file lives
// inside the product app and cannot import from tools/doc-watcher/lib/types.ts
interface UpdatesLog {
  entries: Array<{
    id: string; date: string; product: string; type: string
    title: string; what: string; why: string; severity: string | null; files: string[]
    source: string
  }>
}

// Disabled in production
export function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const logPath = join(process.cwd(), '..', '..', '..', '..', 'docs', 'watch', 'updates-log.json')
    const raw = readFileSync(logPath, 'utf-8')
    const log: UpdatesLog = JSON.parse(raw)

    const { searchParams } = new URL(request.url)
    const product = searchParams.get('product') ?? 'pce'
    const period = searchParams.get('period') ?? 'week'
    const type = searchParams.get('type') ?? 'all'

    const now = new Date()
    const cutoff = period === 'today'
      ? new Date(now.toDateString())
      : period === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : period === 'month'
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          : new Date(0)

    const filtered = log.entries.filter(e => {
      if (product !== 'all' && e.product !== product) return false
      if (new Date(e.date) < cutoff) return false
      if (type !== 'all' && e.type !== type) return false
      return true
    })

    return NextResponse.json(filtered)
  } catch {
    return NextResponse.json([], { status: 200 }) // Graceful: log may not exist yet
  }
}
```

**Note on path:** The `cwd()` when Next.js runs is `apps/pce/admin/`. The log is at `../../../../docs/watch/updates-log.json` relative to that. Adjust if the repo structure differs.

- [ ] **Step 2: Create `apps/pce/admin/app/dev-updates.ts`**

```typescript
// Dev-only module — tree-shaken in production builds via NODE_ENV guard
// Registers window.__updates() for use in browser DevTools console

interface UpdateEntry {
  id: string
  date: string
  product: string
  type: string
  title: string
  what: string
  why: string
  severity: string | null
  files: string[]
  source: string
}

const TYPE_ICONS: Record<string, string> = {
  'prd-change': '🔵',
  'prd-flagged': '🟡',
  'compliance-violation': '🔴',
  'compliance-resolved': '🟢',
  'new-doc': '🟣',
  'pattern-update': '🩵',
  'claude-correction': '🟠',
}

async function fetchUpdates(product = 'pce', period = 'week', type = 'all'): Promise<UpdateEntry[]> {
  const res = await fetch(`/api/dev/updates?product=${product}&period=${period}&type=${type}`)
  if (!res.ok) return []
  return res.json()
}

function formatEntry(e: UpdateEntry): string {
  const icon = TYPE_ICONS[e.type] ?? '⚪'
  const severity = e.severity ? ` [${e.severity}]` : ''
  return [
    `${icon} ${e.type.toUpperCase()}${severity} · ${e.date}`,
    `  Title:  ${e.title}`,
    `  What:   ${e.what}`,
    `  Why:    ${e.why}`,
    e.files.length > 0 ? `  Files:  ${e.files.map(f => f.split('/').pop()).join(', ')}` : '',
  ].filter(Boolean).join('\n')
}

async function showUpdates(productOrFilter = 'pce', period = 'week', type = 'all') {
  // Flexible argument parsing: __updates() / __updates('today') / __updates('pce', 'today') / __updates('corrections')
  let resolvedProduct = productOrFilter
  let resolvedPeriod = period
  let resolvedType = type

  if (['today', 'week', 'month', 'all'].includes(productOrFilter)) {
    resolvedProduct = 'pce'
    resolvedPeriod = productOrFilter
  }
  if (productOrFilter === 'corrections') {
    resolvedProduct = 'all'
    resolvedType = 'claude-correction'
  }

  const entries = await fetchUpdates(resolvedProduct, resolvedPeriod, resolvedType)

  if (entries.length === 0) {
    console.log(`%c Exxat Updates — no entries for [${resolvedProduct}, ${resolvedPeriod}, ${resolvedType}]`, 'color: #64748b')
    return
  }

  console.group(`%c Exxat Updates · PCE · Last ${resolvedPeriod} (${entries.length})`, 'font-weight: bold; color: #6366f1')
  for (const e of entries) {
    console.log(formatEntry(e))
    console.log('─'.repeat(60))
  }
  console.groupEnd()
}

export function initDevUpdates() {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'development') return

  // Register global
  ;(window as unknown as Record<string, unknown>).__updates = showUpdates

  // Check for prompt-worthy updates on load
  fetchUpdates('pce', 'today', 'all').then(todayEntries => {
    const p1 = todayEntries.filter(e => e.severity === 'P1' || e.type === 'prd-change')
    if (p1.length > 0) {
      console.log(
        `%c 🔔 Exxat · ${p1.length} update${p1.length > 1 ? 's' : ''} today  →  __updates() to browse  |  __updates('today') for today only`,
        'color: #6366f1; font-weight: bold'
      )
    }
  })
}
```

- [ ] **Step 3: Read current `apps/pce/admin/app/layout.tsx`** to understand what's there before modifying:

```bash
cat /Users/romitsoley/Work/apps/pce/admin/app/layout.tsx
```

- [ ] **Step 4: Add the dev-updates initialisation** — add a `<Script>` or inline `useEffect` pattern. Since `layout.tsx` is a Server Component, use a small client component:

Create `apps/pce/admin/app/dev-init.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

export function DevInit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    import('./dev-updates').then(m => m.initDevUpdates())
  }, [])
  return null
}
```

Then in `apps/pce/admin/app/layout.tsx`, add `<DevInit />` inside the body (it renders nothing visible):

```tsx
import { DevInit } from './dev-init'

// Inside <body>:
{process.env.NODE_ENV === 'development' && <DevInit />}
{children}
```

- [ ] **Step 5: Test the console injection**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm dev
```

Open `localhost:3000` in browser. Open DevTools → Console. Expected:
- If updates-log has entries: `🔔 Exxat · N updates today → __updates() to browse`
- If log is empty: no output on load (correct — silent when nothing to report)

Then type in console:
```javascript
__updates()
```

Expected: formatted output (or "no entries" message if log is empty).

```javascript
__updates('corrections')
```

Expected: shows only `claude-correction` type entries.

- [ ] **Step 6: Commit**

```bash
git add apps/pce/admin/app/api/dev/ apps/pce/admin/app/dev-updates.ts apps/pce/admin/app/dev-init.tsx apps/pce/admin/app/layout.tsx
git commit -m "feat(pce): dev console __updates() injection — zero UI, DevTools only"
```

---

### Task 6: Build the dev console injection for Exam Management

**Files:**
- Create: `apps/exam-management/admin/app/api/dev/updates/route.ts`
- Create: `apps/exam-management/admin/app/dev-updates.ts`
- Create: `apps/exam-management/admin/app/dev-init.tsx`
- Modify: `apps/exam-management/admin/app/layout.tsx`

- [ ] **Step 1: Copy the API route** — identical to PCE version, just adjust the default product filter from `pce` to `exam-management` in the GET handler:

```typescript
const product = searchParams.get('product') ?? 'exam-management'  // changed from 'pce'
```

- [ ] **Step 2: Copy `dev-updates.ts`** with one change — update the default product in `showUpdates`:

```typescript
async function showUpdates(productOrFilter = 'exam-management', period = 'week', type = 'all') {
```

And update the console group label:
```typescript
console.group(`%c Exxat Updates · Exam Management · Last ${resolvedPeriod} (${entries.length})`, ...)
```

- [ ] **Step 3: Copy `dev-init.tsx`** — identical, no changes needed.

- [ ] **Step 4: Read and modify `apps/exam-management/admin/app/layout.tsx`** — add `<DevInit />` exactly as done for PCE.

- [ ] **Step 5: Verify**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm dev
```

Open DevTools → Console. Type `__updates()`. Expected: same behaviour as PCE but filtered to exam-management.

- [ ] **Step 6: Commit**

```bash
git add apps/exam-management/admin/app/api/dev/ apps/exam-management/admin/app/dev-updates.ts apps/exam-management/admin/app/dev-init.tsx apps/exam-management/admin/app/layout.tsx
git commit -m "feat(exam-management): dev console __updates() injection"
```

---

### Task 7: Add claude-correction logging to session workflow

This task adds the discipline of writing a `claude-correction` entry to `updates-log.json` whenever Romit points out a mistake mid-session.

- [ ] **Step 1: Update `docs/governance/verification-discipline.md`** — add a new section at the bottom:

```markdown
## Correction Logging Protocol

When Romit points out a mistake in any session:

1. Fix the mistake (as always)
2. Save a `feedback` memory entry (as always)
3. **Also** append a `claude-correction` entry to `docs/watch/updates-log.json`:

```json
{
  "id": "{YYYY-MM-DD}-{product}-corr-{seq}",
  "date": "{today}",
  "product": "{affected product}",
  "type": "claude-correction",
  "title": "Wrong: {one-line description of what was wrong}",
  "what": "{what was wrong} → {what was fixed}",
  "why": "{root cause — e.g. 'did not read Table source before writing JSX'}",
  "source": "Romit (session correction)",
  "severity": null,
  "files": ["{affected files}"]
}
```

4. Also reference the discipline log entry line in the `why` field if one was written.

This ensures every correction appears in the updates feed at `__updates('corrections')` and the Doc Watcher UI.
```

- [ ] **Step 2: Commit**

```bash
git add docs/governance/verification-discipline.md docs/watch/updates-log.json
git commit -m "chore(discipline): add correction logging protocol to verification-discipline.md"
```

---

### Task 8: Final integration test

- [ ] **Step 1: Manually trigger the PRD watcher** (don't wait for 9am):

Run the prompt from `docs/watch/agent-prompts/prd-watcher.md` manually in Claude Code. Verify:
- PCE PRD snapshot written to `docs/watch/snapshots/pce-prd-monil.txt` ✓
- `digest-latest.md` written ✓
- `updates-log.json` has at least one entry (bootstrap notices count) ✓

- [ ] **Step 2: Open the PCE app in the browser**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm dev
```

Open DevTools console. Type `__updates()`. Expected: shows the bootstrap entries from Step 1.

- [ ] **Step 3: Open the Doc Watcher UI**

```bash
cd /Users/romitsoley/Work/tools/doc-watcher && pnpm dev
```

Visit `localhost:3002/updates`. Expected: the same entries appear in the timeline UI.

- [ ] **Step 4: Add a test entry directly** to confirm the full pipeline:

Manually append to `docs/watch/updates-log.json`:
```json
{
  "id": "2026-05-17-pce-test-001",
  "date": "2026-05-17",
  "product": "pce",
  "type": "claude-correction",
  "title": "Wrong: Test correction entry for pipeline verification",
  "what": "This is a test entry to confirm the pipeline works end to end",
  "why": "Manual pipeline test",
  "source": "Romit (test)",
  "severity": null,
  "files": []
}
```

Refresh PCE app DevTools → `__updates('corrections')` → entry appears ✓
Refresh `localhost:3002/updates` → filter to `claude-correction` → entry appears ✓

Remove the test entry after verification.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore(watch): plan 4 complete — scheduled agents, console injection, correction logging"
```

---

**Plan 4 complete.** The system now runs autonomously. Daily PRD diffs, weekly compliance sweeps, `__updates()` in DevTools, and every correction Romit makes is logged and browsable.

---

## Summary — All Four Plans

| Plan | What ships | Time estimate |
|---|---|---|
| Plan 1: Foundation | `docs/watch/` structure, TypeScript types, GitHub API storage lib | ~1 hour |
| Plan 2: Pattern + Compliance | Pattern docs, compliance-reviewer agent, zoom tests, FERPA assertion | ~2 hours |
| Plan 3: Doc Watcher UI | Next.js tool on Vercel with registry + updates feed | ~3 hours |
| Plan 4: Agents + Console | Scheduled routines, `__updates()` injection, correction logging | ~2 hours |

**Execution order:** Plan 1 first (foundation). Plans 2 and 3 can run in parallel. Plan 4 last (depends on Plans 1 + 2).
