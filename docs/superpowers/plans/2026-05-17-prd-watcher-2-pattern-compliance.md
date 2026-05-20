# PRD Watcher — Plan 2: Pattern + Compliance Docs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create per-product pattern and compliance reference docs that Claude reads at session start, a compliance-reviewer subagent, 400% zoom + text-spacing tests in the visual-check tool, and a FERPA data-flow assertion in the pre-commit audit script.

**Architecture:** Two living markdown files (one per product) capture every established UI pattern with consequences for violation. A new `.claude/agents/compliance-reviewer.md` subagent runs alongside `verification-reviewer` after any UI change. The Playwright-based `tools/visual-check/interactions.mjs` gains two new test scenarios. `scripts/ds-adoption-audit.py` gains one new grep rule. Both product CLAUDE.md files are updated to auto-load the pattern doc and digest at session start.

**Tech Stack:** Markdown, Playwright (already in tools/visual-check), Python (already in scripts/), Claude agent definition format.

**Independent of Plan 1** — can be executed in parallel with Plan 3.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/pce/docs/patterns/pce-ui-patterns.md` | Create | PCE-specific patterns, DS map, accessibility, FERPA, HIPAA |
| `apps/exam-management/docs/patterns/ui-patterns.md` | Create | Exam Management patterns (lighter — fewer shipped pages) |
| `.claude/agents/compliance-reviewer.md` | Create | Subagent: post-change compliance check |
| `tools/visual-check/interactions.mjs` | Modify | Add 400% zoom + text-spacing injection tests |
| `scripts/ds-adoption-audit.py` | Modify | Add FERPA data-flow assertion |
| `apps/pce/CLAUDE.md` | Modify | Auto-load pce-ui-patterns.md + digest-latest at session start |
| `apps/exam-management/CLAUDE.md` | Modify | Auto-load ui-patterns.md + digest-latest at session start |

---

### Task 1: Create `apps/pce/docs/patterns/pce-ui-patterns.md`

**Files:**
- Create: `apps/pce/docs/patterns/pce-ui-patterns.md`

This doc is populated by reading the actual PCE codebase — not invented. Every rule cites its source file.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /Users/romitsoley/Work/apps/pce/docs/patterns
```

- [ ] **Step 2: Write `pce-ui-patterns.md`**

```markdown
# PCE Admin — UI Patterns + Compliance Reference

> Living doc. Read at session start via CLAUDE.md. Updated in the same commit whenever a new pattern is established.
> Last extracted from codebase: 2026-05-17.

---

## 1. Page Shell Anatomy

Every PCE list page uses this exact structure. Do not deviate.

```tsx
// Header — always first child of the page root
<header
  className="flex items-center gap-2 border-b border-border shrink-0"
  style={{ padding: '18px 28px 14px' }}
>
  <SidebarTrigger className="-ms-1" />
  <Separator orientation="vertical" className="h-4" />
  <h1
    className="flex-1 text-[22px] font-normal"
    style={{ fontFamily: 'var(--font-heading)' }}
  >
    Page Title
  </h1>
  <Button variant="default" size="sm" onClick={...}>
    <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
    Primary Action
  </Button>
</header>

// Content area — always flex-1 overflow-auto
<div className="flex-1 overflow-auto" style={{ paddingBlock: 16, paddingInline: 0 }}>
  ...
