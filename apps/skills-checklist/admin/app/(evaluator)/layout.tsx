import * as React from "react"
import type { Metadata } from "next"

/**
 * S-16 layout: NO shell. No sidebar, no top navigation, no account menu, no links out (EV-01, cross-cutting §2).
 * Wordmark and the request context only. The link token is sensitive (cross-cutting §10 L-8): no referrer is sent and
 * the page is never indexed.
 */
export const metadata: Metadata = {
  title: "Evaluation",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
}

export default function EvaluatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <main id="main" className="flex flex-1 flex-col gap-4">
        {/* The wordmark lives inside <main> so it is never outside a landmark (axe "region") and adds no banner or nav (EV-01). */}
        <p className="text-sm font-semibold text-muted-foreground">Prism</p>
        {children}
      </main>
    </div>
  )
}
