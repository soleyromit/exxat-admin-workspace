"use client"

/**
 * Chrome for the design lab. Staff personas get the DS base shell (SidebarShell, full-width utility bar, AppSidebar,
 * SidebarInset with the single data-page-scroll owner), wired the same way as components/v2/v2-shell-wiring.tsx but with the
 * PROPOSED nav from lib/lab/personas.ts. Evaluator and lab instructor get a plain product header and no sidebar.
 *
 * The only lab chrome on a screen is the lab bar (components/lab/lab-bar), passed in as `bar`: in the shell it sits above the
 * scrollport inside SidebarInset; in the light frame it is sticky above the product header. The utility bar carries product
 * chrome only (sidebar toggle, product switcher, breadcrumb).
 */
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { SidebarInset, SidebarTrigger, useSidebar } from "@exxatdesignux/ui/components/ui/sidebar"
import { LeoAmbienceProvider } from "@exxatdesignux/ui/components/ui/leo-ambience-context"
import { AppShellSlotsProvider, AppSidebar, SidebarShell, type AppShellData, type AppShellRoutePolicy, type AppShellSlots, type ShellNav } from "@exxatdesignux/ui/components/shell"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@exxatdesignux/ui/components/ui/breadcrumb"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { ProductSwitcher } from "@/components/shell/product-switcher"
import { PersonaSwitcher } from "@/components/lab/lab-bar/persona-switcher"
import { LabPageProvider, useLabLinkContext, type LabPage } from "@/components/lab/lab-bar/page-context"
import { SCOPE_CARRY, labHref, navHref } from "@/lib/lab/links"
import { findFlow } from "@/lib/lab/flows"
import { usePresent } from "@/components/lab/lab-bar/present"
import { useTerms } from "@/components/lab/library/use-terms"
import { withNoun } from "@/lib/lab/terms"
import { V2StoreProvider, useV2State } from "@/lib/v2/react"
import { approvalsBadgeCount } from "@/lib/v2/approvals"
import { parseScope } from "@/lib/lab/scope"
import { PERSONAS, PERSONA_BY_ID, isPersonaId, type PersonaDef } from "@/lib/lab/personas"
import { findScreen, type PersonaId } from "@/lib/lab/screens"
import { LightFrame } from "@/components/lab/light-frame"

export { PersonaSwitcher }

const icon = (name: string, solid = false) => <i className={`${solid ? "fa-solid" : "fa-light"} fa-${name}`} aria-hidden="true" />

function makeData(persona: PersonaDef): AppShellData {
  const useNav = (): ShellNav => {
    const state = useV2State()
    const params = useSearchParams()
    // The badge counts the same queue entries the Approvals page lists for the scope in the URL (lib/v2/approvals.ts).
    const scope = parseScope(params)
    const approvals = approvalsBadgeCount(state, scope)
    // Rows follow the active option set: a row opens its flow (so every step of that flow highlights the row, by path
    // prefix) or its step in the page's flow; on an old screen URL the row for that screen points at the page itself.
    const link = useLabLinkContext()
    // The program's noun ("Skills", "Competencies", "EPAs") names a row: re-render the rows when it changes.
    const terms = useTerms()
    return React.useMemo(() => {
      const rows = persona.nav?.() ?? []
      // The DS sidebar matches the active row by path and compares the whole url, query included, so a row url carries no
      // query; the set and scope ride along at click time (SidebarCarry below).
      const rowUrl = (slug: string) => {
        const screen = `${persona.id}/${slug}`
        const url = !link.onFlowRoute && link.screen === screen ? labHref(screen, {}, link) : navHref(screen, link)
        return url.split("?")[0]!
      }
      const primary = rows.map((r) => ({
        key: `lab-${persona.id}-${r.key}`,
        title: r.title,
        url: rowUrl(r.slug),
        icon: icon(r.icon),
        iconActive: icon(r.icon, true),
        // A string badge renders the DS neutral (primary) Badge; a number renders the destructive red chip, which breaks the
        // amber-not-red rule for a count that is not an error. DS gap raised in docs/knowledge/design/visual-language.md.
        ...(r.badge === "approvals" && approvals > 0 ? { badge: String(approvals) } : {}),
      }))
      return { primary, primaryLayout: { preamble: primary, sections: [] }, quickActions: [], documents: [], secondary: [], user: { name: persona.label, email: "", avatar: "" }, knownUrls: primary.map((p) => p.url) }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approvals, link, terms.skillNoun, terms.skillNounPlural])
  }
  return { useNav }
}

const DATA = Object.fromEntries(PERSONAS.filter((p) => p.chrome === "shell").map((p) => [p.id, makeData(p)])) as Record<string, AppShellData>
const SLOTS: AppShellSlots = {}
const ROUTES: AppShellRoutePolicy = {}
const ON = {}

/** What the frame knows about the page, for the breadcrumb (the flow route has no persona or screen segment). */
const FrameContext = React.createContext<{ persona?: PersonaId; title?: string }>({})

function Crumbs() {
  const pathname = usePathname() ?? ""
  const ctx = React.useContext(FrameContext)
  const [, , seg, screen] = pathname.split("/")
  const persona = ctx.persona ?? (isPersonaId(seg ?? "") ? (seg as PersonaId) : undefined)
  const title = ctx.title ?? (seg && screen ? findScreen(seg, screen)?.title : undefined)
  const { present } = usePresent()
  // Present mode shows no lab label: the screen title only.
  const crumbs: Array<{ label: string; href?: string }> = present ? [] : [{ label: "Design lab", href: "/lab" }]
  if (persona && !present) crumbs.push({ label: PERSONA_BY_ID[persona].label })
  if (title) crumbs.push({ label: withNoun(title) })
  return (
    <BreadcrumbList className="flex-nowrap">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1
        return (
          <React.Fragment key={`${c.label}-${i}`}>
            <BreadcrumbItem className="min-w-0">
              {last || !c.href ? <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage> : <BreadcrumbLink asChild><Link href={c.href}>{c.label}</Link></BreadcrumbLink>}
            </BreadcrumbItem>
            {last ? null : <BreadcrumbSeparator />}
          </React.Fragment>
        )
      })}
    </BreadcrumbList>
  )
}

