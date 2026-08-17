"use client"

/**
 * SiteHeader — per-page breadcrumb / back-link, portaled into the global
 * `UtilityBarSlot` (mounted once in `app/(app)/layout.tsx`, full-width, above
 * the sidebar+content row). Every route still calls `<SiteHeader breadcrumbs=
 * .../>` the same way as before; the difference is this no longer renders its
 * own header row — it portals into the bar's middle slot, matching the DS's
 * `SiteHeader` (`apps/web/components/site-header.tsx`) compact-shell pattern.
 *
 * WCAG 2.1 AA:
 *  ✓ `useDocumentTitle` — browser tab title matches breadcrumb (2.4.2)
 *  ✓ Uses Inter (font-sans) — Ivy Presto is reserved for PageHeader <h1> only
 */

import * as React from "react"
import { createPortal } from "react-dom"
import {
  PageBreadcrumbBack,
  PageBreadcrumbTrail,
  type PageBreadcrumbBackProps,
  type PageBreadcrumbMenuOption,
  type PageBreadcrumbTrailItem,
} from "@/components/page-breadcrumb-trail"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { useCompactHeaderPortalTarget } from "@/contexts/compact-header-slot-context"

export type BreadcrumbItem = PageBreadcrumbTrailItem
export type BreadcrumbMenuOption = PageBreadcrumbMenuOption
export type SiteHeaderBackLink = Pick<PageBreadcrumbBackProps, "label" | "href">

export interface SiteHeaderProps {
  /** Current page title (last breadcrumb segment in trail mode). */
  title?: string
  /** Full breadcrumb trail — each item can be a link or plain text. Title is appended automatically as the last segment. */
  breadcrumbs?: BreadcrumbItem[]
  /** Switch among peer records on the current breadcrumb segment (detail routes). */
  currentPageMenu?: BreadcrumbMenuOption[]
  currentPageMenuAriaLabel?: string
  /**
   * Back-icon variant — parent link only (no `title` segment in the header).
   * Prefer when the page `<h1>` carries the current title (e.g. New question composer).
   */
  back?: SiteHeaderBackLink
  /** Override for `<title>` when `back` is set and the visible H1 lives in page body. */
  documentTitle?: string
  /**
   * Extra chrome appended after the breadcrumb, inside the bar's middle slot.
   * No real PCE route currently uses this (was for a Library preview-mode
   * menu that isn't wired into the live app) — kept for API compatibility.
   */
  trailing?: React.ReactNode
}

export function SiteHeader({
  title = "Dashboard",
  breadcrumbs,
  currentPageMenu,
  currentPageMenuAriaLabel,
  back,
  documentTitle,
  trailing,
}: SiteHeaderProps) {
  const resolvedDocumentTitle = documentTitle ?? (back ? undefined : title)
  useDocumentTitle(resolvedDocumentTitle)

  const portalTarget = useCompactHeaderPortalTarget()
  if (!portalTarget) return null

  return createPortal(
    <>
      {back ? (
        <PageBreadcrumbBack {...back} className="min-w-0 flex-1" />
      ) : (
        <PageBreadcrumbTrail
          variant="header"
          items={breadcrumbs}
          currentPage={title}
          currentPageMenu={currentPageMenu}
          currentPageMenuAriaLabel={currentPageMenuAriaLabel}
          className="min-w-0 flex-1"
        />
      )}
      {trailing ? (
        <div className="flex shrink-0 items-center gap-1.5 ps-1">{trailing}</div>
      ) : null}
    </>,
    portalTarget,
  )
}
