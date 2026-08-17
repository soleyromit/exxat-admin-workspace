"use client"

/**
 * Every licensed scope in one flat list, grouped by parent.
 *
 * The list a session sees when it has not chosen a scope in this product yet.
 * Flat rather than the two-step the switcher menu uses (school, then program):
 * that menu is for changing a scope you already have, where the school is
 * context you keep. Here there is nothing to keep, and a school is not a
 * destination, so making someone open a school to discover its one program adds
 * a press that decides nothing.
 *
 * One press per row, no select-then-confirm. The row is the door.
 *
 * Also used inside `ProductSwitchDialog` as the blocking chooser — same school
 * logos and program glyphs as the utility-bar school selector, without nesting a
 * dropdown under the dialog overlay.
 */

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { ScopeChild, ScopeConfig, ScopeParent } from "@/lib/scope-switcher"
import { cn } from "@/lib/utils"

export interface ScopeChoiceListProps {
  config: ScopeConfig
  onPick: (parent: ScopeParent, child: ScopeChild) => void
  /** The row mid-open, so the press that started it reads as work in progress. */
  busyChildId?: string | null
  /** Parent to lead with, when the session has one it last worked in. */
  suggestedParentId?: string | null
  className?: string
}

export function ScopeChoiceList({
  config,
  onPick,
  busyChildId,
  suggestedParentId,
  className,
}: ScopeChoiceListProps) {
  // The school this session last worked in leads, so a coordinator whose program
  // moved does not scroll past three others to find their own.
  const parents = React.useMemo(() => {
    if (!suggestedParentId) return config.parents
    const lead = config.parents.filter(p => p.id === suggestedParentId)
    return lead.length === 0
      ? config.parents
      : [...lead, ...config.parents.filter(p => p.id !== suggestedParentId)]
  }, [config.parents, suggestedParentId])

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {parents.map(parent => (
        <section key={parent.id} className="flex flex-col gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-8 shrink-0">
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
            <h2 className="min-w-0 truncate text-sm font-semibold leading-snug">
              {parent.name}
            </h2>
          </div>

          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
            {config.childrenOf(parent).map(child => {
              const busy = busyChildId === child.id
              return (
                <li key={child.id} className="min-w-0 list-none">
                  <Button
                    type="button"
                    variant="ghost"
                    aria-busy={busy}
                    onClick={() => onPick(parent, child)}
                    className={cn(
                      "h-auto w-full min-w-0 items-center justify-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm font-normal shadow-xs transition-[box-shadow,background-color,border-color]",
                      "hover:border-ring/40 hover:bg-interactive-hover hover:shadow-md",
                    )}
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
                      aria-hidden="true"
                    >
                      <i
                        className={cn(
                          "text-sm",
                          busy
                            ? "fa-light fa-spinner-third fa-spin text-muted-foreground"
                            : `fa-light fa-${config.childIcon}`,
                        )}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{child.name}</span>
                    <i
                      className="fa-light fa-arrow-right shrink-0 text-xs text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
