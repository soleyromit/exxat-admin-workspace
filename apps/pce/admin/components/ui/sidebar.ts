"use client"
// Re-export from the main barrel so all sidebar consumers share the same
// SidebarContext instance as pages that import directly from @exxatdesignux/ui.
// Using the subpath (@exxatdesignux/ui/components/sidebar) creates a second
// context instance, breaking useSidebar() in components inside SidebarProvider.
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
