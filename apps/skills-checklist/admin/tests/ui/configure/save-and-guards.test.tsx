import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import axe from "axe-core"
import { createBlank, dbNow, fillBinary, next, ready, renderAdd, renderWizard, resetStore, save, setup, toStep, typeInto } from "./helpers"

vi.mock("next/navigation", async () => {
  const { router: r } = await import("./router")
  return { useRouter: () => r, usePathname: () => "/", useSearchParams: () => new URLSearchParams() }
})

beforeEach(resetStore)
const noContrast = { rules: { "color-contrast": { enabled: false } } }

describe("Add a skill dialog (P-07, SC-01, IM-09)", () => {
  it("672px, name required, Add and configure creates an unconfigured skill and opens the wizard", async () => {
    const user = setup()
    const h = renderAdd()
    expect(screen.getByRole("dialog", { name: "Add a skill" }).className).toContain("sm:max-w-2xl")
    const submit = screen.getByRole("button", { name: "Add and configure" })
    expect(submit).toBeDisabled()
    await typeInto(user, screen.getByLabelText("Skill name *"), "Chest drain care")
    await user.click(submit)
    const s = dbNow().skills.find((x) => x.name === "Chest drain care")!
    expect(s.model).toBeFalsy() // SC-01/SC-02: nothing chosen for the admin
    expect(h.onConfigure).toHaveBeenCalledWith(s.id)
  })

  it("unticking the checkbox changes the button to Add to library and does not open the wizard", async () => {
    const user = setup()
    const h = renderAdd()
    await typeInto(user, screen.getByLabelText("Skill name *"), "Ear irrigation")
    await user.click(screen.getByRole("checkbox", { name: "Configure how it is evaluated now" }))
    await user.click(screen.getByRole("button", { name: "Add to library" }))
    expect(h.onConfigure).not.toHaveBeenCalled()
    expect(h.onAdded).toHaveBeenCalled()
  })

  it("a duplicate name is refused in words", async () => {
    const user = setup()
    renderAdd()
    await typeInto(user, screen.getByLabelText("Skill name *"), dbNow().skills[0].name)
    await user.click(screen.getByRole("button", { name: "Add and configure" }))
    expect(screen.getByText("A skill with this name already exists. Choose a different name.")).toBeInTheDocument()
  })

  it("has no axe violations", async () => {
    renderAdd()
    expect((await axe.run(screen.getByRole("dialog"), noContrast)).violations).toEqual([])
  })
})

describe("wizard save and guards", () => {
  it("saves a valid binary skill, activates it and reports it", async () => {
    const user = setup()
    const id = createBlank("Suture removal")
    const h = renderWizard(id)
    await ready()
    await fillBinary(user)
    await next(user)
    await typeInto(user, screen.getByLabelText(/Required qualifying evaluations/), "2")
    await save(user)
    const s = dbNow().skills.find((x) => x.id === id)!
    expect(s.model?.kind).toBe("binary")
    expect(h.onSaved).toHaveBeenCalled()
    expect(h.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closing a dirty wizard asks first; discarding keeps the store unchanged", async () => {
    const user = setup()
    const id = createBlank("Splinting")
    const h = renderWizard(id)
    await ready()
    await typeInto(user, screen.getByLabelText(/Skill name/), "Splinting v2")
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByRole("dialog", { name: "Discard changes?" })).toBeInTheDocument()
    expect(h.onOpenChange).not.toHaveBeenCalledWith(false)
    expect(dbNow().skills.find((x) => x.id === id)!.name).toBe("Splinting")
  })

  it("has no axe violations on each step", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await typeInto(user, screen.getByLabelText(/Skill name/), "Axe skill")
    expect((await axe.run(screen.getByRole("dialog"), noContrast)).violations).toEqual([])
    await toStep(user, 2)
    expect((await axe.run(screen.getByRole("dialog"), noContrast)).violations).toEqual([])
  })
})
