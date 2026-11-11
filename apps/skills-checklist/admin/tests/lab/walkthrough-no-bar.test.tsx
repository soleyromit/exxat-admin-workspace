import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const nav = vi.hoisted(() => ({ pathname: "/walk/setup-walkthrough/configure", search: "skill=sk-vitals", replace: vi.fn(), push: vi.fn() }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { LabBar } from "@/components/lab/lab-bar"
import { LabPageProvider, useLabHref } from "@/components/lab/lab-bar/page-context"
import { configureSkillHref, LIBRARY_HREF, libraryReturnHref } from "@/components/lab/configure/shell"
import { findFlow, mainSteps } from "@/lib/lab/flows"
import { labHref, navHref, rewriteLabUrl, type LinkContext } from "@/lib/lab/links"
import { configureHref, mappingHref } from "@/lib/lab/library"
import { SKILLS_PANEL, skillsPanelHref } from "@/lib/lab/admin-ia"
import { WALKTHROUGH_ID } from "@/lib/lab/walkthrough"
import { FROM_PARAM, LEAF_TITLE, returnCarry, returnTarget } from "@/lib/lab/return-to"
import { LAB_ADMIN, importHref, newListHref, starterHref } from "@/lib/lab/library"
import { MAPPING_PATH } from "@/lib/lab/mapping"
import { EVALUATION_SETTINGS_HREF } from "@/lib/lab/admin-ia"
import { WalkthroughControls, WalkthroughRow } from "@/components/lab/lab-bar/walkthrough-controls"
import { WALKTHROUGH_STEPS_KEY, setWalkthroughStepsShown } from "@/components/lab/lab-bar/walkthrough-visibility"
import { UserMenu } from "@/components/shell/user-menu"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * D-L139 (2026-11-10): the admin walkthrough shows no lab strip, in either URL form, with or without `present=1`, and every link
 * from a walkthrough step to a screen of the walkthrough stays on `/walk/setup-walkthrough/<step>`. Persona routes and the design
 * flows keep their bar.
 */
const flow = findFlow(WALKTHROUGH_ID)!

beforeEach(() => {
  nav.replace.mockReset()
  nav.push.mockReset()
  try { window.sessionStorage.clear() } catch { /* jsdom */ }
})

function renderBar(props: React.ComponentProps<typeof LabBar>, page: React.ComponentProps<typeof LabPageProvider>["page"] = {}) {
  return render(<TooltipProvider><LabPageProvider page={page}><LabBar {...props} /></LabPageProvider></TooltipProvider>)
}

describe("no lab bar on the admin walkthrough", () => {
  const forms = (step: string) => [`/walk/${WALKTHROUGH_ID}/${step}`, `/lab/flow/${WALKTHROUGH_ID}/${step}`]
  for (const s of flow.steps) {
    for (const pathname of forms(s.id)) {
      for (const search of ["", "present=1", "set=1&present=1"]) {
        it(`${pathname}?${search}: no bar and no present row`, () => {
          nav.pathname = pathname
          nav.search = search
          const variant = s.variants[flow.recommendedSet]!
          const { container } = renderBar({ persona: "admin", flow: WALKTHROUGH_ID, step: s.id, set: flow.recommendedSet, variant }, { flow: WALKTHROUGH_ID, step: s.id, screen: s.screen, variant })
          expect(container.querySelector("[data-lab-bar]")).toBeNull()
          expect(container.querySelector("[data-lab-present]")).toBeNull()
          expect(document.querySelector("[data-lab-present]")).toBeNull()
          expect(container.textContent).toBe("")
        })
      }
    }
  }

  it("hides the bar from the route alone, even when the page context is missing", () => {
    nav.pathname = `/walk/${WALKTHROUGH_ID}/configure`
    nav.search = "skill=sk-vitals"
    const { container } = renderBar({ persona: "admin", flow: WALKTHROUGH_ID, step: "configure", set: "1", variant: "B" })
    expect(container.querySelector("[data-lab-bar]")).toBeNull()
  })
})

describe("the bar stays everywhere else", () => {
  it("on the persona route /as/admin/configure-skill", () => {
    nav.pathname = "/as/admin/configure-skill"
    nav.search = "skill=sk-vitals"
    const { container } = renderBar({ persona: "admin", screen: "admin/configure-skill", variant: "B" }, { screen: "admin/configure-skill", variant: "B" })
    expect(container.querySelector("[data-lab-bar]")).not.toBeNull()
  })

  it("on a design flow, /flow/set-up-skills/library", () => {
    nav.pathname = "/flow/set-up-skills/library"
    nav.search = "set=1"
    const f = findFlow("set-up-skills")!
    const step = f.steps.find((s) => s.id === "library")!
    const variant = step.variants["1"]!
    const { container } = renderBar({ persona: "admin", flow: f.id, step: step.id, set: "1", variant }, { flow: f.id, step: step.id, screen: step.screen, variant })
    expect(container.querySelector("[data-lab-bar]")).not.toBeNull()
  })
})

describe("links from a walkthrough step stay on the walkthrough", () => {
  const ctxOn = (stepId: string, search = ""): LinkContext => {
    const s = flow.steps.find((x) => x.id === stepId)!
    return { flowId: WALKTHROUGH_ID, stepId, set: flow.recommendedSet, screen: s.screen, variant: s.variants[flow.recommendedSet], onFlowRoute: true, carry: new URLSearchParams(search) }
  }
  const onPath = /^\/walk\/setup-walkthrough\/[a-z-]+(\?|$)/

  it("every walkthrough screen, linked from every step, lands on its /walk step", () => {
    const screens = [...new Set(flow.steps.map((s) => s.screen))]
    for (const from of flow.steps) {
      for (const screen of screens) {
        const href = labHref(screen, {}, ctxOn(from.id))
        expect(href, `${from.id} -> ${screen}`).toMatch(onPath)
      }
    }
  })

  it("Configure the skill, the user's case: /walk/setup-walkthrough/configure?skill=sk-vitals, never /as/admin/configure-skill", () => {
    for (const from of flow.steps) {
      const href = rewriteLabUrl(configureSkillHref("sk-vitals"), ctxOn(from.id))
      expect(href).toBe("/walk/setup-walkthrough/configure?skill=sk-vitals")
      expect(href).not.toContain("/as/")
    }
  })

  it("Library, the Library's own panel link, course mapping and the post-save return stay on the path", () => {
    const ctx = ctxOn("configure", "skill=sk-vitals")
    expect(rewriteLabUrl(LIBRARY_HREF, ctx)).toMatch(/^\/walk\/setup-walkthrough\/library/)
    expect(rewriteLabUrl(libraryReturnHref("sk-vitals", "saved"), ctx)).toBe("/walk/setup-walkthrough/library?skill=sk-vitals&saved=1")
    expect(rewriteLabUrl(configureHref("sk-vitals"), ctx)).toBe("/walk/setup-walkthrough/library?skill=sk-vitals")
    expect(rewriteLabUrl(mappingHref("sk-vitals"), ctx)).toMatch(/^\/walk\/setup-walkthrough\/map\?/)
  })

  it("the Skills panel rows and the Library crumb stay on the path from every step", () => {
    for (const from of flow.steps) {
      const ctx = ctxOn(from.id)
      for (const item of SKILLS_PANEL) expect(skillsPanelHref(item, ctx), `${from.id} panel ${item.key}`).toMatch(onPath)
      expect(navHref("admin/skills-library", ctx)).toMatch(onPath)
    }
  })

  it("names the stops it can reach", () => {
    expect(mainSteps(flow).map((s) => s.id)).toEqual(["lists", "settings", "map"])
  })
})

/**
 * Configure one skill -> Evaluation settings (2026-11-10): the link is built by the context-aware builder, so it stays on the
 * walkthrough from a walkthrough step and on the persona route otherwise, and it carries `from=configure&skill=<id>` so
 * Evaluation settings can lead back to that skill.
 */
describe("Configure one skill: the Evaluation settings link and its way back", () => {
  const SKILL = "sk-vitals"
  const walkCtx = (stepId: string, search = ""): LinkContext => {
    const s = flow.steps.find((x) => x.id === stepId)!
    return { flowId: WALKTHROUGH_ID, stepId, set: flow.recommendedSet, screen: s.screen, variant: s.variants[flow.recommendedSet], onFlowRoute: true, carry: new URLSearchParams(search) }
  }
  const personaCtx = (screen: string, search = ""): LinkContext => ({ screen, variant: "B", carry: new URLSearchParams(search) })
  /** The href the page builds, through the same hook the page uses, on the mocked route. */
  function hrefOn(pathname: string, search: string, page: React.ComponentProps<typeof LabPageProvider>["page"]) {
    nav.pathname = pathname
    nav.search = search
    function Probe() {
      const to = useLabHref()
      return <a data-probe href={to("admin/evaluation-settings", { [FROM_PARAM]: "configure", skill: SKILL })}>x</a>
    }
    const { container } = render(<LabPageProvider page={page}><Probe /></LabPageProvider>)
    return container.querySelector("[data-probe]")!.getAttribute("href")!
  }

  it("on the walkthrough path it resolves to the walkthrough's settings step", () => {
    expect(hrefOn(`/walk/${WALKTHROUGH_ID}/configure`, `skill=${SKILL}`, { flow: WALKTHROUGH_ID, step: "configure", screen: "admin/configure-skill", variant: "B" })).toBe(`/walk/${WALKTHROUGH_ID}/settings?from=configure&skill=${SKILL}`)
    // From the route alone, with no page context provided.
    expect(hrefOn(`/walk/${WALKTHROUGH_ID}/configure`, `skill=${SKILL}`, {})).toBe(`/walk/${WALKTHROUGH_ID}/settings?from=configure&skill=${SKILL}`)
    expect(hrefOn(`/lab/flow/${WALKTHROUGH_ID}/configure`, `skill=${SKILL}`, {})).toBe(`/walk/${WALKTHROUGH_ID}/settings?from=configure&skill=${SKILL}`)
  })

  it("keeps the program scope", () => {
    expect(hrefOn(`/walk/${WALKTHROUGH_ID}/configure`, `skill=${SKILL}&program=new`, { flow: WALKTHROUGH_ID, step: "configure", screen: "admin/configure-skill", variant: "B" })).toBe(`/walk/${WALKTHROUGH_ID}/settings?program=new&from=configure&skill=${SKILL}`)
    const persona = new URL(hrefOn("/as/admin/configure-skill", `skill=${SKILL}&program=new`, { screen: "admin/configure-skill", variant: "B" }), "http://x")
    expect(persona.searchParams.get("program")).toBe("new")
  })

  it("on a persona route it resolves to the persona URL", () => {
    for (const pathname of ["/as/admin/configure-skill", "/lab/admin/configure-skill"]) {
      const u = new URL(hrefOn(pathname, `skill=${SKILL}`, { screen: "admin/configure-skill", variant: "B" }), "http://x")
      expect(u.pathname).toBe("/as/admin/evaluation-settings")
      expect(u.searchParams.get(FROM_PARAM)).toBe("configure")
      expect(u.searchParams.get("skill")).toBe(SKILL)
    }
  })

  it("the return target leads back to that skill's Configure page", () => {
    const settingsParams = new URLSearchParams(`from=configure&skill=${SKILL}`)
    expect(returnCarry("configure", settingsParams)).toBe(SKILL)
    expect(returnCarry("lists", new URLSearchParams("from=lists&list=list-7&skill=x"))).toBe("list-7")
    expect(returnCarry("skills", settingsParams)).toBeNull()
    expect(returnCarry("constructor", settingsParams)).toBeNull()
    const back = returnTarget("configure", returnCarry("configure", settingsParams))!
    expect(back.href).toBe(`/as/admin/configure-skill?skill=${SKILL}`)
    // In the walkthrough, on the settings step: back on the walkthrough's configure step, with the skill left, not the step's own.
    expect(rewriteLabUrl(back.href, walkCtx("settings", settingsParams.toString()))).toBe(`/walk/${WALKTHROUGH_ID}/configure?skill=${SKILL}`)
    // Off the walkthrough (persona route): back to that skill outside the walkthrough. Configure is a step of the design flow
    // "set-up-skills", so the builder sends it there, as it does every other link to Configure from a persona route.
    const persona = new URL(rewriteLabUrl(back.href, personaCtx("admin/evaluation-settings", settingsParams.toString())), "http://x")
    expect(persona.pathname).not.toMatch(/^\/walk\//)
    expect(persona.pathname).toBe(new URL(rewriteLabUrl(configureSkillHref(SKILL), personaCtx("admin/evaluation-settings")), "http://x").pathname)
    expect(persona.searchParams.get("skill")).toBe(SKILL)
    // An id with characters that need encoding survives the round trip.
    expect(new URL(returnTarget("configure", "a b&c")!.href, "http://x").searchParams.get("skill")).toBe("a b&c")
    // With no skill in hand the way back is the Library, never Configure on a default skill.
    expect(returnTarget("configure")!.href).toBe("/as/admin/skills-library")
    expect(LEAF_TITLE["admin/evaluation-settings"]?.()).toBe("Evaluation settings")
  })

  it("the Configure pages hold no literal Evaluation settings address", () => {
    for (const f of ["components/lab/configure/one-skill-page.tsx", "components/lab/configure/many-page.tsx"]) {
      const src = readFileSync(resolve(process.cwd(), f), "utf8")
      expect(src, f).not.toMatch(/LAB_ADMIN\}?\/evaluation-settings|["'`]\/(lab|as)\/admin\/evaluation-settings/)
      expect(src, f).toContain('to("admin/evaluation-settings"')
    }
  })

  it("every literal lab address left in the sweep is rewritten onto the path by the lab link from every step", () => {
    const literals = [
      `${LAB_ADMIN}/evaluation-settings`, `${LAB_ADMIN}/evaluation-settings?program=new`, EVALUATION_SETTINGS_HREF,
      `${LAB_ADMIN}/skills-library?config=not-configured`, `${LAB_ADMIN}/skills-library?tag=Airway`, "/lab/admin/skills-library?tab=not-configured",
      `${LAB_ADMIN}/lists-cohorts`, newListHref, "/lab/admin/course-mapping", MAPPING_PATH, importHref, starterHref,
      "/lab/admin/import-ai-review", "/as/admin/skills-library", "/as/admin/lists-cohorts?list=list-7",
    ]
    for (const from of flow.steps) {
      for (const l of literals) expect(rewriteLabUrl(l, walkCtx(from.id)), `${from.id} -> ${l}`).toMatch(/^\/walk\/setup-walkthrough\/[a-z-]+(\?|$)/)
    }
    expect(rewriteLabUrl(`${LAB_ADMIN}/evaluation-settings?program=new`, walkCtx("library"))).toBe("/walk/setup-walkthrough/settings?program=new")
  })
})

/**
 * D-L139 amended (2026-11-11, Romit: "don't show this. However, I should be able to access this later."): the path bar is hidden by
 * default on every walkthrough step, with nothing in the DOM or the tab order and no reserved row. "Show walkthrough steps" in the
 * user menu, or Ctrl+Shift+?, brings it back; the choice lasts for the browser and across steps.
 */
describe("the walkthrough path bar is hidden until the presenter asks for it", () => {
  beforeEach(() => {
    window.localStorage.removeItem(WALKTHROUGH_STEPS_KEY)
    act(() => setWalkthroughStepsShown(false))
  })

  const at = (step: string, f = flow) => {
    nav.pathname = `/walk/${f.id}/${step}`
    nav.search = "set=1&present=1"
    const st = f.steps.find((s) => s.id === step)!
    return { flow: f.id, step, screen: st.screen, variant: st.variants[f.recommendedSet] }
  }
  const renderControls = (step = "settings") =>
    render(<TooltipProvider><LabPageProvider page={at(step)}><WalkthroughControls /></LabPageProvider></TooltipProvider>)
  const pressShortcut = () => act(() => { fireEvent.keyDown(window, { key: "?", ctrlKey: true, shiftKey: true }) })

  it("hidden by default on every stop: no path bar, no Back, Next or Exit in the DOM; the user menu is there", () => {
    for (const s of flow.steps) {
      const { container, unmount } = renderControls(s.id)
      expect(container.querySelector("[data-lab-walkthrough]"), s.id).toBeNull()
      expect(container.querySelector("[data-walkthrough-prev], [data-walkthrough-next], [data-walkthrough-exit]"), s.id).toBeNull()
      expect(container.querySelector("[data-lab-chrome]"), s.id).toBeNull()
      expect(screen.getByRole("button", { name: /open profile and settings menu/ })).toBeInTheDocument()
      unmount()
    }
  })

  it("the row frames (evaluator, Log a skill) reserve no row while hidden, and show the row when turned on", () => {
    const { container } = render(<TooltipProvider><LabPageProvider page={at("settings")}><WalkthroughRow /></LabPageProvider></TooltipProvider>)
    // Only the hidden route-smoke marker: no row, no control, nothing that takes space or focus.
    expect(container.querySelector("[data-walkthrough-row]")).toBeNull()
    expect([...container.children].every((el) => el.hasAttribute("hidden"))).toBe(true)
    expect(container.querySelector("a, button")).toBeNull()
    pressShortcut()
    expect(container.querySelector("[data-walkthrough-row] [data-lab-walkthrough]")).not.toBeNull()
  })

  it("the user menu entry shows the bar, moves focus to it, and then reads Hide walkthrough steps", async () => {
    const user = userEvent.setup()
    const { container } = renderControls()
    await user.click(screen.getByRole("button", { name: /open profile and settings menu/ }))
    const item = await screen.findByRole("menuitem", { name: "Show walkthrough steps" })
    expect(item).toHaveAttribute("aria-keyshortcuts", "Control+Shift+?")
    expect(item.querySelectorAll("kbd").length).toBe(3)
    await user.click(item)
    const bar = container.querySelector("[data-lab-walkthrough]")
    expect(bar).not.toBeNull()
    expect(screen.getByText("2 of 3")).toBeInTheDocument()
    expect(bar!.contains(document.activeElement)).toBe(true)
    await user.click(screen.getByRole("button", { name: /open profile and settings menu/ }))
    await user.click(await screen.findByRole("menuitem", { name: "Hide walkthrough steps" }))
    expect(container.querySelector("[data-lab-walkthrough]")).toBeNull()
  })

  it("the choice is kept in this browser and holds on the next stop", () => {
    const first = renderControls("lists")
    pressShortcut()
    expect(window.localStorage.getItem(WALKTHROUGH_STEPS_KEY)).toBe("1")
    first.unmount()
    const next = renderControls("map")
    expect(next.container.querySelector("[data-lab-walkthrough]")).not.toBeNull()
    next.unmount()
    // A fresh load reads storage: the module's in-memory value is not what keeps it.
    window.localStorage.removeItem(WALKTHROUGH_STEPS_KEY)
    const fresh = renderControls("lists")
    expect(fresh.container.querySelector("[data-lab-walkthrough]")).toBeNull()
  })

  it("Ctrl+Shift+? toggles it, and is ignored while typing in a field", () => {
    const { container } = renderControls()
    pressShortcut()
    expect(container.querySelector("[data-lab-walkthrough]")).not.toBeNull()
    pressShortcut()
    expect(container.querySelector("[data-lab-walkthrough]")).toBeNull()
    const input = document.createElement("input")
    document.body.appendChild(input)
    act(() => { fireEvent.keyDown(input, { key: "?", ctrlKey: true, shiftKey: true }) })
    expect(container.querySelector("[data-lab-walkthrough]")).toBeNull()
    input.remove()
  })

  it("the product's own user menu (no walkthrough) has no such entry", async () => {
    nav.pathname = "/"
    const user = userEvent.setup()
    render(<UserMenu />)
    await user.click(screen.getByRole("button", { name: /open profile and settings menu/ }))
    await screen.findByRole("menuitem", { name: /Sample data and display options/ })
    expect(screen.queryByRole("menuitem", { name: /walkthrough steps/ })).toBeNull()
  })

  it("off a walkthrough (a persona route) the controls render nothing, so the lab strip there is untouched", () => {
    nav.pathname = "/as/admin/configure-skill"
    nav.search = "skill=sk-vitals"
    const { container } = render(<TooltipProvider><LabPageProvider page={{ screen: "admin/configure-skill", variant: "B" }}><WalkthroughControls /></LabPageProvider></TooltipProvider>)
    expect(container.innerHTML).toBe("")
  })
})
