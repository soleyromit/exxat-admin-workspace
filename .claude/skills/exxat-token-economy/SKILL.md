---
name: exxat-token-economy
description: >-
  Cut AI token usage by ~50% on Exxat DS work — task → minimum-file-set table,
  five-question pre-flight that catches the top rule violations before
  generation, canonical primitive aliases (no grep needed), tiny scaffolds
  for hub client / column def / KPI item, and a deny-list of files the
  assistant should NOT open. Read this BEFORE opening any other DS doc.
user-invocable: true
---

# Exxat DS — token economy (read this first)

**Why this exists.** Every other DS skill / rule / pattern doc is a deep dive on
one concern. When the user just wants to build a screen, the assistant tends to:

1. Re-read `AGENTS.md` (~80 KB) on every turn.
2. `grep` to "find the Button" when the import path is already known.
3. Regenerate hub scaffolding it could copy from a reference page.
4. Read 6 rule files speculatively when only 2 apply.
5. Re-explain "we use HubTable because…" in 200 tokens.

This skill is the **pre-flight** for any DS work. Read it first; load other docs
only when this skill explicitly points to one. **Target: ≥ 50% fewer input
tokens per design turn vs. the naive "open AGENTS.md and grep" loop.**

## When to use this skill

- **First** turn of any new DS feature, hub, or design change.
- Any time the assistant is about to open `AGENTS.md` or a `*-pattern.md` doc — read this skill instead and follow §1's file-set table.
- Whenever the user complains about cost, latency, or "you keep re-reading the same files".

---

## §1 — Task → minimum file set

Open **only** these files. Skip everything else unless one of these files cites it.

| Task | Read (minimum) | Skip (do not open) |
|------|----------------|--------------------|
| **Build a new hub page** (table + KPIs + view tabs) | `apps/web/components/library-table.tsx` + `library-client.tsx`, `exxat-hub-supported-views.mdc` (or `hub-supported-views-pattern.md`) | `AGENTS.md`, `hub-table.tsx` source, all `*-pattern.md` |
| **Add a column / cell pattern** | `apps/web/components/columns-showcase.tsx` (the live catalog) | `data-table/index.tsx`, the whole `types.ts` |
| **Add a board / kanban view** | `apps/web/components/placements-board-card.tsx`, `exxat-board-cards.mdc` only | All other rules |
| **Add a KPI strip** | `docs/exxat-ds/handbook/reference-implementations.md` § KPI flat band, `exxat-kpi-max-four.mdc`, `exxat-kpi-trends.mdc` | `key-metrics.tsx` source |
| **Write empty-state / error / button copy** | `docs/exxat-ds/handbook/voice-and-tone.md` | All rules |
| **Theme / token tweak** | `apps/web/app/globals.css`, `packages/ui/tokens/hooks-index.json` | All pattern docs |
| **Status chip color/icon** | `apps/web/lib/list-status-badges.ts` | Accessibility rule (already covered by the map) |
| **Bug fix** | `rg` for the symbol, read only the matching file | Everything else |
| **Overflowing tab / breadcrumb row** | `horizontal-scroll-controls.tsx` + `horizontal-scroll-region.tsx`, `exxat-horizontal-scroll.mdc` | Full `tabs.tsx` / `list-page.tsx` unless editing them |
| **Architectural change** (only when the user explicitly says so) | `AGENTS.md`, `HANDBOOK.md` | — |

**Heuristic.** If a file is over 25 KB and you're not modifying that exact file,
don't read it. Use this skill body + the reference page in `columns-showcase.tsx`
instead.

---

## §2 — Five-question pre-flight (before you generate code)

Answer **yes / no / N/A** to each. A **no** means re-plan; you'll save a regeneration cycle.

