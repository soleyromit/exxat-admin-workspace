# Lab visual consistency audit (2026-10-26)

**Scope:** lab screens only (`admin/components/lab/**`, `admin/lib/lab/*.ts`). v2 is being replaced (decision D-X24) and is not audited. Romit's rule: "I don't want any inconsistencies in data or visual." Data consistency is gated by `admin/tests/v2/consistency.test.ts` and `admin/tests/lab/consistency.mjs` (see `../dataset-spec.md` section 12); this page covers the visual side.

**Method:** grep sweep of every lab screen and shared part (read-only), then small fixes in shared chrome only. Line numbers are from the working tree on 2026-10-26 while four builders were editing; re-grep before acting. Paths are relative to `admin/`.

**Canonical sources added (data layer, pure):** `lib/v2/format.ts` (`fmt`, `plural`, `pctOf`, `shortDate`, `longDate`, `ageLabel`, `initialsOf`) and `lib/v2/labels.ts` (`RECORD_STATE_META` label, icon and tone per engine state; `OUTCOME_LABEL`; `OVERLAY_LABEL`; `EVALUATOR_NAME_LABEL`; `SAMPLE_DATA_LABEL`). Screens should import these instead of redefining them.

## Fixed in this pass (before -> after)

| # | Fix | Before | After |
|---|---|---|---|
| F1 | "Sample data" chip placement on the operations dashboard (`components/lab/dashboard/ops-frame.tsx`) | In the scope bar `trailing` slot (1 of 2 dashboard frames differed) | In the PageFrame `actions` slot beside Export, like `dashboard/frame.tsx`; both read `SAMPLE_DATA_LABEL` (0 differ) |
| F2 | Reviewer attention label (`lib/lab/reviewer.ts` `ATTENTION_LABEL.approval`) | "Waiting for approval" (1 use; every other screen says "Awaiting approval") | "Awaiting approval" |
| F3 | Engine state labels (`lib/lab/dashboard.ts` `RECORD_STATE_LABEL`) | Own literal map | Reads `RECORD_STATE_META` (1 definition) |
| F4 | Outcome words (`lib/lab/student.ts` `OUTCOME_WORD`) | Own literal map | Reads `OUTCOME_LABEL` ("Met / Unmet / Not yet") |
| F5 | Student date helper (`lib/lab/student.ts` `shortDate`, 14 importers) | Own implementation, never shows a year | Delegates to `lib/v2/format.ts shortDate` (adds the year outside the demo year, the director rule): 3 implementations now agree on 2 of 3 call paths |
| F6 | Approvals nav badge (`components/lab/lab-frame.tsx`) | 19, all terms, raw status items | Same entries and scope as the queue (35 in Fall 2026), from `lib/v2/approvals.ts` |

`components/lab/viz.tsx`, `viz-tokens.css` and `variant-bar.tsx` were checked: tokens only, no hex, rgb or `color-mix`, glyph plus word on every status; nothing to fix.

## Open, for the screen owners (one canonical treatment each)

### 1. Status pills and state words
- Seven wrappers keep their own icon and tone map: `admin-b/state-viz.tsx:33` StateBadge, `configure/live-panel.tsx:17` StateBadge (STATE_SPEC `lib/lab/configure.ts:71`), `reviewer/parts.tsx:51,63`, `director/verify.tsx:67`, `admin-a/evaluator-parts.tsx:53`, `dashboard/ops-sites.tsx:154`; plus glyph-only `student/parts.tsx:27-38`.
- Tone and icon conflicts: Achieved is "success" in `configure.ts:72`, neutral elsewhere; In progress is warning with a triangle in `director/verify.tsx:70`, neutral half-circle elsewhere; does-not-qualify uses `fa-circle-xmark` (`state-viz.tsx:20`) vs `fa-triangle-exclamation`; no evidence uses three icons.
- Wording: "Does not qualify" (`admin-b/attainment-tables.tsx:18`, `student/progress.tsx:205`) vs "Evidence does not qualify"; "Not met" (`lib/lab/attainment.ts:231`, `lib/lab/director.ts:74`, `director/reports.tsx:37,48,59`) vs "Unmet"; "Awaiting your approval" (`reviewer-student-record-b.tsx:27`); evaluator "Adopted / Awaiting approval" (`admin-a/evaluator-parts.tsx:54`) vs "Unverified"; "Did not count" (`lib/lab/student2.ts:252`).
- **Canonical:** DS `StatusBadge size="sm"` with `RECORD_STATE_META` (word, icon, tone) and `OUTCOME_LABEL` ("Unmet"); evaluator names "Unverified" / "Adopted" (`EVALUATOR_NAME_LABEL`). One wrapper, `admin-b/state-viz.tsx` StateBadge, rebuilt on the map.

### 2. Count chips
- DS `TabsCountBadge` 7 uses; muted span inside a tab (`settings-page.tsx:107`, `attainment-page.tsx:119`, `reviewer-students-a.tsx:53`); "(n)" inside heading text about 15 uses (`dashboard/cards.tsx:447`, `drill-peek.tsx:77`, `exceptions.tsx:166`); Badge with a count (`admin-import-a.tsx:116`).
- **Canonical:** `TabsCountBadge` in tabs; heading plus muted count span (`student/parts.tsx:175`) for section titles.

