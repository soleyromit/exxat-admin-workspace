import * as React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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
import { WALKTHROUGH_STEPS_KEY } from "@/components/lab/lab-bar/walkthrough-visibility"
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
import { FULFILLMENT_ENTRY, FULFILLMENT_WALKTHROUGH_ID, WALKTHROUGH_ENTRY, WALKTHROUGH_EXIT, WALKTHROUGH_ID, WALKTHROUGH_ROUTES, effectiveStep, walkthroughPaths, walkthroughPosition, walkthroughStart } from "@/lib/lab/walkthrough"
import { toLong } from "@/lib/short-urls"
import { SKILLS_PANEL, selectedSkillsPanelKey } from "@/lib/lab/admin-ia"

/**
 * The two walkthroughs (Romit 2026-10-27, for Sankalp's Thursday meeting): the recommended design of each step in Sankalp's order,
 * driven by the product's own buttons, with a presenter control that shows no lab label, and with every lab variant still
 * registered and reachable outside them.
 */

// Agreed step names (2026-10-27): one string per step for the lab bar step title, the H1, the present breadcrumb and the first
// heading. Order: Sankalp's Thursday list (docs/knowledge/design/thursday-flows-sankalp.md), A1 to A6 and S1 to S2.
const AGREED = [
  // D-L64, D-L122: recommended pages only, the stops. Skill lists is the start; Library and the ways to add are side steps.
  ["lists", "Skill lists"],
  ["settings", "Evaluation settings"],
  ["map", "Course mapping"],
] as const
// D-L67: one student and one skill, from My progress to the evaluator and back, then the faculty's own way in. Log a skill, the
// email and My requests hang off these stops.
const AGREED_STUDENT = [
  ["progress", "My progress"],
  ["course", "Skills by course"],
  ["self", "Self-evaluation"],
  ["send", "Send for evaluation"],
  ["form", "Evaluation form"],
  ["result", "Skill progress"],
  ["faculty", "Faculty check-off"],
] as const
const MAYA = "stu-maya"
const NURS350 = "crs-nurs350"
const NG = "sk-ng-tube"

