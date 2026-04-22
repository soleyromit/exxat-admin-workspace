"use client"

/**
 * Banner — two types of banner for system-level and local-level messaging.
 *
 * 1. SystemBanner: full-width strip at the very top of the app (above sidebar).
 *    Used for maintenance notices, feature promotions, global alerts.
 *
 * 2. LocalBanner: inline alert within a page section.
 *    Used for page-specific errors, warnings, and informational messages.
 *
 * Both support: info, warning, error, success, and promo variants.
 * Both are dismissible and accessible (role="alert" / role="status").
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Tip }    from "./tip"

// ─────────────────────────────────────────────────────────────────────────────
// Variant definitions
// ─────────────────────────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  info: {
    icon: "fa-circle-info",
    prefix: "fa-light",
    role: "status" as const,
    live: "polite" as const,
  },
  warning: {
    icon: "fa-triangle-exclamation",
    prefix: "fa-light",
    role: "alert" as const,
    live: "assertive" as const,
  },
  error: {
    icon: "fa-circle-exclamation",
    prefix: "fa-light",
    role: "alert" as const,
    live: "assertive" as const,
  },
  success: {
    icon: "fa-circle-check",
    prefix: "fa-light",
    role: "status" as const,
    live: "polite" as const,
  },
  promo: {
    icon: "fa-star-christmas text-brand",
    prefix: "fa-duotone fa-solid",
    role: "status" as const,
    live: "polite" as const,
  },
}

type BannerVariant = keyof typeof VARIANT_CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// SystemBanner — inline at the top of the main content area
// ─────────────────────────────────────────────────────────────────────────────

const systemBannerVariants = cva(
  "relative flex rounded-lg border text-sm transition-all",
  {
    variants: {
      variant: {
        /* Darker shells + light foreground copy for ≥4.5:1 on the fill (promo unchanged below). */
        info:    "bg-blue-900 text-blue-50 border-blue-950/35 dark:bg-blue-950 dark:text-blue-50 dark:border-blue-900/60",
        warning: "bg-amber-900 text-amber-50 border-amber-950/35 dark:bg-amber-950 dark:text-amber-50 dark:border-amber-900/60",
        error:   "bg-red-900 text-red-50 border-red-950/35 dark:bg-red-950 dark:text-red-50 dark:border-red-900/60",
        success: "bg-emerald-900 text-emerald-50 border-emerald-950/35 dark:bg-emerald-950 dark:text-emerald-50 dark:border-emerald-900/60",
        promo:   "bg-gradient-to-r from-brand/14 via-brand/8 to-brand/5 text-foreground border-brand/22 dark:from-brand/20 dark:via-brand/12 dark:to-brand/7 dark:border-brand/26",
      },
      /** Action placement: "inline" puts the action to the right; "bottom" puts it below the text */
      actionPosition: {
        inline: "items-center gap-3 px-4 py-2.5",
        bottom: "flex-col gap-2 px-4 py-3",
      },
    },
    defaultVariants: { variant: "info", actionPosition: "inline" },
  }
)

export interface SystemBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof systemBannerVariants> {
  /** Banner title (optional — adds a bold heading) */
  title?: string
  /** The banner message */
  children: React.ReactNode
  /** Whether the banner can be dismissed */
  dismissible?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Optional action — renders as a link-style button. Use href for server components, onClick for client. */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Where to place the action: "inline" (right side) or "bottom" (below text) */
  actionPosition?: "inline" | "bottom"
  /** Override the default icon */
  icon?: string
}

