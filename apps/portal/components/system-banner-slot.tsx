"use client"

/**
 * SystemBannerSlot — the live banner rendered at the top of the app shell.
 * Reads from `SystemBannerContext` so toggling / editing from Settings
 * updates the banner in real time (and cross-tab via the storage listener).
 */

import * as React from "react"
import { useLocation } from "react-router-dom"
import { Link } from "@/lib/router-compat"
import { SystemBanner } from "@/components/ui/banner"
import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"
import { useSystemBanner } from "@/contexts/system-banner-context"

const SUPPRESS_BANNER_PATHS: ReadonlyArray<string> = ["/builder/onboarding"]

export function SystemBannerSlot() {
  const { config, setEnabled } = useSystemBanner()
  const location = useLocation()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!config.enabled) return null
  if (SUPPRESS_BANNER_PATHS.some(path => location.pathname.startsWith(path))) return null

  // Spans `[data-app-shell-workspace]` (secondary rail + main canvas). `z-40` keeps
  // the promo above inline secondary / main chrome; pointer-events-none on the wrapper
  // preserves sidebar header hit targets in the transparent margin.
  return (
    <div
      data-slot="system-banner"
      className="pointer-events-none relative z-40 mx-2 mb-1.5 shrink-0 md:mb-2"
    >
      <div className="pointer-events-auto">
        <SystemBanner
          variant={config.variant}
          emphasis={config.emphasis}
          title={config.title || undefined}
          dismissible={config.dismissible}
          onDismiss={() => setEnabled(false)}
          decorativeOverlay={
            config.variant === "promo" && mounted ? (
              <AiThinkingOverlay
                active
                cloudCount={2}
                cloudRadius={340}
                gridSize={13}
                dotRadius={1.15}
                fillClassName="fill-brand/30 dark:fill-brand/38"
              />
            ) : undefined
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
    </div>
  )
}

/** Tiny local link helper so the fallback above still uses next/link. */
function LinkAccent({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="underline">
      {children}
    </Link>
  )
}
