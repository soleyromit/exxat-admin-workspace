import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import {
  createList,
  deleteBlockedReason,
  deleteImpact,
  pickAll,
  pickState,
  seedLists,
  skillsToCopy,
  startFromOptions,
  studentGroups,
  validateListName,
} from "@/lib/lab/lists"
import { configurationOf } from "@/lib/lab/program-settings"
import { SkillPicker } from "@/components/lab/admin-a/lists-panel"
import { DeleteListDialog } from "@/components/lab/admin-a/lists-parts"
import { ListRowMenu } from "@/components/lab/admin-a/lists-groups-table"
import type { Skill } from "@/lib/v2/types"

/** Sankalp 2026-11-15 (ADMIN-D6 amendment): clone, delete guard, select all, adding apart from configuring. */
const s = labState(createSeed())
const lists = seedLists(s)
const groups = studentGroups(s)
const def = lists.find((l) => l.isDefault)!

describe("b) start from an existing list copies the skills, not who has it", () => {
  it("offers only lists that hold skills", () => {
    const offered = startFromOptions(lists)
    expect(offered.length).toBeGreaterThan(0)
    for (const l of offered) expect(l.skillIds.length).toBeGreaterThan(0)
  })
  it("copies the source's active skills in the source's own set and nothing else", () => {
    const offered = new Set(def.skillIds.slice(0, 100))
    const ids = skillsToCopy(lists, def.id, offered)
    expect(ids).toHaveLength(100)
    expect(ids.every((id) => offered.has(id))).toBe(true)
    expect(skillsToCopy(lists, null, offered)).toEqual([])
    expect(skillsToCopy(lists, "no-such-list", offered)).toEqual([])
  })
  it("a list made from the copied skills starts on no group and no student and is not a second default", () => {
    const made = createList(lists, { name: "Clone", noun: "skill", nounPlural: "skills", standard: "", fromListId: null, fromSkillIds: skillsToCopy(lists, def.id, new Set(def.skillIds)) }, "list-clone")
    expect(made.skillIds).toHaveLength(def.skillIds.length)
    expect(made.groupIds).toEqual([])
    expect(made.studentIds ?? []).toEqual([])
    expect(made.isDefault).toBe(false)
  })
  it("the name step refuses an empty or taken name before any skill is asked for", () => {
    expect(validateListName(lists, "  ")).toBe("Give the list a name.")
    expect(validateListName(lists, def.name)).toMatch(/exists/)
    expect(validateListName(lists, "A brand new list")).toBeNull()
  })
})

describe("c) delete a skill list", () => {
  it("the default list cannot be deleted and says why; others can", () => {
    expect(deleteBlockedReason(def)).toMatch(/default/)
    expect(deleteBlockedReason({ isDefault: false })).toBeNull()
  })
  it("names who a list reaches: groups, and students once each", () => {
    const withWho = lists.find((l) => !l.isDefault && l.groupIds.length > 0)!
    const impact = deleteImpact(withWho, groups)
    expect(impact.groups.length).toBe(withWho.groupIds.length)
    expect(impact.students).toBeGreaterThan(0)
    expect(impact.skills).toBe(withWho.skillIds.length)
  })
  it("the row menu keeps Delete in view on the default list, disabled, with the reason beside it", async () => {
    const user = userEvent.setup()
    render(<ListRowMenu list={def} onRename={() => {}} onNewVersion={() => {}} onDelete={() => {}} />)
    await user.click(screen.getByRole("button", { name: `Actions for ${def.name}` }))
    const item = await screen.findByRole("menuitem", { name: /Delete/ })
    expect(item).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByText(/Make another list the default first/)).toBeInTheDocument()
  })
  it("the row menu offers a working Delete on a list nobody is blocked on", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const plain = { ...lists.find((l) => !l.isDefault)!, isDefault: false }
    render(<ListRowMenu list={plain} onRename={() => {}} onNewVersion={() => {}} onDelete={onDelete} />)
    await user.click(screen.getByRole("button", { name: `Actions for ${plain.name}` }))
    await user.click(await screen.findByRole("menuitem", { name: /Delete/ }))
    expect(onDelete).toHaveBeenCalledWith(plain)
  })
  it("the confirm says the skills stay in the library and who is affected", () => {
    const withWho = lists.find((l) => !l.isDefault && l.groupIds.length > 0)!
    render(<DeleteListDialog list={withWho} groups={groups} back={{ onCloseAutoFocus: () => {} }} onClose={() => {}} onConfirm={() => {}} />)
    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText(/stay in the library/)).toBeInTheDocument()
    expect(within(dialog).getByText(/will have no skill list until you assign another/)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Delete skill list" })).toBeInTheDocument()
  })
})

describe("d) select all when adding skills", () => {
  const ids = Array.from({ length: 150 }, (_, i) => `k${i}`)
  it("counts and toggles the whole result, leaving the rest of the selection alone", () => {
    expect(pickState(ids, new Set())).toEqual({ on: 0, of: 150, all: false, some: false })
    const some = pickAll(ids.slice(0, 40), new Set(["elsewhere"]), true)
    expect(some.has("elsewhere")).toBe(true)
    expect(pickState(ids, some)).toMatchObject({ on: 40, of: 150, all: false, some: true })
    const all = pickAll(ids, some, true)
    expect(pickState(ids, all)).toMatchObject({ on: 150, all: true, some: false })
    expect(pickAll(ids, all, false).has("elsewhere")).toBe(true)
    expect(pickState([], all)).toMatchObject({ of: 0, all: false })
  })
  const skills = ids.map((id, i) => ({ id, name: `Skill ${String(i).padStart(3, "0")}`, active: true, category: i % 2 ? "Airway" : "Cardiac" }) as unknown as Skill)
  it("the header checkbox selects every skill in the result in one press and says n of N", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SkillPicker skills={skills} savedIds={new Set()} selected={new Set()} others={[]} onChange={onChange} idPrefix="t" library />)
    expect(screen.getByRole("status")).toHaveTextContent("0 of 150 skills selected")
    await user.click(screen.getByRole("checkbox", { name: "Select all" }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]![0].size).toBe(150)
  })
  it("with a search it acts on the matches only and names how many", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SkillPicker skills={skills} savedIds={new Set()} selected={new Set(["k0"])} others={[]} onChange={onChange} idPrefix="t" library />)
    await user.type(screen.getByRole("searchbox", { name: "Search the library" }), "Skill 01")
    // Skill 010 to Skill 019 match.
    const all = await screen.findByRole("checkbox", { name: "Select all 10 matching" })
    expect(screen.getByRole("status")).toHaveTextContent("0 of 10 skills selected, 1 on the list in all")
    await user.click(all)
    const next = onChange.mock.calls.at(-1)![0] as Set<string>
    expect(next.size).toBe(11)
    expect(next.has("k0")).toBe(true)
  })
})

describe("e) adding skills and configuring them are separate", () => {
  it("a skill added by name arrives not configured and does not need a form to be on a list", () => {
    const fresh = { id: "k-new", name: "New skill", active: true } as unknown as Skill
    expect(configurationOf(s, fresh)).toBe("not-configured")
  })
})
