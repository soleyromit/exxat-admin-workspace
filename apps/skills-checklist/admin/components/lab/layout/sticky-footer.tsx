"use client"

// Shared layout primitive (lab templates T2 wizard and T3 form, docs/knowledge/design/skill-setup-journey/01 and 03 section 6).
// The one place a wizard step or a form puts its forward action: a 64 px bar stuck to the bottom of the page column.
// Left: Back (or a summary line). Middle right: a short context line (aria-live). Right: ONE filled primary.
// Below 640 px the buttons stack full width at 44 px, primary on top, and the bar pads for the safe area.

import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { cn } from "@exxatdesignux/ui/lib/utils"

export type StickyFooterAction = {
  label: string
  onClick?: () => void
  href?: string
}

export type StickyFooterPrimary = StickyFooterAction & {
  disabled?: boolean
  /** Shown in the context slot while `disabled` is true, and tied to the button with aria-describedby. Keep it to 10 words. */
  disabledReason?: string
  /** Disables the button and sets aria-busy; the label stays so the button does not change width. */
  loading?: boolean
  /** Button type when no href; defaults to "button". Use "submit" inside a form element. */
  type?: "button" | "submit"
}

export type StickyFooterProps = {
  /** Outline Back button. Label defaults to "Back". Omit on the first step. */
  back?: { label?: string; onClick: () => void }
  /** Short context line, 10 words or fewer: the step outcome in numbers or the blocking reason. Announced politely. */
  context?: React.ReactNode
  /** The single filled primary action. */
  primary?: StickyFooterPrimary
  /** Rare outline secondary, placed before the primary. */
  secondary?: StickyFooterAction
  /** Left slot for a summary sentence (configure's rule sentence). When set, Back moves next to the primary. */
  summary?: React.ReactNode
  className?: string
}

/** Touch target below sm, regular control height above. */
const BUTTON_CLASS = "max-sm:h-[var(--control-height-touch)] max-sm:w-full"

function ActionButton({
  action,
  variant,
  className,
  describedBy,
  disabled,
  busy,
  type = "button",
}: {
  action: StickyFooterAction
  variant: "default" | "outline"
  className?: string
  describedBy?: string
  disabled?: boolean
  busy?: boolean
  type?: "button" | "submit"
}) {
  if (action.href && !disabled) {
    return (
      <Button asChild variant={variant} size="default" className={cn(BUTTON_CLASS, className)}>
        <Link href={action.href} aria-describedby={describedBy}>
          {action.label}
        </Link>
      </Button>
    )
  }
  return (
    <Button
      type={type}
      variant={variant}
      size="default"
      className={cn(BUTTON_CLASS, className)}
      onClick={action.onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-describedby={describedBy}
    >
      {action.label}
    </Button>
  )
}

export function StickyFooter({ back, context, primary, secondary, summary, className }: StickyFooterProps) {
  const contextId = React.useId()
  const primaryDisabled = Boolean(primary?.disabled || primary?.loading)
  const reason = primary?.disabled && primary.disabledReason ? primary.disabledReason : null
  const contextContent = reason ?? context
  const hasContext = contextContent !== undefined && contextContent !== null && contextContent !== false

  const backButton = back ? (
    <Button type="button" variant="outline" size="default" className={BUTTON_CLASS} onClick={back.onClick}>
      {back.label ?? "Back"}
    </Button>
  ) : null

  return (
    <div
      data-region="footer"
      className={cn(
        "sticky bottom-0 z-10 flex min-h-16 flex-col gap-3 border-t border-border bg-background py-3",
        "pb-[max(var(--exxat-spacing-3),env(safe-area-inset-bottom))]",
        "sm:flex-row sm:items-center",
        className,
      )}
    >
      {summary ? (
        <div className="min-w-0 text-sm text-foreground sm:flex-1">{summary}</div>
      ) : (
        <div className="max-sm:order-3 sm:flex-1">{backButton}</div>
      )}

      {/* Always mounted so assistive tech hears changes to the line, not only its first value. */}
      <p
        id={contextId}
        aria-live="polite"
        className={cn("text-sm text-muted-foreground max-sm:order-2 sm:text-end", !hasContext && "sr-only")}
      >
        {hasContext ? contextContent : null}
      </p>

      {(summary && backButton) || secondary || primary ? (
        <div className="flex flex-col gap-2 max-sm:order-1 sm:flex-row sm:items-center sm:gap-3">
          {primary ? (
            <ActionButton
              action={primary}
              variant="default"
              type={primary.type}
              className="sm:order-3"
              describedBy={hasContext ? contextId : undefined}
              disabled={primaryDisabled}
              busy={primary.loading}
            />
          ) : null}
          {secondary ? <ActionButton action={secondary} variant="outline" className="sm:order-2" /> : null}
          {summary && backButton ? <div className="sm:order-1">{backButton}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
