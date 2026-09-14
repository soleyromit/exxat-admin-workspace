# Compliance Report — 2026-09-14

## Summary
P1 (blocks release): 21
P2 (fix before next audit): 17
P3 (advisory): 30
Resolved since last sweep: 0

---

## P1 Violations — Icon-only buttons without aria-label (WCAG 4.1.2)

| ID | File | Lines | First Seen | Consequence | Fix |
|---|---|---|---|---|---|
| pce-018 | apps/pce/admin/components/data-table/row-actions.tsx | 75 | 2026-09-07 | Screen reader users cannot determine button purpose; blocks AT users | Add `aria-label="Row actions"` |
| pce-019 | apps/pce/admin/components/table-properties/drawer.tsx | 234, 299, 328, 584, 596, 779 | 2026-09-07 | 6 icon-only buttons with no accessible name in drawer | Add `aria-label` per action |
| pce-020 | apps/pce/admin/app/(app)/admin/competencies/page.tsx | 301 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-021 | apps/pce/admin/app/(app)/admin/content-areas/page.tsx | 270 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-022 | apps/pce/admin/app/(app)/admin/standards/page.tsx | 292 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-023 | apps/pce/admin/app/(app)/admin/courses/page.tsx | 336 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-024 | apps/pce/admin/app/(app)/admin/students/page.tsx | 269 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-025 | apps/pce/admin/app/(app)/templates/[id]/page.tsx | 273 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-026 | apps/pce/admin/app/(app)/templates/page.tsx | 179 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-027 | apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx | 182 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| pce-028 | apps/pce/admin/app/(app)/surveys/page.tsx | 276 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| exam-042 | apps/exam-management/admin/components/data-table/row-actions.tsx | 70 | 2026-09-07 | Screen reader users cannot determine button purpose | Add `aria-label="Row actions"` |
| exam-043 | apps/exam-management/admin/components/question-editor/question-editor.tsx | 470 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| exam-044 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 1081, 1261, 1269, 1982, 1999, 3317, 3410, 3425, 3446, 3461, 4004, 4012, 4021, 4033 | 2026-09-07 | 14 icon-only buttons — screen reader users cannot use QB controls | Add `aria-label` per action |
| exam-045 | apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx | 170, 186 | 2026-09-07 | Icon-only buttons with no accessible names in QB header | Add `aria-label` per action |
| exam-046 | apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx | 163 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| exam-047 | apps/exam-management/admin/app/(app)/access/page.tsx | 149 | 2026-09-07 | Icon-only button with no accessible name | Add `aria-label` |
| exam-048 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx | 180, 188 | 2026-09-07 | Icon-only buttons with no accessible names in faculty tab | Add `aria-label` per action |
| exam-049 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx | 451 | 2026-09-07 | Icon-only button with no accessible name in students tab | Add `aria-label` |
| exam-050 | apps/exam-management/admin/app/(app)/courses/courses-client.tsx | 147, 496 | 2026-09-07 | Icon-only buttons with no accessible names in courses list | Add `aria-label` per action |
| exam-051 | apps/exam-management/admin/app/(app)/terms/terms-client.tsx | 171 | 2026-09-07 | Icon-only button with no accessible name in terms list | Add `aria-label` |

---

## P2 Violations — Raw `<button>`, DropdownMenu missing `modal={false}`, banned `toast()`

