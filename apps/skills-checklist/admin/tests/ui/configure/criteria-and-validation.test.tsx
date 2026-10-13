import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, screen, within } from "@testing-library/react"
import axe from "axe-core"
import { chooseOption, createBlank, dbNow, fillBinary, fillLevels, fillQuestions, next, ready, renderWizard, resetStore, save, setup, toStep, typeInto, type User } from "./helpers"

vi.mock("next/navigation", async () => {
  const { router: r } = await import("./router")
  return { useRouter: () => r, usePathname: () => "/", useSearchParams: () => new URLSearchParams() }
})

beforeEach(resetStore)

/**
 * S-09 coverage restored after the re-skin into the 3-step modal (docs/build/prototype-parity.md P-08): the criteria, student
 * fields, evaluator comment, workflow, roles (OD-25 as data), the clinical-minimum satisfiability rule (BL-1), the live form
 * preview, the impact review (AE-02) and the model-tile keyboard path. REQ ids and contract T-ids are in the test names.
 */
const noContrast = { rules: { "color-contrast": { enabled: false } } }
const summary = () => document.getElementById("cfg-summary")

async function stepThreeDemo(user: User, total = "3") {
  await fillLevels(user)
  await next(user)
  await typeInto(user, screen.getByLabelText("Total demonstrations required"), total)
}

describe("step 3: achievement criteria", () => {
  it("T9 [SC-10]: a demonstration skill asks for a total and a minimum at each level, with the sum checked in words", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await stepThreeDemo(user, "3")
    const group = screen.getByRole("group", { name: "Minimum at each level" })
    for (const level of ["Observed", "With Assistance", "Independent"]) expect(within(group).getByLabelText(level)).toBeInTheDocument()
    await typeInto(user, within(group).getByLabelText("Observed"), "2")
    await typeInto(user, within(group).getByLabelText("Independent"), "2")
    expect(screen.getByTestId("sum-check")).toHaveTextContent("Over total by 1")
    await typeInto(user, within(group).getByLabelText("Independent"), "1")
    expect(screen.getByTestId("sum-check")).toHaveTextContent("Within total")
  })

  it("T10 [SC-10, SC-18]: level minimums that exceed the total block Save with the reason in the summary", async () => {
    const user = setup()
    const id = createBlank("Splint application")
    const h = renderWizard(id)
    await ready()
    await stepThreeDemo(user, "2")
    const group = screen.getByRole("group", { name: "Minimum at each level" })
    await typeInto(user, within(group).getByLabelText("Observed"), "2")
    await typeInto(user, within(group).getByLabelText("Independent"), "2")
    await save(user)
    expect(summary()).not.toBeNull()
    expect(within(summary()!).getByRole("alert")).toHaveTextContent(/cannot be saved/i)
    expect(h.onSaved).not.toHaveBeenCalled()
    expect(dbNow().skills.find((s) => s.id === id)!.model).toBeNull()
  })

  it("T12 [SC-09]: a model without levels asks only for a count of qualifying evaluations", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    await next(user)
    expect(screen.getByLabelText(/Required qualifying evaluations/)).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Minimum at each level" })).toBeNull()
  })

  it("T11 [SC-11, SC-12]: a minimum can be set per named clinical setting; lab evidence is stated as never counting", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    await next(user)
    expect(screen.getByText(/Anything not listed carries no requirement/)).toBeInTheDocument()
    expect(screen.getByText(/lab|simulation/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Clinical settings with a minimum/ }))
    await user.click(await screen.findByRole("option", { name: /Inpatient/ }))
    expect(await screen.findByLabelText("Minimum in Inpatient")).toBeInTheDocument()
    await typeInto(user, screen.getByLabelText("Minimum in Inpatient"), "2")
    expect(screen.getByLabelText("Minimum in Inpatient")).toHaveValue(2)
    expect(screen.queryByRole("option", { name: /Lab/ })).toBeNull()
  })
})

