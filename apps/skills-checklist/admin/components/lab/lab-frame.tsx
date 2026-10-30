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
import { AppShellSlotsProvider, AppSidebar, SecondaryHubIconNavRow, SecondaryHubNavCompactShell, SecondaryHubNavRow, SecondaryPanel, SecondaryPanelProvider, SidebarShell, useSecondaryHubNavChrome, useSecondaryPanel, type AppShellData, type AppShellRoutePolicy, type AppShellSlots, type SecondaryPanelSpec, type ShellNav } from "@exxatdesignux/ui/components/shell"
import { ResizablePanel, ResizablePanelGroup } from "@exxatdesignux/ui/components/ui/resizable"
import { SKILLS_PANEL, SKILLS_PANEL_ID, isSettingsArea, settingsHref, settingsLeaf, skillsLabel, skillsPanelHref, skillsPanelItemFor } from "@/lib/lab/admin-ia"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@exxatdesignux/ui/components/ui/breadcrumb"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { ProductSwitcher } from "@/components/shell/product-switcher"
import { PersonaSwitcher } from "@/components/lab/lab-bar/persona-switcher"
import { LabPageProvider, useLabHref, useLabLinkContext, type LabPage } from "@/components/lab/lab-bar/page-context"
import { FROM_PARAM, LEAF_TITLE, returnTarget } from "@/lib/lab/return-to"
import { SCOPE_CARRY, labHref, navHref } from "@/lib/lab/links"
import { findFlow } from "@/lib/lab/flows"
import { usePresent } from "@/components/lab/lab-bar/present"
import { WalkthroughControls } from "@/components/lab/lab-bar/walkthrough-controls"
import { useTerms } from "@/components/lab/library/use-terms"
import { withNoun } from "@/lib/lab/terms"
import { V2StoreProvider, useV2State } from "@/lib/v2/react"
import { approvalsBadgeCount } from "@/lib/v2/approvals"
import { parseScope } from "@/lib/lab/scope"
import { PERSONAS, PERSONA_BY_ID, crumbParentFor, isPersonaId, type PersonaDef } from "@/lib/lab/personas"
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
    const pathname = usePathname() ?? ""
    // The program's noun ("Skills", "Competencies", "EPAs") names a row: re-render the rows when it changes.
    const terms = useTerms()
    return React.useMemo(() => {
      const rows = persona.nav?.() ?? []
      const admin = persona.id === "admin"
      // On a Skills panel page (Library, Groups of skills, Categories and tags, Course mapping) the Skills row points at the
      // page itself, so the DS lights it by path and a click on it reopens the panel instead of leaving (D-L20).
      const onPanelPage = admin && !!skillsPanelItemFor(link.screen, params)
      // The DS sidebar matches the active row by path and compares the whole url, query included, so a row url carries no
      // query; the set and scope ride along at click time (SidebarCarry below).
      const rowUrl = (slug: string) => {
        const screen = `${persona.id}/${slug}`
        const url = !link.onFlowRoute && link.screen === screen ? labHref(screen, {}, link) : navHref(screen, link)
        return url.split("?")[0]!
      }
      const primary = rows.map((r) => {
        const skills = admin && r.key === "skills"
        return {
          key: `lab-${persona.id}-${r.key}`,
          title: r.title,
          url: skills && onPanelPage ? pathname : rowUrl(r.slug),
          icon: icon(r.icon),
          iconActive: icon(r.icon, true),
          ...(skills ? { secondaryPanel: SKILLS_PANEL_ID } : {}),
          // A string badge renders the DS neutral (primary) Badge; a number renders the destructive red chip, which breaks the
          // amber-not-red rule for a count that is not an error. DS gap raised in docs/knowledge/design/visual-language.md.
          ...(r.badge === "approvals" && approvals > 0 ? { badge: String(approvals) } : {}),
        }
      })
      // Settings is not a main row (D-L20): program settings, naming and the evaluator directory. The DS shell (1.6.5) draws no
      // sidebar footer in any layout (showsProfileInSidebar is false), so it sits in the DS trailing group (primaryLayout
      // epilogue) after the main rows. On a Settings page it points at the page itself, so the DS lights it by path.
      const settingsRows = admin
        ? [{ key: "lab-admin-settings", title: "Settings", url: isSettingsArea(link.screen, params) ? pathname : settingsHref(link), icon: icon("gear"), iconActive: icon("gear", true) }]
        : []
      const all = [...primary, ...settingsRows]
      return { primary: all, primaryLayout: { preamble: primary, sections: [], epilogue: settingsRows }, quickActions: [], documents: [], secondary: [], user: { name: persona.label, email: "", avatar: "" }, knownUrls: all.map((p) => p.url.split("?")[0]!) }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approvals, link, pathname, terms.skillNoun, terms.skillNounPlural])
  }
  return { useNav }
}

