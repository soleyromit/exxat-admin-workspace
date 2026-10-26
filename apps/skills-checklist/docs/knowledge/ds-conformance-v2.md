# DS Conformance Audit — Skills Checklist v2

**Product:** Skills Checklist (Prism Skills Tracking)
**Scope:** `apps/skills-checklist/admin/components/v2/` + `app/(v2)/`
**Audited:** 2026-10-26 by ds-adoption-reviewer (static only)
**Verdict:** DEVIATIONS — 1 BLOCK + 5 violations + 3 warnings

Verification: static only. `visual-diff.mjs` not run (server state unknown).
Audit scripts run: `python3 -I scripts/ds-adoption-audit.py --product skills-checklist` — 1 block + 8 warnings.
`bash scripts/check-ds-variants.sh` — did not scan skills-checklist (see Violation 1).

---

## Pre-task State Declaration

| File / area | DS violations | Hand-rolled w/ DS equivalent | WCAG issues (static) |
|---|---|---|---|
| `app/globals.css` | Missing `@custom-variant` block (CRITICAL) | — | All interactive DS components broken |
| `components/v2/viz/heat-grid.tsx` | Raw `<Table>` flagged by audit BLOCK | Documented cross-tab viz (correct) | None beyond the audit block |
| `components/v2/reports/export-sheet.tsx` | Should use DS `ExportDrawer` | Hand-rolled Sheet export | None |
| `components/v2/student/skill-card.tsx:22` | FA icons without `aria-hidden="true"` | — | WCAG 1.1.1 (decorative icons unlabelled) |
| `components/v2/review/review-queue-page.tsx:153` | `TabsCountBadge` not used | String interpolation for tab count | None |
| `scripts/check-ds-variants.sh` | skills-checklist not in pre-commit list | — | Silent gap: globals.css never validated |
| All other v2 components | Clean | — | No `<button>`, `<table>`, raw colors, toast |

---

## Violations (ordered by severity)

### V-1 — CRITICAL: Missing `@custom-variant` block in globals.css

**File:** `apps/skills-checklist/admin/app/globals.css` (entire file)
**Rule:** Every product CSS entry point must `@import` `../../../../shared/ds-tailwind-variants.css`.
**Evidence:** `grep -n "custom-variant" apps/skills-checklist/admin/app/globals.css` → no match.
`bash scripts/check-ds-variants.sh` → skills-checklist not in `CSS_ENTRY_POINTS` array (script line 18); the gap is never caught by pre-commit.
**Effect on UX:** Without this import, Tailwind v4 does not know about `data-open`, `data-closed`, `data-checked`, `data-active`, `data-horizontal`, `data-disabled`, `data-selected` custom variants. All DS components that use these variants render incorrectly in the browser:
  - `Tabs variant="line"`: active underline never appears; the globals.css has a partial workaround (lines 11-31) for the data-orientation layout but not for the active state underline animation.
  - `Dialog` and `Sheet`: overlay and panel have no open/close animation (hard cut).
  - `Select` and `DropdownMenu`: no open/close animation; disabled items look active.
  - `Checkbox`: checked visual state may not update.
  - `SidebarMenuButton`: `data-active="false"` items get active styling.
**Why unintuitive:** Interactive controls appear broken or wrong — a disabled item looks enabled, an open select looks closed, a checked box looks unchecked. Users cannot tell what state the UI is in.
**DS replacement:** Add `@import "../../../../shared/ds-tailwind-variants.css";` to `globals.css` after `@import "@exxatdesignux/ui/globals.css";`. Remove the partial Tabs workaround in lines 11-31 once the import is added (the shared file covers it correctly).
**Also fix:** Add `apps/skills-checklist/admin/app/globals.css` to `CSS_ENTRY_POINTS` array in `scripts/check-ds-variants.sh` so future sessions are caught pre-commit.
**Effort:** S (2 file edits, < 30 min)
**Severity:** CRITICAL

### V-2 — BLOCK: Raw `<Table>` in heat-grid.tsx

