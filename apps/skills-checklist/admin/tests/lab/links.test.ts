import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { activeSetFor, flowFor, labHref, lettersOutsideSets, navHref, rewriteLabUrl, variantFor, type LinkContext } from "@/lib/lab/links"
import { FLOWS } from "@/lib/lab/flows"

/**
 * Romit: "variants and nav inside the variants aren't matching". Two halves:
 * 1. A lint over lib/lab and components/lab: no link may name a variant letter. Only the lab bar (lab-bar/**), the flow
 *    registry (flows.ts), the link builder (links.ts) and the explicit screen-variant browser (screens.ts `screenHref`) may.
 * 2. The set-aware link builder: every link from a set lands on that set's variant.
 */

const root = path.resolve(__dirname, "../..")
const ALLOW = [/^components\/lab\/lab-bar\//, /^lib\/lab\/flows\.ts$/, /^lib\/lab\/links\.ts$/, /^lib\/lab\/screens\.ts$/]
const PERSONAS = "admin|student|evaluator|reviewer|director|lab-instructor"
const RULES: Array<{ name: string; re: RegExp }> = [
  { name: "screen URL with a variant", re: new RegExp(`/lab/(${PERSONAS})/[a-z0-9-]+\\?variant=`) },
  { name: "variant letter in a query", re: /[?&]variant=[A-F]\b/ },
  { name: "variant letter passed to an href builder", re: /\bvariant:\s*["'][A-F]["']/ },
]

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p)
  }
  return out
}

describe("no hard-coded variant in lab links", () => {
  it("finds no variant letter in any href under lib/lab and components/lab", () => {
    const hits: string[] = []
    for (const dir of ["lib/lab", "components/lab"]) {
      for (const file of walk(path.join(root, dir))) {
        const rel = path.relative(root, file)
        if (ALLOW.some((a) => a.test(rel))) continue
        fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
          for (const r of RULES) if (r.re.test(line)) hits.push(`${rel}:${i + 1} ${r.name}: ${line.trim().slice(0, 120)}`)
        })
      }
    }
    expect(hits).toEqual([])
  })

  it("catches the patterns it is meant to catch", () => {
    const sample = ['href="/lab/admin/configure-skill?variant=A"', "`/lab/x?skill=1&variant=C`", 'dashboardHref(scope, { variant: "E" })']
    for (const s of sample) expect(RULES.some((r) => r.re.test(s)), s).toBe(true)
    expect(RULES.some((r) => r.re.test('<Button variant="outline" size="sm">'))).toBe(false)
  })
})

const params = (q: string) => new URLSearchParams(q)
const parse = (href: string) => {
  const u = new URL(href, "http://lab.test")
  return { path: u.pathname, q: u.searchParams }
}

