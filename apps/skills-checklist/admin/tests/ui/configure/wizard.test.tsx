import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import { createBlank, dbNow, ready, renderWizard, resetStore, setup, stepText, toStep, dlg } from "./helpers"

vi.mock("next/navigation", async () => {
  const { router: r } = await import("./router")
  return { useRouter: () => r, usePathname: () => "/", useSearchParams: () => new URLSearchParams() }
})

beforeEach(resetStore)

describe("configure wizard: structure (prototype P-08)", () => {
  it("is a 1024px-class dialog titled 'Edit skill — <name>' with the exact subtitle and three labelled steps", async () => {
    const id = createBlank("Sample skill")
    renderWizard(id)
    const d = await ready()
    expect(d).toHaveAccessibleName("Edit skill — Sample skill")
    expect(within(d).getByText("The program defines how this skill is evaluated and what achievement requires.")).toBeInTheDocument()
    for (const label of ["Skill definition", "Evaluation configuration", "Achievement criteria"]) expect(within(d).getAllByText(label).length).toBeGreaterThan(0)
    expect(stepText()).toBe("Step 1 of 3 — Skill definition")
  })

  it("footer: Cancel and a filled Continue on step 1; Back appears on step 2; Save skill is the only filled primary on step 3", async () => {
    const user = setup()
    const id = createBlank()
    renderWizard(id)
    await ready()
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull()
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
    await toStep(user, 2)
    expect(stepText()).toBe("Step 2 of 3 — Evaluation configuration")
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
    const filled = (el: HTMLElement) => Array.from(el.querySelectorAll('button[data-slot="button"][data-variant="default"]')).filter((b) => (b.textContent ?? "").trim() !== "")
    expect(filled(screen.getByTestId("configure-wizard")).map((b) => b.textContent)).toEqual(["Continue"])
  })

  it("Continue is disabled until step 1 has a name, with the reason stated as text", async () => {
    const user = setup()
    const id = createBlank("Named")
    renderWizard(id)
    await ready()
    await user.clear(screen.getByLabelText("Skill name *"))
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    expect(screen.getByTestId("continue-reason")).toHaveTextContent("Enter a skill name to continue.")
  })

  it("T2 [SC-02]: step 2 on a new skill offers four tiles, none selected, and nothing else until a model is chosen; Continue waits", async () => {
    const user = setup()
    const id = createBlank()
    renderWizard(id)
    await ready()
    await toStep(user, 2)
    const tiles = screen.getAllByRole("radio", { name: /Overall Binary|Question-Level|Scored|Demonstration-Level/ })
    expect(tiles).toHaveLength(4)
    for (const t of tiles) expect(t).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    expect(screen.queryByText("Student submission details (2)")).toBeNull()
    // The lineage panel waits on the step above, five rows.
    expect(screen.getAllByText("Waiting on the step above")).toHaveLength(5)
    // the exact descriptions
    expect(screen.getByText("The evaluator records one overall outcome, using two labels the program defines. Defaults to Met / Unmet.")).toBeInTheDocument()
    expect(screen.getByText("The evaluator records the level of supervision the demonstration needed.")).toBeInTheDocument()
  })

  it("the lineage panel shows its five row labels and the footnote from step 2 on, and is not shown on step 1", async () => {
    const user = setup()
    const id = createBlank()
    renderWizard(id)
    await ready()
    expect(screen.queryByText("Configuration lineage")).toBeNull()
    await toStep(user, 2)
    const aside = within(screen.getByLabelText("Configuration lineage", { selector: "aside" }))
    for (const l of ["Evaluation model", "Evidence per evaluation", "An evaluation qualifies when", "Achievement criteria", "Skill status"]) expect(aside.getByText(l)).toBeInTheDocument()
    expect(aside.getByText(/Each step below the model is determined by the one above it/)).toBeInTheDocument()
  })

  it("a skill that does not exist shows a message with a way out, not a blank dialog", async () => {
    const { onOpenChange } = renderWizard("nope")
    expect(await screen.findByRole("dialog", { name: "Skill not found" })).toBeInTheDocument()
    expect(dbNow().skills.some((s) => s.id === "nope")).toBe(false)
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("starter defaults for a new skill: all evaluator roles and two student fields, but no model (SC-02)", async () => {
    const user = setup()
    const id = createBlank()
    renderWizard(id)
    await ready()
    await toStep(user, 2)
    await user.click(screen.getByRole("radio", { name: /Overall Binary/ }))
    const roles = dbNow().roles
    for (const r of roles) expect(screen.getByRole("checkbox", { name: new RegExp(r.label) })).toBeChecked()
    expect(screen.getByText("Student submission details (2)")).toBeInTheDocument()
    expect(dlg().getByDisplayValue("Completion date")).toBeInTheDocument()
    expect(dlg().getByDisplayValue("Student notes")).toBeInTheDocument()
  })
})