const DATA = Object.fromEntries(PERSONAS.filter((p) => p.chrome === "shell").map((p) => [p.id, makeData(p)])) as Record<string, AppShellData>
const SLOTS: AppShellSlots = {}
const ROUTES: AppShellRoutePolicy = {}
const ON = {}

/** What the frame knows about the page, for the breadcrumb (the flow route has no persona or screen segment). */
const FrameContext = React.createContext<{ persona?: PersonaId; title?: string }>({})

/**
 * The page's own h1, kept in step with the page (a drill list is titled by what it lists, and that title follows the URL), so the
 * crumb leaf and the h1 always agree. Reads the single scrollport only; null until the page has rendered its heading.
 */
function usePageHeading(on: boolean): string | undefined {
  const [text, setText] = React.useState<string | undefined>(undefined)
  React.useEffect(() => {
    if (!on) { setText(undefined); return }
    const root = document.querySelector("[data-page-scroll]") ?? document.querySelector("main")
    if (!root) return
    const read = () => {
      const h1 = root.querySelector("h1")
      const next = h1?.textContent?.replace(/\s+/g, " ").trim() || undefined
      setText((prev) => (prev === next ? prev : next))
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(root, { subtree: true, childList: true, characterData: true })
    return () => mo.disconnect()
  }, [on])
  return on ? text : undefined
}

function Crumbs() {
  const pathname = usePathname() ?? ""
  const ctx = React.useContext(FrameContext)
  const [, , seg, screen] = pathname.split("/")
  const persona = ctx.persona ?? (isPersonaId(seg ?? "") ? (seg as PersonaId) : undefined)
  const title = ctx.title ?? (seg && screen ? findScreen(seg, screen)?.title : undefined)
  const { present } = usePresent()
  const params = useSearchParams()
  const link = useLabLinkContext()
  const to = useLabHref()
  // A page opened from another page (Skills > More > Bulk upload) carries ?from=: its crumb leads back, set-aware, and the
  // leaf is the page's own title so the crumb and the H1 agree (Romit 2026-10-27).
  const state = useV2State()
  const back = returnTarget(params?.get(FROM_PARAM))
  const leaf = back && link.screen ? LEAF_TITLE[link.screen]?.() : undefined
  // Present mode shows no lab label: product crumbs only.
  const crumbs: Array<{ label: string; href?: string }> = present ? [] : [{ label: "Design lab", href: "/lab" }]
  if (persona && !present) crumbs.push({ label: PERSONA_BY_ID[persona].label })
  if (back) crumbs.push({ label: back.label(), href: to(back.href) })
  // The course view (My progress with ?course=) is its own place: "My progress > NURS 350" (Romit 2026-10-27, "why does the
  // dropdown change when I am changing a course on My progress?"). Product words, so it shows in present mode too.
  const courseId = link.screen === "student/home" ? params?.get("course") : null
  const course = courseId ? state.courses?.find((c) => c.id === courseId) : undefined
  if (course) crumbs.push({ label: "My progress", href: navHref("student/home", link) })
  // Admin pages under the Skills panel read "Skills > {panel label}" and pages under the Settings footer link read
  // "Settings > {section}" (D-L20). The library is the Skills root, so it reads "Skills". The assign step keeps its step words.
  // Product words, so they show in present mode too.
  const admin = persona === "admin"
  const panelItem = admin && !back ? skillsPanelItemFor(link.screen, params) : undefined
  const settingsLeafLabel = admin && !back && isSettingsArea(link.screen, params) ? settingsLeaf(link.screen, params) : undefined
  let groupLeaf: string | undefined
  if (panelItem) {
    const libraryHref = navHref("admin/skills-library", link)
    if (panelItem.key === "library") groupLeaf = skillsLabel()
    else {
      crumbs.push({ label: skillsLabel(), href: libraryHref })
      groupLeaf = params?.get("view") === "assign" && title ? withNoun(title) : panelItem.label()
    }
  } else if (settingsLeafLabel) {
    crumbs.push({ label: "Settings", href: settingsHref(link) })
    groupLeaf = settingsLeafLabel
  }
  // A page below a nav row reads "{row} > {page}" (lib/lab/personas.ts CRUMB_PARENTS): Approvals > Submission, Students >
  // Student record, Dashboard > {drill title}. The parent links back with the scope; a drill on the dashboard URL drops only its
  // own params. Product words, so it shows in present mode too (anatomy A3, 2026-10-30).
  const parent = !back && !panelItem && !settingsLeafLabel ? crumbParentFor(link.screen, params) : undefined
  const heading = usePageHeading(parent?.leaf === "heading")
  if (parent) {
    const href = parent.drop && parent.parent === link.screen
      ? labHref(parent.parent, Object.fromEntries(parent.drop.map((k) => [k, null])), link)
      : navHref(parent.parent, link)
    crumbs.push({ label: parent.label, href })
  }
  const parentLeaf = parent?.leaf === "heading" ? heading : undefined
  const leafLabel = course ? course.code : parentLeaf ?? groupLeaf ?? leaf ?? (title ? withNoun(title) : undefined)
  if (leafLabel) crumbs.push({ label: leafLabel })
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
      {/* A walkthrough step in present mode: the presenter control, at the end of the bar (renders nothing otherwise). */}
      <WalkthroughControls />
    </nav>
  )
}