| ID | File | Lines | Rule | First Seen | Consequence | Fix |
|---|---|---|---|---|---|---|
| pce-010 | apps/pce/admin/app/(app)/templates/[id]/page.tsx | 197, 315 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button focus ring, variant system, keyboard contract | Replace with DS `<Button>` |
| pce-011 | apps/pce/admin/app/(app)/surveys/push/page.tsx | 240 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` |
| pce-012 | apps/pce/admin/components/data-table/pagination.tsx | 78, 108, 119, 133, 144 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button — pagination controls | Replace with DS `<Button>` |
| pce-013 | apps/pce/admin/components/data-table/index.tsx | 195, 211, 246, 255, 276, 303, 350, 482, 502, 539, 554, 580, 597, 856, 889, 919 | GUARDRAIL-raw-button | 2026-06-22 | Widespread in shared DataTable — every page affected | Replace with DS `<Button>` |
| pce-014 | apps/pce/admin/components/key-metrics/index.tsx | 289 | GUARDRAIL-raw-button | 2026-07-13 | Bypasses DS Button — KeyMetrics card used on multiple pages | Replace with DS `<Button>` |
| exam-020 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 1137, 1798, 2528, 3990, 4257 | WCAG-4.1.2-dropdown-modal | 2026-06-22 | Radix locks body scroll on open — breaks scroll inside nested drawers/dialogs | Add `modal={false}` to each `<DropdownMenu>` root |
| exam-021 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 76, 960 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` |
| exam-022 | apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx | 43 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` |
| exam-023 | apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx | 96 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` |
| exam-024 | apps/exam-management/admin/app/(app)/students/students-client.tsx | 455 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` |
| exam-025 | apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx | 138, 211 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` |
| exam-026 | apps/exam-management/admin/components/data-table/pagination.tsx | 77, 107, 118, 132, 143 | GUARDRAIL-raw-button | 2026-06-22 | Widespread in shared DataTable | Replace with DS `<Button>` |
| exam-027 | apps/exam-management/admin/components/data-table/index.tsx | 195, 211, 246, 255, 276, 303, 350, 479, 499, 536, 551, 577, 593, 856, 888, 918 | GUARDRAIL-raw-button | 2026-06-22 | Widespread in shared DataTable | Replace with DS `<Button>` |
| exam-028 | apps/exam-management/admin/components/search-input.tsx | 209, 259, 282 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` or `asChild` pattern |
| exam-029 | apps/exam-management/admin/components/qb/toggle.tsx | 26 | GUARDRAIL-raw-button | 2026-06-22 | Bypasses DS Button | Replace with DS `<Button>` |
| exam-030 | apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx | 26 | GUARDRAIL-toast | 2026-06-22 | `toast()` banned for product feedback; QB undo exception covers qb-table only | Move to LocalBanner |
| exam-033 | apps/exam-management/admin/components/key-metrics/index.tsx | 289 | GUARDRAIL-raw-button | 2026-07-13 | Bypasses DS Button — KeyMetrics card used on multiple pages | Replace with DS `<Button>` |

---

## P3 Violations — FA icons without `aria-hidden`, `opacity-60` contrast risk

### PCE — FA icons missing `aria-hidden`

| ID | File | Lines | First Seen | Fix |
|---|---|---|---|---|
| pce-001 | apps/pce/admin/components/data-table/index.tsx | 336 | 2026-06-22 | Add `aria-hidden="true"` |
| pce-002 | apps/pce/admin/components/key-metrics/index.tsx | 225 | 2026-06-22 | Add `aria-hidden="true"` (1 remaining) |
| pce-003 | apps/pce/admin/components/table-properties/drawer.tsx | 642 | 2026-06-22 | Add `aria-hidden="true"` |
| pce-004 | apps/pce/admin/components/pce/ai-insight-card.tsx | 53 | 2026-06-22 | Add `aria-hidden="true"` |
| pce-005 | apps/pce/admin/app/(app)/admin/page.tsx | 110 | 2026-06-22 | Add `aria-hidden="true"` (1 remaining) |
| pce-006 | apps/pce/admin/app/(app)/moderation/page.tsx | 148 | 2026-06-22 | Add `aria-hidden="true"` |
| pce-007 | apps/pce/admin/app/(app)/page.tsx | 64 | 2026-06-22 | Add `aria-hidden="true"` (1 remaining) |
| pce-008 | apps/pce/admin/app/(app)/templates/page.tsx | 210 | 2026-06-22 | Add `aria-hidden="true"` |
| pce-009 | apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx | 160 | 2026-06-22 | Add `aria-hidden="true"` |

### Exam Management — FA icons missing `aria-hidden`

| ID | File | Lines | First Seen | Fix |
|---|---|---|---|---|
| exam-001 | apps/exam-management/admin/components/site-header.tsx | 34 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-002 | apps/exam-management/admin/components/data-table/index.tsx | 336 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-003 | apps/exam-management/admin/components/key-metrics/index.tsx | 225 | 2026-06-22 | Add `aria-hidden="true"` (1 remaining) |
| exam-004 | apps/exam-management/admin/components/app-sidebar.tsx | 98, 206 | 2026-06-22 | Add `aria-hidden="true"` (2 remaining) |
| exam-005 | apps/exam-management/admin/components/search-input.tsx | 241, 277 | 2026-06-22 | Add `aria-hidden="true"` (2 remaining) |
| exam-006 | apps/exam-management/admin/components/persona-switcher.tsx | 99, 188 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-007 | apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx | 132 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-008 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 711, 748, 3369 | 2026-06-22 | Add `aria-hidden="true"` (3 remaining) |
| exam-009 | apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx | 147, 189, 226, 625, 958, 1398 | 2026-06-22 | Add `aria-hidden="true"` (6 remaining; line 958 uses `aria-label` — confirm role) |
| exam-010 | apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx | 272, 317, 362 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-011 | apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx | 848 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-012 | apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx | 113 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-013 | apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx | 356 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-014 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx | 280, 302, 460 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-015 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx | 78 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-016 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx | 101, 123 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-017 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx | 95, 159, 375 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-018 | apps/exam-management/admin/app/(app)/terms/terms-client.tsx | 446, 475 | 2026-06-22 | Add `aria-hidden="true"` |
| exam-019 | apps/exam-management/admin/app/(app)/faculty/[id]/faculty-detail-client.tsx | 126, 331, 353 | 2026-06-22 | Add `aria-hidden="true"` |

### Exam Management — opacity-60 contrast risk

| ID | File | Lines | First Seen | Consequence | Fix |
|---|---|---|---|---|---|
| exam-031 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 990, 1122 | 2026-06-22 | `opacity-60` on hover/idle can drop contrast below 4.5:1 AA | Replace with `text-muted-foreground` token |
| exam-032 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx | 238 | 2026-06-22 | `opacity-60` on container — text at ~2.57:1 vs 4.5:1 minimum | Replace with `text-muted-foreground` + `group-hover:text-foreground` |

---

## Resolved since last report

None. All 68 open violations from the 2026-09-07 sweep remain open.

---

_Generated by weekly compliance sweep — 2026-09-14_
