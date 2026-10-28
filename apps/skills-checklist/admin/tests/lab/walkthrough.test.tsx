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
import { LEAF_TITLE, returnHref, withFrom } from "@/lib/lab/return-to"
import { PRESENT_WALKTHROUGHS } from "@/lib/lab/present"
import { SCREENS, findScreen, screenKey } from "@/lib/lab/screens"
import { buildStudent } from "@/lib/lab/student"
import { selfEvalEnabled } from "@/lib/lab/student2"
import { skillById } from "@/lib/v2/evidence-index"
import { createSeed } from "@/lib/v2/seed"
import { FULFILLMENT_ENTRY, FULFILLMENT_WALKTHROUGH_ID, WALKTHROUGH_ENTRY, WALKTHROUGH_EXIT, WALKTHROUGH_ID, WALKTHROUGH_ROUTES, effectiveStep, walkthroughPosition, walkthroughStart } from "@/lib/lab/walkthrough"

/**
 * The two walkthroughs (Romit 2026-10-27, for Sankalp's Thursday meeting): the recommended design of each step in Sankalp's order,
 * driven by the product's own buttons, with a presenter control that shows no lab label, and with every lab variant still
 * registered and reachable outside them.
 */

// Agreed step names (2026-10-27): one string per step for the lab bar step title, the H1, the present breadcrumb and the first
// heading. Order: Sankalp's Thursday list (docs/knowledge/design/thursday-flows-sankalp.md), A1 to A6 and S1 to S2.
const AGREED = [
  ["library", "Skills"], // A1, one at a time (Add a skill) and Add several from here
  ["add", "Add a skill"], // A1
  ["bulk", "Bulk upload"], // A1, bulk (Import)
  ["categories", "Categories and tags"], // A2
  ["configure", "Configure the skill"], // A3
  ["publish", "Check and save"], // A3, through the receipt
  ["lists", "Groups of skills"], // A4, optional
  ["assign", "Assign skills to student groups"], // A5
  ["map", "Course mapping"], // A6
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
    expect(flow().steps.filter((s) => s.tag === "Optional").map((s) => s.id)).toEqual(["lists"])
    expect(ful().steps.filter((s) => s.tag === "Optional")).toEqual([])
  })

  it("uses the recommended variant of every screen, all built; the send steps use Send for evaluation C (course first)", () => {
    for (const id of [WALKTHROUGH_ID, FULFILLMENT_WALKTHROUGH_ID]) {
      for (const st of findFlow(id)!.steps) {
        const { persona, slug } = splitScreen(st.screen)
        const r = resolveStep(id, st.id, "1")!
        const want = st.screen === "student/request-signoff" ? "C" : findScreen(persona, slug)!.recommended
        expect(r.variant.id, st.id).toBe(want)
        expect(r.planned, st.id).toBe(false)
      }
    }
  })

  it("opens each Send C step on NURS 350 with its own step param", () => {
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, "course", "1")!.params).toEqual({ course: "crs-nurs350" })
    for (const s of ["skills", "self", "send"]) expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, s, "1")!.params).toEqual({ course: "crs-nurs350", step: s })
  })

  it("opens the assign step in assign mode, configure on a skill not configured yet, and Check and save on the check step", () => {
    expect(resolveStep(WALKTHROUGH_ID, "assign", "1")!.params).toEqual({ view: "assign" })
    expect(resolveStep(WALKTHROUGH_ID, "configure", "1")!.params).toEqual({ skill: "sk-pressure-injury" })
    // Check and save needs a rule to compare: a configured skill (vital signs) with a sample change, before and after.
    expect(resolveStep(WALKTHROUGH_ID, "publish", "1")!.params).toEqual({ skill: "sk-vitals", step: "check", change: "sample" })
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

  it("keeps the route's step when no sibling matches (configure on a skill just added; Check and save on it)", () => {
    expect(eff(flow(), "configure", "skill=sk-new-1")).toBe("configure")
    expect(eff(flow(), "publish", "skill=sk-new-1&step=check&change=sample")).toBe("publish")
    expect(eff(flow(), "publish", "skill=sk-vitals&step=check&change=sample")).toBe("publish")
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

  it("Map to courses (assign footer) opens the map step", () => {
    const l = landing(labHref("admin/course-mapping", {}, ctxFor("assign", "set=1&present=1&skill=sk-pressure-injury&view=assign")))
    expect([l.flowId, l.stepId, l.q.get("present")]).toEqual([WALKTHROUGH_ID, "map", "1"])
    expect(l.q.get("view")).toBeNull()
  })

  it("the receipt's links stay inside the walkthrough (Done returns to Skills, Map to courses to the map step)", () => {
    const ctx = ctxFor("publish", "set=1&present=1&skill=sk-pressure-injury")
    expect(landing(rewriteLabUrl(mappingHref("sk-pressure-injury"), ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "map" })
    expect(landing(labHref("admin/skills-library", { skill: "sk-pressure-injury" }, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "library" })
    // A plain link to the lists screen lands on Groups of skills; one with view=assign on the assign step.
    expect(landing(labHref("admin/lists-cohorts", {}, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "lists" })
    expect(landing(labHref("admin/lists-cohorts", { view: "assign" }, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "assign" })
    // A deep link to the check step on the Check and save skill lands on Check and save (the most specific step wins).
    expect(landing(labHref("admin/configure-skill", { skill: "sk-vitals", step: "check", change: "sample" }, ctxFor("configure")))).toMatchObject({ stepId: "publish" })
  })

  it("Import's Open the library and the library's Start a new list stay inside the walkthrough", () => {
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

  it("does not carry the skill back to the library and add steps (it would open a skill panel there)", () => {
    const w = walkthroughPosition(WALKTHROUGH_ID, "configure", new URLSearchParams("set=1&present=1&skill=sk-pressure-injury"))!
    expect(landing(w.prev!.href).q.get("skill")).toBeNull()
    // A step's own params win: Check and save opens on its configured skill, Groups of skills onward carry the skill in hand.
    expect([...landing(w.next!.href).q.entries()]).toEqual(expect.arrayContaining([["skill", "sk-vitals"], ["step", "check"], ["change", "sample"]]))
    const after = walkthroughPosition(WALKTHROUGH_ID, "publish", new URLSearchParams("set=1&present=1&skill=sk-vitals&step=check&change=sample"))!
    expect(landing(after.next!.href).q.get("skill")).toBe("sk-vitals")
    expect(landing(after.next!.href).q.get("step")).toBeNull()
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
    const { container } = renderAt("configure")
    expect(screen.getByText("Step 5 of 9")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Previous: Categories and tags" })).toHaveAttribute("href", "/lab/flow/setup-walkthrough/categories?set=1&present=1")
    expect(screen.getByRole("link", { name: "Next: Check and save" }).getAttribute("href")).toMatch(/^\/lab\/flow\/setup-walkthrough\/publish\?/)
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
    expect(screen.getByText("Step 7 of 9, optional")).toBeInTheDocument()
    const skip = screen.getByRole("link", { name: "Skip to Assign skills to student groups" })
    expect(skip).toHaveTextContent("Skip")
    expect(skip.getAttribute("href")).toMatch(/^\/lab\/flow\/setup-walkthrough\/assign\?/)
  })

  it("disables previous on the first step and finishes on the last", () => {
    renderAt("library")
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled()
    renderAt("map")
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
  it("still registers 39 screens and at least 94 variants (2026-10-27: Categories and tags A and B added, D-L21; the evaluator directory's A and B live on as Settings A and B, section Evaluators, D-L24; 2026-10-28: Group check-off A and B added)", () => {
    expect(SCREENS.length).toBe(39)
    expect(SCREENS.reduce((n, s) => n + s.variants.length, 0)).toBeGreaterThanOrEqual(94)
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
