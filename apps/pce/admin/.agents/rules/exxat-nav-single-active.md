---
description: Sidebar and secondary nav — exactly one active item per route (longest path match)
activation: glob
globs: "**/app-sidebar.tsx,**/secondary-nav.tsx,**/navigation.tsx,**/lib/nav-active.ts"
---

<!-- Synced from .agents/rules/exxat-nav-single-active.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — single active nav item (MUST)

Only **one** primary sidebar row, collapsible child, or secondary-panel link may show the active/selected state for the current route.

## MUST

1. **Use shared helpers** from `@exxatdesignux/ui/lib/nav-active` (or the app copy synced from the DS template):
   - `collectNavUrls` + `buildNavHashClaims` for the full nav tree
   - `isNavHrefActive(pathname, url, allNavUrls, { locationHash, hashClaimsByPath })` for sidebar `SidebarMenuButton` / `isActive`
   - `resolveActiveNavHref(pathname, allLinkHrefs)` for secondary-panel links — compare the returned href to each link’s `href` (longest prefix wins)
2. **Never** mark a nav item active with bare `pathname === href` or `pathname.startsWith(href + "/")` when other nav targets share that prefix (e.g. `/dashboard` vs `/dashboard/students`).
3. **Hash disambiguation** — when multiple items share the same path (e.g. `/settings` vs `/settings#appearance`), use `buildNavHashClaims` so the no-fragment row defers to the hash-specific row.
4. **Collapsible parents** — when any child is active, the **parent** row stays visually neutral in the expanded sidebar; only the child gets `data-active` (icon rail may still highlight the parent — see `isCollapsibleParentMenuButtonActive` in `app-sidebar.tsx`).
5. **Keep `ListPageTemplate.supportedViewTypes` and `HubTable.supportedViewTypes` in sync** on the same hub — default **`FULL_HUB_SUPPORTED_VIEWS`** (seven views). See **`exxat-hub-supported-views.md`** for renderer requirements.

## MUST NOT

- Duplicate bespoke `isNavActive` / `isActive` logic that ignores longest-prefix matching.
- Ship a new nav surface (sidebar, secondary rail, hub scope list) without wiring the helpers above.

## Reference

- `packages/ui/src/lib/nav-active.ts`
- `packages/ui/generated-starter/components/sidebar/app-sidebar.tsx`
- `packages/ui/generated-starter/components/sidebar/secondary-nav.tsx`
