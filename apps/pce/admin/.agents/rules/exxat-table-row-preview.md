---
description: Exxat DS — table row identity preview uses HoverCard + DS tokens, not bespoke Popover cards
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-table-row-preview.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — table row preview (hover / click)

When a **data table** cell opens a **rich preview** of a person or record (student, placement, team member):

## MUST

- Use **`HoverCard`** (`@/components/ui/hover-card`) for hover-driven previews, or **`Popover`** only when the preview is **click-pinned** and small.
- Structure identity with **`AvatarInitials`**, name, **`font-mono tabular-nums`** on IDs only (**`exxat-mono-ids.md`**), **`ListHubStatusBadge`** + **`lib/list-status-badges.ts`** for status — **color + icon** (**`exxat-accessibility.md`** 1.4.1).
- Reuse table cell patterns from **`@/components/data-views`** (`PeopleAvatarRailCell`, `PillCell`, progress cells) — see **`columns-showcase.tsx`**.

## MUST NOT

- Bespoke **`PopoverContent`** layouts with ad-hoc spacing, one-off progress bars, or status chips without the shared badge map.
- Raw email as the only identifier when a display name exists (**`exxat-person-identity-display.md`**).

## Reference

- **`HoverCard`** docs in `packages/ui/src/components/ui/hover-card.tsx`
- **`docs/exxat-ds/blueprints/data-table.md`**
