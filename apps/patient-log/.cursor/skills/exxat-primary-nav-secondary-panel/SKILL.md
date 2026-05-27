---
name: exxat-primary-nav-secondary-panel
description: Exxat DS pattern — one primary sidebar row opens a nested SecondaryPanel (Library). NavLinkItem.secondaryPanel id, PANELS registry, useAutoPanel on hub, URL scope + same useTableState rows. Use when adding hub scoped nav (All/My/tree) beside content.
user-invocable: true
---

# Exxat DS — primary nav → secondary panel

**Cursor rule:** `.cursor/rules/exxat-primary-nav-secondary-panel.mdc`  
**Handbook:** `apps/web/AGENTS.md` §4.6

## Wiring checklist

1. **`lib/mock/navigation.tsx`** — set **`secondaryPanel: "<id>"`** on the primary **`NavLinkItem`**; **`url`** = hub route.
2. **`components/secondary-panel.tsx`** — add **`PANELS["<id>"]`** → panel shell (title, optional search) + secondary nav component.
3. **Hub client** — mount **`*PanelActivator`** with **`useAutoPanel("<id>")`** (same id) for the lifetime of the route (e.g. `LibraryPanelActivator`).
4. **Data** — keep **one** **`useTableState`** / **`tableState.rows`**; drive scope from **URL** + small helpers (see **`lib/library-nav.ts`**).
5. **Folder-scoped hub header (Library library)** — When **`scope === "folder"`** in the URL, **`LibraryPageHeader`** **⋯ More** includes **Customize folder**; mount **`LibraryNewFolderSheet`** on **`LibraryClient`** so it works on **all** **`ListPageTemplate`** view tabs — **`.cursor/rules/exxat-library-hub-header.mdc`**, **`docs/library-hub-header-pattern.md`**.
6. **Collapse control** — the nested rail header uses **`collapseActiveSecondaryPanel()`** (angles-left icon), not “close”, so the panel stays dismissed until **`openPanel`** runs again (nav, scope hook, or hub re-entry). Layout effects that auto-call **`openPanel`** must respect **`secondaryPanelAutoReopenSuppressed`** (see **`app/(app)/library/layout.tsx`** + **`SecondaryPanelProvider`**).
7. **Surface elevation** — secondary panel = **level 1** (lighter than sidebar, darker than page). Use **`--secondary-panel-bg`** on **`NestedSecondaryPanelShell`**; derive from **`--brand-tint*`** per active product (**One** indigo, **Prism** rose). See **`docs/shell-surface-elevation-pattern.md`**.

## MUST NOT

- Set **`secondaryPanel`** without **`PANELS[id]`** + **`useAutoPanel`** — broken empty rail.
- Use this for full product areas that belong as **primary** or **collapsible child** rows.
- Invent a parallel zoom / reflow hook for the secondary rail — reuse **`useSidebarReflowZoom`** (the provider already wires it; see §"High-zoom auto-collapse" below).
- Set secondary panel **`bg-sidebar`** or a fixed rose mix for every product — breaks **One** indigo chrome.

## High-zoom auto-collapse

`SecondaryPanelProvider` reads **`useSidebarReflowZoom()`** (zoom ≥ 200% or very short viewport — same WCAG 1.4.10 signal the primary sidebar uses). On entering high zoom it sets `secondaryPanelCompact = true` so the 16 rem rail drops to the 3 rem icon variant and frees up content space. The user can still re-expand manually (via the icon rail's "Show labels" affordance or any `openPanel` trigger); the next zoom-out → zoom-in cycle re-collapses it. `openPanel` itself opens directly in compact mode when high zoom is already active so newly-navigated panels don't flash expanded.

Custom panel content (anything you register under `PANELS[id]`) should **read `secondaryPanelCompact` from the provider context** and render an icon-only layout in that branch — `LibraryPanel` / `LibrarySecondaryNav` are the reference.

## Pair with

- **Collapsible parent ↔ children sidebar pattern** (§3.2 of `exxat-ds-skill`) — when the same primary row also lists sub-routes inline.

## Reference

- `components/app-sidebar.tsx` — `openPanel` on same-route primary click.
- `components/secondary-panel.tsx` — `SecondaryPanelProvider`, `PANELS` registry, **high-zoom auto-collapse**.
- `hooks/use-sidebar-reflow-zoom.ts` — shared zoom / reflow signal.
- `components/templates/nested-secondary-panel-shell.tsx` — expanded vs `compact` (icon rail) widths; **`bg-[var(--secondary-panel-bg)]`**.
- `app/globals.css` — `--secondary-panel-bg`, `--sidebar`, product **`theme-one`** / **`theme-prism`** blocks.
- `contexts/product-context.tsx` — `accentOverrideActive`, theme class on `<html>`.
- **`docs/shell-surface-elevation-pattern.md`**
- `components/library-secondary-nav.tsx` + `lib/library-nav.ts`.
- **Folder-scoped header customize:** `components/library-page-header.tsx`, `components/library-client.tsx` — **`docs/library-hub-header-pattern.md`**, **`.cursor/rules/exxat-library-hub-header.mdc`**.
