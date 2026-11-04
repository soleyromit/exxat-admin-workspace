import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const nav = vi.hoisted(() => ({ pathname: "/lab/flow/setup-walkthrough/configure", search: "set=1&present=1&skill=sk-pressure-injury", replace: vi.fn(), push: vi.fn() }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { LabBar } from "@/components/lab/lab-bar"
import { LabPageProvider } from "@/components/lab/lab-bar/page-context"
import { WalkthroughControls } from "@/components/lab/lab-bar/walkthrough-controls"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { selfEvalOptions } from "@/components/lab/student2/log-parts"
import { LabIndex } from "@/components/lab/lab-index"
import { FLOWS, findFlow, flowsForPersona, flowsForScreen, mainSteps, resolveStep, splitScreen } from "@/lib/lab/flows"
import { labHref, rewriteLabUrl, type LinkContext } from "@/lib/lab/links"
import { configureHref, mappingHref } from "@/lib/lab/library"
import { mappingLink } from "@/lib/lab/mapping"
import { LEAF_TITLE, returnHref, withFrom } from "@/lib/lab/return-to"
import { PRESENT_WALKTHROUGHS } from "@/lib/lab/present"
import { SCREENS, findScreen, screenKey } from "@/lib/lab/screens"
import { buildStudent } from "@/lib/lab/student"
import { selfEvalEnabled } from "@/lib/lab/student2"
import { skillById } from "@/lib/v2/evidence-index"
import { createSeed } from "@/lib/v2/seed"
import { FULFILLMENT_ENTRY, FULFILLMENT_WALKTHROUGH_ID, WALKTHROUGH_ENTRY, WALKTHROUGH_EXIT, WALKTHROUGH_ID, WALKTHROUGH_ROUTES, effectiveStep, walkthroughPosition, walkthroughStart } from "@/lib/lab/walkthrough"
import { SETUP_RESULT_SCREEN, SKILLS_PANEL, selectedSkillsPanelKey } from "@/lib/lab/admin-ia"

/**
 * The two walkthroughs (Romit 2026-10-27, for Sankalp's Thursday meeting): the recommended design of each step in Sankalp's order,
 * driven by the product's own buttons, with a presenter control that shows no lab label, and with every lab variant still
 * registered and reachable outside them.
 */

// Agreed step names (2026-10-27): one string per step for the lab bar step title, the H1, the present breadcrumb and the first
// heading. Order: Sankalp's Thursday list (docs/knowledge/design/thursday-flows-sankalp.md), A1 to A6 and S1 to S2.
const AGREED = [
  // Proposed 2026-11-02: Sankalp's six steps [CALL 11-02], from the library; no checklist page (Romit, same day).
  ["library", "Skills"], // 1, one at a time (Add a skill) and Add several from here
  ["add", "Add a skill"], // 1
  ["paste", "Paste several"], // 1
  ["bulk", "Bulk upload"], // 1, bulk (Import), later
  ["starter", "Starting points"], // 1, copy from a starter library [CALL 11-02], later (SL-01 conflict, D-X5)
  ["categories", "Categories and tags"], // 2
  ["settings", "Evaluation settings"], // 3, program level, times needed on the same page
  ["lists", "Groups of skills"], // 4, optional
  ["assign", "Assign skills to student groups"], // 5
  ["map-skill", "Course mapping by skill"], // 6, by skill first (Sarah: the more useful view) [CALL 11-02]
  ["map", "Course mapping by course"], // 6, by course (D-L39: the footer names the view it moves to)
  ["result", "Setup summary"], // the end state
] as const
// S1 central and per course, then S2 through Send for evaluation C (course first); the confirmation follows Send on the last step.
const AGREED_STUDENT = [
  ["progress", "My progress"],
  ["course", "Skills by course"],
  ["skills", "Log a skill"],
  ["self", "Self-evaluation"],
  ["send", "Send for evaluation"],
] as const

const flow = () => findFlow(WALKTHROUGH_ID)!
const ful = () => findFlow(FULFILLMENT_WALKTHROUGH_ID)!
const ctxFor = (step: string, search = "set=1&present=1"): LinkContext => ({ flowId: WALKTHROUGH_ID, stepId: step, set: "1", onFlowRoute: true, screen: flow().steps.find((s) => s.id === step)!.screen, variant: "A", carry: new URLSearchParams(search) })
const fulCtx = (step: string, search = "set=1&present=1"): LinkContext => {
  const st = ful().steps.find((s) => s.id === step)!
  return { flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: step, set: "1", onFlowRoute: true, screen: st.screen, variant: st.variants["1"], carry: new URLSearchParams(search) }
}
const landing = (href: string) => {
  const u = new URL(href, "http://lab.test")
  const [, , , flowId, stepId] = u.pathname.split("/")
  return { flowId, stepId, q: u.searchParams }
}

beforeEach(() => {
  nav.pathname = "/lab/flow/setup-walkthrough/configure"
  nav.search = "set=1&present=1&skill=sk-pressure-injury"
  nav.replace.mockReset()
  nav.push.mockReset()
})

describe("walkthrough definition", () => {
  it("runs Sankalp's order with the agreed step names, in both walkthroughs", () => {
    expect(mainSteps(flow()).map((s) => [s.id, s.label])).toEqual(AGREED.map(([id, l]) => [id, l]))
    expect(flow().sets.map((s) => s.id)).toEqual(["1"])
    expect(mainSteps(ful()).map((s) => [s.id, s.label])).toEqual(AGREED_STUDENT.map(([id, l]) => [id, l]))
    // Groups of skills is the one optional step (Sankalp: "non mandatory").
    expect(flow().steps.filter((s) => s.tag === "Optional").map((s) => s.id)).toEqual(["lists", "configure"])
    expect(ful().steps.filter((s) => s.tag === "Optional")).toEqual([])
  })

  it("uses the recommended variant of every screen, all built; the send steps use Send for evaluation C (course first)", () => {
    for (const id of [WALKTHROUGH_ID, FULFILLMENT_WALKTHROUGH_ID]) {
      for (const st of findFlow(id)!.steps) {
        const { persona, slug } = splitScreen(st.screen)
        const r = resolveStep(id, st.id, "1")!
        // Send C (course first), and the steps that show a second way in (Paste several is Add a skill C, by skill is mapping B).
        const want = st.screen === "student/request-signoff" || st.id === "paste" || st.id === "map-skill" ? st.variants["1"]! : findScreen(persona, slug)!.recommended
        expect(r.variant.id, st.id).toBe(want)
        expect(r.planned, st.id).toBe(false)
      }
    }
  })

  it("opens each Send C step on NURS 350 with its own step param", () => {
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, "course", "1")!.params).toEqual({ course: "crs-nurs350" })
    for (const s of ["skills", "self", "send"]) expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, s, "1")!.params).toEqual({ course: "crs-nurs350", step: s })
  })

  it("opens the assign step in assign mode; Change one skill is the one optional side branch", () => {
    expect(resolveStep(WALKTHROUGH_ID, "assign", "1")!.params).toEqual({ view: "assign" })
    expect(resolveStep(WALKTHROUGH_ID, "configure", "1")!.params).toEqual({ skill: "sk-pressure-injury" })
    expect(flow().steps.filter((s) => s.side).map((s) => [s.id, s.label, s.tag])).toEqual([["configure", "Change one skill", "Optional"]])
    expect(resolveStep(WALKTHROUGH_ID, "map-skill", "1")!.params).toEqual({ by: "skill" })
    expect(resolveStep(WALKTHROUGH_ID, "map", "1")!.params).toEqual({ by: "course" })
  })

  it("has one entry URL each that lands on the first step in present mode, both listed on the present index", () => {
    expect(WALKTHROUGH_ROUTES).toEqual({ admin: WALKTHROUGH_ID, student: FULFILLMENT_WALKTHROUGH_ID, setup: WALKTHROUGH_ID, fulfillment: FULFILLMENT_WALKTHROUGH_ID })
    expect(walkthroughStart()).toBe("/lab/flow/setup-walkthrough/library?set=1&present=1")
    expect(walkthroughStart(FULFILLMENT_WALKTHROUGH_ID)).toBe("/lab/flow/fulfillment-walkthrough/progress?set=1&present=1")
    expect(PRESENT_WALKTHROUGHS.map((w) => w.href)).toEqual([WALKTHROUGH_ENTRY, FULFILLMENT_ENTRY])
  })

  it("is invisible to the design flows: FLOWS, the persona menu and screen inference never return it", () => {
    for (const id of [WALKTHROUGH_ID, FULFILLMENT_WALKTHROUGH_ID]) {
      expect(FLOWS.some((f) => f.id === id)).toBe(false)
      expect(flowsForPersona("admin").concat(flowsForPersona("student")).some((f) => f.id === id)).toBe(false)
    }
    expect(flowsForScreen("admin", "skills-library", "A").every((m) => m.flow.id !== WALKTHROUGH_ID)).toBe(true)
    expect(flowsForScreen("student", "request-signoff", "C").every((m) => m.flow.id !== FULFILLMENT_WALKTHROUGH_ID)).toBe(true)
    // A plain screen URL still resolves into its design flow, exactly as before.
    expect(landing(labHref("admin/course-mapping", {}, {})).flowId).toBe("set-up-skills")
    expect(landing(labHref("student/request-signoff", {}, {})).flowId).toBe("ask-for-evaluation")
  })
})

