# Design: PRD Watcher + Pattern & Compliance Capture
**Date:** 2026-05-17
**Author:** Romit Soley
**Status:** Approved — ready for implementation planning

---

## 1. Problem

Two separate but related gaps in the current workflow:

1. **PRD drift goes unnoticed.** Monil, Nipun, and other PMs update Word docs on SharePoint. Design and code don't update until Romit manually notices and prompts Claude to catch up. High-stakes products (PCE, Exam Management) cannot afford silent drift.

2. **Pattern + compliance violations require repeated correction.** Claude re-introduces the same structural mistakes (wrong DataTable shell, missing aria-label, broken zoom reflow) because there is no persistent, self-checked pattern reference. Romit spends time screenshotting and correcting rather than designing.

---

## 2. Solution Overview

Three interconnected systems:

| System | What it does |
|---|---|
| **PRD Watcher** | Daily scheduled agent — reads all watched SharePoint docs, diffs against snapshots, applies clear changes, flags ambiguous ones |
| **Doc Watcher UI** | Local web tool — Romit pastes SharePoint links, UI validates against registry, deduplicates, registers new docs |
| **Pattern + Compliance Doc** | Per-product living reference — experience patterns, DS usage, accessibility, FERPA, HIPAA, with consequences and architecture enforcement |
| **Updates Feed** | Browsable timeline of every design/product change including Claude corrections — in Doc Watcher UI at `/updates` and via `__updates()` in browser DevTools console |

---

## 3. System 1 — PRD Watcher

### 3.1 Workspace structure

```
docs/watch/
├── registry.json          ← maintained by agent and Doc Watcher UI, never hand-edited
├── inbox.txt              ← one SharePoint URL per line; agent processes and clears on each run
├── snapshots/
│   ├── pce-prd-monil.txt
│   ├── exam-prd-nipun.txt
│   └── <id>.txt           ← one per registry entry
└── flags/
    ├── pce.md             ← ambiguous deltas awaiting human decision, append-only
    └── exam-management.md
```

### 3.2 Registry schema

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
      "lastSynced": "2026-05-17"
    }
  ]
}
```

**Entry types:**

| Type | Behaviour |
|---|---|
| `direct` | Read URI directly via M365 `read_resource` |
| `excel-manifest` | Read Excel via `read_resource`, regex-extract all `https://exxatsystems.*` URLs from cell content, process each as a sub-doc |
| `search` | Find via `sharepoint_search` with `query` + optional `author`, use first result URI |

### 3.3 Ambiguity classification

A changed paragraph is **AMBIGUOUS** if it contains any of:
- `TBD`, `To be added`, `In Progress`, `in progress`, `<To be added>`, `In Review`
- An open question marker (`?` at sentence end inside a requirements section)
- A dependency statement (`Dependency on...`, `will not be covered`, `requires X to exist first`)
- A section header whose body only says "In Progress" (e.g., Longitudinal Insights)
- A contradiction with a type or constant already hardcoded in the product codebase

A changed paragraph is **CLEAR** if:
- It renames a specific field, label, status, or flow step with no conditionality
- It adds or removes a specific column, section, or persona
- It changes a rule with a concrete value (e.g., minimum response threshold `5` → `3`)

### 3.4 Scoped edit targets per PRD section

| PRD section changed | Edit target |
|---|---|
| Status label / group name | `GROUP_ORDER`, `GROUP_LABELS` constants in the relevant page |
| New column / field in a flow | Mock data type + `ColumnDef` in the relevant page |
| Removed column / field | Remove from `ColumnDef` and mock data type |
| Persona name | Comments + section labels in relevant pages |
| Renamed tab / nav section | Page heading + `app-sidebar.tsx` label |
| Minimum N threshold value | Constant in mock data + UI warning text |
| Non-functional requirement | Flag only — engineering target, no UI edit |
| FERPA/HIPAA implication in a change | Flag to `flags/<product>.md` with regulation and consequence, do not auto-apply |

### 3.5 Agent loop (daily, 9am)

```
1. Read docs/watch/inbox.txt → for each URL: resolve to URI, read briefly, infer product,
   register in registry.json, clear inbox.txt

2. For each registry entry:
   a. Fetch current content (by type: direct / excel-manifest / search)
   b. For excel-manifest: extract all SharePoint URLs from content, process each as sub-doc
   c. Diff against snapshot

3. For each changed paragraph in the diff:
   a. Classify: CLEAR or AMBIGUOUS
   b. CLEAR → apply scoped edit in product codebase
   c. AMBIGUOUS → append to docs/watch/flags/<product>.md with:
      - Exact changed text (before / after)
      - Why it was flagged as ambiguous
      - Suggested action for Romit

4. Update snapshots for all processed docs

5. If any file was changed: git commit
   Message: "chore(prd-sync): YYYY-MM-DD — N clear changes, N flagged"
```