/**
 * Sidebar rows have bare urls (so the DS can highlight them by path); a click adds the active option set and the scope, so
 * the next page opens in the same design. Modified clicks (new tab) keep the default, and the flow route restores the set
 * from the session there.
 */
export function SidebarCarry() {
  const router = useRouter()
  const link = useLabLinkContext()
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a[data-sidebar=menu-button]") as HTMLAnchorElement | null
      const href = a?.getAttribute("href")
      if (!a || !href || !href.startsWith("/lab/") || href.includes("?")) return
      // A row that points at the page itself (Skills on a Skills panel page, Settings on a Settings page) stays put and keeps
      // the page's query; the DS still gets the click, so the Skills row reopens its panel (D-L20).
      if (href === window.location.pathname) { e.preventDefault(); return }
      const q = new URLSearchParams()
      for (const k of SCOPE_CARRY) { const v = link.carry?.get(k); if (v) q.set(k, v) }
      // Only a set the target flow has; otherwise the flow opens in its recommended set.
      const target = findFlow(href.split("/")[3])
      if (link.set && (!target || target.sets.some((x) => x.id === link.set))) q.set("set", link.set)
      const s = q.toString()
      if (!s) return
      // preventDefault only: Next's Link skips its own navigation, but the DS row still gets the click, so it closes the
      // phone / high-zoom flyout and drops a secondary panel it is leaving. A stopPropagation here (capture phase, on document)
      // kept React from ever seeing the click, which left the flyout open over the next page (2026-10-27).
      e.preventDefault()
      router.push(`${href}?${s}`)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [link, router])
  return null
}

/**
 * Each lab page mounts its own shell, so a page change remounts the DS SidebarProvider. On a phone (or at high zoom) the
 * first client render already knows it is a flyout, so the DS's "start closed when entering flyout" step never runs and
 * `defaultOpen` left the navigation sheet open over every new page. Start closed here; the trigger opens it.
 */
export function FlyoutStartsClosed() {
  const { isNavFlyout, open, setOpen } = useSidebar()
  const done = React.useRef(false)
  React.useLayoutEffect(() => {
    if (done.current) return
    done.current = true
    if (isNavFlyout && open) setOpen(false, { persist: false })
  }, [isNavFlyout, open, setOpen])
  return null
}

/**
 * The Skills panel (D-L20): the DS SecondaryPanel body, built from the DS hub-nav rows. Expanded it lists the four places with
 * labels; on the compact icon rail it shows the same rows as icons. The current page's row is selected.
 */
function SkillsPanelBody() {
  const link = useLabLinkContext()
  const params = useSearchParams()
  const { showCompactRail, openPanel } = useSecondaryHubNavChrome()
  useTerms()
  const current = skillsPanelItemFor(link.screen, params)?.key
  const items = SKILLS_PANEL.map((i) => ({ key: i.key, label: i.label(), icon: i.icon, href: skillsPanelHref(i, link), active: i.key === current }))
  if (showCompactRail) {
    return (
      <SecondaryHubNavCompactShell ariaLabel={skillsLabel()} panelId={SKILLS_PANEL_ID}>
        {items.map((i) => <SecondaryHubIconNavRow key={i.key} href={i.href} active={i.active} iconClass={i.icon} label={i.label} onClick={() => openPanel(SKILLS_PANEL_ID)} />)}
      </SecondaryHubNavCompactShell>
    )
  }
  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label={skillsLabel()} data-skills-panel>
      <ul className="space-y-0.5">
        {items.map((i) => <SecondaryHubNavRow key={i.key} href={i.href} active={i.active} iconClass={i.icon} label={i.label} />)}
      </ul>
    </nav>
  )
}