describe("the step a page is really on follows the screen's own params (effectiveStep)", () => {
  const eff = (f: ReturnType<typeof flow>, route: string, search: string) => effectiveStep(f, f.steps.find((s) => s.id === route)!, "1", new URLSearchParams(search)).id

  it("Send C's Continue writes ?step= on the same route: the page and the presenter follow it", () => {
    expect(eff(ful(), "skills", "course=crs-nurs350&step=skills")).toBe("skills")
    expect(eff(ful(), "skills", "course=crs-nurs350&step=self&skills=a,b")).toBe("self")
    expect(eff(ful(), "self", "course=crs-nurs350&step=send")).toBe("send")
    // No Questions step (Romit 2026-10-27): the questions are read on Skills or answered on Self-evaluation.
    expect(ful().steps.some((s) => s.id === "questions")).toBe(false)
  })

  it("My progress with ?course= is the course step; Groups of skills with ?view=assign is the assign step", () => {
    expect(eff(ful(), "progress", "")).toBe("progress")
    expect(eff(ful(), "progress", "course=crs-nurs350")).toBe("course")
    expect(eff(flow(), "lists", "view=assign")).toBe("assign")
    expect(eff(flow(), "lists", "")).toBe("lists")
  })

  it("keeps the route's step when no sibling matches (Change one skill on a skill just added)", () => {
    expect(eff(flow(), "configure", "skill=sk-new-1")).toBe("configure")
  })

  it("the presenter reads the effective step: Step 4 of 5 on Evaluate yourself, Previous to Choose skills", () => {
    const w = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "skills", new URLSearchParams("set=1&present=1&course=crs-nurs350&step=self&skills=sk-sterile-dressing"))!
    expect([w.step.id, w.index, w.total]).toEqual(["self", 4, 5])
    expect(landing(w.prev!.href)).toMatchObject({ stepId: "skills" })
    expect(landing(w.next!.href).stepId).toBe("send")
    // The chosen skills and the course ride along to the next Send C step.
    expect(landing(w.next!.href).q.get("skills")).toBe("sk-sterile-dressing")
    expect(landing(w.next!.href).q.get("course")).toBe("crs-nurs350")
  })

  it("Previous from the course view lands on My progress, not on the course again", () => {
    const w = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "course", new URLSearchParams("set=1&present=1&course=crs-nurs350"))!
    expect(landing(w.prev!.href)).toMatchObject({ stepId: "progress" })
    expect(landing(w.prev!.href).q.get("course")).toBeNull()
    expect(landing(w.next!.href).q.get("course")).toBe("crs-nurs350")
  })
})