### 3.6 Inbox auto-discovery

When an `excel-manifest` entry surfaces a Word doc URL not yet in the registry:
- Auto-register it with `type: "direct"`
- Add a note to `docs/watch/flags/<product>.md`: "New doc auto-discovered from [excel label] — now watching"

---

## 4. System 2 — Doc Watcher UI

### 4.1 Location and access

```
tools/doc-watcher/          ← standalone Next.js app
```

Launch:
```bash
pnpm --filter doc-watcher dev   # runs at localhost:3002
```

Added to workspace `turbo.json` `dev` task so it starts alongside other dev servers.

### 4.2 Interface

```
┌─────────────────────────────────────────────────────────────┐
│  Doc Watcher                                    🟢 3 watching│
├─────────────────────────────────────────────────────────────┤
│  Paste links (one or many)                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ https://exxatsystems-my.sharepoint.com/...            │  │
│  │ https://exxatsystems-my.sharepoint.com/...            │  │
│  └───────────────────────────────────────────────────────┘  │
│  [ Check Links ]                                            │
├─────────────────────────────────────────────────────────────┤
│  Results                                                    │
│  ✅ Already watching — PCE PRD (Monil Pokar)               │
│  ➕ New — Assessment Builder PRD · exam-management  [Add]  │
│  ➕ New — unknown doc · unresolved product          [Add]  │
├─────────────────────────────────────────────────────────────┤
│  Currently watching                                         │
│  PCE PRD — Monil Pokar       pce       last synced: today  │
│  Exam Roadmap — Nipun      exam-mg     last synced: today  │
│  Assessment Builder — Nipun exam-mg    last synced: May 14 │
│                                                  [Remove]  │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Behaviour

- **Check Links:** Parse pasted text for SharePoint URLs (regex), cross-reference against `registry.json`
- **✅ Already watching:** Show matched entry label and product — no action needed
- **➕ New:** Show "Add" button — on click, resolve the URL to a SharePoint URI via M365 search, read doc title, infer product from path (folder keywords: `Post Course`, `PCE` → `pce`; `Exam Management`, `Assessment` → `exam-management`; unresolved → prompt Romit to pick from a dropdown), write entry to `registry.json`
- **Remove:** Mark entry inactive in registry (keep snapshot for audit trail, stop syncing)

### 4.4 Storage backend — GitHub API (works both locally and on Vercel)

`registry.json`, `updates-log.json`, `flags/*.md`, and `digest-latest.md` all live in the git repo. The Doc Watcher UI reads and writes them via the **GitHub REST API** — not the local filesystem — so the same code runs identically on `localhost:3002` and on Vercel.

**Auth:** A GitHub fine-grained PAT scoped to this repo (`contents: read/write`) stored as:
- Local: `.env.local` → `GITHUB_PAT=ghp_...` + `GITHUB_REPO=soleyromit/Work`
- Vercel: environment variable set via Vercel dashboard (or `vercel env add`)

**Read flow:**
```
GET https://api.github.com/repos/{owner}/{repo}/contents/docs/watch/registry.json
→ base64-decode content field → parse JSON
```

**Write flow (add/remove entry):**
```
PUT https://api.github.com/repos/{owner}/{repo}/contents/docs/watch/registry.json
body: { message: "chore(watch): register [doc label]", content: base64(newJson), sha: existingFileSha }
→ commits directly to main branch
```

The `sha` field (required by GitHub API for updates) is retrieved from the same GET call that reads the file. No merge conflicts possible — registry writes are serialised through the UI, never concurrent.

**Scheduled agent (local):** Continues to read/write filesystem directly — it runs in the Claude Code session on Romit's machine where the repo is checked out. After writing, it runs `git pull` before committing to pick up any registry changes made via the UI on Vercel.

**Access:** Deploy `tools/doc-watcher/` to Vercel as its own project. Accessible from any device at the Vercel URL. No separate database, no extra infrastructure — the git repo is the database.

---

## 5. System 3 — Pattern + Compliance Doc

### 5.1 Location

```
apps/pce/docs/patterns/pce-ui-patterns.md           ← PCE
apps/exam-management/docs/patterns/ui-patterns.md   ← Exam Management
```

Per-product. Shared workspace patterns stay in `docs/patterns/admin/`. Product doc references workspace docs, does not duplicate them.

Loaded automatically at session start via product `CLAUDE.md` — same pattern as `ds-adoption.md`.

### 5.2 Structure

#### Page Shell Anatomy
Exact header structure used in every PCE list page:
- `<header>` padding: `18px 28px 14px`, `border-b border-border`, `shrink-0`
- `SidebarTrigger` + `Separator orientation="vertical" className="h-4"` + `<h1>`
- `<h1>` : `text-[22px] font-normal`, `style={{ fontFamily: 'var(--font-heading)' }}`
- Primary CTA: `Button variant="default" size="sm"` at far right
- Content area: `flex-1 overflow-auto`, `paddingBlock: 16`, `paddingInline: 0`

#### DataTable Conventions
- Flat row type extending `Record<string, unknown>` — sortable fields are real scalar properties
- `getRowId` always provided
- `selectable` and `searchable` on by default for all list pages
- Status grouping: `defaultGroupBy="status"` + `GROUP_ORDER` + `GROUP_LABELS` — Aarti's rule: active buckets first, closed last
- Never use raw `<table>` outside `components/data-table/`

#### Interaction Patterns
- Row click: `window.location.href` (not `router.push` — avoids React hydration issues in current setup)
- Link cells: always `onClick={(e) => e.stopPropagation()}` to prevent row click conflict
- Row actions: `DropdownMenu modal={false}` — required, not optional (see accessibility below)
- Drawer trigger: always a DS `Button`, never a raw `<div onClick>`

#### Empty State Formula
```tsx
<div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
  <i className="fa-light fa-[icon] text-muted-foreground" aria-hidden="true" style={{ fontSize: 40 }} />
  <div className="flex flex-col gap-1">
    <p className="text-sm font-medium">{hasFilters ? 'No X match these filters' : 'No X yet'}</p>
    <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>...</p>
  </div>
  {!hasFilters && <Button variant="default" size="sm" onClick={onCreate}>...</Button>}
</div>
```
CTA shown only when no filters are active — never when empty-because-filtered.

#### DS Component Map (PCE-specific)
| Use case | Component |
|---|---|
| Survey / template status | `SurveyStatusBadge` (local, wraps DS `Badge`) |
| Response rate display | `ResponseGauge` (local hand-roll — documented) |
| Section chips on template | `TemplateSectionChips` (local, wraps DS `Badge`) |
| Date inputs (deadline, term dates) | DS `DatePickerField` — never `<Input type="date">` |
| Instructor avatar | DS `Avatar` + `AvatarFallback` with `--avatar-initials-bg` / `--avatar-initials-fg` tokens |
| KPI row | Vendored `KeyMetrics` from `components/key-metrics/` |

#### Token Conventions (PCE actively uses)
`--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, `--brand-color`, `--primary`, `--primary-foreground`, `--destructive`, `--ring`, `--radius`, `--control-height`, `--control-height-sm`, `--font-heading`, `--avatar-initials-bg`, `--avatar-initials-fg`

#### Guardrails
- No toast — `LocalBanner` only for feedback
- No `opacity-60` on a parent containing `text-muted-foreground` — drops contrast below 4.5:1
- No raw hex or oklch in component files — `var(--token)` only
- No `<button>` — always DS `Button` with explicit `variant` and `size`
- No `window.location.href` outside row click handlers

---

### 5.3 Accessibility Checks (WCAG 2.1 AA — full)

Every check includes: **rule → SC reference → consequence if violated → how I verify**.

| Check | SC | Consequence | Verification |
|---|---|---|---|
| All FA icons `aria-hidden="true"` | 4.1.2 | Screen reader announces icon class names as content — noise that breaks navigation | Grep for `fa-` without `aria-hidden` |
| All icon buttons have `aria-label` | 4.1.2 | Icon-only button is announced as unlabelled — unusable by screen reader | Grep for `size="icon"` or `size="icon-sm"` without `aria-label` |
| `DropdownMenu modal={false}` | 4.1.2 | Radix `hideOthers` sets `aria-hidden` on sidebar while menu open — axe `aria-hidden-focus` violation | axe-core in visual-check |
| Focus visible at all zoom levels | 2.4.7 | Keyboard users lose position at 200%+ zoom | Playwright zoom test |
| 400% zoom / reflow — no horizontal scroll | 1.4.10 | Fails VPAT certification — blocks enterprise procurement; WCAG 2.1 AA mandatory since 2018 | Playwright at 320px viewport width |
| Text spacing override — no content loss | 1.4.12 | Content clipped when OS spacing increased — affects dyslexic users | Playwright with injected spacing CSS |
| Color contrast 4.5:1 normal / 3:1 large + UI | 1.4.3, 1.4.11 | ADA Title III lawsuit exposure; `--muted-foreground` on dense cells is borderline | axe-core + manual spot-check on data cells |
| Touch targets 44×44px | 2.5.5 | WCAG failure on mobile — institutions require mobile compliance; `icon-sm` buttons may fall short | Visual check at mobile viewport |
| Dynamic content — `aria-live` regions | 4.1.3 | Survey submission confirmation, status changes silent to screen reader | Grep for state transitions without `aria-live` |
| Semantic table structure | 1.3.1 | DataTable headers not associated with data cells — screen reader cannot navigate by column | axe-core |
| Form validation — `aria-invalid` + `FieldError` | 1.3.1, 3.3.1 | Error not announced to screen reader on submit | Code review on every form |

**Architecture change:** Add 400% zoom (320px viewport) test and text-spacing injection to `tools/visual-check/interactions.mjs`. These run automatically after any UI-touching change.

---

### 5.4 FERPA Compliance

Exxat serves institutions subject to FERPA (20 U.S.C. § 1232g). Violations risk loss of federal funding eligibility for client institutions — a direct threat to Exxat contracts.

| Rule | Consequence | Architecture enforcement |
|---|---|---|
| No student identifier linked to a survey response in the same render | Federal audit failure, institutional fines, loss of Title IV funding eligibility | API strips student ID before response reaches client — UI cannot be the only guard |
| Faculty sees only courses they are assigned to | Unauthorised access to educational records — FERPA breach | Role filter enforced server-side; UI hide/show is secondary and not sufficient |
| Minimum N threshold (currently 5) before results shown to anyone | Students individually identifiable below threshold | Enforced at data layer — UI warning is a secondary signal, not the enforcement point |
| PDF/export contains no student names linked to answers | Exportable FERPA breach — paper trail of violation | Export API strips identifiers server-side before generating |
| Admin audit trail (flagged responses) never exposed to faculty | Role boundary violation | Separate API endpoints per role — not filtered views of the same endpoint |

**Architecture change:** Add FERPA data-flow assertion to `scripts/ds-adoption-audit.py` — any component that receives `studentId` or `studentName` alongside `responseText` in the same prop tree is flagged at pre-commit.

---

### 5.5 HIPAA Considerations

Exxat serves health professions programs. Clinical rotation surveys may touch patient interactions — making some free-text responses potentially PHI-adjacent. Violations: $100–$50,000 per incident, criminal charges for wilful neglect.

| Rule | Consequence | Architecture enforcement |
|---|---|---|
| Clinical course free-text responses stored encrypted, never logged in plaintext | PHI exposure — HIPAA Safe Harbor breach | Storage layer responsibility; UI must not display raw response text outside the moderation screen |
| Template creation for clinical surveys cannot include patient name/DOB/MRN question types | PHI collection without authorisation | Question type allowlist enforced at template creation — clinical survey type restricts available field types |
| Deletion UI warns that HIPAA 7-year retention applies before allowing removal | Regulatory retention violation | Warning rendered before any destructive action on survey data |
| Free-text AI analysis (Phase 2) runs on anonymised text only | PHI processed by AI without authorisation | AI pipeline requirement — flagged in PRD watcher if Phase 2 AI scope changes |

---

### 5.6 Compliance Reviewer Subagent

A new subagent: `.claude/agents/compliance-reviewer.md`

Runs automatically alongside `verification-reviewer` after any UI-touching change. Checks:
1. WCAG 2.1 AA violations (from the table above)
2. FERPA data-flow violations
3. HIPAA classification risks

Returns: **GREENLIGHT** or **NEEDS-MORE** with:
- Exact regulation cited (SC number, FERPA section, HIPAA rule)
- Consequence in plain language
- Whether fix is UI-level (quick) or architecture-level (escalate)

This replaces Romit needing to ask "did you check compliance?" — it runs every time.

---

## 6. Self-Check Routine

### 6.1 Weekly compliance sweep (scheduled, every Monday 8am)

A separate scheduled agent — distinct from the PRD watcher — that proactively audits the full codebase. Does not wait for a file to be touched.

**Scope:** All `.tsx` pages and components under `apps/pce/admin/` and `apps/exam-management/admin/`.

**What it checks:**
- Every WCAG 2.1 AA rule in §5.3 (grep-verifiable rules run as grep; Playwright-verifiable rules run `tools/visual-check/run.mjs` and `interactions.mjs`)
- Every FERPA data-flow rule in §5.4
- Every HIPAA classification rule in §5.5

**Output:** Writes `docs/watch/compliance-report.md` — overwritten each run, not appended.

**Report format:**
```
# Compliance Report — 2026-05-19

## Summary
P1 (blocks release): 2
P2 (fix before next audit): 5
P3 (advisory): 3
Previously known, now resolved: 1

## P1 Violations
### [pce] aria-label missing on icon buttons
Files: apps/pce/admin/app/(app)/surveys/page.tsx:198
Rule: WCAG 4.1.2
Consequence: Icon-only button announced as unlabelled — unusable by screen reader
Fix level: UI (quick)
First seen: 2026-05-19
Status: open

## P2 Violations
...

## Resolved since last report
...
```

### 6.2 Violation inventory

`docs/watch/violation-inventory.json` — machine-written, never hand-edited.

Each violation has:
```json
{
  "id": "pce-wcag-412-icon-btn-surveys",
  "product": "pce",
  "file": "apps/pce/admin/app/(app)/surveys/page.tsx",
  "line": 198,
  "rule": "WCAG 4.1.2",
  "severity": "P1",
  "consequence": "Icon-only button unlabelled",
  "fixLevel": "ui",
  "firstSeen": "2026-05-19",
  "lastSeen": "2026-05-19",
  "status": "open"
}
```

**Status lifecycle:** `open` → `fixed` (agent verifies the grep/axe check no longer fires) → removed from inventory after 2 clean sweeps.

**Deduplication:** Violations matched by `file` + `rule` + `line` — same issue in the same place is one record, not a new entry each week.

### 6.3 Severity tiers

| Tier | Definition | Expectation |
|---|---|---|
| **P1** | Blocks release — FERPA/HIPAA violation, WCAG failure that makes a flow inaccessible, or data exposure risk | Fix before next deploy |
| **P2** | Advisory — WCAG failure that degrades but doesn't block access, pattern inconsistency with user-facing impact | Fix before next compliance audit |
| **P3** | Nice-to-have — minor token inconsistency, cosmetic pattern drift, future-proofing suggestion | Fix when touching the file anyway |

### 6.4 First-run bootstrapping

When the PRD watcher runs against a doc with no existing snapshot:
1. Write the full current content to `snapshots/<id>.txt`
2. Write a bootstrap notice to `flags/<product>.md`: "First snapshot taken for [label] — no diff applied. Next run will detect real changes."
3. Stop — do not classify or edit anything

This prevents the entire doc from being treated as a diff on first run.

### 6.5 Auth expiry handling

At the start of every agent run (both PRD watcher and compliance sweep):
1. Attempt a lightweight M365 call (search for one known doc)
2. If it fails: write to `docs/watch/flags/system.md` — "AUTH FAILURE: M365 auth expired on YYYY-MM-DD HH:MM. PRD watcher did not run. Re-authenticate in Claude Code to resume."
3. Abort the run — do not proceed with stale or missing data

### 6.6 Morning digest

After the PRD watcher completes each morning, write `docs/watch/digest-latest.md` (overwritten, not appended):

```
# PRD Watcher Digest — 2026-05-19 09:00

## Changes applied
- pce: Renamed status "Needs Action" → "Pending Review" in GROUP_LABELS (surveys/page.tsx)

## Flagged for your review
- pce: §4.6 Longitudinal Insights still says "In Progress" — skipped
- exam-management: Dependency on FAAS backend mentioned — skipped

## FERPA/HIPAA alerts
None today.

## New docs auto-discovered
- exam-management: "Q3 Roadmap Update" found in Nipun's Excel — now watching

## Auth status
✅ M365 authenticated — all 3 docs synced successfully
```

At session start in any product app, I read `docs/watch/digest-latest.md` automatically and surface any P1 violations or FERPA/HIPAA alerts before doing anything else.

### 6.7 Pattern doc update trigger

When a new pattern is established during a session (verified, approved by Romit, committed):
- I update `apps/<product>/docs/patterns/<product>-ui-patterns.md` in the same commit
- Pattern entry format: section it belongs to + the exact rule + a one-line "why" (constraint or prior incident)
- If the pattern overrides a previous entry, the old entry is removed — no accumulation of contradictions

---

## 7. Interaction Between Systems

```
PRD changes on SharePoint
        ↓
Daily watcher agent reads + diffs
        ↓
CLEAR change → edit code + check compliance-reviewer on changed files
AMBIGUOUS change → append to docs/watch/flags/<product>.md
        ↓
Commit with summary
        ↓
Romit reviews flags at his pace — no urgency unless flagged as FERPA/HIPAA risk
```

```
Romit pastes links into Doc Watcher UI (localhost:3002)
        ↓
UI validates against registry → ✅ duplicate or ➕ new
        ↓
Add → resolve URI → read doc title → infer product → write to registry.json
        ↓
Picked up by watcher agent on next morning run
```

```
Any UI-touching change in session
        ↓
verification-reviewer + compliance-reviewer run together
        ↓
GREENLIGHT → claim done
NEEDS-MORE → list violations with regulation + consequence + fix level
        ↓
Fix → re-run → GREENLIGHT
        ↓
If new pattern established → update pce-ui-patterns.md in same commit
```

```
Every Monday 8am — compliance sweep agent
        ↓
Runs grep + axe-core + Playwright (400% zoom, text-spacing) across all pages
        ↓
Diffs against violation-inventory.json
        ↓
New violations → added to inventory (P1/P2/P3)
Previously open violations now clean → marked "fixed"
        ↓
Writes compliance-report.md (overwrite) + updates violation-inventory.json
        ↓
Session start on Monday → digest-latest.md surfaces P1s and FERPA/HIPAA alerts first
```

---

## 7. System 4 — Updates Feed

### 7.1 What it is

A structured, browsable timeline of every design and product change — PRD updates applied, compliance violations found or fixed, new docs registered, pattern changes — grouped by day or week, filterable by product, accessible in two places:

1. **In the Doc Watcher UI** (`localhost:3002/updates`) — full cross-product view
2. **In each product app** — "What's New" entry at the bottom of the sidebar, opens a Sheet panel with that product's updates only

Inspired by: Spline (date-grouped timeline), Google Gemini ("What + Why" per entry), Amie ("What's New" in settings sidebar with weekly grouping).

### 7.2 Data source

`docs/watch/updates-log.json` — appended by every agent run. Never overwritten.

```json
{
  "entries": [
    {
      "id": "2026-05-19-pce-001",
      "date": "2026-05-19",
      "product": "pce",
      "type": "prd-change",
      "title": "Status label renamed: 'Needs Action' → 'Pending Review'",
      "what": "GROUP_LABELS updated in surveys/page.tsx. Badge text and group header now read 'Pending Review'.",
      "why": "PRD §4.4 updated by Monil — admin moderation step renamed to clarify it is a review gate, not an action queue.",
      "source": "PCE PRD — Monil Pokar",
      "severity": null,
      "files": ["apps/pce/admin/app/(app)/surveys/page.tsx"]
    },
    {
      "id": "2026-05-19-pce-002",
      "date": "2026-05-19",
      "product": "pce",
      "type": "compliance-violation",
      "title": "P1: Icon buttons missing aria-label on surveys page",
      "what": "3 DropdownMenuTrigger buttons have no aria-label — announced as unlabelled to screen readers.",
      "why": "WCAG 4.1.2 — icon-only interactive elements must have accessible name.",
      "source": "Weekly compliance sweep",
      "severity": "P1",
      "files": ["apps/pce/admin/app/(app)/surveys/page.tsx"]
    }
  ]
}
```

**Entry types:**

| Type | Colour in UI | Triggered by |
|---|---|---|
| `prd-change` | Blue | PRD watcher applies a clear change |
| `prd-flagged` | Amber | PRD watcher flags an ambiguous change |
| `compliance-violation` | Red (P1) / Amber (P2) / Grey (P3) | Weekly compliance sweep finds new violation |
| `compliance-resolved` | Green | Compliance sweep marks a violation fixed |
| `new-doc` | Purple | New SharePoint doc registered via inbox or Excel manifest |
| `pattern-update` | Teal | Pattern doc updated mid-session with new rule |
| `claude-correction` | Orange | Romit identified a mistake Claude made — what was wrong, what was fixed |

### 7.3 Doc Watcher UI — `/updates` route

```
┌─────────────────────────────────────────────────────────────────┐
│  Updates          [ All products ▾ ]  [ This week ▾ ]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ● TODAY — 19 May 2026                         LATEST          │
│  │                                                             │
│  │  🔵 PCE · PRD Change                                       │
│  │  Status label renamed: 'Needs Action' → 'Pending Review'   │
│  │  What: GROUP_LABELS updated in surveys/page.tsx            │
│  │  Why:  PRD §4.4 — Monil renamed moderation step            │
│  │  surveys/page.tsx                            [View diff]   │
│  │                                                             │
│  │  🔴 PCE · P1 Compliance                                    │
│  │  Icon buttons missing aria-label on surveys page           │
│  │  What: 3 buttons unlabelled for screen readers             │
│  │  Why:  WCAG 4.1.2 — icon-only elements need accessible name│
│  │  Consequence: Unusable by screen reader — fix before deploy │
│  │  surveys/page.tsx                            [Open file]   │
│  │                                                             │
│  ● 12 May 2026                                                  │
│  │                                                             │
│  │  🟣 EXAM · New Doc                                         │
│  │  Auto-discovered: Q3 Roadmap Update from Nipun's Excel     │
│  │  Now watching.                                             │
│  │                                                             │
│  ● 5 May 2026                                                   │
│  │  ...                                   [ Load older ]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Filter by product (All / PCE / Exam Management / ...)
- Filter by time (Today / This week / This month / All time)
- Filter by type (All / PRD changes / Compliance / New docs)
- "View diff" — shows before/after of the changed code inline
- "Open file" — opens the file path in the terminal (macOS `open` command)
- P1 violations shown with red left border — visually distinct even at a glance

### 7.4 In-product browser console — dev-only injection

No UI element in the product app. Instead, each product app injects a dev-only script (guarded by `process.env.NODE_ENV === 'development'`) that:

1. On page load, hits a local API route `/api/dev/updates?product=pce` which reads `docs/watch/updates-log.json`
2. If there are unread P1 violations or PRD changes since yesterday, prints a one-line prompt to the console:

```
🔔 Exxat · 3 updates this week (1 P1 compliance, 2 PRD changes)
   → __updates() to browse  |  __updates('today') for today only
```

3. Registers `__updates(filter?)` as a global function in the browser window — callable anytime from DevTools Console while on any page of the product:

```
> __updates()

┌─ EXXAT UPDATES · PCE · Last 7 days ──────────────────────────┐
│                                                               │
│  🔴 P1 COMPLIANCE · 2026-05-19                               │
│  aria-label missing on 3 icon buttons                        │
│  What: DropdownMenuTrigger buttons announced as unlabelled    │
│  Why:  WCAG 4.1.2 — icon-only elements need accessible name  │
│  Fix:  UI-level (quick)                                      │
│  File: app/(app)/surveys/page.tsx                            │
│                                                               │
│  🔵 PRD CHANGE · 2026-05-19                                  │
│  Status renamed: 'Needs Action' → 'Pending Review'           │
│  What: GROUP_LABELS updated in surveys/page.tsx              │
│  Why:  PRD §4.4 — Monil renamed moderation step             │
│                                                               │
│  🟡 PRD FLAGGED · 2026-05-18                                 │
│  §4.6 Longitudinal Insights still "In Progress" — skipped    │
│                                                               │
└──────────────────────────── __updates('pce','today') ────────┘
```

**Available filters:**
```js
__updates()                   // all products, last 7 days
__updates('pce')              // PCE only, last 7 days
__updates('pce', 'today')     // PCE today only
__updates('all', 'week')      // all products this week
__updates('all', 'month')     // full month
```

**Why console and not UI:** Zero product pollution — no button, badge, or panel adds visual noise to the prototype. When cross-referencing, you open DevTools (already open for inspection), call `__updates()`, and the feed is right there alongside the Elements/Network panels. Dismisses naturally when DevTools closes.

**Implementation:** A small `app/dev-updates.ts` module (tree-shaken in production) that fetches the log and formats output using `console.group`, `console.groupEnd`, and `%c` styled strings. The `/api/dev/updates` route is disabled in production via a `NODE_ENV` guard.

### 7.5 Claude correction log

When Romit points out a mistake and a fix is applied mid-session, I write a `claude-correction` entry to `updates-log.json` in the same commit as the fix:

```json
{
  "id": "2026-05-17-claude-001",
  "date": "2026-05-17",
  "product": "pce",
  "type": "claude-correction",
  "title": "Wrong: DataTable wrapped in extra overflow container",
  "what": "Added overflow-x-auto wrapper around DataTable — DS component already wraps internally. Removed the extra wrapper.",
  "why": "Romit pointed out double scroll container. Root cause: didn't read Table source before writing JSX.",
  "source": "Romit (session correction)",
  "severity": null,
  "files": ["apps/pce/admin/app/(app)/surveys/page.tsx"]
}
```

**Browsable at:**
- Doc Watcher UI `/updates` — filter by type `claude-correction` to see the full correction history
- Console: `__updates('corrections')` — all corrections across products
- Console: `__updates('pce', 'corrections')` — PCE corrections only

**Also cross-linked to:**
- The existing `docs/governance/verification-discipline.md` log — correction entries reference the discipline log entry by line number
- The memory system — the same incident is saved as a `feedback` memory so it doesn't recur

**Why this matters:** Over time, the correction log becomes a pattern of where Claude consistently makes mistakes — which is the input the `architect` subagent uses to propose new governance rules. The log is the evidence trail.

### 7.6 What counts as a prompt-worthy update (triggers the one-liner on load)

- Any `prd-change` dated today or yesterday
- Any `compliance-violation` with severity P1, status open
- New `new-doc` entries from the last 24 hours

P2/P3 violations and `prd-flagged` entries appear in `__updates()` output but do not trigger the load-time one-liner — they are visible on demand, not on every page load.

---

## 8. Files Created / Modified

| File | Action |
|---|---|
| `docs/watch/registry.json` | Create — workspace PRD watch registry |
| `docs/watch/inbox.txt` | Create — empty, drop-in URL inbox |
| `docs/watch/flags/pce.md` | Create — ambiguous delta log for PCE |
| `docs/watch/flags/exam-management.md` | Create — ambiguous delta log for Exam Management |
| `docs/watch/flags/system.md` | Create — auth failure + system error log |
| `docs/watch/updates-log.json` | Create (agent-written) — append-only log of all design/product changes |
| `docs/watch/digest-latest.md` | Create (agent-written) — morning PRD watcher digest |
| `docs/watch/compliance-report.md` | Create (agent-written) — weekly full compliance sweep report |
| `docs/watch/violation-inventory.json` | Create (agent-written) — persistent violation tracker with severity + status |
| `tools/doc-watcher/` | Create — standalone Next.js tool, localhost:3002 + deployed to Vercel |
| `tools/doc-watcher/lib/github-storage.ts` | Create — GitHub REST API read/write for registry.json, updates-log.json, flags |
| `tools/doc-watcher/.env.local` | Create — GITHUB_PAT + GITHUB_REPO for local dev (gitignored) |
| `apps/pce/docs/patterns/pce-ui-patterns.md` | Create — PCE pattern + compliance reference |
| `apps/exam-management/docs/patterns/ui-patterns.md` | Create — Exam Management pattern + compliance reference |
| `.claude/agents/compliance-reviewer.md` | Create — compliance subagent |
| `tools/visual-check/interactions.mjs` | Modify — add 400% zoom + text-spacing tests |
| `scripts/ds-adoption-audit.py` | Modify — add FERPA data-flow assertion |
| `apps/pce/CLAUDE.md` | Modify — auto-load `pce-ui-patterns.md` + digest-latest at session start |
| `apps/exam-management/CLAUDE.md` | Modify — auto-load `ui-patterns.md` + digest-latest at session start |
| `apps/pce/admin/app/dev-updates.ts` | Create — dev-only console injection, tree-shaken in production |
| `apps/pce/admin/app/api/dev/updates/route.ts` | Create — local API route serving updates-log.json, disabled in production |
| `apps/exam-management/admin/app/dev-updates.ts` | Create — same |
| `apps/exam-management/admin/app/api/dev/updates/route.ts` | Create — same |
| Scheduled routine (daily 9am) via `/schedule` | Create — PRD watcher + morning digest |
| Scheduled routine (Monday 8am) via `/schedule` | Create — weekly compliance sweep |

---

## 8. Out of Scope

- Student-facing survey UI compliance (separate product, separate audit)
- HIPAA BAA (Business Associate Agreement) — legal/contracting concern, not UI
- Phase 2 AI analysis pipeline — flagged but not designed here
- Automated FERPA penetration testing — security team scope
- `inbox.txt` local-only fallback — superseded by GitHub API backend; Vercel UI is the registration path from any device
