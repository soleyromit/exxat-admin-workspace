// Re-export from the MAIN entry (not the /components/sidebar subpath): under
// Next/webpack the subpath is a separate module instance with its own React
// context, which mismatches the SidebarProvider that AppSidebar + the DS render
// components pull from the main entry (→ "useSidebar must be used within a
// SidebarProvider"). Aliasing to main keeps one shared context instance.
export * from "@exxatdesignux/ui"
export { SidebarNavLabel } from "./sidebar-nav-label"
