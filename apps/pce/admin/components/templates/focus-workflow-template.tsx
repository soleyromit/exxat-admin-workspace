"use client"

/**
 * FocusWorkflowTemplate — centered full-page shell for single-task workflows.
 *
 * Hides primary sidebar + secondary panel (via `isFocusWorkflowPath` + `SidebarAutoCollapse`).
 * Compose with `PageHeader` + `actions` for hub-style identity rows, or pass a custom `header`.
 *
 * Reference: `components/focus-workflow-showcase-client.tsx` (Design OS), `new-library-item-form.tsx`.
 */

import * as React from "react"

import { PageHeader } from "@/components/page-header"
import { SidebarAutoCollapse } from "@/components/sidebar"
import {
  PrimaryPageTemplate,
  type PrimaryPageTemplateProps,
} from "@/components/templates/primary-page-template"
import { cn } from "@/lib/utils"

interface BackLink {
  href: string
  label?: string
  ariaLabel?: string
}

export interface FocusWorkflowTemplateProps {
  /** Page `<h1>` when using the built-in `PageHeader`. */
  title: string
  /** Descriptor below the title. */
  subtitle?: React.ReactNode
  /** Back target — rendered in `SiteHeader` when `useSiteHeaderBack`. */
  back: BackLink
  /** Parent trail back icon in `SiteHeader` (no inline back link). Default `true`. */
  useSiteHeaderBack?: boolean
  /** Right-aligned header actions (primary + outline). Pair with custom `header` or built-in `PageHeader`. */
  actions?: React.ReactNode
  /** Replace the default `PageHeader` (e.g. collaboration variant). */
  header?: React.ReactNode
  siteHeader?: PrimaryPageTemplateProps["siteHeader"]
  /** Centered content max width. Default `max-w-3xl`. */
  maxWidthClassName?: string
  bodyClassName?: string
  contentClassName?: string
  containScroll?: boolean
  pageCanvas?: React.ReactNode
  children: React.ReactNode
}

export function FocusWorkflowTemplate({
  title,
  subtitle,
  back,
  useSiteHeaderBack = true,
  actions,
  header,
  siteHeader,
  maxWidthClassName = "max-w-3xl",
  bodyClassName,
  contentClassName,
  containScroll,
  pageCanvas,
  children,
}: FocusWorkflowTemplateProps) {
  const computedSiteHeader = useSiteHeaderBack
    ? {
        back: {
          href: back.href,
          label: back.label ?? "Back",
          ariaLabel: back.ariaLabel,
        } as const,
        ...(siteHeader ?? {}),
      }
    : siteHeader

  const headerNode =
    header ??
    (title ? (
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
    ) : null)

  return (
    <PrimaryPageTemplate
      beforeSiteHeader={<SidebarAutoCollapse />}
      siteHeader={computedSiteHeader}
      maxWidthClassName={maxWidthClassName}
      bodyClassName={cn("overflow-y-auto", bodyClassName)}
      contentClassName={cn("mx-auto w-full", contentClassName)}
      containScroll={containScroll}
      pageCanvas={pageCanvas}
    >
      {headerNode ? <div className="shrink-0">{headerNode}</div> : null}
      {children}
    </PrimaryPageTemplate>
  )
}
