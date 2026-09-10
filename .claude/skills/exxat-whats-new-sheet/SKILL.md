---
name: exxat-whats-new-sheet
description: >-
  What's new sheet — featured release rail, Leo hero, shared seen list, utility
  bar triggers. Load when adding release notes, megaphone, or compact update UX.
user-invocable: true
---

# Exxat DS — What's new sheet

## Read first

| Topic | Path |
|-------|------|
| Pattern | `apps/web/docs/whats-new-sheet-pattern.md` |
| Handoff | `docs/exxat-ds/handoff/whats-new-sheet-small.md` |
| Component map | `WhatsNewSheet` in `apps/web/docs/component-map.json` |
| Utility bar | `apps/web/docs/shell-utility-bar-pattern.md` |

## Rules (scoped)

- `.cursor/rules/exxat-whats-new-sheet.mdc`
- `.cursor/rules/exxat-utility-bar.mdc` (megaphone placement)

---

## Import map

| Piece | Import |
|-------|--------|
| Sheet composition | `@exxatdesignux/ui/components/ui/whats-new-sheet` |
| Announcement card | `@exxatdesignux/ui/components/ui/whats-new-announcement-card` |
| Leo hero | `@exxatdesignux/ui/components/ui/whats-new-leo-hero` |
| App provider + data | `@/components/whats-new-sheet-context` |
| Utility triggers | `@/components/utility-bar-whats-new` |
| Seen list | `useWhatsNewSeen` from `@/components/product-home/product-home-parts` |

---

## MUST

1. **`WhatsNewSheetProvider`** once in `App`, inside **`WhatsNewProvider`**.
2. **One featured update** per open; footer CTA pinned outside scroll body.
3. **Leo hero** in the sheet — not product screenshots.
4. **Dismiss** writes to the shared seen list; badges and home digest stay in sync.
5. **Release history** links to shell-global `/whats-new`.

## MUST NOT

- Raw `Sheet` / Vaul drawer for this surface.
- Second sheet instance per trigger.
- Toast on dismiss.

---

## Procedure (new release note)

1. Add `ProductWhatsNewItem` to the product catalog (`whatsNew[]`).
2. Optional: `eyebrow`, `highlights[]`, `primaryActionLabel`, `audience`.
3. Verify megaphone badge, sheet open, dismiss, and `/whats-new` timeline.
4. Update handoff if IA or shortcuts change.

---

## See also

- `.cursor/skills/exxat-overlays/SKILL.md`
- `apps/web/lib/design-system/component-docs/whats-new-sheet.tsx`
