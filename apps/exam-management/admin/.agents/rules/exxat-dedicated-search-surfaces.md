---
description: Dedicated search surfaces — DedicatedSearch* templates, recents storage, landing-vs-results URL composer. Auto-attaches when editing search-related React routes.
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-dedicated-search-surfaces.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — dedicated search surfaces

**Authoritative detail:** **`./AGENTS.md` §4.8**, **`.agents/skills/exxat-dedicated-search-surfaces/SKILL.md`**.

## Intent

Some hubs use **one route** (or sibling routes) with **empty vs non-empty** primary search query:

- **Landing** — centered hero, composer, optional recents; no results grid (or minimal chrome).
- **Results** — `ListPageTemplate` + table/list driven by the same filtered row bag as the rest of the hub.

Shared building blocks use **generic** `DedicatedSearch*` names under `components/`, `components/templates/`, and `lib/dedicated-search-*.ts`. Domain code passes **`patchSearchParams`**, **recents controller**, and copy.

## MUST

- Keep **first paint** of recents **storage-free** (no `localStorage` in `useState` initial state) — see skill.
- Prefer **`DedicatedSearchLandingTemplate`**, **`DedicatedSearchUrlComposer`**, **`DedicatedSearchRecents`**, **`DedicatedSearchResultsHeaderChrome`**, **`DEDICATED_SEARCH_RESULTS_OUTER_CONTENT_CLASSNAME`** before copying markup into a new hub.

## MUST NOT

- Introduce parallel `*LibrarySearchLanding*` (or similar) components for another entity — extend the generic layer and compose in the hub client.

## See also

- **`exxat-list-page-connected-views.md`**, **`exxat-centralized-list-dataset.md`** — results branch still uses one row bag + `ListPageTemplate`.
