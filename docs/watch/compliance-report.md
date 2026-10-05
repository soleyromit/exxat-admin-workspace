# Compliance Report — 2026-10-05

## Summary
P1 (blocks release): 21
P2 (fix before next audit): 17
P3 (advisory): 30
Resolved since last sweep: 0

No new violations introduced. All 68 open violations from the 2026-09-14 sweep remain open. No FERPA violations detected.

---

## P1 Violations

### pce-018 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/components/data-table/row-actions.tsx:75`
- **Consequence:** Icon-only button with no accessible name — screen reader users cannot determine button purpose; WCAG 4.1.2 failure blocks keyboard and AT users.
- **Fix:** Add `aria-label` describing the button action (e.g., `aria-label="Row actions"`).
- **First seen:** 2026-09-07

### pce-019 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/components/table-properties/drawer.tsx:234,299,328,584,596,779`
- **Consequence:** Icon-only buttons with no accessible name — screen reader users cannot determine button purposes; 6 instances in drawer.
- **Fix:** Add `aria-label` to each icon-only Button (`size="icon-sm"`) describing its action.
- **First seen:** 2026-09-07

### pce-020 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/admin/competencies/page.tsx:301`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-021 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/admin/content-areas/page.tsx:270`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-022 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/admin/standards/page.tsx:292`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-023 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/admin/courses/page.tsx:336`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-024 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/admin/students/page.tsx:269`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-025 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/templates/[id]/page.tsx:273`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-026 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/templates/page.tsx:179`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-027 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx:182`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### pce-028 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/pce/admin/app/(app)/surveys/page.tsx:276`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### exam-042 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/components/data-table/row-actions.tsx:70`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action (e.g., `aria-label="Row actions"`).
- **First seen:** 2026-09-07

### exam-043 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/components/question-editor/question-editor.tsx:470`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### exam-044 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:1081,1261,1269,1982,1999,3317,3410,3425,3446,3461,4004,4012,4021,4033`
- **Consequence:** 14 icon-only buttons without accessible names in QB table — screen reader users cannot use QB action controls.
- **Fix:** Add `aria-label` to each icon-only Button (`size="icon-sm"`) describing its action.
- **First seen:** 2026-09-07

### exam-045 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx:170,186`
- **Consequence:** Icon-only buttons with no accessible names in QB header.
- **Fix:** Add `aria-label` to each icon-only Button describing its action.
- **First seen:** 2026-09-07

### exam-046 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx:163`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### exam-047 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/access/page.tsx:149`
- **Consequence:** Icon-only button with no accessible name.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### exam-048 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx:180,188`
- **Consequence:** Icon-only buttons with no accessible names in faculty tab.
- **Fix:** Add `aria-label` to each icon-only Button describing its action.
- **First seen:** 2026-09-07

### exam-049 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx:451`
- **Consequence:** Icon-only button with no accessible name in students tab.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

### exam-050 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/courses/courses-client.tsx:147,496`
- **Consequence:** Icon-only buttons with no accessible names in courses list.
- **Fix:** Add `aria-label` to each icon-only Button describing its action.
- **First seen:** 2026-09-07

### exam-051 · WCAG-4.1.2-icon-button-aria-label
- **File:** `apps/exam-management/admin/app/(app)/terms/terms-client.tsx:171`
- **Consequence:** Icon-only button with no accessible name in terms list.
- **Fix:** Add `aria-label` describing the button action.
- **First seen:** 2026-09-07

---

## P2 Violations

### pce-010 · GUARDRAIL-raw-button
- **File:** `apps/pce/admin/app/(app)/templates/[id]/page.tsx:197,315`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract — inconsistent UX and potential a11y regression.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-06-22

### pce-011 · GUARDRAIL-raw-button
- **File:** `apps/pce/admin/app/(app)/surveys/push/page.tsx:240`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-06-22