export function SystemBanner({
  children,
  title,
  variant = "info",
  dismissible = true,
  onDismiss,
  action,
  actionPosition = "inline",
  icon,
  className,
  ...props
}: SystemBannerProps) {
  const [dismissed, setDismissed] = React.useState(false)
  const config = VARIANT_CONFIG[variant ?? "info"]

  function handleDismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  const actionEl = action && (
    action.href ? (
      <a
        href={action.href}
        className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:no-underline shrink-0"
      >
        {action.label}
        <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
      </a>
    ) : (
      <Button
        size="xs"
        variant="link"
        onClick={action.onClick}
        className="shrink-0 px-0 h-auto text-xs font-semibold underline underline-offset-2 hover:no-underline"
      >
        {action.label}
        <i className="fa-light fa-arrow-right text-xs ml-0.5" aria-hidden="true" />
      </Button>
    )
  )

  return (
    <div
      role={config.role}
      aria-live={config.live}
      className={cn(systemBannerVariants({ variant, actionPosition }), className)}
      {...props}
    >
      {/* Icon */}
      <i
        className={cn(config.prefix, icon ?? config.icon, "text-[14px] shrink-0", actionPosition === "bottom" ? "mt-0.5" : "")}
        aria-hidden="true"
      />

      {/* Content + inline action */}
      {actionPosition === "inline" ? (
        <>
          <div className="flex-1 min-w-0">
            {title && <span className="font-semibold mr-1.5">{title}</span>}
            <span className="opacity-90">{children}</span>
          </div>
          {actionEl}
        </>
      ) : (
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold leading-tight mb-0.5">{title}</p>}
          <p className="opacity-90 leading-relaxed">{children}</p>
          {actionEl && <div className="mt-1.5">{actionEl}</div>}
        </div>
      )}

      {/* Dismiss */}
      {dismissible && (
        <Tip label="Dismiss" side="bottom">
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={handleDismiss}
            className={cn(
              "inline-flex items-center justify-center size-5 rounded transition-colors shrink-0",
              actionPosition === "bottom" ? "absolute top-2.5 right-2.5" : "",
              "hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
          </button>
        </Tip>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LocalBanner — inline, within page sections
// ─────────────────────────────────────────────────────────────────────────────

const localBannerVariants = cva(
  "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
  {
    variants: {
      variant: {
        info:    "border-blue-500/30 bg-blue-500/5 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20",
        warning: "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/20",
        error:   "border-red-500/30 bg-red-500/5 text-red-800 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/20",
        success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/20",
        promo:   "border-brand/30 bg-brand/5 text-foreground dark:bg-brand/10 dark:border-brand/20",
      },
    },
    defaultVariants: { variant: "info" },
  }
)

export interface LocalBannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof localBannerVariants> {
  /** Banner title (optional) */
  title?: string
  /** Banner message */
  children: React.ReactNode
  /** Whether the banner can be dismissed */
  dismissible?: boolean
  /** Callback when dismissed */
  onDismiss?: () => void
  /** Optional action — renders as link (href) or button (onClick) */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Optional retry action for error states */
  retry?: {
    label?: string
    onClick: () => void
  }
  /** Override the default icon */
  icon?: string
}

export function LocalBanner({
  children,
  title,
  variant = "info",
  dismissible = false,
  onDismiss,
  action,
  retry,
  icon,
  className,
  ...props
}: LocalBannerProps) {
  const [dismissed, setDismissed] = React.useState(false)
  const config = VARIANT_CONFIG[variant ?? "info"]

  function handleDismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <div
      role={config.role}
      aria-live={config.live}
      className={cn(localBannerVariants({ variant }), className)}
      {...props}
    >
      {/* Icon */}
      <i
        className={cn(config.prefix, icon ?? config.icon, "text-[15px] shrink-0 mt-0.5")}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold leading-tight mb-0.5">{title}</p>
        )}
        <div className="text-sm leading-relaxed opacity-90">{children}</div>

        {/* Actions */}
        {(action || retry) && (
          <div className="flex items-center gap-2 mt-2.5">
            {retry && (
              <Button size="xs" variant="outline" onClick={retry.onClick}>
                <i className="fa-light fa-arrow-rotate-right text-xs" aria-hidden="true" />
                {retry.label ?? "Retry"}
              </Button>
            )}
            {action && (
              action.href ? (
                <a href={action.href} className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:no-underline">
                  {action.label} <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </a>
              ) : (
                <Button size="xs" variant="outline" onClick={action.onClick}>
                  {action.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>

      {/* Dismiss */}
      {dismissible && (
        <Tip label="Dismiss" side="left">
          <button
            type="button"
            aria-label="Dismiss"
            onClick={handleDismiss}
            className={cn(
              "inline-flex items-center justify-center size-5 rounded transition-colors shrink-0",
              "hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
          </button>
        </Tip>
      )}
    </div>
  )
}
