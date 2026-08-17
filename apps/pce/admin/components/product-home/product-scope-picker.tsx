"use client"

/**
 * Scope trigger for a product card / marketing hero on the products home.
 *
 * Same menu as the utility bar and sidebar (`ScopeSwitcherMenuBody`) under a
 * wider trigger that names the scope instead of relying on a tooltip — there
 * is no surrounding product chrome here to give the avatar its meaning, so the
 * school and program have to be legible on the face of the control.
 *
 * Three triggers, same menu:
 *
 * - **`card`** — the bordered two-line control on a product card, where scope
 *   is a standing property of the row and has the width to say so.
 * - **`inline`** — one quiet line under a hero's CTA. A card-shaped picker beside
 *   the primary button competed with it: two filled controls, 60px against 44px,
 *   neither obviously the thing to press.
 * - **`compact`** — `inline`'s text with the avatar dropped, for a caption
 *   centered under an icon-grid cell (Launcher). The avatar duplicates the
 *   mark already sitting above it in that context and, at cell width, the
 *   two together left almost no room for the school name before it had to
 *   truncate — the readable-but-unlabelled avatar felt like a stray control
 *   rather than part of one caption.
 *
 * The menu opens **over** the trigger (select-style), matching its width and
 * `rounded-xl` radius so the two do not stack as separate rounded boxes.
 *
 * Writes through shared scope state, so the choice made here is the one the
 * product reports after Open.
 *
 * When the session's scope is fixed (`scope.fixed`) the same face renders without
 * the menu, in the shape the unscoped "Whole workspace" line already uses: a
 * statement rather than a control. A student belongs to one program at one school,
 * so a picker there offers a choice that does not exist.
 */

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  ScopeSwitcherMenuBody,
  type ScopeSwitcherBag,
} from "@/components/scope-switcher-menu"
import { cn } from "@/lib/utils"

type ScopePickerVariant = "card" | "inline" | "compact"

/**
 * The avatar and the two names, which are the same on the button and on the
 * statement that replaces it when the scope is fixed. Shared so a student and a
 * coordinator read the same line and only one of them can press it.
 */
function ScopeFace({
  scope,
  variant,
}: {
  scope: ScopeSwitcherBag
  variant: ScopePickerVariant
}) {
  const inline = variant === "inline"
  const compact = variant === "compact"
  // `inline` and `compact` both read as one line of "Child · Parent" text;
  // only the card variant needs the two-line stack the avatar sits beside.
  const oneLine = inline || compact
  const { parent, child } = scope

  // Nothing chosen in this product yet, so there is no school logo to show and
  // no second line to write. One prompt in the same slot the two names use, at
  // the same size, so the control does not change shape once it has an answer.
  if (parent === null || child === null) {
    return (
      <>
        {!compact ? (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
              inline ? "size-6 text-[0.625rem]" : "size-8 text-xs",
            )}
            aria-hidden="true"
          >
            <i className={`fa-light fa-${scope.config.childIcon}`} />
          </span>
        ) : null}
        <span className={cn("min-w-0 flex-1 truncate", oneLine ? "" : "text-sm font-medium")}>
          {scope.config.choosePrompt}
        </span>
      </>
    )
  }

  return (
    <>
      {!compact ? (
        <Avatar className={cn("shrink-0", inline ? "size-6" : "size-8")}>
          <AvatarImage
            src={parent.logo}
            alt=""
            referrerPolicy="origin"
            className="object-contain p-0.5"
            aria-hidden="true"
          />
          <AvatarFallback
            className={cn("font-semibold", inline ? "text-[0.625rem]" : "text-xs")}
            aria-hidden="true"
          >
            {parent.initials}
          </AvatarFallback>
        </Avatar>
      ) : null}
      {oneLine ? (
        // One line, school demoted to context. Two stacked lines here would
        // rebuild the card trigger at a smaller size and reintroduce the
        // height mismatch the inline variant exists to remove.
        <span className="min-w-0 truncate">
          <span className="font-medium text-foreground">{child.name}</span>
          <span aria-hidden="true"> · </span>
          {parent.name}
        </span>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className="truncate text-sm font-medium">{child.name}</span>
          <span className="truncate text-xs text-muted-foreground">{parent.name}</span>
        </span>
      )}
    </>
  )
}

