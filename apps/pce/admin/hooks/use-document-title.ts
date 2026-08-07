"use client"

import * as React from "react"

const DEFAULT_SITE_TITLE = "Exxat"

/** WCAG 2.4.2 — descriptive, unique `<title>` per route. */
export function formatDocumentTitle(pageTitle: string | undefined): string {
  const trimmed = pageTitle?.trim()
  if (!trimmed) return DEFAULT_SITE_TITLE
  if (/exxat/i.test(trimmed)) return trimmed
  return `${trimmed} · ${DEFAULT_SITE_TITLE}`
}

/**
 * Sets `document.title` for the active route (restores previous title on unmount).
 * Prefer wiring through `SiteHeader` / `PrimaryPageTemplate` when breadcrumbs exist.
 */
export function useDocumentTitle(pageTitle: string | undefined) {
  React.useEffect(() => {
    const next = formatDocumentTitle(pageTitle)
    const previous = document.title
    if (document.title !== next) {
      document.title = next
    }
    return () => {
      document.title = previous
    }
  }, [pageTitle])
}
