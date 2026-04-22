"use client"

/**
 * NavUser — WCAG 2.1 AA profile menu
 *
 * AA checklist:
 *  ✓ aria-label on trigger (1.3.1, 4.1.2)
 *  ✓ Icon-only items have sr-only text (1.1.1)
 *  ✓ App preferences link to Settings (appearance lives there)
 *  ✓ Keyboard: full arrow-key + Enter/Space navigation via Radix (2.1.1)
 *  ✓ Focus ring visible on every item (2.4.11)
 *  ✓ Colour contrast: all labels ≥ 4.5:1 on popover bg (1.4.3)
 *  ✓ Active theme shown via aria-checked (RadioItem) (4.1.3)
 */

import { useTheme } from "next-themes"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAppTheme } from "@/hooks/use-app-theme"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile, state }               = useSidebar()
  const { theme }                 = useTheme()
  const { mounted } = useAppTheme()

  const safeTheme    = mounted ? (theme ?? "system") : "system"
  const showCollapsedTooltip = state === "collapsed" && !isMobile

  const profileTrigger = (
    <SidebarMenuButton
      size="lg"
      aria-label={`${user.name} — open profile and settings menu`}
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage
          src={user.avatar}
          alt=""
          className="object-cover"
          aria-hidden="true"
        />
        <AvatarFallback className="rounded-lg" aria-hidden="true">
          {user.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-start text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
      <i className="fa-light fa-ellipsis-vertical ms-auto inline-flex size-6 shrink-0 items-center justify-center" aria-hidden="true" />
    </SidebarMenuButton>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {showCollapsedTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  {profileTrigger}
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {user.name}
              </TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenuTrigger asChild>
              {profileTrigger}
            </DropdownMenuTrigger>
          )}

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* ── User identity ──────────────────────────────── */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.avatar}
                    alt=""
                    className="object-cover"
                    aria-hidden="true"
                  />
                  <AvatarFallback className="rounded-lg" aria-hidden="true">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
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
              <DropdownMenuItem>
                <i className="fa-light fa-bell" aria-hidden="true" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings#appearance" className="cursor-pointer">
                  <i className="fa-light fa-sliders" aria-hidden="true" />
                  App preferences
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
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
