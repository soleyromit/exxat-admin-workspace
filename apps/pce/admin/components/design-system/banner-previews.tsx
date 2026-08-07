"use client"

import { LocalBanner, SystemBanner } from "@/components/ui/banner"
import { MarketingBanner } from "@/components/ui/marketing-banner"

const VARIANTS = ["info", "warning", "error", "success", "promo"] as const

export function LocalBannerVariantsPreview() {
  return (
    <div className="flex flex-col gap-3">
      {VARIANTS.map((variant) => (
        <LocalBanner key={variant} variant={variant} title={`${variant.charAt(0).toUpperCase()}${variant.slice(1)}`}>
          Inline page message for {variant} states. Use LocalBanner inside a section, not for global shell alerts.
        </LocalBanner>
      ))}
    </div>
  )
}

export function LocalBannerActionsPreview() {
  return (
    <div className="flex flex-col gap-3">
      <LocalBanner variant="error" title="Export failed" dismissible retry={{ onClick: () => {} }}>
        We could not generate the CSV. Check your connection and try again.
      </LocalBanner>
      <LocalBanner
        variant="info"
        title="New placement workflow"
        action={{ label: "Learn more", onClick: () => {} }}
      >
        Coordinators can now bulk-assign sites from the placements hub.
      </LocalBanner>
    </div>
  )
}

export function SystemBannerProminentPreview() {
  return (
    <div className="flex flex-col gap-3">
      {VARIANTS.map((variant) => (
        <SystemBanner
          key={variant}
          variant={variant}
          emphasis="prominent"
          dismissible={false}
          title={variant === "promo" ? "Exxat One is live" : `${variant.charAt(0).toUpperCase()}${variant.slice(1)} notice`}
        >
          {variant === "promo"
            ? "Schedule a walkthrough with your program coordinator."
            : "Top-of-app strip above sidebar chrome. Pair with SystemBannerSlot."}
        </SystemBanner>
      ))}
    </div>
  )
}

export function SystemBannerSubtlePreview() {
  return (
    <div className="flex flex-col gap-3">
      <SystemBanner variant="info" emphasis="subtle" dismissible={false} title="Maintenance window">
        Read-only mode Sunday 2–4 AM ET.
      </SystemBanner>
      <SystemBanner variant="warning" emphasis="subtle" dismissible={false} title="Action required">
        12 students are missing compliance documents.
      </SystemBanner>
    </div>
  )
}

export function SystemBannerActionLayoutPreview() {
  return (
    <div className="flex flex-col gap-3">
      <SystemBanner
        variant="promo"
        emphasis="prominent"
        dismissible={false}
        action={{ label: "Book a demo", onClick: () => {} }}
        actionPosition="inline"
        title="Placement season prep"
      >
        New coordinator checklist is ready in the library hub.
      </SystemBanner>
      <SystemBanner
        variant="info"
        emphasis="prominent"
        dismissible={false}
        action={{ label: "View release notes", onClick: () => {} }}
        actionPosition="bottom"
        title="Product update"
      >
        Dashboard charts now support Leo plot insights on hover.
      </SystemBanner>
    </div>
  )
}

export function SystemBannerDismissPreview() {
  return (
    <SystemBanner variant="success" dismissible title="You're all caught up">
      No pending approvals in this program.
    </SystemBanner>
  )
}

/** Notion-style line-art placeholder — right column visual. */
function HeroLineArtVisual() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full max-h-[10.5rem] text-foreground/85" aria-hidden>
      <path
        d="M20 110 Q100 95 180 110"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="28" y="72" width="36" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M36 88h20M46 80v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="130" cy="58" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M122 58h16M130 50v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M64 86 Q100 70 116 62"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
    </svg>
  )
}

