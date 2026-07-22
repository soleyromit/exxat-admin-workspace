"use client"

import * as React from "react"

import { CoachMark, CoachMarkCatalogFrame } from "@/components/ui/coach-mark"
import { Button } from "@/components/ui/button"
import { useCoachMark } from "@/hooks/use-coach-mark"
import { COACH_MARK_FLOWS } from "@/lib/coach-mark-registry"
import { DS_DOC_SUBSECTION_TITLE } from "@/lib/design-system/doc-typography"

const DEMO_FLOW_ID = "design-system-coach-mark-catalog"

const VARIANT_GROUPS = [
  {
    title: "Single",
    variants: [
      {
        label: "Without image",
        title: "Customize your dashboard",
        description: "Drag tiles to reorder KPIs. Changes save per program.",
      },
      {
        label: "With image",
        title: "Meet Ask Leo",
        description: "Hover any chart for plot insights, or open Leo for longer answers.",
        image: true,
      },
    ],
  },
  {
    title: "Multi-step",
    variants: [
      {
        label: "Without image",
        title: "Step 2 · Filter placements",
        description: "Use lifecycle filters to focus on upcoming rotations before site matching.",
        multiStep: true,
        stepIndex: 1,
      },
      {
        label: "With image",
        title: "Step 3 · Properties",
        description: "Pin columns, add filters, and sort from one drawer.",
        image: true,
        multiStep: true,
        stepIndex: 2,
      },
    ],
  },
] as const

function VariantCaption({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>
}

export function CoachMarkVariantsPreview() {
  return (
    <div className="flex flex-col gap-8">
      {VARIANT_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-4">
          <h3 className={DS_DOC_SUBSECTION_TITLE}>{group.title}</h3>
          <div className="grid min-w-0 gap-8 sm:grid-cols-2">
            {group.variants.map((variant) => (
              <div key={variant.label} className="flex min-w-0 flex-col gap-2">
                <VariantCaption>{variant.label}</VariantCaption>
                <CoachMarkCatalogFrame
                  title={variant.title}
                  description={variant.description}
                  image={"image" in variant ? variant.image : false}
                  multiStep={"multiStep" in variant ? variant.multiStep : false}
                  stepIndex={"stepIndex" in variant ? variant.stepIndex : 0}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DemoToolbar({ markTarget }: { markTarget?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3">
      <span {...(markTarget ? { "data-coach-mark-demo-target": "" } : undefined)}>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <i className="fa-light fa-sliders" aria-hidden="true" />
          Properties
        </Button>
      </span>
      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
        <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
        Search
      </Button>
    </div>
  )
}

export function CoachMarkWithoutOverlayPreview() {
  return (
    <div className="relative min-h-[280px] rounded-lg border border-border bg-muted/15 p-4">
      <DemoToolbar />
      <div className="absolute start-4 top-[4.75rem]">
        <CoachMarkCatalogFrame
          title="Properties"
          description="Open column, filter, and sort controls for this hub."
        />
      </div>
    </div>
  )
}

export function CoachMarkWithOverlayPreview() {
  const previewRootRef = React.useRef<HTMLDivElement>(null)
  const tour = useCoachMark({
    flowId: DEMO_FLOW_ID,
    force: true,
    delay: 500,
    steps: [
      {
        id: "properties",
        target: "[data-coach-mark-demo-target]",
        side: "bottom",
        align: "start",
        title: "Properties",
        description: "Open column, filter, and sort controls for this hub.",
      },
    ],
    overlayRoot: previewRootRef,
  })

  return (
    <div
      ref={previewRootRef}
      className="relative min-h-[280px] overflow-hidden rounded-lg border border-border bg-muted/15 p-4"
    >
      <DemoToolbar markTarget />
      <CoachMark {...tour} />
    </div>
  )
}

/** Settings-style registry row — documents resetCoachMarkFlow / preview wiring. */
export function CoachMarkUtilityPreview() {
  const sample = COACH_MARK_FLOWS.slice(0, 2)
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/15 p-4">
      <p className="m-0 text-sm text-muted-foreground">
        Register flows in <code className="font-mono text-xs">lib/coach-mark-registry.ts</code>.
        Settings lists each flow with Preview and Reset — uses{" "}
        <code className="font-mono text-xs">resetCoachMarkFlow</code> and{" "}
        <code className="font-mono text-xs">resetAllCoachMarks</code>.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {sample.map((flow) => (
          <li
            key={flow.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
          >
            <div className="min-w-0">
              <p className="m-0 text-sm font-medium text-foreground">{flow.name}</p>
              <p className="m-0 text-xs text-muted-foreground">
                {flow.stepCount} step{flow.stepCount === 1 ? "" : "s"} · {flow.page}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" size="sm">
                Preview
              </Button>
              <Button type="button" variant="ghost" size="sm">
                Reset
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