1. **`HubTable`, not raw `<table>`?** — every hub-style grid in `ListPageTemplate.renderContent` uses `HubTable<TRow>` from `@/components/data-views`. Filters + Properties drawer + view-type tiles + bulk actions come free.
2. **`view` + `onViewChange` plumbed?** — if the page has view tabs, pass both through `client → table → drawer toolbar → TablePropertiesDrawer`. Otherwise the drawer ships table-only copy on a Board tab.
3. **Color + icon on every status chip?** — `ListHubStatusBadge` + a tint from `lib/list-status-badges.ts` + an FA icon. Color alone fails WCAG 1.4.1.
4. **≤ 4 KPIs on the primary strip?** — `KEY_METRICS_KPI_COUNT_MAX = 4`. A fifth becomes a `MetricInsight` or a chart.
5. **No toasts for product feedback?** — use `LocalBanner` / `SystemBanner` / inline status. Toasts are reserved for build-tool messages.
6. **Seven views + real bodies?** — `FULL_HUB_SUPPORTED_VIEWS` on **`ListPageTemplate`** + **`HubTable`** (sync both); every allowed view has a renderer; list uses **`ListPageBoardCard`** — not `["table"]` / `PRIMARY_HUB_SUPPORTED_VIEWS` / empty `renderers={}`.
7. **Sheet only (no Vaul)?** — side panels use **`Sheet`**; **`vaul`** must not be in `package.json`.
8. **Header + tabs + table preview?** — **`PageHeader`** + DS **`Button`** variants for actions; hub views via **`ListPageTemplate`** (not full-width tabs); record tabs **`TabsList`** `w-fit` + **`TabsListScrollRegion`** when overflowing; row preview via **`HoverCard`** + shared cells — not custom popovers.
9. **Uploaded image ≠ spec?** — If the user attached a screenshot/mockup: extract **IA only** (labels, routes, fields); map to **`component-selection-guide`** + a **reference hub**; **MUST NOT** pixel-copy or plan "match the screenshot"; **MUST NOT** use **`frontend-design`** to mimic the upload — **`exxat-no-image-pixel-copy.mdc`** + **`exxat-senior-ux`** win.
10. **Horizontal scroll on tabs/crumbs?** — **`HorizontalScrollRegion`** / **`HorizontalScrollControls`** with **`controlsLayout="group-end"`** — not bespoke flanking chevrons per surface.
11. **Hub view tabs persist on reload?** — **`ListPageTemplate persistKey`** only in **uncontrolled** mode — no **`tabs` + `onTabsChange`** if persistence matters.

If all eleven are **yes**, generate. If any is **no**, either narrow the requirements
with **one** clarifying question or fix the gap silently and note it in your response.

---

## §3 — Canonical primitive aliases (no grep needed)

When the user says "X", reach for "Y". Save the search.

### Page chrome & overlays

| User says | Use | Path |
|----------|-----|------|
| button, action, CTA | `Button` | `@/components/ui/button` |
| input, text field, form field | `Input`, `FormField` | `@/components/ui/{input,form}` |
| avatar | `AvatarInitials` | `@/components/ui/avatar` |
| chip, badge, status, tag | `Badge`, `ListHubStatusBadge`, `StatusBadge` | `@/components/{ui/badge,list-hub-status-badge}` |
| dropdown, menu, ⋯ | `DropdownMenu` family | `@/components/ui/dropdown-menu` |
| tooltip, hint | `Tip` (or `Tooltip`) | `@/components/ui/tip` |
| sheet, side panel | `Sheet` family, `ExportDrawer`, `TablePropertiesDrawer` | `@/components/ui/sheet` |
| dialog, modal, confirm | `Dialog` family | `@/components/ui/dialog` |
| table, list, grid (product data) | `HubTable` inside `ListPageTemplate` | `@/components/data-views` |
| KPI, metric, stat | `KeyMetrics` + `MetricItem` | `@/components/key-metrics` |
| board, kanban | `ListPageBoardCard`, `ListPageBoardTemplate` | `@/components/data-views/list-page-board-card` |
| icon | FA `<i class="fa-light fa-{name}" aria-hidden />` | (Kit script in `app/layout.tsx`) |
| keyboard shortcut hint | `Kbd variant="bare"` inside buttons; `tile` in tooltips | `@/components/ui/kbd` |
| horizontal scroll, tab overflow, breadcrumb scroll | `HorizontalScrollRegion`, `HorizontalScrollControls`, `useHorizontalScrollAffordances` | `@/components/ui/horizontal-scroll-region`, `@/components/ui/horizontal-scroll-controls` |
| toggle, switch | `ToggleSwitch` | `@/components/ui/toggle-switch` |

### Table cell renderers (ALL importable — do NOT re-implement)

Every cell renderer below is exported from **`@/components/data-views`** (re-exported from `apps/web/components/data-views/table-cells.tsx`). Live catalog: `apps/web/components/columns-showcase.tsx` at route `/columns`.

