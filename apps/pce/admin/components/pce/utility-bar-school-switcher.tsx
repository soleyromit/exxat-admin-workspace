"use client"

/**
 * UtilityBarSchoolSwitcher — PCE's avatar-only school/program trigger for the
 * utility bar, matching the DS's `UtilityBarSchoolSwitcher` treatment
 * (size-8 avatar, sits in the trailing identity cluster before the profile
 * avatar). Content ported from the sidebar's old `TeamSwitcher` — see
 * `contexts/school-switcher-context.tsx` for why this moved.
 */

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"
import { useSchoolSwitcher, NAV_SCHOOLS } from "@/contexts/school-switcher-context"
import { cn } from "@/lib/utils"

export function UtilityBarSchoolSwitcher({ showProgram = false }: { showProgram?: boolean } = {}) {
  const { school, program, setSchool, setProgram } = useSchoolSwitcher()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`${school.name}, ${program.name}. Switch school or program`}
              className={cn(
                "h-8 shrink-0 items-center justify-center rounded-md p-0 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                showProgram ? "w-auto max-w-[min(100%,16rem)] gap-2 px-1.5" : "w-8",
                utilityBarActionButtonClass,
              )}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={school.logo} alt="" className="object-cover" aria-hidden="true" />
                <AvatarFallback aria-hidden="true">{school.initials}</AvatarFallback>
              </Avatar>
              {showProgram ? (
                <>
                  <span className="min-w-0 truncate font-sans text-sm font-medium leading-none text-foreground">
                    {program.name}
                  </span>
                  <i className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground" aria-hidden="true" />
                </>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{program.name} · {school.name}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="w-64 rounded-lg" align="end" side="bottom" sideOffset={8}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">Schools</DropdownMenuLabel>
        {NAV_SCHOOLS.map(s => (
          <React.Fragment key={s.id}>
            <DropdownMenuItem className="font-medium" onClick={() => setSchool(s)}>
              <Avatar className="me-2 size-5 shrink-0 rounded">
                <AvatarImage src={s.logo} alt="" className="rounded object-cover" aria-hidden="true" />
                <AvatarFallback className="rounded text-[9px] font-bold" aria-hidden="true">
                  {s.initials}
                </AvatarFallback>
              </Avatar>
              {s.name}
            </DropdownMenuItem>
            {s.id === school.id &&
              s.programs.map(p => (
                <DropdownMenuItem key={p.id} className="ps-8 text-sm" onClick={() => setProgram(p)}>
                  {program.id === p.id && (
                    <i className="fa-solid fa-check me-2 text-xs text-brand" aria-hidden="true" />
                  )}
                  {p.name}
                </DropdownMenuItem>
              ))}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
