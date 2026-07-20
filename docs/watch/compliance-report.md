# Compliance Report — 2026-07-20

## Summary
P1 (blocks release): 0
P2 (fix before next audit): 17
P3 (advisory): 30
Resolved since last sweep: 0
New since last sweep: 0

---

## P1 Violations

_None._

---

## P2 Violations

### PCE — GUARDRAIL-raw-button

| ID | File | Lines | First Seen | Rule |
|---|---|---|---|---|
| pce-010 | `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | 197, 315 | 2026-06-22 | GUARDRAIL-raw-button |
| pce-011 | `apps/pce/admin/app/(app)/surveys/push/page.tsx` | 240 | 2026-06-22 | GUARDRAIL-raw-button |
| pce-012 | `apps/pce/admin/components/data-table/pagination.tsx` | 78, 108, 119, 133, 144 | 2026-06-22 | GUARDRAIL-raw-button |
| pce-013 | `apps/pce/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 482, 502, 539, 554, 580, 597, 856, 889, 919 | 2026-06-22 | GUARDRAIL-raw-button |
| pce-014 | `apps/pce/admin/components/key-metrics/index.tsx` | 289 | 2026-07-13 | GUARDRAIL-raw-button |

**Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract — inconsistent UX and potential a11y regression.
**Fix:** Replace with DS `<Button>` using explicit `variant` and `size`. For `data-table/index.tsx` column drag handles, use `role="button"` pattern.

### exam-management — WCAG-4.1.2 DropdownMenu modal

| ID | File | Lines | First Seen | Rule |
|---|---|---|---|---|
| exam-020 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 1137, 1798, 2528, 3990, 4257 | 2026-06-22 | WCAG-4.1.2-dropdown-modal |

**Consequence:** Without `modal={false}`, Radix DropdownMenu locks body scroll on open — breaks scroll inside nested drawers/dialogs and causes layout shift on mobile.
**Fix:** Add `modal={false}` to each `<DropdownMenu>` root in `qb-table.tsx` (5 remaining instances). Note: lines 1711 and 2051 were fixed in a prior sweep — partial progress detected.

### exam-management — GUARDRAIL-raw-button

| ID | File | Lines | First Seen | Rule |
|---|---|---|---|---|
| exam-021 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 76, 960 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-022 | `apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx` | 43 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-023 | `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 96 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-024 | `apps/exam-management/admin/app/(app)/students/students-client.tsx` | 455 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-025 | `apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx` | 138, 211 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-026 | `apps/exam-management/admin/components/data-table/pagination.tsx` | 77, 107, 118, 132, 143 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-027 | `apps/exam-management/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 479, 499, 536, 551, 577, 593, 856, 888, 918 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-028 | `apps/exam-management/admin/components/search-input.tsx` | 209, 259, 282 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-029 | `apps/exam-management/admin/components/qb/toggle.tsx` | 26 | 2026-06-22 | GUARDRAIL-raw-button |
| exam-033 | `apps/exam-management/admin/components/key-metrics/index.tsx` | 289 | 2026-07-13 | GUARDRAIL-raw-button |

**Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
**Fix:** Replace with DS `<Button>` or `role="button"` div for drag handles.

### exam-management — GUARDRAIL-toast

| ID | File | Line | First Seen | Rule |
|---|---|---|---|---|
| exam-030 | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 26 | 2026-06-22 | GUARDRAIL-toast |

**Consequence:** `toast()` is banned for product feedback; expected pattern is `LocalBanner`. QB undo exception covers `qb-table.tsx` only — `qb-sidebar.tsx` is outside the exception.
**Fix:** Move sidebar folder-action feedback to `LocalBanner`, or formally extend the QB undo exception to `qb-sidebar.tsx` in the sweep rule.

---

## P3 Violations

### PCE — WCAG-4.1.2 FA icon missing aria-hidden

