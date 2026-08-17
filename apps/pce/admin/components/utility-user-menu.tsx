"use client"

/**
 * UtilityUserMenu — compact profile/account trigger for the shell utility
 * bar. Same menu content as the sidebar rail's identity menu (role toggle,
 * Appearance, Demo account — see identity-menu-items.tsx), just a small
 * avatar-only trigger suited to a horizontal bar rather than the sidebar
 * rail (no `useSidebar()` icon-collapse branching needed here).
 */

import Link from "next/link"
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAppTheme } from "@/hooks/use-app-theme"
import { usePce } from "@/components/pce/pce-state"
import { useLogOut } from "@/hooks/use-log-out"
import { MOCK_FACULTY } from "@/lib/pce-mock-data"
import {
  AccountPreferencesMenu,
  DemoAccountMenuItem,
} from "@/components/pce/identity-menu-items"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"
import { cn } from "@/lib/utils"

export function UtilityUserMenu() {
  const { theme } = useTheme()
  const { mounted } = useAppTheme()
  const safeTheme = mounted ? (theme ?? "system") : "system"
  const { user } = usePce()
  const logOut = useLogOut()
  const avatarUrl = MOCK_FACULTY.find(f => f.id === user.facultyId)?.avatarUrl ?? ""

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${user.name}, open profile and settings menu`}
              className={cn("rounded-full", utilityBarActionButtonClass)}
            >
              <Avatar className="size-8">
                <AvatarImage src={avatarUrl} alt="" className="object-cover" aria-hidden="true" />
                <AvatarFallback aria-hidden="true">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{user.name}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="w-64 rounded-lg" side="bottom" align="end" sideOffset={4}>
        {/* ── User identity ──────────────────────────────── */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 p-1.5 text-start text-sm">
            <Avatar className="size-8">
              <AvatarImage src={avatarUrl} alt="" className="object-cover" aria-hidden="true" />
              <AvatarFallback aria-hidden="true">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* ── Account actions ────────────────────────────── */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings/profile" className="cursor-pointer">
              <i className="fa-light fa-sliders" aria-hidden="true" />
              Profile settings
              <span className="ms-auto text-xs text-muted-foreground capitalize">{safeTheme}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <AccountPreferencesMenu />
        <DemoAccountMenuItem />

        <DropdownMenuSeparator />

        {/* ── Sign out ───────────────────────────────────── */}
        <DropdownMenuItem onClick={logOut}>
          <i className="fa-light fa-arrow-right-from-bracket" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
