"use client"

// Shared layout primitive: lab template T2, wizard page (docs/knowledge/design/skill-setup-journey/01 section 2, 03 section 6).
// DS Wizard only: supported props and parts, no style override of its internal markup (Romit 2026-10-27, "is it from DS?").
//
// Two layouts, one hierarchy:
// - "rail": DS Wizard orientation="vertical" variant="numbered". The steps sit in a left rail from 1024 px, each with an optional
//   one-line description (the value chosen so far, or "To fix"). The step heading, the banner and the fields share the column
//   beside it. Pattern: Stripe Connect setup, Workable document templates (Mobbin).
// - "bar" (default): DS Wizard orientation="horizontal" variant="compact" above the step.
// Both: the page title (h1) and one status line, then the stepper, then ONE visible step heading (h2, the question the admin
// answers) with at most one short line under it, then the fields; the primary action lives in the sticky footer only.
// Below 1024 px (rail) or 640 px (bar) the stepper collapses to one visible line: the current step name plus "3 of 4".
// Full content width and full height (decision D-X30). With `aside` (configure's live preview) the step and a preview panel
// share the width from 1280 px; below that the preview is hidden and the footer carries the summary.
//
// What the DS Wizard cannot do (2026-10-27): mark an EARLIER step as still needing a fix. resolveStepStatus renders every step
// before the current one as completed (brand tick), and `error` applies to the current step only. So "To fix" travels as the
// step's DS `description` text in the rail (words, not colour) and in the page's own fix list; the tick stays.

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
import { TYPE } from "@/components/lab/type-scale"

export type { WizardStep }

export type WizardPageProps = {
  title: React.ReactNode
  /** One fact the title cannot carry, 12 words or fewer. Usually omitted on a wizard. */
  subtitle?: React.ReactNode
  /** Title-zone nodes, normally one Cancel (`variant="outline" size="sm"`). */
  actions?: React.ReactNode
  /** DS header action row, when the page needs overflow actions. */
  actionItems?: PageHeaderActionItem[]
  /** Page type: "wizard" (default) or "form". */
  width?: "wizard" | "form"
  /** "rail": DS vertical stepper in a left rail. "bar" (default): DS horizontal compact stepper above the step. */
  layout?: "rail" | "bar"
  /**
   * The current step's visible heading: the question the admin answers ("How is this skill judged?"). Without it the heading
   * stays for screen readers only and the stepper label names the step.
   */
  stepTitle?: React.ReactNode
  /** One optional short line under the step heading (12 words or fewer). */
  stepLead?: React.ReactNode
  /**
   * A live preview shown beside the step from 1280 px (decision D-X30). Pass null on a step that already shows the preview
   * itself (Check): the frame keeps its width, so the title, stepper and footer do not move, and the step uses both columns.
   */
  aside?: React.ReactNode
  /** 3 to 5 steps with short labels. `description` shows under the label in the rail. Set `error: true` on the current step. */
  steps: WizardStep[]
  /** Zero-based index of the current step. */
  current: number
  /** Upcoming steps are not reachable (default true). */
  linear?: boolean
  /** Completed steps become buttons that call this with their index. */
  onStepClick?: (index: number) => void
  /** LocalBanner slot under the step heading: a ValidationSummary after a failed continue, or one step-level warning. */
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
    if (s.label.trim().split(/\s+/).length > 3) console.warn(`[WizardPage] step label "${s.label}" is longer than three words.`)
  }
}

/**
 * The step region (decision D-X30, full width). It fills the remaining height, so the footer sits at the bottom and nothing
 * floats in a blank page. The step content is a size container: configure sections lay their blocks out in two columns once
 * the step is wider than 56rem, so a wide screen gets structure, not stretched fields.
 * With `aside` (configure's live preview) the region is two columns from 1280 px: the step, and a full-height preview panel
 * whose content stays in view while the step scrolls. The preview belongs to the step it previews, so both sit in one
 * [data-region="panel"] and the density count keeps the template's 4 regions. `aside={null}` keeps the same frame on a step that
 * shows the previews itself (Check): the step then uses the whole width. `head` (the step heading and banner) tops the step
 * column, so the preview lines up with the heading.
 */
export function PreviewColumns({ aside, head, className, children }: { aside?: React.ReactNode; head?: React.ReactNode; className?: string; children: React.ReactNode }) {
  if (aside === undefined && !head) return <div data-region="panel" className={cn("@container min-w-0 flex-1", className)}>{children}</div>
  if (aside === undefined) {
    return (
      <div data-region="panel" className="flex min-w-0 flex-1 flex-col gap-6">
        {head}
        <div className={cn("@container min-w-0 flex-1", className)}>{children}</div>
      </div>
    )
  }
  return (
    <div data-region="panel" className="grid flex-1 grid-cols-1 gap-6 min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(20rem,34%)]">
      <div className={cn("flex min-w-0 flex-col gap-6", aside === null && "min-[1280px]:col-span-2")}>
        {head}
        <div className={cn("@container min-w-0", className)}>{children}</div>
      </div>
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
  layout = "bar",
  stepTitle,
  stepLead,
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
  const rail = layout === "rail"
  const visibleHead = stepTitle !== undefined

  const head = (
    <>
      {active ? (
        visibleHead ? (
          <div data-step-head className="flex flex-col gap-1">
            <WizardStepHeading id={active.id} className={cn("mb-0 outline-none", TYPE.section)}>
              {stepTitle}
            </WizardStepHeading>
            {stepLead ? <p className={TYPE.helper}>{stepLead}</p> : null}
          </div>
        ) : (
          <WizardStepHeading id={active.id} className="sr-only">
            {active.label}
          </WizardStepHeading>
        )
      ) : null}
      {banner ? <div data-region="banner">{banner}</div> : null}
    </>
  )

  return (
    <div data-page-type={width === "form" ? "form" : "wizard"} data-wizard-layout={layout} className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col">
      <PageFrame title={title} subtitle={subtitle} actions={actions} actionItems={actionItems} width={width} className="flex-1">
        <Wizard
          steps={steps}
          current={current}
          orientation={rail ? "vertical" : "horizontal"}
          variant={rail ? "numbered" : "compact"}
          linear={linear}
          onStepClick={onStepClick}
          className="flex-1 gap-6"
        >
          {/* Rail: the column stretches the full height of the step area (the DS vertical Wizard root sets items-start, so
              self-stretch is set on our own column, not on DS markup) and carries the one divider line down to the footer
              (Romit 2026-10-27, "the vertical grey line needs to be one line"); only the step list inside it is sticky. */}
          <div
            data-region="stepper"
            className={cn("flex flex-col gap-1", rail && "lg:w-56 lg:shrink-0 lg:self-stretch lg:border-e lg:border-border lg:pe-4")}
            data-rail-divider={rail ? "" : undefined}
          >
            <div className={cn("flex flex-col gap-1", rail && "lg:sticky lg:top-4")}>
              <WizardNav className={rail ? "hidden lg:block" : "hidden sm:block"} />
              {/* The visible current-step line on narrow screens only; screen readers hear it at every width. */}
              <WizardProgress
                className={cn("font-medium text-foreground", rail ? "lg:sr-only" : "sm:sr-only")}
                formatLabel={(n, total) => `${active ? `${active.label}, ` : ""}${n} of ${total}`}
              />
            </div>
          </div>

          <WizardContent className="flex flex-1 flex-col gap-4">
            <PreviewColumns aside={aside} head={head}>
              {children}
            </PreviewColumns>
          </WizardContent>
        </Wizard>
        {footer}
      </PageFrame>
    </div>
  )
}
