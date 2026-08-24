# Compliance Report — 2026-08-24

## Summary
P1 (blocks release): 0
P2 (fix before next audit): 17
P3 (advisory): 41
Resolved since last sweep: 0
New violations this sweep: 11

---

## P1 Violations

_None._

---

## P2 Violations

### WCAG-4.1.2-dropdown-modal — DropdownMenu without modal={false}

| ID | File | Lines | First Seen | Status |
|----|------|-------|------------|--------|
| exam-020 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 1137, 1798, 2528, 3990, 4257 | 2026-06-22 | open |

**Consequence:** Without `modal={false}`, Radix DropdownMenu locks body scroll on open — breaks scroll inside nested drawers/dialogs and causes layout shift on mobile.
**Fix:** Add `modal={false}` to each `<DropdownMenu>` root in qb-table.tsx (5 instances).

---

### GUARDRAIL-raw-button — Raw `<button>` bypassing DS Button

| ID | File | Lines | First Seen | Status |
|----|------|-------|------------|--------|
| pce-010 | `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | 197, 315 | 2026-06-22 | open |
| pce-011 | `apps/pce/admin/app/(app)/surveys/push/page.tsx` | 240 | 2026-06-22 | open |
| pce-012 | `apps/pce/admin/components/data-table/pagination.tsx` | 78, 108, 119, 133, 144 | 2026-06-22 | open |
| pce-013 | `apps/pce/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 482, 502, 539, 554, 580, 597, 856, 889, 919 | 2026-06-22 | open |
| pce-014 | `apps/pce/admin/components/key-metrics/index.tsx` | 289 | 2026-07-13 | open |
| exam-021 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 76, 960 | 2026-06-22 | open |
| exam-022 | `apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx` | 43 | 2026-06-22 | open |
| exam-023 | `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 96 | 2026-06-22 | open |
| exam-024 | `apps/exam-management/admin/app/(app)/students/students-client.tsx` | 455 | 2026-06-22 | open |
| exam-025 | `apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx` | 138, 211 | 2026-06-22 | open |
| exam-026 | `apps/exam-management/admin/components/data-table/pagination.tsx` | 77, 107, 118, 132, 143 | 2026-06-22 | open |
| exam-027 | `apps/exam-management/admin/components/data-table/index.tsx` | 195, 211, 246, 255, 276, 303, 350, 479, 499, 536, 551, 577, 593, 856, 888, 918 | 2026-06-22 | open |
| exam-028 | `apps/exam-management/admin/components/search-input.tsx` | 209, 259, 282 | 2026-06-22 | open |
| exam-029 | `apps/exam-management/admin/components/qb/toggle.tsx` | 26 | 2026-06-22 | open |
| exam-033 | `apps/exam-management/admin/components/key-metrics/index.tsx` | 289 | 2026-07-13 | open |

**Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract — inconsistent UX and potential a11y regression.
**Fix:** Replace each raw `<button>` with DS `<Button>` using explicit `variant` and `size`; column drag handles may use `role="button"` pattern.

---

### GUARDRAIL-toast — toast() outside QB undo exception

| ID | File | Lines | First Seen | Status |
|----|------|-------|------------|--------|
| exam-030 | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 26 | 2026-06-22 | open |

**Consequence:** `toast()` is banned for product feedback; expected pattern is `LocalBanner`. QB undo exception only covers qb-table.tsx.
**Fix:** Move sidebar folder-action feedback to `LocalBanner`, or extend the QB undo exception to cover qb-sidebar in the sweep rule.

---

## P3 Violations

### WCAG-4.1.2-fa-aria-hidden — FA icon without aria-hidden

| ID | Product | File | Lines | First Seen | Status |
|----|---------|------|-------|------------|--------|
| pce-001 | pce | `apps/pce/admin/components/data-table/index.tsx` | 336 | 2026-06-22 | open |
| pce-002 | pce | `apps/pce/admin/components/key-metrics/index.tsx` | 225, 414, 618, 662 | 2026-06-22 | open |
| pce-003 | pce | `apps/pce/admin/components/table-properties/drawer.tsx` | 642 | 2026-06-22 | open |
| pce-004 | pce | `apps/pce/admin/components/pce/ai-insight-card.tsx` | 53 | 2026-06-22 | open |
| pce-005 | pce | `apps/pce/admin/app/(app)/admin/page.tsx` | 110, 120 | 2026-06-22 | open |
| pce-006 | pce | `apps/pce/admin/app/(app)/moderation/page.tsx` | 148 | 2026-06-22 | open |
| pce-007 | pce | `apps/pce/admin/app/(app)/page.tsx` | 64, 76 | 2026-06-22 | open |
| pce-008 | pce | `apps/pce/admin/app/(app)/templates/page.tsx` | 212 | 2026-06-22 | open |
| pce-009 | pce | `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` | 160 | 2026-06-22 | open |
| pce-015 ⭐NEW | pce | `apps/pce/admin/components/app-sidebar.tsx` | 216 | 2026-08-24 | open |
| pce-016 ⭐NEW | pce | `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx` | 163, 189 | 2026-08-24 | open |
| pce-017 ⭐NEW | pce | `apps/pce/admin/app/(app)/analytics/page.tsx` | 619 | 2026-08-24 | open |
| exam-001 | exam-management | `apps/exam-management/admin/components/site-header.tsx` | 34 | 2026-06-22 | open |
| exam-002 | exam-management | `apps/exam-management/admin/components/data-table/index.tsx` | 336 | 2026-06-22 | open |
| exam-003 | exam-management | `apps/exam-management/admin/components/key-metrics/index.tsx` | 225, 414, 618, 662 | 2026-06-22 | open |
| exam-004 | exam-management | `apps/exam-management/admin/components/app-sidebar.tsx` | 98, 206, 402 | 2026-06-22 | open |
| exam-005 | exam-management | `apps/exam-management/admin/components/search-input.tsx` | 232, 241, 277 | 2026-06-22 | open |
| exam-006 | exam-management | `apps/exam-management/admin/components/persona-switcher.tsx` | 99, 188 | 2026-06-22 | open |
| exam-007 | exam-management | `apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx` | 132 | 2026-06-22 | open |
| exam-008 | exam-management | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 210, 686, 711, 748, 2597, 3369, 3436 | 2026-06-22 | open |
| exam-009 | exam-management | `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx` | 147, 189, 226, 417, 550, 625, 958, 984, 1312, 1398 | 2026-06-22 | open |
| exam-010 | exam-management | `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx` | 272, 317, 362 | 2026-06-22 | open |
| exam-011 | exam-management | `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx` | 848 | 2026-06-22 | open |
| exam-012 | exam-management | `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx` | 113 | 2026-06-22 | open |
| exam-013 | exam-management | `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx` | 356 | 2026-06-22 | open |
| exam-014 | exam-management | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx` | 280, 302, 460 | 2026-06-22 | open |
| exam-015 | exam-management | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 78 | 2026-06-22 | open |
| exam-016 | exam-management | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx` | 101, 123 | 2026-06-22 | open |
| exam-017 | exam-management | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx` | 95, 159, 375 | 2026-06-22 | open |
| exam-018 | exam-management | `apps/exam-management/admin/app/(app)/terms/terms-client.tsx` | 446, 475 | 2026-06-22 | open |
| exam-019 | exam-management | `apps/exam-management/admin/app/(app)/faculty/[id]/faculty-detail-client.tsx` | 126, 331, 353 | 2026-06-22 | open |
| exam-034 ⭐NEW | exam-management | `apps/exam-management/admin/components/action-items-panel.tsx` | 257 | 2026-08-24 | open |
| exam-035 ⭐NEW | exam-management | `apps/exam-management/admin/components/empty-state.tsx` | 79 | 2026-08-24 | open |
| exam-036 ⭐NEW | exam-management | `apps/exam-management/admin/components/faculty-ui-kit.tsx` | 76, 110, 243 | 2026-08-24 | open |
| exam-037 ⭐NEW | exam-management | `apps/exam-management/admin/app/(app)/competency/competency-client.tsx` | 174 | 2026-08-24 | open |
| exam-038 ⭐NEW | exam-management | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/accommodations-tab.tsx` | 152 | 2026-08-24 | open |
| exam-039 ⭐NEW | exam-management | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/assessments-tab.tsx` | 261 | 2026-08-24 | open |
| exam-040 ⭐NEW | exam-management | `apps/exam-management/admin/app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx` | 825 | 2026-08-24 | open |
| exam-041 ⭐NEW | exam-management | `apps/exam-management/admin/app/(app)/students/[id]/student-detail-client.tsx` | 249 | 2026-08-24 | open |

**Consequence:** Screen readers announce decorative icons — noise and confusion for assistive technology users.
**Fix:** Add `aria-hidden="true"` to each flagged `<i>` element. Note: line 958 of qb-sidebar.tsx uses `aria-label` instead — determine if meaningful (add `role="img"`) or decorative (switch to `aria-hidden`).

---

### GUARDRAIL-opacity-60 — Contrast risk

| ID | File | Lines | First Seen | Status |
|----|------|-------|------------|--------|
| exam-031 | `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` | 990, 1122 | 2026-06-22 | open |
| exam-032 | `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx` | 238 | 2026-06-22 | open |

**Consequence:** `opacity-60` on hover/idle states can drop text contrast below 4.5:1 WCAG AA threshold — risk for low-vision users.
**Fix:** Replace `opacity-60` with `text-muted-foreground` or `text-foreground/60` token; use `group-hover:text-foreground` on containers.

---

## Resolved since last report

_None — 0 violations resolved since 2026-08-17._

---

## FERPA Check

No FERPA violations found. No file in either product contains both `studentId`/`studentName` and `responseText`/`responseBody`.
