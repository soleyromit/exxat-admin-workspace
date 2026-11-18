/**
 * Sankalp point 7 (2026-11-15, "no way to exit back to the skill lists page; navigation feels broken"):
 * 1. The "Skills" crumb leads to Skill lists, as the Skills row does; every crumb before the leaf is a link; a page reached from a list
 *    sits under Skills; the breadcrumb is named "Breadcrumb".
 * 2. Links out of step 3 of New skill list carry the way back to that step.
 * 3. Removed with the four-step New skill list panel (D-LS1116-d).
 */
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render } from "@testing-library/react"

const nav = vi.hoisted(() => ({ pathname: "/lab", search: "" }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { LabFrame, LabProviders } from "@/components/lab/lab-frame"
import { resolveStep } from "@/lib/lab/flows"
import { fromSetup, returnTarget } from "@/lib/lab/return-to"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { programLists } from "@/lib/lab/lists"

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
})

const WALK = "setup-walkthrough"

function crumbsOn(step: string, search = ""): Array<{ text: string; href: string | null }> {
  // Bulk upload is no longer a walkthrough stop (D-ADD1117): its crumbs are read on its own lab route.
  const bulk = step === "bulk"
  const r = bulk ? null : resolveStep(WALK, step, "1")!
  nav.pathname = bulk ? "/lab/admin/import-ai-review" : `/lab/flow/${WALK}/${step}`
  nav.search = search
  const page = r ? { flow: WALK, step, screen: `${r.screen.persona}/${r.screen.slug}`, variant: r.variant.id } : { screen: "admin/import-ai-review", variant: "A" }
  const { container, unmount } = render(
    <LabProviders><LabFrame persona="admin" navPersona="admin" page={page}><div>page</div></LabFrame></LabProviders>,
  )
  expect(container.querySelector('[aria-label="Lab location"]')).toBeNull()
  const full = container.querySelector('nav[aria-label="Breadcrumb"] ol')
  expect(full).not.toBeNull()
  const out = Array.from(full!.querySelectorAll("li[data-slot=breadcrumb-item], li")).filter((li) => !li.getAttribute("role")).map((li) => {
    const a = li.querySelector("a")
    return { text: (li.textContent ?? "").trim(), href: a ? a.getAttribute("href") : null }
  }).filter((c) => c.text && !(step === "bulk" && c.text === "Administrator"))
  unmount()
  return out
}

describe("1. The Skills crumb leads to Skill lists everywhere", () => {
  it.each(["lists", "library", "settings", "categories", "map"])("on %s: Dashboard links to the PRISM home and Skills to Skill lists", (step) => {
    const crumbs = crumbsOn(step)
    expect(crumbs.find((c) => c.text === "Dashboard")?.href).toBe("/")
    expect(crumbs.find((c) => c.text === "Skills")?.href).toBe("/admin/lists")
    // Every crumb before the leaf is a link.
    for (const c of crumbs.slice(0, -1)) expect(c.href, c.text).not.toBeNull()
  })

  it("Bulk upload opened from a list reads Dashboard > Skills > Skill lists > Bulk upload", () => {
    const crumbs = crumbsOn("bulk", "from=lists&to=list-clinical&list=list-clinical")
    expect(crumbs.map((c) => c.text).filter((t) => t !== "Design lab" && t !== "Admin")).toEqual(["Dashboard", "Skills", "Skill lists", "Bulk upload"])
    // Off the walkthrough since D-ADD1117, so the crumb leads to Skill lists on the lab's own path.
    expect(crumbs.find((c) => c.text === "Skills")?.href).toMatch(/\/lists(\?|$)/)
  })

  it("Evaluation settings opened from step 3 of a list leads back to that list's step 3, by name", () => {
    const state = labState(createSeed())
    const list = programLists(state)[0]!
    const crumbs = crumbsOn("settings", `from=setup&list=${list.id}`)
    const back = crumbs.find((c) => c.text === list.name)
    expect(back?.href).toContain(`list=${list.id}`)
    expect(back?.href).toContain("setup=configure")
  })
})

describe("2. Links out of step 3 carry the way back", () => {
  it("fromSetup adds from=setup and the list; the return target reopens step 3 of that list", () => {
    expect(fromSetup("/admin/library?skill=sk-1", "list-a")).toBe("/admin/library?skill=sk-1&from=setup&list=list-a")
    expect(returnTarget("setup", "list-a")?.href).toMatch(/list=list-a&setup=configure$/)
  })
})

// Section 3 (Esc on step 4 back to step 3) was removed with the four-step New skill list panel (D-LS1116-d, Romit 2026-11-16).

