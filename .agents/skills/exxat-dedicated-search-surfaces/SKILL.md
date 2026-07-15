---
name: exxat-dedicated-search-surfaces
description: >-
  Dedicated search landing vs results split, URL composer, recents storage, and templates
  (generic DedicatedSearch*). Use when adding a route pair like empty ?q= landing + ListPageTemplate results,
  or wiring localStorage recents without hydration mismatches.
---

# Dedicated search surfaces (Exxat DS)

## When to use

- A hub exposes **two URL states** on the same feature: **landing** (no primary query / empty `?q=`) vs **results** (non-empty query drives `ListPageTemplate` / `DataTable`).
- You need an **AI-style composer** that **updates the URL** with `router.replace` and **does not** open Ask Leo.
- You need **recent searches** persisted in `localStorage` **without** SSR/client markup drift.

## MUST

1. **Hydration-safe recents** — **MUST NOT** read `localStorage` in `useState` initializers. Initial client paint **MUST** match the server (`[]` then `useEffect` sync). See **`DedicatedSearchRecents`**.
2. **Generic names** — Reusable pieces live under **`DedicatedSearch*`** (`components/dedicated-search-*.tsx`, **`components/templates/dedicated-search-*-template.tsx`**, **`lib/dedicated-search-*.ts`**). Hub code passes **`patchSearchParams`**, **`recents` controller**, copy, and entity table — **MUST NOT** fork parallel “question search landing” components for a second hub.
3. **Landing shell** — Use **`DedicatedSearchLandingTemplate`** (`ListPageViewFrame` + title + composer slot + optional trailing).
4. **Results chrome** — Reuse **`DEDICATED_SEARCH_RESULTS_OUTER_CONTENT_CLASSNAME`** on the hub content wrapper and **`DedicatedSearchResultsHeaderChrome`** around page header + composer strip.
5. **Namespaces recents** — Use **`createDedicatedSearchRecentsController(namespace, legacy?)`** from **`lib/dedicated-search-recents.ts`**. When replacing an existing storage key, pass **`legacy: { storageKey, eventName }`** so users do not lose saved rows.

## MUST NOT

- Gate render on **`typeof window`** for the **first** paint of recents or landing bodies.
- Duplicate the landing vertical rhythm (`mt-*` between title, composer, recents) outside the template without updating the template for product-wide consistency.

## References (apps/web)

| Piece | Path |
|-------|------|
| Landing template | `components/templates/dedicated-search-landing-template.tsx` |
| Results chrome | `components/templates/dedicated-search-results-template.tsx` |
| URL composer | `components/dedicated-search-url-composer.tsx` |
| Recents list | `components/dedicated-search-recents.tsx` |
| Recents storage factory | `lib/dedicated-search-recents.ts` |
| Optional default `q` patcher | `lib/dedicated-search-url.ts` |
| Library adapter (placeholders + patch) | `lib/library-dedicated-search.ts` |
| Library wiring | `components/library-client.tsx` |

## Cursor rule

- **`.agents/rules/exxat-dedicated-search-surfaces.md`**
