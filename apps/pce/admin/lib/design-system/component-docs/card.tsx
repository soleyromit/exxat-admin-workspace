"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  CatalogBoardCardPreview,
  CatalogLibraryListRowPreview,
} from "@/components/catalog-live-previews"
import {
  CardAnatomyPreview,
  CardContentOnlyPreview,
  CardHeaderBorderPreview,
  CardEdgeToEdgePreview,
  CardInteractivePreview,
  CardKpiInCardPreview,
  CardMediaPreview,
  CardPreview,
  CardScrollableContentPreview,
  CardSizesPreview,
  CardSubduedSectionPreview,
  CardWithActionPreview,
  CardWithFooterPreview,
} from "@/components/design-system/layout-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

export const cardComponentDoc: ComponentDocSpec = {
  slug: "card",
  summary:
    "Surface primitive with two size tiers, compound header/content/footer slots, and composed product shells (board tiles, KPI bands). Card owns vertical rhythm — do not override padding on inner slots.",
  extraImports: [
    { label: "LibraryBoardCard", path: "@/components/library-board-view" },
    { label: "LibraryListRowCard", path: "@/components/library-board-view" },
    { label: "ListPageBoardCard", path: "@exxatdesignux/ui/components/data-views/list-page-board-card" },
    { label: "ChartCard", path: "@/components/charts-overview" },
    { label: "KeyMetrics", path: "@/components/key-metrics" },
  ],
  sections: [
    ex({ id: "sizes", title: "Size" }, <CardSizesPreview />, "default for section panels; sm for dense grids and kanban columns."),
    ex({ id: "anatomy", title: "Anatomy" }, <CardAnatomyPreview />, "All compound parts on one surface."),
    ex({ id: "header-body", title: "Header + body" }, <CardPreview />),
    ex(
      { id: "header-action", title: "Header action" },
      <CardWithActionPreview />,
      "CardAction slot for secondary header controls — not primary workflow CTAs.",
    ),
    ex(
      { id: "footer", title: "Footer CTA" },
      <CardWithFooterPreview />,
      "CardFooter for card-level links (View all). Border-t only — no fill wash.",
    ),
    ex(
      { id: "content-only", title: "Content only" },
      <CardContentOnlyPreview />,
      "Skip CardHeader when outer chrome already titles the region.",
    ),
    ex(
      { id: "header-border", title: "Header divider" },
      <CardHeaderBorderPreview />,
      "border-b on CardHeader before a scrollable body.",
    ),
    ex(
      { id: "scrollable-body", title: "Scrollable body" },
      <CardScrollableContentPreview />,
      "overflow-auto on CardContent only — never flex-1 / min-h-0 hacks on Card itself.",
    ),
    ex(
      { id: "card-media", title: "Card media" },
      <CardMediaPreview />,
      "CardMedia for photo, video, animation, illustration, or audio — not charts (use ChartCard).",
    ),
    ex(
      { id: "subdued-section", title: "Subdued section" },
      <CardSubduedSectionPreview />,
      "CardSection subdued for secondary in-card bands — divider + muted copy, no fill.",
    ),
    ex(
      { id: "edge-to-edge", title: "Edge-to-edge body" },
      <CardEdgeToEdgePreview />,
      "Bleed with -mx-(--card-spacing) / -mb-(--card-spacing) on CardContent.",
    ),
    ex(
      { id: "interactive", title: "Interactive" },
      <CardInteractivePreview />,
      "interactive prop for hover shadow — pair with Link; ListPageBoardCard uses the same token.",
    ),
    ex(
      { id: "kpi-in-card", title: "KPI in Card" },
      <CardKpiInCardPreview />,
      "KeyMetrics variant=\"card\" — Card chrome + header; metric cells use flat-band treatment (transparent, hairlines, glow through).",
    ),
    ex(
      { id: "board-stack", title: "Board card (stack)" },
      <CatalogBoardCardPreview />,
      "LibraryBoardCard — kanban tile from library-board-view.tsx (ListPageBoardCard size=\"sm\").",
    ),
    ex(
      { id: "board-row", title: "Board card (row)" },
      <CatalogLibraryListRowPreview />,
      "LibraryListRowCard — list view row from the same hub (layout=\"row\").",
    ),
  ],
  anatomy: [
    { part: "Card", description: "Root surface: size, --card-spacing, ring, optional interactive + glow via style." },
    { part: "CardHeader", description: "Title grid; auto two-column when CardAction is present." },
    { part: "CardTitle", description: "Section heading — renders h3 by default; asChild for rare overrides." },
    { part: "CardDescription", description: "Muted supporting line under the title." },
    { part: "CardAction", description: "Top-right header slot for secondary controls." },
    { part: "CardMedia", description: "Hero media (photo, video, illustration, audio) — not charts." },
    { part: "CardContent", description: "Body slot — horizontal padding only; overflow-auto for lists." },
    { part: "CardSection", description: "In-card band; subdued = border-t + aligned px (no fill, no -mx bleed)." },
    { part: "CardFooter", description: "Card-level CTA row with border-t only." },
  ],
  features: [
    {
      group: "Spacing contract",
      icon: "fa-ruler-combined",
      items: [
        { part: "Card py + gap", description: "Card owns rhythm via --card-spacing (16px default, 12px sm)." },
        { part: "No slot overrides", description: "Never add pb/pt to CardContent or CardHeader." },
        { part: "No flex shell", description: "Do not add h-full / flex-col to Card for equal-height grids — handle at grid cell." },
        { part: "CardMedia scope", description: "Photo, video, animation, illustration, audio only — ChartCard for data viz." },
      ],
    },
    {
      group: "Composed shells",
      icon: "fa-layer-group",
      items: [
        { part: "LibraryBoardCard", description: "Kanban tile — library-board-view.tsx; composes ListPageBoardCard + BoardCardTwoLineBlock." },
        { part: "LibraryListRowCard", description: "List tab row — same shell, layout=\"row\"." },
        { part: "KeyMetrics variant=\"flat\"", description: "ListPageTemplate metrics slot — no Card wrapper (library-client.tsx)." },
        { part: "KeyMetrics variant=\"card\"", description: "KPI inside one Card — hairline grid + glow on card surface (dashboard tile)." },
        { part: "KeyMetrics variant=\"cards\"", description: "Each KPI in its own Card tile — overview grids (distinct from card strip)." },
        { part: "ChartCard", description: "Dashboard chart shell — see chart-card doc." },
      ],
    },
  ],
  api: [
    {
      prop: "size",
      type: '"default" | "sm"',
      defaultValue: "default",
      description: "Spacing tier via --card-spacing. sm for board columns and compact grids.",
    },
    {
      prop: "interactive",
      type: "boolean",
      defaultValue: "false",
      description: "Hover shadow + pointer cursor. Pair with Link — do not nest primary buttons.",
    },
    {
      prop: "className",
      type: "string",
      description: "Layout modifiers (overflow-hidden for glow). Override [--card-spacing] for custom inset.",
    },
    {
      prop: "CardMedia.aspect",
      type: '"auto" | "video" | "square"',
      defaultValue: "auto",
      description: "Optional aspect ratio for photo / video / illustration media.",
    },
    {
      prop: "CardSection.subdued",
      type: "boolean",
      defaultValue: "false",
      description: "Top divider with aligned inset; collapses card gap from the slot above.",
    },
    {
      prop: "CardTitle.asChild",
      type: "boolean",
      defaultValue: "false",
      description: "Merge props onto child — default remains semantic h3.",
    },
  ],
  ux: {
    job: "Group related content on one elevated surface without breaking shell scroll rhythm.",
    budgets: [
      { label: "KPI in Card", value: "KeyMetrics card", rationale: "Flat-band cells inside Card — not gap-px bg-border tile fills." },
      { label: "Hub KPI strip", value: "KeyMetrics flat", rationale: "ListPageTemplate metrics slot has no Card wrapper." },
      { label: "Footer actions", value: "1 secondary link", rationale: "Primary workflow CTAs belong in PageHeader or dialog footer." },
      { label: "Board density", value: "size=\"sm\"", rationale: "Kanban columns always use the compact Card tier." },
    ],
    principles: ["P3", "P6", "P13", "P19"],
    modernReferences: [
      "Notion linked database cards (M1, M4)",
      "Linear project summary panels (M4, M7)",
      "Stripe dashboard metric tiles (M4, M11)",
    ],
    patternDoc: "apps/web/docs/card-vs-rows-pattern.md",
    rulePath: ".cursor/rules/exxat-card-vs-list-rows.mdc",
    whenToUse: [
      "Dashboard sections (tasks, learn, activity) with header + scrollable list.",
      "KPI in Card via KeyMetrics variant=\"card\" (flat cells inside, glow on surface).",
      "ListPageTemplate hub strip via KeyMetrics variant=\"flat\" (no Card).",
      "Kanban tiles via LibraryBoardCard; list rows via LibraryListRowCard.",
      "Chart summaries via ChartCard.",
    ],
    whenNotToUse: [
      "Primary data hubs with 10+ homogeneous records — use DataTable.",
      "Transient feedback — use LocalBanner or inline status.",
      "Full create/edit workflows — use a route or focus shell.",
    ],
  },
  guidelines: {
    do: [
      "Let Card own --card-spacing; add overflow-auto only on CardContent for lists.",
      "Use CardFooter for View all style links; CardAction for Export or overflow.",
      "Use size=\"sm\" inside board columns and multi-card grids.",
      "Use CardMedia for photo, video, illustration, or audio — ChartCard for charts.",
      "Use CardSection subdued for inactive or secondary bands inside a card.",
      "Use interactive + Link for navigational tiles (see ListPageBoardCard).",
      "Use KeyMetrics variant=\"card\" for one dashboard KPI tile; variant=\"cards\" when each metric needs its own Card.",
      "Use KeyMetrics variant=\"flat\" on ListPageTemplate metrics — no Card wrapper.",
    ],
    dont: [
      "Add flex-1 / min-h-0 / h-full to Card for stretch layouts.",
      "Put primary Save / Submit actions in CardFooter.",
      "Use CardMedia for charts or KPI grids — use ChartCard or KeyMetrics.",
      "Use variant=\"card\" on ListPageTemplate hub metrics (use flat).",
      "Add bg-card or gap-px grid fills on flat KPI cells.",
      "Hand-roll board tile chrome — compose LibraryBoardCard or LibraryListRowCard.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.3.1",
      criterionTitle: "Info and Relationships",
      level: "A",
      guidance: "CardTitle renders h3 by default; use when the card is the labelled region for that section.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance: "Interactive board cards use Link or button wrappers — avoid nested click targets inside Card onClick.",
    },
    {
      principle: "operable",
      criterion: "2.5.8",
      criterionTitle: "Target Size (Minimum)",
      level: "AA",
      guidance: "Footer and CardAction controls use Button size sm or larger for 24px targets.",
    },
  ],
  relatedSlugs: ["list-page-board-card", "chart-card", "key-metrics", "hover-card"],
}
