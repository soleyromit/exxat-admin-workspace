import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
import { StudentShell } from "@/components/student-shell"
import { DevState } from "@/components/dev-state"
import EvaluatorLayout, { metadata as evaluatorMetadata } from "@/app/(evaluator)/layout"
import { PLACEHOLDERS, ROUTES, STUDENT_ROUTES, EVALUATOR_ROUTES } from "@/lib/skills-routes"
import { getRuntime } from "@/lib/store/react"

const noContrast = { rules: { "color-contrast": { enabled: false } } }

describe("admin shell nav is driven by the data (SC-15)", () => {
  it("shows Review and approve because the sample library has a skill with administrator approval on", () => {
    render(
      <TooltipProvider>
        <AppShellWiring>
          <SidebarShell>
            <AppSidebar variant="sidebar" />
          </SidebarShell>
        </AppShellWiring>
      </TooltipProvider>,
    )
    expect(screen.getAllByText("Reviews").length).toBeGreaterThan(0)
  })

  it("hides Review and approve when no configured skill has approval turned on (SC-15)", () => {
    getRuntime().reset()
    const r = getRuntime().run((db) => ({ ok: true as const, db: { ...db, skills: db.skills.map((s) => ({ ...s, requiresApproval: false })) }, value: undefined }))
    expect(r.ok).toBe(true)
    try {
      render(
        <TooltipProvider>
          <AppShellWiring>
            <SidebarShell>
              <AppSidebar variant="sidebar" />
            </SidebarShell>
          </AppShellWiring>
        </TooltipProvider>,
      )
      expect(screen.queryByText("Reviews")).toBeNull()
    } finally {
      getRuntime().reset()
    }
  })
})

describe("student shell", () => {
  it("is the slim student strip for My skills inside the shared shell: no own main landmark or skip link, a link back to Student View with a 44px target", async () => {
    const { container } = render(
      <StudentShell>
        <h1>My skills</h1>
      </StudentShell>,
    )
    // The one main landmark and the skip target belong to the shared shell (SidebarInset), not to this strip.
    expect(screen.queryByRole("main")).toBeNull()
    expect(screen.queryByRole("link", { name: "Skip to main content" })).toBeNull()
    // R5: the prototype has ONE Student View page. The strip only leads back to it (My skills is not in the prototype).
    const back = screen.getByRole("link", { name: "Back to Student View" })
    expect(back).toHaveAttribute("href", STUDENT_ROUTES.courses)
    expect(back.className).toContain("min-h-11")
    expect((await axe.run(container, noContrast)).violations).toEqual([])
  })

  it("names the acting student and nothing else about other students", () => {
    render(<StudentShell>x</StudentShell>)
    expect(screen.getByText(/Olivia Martin/)).toBeInTheDocument()
    expect(screen.queryByText(/Noah Zeller/)).toBeNull()
  })
})

describe("evaluator layout (EV-01): no shell", () => {
  it("renders the request only: no navigation landmark, no sidebar, no account menu, no links", () => {
    const { container } = render(
      <EvaluatorLayout>
        <h1>Evaluate Priya Tran</h1>
      </EvaluatorLayout>,
    )
    expect(screen.queryByRole("navigation")).toBeNull()
    expect(screen.queryByRole("banner")).toBeNull()
    expect(container.querySelector("aside")).toBeNull()
    expect(screen.queryAllByRole("link")).toHaveLength(0)
    expect(screen.getByRole("main")).toHaveTextContent("Evaluate Priya Tran")
  })

  it("e2e B6: the Prism wordmark sits inside the main landmark, never outside every landmark", () => {
    render(
      <EvaluatorLayout>
        <h1>Evaluate Priya Tran</h1>
      </EvaluatorLayout>,
    )
    expect(screen.getByRole("main")).toHaveTextContent("Prism")
  })

  it("sends no referrer and is never indexed (the link token is sensitive, L-8)", () => {
    expect(evaluatorMetadata.referrer).toBe("no-referrer")
    expect(evaluatorMetadata.robots).toEqual({ index: false, follow: false })
  })
})

describe("route registries", () => {
  it("builds every documented route (docs/ux/03 §4)", () => {
    expect(ROUTES.skillConfigure("sk-1")).toBe("/skills/library?dialog=configure&skill=sk-1")
    expect(ROUTES.overviewEvidence("s", "k")).toBe("/attainment?student=s&skill=k")
    expect(ROUTES.importReview("imp-1")).toBe("/skills/library?dialog=import")
    expect(STUDENT_ROUTES.history("o", "k")).toBe("/student?course=o&history=k") // R5: history is a dialog on the Student View
    expect(STUDENT_ROUTES.mySkill("k")).toBe("/my-skills/k")
    expect(EVALUATOR_ROUTES.evaluate("tok")).toBe("/e/tok") // the token is the only identifier in the URL
  })

  it("every placeholder points at a confirmed contract file", async () => {
    const fs = await import("node:fs")
    const path = await import("node:path")
    for (const m of Object.values(PLACEHOLDERS)) {
      const f = path.resolve(__dirname, "../../../docs", m.contract.replace(/^docs\//, ""))
      expect(fs.existsSync(f), m.contract).toBe(true)
    }
  })
})

describe("dev state page", () => {
  it("toggles the ONE display flag and resets the sample data; passes axe", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <div>
        <DevState />
      </div>,
    )
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    // Default is "merged" since 2026-10-08 (parity spec C-1): the prototype's three states.
    expect(getRuntime().getPrefs().skillStatusDisplay).toBe("merged")
    expect(screen.getAllByText("Not Started").length).toBe(2) // both merged states
    await user.click(screen.getByRole("radio", { name: "Four states" }))
    expect(getRuntime().getPrefs().skillStatusDisplay).toBe("four")
    expect(screen.getByText("No evidence yet")).toBeInTheDocument() // four-state preview
    await user.click(screen.getByRole("radio", { name: /Merged/ }))
    expect(getRuntime().getPrefs().skillStatusDisplay).toBe("merged")

    getRuntime().run((db) => ({ ok: true as const, db: { ...db, skills: [] }, value: undefined }))
    expect(getRuntime().getDb().skills).toHaveLength(0)
    await user.click(screen.getByRole("button", { name: "Reset sample data" }))
    expect(getRuntime().getDb().skills).toHaveLength(12)
    expect(await screen.findByText("Sample data was reset.")).toBeInTheDocument()
    expect((await axe.run(container, noContrast)).violations).toEqual([])
  })
})
