# Compliance Report — 2026-09-07

## Summary
P1 (blocks release): 21
P2 (fix before next audit): 17
P3 (advisory): 30
Resolved since last sweep: 11

---

## P1 Violations — Icon-only buttons without aria-label (WCAG 4.1.2)

> **Note:** Detected via same-line grep (`size="icon-sm"` without `aria-label` on same line). Some instances may have `aria-label` on a separate line of the JSX prop block — verify each before fixing. All are WCAG 4.1.2 failures if aria-label is genuinely absent.

| ID | File | Line(s) | Consequence | Fix | First Seen |
|---|---|---|---|---|---|
| 2026-09-07-pce-018 | apps/pce/admin/components/data-table/row-actions.tsx | 75 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-019 | apps/pce/admin/components/table-properties/drawer.tsx | 234, 299, 328, 584, 596, 779 | No accessible name on 6 icon buttons | Add aria-label to each | 2026-09-07 |
| 2026-09-07-pce-020 | apps/pce/admin/app/(app)/admin/competencies/page.tsx | 301 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-021 | apps/pce/admin/app/(app)/admin/content-areas/page.tsx | 270 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-022 | apps/pce/admin/app/(app)/admin/standards/page.tsx | 292 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-023 | apps/pce/admin/app/(app)/admin/courses/page.tsx | 336 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-024 | apps/pce/admin/app/(app)/admin/students/page.tsx | 269 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-025 | apps/pce/admin/app/(app)/templates/[id]/page.tsx | 273 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-026 | apps/pce/admin/app/(app)/templates/page.tsx | 179 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-027 | apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx | 182 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-pce-028 | apps/pce/admin/app/(app)/surveys/page.tsx | 276 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-042 | apps/exam-management/admin/components/data-table/row-actions.tsx | 70 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-043 | apps/exam-management/admin/components/question-editor/question-editor.tsx | 470 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-044 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 1081, 1261, 1269, 1982, 1999, 3317, 3410, 3425, 3446, 3461, 4004, 4012, 4021, 4033 | 14 icon buttons in QB without accessible names | Add aria-label to each | 2026-09-07 |
| 2026-09-07-exam-045 | apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx | 170, 186 | No accessible name on icon buttons | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-046 | apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx | 163 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-047 | apps/exam-management/admin/app/(app)/access/page.tsx | 149 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-048 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx | 180, 188 | No accessible name on icon buttons | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-049 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx | 451 | No accessible name on icon button | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-050 | apps/exam-management/admin/app/(app)/courses/courses-client.tsx | 147, 496 | No accessible name on icon buttons | Add aria-label | 2026-09-07 |
| 2026-09-07-exam-051 | apps/exam-management/admin/app/(app)/terms/terms-client.tsx | 171 | No accessible name on icon button | Add aria-label | 2026-09-07 |

---

## P2 Violations — Fix before next audit

### DropdownMenu without modal={false}

| ID | File | Line(s) | Consequence | Fix | First Seen |
|---|---|---|---|---|---|
| 2026-06-22-exam-020 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 1137, 1798, 2528, 3990, 4257 | Body scroll locked on open inside drawers/dialogs | Add modal={false} to each root | 2026-06-22 |

### Raw `<button>` elements (Guardrail)

| ID | File | Line(s) | Consequence | Fix | First Seen |
|---|---|---|---|---|---|
| 2026-06-22-pce-010 | apps/pce/admin/app/(app)/templates/[id]/page.tsx | 197, 315 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-pce-011 | apps/pce/admin/app/(app)/surveys/push/page.tsx | 240 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-pce-012 | apps/pce/admin/components/data-table/pagination.tsx | 78, 108, 119, 133, 144 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-pce-013 | apps/pce/admin/components/data-table/index.tsx | 195, 211, 246, 255, 276, 303, 350, 482, 502, 539, 554, 580, 597, 856, 889, 919 | Widespread in shared DataTable | Replace with DS \<Button\> | 2026-06-22 |
| 2026-07-13-pce-014 | apps/pce/admin/components/key-metrics/index.tsx | 289 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-07-13 |
| 2026-06-22-exam-021 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 76, 960 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-022 | apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx | 43 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-023 | apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx | 96 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-024 | apps/exam-management/admin/app/(app)/students/students-client.tsx | 455 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-025 | apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx | 138, 211 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-026 | apps/exam-management/admin/components/data-table/pagination.tsx | 77, 107, 118, 132, 143 | Widespread in shared DataTable | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-027 | apps/exam-management/admin/components/data-table/index.tsx | 195, 211, 246, 255, 276, 303, 350, 479, 499, 536, 551, 577, 593, 856, 888, 918 | Widespread in shared DataTable | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-028 | apps/exam-management/admin/components/search-input.tsx | 209, 259, 282 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-06-22-exam-029 | apps/exam-management/admin/components/qb/toggle.tsx | 26 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-06-22 |
| 2026-07-13-exam-033 | apps/exam-management/admin/components/key-metrics/index.tsx | 289 | Bypasses DS Button system | Replace with DS \<Button\> | 2026-07-13 |

