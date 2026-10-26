"use client"

// Shared layout primitive: lab template T2, wizard page (docs/knowledge/design/skill-setup-journey/01 section 2, 03 section 6).
// PageFrame (960 px) > DS Wizard horizontal compact > WizardNav, an sr-only WizardProgress, the banner slot, the step panel
// and a sticky footer. No visible "Step n of m" and no visible heading that repeats the step label: the stepper already
// says where you are. Each step panel is labelled by an sr-only WizardStepHeading so WizardPanel's aria-labelledby resolves.
// Below 640 px the stepper collapses to one visible line: the current step name plus "3 of 4".

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

export function WizardPage({
  title,
  subtitle,
  actions,
  actionItems,
  width = "wizard",
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
    <div data-page-type={width === "form" ? "form" : "wizard"} className="flex w-full flex-col">
      <PageFrame title={title} subtitle={subtitle} actions={actions} actionItems={actionItems} width={width}>
        <Wizard
          steps={steps}
          current={current}
          orientation="horizontal"
          variant="compact"
          linear={linear}
          onStepClick={onStepClick}
          className="gap-6"
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

          <WizardContent className="flex flex-col gap-4">
            <div data-region="panel">
              {active ? (
                <WizardStepHeading id={active.id} className="sr-only">
                  {active.label}
                </WizardStepHeading>
              ) : null}
              {children}
            </div>
          </WizardContent>
        </Wizard>
        {footer}
      </PageFrame>
    </div>
  )
}
