# What's new sheet pattern

**Code:** `@exxatdesignux/ui/components/ui/whats-new-sheet`, app wiring in `components/whats-new-sheet-context.tsx`. Catalog doc: `lib/design-system/component-docs/whats-new-sheet.tsx`.

## Role

One **featured** release note in a compact left rail so coordinators can scan an update, try the feature, or dismiss without leaving the hub. Full history lives on `/whats-new`.

## When to use

| Surface | Use |
|---------|-----|
| Utility bar megaphone, profile **What's new**, Dense **More → What's new** | `WhatsNewSheetProvider` + `WhatsNewSheetTrigger` |
| `/home` digest cards, product tile badges | `WhatsNewSection` / `WhatsNewBadge` (same seen list) |
| Full release timeline | Route `/whats-new` |

## IA

- **One update per open** — newest unseen, else latest in scope.
- **Hero** — `WhatsNewLeoHero` (Leo `invited` + one-shot dot burst). No product screenshots in the sheet.
- **Card** — eyebrow · title · highlight rows (or body) · header dismiss.
- **Pinned footer** — primary CTA + **Release history** link. CTA never lives inside the scroll body.
- **Empty** — short copy + Release history when no notes match the role.

## Shell contract

- `FloatingSheetPanel`, `size="sm"`, `side="left"`, bottom anchored, `height: auto`, `max-h-[min(85vh,38rem)]`.
- `contentSlot="whats-new-sheet"`.
- No duplicate toolbar close — card dismiss + Esc are enough.
- Non-modal: hub stays live behind the rail.
- **Outside click does not dismiss.** Close via card dismiss, Esc, primary CTA, or Release history only.

## Data + persistence

- Catalog shape: `ProductWhatsNewItem` (`eyebrow`, `highlights[]`, `primaryActionLabel`, optional `audience`).
- Dismissal: shared `home-whats-new-seen` via `useWhatsNewSeen` (`WhatsNewProvider` in `App`).
- Scope: product catalog first; workspace inventory on `/home` or when the product has no notes.

## MUST

1. Import **`WhatsNewSheet`** from `@exxatdesignux/ui/components/ui/whats-new-sheet`. Do not fork the rail layout.
2. Mount **`WhatsNewSheetProvider` once** in `App` (inside `WhatsNewProvider`).
3. Wire triggers through **`useWhatsNewSheet()`** — megaphone, profile menu, More menu share one open state.
4. Primary action opens the owning product/card route via app wiring; footer secondary links to `/whats-new`.
5. Replay Leo + dot animation on each open (`playKey` bumps when `open` becomes true).

## MUST NOT

- Product screenshot heroes in the compact sheet (timeline page may still use images).
- A second sheet instance per trigger.
- Toast for dismiss confirmation.
- Decorative subtitle under the title.

## See also

- `docs/exxat-ds/handoff/whats-new-sheet-small.md`
- `docs/exxat-ds/shell-utility-bar-pattern.md`
- `.cursor/rules/exxat-whats-new-sheet.mdc`
- `.cursor/skills/exxat-whats-new-sheet/SKILL.md`