</div>
```

Source: `apps/pce/admin/app/(app)/surveys/page.tsx`, `templates/page.tsx`, `moderation/page.tsx`

**What NOT to do:**
- Never use `p-6` or Tailwind padding classes on the header — inline style only (pixel-precise per design spec)
- Never put a secondary CTA before the primary CTA — primary always at far right
- Never use `<h2>` or `<h3>` as the page title — always `<h1>`

---

## 2. DataTable Conventions

Source: `apps/pce/admin/components/data-table/index.tsx`

### Row type pattern
```typescript
// Always extend Record<string, unknown> — required by DataTable generic constraint
// Sortable fields MUST be real scalar properties (DataTable sorts by TData key directly)
interface SurveyRow extends Record<string, unknown> {
  id: string          // used by getRowId
  survey: PceSurvey   // source object for renderers
  courseCode: string  // sortable scalar
  status: SurveyStatus // sortable scalar
  responseRate: number // sortable scalar
}
```

### ColumnDef pattern
```typescript
const columns: ColumnDef<SurveyRow>[] = [
  {
    key: 'courseCode',     // must match a real property on the row type
    label: 'Course',       // column header text
    sortable: true,        // omit = not sortable
    width: 200,            // always provide — prevents layout shift
    cell: (row) => (...),  // render function
  },
  // Actions column — always last, no label, width 44
  {
    key: 'actions',
    label: '',
    width: 44,
    cell: (row) => <RowActions ... />,
  },
]
```

### DataTable props
```tsx
<DataTable<SurveyRow>
  data={rows}
  columns={columns}
  getRowId={(row) => row.id}   // always provide
  selectable                    // always on for list pages
  searchable                    // always on for list pages
  defaultGroupBy="status"       // when status grouping applies
  groupLabels={GROUP_LABELS}
  groupOrder={GROUP_ORDER}
  onRowClick={(row) => { window.location.href = `/surveys/${row.survey.id}` }}
/>
```

### Status grouping — Aarti's rule
```typescript
// Active buckets first, closed at the bottom — non-negotiable
const GROUP_ORDER: SurveyStatus[] = ['pending_review', 'collecting', 'active', 'draft', 'released', 'closed']
const GROUP_LABELS: Record<SurveyStatus, string> = {
  pending_review: 'Needs Action',
  collecting:     'Collecting',
  active:         'Active',
  draft:          'Draft',
  released:       'Shared with Faculty',
  closed:         'Closed',
}
```

**What NOT to do:**
- Never use raw `<table>` — always the vendored `DataTable` from `components/data-table/`
- Never use a third-party grid (ag-Grid, TanStack Table directly) — DS DataTable wraps TanStack
- Never put non-scalar objects as sortable columns — the sort breaks silently

---

## 3. Interaction Patterns

### Row click
```typescript
// Use window.location.href — not router.push
// router.push causes hydration mismatch in the current Next.js setup
onRowClick={(row) => { window.location.href = `/surveys/${row.survey.id}` }}
```

### Link cells inside a row-clickable table
```tsx
// Always stopPropagation — otherwise link click also fires the row click
<Link
  href={`/surveys/${row.survey.id}`}
  className="font-medium hover:underline text-sm"
  onClick={(e) => e.stopPropagation()}
>
  {row.survey.courseCode}
</Link>
```

### Row actions dropdown
```tsx
// modal={false} is REQUIRED — prevents Radix hideOthers from setting
// aria-hidden on the sidebar wrapper while the dropdown is open.
// Without this: axe reports aria-hidden-focus violation (confirmed 2026-05-11)
<DropdownMenu modal={false} onOpenChange={setMenuOpen} open={menuOpen}>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Survey actions"   // REQUIRED — icon-only button
      onClick={(e) => e.stopPropagation()}
    >
      <i className="fa-regular fa-ellipsis" aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent
    align="end"
    className="w-44"
    onClick={(e) => e.stopPropagation()}
  >
    ...
  </DropdownMenuContent>
