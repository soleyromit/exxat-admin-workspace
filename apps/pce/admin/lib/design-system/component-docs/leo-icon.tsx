"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  LeoAnimationCatalogPreview,
  LeoWorkingMotionPreview,
} from "@/components/design-system/leo-icon-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const leoIconComponentDoc: ComponentDocSpec = {
  slug: "leo-icon",
  summary:
    "The Leo mark. Its motion is a state machine, not decoration: each animation says what Leo is doing right now.",
  sections: [
    ex(
      { id: "catalog", title: "Animation catalog" },
      <LeoAnimationCatalogPreview />,
      "Every motion Leo has. Loops run continuously; the one-shots replay on a shared clock so nothing here sits frozen.",
    ),
    ex(
      { id: "working-motion", title: "The working loop at size" },
      <LeoWorkingMotionPreview />,
      "The same loop from a hero down to a button. Check it at the size you are shipping.",
    ),
  ],
  anatomy: [
    {
      part: "Star body",
      description:
        "Breathes on the shared beat. Carries scale, never the turn, so the two never fight.",
    },
    {
      part: "Sparkles",
      description:
        "Four corner marks on a staggered travelling wave. The wave is what reads as thinking; the turn only carries it.",
    },
    {
      part: "Turn group",
      description:
        "Wraps body and sparkles so they rotate as one object, around the viewBox centre rather than the moving bounding box.",
    },
  ],
  api: [
    {
      prop: "variant",
      type: '"ambient" | "interactive"',
      defaultValue: '"ambient"',
      description:
        "Ambient is the state machine below. Interactive is the cursor-aware hero mark and ignores state.",
    },
    {
      prop: "state",
      type: '"rest" | "invited" | "working" | "answered"',
      defaultValue: '"rest"',
      description:
        "What Leo is doing. Drive it from real state: hover or focus for invited, aria-busy for working.",
    },
    {
      prop: "motionActive",
      type: "boolean",
      description:
        "Shorthand for parents that only track hover or focus. state wins when both are set.",
    },
    {
      prop: "size",
      type: '"xs" | "sm" | "md" | "lg" | "xl"',
      defaultValue: '"md"',
      description: "Glyph size. Gesture amplitude scales with it.",
    },
  ],
  ux: {
    job: "Tell me what Leo is doing without making me read anything.",
    principles: ["P6", "P7", "P9", "P20"],
    modernReferences: ["Linear command AI (M2, M6)", "Notion AI inline (M5, M6)"],
    whenToUse: [
      "Any surface where Leo acts and the user waits.",
      "Controls that hand the current surface to Leo, using invited on hover and focus.",
    ],
    whenNotToUse: [
      "Generic loading that has nothing to do with Leo. Use Skeleton or Spinner.",
      "Decoration. A looping Leo with no work behind it teaches users to ignore it.",
    ],
  },
  guidelines: {
    do: [
      "Drive state from something real, such as aria-busy or a run in flight.",
      "Return to rest once answered has played. It is a one-shot and holds its final frame.",
      "Keep one working loop across the product. A second one asks the user to learn that the difference means something.",
    ],
    dont: [
      "Do not loop working when nothing is running.",
      "Do not rotate the mark through depth. A flat symmetric shape turning on its own axis reads as a horizontal squash, not as a solid.",
    ],
  },
  accessibility: [
    {
      principle: "operable",
      criterion: "2.3.3",
      criterionTitle: "Animation from Interactions",
      level: "AAA",
      guidance:
        "Every loop is suppressed under prefers-reduced-motion. States stay legible through opacity alone.",
    },
    {
      principle: "operable",
      criterion: "2.3.1",
      criterionTitle: "Three Flashes or Below Threshold",
      level: "A",
      guidance:
        "No animation flashes more than three times per second. The fastest beat is the sparkle wave at roughly one cycle per second.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance:
        "The ambient glyph is aria-hidden. Working state is announced by the surface that owns the work, not by the icon, so nothing is announced twice.",
    },
  ],
  extraImports: [{ label: "LeoIconMotionState", path: "@/components/ui/leo-icon" }],
  relatedSlugs: ["ask-leo-button", "leo-assist-bar", "ask-leo-composer"],
}
