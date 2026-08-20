---
description: Exxat DS — prefer centralized reusable components; ask the user before new bespoke primitives.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-reuse-before-custom.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — reuse before custom

## MUST

1. **Compose first** — Use existing **`components/ui/`**, **`components/data-views/`**, **`components/templates/`**, **`PageHeader`**, **`ListPageTemplate`**, **`DataTable`**, **`KeyMetrics`**, and patterns in **`AGENTS.md` §9** before writing new layout or interaction chrome.
2. **Search the codebase** — Grep or open the nearest hub (Placements, Team, Library) for the same UX (toolbar, drawer, metrics, board card, `ListPageViewFrame`, etc.).
3. **Extend in place** — Prefer adding a variant, slot, or prop to a shared component over a one-off duplicate under a single route.

## When the tool must ask the user

**MUST pause and ask the user** (with a short option list) when, after scanning, **no reasonable reuse** exists and the implementation would add **any** of:

- A **new reusable primitive** (new file under `components/` meant for multiple routes), or  
- A **non-trivial bespoke widget** (custom data grid, chart system, modal stack, or parallel design-system fork) that is not already implied by the task.

Do **not** silently ship a second stack for the same product pattern (e.g. another “table”, another metrics strip, another sidebar).

When the user **uploads a screenshot or mockup**, read **`exxat-no-image-pixel-copy.md`** first — extract IA only; map to DS patterns; never pixel-copy colors or chrome.

If the **user or task already explicitly** approved a greenfield component (“build a new X from scratch”), you may proceed without re-asking.

## MUST NOT

- Add **route-only copies** of patterns that already live in **`components/`** or **`packages/ui`** without product reason.
- Introduce **parallel primitives** (second button row, second card shell, second command surface) when an existing one can be parameterized.
- Wrap charts in a **new card shell** — use **`ChartCard`** from `charts-overview.tsx` ([`exxat-chart-cards.md`](./exxat-chart-cards.md)).

## See also

- **`./AGENTS.md` §1** (compose / scan before new UI), **§9** architecture table  
- **`.agents/rules/exxat-ds-agents.md`**  
- **`.agents/rules/exxat-centralized-list-dataset.md`** — one dataset / one presentation path for hubs