### 3. Empty states
- Four bespoke components: `admin-a/parts.tsx:243` EmptyState (Card, icon), `student2/frame.tsx:128` EmptyBlock (10 uses), `student/frame.tsx:113` EmptyState (same name, different look), DataTable `emptyState` paragraphs with and without `p-4` (about 14).
- **Canonical:** `EmptyBlock` (most used), wording "No {noun} yet" for nothing recorded and "No {noun} match these filters" with a Clear action for filters.

### 4. Page title
- `PageFrame` in 25 frames; evaluator surfaces use DS `PageHeader` directly with padding overrides (`evaluator-form-a.tsx:39`, `-b.tsx:71`, `-c.tsx:49`, `evaluator/status.tsx:24,53`). No raw `<h1>`.
- **Canonical:** `PageFrame` for staff and student; evaluator keeps the light header but one shared wrapper instead of per-screen overrides.

### 5. Toolbar and filters
- `ScopeBar` 9 uses; DS `FilterBar` 5; hand-rolled `Toolbar` with role=toolbar (`admin-a/parts.tsx:56`, used by course mapping and evaluator directory); `LabToolbar` (`evaluator/lab-grid-parts.tsx`); ad hoc Selects in 22 files.
- **Canonical:** `ScopeBar` for who and when (term, cohort, group, course); DS `FilterBar` for conditions. Retire the admin-a Toolbar.

### 6. Table density
- DS `DataTable` 35 uses; raw DS `Table` 26 uses with cell padding overrides (`py-1.5` 12, `py-2` 11, `h-8` 6; concentrated in `reviewer/review-parts.tsx`, `director-verification-detail-a.tsx`, `director-dashboard-b.tsx`).
- **Canonical:** DataTable at its default density, no padding overrides; raw Table only for small fixed matrices.

### 7. Link styling
- 14 local LINK constants; "LINK" means hover-underline in `reviewer/parts.tsx:14`, `director/parts.tsx:15`, `admin-a/parts.tsx:21` but always-underlined in `dashboard/cards.tsx:29`, `configure/impact.tsx:26`; number links `NUM_LINK` (`student/parts.tsx:17`) and `COUNT_LINK` (`settings-page.tsx:35`); one-offs in `approvals-frame.tsx:88`, `attainment-tables.tsx:57`.
- **Canonical:** one pair in a shared lab module: hover underline inside tables, always underlined standalone; one number-link class for counts.

### 8. Date format
- Three `shortDate` helpers (`lib/lab/student.ts:40` now delegates to `lib/v2/format.ts`; `lib/lab/director.ts:38`; `lib/lab/evaluator.ts:141` hand-built months); local `dateLabel` with year (`reviewer/record-frame.tsx:30`) and without (`reviewer/review-parts.tsx:19`, `lib/lab/attainment.ts:244`); time in en-GB 24 h (`dashboard/use-dashboard.ts:146,149`) vs en-US 12 h (`student-log-b.tsx:59`).
- **Canonical:** `lib/v2/format.ts shortDate` ("Oct 26", year when not the demo year) in lists; `longDate` in records and exports; one time format (24 h, the as-of line).

### 9. Number format
- Private `fmt` in about 20 files, `plural` about 12 times (`lib/lab/evaluator.ts:335` unformatted, `configure.ts:91` different signature); raw numbers at `director/reports.tsx:57-59`, `admin-dashboard-drill.tsx:111`, `reviewer-students-a.tsx:53`; percent helpers in four places, one with a decimal (`lib/lab/evaluators.ts:276`).
- **Canonical:** `lib/v2/format.ts` `fmt`, `plural`, `pctOf` (whole percent).

### 10. "Sample data" chip
- PageFrame actions (`dashboard/frame.tsx`, now `ops-frame.tsx`, `admin-b/attainment-page.tsx:53`); ScopeBar trailing (`approvals-frame.tsx:54`, `director/frame.tsx:51`); inline in record headers (`reviewer/record-frame.tsx:72`, `review-item-frame.tsx:91`); body `SampleDataBadge` (`import/sample-badge.tsx:4`, used on import and starter library); "Lab sample" on evaluator forms (`evaluator-form-a.tsx:40`, `-b.tsx:72`, `-c.tsx:50`); absent on student, library, configure and admin-a frames.
- **Canonical:** `SampleDataBadge` (DS outline Badge, `SAMPLE_DATA_LABEL`) in the PageFrame actions slot on every staff and student page; evaluator light header shows the same words.

### 11. Person cells
- DS `PersonIdentityCell` 7 uses; `AvatarInitials` (`student/requests.tsx:35`, `log-parts.tsx:219`); plain text names in `reviewer-approvals-b.tsx:44`, `exceptions.tsx:84`, `pipeline-drill.tsx:31`, `ops-drill.tsx:25`, `director/reports.tsx:34`; `initialsOf` defined 7 times with different regexes.
- **Canonical:** `PersonIdentityCell` for the first person column of a table; `lib/v2/format.ts initialsOf`.

### 12. Section labels
- No `uppercase tracking-wide` (clean). h2 in six styles (`text-sm font-semibold` 19, `text-base font-semibold` 10, `font-heading text-xl` in `share-parts.tsx:39`, `cards.tsx:107`, `admin-dashboard-d.tsx:57`, `text-2xl` at `cards.tsx:516`); h3 in three.
- **Canonical:** h2 `text-base font-semibold text-foreground` (`admin-a/parts.tsx:276` PaneHeading), h3 `text-sm font-semibold text-foreground`.

### Colours
No hex, rgb, raw oklch or `color-mix` in `components/lab`; every inline style resolves to a DS token or `VIZ.*` (`viz-tokens.css`).
