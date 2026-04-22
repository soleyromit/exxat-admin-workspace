"use client"

/**
 * SystemBannerSlot — the live banner rendered at the top of the app shell.
 * Reads from `SystemBannerContext` so toggling / editing from Settings
 * updates the banner in real time (and cross-tab via the storage listener).
 */

import * as React from "react"
import Link from "next/link"
import { SystemBanner } from "@/components/ui/banner"
import { useSystemBanner } from "@/contexts/system-banner-context"

export function SystemBannerSlot() {
  const { config, setEnabled } = useSystemBanner()
  if (!config.enabled) return null

  // Banner surface matches SidebarInset + sidebar-gap (inset variant):
  //   expanded: gap = --sidebar-width, inset ms-0 → align at gap edge (no extra ps).
  //   collapsed: gap = icon + spacing(4), inset ms-2 → match packages/ui sidebar gap + 0.5rem.
  return (
    <div className="shrink-0 pe-2 pt-2 transition-[padding] duration-200 ease-linear ps-[var(--sidebar-width)] group-data-[state=collapsed]/sidebar-wrapper:ps-[calc(var(--sidebar-width-icon)+1rem+0.5rem)]">
      <SystemBanner
        variant={config.variant}
        title={config.title || undefined}
        dismissible={config.dismissible}
        onDismiss={() => setEnabled(false)}
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

/** Tiny local link helper so the fallback above still uses next/link. */
function LinkAccent({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="underline">
      {children}
    </Link>
  )
}