### toast() usage (Guardrail)

| ID | File | Line(s) | Consequence | Fix | First Seen |
|---|---|---|---|---|---|
| 2026-06-22-exam-030 | apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx | 26 | Banned for product feedback; use LocalBanner | Move to LocalBanner or extend QB undo exception | 2026-06-22 |

---

## P3 Violations — Advisory

### FA icons without aria-hidden (WCAG 4.1.2)

**PCE:**

| ID | File | Line(s) | First Seen |
|---|---|---|---|
| 2026-06-22-pce-001 | apps/pce/admin/components/data-table/index.tsx | 336 | 2026-06-22 |
| 2026-06-22-pce-002 | apps/pce/admin/components/key-metrics/index.tsx | 225 | 2026-06-22 |
| 2026-06-22-pce-003 | apps/pce/admin/components/table-properties/drawer.tsx | 642 | 2026-06-22 |
| 2026-06-22-pce-004 | apps/pce/admin/components/pce/ai-insight-card.tsx | 53 | 2026-06-22 |
| 2026-06-22-pce-005 | apps/pce/admin/app/(app)/admin/page.tsx | 110 | 2026-06-22 |
| 2026-06-22-pce-006 | apps/pce/admin/app/(app)/moderation/page.tsx | 148 | 2026-06-22 |
| 2026-06-22-pce-007 | apps/pce/admin/app/(app)/page.tsx | 64 | 2026-06-22 |
| 2026-06-22-pce-008 | apps/pce/admin/app/(app)/templates/page.tsx | 210 | 2026-06-22 |
| 2026-06-22-pce-009 | apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx | 160 | 2026-06-22 |

**Exam Management:**

| ID | File | Line(s) | First Seen |
|---|---|---|---|
| 2026-06-22-exam-001 | apps/exam-management/admin/components/site-header.tsx | 34 | 2026-06-22 |
| 2026-06-22-exam-002 | apps/exam-management/admin/components/data-table/index.tsx | 336 | 2026-06-22 |
| 2026-06-22-exam-003 | apps/exam-management/admin/components/key-metrics/index.tsx | 225 | 2026-06-22 |
| 2026-06-22-exam-004 | apps/exam-management/admin/components/app-sidebar.tsx | 98, 206 | 2026-06-22 |
| 2026-06-22-exam-005 | apps/exam-management/admin/components/search-input.tsx | 241, 277 | 2026-06-22 |
| 2026-06-22-exam-006 | apps/exam-management/admin/components/persona-switcher.tsx | 99, 188 | 2026-06-22 |
| 2026-06-22-exam-007 | apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx | 132 | 2026-06-22 |
| 2026-06-22-exam-008 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 711, 748, 3369 | 2026-06-22 |
| 2026-06-22-exam-009 | apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx | 147, 189, 226, 625, 958, 1398 | 2026-06-22 |
| 2026-06-22-exam-010 | apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx | 272, 317, 362 | 2026-06-22 |
| 2026-06-22-exam-011 | apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx | 848 | 2026-06-22 |
| 2026-06-22-exam-012 | apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx | 113 | 2026-06-22 |
| 2026-06-22-exam-013 | apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx | 356 | 2026-06-22 |
| 2026-06-22-exam-014 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx | 280, 302, 460 | 2026-06-22 |
| 2026-06-22-exam-015 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx | 78 | 2026-06-22 |
| 2026-06-22-exam-016 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx | 101, 123 | 2026-06-22 |
| 2026-06-22-exam-017 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx | 95, 159, 375 | 2026-06-22 |
| 2026-06-22-exam-018 | apps/exam-management/admin/app/(app)/terms/terms-client.tsx | 446, 475 | 2026-06-22 |
| 2026-06-22-exam-019 | apps/exam-management/admin/app/(app)/faculty/[id]/faculty-detail-client.tsx | 126, 331, 353 | 2026-06-22 |

### opacity-60 contrast risk

| ID | File | Line(s) | First Seen |
|---|---|---|---|
| 2026-06-22-exam-031 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx | 990, 1122 | 2026-06-22 |
| 2026-06-22-exam-032 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx | 238 | 2026-06-22 |

---

## Resolved since last report (2026-08-24 → 2026-09-07)

11 violations fixed:

| ID | File | Rule |
|---|---|---|
| 2026-08-24-pce-015 | apps/pce/admin/components/app-sidebar.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-pce-016 | apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-pce-017 | apps/pce/admin/app/(app)/analytics/page.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-034 | apps/exam-management/admin/components/action-items-panel.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-035 | apps/exam-management/admin/components/empty-state.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-036 | apps/exam-management/admin/components/faculty-ui-kit.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-037 | apps/exam-management/admin/app/(app)/competency/competency-client.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-038 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/accommodations-tab.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-039 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/assessments-tab.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-040 | apps/exam-management/admin/app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx | WCAG-4.1.2-fa-aria-hidden |
| 2026-08-24-exam-041 | apps/exam-management/admin/app/(app)/students/[id]/student-detail-client.tsx | WCAG-4.1.2-fa-aria-hidden |
