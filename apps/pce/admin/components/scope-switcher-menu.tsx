"use client"

/**
 * The one scope (school > program / brand > site > location) picker menu.
 *
 * This body was previously copy-pasted into `UtilityBarSchoolSwitcher` and the
 * sidebar's `TeamSwitcher`, each with its own `useState` — so the two chrome
 * surfaces could show different programs at the same time. Both now render
 * this component over shared `useActiveScope` state, which the products home
 * writes to before the user has even entered the product.
 *
 * Only the *trigger* differs per surface: an avatar circle in the utility bar,
 * a full row in the sidebar, a card row on the products home. The menu itself
 * is identical everywhere, so it lives here once.
 *
 * Whether there is a menu at all is also decided here, once, as `fixed`: a
 * session that does not choose its scope (a student, who is enrolled in one
 * program at one school) gets the names and no trigger.
 */

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Product } from "@/contexts/product-context"
import { useActiveScope, type ScopeStatus } from "@/hooks/use-active-scope"
import type { ScopeChild, ScopeConfig, ScopeParent } from "@/lib/scope-switcher"
import { cn } from "@/lib/utils"
import { isScopeFixed } from "@/lib/workspace-role"

export interface ScopeSwitcherBag {
  config: ScopeConfig
  /**
   * `"open"` means both names below are set. `"choose"` means this product is
   * licensed for scopes but the session has not picked one here, so every trigger
   * reads the prompt and the menu asks. `"none"` means nothing is licensed.
   */
  status: ScopeStatus
  parent: ScopeParent | null
  child: ScopeChild | null
  /** Trigger text: the child's name, or the prompt when there is nothing to name. */
  label: string
  /** Parent's name, or the product-level prompt. Never empty. */
  parentLabel: string
  suggestedParent: ScopeParent | null
  selectScope: (parent: ScopeParent, child: ScopeChild) => void
  subView: "main" | "parents"
  /** Pass to `DropdownMenu` so the menu reopens on the main view. */
  onOpenChange: (open: boolean) => void
  showParents: () => void
  showMain: () => void
  selectParent: (parent: ScopeParent) => void
  selectChild: (child: ScopeChild) => void
  /**
   * True when this session does not choose its scope (`isScopeFixed`), so every
   * trigger renders the two names without a menu behind them. Decided here rather
   * than at each trigger: the three surfaces already share this bag, and a
   * predicate copied three times is a predicate one surface forgets.
   */
  fixed: boolean
  /** `"<Parent> · <Child>. <how to change it, or what it is>"` — for `aria-label`. */
  ariaLabel: string
}

/** Shared state + handlers for any trigger that opens `ScopeSwitcherMenuBody`. */
export function useScopeSwitcher(product: Product, customIndex?: number): ScopeSwitcherBag {
  const {
    config,
    status,
    parent,
    child,
    suggestedParent,
    selectParent,
    selectChild,
    selectScope,
  } = useActiveScope(product, customIndex)
  const [subView, setSubView] = React.useState<"main" | "parents">("main")
  const fixed = isScopeFixed()

  const named = parent !== null && child !== null

  return {
    config,
    status,
    parent,
    child,
    label: child?.name ?? config.choosePrompt,
    parentLabel: parent?.name ?? config.choosePrompt,
    suggestedParent,
    selectScope,
    subView,
    onOpenChange: open => {
      if (!open) setSubView("main")
    },
    showParents: () => setSubView("parents"),
    showMain: () => setSubView("main"),
    selectParent: next => {
      selectParent(next)
      setSubView("main")
    },
    selectChild,
    fixed,
    // Unresolved has no two names to read out, so the label carries the ask
    // instead. Keeping the same slot means no trigger needs its own branch.
    ariaLabel: named
      ? `${parent.name} · ${child.name}. ${fixed ? config.fixedAriaSuffix : config.ariaSuffix}`
      : config.choosePrompt,
  }
}

