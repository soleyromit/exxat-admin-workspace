import * as React from "react"
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { WizardPanel } from "@exxatdesignux/ui/components/ui/wizard"
import { Field, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { FormPage, FormSection, StickyFooter, ValidationSummary, WizardPage, type WizardStep } from "@/components/lab/layout"

/**
 * Shared layout primitives (lab templates T2 wizard and T3 form). Builders B1 to B3 code against these, so the contract
 * the spec fixes is pinned here: one filled primary in the footer, explicit Button variant and size, no "Step n of m"
 * text, no hex, accessible names, and a stepper whose aria-current follows the current step.
 */

// jsdom has no scrolling; the DS horizontal stepper scrolls the current step into view.
if (!("scrollTo" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "scrollTo", { configurable: true, writable: true, value: vi.fn() })
}

const STEPS: WizardStep[] = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "fix", label: "Fix" },
  { id: "confirm", label: "Confirm" },
]

const STEP_N_OF_M = /step\s+\d+\s+of\s+\d+/i
const HEX = /#[0-9a-f]{3,8}\b/i

function Wizard({ current = 1, banner }: { current?: number; banner?: React.ReactNode }) {
  return (
    <WizardPage
      title="Import skills"
      steps={STEPS}
      current={current}
      onStepClick={() => {}}
      banner={banner}
      footer={
        <StickyFooter
          back={current > 0 ? { onClick: () => {} } : undefined}
          context="142 ready, 3 need a decision"
          primary={{ label: "Continue", onClick: () => {} }}
        />
      }
    >
      {STEPS.map((s, i) => (
        <WizardPanel key={s.id} step={i}>
          <p>Panel for {s.id}</p>
        </WizardPanel>
      ))}
    </WizardPage>
  )
}

function footer(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>('[data-region="footer"]')
  if (!el) throw new Error("no footer region")
  return el
}