export function ProductScopePicker({
  scope,
  variant = "card",
  className,
  contentClassName,
}: {
  scope: ScopeSwitcherBag
  variant?: ScopePickerVariant
  className?: string
  /**
   * Extra classes on the menu surface — e.g. a higher `z-*` when this picker
   * opens inside a dialog that already sits above the default dropdown (`z-50`).
   */
  contentClassName?: string
}) {
  const inline = variant === "inline"
  const compact = variant === "compact"
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  // Negative bottom offset so the panel top aligns with the trigger top.
  const [coverOffset, setCoverOffset] = React.useState(0)

  React.useLayoutEffect(() => {
    const el = triggerRef.current
    if (!el) return
    const update = () => setCoverOffset(-el.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [variant, scope.label, scope.parentLabel])

  // Nothing licensed here, so there is nothing to press and nothing to name. A
  // statement rather than an empty slot, because the card still has to account
  // for the line its siblings fill, and rather than a menu, because a trigger
  // that opens an empty list is worse than no trigger.
  if (scope.status === "none") {
    return (
      <p
        className={cn(
          "flex min-w-0 items-center text-muted-foreground",
          variant === "card" ? "gap-2.5 px-1 py-2 text-sm" : "gap-2 px-1.5 py-1 text-xs",
          className,
        )}
      >
        <i className="fa-light fa-ban shrink-0 text-xs" aria-hidden="true" />
        {`No ${scope.config.childNoun.toLowerCase()}s for your account`}
      </p>
    )
  }

  if (scope.fixed) {
    // Padding matches the "Whole workspace" line in `ProductScopeLine`, so the
    // two statements a card can carry sit on the same grid.
    return (
      <p
        className={cn(
          "flex min-w-0 items-center text-muted-foreground",
          variant === "card" ? "gap-2.5 px-1 py-2 text-sm" : "gap-2 px-1.5 py-1 text-xs",
          className,
        )}
      >
        <ScopeFace scope={scope} variant={variant} />
      </p>
    )
  }

  return (
    <DropdownMenu onOpenChange={scope.onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          aria-label={scope.ariaLabel}
          className={cn(
            "h-auto items-center text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            inline &&
              // Pill, no fill, no border. It is a qualifier on the button
              // above it, not a second thing to press.
              "max-w-full gap-2 rounded-full py-1.5 pe-2.5 ps-1.5 text-sm text-muted-foreground hover:bg-foreground/6 hover:text-foreground data-[state=open]:bg-foreground/6",
            compact &&
              // No avatar, no fill until pressed — the icon above the cell
              // already anchors the eye, so this is just a smaller, quieter
              // instance of the inline pill's text + chevron.
              "max-w-full gap-1 rounded-full px-1.5 py-1 text-xs text-muted-foreground hover:bg-foreground/6 hover:text-foreground data-[state=open]:bg-foreground/6",
            !inline &&
              !compact &&
              "w-full gap-2.5 rounded-xl border border-border bg-background p-2.5 hover:bg-interactive-hover data-[state=open]:bg-interactive-hover",
            className,
          )}
        >
          <ScopeFace scope={scope} variant={variant} />
          <i
            className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        // Cover the trigger like a select. Width + radius match the field so
        // the open state is one surface, not a second rounded box below it.
        className={cn(
          "rounded-xl",
          "w-(--radix-dropdown-menu-trigger-width) min-w-60 max-w-[min(100vw-2rem,var(--radix-dropdown-menu-trigger-width))]",
          "data-[side=bottom]:slide-in-from-top-0",
          contentClassName,
        )}
        align="start"
        side="bottom"
        sideOffset={coverOffset}
      >
        <ScopeSwitcherMenuBody scope={scope} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