</DropdownMenu>
```

### Drawer / Sheet trigger
- Always a DS `Button` — never a raw `<div onClick>` or `<span onClick>`
- Sheet opens from the right (`side="right"`) unless specified otherwise

---

## 4. Empty State Formula

```tsx
function EmptyState({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {/* Icon: fa-light variant, 40px, muted-foreground color */}
      <i
        className="fa-light fa-[relevant-icon] text-muted-foreground"
        aria-hidden="true"      // decorative — screen reader reads heading instead
        style={{ fontSize: 40 }}
      />
      <div className="flex flex-col gap-1">
        {/* Two states: filtered vs genuinely empty */}
        <p className="text-sm font-medium">
          {hasFilters ? 'No X match these filters' : 'No X yet'}
        </p>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 320 }}>
          {hasFilters
            ? 'Try adjusting your filters.'
            : 'Descriptive one-liner about what to do.'}
        </p>
      </div>
      {/* CTA only when NOT filtered — never show "Create" when filtered empty */}
      {!hasFilters && (
        <Button variant="default" size="sm" onClick={onCreate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create X
        </Button>
      )}
    </div>
  )
}
```

Source: `apps/pce/admin/app/(app)/surveys/page.tsx:EmptySurveys`, `templates/page.tsx:EmptyState`

---

## 5. DS Component Map (PCE-specific)

| Use case | Component | Import |
|---|---|---|
| Survey / template status badge | `SurveyStatusBadge` | `@/components/pce/pce-badges` |
| Response rate display | `ResponseGauge` | `@/components/pce/response-gauge` (hand-roll — documented) |
| Template section chips | `TemplateSectionChips` | `@/components/pce/pce-badges` |
| Date inputs (deadlines, term dates) | `DatePickerField` | `@exxat/ds/packages/ui/src` |
| Instructor avatar | `Avatar` + `AvatarFallback` | `@exxat/ds/packages/ui/src` |
| KPI / analytics row | `KeyMetrics` | `@/components/key-metrics` (vendored) |
| Modals / confirmations | `Dialog` | `@exxat/ds/packages/ui/src` |
| Slide-over forms | `Sheet` | `@exxat/ds/packages/ui/src` |

**Avatar token rule:**
```tsx
// Always use these tokens — never hardcode colors on AvatarFallback
<AvatarFallback
  className="text-xs"
  style={{
    backgroundColor: 'var(--avatar-initials-bg)',
    color: 'var(--avatar-initials-fg)',
  }}
>
  {initials}
