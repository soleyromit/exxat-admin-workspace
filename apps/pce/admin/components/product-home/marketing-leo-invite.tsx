"use client"

/**
 * First-visit Ask Leo invite on a product marketing page.
 *
 * One suggestion card above the Leo FAB (same chip style as the Ask Leo empty
 * state). Portals into `[data-app-shell-main]`. Stays up until the user picks
 * it (persisted per slug) or opens Ask Leo; outside clicks do not dismiss it.
 *
 * Enter + brand pulse draw attention; `LeoPulseBorder` already respects
 * prefers-reduced-motion. Position tracks the FAB offset and stays clamped
 * inside the host (flips below the FAB when there is no room above).
 *
 * Mount with `key={slug}` so `usePersistedState` re-inits when the product
 * changes — the hook does not re-read storage when only its key prop changes.
 */

import * as React from "react"
import { createPortal } from "react-dom"

import { useAskLeo } from "@/components/ask-leo-context"
import { LeoPulseBorder } from "@/components/leo-pulse-border"
import { Button } from "@/components/ui/button"
import {
  LEO_FAB_DEFAULT_OFFSET,
  LEO_FAB_INVITE_MAX_WIDTH,
  LEO_FAB_OFFSET_STORAGE_KEY,
  clampLeoFabInvitePlacement,
  type LeoFabOffset,
} from "@/lib/leo-launcher-fab-geometry"
import { cn } from "@/lib/utils"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"

export function marketingLeoSuggestions(label: string): string[] {
  return [
    `How does ${label} fit our program?`,
    "What would a demo cover?",
    "How is this different from what we use today?",
  ]
}

function inviteStorageKey(slug: string) {
  return `shell:marketing-leo-invite:v3:${slug}`
}

const SUGGESTION_CARD_CLASS =
  "group relative z-[1] pointer-events-auto flex w-full cursor-pointer items-start gap-2.5 rounded-xl border border-border/80 bg-background p-3 text-start text-[0.8125rem] leading-snug shadow-md transition-[border-color,box-shadow,background-color] hover:border-brand/35 hover:bg-interactive-hover/80 hover:shadow-lg"

export function MarketingLeoInvite({
  productLabel,
  slug,
}: {
  productLabel: string
  slug: string
}) {
  const { open: leoOpen, openWithPrompt } = useAskLeo()
  const [dismissed, setDismissed] = usePersistedState(
    inviteStorageKey(slug),
    false,
    { debounceMs: 0 },
  )
  const [fabOffset] = usePersistedState<LeoFabOffset>(
    LEO_FAB_OFFSET_STORAGE_KEY,
    LEO_FAB_DEFAULT_OFFSET,
    { debounceMs: 0 },
  )
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  const [hostSize, setHostSize] = React.useState({ width: 0, height: 0 })
  const [inviteSize, setInviteSize] = React.useState({
    width: LEO_FAB_INVITE_MAX_WIDTH,
    height: 72,
  })
  const [visible, setVisible] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const prompt = React.useMemo(
    () => marketingLeoSuggestions(productLabel)[0] ?? "",
    [productLabel],
  )

  React.useEffect(() => {
    setHost(document.querySelector<HTMLElement>("[data-app-shell-main]"))
  }, [])

  React.useEffect(() => {
    if (!host) return
    const measure = () => {
      const rect = host.getBoundingClientRect()
      setHostSize({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [host])

  React.useLayoutEffect(() => {
    const el = cardRef.current
    if (!el || !visible) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setInviteSize({ width: rect.width, height: rect.height })
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, prompt])

  React.useEffect(() => {
    if (dismissed || leoOpen || !host || !prompt) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(true), 400)
    return () => window.clearTimeout(timer)
  }, [dismissed, leoOpen, host, prompt, slug])

  const pick = React.useCallback(() => {
    if (!prompt) return
    openWithPrompt(prompt)
    setDismissed(true)
    setVisible(false)
  }, [openWithPrompt, prompt, setDismissed])

  const placement = React.useMemo(() => {
    if (hostSize.width <= 0) {
      return {
        end: LEO_FAB_DEFAULT_OFFSET.end,
        bottom: LEO_FAB_DEFAULT_OFFSET.bottom + 68,
        placeAbove: true,
        width: Math.min(LEO_FAB_INVITE_MAX_WIDTH, 280),
      }
    }
    return clampLeoFabInvitePlacement(fabOffset, hostSize, inviteSize)
  }, [fabOffset, hostSize, inviteSize])

  if (!host || dismissed || !visible || !prompt) return null

  return createPortal(
    <div
      ref={cardRef}
      data-slot="marketing-leo-invite"
      className={cn(
        "pointer-events-none absolute z-40",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500",
        placement.placeAbove
          ? "motion-safe:slide-in-from-bottom-3 motion-safe:zoom-in-95"
          : "motion-safe:slide-in-from-top-3 motion-safe:zoom-in-95",
        "motion-safe:transition-[inset-inline-end,bottom] motion-safe:duration-150 motion-safe:ease-out",
      )}
      style={{
        insetInlineEnd: placement.end,
        bottom: placement.bottom,
        width: placement.width,
        maxWidth: "calc(100% - 1rem)",
      }}
    >
      <div className="relative rounded-xl">
        <LeoPulseBorder
          animate
          strength={0.55}
          animationSpeed="normal"
          className="z-0"
        />
        <Button
          type="button"
          variant="ghost"
          onClick={pick}
          className={cn(SUGGESTION_CARD_CLASS, "relative z-10 h-auto font-normal")}
          aria-label={prompt}
        >
          <span className="flex-1">{prompt}</span>
          <i
            className="fa-light fa-arrow-right mt-[0.2rem] shrink-0 text-[0.7rem] text-muted-foreground transition-colors group-hover:text-brand"
            aria-hidden="true"
          />
        </Button>
      </div>
    </div>,
    host,
  )
}
