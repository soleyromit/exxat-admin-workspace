"use client"

import * as React from "react"

import {
  FloatingSheetAnatomyPreview,
  FloatingSheetHeaderVariantsPreview,
  FloatingSheetLivePagePreview,
  FloatingSheetNestedNavPreview,
  FloatingSheetSingleRailPreview,
  FloatingSheetSizePreview,
  FloatingSheetToolbarPreview,
} from "@/components/design-system/floating-sheet-panel-previews"
import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

export const floatingSheetPanelComponentDoc: ComponentDocSpec = {
  slug: "floating-sheet-panel",
  summary:
    "Inset rail beside a hub for export, properties, and invite. Rounded chrome, no backdrop, and the page behind stays live.",
  sections: [
    ex(
      { id: "anatomy", title: "Anatomy" },
      <FloatingSheetAnatomyPreview />,
      "Four stacked regions: toolbar, header, scrolling body, footer. Scroll the body and the header grows a bottom border so the title stays separated from what is moving under it.",
    ),
    ex(
      { id: "toolbar", title: "Toolbar" },
      <FloatingSheetToolbarPreview />,
      "Back on the left, only while a sub-panel is showing. Size, record stepping, a consumer slot, and Close all sit on the right, in that order, so close keeps the same outer-corner spot whether or not a given rail has back, a size menu, or stepping.",
    ),
    ex(
      { id: "size", title: "Size" },
      <FloatingSheetSizePreview />,
      "sm 24rem, md 32rem, lg 40rem. The user can change size from the toolbar or drag to a width in between, and both are remembered. Past lg, use a route.",
    ),
    ex(
      { id: "header", title: "Header variants" },
      <FloatingSheetHeaderVariantsPreview />,
      "Title alone, title with a description for a rule the user needs, or title with a one-line meta subtitle. The header shape stays the same at every level of the rail.",
    ),
    ex(
      { id: "nested-nav", title: "Nested navigation" },
      <FloatingSheetNestedNavPreview />,
      "The shipped Properties rail. Drilling into Filter or Sort swaps the content in place and adds back on the left; close stays put on the right the whole time, so there is always one, fixed way out.",
    ),
    ex(
      { id: "single-rail", title: "One rail at a time" },
      <FloatingSheetSingleRailPreview />,
      "Opening a rail closes whichever was already open, so two never stack at the same edge. Opt out with exclusive={false} only for rails pinned to opposite edges.",
    ),
    ex(
      { id: "live-page", title: "The page behind stays live" },
      <FloatingSheetLivePagePreview />,
      "Rails are non-modal: no focus trap, no scroll lock. A click on the page behind does not dismiss, so a half-filled form survives it.",
    ),
  ],
  anatomy: [
    { part: "FloatingSheetPanel", description: "Root. Non-modal, and joins the single-rail group" },
    { part: "FloatingSheetPanelContent", description: "Inset rounded shell. Owns side, size, and the resize handle" },
    { part: "FloatingSheetPanelToolbar", description: "Top row. Close, size menu, record stepping, and a consumer actions slot" },
    { part: "FloatingSheetPanelHeader", description: "Title, optional subtitle or description, optional back button" },
    { part: "FloatingSheetPanelBody", description: "Scrolling content region. Drives the header's scrolled border" },
    { part: "FloatingSheetPanelWorkflowFooter", description: "Cancel and primary actions pinned to the bottom" },
  ],
  api: [
    { prop: "size", type: '"sm" | "md" | "lg"', defaultValue: '"sm"', description: "Width the rail opens at: 24rem, 32rem, or 40rem. The toolbar menu and a dragged width both override it" },
    { prop: "side", type: '"top" | "right" | "bottom" | "left"', defaultValue: '"right"', description: "Rail edge" },
    { prop: "resizable", type: "boolean", defaultValue: "true", description: "Width handle on the inner edge (pointer + keyboard arrows; Shift coarse). Off on compact and mobile. Height stays fixed." },
    { prop: "contentSlot", type: "string", description: "Sets data-slot and keys the remembered size and width under shell:sheet:<contentSlot>:*" },
    { prop: "exclusive", type: "boolean", defaultValue: "true", description: "Leave the single-rail group. Only for rails pinned to opposite edges" },
    { prop: "modal", type: "boolean", defaultValue: "false", description: "Non-modal by default. A surface that must block the page is a Dialog, not a sheet" },
    { prop: "onPrevious / onNext", type: "() => void", description: "Toolbar record stepping. Wire only when the rail shows one of an ordered set" },
    { prop: "actions", type: "ReactNode", description: "Toolbar right cluster, before Close. Icon-only buttons, each wrapped in Tip" },
    { prop: "showSize", type: "boolean", defaultValue: "true", description: "Hide the toolbar size menu on rails whose width is fixed by their content" },
    { prop: "onBack", type: "() => void", description: "Set while a sub-panel is showing. Adds a back button on the left; close stays on the right either way" },
  ],
  ux: {
    job: "Inspect or adjust the record in front of the user without taking away their place on the hub.",
    budgets: [
      { label: "Max width", value: "lg (40rem)", rationale: "Wider than this stops being a rail beside the work; promote it to a route" },
      { label: "Drag range", value: "280px to 960px", rationale: "Below 280 the content stops fitting; above 960 the hub behind is no longer usable" },
      { label: "Rails on screen", value: "1", rationale: "Two rails at the same edge stack at the same z-index and bury each other" },
    ],
    principles: ["P1", "P3", "P5", "P7"],
    modernReferences: [
      "Figma right-hand properties panel (M4, M7)",
      "Linear issue detail side panel (M1, M4)",
    ],
    patternDoc: "apps/web/docs/drawer-vs-dialog-pattern.md",
    rulePath: ".cursor/rules/exxat-drawer-vs-dialog.mdc",
    whenToUse: [
      "Properties, filters, or column setup for the hub behind it",
      "Export and other reversible workflows that read from the current view",
      "Invite and share flows where the user checks the list while typing",
      "Any panel the user wants open while they keep clicking rows",
    ],
    whenNotToUse: [
      "Destructive confirmation. Use AlertDialog so the choice is explicit",
      "Long create flows. Use a route with the focus workflow shell",
      "Content that needs more than 40rem. Use a route",
      "Anything that must block the page. That is a Dialog by definition",
    ],
  },
  guidelines: {
    do: [
      "Give every rail a toolbar. It owns dismissal, so the header does not have to",
      "Give every rail a contentSlot so its size and dragged width are remembered separately",
      "Pick the smallest size that fits the content",
      "Set onBack while a sub-panel is open so there is a way back a level, alongside the always-present close",
      "Swap content inside one open rail rather than closing and reopening",
      "Keep cancel and primary in FloatingSheetPanelWorkflowFooter, not inline in the body",
    ],
    dont: [
      "Do not pass onClose to the header when a toolbar is present. That is two ways out",
      "Do not hand-roll onPointerDownOutside or onInteractOutside guards. The primitive owns dismissal",
      "Do not set modal to make a rail block the page. Use a Dialog",
      "Do not open a second rail at the same edge and expect both to stay",
      "Do not set width with a className. SheetContent's data-[side] width outranks it",
      "Do not wire previous and next on a rail that is not showing one of an ordered set",
    ],
  },
  accessibility: [
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance:
        "Escape and the close button both dismiss. Because the rail is non-modal there is no focus trap, so Tab moves out into the page by design.",
    },
    {
      principle: "operable",
      criterion: "2.4.3",
      criterionTitle: "Focus Order",
      level: "A",
      guidance: "Focus moves into the rail on open and returns to the trigger on close.",
    },
    {
      principle: "operable",
      criterion: "2.4.7",
      criterionTitle: "Focus Visible",
      level: "AA",
      guidance: "The close control and every footer action keep visible focus rings.",
    },
    {
      principle: "perceivable",
      criterion: "1.3.1",
      criterionTitle: "Info and Relationships",
      level: "A",
      guidance:
        "The panel is role=dialog and the header title names it. The resize handle is role=separator with aria-valuenow, valuemin, and valuemax.",
    },
    {
      principle: "operable",
      criterion: "2.5.1",
      criterionTitle: "Pointer Gestures",
      level: "A",
      guidance:
        "Resizing is pointer-only and is an enhancement, not a way to reach content. Every size is usable without dragging.",
    },
  ],
  relatedSlugs: ["sheet", "dialog", "export-drawer", "table-properties"],
}
