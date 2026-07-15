"use client"

/**
 * KeyMetricsAskLeoBridge — adapter that connects the design-system
 * `KeyMetrics` injection points (`KeyMetricsProvider`) to this app's
 * Ask Leo runtime (`useAskLeo` + `AskLeoShortcutKbds`).
 *
 * Lives in `apps/web` because the bridge is app-specific: it ties
 * the design-system primitive to a concrete assistant + keyboard
 * shortcut. Other consumers of `@exxatdesignux/ui` can ship a
 * different bridge (Copilot, ChatGPT, no-AI) without touching the
 * package itself.
 *
 * Mount this just inside `<AskLeoProvider>` in `(app)/layout.tsx` so
 * every `<KeyMetrics />` descendant transparently picks up the
 * "Ask Leo about these metrics" CTA and the `⌘⌥K` tooltip chord.
 */

import * as React from "react"

import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-context"
import { KeyMetricsProvider } from "@exxatdesignux/ui/components/key-metrics"

export function KeyMetricsAskLeoBridge({
  children,
}: {
  children: React.ReactNode
}) {
  const { setOpen } = useAskLeo()
  const openAskLeo = React.useCallback(() => setOpen(true), [setOpen])
  const shortcutHint = React.useMemo(() => <AskLeoShortcutKbds />, [])
  const value = React.useMemo(
    () => ({
      defaultInsightAction: openAskLeo,
      shortcutHint,
      defaultActionLabel: "Ask Leo",
    }),
    [openAskLeo, shortcutHint],
  )
  return <KeyMetricsProvider value={value}>{children}</KeyMetricsProvider>
}