</AvatarFallback>
```

---

## 6. Token Conventions (PCE actively uses)

```
--background / --foreground          page surfaces and text
--card / --card-foreground           card surfaces
--muted / --muted-foreground         de-emphasized surfaces and secondary text
--border                             decorative borders
--border-control-3 / --border-control-35  form field borders
--brand-color / --brand-color-dark   interactive accent / hover
--primary / --primary-foreground     CTA buttons
--destructive                        error / delete
--ring                               focus ring
--radius, --radius-sm, --radius-md   border radii
--control-height / --control-height-sm  40px / 32px standard heights
--font-heading                       h1 and display text
--avatar-initials-bg / --avatar-initials-fg  avatar fallback colors
```

Never use hex, rgb, or oklch values in component files. Use `var(--token)` only.

---

## 7. Guardrails

| Banned | Use instead |
|---|---|
| `toast()` / Sonner | `LocalBanner variant="success"` after save |
| `opacity-60` on parent containing `text-muted-foreground` | DS `disabled` prop on the component itself |
| `<button>` | DS `Button` with explicit `variant` and `size` |
| Raw `<table>` | Vendored `DataTable` |
| `<Input type="date">` | DS `DatePickerField` |
| Hex / rgb / oklch in component files | `var(--token)` |
| `window.location.href` outside `onRowClick` | `router.push` or DS `Link` |
| `className="rounded"` on Badge for pill shape | Badge already pills by default; `className="rounded"` makes it rectangular |

---

## 8. Accessibility — WCAG 2.1 AA (Full Checklist)

**Format:** Rule → SC → Consequence if violated → How I verify

| Check | SC | Consequence | Verification method |
|---|---|---|---|
| All FA icons `aria-hidden="true"` | 4.1.2 | Screen reader announces class names as content | Grep: `fa-` without `aria-hidden` in same element |
| All icon-only buttons have `aria-label` | 4.1.2 | Button announced as "button" with no name — unusable | Grep: `size="icon"` or `size="icon-sm"` without `aria-label` |
| `DropdownMenu modal={false}` | 4.1.2 | `aria-hidden` set on sidebar — axe `aria-hidden-focus` violation | axe-core via visual-check |
| Focus visible at 200%+ zoom | 2.4.7 | Keyboard users lose position | Playwright zoom test |
| 400% zoom / reflow (320px viewport) — no horizontal scroll | 1.4.10 | Fails VPAT — blocks enterprise procurement | Playwright 320px viewport test |
| Text spacing override — no content loss | 1.4.12 | Content clipped for dyslexic users with OS spacing | Playwright text-spacing injection |
| Contrast 4.5:1 normal text / 3:1 large + UI | 1.4.3, 1.4.11 | ADA Title III exposure; `--muted-foreground` on data cells borderline | axe-core |
| Touch targets 44×44px | 2.5.5 | WCAG fail on mobile; `icon-sm` buttons at risk | Visual check at 375px viewport |
| Dynamic status changes have `aria-live` | 4.1.3 | Survey submission, status changes silent to screen reader | Grep: state transitions without `aria-live` |
| Semantic table structure | 1.3.1 | Screen reader cannot navigate by column | axe-core |
| Form validation: `aria-invalid` + `FieldError` | 1.3.1, 3.3.1 | Errors not announced on submit | Code review per form |

---

## 9. FERPA Compliance

Exxat client institutions are subject to FERPA (20 U.S.C. § 1232g). UI violations expose Exxat to contract loss.

| Rule | Consequence | Enforcement |
|---|---|---|
| No student identifier + response text in same component render | Federal audit failure, client contract termination | FERPA assertion in `scripts/ds-adoption-audit.py` at pre-commit |
| Faculty sees only their assigned courses | Unauthorized access to educational records | Server-side role filter — UI hide/show is NOT sufficient |
| Results suppressed below N=5 responses | Individual students identifiable below threshold | Data layer enforcement — UI warning is secondary |
| Exports contain no student names linked to answers | Exportable FERPA breach | Export API strips identifiers — never trust UI-only guard |
| Admin audit trail never exposed to faculty | Role boundary violation | Separate API endpoints per role |

---

## 10. HIPAA Considerations

Clinical rotation course surveys may contain PHI-adjacent content. Violations: $100–$50,000 per incident.

| Rule | Consequence | Enforcement |
|---|---|---|
| Free-text clinical responses never displayed outside moderation screen | PHI exposure | Route guard: only admin moderation page renders raw response text |
| Clinical survey templates cannot include patient name/DOB/MRN fields | Unauthorized PHI collection | Question type allowlist at template creation |
| Deletion UI warns about 7-year retention before allowing removal | HIPAA retention violation | Warning component required before any survey data deletion action |

---

## 11. Claude Correction Log Reference

When Romit identifies a mistake in this product, the correction is logged to:
- `docs/watch/updates-log.json` (type: `claude-correction`)
- `docs/governance/verification-discipline.md`
- Claude's memory system (feedback type)

View all PCE corrections: `__updates('pce', 'corrections')` in browser DevTools console.
```

- [ ] **Step 3: Commit**

```bash
git add apps/pce/docs/patterns/pce-ui-patterns.md
git commit -m "docs(pce): add pce-ui-patterns.md — patterns, DS map, a11y, FERPA, HIPAA"
```

---

### Task 2: Create `apps/exam-management/docs/patterns/ui-patterns.md`

**Files:**
- Create: `apps/exam-management/docs/patterns/ui-patterns.md`

- [ ] **Step 1: Create directory**

```bash
mkdir -p /Users/romitsoley/Work/apps/exam-management/docs/patterns
```

- [ ] **Step 2: Write `ui-patterns.md`** — read `apps/exam-management/admin/app/(app)/` pages before writing to extract actual patterns:

```bash
find /Users/romitsoley/Work/apps/exam-management/admin/app -name "*.tsx" | head -20
```

Then write the doc following the same structure as `pce-ui-patterns.md` but populated from the exam-management codebase. Key differences to capture:
- Exam Management has its own sidebar structure (QB, live-monitor, etc.)
- Uses the same DataTable vendor but with different column conventions
- Has `QBView`, `QBViewTop`, `QBViewBottom` component family — document the composition rules
- Document any differences in header padding or CTA placement from PCE baseline