/** Menu contents. Render inside a `DropdownMenuContent`. */
export function ScopeSwitcherMenuBody({ scope }: { scope: ScopeSwitcherBag }) {
  const { config, parent, child, subView, showParents, showMain } = scope

  // Nothing chosen here yet: the same question the chooser page asks, in menu
  // items, so the chrome is a second way to answer it rather than dead until
  // the page is used. Every row names both halves because there is no current
  // school to hang a bare program on.
  if (parent === null || child === null) {
    if (scope.status === "none") {
      return (
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {`No ${config.childNoun.toLowerCase()}s for your account`}
        </DropdownMenuLabel>
      )
    }

    return (
      <>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {config.choosePrompt}
        </DropdownMenuLabel>
        {config.parents.map(option => (
          <React.Fragment key={option.id}>
            {config.parents.length > 1 ? (
              <DropdownMenuLabel className="pt-2 text-xs font-normal text-muted-foreground">
                {option.name}
              </DropdownMenuLabel>
            ) : null}
            {config.childrenOf(option).map(childOption => (
              <DropdownMenuItem
                key={`${option.id}-${childOption.id}`}
                onClick={() => scope.selectScope(option, childOption)}
                className="items-start py-2"
              >
                <i
                  className={`fa-light fa-${config.childIcon} mt-0.5 shrink-0 text-xs`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 break-words whitespace-normal">
                  {childOption.name}
                </span>
              </DropdownMenuItem>
            ))}
          </React.Fragment>
        ))}
      </>
    )
  }

  if (subView === "parents") {
    return (
      <>
        <DropdownMenuItem
          onSelect={e => {
            e.preventDefault()
            showMain()
          }}
        >
          <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
          <span>Back</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {config.parentSelectLabel}
        </DropdownMenuLabel>
        {config.parents.map(option => (
          <DropdownMenuItem
            key={option.id}
            // Stay open and return to the program/site list — closing here
            // forced a second open just to finish the scope pick.
            onSelect={event => {
              event.preventDefault()
              scope.selectParent(option)
            }}
            className="items-start py-2"
          >
            <Avatar size="sm" className="mt-0.5 shrink-0">
              <AvatarImage src={option.logo} alt="" referrerPolicy="origin" />
              <AvatarFallback className="text-xs font-semibold">
                {option.initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 break-words whitespace-normal">
              {option.name}
            </span>
            {option.id === parent.id && (
              <i
                className="fa-solid fa-check ms-1 mt-0.5 shrink-0 text-xs text-brand"
                aria-hidden="true"
              />
            )}
          </DropdownMenuItem>
        ))}
      </>
    )
  }

  return (
    <>
      <div className="p-1">
        <Button
          type="button"
          variant="ghost"
          onClick={showParents}
          className="h-auto w-full items-center justify-start gap-2.5 whitespace-normal p-2 text-left text-sm font-normal"
        >
          <Avatar className="size-9 shrink-0">
            <AvatarImage
              src={parent.logo}
              alt=""
              referrerPolicy="origin"
              className="object-contain p-0.5"
            />
            <AvatarFallback className="text-xs font-semibold">
              {parent.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 break-words text-sm font-semibold leading-snug whitespace-normal">
              {parent.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{child.name}</p>
          </div>
          <span className="shrink-0 text-sm font-medium text-brand">Change</span>
        </Button>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuLabel className="text-xs text-muted-foreground">
        {config.childNoun}
      </DropdownMenuLabel>
      {config.childrenOf(parent).map(option => (
        <DropdownMenuItem
          key={option.id}
          onClick={() => scope.selectChild(option)}
          className="items-start py-2"
        >
          <i
            className={`fa-light fa-${config.childIcon} mt-0.5 shrink-0 text-xs`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 break-words whitespace-normal">
            {option.name}
          </span>
          {option.id === child.id && (
            <i
              className="fa-solid fa-check ms-1 mt-0.5 shrink-0 text-xs text-brand"
              aria-hidden="true"
            />
          )}
        </DropdownMenuItem>
      ))}
    </>
  )
}

const PANEL_ROW =
  "h-auto w-full items-start justify-start gap-2.5 whitespace-normal px-2 py-2 text-left text-sm font-normal"

/**
 * The school selector, as a blocking panel — same IA as {@link ScopeSwitcherMenuBody}
 * (school header + Change, then program rows with glyphs), without a dropdown.
 *
 * Used when a product switch cannot carry the program you left: the dialog owns
 * the question, so nesting the utility-bar menu under its overlay would open
 * behind it. Same presses, same icons, in the dialog's own surface.
 */
export function ScopeSwitcherPanel({
  config,
  suggestedParentId,
  onPick,
  className,
}: {
  config: ScopeConfig
  suggestedParentId?: string | null
  onPick: (parent: ScopeParent, child: ScopeChild) => void
  className?: string
}) {
  const initialParent =
    (suggestedParentId
      ? config.parents.find(p => p.id === suggestedParentId)
      : null) ?? config.parents[0]

  const [view, setView] = React.useState<"main" | "parents">("main")
  const [parent, setParent] = React.useState<ScopeParent | null>(initialParent ?? null)

  if (!parent || config.parents.length === 0) {
    return (
      <p className="px-2 py-3 text-sm text-muted-foreground">
        {`No ${config.childNoun.toLowerCase()}s for your account`}
      </p>
    )
  }

  const programs = config.childrenOf(parent)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xs ring-1 ring-foreground/10",
        className,
      )}
    >
      {view === "parents" ? (
        <div className="flex flex-col p-1">
          <Button type="button" variant="ghost" onClick={() => setView("main")} className={PANEL_ROW}>
            <i className="fa-light fa-arrow-left mt-0.5 shrink-0 text-xs" aria-hidden="true" />
            <span>Back</span>
          </Button>
          <div className="my-1 h-px bg-border" role="separator" />
          <p className="px-2 py-1.5 text-xs text-muted-foreground">{config.parentSelectLabel}</p>
          {config.parents.map(option => (
            <Button
              key={option.id}
              type="button"
              variant="ghost"
              onClick={() => {
                setParent(option)
                setView("main")
              }}
              className={PANEL_ROW}
            >
              <Avatar size="sm" className="mt-0.5 shrink-0">
                <AvatarImage src={option.logo} alt="" referrerPolicy="origin" />
                <AvatarFallback className="text-xs font-semibold">
                  {option.initials}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 break-words whitespace-normal">
                {option.name}
              </span>
              {option.id === parent.id ? (
                <i
                  className="fa-solid fa-check ms-1 mt-0.5 shrink-0 text-xs text-brand"
                  aria-hidden="true"
                />
              ) : null}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="p-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setView("parents")}
              className="h-auto w-full items-center justify-start gap-2.5 whitespace-normal p-2 text-left text-sm font-normal"
            >
              <Avatar className="size-9 shrink-0">
                <AvatarImage
                  src={parent.logo}
                  alt=""
                  referrerPolicy="origin"
                  className="object-contain p-0.5"
                />
                <AvatarFallback className="text-xs font-semibold">
                  {parent.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 break-words text-sm font-semibold leading-snug whitespace-normal">
                  {parent.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{config.choosePrompt}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-brand">Change</span>
            </Button>
          </div>

          <div className="h-px bg-border" role="separator" />

          <div className="flex flex-col p-1">
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{config.childNoun}</p>
            {programs.map(option => (
              <Button
                key={option.id}
                type="button"
                variant="ghost"
                onClick={() => onPick(parent, option)}
                className={PANEL_ROW}
              >
                <i
                  className={`fa-light fa-${config.childIcon} mt-0.5 shrink-0 text-xs`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 break-words whitespace-normal">
                  {option.name}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
