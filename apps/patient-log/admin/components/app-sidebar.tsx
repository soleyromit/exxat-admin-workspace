'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@exxat/ds/packages/ui/src'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'fa-grid-2' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default select-none"
              aria-label="Patient Log"
              tooltip="Patient Log"
            >
              {state === 'collapsed' ? (
                <i className="fa-light fa-notes-medical" aria-hidden="true" style={{ fontSize: 20, color: 'var(--brand-color)' }} />
              ) : (
                <span className="font-semibold text-sm" style={{ color: 'var(--brand-color)' }}>Patient Log</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    data-active={pathname === item.href || undefined}
                  >
                    <Link href={item.href}>
                      <i className={`fa-light ${item.icon}`} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  )
}
