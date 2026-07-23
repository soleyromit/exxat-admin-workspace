# Pattern: Record detail hides app nav

**Job:** [`jobs/record-detail.md`](./jobs/record-detail.md). **Related:** [`focus-workflow-pattern.md`](./focus-workflow-pattern.md) (also hides rails — different job).

## MUST

1. Record detail routes **hide** the primary sidebar and secondary panel — not icon-rail collapse.
2. `SiteHeader` still shows `SidebarTrigger` for breadcrumb alignment with hubs; the control is **disabled** while nav is unmounted (tooltip: “Navigation hidden on this page”).
3. **One way back** via breadcrumb / back affordance only (P1).
4. Register the path in `lib/record-detail-chrome.ts` → `isRecordDetailChromePath` (wired through `isSidebarHiddenPath`).
5. Detail pages use `PrimaryPageTemplate` with `maxWidthClassName="max-w-none"` so content fills the inset (hubs keep `max-w-[1440px]` beside rails).

## MUST NOT

- Leave an icon rail peeking on record detail (full hide, not collapse).
- Mount `SidebarAutoCollapse` instead of full hide (collapse implies the rail stays).
- Hide `SidebarTrigger` on these routes (alignment with primary pages).

## Reference

- `lib/record-detail-chrome.ts`
- `lib/focus-workflow.ts` → `isSidebarHiddenPath`
- `components/learning-activities-course-detail-client.tsx`
- `components/site-header.tsx` (`focusShellSupersedesPrimarySidebar` → disabled trigger)
