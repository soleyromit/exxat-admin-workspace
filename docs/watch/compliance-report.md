# Compliance Report — 2026-06-22

## Summary
P1 (blocks release): 0
P2 (fix before next audit): 15
P3 (advisory): 31
Resolved since last sweep: 0
Total open violations: 46

*First sweep — violation inventory was empty. All 46 violations are newly identified.*

---

## P1 Violations
None. FERPA check passed — no files contain both `studentId`/`studentName` and `responseText`/`responseBody`. All icon-only buttons (`size="icon"` / `size="icon-sm"`) were verified to have `aria-label` within 5 lines of the size attribute.

---

## P2 Violations

### GUARDRAIL-raw-button — PCE (4 files)

| File | Lines | First Seen | Status |
|---|---|---|---|
| `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | 197, 315 | 2026-06-22 | open |
| `apps/pce/admin/app/(app)/surveys/push/page.tsx` | 240 | 2026-06-22 | open |
| `apps/pce/admin/components/data-table/pagination.tsx` | 78, 108, 119, 133, 144 | 2026-06-22 | open |
| `apps/pce/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 482, 502, 539, 554, 580, 597, 856, 889, 919 | 2026-06-22 | open |

**Consequence:** Raw `<button>` bypasses DS Button focus ring, variant system, and keyboard contract. DataTable is shared across every page — widespread impact.
**Fix:** Replace with `<Button variant="..." size="...">`. Column drag handles may use `role="button"` div.

---

### GUARDRAIL-raw-button — Exam Management (9 files)

| File | Lines | First Seen | Status |
|---|---|---|---|
| `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 76, 960 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx` | 43 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 96 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/students/students-client.tsx` | 455 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx` | 138, 211 | 2026-06-22 | open |
| `apps/exam-management/admin/components/data-table/pagination.tsx` | 77, 107, 118, 132, 143 | 2026-06-22 | open |
| `apps/exam-management/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 479, 499, 536, 551, 577, 593, 856, 888, 918 | 2026-06-22 | open |
| `apps/exam-management/admin/components/search-input.tsx` | 209, 259, 282 | 2026-06-22 | open |
| `apps/exam-management/admin/components/qb/toggle.tsx` | 26 | 2026-06-22 | open |

**Consequence:** Same as PCE. DataTable and search-input are shared — every exam-management page is affected.
**Fix:** Replace with `<Button variant="..." size="...">`. Drag handles and toggle primitives may use `role="button"`.

---

### WCAG-4.1.2-dropdown-modal — Exam Management (1 file, 5 instances)

| File | Lines | First Seen | Status |
|---|---|---|---|
| `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 1137, 1798, 2528, 3990, 4257 | 2026-06-22 | open |

**Consequence:** Without `modal={false}`, Radix DropdownMenu locks body scroll on open — breaks scrolling inside nested drawers/dialogs (QB uses both Drawer and Dialog), causes layout shift on mobile.
**Fix:** Add `modal={false}` to each of the 5 root `<DropdownMenu>` elements in qb-table.tsx.

---

### GUARDRAIL-toast — Exam Management (1 file)

| File | Lines | First Seen | Status |
|---|---|---|---|
| `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 26 | 2026-06-22 | open |

**Consequence:** `toast()` is banned for product feedback — the approved pattern is `LocalBanner`. The QB undo exception in the sweep rule (`grep -v "qb-table"`) does not cover qb-sidebar.tsx. Note: the implementation appears to be the QB undo pattern with undo callback — the rule exclusion may need broadening.
**Fix:** Either (a) extend the sweep exclusion to the whole `question-bank/` directory, or (b) migrate `showSidebarToast()` to LocalBanner.

---

## P3 Violations

### WCAG-4.1.2-fa-aria-hidden — PCE (9 files)

| File | Lines | First Seen | Status |
|---|---|---|---|
| `apps/pce/admin/components/data-table/index.tsx` | 336 | 2026-06-22 | open |
| `apps/pce/admin/components/key-metrics/index.tsx` | 225 | 2026-06-22 | open |
| `apps/pce/admin/components/table-properties/drawer.tsx` | 642 | 2026-06-22 | open |
| `apps/pce/admin/components/pce/ai-insight-card.tsx` | 53 | 2026-06-22 | open |
| `apps/pce/admin/app/(app)/admin/page.tsx` | 110 | 2026-06-22 | open |
| `apps/pce/admin/app/(app)/moderation/page.tsx` | 148 | 2026-06-22 | open |
| `apps/pce/admin/app/(app)/page.tsx` | 64 | 2026-06-22 | open |
| `apps/pce/admin/app/(app)/templates/page.tsx` | 212 | 2026-06-22 | open |
| `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` | 160 | 2026-06-22 | open |

**Consequence:** WCAG 4.1.2 — decorative FA icons read aloud by screen readers, adding noise for AT users. Blocks WCAG AA certification.
**Fix:** Add `aria-hidden="true"` to each `<i className="fa-...">` element.

---

### WCAG-4.1.2-fa-aria-hidden — Exam Management (20 files)

| File | Lines | First Seen | Status |
|---|---|---|---|
| `apps/exam-management/admin/components/site-header.tsx` | 34 | 2026-06-22 | open |
| `apps/exam-management/admin/components/data-table/index.tsx` | 336 | 2026-06-22 | open |
| `apps/exam-management/admin/components/key-metrics/index.tsx` | 225 | 2026-06-22 | open |
| `apps/exam-management/admin/components/app-sidebar.tsx` | 98, 206 | 2026-06-22 | open |
| `apps/exam-management/admin/components/search-input.tsx` | 241, 277 | 2026-06-22 | open |
| `apps/exam-management/admin/components/persona-switcher.tsx` | 99, 188 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx` | 132 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 711, 748, 3369 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 147, 189, 226, 625, 958*, 1398 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 272, 317, 362 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx` | 848 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx` | 113 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` | 356 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx` | 280, 302, 460 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 78 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx` | 101, 123 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx` | 95, 159, 375 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/terms/terms-client.tsx` | 446, 475 | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/faculty/[id]/faculty-detail-client.tsx` | 126, 331, 353 | 2026-06-22 | open |

*\* qb-sidebar.tsx:958 uses `aria-label="Pinned"` (not `aria-hidden`) — confirm if icon is meaningful (add `role="img"`) or decorative (switch to `aria-hidden="true"`).*

**Consequence:** Same as PCE. Shared components (app-sidebar, site-header, data-table, search-input) affect every page.
**Fix:** Add `aria-hidden="true"` to each decorative `<i>` element across all 20 files.

---

### GUARDRAIL-opacity-60 — Exam Management (2 files)

| File | Lines | Note | First Seen | Status |
|---|---|---|---|---|
| `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 990, 1122 | Hover/idle state on icon | 2026-06-22 | open |
| `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 238 | Default (non-hover) opacity on container | 2026-06-22 | open |

**Consequence:** WCAG 1.4.3 — opacity-60 compounds with muted text tokens, dropping contrast to ~2.57:1 vs 4.5:1 AA minimum. `questions-tab.tsx:238` is most severe — default opacity-60 on a container, not just hover.
**Fix:** Replace `opacity-60` with `text-muted-foreground` token or `group-hover:text-foreground` pattern. For `questions-tab:238`, remove default container opacity.

---

## Resolved since last report
None (first sweep — inventory was previously empty).

---

## PCE opacity-60 — No violations
PCE has 3 grep hits for `opacity-60` (data-table/index.tsx:1046, admin/page.tsx:86, page.tsx:44), but all are **comments documenting previously fixed violations**, not active usage. No PCE opacity-60 violations.
