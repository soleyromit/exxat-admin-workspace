# Compliance Report — 2026-08-17

## Summary
P1 (blocks release): 0
P2 (fix before next audit): 17
P3 (advisory): 30
Resolved since last sweep: 0

No new violations detected this sweep. No FERPA issues found. Icon-only buttons spot-checked — all have `aria-label` on adjacent lines (multi-line JSX). All 47 open violations carried forward from 2026-07-27.

---

## P1 Violations

None.

---

## P2 Violations

| ID | File | Lines | Rule | Consequence | Fix Level | First Seen |
|---|---|---|---|---|---|---|
| 2026-06-22-pce-010 | `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | 197, 315 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using explicit variant and size. | 2026-06-22 |
| 2026-06-22-pce-011 | `apps/pce/admin/app/(app)/surveys/push/page.tsx` | 240 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using explicit variant and size. | 2026-06-22 |
| 2026-06-22-pce-012 | `apps/pce/admin/components/data-table/pagination.tsx` | 78, 108, 119, 133, 144 | GUARDRAIL-raw-button | Bypasses DS Button — in pagination used on every table page. | Replace pagination controls with DS `<Button>`. | 2026-06-22 |
| 2026-06-22-pce-013 | `apps/pce/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 482, 502, 539, 554, 580, 597, 856, 889, 919 | GUARDRAIL-raw-button | Bypasses DS Button — widespread in shared DataTable used by every page. | Replace raw `<button>` elements with DS `<Button>`; drag handles may use `role="button"`. | 2026-06-22 |
| 2026-07-13-pce-014 | `apps/pce/admin/components/key-metrics/index.tsx` | 289 | GUARDRAIL-raw-button | Bypasses DS Button — in KeyMetrics card used on multiple pages. | Replace with DS `<Button>` using explicit variant and size. | 2026-07-13 |
| 2026-06-22-exam-020 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 1137, 1798, 2528, 3990, 4257 | WCAG-4.1.2-dropdown-modal | Without `modal={false}`, Radix DropdownMenu locks body scroll on open — breaks scroll in nested drawers/dialogs and causes layout shift on mobile. | Add `modal={false}` to each `<DropdownMenu>` root (5 instances). | 2026-06-22 |
| 2026-06-22-exam-021 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 76, 960 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` or `role="button"` div for drag handles. | 2026-06-22 |
| 2026-06-22-exam-022 | `apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx` | 43 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using explicit variant and size. | 2026-06-22 |
| 2026-06-22-exam-023 | `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 96 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using explicit variant and size. | 2026-06-22 |
| 2026-06-22-exam-024 | `apps/exam-management/admin/app/(app)/students/students-client.tsx` | 455 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using explicit variant and size. | 2026-06-22 |
| 2026-06-22-exam-025 | `apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx` | 138, 211 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using explicit variant and size. | 2026-06-22 |
| 2026-06-22-exam-026 | `apps/exam-management/admin/components/data-table/pagination.tsx` | 77, 107, 118, 132, 143 | GUARDRAIL-raw-button | Bypasses DS Button — widespread in shared DataTable. | Replace pagination controls with DS `<Button>`. | 2026-06-22 |
| 2026-06-22-exam-027 | `apps/exam-management/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 479, 499, 536, 551, 577, 593, 856, 888, 918 | GUARDRAIL-raw-button | Bypasses DS Button — widespread in shared DataTable. | Replace raw `<button>` elements with DS `<Button>`; drag handles may use `role="button"`. | 2026-06-22 |
| 2026-06-22-exam-028 | `apps/exam-management/admin/components/search-input.tsx` | 209, 259, 282 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` or Button asChild pattern. | 2026-06-22 |
| 2026-06-22-exam-029 | `apps/exam-management/admin/components/qb/toggle.tsx` | 26 | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using appropriate variant and size. | 2026-06-22 |
| 2026-06-22-exam-030 | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 26 | GUARDRAIL-toast | `toast()` is banned for product feedback; expected pattern is `LocalBanner`. QB undo exception only covers qb-table.tsx. | Move sidebar folder-action feedback to `LocalBanner`. | 2026-06-22 |
| 2026-07-13-exam-033 | `apps/exam-management/admin/components/key-metrics/index.tsx` | 289 | GUARDRAIL-raw-button | Bypasses DS Button — in KeyMetrics card used on multiple pages. | Replace with DS `<Button>` using explicit variant and size. | 2026-07-13 |

---

## P3 Violations

### PCE — FA icons without aria-hidden (9 violations)

