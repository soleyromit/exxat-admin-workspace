"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  CoachMarkUtilityPreview,
  CoachMarkVariantsPreview,
  CoachMarkWithoutOverlayPreview,
  CoachMarkWithOverlayPreview,
} from "@/components/design-system/coach-mark-preview"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

export const coachMarkComponentDoc: ComponentDocSpec = {
  slug: "coach-mark",
  summary:
    "Selector-targeted onboarding popover on brand chrome. Steps can be single or multi-step, with or without a hero image per step, and with or without a spotlight overlay.",
  extraImports: [
    { label: "useCoachMark", path: "@exxatdesignux/ui/hooks/use-coach-mark" },
    { label: "Coach mark registry", path: "@/lib/coach-mark-registry" },
    { label: "resetCoachMarkFlow", path: "@exxatdesignux/ui/hooks/use-coach-mark" },
  ],
  sections: [
    ex({ id: "variants", title: "Variants" }, <CoachMarkVariantsPreview />),
    ex({ id: "without-overlay", title: "Without overlay" }, <CoachMarkWithoutOverlayPreview />),
    ex({ id: "with-overlay", title: "With overlay" }, <CoachMarkWithOverlayPreview />),
    ex({ id: "utility", title: "Utility" }, <CoachMarkUtilityPreview />),
  ],
  anatomy: [
    { part: "CoachMark", description: "Popover + optional spotlight overlay; brand-deep shell." },
    { part: "useCoachMark", description: "Flow state, target resolution, localStorage dismiss, step navigation." },
    { part: "CoachMarkStep", description: "target selector, title, description, optional image + imageAlt, side, align." },
    { part: "SpotlightOverlay", description: "Dimmed backdrop with SVG mask cutout and brand ring on the target." },
    { part: "COACH_MARK_FLOWS", description: "Settings registry — preview and reset per flow." },
  ],
  features: [
    {
      group: "Chrome",
      icon: "fa-window-maximize",
      items: [
        { part: "Single step", description: "One-item steps array — primary button reads Got it; no step dots." },
        { part: "Multi-step", description: "Two or more steps — dots, Skip, Back, Next." },
        { part: "With image", description: "Optional image + imageAlt on any step (single or flow)." },
        { part: "Without image", description: "Text-only popover when image is omitted." },
      ],
    },
    {
      group: "Product wiring",
      icon: "fa-bullseye-pointer",
      items: [
        { part: "With overlay", description: "CoachMark + useCoachMark — spotlight dims the page and rings the target." },
        { part: "Without overlay", description: "Popover chrome only — no dimming; overlay ships via CoachMark in product." },
        { part: "Target selector", description: "aria-label, role, or data-coach-mark on the anchored control." },
      ],
    },
  ],
  api: [
    { prop: "state", type: "CoachMarkState", description: "Return value from useCoachMark." },
    { prop: "steps", type: "CoachMarkStep[]", description: "One step = single tip; two+ = flow." },
    { prop: "flowId", type: "string", description: "localStorage key for dismiss persistence." },
    { prop: "image / imageAlt", type: "string", description: "Optional hero on any step; alt required with image." },
    { prop: "force", type: "boolean", description: "Bypass dismiss persistence (dev / Settings preview)." },
    { prop: "overlayRootRef", type: "RefObject<HTMLElement>", description: "Portal spotlight + popover into this element (catalog previews)." },
    { prop: "resetCoachMarkFlow", type: "(flowId) => void", description: "Clear one dismissed flow." },
    { prop: "resetAllCoachMarks", type: "() => void", description: "Clear all dismissed flows." },
    { prop: "getAllCoachMarkKeys", type: "() => string[]", description: "List dismissed flow ids." },
  ],
  ux: {
    job: "Introduce a control or workflow in context without leaving the page the user is on.",
    budgets: [
      { label: "Steps per flow", value: "3–6", rationale: "Split longer tours; one decision per step." },
      { label: "First-show delay", value: "800–1200ms", rationale: "Let the target mount before anchoring." },
      { label: "Target selector", value: "semantic", rationale: "Prefer aria-label or data-coach-mark over CSS classes." },
    ],
    principles: ["P5", "P8", "P13", "P19"],
    modernReferences: [
      "Linear cmd onboarding (M1, M4)",
      "Notion guided tips (M1, M4)",
      "Figma spotlight tours (M4, M7)",
    ],
    patternDoc: "apps/web/docs/coach-marks.md",
    whenToUse: [
      "First-run feature discovery on a hub toolbar or new control.",
      "Multi-step walkthrough when each step anchors a different selector.",
      "Hero image when a screenshot clarifies the target surface.",
      "Settings → Coach marks to reset or preview registered flows.",
    ],
    whenNotToUse: [
      "Blocking errors or validation — LocalBanner or inline field errors.",
      "Persistent global promos — SystemBanner.",
      "Tooltip-length hints — Tip on the control.",
    ],
  },
  guidelines: {
    do: [
      "Register every flow in lib/coach-mark-registry.ts for Settings reset + preview.",
      "Use stable selectors: [aria-label='…'], [data-coach-mark='…'], or role + label.",
      "Set imageAlt whenever image is set — on single steps too.",
      "Mount <CoachMark state={tour} /> once per page; it portals and targets by selector.",
      "Use resetCoachMarkFlow from Settings or QA to replay a dismissed tour.",
    ],
    dont: [
      "Wrap children in CoachMark — it does not compose like a popover trigger.",
      "Use toast or modal dialogs for onboarding copy.",
      "Ship eight top-level steps in one flow — split into sibling flows.",
      "Rely on nth-child or generated class selectors for targets.",
    ],
  },
  accessibility: [
    {
      principle: "perceivable",
      criterion: "1.4.3",
      criterionTitle: "Contrast (Minimum)",
      level: "AA",
      guidance: "Brand-deep shell uses white title and white/80 body copy; primary CTA is inverted white button.",
    },
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance: "Escape dismisses; focus stays in the popover while open.",
    },
    {
      principle: "understandable",
      criterion: "2.4.6",
      criterionTitle: "Headings and Labels",
      level: "AA",
      guidance: "aria-labelledby + aria-describedby wire title and body; step dots use aria-live.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance: "Spotlight overlay is aria-hidden; target control keeps its accessible name.",
    },
  ],
  relatedSlugs: ["banner", "tip", "popover"],
}
