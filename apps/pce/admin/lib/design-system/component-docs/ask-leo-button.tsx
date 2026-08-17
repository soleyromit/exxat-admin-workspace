"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  AskLeoButtonIconOnlyPreview,
  AskLeoButtonRouteActionPreview,
  AskLeoButtonSizePreview,
  AskLeoButtonStarPreview,
  AskLeoButtonStatePreview,
  AskLeoTogglePreview,
  LeoMotionStatePreview,
} from "@/components/design-system/ask-leo-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const askLeoButtonComponentDoc: ComponentDocSpec = {
  slug: "ask-leo-button",
  summary:
    "Outline CTA that hands the current surface to Leo — Leo star plus label. Default click toggles the Ask Leo sidebar; pass onClick for a route-local Leo action such as drafting an answer.",
  sections: [
    ex(
      { id: "sizes", title: "Sizes" },
      <AskLeoButtonSizePreview />,
      "sm is the chart card header density (h-7, text-xs). lg matches page header actions beside Save.",
    ),
    ex(
      { id: "star", title: "Star treatment" },
      <AskLeoButtonStarPreview />,
      "sm defaults to the static duotone glyph so dense chart headers stay quiet; lg defaults to the animated LeoIcon star. Set animatedStar to override either default.",
    ),
    ex(
      { id: "icon-only", title: "Icon only" },
      <AskLeoButtonIconOnlyPreview />,
      "Drops the label for chart selectors and dense rails. ariaLabel becomes the accessible name, and the tooltip carries the same text.",
    ),
    ex(
      { id: "states", title: "States" },
      <AskLeoButtonStatePreview />,
      "Busy swaps the label for busyLabel and sets aria-busy so screen readers announce work in progress. Disabled is for unmet preconditions, not for in-flight requests.",
    ),
    ex(
      { id: "motion", title: "Motion states" },
      <LeoMotionStatePreview />,
      "The star is still at rest, plays a one-shot reaction on hover or focus, and loops only while Leo is actually working. Working also turns the whole glyph a slow quarter-turn — 90°, not 360°, because the star is 4-fold symmetric, so the turn lands on itself and the loop has no seam to snap back from. Every looping value is a multiple of one 900ms beat and every stagger comes from the sparkle's fixed position in the clockwise sweep, so the gesture is identical on every play. Motion here is a status signal, not decoration — reach for it only when the state it reports is real.",
    ),
    ex(
      { id: "route-action", title: "Route-local action" },
      <AskLeoButtonRouteActionPreview />,
      "When onClick runs a local action instead of opening the sidebar, set showShortcut to false so the tooltip does not promise the global shortcut.",
    ),
    ex(
      { id: "shell-toggle", title: "Shell toggle (AskLeoToggle)" },
      <AskLeoTogglePreview />,
      "The utility bar uses AskLeoToggle, not AskLeoButton: ghost chrome, brand tint while the sidebar is open, and hover-driven star motion. These two triggers are live and will open the sidebar.",
    ),
  ],
  anatomy: [
    { part: "AskLeoButton", description: "Outline Button wrapped in a Tooltip; gap-1.5 between mark and label." },
    { part: "LeoIcon", description: "Ambient Leo star used when animatedStar is true. No pulsing aura on button chrome." },
    { part: "AskLeoShortcutKbds", description: "Tooltip shortcut chips for the sidebar shortcut; suppressed by showShortcut={false}." },
    { part: "AskLeoToggle", description: "Shell sibling for the utility bar. Ghost variant, optional label, brand tint when open." },
  ],
  api: [
    { prop: "size", type: `"sm" | "lg"`, defaultValue: `"sm"`, description: "sm for chart card headers, lg for page header actions." },
    { prop: "iconOnly", type: "boolean", defaultValue: "false", description: "Hides the label. Pair with ariaLabel." },
    { prop: "label", type: "string", defaultValue: `"Ask Leo"`, description: "Visible label. Use a verb phrase for route-local actions." },
    { prop: "onClick", type: "() => void", defaultValue: "toggles Ask Leo sidebar", description: "Override for a route-local Leo action." },
    { prop: "animatedStar", type: "boolean", defaultValue: `size === "lg"`, description: "Animated LeoIcon star instead of the static duotone glyph." },
    { prop: "aria-busy", type: "boolean", description: "Announces in-flight work; shows busyLabel." },
    { prop: "busyLabel", type: "string", description: "Label shown while aria-busy is true." },
    { prop: "ariaLabel", type: "string", defaultValue: "label", description: "Accessible name. Required when iconOnly." },
    { prop: "tooltipLabel", type: "string", defaultValue: "label", description: "Tooltip body before the shortcut chips." },
    { prop: "showShortcut", type: "boolean", defaultValue: "true", description: "Set false when onClick does not open the sidebar." },
  ],
  ux: {
    job: "Let someone hand the surface they are already reading to Leo, so they get a draft or an explanation without restating the context.",
    budgets: [
      { label: "Triggers per surface", value: "1", rationale: "The utility bar toggle is always present; a second CTA on the same page splits the entry point." },
      { label: "Label length", value: "3 words", rationale: "Sits inside an h-7 outline button beside a card title." },
    ],
    principles: ["P3", "P5", "P8", "P19"],
    modernReferences: [
      "Notion AI block trigger (M1, M4)",
      "Linear issue AI summary action (M4, M7)",
    ],
    patternDoc: "apps/web/docs/ask-leo-pattern.md",
    rulePath: ".cursor/rules/exxat-ask-leo.mdc",
    whenToUse: [
      "A chart, record, or draft on screen is the context Leo should read.",
      "The action produces long-form output such as a drafted answer or an explanation.",
    ],
    whenNotToUse: [
      "Short lookup or navigation. Use the command menu instead.",
      "Surfaces where the utility bar toggle is the only entry point that makes sense.",
    ],
  },
  guidelines: {
    do: [
      "Use ChartCard headers and page header actions as the mounting points.",
      "Keep size sm on chart cards so the CTA stays quieter than the card title.",
      "Set showShortcut to false whenever onClick is a route-local action.",
      "Give iconOnly triggers an ariaLabel that names the target, such as Ask Leo about this chart.",
    ],
    dont: [
      "Do not use for short lookups or navigation. That is the command menu.",
      "Do not add particles or a second icon animation. The utility-bar wash may animate once, then return on hover or focus; LeoIcon keeps its existing built-in hover motion.",
      "Do not swap in a Lucide sparkle. The mark is LeoIcon or the Font Awesome duotone star.",
      "Do not duplicate the trigger on a surface that already shows the utility bar toggle.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.1.1",
      criterionTitle: "Non-text Content",
      level: "A",
      guidance:
        "The star mark is aria-hidden. The accessible name lives on the button via label or ariaLabel.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance:
        "The tooltip opens on keyboard focus, so the shortcut hint is not hover-only.",
    },
    {
      principle: "operable",
      criterion: "2.5.8",
      criterionTitle: "Target Size (Minimum)",
      level: "AA",
      guidance:
        "Both sizes clear the 24 by 24 CSS px floor, including the iconOnly form.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance:
        "Tooltip text matches the accessible name, so sighted and AT users get the same label.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance:
        "aria-busy reports in-flight drafting inline instead of a toast, per the no-toast rule.",
    },
  ],
  extraImports: [
    { label: "Shell toggle", path: "@/components/ask-leo-sidebar" },
    { label: "Leo star", path: "@/components/ui/leo-icon" },
  ],
  relatedSlugs: ["message", "leo-icon", "button", "kbd", "chart", "utility-bar"],
}
