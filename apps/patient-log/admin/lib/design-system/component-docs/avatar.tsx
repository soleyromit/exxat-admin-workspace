"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  AvatarGroupPreview,
  AvatarImagePreview,
  AvatarInitialsPreview,
  AvatarSizesPreview,
  AvatarStatusPreview,
  AvatarVerifiedPreview,
} from "@/components/design-system/data-display-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const avatarComponentDoc: ComponentDocSpec = {
  slug: "avatar",
  summary:
    "Radix-based avatar with initials, photo fallback, presence overlays, and a non-overlapping group row for collaborators.",
  sections: [
    ex({ id: "initials", title: "Initials" }, <AvatarInitialsPreview />),
    ex({ id: "sizes", title: "Size" }, <AvatarSizesPreview />),
    ex({ id: "image", title: "Image + fallback" }, <AvatarImagePreview />),
    ex({ id: "status", title: "Presence" }, <AvatarStatusPreview />),
    ex({ id: "group", title: "Group" }, <AvatarGroupPreview />),
    ex({ id: "verified", title: "Verified overlay" }, <AvatarVerifiedPreview />),
  ],
  anatomy: [
    { part: "Avatar", description: "Root: size, shape, variant, optional inset hairline." },
    { part: "AvatarImage", description: "Photo layer; defers to fallback while loading or on error." },
    { part: "AvatarFallback", description: "Initials or placeholder when no image." },
    { part: "AvatarInitials", description: "Exxat composition with branded initials fallback." },
    { part: "AvatarGroup", description: "Horizontal row with gap. MUST NOT overlap faces." },
    { part: "AvatarGroupCount", description: "+N overflow chip inside a group." },
    { part: "AvatarStatus", description: "Presence dot wrapper with sr-only status text." },
    { part: "AvatarVerified", description: "Verified check overlay." },
    { part: "AvatarLeoAssistant", description: "Leo mark for Ask Leo surfaces only." },
  ],
  api: [
    { prop: "size", type: '"sm" | "default" | "lg"', defaultValue: "default", description: "Avatar footprint." },
    { prop: "shape", type: "circle | rounded-* | square", defaultValue: "circle", description: "Corner radius token." },
    { prop: "variant", type: "default | ring | ring-offset | group", defaultValue: "default", description: "Ring treatments for stacks." },
    { prop: "insetBorder", type: "boolean", defaultValue: "false", description: "Subtle inner hairline on photos." },
    {
      prop: "decorative",
      type: "boolean",
      defaultValue: "true",
      description: "On AvatarInitials: hide initials from AT when name is visible beside.",
    },
  ],
  ux: {
    job: "Help users recognize who a record or action belongs to, with the right identity depth for the surface density.",
    budgets: [
      { label: "Visible faces in group", value: "≤3 then +N", rationale: "Show three faces max before AvatarGroupCount; overflow Tip lists hidden names." },
      { label: "Size tier", value: "match row", rationale: "sm in dense tables, default in lists, lg in profile headers. Do not mix tiers for the same person on one screen." },
      { label: "Identity lines", value: "1. 2", rationale: "Name always; email only when the surface is a dedicated person column or profile." },
    ],
    principles: ["P2", "P6", "P8", "P13", "P19"],
    modernReferences: [
      "Linear assignee chips (M1, M4)",
      "Notion collaborator faces (M1, M4)",
      "Stripe customer identity row (M4, M11)",
    ],
    patternDoc: "apps/web/docs/avatar-pattern.md",
    rulePath: ".cursor/rules/exxat-person-identity-display.mdc",
    whenToUse: [
      "Dedicated person columns, profile headers, and invite/access rosters (avatar + name + email).",
      "PageHeader collaborator face rails with AvatarGroup and per-face Tip.",
      "Board cards and dense rows where avatar + name is enough (email in Tip if needed).",
      "Presence on known users via AvatarStatus with a descriptive label.",
    ],
    whenNotToUse: [
      "Anonymous or system actors without a display name. Use icon or badge instead.",
      "Overlapping face piles (negative margin stacks). Use AvatarGroup with gap.",
      "AvatarLeoAssistant outside Ask Leo chrome.",
      "Raw email as the only visible label when a display name exists.",
    ],
  },
  guidelines: {
    do: [
      "Derive initials with initialsFromDisplayName; use AvatarInitials decorative when name is visible beside.",
      "Set AvatarImage alt to the person name when photo is the only label; alt=\"\" when name is adjacent.",
      "External photos: referrerPolicy=\"no-referrer\" on AvatarImage.",
      "AvatarGroup: flex gap-1.5, Tip on each face, Tip on AvatarGroupCount with hidden names.",
      "AvatarStatus: pass label for sr-only status; dot is decorative.",
    ],
    dont: [
      "Restore overlapping piles (-space-x-*, ring-on-background separators).",
      "Mix sm and lg for the same person on one view without a density reason.",
      "Omit Tip on icon-only or overflow group chips that carry meaning.",
      "Use verified overlay without AvatarVerified label for screen readers.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.1.1",
      criterionTitle: "Non-text Content",
      level: "A",
      guidance:
        "Meaningful alt on AvatarImage when it is the sole label; alt=\"\" when paired with visible name (decorative photo).",
    },
    {
      principle: "perceivable",
      criterion: "1.4.1",
      criterionTitle: "Use of Color",
      level: "A",
      guidance:
        "Presence status is not color alone. AvatarStatus includes sr-only label text (Online, Busy, Away).",
    },
    {
      principle: "operable",
      criterion: "2.5.8",
      criterionTitle: "Target Size (Minimum)",
      level: "AA",
      guidance:
        "AvatarGroupCount and interactive faces meet 24×24 CSS px via chip size or row padding.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance:
        "Tip label matches person name; overflow chip aria-label states how many more (e.g. 2 more).",
    },
    {
      principle: "understandable",
      criterion: "3.3.2",
      criterionTitle: "Labels or Instructions",
      level: "A",
      guidance:
        "AvatarVerified and AvatarStatus ship programmatic labels; do not rely on icon shape alone.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance:
        "AvatarInitials decorative=true hides duplicate initials from AT when visible name is present.",
    },
  ],
  relatedSlugs: ["people-avatar-rail-cell", "page-header", "tip", "hover-card"],
  extraImports: [
    { label: "Person rail cell", path: "@/components/data-views/table-cells" },
    { label: "initialsFromDisplayName", path: "@/lib/utils" },
  ],
}
