"use client"

/**
 * AuthShell — the two-column frame every pre-auth surface wears.
 *
 * Left: a promo rail. Right: the form, and a support footer that stays reachable
 * whether or not sign-in succeeds.
 *
 * The rail is the first thing to go below `lg`. It carries no task, so on a
 * phone it would push the one control that matters below the fold; the brand
 * lockup moves inline above the form instead so the page still identifies itself.
 *
 * Heading contract: the rail's promo is an `h2` and the page supplies the single
 * `h1`, because the reason you are here is signing in, not the conference.
 */

import * as React from "react"

import { MarketingBanner } from "@/components/ui/marketing-banner"
import { ProductMark, ProductWordmark } from "@/components/product-wordmark"
import { EXXAT_CORPORATE_BRAND } from "@/lib/product-brand"
import { cn } from "@/lib/utils"

/**
 * One promo, held in code rather than rotated.
 *
 * A carousel here would move the page under someone mid-password and give a
 * screen reader three competing pitches beside a single form. When this needs to
 * change per season, change the object.
 */
const AUTH_PROMO = {
  title: "Exxat User Conference 2026",
  description: "Baltimore, MD. September 23 to 25, 2026.",
  action: { label: "Register Today", href: "https://www.exxat.com/" },
  /**
   * Which slide artwork the promo wears. Production ships one of these per
   * carousel slide; both live in `public/auth`, so swapping the promo to the
   * Prism story is this line plus the copy above, not a layout change:
   * `/auth/exxat-prism-visual.svg`.
   *
   * Purely decorative, so the alt text is empty and the overlay is `aria-hidden`
   * — the promo already says what it is in the heading beside it.
   */
  visual: "/auth/cohere-slide-visual.svg",
} as const

/** Corporate lockup: mark plus the word "Exxat", no product suffix. */
export function AuthBrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-base", className)}>
      <ProductMark config={EXXAT_CORPORATE_BRAND} className="size-6" />
      <ProductWordmark config={EXXAT_CORPORATE_BRAND} />
      <span className="sr-only">Exxat</span>
    </span>
  )
}

/**
 * The slide: a pastel canvas with the artwork laid over it, filling the panel
 * from the top-left, which is how the production rail composes it. The vector is
 * drawn to sit *on* that wash rather than to replace it — its own pink wedge
 * supplies the saturated colour, and the canvas is what shows through wherever
 * `contain` leaves the panel uncovered.
 *
 * Both layers live in one `decorativeOverlay` so they stay a single ordered
 * stack under the copy. Painting the canvas on the banner root instead would put
 * it behind the border and corner radius, and leave the wash and the art it
 * belongs to in two different files.
 */
function AuthPromoVisual({ src }: { src: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-[image:var(--auth-promo-canvas)]" />
      {/* Bottom-anchored, where the reference says top. Identical on any panel
          wider than the art's 0.87 ratio, because `contain` then fits by height
          and there is no vertical gap to place. On a taller panel it fits by
          width instead and letterboxes, and top-anchoring drops that gap under
          the copy — bare pastel behind white text, which measured 1.11:1. Putting
          the gap above the art instead costs nothing: no copy sits up there. */}
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-contain object-left-bottom" />
      {/* The copy is white because the slide is, and the art's wedge is a
          mid-pink that gives white only 3.9:1 at its deepest — over the 3:1 a
          large title needs, under the 4.5:1 the meta line needs. Deepening the
          wedge under the copy with its own hue family buys that back without
          reading as a grey veil dropped on the artwork. Nothing here is
          decorative: at 15% it is the difference between a passing and a failing
          line, and axe cannot see it, because it does not evaluate what an image
          paints behind text. */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-brand-deep/55 via-brand-deep/24 to-transparent" />
    </>
  )
}

function AuthPromoRail() {
  return (
    <aside
      aria-label="From Exxat"
      // Second in the DOM, first on screen. Reading and tab order should reach
      // the form before the promo — landing Tab on "Register Today" ahead of the
      // username field is the wrong first offer for someone here to sign in —
      // but the promo still belongs on the left where the eye starts.
      //
      // No padding on the aside and no end border: the promo runs to the window
      // edges and its own edge is the seam. A gutter around it turned the panel
      // into a floating card, which read as a component dropped on the page
      // rather than as the page's left half.
      // Percentage width with no max: the split itself is the layout, so capping
      // the rail in absolute pixels quietly turned it back into a sidebar on any
      // display past ~1220px, where the promo shrinks while the form column keeps
      // all the new space.
      className="order-first hidden w-[55%] shrink-0 flex-col bg-background lg:flex"
    >
      {/* `flex-1 content-end` rather than the default hug: the rail is over half
          the viewport, so a content-height promo leaves a tall empty band above
          it that reads as a layout bug instead of a decision. Stretching it to
          own the panel and anchoring the copy to the bottom keeps the eye
          starting where the words are. */}
      <MarketingBanner
        layout="hero"
        tone="gradient"
        titleAs="h2"
        title={AUTH_PROMO.title}
        primaryAction={AUTH_PROMO.action}
        dismissible={false}
        decorativeOverlay={<AuthPromoVisual src={AUTH_PROMO.visual} />}
        // The copy is held to a narrow measure, as the reference holds it to
        // `max-w-[55%]`. That is not a typographic preference: the artwork's
        // saturated wedge only reaches so far across the panel, and a full-width
        // title ran its last word out onto the pale canvas, where white text
        // measured 1.22:1. Wrapping it early keeps every line on the wedge.
        className="flex-1 content-end rounded-none border-0 [&_h2]:max-w-[60%] [&_p]:max-w-[60%]"
      >
        {AUTH_PROMO.description}
      </MarketingBanner>
    </aside>
  )
}

function AuthSupportFooter() {
  return (
    // `text-xs`, not `text-sm`. The form column is under half the width now, and
    // at 14px the help line wrapped to a second row, which turned a two-line
    // footer into three and pushed the seam up into the form.
    <footer className="flex flex-col gap-3 border-t border-border px-6 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <div className="min-w-0">
        <p className="font-medium text-foreground">Trouble signing in?</p>
        <p className="text-muted-foreground">Find answers in our Help Center &amp; FAQs.</p>
      </div>
      <a
        href="https://www.exxat.com/"
        className="inline-flex shrink-0 items-center gap-2 font-medium text-foreground underline underline-offset-4 hover:text-auth-ink focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <i className="fa-light fa-headset" aria-hidden="true" />
        Contact Support
      </a>
    </footer>
  )
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    // `data-auth-surface` remaps `--primary` to the corporate indigo for this
    // subtree (see globals.css), so every step's primary button is Exxat's
    // rather than the workspace charcoal, without a Button variant or a class
    // on each step.
    <div data-auth-surface className="flex h-full min-h-0 w-full bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="px-6 pt-8 sm:px-10 lg:hidden">
            <AuthBrandLockup />
          </div>
          <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-sm">
              {/* Desktop only. Below `lg` the rail is gone and the full lockup
                  already sits above the form, so a second mark would say the
                  same thing twice. Decorative either way: the rail names Exxat
                  in text and the heading names the task. */}
              <span
                aria-hidden="true"
                className="mb-6 hidden lg:inline-flex"
              >
                <ProductMark config={EXXAT_CORPORATE_BRAND} className="size-8" />
              </span>
              {children}
            </div>
          </main>
        </div>
        <AuthSupportFooter />
      </div>
      <AuthPromoRail />
    </div>
  )
}
