# @exxatdesignux/ui — upgrade notes (bundled)

> **Agents:** read this before porting shell after `pnpm add @exxatdesignux/ui@…` / `npm install`.
> Default is **install only**. Run `exxat-ui upgrade` only when the notes (or the user) ask for shell sync.
> Binding rule: `exxat-consumer-package-upgrade`. Skill: `exxat-package-upgrade`.
>
> This file is the **latest 5 releases** only. Full history:
> https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/packages/ui/RELEASES.md
>
> Also available as `docs/exxat-ds/latest-release.md` after `exxat-ui sync-extras`.

## 1.0.0 — 2026-08-14

**Why 1.0 now.** Not because your code has to change — the *Upgrading* list below
is the whole of it. It is 1.0 because the thing a version number is supposed to
promise finally exists: an update contract. Until now an upgrade wrote 534 files
into your repo and hoped none of them were yours, which made "take the fix" and
"keep my work" the same operation competing for the same file. A release now
writes 120 — of which only 33 can overwrite anything, the other 87 being created
just when missing — flags 7 more for you to merge by hand, and leaves everything
else alone at every version. What it will not touch is app-owned by declaration
now rather than by luck. 0.12 and 0.13 were planned along the way and
never published, so this release also carries their work: the layer boundaries,
nav-as-data, and the shell move.

### Added

- **The app shell ships as code instead of being copied.** `AppSidebar` and the
  sixteen files around it live in the package now, at
  `@exxatdesignux/ui/components/shell`, so sidebar fixes, a11y work, and new
  chrome arrive with a version bump and write nothing into your source tree.
  Everything the shell used to know about one specific app is now something you
  hand it: `AppShellSlotsProvider` takes `slots` (notification bell, brand
  lock-up, product switcher rows, scope menu body, identity-menu rows, drill-in
  panel bodies), `on` (open the command menu, open Ask Leo, log out), `routes`
  (which paths hide the sidebar, what the rail does when a panel closes), and
  `data` (nav, scope, active product, workspace-settings destination). Every one
  is optional — an unfilled slot renders nothing, an absent callback is a no-op —
  so an older wiring file still gets a working sidebar after the bump. Secondary
  panels became a registry (`{ id, title, Body, flyoutRoute, autoOpen? }`) with
  the shell owning the route state machine, so adding a hub panel no longer means
  editing a 748-line file with two product ids named inside it.
- **Navigation is data.** Built-in and tenant products alike author
  `NavLayoutSpec` — ungrouped rows, labelled sections, trailing rows, drill-ins —
  with icons as Font Awesome class strings rather than JSX nodes, so a nav tree
  survives `JSON.stringify` and can come from a server later.
  `assertNavLayoutSpec` throws on duplicate section keys, and `assertNavSpecs`
  throws on a missing `iconClass`. `ShellNav.rowActive` lets an app override one
  row's active state and return `undefined` to defer, which is how the last piece
  of Exxat route knowledge left the package.
- **`exxat-ds/layer-boundaries` ESLint rule + `pnpm layers:audit`.** A single
  `@/…` import added to `packages/ui` is what turns a publishable component back
  into a file an upgrade has to copy, so it now fails a lint rather than being
  found a release later.

- **`exxat-ui codemod nav-specs` moves your nav rows onto the current shape, and tells you what it will not decide.** A nav row's icon travels as a Font Awesome class string now (`iconClass: "fa-light fa-books"`). The JSX form still renders, by reading the class name back off the node — which works for a bare `<i>` and quietly falls back to a grey circle for a wrapper component, a conditional, or an icon with a sibling badge, without throwing. The codemod converts the icon pairs and retypes the builders it can prove, transitively: converting one row builder retypes the section builder that calls it. Then it stops at the parts that are your call and names them by file and line — an **exported** registry that now receives specs (retype it and let callers render, or wrap it in `navLayoutToJsx()` / `navToJsx()`), an icon it cannot read, a row with no type annotation, a `sectionRouteMatch` function with no data form. `--dry-run` shows both lists; re-running is a no-op and keeps reporting the outstanding boundaries. Secondary nav still takes nodes and is left alone. `upgrade` counts the rows still in the old shape and names the command; it never rewrites your nav file.

