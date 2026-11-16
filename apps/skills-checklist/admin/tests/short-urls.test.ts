import { describe, expect, it } from "vitest"
import { FLOWS, flowHref, findFlow, mainSteps } from "@/lib/lab/flows"
import { WALKTHROUGH_FLOWS } from "@/lib/lab/flows"
import { labHref } from "@/lib/lab/links"
import { screenHref, focusHref } from "@/lib/lab/screens"
import { walkthroughStart, walkthroughStepHref, WALKTHROUGH_ID, FULFILLMENT_WALKTHROUGH_ID, WALKTHROUGH_ROUTES } from "@/lib/lab/walkthrough"
import { ROLES, NAV_ROWS, roleForPath, actorIdFor } from "@/lib/v2/roles"
import { LEGACY_REDIRECTS } from "@/lib/redirects"
import { SHORT_REWRITES, WALKTHROUGH_FLOW_IDS, WALKTHROUGH_REDIRECTS, inFormOf, isFlowPath, isLabPath, isShortPath, isV2Path, toLong, toShort } from "@/lib/short-urls"

/** The pairs the user approved: short URL, the long route that serves it. */
const PAIRS: Array<[string, string]> = [
  ["/admin", "/lab/flow/setup-walkthrough"],
  ["/admin/lists?term=trm-fa26", "/lab/flow/setup-walkthrough/lists?term=trm-fa26"],
  ["/student", "/lab/flow/fulfillment-walkthrough"],
  ["/student/progress?skill=sk-1", "/lab/flow/fulfillment-walkthrough/progress?skill=sk-1"],
  ["/flow/set-up-skills", "/lab/flow/set-up-skills"],
  ["/flow/set-up-skills/library?set=2&term=trm-fa26", "/lab/flow/set-up-skills/library?set=2&term=trm-fa26"],
  ["/as/admin", "/lab/admin"],
  ["/as/admin/skills-library?variant=B", "/lab/admin/skills-library?variant=B"],
  ["/as/student/request-signoff#top", "/lab/student/request-signoff#top"],
  ["/proto", "/v2"],
  ["/proto/admin", "/v2/admin"],
  ["/proto/admin/review-queue/abc?x=1", "/v2/admin/review-queue/abc?x=1"],
  ["/all", "/lab"],
  ["/all?view=persona", "/lab?view=persona"],
]

/** A tiny matcher for the `:name` and `:name*` segments Next rewrites use, so the rules in next.config.ts are checked, not just the helpers. */
function applyRewrite(rule: { source: string; destination: string }, path: string): string | null {
  const src = rule.source.split("/").slice(1)
  const parts = path.split("/").slice(1)
  const vars: Record<string, string> = {}
  for (let i = 0; i < src.length; i++) {
    const s = src[i]!
    if (s.startsWith(":") && s.endsWith("*")) { vars[s.slice(1, -1)] = parts.slice(i).join("/"); return fill(rule.destination, vars) }
    if (s.startsWith(":")) { if (parts[i] === undefined || parts[i] === "") return null; vars[s.slice(1)] = parts[i]! }
    else if (parts[i] !== s) return null
  }
  return parts.length === src.length ? fill(rule.destination, vars) : null
}
const fill = (dest: string, vars: Record<string, string>) => dest.replace(/\/:(\w+)\*?/g, (_, k) => (vars[k] ? `/${vars[k]}` : "")) || "/"
const rewrite = (path: string): string => {
  for (const r of SHORT_REWRITES) { const out = applyRewrite(r, path); if (out) return out }
  return path
}

