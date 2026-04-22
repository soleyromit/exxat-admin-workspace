# Changelog

All notable changes to this monorepo are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
where version numbers apply to published packages (workspace root remains `0.0.0`).

## [Unreleased]

_Add future changes here before a release._

## [2026-04-16]

### Added

- `CHANGELOG.md` — human-readable history for GitHub and clones.
- `apps/web` — Ask Leo composer surface, route context helpers, system banner slot + context, Help route, settings form/appearance helpers, AI thinking / status / dot-pattern UI pieces, mock assets under `public/`.
- `apps/web/lib` — `logo-dev.ts`, `motion-ui.ts`, `stock-portrait.ts` for sidebar and profile imagery.
- `packages/ui` — `status-badge` export and related UI tokens where wired.

### Changed

- **Sidebar / shell** — Product header: expanded shows full `ExxatProductLogo` + chevron; collapsed shows `ExxatProductMark` only, sized to match school avatar inner glyph (`size-7` in `size-8` slot). School row: chevron only when expanded (not on icon rail). `SidebarMenuButton` no longer forces `size-4` on `data-product-logo` / `data-product-logo-mark` SVGs (fixes microscopic wordmarks).
- **Avatar** — `AvatarImage` defaults `referrerPolicy="no-referrer"` for external portraits; callers can override (e.g. school logos).
- **Ask Leo** — User message avatars use `NAV_USER` portrait like the main nav user.
- **Navigation mock** — `NAV_USER` / schools / command menu and related config updates.
- **Design system package** — `sidebar`, `dropdown-menu`, `command`, `kbd`, `banner`, `coach-mark`, `selection-tile-grid`, hooks (`use-app-theme`, `use-coach-mark`), `globals.css` refinements.
- **Apps/web** — Settings, dashboards, data list / team / compliance / export / table properties / list template tweaks; `globals.css`, `next.config`, `tsconfig`.

### Removed

- **Library** — Dedicated library app routes, catalog, and preview components (replaced or deferred per product direction).
- **Patterns** — `patterns/*` example routes under the app.
- **Misc** — `content-rail` and other unused pieces tied to the above.

---

**How to maintain:** Before merging meaningful work, add bullets under `[Unreleased]` (or the current date section). When you cut a release, rename the date section to a version (e.g. `## [1.2.0] - 2026-04-20`) and start a fresh `[Unreleased]`.