### Fixed

- **`@exxatdesignux/ui/components/ui/<name>` resolves again.** The package exposed `./components/*` mapped onto `dist/components/ui/`, so the `components/ui/…` form every doc and the component map recommends doubled the segment and failed with `ERR_MODULE_NOT_FOUND`. 69 of the 77 specifiers in `component-map.json` were unresolvable, which only started to bite when 0.11.0 moved `chart` out of the root barrel and sent people to a subpath for the first time. Both `components/chart` and `components/ui/chart` now work.
- **`exxat-ui upgrade` no longer overwrites files an app has made its own — and the app says which those are.** New `exxat-ui eject <path>` forks one package file into the app, rewrites its relative imports back to package specifiers, and records it in `.exxat-ui/ejected.json`. `upgrade` leaves every listed path alone, lists them under *"Your version kept"* with the package copy's path, and brings everything else current with a backup. `eject --list` flags forks whose package version has moved since; `eject --adopt <path>` hands one back. `--force` still takes the package version everywhere. The first upgrade after this release converts an app's existing undeclared edits into ledger rows (marked `declaredBy: "upgrade-migration"`) rather than spending them. The tarball ships `src/` now, because a fork needs a source.
- **`upgrade --check` reports what it can actually do.** Exit 10 now means portable work exists, 11 means the app edited package-owned files and nothing is portable, 0 means nothing to do. App-owned manual-merge files no longer force a 10, which is what made `sync-extras` auto-run a no-op upgrade on every install.
- **`LeoIcon`, `MessageScroller`, and `AiThinkingSurface` ship from the package, so fixes to them reach you.** All three lived in the app tree, which meant `upgrade` had to overwrite them in your repo to deliver a change — and `message-scroller.tsx` existed twice, byte-identical in both trees, one edit away from two behaviours. They are now `@exxatdesignux/ui/components/leo-icon`, `/components/message-scroller`, and `/components/ai-thinking-surface`, and the files in your `components/ui/` are one-line re-exports. Existing `@/components/ui/leo-icon` imports keep working; nothing in your app has to change. `upgrade` now overwrites 33 files rather than 36.
- **`exxat-ui upgrade` writes 120 files instead of 534, and can only overwrite 33 of them.** The port list was the union of the groups that make the *starter* compile, so shipping a shell fix meant writing every demo hub, page, and mock module into the consumer's repo, then reporting the ones it had just replaced. It now writes three sets deliberately: **framework wiring** (product identity, routing, scope, shell layout, switcher chrome) is ported because an app on an older copy gates the wrong products; **seams** (the `components/ui/` re-export shims, `app-shell-wiring.tsx`, `panel-bridges.tsx`, `globals.css`, `vite.config.ts`) are created when missing and never overwritten; everything else is reference and is left alone at every version. New `upgrade --only <path>` fetches one reference file on request, with a backup and a report of any `@/` imports the app does not have yet. Every run says how many reference files differ from the release and names that command, because the count is expected on a customised app and the command is otherwise unguessable.
- **If you scaffolded on 0.10.2 or earlier and never customised the library or columns demos, refresh three of them.** 0.11.0 made `HubTableHandle` generic, and stale copies of `components/library-table.tsx`, `components/columns-showcase.tsx`, and `components/columns-client.tsx` annotate the old shape, so they fail `tsc` after upgrading. `exxat-ui upgrade --only <path>` on each takes the current version. 58 other reference files in the same app compiled fine, which is why they stay yours rather than being ported: their import closure reaches `page-header.tsx`, `templates/list-page.tsx`, and `lib/mock/library.ts`, and overwriting a consumer's page header to deliver a table fix is the failure this release exists to end. The upgrade-path gate now applies that remedy itself and fails if it does not restore a clean typecheck.

### Upgrading