- [ ] **Step 3: Commit**

```bash
git add apps/exam-management/docs/patterns/ui-patterns.md
git commit -m "docs(exam-management): add ui-patterns.md — patterns, DS map, a11y, FERPA"
```

---

### Task 3: Write the `compliance-reviewer` subagent

**Files:**
- Create: `.claude/agents/compliance-reviewer.md`

- [ ] **Step 1: Write `.claude/agents/compliance-reviewer.md`**

```markdown
---
name: compliance-reviewer
description: >
  Run AFTER any UI-touching change, alongside verification-reviewer.
  Checks WCAG 2.1 AA, FERPA data-flow, and HIPAA classification against
  the product's ui-patterns.md. Returns GREENLIGHT or NEEDS-MORE with
  exact regulation, consequence, and fix level per violation.
  Reads the pattern doc for the affected product before checking.
tools: Read, Bash, Grep, Glob
---

You are the compliance reviewer. Your job is to catch WCAG, FERPA, and HIPAA violations
in the files the parent agent just changed. You are NOT a general code reviewer — stay
focused on compliance only.

## Step 1: Identify the product and read its pattern doc

From the changed file paths provided, determine which product is affected:
- `apps/pce/` → read `apps/pce/docs/patterns/pce-ui-patterns.md`
- `apps/exam-management/` → read `apps/exam-management/docs/patterns/ui-patterns.md`

Read the relevant sections: Accessibility (§8), FERPA (§9), HIPAA (§10).

## Step 2: Run grep-verifiable checks on each changed file

For each changed `.tsx` file, run:

```bash
# Check 1: FA icons without aria-hidden
grep -n "className=\"fa-" <file> | grep -v "aria-hidden"

# Check 2: icon-only buttons without aria-label
grep -n 'size="icon\|size="icon-sm' <file> | grep -v "aria-label"

# Check 3: DropdownMenu without modal={false}
grep -n "<DropdownMenu" <file> | grep -v "modal={false}"

# Check 4: raw <button> (should be DS Button)
grep -n "<button" <file>

# Check 5: opacity-60 on parent with muted-foreground child (FERPA-adjacent: contrast)
grep -n "opacity-60" <file>

# Check 6: toast() usage (banned)
grep -n "toast(" <file>

# Check 7: FERPA — studentId + responseText in same component
grep -n "studentId\|studentName" <file>
grep -n "responseText\|responseBody" <file>
# If both appear in same file, flag for manual FERPA review
```

## Step 3: Note Playwright-only checks (cannot verify without running server)

These require the dev server — flag them as "verify manually before deploy":
- 400% zoom / 320px reflow (WCAG 1.4.10)
- Text spacing injection (WCAG 1.4.12)
- Touch target size at 375px (WCAG 2.5.5)
- axe-core for aria-hidden-focus, contrast, semantic table

## Step 4: Return verdict

**GREENLIGHT** — all grep checks pass, Playwright checks flagged for manual verification.

**NEEDS-MORE** — list each violation:
```
VIOLATION: [WCAG SC / FERPA rule / HIPAA rule]
File: apps/pce/admin/app/(app)/surveys/page.tsx:198
What: <button> without aria-label
Consequence: Screen reader announces unlabelled button — WCAG 4.1.2 failure
Fix level: UI (quick) — add aria-label prop
```

Do not suggest implementation details beyond what's in the pattern doc. Do not review
business logic, visual design, or DS adoption — that is verification-reviewer's job.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/agents/compliance-reviewer.md
git commit -m "feat(agents): add compliance-reviewer subagent — WCAG/FERPA/HIPAA checks"
```

---

### Task 4: Add 400% zoom + text-spacing tests to visual-check

**Files:**
- Modify: `tools/visual-check/interactions.mjs`

- [ ] **Step 1: Read the current file to understand structure**

