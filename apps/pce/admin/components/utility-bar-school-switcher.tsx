"use client"

/**
 * UtilityBarSchoolSwitcher — school/program (or site/location) scope picker for
 * the full-width `utility-bar` shell layout.
 *
 * Sits in the trailing identity cluster next to `UtilityUserMenu`. The trigger
 * is **avatar-only** on the utility bar so product chrome and the compact
 * breadcrumb keep the row; program / location still live in the tooltip and
 * menu (`showProgram` stays available for non-bar hosts).
 *
 * Menu body and state are shared with the sidebar switcher and the products
 * home — see `components/scope-switcher-menu.tsx`. A session whose scope is
 * fixed gets the same lockup with the names on it and no menu.
 *
 * `compact` matches the product switcher height on the compact shell (`h-8`).
 * School avatar stays `size-8` to match the profile avatar beside it.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  SHELL_IDENTITY_MENU_SURFACE_CLASS,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"
import {
  ScopeSwitcherMenuBody,
  useScopeSwitcher,
} from "@/components/scope-switcher-menu"
import { useProduct, type Product } from "@/contexts/product-context"
import { cn } from "@/lib/utils"

export function UtilityBarSchoolSwitcher({
  compact = false,
  showProgram = true,
}: {
  /** Smaller avatar + control height (compact shell or narrow bar). */
  compact?: boolean
  /**
   * When false, avatar-only. Used on mobile / high-zoom so the product name and
   * action icons keep the row; program still lives in the tooltip and menu.
   */
  showProgram?: boolean
} = {}) {
  const { product } = useProduct()
  return (
    <UtilityBarSchoolSwitcherInner
      key={product}
      product={product}
      compact={compact}
      showProgram={showProgram}
    />
  )
}

function ScopeAvatar({
  parent,
  childIcon,
}: {
  parent: { logo: string; initials: string } | null
  childIcon: string
  /** @deprecated Avatar is always size-8 to match profile. */
  compact?: boolean
}) {
  const size = "size-8"
  if (parent) {
    return (
      <Avatar className={cn("shrink-0", size)}>
        <AvatarImage
          src={parent.logo}
          alt=""
          referrerPolicy="origin"
          className="object-cover"
          aria-hidden="true"
        />
        <AvatarFallback aria-hidden="true">{parent.initials}</AvatarFallback>
      </Avatar>
    )
  }

  // No school chosen here yet, so there is no logo to stand for one. The
  // hierarchy's own glyph says what the control is for.
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground",
        size,
      )}
      aria-hidden="true"
    >
      <i className={`fa-light fa-${childIcon} text-xs`} />
    </span>
  )
}

function ProgramLabel({
  name,
  compact,
}: {
  name: string | null
  compact: boolean
}) {
  if (!name) return null
  return (
    <span
      className={cn(
        // Same register as the breadcrumb page crumb / compact product wordmark
        // host: 14px, so product · crumb · program share one line of type.
        "min-w-0 truncate font-sans text-sm font-medium leading-none text-foreground",
        compact ? "max-w-[8rem]" : "max-w-[10rem]",
      )}
    >
      {name}
    </span>
  )
}

function UtilityBarSchoolSwitcherInner({
  product,
  compact,
  showProgram,
}: {
  product: Product
  compact: boolean
  showProgram: boolean
}) {
  const scope = useScopeSwitcher(product)
  const { parent, child } = scope
  const programName = child?.name ?? null

  // Nothing licensed in this product: no scope to name and none to switch to. The
  // page under the bar carries that message, so a control that opens an empty menu
  // would only add a place to press for nothing.
  if (scope.status === "none") return null

  if (scope.fixed && parent !== null && child !== null) {
    // Named lockup, no press. Tooltip is omitted for the same reason as before:
    // a focusable stop that does nothing is worse than putting the names on the
    // image + visible program label.
    return (
      <span
        role="img"
        aria-label={scope.ariaLabel}
        data-utility-bar-school-switcher=""
        className={cn(
          "flex size-8 shrink-0 items-center justify-center",
          showProgram && "h-8 max-w-[min(100%,14rem)] gap-2 px-1",
        )}
      >
        <ScopeAvatar parent={parent} childIcon={scope.config.childIcon} />
        {showProgram ? <ProgramLabel name={programName} compact={compact} /> : null}
      </span>
    )
  }

  return (
    <DropdownMenu onOpenChange={scope.onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={scope.ariaLabel}
              data-utility-bar-school-switcher=""
              className={cn(
                "size-8",
                showProgram && "h-8 w-auto max-w-[min(100%,16rem)] gap-2 px-1.5",
                utilityBarActionButtonClass,
              )}
            >
              <ScopeAvatar parent={parent} childIcon={scope.config.childIcon} />
              {showProgram ? <ProgramLabel name={programName} compact={compact} /> : null}
              {showProgram ? (
                <i
                  className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {parent && child ? `${child.name} · ${parent.name}` : scope.config.choosePrompt}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        className={SHELL_IDENTITY_MENU_SURFACE_CLASS}
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <ScopeSwitcherMenuBody scope={scope} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