describe("the product's own buttons lead on inside the walkthrough", () => {
  it("Save and configure (add sheet) opens the configure step on the new skill", () => {
    const l = landing(rewriteLabUrl(configureHref("sk-new-1"), ctxFor("add")))
    expect([l.flowId, l.stepId, l.q.get("skill"), l.q.get("present"), l.q.get("set")]).toEqual([WALKTHROUGH_ID, "configure", "sk-new-1", "1", "1"])
  })

  it("Map to courses (assign footer) opens the next step, mapping by skill; a plain link opens skill first too, by=course or an offering opens the map step", () => {
    const l = landing(labHref("admin/course-mapping", { by: "skill" }, ctxFor("assign", "set=1&present=1&skill=sk-pressure-injury&view=assign")))
    expect([l.flowId, l.stepId, l.q.get("present")]).toEqual([WALKTHROUGH_ID, "map-skill", "1"])
    const ctx = ctxFor("assign", "set=1&present=1&view=assign")
    expect(landing(labHref("admin/course-mapping", {}, ctx)).stepId).toBe("map-skill")
    expect(landing(labHref("admin/course-mapping", { by: "course" }, ctx)).stepId).toBe("map")
    expect(landing(rewriteLabUrl(mappingLink({ offering: "off-x" }), ctx)).stepId).toBe("map")
    expect(l.q.get("view")).toBeNull()
  })

  it("the receipt's links stay inside the walkthrough (Done returns to Skills, Map to courses to mapping by skill)", () => {
    const ctx = ctxFor("configure", "set=1&present=1&skill=sk-pressure-injury")
    expect(landing(rewriteLabUrl(mappingHref("sk-pressure-injury"), ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "map-skill" })
    expect(landing(labHref("admin/skills-library", { skill: "sk-pressure-injury" }, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "library" })
    // A plain link to the lists screen lands on Groups of skills; one with view=assign on the assign step.
    expect(landing(labHref("admin/lists-cohorts", {}, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "lists" })
    expect(landing(labHref("admin/lists-cohorts", { view: "assign" }, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "assign" })
    // A link to one skill's page lands on the side branch.
    expect(landing(labHref("admin/configure-skill", { skill: "sk-vitals" }, ctxFor("settings")))).toMatchObject({ stepId: "configure" })
  })

  it("Import's Open the library and the library's Replace with a new version stay inside the walkthrough", () => {
    expect(landing(labHref("admin/skills-library", {}, ctxFor("bulk")))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "library" })
    expect(landing(rewriteLabUrl("/lab/admin/import-ai-review", ctxFor("library")))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "bulk" })
    expect(landing(rewriteLabUrl("/lab/admin/lists-cohorts", ctxFor("library")))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "lists" })
  })

  it("a page opened from the library's Add menu keeps ?from=skills (and a group deep link keeps ?new=1), so its breadcrumb and Cancel lead back to Skills", () => {
    const bulk = landing(rewriteLabUrl(withFrom("/lab/admin/import-ai-review", "skills"), ctxFor("library")))
    expect(bulk).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "bulk" })
    expect(bulk.q.get("from")).toBe("skills")
    const group = landing(rewriteLabUrl(withFrom("/lab/admin/lists-cohorts?new=1", "skills"), ctxFor("library")))
    expect(group).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "lists" })
    expect([group.q.get("from"), group.q.get("new")]).toEqual(["skills", "1"])
    expect(returnHref(bulk.q.get("from"), "/lab/admin/dashboard")).toBe("/lab/admin/skills-library")
    expect(returnHref(null, "/lab/admin/dashboard")).toBe("/lab/admin/dashboard")
    expect(LEAF_TITLE["admin/import-ai-review"]()).toBe("Bulk upload")
  })

  it("student links stay inside the fulfillment walkthrough and land on Send C", () => {
    // By course: NURS 350 on My progress opens the course view.
    expect(landing(labHref("student/home", { course: "crs-nurs350" }, fulCtx("progress")))).toMatchObject({ flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: "course" })
    // Send for evaluation on the course view (header and list, both carry the course) opens Choose skills in variant C.
    const send = landing(labHref("student/request-signoff", { course: "crs-nurs350", skills: "sk-sterile-dressing" }, fulCtx("course", "set=1&present=1&course=crs-nurs350")))
    expect(send).toMatchObject({ flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: "skills" })
    expect([send.q.get("course"), send.q.get("skills"), send.q.get("present")]).toEqual(["crs-nurs350", "sk-sterile-dressing", "1"])
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, send.stepId!, "1")!.variant.id).toBe("C")
    // The header's Send for evaluation on plain My progress lands on Send C too (the step's params open NURS 350).
    expect(landing(labHref("student/request-signoff", {}, fulCtx("progress")))).toMatchObject({ stepId: "skills" })
  })

  it("the presenter's next always leads to the following step, and Finish on the last, in both walkthroughs", () => {
    for (const f of [flow(), ful()]) {
      const ids = mainSteps(f).map((s) => s.id)
      ids.forEach((id, i) => {
        const st = f.steps.find((s) => s.id === id)!
        const own = new URLSearchParams({ set: "1", present: "1", ...(st.params?.["1"] ?? {}) })
        const w = walkthroughPosition(f.id, id, own)!
        expect([w.step.id, w.index, w.total], `${f.id}/${id}`).toEqual([id, i + 1, ids.length])
        if (i < ids.length - 1) expect(landing(w.next!.href)).toMatchObject({ flowId: f.id, stepId: ids[i + 1] })
        else expect(w.next).toBeUndefined()
        if (i > 0) expect(landing(w.prev!.href).stepId).toBe(ids[i - 1])
        // Present mode rides along on every hop.
        for (const h of [w.prev?.href, w.next?.href]) if (h) expect(landing(h).q.get("present")).toBe("1")
      })
    }
  })

  it("one skill's own pages sit off the main path: no step count there", () => {
    expect(walkthroughPosition(WALKTHROUGH_ID, "configure", new URLSearchParams("set=1&present=1&skill=sk-pressure-injury"))).toBeUndefined()
    const w = walkthroughPosition(WALKTHROUGH_ID, "settings", new URLSearchParams("set=1&present=1"))!
    expect([w.index, w.total, landing(w.prev!.href).stepId, landing(w.next!.href).stepId]).toEqual([7, 12, "categories", "lists"])
  })
})