A major version, and still a short list. Nothing was removed, so an app that
upgrades and changes nothing keeps working; each item below is something you
gain by doing, not something that breaks by waiting.

1. **Delete the retired shell files under `components/sidebar/`.** `upgrade`
   names each one it still finds. A local copy is neither overwritten nor an
   error, so nothing breaks if you keep it — it just goes on rendering your old
   sidebar instead of the one in this release. Keep the drill-in panel bodies you
   own and register them through the `drillInPanels` slot.
2. **Only if you scaffolded on 0.10.2 or earlier**, refresh three reference files
   you have probably never touched: `components/library-table.tsx`,
   `components/columns-showcase.tsx`, `components/columns-client.tsx`. 0.11.0
   made `HubTableHandle` generic and stale copies annotate the old shape, so they
   fail `tsc`. Run `exxat-ui upgrade --only <path>` on each. Coming from 0.11.0
   there is nothing to do here — the upgrade-path gate scaffolds an 0.11.0 app,
   installs this release over it, and typechecks it clean with no refreshes.
3. **Move your nav rows onto specs when convenient:**
   `npx exxat-ui codemod nav-specs --dry-run`. JSX icons still render through
   `navFromJsx()`, which reads the class name back off the node — reliable for a
   bare `<i>` and a grey-circle fallback for anything composed. `navFromJsx()` is
   supported through 1.x and goes away in 2.0.
4. **Declare the package files you have forked**, with `exxat-ui eject <path>`.
   The first upgrade after this release also converts existing drift for you,
   marking those rows `declaredBy: "upgrade-migration"`. An undeclared edit to a
   package-owned file is the one thing an upgrade can still spend.

## 0.11.0 — 2026-08-14

### Breaking (imports)

- **`chart` leaves the root barrel.** `@exxatdesignux/ui` no longer re-exports Recharts, so importing anything from the root stops pulling the charting library in behind it. Import from the subpath instead: `import { ChartContainer } from "@exxatdesignux/ui/components/chart"`. Hub list pages also lazy-load `ExportDrawer`, so it enters the graph when export opens rather than with the template.

### Added

- **`openRowId`** on `HubTable`, `DataTable`, and `DataRowList` — the grid draws a leading bar on the row a detail rail is reading, the list view rings the card, and both set `aria-current`. Passing it at all (even `null`) marks rows as rail triggers, so clicking a second row retargets an open rail instead of dismissing it. Uses a new `--dt-row-open-marker` token rather than the selection fill, because a row can be both selected and open.
- **`HubTableHandle.visibleRows`** — the rows the hub is showing after search, filters, sort, and pagination, so previous / next in a rail steps through what the user is looking at.
- **`rememberScroll`** on `Tabs` — each destination keeps its own scroll position. `ListPageTemplate` hub views get it without a prop; a tab row inside a card leaves it off so flipping a chart never moves the page.
- **`newQuestionPlacement`** on `LibraryPageHeader` (`"header"` default, `"toolbar"`) so the page keeps exactly one filled primary and `⌘⌥N` binds once.

### Changed

- **Design OS accent is the corporate indigo** (`#4152B4`, as Exxat One) instead of the workspace grey it shared with Administrator and Directory. Store migration v19 clears a stored grey on `exxat-design-os`.
- **Leo composer heights** — `AskLeoComposer` controls drop 36px to 32px, so the chat box stands 50px rather than 58px; the assist bar pill and collapsed circle go 50px to 46px (radius 23px), and `SEARCH_BAR_ROW_HEIGHT` is `h-8` so Basic and Leo search modes match. The bar's pixel geometry and its Tailwind classes are now checked against each other in development.
- **Breadcrumbs collapse on room, not on count** — `PageBreadcrumbTrail` measures the row with the same fit ladder the tab rows use and shows every segment that fits; middle segments move into More shallowest first. More is icon-only and now carries a `Tip` beside its `aria-label`. The Tokens hub stops naming itself twice.
- **Add view is icon-only** at every width, with `aria-label` plus a visible Tip, and its loading skeleton is square so the rail no longer shuffles on hydrate. The library's **New question** moves onto the table toolbar row beside Import.
- **Navigational tabs fill the selected glyph** so the active destination reads at a glance.
- **Toolbar actions give up their labels before the filter chips wrap**, collapsing to icons when the rail crowds them rather than truncating a word.
- **The Ask Leo launcher announces itself once** on arrival and then rests, and hands the rails back the way it found them.