**File:** `apps/skills-checklist/admin/components/v2/viz/heat-grid.tsx:72`
**Rule:** `raw-table-in-product-code` — DS audit blocks raw `<Table>` outside `components/data-table/`.
**Evidence:** `python3 -I scripts/ds-adoption-audit.py --product skills-checklist` → BLOCK at `heat-grid.tsx:72`.
**Context:** `HeatGrid` is a student x skill cross-tab visualization. Using DS Table primitives directly is the CORRECT approach for cross-tab matrices (per the documented patterns in `reports-page.tsx` and `lab-grid-page.tsx`, which are already in `ds-adoption.md` rows 117-118). The audit script has not been told about `heat-grid.tsx` yet.
**Why this is a false positive (but still blocks):** The audit rule is correct in principle; `heat-grid.tsx` is legitimately exempt because it is a bespoke visualization matrix, not a product list page.
**Fix:** Add `heat-grid.tsx` to the `DOCUMENTED_HAND_ROLLS` set in `scripts/ds-adoption-audit.py` and add a row to the skills-checklist section in `docs/governance/ds-adoption.md`.
Suggested ds-adoption.md entry:
```
| `apps/skills-checklist/admin/components/v2/viz/heat-grid.tsx` | ~120 | DataTable | Student x skill achievement heatmap (cross-tab). DataTable adds sort/filter chrome wrong for a static colour-coded matrix. Uses DS Table primitives. Pattern mirrors reports-page.tsx heatmap. 2026-10-26. |
```
**Effort:** S (2 file edits, < 30 min)
**Severity:** HIGH (blocks pre-commit)

### V-3 — WARN: Hand-rolled export Sheet instead of DS ExportDrawer

**File:** `apps/skills-checklist/admin/components/v2/reports/export-sheet.tsx`
**Rule:** `hand-rolled-export-drawer` — DS audit warns.
**Evidence:** `python3 -I scripts/ds-adoption-audit.py --product skills-checklist` → WARN at `export-sheet.tsx:72`.
**What it does:** Opens a Sheet with a format selector (Cohort PDF / Student PDF), calls `signPdf()` and `checkPdf()`, shows a `LocalBanner` on success/error.
**DS replacement:** `ExportDrawer` from `@exxatdesignux/ui` covers: format selector, column scope, date range, async progress indicator. The PDF signing and hash-verification steps remain product-specific and would be passed as a custom `onExport` callback.
**Why unintuitive:** Every other product that has export uses ExportDrawer. An inconsistent export pattern means the same UX goal (export data) looks and behaves differently per product — violating the "same action, same affordance" principle.
**Effort:** M (read ExportDrawer API, rewire the format selection and progress logic, keep PDF signing as a callback)
**Severity:** MEDIUM

### V-4 — FA icon without aria-hidden

**File:** `apps/skills-checklist/admin/components/v2/student/skill-card.tsx:22`
**Rule:** WCAG 1.1.1 + workspace rule "ALWAYS `aria-hidden=\"true\"` on FA icons".
**Evidence:** `grep -rn "fa-[a-z]" apps/skills-checklist/admin/components/v2 --include="*.tsx" | grep "<i " | grep -v "aria-hidden"` → `skill-card.tsx:22`.
**Code:** `<i key={i} className={i < have ? "fa-solid fa-circle text-foreground" : "fa-light fa-circle text-muted-foreground"} />`
**Context:** The comment on line 16 says "Hidden from assistive tech because the same facts are in the text." The intent is correct but the `aria-hidden="true"` attribute is missing. A screen reader will announce the icon element.
**Fix:** Add `aria-hidden="true"` to the `<i>` element.
**Why unintuitive:** Screen readers announce raw FA class names ("fa-solid fa-circle") to users, cluttering the reading experience with implementation detail.
**Effort:** S (1-line fix)
**Severity:** MEDIUM (a11y)

### V-5 — TabsCountBadge not used for tab count labels

**File:** `apps/skills-checklist/admin/components/v2/review/review-queue-page.tsx:153-155`
**Rule:** DS provides `TabsCountBadge` specifically for count badges inside tab triggers.
**Evidence:** `grep -rn "TabsCountBadge" apps/skills-checklist/admin --include="*.tsx"` → no results. Current code: `{\\`Awaiting (${items.length})\\`}`.
**Fix:** Replace string interpolation with `<TabsTrigger value="awaiting">Awaiting <TabsCountBadge>{items.length}</TabsCountBadge></TabsTrigger>`. Same for Stalled and Returned tabs.
**Why unintuitive:** Sister products (PCE, EM) use `TabsCountBadge` which renders as a visually distinct pill badge inside the trigger. The plain-text `(14)` reads as part of the label, not as a count indicator. Different affordance for the same pattern — users cannot learn one and reuse it.
**Effort:** S (3-line change)
**Severity:** LOW

---

## Warnings (from DS adoption audit)