| ID | File | Lines | First Seen |
|---|---|---|---|
| pce-001 | `apps/pce/admin/components/data-table/index.tsx` | 336 | 2026-06-22 |
| pce-002 | `apps/pce/admin/components/key-metrics/index.tsx` | 225 | 2026-06-22 |
| pce-003 | `apps/pce/admin/components/table-properties/drawer.tsx` | 642 | 2026-06-22 |
| pce-004 | `apps/pce/admin/components/pce/ai-insight-card.tsx` | 53 | 2026-06-22 |
| pce-005 | `apps/pce/admin/app/(app)/admin/page.tsx` | 110 | 2026-06-22 |
| pce-006 | `apps/pce/admin/app/(app)/moderation/page.tsx` | 148 | 2026-06-22 |
| pce-007 | `apps/pce/admin/app/(app)/page.tsx` | 64 | 2026-06-22 |
| pce-008 | `apps/pce/admin/app/(app)/templates/page.tsx` | 212 | 2026-06-22 |
| pce-009 | `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` | 160 | 2026-06-22 |

**Consequence:** Screen readers announce decorative icons to AT users — noise and confusion.
**Fix:** Add `aria-hidden="true"` to each `<i>` element.

### exam-management — WCAG-4.1.2 FA icon missing aria-hidden

| ID | File | Lines | First Seen |
|---|---|---|---|
| exam-001 | `apps/exam-management/admin/components/site-header.tsx` | 34 | 2026-06-22 |
| exam-002 | `apps/exam-management/admin/components/data-table/index.tsx` | 336 | 2026-06-22 |
| exam-003 | `apps/exam-management/admin/components/key-metrics/index.tsx` | 225 | 2026-06-22 |
| exam-004 | `apps/exam-management/admin/components/app-sidebar.tsx` | 98, 206 | 2026-06-22 |
| exam-005 | `apps/exam-management/admin/components/search-input.tsx` | 241, 277 | 2026-06-22 |
| exam-006 | `apps/exam-management/admin/components/persona-switcher.tsx` | 99, 188 | 2026-06-22 |
| exam-007 | `apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx` | 132 | 2026-06-22 |
| exam-008 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 711, 748, 3369 | 2026-06-22 |
| exam-009 | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 147, 189, 226, 625, 958, 1398 | 2026-06-22 |
| exam-010 | `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 272, 317, 362 | 2026-06-22 |
| exam-011 | `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx` | 848 | 2026-06-22 |
| exam-012 | `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx` | 113 | 2026-06-22 |
| exam-013 | `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` | 356 | 2026-06-22 |
| exam-014 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx` | 280, 302, 460 | 2026-06-22 |
| exam-015 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 78 | 2026-06-22 |
| exam-016 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx` | 101, 123 | 2026-06-22 |
| exam-017 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx` | 95, 159, 375 | 2026-06-22 |
| exam-018 | `apps/exam-management/admin/app/(app)/terms/terms-client.tsx` | 446, 475 | 2026-06-22 |
| exam-019 | `apps/exam-management/admin/app/(app)/faculty/[id]/faculty-detail-client.tsx` | 126, 331, 353 | 2026-06-22 |

**Consequence:** Screen readers announce decorative icons to AT users — noise and confusion.
**Fix:** Add `aria-hidden="true"` to each `<i>` element. For `qb-sidebar.tsx` line 958: confirm if icon is meaningful (`role="img"`) or decorative (switch to `aria-hidden`).

### exam-management — GUARDRAIL-opacity-60

| ID | File | Lines | First Seen |
|---|---|---|---|
| exam-031 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 990, 1122 | 2026-06-22 |
| exam-032 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 238 | 2026-06-22 |

**Consequence:** `opacity-60` can drop text contrast below 4.5:1 WCAG AA. Line 238 applies to a container by default (not on hover) — text inside at ~2.57:1.
**Fix:** Replace with `text-muted-foreground` or `group-hover:text-foreground` pattern.

---

## Resolved since last report

_None — 0 violations resolved since 2026-07-13 sweep._

---

## Observation: long-standing violations approaching 4-week threshold

All 47 open violations have been present since either 2026-06-22 (4 weeks) or 2026-07-13 (1 week). The P2 raw-button violations in `data-table/index.tsx` and `data-table/pagination.tsx` affect every page in both products and are the highest-leverage fix. The P3 FA icon violations are a one-liner fix per file (`aria-hidden="true"`) and could be batched across all 28 affected files in a single pass.
