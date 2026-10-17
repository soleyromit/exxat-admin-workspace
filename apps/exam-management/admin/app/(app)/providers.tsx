'use client'
// Sidebar symbols come from @/components/ui/sidebar — NOT '@exxatdesignux/ui'.
// That barrel re-exports the subpath (@exxatdesignux/ui/components/sidebar),
// which is a separate module copy with its own SidebarContext. Importing the
// provider from the main barrel while components/site-header.tsx consumes the
// subpath put them in different contexts, so every page rendering <SiteHeader/>
// threw "useSidebar must be used within a SidebarProvider" at prerender.
// The fix has to live here: `exxat-ui sync-extras` (postinstall) regenerates
// components/ui/sidebar.tsx from the DS starter, so pointing that file at the
// main barrel gets reverted on every install. Mirrors apps/pce/admin, where all
// sidebar usage funnels through @/components/ui/sidebar.
export { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
export { TooltipProvider } from '@exxatdesignux/ui'