### pce-012 · GUARDRAIL-raw-button
- **File:** `apps/pce/admin/components/data-table/pagination.tsx:78,108,119,133,144`
- **Consequence:** Bypasses DS Button — inconsistent UX and potential a11y regression.
- **Fix:** Replace pagination controls with DS `<Button>` using appropriate variant and size.
- **First seen:** 2026-06-22

### pce-013 · GUARDRAIL-raw-button
- **File:** `apps/pce/admin/components/data-table/index.tsx:195,211,246,255,276,303,350,482,502,539,554,580,597,856,889,919`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract — widespread in shared DataTable used by every page.
- **Fix:** Replace raw `<button>` elements with DS `<Button>`; column drag handles may use `role="button"` pattern.
- **First seen:** 2026-06-22

### pce-014 · GUARDRAIL-raw-button
- **File:** `apps/pce/admin/components/key-metrics/index.tsx:289`
- **Consequence:** Bypasses DS Button — in the KeyMetrics card component used on multiple pages.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-07-13

### exam-020 · WCAG-4.1.2-dropdown-modal
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:1137,1798,2528,3990,4257`
- **Consequence:** Without `modal={false}`, Radix DropdownMenu locks body scroll on open — breaks scroll inside nested drawers/dialogs and causes layout shift on mobile.
- **Fix:** Add `modal={false}` to each `<DropdownMenu>` root in qb-table.tsx (5 instances).
- **First seen:** 2026-06-22

### exam-021 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:76,960`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` or a `role="button"` div for drag handles.
- **First seen:** 2026-06-22

### exam-022 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-title.tsx:43`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-06-22

### exam-023 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx:96`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-06-22

### exam-024 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/app/(app)/students/students-client.tsx:455`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-06-22

### exam-025 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/app/(app)/questions/new/add-question-client.tsx:138,211`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-06-22

### exam-026 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/components/data-table/pagination.tsx:77,107,118,132,143`
- **Consequence:** Bypasses DS Button — widespread in shared DataTable used by every page.
- **Fix:** Replace pagination controls with DS `<Button>`.
- **First seen:** 2026-06-22

### exam-027 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/components/data-table/index.tsx:195,211,246,255,276,303,350,479,499,536,551,577,593,856,888,918`
- **Consequence:** Bypasses DS Button — widespread in shared DataTable used by every page.
- **Fix:** Replace raw `<button>` elements with DS `<Button>`; column drag handles may use `role="button"`.
- **First seen:** 2026-06-22

### exam-028 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/components/search-input.tsx:209,259,282`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` or Button asChild pattern.
- **First seen:** 2026-06-22

### exam-029 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/components/qb/toggle.tsx:26`
- **Consequence:** Bypasses DS Button focus ring, variant system, and keyboard contract.
- **Fix:** Replace with DS `<Button>` using appropriate variant and size.
- **First seen:** 2026-06-22

### exam-030 · GUARDRAIL-toast
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:26`
- **Consequence:** `toast()` is banned for product feedback; expected pattern is `LocalBanner`. QB undo exception only covers `qb-table.tsx`.
- **Fix:** Move sidebar folder-action feedback to `LocalBanner`, or extend QB undo exception to cover qb-sidebar in the sweep rule.
- **First seen:** 2026-06-22

### exam-033 · GUARDRAIL-raw-button
- **File:** `apps/exam-management/admin/components/key-metrics/index.tsx:289`
- **Consequence:** Bypasses DS Button — in the KeyMetrics card component used on multiple pages.
- **Fix:** Replace with DS `<Button>` using explicit variant and size.
- **First seen:** 2026-07-13

---

## P3 Violations

### pce-001 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/components/data-table/index.tsx:336`
- **Consequence:** Screen readers announce decorative icon to users — noise and confusion for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### pce-002 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/components/key-metrics/index.tsx:225`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element (1 remaining; lines 414/618/662 fixed).
- **First seen:** 2026-06-22