describe("step 2: student fields, comment, workflow, roles", () => {
  it("T13 [SC-13]: fields have a label, one of five types and Required or Optional, and a choice field asks for its options", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    const before = document.querySelectorAll('[id^="cfg-field-"][id$="-label"]').length
    await user.click(document.getElementById("cfg-add-field") as HTMLElement)
    const i = before
    await typeInto(user, document.getElementById(`cfg-field-${i}-label`) as HTMLElement, "Case reference")
    await chooseOption(user, document.getElementById(`cfg-field-${i}-type`) as HTMLElement, /Choice list/)
    expect(document.getElementById(`cfg-field-${i}-options`)).not.toBeNull()
    const req = document.getElementById(`cfg-field-${i}-required`) as HTMLElement
    expect(req).toHaveAttribute("aria-pressed", "false")
    await user.click(req)
    expect(req).toHaveAttribute("aria-pressed", "true")
    expect(req).toHaveTextContent("Required")
    await user.click(screen.getByRole("button", { name: `Remove field ${i + 1}` }))
    expect(document.getElementById(`cfg-field-${i}-label`)).toBeNull()
  })

  it("SC-13 [SC-18]: an empty or repeated field label blocks Continue with the reason stated, and naming it unblocks", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    await user.click(document.getElementById("cfg-add-field") as HTMLElement)
    const blank = Array.from(document.querySelectorAll<HTMLInputElement>('[id^="cfg-field-"][id$="-label"]')).find((el) => el.value === "")!
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    expect(screen.getByTestId("continue-reason")).toBeInTheDocument()
    await typeInto(user, blank, "Case reference")
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
    const first = document.getElementById("cfg-field-0-label") as HTMLInputElement
    await typeInto(user, blank, first.value)
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
  })

  it("T14 [SC-14]: the evaluator comment is Optional or Required, and the sentence says what each means", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    const control = within(document.getElementById("sec-comment") as HTMLElement)
    expect(screen.getByText("The preceptor may leave the comment blank.")).toBeInTheDocument()
    await user.click(control.getByRole("radio", { name: "Required" }).closest("button, [role=radio]") as HTMLElement)
    expect(screen.getByText("The evaluator cannot submit without writing a comment.")).toBeInTheDocument()
  })

  it("T15 [SC-15]: self-evaluation and administrator approval are switches, and the route sentence shows only the active steps", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    const route = () => screen.getByTestId("route-sentence").textContent ?? ""
    expect(route()).not.toMatch(/self-evaluates|approves/)
    await user.click(document.getElementById("cfg-selfeval") as HTMLElement)
    expect(route()).toMatch(/Student self-evaluates/)
    await user.click(document.getElementById("cfg-approval") as HTMLElement)
    expect(route()).toMatch(/Administrator approves/)
    await user.click(document.getElementById("cfg-selfeval") as HTMLElement)
    expect(route()).not.toMatch(/self-evaluates/)
  })

  it("T16 [SC-16, OD-25]: allowed roles come from data with what each can sign off, and none selected blocks Save", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    const roles = dbNow().roles
    expect(roles.length).toBeGreaterThanOrEqual(3)
    for (const r of roles) expect(screen.getByLabelText(new RegExp(r.label))).toBeInTheDocument()
    expect(screen.getByText(/Can sign off clinical evidence/)).toBeInTheDocument()
    for (const r of roles) {
      const box = screen.getByLabelText(new RegExp(r.label)) as HTMLInputElement
      if (box.getAttribute("aria-checked") === "true" || box.checked) await user.click(box)
    }
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    expect(screen.getByTestId("continue-reason")).toBeInTheDocument()
    await user.click(screen.getByLabelText(/Preceptor/))
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
  })
})