### Fixed

- **Keyboard focus rings** no longer cut flat on the near edges of the box around them.
- **Filter editors** close when something opens over them, and only one is ever open at a time.
- **Dragging a secondary rail** no longer thrashes layout every frame; rails also stop getting wider on each page load.
- **Solid buttons paint their whole box**, so a toolbar row lines up with outline siblings.
- **A date range filter pill** reads `12/14/2025 to 12/20/2025` instead of joining the dates with an en dash, and syncs its calendar during render so opening it no longer shows the previous selection for a frame.
- **Floating rails opened from a menu item** no longer close the instant they appear, and a rail's own triggers retarget it instead of dismissing it.
- **React Doctor reads 100** across all three projects, from 81, with no rule disabled and no code suppressed.

Upgrade: `pnpm add @exxatdesignux/ui@0.11.0` then `npx exxat-ui sync-extras`. Ships with `@exxatdesignux/product-framework@0.2.2`. **Update chart imports** to `@exxatdesignux/ui/components/chart` before upgrading if you import `ChartContainer` and friends from the root. Run `exxat-ui upgrade` (after `--check`) for the tab, breadcrumb, filter, and Ask Leo shell ports. Install alone does not rewrite app source.

## 0.10.2 — 2026-08-12

### Fixed

- **Split hub chrome** — Miller column headers span full panel width; outer card top corners no longer square-cut the border; page scroll restored with sticky headers under the views strip.
- **Resize handles** — global `ResizableHandle` shows the grip by default and keeps it sticky in the viewport on tall split hubs (no mid-canvas off-screen grip).
- **Button destructive tones** — full hierarchy mirrors neutral variants: `destructive-solid`, `destructive-outline`, `destructive` (secondary tint), `destructive-ghost`, `destructive-link`. Catalog IA: Variants (neutral) · Destructive (enabled) · Disabled (neutral + destructive rows).
- **Button disabled** — per-variant disabled tokens replace global `opacity-50` so default and outline read consistently; bulk delete uses `destructive-solid`.

Upgrade: `pnpm add @exxatdesignux/ui@0.10.2` then `npx exxat-ui sync-extras`. Run `exxat-ui upgrade` for Resizable, split-hub, and button catalog shell ports.

## 0.10.1 — 2026-08-11

### Fixed

- **Design OS / Columns catalog** — `StatusCell` (and the rest of `table-cells`) now ships from `@exxatdesignux/ui/components/data-views`. Catalog previews import the package export so consumers are not blocked when a local `components/data-views/index.ts` predates StatusCell.
- **`FavoriteToggleButton`** — promoted into the package (used by `FavoriteNameCell`).
- **Semantic status badges** — locked OKLCH lightness recipe (fill L ≈ 95%, text L ≈ 38.5%) via `--status-badge-{tone}-fill` / `-fg` for success / info / warning / danger / neutral. Draft is true grey (chroma 0). Domain map: Compliant → success, In review → info, Due soon → warning, Non-compliant → danger.
- **Utility bar** — trailing actions + identity always `ms-auto` (no hole after profile at Dense / 200% zoom); product sits in equal `px-1.5` between the rail rule and the crumb rule.
- **PageHeader** — title and actions share a centered `min-h-8` row; top padding restored (`pt-3` / `lg:pt-4`).
- **PageHeader tertiary actions** — `PageHeaderActionItem.placement="overflow"` keeps Invite people, Export, Customize folder, and metric toggle under More (never on the title row). Primary stays on the row.
- **Ask Leo docked panel** — Compact flush now includes `data-slot="ask-leo-panel"` (no `rounded-xl` / gutter); overlay sheets stay rounded.
- **Flush page canvas** — `SidebarInset` is edge-to-edge at the source (no card gutters, radius, shadow, or global `pb-6`). Docked secondary / Ask Leo match. Exam lock keeps its inset card. Content `Card`s stay raised on the canvas.
- **Split hub chrome** — Tree & details / List & details (and Library panel splits) fill the page: no nested `rounded-xl` card, no centered `max-w-7xl` gutters.
- **PageHeader actions** — labeled actions use `size="sm"` (`h-8`) to match icon-sm / filter chips; Button base is `box-border` so outline and filled share one footprint.
- **Sticky table headers** — Compact no longer leaves an empty `data-site-header` wrapper; views-toolbar gap is a scrolling spacer (not `mt-*` on the sticky node); pin offset stacks against the live subheader bottom so Chrome does not park the floating thead mid-canvas.
- **Split hub scroll** — Tree / List & details panes bound to `calc(100dvh - 17.5rem)` again so columns own `overflow-y-auto` (flush chrome without the page stealing scroll).