function SidebarToggle() {
  const { state, isMobile } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger aria-label={`Toggle sidebar, ${collapsed ? "expand" : "collapse"}`} className={cn("size-8 shrink-0 text-sidebar-foreground", utilityBarActionButtonClass)} />
      </TooltipTrigger>
      <TooltipContent side="bottom">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
    </Tooltip>
  )
}

function LabUtilityBar() {
  return (
    <nav aria-label="Global utilities" data-slot="utility-bar" data-utility-bar-density="comfort" className="sticky top-0 z-50 flex h-(--shell-utility-bar-height) min-h-(--shell-utility-bar-height) w-full min-w-0 shrink-0 items-center gap-1 bg-sidebar pe-2 sm:pe-3">
      <div className="flex min-w-0 shrink items-center gap-0.5 ps-1.5">
        <SidebarToggle />
        <ProductSwitcher markOnly={false} />
      </div>
      <div aria-hidden="true" className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />
      <Breadcrumb aria-label="Lab location" className="hidden min-w-0 flex-1 overflow-hidden md:block"><Crumbs /></Breadcrumb>
    </nav>
  )
}

/**
 * Sidebar rows have bare urls (so the DS can highlight them by path); a click adds the active option set and the scope, so
 * the next page opens in the same design. Modified clicks (new tab) keep the default, and the flow route restores the set
 * from the session there.
 */
function SidebarCarry() {
  const router = useRouter()
  const link = useLabLinkContext()
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a[data-sidebar=menu-button]") as HTMLAnchorElement | null
      const href = a?.getAttribute("href")
      if (!a || !href || !href.startsWith("/lab/") || href.includes("?")) return
      const q = new URLSearchParams()
      for (const k of SCOPE_CARRY) { const v = link.carry?.get(k); if (v) q.set(k, v) }
      // Only a set the target flow has; otherwise the flow opens in its recommended set.
      const target = findFlow(href.split("/")[3])
      if (link.set && (!target || target.sets.some((x) => x.id === link.set))) q.set("set", link.set)
      const s = q.toString()
      if (!s) return
      e.preventDefault()
      e.stopPropagation()
      router.push(`${href}?${s}`)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [link, router])
  return null
}

function ShellFrame({ persona, bar, children }: { persona: PersonaDef; bar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <LeoAmbienceProvider>
      <SidebarCarry />
      <AppShellSlotsProvider slots={SLOTS} on={ON} routes={ROUTES} data={DATA[persona.id]}>
        <SidebarShell defaultOpen wrapperClassName="flex h-dvh min-h-0 w-full flex-col overflow-hidden" data-shell-utility-bar-full="true">
          <LabUtilityBar />
          <div data-app-shell-row="" className="relative z-40 flex min-h-0 w-full min-w-0 flex-1 items-stretch overflow-visible has-data-[variant=inset]:bg-sidebar">
            <AppSidebar variant="sidebar" />
            <SidebarInset aria-label="Main content" className="min-w-0">
              {/* The lab bar sits above the single scrollport, so it never scrolls into the page. */}
              {bar}
              <div data-page-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
            </SidebarInset>
          </div>
        </SidebarShell>
      </AppShellSlotsProvider>
    </LeoAmbienceProvider>
  )
}

export function LabProviders({ children }: { children: React.ReactNode }) {
  return (
    <V2StoreProvider>
      <TooltipProvider delayDuration={300}>
        <TermsBoundary>{children}</TermsBoundary>
      </TooltipProvider>
    </V2StoreProvider>
  )
}

/**
 * Screens that call skillNoun() without the useTerms hook read the noun once per render; keying the tree on the noun makes
 * them all render again when Settings > Naming changes it, without a reload. The URL and the shared store are untouched.
 */
function TermsBoundary({ children }: { children: React.ReactNode }) {
  const terms = useTerms()
  return <React.Fragment key={`${terms.skillNoun}|${terms.skillNounPlural}`}>{children}</React.Fragment>
}

/**
 * `persona` picks the chrome (the persona of the rendered screen). `bar` is the lab bar. `title` names the screen in the
 * breadcrumb when the URL does not (the flow route); `navPersona` is the persona the breadcrumb names (the flow's persona).
 */
export function LabFrame({ persona, bar, title, navPersona, page = {}, children }: { persona: PersonaId; bar?: React.ReactNode; title?: string; navPersona?: PersonaId; page?: LabPage; children: React.ReactNode }) {
  const def = PERSONA_BY_ID[persona]
  const ctx = React.useMemo(() => ({ persona: navPersona ?? persona, title }), [navPersona, persona, title])
  return (
    <LabPageProvider page={page}>
    <FrameContext.Provider value={ctx}>
      {def.chrome === "shell" ? <ShellFrame persona={def} bar={bar}>{children}</ShellFrame> : <LightFrame bar={bar}>{children}</LightFrame>}
    </FrameContext.Provider>
    </LabPageProvider>
  )
}

export { LabIndexFrame } from "@/components/lab/light-frame"