describe("labHref", () => {
  const set2: LinkContext = { flowId: "set-up-skills", stepId: "library", set: "2", screen: "admin/skills-library", variant: "B", onFlowRoute: true, carry: params("set=2&term=Fall%202026&skill=x") }

  it("sends a link to another step of the page's flow to that step in the active set, with the scope", () => {
    const h = parse(labHref("admin/configure-skill", { skill: "sk-1" }, set2))
    expect(h.path).toBe("/lab/flow/set-up-skills/configure")
    expect(h.q.get("set")).toBe("2")
    expect(h.q.get("term")).toBe("Fall 2026")
    expect(h.q.get("skill")).toBe("sk-1")
  })

  it("never carries a variant letter, even when the caller passes one", () => {
    const h = parse(labHref("admin/import-ai-review", { variant: "C" }, set2))
    expect(h.q.has("variant")).toBe(false)
    expect(h.path).toBe("/lab/flow/set-up-skills/import")
  })

  it("lands the publish step when the link asks for the check step in that set", () => {
    expect(parse(labHref("admin/configure-skill", { section: "check", change: "sample" }, set2)).path).toBe("/lab/flow/set-up-skills/publish")
    expect(parse(labHref("admin/configure-skill", { step: "rule" }, set2)).path).toBe("/lab/flow/set-up-skills/configure")
  })

  it("keeps a self link on the same flow step", () => {
    expect(parse(labHref("admin/skills-library", { skill: "a" }, set2)).path).toBe("/lab/flow/set-up-skills/library")
  })

  it("uses the first flow holding a screen the page's flow does not have", () => {
    const h = parse(labHref("admin/attainment", {}, set2))
    expect(h.path).toBe("/lab/flow/watch-the-cohort/attainment")
    expect(h.q.get("set")).toBe("2")
  })

  it("falls back to the target flow's recommended set when the page's set does not exist there", () => {
    const ctx: LinkContext = { ...set2, set: "3" }
    expect(parse(labHref("admin/retire-deactivate", {}, ctx)).q.get("set")).toBe("1")
  })

  it("keeps a variant outside the sets on a self link (screen route)", () => {
    const ctx: LinkContext = { flowId: "watch-the-cohort", set: "1", screen: "admin/dashboard", variant: "D", carry: params("variant=D") }
    const h = parse(labHref("admin/dashboard", { list: "records" }, ctx))
    expect(h.path).toBe("/lab/admin/dashboard")
    expect(h.q.get("variant")).toBe("D")
  })

  it("keeps the set on a link to a screen in no flow", () => {
    const h = parse(labHref("admin/starter-library", {}, set2))
    expect(h.path).toBe("/lab/admin/starter-library")
    expect(h.q.get("set")).toBe("2")
    expect(h.q.has("variant")).toBe(false)
  })

  it("rewrites plain screen URLs and leaves everything else alone", () => {
    expect(parse(rewriteLabUrl("/lab/admin/configure-skill?skill=a", set2)).path).toBe("/lab/flow/set-up-skills/configure")
    expect(rewriteLabUrl("/lab", set2)).toBe("/lab")
    expect(rewriteLabUrl("/lab/flow/set-up-skills/map?set=2", set2)).toBe("/lab/flow/set-up-skills/map?set=2")
    expect(rewriteLabUrl("https://example.com/x", set2)).toBe("https://example.com/x")
    expect(rewriteLabUrl("/lab/admin/configure-skill?skill=a#rule", set2).endsWith("#rule")).toBe(true)
  })

  it("resolves every step of every set back to that set's letter", () => {
    for (const f of FLOWS) for (const set of f.sets) {
      const ctx: LinkContext = { flowId: f.id, set: set.id }
      for (const st of f.steps) {
        const letter = variantFor(st.screen, ctx)
        // A screen that appears twice in the flow (configure and publish) uses its first step's letter, which is the same.
        expect(letter, `${f.id}/${st.id} set ${set.id}`).toBe(st.variants[set.id])
      }
    }
  })
})

describe("active set", () => {
  it("prefers the URL set, then the inverse mapping, then the stored set", () => {
    expect(activeSetFor({ flowId: "set-up-skills", screen: "admin/course-mapping", variant: "A", urlSet: "3" })).toBe("3")
    expect(activeSetFor({ screen: "admin/import-ai-review", variant: "B" })).toBe("2")
    expect(activeSetFor({ screen: "admin/course-mapping", variant: "A", stored: "3" })).toBe("3")
    expect(activeSetFor({ screen: "admin/course-mapping", variant: "A" })).toBe("1")
    expect(activeSetFor({ screen: "admin/starter-library", variant: "A", stored: "2" })).toBe("2")
  })
})

describe("variants outside the sets", () => {
  it("lists the admin dashboard's C, D and E and nothing for fully covered screens", () => {
    expect(lettersOutsideSets("admin/dashboard", ["A", "B", "C", "D", "E", "F"])).toEqual(["C", "D", "E"])
    expect(lettersOutsideSets("admin/skills-library", ["A", "B", "C"])).toEqual([])
    expect(lettersOutsideSets("admin/starter-library", ["A", "B"])).toEqual([])
  })
})

describe("sidebar rows", () => {
  it("open their flow so every step of it highlights the row, keeping the set", () => {
    const ctx: LinkContext = { flowId: "set-up-skills", set: "2", screen: "admin/import-ai-review", variant: "B", onFlowRoute: true }
    expect(navHref("admin/skills-library", ctx)).toBe("/lab/flow/set-up-skills?set=2")
    expect(navHref("admin/dashboard", ctx)).toBe("/lab/flow/watch-the-cohort?set=2")
    expect(parse(navHref("admin/attainment", ctx)).path).toBe("/lab/flow/watch-the-cohort/attainment")
    expect(flowFor("admin/skills-library", "keep-library-right")?.id).toBe("keep-library-right")
    const keep: LinkContext = { flowId: "keep-library-right", set: "2", screen: "admin/settings", variant: "B", onFlowRoute: true }
    expect(navHref("admin/skills-library", keep)).toBe("/lab/flow/keep-library-right?set=2")
  })
})