describe("StickyFooter", () => {
  it("renders exactly one filled primary, with Back and the secondary as outline", () => {
    const { container } = render(
      <StickyFooter
        back={{ onClick: () => {} }}
        context="3 skills ready"
        secondary={{ label: "Save draft", onClick: () => {} }}
        primary={{ label: "Publish", onClick: () => {} }}
      />,
    )
    const f = footer(container)
    expect(f.querySelectorAll('[data-slot="button"][data-variant="default"]')).toHaveLength(1)
    expect(within(f).getByRole("button", { name: "Publish" })).toHaveAttribute("data-variant", "default")
    expect(within(f).getByRole("button", { name: "Back" })).toHaveAttribute("data-variant", "outline")
    expect(within(f).getByRole("button", { name: "Save draft" })).toHaveAttribute("data-variant", "outline")
    for (const b of f.querySelectorAll('[data-slot="button"]')) expect(b).toHaveAttribute("data-size", "default")
  })

  it("puts the disabled reason in the polite context line and ties it to the primary", () => {
    const onClick = vi.fn()
    render(<StickyFooter context="142 ready" primary={{ label: "Create skills", onClick, disabled: true, disabledReason: "3 lines need a decision" }} />)
    const primary = screen.getByRole("button", { name: "Create skills" })
    expect(primary).toBeDisabled()
    expect(primary).toHaveAccessibleDescription("3 lines need a decision")
    expect(screen.getByText("3 lines need a decision")).toHaveAttribute("aria-live", "polite")
    expect(screen.queryByText("142 ready")).toBeNull()
    fireEvent.click(primary)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("marks a loading primary busy and disabled without changing its label", () => {
    render(<StickyFooter primary={{ label: "Publish", loading: true }} />)
    const primary = screen.getByRole("button", { name: "Publish" })
    expect(primary).toBeDisabled()
    expect(primary).toHaveAttribute("aria-busy", "true")
  })

  it("renders an href primary as a link styled as the filled button", () => {
    render(<StickyFooter primary={{ label: "Map to courses", href: "/lab/admin/course-mapping" }} />)
    const link = screen.getByRole("link", { name: "Map to courses" })
    // Lab links follow the active option set (lib/lab/links.ts): with no page context the map step opens in the recommended set.
    expect(link).toHaveAttribute("href", "/lab/flow/set-up-skills/map?set=1")
    expect(link).toHaveAttribute("data-variant", "default")
  })

  it("moves Back next to the primary when a summary takes the left slot", () => {
    const { container } = render(
      <StickyFooter summary="Get 3 evaluations rated Met." back={{ onClick: () => {} }} primary={{ label: "Publish", onClick: () => {} }} />,
    )
    const back = screen.getByRole("button", { name: "Back" })
    const publish = screen.getByRole("button", { name: "Publish" })
    expect(back.closest("div")?.parentElement).toBe(publish.parentElement)
    expect(footer(container).textContent).toContain("Get 3 evaluations rated Met.")
  })
})

describe("WizardPage", () => {
  it("exposes the steps with aria-current on the current one only", () => {
    render(<Wizard current={2} />)
    const nav = screen.getByRole("navigation", { name: /4 total/ })
    const steps = within(nav).getAllByRole("listitem")
    expect(steps.map((li) => li.textContent)).toEqual(["Upload", "Review", "Fix", "Confirm"])
    expect(steps.map((li) => li.getAttribute("aria-current"))).toEqual([null, null, "step", null])
  })

  it("lets completed steps be reached by button with a name, and keeps upcoming steps inert", () => {
    render(<Wizard current={2} />)
    expect(screen.getByRole("button", { name: /Upload, completed/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Review, completed/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Confirm/ })).toBeNull()
  })

  it("shows no 'Step n of m' text and no visible heading that repeats the step label", () => {
    const { container } = render(<Wizard current={1} />)
    expect(container.textContent ?? "").not.toMatch(STEP_N_OF_M)
    const progress = container.querySelector('[data-slot="wizard-progress"]')!
    expect(progress).toHaveAttribute("aria-live", "polite")
    expect(progress.className).toContain("sm:sr-only")
    const heading = screen.getByRole("heading", { level: 2, name: "Review" })
    expect(heading.className).toContain("sr-only")
    // The panel is labelled by that heading.
    expect(screen.getByRole("group", { name: "Review" })).toHaveTextContent("Panel for review")
  })

  it("carries the page type, the 960 px column, one h1 and one filled primary", () => {
    const { container } = render(<Wizard current={1} />)
    const root = container.querySelector('[data-page-type="wizard"]')!
    expect(root).not.toBeNull()
    expect(root.querySelector(".max-w-\\[60rem\\]")).not.toBeNull()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(container.querySelectorAll('[data-slot="button"][data-variant="default"]')).toHaveLength(1)
    expect(root.querySelector('[data-region="stepper"]')).not.toBeNull()
    expect(root.querySelector('[data-region="panel"]')).not.toBeNull()
  })

  it("marks the current step as an error and places the summary under the stepper", () => {
    const steps = STEPS.map((s, i) => (i === 2 ? { ...s, error: true } : s))
    render(
      <WizardPage
        title="Import skills"
        steps={steps}
        current={2}
        banner={<ValidationSummary issues={[{ fieldId: "decision-1", message: "Choose what to do with line 12" }]} />}
        footer={<StickyFooter primary={{ label: "Continue", onClick: () => {} }} />}
      >
        <WizardPanel step={2}>
          <input id="decision-1" aria-label="Line 12 decision" />
        </WizardPanel>
      </WizardPage>,
    )
    const current = screen.getAllByRole("listitem")[2]
    expect(current.querySelector(".fa-circle-exclamation")).not.toBeNull()
    const summary = document.querySelector('[data-region="validation-summary"]') as HTMLElement
    expect(document.activeElement).toBe(summary)
    fireEvent.click(screen.getByRole("button", { name: "Choose what to do with line 12" }))
    expect(document.activeElement).toBe(screen.getByLabelText("Line 12 decision"))
  })
})

describe("FormPage", () => {
  it("renders the 720 px form column with a fieldset per section and the footer primary", () => {
    const { container } = render(
      <FormPage
        title="Oral medication administration"
        subtitle="Medication. 121 students have evidence."
        footer={<StickyFooter summary="Get 3 evaluations rated Met." primary={{ label: "Publish", onClick: () => {} }} />}
      >
        <FormSection legend="How it is judged">
          <Field>
            <FieldLabel htmlFor="model">Evaluation model</FieldLabel>
            <Input id="model" />
          </Field>
        </FormSection>
      </FormPage>,
    )
    const root = container.querySelector('[data-page-type="form"]')!
    expect(root.querySelector(".max-w-\\[45rem\\]")).not.toBeNull()
    expect(screen.getByRole("group", { name: "How it is judged" })).toBeInTheDocument()
    expect(screen.getByLabelText("Evaluation model")).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="button"][data-variant="default"]')).toHaveLength(1)
  })

  it("warns in development when a section holds more than 7 fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <FormSection legend="Too many">
        {Array.from({ length: 8 }, (_, i) => (
          <Input key={i} aria-label={`Field ${i + 1}`} />
        ))}
      </FormSection>,
    )
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("holds 8 fields"))
    warn.mockRestore()
  })
})