describe("demo data: Sankalp's exact path shows the self-evaluation step", () => {
  const s = createSeed()
  it("sterile dressing change asks for a self-evaluation, is mandatory on NURS 350 and the demo student can still send it", () => {
    expect(selfEvalEnabled(skillById(s, "sk-sterile-dressing"))).toBe(true)
    // A questions skill rates its final result in the program's outcome words (no empty step that blocks Continue).
    expect(selfEvalOptions(skillById(s, "sk-sterile-dressing")!)).toEqual(["Met", "Not met"])
    const m = buildStudent(s)!
    const nurs350 = m.courses.find((c) => c.id === "crs-nurs350")!
    expect(nurs350.skills.find((x) => x.id === "sk-sterile-dressing")?.level).toBe("mandatory")
    const rec = m.all.find((r) => r.id === "sk-sterile-dressing")!
    expect(rec.state).not.toBe("achieved")
    expect(rec.waiting).toBeFalsy()
    // Send C preselects exactly these on entering the course: the open mandatory skills; sterile dressing is among them.
    const rows = new Map(m.all.map((r) => [r.id, r]))
    const preselected = nurs350.skills.filter((x) => x.level === "mandatory").map((x) => rows.get(x.id)).filter((r) => !!r && r.state !== "achieved" && !r.waiting).map((r) => r!.id)
    expect(preselected).toContain("sk-sterile-dressing")
  })
})

