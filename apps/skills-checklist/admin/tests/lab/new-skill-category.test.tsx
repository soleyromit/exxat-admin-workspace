// @vitest-environment jsdom
import * as React from "react"
import { describe, expect, it, beforeAll, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { addSkillsToStore, buildLibrary, categoryEditable, draftToSkill, EMPTY_DRAFT, filterOptions } from "@/lib/lab/library"
import { SkillRows } from "@/components/lab/admin-a/lists-panel"
import { V2StoreProvider } from "@/lib/v2/react"
import { createV2Store } from "@/lib/v2/store"
import { IDS } from "@/lib/v2/seed-core"
import type { Skill, V2State } from "@/lib/v2/types"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, replace() {} }), usePathname: () => "/", useSearchParams: () => new URLSearchParams() }))

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
})

/** Bug: the category of a skill added in the lists flow could not be changed once its first step was left (the list panel printed it as text). */
const base = labState(createSeed())
const AT = "2026-11-15T00:00:00Z"
const withZeta = addSkillsToStore(base, [draftToSkill({ ...EMPTY_DRAFT, name: "Zeta new skill", category: "Cardiac" }, "lab-skill-zeta")], IDS.ross, AT)
const withBlank = addSkillsToStore(base, [draftToSkill({ ...EMPTY_DRAFT, name: "Blank one" }, "lab-skill-blank")], IDS.ross, AT)
const pick = (s: V2State, id: string): Skill => s.skills.find((k) => k.id === id)!
const storeOf = (s: V2State) => createV2Store({ storage: null, seed: () => s })

function Harness({ store, skill }: { store: ReturnType<typeof createV2Store>; skill: Skill }) {
  return <V2StoreProvider store={store}><SkillRows skills={[skill]} /></V2StoreProvider>
}

describe("category of a newly added skill on a list's skills", () => {
  it("is an editable category control, not text", () => {
    render(<Harness store={storeOf(withZeta)} skill={pick(withZeta, "lab-skill-zeta")} />)
    expect(document.querySelector("[data-category-picker]")).not.toBeNull()
  })
  it("a change is written to the skill, the Library row and the category counts", () => {
    const store = storeOf(withZeta)
    render(<Harness store={store} skill={pick(withZeta, "lab-skill-zeta")} />)
    fireEvent.click(document.querySelector("[data-category-picker]")!)
    fireEvent.click(screen.getByText("Airway"))
    const next = store.getSnapshot()
    expect(pick(next, "lab-skill-zeta").category).toBe("Airway")
    const rows = buildLibrary(next)
    expect(rows.find((r) => r.id === "lab-skill-zeta")!.section).toBe("Airway")
    expect(filterOptions(rows).categories.find((c) => c.name === "Airway")!.count).toBeGreaterThan(1)
  })
  it("an unassigned category is a dropdown reading Select category, never blank and never the static words No category (Romit 2026-11-15)", () => {
    render(<Harness store={storeOf(withBlank)} skill={pick(withBlank, "lab-skill-blank")} />)
    const trigger = document.querySelector<HTMLElement>("[data-category-picker]")!
    expect(trigger.textContent).toBe("Select category")
    // The DS control look: an outline trigger with a chevron, not a ghost text button.
    expect(trigger.getAttribute("data-variant")).toBe("outline")
    expect(trigger.querySelector(".fa-chevron-down")).not.toBeNull()
  })
  it("once chosen, the same trigger shows the category's name; the clear option still reads No category", () => {
    render(<Harness store={storeOf(withZeta)} skill={pick(withZeta, "lab-skill-zeta")} />)
    const trigger = document.querySelector<HTMLElement>("[data-category-picker]")!
    expect(trigger.textContent).toBe("Cardiac")
    expect(trigger.getAttribute("data-variant")).toBe("outline")
    fireEvent.click(trigger)
    expect(screen.getByText("No category", { selector: "[cmdk-item], [cmdk-item] *" })).toBeInTheDocument()
  })
  it("a seeded program skill keeps its category as text: the Library owns it", () => {
    const seeded = base.skills.find((k) => !k.addedByHand && k.category && k.category !== "No category")!
    expect(categoryEditable(seeded)).toBe(false)
    render(<Harness store={storeOf(base)} skill={seeded} />)
    expect(document.querySelector("[data-category-picker]")).toBeNull()
  })
})

describe("Set up skills step 1, Added table", () => {
  it("Category column is an editable control that writes the skill", async () => {
    const { SkillsAddStep } = await import("@/components/lab/setup/skills-add-step")
    const store = storeOf(withZeta)
    render(<V2StoreProvider store={store}><SkillsAddStep /></V2StoreProvider>)
    const picker = await screen.findByLabelText("Category for Zeta new skill", { selector: "button" }).catch(() => null)
    expect(picker ?? document.querySelector("#added-category-lab-skill-zeta")).not.toBeNull()
    fireEvent.click((picker ?? document.querySelector("#added-category-lab-skill-zeta"))!)
    fireEvent.click(screen.getAllByText("Airway").find((e) => e.closest("[cmdk-item],[role=option]"))!)
    expect(pick(store.getSnapshot(), "lab-skill-zeta").category).toBe("Airway")
  })
})
