# Pattern: Record detail hides app nav

**Job:** [`jobs/record-detail.md`](./jobs/record-detail.md). **Related:** [`focus-workflow-pattern.md`](./focus-workflow-pattern.md) (also hides rails — different job).

## MUST

1. Record detail routes **hide** the primary sidebar and secondary panel — not icon-rail collapse.
2. Primary sidebar expand/collapse lives on **`AppSidebar`** (`PrimarySidebarToggle`). While the rail is unmounted on record detail, use breadcrumb / back only (⌘B has nothing to expand until leaving the route).
3. **One way back** via breadcrumb / back affordance only (P1). On compact shell, `SiteHeader` derives Back from the last ancestor crumb with `href` and switches the utility bar into **Back mode** (leading back icon · rule · label; **Ask Leo** rightmost; no toggle, product, other actions, school, profile, or `trailing`).
4. **Peer jump on the H1** — when the user can open another record of the same type, put `PageTitleRecordSwitcher` in `PageHeader.title` (not on the Back bar). Back mode removed the breadcrumb leaf menu; the title switcher is the one place to change records.
5. **Sticky module tabs** — horizontal `TabsList` pins as `[data-slot="tabs-sticky-subheader"]` under the utility bar; table headers (if any) pin below via `getStickyTableHeaderOffset`.
6. Register the path in `lib/record-detail-chrome.ts` → `isRecordDetailChromePath` (wired through `isSidebarHiddenPath`).
7. Detail pages use `PrimaryPageTemplate` with `maxWidthClassName="max-w-none"` so content fills the inset (hubs keep `max-w-[1440px]` beside rails).

## MUST NOT

- Leave an icon rail peeking on record detail (full hide, not collapse).
- Mount `SidebarAutoCollapse` instead of full hide (collapse implies the rail stays).
- Put `SidebarTrigger` in `SiteHeader` — collapse control stays with the primary rail.
- Keep Comfort/Dense utility actions on record detail while Back mode is active (**except Ask Leo**).
- Duplicate peer switchers (bar + title) on the same detail.

## Reference

- `lib/record-detail-chrome.ts`
- `lib/focus-workflow.ts` → `isSidebarHiddenPath`
- `components/learning-activities-course-detail-client.tsx` (`PageTitleRecordSwitcher`)
- `components/page-breadcrumb-trail.tsx` (`PageTitleRecordSwitcher`)
- `components/utility-bar-page-chrome.tsx` / `components/utility-bar-slot.tsx` (Back mode)
- `components/sidebar/app-sidebar.tsx` (`PrimarySidebarToggle`)
- `components/site-header.tsx`
