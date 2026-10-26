import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const nav = vi.hoisted(() => ({ pathname: "/lab/flow/set-up-skills/configure", search: "set=1&present=1", replace: vi.fn(), push: vi.fn() }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { LabBar } from "@/components/lab/lab-bar"
import { MARQUEE, NOT_READY, marqueeHref } from "@/lib/lab/present"
import { resolveStep } from "@/lib/lab/flows"
import { variantCounts } from "@/lib/lab/links"
import { SCREENS, screenKey } from "@/lib/lab/screens"

/**
 * Present mode (granola 2026-10-26 items 6, 20, 21): the client never sees internal labels. The lab bar collapses to an exit
 * control, the marquee list links only to built, recommended screens, and reporting is listed as not ready.
 */
beforeEach(() => {
  nav.search = "set=1&present=1"
  nav.replace.mockReset()
})

const renderBar = () => render(<TooltipProvider><LabBar persona="admin" flow="set-up-skills" step="configure" set="1" variant="A" /></TooltipProvider>)

describe("present mode", () => {
  it("replaces the lab bar with the exit control and shows no internal label", () => {
    const { container } = renderBar()
    expect(container.querySelector("[data-lab-bar]")).toBeNull()
    expect(screen.getByRole("button", { name: "Exit present mode" })).toBeInTheDocument()
    const text = container.textContent ?? ""
    for (const word of ["Tests", "Variant", "Components", "Scenario", "Tier", "Planned", "Built", "Set 1", "Guided", "More variants"]) expect(text).not.toContain(word)
  })

  it("exits by dropping present from the URL", () => {
    renderBar()
    screen.getByRole("button", { name: "Exit present mode" }).click()
    expect(nav.replace).toHaveBeenCalledWith("/lab/flow/set-up-skills/configure?set=1")
    expect(window.sessionStorage.getItem("lab:present")).toBe("0")
  })

  it("shows the working bar when present is off", () => {
    nav.search = "set=1"
    const { container } = renderBar()
    expect(container.querySelector("[data-lab-bar]")).not.toBeNull()
  })

  it("links every marquee screen to a built step in its flow's recommended set, in present mode", () => {
    expect(MARQUEE.map((m) => m.label)).toEqual(["Skills library", "Add a skill", "Configure a skill", "Assign to a cohort or group", "Course mapping", "My progress", "Log a skill", "Send for evaluation", "Evaluation form", "Evaluation submitted", "Approvals"])
    for (const m of MARQUEE) {
      const href = marqueeHref(m)
      const u = new URL(href, "http://lab.test")
      expect(u.searchParams.get("present")).toBe("1")
      const r = resolveStep(m.flow, m.step, u.searchParams.get("set"))
      expect(r, m.label).toBeDefined()
      expect(r!.set).toBe(r!.flow.recommendedSet)
      expect(r!.planned, m.label).toBe(false)
    }
    expect(NOT_READY.map((m) => m.label)).toEqual(["Dashboard", "Attainment", "Export", "Readiness and verification"])
  })
})

describe("variant counts agree between the index and the bar", () => {
  it("adds up to every registered variant for each screen in a flow", () => {
    for (const s of SCREENS) {
      const c = variantCounts(screenKey(s), s.variants.map((v) => v.id))
      if (c.inFlow) expect(c.inSets + c.outside, screenKey(s)).toBe(s.variants.length)
    }
    // Sankalp's case: 6 dashboard variants = 3 in the sets + 3 more.
    const dash = SCREENS.find((s) => screenKey(s) === "admin/dashboard")!
    expect(variantCounts("admin/dashboard", dash.variants.map((v) => v.id))).toEqual({ inSets: 3, outside: 3, inFlow: true })
  })
})
