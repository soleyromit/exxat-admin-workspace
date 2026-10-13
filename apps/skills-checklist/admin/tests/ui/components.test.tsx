import { Button } from "@exxatdesignux/ui"
import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

import { EmptyState, FailedRuleExplainer, ImpossibleFilterExplainer, ModelCriteriaLineage, PageFrame, PageSection, RequirementPill, SkillStatusBadgeView, SkillsFileUpload, SkillsMultiPick, readTextFile, skillStatusTone } from "@/components/skills"
import * as C from "@/lib/copy"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { seed } from "../store/helpers"

const db = seed()
const noContrast = { rules: { "color-contrast": { enabled: false } } }
const clean = async (container: HTMLElement) => expect((await axe.run(container, noContrast)).violations).toEqual([])

describe("SkillStatusBadge (OD-03 flag, WCAG 1.4.1)", () => {
  it("always shows text for the status and follows the display flag", () => {
    const { rerender } = render(<SkillStatusBadgeView state="noEvidence" display="four" />)
    expect(screen.getByText("No evidence yet")).toBeInTheDocument()
    rerender(<SkillStatusBadgeView state="noEvidence" display="merged" />)
    // The pill says Not Started (the prototype's word beside a 0-of-n line); "Not met" is the count column header for the same group.
    expect(screen.getByText("Not Started")).toBeInTheDocument()
    rerender(<SkillStatusBadgeView state="evidenceDoesNotQualify" display="four" />)
    expect(screen.getByText("Evidence does not qualify")).toBeInTheDocument()
  })

  it("maps states to tones without red: neutral, warning, info, success (Aarti: no red)", () => {
    expect(["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"].map((s) => skillStatusTone(s as never, "four"))).toEqual(["neutral", "warning", "info", "success"])
    expect(skillStatusTone("noEvidence", "merged")).toBe(skillStatusTone("evidenceDoesNotQualify", "merged")) // same words, same tone
    for (const d of ["four", "merged"] as const) for (const s of ["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"] as const) expect(skillStatusTone(s, d)).not.toBe("danger")
  })

  it("has no axe violations in any of the eight combinations", async () => {
    const { container } = render(
      <ul>
        {(["four", "merged"] as const).flatMap((d) => (["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"] as const).map((s) => <li key={d + s}><SkillStatusBadgeView state={s} display={d} /></li>))}
      </ul>,
    )
    await clean(container)
  })
})

describe("EmptyState (vendored)", () => {
  it("renders a heading at the chosen level, a description and a footer action, and passes axe", async () => {
    const { container } = render(
      <main>
        <h1>Page</h1>
        <EmptyState icon="fa-filter" title="No skills match these filters." description="Clear filters." footer={<Button type="button" variant="outline" size="sm">Clear filters</Button>} />
      </main>,
    )
    expect(screen.getByRole("heading", { level: 2, name: "No skills match these filters." })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument()
    await clean(container)
  })
})

describe("PageFrame", () => {
  it("has exactly one h1 and sections use h2", async () => {
    const { container } = render(<main><PageFrame title="Overview" subtitle="Sub"><PageSection id="a" title="A">x</PageSection></PageFrame></main>)
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("heading", { level: 2, name: "A" })).toBeInTheDocument()
    await clean(container)
  })
})

describe("RequirementPill", () => {
  it("is text", () => {
    render(<><RequirementPill requirement="mandatory" /><RequirementPill requirement="nonMandatory" forCourse /></>)
    expect(screen.getByText("Mandatory")).toBeInTheDocument()
    expect(screen.getByText("Non-mandatory for this course")).toBeInTheDocument()
  })
})

describe("SkillsMultiPick (Popover + Command + Checkbox)", () => {
  const options = [
    { value: "a", label: "Tag A" },
    { value: "b", label: "Tag B" },
    { value: "d", label: "Tag D", inactive: true },
  ]

  it("toggles options, keeps the option order, and reports the selection", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const Wrapper = () => {
      const [v, setV] = React.useState<string[]>([])
      return <SkillsMultiPick options={options} value={v} onChange={(n) => { setV(n); onChange(n) }} label="Tags" searchPlaceholder="Search tags" />
    }
    render(<Wrapper />)
    await user.click(screen.getByRole("button", { name: "Tags" }))
    await user.click(await screen.findByText("Tag B"))
    await user.click(screen.getByText("Tag A"))
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"])
    expect(screen.getByRole("button", { name: /Tags, 2 selected$/ })).toBeInTheDocument()
  })

  it("an inactive option cannot be newly selected, but one already selected stays and is flagged (SL-06)", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SkillsMultiPick options={options} value={["d"]} onChange={onChange} label="Tags" />)
    await user.click(screen.getByRole("button", { name: /Tags/ }))
    expect(await screen.findByText(/Tag D \(inactive\)/)).toBeInTheDocument()
    await user.click(screen.getByText(/Tag D \(inactive\)/)) // already selected: it can be removed deliberately
    expect(onChange).toHaveBeenCalledWith([])
  })

  it("offers 'Create' for text that matches nothing (SL-05)", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<SkillsMultiPick options={options} value={[]} onChange={() => {}} label="Tags" onCreate={onCreate} createLabel={(q) => C.surface.s05.createInline("tag", q)} searchPlaceholder="Search tags" />)
    await user.click(screen.getByRole("button", { name: "Tags" }))
    await user.type(await screen.findByPlaceholderText("Search tags"), "Brand new")
    await user.click(await screen.findByText('Create "Brand new" as a new tag'))
    expect(onCreate).toHaveBeenCalledWith("Brand new")
  })
})

