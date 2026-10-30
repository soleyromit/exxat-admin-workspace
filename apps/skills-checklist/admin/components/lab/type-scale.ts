/**
 * The one type scale for lab product pages (Romit 2026-10-27: "this hierarchy looks bad, with different text sizes used, too
 * many text again"; docs/knowledge/strategy/04-ui-and-visual.md "Type scale (2026-10-27)"; rubric of
 * docs/knowledge/design-review-2026-10-30-ds.md S1, S2, S4, applied 2026-10-30). Read from the DS:
 *
 *   Page title   DS PageHeader through PageFrame (PAGE_TITLE_TYPE_CLASS: serif, text-lg / sm:text-xl, semibold). The only serif.
 *   Section      18 semibold. An h2 that opens a region of the page (not inside a card), and pane headings.
 *   Card         16 semibold. A card, chart (ChartCard) or panel title: the DS CardTitle size (text-base) made semibold. On a
 *                DS Card size="sm" the DS itself sets the title to 14; the lab does not override that.
 *   Group        14 semibold. An h3 or h4 inside a section or card.
 *   Label        14 medium. A field label or a small heading naming a sub-block ("Student sees").
 *   Body         14 (DS Card body).
 *   Helper       14 muted, one line at most.
 *   Meta         12 muted, for data labels in rows, charts and legends. Nothing renders under 12.
 *   Figure       24 semibold, sans (never the serif), the DS KeyMetrics md strip value. One size for every KPI or hero number.
 *
 * tests/lab/typography.test.ts fails on raw text-lg and larger and on font-heading outside a heading. tests/lab/type-rubric.test.ts
 * fails on an arbitrary text-[Npx], on a heading that hand-sets its size instead of reading TYPE, and on SVG text under 12.
 */
export const TYPE = {
  section: "text-lg font-semibold text-foreground",
  card: "text-base font-semibold text-foreground",
  group: "text-sm font-semibold text-foreground",
  label: "text-sm font-medium text-foreground",
  body: "text-sm text-foreground",
  helper: "text-sm text-muted-foreground",
  meta: "text-xs text-muted-foreground",
  figure: "text-2xl font-semibold leading-none tabular-nums",
} as const
