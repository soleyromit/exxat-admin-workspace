// Re-export from the MAIN entry (not the /components/sidebar subpath): under
// Next/webpack the subpath is a separate module instance with its own React
// context, mismatching the SidebarProvider that AppSidebar + DS render
// components use from the main entry (→ "useSidebar must be used within a
// SidebarProvider"). One shared context instance.
export * from "@exxatdesignux/ui"
export { SidebarNavLabel } from "./sidebar-nav-label"