### pce-003 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/components/table-properties/drawer.tsx:642`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### pce-004 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/components/pce/ai-insight-card.tsx:53`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### pce-005 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/app/(app)/admin/page.tsx:110`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element (1 remaining; line 120 fixed).
- **First seen:** 2026-06-22

### pce-006 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/app/(app)/moderation/page.tsx:148`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### pce-007 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/app/(app)/page.tsx:64`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element (1 remaining; line 76 fixed).
- **First seen:** 2026-06-22

### pce-008 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/app/(app)/templates/page.tsx:210`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### pce-009 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx:160`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-001 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/components/site-header.tsx:34`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-002 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/components/data-table/index.tsx:336`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-003 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/components/key-metrics/index.tsx:225`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` (1 remaining; lines 414/618/662 fixed).
- **First seen:** 2026-06-22

### exam-004 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/components/app-sidebar.tsx:98,206`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` (2 remaining; line 402 fixed).
- **First seen:** 2026-06-22

### exam-005 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/components/search-input.tsx:241,277`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` (2 remaining; line 232 fixed).
- **First seen:** 2026-06-22

### exam-006 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/components/persona-switcher.tsx:99,188`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` elements.
- **First seen:** 2026-06-22

### exam-007 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-manage-access.tsx:132`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-008 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:711,748,3369`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` (3 remaining; lines 210/686/2597/3436 fixed).
- **First seen:** 2026-06-22

### exam-009 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-sidebar.tsx:147,189,226,625,958,1398`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to decorative `<i>` elements (6 remaining; lines 417/550/984/1312 fixed). Line 958 uses aria-label — confirm role.
- **First seen:** 2026-06-22

### exam-010 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/course-catalog/catalog-client.tsx:272,317,362`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` elements.
- **First seen:** 2026-06-22

### exam-011 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/assessments/[id]/assessment-landing-client.tsx:848`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-012 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx:113`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-013 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/assessments/[id]/analytics/analytics-client.tsx:356`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-014 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/courses/[id]/tabs/faculty-tab.tsx:280,302,460`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` elements.
- **First seen:** 2026-06-22

### exam-015 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx:78`
- **Consequence:** Screen readers announce decorative icon — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` element.
- **First seen:** 2026-06-22

### exam-016 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/courses/[id]/tabs/students-tab.tsx:101,123`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` elements.
- **First seen:** 2026-06-22

### exam-017 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/courses/[id]/tabs/overview-tab.tsx:95,159,375`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` elements.
- **First seen:** 2026-06-22

### exam-018 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/terms/terms-client.tsx:446,475`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` elements.
- **First seen:** 2026-06-22

### exam-019 · WCAG-4.1.2-fa-aria-hidden
- **File:** `apps/exam-management/admin/app/(app)/faculty/[id]/faculty-detail-client.tsx:126,331,353`
- **Consequence:** Screen readers announce decorative icons — noise for AT users.
- **Fix:** Add `aria-hidden="true"` to the `<i>` elements.
- **First seen:** 2026-06-22

### exam-031 · GUARDRAIL-opacity-60
- **File:** `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx:990,1122`
- **Consequence:** opacity-60 on hover/idle states can drop text contrast below 4.5:1 WCAG AA threshold — risk for low-vision users.
- **Fix:** Replace `opacity-60` with `text-muted-foreground` or `text-foreground/60` token to avoid compounding opacity on already-muted text.
- **First seen:** 2026-06-22

### exam-032 · GUARDRAIL-opacity-60
- **File:** `apps/exam-management/admin/app/(app)/courses/[id]/tabs/questions-tab.tsx:238`
- **Consequence:** opacity-60 applied to container element — text inside at ~2.57:1 vs WCAG AA 4.5:1 minimum.
- **Fix:** Replace `opacity-60` with `text-muted-foreground` and `group-hover:text-foreground` pattern.
- **First seen:** 2026-06-22

---

## Resolved since last report

None. All 68 violations open as of 2026-09-14 remain open.
