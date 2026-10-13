import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import axe from "axe-core"

vi.mock("next/navigation", () => ({
  usePathname: () => "/attainment",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { AppSidebar, SidebarShell } from "@exxatdesignux/ui/components/shell"
import { AppShellWiring } from "@/components/app-shell-wiring"
import { PlaceholderPage } from "@/components/placeholder-page"
import { PLACEHOLDERS, ROUTES } from "@/lib/skills-routes"
import { buildSkillsNav } from "@/lib/skills-nav"

describe("shell navigation", () => {
  it("renders the admin nav from the product config", () => {
    render(
      <TooltipProvider>
        <AppShellWiring>
          <SidebarShell>
            <AppSidebar variant="sidebar" />
          </SidebarShell>
        </AppShellWiring>
      </TooltipProvider>,
    )
    for (const label of ["Home", "Skills", "Courses", "Attainment"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    // Personas are views reached from the profile menu, not sibling nav groups (Exxat Design OS hierarchy).
    for (const label of ["Student View", "Preceptor Evaluation", "ADMINISTRATOR", "STUDENT", "EVALUATOR"]) {
      expect(screen.queryByText(label)).toBeNull()
    }
  })

  it("hides Review and approve until a skill has approval turned on (REQ SC-15)", () => {
    const without = buildSkillsNav({ showReview: false, view: "admin" }).primary.map((i) => i.url)
    const withReview = buildSkillsNav({ showReview: true, view: "admin" }).primary.map((i) => i.url)
    expect(without).not.toContain(ROUTES.review)
    expect(withReview).toContain(ROUTES.review)
  })
})

describe("placeholder page", () => {
  it("has one h1 and no axe violations", async () => {
    const { container } = render(
      <main>
        <PlaceholderPage meta={PLACEHOLDERS.overview} />
      </main>,
    )
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    const results = await axe.run(container, {
      // jsdom has no layout engine, so colour contrast cannot be computed here.
      rules: { "color-contrast": { enabled: false } },
    })
    expect(results.violations).toEqual([])
  })
})
