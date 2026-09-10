---
description: Exxat DS — every filled primary PageHeader CTA MUST declare, show, and bind a keyboard shortcut (⌘⌥ / Ctrl+Alt family).
activation: glob
globs: "**/page-header*.tsx,**/library-page-header.tsx,**/admin-hub-client.tsx,**/tokens-themes-client.tsx,**/*-page-header.tsx"
---

<!-- Synced from .agents/rules/exxat-primary-button-shortcuts.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — primary header button shortcuts

## MUST

1. **Every filled primary header CTA declares a shortcut.** When
   `PageHeaderActionItem.variant === "default"` (or a legacy `actions` slot
   uses `Button variant="default"` at the default size), `shortcut` is **required**.
2. **Show the chord at rest.** Prefer `actionItems` — `PageHeader` renders
   `<Kbd variant="bare">` **inline** on the primary label and mounts
   `<Shortcut keys={…}>`. Do not rely on Tip-only for the filled primary.
3. **Safe family only: ⌘⌥ / Ctrl+Alt + key.** Build with `useModKeyLabel()` +
   `useAltKeyLabel()`:

   ```tsx
   const mod = useModKeyLabel()
   const alt = useAltKeyLabel()

   actionItems={[
     {
       id: "new",
       label: "New question",
       icon: "fa-plus",
       variant: "default",
       shortcut: `${mod}${alt}N`,
       onSelect: onNewQuestion,
     },
   ]}
   ```

4. **Canonical header chords** (do not collide with bulk bar or each other on
   the same route):

   | Action | Chord |
   |--------|-------|
   | New / create record | `${mod}${alt}N` |
   | Import roster / catalogue | `${mod}${alt}U` |
   | Export (menu or outline) | `${mod}${alt}E` |
   | Overflow More | `${mod}${alt}M` |
   | Hide / show metrics | `${mod}${alt}H` |
   | Focus workflow (demo) | `${mod}${alt}W` |
   | Exam lock (demo) | `${mod}${alt}Z` |

5. **Legacy `actions` slot** — same parity: inline bare `Kbd` on the filled
   button + `<Shortcut>` while the header is mounted. Prefer migrating to
   `actionItems` when the menu is a list of labelled commands.
6. **Ban list** — follow `exxat-kbd-shortcuts.md` § “Never bind”. Never use
   mod-only N/T/W/…, ⌘⇧E, or chords reserved for bulk on the same view
   without scoping.

## MUST NOT

- Ship a filled primary header button without a shortcut string and binding.
- Show a Kbd without a matching `<Shortcut>` (or vice versa).
- Put the primary chord only in a hover Tip.
- Reuse **⌘⌥N** for non-create demos (Focus workflow uses **⌘⌥W**).
- Reuse **⌘⌥E** for non-export demos (Exam lock uses **⌘⌥Z**).

## See also

- `exxat-kbd-shortcuts.md` — Never bind + reference table
- `exxat-bulk-action-shortcuts.md` — bulk bar chords (⌘⌥F/A/E/⌫/R)
- `exxat-page-header-actions.md` — header anatomy
- `packages/ui/src/components/ui/page-header.tsx` — `actionItems` + inline Kbd