Upgrade: `pnpm add @exxatdesignux/ui@0.10.1` then `npx exxat-ui sync-extras`. Run `exxat-ui upgrade` to refresh Design OS preview imports and shell files. If Catalog still errors on an old local barrel, either upgrade shell files or add `StatusCell` to your `components/data-views` re-exports (starter ships a shim to the package).

## 0.10.0 — 2026-08-11

### Breaking (chrome)

- **Compact is the only shell layout.** `ShellLayoutVariant` is `"compact"` only. Persist key `shell:layout-variant:v3`; legacy ids (`sidebar-classic`, `utility-sidebar`, `utility-bar`, `sidebar`) normalize to compact. Settings → Appearance shell picker and profile Shell layout submenu are removed. Consumer apps on an older package keep multi-layout until they upgrade and port shell files via `exxat-ui upgrade`.

### Changed

- **Utility bar** — height token `--shell-utility-bar-height: 2.625rem` (42px) drives bar height, rail `top`, and compact `--header-height`. Settings gear removed; **Workspace settings** lives in the profile menu. **Onboarding** opens `/builder/onboarding`. Ask Leo stays labeled and pinned on Dense. School and profile avatars both `size-8`. One hover hit shape (`Button` ghost `icon-sm` + `utilityBarActionButtonClass`).
- **Back mode** — on `siteHeader.back` or record-detail chrome: leading back cluster (icon · separator · parent label); trailing **Ask Leo only** (rightmost). Peer jump stays on `PageHeader` (`PageTitleRecordSwitcher`).
- **Sticky stack** — utility bar outside the page scrollport; horizontal `TabsList` and hub view toolbars pin as sticky subheaders under the bar; floating table column headers pin below via `getStickyTableHeaderOffset`.
- **Tabs fit** — overflow region is `w-full`; labels collapse only when the row overflows and re-expand when the viewport can hold them again.
- **Bulk selection bar** — count badge only (no visible “selected” label); `aria-label` still announces selection count.
- **Nav flyouts** — primary / secondary / Ask Leo overlay sheets stack above the utility bar (`[data-app-shell-row]` rises while open) and keep sheet shadow under Compact.
- **Dense utility bar** — uniform `gap-1` / `mx-1`; breadcrumb uses text labels (no house icon for the first crumb).
- **PageHeader compact** — collaborator faces collapse to a count control; primary CTA stays on the row as icon-only (never in More); secondary actions overflow; count / primary / More share `icon-sm` alignment.
- **Builder dev sync** (via `@exxatdesignux/product-framework@0.2.1`) — no empty catalog wipe on fresh hydration; Vite 409 on empty overwrite when on-disk catalog has entries.

Upgrade: `pnpm add @exxatdesignux/ui@0.10.0` then `npx exxat-ui sync-extras`. Run `exxat-ui upgrade` (after `--check`) to port Compact-only utility bar, Back chrome (`utility-bar-page-chrome.tsx`), sticky hub/tabs shell, and related shell files. Install alone does not rewrite app source.
