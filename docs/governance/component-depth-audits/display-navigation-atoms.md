# Display & Navigation Atoms — Depth audit (2026-05-11)

> Covers: **Kbd**, **Skeleton**, **Sidebar**, **ViewSegmentedControl**

## Library reality

| Component | API surface | Notes |
|---|---|---|
| **Kbd** | `Kbd` (`variant="tile" \| "bare"`), `KbdGroup` | Tile = bordered chip on neutral surfaces. Bare = inherits `currentColor/70`, auto-`aria-hidden`, used **inside buttons**. `kbd.tsx` (56 LoC). |
| **Skeleton** | `Skeleton` | One-liner div: `animate-pulse rounded-md bg-muted`. `skeleton.tsx` (14 LoC). |
| **Sidebar** | 23 exports incl. `SidebarProvider`/`Sidebar`/`SidebarTrigger`/`SidebarInset`/`SidebarHeader`/`Footer`/`Content`/`Menu`/`MenuItem`/`MenuButton`/`MenuBadge`/`MenuSkeleton`/`MenuSub`/`useSidebar` | Cookie-persisted collapse (`sidebar_state`, 7-day), global `b` shortcut, `variant="inset"\|"sidebar"\|"floating"`, `collapsible="icon"\|"offcanvas"\|"none"`, mobile sheet <768px. `sidebar.tsx` (710 LoC). |
| **ViewSegmentedControl** | `ViewSegmentedControl<T>`, `ViewSegmentOption<T>`, helper class fns | `role="radiogroup"` + `role="radio"`, keyboard ←→↑↓ Home End, optional `iconOnly` + auto-`Tip`, FA icon per option. `view-segmented-control.tsx` (161 LoC). |

## Adoption snapshot

| Component | PCE admin | PCE student | exam-mgmt admin | exam-mgmt student | assessment-taker (student) |
|---|---|---|---|---|---|
| Kbd | 1 file (`data-table/index.tsx` search hint) | 0 | 0 | n/a — app not scaffolded | 2 files (`CommandPalette`, `NavShell`) |
| Skeleton | 1 file (`my-surveys/page.tsx` Suspense fallback) | 0 | 0 | n/a | 0 (uses `fa-spinner-third fa-spin`) |
| Sidebar | 24 files (layout + AppSidebar + 22 pages using `SidebarTrigger`) | 0 — no app-shell layout | 2 files (layout + AppSidebar) | n/a | 1 file (`NavShell`) |
| ViewSegmentedControl | 0 | 0 | 0 | n/a | 0 |

## Per-component findings

### Kbd

- **Current adoption:** 2 correct surfaces. DataTable search-field hint (`pce/admin/components/data-table/index.tsx:560-563`, `⌘K` chip in the search input). Assessment-taker palette (`CommandPalette.tsx:141-208` — `Esc` in header, `↑↓ ↵ ?` in footer) + sidebar Search entry (`NavShell.tsx:77-80`, `KbdGroup ⌘K`).
- **Why this matters:** Kbd is on-pattern wherever a keyboard shortcut is exposed in chrome. Zero PCE admin / exam-mgmt admin adoption is a direct consequence of neither shipping ⌘K yet.
- **High-impact targets:** All gated on Command audit P1/P2. When PCE / exam-mgmt admin ⌘K lands (per `coach-mark-and-command.md`), mirror NavShell.tsx:74-81 in the sidebar entry and DataTable.tsx:560-563 in the input affordance. No other button or menu item in either admin carries a real shortcut today.
- **Recommended action: defer.** Block on ⌘K. Speculative Kbd in menus/tooltips = noise without a real shortcut behind it.

### Skeleton

- **Current adoption:** 1 surface — `apps/pce/admin/app/(app)/my-surveys/page.tsx:187-201` Suspense fallback (header + 4 row strips). Skeleton mirrors the real layout. Correct shape.
- **Why this likely doesn't matter today:** every PCE admin page sources synchronous in-memory mock data (`MOCK_SURVEYS`, `MOCK_TEMPLATES`, `ENTITIES`, `MOCK_TERMS`). No `fetch` / `useSWR` / `useQuery` anywhere. The `my-surveys` Suspense is from `useSearchParams` (client nav), not data fetch. Exam-mgmt admin `useEffect`s are all hydration / debounce / mocked-polling (`live-monitor-client.tsx:70-73` ticks every 4s).
- **Pages with async data + no loading UI: none in current state.** When real APIs replace mock stores, future Skeleton candidates are `analytics/page.tsx`, `surveys/[id]/responses/page.tsx`, `admin/<entity>/page.tsx`. The `fa-spinner-third fa-spin` in `pce/student/app/surveys/[id]/page.tsx:296` and `assessment-taker/SplitQuestionView.tsx:191` are fine for sub-second feedback — not Skeleton targets.
- **Recommended next 1 fix: defer until API integration.** When the first real fetch lands, codify `<EntityListSkeleton>` + `<DashboardSkeleton>` under `apps/pce/admin/components/` mirroring `MySurveysSkeleton`. No other page is wrong today.

### Sidebar

