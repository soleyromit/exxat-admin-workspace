"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  SkeletonFormPreview,
  SkeletonListRowPreview,
  SkeletonTableRowPreview,
  SkeletonTextPreview,
} from "@/components/design-system/feedback-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const skeletonComponentDoc: ComponentDocSpec = {
  slug: "skeleton",
  summary:
    "Pulse placeholder blocks while async content loads. Compose width, height, and radius to mirror the final layout so the page does not jump on paint.",
  sections: [
    ex({ id: "text", title: "Text lines" }, <SkeletonTextPreview />),
    ex({ id: "list-row", title: "List row" }, <SkeletonListRowPreview />),
    ex({ id: "table-row", title: "Table row" }, <SkeletonTableRowPreview />),
    ex({ id: "form", title: "Form fields" }, <SkeletonFormPreview />),
  ],
  anatomy: [
    { part: "Skeleton", description: "div with animate-pulse, rounded-md, bg-muted; size via className." },
  ],
  features: [
    {
      group: "Layout shapes",
      icon: "fa-rectangle-vertical",
      items: [
        { part: "Text lines", description: "Variable-width h-4 bars for titles and body copy." },
        { part: "Avatar + lines", description: "Circle + two lines for hub list rows and inspectors." },
        { part: "Table row", description: "Checkbox, columns, and status chip placeholders." },
        { part: "Form stack", description: "Label bars above control-height blocks." },
      ],
    },
  ],
  api: [
    { prop: "className", type: "string", description: "Tailwind size, radius, and width fractions (w-2/3, h-9)." },
    { prop: "animate-pulse", type: "built-in", description: "Default motion; respect prefers-reduced-motion at page level." },
  ],
  ux: {
    job: "Hold layout stable while data fetches so users perceive progress instead of an empty flash.",
    budgets: [
      { label: "Skeleton duration", value: "< 3s typical", rationale: "Longer loads need inline status or retry, not infinite pulse." },
      { label: "Shape fidelity", value: "match final", rationale: "Mirror real column widths and avatar size to avoid layout shift." },
      { label: "Rows shown", value: "3–8", rationale: "Enough to imply a list; not a full fake dataset." },
    ],
    principles: ["P5", "P6", "P13"],
    modernReferences: [
      "Linear list loading placeholders (M1, M5)",
      "Notion page skeleton blocks (M1, M5)",
      "Stripe dashboard shimmer rows (M4, M11)",
    ],
    whenToUse: [
      "Hub table or list first paint before rows resolve.",
      "Detail panel sections loading record fields.",
      "Dashboard tiles before chart or KPI data arrives.",
      "Form drawers while options or defaults fetch.",
    ],
    whenNotToUse: [
      "Instant cached data — show content directly.",
      "Global app boot — use shell-level loading route or banner.",
      "Errors — LocalBanner or inline retry.",
      "Replacing empty states — use EmptyState copy instead.",
    ],
  },
  guidelines: {
    do: [
      "Match final geometry: rounded-full for avatars, h-9 for inputs, rounded-full for status chips.",
      "Stack 3–8 row skeletons in tables and lists.",
      "Swap skeleton for real content in one paint when data arrives.",
      "Keep skeleton inside the same scroll region as loaded content.",
    ],
    dont: [
      "Use skeleton as a permanent empty state.",
      "Invent random widths per row on every render (causes layout shift).",
      "Pulse entire page chrome — skeleton the content region only.",
      "Combine skeleton with toast for the same load event.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.4.10",
      criterionTitle: "Reflow",
      level: "AA",
      guidance: "Skeleton mirrors final layout width so content does not jump horizontally on load.",
    },
    {
      principle: "operable",
      criterion: "2.2.2",
      criterionTitle: "Pause, Stop, Hide",
      level: "A",
      guidance: "Pulse animation should stop when prefers-reduced-motion is set (global CSS).",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance: "Mark loading regions aria-busy on the parent list or table, not each skeleton bar.",
    },
  ],
  relatedSlugs: ["table", "card", "field"],
}
