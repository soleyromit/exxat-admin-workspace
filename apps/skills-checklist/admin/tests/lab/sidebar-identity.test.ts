import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, renderHook } from "@testing-library/react"

/**
 * B.21 (granola 2026-10-26 item 21, Romit: "left nav consistent across variants"; Sankalp: "6 in the list, 3 in the bar").
 *
 * 1. Sidebar identity through the layout code path: LabFrame (the frame every lab screen and flow step renders in) is rendered
 *    for every variant of every screen of each shell persona, and for every step of that persona's flows in every option set.
 *    The sidebar rows (titles, in order) must be the same everywhere for that persona, and each row must open its own screen
 *    (the path may differ by design: a row opens its flow, carrying the page's set; on that screen's own URL it points at the
 *    page itself; either way it lands on the row's screen).
 * 2. Variant counts: the /lab index (components/lab/lab-index.tsx, "By persona" view) and the lab bar (useLabBar, the model
 *    LabBar renders) must count each screen's variants the same way: the index's "n in the sets, m more" equals the letters the
 *    bar's option sets reach plus its "More variants" list, for every screen.
 *
 * The browser crawl (scripts/lab-nav-crawl.mjs) checks the same identity on the live server; this pins it without one.
 */

const nav = vi.hoisted(() => ({ pathname: "/lab", search: "" }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { LabFrame, LabProviders } from "@/components/lab/lab-frame"
import { LabIndex } from "@/components/lab/lab-index"
import { useLabBar } from "@/components/lab/lab-bar/use-lab-bar"
import { PERSONAS } from "@/lib/lab/personas"
import { SCREENS, screenKey, screensFor, type PersonaId } from "@/lib/lab/screens"
import { FLOWS, findFlow, flowsForPersona, mainSteps, resolveStep } from "@/lib/lab/flows"
import { variantCounts } from "@/lib/lab/links"
import { SKILLS_PANEL, isSettingsArea, legacyDirectoryHref, legacySettingsHref, settingsLeaf, settingsSectionOf, skillsPanelHref, skillsPanelItemFor } from "@/lib/lab/admin-ia"

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
})

interface Page {
  label: string
  pathname: string
  search: string
  frame: { persona: PersonaId; navPersona?: PersonaId; page: Record<string, string> }
}

/** Every page a shell persona's sidebar appears on: each variant of each of its screens, each step of its flows in each set. */
function pagesFor(persona: PersonaId): Page[] {
  const pages: Page[] = []
  for (const s of screensFor(persona)) {
    for (const v of s.variants) {
      pages.push({ label: `${screenKey(s)}?variant=${v.id}`, pathname: `/lab/${s.persona}/${s.slug}`, search: `variant=${v.id}`, frame: { persona, page: { screen: screenKey(s), variant: v.id } } })
    }
  }
  for (const f of flowsForPersona(persona)) {
    for (const set of f.sets) {
      for (const step of f.steps) {
        const r = resolveStep(f.id, step.id, set.id)
        if (!r || r.screen.persona !== persona) continue
        pages.push({
          label: `flow ${f.id}/${step.id}?set=${set.id}`,
          pathname: `/lab/flow/${f.id}/${step.id}`,
          search: `set=${set.id}`,
          frame: { persona, navPersona: persona, page: { flow: f.id, step: step.id, screen: screenKey(r.screen), variant: r.variant.id } },
        })
      }
    }
  }
  return pages
}

/** The screen ("persona/slug") a sidebar row's path opens: a flow (its first main step), a flow step, or a screen URL. */
function screenOfPath(path: string): string {
  const flow = /^\/lab\/flow\/([^/]+)(?:\/([^/]+))?$/.exec(path)
  if (flow) {
    const f = findFlow(flow[1])
    const step = flow[2] ? f?.steps.find((x) => x.id === flow[2]) : f ? mainSteps(f)[0] : undefined
    return step?.screen ?? `unknown flow ${path}`
  }
  const screen = /^\/lab\/([^/]+)\/([^/]+)$/.exec(path)
  return screen ? `${screen[1]}/${screen[2]}` : `unknown ${path}`
}

const PANEL_SCREENS = new Set(SKILLS_PANEL.map((i) => i.screen))

/** LabFrame with children passed as the createElement argument (the lint rule forbids a children prop). */
const Frame = LabFrame as React.ComponentType<Omit<React.ComponentProps<typeof LabFrame>, "children"> & { children?: React.ReactNode }>