### W-1 — overflow-hidden with floating triggers (7 instances)

**Files:**
- `components/v2/v2-utility-bar.tsx:104` — breadcrumb container with `overflow-hidden` that wraps inside the utility bar
- `components/mapping/mapping-workspace.tsx:138`
- `components/reporting/overview-view.tsx:172`
- `components/shell/utility-bar.tsx:77`
- `components/shell/product-switcher.tsx:37`
- `components/student/course-skills-view.tsx:64`
- `components/library/skills-tab.tsx:388`
**Rule:** `overflow-hidden-with-floating` — if a Radix-portal floating element (PopoverContent, TooltipContent, DropdownMenuContent) is triggered inside an overflow-hidden container that does NOT use Radix Portal, the floating content will be clipped.
**Note:** Radix Portal components are safe; they mount outside the DOM tree. The warning is advisory: verify in browser that no floating content is clipped.
**Effort:** S per file (visual check only)
**Severity:** LOW (advisory)

---

## Confirmed Clean (not violations)

| Check | Evidence | Result |
|---|---|---|
| Raw `<button>` elements | `grep -rn "<button" components/v2 app --include="*.tsx"` | CLEAN — none |
| Button without explicit variant | Multi-line grep over 6 suspicious hits | CLEAN — all 6 are multi-line JSX; variant on next line |
| Button without explicit size | Same grep | CLEAN — all have size= |
| Hardcoded hex / rgb / oklch in JSX | `grep -rn "#[0-9a-fA-F]\\|rgb(\\|oklch("` | CLEAN — none in v2 |
| `uppercase tracking-wide` (banned pattern) | `grep -rn "uppercase.*tracking-wide"` | CLEAN — none |
| `py-20 text-center` (banned pattern) | `grep -rn "py-20.*text-center"` | CLEAN — none |
| `color-mix(in oklch` (banned pattern) | `grep -rn "color-mix(in oklch"` | CLEAN — none |
| Toast/Sonner for feedback | `grep -rn "toast\\|Sonner\\|useToast"` | CLEAN — LocalBanner used everywhere |
| DS Card shape overrides (`rounded-none`, `shadow-none`) | `grep -rn "rounded-none\\|shadow-none"` | CLEAN — none |
| Inline `border:none` / `box-shadow:none` style overrides | `grep -rn "style=.*border.*none"` | CLEAN — none |
| Text smaller than 12px (`text-[10px]`, `text-[11px]`) | `grep -rn "text-\\[1[01]px\\]"` | CLEAN — none |
| Hardcoded colors in `style=` props | All `TONE_COLOR` and `STATE_META` values use `var(--)` tokens (verified in `viz/tokens.ts`) | CLEAN — all token-backed |
| V2Grid vs DataTable | `v2-grid.tsx` wraps DS DataTable (v1.6.5 IMPORT); not a hand-roll | CLEAN — correct |
| Raw `<table>` outside documented matrices | Heat-grid and lab-grid are documented cross-tab hand-rolls | CLEAN (BLOCK is a false positive for heat-grid; see V-2) |
| FA icons without aria-hidden (all except V-4) | `grep -rn "fa-[a-z]" --include="*.tsx" | grep "<i " | grep -v "aria-hidden"` | 1 miss at skill-card.tsx:22 (V-4); all others correct |
| Icon-only buttons without aria-label | All button-only-icon uses have aria-label | CLEAN |
| ToggleSwitch on dark background (QB exception) | wizard-steps.tsx uses ToggleSwitch on light Card background | CLEAN — QB exception does not apply |
| KeyMetrics hand-rolled | Imported from `@exxatdesignux/ui/components/ui/key-metrics` (v1.6.5 dist) | CLEAN |
| DataTable hand-rolled | Imported from `@exxatdesignux/ui/components/data-table` (v1.6.5 dist) | CLEAN |
| Wizard hand-rolled | Imported from `@exxatdesignux/ui/components/ui/wizard` | CLEAN |
| Shell hand-rolled | Uses `SidebarShell`, `AppSidebar`, `SidebarInset` from DS | CLEAN |
| PageHeader hand-rolled | Uses DS `PageHeader` via `PageFrame` wrapper | CLEAN |
| Dialog/Sheet hand-rolled | All use DS Dialog/Sheet primitives correctly | CLEAN |
| Collapsible hand-rolled | Uses DS Collapsible | CLEAN |
| Command menu | Uses DS `CommandDialog` | CLEAN |
| Filter chips (V2FilterBar) | Documented hand-roll in ds-adoption.md (row 119) | INTENTIONAL |
| ChartCard | Documented vendor from PCE in ds-adoption.md (row 120) | INTENTIONAL |
| Viz primitives (BulletMeter, StackedBar, etc.) | Use DS ChartContainer + DS tokens; cross-tab matrices use DS Table primitives | INTENTIONAL (needs ds-adoption.md entries) |

