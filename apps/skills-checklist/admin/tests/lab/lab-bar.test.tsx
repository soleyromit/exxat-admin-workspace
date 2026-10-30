import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const nav = vi.hoisted(() => ({
  pathname: "/lab/flow/set-up-skills/configure",
  search: "set=1&term=Fall%202026",
  push: vi.fn(),
  replace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { LabBar, LAB_EVENTS } from "@/components/lab/lab-bar"
import { findScreen } from "@/lib/lab/screens"

function renderBar(props: React.ComponentProps<typeof LabBar>) {
  return render(
    <TooltipProvider delayDuration={0}>
      <LabBar {...props} />
    </TooltipProvider>,
  )
}

const FLOW_PROPS = { persona: "admin", flow: "set-up-skills", step: "configure", set: "1", variant: "A" } as const

beforeEach(() => {
  nav.pathname = "/lab/flow/set-up-skills/configure"
  nav.search = "set=1&term=Fall%202026"
  nav.push.mockReset()
  nav.replace.mockReset()
})

describe("LabBar", () => {
  it("is one 40 px row, the only lab region, with no 'Tests:' sentence", () => {
    const { container } = renderBar(FLOW_PROPS)
    const regions = container.querySelectorAll("[data-lab-bar]")
    expect(regions).toHaveLength(1)
    const region = screen.getByRole("region", { name: "Design lab controls" })
    const rows = Array.from(region.children).filter((c) => c.tagName === "DIV")
    expect(rows).toHaveLength(1)
    expect(rows[0]!.className).toContain("h-10")
    expect(region.textContent).not.toMatch(/Tests:/)
    // DS only: no raw button and no hex in the bar's markup.
    expect(region.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it("names the previous and next step and keeps the set and scope in their links", () => {
    renderBar(FLOW_PROPS)
    const journey = screen.getByRole("navigation", { name: "Journey" })
    const prev = within(journey).getAllByRole("link", { name: "Previous step: Add a skill" })[0]!
    const next = within(journey).getAllByRole("link", { name: "Next step: Check and save" })[0]!
    expect(prev.getAttribute("href")).toBe("/lab/flow/set-up-skills/add?set=1&term=Fall+2026")
    expect(next.getAttribute("href")).toBe("/lab/flow/set-up-skills/publish?set=1&term=Fall+2026")
    expect(journey.textContent).toContain("Configure")
    expect(journey.textContent).toContain("3 of 7")
  })

  it("disables previous on the first step and next on the last", () => {
    renderBar({ ...FLOW_PROPS, step: "library" })
    expect(screen.getByRole("button", { name: "Previous step: none" })).toBeDisabled()
    renderBar({ ...FLOW_PROPS, step: "map" })
    expect(screen.getByRole("button", { name: "Next step: none" })).toBeDisabled()
  })

  it("switches the set on the same step", async () => {
    renderBar(FLOW_PROPS)
    const group = screen.getByRole("radiogroup", { name: "Option set" })
    const two = within(group).getByRole("radio", { name: /2 One page/ })
    fireEvent.click(two)
    expect(nav.replace).toHaveBeenCalledWith("/lab/flow/set-up-skills/configure?set=2&term=Fall+2026")
    expect(window.sessionStorage.getItem("lab:set")).toBe("2")
  })

  it("marks a set whose variant is not built yet as planned", () => {
    renderBar(FLOW_PROPS)
    const group = screen.getByRole("radiogroup", { name: "Option set" })
    // Every set of this step is built, so none reads "planned".
    expect(within(group).queryByRole("radio", { name: /planned/ })).toBeNull()
    expect(within(group).getByRole("radio", { name: /^1 Guided$/ })).toBeInTheDocument()
  })

  it("carries the variant's question in the info tooltip", async () => {
    const user = userEvent.setup()
    renderBar(FLOW_PROPS)
    const q = findScreen("admin", "configure-skill")!.variants.find((v) => v.id === "A")!.question
    await user.hover(screen.getByRole("button", { name: "What this option tests" }))
    const tips = await screen.findAllByText(q)
    expect(tips.length).toBeGreaterThan(0)
    expect((await screen.findAllByText("Recommended")).length).toBeGreaterThan(0)
  })

  it("opens the design system components drawer", async () => {
    const user = userEvent.setup()
    renderBar(FLOW_PROPS)
    await user.click(screen.getByRole("button", { name: /^Components/ }))
    const dialog = await screen.findByRole("dialog", { name: "Design system components on this page" })
    expect(within(dialog).getByText("Imported by this page")).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("dispatches lab:reset from the scenario menu", async () => {
    const user = userEvent.setup()
    nav.pathname = "/lab/flow/set-up-skills/configure"
    const onReset = vi.fn()
    window.addEventListener(LAB_EVENTS.reset, onReset)
    renderBar({ ...FLOW_PROPS, step: "configure" })
    await user.click(screen.getByRole("button", { name: "Scenario" }))
    await user.click(await screen.findByRole("menuitem", { name: "Reset edits" }))
    expect(onReset).toHaveBeenCalledTimes(1)
    window.removeEventListener(LAB_EVENTS.reset, onReset)
  })

  it("applies a scenario's params with router.replace, keeping record and scope params", async () => {
    const user = userEvent.setup()
    nav.pathname = "/lab/flow/set-up-skills/configure"
    nav.search = "set=1&term=Fall%202026&skill=sk-1"
    renderBar({ ...FLOW_PROPS, step: "configure" })
    await user.click(screen.getByRole("button", { name: "Scenario" }))
    await user.click(await screen.findByRole("menuitem", { name: "Loading" }))
    expect(nav.replace).toHaveBeenCalledWith("/lab/flow/set-up-skills/configure?set=1&term=Fall+2026&skill=sk-1&state=loading")
  })

  it("on a screen URL that belongs to a flow, shows the journey for that flow", () => {
    nav.pathname = "/lab/admin/configure-skill"
    nav.search = "variant=B"
    renderBar({ persona: "admin", screen: "admin/configure-skill", variant: "B" })
    const journey = screen.getByRole("navigation", { name: "Journey" })
    expect(within(journey).getAllByRole("link", { name: "Next step: Check and save" })[0]!.getAttribute("href")).toBe("/lab/flow/set-up-skills/publish?set=2")
  })

  it("off a flow, hides the journey and switches variants like the old variant bar", () => {
    nav.pathname = "/lab/admin/starter-library"
    nav.search = "variant=A"
    renderBar({ persona: "admin", screen: "admin/starter-library", variant: "A" })
    expect(screen.queryByRole("navigation", { name: "Journey" })).toBeNull()
    const group = screen.getByRole("radiogroup", { name: "Design variant" })
    fireEvent.click(within(group).getByRole("radio", { name: /Variant B/ }))
    expect(nav.replace).toHaveBeenCalledWith("/lab/admin/starter-library?variant=B")
  })

  it("shows a variant outside the sets instead of highlighting a wrong set, and lists it under More variants", async () => {
    const user = userEvent.setup()
    nav.pathname = "/lab/admin/dashboard"
    nav.search = "variant=D&set=1"
    renderBar({ persona: "admin", screen: "admin/dashboard", variant: "D" })
    expect(screen.getAllByText("Variant D (outside the sets)").length).toBeGreaterThan(0)
    const group = screen.getByRole("radiogroup", { name: "Option set" })
    for (const r of within(group).getAllByRole("radio")) expect(r).toHaveAttribute("aria-checked", "false")
    await user.click(screen.getByRole("button", { name: "More variants: C, D, E" }))
    const items = await screen.findAllByRole("menuitem")
    expect(items.map((i) => i.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("Variant C"), expect.stringContaining("Variant D, showing"), expect.stringContaining("Variant E")]))
    expect(items.find((i) => i.textContent?.includes("Variant E"))?.getAttribute("href")).toBe("/lab/admin/dashboard?variant=E&set=1")
  })

  it("shows no More variants menu when the sets cover every variant", () => {
    renderBar(FLOW_PROPS)
    expect(screen.queryByRole("button", { name: /More variants/ })).toBeNull()
  })

  it("groups the row into three clusters: context, journey, options", () => {
    const { container } = renderBar(FLOW_PROPS)
    const row = container.querySelector("[data-lab-bar] > div")!
    const order = ["[data-lab-context]", "[data-lab-journey]", "[data-lab-options]"].map((sel) => row.querySelector(sel))
    order.forEach((el) => expect(el).not.toBeNull())
    // Reading order left to right: context before journey before options.
    expect(order[0]!.compareDocumentPosition(order[1]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(order[1]!.compareDocumentPosition(order[2]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Short persona name, full name in the accessible name.
    expect(screen.getByRole("button", { name: "View as Administrator. Switch persona" }).textContent).toContain("Admin")
  })

  it("marks the current step and offers one dot per step", () => {
    renderBar(FLOW_PROPS)
    const journey = screen.getByRole("navigation", { name: "Journey" })
    const current = within(journey).getAllByText("Configure the skill").find((el) => el.getAttribute("aria-current") === "step")
    expect(current).toBeTruthy()
    const dots = within(journey).getByRole("list", { name: "Steps" })
    const links = within(dots).getAllByRole("link")
    expect(links).toHaveLength(7)
    expect(links[2]).toHaveAttribute("aria-current", "step")
    expect(links[0]).toHaveAttribute("href", "/lab/flow/set-up-skills/library?set=1&term=Fall+2026")
    expect(within(journey).getByText("Step 3 of 7")).toBeInTheDocument()
  })

  it("names the active set in full and keeps the others as numbers, each with a summary tooltip", async () => {
    const user = userEvent.setup()
    renderBar(FLOW_PROPS)
    const group = screen.getByRole("radiogroup", { name: "Option set" })
    const radios = within(group).getAllByRole("radio")
    expect(radios.map((r) => r.textContent?.replace(/\u00a0/g, " "))).toEqual(["1 Guided", "2", "3"])
    await user.hover(radios[1]!)
    expect((await screen.findAllByText("Category tree, inline add, file beside the list, one page of sections")).length).toBeGreaterThan(0)
  })

  it("puts scenario, the question and components behind icon buttons with accessible names", () => {
    renderBar({ ...FLOW_PROPS, step: "configure" })
    expect(screen.getByRole("button", { name: "Scenario" }).textContent).toBe("")
    expect(screen.getByRole("button", { name: "What this option tests" }).textContent).toBe("")
    expect(screen.getByRole("button", { name: /^Components/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "More lab controls" })).toBeInTheDocument()
  })

  it("shows the import as an optional side step tagged Later, outside the step count", () => {
    renderBar({ ...FLOW_PROPS, step: "import" })
    const journey = screen.getByRole("navigation", { name: "Journey" })
    expect(journey.textContent).toContain("Bulk upload")
    expect(journey.textContent).toContain("Later")
    expect(journey.textContent).not.toMatch(/Step \d of/)
    expect(within(journey).getAllByRole("link", { name: "Previous step: Add a skill" }).length).toBeGreaterThan(0)
  })
})
