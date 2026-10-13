import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"

vi.mock("next/navigation", () => ({
  usePathname: () => "/student",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

import userEvent from "@testing-library/user-event"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { LeoAmbienceProvider } from "@exxatdesignux/ui/components/ui/leo-ambience-context"
import { AppSidebar, SidebarShell } from "@exxatdesignux/ui/components/shell"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShellWiring } from "@/components/app-shell-wiring"
import { UtilityBar } from "@/components/shell/utility-bar"
import { ROUTES } from "@/lib/skills-routes"

function renderShell() {
  return render(
    <ThemeProvider>
      <TooltipProvider>
        <LeoAmbienceProvider>
          <AppShellWiring>
            <SidebarShell>
              <UtilityBar />
              <AppSidebar variant="sidebar" />
            </SidebarShell>
          </AppShellWiring>
        </LeoAmbienceProvider>
      </TooltipProvider>
    </ThemeProvider>,
  )
}

describe("student view (persona) on /student", () => {
  it("swaps the left nav to the student rows and shows a chip with the way back to the administrator view", () => {
    renderShell()
    const sidebar = screen.getByRole("navigation", { name: "Application" })
    expect(within(sidebar).getByText("Student View")).toBeInTheDocument()
    expect(within(sidebar).getByText("My skills")).toBeInTheDocument()
    expect(within(sidebar).queryByText("Attainment")).toBeNull()
    const bar = screen.getByRole("navigation", { name: "Global utilities" })
    expect(within(bar).getByText(/Previewing as student/)).toBeInTheDocument()
    expect(within(bar).getByRole("link", { name: "Back to administrator" })).toHaveAttribute("href", ROUTES.home)
  })

  it("the profile menu then offers administrator and evaluator, not student", async () => {
    const user = userEvent.setup()
    renderShell()
    await user.click(screen.getByRole("button", { name: /sample user, open profile/ }))
    expect(await screen.findByRole("menuitem", { name: /Switch to administrator view/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Switch to evaluator view/ })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: /Switch to student view/ })).toBeNull()
  })
})
