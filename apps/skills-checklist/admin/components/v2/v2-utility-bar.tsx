"use client"

/**
 * V2 utility bar: the same DS Design OS row as components/shell/utility-bar.tsx (sidebar toggle, product switcher,
 * breadcrumb title, search, notifications, help, Ask Leo, profile), with the v2 role switcher and Demo menu
 * added before the profile menu. No chrome is hand-built; the shared shell pieces are reused.
 */
import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { SidebarTrigger, useSidebar } from "@exxatdesignux/ui/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { Kbd, KbdGroup } from "@exxatdesignux/ui/components/ui/kbd"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@exxatdesignux/ui/components/ui/breadcrumb"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { useModKeyLabel } from "@exxatdesignux/ui/hooks/use-mod-key-label"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { ProductSwitcher } from "@/components/shell/product-switcher"
import { AskLeoControl, HelpTrigger, NotificationsTrigger, SearchTrigger } from "@/components/shell/utility-controls"
import { RoleSwitcher } from "@/components/v2/role-switcher"
import { ScenarioMenu } from "@/components/v2/scenario-menu"
import { V2UserMenu } from "@/components/v2/v2-user-menu"
import { v2CrumbsFor } from "@/components/v2/v2-titles"
import { roleForPath } from "@/lib/v2/roles"

function SidebarToggle() {
  const { state, isMobile } = useSidebar()
  const mod = useModKeyLabel()
  const collapsed = state === "collapsed" && !isMobile
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger aria-label={`Toggle sidebar, ${collapsed ? "expand" : "collapse"}`} className={cn("size-8 shrink-0 text-sidebar-foreground", utilityBarActionButtonClass)} />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
        <KbdGroup>
          <Kbd>{mod}</Kbd>
          <Kbd>B</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The DS Ask Leo launcher reads prefers-reduced-motion while rendering, so its server markup differs from the client
 * when that preference is on (React hydration error, which also resets the mobile sidebar to open). Render it after
 * mount only. The v1 shell has the same mismatch; it is reported in docs/v2/decisions-and-open-questions.md.
 */
function AfterMount({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted ? <>{children}</> : null
}

function Crumbs({ pathname, search }: { pathname: string; search: URLSearchParams | null }) {
  const crumbs = v2CrumbsFor(pathname, search)
  return (
    <BreadcrumbList className="flex-nowrap">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1
        return (
          <React.Fragment key={`${c.label}-${i}`}>
            <BreadcrumbItem className="min-w-0">
              {last || !c.href ? (
                <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {last ? null : <BreadcrumbSeparator />}
          </React.Fragment>
        )
      })}
    </BreadcrumbList>
  )
}

function CrumbsWithSearch({ pathname }: { pathname: string }) {
  return <Crumbs pathname={pathname} search={useSearchParams()} />
}

export function V2UtilityBar() {
  const pathname = usePathname() ?? ""
  const isMobile = useIsMobile()
  // A student below 768 px has the bottom bar as the nav, so the sidebar toggle is not rendered.
  const showToggle = !(roleForPath(pathname) === "student" && isMobile)
  return (
    <nav
      aria-label="Global utilities"
      data-slot="utility-bar"
      data-utility-bar-density="comfort"
      className="sticky top-0 z-50 flex h-(--shell-utility-bar-height) min-h-(--shell-utility-bar-height) w-full min-w-0 shrink-0 items-center gap-1 bg-sidebar pe-2 sm:pe-3"
    >
      <div className="flex min-w-0 shrink items-center gap-0.5 ps-1.5">
        {showToggle ? <SidebarToggle /> : null}
        <ProductSwitcher markOnly={isMobile} />
      </div>
      <div aria-hidden="true" className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />
      <Breadcrumb aria-label="Breadcrumb" className="hidden min-w-0 flex-1 overflow-hidden md:block">
        <React.Suspense fallback={<Crumbs pathname={pathname} search={null} />}>
          <CrumbsWithSearch pathname={pathname} />
        </React.Suspense>
      </Breadcrumb>
      <div className="ms-auto flex shrink-0 items-center gap-1">
        <span className="hidden sm:inline-flex">
          <SearchTrigger />
        </span>
        <span className="hidden lg:inline-flex">
          <NotificationsTrigger />
        </span>
        <span className="hidden lg:inline-flex">
          <HelpTrigger />
        </span>
        <span className="hidden xl:inline-flex">
          <AfterMount>
            <AskLeoControl showLabel={!isMobile} />
          </AfterMount>
        </span>
        <div aria-hidden="true" className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />
        <RoleSwitcher />
        <ScenarioMenu />
        <React.Suspense fallback={null}>
          <V2UserMenu />
        </React.Suspense>
      </div>
    </nav>
  )
}