```bash
head -80 /Users/romitsoley/Work/tools/visual-check/interactions.mjs
```

- [ ] **Step 2: Add two new test functions** at the end of the existing test suite (before the final export/run call):

```javascript
// ── WCAG 1.4.10 Reflow — 400% zoom (320px viewport width) ──────────────────
async function testReflow(page, route) {
  // Equivalent to 400% zoom on a 1280px-wide screen
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto(route)
  await page.waitForLoadState('networkidle')

  // Check for horizontal scrollbar — indicates reflow failure
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })

  const screenshotPath = `tools/visual-check/screenshots/reflow-${route.replace(/\//g, '-')}.png`
  await page.screenshot({ path: screenshotPath, fullPage: false })

  return {
    route,
    test: 'WCAG 1.4.10 Reflow (320px)',
    pass: !hasHorizontalScroll,
    violation: hasHorizontalScroll
      ? 'Horizontal scrollbar present at 320px viewport — reflow failure. Consequence: fails VPAT certification, blocks enterprise procurement.'
      : null,
    screenshot: screenshotPath,
  }
}

// ── WCAG 1.4.12 Text Spacing ────────────────────────────────────────────────
async function testTextSpacing(page, route) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(route)
  await page.waitForLoadState('networkidle')

  // Inject WCAG 1.4.12 minimum text spacing overrides
  await page.addStyleTag({
    content: `
      * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p { margin-bottom: 2em !important; }
    `,
  })

  await page.waitForTimeout(300)

  // Check for clipped text (overflow hidden with content cut off)
  const clippedElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*')
    const clipped = []
    for (const el of elements) {
      const style = getComputedStyle(el)
      if (style.overflow === 'hidden' && el.scrollHeight > el.clientHeight) {
        clipped.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''))
      }
    }
    return clipped.slice(0, 10) // cap at 10
  })

  const screenshotPath = `tools/visual-check/screenshots/text-spacing-${route.replace(/\//g, '-')}.png`
  await page.screenshot({ path: screenshotPath, fullPage: true })

  return {
    route,
    test: 'WCAG 1.4.12 Text Spacing',
    pass: clippedElements.length === 0,
    violation: clippedElements.length > 0
      ? `Content clipped under text-spacing overrides in: ${clippedElements.join(', ')}. Consequence: affects dyslexic users with OS-level spacing.`
      : null,
    screenshot: screenshotPath,
  }
}
```

- [ ] **Step 3: Wire the new tests into the existing run loop** — find where existing interaction tests are collected and add:

```javascript
// Add after existing test calls, before final report:
const reflowResults = await Promise.all(routes.map(route => testReflow(page, route)))
const spacingResults = await Promise.all(routes.map(route => testTextSpacing(page, route)))
allResults.push(...reflowResults, ...spacingResults)
```

- [ ] **Step 4: Test the new scenarios**

```bash
cd /Users/romitsoley/Work/tools/visual-check
# Dev server must be running for PCE: cd apps/pce/admin && pnpm dev
pnpm run interactions
```

Expected: new screenshots appear in `tools/visual-check/screenshots/reflow-*.png` and `text-spacing-*.png`. Report shows pass/fail for each route.

- [ ] **Step 5: Commit**

```bash
git add tools/visual-check/interactions.mjs
git commit -m "feat(visual-check): add WCAG 1.4.10 reflow + 1.4.12 text-spacing tests"
```

---

### Task 5: Add FERPA data-flow assertion to `scripts/ds-adoption-audit.py`

**Files:**
- Modify: `scripts/ds-adoption-audit.py`

- [ ] **Step 1: Read the current script to understand how rules are structured**

```bash
head -60 /Users/romitsoley/Work/scripts/ds-adoption-audit.py
grep -n "def check\|RULE\|violation\|banned" /Users/romitsoley/Work/scripts/ds-adoption-audit.py | head -30
```

- [ ] **Step 2: Add the FERPA assertion** — append this rule following the existing pattern in the script:

```python
def check_ferpa_data_coexistence(filepath: str, content: str) -> list[str]:
    """
    FERPA: A component that receives both a student identifier AND response text
    in the same file risks linking a student's identity to their survey response.
    Flag for manual review — the fix is server-side data separation, not UI-only.
    """
    violations = []
    has_student_id = bool(re.search(r'\bstudentId\b|\bstudentName\b|\bstudentEmail\b', content))
    has_response = bool(re.search(r'\bresponseText\b|\bresponseBody\b|\banswerText\b', content))
    if has_student_id and has_response:
        violations.append(
            f"FERPA DATA-FLOW: {filepath} renders both a student identifier and "
            f"response text. This risks linking student identity to survey response — "
            f"FERPA §99.31 violation. Fix: strip student ID server-side before this "
            f"component receives data."
        )
    return violations
