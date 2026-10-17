---
description: Exxat DS — show Kbd hints on primary/secondary actions, search, Ask Leo; never collide with OS/browser shortcuts.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-kbd-shortcuts.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — keyboard shortcuts (`Kbd`)

## When to show `Kbd`

Use `@/components/ui/kbd` (`Kbd` + `KbdGroup`) anywhere users discover actions by hovering or reading tooltips:

- **Primary actions** — main page CTAs (e.g. “New …”, “Save”, “Submit”).
- **Secondary actions** — overflow menus, “More”, outline companions to a primary button.
- **Global affordances** — **Search** (table toolbar), **Ask Leo**, **Toggle sidebar**.
- **Bulk selection bar** — inline bare `Kbd` on every labeled bulk action (see `exxat-bulk-action-shortcuts.md`).

## Rules

0. **`Kbd` variant MUST match its host surface** (this is the #1 recurring mistake):

   | Where the `Kbd` renders | Required variant |
   |-------------------------|------------------|
   | Inside a `Button` (primary, secondary, wizard Next/Back/Submit, bulk bar, full-width CTAs) | **`variant="bare"`** — no bg/border, inherits `currentColor` @ 70 % |
   | Inside a `TooltipContent` | **default `tile`** (no prop) |
   | Inside a `DropdownMenuItem` via `shortcut=` | menu handles it — pass the chord string |
   | Standalone helper text on a surface | **default `tile`** |

   Glue multi-key chords into **one** bare kbd (`<Kbd variant="bare">⌘⌥K</Kbd>`), not one tile per key.

1. **Pair hint with behavior** — If `Kbd` shows a chord, implement the same shortcut. **Preferred:** the shared primitives from `@/components/ui/dropdown-menu`:

    ```tsx
    import { DropdownMenuItem, Shortcut } from "@/components/ui/dropdown-menu"

    <DropdownMenuItem shortcut="⌘⌥E" onSelect={onExport}>Export</DropdownMenuItem>
    <Shortcut keys="⌘⌥E" onInvoke={onExport} />
    ```

    The hook skips input/textarea/contenteditable targets and any open dialog. Accepts symbols (`⌘⇧⌥⌃⌫⌦⏎↑↓`) and words (`Cmd+Alt+E`, `Alt+P`). Avoid ad-hoc `document.addEventListener("keydown", …)` — use `<Shortcut>` instead.

2. **Modifier labels** — Use `useModKeyLabel()` (**⌘** / **Ctrl**) and `useAltKeyLabel()` (**⌥** / **Alt**) from `@/hooks/use-mod-key-label`.

3. **Preferred pattern for app shortcuts** — **⌘⌥** / **Ctrl+Alt** + letter (e.g. **⌘⌥N** New, **⌘⌥M** More, **⌘⌥K** Ask Leo, **⌘⌥E** Export). Table search stays **⌘K** / **Ctrl+K** **without** Alt so **⌘⌥K** does not collide.

4. **Never bind** these (browser / OS / hard-reserved). Do not use them for in-app `<Shortcut>` or bulk actions:

   | Chord | Why |
   |-------|-----|
   | **⌘/Ctrl + N, T, W, R, P, F, S, L** (mod only) | New window/tab, close, reload, print, find, save, address bar |
   | **⌘⇧N / Ctrl+Shift+N** | Private / Incognito |
   | **⌘⇧T / Ctrl+Shift+T** | Reopen closed tab |
   | **⌘⇧O / Ctrl+Shift+O** | Bookmark manager (Chromium) |
   | **⌘⇧B / Ctrl+Shift+B** | Bookmarks bar |
   | **⌘⇧E / Ctrl+Shift+E** | Finder Eject (macOS); Edge Collections; prefer **⌘⌥E** |
   | **⌘⇧I / Ctrl+Shift+I** | DevTools / “Email page” (Mail) |
   | **⌘⇧J / Ctrl+Shift+J** | DevTools console |
   | **⌘⇧R / Ctrl+Shift+R** | Hard reload |
   | **⌘⇧C / Ctrl+Shift+C** | Inspect element |
   | **⌘⌥← / Ctrl+Alt+←** and **→** | Previous / next tab (Chromium) — avoid for new bindings |
   | **⌘D / Ctrl+D** | Bookmark page — never as a global app shortcut |
   | **⌘I / Ctrl+I** | Email page / italics — never global |
   | **⌘⌫ / Ctrl+Backspace** | Delete to line start / Finder trash — use **⌘⌥⌫** for destructive bulk |
   | **⌘Q** | Quit app (macOS) |
   | **⌃⌥L / Ctrl+Alt+L** | Screen lock (many Linux desktops) |
   | **Ctrl+Alt+Delete** | Windows security screen |

5. **Tooltips** — `Tip` supports `label` as `React.ReactNode` so you can compose text + `KbdGroup`.
6. **Do not** decorate every control — skip dense tables, icon-only row actions that already have `aria-label`, and third-party widgets.

## Reference shortcuts (app)

| Action | Shortcut | Notes |
|--------|----------|-------|
| Toggle main sidebar | ⌘/Ctrl + **B** | Browser-safe in content |
| Table search / command menu | ⌘/Ctrl + **K** (no Alt) | |
| Ask Leo | ⌘/Ctrl + **⌥/Alt** + **K** | |
| New record (primary hub header) | ⌘/Ctrl + **⌥/Alt** + **N** | Not ⌘N; inline bare `Kbd` — see `exxat-primary-button-shortcuts.md` |
| Import (admin hub primary) | ⌘/Ctrl + **⌥/Alt** + **U** | |
| Hub overflow menu (⋯) | ⌘/Ctrl + **⌥/Alt** + **M** | |
| Export | ⌘/Ctrl + **⌥/Alt** + **E** | Not ⌘⇧E |
| Focus workflow (demo) | ⌘/Ctrl + **⌥/Alt** + **W** | Not ⌘⌥N |
| Exam lock (demo) | ⌘/Ctrl + **⌥/Alt** + **Z** | Not ⌘⌥E |
| Bulk Favorite | ⌘/Ctrl + **⌥/Alt** + **F** | See `exxat-bulk-action-shortcuts.md` |
| Bulk Archive | ⌘/Ctrl + **⌥/Alt** + **A** | |
| Bulk Delete | ⌘/Ctrl + **⌥/Alt** + **⌫** | Not ⌘⌫ |
| Clear row selection | **Esc** | DataTable bulk bar |
| Hide/Show metric section | ⌘/Ctrl + **⌥/Alt** + **H** | |
| Rename (view, tab) | **F2** | Scoped; skipped in inputs |
| Duplicate (menu hint only) | Prefer **⌘⌥D** if binding globally | Avoid ⌘D (bookmark) |
| Review / Info (menu hint only) | Prefer **⌘⌥I** if binding globally | Avoid ⌘I (Mail / italics) |
| Add view (1..n) | **1..9** | Skipped in inputs / open dialogs |
| **Submit a workflow** | **Enter** (⏎) | Scoped to form/drawer/dialog |
| **Cancel / dismiss** | **Esc** | Radix Dialog/Sheet |
| **Advance a multi-step wizard** | ⌘/Ctrl + **Enter** | Plain Enter stays in the input |
| **Back** in a wizard | Prefer ⌘/Ctrl + **⌥/Alt** + **[** or documented Back | Avoid new ⌘⌥← (tab switch) |

## Every workflow primary/secondary action MUST carry shortcuts

Every **workflow surface** (form, dialog, drawer, sheet, multi-step wizard final step) MUST bind:

1. **Primary action (submit/commit)** — **Enter** (⏎). Render the `<Kbd>⏎</Kbd>` **inline inside the button** (after the label, inside a `<KbdGroup className="ml-1.5">`) — NOT inside a hover `Tip`. Pair with `<Shortcut keys="Enter" onInvoke={...}>` while the surface is open.
2. **Secondary action (Cancel/Dismiss)** — **Esc**. Inline `<Kbd>Esc</Kbd>` inside Cancel. Radix already binds Esc on Dialog/Sheet/AlertDialog.

> **Filled primary header CTAs** and **bulk bar** / **workflow** labeled buttons expose the Kbd **inline** at rest. Tip-on-hover remains correct for **icon-only** overflow (⋯) and secondary outline actions.

**Variant inside a button:** always `<Kbd variant="bare">`.
3. **Multi-step wizards** — plain **Enter** must NOT submit on intermediate steps. Gate `form.onSubmit` on the last step, or bind **⌘Enter** to Next. On the final step, plain **Enter** submits.
4. Examples: `new-library-item-form.tsx`, `export-drawer.tsx`.

## Every action menu MUST carry shortcuts

All dropdown action menus (⋯ overflow, view-settings, Add view, row actions) should declare `shortcut=` on each `DropdownMenuItem` AND pair with a `<Shortcut>` in a parent that stays mounted. Chords in menus must still pass the **Never bind** table when those `<Shortcut>`s are global.

Adjust this table when adding new global shortcuts.

## See also

- **`exxat-bulk-action-shortcuts.md`** — bulk bar chords (⌘⌥ family only).
- **`./AGENTS.md`** §7 — keyboard rules in project context.
- **`docs/exxat-ds/command-menu-pattern.md`** — ⌘K vs Ask Leo ⌘⌥K.