| User says | Use | Notes |
|----------|-----|-------|
| progress bar, % complete, weeks done | `ProgressCell` | `value`, `max?`, `tone?: "auto" \| "success" \| "warning" \| "danger" \| "info"`, `label?` |
| currency, money, price, cost | `CurrencyCell` | `value`, `currency?` (default USD), `locale?`, right-aligned `tabular-nums` |
| numeric count, attempts, downloads | `NumericCell` | `value`, `fractionDigits?`, right-aligned |
| rating, stars, score | `RatingCell` | `value`, `max?` (5), `showValue?` — color **and** glyph (WCAG 1.4.1) |
| signal bars, low/med/high, difficulty | `SignalBarsCell` | `level`, `max?` (3), `tone?`, `label` (required, accessible) |
| toggle, published/draft, enabled/disabled | `BooleanToggleCell` | `checked`, `onChange(next)`, `labelOn?`, `labelOff?`; stops row click propagation |
| attachments, files count, paperclip | `AttachmentCountCell` | `count` — muted dash on `0` |
| external link, source, view in new tab | `ExternalLinkCell` | `url`, `label?` — host extracted; `Tip` shows full URL |
| relative time, "3 hours ago", recency | `RelativeTimeCell` | `iso`, `now?` (override for deterministic snapshots) |
| face rail, reviewers, assignees +N | `PeopleAvatarRailCell` | `people: PersonStub[]`, `visibleMax?` (3), `size?: "sm" \| "md"`; **non-overlapping** avatars |
| type pill, category, kind with icon | `PillCell` | `label`, `icon?: "fa-..."` — outlined, single-line |
| tag list +N, keywords, labels | `TagListCell` | `tags: string[]`, `visibleMax?` (2), `formatLabel?` (default `#${tag}`) |
| row actions, ⋯, overflow menu | `RowActionsCell<TRow>` | `row`, `actions: RowActionDef<TRow>[]` (`label`, `icon`, `onSelect`, `variant?`, `shortcut?`, `disabled?`) |

### Out of band — only when none of the above fits

If the user asks for **anything outside this list**: first scan `columns-showcase.tsx`
+ the `reference-implementations.md` index — both name every existing primitive.
Only propose a new shared component if neither covers it AND the user has approved
bespoke work (`exxat-reuse-before-custom.mdc`).

**Hard rule.** Do NOT inline-implement a progress bar, currency formatter, rating,
relative-time, attachment chip, external link, face rail, type pill, tag list, or
row-actions menu inside a `ColumnDef['cell']`. Import the named cell. If you find
yourself writing `Intl.NumberFormat`, `<a target="_blank">`, or a `[1,2,3,4,5].map(…)` star
loop inside a `cell:`, stop — you're re-deriving a shipped primitive.

---

## §4 — Tiny scaffolds (copy verbatim, don't re-derive)

The boilerplate shapes you'd otherwise regenerate.

### Hub client (replace `Entity`, KPIs, columns)

```tsx
"use client"
import * as React from "react"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PageHeader } from "@/components/page-header"
import { KeyMetrics, type MetricItem } from "@/components/key-metrics"
import { ListPageTemplate, type ViewTab, HubTable } from "@/components/data-views"

import { FULL_HUB_SUPPORTED_VIEWS } from "@/lib/data-list-view-registry"

const ENTITY_TABS: ViewTab[] = [{ id: "all", label: "All", viewType: "table", icon: "fa-table", filterId: "all" }]
/** Seven views (Library parity) unless product documents a narrower list in lib/entity-supported-views.ts */
const ENTITY_SUPPORTED_VIEWS = FULL_HUB_SUPPORTED_VIEWS

export function EntityClient({ rows }) {
  const [tabs, setTabs] = React.useState<ViewTab[]>(ENTITY_TABS)
  const [activeTabId, setActiveTabId] = React.useState(ENTITY_TABS[0].id)
  return (
    <PrimaryPageTemplate siteHeader={{ title: "Entity" }}>
      <ListPageTemplate
        defaultTabs={ENTITY_TABS} tabs={tabs} onTabsChange={setTabs}
        activeTabId={activeTabId} onActiveTabChange={setActiveTabId}
        supportedViewTypes={ENTITY_SUPPORTED_VIEWS}
        getTabCount={() => rows.length}
        header={<PageHeader title="Entity" subtitle="…" />}
        metrics={<KeyMetrics variant="flat" metrics={ENTITY_KPIS} showHeader={false} metricsSingleRow />}
        renderContent={(tab, updateTab) => (
          <HubTable rows={rows} columns={useColumns()}
            view={tab.viewType} onViewChange={v => updateTab({ viewType: v })}
            supportedViewTypes={ENTITY_SUPPORTED_VIEWS}
            hubLabel="Entity" lifecycleTabLabel="Entity"
            getRowId={r => r.id} getRowSelectionLabel={r => r.name}
            defaultSort={{ key: "name", dir: "asc" }}
            renderListRow={row => /* ListPageBoardCard layout="row" — copy library-table.tsx */}
            renderers={{
              /* board-with-toolbar, dashboard-with-toolbar, folder/panel/tree — see library-table.tsx or tokens-hub-auxiliary-views.tsx */
            }}
          />
        )}
      />
    </PrimaryPageTemplate>
  )
}
```

### `MetricItem` shape (KPI strip cell)

```ts
{ id: "active", label: "Active", value: 142, delta: "+8 vs last week",
  trend: "up", trendPolarity: "higher_is_better",
  metricVariant: "hero", description: "currently in placement" }
```

