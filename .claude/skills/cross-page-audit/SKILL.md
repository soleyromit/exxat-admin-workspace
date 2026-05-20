---
name: cross-page-audit
description: Use when a UI pattern is fixed on one page to immediately check all sibling pages for the same issue. Catches the recurring failure mode where a fix is applied to page A but the same bug exists on pages B, C, D. Invoked with `/cross-page-audit <pattern> [<fixed-file>]`.
---

# Cross-Page Consistency Audit

When you fix a UI pattern on one page, immediately audit all sibling entity-detail pages and list pages in the same product for the exact same issue. This prevents the recurring pattern: fix page A, miss pages B-D, user finds it in the next session.

## When to invoke

- Any time you fix a visual or structural pattern on one entity-detail page
- Any time the user says "this is wrong" and you realise the same issue exists on other pages
- Proactively: BEFORE claiming a fix is done, run this to confirm the fix is complete platform-wide

## The entity-detail family in exam-management/admin

These pages are siblings — every pattern change on one MUST be audited on all:

| Page | File |
|---|---|
| Student detail | `app/(app)/students/[id]/student-detail-client.tsx` |
| Faculty detail | `app/(app)/faculty/[id]/faculty-detail-client.tsx` |
| Course offering detail | `app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx` |
| Course detail (master) | `app/(app)/courses/[id]/` tabs directory |
| Assessment detail | `app/(app)/assessments/[id]/assessment-landing-client.tsx` |

List pages that share toolbar/DataTable patterns:

| Page | File |
|---|---|
| Students list | `app/(app)/students/students-client.tsx` |
| Faculty list | `app/(app)/faculty/faculty-client.tsx` |
| Courses list | `app/(app)/courses/courses-client.tsx` |
| Terms list | `app/(app)/terms/terms-client.tsx` |
| Course catalog | `app/(app)/course-catalog/catalog-client.tsx` |

## How to run

### Step 1 — Name the pattern

Extract the exact pattern from the fix just made. Write it as a grep-able signature. Examples:
- "description paragraph above empty state" → grep: `<p className="text-sm text-muted-foreground">` immediately before an empty-state div
- "button div above DataTable" → grep: `<div className="flex justify-end` directly before `<DataTable`
- "pt-0 on content wrapper" → grep: `overflow-auto pt-0`
- "toolbarSlot with justify-between w-full" → grep: `justify-between w-full` inside a `toolbarSlot`
- "duplicate count label" → grep: same count variable in both a section `<p>` and a `toolbarSlot`

### Step 2 — Grep the sibling files

Search for the pattern signature across all sibling files. Use:
```bash
grep -n "<pattern>" <sibling-files> | grep -v "node_modules"
```

### Step 3 — Read and verify each hit

Grep hits show line numbers. Read ±10 lines around each hit to confirm it IS the same pattern (not a false positive).

### Step 4 — Fix or report

For each confirmed match:
- If fixable in the same session: fix it immediately (do not defer).
- If requires design decision: surface it as a NEEDS-MORE item with file:line citation.

### Step 5 — Report audit results

```
CROSS-PAGE AUDIT: <pattern name>
─────────────────────────────────
✓ student-detail-client.tsx — CLEAN
✓ faculty-detail-client.tsx — CLEAN  
✗ course-offering-detail-client.tsx:568 — FOUND → fixed
✓ assessments-client.tsx — CLEAN
─────────────────────────────────
Fixed: 1 / Checked: 4
```

## Known recurring patterns — check these every session

These patterns have been found on multiple pages in the past. Run them proactively:

### P1 — Description paragraph above empty state (DUPLICATE MESSAGE)
**Symptom:** A `<p>` description paragraph AND an empty-state box both explain the same feature.
**Grep:** files containing both a `<p className="text-sm text-muted-foreground">` and an empty-state div within the same tab component function.
**Fix:** Remove the outer `<p>` — the empty state is self-explanatory. If informational context is needed, use `LocalBanner variant="info"` (DS pattern).

### P2 — Button div above DataTable (WHITESPACE)
**Symptom:** `<div className="flex justify-end...">` with a `<Button>` immediately before `<DataTable`.
**Grep:** `flex justify-end` within ~5 lines before `<DataTable`.
**Fix:** Move button into `toolbarSlot` alongside the count span. Add `showQueryControls={false}`.

### P3 — pt-0 on content wrapper (FLUSH CARD)
**Symptom:** `className="flex-1 overflow-auto pt-0 px-6 pb-6"` — zero gap between tab bar and first card.
**Grep:** `overflow-auto pt-0 px-6`.
**Fix:** Change `pt-0` → `pt-2`.

### P4 — Tab order wrong (OVERVIEW NOT FIRST)
**Symptom:** Entity detail tabs not starting with Overview.
**Grep:** `TabsTrigger` array — first entry is not `value="overview"`.
**Fix:** Reorder tab triggers and content to Overview first.

### P5 — overflow-auto on #main-content (SCROLL CHAIN BREAK)
**Symptom:** `id="main-content"` div uses `overflow-auto` instead of `min-h-0` — breaks inner-tab-scroll pattern.
**Grep:** `id="main-content".*overflow-auto` or `overflow-auto.*id="main-content"`.
**Fix:** Change `overflow-auto` → `min-h-0` to match course-offering pattern.

### P6 — Duplicate count labels (ONE SOURCE OF TRUTH)
**Symptom:** Tab badge shows count AND a `<p>` heading inside the tab content also shows the count.
**Grep:** Same count variable used in both a tab badge and a section heading `<p>` within the same component.
**Fix:** Remove the section heading count. Tab badge = navigation hint. `toolbarSlot` = content count.

### P7 — showQueryControls missing (TOOLBAR WHITESPACE)
**Symptom:** DataTable with `searchable={false}` but no `showQueryControls={false}` — renders tall empty toolbar.
**Grep:** `searchable={false}` without `showQueryControls` in the same DataTable block.
**Fix:** Add `showQueryControls={false}`.

### P8 — DS tab variant missing (NO ACTIVE INDICATOR)
**Symptom:** `TabsList` without `variant="line"` — active underline never renders.
**Grep:** `<TabsList` without `variant="line"`.
**Fix:** Add `variant="line"` to every `TabsList`.

## Usage example

```
/cross-page-audit "description paragraph above empty state" course-offering-detail-client.tsx
```

Claude will:
1. grep for the pattern across all sibling detail pages
2. Read each hit
3. Fix any matches
4. Report the audit table
