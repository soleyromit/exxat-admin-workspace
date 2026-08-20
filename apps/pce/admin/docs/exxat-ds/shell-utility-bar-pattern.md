# Shell utility bar

**Code:** `components/utility-bar-slot.tsx`, `contexts/shell-layout-context.tsx`, wired in `src/App.tsx`. Catalog doc: `lib/design-system/component-docs/utility-bar.tsx`.

## Role

One persistent row for **global** actions — Search (⌘K), Ask Leo (⌘⌥K), Notifications, Help, Settings, Profile — so product surfaces do not duplicate triggers in the sidebar or page header.

## Shell layout variants (`ShellLayoutContext`)

| Variant | Utility bar | Product switcher |
|---------|-------------|------------------|
| `sidebar-classic` | Not mounted | Sidebar header |
| `utility-sidebar` | Inside `[data-app-shell-workspace]` (secondary + main only) | Sidebar header |
| `utility-bar` | Full-width row **above** `[data-app-shell-row]` | Left cluster on bar |

User preference: **Settings → Appearance → Shell layout**.

## Spacing (full-width `utility-bar`)

- Utility bar height: `h-12` (`3rem`) on `[data-slot="utility-bar"]`.
- `[data-shell-utility-bar-full]` on `SidebarShell` — `packages/ui/src/globals.css` pins fixed sidebar below the bar (`top: 3rem`) and removes workspace top padding so rails + main sit flush under the bar.
- **MUST NOT** stack `pt-12` on `AppSidebar` when CSS already offsets the fixed rail.

## Components

| Piece | Location |
|-------|----------|
| Mount + variant branching | `src/App.tsx` (`AppShellLayout`) |
| Bar chrome | `components/utility-bar-slot.tsx` |
| Product switcher (utility-bar only) | `components/utility-bar-product-switcher.tsx` |
| Notifications | `components/notification-bell.tsx` |
| Profile menu | `components/utility-user-menu.tsx` |
| Action button class | `components/utility-bar-chrome.ts` |

## MUST

1. Reuse canonical triggers — `requestOpenCommandMenu`, `AskLeoToggle`, `getSecondaryNavForProduct`, `NAV_USER` — not duplicates in sidebar when utility bar is active.
2. Use `utilityBarActionButtonClass` for icon buttons on the bar.
3. Suppress bar on focus shells (`exam-lock`, `/builder/onboarding`).

## MUST NOT

- Add page-local Search / Ask Leo / Notifications when the bar is mounted for that layout variant.
- Hardcode Settings URL — resolve via `getSecondaryNavForProduct(product)`.

## See also

- `docs/command-menu-pattern.md` — ⌘K palette
- `docs/ask-leo-pattern.md` — thread primitives + sidebar
- `.cursor/rules/exxat-utility-bar.mdc`