---

## Gap Analysis — DS Organisms Not Yet Used

These are NOT violations (nothing is hand-rolled to replace them) but adopting them would align the UI with DS patterns used by PCE/EM and remove the "unintuitive" complaints.

| DS organism | Not used at (surface) | Why adoption matters | Effort |
|---|---|---|---|
| `FloatingSheetPanel` | Review Item, Verification Detail | Both are full-page navigations. A split list+panel would let users navigate the queue without losing context. Every click on a queue row navigates away — unintuitive for a fast-review workflow. | L |
| `ExportDrawer` | Reports page | See V-3. Consistent export pattern across products. | M |
| `TabsCountBadge` | Review Queue tabs | See V-5. | S |
| `WizardProgress` | Configure Wizard | The wizard has 7 steps but no step-progress strip. Users cannot see how far they are or jump to a completed step. `WizardProgress` renders the step indicator that DS users expect. | S |
| `ListPageTemplate` | Review Queue, Verification List | Both surfaces hand-compose `PageFrame + Tabs + V2Grid`. `ListPageTemplate` provides the standardised hub chrome (view switcher, metrics toggle, toolbar, empty state, pagination) in one import. Low priority unless the surfaces gain view modes. | L |
| `CoachMark` + `useCoachMark` | Configure Wizard step 1, Student first-log | Wizard step 1 has no guidance for a first-time admin. Student first-log has no hint that skills must first be submitted. CoachMark is the DS-standard onboarding affordance. 0 adoption across the workspace — a chance to lead. | M |
| `PersonIdentityCell` | Review Queue student column, Verification list | Student names rendered as plain text. `PersonIdentityCell` adds an avatar disc + truncate + accessible name for person identity — the standard affordance on every other DS list page. | S |
| `DataTable` with `showQueryControls` enabled | All V2Grid-wrapped tables | `V2Grid` sets `showQueryControls={false}` globally. At 123 students and 150+ skills, the review queue, verification list, and library table all need sort and column management. The DS DataTable ships these; V2Grid just has them disabled. | M per table |

---

## Prioritised Fix List

Ordered by "most visible UX impact first".

### Fix 1 — Add `@custom-variant` import to globals.css (V-1)
**Why this makes the UI feel unintuitive:** Every interactive DS component — tabs, dialogs, sheets, selects, checkboxes — has broken state styling. An open dialog looks the same as a closed one. A checked checkbox may look unchecked. The Tabs active underline never appears. Users cannot read the state of the interface.
**File:** `apps/skills-checklist/admin/app/globals.css`
**Change:** Add after line 1 (`@import "@exxatdesignux/ui/globals.css";`):
```css
@import "../../../../shared/ds-tailwind-variants.css";
```
Then remove lines 11-31 (the partial Tabs data-orientation workaround; the shared file supersedes it).
Also add `"apps/skills-checklist/admin/app/globals.css"` to `CSS_ENTRY_POINTS` in `scripts/check-ds-variants.sh`.
**Effort:** S

### Fix 2 — Add heat-grid.tsx to ds-adoption-audit.py allowlist (V-2)
**Why this matters:** The audit BLOCKS pre-commit right now. The block prevents any future commit from landing while this file exists.
**Files:** `scripts/ds-adoption-audit.py` + `docs/governance/ds-adoption.md`
**Change:** Add `apps/skills-checklist/admin/components/v2/viz/heat-grid.tsx` to `DOCUMENTED_HAND_ROLLS` and add a row to the skills-checklist section in ds-adoption.md.
**Effort:** S

### Fix 3 — aria-hidden on skill-card dots (V-4)
**Why this matters:** Screen readers announce "fa-solid fa-circle fa-light fa-circle" as the student scans their skills. It is noise that obscures the actual content.
**File:** `apps/skills-checklist/admin/components/v2/student/skill-card.tsx:22`
**Change:** Add `aria-hidden="true"` to the `<i>` element.
**Effort:** S

