import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

vi.mock("next/navigation", () => ({
  usePathname: () => "/skills/library",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { LeoAmbienceProvider } from "@exxatdesignux/ui/components/ui/leo-ambience-context"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarShell } from "@exxatdesignux/ui/components/shell"
import { UtilityBar } from "@/components/shell/utility-bar"
import { CommandMenu } from "@/components/shell/skills-nav-palette"
import { pageTitleFor } from "@/components/shell/page-titles"
import { viewForPath } from "@/components/shell/view"
import { buildSkillsNav } from "@/lib/skills-nav"
import { PreceptorView } from "@/components/preceptor/preceptor-view"
import { ROUTES, STUDENT_ROUTES, PREVIEW_ROUTES } from "@/lib/skills-routes"

const noContrast = { rules: { "color-contrast": { enabled: false } } }

describe("menu hierarchy follows the Exxat Design OS shell (docs/build/ds-shell-anatomy.md)", () => {
  it("admin view is ONE flat list of the prototype's page labels, with no role groups", () => {
    const nav = buildSkillsNav({ showReview: true, view: "admin" })
    expect(nav.primary.map((i) => i.title)).toEqual(["Home", "Skills", "Courses", "Attainment", "Reviews"])
    // Skills is a single row: its sub-pages are tabs on the page, not nav children.
    expect(nav.primary.filter((i) => i.children?.length)).toEqual([])
  })

  it("Skills is one link to the library route with no children; every tab shares that pathname so the row stays active", () => {
    const lib = buildSkillsNav({ showReview: false, view: "admin" }).primary.find((i) => i.key === "skills")
    expect(lib?.url).toBe("/skills/library")
    expect(lib?.children).toBeUndefined()
    expect(new URL(ROUTES.kits, "http://x").pathname).toBe(ROUTES.skills)
  })

  it("student and evaluator are views with their own nav, reached from the profile menu", () => {
    const student = buildSkillsNav({ showReview: false, view: "student" }).primary
    const evaluator = buildSkillsNav({ showReview: false, view: "evaluator" }).primary
    expect(student.map((i) => i.title)).toEqual(["Student View", "My skills"])
    expect(student[0].url).toBe(STUDENT_ROUTES.courses)
    expect(evaluator.map((i) => i.title)).toEqual(["Preceptor Evaluation"])
    expect(evaluator[0].url).toBe(PREVIEW_ROUTES.preceptor)
  })

  it("derives the view from the route", () => {
    expect(viewForPath("/attainment")).toBe("admin")
    expect(viewForPath("/skills/library")).toBe("admin")
    expect(viewForPath("/student")).toBe("student")
    expect(viewForPath("/my-skills/sk-iv")).toBe("student")
    expect(viewForPath("/preceptor")).toBe("evaluator")
  })
})

describe("page titles", () => {
  it("maps routes to the prototype's page labels, longest prefix first", () => {
    expect(pageTitleFor("/attainment")).toBe("Attainment")
    expect(pageTitleFor("/home")).toBe("Home")
    expect(pageTitleFor("/skills/library")).toBe("Skills")
    expect(pageTitleFor("/courses/off-301-s27")).toBe("Courses")
    expect(pageTitleFor("/reviews")).toBe("Reviews")
    expect(pageTitleFor("/my-skills")).toBe("My skills")
    expect(pageTitleFor("/preceptor")).toBe("Preceptor Evaluation")
  })

  // Left failing on purpose: page-titles.ts has no entry for the still-existing student route
  // app/(shell)/(student)/courses/[offeringId]/skills, which viewForPath treats as the student view, so it titles as "Courses".
  it("titles the legacy student course-skills route as Student View", () => {
    expect(pageTitleFor("/courses/off-350-f26/skills")).toBe("Student View")
  })
})

function renderBar() {
  return render(
    <ThemeProvider>
      <TooltipProvider>
        <LeoAmbienceProvider>
          <SidebarShell>
            <UtilityBar />
          </SidebarShell>
        </LeoAmbienceProvider>
      </TooltipProvider>
    </ThemeProvider>,
  )
}

describe("utility bar (DS compact shell)", () => {
  it("has the DS anatomy in order: sidebar toggle, product switcher, page title, then search, notifications, help, Ask Leo, scope switcher, profile; and no axe violations", async () => {
    const { container } = renderBar()
    const bar = screen.getByRole("navigation", { name: "Global utilities" })
    const names = within(bar)
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent?.trim() ?? "")
    const order = [/sidebar/i, /Current product: Clinical Education/, /^Search$/, /Notifications/, /Help/, /Ask Leo/, /Sample University · Nursing/, /sample user/i]
    let last = -1
    for (const rx of order) {
      const at = names.findIndex((n, i) => i > last && rx.test(n))
      expect(at, `missing or out of order: ${rx}`).toBeGreaterThan(last)
      last = at
    }
    const crumbs = within(bar).getByRole("navigation", { name: "Breadcrumb" })
    expect(within(crumbs).getByText("Skills")).toHaveAttribute("aria-current", "page")
    // The old wordmark link is gone: the product switcher carries the brand.
    expect(within(bar).queryByRole("link", { name: /exxat Prism/ })).toBeNull()
    expect((await axe.run(container, noContrast)).violations).toEqual([])
  })

  it("the product switcher lists the Exxat products with Clinical Education current and the rest unavailable (no dead links)", async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole("button", { name: /Current product: Clinical Education/ }))
    const current = await screen.findByRole("menuitem", { name: /Clinical Education/ })
    expect(current).toHaveAttribute("aria-current", "true")
    for (const label of ["Exxat One", "Curriculum Mapping", "Compliance", "Surveys", "Exam Management"]) {
      expect(screen.getByRole("menuitem", { name: new RegExp(label) })).toHaveAttribute("aria-disabled", "true")
    }
  })

  it("the scope switcher shows school and program with the current program ticked", async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole("button", { name: /Sample University · Nursing/ }))
    expect(await screen.findByText("Program")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Nursing/ })).toHaveAttribute("aria-current", "true")
  })

  it("the profile menu switches view (persona) and points at sample data; there is no log out without sign-in", async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole("button", { name: /sample user, open profile/ }))
    expect(await screen.findByRole("menuitem", { name: /Switch to student view/ })).toHaveAttribute("href", STUDENT_ROUTES.courses)
    expect(screen.getByRole("menuitem", { name: /Switch to evaluator view/ })).toHaveAttribute("href", PREVIEW_ROUTES.preceptor)
    expect(screen.queryByRole("menuitem", { name: /Switch to administrator view/ })).toBeNull()
    expect(screen.getByRole("menuitem", { name: /Sample data/ })).toHaveAttribute("href", ROUTES.devState)
    expect(screen.queryByRole("menuitem", { name: /log out/i })).toBeNull()
  })

  it("Help lists the real shortcuts and Notifications shows its honest empty state", async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole("button", { name: /Notifications/ }))
    expect(await screen.findByText(/no notification feed/i)).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await user.click(screen.getByRole("button", { name: /Help/ }))
    expect(await screen.findByText("Keyboard shortcuts")).toBeInTheDocument()
  })

  it("Ask Leo opens a panel that says plainly Leo is not connected", async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getAllByRole("button", { name: /Ask Leo/ })[0])
    expect(await screen.findByText(/not connected to Skills tracking/i)).toBeInTheDocument()
  })
})