describe("SkillsFileUpload", () => {
  it("opens the native file picker from a DS button and reports the chosen file; the input is named", async () => {
    const user = userEvent.setup()
    const onFile = vi.fn()
    const { container } = render(<SkillsFileUpload id="up" label="Upload a file" description={C.surface.s08.upload.body} onFile={onFile} />)
    const input = container.querySelector("input[type=file]") as HTMLInputElement
    expect(input).toHaveAttribute("accept", expect.stringContaining(".pdf"))
    expect(input).toHaveAccessibleName("Upload a file")
    const file = new File(["Skill one"], "list.csv", { type: "text/csv" })
    await user.upload(input, file)
    expect(onFile).toHaveBeenCalledWith(file)
    await clean(container)
  })

  it("reads text formats in the browser and returns null for formats it cannot parse (the surface then shows the unreadable error)", async () => {
    expect(await readTextFile(new File(["a\nb"], "x.csv", { type: "text/csv" }))).toBe("a\nb")
    expect(await readTextFile(new File(["x"], "x.pdf", { type: "application/pdf" }))).toBeNull()
  })
})

describe("ModelCriteriaLineage", () => {
  it("lists the five dependent steps in order and passes axe", async () => {
    const skill = db.skills.find((s) => s.id === "sk-iv")!
    const steps = C.lineageSteps(skill.model, skill.criteria, S.criteriaParts(db, skill), "four")
    const { container } = render(<main><h1>Page</h1><ModelCriteriaLineage steps={steps} /></main>)
    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent("1. Model")
    expect(items[4]).toHaveTextContent("5. Skill status")
    await clean(container)
  })
})

describe("FailedRuleExplainer (SH-03)", () => {
  it("states the failed rule and the next step, in amber and never with the word 'failed'", async () => {
    const r = S.failedRule(db, SCENARIO.priya, "sk-foley", db.submissions.find((s) => s.studentId === SCENARIO.priya && s.skillId === "sk-foley")!.id)!
    const ctx = C.ruleContext(db, db.skills.find((s) => s.id === "sk-foley")!)
    const { container } = render(<main><h1>History</h1><FailedRuleExplainer ctx={ctx} evaluationReasons={r.evaluationReasons} skillReasons={r.skillReasons} next="furtherAttempt" /></main>)
    expect(screen.getByText(/did not meet the criteria because these required questions were not answered Yes: Performs the procedure correctly\. Make a further attempt\./)).toBeInTheDocument()
    expect(screen.getByText("You have 0 of 3 qualifying evaluations. 3 more needed.")).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/failed/i)
    await clean(container)
  })

  it("explains the DEFECT-07 case (4 of 4 but not achieved) by the settings", () => {
    const r = S.failedRule(db, SCENARIO.olivia, "sk-wound")!
    render(<FailedRuleExplainer ctx={C.ruleContext(db, db.skills.find((s) => s.id === "sk-wound")!)} skillReasons={r.skillReasons} noun="demonstrations" />)
    expect(screen.getByText("You need 1 in Inpatient and have 0.")).toBeInTheDocument()
    expect(screen.getByText("You need 1 in Emergency and have 0.")).toBeInTheDocument()
  })

  it("renders nothing when there is nothing to explain", () => {
    const { container } = render(<FailedRuleExplainer ctx={C.ruleContext(db, db.skills[0])} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("ImpossibleFilterExplainer (RP-09)", () => {
  it("explains the combination and offers to clear it", async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    const issue = S.filterIssue(db, { locationId: "loc-mercy", settingId: "set-emergency" })!
    const { container } = render(<main><h1>Overview</h1><ImpossibleFilterExplainer issue={issue} db={db} onClear={onClear} /></main>)
    expect(screen.getByText(/Mercy Home Health does not offer Emergency/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(onClear).toHaveBeenCalled()
    await clean(container)
  })
})
