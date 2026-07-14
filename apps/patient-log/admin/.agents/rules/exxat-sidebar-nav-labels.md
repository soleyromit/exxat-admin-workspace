---
description: Primary and secondary sidebar nav labels — full visible text, no ellipsis
activation: glob
globs: "**/app-sidebar.tsx,**/navigation*.tsx,**/lib/mock/navigation.tsx,**/secondary-nav.tsx,**/library-secondary-nav.tsx,**/secondary-panel.tsx,**/sidebar.tsx"
---

<!-- Synced from .agents/rules/exxat-sidebar-nav-labels.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — sidebar nav labels (no truncation)

Primary and secondary sidebar / scope-panel rows **MUST** show the **full** nav label. Users should not need a hover tooltip to read a route name on the expanded rail.

## MUST

1. **Wrap, do not truncate** labels on the **expanded** primary sidebar and secondary panel scope rails.
2. Use **`SidebarNavLabel`** from `@exxatdesignux/ui/components/sidebar` (or app shims) for every visible label inside **`SidebarMenuButton`**, **`SidebarMenuSubButton`**, and secondary-panel link rows (`library-secondary-nav`, `secondary-nav`).
3. **Row chrome:** menu buttons use **`min-h-8 h-auto`** (sub-buttons **`min-h-7 h-auto`**); **`overflow-visible`** on the control — never **`truncate`** / **`text-ellipsis`** on nav copy.
4. **Badges** — primary rows: `ms-auto` inside the link; **child sub-menu rows:** flex sibling with `self-center` + `me-2` (`--exxat-spacing-2`); collapsed icon rail uses dot indicator only.
5. **Icon rail:** visible labels are hidden by DS chrome; the button **`tooltip`** carries the full string.

## MUST NOT

- Put **`truncate`** or **`text-ellipsis`** on primary sidebar, secondary panel scope rail, or collapsible child labels.
- Use bare **`<span>{title}</span>`** for sidebar nav labels — always **`SidebarNavLabel`** so `[data-sidebar-nav-label]` enforcement applies.
- Shorten long product copy in **`navigation.tsx`** to fit one line — let labels wrap.

## Enforcement

- DS primitive: `packages/ui/src/components/ui/sidebar.tsx` — `SidebarNavLabel`; button variants target `[&_[data-sidebar-nav-label]]`.
- Global CSS: `packages/ui/src/globals.css` — no ellipsis on `[data-sidebar-nav-label]`.

## See also

- **`exxat-sidebar-shell.md`** — sidebar chrome (IA vs pixels)
- **`AGENTS.md` §9.1** — application sidebar shell
- **`exxat-ds-skill` §3.1** — nav label wrapping