describe("command menu (Search, Cmd/Ctrl+K)", () => {
  it("opens without crashing, lists the pages and the view switches, and filters as you type", async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <TooltipProvider>
          <LeoAmbienceProvider>
            <SidebarShell>
              <CommandMenu />
              <UtilityBar />
            </SidebarShell>
          </LeoAmbienceProvider>
        </TooltipProvider>
      </ThemeProvider>,
    )
    await user.click(screen.getByRole("button", { name: "Search" }))
    const input = await screen.findByRole("combobox", { name: "Go to a page" })
    expect(screen.getByRole("option", { name: "Attainment" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Switch to student view" })).toBeInTheDocument()
    await user.type(input, "courses")
    expect(screen.getByRole("option", { name: "Courses" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Attainment" })).toBeNull()
  })
})

describe("Preceptor Evaluation page (prototype mailbox)", () => {
  it("lists evaluations sent with Open link, and opens the form with a way back", async () => {
    const user = userEvent.setup()
    render(<PreceptorView />)
    expect(await screen.findByRole("heading", { level: 1, name: "Preceptor Evaluation" })).toBeInTheDocument()
    expect(screen.getByText("Evaluations sent")).toBeInTheDocument()
    const open = screen.getAllByRole("button", { name: "Open link" })
    expect(open.length).toBeGreaterThan(0)
    await user.click(open[0])
    expect(screen.getByRole("button", { name: "Back to sent links" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Back to sent links" }))
    expect(screen.getByText("Evaluations sent")).toBeInTheDocument()
  })
})
