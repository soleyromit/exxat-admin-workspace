"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  FabBadgePreview,
  FabBrandPreview,
  FabExtendedPreview,
  FabKeyboardNudgePreview,
  FabKindsPreview,
  FabOutlinePreview,
  FabSuggestionPreview,
  FabThinkingPreview,
} from "@/components/design-system/fab-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const fabComponentDoc: ComponentDocSpec = {
  slug: "fab",
  summary:
    "Corner floating actions. Compose Button or AskLeoButton as a circle (or extended pill). The product Leo launcher supports drag and keyboard move like Floating Window.",
  sections: [
    ex(
      { id: "kinds", title: "Kinds" },
      <FabKindsPreview />,
      "Default, secondary, outline, brand Leo (icon only), and extended Leo with a label. One primary FAB per view.",
    ),
    ex(
      { id: "brand", title: "Brand launcher" },
      <FabBrandPreview />,
      "Product Leo launcher chrome: brand fill, 56px circle, animated star. See LeoLauncherFab in the shell.",
    ),
    ex(
      { id: "outline", title: "Outline secondary" },
      <FabOutlinePreview />,
      "Use outline when the FAB is not the brand Leo entry. Keep Tip + aria-label on icon-only.",
    ),
    ex(
      { id: "extended", title: "Extended" },
      <FabExtendedPreview />,
      "Label beside the mark when the job is not yet learnable from the icon alone. Prefer icon-only once the pattern is familiar.",
    ),
    ex(
      { id: "thinking", title: "Thinking" },
      <FabThinkingPreview />,
      "While Leo is composing, set aria-busy so the star enters the working loop. Same signal as a minimised Ask Leo window.",
    ),
    ex(
      { id: "badge", title: "Badge" },
      <FabBadgePreview />,
      "Unread or pending count. Use Badge variant count (solid red) with z-10 so it sits above the FAB. Include the count in the accessible name.",
    ),
    ex(
      { id: "suggestion", title: "With suggestion" },
      <FabSuggestionPreview />,
      "Marketing invite pattern: a suggestion card docked above the FAB. Product: MarketingLeoInvite tracks FAB nudge position.",
    ),
    ex(
      { id: "move", title: "Drag and keyboard move" },
      <FabKeyboardNudgePreview />,
      "Drag to reposition. Focused: arrows nudge, Shift is coarse, Home resets. Product position persists under shell:leo-launcher-fab:offset; the suggestion card follows.",
    ),
  ],
  anatomy: [
    {
      part: "Circle / extended shell",
      description: "Button or AskLeoButton with size-14 rounded-full and sheet-panel shadow.",
    },
    {
      part: "LeoLauncherFab",
      description:
        "Product portal into data-app-shell-main. Brand AskLeoButton with drag + keyboard move, persisted offset.",
    },
    {
      part: "Suggestion card",
      description:
        "Optional invite above the FAB (MarketingLeoInvite). Stays aligned when the FAB is dragged or nudged.",
    },
    {
      part: "Count badge",
      description: "Badge variant count, z-10, above the circle. Same chip as notification overlays.",
    },
    {
      part: "Tip + aria-label",
      description: "Icon-only FABs need both. Do not rely on the glyph alone.",
    },
  ],
  api: [
    {
      prop: "composition",
      type: "Button | AskLeoButton",
      description:
        "No separate FloatingActionButton export. Compose existing buttons; Leo uses AskLeoButton.",
    },
    {
      prop: "move",
      type: "pointer drag · Arrow / Shift+Arrow / Home",
      description:
        "LeoLauncherFab. Drag repositions; focused arrows nudge. Geometry in lib/leo-launcher-fab-geometry.ts.",
    },
  ],
  ux: {
    job: "Reach a primary or brand action without leaving the current view.",
    principles: ["P3", "P6", "P7"],
    modernReferences: [
      "Material floating action button (M2)",
      "Linear / Notion corner AI launchers (M5, M6)",
    ],
    whenToUse: [
      "One persistent primary action that must stay reachable while scrolling.",
      "Leo entry when the utility bar Ask Leo toggle is hidden (products home).",
      "Restore a minimised Ask Leo window.",
    ],
    whenNotToUse: [
      "Page header actions already cover the job. Prefer PageHeader.",
      "More than one FAB on the same view.",
      "Navigation between hubs. Use the sidebar.",
    ],
  },
  guidelines: {
    do: [
      "One FAB per view, usually the brand Leo launcher or a single create action.",
      "Use AskLeoButton with animatedStar for Leo FABs (exxat-leo-icon-motion).",
      "Drive thinking with aria-busy so the star runs the working loop.",
      "Overlay counts with Badge variant count and z-10 above the FAB.",
      "Support drag and keyboard move when the FAB can leave the default corner.",
    ],
    dont: [
      "Do not invent a parallel FAB primitive beside Button / AskLeoButton.",
      "Do not stack multiple corner FABs.",
      "Do not omit Tip and aria-label on icon-only FABs.",
      "Do not use the soft destructive Badge for FAB counts; use variant count.",
      "Do not fire the FAB click after a drag gesture.",
    ],
  },
  accessibility: [
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance:
        "LeoLauncherFab moves with arrow keys while focused; pointer users drag. Sheet resize handles use the same fine/coarse step sizes.",
    },
    {
      principle: "operable",
      criterion: "2.3.3",
      criterionTitle: "Animation from Interactions",
      level: "AAA",
      guidance:
        "Introduce-on-mount and star motion honour prefers-reduced-motion via LeoIcon.",
    },
  ],
  relatedSlugs: ["ask-leo-button", "button", "floating-window", "leo-icon"],
  extraImports: [
    { label: "LeoLauncherFab", path: "@/components/leo-launcher-fab" },
    { label: "AskLeoButton", path: "@/components/ask-leo-button" },
    { label: "Geometry", path: "@/lib/leo-launcher-fab-geometry" },
  ],
}