```

Then register it in the main check runner alongside the existing checks.

- [ ] **Step 3: Test the assertion manually**

Create a temporary test file to confirm the rule fires:

```bash
cat > /tmp/test_ferpa.tsx << 'EOF'
// Intentionally violating — should trigger assertion
const Component = ({ studentId, responseText }: { studentId: string; responseText: string }) => (
  <div>{studentId}: {responseText}</div>
)
EOF

cd /Users/romitsoley/Work
python3 scripts/ds-adoption-audit.py /tmp/test_ferpa.tsx
```

Expected output: `FERPA DATA-FLOW: /tmp/test_ferpa.tsx renders both a student identifier...`

```bash
rm /tmp/test_ferpa.tsx
```

- [ ] **Step 4: Confirm no false positives on existing PCE files**

```bash
python3 scripts/ds-adoption-audit.py apps/pce/admin/app/ --strict 2>&1 | grep FERPA
```

Expected: no FERPA violations on current codebase (moderation page shows responses anonymously).

- [ ] **Step 5: Commit**

```bash
git add scripts/ds-adoption-audit.py
git commit -m "feat(audit): add FERPA data-flow assertion to ds-adoption-audit.py"
```

---

### Task 6: Update product CLAUDE.md files to auto-load pattern docs

**Files:**
- Modify: `apps/pce/CLAUDE.md`
- Modify: `apps/exam-management/CLAUDE.md`

- [ ] **Step 1: Read current `apps/pce/CLAUDE.md`**

```bash
head -40 /Users/romitsoley/Work/apps/pce/CLAUDE.md
```

- [ ] **Step 2: Add auto-load instruction** — find the "## Context" or first substantive section and prepend:

```markdown
## Session Start — Required Reads

Before any work in this product, read these two files:

1. `apps/pce/docs/patterns/pce-ui-patterns.md` — UI patterns, DS component map, accessibility checklist, FERPA, HIPAA rules. Every pattern has a consequence for violation.
2. `docs/watch/digest-latest.md` — Morning digest: PRD changes applied overnight, compliance violations flagged, FERPA/HIPAA alerts. Surface any P1 violations or FERPA/HIPAA alerts before starting work.

Also run `compliance-reviewer` alongside `verification-reviewer` after any UI-touching change.
```

- [ ] **Step 3: Do the same for `apps/exam-management/CLAUDE.md`** (adjust paths):

```markdown
## Session Start — Required Reads

Before any work in this product, read these two files:

1. `apps/exam-management/docs/patterns/ui-patterns.md` — UI patterns, DS component map, accessibility checklist, FERPA rules.
2. `docs/watch/digest-latest.md` — Morning digest: PRD changes applied overnight, compliance violations flagged.

Also run `compliance-reviewer` alongside `verification-reviewer` after any UI-touching change.
```

- [ ] **Step 4: Commit**

```bash
git add apps/pce/CLAUDE.md apps/exam-management/CLAUDE.md
git commit -m "chore(claude-md): auto-load pattern docs + digest at session start for pce + exam-management"
```

---

**Plan 2 complete.** Pattern docs are live, compliance-reviewer subagent is registered, zoom and text-spacing tests are in the visual-check suite, FERPA assertion runs at pre-commit.
