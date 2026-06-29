# Compliance Report — 2026-06-29

## Summary
P1 (blocks release): 0
P2 (fix before next audit): 17
P3 (advisory): 15
Resolved since last sweep: 0

## P1 Violations
_None._

## P2 Violations

| ID | File | Rule | Consequence | Fix Level | First Seen | Status |
|----|------|------|-------------|-----------|------------| ------|
| 2026-06-22-pce-010 | apps/pce/admin/app/(app)/templates/[id]/page.tsx (lines 197, 315) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` with explicit variant and size. | 2026-06-22 | open |
| 2026-06-22-pce-011 | apps/pce/admin/app/(app)/surveys/push/page.tsx (line 240) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` with explicit variant and size. | 2026-06-22 | open |
| 2026-06-22-pce-012 | apps/pce/admin/components/data-table/pagination.tsx (lines 78, 108, 119, 133, 144) | GUARDRAIL-raw-button | Bypasses DS Button — inconsistent UX and potential a11y regression. | Replace pagination controls with DS `<Button>`. | 2026-06-22 | open |
| 2026-06-22-pce-013 | apps/pce/admin/components/data-table/index.tsx (16 lines) | GUARDRAIL-raw-button | Widespread raw `<button>` in shared DataTable used by every page. | Replace raw `<button>` elements with DS `<Button>`; column drag handles may use `role="button"`. | 2026-06-22 | open |
| 2026-06-22-exam-020 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx (lines 1137, 1798, 2528, 3990, 4257) | WCAG-4.1.2-dropdown-modal | Without `modal={false}`, Radix DropdownMenu locks body scroll — breaks scroll inside nested drawers/dialogs and causes layout shift on mobile. | Add `modal={false}` to each `<DropdownMenu>` root in qb-table.tsx (5 instances). | 2026-06-22 | open |
| 2026-06-22-exam-021 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx (lines 76, 960) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` or `role="button"` div for drag handles. | 2026-06-22 | open |
| 2026-06-22-exam-022 | apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx (line 43) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` with explicit variant and size. | 2026-06-22 | open |
| 2026-06-22-exam-023 | apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx (line 96) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` with explicit variant and size. | 2026-06-22 | open |
| 2026-06-22-exam-024 | apps/exam-management/admin/app/(app)/students/students-client.tsx (line 455) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` with explicit variant and size. | 2026-06-22 | open |
| 2026-06-22-exam-025 | apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx (lines 138, 211) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` with explicit variant and size. | 2026-06-22 | open |
| 2026-06-22-exam-026 | apps/exam-management/admin/components/data-table/pagination.tsx (lines 77, 107, 118, 132, 143) | GUARDRAIL-raw-button | Bypasses DS Button — widespread in shared DataTable used by every page. | Replace pagination controls with DS `<Button>`. | 2026-06-22 | open |
| 2026-06-22-exam-027 | apps/exam-management/admin/components/data-table/index.tsx (16 lines) | GUARDRAIL-raw-button | Bypasses DS Button — widespread in shared DataTable used by every page. | Replace raw `<button>` elements with DS `<Button>`; column drag handles may use `role="button"`. | 2026-06-22 | open |
| 2026-06-22-exam-028 | apps/exam-management/admin/components/search-input.tsx (lines 209, 259, 282) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` or Button `asChild` pattern. | 2026-06-22 | open |
| 2026-06-22-exam-029 | apps/exam-management/admin/components/qb/toggle.tsx (line 26) | GUARDRAIL-raw-button | Bypasses DS Button focus ring, variant system, and keyboard contract. | Replace with DS `<Button>` using appropriate variant and size. | 2026-06-22 | open |
| 2026-06-22-exam-030 | apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx (line 26) | GUARDRAIL-toast | `toast()` is banned for product feedback; expected pattern is `LocalBanner`. QB undo exception only covers qb-table.tsx. | Move sidebar folder-action feedback to `LocalBanner`, or extend QB undo exception to cover qb-sidebar in the sweep rule. | 2026-06-22 | open |

## P3 Violations

| ID | File | Rule | Consequence | Fix Level | First Seen | Status |
|----|------|------|-------------|-----------|------------|--------|
| 2026-06-22-pce-001 | apps/pce/admin/components/data-table/index.tsx (line 336) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-002 | apps/pce/admin/components/key-metrics/index.tsx (line 225) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-003 | apps/pce/admin/components/table-properties/drawer.tsx (line 642) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-004 | apps/pce/admin/components/pce/ai-insight-card.tsx (line 53) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-005 | apps/pce/admin/app/(app)/admin/page.tsx (line 110) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-006 | apps/pce/admin/app/(app)/moderation/page.tsx (line 148) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-007 | apps/pce/admin/app/(app)/page.tsx (line 64) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-008 | apps/pce/admin/app/(app)/templates/page.tsx (line 212) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-pce-009 | apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx (line 160) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-exam-001 | apps/exam-management/admin/components/site-header.tsx (line 34) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-exam-002 | apps/exam-management/admin/components/data-table/index.tsx (line 336) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-exam-003 | apps/exam-management/admin/components/key-metrics/index.tsx (line 225) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` element. | 2026-06-22 | open |
| 2026-06-22-exam-004 | apps/exam-management/admin/components/app-sidebar.tsx (lines 98, 206) | WCAG-4.1.2-fa-aria-hidden | Screen readers announce decorative icon — noise and confusion for AT users. | Add `aria-hidden="true"` to the `<i>` elements. | 2026-06-22 | open |
| 2026-06-22-exam-031 | apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx (lines 990, 1122) | GUARDRAIL-opacity-60 | opacity-60 can drop text contrast below 4.5:1 WCAG AA threshold — risk for low-vision users. | Replace `opacity-60` with `text-muted-foreground` or `text-foreground/60` token. | 2026-06-22 | open |
| 2026-06-22-exam-032 | apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx (line 238) | GUARDRAIL-opacity-60 | `opacity-60` on container by default drops text inside to ~2.57:1 vs WCAG AA 4.5:1 minimum. | Replace `opacity-60` with `text-muted-foreground` and `group-hover:text-foreground` pattern. | 2026-06-22 | open |

## Resolved since last report
_None — all 32 violations from 2026-06-22 remain open._

---

## Notes
- **icon-only button grep (size="icon"/"icon-sm" without aria-label)** produced hits across both products but spot-checks confirmed these are grep artifacts — `aria-label` is present on the line immediately after `size="icon-sm"` in multiline JSX. No genuine aria-label violations found.
- **FERPA check**: No files found containing both `studentId`/`studentName` and `responseText`/`responseBody`. No FERPA violations.
- **1 commit since last sweep** (88581e2): touched `qb-header.tsx` and `pce/admin/students/page.tsx`. Neither introduced new violations.
