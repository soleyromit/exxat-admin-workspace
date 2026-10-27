/**
 * The one type scale for lab product pages (Romit 2026-10-27: "this hierarchy looks bad, with different text sizes used, too
 * many text again"; docs/knowledge/strategy/04-ui-and-visual.md "Type scale (2026-10-27)"). Six steps, read from the DS:
 *
 *   Page title   DS PageHeader through PageFrame (PAGE_TITLE_TYPE_CLASS: serif, text-lg / sm:text-xl, semibold). The only serif.
 *   Section      h2 in a page or card, the DS CardTitle size made bold: text-base semibold. Every section title, chart title
 *                (ChartCard), pane heading and card heading uses it.
 *   Group        h3 inside a section, and a field label: text-sm, the DS Label size.
 *   Body         text-sm (DS Card body).
 *   Helper       text-sm muted, one line at most. Below it only meta: text-xs muted, for data labels in rows, charts and legends.
 *   Figure       one size for every KPI or hero number, sans (never the serif), the DS KeyMetrics md strip value: text-2xl semibold.
 *
 * tests/lab/typography.test.ts fails on raw text-lg and larger, and on font-heading outside a heading, anywhere in
 * components/lab except this file and its documented allow-list.
 */
export const TYPE = {
  section: "text-base font-semibold text-foreground",
  group: "text-sm font-semibold text-foreground",
  label: "text-sm font-medium text-foreground",
  body: "text-sm text-foreground",
  helper: "text-sm text-muted-foreground",
  meta: "text-xs text-muted-foreground",
  figure: "text-2xl font-semibold leading-none tabular-nums",
} as const
