"use client"
// Re-export from the main barrel so all sidebar consumers share the same
// SidebarContext instance as the modules that import directly from
// @exxatdesignux/ui — app/(app)/providers.tsx, components/app-sidebar.tsx and
// question-bank/qb-*.tsx all do. Using the subpath
// (@exxatdesignux/ui/components/sidebar) loads a second copy of the module, so
// its SidebarProvider and this useSidebar are different React contexts and
// every consumer here throws "useSidebar must be used within a
// SidebarProvider". Mirrors apps/pce/admin/components/ui/sidebar.ts.
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  useRegisterNavFlyoutToggle,
} from "@exxatdesignux/ui"
export { SidebarNavLabel } from "./sidebar-nav-label"
