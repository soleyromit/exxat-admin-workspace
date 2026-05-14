'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  Avatar,
  AvatarFallback,
  useSidebar,
} from '@exxat/ds/packages/ui/src'

function AppHeader() {
  const { state } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="sidebar-brand-btn cursor-default select-none"
          aria-label="Exxat"
          tooltip="Exxat"
        >
          {state === 'collapsed' ? (
            <img
              src="/exxat-logo.svg"
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className="shrink-0"
            />
          ) : (
            <img src="/exxat-one.svg" alt="Exxat One" className="h-6 w-auto" />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Apps">
                  <i className="fa-light fa-grid-2" aria-hidden="true" />
                  <span>Apps</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Romit Soley">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs">RS</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Romit Soley</span>
                <span className="truncate text-xs text-muted-foreground">
                  Product Designer II
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
