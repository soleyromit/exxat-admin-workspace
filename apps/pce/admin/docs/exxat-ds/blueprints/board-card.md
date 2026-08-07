# Blueprint: Board card

> **Status:** Stable. **Owner:** Design system. **Implements:** SC 1.1.1, 1.3.1, 2.5.8, 4.1.2.

## 1. Intent

A **board card** is the kanban-tile presentation of a single hub record (e.g.
one Placement, one Team member, one Question-bank item) when the active view
is `board`. The card surfaces the most-scannable summary fields — title, owner
avatar, status chip, 1-3 meta lines — and is sized so a column holds 6-10
cards on a 1280-wide viewport.

**Use when:**

- The hub's `board` view tab is active.
- The record has a **status** (or equivalent grouping) that drives column placement.
- Users compare ~6-30 records side-by-side and would benefit from owner / status visibility.

**Do NOT use when:**

- The record needs ≥ 4 fields to be useful at a glance (use list / table).
- The dataset has > ~100 records per column (board UX collapses; use table + filters).
- The hub does not model status / lifecycle (use folder grid or list).

## 2. Anatomy

```
┌──────────────────────────────────────────────┐
│  Title row                       [avatar]    │  ← slot: title (required) + trailing (optional)
│ ──────────────────────────────────────────── │
│  [status chip]                               │  ← slot: badgeRow (optional, when status exists)
│ ──────────────────────────────────────────── │
│  Body — primary stat (large) + sub label     │  ← slot: body (optional)
│  ▣ row icon · meta label · meta value        │
│  ▣ row icon · meta label · meta value        │
└──────────────────────────────────────────────┘
```

| Slot | Required? | What it carries |
|---|---|---|
| `title` | required | `ListPageBoardCardTitleRow` — single-line truncated title |
| `trailing` | optional | `ListPageBoardCardAvatar` (owner) or another single glyph |
| `badgeRow` | optional | `ListPageBoardCardBadgeRow` + `ListHubStatusBadge surface="board"` |
| `body` | optional | `ListPageBoardCardBody` containing `BoardCardTwoLineBlock` / `BoardCardIconRow` |
| `footer` | optional | Counts, freshness, or a small CTA — kept low-emphasis |

The shell is `ListPageBoardCard` (`Card size="sm"` treatment) — do NOT compose
a bespoke `<button>` + border-class wrapper for the same pattern.

## 3. States

| State | Visual / behavior |
|---|---|
| Default | Surface 2 background, hairline border, no shadow |
| Hover | Border deepens; subtle elevation shift (matches `Card size="sm"`) |
| Focused | `:focus-visible` ring on the outer element (≥ 3:1) |
| Selected (drag source / active drag target) | `data-selected` border + brand tint |
| Loading | Skeleton shell mirroring title row + badge row + body |
| Empty column | Column footer shows "+ Add" affordance with `aria-label` per column |
| RTL | All trailing slots flip; status chip flips alignment |

## 4. Tokens consumed

| Token | Used for |
|---|---|
| `--exxat-color-surface-2` / `--card` | Card background |
| `--exxat-color-border-1` / `--border` | Card hairline |
| `--exxat-color-ink-1` / `--foreground` | Title text |
| `--exxat-color-ink-2` / `--muted-foreground` | Meta label text |
| `--exxat-color-focus-ring` / `--ring` | `:focus-visible` ring |
| `--exxat-radius-2` / `--radius-md` | Card corners |
| Status-tint variables (`LIST_HUB_STATUS_TINT_*`) | Status chip background + text |

## 5. Accessibility

| WCAG SC | How this blueprint complies |
|---|---|
| 1.1.1 Non-text content | Icons in `BoardCardIconRow` are decorative when paired with a visible label (Case A); standalone glyphs get Case B label + tooltip |
| 1.3.1 Info & relationships | The card is one `<article>` (or `role="listitem"` inside the column's `role="list"`); status, owner, and meta rows are programmatically related to the title |
| 2.5.8 Target size | The whole card is the primary click target — ≥ 24×24 CSS px; small icon controls inside use `size-6` (≥ 24px) |
| 4.1.2 Name / role / value | If the card is interactive (opens detail) it is rendered as `<button>` with an accessible name combining title + status |

## 6. Variants

| Variant | When to use | Differences from default |
|---|---|---|
| `base` | Most hubs | Title + status badge + body |
| `no-status` | Hubs without lifecycle (Library items) | Omit `badgeRow`; body carries the differentiator |
| `compact` | Dense boards (10+ cards visible) | Drop body; show title + status + avatar only |
| `with-progress` | Workflow boards with completion bar | Add a `<Progress>` row in the body slot |

## 6.1 List-row counterpart

`ListPageBoardCard layout="row"` is the same component shape rendered as a
horizontal row for the `list` view tab. Use one renderer for both views so the
**title / status / owner / meta** mapping stays consistent — never define two
parallel components for "card" and "row" of the same hub.

## 7. Implementation

| Framework | Component(s) | File |
|---|---|---|
| **React (this app)** | `ListPageBoardCard` + `ListPageBoardCardTitleRow` + `ListPageBoardCardBadgeRow` + `ListPageBoardCardBody` + `BoardCardTwoLineBlock` + `BoardCardIconRow` + `ListHubStatusBadge` | `@exxatdesignux/ui/components/data-views` + `apps/web/lib/list-status-badges.ts` |
| Board template | `ListPageBoardTemplate` (column shells + `renderCard`) | `@exxatdesignux/ui/components/data-views/list-page-board-template` |
| Mobile | — | — |
| Figma | "Board card – hub" component in DS library | — |

## 8. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use `ListPageBoardCard` as the shell; compose primitives inside | Wrap a bespoke `<button>` with border / padding utility classes for the same pattern |
| Status: `ListHubStatusBadge surface="board"` + entity-specific map from `lib/list-status-badges.ts` | Show status as plain body text when the hub uses `ListHubStatusBadge` elsewhere |
| Pull rows from `tableState.rows` so board honors filters / search | Hydrate cards from a separate `BOARD_MOCK[]` array |
| Match list-row + table-row + card field choices via one mapper per hub | Define a card-only field projection that diverges from the table |
| Use `Tip` on any icon-only control inside the card | Rely on `aria-label` alone for icon-only affordances inside the card |

## 9. References

- `apps/web/docs/data-views-pattern.md` — board UI section
- `.cursor/rules/exxat-board-cards.mdc`, `exxat-centralized-list-dataset.mdc`, `exxat-card-vs-list-rows.mdc`
- `apps/web/AGENTS.md` §4.4 (board cards), §13 (checklist)
- `apps/web/lib/list-status-badges.ts` — `LIST_HUB_STATUS_TINT_*` + entity maps