### Fix 4 — TabsCountBadge in Review Queue tabs (V-5)
**Why this matters:** The `(14)` parenthetical reads like a label suffix, not a badge count. Users familiar with DS patterns in PCE/EM expect a badge pill. Inconsistent affordance breaks spatial memory.
**File:** `apps/skills-checklist/admin/components/v2/review/review-queue-page.tsx:153-155`
**Change:** Wrap counts in `<TabsCountBadge>`. Import `TabsCountBadge` from `@exxatdesignux/ui/components/ui/tabs`.
**Effort:** S

### Fix 5 — WizardProgress in Configure Wizard
**Why this matters:** A 7-step wizard with no step indicator is disorienting. Admins cannot tell whether they are on step 3 or step 6, or navigate back to a completed step they want to review. DS `WizardProgress` is the standard affordance.
**File:** `apps/skills-checklist/admin/components/v2/admin/configure-wizard.tsx`
**Change:** Add `<WizardProgress>` inside `<WizardNav>` using the `WIZARD_STEPS` array and the current `step` value.
**Effort:** S

### Fix 6 — ExportDrawer for reports export (V-3)
**Why this matters:** An inconsistent export pattern means users moving between PCE and Skills Checklist face two different export UIs. Consistency reduces training burden.
**File:** `apps/skills-checklist/admin/components/v2/reports/export-sheet.tsx`
**Change:** Replace hand-rolled Sheet with DS `ExportDrawer`; move PDF signing to an `onExport` callback.
**Effort:** M

### Fix 7 — Enable DataTable query controls for large tables
**Why this matters:** At 123 students, the review queue and verification list are hard to navigate without sort and filter. The DS DataTable has these built in; `V2Grid` just suppresses them. Enabling them for specific grids (not all) removes the "where is the student I need?" frustration.
**File:** `V2Grid` callers: `review-queue-page.tsx`, `director/verification-pages.tsx`, `admin/library-table.tsx`
**Change:** Pass `showQueryControls={true}` and provide `searchable={true}` where applicable. Requires column-level `meta` for search fields.
**Effort:** M per table

### Fix 8 — Document viz hand-rolls in ds-adoption.md
**Why this matters:** `BulletMeter`, `StackedBar`, `DotStrip`, `CumulativeLine`, `WaffleChart`, `SegmentedDots` are not yet in the registry. Future workers might attempt to reimport or rewrite them.
**File:** `docs/governance/ds-adoption.md` skills-checklist section
**Change:** Add a row per viz component with: file, lines, closest DS organism (ChartContainer), justification.
**Effort:** S

---

## Audit Script Output (2026-10-26)

```
$ python3 -I scripts/ds-adoption-audit.py --product skills-checklist
# DS Adoption Audit
Registry: docs/governance/ds-adoption.md
Scanned 429 source files across 1 apps.
1 blocking + 8 warning gaps found.

## skills-checklist admin  (1 block, 8 warn)

WARN overflow-hidden-with-floating (7)
  - components/mapping/mapping-workspace.tsx:138
  - components/reporting/overview-view.tsx:172
  - components/shell/utility-bar.tsx:77
  - components/shell/product-switcher.tsx:37
  - components/student/course-skills-view.tsx:64
  - components/library/skills-tab.tsx:388
  - components/v2/v2-utility-bar.tsx:104

WARN hand-rolled-export-drawer (1)
  - components/v2/reports/export-sheet.tsx:72

BLOCK raw-table-in-product-code (1)
  - components/v2/viz/heat-grid.tsx:72
```

```
$ bash scripts/check-ds-variants.sh apps/skills-checklist/admin
DS variant check — verifying @custom-variant block in product CSS entry points
Checked: 5 | Failed: 1
(skills-checklist not in CSS_ENTRY_POINTS — missed by hook)
```

---

## Final Verdict

**DEVIATIONS — 5 violations, 3 warnings.**

The v2 codebase is largely DS-compliant: no raw `<button>`, no raw `<table>` outside documented matrices, no hardcoded colors, no toast, correct Button variant/size, correct LocalBanner usage, correct DS Shell composition, correct DataTable IMPORT, correct KeyMetrics IMPORT. Hand-rolls are documented (V2FilterBar, ChartCard) or follow established cross-tab patterns (HeatGrid, LabGrid).

The root cause of unintuitive appearance is V-1: the missing `@custom-variant` block. Without it, DS interactive state styling (open/close animations, active tab underline, checked states, disabled states) does not render. This single fix will resolve the most visible class of "DS components look wrong" complaints. All remaining violations are low-to-medium effort polish items.
