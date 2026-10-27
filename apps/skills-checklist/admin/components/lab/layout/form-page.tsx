"use client"

// Shared layout primitive: lab template T3, form page (docs/knowledge/design/skill-setup-journey/01 section 2, 03 section 6).
// PageFrame (720 px, single column) > optional validation summary under the title > sections of 7 fields or fewer
// (32 px between sections, 16 px between fields) > a sticky footer with the summary line and the one primary.
// Centred in the page (decision D-X29); with `aside` the live preview sits beside the form from 1400 px (see WizardPage).

import * as React from "react"
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "@exxatdesignux/ui/components/ui/field"
import type { PageHeaderActionItem } from "@exxatdesignux/ui/components/ui/page-header"
import { PageFrame } from "@/components/skills/page-header"
import { PreviewColumns } from "./wizard-page"

export const FORM_SECTION_MAX_FIELDS = 7

export type FormPageProps = {
  title: React.ReactNode
  /** Facts only (state, owner, counts), 12 words or fewer. */
  subtitle?: React.ReactNode
  /** Title-zone nodes, at most one outline `sm` button plus an overflow. */
  actions?: React.ReactNode
  actionItems?: PageHeaderActionItem[]
  /** Error summary (ValidationSummary) or one warning LocalBanner, placed directly under the title. */
  banner?: React.ReactNode
  /** A <StickyFooter summary={...} primary={...} />. */
  footer?: React.ReactNode
  /** A live preview beside the form from 1400 px (decision D-X29); null keeps the wide frame with no preview. */
  aside?: React.ReactNode
  /** FormSection blocks. */
  children: React.ReactNode
}

export function FormPage({ title, subtitle, actions, actionItems, banner, footer, aside, children }: FormPageProps) {
  return (
    <div data-page-type="form" className="flex w-full flex-col">
      <PageFrame title={title} subtitle={subtitle} actions={actions} actionItems={actionItems} width={aside !== undefined ? "form-preview" : "form"}>
        {banner ? <div data-region="banner">{banner}</div> : null}
        <PreviewColumns aside={aside} className="flex flex-col gap-8 pt-2">
          {children}
        </PreviewColumns>
        {footer}
      </PageFrame>
    </div>
  )
}

export type FormSectionProps = {
  /** Section name, sentence case. Rendered as the fieldset legend. */
  legend: string
  /** One helper line for the whole group, 12 words or fewer. */
  description?: string
  /** 7 fields or fewer (DS Field blocks). Put advanced options behind one Collapsible. */
  children: React.ReactNode
}

/** One group of related fields. Warns in development when it holds more than 7 direct children. */
export function FormSection({ legend, description, children }: FormSectionProps) {
  const count = React.Children.toArray(children).length
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && count > FORM_SECTION_MAX_FIELDS) {
      console.warn(`[FormSection] "${legend}" holds ${count} fields; split it into groups of ${FORM_SECTION_MAX_FIELDS} or fewer.`)
    }
  }, [count, legend])

  return (
    <FieldSet>
      <FieldLegend>{legend}</FieldLegend>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldGroup className="gap-4">{children}</FieldGroup>
    </FieldSet>
  )
}
