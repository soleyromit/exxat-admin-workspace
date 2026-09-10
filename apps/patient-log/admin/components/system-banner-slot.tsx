"use client"

/**
 * SystemBannerSlot — the live banner at the top of the app shell (full width,
 * above the utility bar). Reads from `SystemBannerContext` so toggling /
 * editing from Settings updates in real time (and cross-tab via storage).
 */

import * as React from "react"
import { Link, useLocation } from "react-router"
import { SystemBanner } from "@/components/ui/banner"
import { PromoBannerDecorativeOverlay } from "@/components/promo-banner-decorative-overlay"
import { useSystemBanner } from "@/contexts/system-banner-context"

const SUPPRESS_BANNER_PATHS: ReadonlyArray<string> = ["/builder/onboarding"]

const SHELL_BANNER_HEIGHT_VAR = "--shell-system-banner-height"

export function SystemBannerSlot() {
  const { config, setEnabled } = useSystemBanner()
  const location = useLocation()
  const [mounted, setMounted] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => setMounted(true), [])

  // Fixed sidebar chrome is pinned under the utility bar with
  // `top: var(--shell-utility-bar-height)`.
  // When this strip is present above the bar, publish its height so the rail
  // offset can clear both rows without guessing a fixed banner size.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const html = document.documentElement
    if (!root) {
      html.style.removeProperty(SHELL_BANNER_HEIGHT_VAR)
      return
    }

    const publish = () => {
      html.style.setProperty(SHELL_BANNER_HEIGHT_VAR, `${root.offsetHeight}px`)
    }
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(root)
    return () => {
      observer.disconnect()
      html.style.removeProperty(SHELL_BANNER_HEIGHT_VAR)
    }
  }, [config.enabled, config.message, config.title, config.variant, config.emphasis])

  if (!config.enabled) return null
  if (SUPPRESS_BANNER_PATHS.some(path => location.pathname.startsWith(path))) return null

  return (
    <div
      ref={rootRef}
      data-slot="system-banner"
      className="relative z-50 w-full shrink-0"
    >
      <SystemBanner
        flush
        variant={config.variant}
        emphasis={config.emphasis}
        title={config.title || undefined}
        dismissible={config.dismissible}
        onDismiss={() => setEnabled(false)}
        decorativeOverlay={
          config.variant === "promo" && mounted ? <PromoBannerDecorativeOverlay /> : undefined
        }
        action={
          config.actionLabel
            ? { label: config.actionLabel, href: config.actionHref || "#" }
            : undefined
        }
      >
        {/* Fall back gracefully if message was cleared — still show title-only banner. */}
        {config.message || (config.title ? "" : <LinkAccent href="#">Details</LinkAccent>)}
      </SystemBanner>
    </div>
  )
}

/** Tiny local link helper for the fallback banner action. */
function LinkAccent({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link to={href} className="underline">
      {children}
    </Link>
  )
}
