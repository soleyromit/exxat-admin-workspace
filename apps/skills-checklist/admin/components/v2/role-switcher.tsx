"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { isRoleId, ROLE_BY_ID, ROLES, roleForPath } from "@/lib/v2/roles"

/** Role switcher: changing the role opens that role's home. The role is read from the URL, so deep links keep working. */
export function RoleSwitcher() {
  const router = useRouter()
  const role = roleForPath(usePathname() ?? "")
  const label = role ? ROLE_BY_ID[role].label : "Choose role"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" aria-label={`Role: ${label}. Switch role`} className="max-w-44 gap-1.5">
          <span className="truncate">{label}</span>
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Act as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={role ?? ""}
          onValueChange={(v) => {
            if (isRoleId(v)) router.push(ROLE_BY_ID[v].home)
          }}
        >
          {ROLES.map((r) => (
            <DropdownMenuRadioItem key={r.id} value={r.id} className="min-h-9">
              {r.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