/** The sidebar a page renders, through LabFrame: each row's title and the screen it opens (the path's query dropped). */
function sidebarOf(p: Page): string[] {
  nav.pathname = p.pathname
  nav.search = p.search
  const { container, unmount } = render(
    React.createElement(LabProviders, null, React.createElement(Frame, p.frame, React.createElement("div", null, "page"))),
  )
  const rows = Array.from(container.querySelectorAll<HTMLAnchorElement>("a[data-sidebar=menu-button]")).map((a) => {
    const title = (a.textContent ?? "").replace(/\d+$/, "").trim() // the Approvals badge count is data, not the row
    let screen = screenOfPath((a.getAttribute("href") ?? "").split("?")[0]!)
    // D-L20: on a Skills panel page the Skills row points at the page itself (the DS lights it by path and a click reopens the
    // panel); on a Settings page the Settings row does. Either way it is that row, on its own page.
    const own = p.frame.page.screen ?? ""
    if (title === "Skills" && screen === own && PANEL_SCREENS.has(own)) screen = "admin/skills-library"
    if (title === "Settings" && screen === own && own === "admin/settings") screen = "admin/settings"
    return `${title} -> ${screen}`
  })
  unmount()
  return rows
}

const SHELL = PERSONAS.filter((p) => p.chrome === "shell")

describe("sidebar identity across variants (layout code path)", () => {
  it.each(SHELL.map((p) => [p.id]))("%s: the same rows on every variant of every screen and every flow step", (persona) => {
    const pages = pagesFor(persona as PersonaId)
    expect(pages.length).toBeGreaterThan(0)
    // The frame renders exactly the persona's nav rows, in order, each opening its own screen.
    const expected = (PERSONAS.find((p) => p.id === persona)!.nav?.() ?? []).map((r) => `${r.title} -> ${persona}/${r.slug}`)
    // The admin's Settings link sits after the main rows (D-L20; the DS 1.6.5 shell draws no sidebar footer).
    if (persona === "admin") expected.push("Settings -> admin/settings")
    const first = sidebarOf(pages[0]!)
    expect(first).toEqual(expected)
    const differ: string[] = []
    for (const p of pages.slice(1)) {
      const rows = sidebarOf(p)
      if (JSON.stringify(rows) !== JSON.stringify(first)) differ.push(`${p.label}: ${rows.join(" | ")}`)
    }
    expect(differ, `first page ${pages[0]!.label}: ${first.join(" | ")}`).toEqual([])
  }, 120_000)

  it("light personas (evaluator, lab instructor) render no sidebar", () => {
    for (const p of PERSONAS.filter((x) => x.chrome === "light")) {
      const s = screensFor(p.id)[0]!
      expect(sidebarOf({ label: p.id, pathname: `/lab/${s.persona}/${s.slug}`, search: "", frame: { persona: p.id, page: { screen: screenKey(s), variant: s.recommended } } })).toEqual([])
    }
  })
})

/**
 * D-L21 (Romit 2026-10-27, "why are categories and tags at Settings? When I click on them, it switches to the Skills
 * navigation"): Categories and tags is its own page under Skills only; Settings keeps its own sections.
 */