const flow = () => findFlow(WALKTHROUGH_ID)!
const ful = () => findFlow(FULFILLMENT_WALKTHROUGH_ID)!
const ctxFor = (step: string, search = "set=1&present=1"): LinkContext => ({ flowId: WALKTHROUGH_ID, stepId: step, set: "1", onFlowRoute: true, screen: flow().steps.find((s) => s.id === step)!.screen, variant: "A", carry: new URLSearchParams(search) })
const fulCtx = (step: string, search = "set=1&present=1"): LinkContext => {
  const st = ful().steps.find((s) => s.id === step)!
  return { flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: step, set: "1", onFlowRoute: true, screen: st.screen, variant: st.variants["1"], carry: new URLSearchParams(search) }
}
const landing = (href: string) => {
  const u = new URL(href, "http://lab.test")
  const [, , , flowId, stepId] = toLong(u.pathname).split("/")
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
    // No stop says optional: the bar holds only the path (D-L64).
    expect(flow().steps.filter((s) => s.tag === "Optional")).toEqual([])
    expect(ful().steps.filter((s) => s.tag === "Optional")).toEqual([])
  })

  it("uses the recommended variant of every screen, all built; the send steps use Send for evaluation C (course first)", () => {
    for (const id of [WALKTHROUGH_ID, FULFILLMENT_WALKTHROUGH_ID]) {
      for (const st of findFlow(id)!.steps) {
        const { persona, slug } = splitScreen(st.screen)
        const r = resolveStep(id, st.id, "1")!
        // Send C (course first), and the steps that show a second way in (mapping B opens by skill).
        const want = st.screen === "student/request-signoff" || st.id === "paste" || st.id === "map" ? st.variants["1"]! : findScreen(persona, slug)!.recommended
        expect(r.variant.id, st.id).toBe(want)
        expect(r.planned, st.id).toBe(false)
      }
    }
  })

  it("opens every stop on one student and one skill, and Send C on the course with its own step param", () => {
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, "progress", "1")!.params).toEqual({})
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, "course", "1")!.params).toEqual({ course: NURS350, skill: NG })
    for (const s of ["self", "send"]) expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, s, "1")!.params).toEqual({ course: NURS350, skills: NG, step: s })
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, "form", "1")!.params).toEqual({ student: MAYA, skills: NG, to: "pre-castillo" })
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, "result", "1")!.params).toEqual({ skill: NG })
    // Maya is the default student: a product link to her never names her, so no stop she reaches by a link may ask for it.
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, "faculty", "1")!.params).toEqual({ offering: "off-nurs350-fa26" })
    expect(ful().steps.filter((s) => s.side).map((s) => [s.id, s.after])).toEqual([["skills", "course"], ["email", "send"], ["requests", "result"], ["record", "result"], ["fix", "progress"]])
  })

  it("the student's path continues the admin's: Next on Course mapping opens My progress, Back from there returns, and Exit lists both", () => {
    const end = walkthroughPosition(WALKTHROUGH_ID, "map", new URLSearchParams("set=1&present=1"))!
    expect(landing(end.next!.href)).toMatchObject({ flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: "progress" })
    const start = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "progress", new URLSearchParams("set=1&present=1"))!
    expect(start.index).toBe(1)
    expect(landing(start.prev!.href)).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "map" })
    expect(walkthroughPaths().map((p) => p.title)).toEqual(["Admin walkthrough", "Student and evaluator"])
    expect(walkthroughPaths()[0]!.href).toBe(walkthroughStart())
  })

  it("has no assign stop (D-L106), opens Configure on the sample skill; Library and the ways to add are side steps of Skill lists", () => {
    expect(resolveStep(WALKTHROUGH_ID, "assign", "1")).toBeFalsy()
    expect(resolveStep(WALKTHROUGH_ID, "configure", "1")!.params).toEqual({ skill: NG })
    expect(flow().steps.filter((s) => s.side).map((s) => [s.id, s.after])).toEqual([["library", "lists"], ["categories", "lists"], ["configure", "lists"], ["add", "lists"], ["paste", "lists"], ["bulk", "lists"], ["starter", "lists"]])
    expect(resolveStep(WALKTHROUGH_ID, "map", "1")!.params).toEqual({})
    expect(resolveStep(WALKTHROUGH_ID, "map", "1")!.variant.id).toBe("B")
  })

  it("has one entry URL each that lands on the first step in present mode, both listed on the present index", () => {
    expect(WALKTHROUGH_ROUTES).toEqual({ admin: WALKTHROUGH_ID, student: FULFILLMENT_WALKTHROUGH_ID, setup: WALKTHROUGH_ID, fulfillment: FULFILLMENT_WALKTHROUGH_ID, [WALKTHROUGH_ID]: WALKTHROUGH_ID, [FULFILLMENT_WALKTHROUGH_ID]: FULFILLMENT_WALKTHROUGH_ID })
    // The short URL carries no `set=1` and no `present=1`: a walkthrough is presented in its one set, on the current term.
    expect(walkthroughStart()).toBe("/walk/setup-walkthrough/lists")
    expect(walkthroughStart(FULFILLMENT_WALKTHROUGH_ID)).toBe("/walk/fulfillment-walkthrough/progress")
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
    const own = `course=${NURS350}&skills=${NG}`
    expect(eff(ful(), "self", `${own}&step=self`)).toBe("self")
    expect(eff(ful(), "self", `${own}&step=send`)).toBe("send")
    // Log a skill hangs off the course stop, so it is never a stop of its own.
    expect(eff(ful(), "skills", `${own}&step=self`)).toBe("skills")
    // No Questions step (Romit 2026-10-27): the questions are read on Skills or answered on Self-evaluation.
    expect(ful().steps.some((s) => s.id === "questions")).toBe(false)
  })

  it("My progress with ?course= is the course step; an old Skill lists link with ?view=assign stays on Skill lists", () => {
    expect(eff(ful(), "progress", "")).toBe("progress")
    expect(eff(ful(), "progress", `course=${NURS350}&skill=${NG}`)).toBe("course")
    // A course link from My progress names no skill, and any course is the course view: the bar follows, and Next still pins the sample.
    expect(eff(ful(), "progress", `course=${NURS350}`)).toBe("course")
    expect(eff(ful(), "progress", "course=crs-nur220")).toBe("course")
    expect(eff(ful(), "progress", "")).toBe("progress")
    expect(eff(flow(), "lists", "view=assign")).toBe("lists")
    expect(eff(flow(), "lists", "")).toBe("lists")
  })

  it("keeps the route's step when no sibling matches (Change one skill on a skill just added)", () => {
    expect(eff(flow(), "configure", "skill=sk-new-1")).toBe("configure")
  })

  it("the presenter reads the effective step: 3 of 7 on Self-evaluation, Back to the course, and the sent request rides along", () => {
    const w = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "self", new URLSearchParams(`set=1&present=1&course=${NURS350}&step=self&skills=${NG}`))!
    expect([w.step.id, w.index, w.total]).toEqual(["self", 3, 7])
    expect(landing(w.prev!.href)).toMatchObject({ stepId: "course" })
    expect(landing(w.next!.href).stepId).toBe("send")
    // The chosen skills and the course ride along to the next Send C step.
    expect(landing(w.next!.href).q.get("skills")).toBe(NG)
    expect(landing(w.next!.href).q.get("course")).toBe(NURS350)
    const sent = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "self", new URLSearchParams(`set=1&present=1&course=${NURS350}&step=send&skills=${NG}&request=req-1`))!
    expect([sent.step.id, landing(sent.next!.href).stepId, landing(sent.next!.href).q.get("request")]).toEqual(["send", "form", "req-1"])
  })

  it("a course opened from My progress reads stop 2, and Next from stop 1 still pins the sample skill", () => {
    const onCourse = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "progress", new URLSearchParams(`set=1&present=1&course=${NURS350}`))!
    expect([onCourse.step.id, onCourse.index]).toEqual(["course", 2])
    expect(landing(onCourse.next!.href).q.get("skills")).toBe(NG)
    const stop1 = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "progress", new URLSearchParams("set=1&present=1"))!
    expect(landing(stop1.next!.href).q.get("skill")).toBe(NG)
    expect(landing(stop1.next!.href).q.get("course")).toBe(NURS350)
  })

  it("the fix flow is a side step of My progress: its bar stays, Back returns, and the product's links land on it", () => {
    const fix = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "fix", new URLSearchParams("set=1&present=1&submission=sub-maya-2"))!
    expect([fix.step.id, fix.index, fix.total]).toEqual(["fix", 1, 7])
    expect(landing(fix.prev!.href).stepId).toBe("progress")
    expect(landing(fix.next!.href).stepId).toBe("course")
    expect(landing(labHref("student/fix-returned", { submission: "sub-maya-2" }, { flowId: FULFILLMENT_WALKTHROUGH_ID, set: "1", onFlowRoute: true, screen: "student/home", variant: "A" }))).toMatchObject({ flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: "fix" })
  })

  it("Previous from the course view lands on My progress, not on the course again", () => {
    const w = walkthroughPosition(FULFILLMENT_WALKTHROUGH_ID, "course", new URLSearchParams(`set=1&present=1&course=${NURS350}&skill=${NG}`))!
    expect(landing(w.prev!.href)).toMatchObject({ stepId: "progress" })
    expect(landing(w.prev!.href).q.get("course")).toBeNull()
    expect(landing(w.next!.href).q.get("course")).toBe(NURS350)
  })
})