const BANNED = ["Tests", "Variant", "variant", "Components", "Scenario", "Tier", "Planned", "Built", "Set 1", "Recommended", "Sample data", "Design lab", "More variants", "Guided"]

describe("navigation model A on the admin walkthrough (D-L42: hub pages, breadcrumbs and the Skills panel, no wizard chrome)", () => {
  const f = () => findFlow(WALKTHROUGH_ID)!
  it("keeps every step id and route, with no chapters or footer labels in the flow data", () => {
    expect(f().steps.map((s) => s.id)).toEqual(["library", "add", "paste", "bulk", "starter", "categories", "settings", "lists", "assign", "map-skill", "map", "result", "configure"])
    expect("chapters" in f()).toBe(false)
    for (const s of f().steps) {
      expect("chapter" in s, s.id).toBe(false)
      expect("short" in s, s.id).toBe(false)
    }
  })

  it("puts Setup summary in the Skills panel, one click from every setup page, and selects it there", () => {
    expect(SKILLS_PANEL.map((i) => i.label())).toEqual(["Library", "Categories and tags", "Evaluation settings", "Groups of skills", "Course mapping", "Setup summary"])
    expect(SKILLS_PANEL.find((i) => i.key === "summary")?.screen).toBe(SETUP_RESULT_SCREEN)
    expect(selectedSkillsPanelKey(SETUP_RESULT_SCREEN)).toBe("summary")
  })
})