describe("BL-1: the configuration must be satisfiable (SC-18, SC-11, SC-12, SC-16)", () => {
  async function labOnlyWithClinicalMinimum(user: User) {
    await fillBinary(user)
    for (const r of dbNow().roles) {
      const box = screen.getByLabelText(new RegExp(r.label)) as HTMLInputElement
      const on = box.getAttribute("aria-checked") === "true" || box.checked
      if (r.id === "lab_instructor" ? !on : on) await user.click(box)
    }
    await next(user)
    await typeInto(user, screen.getByLabelText(/Required qualifying evaluations/), "2")
    await user.click(screen.getByRole("button", { name: /Clinical settings with a minimum/ }))
    await user.click(await screen.findByRole("option", { name: /Inpatient/ }))
    await user.keyboard("{Escape}")
  }

  it("T25: allowed roles that cannot sign off clinical evidence plus a clinical-setting minimum is blocked, and the message names the roles that would fix it", async () => {
    const user = setup()
    const id = createBlank("Lab only skill")
    const h = renderWizard(id)
    await ready()
    await labOnlyWithClinicalMinimum(user)
    await save(user)
    expect(summary()).not.toBeNull()
    expect(summary()!.textContent).toMatch(/none of its allowed evaluator roles can sign off clinical evidence/)
    expect(summary()!.textContent).toMatch(/Preceptor/)
    expect(h.onSaved).not.toHaveBeenCalled()
  })

  it("T26: allowing a clinical-capable role clears the block and the skill saves", async () => {
    const user = setup()
    const id = createBlank("Lab and clinical skill")
    const h = renderWizard(id)
    await ready()
    await labOnlyWithClinicalMinimum(user)
    await save(user)
    expect(h.onSaved).not.toHaveBeenCalled()
    // A blocked Save moves the wizard to the step that holds the first issue (the roles are on step 2).
    await user.click(await screen.findByLabelText(/Preceptor/))
    await next(user)
    await save(user)
    expect(h.onSaved).toHaveBeenCalled()
    expect(dbNow().skills.find((s) => s.id === id)!.model?.kind).toBe("binary")
  })
})

describe("form preview, impact review, keyboard (SC-19, AE-02)", () => {
  it("T18 [SC-19]: the preview shows what the student supplies and what the evaluator answers, together, and follows the configuration", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillQuestions(user, 2)
    const preview = document.getElementById("sec-preview") as HTMLElement
    expect(preview).not.toBeNull()
    expect(within(preview).getByText("Question text 1")).toBeInTheDocument()
    expect(within(preview).getByText("Question text 2")).toBeInTheDocument()
    expect(within(preview).getAllByRole("heading", { level: 4 })).toHaveLength(2)
    await typeInto(user, document.getElementById("cfg-question-0") as HTMLElement, "Changed text")
    expect(within(preview).getByText("Changed text")).toBeInTheDocument()
  })

  it("AE-02: changing a rule on a skill that already has evaluations shows the impact before saving, and Back to editing changes nothing", async () => {
    const user = setup()
    const h = renderWizard("sk-iv", 3)
    await ready()
    const field = screen.getByLabelText("Total demonstrations required")
    const before = dbNow().skills.find((s) => s.id === "sk-iv")!.criteria.requiredCount
    await typeInto(user, field, String((before ?? 0) + 1))
    await save(user)
    const impact = await screen.findByRole("dialog", { name: "Review the effect of this change" })
    await user.click(within(impact).getByRole("button", { name: "Back to editing" }))
    expect(dbNow().skills.find((s) => s.id === "sk-iv")!.criteria.requiredCount).toBe(before)
    expect(h.onSaved).not.toHaveBeenCalled()
    await save(user)
    await user.click(within(await screen.findByRole("dialog", { name: "Review the effect of this change" })).getByRole("button", { name: "Save change" }))
    expect(dbNow().skills.find((s) => s.id === "sk-iv")!.criteria.requiredCount).toBe((before ?? 0) + 1)
    expect(h.onSaved).toHaveBeenCalled()
  })

  it("T1 [SC-02]: arrow keys select the tile they land on, every press, and wrap; focus follows", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await toStep(user, 2)
    const tile = (n: RegExp) => screen.getByRole("radio", { name: n })
    const settle = () => act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))) })
    tile(/Overall Binary/).focus()
    await user.keyboard("{ArrowRight}")
    await settle()
    expect(tile(/Question-Level/)).toBeChecked()
    expect(document.activeElement).toBe(tile(/Question-Level/))
    await user.keyboard("{ArrowDown}")
    await settle()
    expect(tile(/Scored/)).toBeChecked()
    await user.keyboard("{ArrowLeft}")
    await settle()
    expect(tile(/Question-Level/)).toBeChecked()
    tile(/Overall Binary/).focus()
    await user.keyboard("{ArrowLeft}")
    await settle()
    expect(tile(/Demonstration-Level/)).toBeChecked()
  })

  it("has no axe violations on step 3 and with the save-blocked summary showing", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await stepThreeDemo(user, "2")
    expect((await axe.run(screen.getByRole("dialog"), noContrast)).violations).toEqual([])
    const group = screen.getByRole("group", { name: "Minimum at each level" })
    await typeInto(user, within(group).getByLabelText("Observed"), "2")
    await typeInto(user, within(group).getByLabelText("Independent"), "2")
    await save(user)
    expect(summary()).not.toBeNull()
    expect((await axe.run(screen.getByRole("dialog"), noContrast)).violations).toEqual([])
  })
})


