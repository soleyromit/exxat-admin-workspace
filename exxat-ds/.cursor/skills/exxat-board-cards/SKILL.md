---
name: exxat-board-cards
description: >-
  Build and maintain kanban board cards in Exxat DS — ListPageBoardCard shell, title/avatar/badge/body hierarchy, BoardCardTwoLineBlock, list-status-badges, ListPageBoardTemplate. Use when adding board view, Team/Compliance/Placements cards, or status chips on cards.
user-invocable: true
---

# Exxat DS — board (kanban) cards

**Canonical MUST/MUST NOT:** **`exxat-ds/AGENTS.md` §4.4** (or **`./AGENTS.md`** when the workspace is the `exxat-ds` app folder only). **Claude:** **`.claude/skills/exxat-board-cards/SKILL.md`** (repo root) or **`exxat-ds/.claude/skills/exxat-board-cards/SKILL.md`** (app-only workspace) — same body as this file. This skill is the **how-to**; the handbook stays the contract.

## When to use this skill

- Adding or changing **`viewType === "board"`** on a **`ListPageTemplate`** hub.
- Building a new **`EntityBoardView`** or **`renderCard`** for **`ListPageBoardTemplate`**.
- Aligning **Team** / **Compliance** board cards with **Placements**.
- Wiring **status** on cards so it matches **table** and **list** views.

## Shell: `ListPageBoardCard`

Import from **`@/components/data-views/list-page-board-card`**:

| Part | Component | Role |
|------|-----------|------|
| Outer | **`ListPageBoardCard`** | **`Card` `size="sm"`**; pass **`onClick`**, **`isNew`**, **`style`** (e.g. conditional row bg) like **`BoardPlacementCard`**. |
| Header wrapper | **`ListPageBoardCardHeader`** | Vertical rhythm inside the card. |
| Title row | **`ListPageBoardCardTitleRow`** | **`title`** + optional **`trailing`** + **`titleClassName`** (`truncate`, `line-clamp-2`, **`lineClampClass`**). |
| Avatar | **`ListPageBoardCardAvatar`** | **`initials`** string; **`size-7`**, **`--avatar-initials-bg` / `--avatar-initials-fg`**. |
| Status / tags | **`ListPageBoardCardBadgeRow`** | **`ListHubStatusBadge`** **`surface="board"`** (+ maps from **`lib/list-status-badges.ts`**) — **not** raw status text or one-off **`Badge`** markup in the body. |
| Body | **`ListPageBoardCardBody`** | Icon rows and two-line blocks (facts). |
| Hint | **`ListPageBoardCardSecondary`** | Empty states / helper copy. |

## Primitives: `board-card-primitives.tsx`

- **`BoardCardTwoLineBlock`** — icon + **primary** line (`font-medium text-foreground`) + optional **secondary** (muted). Omit **`line2`** for a single-line fact row.
- **`BoardCardIconRow`** — when mirroring rich **table cells** (see **`BoardPlacementCard`**).
- **`lineClampClass`** — pass into title or cell wrappers when density options apply.
- **`BoardNewCardPlaceholder`** — column chrome for **`ListPageBoardTemplate`**.

Prefer **two-line blocks** for stacked **primary / secondary** facts so cards match Placements’ visual rhythm.

## Status badges (list hubs: Team, Compliance, Question bank, …)

- **Maps (single source):** **`lib/list-status-badges.ts`** — per-entity `*_STATUS_LABEL`, `*_STATUS_BADGE_CLASS`, `*_STATUS_ICON`, plus semantic **`LIST_HUB_STATUS_TINT_*`** (success / warning / neutral / danger) for new domains.
- **Component:** **`ListHubStatusBadge`** from **`@/components/list-hub-status-badge`** — **`surface="table"`** for **DataTable** cells and **list** rows; **`surface="board"`** inside **`ListPageBoardCardBadgeRow`**. Do not duplicate the shell classes on each page.
- Use the **same** maps everywhere for that entity so copy and colors never drift.
- **Do not** add **`uppercase`** or **`tracking-wide`** — **sentence / title case**, consistent with **`BoardStatusBadge`** on Placements (`placement-board-card.tsx`).
- **Placements** lifecycle uses **`StatusBadge`** in **`data-list-table-cells.tsx`** — thin wrapper over **`ListHubStatusBadge`** + **`PLACEMENT_STATUS_*`** in **`list-status-badges.ts`** (same visuals as Team / Question bank).

## Avatar when mock has no `initials`

Use **`initialsFromDisplayName`** from **`lib/initials-from-name.ts`** (e.g. compliance **owner** name).

## Column template (simple hubs)

**`ListPageBoardTemplate`** (`list-page-board-template.tsx`) — define **`ListPageBoardColumnDef<T>`** (`id`, `label`, `description`, **`filter`**, **`renderCard`**). Placements uses a **custom** board with richer headers; new hubs usually start here.

## Placements

**`BoardPlacementCard`** (`placement-board-card.tsx`) — domain-specific (lifecycle tabs, **`ColumnDef`**, conditional background). It **still** composes **`ListPageBoardCard`** parts and primitives; copy that structure for new dense entities.

## Checklist

- [ ] **`ListPageBoardCard`** (not one-off button/card markup).
- [ ] Title row; avatar when product shows a person/owner chip.
- [ ] Status in **`ListPageBoardCardBadgeRow`** with **`ListHubStatusBadge`** **`surface="board"`** + **`list-status-badges`** (if entity has status).
- [ ] Body facts via **`BoardCardTwoLineBlock`** / **`BoardCardIconRow`**.
- [ ] No **`uppercase`** on status **`Badge`** labels.