describe("centred template and preview column (decision D-X29)", () => {
  const frameOf = (el: HTMLElement) => el.querySelector("[data-page-type] > div") as HTMLElement

  it("centres the wizard and form columns instead of hugging the left edge", () => {
    const { container: w } = render(<Wizard />)
    expect(frameOf(w).className).toMatch(/\bmx-auto\b/)
    const { container: f } = render(<FormPage title="Settings"><p>Body</p></FormPage>)
    expect(frameOf(f).className).toMatch(/\bmx-auto\b/)
  })

  it("puts the preview beside the step inside the one step region, hidden below 1400 px", () => {
    const { container } = render(
      <WizardPage title="Configure" steps={STEPS} current={1} aside={<aside>Preview</aside>} footer={<StickyFooter primary={{ label: "Next" }} />}>
        {STEPS.map((s, i) => <WizardPanel key={s.id} step={i}>{`${s.label} body`}</WizardPanel>)}
      </WizardPage>,
    )
    expect(frameOf(container).className).toMatch(/min-\[1400px\]:max-w-\[68rem\]/)
    const regions = container.querySelectorAll("[data-region=panel]")
    expect(regions).toHaveLength(1)
    const col = regions[0]!.querySelector("[data-preview-column]") as HTMLElement
    expect(col).not.toBeNull()
    expect(col.className).toMatch(/\bhidden\b/)
    expect(col.className).toMatch(/min-\[1400px\]:block/)
  })

  it("keeps the wide frame but lets the step use both columns when a step passes no preview", () => {
    const { container } = render(<FormPage title="Configure" aside={null}><p>Check</p></FormPage>)
    expect(frameOf(container).className).toMatch(/min-\[1400px\]:max-w-\[68rem\]/)
    expect(container.querySelector("[data-preview-column]")).toBeNull()
    expect(container.querySelector("[data-region=panel] > div")!.className).toMatch(/min-\[1400px\]:col-span-2/)
  })
})

describe("layout source rules", () => {
  const dir = path.resolve(__dirname, "../../components/lab/layout")
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"))

  it.each(files)("%s uses DS Button with explicit variant and size, no raw button or table, no hex", (file) => {
    const src = fs.readFileSync(path.join(dir, file), "utf8")
    expect(src).not.toMatch(/<button[\s>]/)
    expect(src).not.toMatch(/<table[\s>]/)
    expect(src).not.toMatch(HEX)
    expect(src).not.toMatch(/(?<![\w:-])items(?![\w-])/i)
    expect(src).not.toMatch(/—/)
    for (const tag of src.match(/<Button\b[^>]*>/gs) ?? []) {
      expect(tag, tag).toMatch(/\bvariant=/)
      expect(tag, tag).toMatch(/\bsize=/)
    }
  })
})