describe("the product's own buttons lead on inside the walkthrough", () => {
  it("One skill goes to its panel in the Library, on the same stop (D-L91)", () => {
    const l = landing(rewriteLabUrl(configureHref("sk-new-1"), ctxFor("add")))
    expect([l.flowId, l.stepId, l.q.get("skill"), l.q.get("present"), l.q.get("set")]).toEqual([WALKTHROUGH_ID, "library", "sk-new-1", "1", null])
  })

  it("every link to course mapping lands on its one stop, whichever view it asks for", () => {
    const l = landing(labHref("admin/course-mapping", { by: "skill" }, ctxFor("lists", "set=1&present=1&skill=sk-pressure-injury&view=assign")))
    expect([l.flowId, l.stepId, l.q.get("present")]).toEqual([WALKTHROUGH_ID, "map", "1"])
    const ctx = ctxFor("lists", "set=1&present=1&view=assign")
    expect(landing(labHref("admin/course-mapping", {}, ctx)).stepId).toBe("map")
    expect(landing(labHref("admin/course-mapping", { by: "course" }, ctx)).stepId).toBe("map")
    expect(landing(rewriteLabUrl(mappingLink({ offering: "off-x" }), ctx)).stepId).toBe("map")
    expect(l.q.get("view")).toBeNull()
  })

  it("the receipt's links stay inside the walkthrough (Done returns to Skills, Map to courses to mapping by skill)", () => {
    const ctx = ctxFor("configure", "set=1&present=1&skill=sk-pressure-injury")
    expect(landing(rewriteLabUrl(mappingHref("sk-pressure-injury"), ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "map" })
    expect(landing(labHref("admin/skills-library", { skill: "sk-pressure-injury" }, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "library" })
    // A link to the lists screen lands on Skill lists, an old one with view=assign too.
    expect(landing(labHref("admin/lists-cohorts", {}, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "lists" })
    expect(landing(labHref("admin/lists-cohorts", { view: "assign" }, ctx))).toMatchObject({ flowId: WALKTHROUGH_ID, stepId: "lists" })
    // A link to one skill's page lands on the Configure stop.
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
    expect(returnHref(bulk.q.get("from"), "/lab/admin/dashboard")).toBe("/as/admin/skills-library")
    expect(returnHref(null, "/lab/admin/dashboard")).toBe("/lab/admin/dashboard")
    expect(LEAF_TITLE["admin/import-ai-review"]()).toBe("Bulk upload")
  })

  it("student links stay inside the fulfillment walkthrough and land on Send C", () => {
    // By course: NURS 350 on My progress opens the course view.
    expect(landing(labHref("student/home", { course: NURS350, skill: NG }, fulCtx("progress")))).toMatchObject({ flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: "course" })
    // A row's Ask for evaluation opens the request on that course and skill, at its self-evaluation.
    const ask = landing(labHref("student/request-signoff", { course: NURS350, skills: NG, step: "self" }, fulCtx("course")))
    expect(ask).toMatchObject({ flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: "self" })
    expect([ask.q.get("course"), ask.q.get("skills"), ask.q.get("present")]).toEqual([NURS350, NG, "1"])
    expect(resolveStep(FULFILLMENT_WALKTHROUGH_ID, ask.stepId!, "1")!.variant.id).toBe("C")
    // The header's Log a skill lands on Send C's Skills step, a side step that keeps the path bar.
    expect(landing(labHref("student/request-signoff", {}, fulCtx("progress")))).toMatchObject({ stepId: "skills" })
    // The links off the path stay on it: the evaluator's form, My requests, My evaluations.
    expect(landing(rewriteLabUrl("/lab/evaluator/evaluation-form?request=req-1", fulCtx("send")))).toMatchObject({ stepId: "form" })
    expect(landing(labHref("student/my-requests", {}, fulCtx("result")))).toMatchObject({ flowId: FULFILLMENT_WALKTHROUGH_ID, stepId: "requests" })
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
        else if (f.then) expect(landing(w.next!.href)).toMatchObject({ flowId: f.then, stepId: mainSteps(findFlow(f.then)!)[0]!.id })
        else expect(w.next).toBeUndefined()
        if (i > 0) expect(landing(w.prev!.href).stepId).toBe(ids[i - 1])
        // Present mode needs no param on a hop: the /walk/... route is always presented (the address carries no present=1 and no set=1).
        for (const h of [w.prev?.href, w.next?.href]) if (h) { expect(landing(h).q.has("present")).toBe(false); expect(landing(h).q.has("set")).toBe(false); expect(h.startsWith("/walk/")).toBe(true) }
      })
    }
  })

  it("Course mapping follows Evaluation settings, and a page off the path keeps the bar: Back to its stop, Next to the stop after", () => {
    const w = walkthroughPosition(WALKTHROUGH_ID, "settings", new URLSearchParams("set=1&present=1"))!
    expect([w.index, w.total, landing(w.prev!.href).stepId, landing(w.next!.href).stepId]).toEqual([2, 3, "lists", "map"])
    const off = walkthroughPosition(WALKTHROUGH_ID, "paste", new URLSearchParams("set=1&present=1&how=several"))!
    expect([off.step.id, off.index, landing(off.prev!.href).stepId, landing(off.next!.href).stepId]).toEqual(["paste", 1, "lists", "settings"])
  })
})

