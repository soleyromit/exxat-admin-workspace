import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import { ok } from "@/lib/store"
import { getRuntime } from "@/lib/store/react"
import { body, createBlank, dbNow, fillBinary, fillLevels, fillQuestions, next, pickModel, ready, renderWizard, resetStore, setup, toStep, typeInto } from "./helpers"

vi.mock("next/navigation", async () => {
  const { router: r } = await import("./router")
  return { useRouter: () => r, usePathname: () => "/", useSearchParams: () => new URLSearchParams() }
})

beforeEach(resetStore)

describe("configure wizard step 2: model and qualification rule", () => {
  it("T3 [SC-03]: binary has a qualifying and a non-qualifying outcome, both required and different; the alternatives fill both", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await toStep(user, 2)
    await pickModel(user, /Overall Binary/)
    const qualifying = screen.getByLabelText("Qualifying outcome *")
    const other = screen.getByLabelText("Non-qualifying outcome *")
    expect(qualifying).toHaveValue("") // the labels are not defaulted: Met / Unmet are placeholders only
    expect(qualifying).toHaveAttribute("placeholder", "Met")
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    // The common alternatives are all offered and fill both labels.
    for (const pair of ["Met / Unmet", "Pass / Fail", "Satisfactory / Needs Improvement", "Competent / Not Yet Competent"]) expect(screen.getByRole("button", { name: pair })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Pass / Fail" }))
    expect(qualifying).toHaveValue("Pass")
    expect(other).toHaveValue("Fail")
    expect(screen.getByText("An evaluation qualifies when the preceptor records Pass. No further configuration applies.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
    // Equal labels block, in words.
    await typeInto(user, other, "Pass")
    await user.tab()
    expect(screen.getAllByText("The two outcome labels must be different.").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    // The single-outcome note is shown for this model.
    expect(screen.getByText(/This model records one outcome per evaluation/)).toBeInTheDocument()
  })

  it("T4 [SC-04, SC-05]: the question model offers all Yes, at least N of M, or a named subset", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillQuestions(user, 3)
    expect(screen.getByText("Evaluation questions (3)")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "All questions answered Yes" })).toBeChecked()
    await user.click(screen.getByRole("radio", { name: "At least" }))
    expect(screen.getByLabelText("Number of questions that must be answered Yes")).toBeEnabled()
    expect(screen.getByText("of 3 questions answered Yes")).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "These specific questions answered Yes" }))
    expect(screen.getByText("Every question you tick must be Yes. Unticked questions are recorded but do not affect qualification.")).toBeInTheDocument()
    const ticks = within(screen.getByRole("list", { name: "Questions that must be answered Yes" })).getAllByRole("checkbox")
    expect(ticks).toHaveLength(3)
    await user.click(ticks[1])
    await user.click(ticks[2])
    expect(screen.getAllByText("Q2 and Q3 answered Yes").length).toBeGreaterThan(0) // the lineage row
  })

  it("T5 [SC-05, SC-06]: an empty named subset blocks Continue and says why", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillQuestions(user, 2)
    await user.click(screen.getByRole("radio", { name: "These specific questions answered Yes" }))
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
    await user.tab() // leave the group: the rule is now touched
    expect(screen.getAllByText("Select at least one question for this rule.").length).toBeGreaterThan(0)
    await user.click(within(screen.getByRole("list", { name: "Questions that must be answered Yes" })).getAllByRole("checkbox")[0])
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
  })

  it("T6 [SC-07]: the scored model offers average, minimum on every question, or total, with a threshold", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await toStep(user, 2)
    await pickModel(user, /Scored/)
    await user.click(document.getElementById("cfg-add-question") as HTMLElement)
    await typeInto(user, document.getElementById("cfg-question-0") as HTMLElement, "Systematic approach")
    for (const [id, value] of [["cfg-scale-min", "1"], ["cfg-scale-max", "4"], ["cfg-scale-step", "1"]] as const) await typeInto(user, document.getElementById(id) as HTMLElement, value)
    expect(screen.getByText(/Program-configured scale \(4 points\)/)).toBeInTheDocument()
    for (const n of ["Average across questions", "Minimum on every question", "Total across questions"]) expect(screen.getByRole("radio", { name: n })).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "Total across questions" }))
    await typeInto(user, screen.getByLabelText("Score threshold"), "4")
    expect(screen.getAllByText("Total score is 4 or above").length).toBeGreaterThan(0)
  })

  it("T7 [SC-08]: demonstration levels are ordered, program defined and not limited to three", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillLevels(user, ["Observed", "With assistance", "Independent", "Teaching others"])
    expect(screen.getByText("Demonstration levels (4)")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Move up, level 4" }))
    const values = [0, 1, 2, 3].map((i) => (document.getElementById(`cfg-level-${i}`) as HTMLInputElement).value)
    expect(values).toEqual(["Observed", "With assistance", "Teaching others", "Independent"])
    expect(screen.getByRole("button", { name: "Move up, level 1" })).toBeDisabled()
    expect(screen.getByText(/Removing a level does not delete evidence already recorded against it/)).toBeInTheDocument()
  })

  it("T8 [SC-09, C-15]: changing a configured model swaps at once, reports what was rebuilt inline, and moves focus to the new model's first field", async () => {
    const user = setup()
    renderWizard("sk-iv", 2) // demonstration, 5 total, minimums 1/1/3
    await ready()
    await pickModel(user, /Overall Binary/)
    expect(screen.queryByRole("dialog", { name: "Change the evaluation model?" })).toBeNull() // the prototype has no confirm
    expect(screen.getByRole("radio", { name: /Overall Binary/ })).toBeChecked()
    const note = screen.getByText(/The evaluation model changed\. Reset:/)
    expect(note).toHaveTextContent("The levels (3)")
    expect(screen.getByText(/Existing evaluations are kept/)).toBeInTheDocument()
    expect(document.getElementById("cfg-label-a")).toHaveFocus()
    // Step 3 was rebuilt: nothing is required until the admin says so.
    await user.click(screen.getByRole("button", { name: "Pass / Fail" })) // the new model needs its two labels before Continue
    await next(user)
    expect(screen.getByLabelText(/Required qualifying evaluations/)).toHaveValue(null)
  })

  it("T8b [SC-02]: picking a model on an empty skill shows no rebuild note", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await toStep(user, 2)
    await pickModel(user, /Overall Binary/)
    expect(screen.queryByText(/The evaluation model changed/)).toBeNull()
  })

  it("T5b [SC-06]: a skill with 200 questions stays usable: every question is a row and one can be ticked for the rule", async () => {
    const user = setup()
    getRuntime().run((db) =>
      ok(
        {
          ...db,
          skills: db.skills.map((x) =>
            x.id === "sk-ng"
              ? { ...x, model: { kind: "question" as const, questions: Array.from({ length: 200 }, (_, i) => ({ id: `big-${i}`, text: `Check number ${i + 1}` })), rule: { kind: "subset" as const, questionIds: [] } }, criteria: { requiredCount: 1, levelMinimums: {}, settingMinimums: {} }, allowedRoles: ["preceptor"] }
              : x,
          ),
        },
        {},
      ),
    )
    renderWizard("sk-ng", 2)
    await ready()
    expect(screen.getByText("Evaluation questions (200)")).toBeInTheDocument()
    const ticks = within(screen.getByRole("list", { name: "Questions that must be answered Yes" })).getAllByRole("checkbox")
    expect(ticks).toHaveLength(200)
    await user.click(ticks[136])
    expect(screen.getAllByText("Q137 answered Yes").length).toBeGreaterThan(0)
  })

  it("AE-06 / AE-07: removing a question shows how many rules it was removed from, and evidence is kept", async () => {
    const user = setup()
    renderWizard("sk-foley", 2) // subset rule on q2 and q3
    await ready()
    const before = dbNow().evaluations.length
    await user.click(screen.getByRole("button", { name: "Remove question 2" }))
    expect(screen.getByTestId("removal-note")).toHaveTextContent("Removed from 1 rule")
    expect(dbNow().evaluations.length).toBe(before)
    expect(body().getByText("Evaluation questions (2)")).toBeInTheDocument()
  })

  it("a valid binary configuration reached by the alternatives chip lets the admin continue to step 3", async () => {
    const user = setup()
    renderWizard(createBlank())
    await ready()
    await fillBinary(user)
    await next(user)
    expect(screen.getByText("Step 3 of 3 — Achievement criteria")).toBeInTheDocument()
  })
})
