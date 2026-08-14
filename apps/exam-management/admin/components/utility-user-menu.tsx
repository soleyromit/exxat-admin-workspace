"use client"

/**
 * UtilityUserMenu — compact profile/account trigger for the shell utility
 * bar. Same menu content as the old sidebar `NavUser`, but a small
 * avatar-only trigger suited to a horizontal bar rather than the sidebar
 * rail (no `useSidebar()` icon-collapse branching needed here).
 */

import { Link } from "react-router-dom"
import { useTheme } from "@exxatdesignux/ui/hooks/use-color-scheme"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { NAV_USER } from "@/lib/mock/navigation"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"
import { cn } from "@/lib/utils"

export function UtilityUserMenu() {
  const { theme } = useTheme()
  const { mounted } = useAppTheme()
  const safeTheme = mounted ? (theme ?? "system") : "system"
  const user = NAV_USER

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${user.name} — open profile and settings menu`}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                utilityBarActionButtonClass,
              )}
            >
              <Avatar className="size-8">
                <AvatarImage src={user.avatar} alt="" className="object-cover" aria-hidden="true" />
                <AvatarFallback aria-hidden="true">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{user.name}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="w-64 rounded-lg" side="bottom" align="end" sideOffset={4}>
        {/* ── User identity ──────────────────────────────── */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 p-1.5 text-start text-sm">
            <Avatar className="size-8">
              <AvatarImage src={user.avatar} alt="" className="object-cover" aria-hidden="true" />
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
          <DropdownMenuItem>
            <i className="fa-light fa-circle-user" aria-hidden="true" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <i className="fa-light fa-credit-card" aria-hidden="true" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings/profile" className="cursor-pointer">
              <i className="fa-light fa-sliders" aria-hidden="true" />
              Profile settings
              <span className="ms-auto text-xs text-muted-foreground capitalize">{safeTheme}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* ── Sign out ───────────────────────────────────── */}
        <DropdownMenuItem>
          <i className="fa-light fa-arrow-right-from-bracket" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
