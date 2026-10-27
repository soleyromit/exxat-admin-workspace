"use client"

// Shared layout primitive (lab templates T2 wizard and T3 form, docs/knowledge/design/skill-setup-journey/01 and 03 section 6).
// The one place a wizard step or a form puts its forward action: a bar stuck to the bottom of the page column.
// ONE contract on every step, form, Check and receipt (Romit 2026-10-27, "why is the Back button at a different position after
// every wizard step?"), left to right: Back (its slot is kept when a step has no Back, so nothing shifts), the summary line when
// there is one, the context or blocking reason, the outline secondary (Save draft), the ONE filled primary at the far right.
// The bar bleeds through the page gutter, is opaque with a top border and sits above the content, so nothing shows beside or
// under it ("the fixed footer isn't completely covering the layout").
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
  /** Rare outline secondary, placed before the primary. At most two (a page shows two outline buttons at most). */
  secondary?: StickyFooterAction | StickyFooterAction[]
  /** A summary sentence after Back (configure's rule sentence). Back never moves. */
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
  const secondaries = (Array.isArray(secondary) ? secondary : secondary ? [secondary] : []).slice(0, 2)
  const primaryDisabled = Boolean(primary?.disabled || primary?.loading)
  const reason = primary?.disabled && primary.disabledReason ? primary.disabledReason : null
  const contextContent = reason ?? context
  const hasContext = contextContent !== undefined && contextContent !== null && contextContent !== false

  const backButton = back ? (
    <Button type="button" variant="outline" size="default" className={BUTTON_CLASS} onClick={back.onClick} data-footer-back>
      {back.label ?? "Back"}
    </Button>
  ) : null

  return (
    <div
      data-region="footer"
      className={cn(
        "sticky bottom-0 z-20 -mx-4 -mb-5 flex min-h-16 flex-col gap-3 border-t border-border bg-background px-4 py-3 md:-mx-6 md:px-6",
        "pb-[max(var(--exxat-spacing-3),env(safe-area-inset-bottom))]",
        "sm:flex-row sm:items-center",
        className,
      )}
    >
      {/* Back's slot: always the first child and the left edge, kept (empty) on a step without Back. */}
      <div data-footer-back-slot className={cn("shrink-0 max-sm:order-4", back ? "" : "max-sm:hidden sm:w-[4.75rem]")}>
        {backButton}
      </div>

      {summary ? <div className="min-w-0 text-sm text-foreground max-sm:order-3 sm:flex-1">{summary}</div> : <div aria-hidden="true" className="hidden sm:block sm:flex-1" />}

      {/* Always mounted so assistive tech hears changes to the line, not only its first value. */}
      <p
        id={contextId}
        aria-live="polite"
        className={cn("text-sm text-muted-foreground max-sm:order-2 sm:text-end", !hasContext && "sr-only")}
      >
        {hasContext ? contextContent : null}
      </p>

      {secondaries.length > 0 || primary ? (
        <div className="flex flex-col gap-2 max-sm:order-1 sm:flex-row sm:items-center sm:gap-3" data-footer-actions>
          {secondaries.map((a) => (
            <ActionButton key={a.label} action={a} variant="outline" />
          ))}
          {primary ? (
            <ActionButton
              action={primary}
              variant="default"
              type={primary.type}
              className="max-sm:order-first"
              describedBy={hasContext ? contextId : undefined}
              disabled={primaryDisabled}
              busy={primary.loading}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