| ID | File | Lines | Consequence | Fix Level | First Seen |
|---|---|---|---|---|---|
| 2026-06-22-pce-001 | `apps/pce/admin/components/data-table/index.tsx` | 336 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-002 | `apps/pce/admin/components/key-metrics/index.tsx` | 225 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-003 | `apps/pce/admin/components/table-properties/drawer.tsx` | 642 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-004 | `apps/pce/admin/components/pce/ai-insight-card.tsx` | 53 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-005 | `apps/pce/admin/app/(app)/admin/page.tsx` | 110 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-006 | `apps/pce/admin/app/(app)/moderation/page.tsx` | 148 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-007 | `apps/pce/admin/app/(app)/page.tsx` | 64 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-008 | `apps/pce/admin/app/(app)/templates/page.tsx` | 212 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-pce-009 | `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` | 160 | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |

### Exam Management — FA icons without aria-hidden (19 violations)

| ID | File | Lines | Consequence | Fix Level | First Seen |
|---|---|---|---|---|---|
| 2026-06-22-exam-001 | `apps/exam-management/admin/components/site-header.tsx` | 34 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-002 | `apps/exam-management/admin/components/data-table/index.tsx` | 336 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-003 | `apps/exam-management/admin/components/key-metrics/index.tsx` | 225 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-004 | `apps/exam-management/admin/components/app-sidebar.tsx` | 98, 206 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-005 | `apps/exam-management/admin/components/search-input.tsx` | 241, 277 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-006 | `apps/exam-management/admin/components/persona-switcher.tsx` | 99, 188 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-007 | `apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx` | 132 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-008 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 711, 748, 3369 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-009 | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 147, 189, 226, 625, 958, 1398 | Screen readers announce decorative icons. Line 958 uses aria-label instead of aria-hidden; confirm if meaningful or decorative. | Add `aria-hidden="true"` to decorative `<i>` elements; for line 958 add `role="img"` if meaningful, else switch to `aria-hidden`. | 2026-06-22 |
| 2026-06-22-exam-010 | `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 272, 317, 362 | Screen readers announce decorative icons — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-011 | `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx` | 848 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-012 | `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx` | 113 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-013 | `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` | 356 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-014 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx` | 280, 302, 460 | Screen readers announce decorative icons — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-015 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 78 | Screen readers announce decorative icon — noise for AT users. | Add `aria-hidden="true"` to `<i>`. | 2026-06-22 |
| 2026-06-22-exam-016 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx` | 101, 123 | Screen readers announce decorative icons — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-017 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx` | 95, 159, 375 | Screen readers announce decorative icons — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-018 | `apps/exam-management/admin/app/(app)/terms/terms-client.tsx` | 446, 475 | Screen readers announce decorative icons — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |
| 2026-06-22-exam-019 | `apps/exam-management/admin/app/(app)/faculty/[id]/faculty-detail-client.tsx` | 126, 331, 353 | Screen readers announce decorative icons — noise for AT users. | Add `aria-hidden="true"` to `<i>` elements. | 2026-06-22 |

### Exam Management — opacity-60 contrast risk (2 violations)

| ID | File | Lines | Consequence | Fix Level | First Seen |
|---|---|---|---|---|---|
| 2026-06-22-exam-031 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 990, 1122 | opacity-60 on hover/idle states can drop text contrast below 4.5:1 WCAG AA threshold — risk for low-vision users. | Replace opacity-60 with `text-muted-foreground` or `text-foreground/60` token. | 2026-06-22 |
| 2026-06-22-exam-032 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 238 | opacity-60 applied to container element by default — text inside at ~2.57:1 vs WCAG AA 4.5:1 minimum. | Replace opacity-60 with `text-muted-foreground` and `group-hover:text-foreground` pattern. | 2026-06-22 |

---

## Resolved since last report

None. All 47 violations carried forward from 2026-07-27 remain open.

---

## Notes from this sweep

- **No new violations** found in either PCE or Exam Management.
- **FERPA check**: clean — no TSX files contain both `studentId`/`studentName` and `responseText`/`responseBody`.
- **Icon-only button check**: grep flagged multi-line JSX components; spot-checks on qb-table.tsx, qb-header.tsx, courses-client.tsx, content-areas, surveys, templates confirmed all icon-sm buttons have `aria-label` on adjacent lines. No new P1 violations.
- **opacity-60**: PCE matches are WCAG-fix comments only (not live code). Exam violations at qb-table.tsx and questions-tab.tsx persist.
- **DropdownMenu modal**: PCE uses `modal={false}` correctly throughout. Exam violation confined to qb-table.tsx (5 instances, exam-020).
- **toast()**: Only exam qb-sidebar.tsx:26 (exam-030) — QB undo exception applies to qb-table.tsx only.
- **New files since last sweep**: None detected.