describe("presenter control", () => {
  const renderAt = (step: string, search = "set=1&present=1", f = flow()) => {
    nav.pathname = `/lab/flow/${f.id}/${step}`
    nav.search = search
    const st = f.steps.find((s) => s.id === step)!
    return render(
      <TooltipProvider>
        <LabPageProvider page={{ flow: f.id, step, screen: st.screen, variant: st.variants["1"] }}>
          <WalkthroughControls />
          <SampleDataBadge />
          <LabBar persona={f.persona} flow={f.id} step={step} set="1" variant={st.variants["1"]} />
        </LabPageProvider>
      </TooltipProvider>,
    )
  }

  it("shows step n of N, previous, next and exit, and nothing a client should not see (no Sample data chip either)", () => {
    const { container } = renderAt("settings")
    expect(screen.getByText("Step 7 of 12")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Previous: Categories and tags" })).toHaveAttribute("href", "/lab/flow/setup-walkthrough/categories?set=1&present=1")
    expect(screen.getByRole("link", { name: "Next: Groups of skills" }).getAttribute("href")).toMatch(/^\/lab\/flow\/setup-walkthrough\/lists\?/)
    expect(screen.getByRole("link", { name: "Exit" })).toHaveAttribute("href", WALKTHROUGH_EXIT)
    const text = `${container.textContent ?? ""} ${[...container.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label")).join(" ")}`
    for (const w of BANNED) expect(text, w).not.toContain(w)
  })

  it("shows no Sample data chip anywhere, in or out of present mode (Romit 2026-10-27, LEDGER D-L11)", () => {
    for (const search of ["set=1&present=1", "set=1"]) {
      nav.pathname = "/lab/flow/set-up-skills/map"
      nav.search = search
      const { container, unmount } = render(<LabPageProvider page={{ flow: "set-up-skills", step: "map" }}><SampleDataBadge /></LabPageProvider>)
      expect(container.textContent).not.toContain("Sample data")
      unmount()
    }
  })

  it("replaces the whole lab bar: no working bar and no floating present pill on a walkthrough step", () => {
    for (const [f, step] of [[flow(), "assign"], [ful(), "self"]] as const) {
      const { container, unmount } = renderAt(step, `set=1&present=1&${new URLSearchParams(f.steps.find((s) => s.id === step)!.params?.["1"] ?? {}).toString()}`, f)
      expect(container.querySelector("[data-lab-bar]")).toBeNull()
      expect(container.querySelector("[data-lab-present]")).toBeNull()
      expect(container.querySelectorAll("[data-lab-chrome]").length).toBe(1)
      unmount()
    }
  })

  it("marks Groups of skills optional with a Skip that goes to the assign step", () => {
    renderAt("lists")
    expect(screen.getByText("Step 8 of 12, optional")).toBeInTheDocument()
    const skip = screen.getByRole("link", { name: "Skip to Assign skills to student groups" })
    expect(skip).toHaveTextContent("Skip")
    expect(skip.getAttribute("href")).toMatch(/^\/lab\/flow\/setup-walkthrough\/assign\?/)
  })

  it("disables previous on the first step and finishes on the last", () => {
    renderAt("library")
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
    renderAt("result")
    expect(screen.getByRole("link", { name: "Finish the walkthrough" })).toHaveAttribute("href", WALKTHROUGH_EXIT)
  })

  // One name per step (2026-10-27): the lab bar step title outside present mode says the agreed name, for every step of both
  // walkthroughs. The flow route titles the page (the present breadcrumb) with the same string; the H1 and first heading are
  // checked at runtime by scripts/lab-present-check.mjs.
  for (const [f, list] of [[WALKTHROUGH_ID, AGREED], [FULFILLMENT_WALKTHROUGH_ID, AGREED_STUDENT]] as const) {
    for (const [id, label] of list) {
      it(`${f} ${id}: the lab bar step title and the presenter's step name are "${label}"`, () => {
        const fd = findFlow(f)!
        const own = new URLSearchParams(fd.steps.find((s) => s.id === id)!.params?.["1"] ?? {}).toString()
        const { container, unmount } = renderAt(id, `set=1${own ? `&${own}` : ""}`, fd)
        expect(container.querySelector("[data-lab-walkthrough]")).toBeNull()
        expect(container.querySelector("[data-lab-step] [aria-current=step]")?.textContent).toBe(label)
        unmount()
        expect(walkthroughPosition(f, id, new URLSearchParams(`set=1&present=1&${own}`))!.step.label).toBe(label)
      })
    }
  }
})

describe("no lab variant is deleted or hidden", () => {
  it("still registers 38 screens and at least 92 variants (2026-10-27: Categories and tags A and B added, D-L21; the evaluator directory's A and B live on as Settings A and B, section Evaluators, D-L24; 2026-10-28: Group check-off A and B added; 2026-10-30: director reports A and B live on as the Readiness tab of director Reports A and B, D-L8c)", () => {
    expect(SCREENS.length).toBe(40) // 2026-11-02: Evaluation settings and Setup summary added (Proposed); 2026-11-03: the placement sketch removed (Romit)
    expect(SCREENS.reduce((n, s) => n + s.variants.length, 0)).toBeGreaterThanOrEqual(92)
  })

  it("links every registered variant from the lab index (By persona), with both walkthrough entries", () => {
    nav.pathname = "/lab"
    nav.search = "view=persona"
    const { container } = render(<TooltipProvider><LabIndex /></TooltipProvider>)
    const hrefs = new Set([...container.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")))
    const missing: string[] = []
    for (const s of SCREENS) for (const v of s.variants) if (!hrefs.has(`/lab/${s.persona}/${s.slug}?variant=${v.id}`)) missing.push(`${screenKey(s)}/${v.id}`)
    expect(missing).toEqual([])
    expect(container.querySelector(`a[href="${WALKTHROUGH_ENTRY}"]`)).not.toBeNull()
    expect(container.querySelector(`a[href="${FULFILLMENT_ENTRY}"]`)).not.toBeNull()
  })
})
