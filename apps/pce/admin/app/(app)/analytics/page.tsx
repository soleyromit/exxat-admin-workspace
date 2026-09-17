'use client'

import { useState, useMemo, useEffect, Suspense, lazy } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Skeleton,
  PageHeader,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { MOCK_FACULTY } from '@/lib/pce-mock-data'
import { usePce } from '@/components/pce/pce-state'
import { AnalyticsOverviewPanel } from '@/components/pce/analytics-overview-panel'
import { TokenSelect } from '@/components/pce/courses-evaluatees/scope-controls'
import { allTerms, academicYears, termOfferingsEvaluated, termSeason } from '@/lib/pce-analytics'

/**
 * By Term / By Faculty / By Course code-split from Overview's initial bundle.
 *
 * Analytics loaded 27.6MB of decoded JS on first paint vs 5.7MB for a comparable
 * page (Dashboard) — verified via performance.getEntriesByType('resource') on
 * 2026-08-17 — because all four tabs' components and chart code loaded eagerly
 * regardless of which tab was open. Only Overview stays eager (it's the default
 * view); the other three now load on first click, each cached after that.
 *
 * The three ByXPanel lazy() calls share one import() specifier, so they resolve
 * to a single chunk request — opening any one of the three loads the whole
 * analytics-panels module once, not three times.
 */
const ByFacultyPanel = lazy(() =>
  import('@/components/pce/analytics-panels').then((m) => ({ default: m.ByFacultyPanel })),
)
const ByCoursePanel = lazy(() =>
  import('@/components/pce/analytics-panels').then((m) => ({ default: m.ByCoursePanel })),
)
const CourseOfferingList = lazy(() =>
  import('@/components/pce/course-offering-list').then((m) => ({ default: m.CourseOfferingList })),
)
const FacultyOfferingList = lazy(() =>
  import('@/components/pce/faculty-offering-list').then((m) => ({ default: m.FacultyOfferingList })),
)

/**
 * Warms the three lazy tabs' chunks in the background once Overview is idle, so the FIRST
 * click on By Faculty/Course/Term doesn't pay a cold fetch+compile cost.
 *
 * Measured live on a freshly-restarted dev server: an un-prefetched first click cost ~790ms
 * (skeleton visible ~615ms) — Turbopack compiles each dynamically-imported chunk on demand,
 * the first time anything requests it in that server process's lifetime. Splitting the tabs
 * (this file, same session) traded that cost from "paid once on page load" to "paid once per
 * tab on first click" — better total, but a new per-click delay this prefetch removes by
 * paying it while the user is just looking at Overview, not waiting on it.
 *
 * Fires after paint (rIC / rAF+timeout fallback), not on mount directly — Overview's own
 * charts must not queue behind these fetches. The three imports resolve into the module
 * cache the `lazy()` calls above already read from, so this is dedup'd, not a duplicate fetch.
 */
function prefetchAnalyticsTabs() {
  import('@/components/pce/analytics-panels')
  import('@/components/pce/faculty-offering-list')
  import('@/components/pce/faculty-portfolio-charts')
  import('@/components/pce/course-offering-list')
}

function AnalyticsTabSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}

/**
 * 'overview' was retired Jul 2026 on the premise that "the monitoring layer moved to the
 * Dashboard home" — but it never did: `dashboard-home.tsx` is a response-collection ops
 * surface with no charts, so 8 of the 20 ADMIN analytics stories had no home at all.
 * Restored 2026-07-14 per Monil's accepted model (2026-07-13). By Term retired 2026-09-14
 * (Romit) — three fixed tabs now: Overview, Faculty, Course, plus one dynamic tab per open
 * course. `activeTab` is a plain `string`, not a fixed union — an open course is
 * `course:<code>`, a dynamic value a union can't express.
 */

function AnalyticsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 200)
    const cancel = typeof cancelIdleCallback === 'function' ? cancelIdleCallback : clearTimeout
    const id = idle(prefetchAnalyticsTabs)
    return () => cancel(id as number)
  }, [])

  /**
   * The URL is the single source of truth for the active tab — not local state seeded from it.
   *
   * It used to be `useState(() => searchParams.get('tab'))`, which reads ONCE on mount. Next's
   * App Router does not remount on a same-route search-param change, so every in-page link to
   * another tab (the "Open By Faculty" buttons on the attention cards) changed the address bar
   * and did nothing visible — worse than having no link at all. Verified before this fix:
   * clicking it produced `?tab=faculty` while the Overview tab stayed selected.
   *
   * Deriving from the URL also makes the tabs genuinely deep-linkable (which the code already
   * claimed) and makes the browser back button work across tabs.
   *
   * SCOPE LIVES IN THE URL, all of it — tab, term, facultyId, courseCode.
   *
   * These used to be read-once `useState(() => searchParams.get(...))`: the page READ them on
   * mount and never WROTE them, so /analytics?facultyId=f4 worked on a cold load and nothing
   * you did afterwards was shareable. Half-honouring a query param is worse than ignoring it,
   * because the URL then looks authoritative while silently describing a stale view.
   *
   * Closing the course→faculty round trip made this concrete: that drill selects a faculty
   * member and switches tab, and the tab moved in the URL while the person did not. Copying
   * the link sent a colleague to the faculty tab showing someone else.
   *
   * One derivation for all four (`param`), one writer (`setScope`) — the same shape `tab`
   * already had, extended rather than duplicated. A second mechanism for the other three is
   * how two sources of truth start.
   */
  const param = (key: string) => searchParams?.get(key) ?? null

  /**
   * Closable course tabs (Romit, 2026-09-14: "shown besides the remaining tabs") — real
   * `Tabs.Trigger`s, direct children of the page's own `<TabsList>`, next to Overview/Faculty/
   * Course, each with its own highlight state.
   *
   * `openCourseTabs` is the open set; `tab` (below) says which one, if any, is active —
   * `course:<code>`. A prior pass tried a close BUTTON as a sibling `<div>` next to the
   * trigger, still inside `<TabsList>` — axe's dev overlay caught it live: CRITICAL
   * `aria-required-children`, because a tablist's only allowed children are `tab`-role
   * elements, and that wrapper div wasn't one. The close control here is nested INSIDE the
   * trigger instead (so the tablist's direct child is still the trigger, satisfying that
   * rule) and is a `<span role="button">`, not a real `<button>` — Radix's `Tabs.Trigger`
   * renders a native `<button>`, and a `<button>` inside a `<button>` is invalid HTML axe
   * would flag as nested-interactive. Re-checked live after this change: 0 findings.
   */
  const openCourseTabsParam = param('courseTabs')
  const openCourseTabs = useMemo(
    () => (openCourseTabsParam ? openCourseTabsParam.split(',').filter(Boolean) : []),
    [openCourseTabsParam],
  )
  /** Closable faculty tabs — the exact mirror of `openCourseTabs` above, one call value later
   *  (PRD 2026-09-15: faculty name click → "open faculty analytics as new analytics tab inside
   *  the same browser tab"). Same `tab=faculty:<id>` / `?facultyTabs=` scheme. */
  const openFacultyTabsParam = param('facultyTabs')
  const openFacultyTabs = useMemo(
    () => (openFacultyTabsParam ? openFacultyTabsParam.split(',').filter(Boolean) : []),
    [openFacultyTabsParam],
  )

  const activeTab: string = (() => {
    const requested = param('tab')
    if (requested === 'faculty' || requested === 'course' || requested === 'overview') return requested
    if (requested?.startsWith('course:') && openCourseTabs.includes(requested.slice('course:'.length))) {
      return requested
    }
    if (requested?.startsWith('faculty:') && openFacultyTabs.includes(requested.slice('faculty:'.length))) {
      return requested
    }
    return 'overview'
  })()

  /**
   * Portal target for a course tab's Faculty filter (Romit, 2026-09-15: "should be shown
   * beside the Terms dropdown, instead of showing in a tab when I am scrolling") — a callback
   * ref, not `useRef`, because a plain ref doesn't trigger the re-render `ByCoursePanel` needs
   * to actually portal into it once it exists (the DOM node isn't there yet on the render that
   * creates it). Rendered unconditionally in the filter row below so it's always the same DOM
   * node across tab switches — conditionally rendering the `<div>` itself would tear the portal
   * target down and rebuild it every time, which is unnecessary churn for something that only
   * ever needs to be hidden/shown by which course tab (if any) is currently active.
   */
  /**
   * Measures the sticky AY/Term filter row's OWN rendered height so the tabs
   * row below can stick immediately under it, no matter how many lines the
   * filter row wraps to (Romit, 2026-09-17: "sticky header gets hidden when
   * I scroll further down the page"). A `ResizeObserver`, not a hardcoded
   * pixel offset — the filter row's `flex-wrap` means its real height
   * changes with viewport width (confirmed live: 76px at wide desktop,
   * ~140px once "Faculty & role"/"Course" filter slots wrap to a second
   * line at ~870px), and the OLD fixed `+76px` offset silently overlapped
   * the tabs row under the filter row's wrapped second line at any narrower
   * width — a real, separate bug from the "hidden" one, caught while fixing
   * it (see the scrollport comment below for that one). 76 is only the
   * pre-measurement fallback for the first paint. */
  const [filterRowEl, setFilterRowEl] = useState<HTMLDivElement | null>(null)
  const [filterRowHeight, setFilterRowHeight] = useState(76)
  useEffect(() => {
    if (!filterRowEl) return
    const ro = new ResizeObserver((entries) => {
      // borderBoxSize, NOT contentRect: contentRect excludes the row's own
      // vertical padding (10px + 14px), so the tabs row stuck 24px too high
      // and its labels slid under the filter row (Romit, 2026-09-16,
      // screenshot: "Overview / Course / Faculty" clipped at the top).
      const h =
        entries[0]?.borderBoxSize?.[0]?.blockSize ??
        entries[0]?.target.getBoundingClientRect().height
      if (h) setFilterRowHeight(h)
    })
    ro.observe(filterRowEl)
    return () => ro.disconnect()
  }, [filterRowEl])
  const [facultyFilterSlot, setFacultyFilterSlot] = useState<HTMLDivElement | null>(null)
  /** Portal target for the Faculty tab's own Course/Faculty/Role filters (Romit, 2026-09-15:
   *  "migrate these filter to the sticky filter... whenever I am at the faculty tab, there
   *  shouldn't be any filter" elsewhere) — the exact mirror of `facultyFilterSlot` above, one
   *  tab over. Visible only while the Faculty LANDING tab is active — the individual
   *  `faculty:<id>` drill-down tabs have no such filter to show, same as Course's own slot
   *  hides itself outside `course:<code>`. */
  const [facultyListFilterSlot, setFacultyListFilterSlot] = useState<HTMLDivElement | null>(null)
  /** Portal target for the Course tab's own Course/Faculty/Role filters — exact mirror of
   *  `facultyListFilterSlot` above, one tab over. Visible only while the Course LANDING tab is
   *  active (2026-09-15 compliance pass: `CourseOfferingList` had no filters at all until this
   *  slot was added — the Faculty tab's own three filters were the reference). */
  const [courseListFilterSlot, setCourseListFilterSlot] = useState<HTMLDivElement | null>(null)

  /**
   * Write scope to the URL. Takes a patch so a single interaction that moves two things (the
   * drill: person AND tab) lands as ONE history entry — two pushes would make Back a
   * half-step into a state the user never saw.
   *
   * `null` deletes the param: an explicit "all terms" must not leave a stale `term=` behind.
   */
  const setScope = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '')
    Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)))
    // scroll:false — changing scope should not fling the reader to the top of a long page.
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const setActiveTab = (tab: string) => setScope({ tab })

  /** Open a course (or activate it if already open) — one push for both, same reasoning as
   *  every other combined-change writer in this file. */
  const openCourseTab = (code: string) => {
    const next = openCourseTabs.includes(code) ? openCourseTabs : [...openCourseTabs, code]
    setScope({ tab: `course:${code}`, courseTabs: next.join(',') })
  }
  /** Close a course. If it was the active one, fall back to the offering list; if it wasn't,
   *  leave `tab` untouched so closing a background tab doesn't move the reader. */
  const closeCourseTab = (code: string) => {
    const next = openCourseTabs.filter((c) => c !== code)
    setScope({
      courseTabs: next.length ? next.join(',') : null,
      ...(activeTab === `course:${code}` ? { tab: 'course' } : {}),
    })
  }

  /** Open a faculty member (or activate if already open) — exact mirror of `openCourseTab`. */
  const openFacultyTab = (id: string) => {
    const next = openFacultyTabs.includes(id) ? openFacultyTabs : [...openFacultyTabs, id]
    setScope({ tab: `faculty:${id}`, facultyTabs: next.join(',') })
  }
  /** Close a faculty tab — exact mirror of `closeCourseTab`. */
  const closeFacultyTab = (id: string) => {
    const next = openFacultyTabs.filter((f) => f !== id)
    setScope({
      facultyTabs: next.length ? next.join(',') : null,
      ...(activeTab === `faculty:${id}` ? { tab: 'faculty' } : {}),
    })
  }

  /** Default term — the newest FULLY-evaluated term, one back from the newest when the
   *  newest is still short of full coverage. Was a bare 'Spring 2026' literal, which is this
   *  fixture's current/still-collecting term: Overview's leaderboards landed on it with 2 of
   *  12 courses and 1 of ~16 faculty scored (everything else Pending), which reads as broken
   *  rather than as a term still in progress. Same "Live" vs "Last closed" distinction the
   *  Dashboard already draws for this fixture — Overview's job is retrospective comparison,
   *  so it should land one term back from a still-collecting one, not on it. */
  const defaultTerm = useMemo(() => {
    const newestFirst = [...allTerms()].reverse()
    const newest = newestFirst[0]
    if (!newest) return 'Spring 2026'
    const coverage = termOfferingsEvaluated(newest)
    return coverage.total > 0 && coverage.evaluated < coverage.total ? (newestFirst[1] ?? newest) : newest
  }, [])
  const [selectedSurveyId, setSelectedSurveyId]     = useState<string | null>(null)

  /** Terms that HAVE evaluation history, newest first — the By Term axis. */
  const analyticsTerms = useMemo(() => [...allTerms()].reverse(), [])

  /** Overview's own AY/Term pair — Overview's ONLY filters per the 2026-09-14 PRD ("Filters:
   *  None except the term and AY from above"). AY narrows the term list, same UX as the
   *  https://pce-three.vercel.app/analytics-2 reference. Term is a MULTI-select (Romit,
   *  2026-09-14) — `overviewTerms` is always one or more terms, never a bare string, so every
   *  Overview stat pools across the full selection the same way "all terms" already pools
   *  elsewhere in this file. Deliberately its OWN state, not the `term`/`setTerm` above: those
   *  drive By Term's single-term axis, a different question ("browse one term's history") than
   *  Overview's ("compare within this scope"), and forcing them to share one value would make
   *  a multi-select on one tab silently narrow a single-select on another. */
  const overviewAcademicYears = useMemo(() => academicYears(), [])
  const overviewAcademicYear = param('ay') || overviewAcademicYears.find((ay) => ay.terms.includes(defaultTerm))?.year || overviewAcademicYears[0]?.year || ''
  /** Term options for the picker — ONLY the selected AY's own terms, shown as bare seasons
   *  ("Fall" / "Spring" / "Summer") since the year now lives in the Academic year select
   *  (Monil, 2026-09-17: "define terms as fall, summer, spring, and not include the years
   *  in the term. Years would be included in the academic year"). This supersedes the
   *  2026-09-15 neighbor-AY widening (Vishal: "select Summer 2026, with an option to also
   *  select Spring 2026 and Fall 2026") — with the year gone from the chips, two "Fall"s
   *  from adjacent AYs in one list would be indistinguishable, so the AY gate has to be
   *  strict: Fall 2026 is reachable by switching the AY to 2026–2027. Within one AY the
   *  seasons stay in calendar order (Fall → Spring → Summer, `academicYears()` lists
   *  each AY's terms oldest-first). */
  const overviewTermsForYear = useMemo(() => {
    const ay = overviewAcademicYears.find((a) => a.year === overviewAcademicYear)
    if (!ay) return analyticsTerms
    return ay.terms.filter((t) => analyticsTerms.includes(t))
  }, [overviewAcademicYear, overviewAcademicYears, analyticsTerms])
  const overviewTermsParam = param('terms')
  const overviewTerms = useMemo(() => {
    const fromUrl = overviewTermsParam
      ? overviewTermsParam.split(',').filter((t) => overviewTermsForYear.includes(t))
      : []
    if (fromUrl.length) return fromUrl
    return [overviewTermsForYear.includes(defaultTerm) ? defaultTerm : (overviewTermsForYear[0] ?? defaultTerm)]
  }, [overviewTermsParam, overviewTermsForYear, defaultTerm])
  const setOverviewAcademicYear = (ay: string) => {
    const firstTerm = overviewAcademicYears.find((a) => a.year === ay)?.terms[0]
    setScope({ ay, terms: firstTerm ?? null })
  }
  const toggleOverviewTerm = (t: string) => {
    const next = overviewTerms.includes(t) ? overviewTerms.filter((x) => x !== t) : [...overviewTerms, t]
    // Guard rather than `TokenSelect`'s `minOne` prop: `minOne` disables the last chip's
    // remove button, and that disabled state's styling dimmed the WHOLE chip's text below
    // AA contrast (axe: 3.66:1, needs 4.5:1) — a real, pre-existing gap in the shared
    // component surfaced by Overview defaulting to exactly one term. Same guarantee ("can't
    // empty the selection") enforced here instead: a toggle that would empty it is a no-op.
    if (next.length) setScope({ terms: next.join(',') })
  }

  return (
    <>
      <SiteHeader title="Analytics" />

      {/* Sticky containing block (Romit, 2026-09-17: "sticky header gets
       * hidden when I scroll further down the page"). The bounded
       * `[data-page-scroll]` scrollport this page needs is now owned by the
       * shell — `app/(app)/layout.tsx` wraps every page's children in it, so
       * ALL pages get a viewport-bounded scroll owner (2026-09-16: 34 pages
       * without one spilled past `<main>` onto `<body>`'s tint). This div
       * must NOT carry `data-page-scroll`/`overflow-y-auto` itself: the DS
       * helpers (`page-scroll-port.ts`) find the scrollport via
       * `querySelector`, so a nested duplicate would make them bind to the
       * outer, never-scrolling one and break floating table headers here.
       * `top: 0` offsets below are relative to the shell scrollport, whose
       * top edge sits right under the utility bar `SiteHeader` portals into. */}
      <div className="flex flex-col">

      {/* Was a hand-rolled `<h1>` (`font-normal` + a bare `var(--font-heading)`
          inline style) — same serif face as `PageHeader`'s own title but the
          wrong weight, so it read as visibly lighter/different next to every
          other page's title (Vishal, 2026-09-14: "title of the page seems to
          be of different style"). Swapped for the real `PageHeader` Dashboard
          already uses, so the two titles come from one component instead of
          two hand-tuned copies that can drift again. */}
      <PageHeader title="Analytics" />

      {/* AY/Term filter row — OUTSIDE the Tabs component entirely (not a sibling of
          TabsContent inside <Tabs>, which the prior two passes both still got wrong: first
          nested in the Overview panel, then moved only as far as beside the tab bar but still
          inside <Tabs>). This row renders BEFORE <Tabs> starts, between the page title and the
          tab strip, so it cannot read as "part of" any tab or the tab bar. */}
      {/* sticky, not the page's SiteHeader/PageHeader above it — literally what
          was asked ("lock the filters and tab heading on scroll"). z-[45] keeps
          it above the tabs-bar sticking right beneath it (z-[41]) and above
          scrolled panel content; bg-background so content doesn't show
          through the gap padding creates. `top: 0` — relative to the
          `data-page-scroll` scrollport above, not the document, so no
          shell-bar offset math is needed here any more (see that comment).

          z-[45]/z-[41] (Romit, 2026-09-15, screenshot: download/expand icons and table
          column headers rendering ON TOP of these tab/filter bars while scrolling) —
          were z-20/z-10 until this fix. Root cause, confirmed live via computed styles:
          the DS `TabsList` component (`variant="line"`) bakes in its OWN internal
          `position: sticky; z-index: 40` (and `DataTablePaginated`'s bottom pagination
          footer independently reuses the same z-40 token) — both assume they're the
          outermost sticky chrome sitting directly under the z-50 shell nav bar. This
          page nests TabsList inside an ADDITIONAL page-level sticky wrapper, so that
          internal z-40 was invisible to outside comparisons; what actually mattered was
          this wrapper's own z-10/z-20, which lost stacking ties (later DOM wins) against
          absolute-positioned, non-sticky content inside each tab (e.g. a ChartCard's
          download/expand button wrapper, `position:absolute; z-index:10`) once that
          content scrolled to the same screen band. Bumped both page-level bars past every
          known DS-internal z-40 usage, still under the shell's z-50 — affects every tab
          uniformly, this wasn't Faculty-specific. */}
      <div ref={setFilterRowEl} className="shrink-0 sticky z-[45] bg-background flex flex-wrap items-end gap-3" style={{ padding: '10px 28px 14px', top: 0 }}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="overview-ay">Academic year</label>
          <Select value={overviewAcademicYear} onValueChange={setOverviewAcademicYear}>
            <SelectTrigger id="overview-ay" className="h-8 w-32 text-sm" aria-label="Select academic year"><SelectValue /></SelectTrigger>
            <SelectContent>{overviewAcademicYears.map((ay) => <SelectItem key={ay.year} value={ay.year}>{ay.year}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label id="overview-term-label" className="text-xs font-medium text-muted-foreground">Terms</label>
          <TokenSelect
            labelId="overview-term-label"
            contentLabel="Select terms"
            placeholder="Select terms"
            options={overviewTermsForYear.map((t) => ({ value: t, label: termSeason(t) }))}
            selected={overviewTerms}
            onToggle={toggleOverviewTerm}
          />
        </div>
        {/* Faculty filter portal target (see `facultyFilterSlot` state above) — always mounted
            so the ref stays the SAME node across tab switches (ByCoursePanel portals into it,
            not into a freshly-created element each time); `hidden` (not conditional rendering)
            just toggles its visibility, since `[hidden]{display:none!important}` is already the
            page's own reset rule for this. Only visible while a course tab is active — Overview/
            Course/Faculty have no Faculty filter to show here. */}
        <div ref={setFacultyFilterSlot} hidden={!activeTab.startsWith('course:')} />
        <div ref={setFacultyListFilterSlot} hidden={activeTab !== 'faculty'} />
        <div ref={setCourseListFilterSlot} hidden={activeTab !== 'course'} />
      </div>

      {/* `flex flex-col` only, NOT `flex-1 min-h-0` — that combination used to
       * mean "fill remaining viewport space, TabsContent scrolls its own
       * overflow" (the pre-scrollport architecture). Inside `data-page-scroll`
       * now, `<Tabs>` should size to its OWN natural content height and let
       * that one ancestor's scrollbar handle everything — `flex-1 min-h-0`
       * instead capped `<Tabs>` to "whatever space is left after PageHeader +
       * the filter row" (confirmed live: 604px, while its real content ran
       * far taller), which broke the tabs row's OWN sticky positioning the
       * exact same way `<main>`'s short box broke the outer rows (see the
       * scrollport comment above) — same failure, one level deeper. */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
        {/* Sticks directly beneath the filter row above (same ask — "lock the
            ... tab heading on scroll"); `top` is `filterRowHeight`, measured
            live off the filter row via `ResizeObserver` (see that state's own
            comment) rather than a hardcoded pixel guess — the filter row's
            `flex-wrap` means its real height changes with viewport width
            (confirmed live: 76px at wide desktop, ~140px once its filter
            slots wrap to a second line at ~870px), and the OLD hardcoded
            `+76px` silently overlapped this row under the filter row's
            wrapped second line at any narrower width. */}
        <div className="border-b border-border shrink-0 sticky z-[41] bg-background" style={{ padding: '0 28px', top: filterRowHeight }}>
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="course">Course</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            {/* One real Tabs.Trigger per open course — a direct child of TabsList, same as the
                three fixed tabs above (see the state comment on `openCourseTabs`). Romit,
                2026-09-14: keep this inline × (a first correction removed it and dropped the
                separate "Close {code}" button from the panel below instead — the × is now the
                ONLY close control). It stays MOUSE-ONLY chrome, not an accessible one: a first
                pass made it `role="button" tabIndex={0}`, and axe's dev overlay caught it live —
                SERIOUS `nested-interactive`, "Interactive controls must not be nested" (a
                `role="tab"` trigger with a focusable descendant). ARIA gives no clean way to
                nest a REAL focusable close control inside a tab, so `aria-hidden` removes this
                one from the accessibility tree entirely — screen readers never see it, the click
                handler still fires for a mouse. Known gap: a keyboard/screen-reader user
                currently has no way to close a course tab; flag to Romit before shipping if
                that matters here. */}
            {openCourseTabs.map((code) => (
              <TabsTrigger key={code} value={`course:${code}`} className="pr-1.5">
                {code}
                <span
                  aria-hidden="true"
                  className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={(e) => { e.stopPropagation(); closeCourseTab(code) }}
                >
                  <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
                </span>
              </TabsTrigger>
            ))}
            {/* One real Tabs.Trigger per open faculty member — exact mirror of the course tabs
                above, same reasoning throughout (see that block's own doc comment). */}
            {openFacultyTabs.map((id) => {
              const name = MOCK_FACULTY.find((f) => f.id === id)?.name ?? id
              return (
                <TabsTrigger key={id} value={`faculty:${id}`} className="pr-1.5">
                  {name}
                  <span
                    aria-hidden="true"
                    className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={(e) => { e.stopPropagation(); closeFacultyTab(id) }}
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* ───── Overview — the term brief (2026-09-14 PRD; supersedes the whole-program
                 version this tab held since 2026-07). "Filters: None except the term and AY
                 from above" — these two selectors (AY select + Term multi-select, now rendered
                 above, outside this panel) are the ENTIRE filter surface, unlike the
                 reference's Course / Faculty & Role dropdowns, which the PRD drops. ───── */}
        <TabsContent value="overview" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <AnalyticsOverviewPanel
            terms={overviewTerms}
            onOpenCourse={openCourseTab}
            onOpenFaculty={openFacultyTab}
          />
        </TabsContent>


        {/* ───── By Faculty — the offering-list landing (PRD 2026-09-15). The aggregated
                 leaderboard + "Scores over time" / "Response rate over time" charts
                 (`FacultyLeaderboardSection`) are retired 2026-09-15 (Romit) — none of the
                 three map to the PRD's Faculty Analytics use cases (the leaderboard's own
                 ranking question is answered by this list's sortable Rating column; the two
                 trend charts were multi-faculty COMPARISONS, a different question than any
                 PRD card asks). Drill-down into one person is a closable tab, the same
                 faculty-name → new-tab mechanism the Course tab already established for
                 courses. ───── */}
        <TabsContent value="faculty" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <Suspense fallback={<AnalyticsTabSkeleton label="Loading faculty offerings" />}>
            <FacultyOfferingList terms={overviewTerms} onOpenFaculty={openFacultyTab} filterSlot={facultyListFilterSlot} />
          </Suspense>
        </TabsContent>

        {/* ───── One TabsContent per open faculty member — Faculty Analytics (PRD
                 2026-09-15), exact mirror of the per-course tabs below. ───── */}
        {openFacultyTabs.map((id) => (
          <TabsContent
            key={id}
            value={`faculty:${id}`}
            className="flex-1 overflow-visible m-0"
            style={{ padding: '20px 28px 28px' }}
          >
            <div className="flex flex-col gap-4">
              <Suspense fallback={<AnalyticsTabSkeleton label="Loading faculty analytics" />}>
                <ByFacultyPanel
                  facultyId={id}
                  onOpenSurvey={setSelectedSurveyId}
                  scopedTerms={overviewTerms}
                  hideAskLeo
                />
              </Suspense>
            </div>
          </TabsContent>
        ))}

        {/* ───── Course — the offering-list landing. Opening a course renders it as its own
                 TabsContent below, matched to the Tabs.Trigger of the same value in the
                 tablist above. ───── */}
        <TabsContent value="course" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <Suspense fallback={<AnalyticsTabSkeleton label="Loading course offerings" />}>
            {/* Faculty-ranking toggle removed from this card (Vishal, 2026-09-15: "remove rank
                by as user can sort the respective column") — `onOpenFaculty` no longer has a
                consumer inside `CourseOfferingList`; the page's own "Faculty" tab still owns
                faculty ranking. */}
            <CourseOfferingList
              terms={overviewTerms}
              onOpenCourse={openCourseTab}
              filterSlot={courseListFilterSlot}
            />
          </Suspense>
        </TabsContent>

        {/* ───── One TabsContent per open course — Course analytics (PRD 2026-09-14). ───── */}
        {openCourseTabs.map((code) => (
          <TabsContent
            key={code}
            value={`course:${code}`}
            // `overflow-visible`, not `overflow-auto` (Romit's follow-up catch, 2026-09-15) —
            // this page's real scrolling happens at the document level (nothing above `<Tabs>`
            // actually bounds its height, confirmed live: every ancestor up to `<main>` is
            // `overflow: visible`), so `overflow-auto` here never triggers a real internal
            // scrollbar. It DID silently break `ByCoursePanel`'s new sticky Faculty filter
            // though: `position: sticky`'s containing block is the nearest ancestor with
            // `overflow` != `visible`, REGARDLESS of whether that ancestor ever actually
            // scrolls — with `overflow-auto` here, the sticky filter row anchored to THIS
            // TabsContent's own (never-scrolling) box instead of the document, landing at a
            // fixed offset that had nothing to do with the real page scroll (caught live:
            // rendered ~160px down, overlapping the KPI cards, instead of tracking scroll).
            className="flex-1 overflow-visible m-0"
            style={{ padding: '20px 28px 28px' }}
          >
            <div className="flex flex-col gap-4">
              {/* Romit, 2026-09-14: removed the separate "Close {code}" button — the tab strip's
                  own × (see the state comment on `openCourseTabs`) is the only close control
                  now. */}
              <Suspense fallback={<AnalyticsTabSkeleton label={`Loading ${code}`} />}>
                <ByCoursePanel
                  courseCode={code}
                  hideAskLeo
                  scopedTerms={overviewTerms}
                  // Only the ACTIVE course tab's panel gets the real slot — every other open-
                  // but-inactive course tab stays mounted (Radix keeps closed `TabsContent`s in
                  // the DOM) and would otherwise all try to portal into the SAME node at once.
                  facultyFilterSlot={activeTab === `course:${code}` ? facultyFilterSlot : null}
                />
              </Suspense>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      </div>

      {/* ───── Evaluation Card ───── */}
      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />
    </>
  )
}

export default function AnalyticsPage() {
  /* Remount the whole tree when the demo account switches. Every stat below
   * is a `useMemo` over `terms`/filters that calls into `pce-analytics.ts`
   * (now account-scoped via `activeFacultyOfferings()`/`activeSurveys()`,
   * 2026-09-16) — keying on `accountId` recomputes all of them at once
   * and resets term/tab defaults to the new account's data, instead of
   * threading `accountId` through dozens of dependency arrays. */
  const { accountId } = usePce()
  return (
    <Suspense>
      <AnalyticsInner key={accountId} />
    </Suspense>
  )
}