- **PCE admin:** `SidebarProvider` at `app/(app)/layout.tsx:11`, `SidebarInset` `:13`, `AppSidebar` `:12`. AppSidebar uses `variant="inset" collapsible="icon"`, full sub-component stack, `useSidebar` for collapse-aware branding. `SidebarTrigger` in every top-level page header (22 pages). **Clean.**
- **PCE student:** No `(app)/layout.tsx`, no `SidebarProvider`. `app/layout.tsx` is root only; survey-taking pages render flat. **Not applicable today** (single-task flow). When a student dashboard ships, scaffold `(app)` segment with Provider + Inset.
- **exam-mgmt admin:** `SidebarProvider` at `app/(app)/layout.tsx:22`, `SidebarInset` `:24` (carries `StandaloneLoginBanner`), `AppSidebar` `:23`. `variant="inset" collapsible="icon"`. **Clean.**
- **exam-mgmt student:** Not scaffolded — `apps/exam-management/student/` has `components/` + `node_modules/` but no `app/`. **Not applicable.**
- **assessment-taker (Vite, not Next):** `NavShell.tsx` uses full DS Sidebar stack incl. `SidebarMenuBadge`, `KbdGroup ⌘K` on Search, notifications dropdown. **Deepest exemplar in workspace.**
- **Custom navigation rolls outside Sidebar:** none. Grep for raw `<nav>` / `className="sidebar..."` outside DS slots returned no admin matches.
- **SidebarTrigger discipline:** consistent — `SidebarTrigger` + vertical `Separator` in every page header (e.g., `my-surveys/page.tsx:147-148`). Mobile/desktop collapse parity preserved.
- **Discipline grade: A.** Only gap is the un-scaffolded student apps; mirror exam-mgmt admin's layout pattern + `<html className="theme-one">` when they land.

### ViewSegmentedControl

- **Current adoption: 0 across the entire workspace.**
- **Custom view-mode toggles that should use it:**
  - **`apps/exam-management/admin/app/(app)/courses/courses-client.tsx:204-237`** — Cards/List toggle. Hand-rolled `<div role="group" aria-label="View mode">` wrapping two `Button variant="ghost" size="icon-sm"` with `aria-pressed`, per-item `Tooltip`, `style` injecting `backgroundColor: var(--muted)` for active state. **34 LoC of hand-rolled radiogroup.** Textbook ViewSegmentedControl case: two icon-only view modes, exclusive choice, same data. Migration: `<ViewSegmentedControl value={viewMode} onValueChange={setViewMode} aria-label="View mode" iconOnly options={[{value:'cards', label:'Cards', icon:'fa-light fa-grid-2'}, {value:'list', label:'List', icon:'fa-light fa-list'}]} />` — collapses to ~7 LoC, inherits keyboard nav + tooltips, drops the `style` hack. **Priority: P1.**
- **ToggleGroup uses that are CORRECT** (cross-ref tabs.md):
  - `pce/admin/app/(app)/analytics/page.tsx:432-441` — Term ↔ Cohort axis. **Re-scopes data through every panel. Keep.**
  - `pce/admin/app/(app)/analytics/page.tsx:504-513` — All/Didactic/Clinical filter. **Filters the dataset. Keep.**
- **Rule of thumb (extends tabs.md):** ToggleGroup → changes data flow. Tabs → changes panel. **ViewSegmentedControl → changes view *mode* of the *same* data** (table/list/board/grid/cards/dashboard).

## Combined: 3 highest-leverage actions

1. **Migrate `courses-client.tsx:204-237` Cards/List toggle to `ViewSegmentedControl`** (~30 min). Zero-to-first DS adoption, deletes ~27 LoC of hand-rolled radiogroup, fixes the `style`-prop active state, gains keyboard nav + tooltips, **establishes the precedent** before PCE list pages ship card-view variants. Tabs.md already cites courses-client as entity-detail canonical — this closes the loop.
2. **Document `ViewSegmentedControl` in `docs/patterns/admin/list-page-view-toggle.md`** after #1 ships. Same urgency as the Tabs `variant="line"` codification in tabs.md — without it, the next list page will reinvent the `<Button variant="ghost" aria-pressed>` hack.
3. **Defer Kbd + Skeleton expansions until gating events.** Kbd: block on ⌘K (Command audit P1/P2). Skeleton: block on first real API fetch. Both are correctly scoped today; speculative expansion = noise. Codify `<EntityListSkeleton>` only when the first list-page fetch lands.

## What this audit can't see

- Whether the PCE student app will ever adopt a sidebar (Aarti call — current single-flow surveys UX may not need one).
- Whether exam-mgmt student will reuse the assessment-taker `NavShell` or scaffold fresh under Next — affects SidebarMenuBadge / KbdGroup / notifications port-over.
- Whether the next PCE list pages (Programs, Sites, Placements) will add board/kanban — which would justify a 3+option ViewSegmentedControl beyond Cards/List.
- Whether `SidebarMenuSkeleton` (exported, source line 591) should be wired into AppSidebar nav for slow-network first paint — out of scope until real session fetch replaces `useFacultySession` mock.