describe("demo data: Sankalp's exact path shows the self-evaluation step", () => {
  const s = createSeed()
  it("sterile dressing change asks for a self-evaluation, is mandatory on NURS 350 and the demo student can still send it", () => {
    expect(selfEvalEnabled(skillById(s, "sk-sterile-dressing"))).toBe(true)
    // A questions skill rates its final result in the program's outcome words (no empty step that blocks Continue).
    // D-L73: a questions skill has no final result to rate; the student answers its questions.
    expect(selfEvalOptions(skillById(s, "sk-sterile-dressing")!)).toEqual([])
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
    expect(f().steps.map((s) => s.id)).toEqual(["lists", "settings", "map", "library", "categories", "configure", "add", "paste", "bulk", "starter"])
    expect("chapters" in f()).toBe(false)
    for (const s of f().steps) {
      expect("chapter" in s, s.id).toBe(false)
      expect("short" in s, s.id).toBe(false)
    }
  })

  it("Setup summary is off the Skills panel (D-L77); Categories and tags stays on it", () => {
    expect(SKILLS_PANEL.map((i) => i.label())).toEqual(["Skill lists", "Library", "Categories and tags", "Evaluation settings", "Course mapping"])
    expect(selectedSkillsPanelKey("admin/setup-result")).toBeUndefined()
    expect(selectedSkillsPanelKey("admin/categories-tags")).toBe("categories")
  })
})

