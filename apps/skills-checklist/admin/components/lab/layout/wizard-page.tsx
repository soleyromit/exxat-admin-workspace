"use client"

// Shared layout primitive: lab template T2, wizard page (docs/knowledge/design/skill-setup-journey/01 section 2, 03 section 6).
// PageFrame (960 px) > DS Wizard horizontal compact > WizardNav, an sr-only WizardProgress, the banner slot, the step panel
// and a sticky footer. No visible "Step n of m" and no visible heading that repeats the step label: the stepper already
// says where you are. Each step panel is labelled by an sr-only WizardStepHeading so WizardPanel's aria-labelledby resolves.
// Below 640 px the stepper collapses to one visible line: the current step name plus "3 of 4".
// Full content width and full height (decision D-X30, leadership 2026-10-27, superseding the centred column of D-X29). With
// `aside` (configure's live preview) the step and a full-height preview panel share the width from 1280 px; below that the
// preview is hidden and the footer carries the summary.

import * as React from "react"
import {
  Wizard,
  WizardContent,
  WizardNav,
  WizardProgress,
  WizardStepHeading,
  type WizardStep,
} from "@exxatdesignux/ui/components/ui/wizard"
import type { PageHeaderActionItem } from "@exxatdesignux/ui/components/ui/page-header"
import { PageFrame } from "@/components/skills/page-header"
import { cn } from "@exxatdesignux/ui/lib/utils"

export type { WizardStep }

export type WizardPageProps = {
  title: React.ReactNode
  /** One fact the title cannot carry, 12 words or fewer. Usually omitted on a wizard. */
  subtitle?: React.ReactNode
  /** Title-zone nodes, normally one Cancel (`variant="outline" size="sm"`). */
  actions?: React.ReactNode
  /** DS header action row, when the page needs overflow actions. */
  actionItems?: PageHeaderActionItem[]
  /** Column width: "wizard" 960 px (default) or "form" 720 px. */
  width?: "wizard" | "form"
  /**
   * A live preview shown beside the step from 1400 px (decision D-X29). Pass null on a step that already shows the preview
   * itself (Check): the frame keeps its width, so the title, stepper and footer do not move, and the step uses both columns.
   */
  aside?: React.ReactNode
  /** 3 to 5 steps with one-word labels. Set `error: true` on the current step to mark it. */
  steps: WizardStep[]
  /** Zero-based index of the current step. */
  current: number
  /** Upcoming steps are not reachable (default true). */
  linear?: boolean
  /** Completed steps become buttons that call this with their index. */
  onStepClick?: (index: number) => void
  /** LocalBanner slot under the stepper: a ValidationSummary after a failed continue, or one step-level warning. */
  banner?: React.ReactNode
  /** A <StickyFooter />. */
  footer: React.ReactNode
  /** One WizardPanel per step (`import { WizardPanel } from "@exxatdesignux/ui/components/ui/wizard"`). */
  children: React.ReactNode
}

function warnShape(steps: WizardStep[]) {
  if (process.env.NODE_ENV === "production") return
  if (steps.length < 3 || steps.length > 5) {
    console.warn(`[WizardPage] ${steps.length} steps; the lab wizard template takes 3 to 5.`)
  }
  for (const s of steps) {
    if (s.label.trim().split(/\s+/).length > 2) console.warn(`[WizardPage] step label "${s.label}" is longer than two words.`)
  }
}

/**
 * The step region (decision D-X30, full width). It fills the remaining height, so the footer sits at the bottom and nothing
 * floats in a blank page. The step content is a size container: configure sections lay their blocks out in two columns once
 * the step is wider than 56rem, so a wide screen gets structure, not stretched fields.
 * With `aside` (configure's live preview) the region is two columns from 1280 px: the step, and a full-height preview panel
 * (about a third of the width) whose content stays in view while the step scrolls. The preview belongs to the step it previews,
 * so both sit in one [data-region="panel"] and the density count keeps the template's 4 regions. `aside={null}` keeps the
 * same frame on a step that shows the previews itself (Check): the step then uses the whole width.
 */
export function PreviewColumns({ aside, className, children }: { aside?: React.ReactNode; className?: string; children: React.ReactNode }) {
  if (aside === undefined) return <div data-region="panel" className={cn("@container min-w-0 flex-1", className)}>{children}</div>
  return (
    <div data-region="panel" className="grid flex-1 grid-cols-1 gap-6 min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(22rem,36%)]">
      <div className={cn("@container min-w-0", aside === null && "min-[1280px]:col-span-2", className)}>{children}</div>
      {aside ? (
        <div className="hidden rounded-[var(--radius)] border border-border min-[1280px]:block" data-preview-column>
          <div className="sticky top-4 p-4">{aside}</div>
        </div>
      ) : null}
    </div>
  )
}

export function WizardPage({
  title,
  subtitle,
  actions,
  actionItems,
  width = "wizard",
  aside,
  steps,
  current,
  linear = true,
  onStepClick,
  banner,
  footer,
  children,
}: WizardPageProps) {
  React.useEffect(() => warnShape(steps), [steps])
  const active = steps[current]

  return (
    <div data-page-type={width === "form" ? "form" : "wizard"} className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col">
      <PageFrame title={title} subtitle={subtitle} actions={actions} actionItems={actionItems} width={width} className="flex-1">
        <Wizard
          steps={steps}
          current={current}
          orientation="horizontal"
          variant="compact"
          linear={linear}
          onStepClick={onStepClick}
          className="flex-1 gap-6"
        >
          <div data-region="stepper" className="flex flex-col gap-1">
            <WizardNav className="hidden sm:block" />
            {/* sr-only from 640 px (the stepper shows position); the visible current-step line below 640 px. */}
            <WizardProgress
              className="font-medium text-foreground sm:sr-only"
              formatLabel={(n, total) => `${active ? `${active.label}, ` : ""}${n} of ${total}`}
            />
          </div>

          {banner ? <div data-region="banner">{banner}</div> : null}

          <WizardContent className="flex flex-1 flex-col gap-4">
            <PreviewColumns aside={aside}>
              {active ? (
                <WizardStepHeading id={active.id} className="sr-only">
                  {active.label}
                </WizardStepHeading>
              ) : null}
              {children}
            </PreviewColumns>
          </WizardContent>
        </Wizard>
        {footer}
      </PageFrame>
    </div>
  )
}
