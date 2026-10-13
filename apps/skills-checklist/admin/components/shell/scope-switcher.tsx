"use client"

/**
 * Scope switcher: school avatar at the right of the DS utility bar (apps/pce/admin utility-bar-school-switcher.tsx).
 * Menu: school header, then the "Program" list with the current program ticked. The sample data covers one
 * program (Nursing, the prototype's breadcrumb scope), so it is the only row; the control stays so the bar and
 * the scope hierarchy (school > program) match every shipped Exxat product.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Avatar, AvatarFallback } from "@exxatdesignux/ui/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"

export const SCHOOL = { name: "Sample University" }
export const PROGRAM = { name: "Nursing" }

export function ScopeSwitcher() {
  const label = `${SCHOOL.name} · ${PROGRAM.name}. Switch school or program`
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={label} className={utilityBarActionButtonClass}>
              <Avatar className="size-6" shape="rounded-md">
                <AvatarFallback aria-hidden="true" className="text-2xs">
                  <i className="fa-light fa-building-columns" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {SCHOOL.name} · {PROGRAM.name}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2">
          <Avatar className="size-8" shape="rounded-md">
            <AvatarFallback aria-hidden="true" className="text-xs">
              <i className="fa-light fa-building-columns" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{SCHOOL.name}</p>
            <p className="truncate text-xs text-muted-foreground">School of {PROGRAM.name}</p>
          </div>
        </div>
        <DropdownMenuLabel className="mt-1 text-xs font-normal text-muted-foreground">Program</DropdownMenuLabel>
        <DropdownMenuItem aria-current="true" className="min-h-9 gap-2">
          <i className="fa-light fa-graduation-cap text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">{PROGRAM.name}</span>
          <i className="fa-solid fa-check text-xs text-(--brand-color)" aria-hidden="true" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs text-muted-foreground">The sample data covers one program.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
