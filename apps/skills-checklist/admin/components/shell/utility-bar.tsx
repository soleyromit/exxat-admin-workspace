"use client"

/**
 * UtilityBar: the DS Design OS full-width utility row (apps/pce/admin components/utility-bar-slot.tsx comfort
 * layout; starter components/utility-bar-slot.tsx). Order, left to right:
 *   sidebar toggle | product switcher | breadcrumb (page title; persona chip when previewing another view)
 *   ... Search | Notifications | Help | Ask Leo | scope (school/program) switcher | profile menu.
 * Brand lives in the product switcher (round Exxat mark + product name), not in a separate wordmark. Controls the
 * DS bar has that need content or a service this product lacks (What's new, Chat with support, onboarding) are
 * omitted rather than rendered dead; see docs/build/ds-shell-anatomy.md.
 */
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarTrigger, useSidebar } from "@exxatdesignux/ui/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { Kbd, KbdGroup } from "@exxatdesignux/ui/components/ui/kbd"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@exxatdesignux/ui/components/ui/breadcrumb"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { useModKeyLabel } from "@exxatdesignux/ui/hooks/use-mod-key-label"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { ROUTES } from "@/lib/skills-routes"
import { pageTitleFor } from "@/components/shell/page-titles"
import { ProductSwitcher } from "@/components/shell/product-switcher"
import { ScopeSwitcher } from "@/components/shell/scope-switcher"
import { UserMenu } from "@/components/shell/user-menu"
import { AskLeoControl, HelpTrigger, NotificationsTrigger, SearchTrigger } from "@/components/shell/utility-controls"
import { VIEW_LABEL, viewForPath } from "@/components/shell/view"

function SidebarToggle() {
  const { state, isMobile } = useSidebar()
  const mod = useModKeyLabel()
  const collapsed = state === "collapsed" && !isMobile
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar"
  // The DS trigger renders a visually hidden "Toggle Sidebar"; the accessible name must contain it (label in name).
  const accessibleName = `Toggle sidebar, ${collapsed ? "expand" : "collapse"}`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger aria-label={accessibleName} className={cn("size-8 shrink-0 text-sidebar-foreground", utilityBarActionButtonClass)} />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>{label}</span>
        <KbdGroup>
          <Kbd>{mod}</Kbd>
          <Kbd>B</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

export function UtilityBar() {
  const pathname = usePathname() ?? ""
  const title = pageTitleFor(pathname)
  const view = viewForPath(pathname)
  const isMobile = useIsMobile()
  return (
    <nav
      aria-label="Global utilities"
      data-slot="utility-bar"
      data-utility-bar-density="comfort"
      className="sticky top-0 z-50 flex h-(--shell-utility-bar-height) min-h-(--shell-utility-bar-height) w-full min-w-0 shrink-0 items-center gap-1 bg-sidebar pe-2 sm:pe-3"
    >
      <div className="flex min-w-0 shrink items-center gap-0.5 ps-1.5">
        <SidebarToggle />
        <ProductSwitcher />
      </div>
      <div aria-hidden="true" className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />
      <Breadcrumb aria-label="Breadcrumb" className="min-w-0 flex-1 overflow-hidden">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
          {view !== "admin" ? (
            <BreadcrumbItem className="shrink-0">
              <Badge variant="outline" className="gap-1.5">
                Previewing as {VIEW_LABEL[view].toLowerCase()}
                <Link href={ROUTES.home} className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Back to administrator
                </Link>
              </Badge>
            </BreadcrumbItem>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ms-auto flex shrink-0 items-center gap-1">
        <SearchTrigger />
        <NotificationsTrigger />
        <span className="hidden sm:inline-flex">
          <HelpTrigger />
        </span>
        <AskLeoControl showLabel={!isMobile} />
        <div aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />
        <ScopeSwitcher />
        <UserMenu />
      </div>
    </nav>
  )
}
