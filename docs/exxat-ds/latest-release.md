# @exxatdesignux/ui — upgrade notes (bundled)

> **Agents:** read this before porting shell after `pnpm add @exxatdesignux/ui@…` / `npm install`.
> Default is **install only**. Run `exxat-ui upgrade` only when the notes (or the user) ask for shell sync.
> Binding rule: `exxat-consumer-package-upgrade`. Skill: `exxat-package-upgrade`.
>
> This file is the **latest 5 releases** only. Full history:
> https://github.com/ExxatDesign/Exxat-DS-Workspace/blob/main/packages/ui/RELEASES.md
>
> Also available as `docs/exxat-ds/latest-release.md` after `exxat-ui sync-extras`.

## 1.6.3 — 2026-08-27

Record detail and focus routes needed breadcrumb chrome and header actions
that stay reachable after scroll without a second sticky row.

### Added

- **Utility bar Breadcrumb mode.** Record detail routes show the ancestor
  trail in the bar (Ask Leo stays rightmost). Back mode unchanged for focus
  flows with `siteHeader.back`.
- **PageHeader scroll relocation.** On Back / Breadcrumb chrome, header
  actions port beside Ask Leo when the page scrolls.
- **`DropdownButton`.** Menu trigger (and optional split primary + chevron)
  across default, outline, secondary, ghost, and link variants.

### Fixed

- Split dropdown button height and fused corner rendering in `ButtonGroup`.
- Button default size tier aligned to h-8 for toolbar parity.

### Upgrading from 1.6.2

`pnpm add @exxatdesignux/ui@1.6.3`, then `exxat-ui upgrade` for shell paths
(`utility-bar-slot`, `site-header`, `app-shell-providers`,
`page-header-scroll-actions-bridge`).

## 1.6.2 — 2026-08-24

Customer chats were opening at ~32% context on a simple page. Cursor
always-injects `AGENTS.md` plus every `alwaysApply` rule. Five always-on
essays plus two fat handbooks were the cost, not the page.

### Fixed

- **One always-on rule.** Only `_constitution.exxat-ds.mdc` is
  `alwaysApply: true`. Product, routing, discovery, and copy detail attach
  by glob or on demand. The brief-gate hook still blocks a new surface
  without a brief.
- **Create-page path.** Hooks tell the agent to run the surface router and
  post the brief. They no longer say to load `exxat-senior-ux` or
  `exxat-token-economy` unless IA is undecided.
- **Smaller consumer catalog.** `better-*`, `shadcn`, and `graphify` stay
  in the DS monorepo. Product `exxat-*` skills still ship.

### Added

- **Campus workspace chrome.** New homes share one greeting row: program
  picker and Administrator as matching pills on the right. Campus, Campus
  v3, and Spotlight v3 keep a **Workspace** section for People and Courses;
  Administrator opens from the header, not Your App. Program Admin scope
  (`All programs` / `3 programs`) stays in the accessible name only.

### Upgrading from 1.6.1

`exxat-ui sync-extras`, then start a new Cursor chat.

## 1.6.1 — 2026-08-24

`exxat-ui init` and `pnpm install` fail on pnpm 10+ with
`ERR_PNPM_IGNORED_BUILDS` for `esbuild`. pnpm no longer reads the `pnpm`
field in `package.json`, so the starter's `onlyBuiltDependencies` never
applied.

Cursor always-injects every file named `AGENTS.md`. The scaffold shipped
three fat copies (~292 KB) so a simple page task opened at ~32% context
before any product file.

### Fixed

- **pnpm 10/11 install.** Fresh scaffolds write `pnpm-workspace.yaml` with
  `onlyBuiltDependencies` (`esbuild`, `msw`, `sharp`, `unrs-resolver`)
  before `pnpm install`. `exxat-ui sync-extras` merges the same keys into
  existing apps without wiping `packages:` or `minimumReleaseAgeExclude`.
- **Agent token burn.** Skill folders no longer ship `AGENTS.md`. The Vercel
  compiled guide lives at `references/react-best-practices.md`. Consumer
  `./AGENTS.md` is a short pointer; the §-numbered manual is
  `docs/exxat-ds/handbook/agents-handbook.md` (on demand). `exxat-ui
  sync-extras` replaces the known 76 KB starter copy and `exxat-ui doctor`
  flags leftovers.

### Upgrading from 1.6.0

If install already failed, add `pnpm-workspace.yaml` (or run
`exxat-ui sync-extras` after this release), then `pnpm install`.

After `sync-extras`, **start a new Cursor chat**. The old fat `AGENTS.md`
files stay in the previous chat's context until you do.

## 1.6.0 — 2026-08-23

Spotlight v3 puts What's new in the right rail with a carousel. The utility
bar opens a What's new sheet for featured release notes. A Carousel primitive
ships for product marketing rails.

### Added

- **`WhatsNewSheet`.** Right sheet for featured release notes from the utility
  bar gift icon. Pattern doc, agent skill, and scoped rule ship in
  `consumer-extras`.
- **`Carousel`.** Embla-based carousel with DS chevron controls, keyboard
  parity, and `Tip` on icon-only prev/next. Exported from `@exxatdesignux/ui`.
- **Spotlight v3 home.** Workspace card matches Your App styling. What's new
  sits below Workspace in one sticky right column with carousel layout on
  desktop and stacked cards on mobile.

### Changed

- **Utility bar.** What's new entry in the shell utility bar and user menu
  preview wiring in Design OS docs.
- **Campus home.** Workspace record order is People, Course, Program to match
  the owned index.

### Upgrading from 1.5.1

Install `@exxatdesignux/ui@1.6.0`. Run `exxat-ui upgrade --check`. If the
report lists Spotlight v3 shell files (`spotlight-v3-home.tsx`,
`product-home-parts.tsx`, `utility-bar-slot.tsx`, or `utility-user-menu.tsx`),
run `exxat-ui upgrade`. Product-framework 0.2.5 still applies.

## 1.5.1 — 2026-08-20

Vite consumers of 1.5.0 crash on load with `useLeoAmbience must be used within
LeoAmbienceProvider` even when `LeoAmbienceProvider` is mounted. The published
build inlined a private copy of every shared module into each entry, so the
provider and the Ask Leo launcher held different React contexts. Install 1.5.1
only. No `exxat-ui upgrade` and no app-source change.

### Fixed

- **Singleton dist entries.** Sibling imports stay imports in the published
  JS (`@exxatdesignux/ui/components/ui/leo-ambience-context` from the launcher,
  not an inlined copy). The same repair covers ThemeProvider, shortcut scope,
  and other modules that hold runtime identity.
- **Publish gate.** `check:dist-singletons` fails the release if a context or
  store is duplicated across `dist/` bundles.

### Upgrading from 1.5.0

Install `@exxatdesignux/ui@1.5.1` and `@exxatdesignux/product-framework@0.2.5`.
Restart the Vite dev server so `node_modules/.vite/deps` is rebuilt. The Leo
crash does not need `exxat-ui upgrade`.

If `tsc` fails on a Product map after this install, the Programs product is
new. Apps that still own `lib/product-glyph.ts` from a 1.2.0-era ledger should
run `exxat-ui upgrade --only lib/product-glyph.ts --force` (and the same for
`lib/mock/navigation.tsx` if the typechecker names it).