- `trend: "neutral"` + empty `delta` → no trend chip renders. Don't fake a `+0`.
- `trendPolarity: "lower_is_better"` for error counts, defects, overdue.
- `metricVariant: "hero"` for **one** cell per strip — the headline number.
- Max **4 cells**.

### `ColumnDef<TRow>` shape

```ts
{ key: "name", label: "Name", width: 240, minWidth: 180,
  defaultPin: "left", sortable: true, sortKey: "name",
  filter: { type: "text", icon: "fa-user", operators: ["contains"] },
  cell: row => <span className="truncate">{row.name}</span> }
```

- `key: "select"` + `defaultPin: "left"` + `lockPin: true` → checkbox column.
- `key: "actions"` + `defaultPin: "right"` + `lockPin: true` → ⋯ overflow column.
- `filter: { type: "select", options }` for categorical columns.

### Default `cell:` should call a named primitive

The right `cell:` body for the common patterns is **one import + one component**, not an inline JSX block:

```ts
import { ProgressCell, CurrencyCell, RatingCell, BooleanToggleCell,
         RelativeTimeCell, AttachmentCountCell, ExternalLinkCell,
         PeopleAvatarRailCell, PillCell, TagListCell, NumericCell,
         RowActionsCell, type RowActionDef } from "@/components/data-views"

// Examples — cell:'s body is one call.
cell: row => <ProgressCell value={row.completion} />
cell: row => <CurrencyCell value={row.cost} />
cell: row => <RatingCell value={row.rating} />
cell: row => <BooleanToggleCell checked={row.published} onChange={next => onTogglePublished(row, next)} />
cell: row => <RelativeTimeCell iso={row.lastActivityAt} />
cell: row => <AttachmentCountCell count={row.attachmentCount} />
cell: row => <ExternalLinkCell url={row.sourceUrl} />
cell: row => <PeopleAvatarRailCell people={row.reviewers} />
cell: row => <PillCell label={TYPE_LABEL[row.type]} icon={TYPE_ICON[row.type]} />
cell: row => <TagListCell tags={row.tags} />
cell: row => <NumericCell value={row.attempts} />
cell: row => <RowActionsCell row={row} actions={ROW_ACTIONS} />
```

If `cell:` exceeds **one line** for any pattern above, you're re-deriving — go back and import.

---

## §5 — Deny list (do NOT open unless asked)

Treat these as expensive — skip unless the user explicitly names them or this skill points to them:

- `AGENTS.md` — only when the task is "change the architecture or the rules themselves".
- `packages/ui/src/components/data-views/hub-table.tsx` — the API is documented; don't read the implementation.
- `apps/web/.next/`, `.turbo/`, `node_modules/` — never.
- All 29 `.cursor/rules/exxat-*.mdc` at once — §1 already points to the 1-2 that apply.
- Test files (`*.test.*`, `__tests__/`) — irrelevant for design.
- Build configs (`tsup.config.ts`, `next.config.ts`, `turbo.json`) — irrelevant for design.
- `packages/ui/tokens/hooks-index.json` (~163 KB) — only when the task is a token rename / audit.

---

## §6 — When to ask vs. when to assume

One clarifying question costs ~50 tokens. A wrong implementation costs hundreds (read, generate, user feedback, regenerate). Ask when:

1. The task name is ambiguous between two patterns (e.g. "add a panel" → drawer or split panel?).
2. Two existing reference hubs handle the same concern differently (use the user's existing precedent if they have one).
3. The user mentions a screen that doesn't have a clear primitive in §3.

Don't ask when:

- The user has cited a specific file or component — go.
- The pre-flight (§2) all answers yes — go.
- The task fits exactly one row in §1's task map — go.

---

## §7 — Output discipline (your turn budget)

Your **response** also costs tokens. Keep it lean:

- **No "let me explain the design system" preambles.** The user has the package installed; they know.
- **No reading-aloud of file paths.** Cite with `code` ticks; don't re-narrate.
- **No restating the prompt.** Jump straight to the action.
- **Group tool calls in parallel** when independent (reading 3 files = 1 message, not 3).
- **Stop generating** as soon as the pre-flight (§2) says you have what you need. Don't gold-plate.

---

## See also

- **Handbook** — `docs/exxat-ds/handbook/HANDBOOK.md` (5 principles + how-to-build-a-hub)
- **Reference implementations** — `docs/exxat-ds/handbook/reference-implementations.md` (find the file to copy)
- **Voice & tone** — `docs/exxat-ds/handbook/voice-and-tone.md` (user-facing copy)
- **Cell patterns catalog** — `apps/web/components/columns-showcase.tsx` (live at `/columns`)