/** Alan-style photo cutout placeholder — overlaps card edges at lg+. */
function HeroPhotoVisual() {
  return (
    <div className="relative mx-auto flex h-[10rem] w-full max-w-sm items-end justify-center lg:mx-0 lg:h-[11rem] lg:max-w-none" aria-hidden>
      <div className="absolute bottom-2 size-24 rounded-full bg-brand/20 blur-2xl lg:bottom-0" />
      <div className="relative flex size-28 items-end justify-center rounded-t-full bg-gradient-to-t from-brand/25 to-brand/5 lg:size-32">
        <i className="fa-duotone fa-solid fa-user-doctor mb-2 text-5xl text-brand lg:text-6xl" aria-hidden="true" />
      </div>
      <div className="absolute end-0 bottom-6 max-w-[10.5rem] rounded-xl border border-border bg-card px-3 py-2 text-left text-xs leading-snug shadow-md lg:end-2 lg:bottom-8">
        <span className="text-muted-foreground">Student asked</span>
        <p className="mt-0.5 font-medium text-foreground">Which immunizations are due this week?</p>
      </div>
    </div>
  )
}

import { FloatingMarketingBannerMedia } from "@/components/floating-marketing-banner-media"
/** In doc previews — static flow; motion disabled via data-motion. */
const FLOATING_DOC_PREVIEW_PROPS = {
  className: "!static !bottom-auto !right-auto !left-auto",
  "data-motion": "off" as const,
}

export function MarketingBannerHeroPreview() {
  return (
    <div className="flex flex-col gap-4">
      <MarketingBanner
        layout="hero"
        tone="surface"
        eyebrow="Consulting"
        eyebrowIcon="fa-comments"
        title="Claim your free session"
        media={<HeroLineArtVisual />}
        primaryAction={{ label: "Reserve now", onClick: () => {} }}
        dismissible={false}
      >
        Limited 30-minute sessions with certified placement consultants. Get help before they fill up.
      </MarketingBanner>
      <MarketingBanner
        layout="hero"
        tone="tint"
        eyebrow="Program wellness"
        title="Support for coordinators"
        media={<HeroPhotoVisual />}
        primaryAction={{ label: "Talk to an advisor", onClick: () => {} }}
        dismissible={false}
      >
        Clinical advisors available 7 days a week for compliance and placement questions.
      </MarketingBanner>
    </div>
  )
}

export function MarketingBannerFloatingPreview() {
  return (
    <div className="flex flex-col gap-3 overflow-visible rounded-lg border border-dashed border-border bg-muted/15 p-4 pb-6">
      <p className="text-xs text-muted-foreground">
        Brand-gradient card — at runtime fixed at the viewport corner; same chrome as floating sheet.
      </p>
      <div className="flex justify-end">
        <MarketingBanner
          layout="floating"
          floatingVariant="card"
          corner="bottom-right"
          {...FLOATING_DOC_PREVIEW_PROPS}
          title="Try Leo plot insights"
          illustration={
            <i className="fa-duotone fa-solid fa-sparkles text-2xl text-brand-foreground" aria-hidden="true" />
          }
          primaryAction={{ label: "Open dashboard", onClick: () => {} }}
        >
          Ask Leo to explain chart trends — opt-in only.
        </MarketingBanner>
      </div>
    </div>
  )
}

export function MarketingBannerFloatingMediaPreview() {
  return (
    <div className="flex flex-col gap-3 overflow-visible rounded-lg border border-dashed border-border bg-muted/15 p-4 pb-6">
      <p className="text-xs text-muted-foreground">
        Full-bleed media header on brand gradient — image or video edge-to-edge above copy.
      </p>
      <div className="flex justify-end">
        <MarketingBanner
          layout="floating"
          floatingVariant="media"
          corner="bottom-right"
          {...FLOATING_DOC_PREVIEW_PROPS}
          title="See Leo on your dashboard"
          media={<FloatingMarketingBannerMedia />}
          primaryAction={{ label: "Try it", onClick: () => {} }}
          primaryActionFullWidth
        >
          Plot insights on hover — you stay in control.
        </MarketingBanner>
      </div>
    </div>
  )
}