describe("admin IA: Categories and tags under Skills, Settings on its own sections", () => {
  /** The raw href of each row (title -> href without query) on a page. */
  function rawRows(pathname: string, search: string, page: Record<string, string>): Record<string, string> {
    nav.pathname = pathname
    nav.search = search
    const { container, unmount } = render(React.createElement(LabProviders, null, React.createElement(Frame, { persona: "admin", page }, React.createElement("div", null, "page"))))
    const out: Record<string, string> = {}
    for (const a of Array.from(container.querySelectorAll<HTMLAnchorElement>("a[data-sidebar=menu-button]"))) out[(a.textContent ?? "").replace(/\d+$/, "").trim()] = (a.getAttribute("href") ?? "").split("?")[0]!
    unmount()
    return out
  }

  it("the panel item points at the new page, not Settings", () => {
    const item = SKILLS_PANEL.find((i) => i.key === "categories")!
    expect(item.screen).toBe("admin/categories-tags")
    expect(item.label()).toBe("Categories and tags")
    expect(skillsPanelHref(item, {})).toMatch(/^\/lab\/flow\/keep-library-right\/categories\?set=1/)
  })

  it.each(["A", "B"])("on Categories and tags (%s) the Skills row and panel item are lit; Settings is not", (variant) => {
    const params = new URLSearchParams(`variant=${variant}&tab=tags`)
    expect(skillsPanelItemFor("admin/categories-tags", params)?.key).toBe("categories")
    expect(isSettingsArea("admin/categories-tags", params)).toBe(false)
    const rows = rawRows("/lab/admin/categories-tags", params.toString(), { screen: "admin/categories-tags", variant })
    expect(rows.Skills).toBe("/lab/admin/categories-tags") // the page itself: the DS lights it by path
    expect(rows.Settings).not.toBe("/lab/admin/categories-tags")
  })

  it.each(["settings", "evaluators"])("on Settings > %s the Settings row is lit and no panel item is", (tab) => {
    const params = new URLSearchParams(`tab=${tab}`)
    expect(skillsPanelItemFor("admin/settings", params)).toBeUndefined()
    expect(isSettingsArea("admin/settings", params)).toBe(true)
    const rows = rawRows("/lab/admin/settings", params.toString(), { screen: "admin/settings", variant: "A" })
    expect(rows.Settings).toBe("/lab/admin/settings")
    expect(rows.Skills).not.toBe("/lab/admin/settings")
  })

  it("crumb leaves: Settings > {section}, never Categories or Tags", () => {
    expect(settingsLeaf("admin/settings", new URLSearchParams(""))).toBe("Clinical settings")
    expect(settingsLeaf("admin/settings", new URLSearchParams("tab=evaluators"))).toBe("Evaluators")
    expect(settingsLeaf("admin/settings", new URLSearchParams("tab=instructors"))).toBe("Evaluators")
    expect(settingsLeaf("admin/settings", new URLSearchParams("list=naming"))).toBe("Clinical settings") // Naming has no UI (D-L25)
    expect(settingsLeaf("admin/settings", new URLSearchParams("tab=categories"))).toBe("Clinical settings")
    expect(settingsSectionOf(new URLSearchParams("tab=tags"))).toBe("settings")
  })

  it("old Settings links on Categories or Tags redirect to the new page, keeping the other params", () => {
    expect(legacySettingsHref(new URLSearchParams("tab=categories&variant=B&term=Fall%202026"))).toBe("/lab/admin/categories-tags?variant=B&term=Fall+2026")
    expect(legacySettingsHref(new URLSearchParams("tab=tags"))).toBe("/lab/admin/categories-tags?tab=tags")
    expect(legacySettingsHref(new URLSearchParams("variant=B&list=tags&entry=tags%3Ax"))).toBe("/lab/admin/categories-tags?variant=B&entry=tags%3Ax&list=tags")
    expect(legacySettingsHref(new URLSearchParams("tab=settings"))).toBeNull()
    expect(legacySettingsHref(new URLSearchParams("tab=evaluators"))).toBeNull()
    expect(legacySettingsHref(new URLSearchParams(""))).toBeNull()
  })

  it("D-L24: Lab instructors and the evaluator directory are the Settings section Evaluators", () => {
    expect(legacySettingsHref(new URLSearchParams("tab=instructors&variant=B"))).toBe("/lab/admin/settings?tab=evaluators&variant=B&role=lab-instructor")
    expect(legacyDirectoryHref(new URLSearchParams("filter=unverified&variant=B"))).toBe("/lab/admin/settings?filter=unverified&variant=B&tab=evaluators")
    expect(legacyDirectoryHref(new URLSearchParams(""))).toBe("/lab/admin/settings?tab=evaluators")
    expect(SCREENS.some((s) => s.slug === "evaluator-directory")).toBe(false)
    expect(FLOWS.some((f) => f.steps.some((st) => st.screen === "admin/evaluator-directory"))).toBe(false)
  })

  it("the configuration walkthrough's Categories and tags step opens the new page", () => {
    expect(findFlow("setup-walkthrough")!.steps.find((s) => s.id === "categories")!.screen).toBe("admin/categories-tags")
  })
})

describe("variant counts: /lab index equals the lab bar", () => {
  /** What the bar offers on a screen: the letters its option sets reach, and its "More variants" letters. */
  function barCounts(key: string, persona: PersonaId, variant: string) {
    nav.pathname = `/lab/${key}`
    nav.search = `variant=${variant}`
    const { result, unmount } = renderHook(() => useLabBar({ persona, screen: key, variant }))
    const m = result.current
    const reached = new Set<string>()
    if (m.flow && m.step) {
      // Every flow with this screen contributes its sets (the bar shows one flow at a time; the index counts them all).
      for (const f of FLOWS) for (const st of f.steps) if (st.screen === key) for (const set of f.sets) { const r = resolveStep(f.id, st.id, set.id); if (r && !r.planned) reached.add(r.variant.id) }
    }
    const extra = m.extraVariants.map((v) => v.id)
    unmount()
    return { inFlow: !!m.flow, reached, extra }
  }

  it.each(SCREENS.map((s) => [screenKey(s)]))("%s", (key) => {
    const s = SCREENS.find((x) => screenKey(x) === key)!
    const letters = s.variants.map((v) => v.id)
    const index = variantCounts(key, letters)
    const bar = barCounts(key, s.persona, s.recommended)
    expect(bar.inFlow).toBe(index.inFlow)
    expect(bar.extra.length).toBe(index.outside)
    if (index.inFlow) {
      expect(bar.reached.size).toBe(index.inSets)
      // Nothing is lost between the two: sets plus "More variants" cover every registered variant.
      expect(new Set([...bar.reached, ...bar.extra])).toEqual(new Set(letters))
    }
  })

  it("the index renders those counts (By persona view) for every screen", () => {
    nav.pathname = "/lab"
    nav.search = "view=persona"
    const { container } = render(React.createElement(LabProviders, null, React.createElement(LabIndex)))
    const cells = Array.from(container.querySelectorAll("[data-variant-count]")).map((n) => n.textContent ?? "")
    const want = SCREENS.map((s) => {
      const c = variantCounts(screenKey(s), s.variants.map((v) => v.id))
      return !c.inFlow ? "Not in a flow" : c.outside ? `${c.inSets} in the sets, ${c.outside} more` : `${c.inSets} in the sets`
    })
    expect(cells.length).toBe(SCREENS.length)
    expect([...cells].sort()).toEqual([...want].sort())
  })
})