describe("short to long", () => {
  it.each(PAIRS)("%s serves %s", (short, long) => {
    expect(toLong(short)).toBe(long)
  })

  it.each(PAIRS)("the next.config rewrite rules agree for %s", (short, long) => {
    const [path, rest] = [short.split(/[?#]/)[0]!, short.slice(short.split(/[?#]/)[0]!.length)]
    expect(rewrite(path) + rest).toBe(long)
  })

  it("a long path is not rewritten by the short rules (every existing URL keeps working untouched)", () => {
    for (const [, long] of PAIRS) expect(rewrite(long.split(/[?#]/)[0]!)).toBe(long.split(/[?#]/)[0])
  })
})

describe("long to short and back", () => {
  const LONG = [
    "/lab", "/lab/admin", "/lab/admin/skills-library", "/lab/student/request-signoff?variant=A",
    "/lab/flow/set-up-skills", "/lab/flow/set-up-skills/library?set=1", "/lab/flow/setup-walkthrough/lists", "/lab/flow/fulfillment-walkthrough/send?course=c",
    "/lab/flow/setup-walkthrough", "/lab/flow/fulfillment-walkthrough",
    "/v2", "/v2/admin", "/v2/preceptor/lab-batch-grid?as=x", "/v2/student/history",
  ]
  it("toShort(toLong(x)) and toLong(toShort(x)) round-trip", () => {
    for (const l of LONG) {
      expect(toLong(toShort(l)), l).toBe(l)
      expect(toShort(toLong(toShort(l))), l).toBe(toShort(l))
    }
    for (const [short] of PAIRS) expect(toLong(toShort(toLong(short))), short).toBe(toLong(short))
  })

  it("legacy walkthrough long forms print the new short form", () => {
    expect(toShort("/lab/walkthrough/admin")).toBe("/admin")
    expect(toShort("/lab/walkthrough/fulfillment")).toBe("/student")
    expect(toShort("/lab/walkthrough/nope")).toBe("/lab/walkthrough/nope")
  })

  it("prints walkthrough flow steps as /admin and /student and every other flow step as /flow", () => {
    expect(toShort("/lab/flow/setup-walkthrough/lists")).toBe("/admin/lists")
    expect(toShort("/lab/flow/fulfillment-walkthrough/progress?x=1")).toBe("/student/progress?x=1")
    expect(toShort("/lab/flow/set-up-skills/library")).toBe("/flow/set-up-skills/library")
    expect(toShort("/lab/admin/skills-library")).toBe("/as/admin/skills-library")
    expect(toShort("/lab")).toBe("/all")
    expect(toShort("/v2/admin/outcomes")).toBe("/proto/admin/outcomes")
  })

  it("keeps the walkthrough flow ids in step with the registry", () => {
    expect([...WALKTHROUGH_FLOW_IDS].sort()).toEqual(WALKTHROUGH_FLOWS.map((f) => f.id).sort())
    expect([...WALKTHROUGH_FLOW_IDS].sort()).toEqual([FULFILLMENT_WALKTHROUGH_ID, WALKTHROUGH_ID].sort())
    for (const f of FLOWS) expect(WALKTHROUGH_FLOW_IDS.includes(f.id), f.id).toBe(false)
  })
})

describe("paths that are not the lab or the prototype are untouched", () => {
  const UNTOUCHED = [
    "/", "/e/abc123", "/e/abc123?x=1", "/home", "/courses", "/courses/off-1", "/reviews", "/attainment", "/skills/library", "/skills/library?tab=kits", "/my-skills", "/my-skills/sk-1",
    "/preceptor", "/dev/email", "/dev/state", "/api/import/status", "/overview", "/library/skills",
    "/lab/setup", "/lab/flow", "/lab/walkthrough", "/administrator", "/students", "/lab/admin/skills-library/extra", "/labs", "/lab-x/admin", "/v2x/admin", "/walker", "/flows/x", "/assets/x", "/allowed", "/protocol", "/unknown/path", "",
  ]
  it.each(UNTOUCHED)("toShort and toLong leave %j alone", (p) => {
    expect(toShort(p)).toBe(p)
    expect(toLong(p)).toBe(p)
  })

  it("the rewrite rules do not match them either", () => {
    for (const p of UNTOUCHED) if (p) expect(rewrite(p.split(/[?#]/)[0]!), p).toBe(p.split(/[?#]/)[0])
  })

  it("no short prefix collides with a legacy redirect source or an existing route", () => {
    for (const r of LEGACY_REDIRECTS) for (const rule of SHORT_REWRITES) expect(applyRewrite(rule, r.source.replace(/:\w+/g, "x")), `${r.source} vs ${rule.source}`).toBeNull()
  })
})

describe("pathname helpers accept both forms", () => {
  it("isLabPath, isFlowPath, isV2Path", () => {
    for (const p of ["/lab", "/all", "/lab/admin/x", "/as/admin/x", "/flow/a/b", "/admin/lists", "/student/progress", "/admin", "/lab/flow/a/b"]) expect(isLabPath(p), p).toBe(true)
    for (const p of ["/flow/a/b", "/lab/flow/a/b", "/admin/lists", "/student/progress"]) expect(isFlowPath(p), p).toBe(true)
    for (const p of ["/as/admin/x", "/lab/admin/x", "/all", "/v2/admin", "/home", "/e/t"]) expect(isFlowPath(p), p).toBe(false)
    for (const p of ["/v2", "/v2/admin", "/proto", "/proto/admin/outcomes"]) expect(isV2Path(p), p).toBe(true)
    for (const p of ["/lab", "/home", "/e/t", "/protocol"]) expect(isV2Path(p), p).toBe(false)
    for (const p of ["/home", "/e/t", "/skills/library"]) expect(isLabPath(p), p).toBe(false)
  })

  it("isShortPath and inFormOf write a url in the form of the page the browser shows", () => {
    expect(isShortPath("/as/admin/x")).toBe(true)
    expect(isShortPath("/lab/admin/x")).toBe(false)
    expect(inFormOf("/proto/admin", "/v2/admin/outcomes")).toBe("/proto/admin/outcomes")
    expect(inFormOf("/v2/admin", "/proto/admin/outcomes")).toBe("/v2/admin/outcomes")
    expect(inFormOf("/as/admin/x", "/lab/flow/set-up-skills")).toBe("/flow/set-up-skills")
    expect(inFormOf("/lab/admin/x", "/flow/set-up-skills")).toBe("/lab/flow/set-up-skills")
  })

  it("the v2 role helpers read a short path", () => {
    expect(roleForPath("/proto/director/outcomes")).toBe("director")
    expect(roleForPath("/v2/director/outcomes")).toBe("director")
    expect(roleForPath("/home")).toBeNull()
    expect(actorIdFor("preceptor", "/proto/preceptor/lab-batch-grid", null)).toBe(actorIdFor("preceptor", "/v2/preceptor/lab-batch-grid", null))
    expect(actorIdFor("preceptor", "/proto/preceptor/lab-batch-grid", null)).not.toBe(actorIdFor("preceptor", "/proto/preceptor/preceptor-evaluation", null))
  })
})

describe("the central link builders print the short form", () => {
  it("flowHref, labHref, screenHref and focusHref", () => {
    expect(flowHref("set-up-skills", "library", "2")).toBe("/flow/set-up-skills/library?set=2")
    expect(flowHref("setup-walkthrough", "lists", "1")).toBe("/admin/lists?set=1")
    expect(labHref("admin/skills-library", {}, { flowId: "set-up-skills", set: "2" })).toMatch(/^\/flow\/set-up-skills\/library\?set=2/)
    expect(labHref("admin/starter-library")).toBe("/as/admin/starter-library")
    expect(screenHref("admin", "skills-library", "B")).toBe("/as/admin/skills-library?variant=B")
    expect(focusHref("admin", "setup-summary")).toMatch(/^\/(as\/admin\/setup-summary|flow\/)/)
  })

  it("no builder prints a /lab/ URL", () => {
    const hrefs: string[] = []
    for (const f of FLOWS) for (const s of f.steps) hrefs.push(flowHref(f.id, s.id, f.recommendedSet), labHref(s.screen, {}, { flowId: f.id, set: f.recommendedSet }))
    for (const f of WALKTHROUGH_FLOWS) for (const s of f.steps) hrefs.push(walkthroughStepHref(f, s.id))
    expect(hrefs.length).toBeGreaterThan(50)
    for (const h of hrefs) expect(h.startsWith("/lab"), h).toBe(false)
  })

  it("the walkthrough start and every hop are clean: /admin|student/<step> with no set, present or term", () => {
    expect(walkthroughStart()).toBe("/admin/lists")
    for (const f of WALKTHROUGH_FLOWS) for (const s of mainSteps(f)) {
      const href = walkthroughStepHref(f, s.id)
      expect(href.startsWith(`/${f.id === WALKTHROUGH_ID ? "admin" : "student"}/${s.id}`), href).toBe(true)
      expect(href, href).not.toMatch(/walk|\/lab/)
      const q = new URLSearchParams(href.split("?")[1] ?? "")
      for (const k of ["set", "present", "term"]) expect(q.has(k), `${href} ${k}`).toBe(false)
    }
    // An explicit term is carried, not dropped.
    const f = findFlow(WALKTHROUGH_ID)!
    expect(walkthroughStepHref(f, "lists", new URLSearchParams("term=trm-sp27&present=1&set=1"))).toBe("/admin/lists?term=trm-sp27")
  })

  it("the old entry ids all open a walkthrough", () => {
    for (const id of ["admin", "student", "setup", "fulfillment", WALKTHROUGH_ID, FULFILLMENT_WALKTHROUGH_ID]) expect(WALKTHROUGH_ROUTES[id], id).toBeTruthy()
  })

  it("the v2 role links are /proto/...", () => {
    for (const r of ROLES) { expect(r.landing.startsWith("/proto/")).toBe(true); expect(r.home).toBe(r.landing) }
    for (const rows of Object.values(NAV_ROWS)) for (const r of rows) expect(r.url.startsWith("/proto/"), r.url).toBe(true)
  })
})

describe("the walkthrough addresses (Romit 2026-11-15: only the walkthroughs show, on short URLs without 'walk')", () => {
  const redirectFor = (path: string): string | null => {
    for (const r of WALKTHROUGH_REDIRECTS) { const out = applyRewrite(r, path); if (out) return out }
    return null
  }
  it("rewrites serve the flow routes and keep the query in the address", () => {
    expect(rewrite("/admin")).toBe("/lab/flow/setup-walkthrough")
    expect(rewrite("/admin/map")).toBe("/lab/flow/setup-walkthrough/map")
    expect(rewrite("/student")).toBe("/lab/flow/fulfillment-walkthrough")
    expect(rewrite("/student/send")).toBe("/lab/flow/fulfillment-walkthrough/send")
  })
  it("every old walkthrough address redirects (not permanently) to the new form", () => {
    expect(WALKTHROUGH_REDIRECTS.every((r) => r.permanent === false)).toBe(true)
    const cases: Array<[string, string]> = [
      ["/walk", "/admin"], ["/walk/admin", "/admin"], ["/walk/setup", "/admin"], ["/walk/setup-walkthrough", "/admin"],
      ["/walk/student", "/student"], ["/walk/fulfillment", "/student"], ["/walk/fulfillment-walkthrough", "/student"],
      ["/walk/setup-walkthrough/lists", "/admin/lists"], ["/walk/fulfillment-walkthrough/progress", "/student/progress"],
      ["/lab/flow/setup-walkthrough/lists", "/admin/lists"], ["/lab/flow/fulfillment-walkthrough/form", "/student/form"],
      ["/lab/walkthrough/admin", "/admin"], ["/lab/walkthrough/student", "/student"], ["/lab/walkthrough/setup", "/admin"],
      ["/flow/setup-walkthrough/map", "/admin/map"],
    ]
    for (const [from, to] of cases) expect(redirectFor(from), from).toBe(to)
    expect(redirectFor("/lab/flow/set-up-skills/library")).toBeNull()
  })
  it("no new address and no redirect target contains walk or /lab", () => {
    for (const r of WALKTHROUGH_REDIRECTS) expect(r.destination, r.source).not.toMatch(/walk|\/lab/)
    expect(toShort("/lab/flow/setup-walkthrough/lists")).not.toMatch(/walk|\/lab/)
  })
  it("the old /walk forms are no longer rewrites or short forms", () => {
    expect(toLong("/walk/setup-walkthrough/lists")).toBe("/walk/setup-walkthrough/lists")
    expect(isShortPath("/admin/lists")).toBe(true)
  })
})
