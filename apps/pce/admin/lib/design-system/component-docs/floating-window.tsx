"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { FloatingWindowLivePreview } from "@/components/design-system/floating-window-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const floatingWindowComponentDoc: ComponentDocSpec = {
  slug: "floating-window",
  summary:
    "Non-modal movable and resizable tool window. The page behind stays live. Keyboard grip moves, resizes, and can snap to corners.",
  sections: [
    ex(
      { id: "live", title: "Live window" },
      <FloatingWindowLivePreview />,
      "Drag the title bar or grip. Focus the grip: arrows move, Alt+arrows resize, Shift for a larger step. Esc closes this demo.",
    ),
  ],
  anatomy: [
    {
      part: "FloatingWindow",
      description:
        "Portaled role=dialog aria-modal=false shell. Fixed (or absolute in catalog stages).",
    },
    {
      part: "Grip",
      description:
        "Focusable control. Arrows move, Alt+arrows resize, click cycles corner snap when enabled.",
    },
    {
      part: "Title + toolbar",
      description: "Identity on the leading side; trailing actions optional.",
    },
    {
      part: "Resize handles",
      description: "Eight edges and corners for pointer resize. Keyboard resize goes through the grip.",
    },
  ],
  api: [
    {
      prop: "rect / onRectChange",
      type: "FloatingWindowRect",
      description: "Controlled geometry. Caller persists (e.g. Ask Leo window).",
    },
    {
      prop: "aria-label",
      type: "string",
      description: "Required accessible name for the tool window.",
    },
    {
      prop: "cornerSnap",
      type: "boolean",
      defaultValue: "true",
      description: "Grip click (without drag) cycles viewport corners.",
    },
    {
      prop: "onEscape",
      type: "() => void",
      description: "Esc while focus is inside. Does not steal page Esc.",
    },
    {
      prop: "container",
      type: "Element | null",
      description: "Portal target. Defaults to document.body.",
    },
  ],
  ux: {
    job: "Keep a tool beside the work without trapping focus or dimming the page.",
    principles: ["P1", "P6", "P7"],
    modernReferences: [
      "Figma floating panels (M4, M6)",
      "Linear peeks and tool windows (M4, M7)",
    ],
    whenToUse: [
      "Ask Leo floating shell, ambience settings, or other work-alongside tools.",
      "When the hub behind must stay interactive.",
    ],
    whenNotToUse: [
      "Blocking confirmation. Use Dialog.",
      "A rail that should dock to an edge. Use Sheet / FloatingSheetPanel.",
    ],
  },
  guidelines: {
    do: [
      "Persist rect under a shell: or product-namespaced key.",
      "Expose the same open/close path for pointer and keyboard.",
      "Keep Sheet width keyboard resize in sync with grip step sizes (16 / 48).",
    ],
    dont: [
      "Do not use showModal() / inert page behind.",
      "Do not put primary hub navigation only inside a floating window.",
    ],
  },
  accessibility: [
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance:
        "Grip is in the tab order. Arrows move, Alt+arrows resize, Shift coarse steps. Sheet resize handles use the same step sizes for width-only keyboard resize.",
    },
    {
      principle: "operable",
      criterion: "2.4.3",
      criterionTitle: "Focus Order",
      level: "A",
      guidance: "Non-modal: focus is not trapped. Esc closes only when focus is inside.",
    },
  ],
  relatedSlugs: ["floating-sheet-panel", "sheet", "ask-leo-shell", "fab"],
  extraImports: [
    { label: "FloatingWindow", path: "@/components/ui/floating-window" },
    {
      label: "Geometry",
      path: "@exxatdesignux/ui/components/floating-window",
    },
  ],
}