describe("presenter control", () => {
  // The path bar is hidden by default (D-L139 amended, 2026-11-11); these tests read the bar the presenter turned on. Hidden by
  // default, the menu entry and the shortcut: tests/lab/walkthrough-no-bar.test.tsx.
  beforeEach(() => { window.localStorage.setItem(WALKTHROUGH_STEPS_KEY, "1") })
  afterEach(() => { window.localStorage.removeItem(WALKTHROUGH_STEPS_KEY) })
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

  it("shows the walkthrough, Back, the page, N of M, Next and Exit, and nothing else (no persona, flow, variant or score)", () => {
    const { container } = renderAt("settings")
    expect(screen.getByText("Admin walkthrough")).toBeInTheDocument()
    expect(screen.getByText("Evaluation settings")).toBeInTheDocument()
    expect(screen.getByText("2 of 3")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back: Skill lists" })).toHaveAttribute("href", "/walk/setup-walkthrough/lists")
    expect(screen.getByRole("link", { name: "Next: Course mapping" }).getAttribute("href")).toMatch(/^\/walk\/setup-walkthrough\/map(\?|$)/)
    expect(screen.getByRole("button", { name: "Exit" })).toBeInTheDocument()
    expect(WALKTHROUGH_EXIT).toBe("/all")
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
    for (const [f, step] of [[flow(), "lists"], [ful(), "self"]] as const) {
      const { container, unmount } = renderAt(step, `set=1&present=1&${new URLSearchParams(f.steps.find((s) => s.id === step)!.params?.["1"] ?? {}).toString()}`, f)
      expect(container.querySelector("[data-lab-bar]")).toBeNull()
      expect(container.querySelector("[data-lab-present]")).toBeNull()
      expect(container.querySelectorAll("[data-lab-chrome]").length).toBe(1)
      unmount()
    }
  })

  it("disables Back on the first stop and Next on the last", () => {
    renderAt("lists")
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
    // The admin's last stop leads on to the student's path; the last stop of that path ends it.
    renderAt("faculty", "set=1&present=1&offering=off-nurs350-fa26", ful())
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("carries no Skip or optional wording on any stop", () => {
    const { container } = renderAt("lists")
    expect(container.textContent).not.toMatch(/Skip|optional/i)
  })

  // One name per step (2026-10-27), read from the path bar. The flow route titles the page (the present breadcrumb) with the same
  // string; the H1 and first heading are checked at runtime by scripts/lab-present-check.mjs.
  for (const [f, list] of [[WALKTHROUGH_ID, AGREED], [FULFILLMENT_WALKTHROUGH_ID, AGREED_STUDENT]] as const) {
    for (const [id, label] of list) {
      it(`${f} ${id}: the path bar and the step name are "${label}"`, () => {
        const fd = findFlow(f)!
        const own = new URLSearchParams(fd.steps.find((s) => s.id === id)!.params?.["1"] ?? {}).toString()
        const { container, unmount } = renderAt(id, `set=1&present=1${own ? `&${own}` : ""}`, fd)
        expect(container.querySelector("[data-walkthrough-name]")?.textContent).toBe(label)
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
    for (const s of SCREENS) for (const v of s.variants) if (!hrefs.has(`/as/${s.persona}/${s.slug}?variant=${v.id}`)) missing.push(`${screenKey(s)}/${v.id}`)
    expect(missing).toEqual([])
    expect(container.querySelector(`a[href="${WALKTHROUGH_ENTRY}"]`)).not.toBeNull()
    expect(container.querySelector(`a[href="${FULFILLMENT_ENTRY}"]`)).not.toBeNull()
  })
})