/** Leaving the Skills panel by a DS row click closes it with the rail as it was (collapsed); give the reader their rail back. */
function RestoreRailOnPanelClose() {
  const { activePanel } = useSecondaryPanel()
  const { restoreSavedOpen } = useSidebar()
  const prev = React.useRef(activePanel)
  React.useEffect(() => {
    if (prev.current && !activePanel) restoreSavedOpen()
    prev.current = activePanel
  }, [activePanel, restoreSavedOpen])
  return null
}

/** The admin shell's slots: the Skills panel, mounted on the panel pages only (the URL is the source of truth). */
function useAdminSlots(on: boolean): AppShellSlots {
  const terms = useTerms()
  return React.useMemo<AppShellSlots>(() => {
    const spec: SecondaryPanelSpec = { id: SKILLS_PANEL_ID, title: skillsLabel(), Body: SkillsPanelBody, flyoutRoute: () => on, autoOpen: () => on }
    return { secondaryPanels: [spec] }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terms: the panel title is the program's noun
  }, [on, terms.skillNounPlural])
}

const ADMIN_ROUTES: AppShellRoutePolicy = { mainSidebarOnPanelClose: () => "restore" }

function ShellFrame({ persona, bar, children }: { persona: PersonaDef; bar?: React.ReactNode; children: React.ReactNode }) {
  return persona.id === "admin" ? <AdminShellFrame persona={persona} bar={bar}>{children}</AdminShellFrame> : <PlainShellFrame persona={persona} bar={bar}>{children}</PlainShellFrame>
}

/**
 * The admin shell: the same DS base shell plus the DS SecondaryPanel beside the sidebar for the Skills row (D-L20), wired as
 * the DS generated starter does (SecondaryPanelProvider around the sidebar and a ResizablePanelGroup with the panel and the
 * main column).
 */
function AdminShellFrame({ persona, bar, children }: { persona: PersonaDef; bar?: React.ReactNode; children: React.ReactNode }) {
  const link = useLabLinkContext()
  const params = useSearchParams()
  const panelPage = !!skillsPanelItemFor(link.screen, params)
  const slots = useAdminSlots(panelPage)
  return (
    <LeoAmbienceProvider>
      <SidebarCarry />
      <AppShellSlotsProvider slots={slots} on={ON} routes={ADMIN_ROUTES} data={DATA[persona.id]}>
        <SidebarShell defaultOpen wrapperClassName="flex h-dvh min-h-0 w-full flex-col overflow-hidden" data-shell-utility-bar-full="true">
          <FlyoutStartsClosed />
          <LabUtilityBar />
          <div data-app-shell-row="" className="relative z-40 flex min-h-0 w-full min-w-0 flex-1 items-stretch overflow-visible has-data-[variant=inset]:bg-sidebar">
            <SecondaryPanelProvider>
              <RestoreRailOnPanelClose />
              <AppSidebar variant="sidebar" />
              <ResizablePanelGroup id="lab-shell-workspace" orientation="horizontal" className="min-h-0 min-w-0 flex-1">
                <SecondaryPanel />
                <ResizablePanel id="shell-main" minSize="30%" className="relative z-0 min-h-0 min-w-0">
                  <SidebarInset aria-label="Main content" className="h-full min-h-0 min-w-0">
                    {bar}
                    <div data-page-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
                  </SidebarInset>
                </ResizablePanel>
              </ResizablePanelGroup>
            </SecondaryPanelProvider>
          </div>
        </SidebarShell>
      </AppShellSlotsProvider>
    </LeoAmbienceProvider>
  )
}

function PlainShellFrame({ persona, bar, children }: { persona: PersonaDef; bar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <LeoAmbienceProvider>
      <SidebarCarry />
      <AppShellSlotsProvider slots={SLOTS} on={ON} routes={ROUTES} data={DATA[persona.id]}>
        <SidebarShell defaultOpen wrapperClassName="flex h-dvh min-h-0 w-full flex-col overflow-hidden" data-shell-utility-bar-full="true">
          <FlyoutStartsClosed />
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
