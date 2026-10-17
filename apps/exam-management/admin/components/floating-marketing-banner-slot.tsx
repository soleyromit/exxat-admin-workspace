"use client"

/**
 * Shell-level floating marketing promo — gradient card with full-bleed media header.
 * Dismiss persists in localStorage; a corner chip restores the promo.
 */

import * as React from "react"
import { createPortal } from "react-dom"
import { useLocation } from "react-router-dom"

import { FloatingMarketingBannerMedia } from "@/components/floating-marketing-banner-media"
import { MarketingBanner } from "@/components/ui/marketing-banner"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { isExamLockPath } from "@/lib/exam-lock-shell"

const STORAGE_KEY = "exxat:floating-marketing-banner-dismissed"

const SUPPRESS_PATHS: ReadonlyArray<string> = ["/builder/onboarding", "/design-system"]

export function FloatingMarketingBannerSlot() {
  const { pathname } = useLocation()
  const [mounted, setMounted] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      /* ignore */
    }
  }, [])

  function handleDismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  function handleRestore() {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setDismissed(false)
  }

  if (!mounted) return null
  if (isExamLockPath(pathname)) return null
  if (SUPPRESS_PATHS.some(path => pathname.startsWith(path))) return null

  if (dismissed) {
    return createPortal(
      <Tip label="Show Leo promo" side="left">
        <span
          data-slot="marketing-banner-restore"
          className="fixed bottom-4 right-4 z-40 inline-flex"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-border bg-card shadow-[var(--shadow-sheet-panel)]"
            onClick={handleRestore}
          >
            <i className="fa-duotone fa-solid fa-sparkles text-brand" aria-hidden="true" />
            Leo insights
          </Button>
        </span>
      </Tip>,
      document.body,
    )
  }

  return createPortal(
    <MarketingBanner
      layout="floating"
      floatingVariant="media"
      corner="bottom-right"
      title="See Leo on your dashboard"
      media={<FloatingMarketingBannerMedia />}
      primaryAction={{ label: "Try it", href: "/prism/dashboard" }}
      primaryActionFullWidth
      dismissible
      onDismiss={handleDismiss}
    >
      Plot insights on hover — you stay in control.
    </MarketingBanner>,
    document.body,
  )
}
