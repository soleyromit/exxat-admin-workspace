import * as React from "react"
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { CONFIGURE_STEPS, configureStepHead, configureStepValue, emptyRule, withModel, type LabRule } from "@/lib/lab/configure"
import { RuleConditions } from "@/components/lab/configure/rule-conditions"
import { SentenceBuilder } from "@/components/lab/configure/sentence-builder"

/**
 * Configure content hierarchy and type scale (Romit 2026-10-27: "the wizard design looks clunky", "steps cleaner and easier to
 * navigate", "different text sizes used, too many text again").
 */

/** Classes we set (DS components carry their own responsive sizes, e.g. Input's text-base md:text-sm). */
const ownClasses = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("*")].filter((el) => !el.closest("[data-slot]")).map((el) => el.getAttribute("class") ?? "").join(" ")
const words = (s: string) => s.trim().split(/\s+/).length
const binary = (patch: Partial<LabRule> = {}): LabRule => ({ ...withModel(emptyRule(), "binary"), ...patch })

describe("step headings: the question the admin answers, one short line at most", () => {
  it("gives every step a question title that does not repeat its stepper label, and keeps each step under the 45-word budget", () => {
    for (const s of CONFIGURE_STEPS) {
      for (const model of [null, "binary", "question", "demonstration", "scored"] as const) {
        const h = configureStepHead(s.id, model)
        expect(h.title.endsWith("?")).toBe(true)
        expect(h.title).not.toBe(s.label)
        expect(words(h.title) + (h.lead ? words(h.lead) : 0)).toBeLessThanOrEqual(20)
        if (h.lead) expect(words(h.lead)).toBeLessThanOrEqual(12)
        expect(`${h.title} ${h.lead ?? ""}`).not.toMatch(/—|publish|\bitems?\b/i)
      }
    }
  })

  it("on Check, says what is left while problems remain and drops the lead (the fix list says it)", () => {
    expect(configureStepHead("check", "binary", false)).toEqual({ title: "What is left before saving?" })
    expect(configureStepHead("check", "binary", true).title).toBe("Ready to save?")
  })

  it("puts the value chosen so far under each rail label, and nothing while it is unset", () => {
    expect(configureStepValue("model", emptyRule())).toBeUndefined()
    const r = binary({ qualifyingLabel: 0, need: 3, evaluatorRoles: ["preceptor", "faculty"] })
    expect(configureStepValue("model", r)).toBe("Approved or not approved")
    expect(configureStepValue("outcomes", r)).toBe("Met counts")
    expect(configureStepValue("rule", r)).toBe("3 needed")
    expect(configureStepValue("signoff", r)).toBe("2 roles")
    expect(configureStepValue("rule", binary({ need: Number.NaN }))).toBeUndefined()
  })
})

describe("rule conditions: one list, one Remove per row, one Add a condition menu, body size", () => {
  const settings = ["Inpatient", "Outpatient"]
  const view = (rule: LabRule) => render(<RuleConditions rule={rule} setRule={() => {}} issues={[]} showErrors={false} settings={settings} />)

  it("with no condition shows only the Add a condition menu, and no lab note", () => {
    const { container } = view(binary({ need: 3 }))
    expect(screen.getByRole("button", { name: "Add a condition" })).toBeInTheDocument()
    expect(screen.queryByRole("list", { name: "Conditions" })).toBeNull()
    expect(container.textContent).not.toMatch(/Lab and simulation|Proposed|Decision pending/)
  })

  it("lists each condition as a row with one Remove, and says the lab hard stop once, only with a setting minimum", () => {
    const rule = binary({
      need: 4,
      distinctEvaluators: 2,
      settingMinimums: [{ setting: "Inpatient", min: 2 }],
      carried: { window: 5, minLevelIndex: null, simulationCapPercent: null, simulationExcluded: false },
    })
    const { container } = view(rule)
    const list = screen.getByRole("list", { name: "Conditions" })
    const rows = within(list).getAllByRole("listitem")
    // The carried limits are not a row here: Check and save lists them (Romit 2026-10-27).
    expect(rows).toHaveLength(2)
    for (const row of rows) expect(within(row).getAllByRole("button", { name: /^Remove condition: / })).toHaveLength(1)
    expect(container.textContent?.match(/Lab and simulation evidence does not count toward inpatient\./g)).toHaveLength(1)
    expect(container.textContent).not.toContain("Only the last 5 evaluations are used.")
    expect(container.textContent).not.toMatch(/Proposed|Kept from the current rule|earlier rule/)
    // Body size only: no larger type inside the rule editor.
    expect(ownClasses(container)).not.toMatch(/text-(lg|xl|2xl|base)\b/)
  })

  it("keeps the sentence at body size with DS control heights", () => {
    const { container } = render(<SentenceBuilder rule={binary({ need: 3, qualifyingLabel: 0 })} setRule={() => {}} issues={[]} showErrors={false} settings={settings} />)
    const sentence = container.querySelector("[data-sentence-builder]") as HTMLElement
    expect(sentence.className).toContain("text-sm")
    expect(ownClasses(container)).not.toMatch(/text-(lg|xl|2xl|base)\b|\bh-9\b/)
    expect(container.innerHTML).not.toMatch(/\bh-9\b/)
  })
})

describe("no lab labels in configure product UI", () => {
  it("renders no Proposed or Decision pending marker in the configure components", () => {
    const dir = path.join(__dirname, "../../components/lab/configure")
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(path.join(dir, f), "utf8")
      expect(src, f).not.toMatch(/>\s*(Proposed|Decision pending)\s*</)
      expect(src, f).not.toMatch(/<ProposedBadge/)
    }
  })
})
