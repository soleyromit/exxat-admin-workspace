"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  BadgeCountIndicatorPreview,
  BadgeCountOnlyPreview,
  BadgeCountOverlayPreview,
  BadgeCountPreview,
  BadgeSizesPreview,
  BadgeVariantsPreview,
  BadgeWithIconPreview,
  StatusBadgeProductPreview,
  StatusBadgeSemanticPreview,
} from "@/components/design-system/feedback-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const badgeComponentDoc: ComponentDocSpec = {
  slug: "badge",
  summary:
    "Two chips on one page: Badge for generic tags, filters, and counts; StatusBadge for entity workflow status and product marketing chrome (New, Beta).",
  extraImports: [
    { label: "StatusBadge", path: "@exxatdesignux/ui/components/status-badge" },
    { label: "Status tints", path: "@exxatdesignux/ui/lib/status-badge-tints" },
    { label: "Domain status map", path: "@/lib/list-status-badges" },
  ],
  sections: [
    ex({ id: "variants", title: "Variants" }, <BadgeVariantsPreview />),
    ex({ id: "sizes", title: "Size" }, <BadgeSizesPreview />),
    ex({ id: "with-icon", title: "With icon" }, <BadgeWithIconPreview />),
    ex({ id: "count-indicator", title: "Indicator" }, <BadgeCountIndicatorPreview />),
    ex({ id: "count-overlay", title: "Count overlay" }, <BadgeCountOverlayPreview />),
    ex({ id: "count-only", title: "Count only" }, <BadgeCountOnlyPreview />),
    ex({ id: "count", title: "Count with label" }, <BadgeCountPreview />),
    ex({ id: "status", title: "Status" }, <StatusBadgeSemanticPreview />),
    ex({ id: "product-status", title: "Product status" }, <StatusBadgeProductPreview />),
  ],
  anatomy: [
    { part: "Badge", description: "Generic inline chip: variant, optional icons via data-icon, tabular counts." },
    { part: "StatusBadge (semantic)", description: "label + tone + size; icon only at md." },
    { part: "StatusBadge (product)", description: "status prop for nav/tab/card marketing chips; pill or dot variant." },
    { part: "STATUS_BADGE_TONE_CLASS", description: "Five semantic tints (success, warning, info, danger, neutral)." },
  ],
  features: [
    {
      group: "Badge",
      icon: "fa-tag",
      items: [
        { part: "variant", description: "Visual style for tags, filters, and non-status labels." },
        { part: "data-icon", description: "Inline-start or inline-end FA icons with automatic padding." },
        { part: "asChild", description: "Merge chip chrome onto a child element (e.g. Link)." },
        { part: "indicator overlay", description: "Unread dot anchored top-end on icon triggers (relative wrapper + absolute dot)." },
        { part: "count overlay", description: "Numeric Badge top-end on icon triggers; not beside the control." },
        { part: "BadgeCount", description: "Red count-only chip — bulk bar, selection tallies; caps at 99+." },
        { part: "variant count", description: "Solid destructive fill for numeric-only badges." },
        { part: "tabular-nums", description: "Add on count badges for stable digit width." },
      ],
    },
    {
      group: "StatusBadge",
      icon: "fa-circle-check",
      items: [
        { part: "tone", description: "Maps workflow meaning onto five chip washes." },
        { part: "size sm", description: "Dense rows: label + tint only. Icons are suppressed." },
        { part: "size md", description: "Cards and headers: room for optional fa-light icon." },
        { part: "status", description: "Product marketing modes with uppercase labels." },
        { part: "variant dot", description: "Presence-style product dot with sr-only label." },
      ],
    },
  ],
  api: [
    {
      prop: "Badge.variant",
      type: "default | secondary | outline | destructive | ghost | link | count",
      defaultValue: "default",
      description: "Generic chip style. Not for entity lifecycle status.",
    },
    {
      prop: "Badge.asChild",
      type: "boolean",
      defaultValue: "false",
      description: "Render as child element while keeping badge styles.",
    },
    {
      prop: "StatusBadge.label",
      type: "string",
      description: "Semantic mode: sentence-case status text (Published, In review).",
    },
    {
      prop: "StatusBadge.tone",
      type: "success | warning | info | danger | neutral",
      description: "Semantic tint from STATUS_BADGE_TONE_CLASS.",
    },
    {
      prop: "StatusBadge.icon",
      type: "string (FA suffix)",
      description: "fa-light glyph. Rendered only when size is md.",
    },
    {
      prop: "StatusBadge.size",
      type: "sm | md",
      defaultValue: "sm",
      description: "sm for tables and dense rows; md for cards and detail headers.",
    },
    {
      prop: "StatusBadge.status",
      type: "new | beta | alpha | preview | deprecated",
      description: "Product marketing chip. Mutually exclusive with label + tone.",
    },
    {
      prop: "StatusBadge.variant",
      type: "pill | dot",
      defaultValue: "pill",
      description: "Product mode only. dot hides visible text; use aria-label.",
    },
    {
      prop: "StatusBadge.tintClassName",
      type: "string",
      description: "Escape hatch for one-off tints. Prefer tone + STATUS_BADGE_TONE_CLASS.",
    },
  ],
  ux: {
    job: "Surface record state or categorical labels at a glance without stealing focus from the primary action on the row or card.",
    budgets: [
      {
        label: "Semantic tones",
        value: "5",
        rationale: "Map every domain status onto success, warning, info, danger, or neutral before adding colors.",
      },
      {
        label: "StatusBadge sm",
        value: "no icon",
        rationale: "Tables and hub rows stay scannable; icons only at md.",
      },
      {
        label: "Label case",
        value: "sentence",
        rationale: 'Semantic labels: "Due soon", "In review". Product chips stay uppercase.',
      },
      {
        label: "Chips per row",
        value: "1 status",
        rationale: "One workflow status chip per record row; use Badge for secondary tags.",
      },
    ],
    principles: ["P6", "P8", "P13", "P19"],
    modernReferences: [
      "Linear issue status chips (M1, M4)",
      "Notion property tags (M1, M4)",
      "Stripe subscription status pills (M4, M11)",
    ],
    patternDoc: "apps/web/docs/table-column-cells-pattern.md",
    rulePath: ".cursor/rules/exxat-table-column-cells.mdc",
    whenToUse: [
      "Hub table status columns with StatusBadge sm (tone + label, no icon).",
      "Board cards and detail headers with StatusBadge md when an icon reinforces meaning.",
      "Product marketing on nav items, tabs, or feature cards (status=\"beta\").",
      "Badge outline/secondary for filters, categories, and non-workflow tags.",
      "Destructive Badge variant for overdue or at-risk labels that are not the primary status chip.",
      "Count badges on toolbar icons, inbox rows, or exam progress (tabular-nums).",
    ],
    whenNotToUse: [
      "Entity lifecycle status with raw Badge variant + uppercase. Use StatusBadge + tone.",
      "Icons on StatusBadge sm in tables. Use md or drop the icon.",
      "Toast or banner feedback after an action. LocalBanner or inline status.",
      "Multiple competing status chips on one row. Pick the single workflow state.",
      "Hand-rolled bg-emerald-* classes per page. Import STATUS_BADGE_TONE_CLASS.",
    ],
  },
  guidelines: {
    do: [
      "Map domain statuses in lib/list-status-badges.ts (or product equivalent) onto STATUS_BADGE_TONE_CLASS.",
      "Table cells: StatusBadge with tone + label, size sm, no icon.",
      "Board cards and inspectors: StatusBadge size md with icon when it aids scanning.",
      "Product chrome: StatusBadge status=\"new\" | \"beta\" on nav, tabs, and feature cards.",
      "Badge with icon: fa-light suffix, data-icon inline-start | inline-end, aria-hidden on decorative icons.",
      "Icon overlays: wrap trigger in relative inline-flex; dot or Badge at top-end. Never place count beside the icon.",
      "Indicator dot: size-2, border-background hairline, destructive fill for unread.",
      "Count overlay: h-4 min-w-4 tabular-nums Badge at -top-1.5 -end-1.5 on icon-sm triggers.",
      "Count only: BadgeCount or variant=count for bulk bar and inline selection tallies.",
    ],
    dont: [
      "Use Badge default/destructive for Published, Draft, or compliance workflow states.",
      "Pass icon to StatusBadge sm expecting it to render. Component suppresses icons at sm.",
      "Uppercase semantic status labels. Product status chips are the only uppercase case.",
      "Invent a sixth semantic color without design review and token addition.",
      "Place notification count badges beside icon buttons. Use top-end overlay on the trigger.",
      "Stack StatusBadge + colored Badge for the same workflow fact.",
      "Use ListHubStatusBadge in new code. Import StatusBadge directly.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.4.1",
      criterionTitle: "Use of Color",
      level: "A",
      guidance:
        "Semantic status pairs tint with label text. Add icon at md where shown in catalog. Never signal state by color alone.",
    },
    {
      principle: "perceivable",
      criterion: "1.4.3",
      criterionTitle: "Contrast (Minimum)",
      level: "AA",
      guidance:
        "Tint washes use text-foreground (neutral tone uses secondary-foreground on bg-secondary). Danger uses chip-destructive like Badge destructive.",
    },
    {
      principle: "perceivable",
      criterion: "1.4.11",
      criterionTitle: "Non-text Contrast",
      level: "AA",
      guidance:
        "Product dot variant (variant=\"dot\") includes sr-only text; the dot is not the sole programmatic name.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance:
        "StatusBadge sets aria-label from label (semantic) or product status name. Override only when visible text differs.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance:
        "Badge icons are decorative (aria-hidden). Status text is exposed on the span; dot variant uses sr-only copy.",
    },
  ],
  relatedSlugs: ["status-badge", "table", "banner", "progress-cell"],
}