describe("IM-14: copy and apply a configuration (docs/ux/08 P-05)", () => {
  it("T23 [IM-14]: Copy configuration loads another skill's configuration into this form as an unsaved draft; nothing is saved until Save skill", async () => {
    const user = setup()
    const id = createBlank("Copy target")
    renderWizard(id)
    await ready()
    await toStep(user, 2)
    await user.click(screen.getByRole("button", { name: "Copy configuration from another skill" }))
    const d = await screen.findByRole("dialog", { name: "Copy configuration from another skill" })
    expect(within(d).getByRole("button", { name: "Copy configuration" })).toBeDisabled()
    await chooseOption(user, within(d).getByRole("combobox", { name: /Copy from/ }), "IV Insertion")
    await user.click(within(d).getByRole("button", { name: "Copy configuration" }))
    expect(screen.queryByRole("dialog", { name: "Copy configuration from another skill" })).toBeNull()
    expect(screen.getByRole("radio", { name: /Demonstration-Level/ })).toBeChecked()
    // The copy is a draft: the store is untouched until Save.
    expect(dbNow().skills.find((s) => s.id === id)!.model).toBeNull()
    await next(user)
    await save(user)
    expect(dbNow().skills.find((s) => s.id === id)!.model?.kind).toBe("demonstration")
    // Independent copies: the source keeps its own level ids.
    const src = dbNow().skills.find((s) => s.id === "sk-iv")!.model
    const dst = dbNow().skills.find((s) => s.id === id)!.model
    if (src?.kind === "demonstration" && dst?.kind === "demonstration") expect(dst.levels.map((l) => l.id)).not.toEqual(src.levels.map((l) => l.id))
  })

  it("T23 [IM-14]: Apply to selected skills (from a saved configuration) shows a dry run, and Apply configures the chosen targets without touching evaluations", async () => {
    const user = setup()
    const target = createBlank("Apply target")
    renderWizard("sk-iv", 3)
    await ready()
    const evals = dbNow().evaluations.length
    await user.click(screen.getByRole("button", { name: "Apply to selected skills" }))
    const d = await screen.findByRole("dialog", { name: "Apply configuration" })
    expect(within(d).getByRole("button", { name: "Apply configuration" })).toBeDisabled()
    await user.click(within(d).getByLabelText(/Apply target/))
    expect(within(d).getByTestId("apply-plan")).toBeInTheDocument()
    await user.click(within(d).getByRole("button", { name: "Apply configuration" }))
    expect(dbNow().skills.find((s) => s.id === target)!.model?.kind).toBe("demonstration")
    expect(dbNow().evaluations).toHaveLength(evals)
  })
})
