"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Avatar, AvatarFallback } from "@exxatdesignux/ui/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { actorIdFor, roleForPath } from "@/lib/v2/roles"
import { personName } from "@/lib/v2/selectors"
import { useV2State } from "@/lib/v2/react"

function initials(name: string): string {
  return name
    .replace(/,.*$/, "")
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !/^(Dr\.?)$/.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function V2UserMenu() {
  const pathname = usePathname() ?? ""
  const asParam = useSearchParams()?.get("as") ?? null
  const role = roleForPath(pathname) ?? "admin"
  const state = useV2State()
  const { theme, setTheme } = useTheme()
  const actorId = actorIdFor(role, pathname, asParam)
  const name = personName(state, actorId)
  const ini = initials(name)
  const title = state.people.find((p) => p.id === actorId)?.title ?? ""
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`${name}, open profile and display menu`} className={utilityBarActionButtonClass}>
          <Avatar className="size-6">
            <AvatarFallback aria-hidden="true" className="text-2xs">
              {ini}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback aria-hidden="true" className="text-xs">
              {ini}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{title}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="min-h-9 gap-2">
            <i className="fa-light fa-paintbrush text-muted-foreground" aria-hidden="true" />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
