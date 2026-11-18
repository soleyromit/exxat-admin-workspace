import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createSeed } from "@/lib/v2/seed"
import type { ImportBatch, V2State } from "@/lib/v2/types"
import { programLists } from "@/lib/lab/lists"
import type { SkillList } from "@/lib/lab/list-core"
import { savedOverlay, skillReach } from "@/lib/lab/mapping"
import { courseUses, listUses, skillOrigin } from "@/lib/lab/skill-used-in"

/**
 * The skill panel's Used in tab (Romit 2026-11-17, "info looks vague"): lists and courses by name, each with its own fact as a word,
 * three before "and N more", and Added in the most specific words the store holds.
 */
vi.mock("next/navigation", () => ({
  usePathname: () => "/lab/admin/skills-library",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
  redirect: vi.fn(),
}))

const seed = createSeed()
const lists = programLists(seed)
const base = lists[0]!
/** A skill the seed maps to five courses: one Mandatory, four Recommended. */
const MAPPED = "hgtc-basic-skills-02"
const second: SkillList = { ...base, id: "list-second", name: "Senior capstone list", isDefault: false, groupIds: [], studentIds: [], requiredIds: [MAPPED] }

describe("listUses: each list by name with Required or Optional on that list", () => {
  it("names every list that holds the skill, the default first, with its own required mark", () => {
    const uses = listUses([second, base], MAPPED)
    expect(uses.map((u) => u.name)).toEqual([base.name, "Senior capstone list"])
    expect(uses.map((u) => u.required)).toEqual([false, true])
  })
  it("is empty for a skill on no list", () => {
    expect(listUses([{ ...base, skillIds: [] }], MAPPED)).toEqual([])
  })
})

describe("courseUses: each mapped course by code and name, Mandatory first", () => {
  it("lists the five courses of the seed's mapping, with the level per course", () => {
    const uses = courseUses(seed, savedOverlay(seed), MAPPED)
    expect(uses.map((u) => u.code)).toEqual(["NUR 101", "NUR 150", "NUR 201", "NUR 221", "NURS 352"])
    expect(uses[0]).toMatchObject({ name: "Fundamentals of Nursing", level: "mandatory" })
    expect(uses.slice(1).every((u) => u.level === "recommended")).toBe(true)
    expect(uses.every((u) => u.offeringId)).toBe(true)
  })
  it("agrees with the course and mandatory counts course mapping reads (skillReach), for every skill", () => {
    const o = savedOverlay(seed)
    for (const r of skillReach(seed, o, "", lists)) {
      const uses = courseUses(seed, o, r.id)
      expect([r.id, uses.length, uses.filter((u) => u.level === "mandatory").length]).toEqual([r.id, r.courses, r.mandatoryCourses])
    }
  })
})

describe("skillOrigin: Added says where the skill came from, from the store only", () => {
  const skillId = seed.skills[0]!.id
  const withBatch = (batch: Partial<ImportBatch>, extra: Partial<V2State["skills"][number]> = {}): V2State => {
    const b: ImportBatch = { id: "bt-x", at: "2026-11-17T10:00:00Z", actorId: "u", kind: "file-import", label: "", skillIds: [skillId, "a", "b"], ...batch }
    return { ...seed, batches: [b], skills: seed.skills.map((k) => (k.id === skillId ? { ...k, batchId: b.id, ...extra } : k)) }
  }

  it("the seed: the program's starting list, with no date", () => {
    expect(skillOrigin(seed, skillId, lists)).toMatchObject({ kind: "seed", lead: "From the program's starting list", others: 0 })
    expect(skillOrigin(seed, skillId, lists).date).toBeUndefined()
  })
  it("a bulk upload: the upload's name without the short date, and the batch's own date", () => {
    const o = skillOrigin(withBatch({ label: "nursing-skills, Nov 17" }), skillId, lists)
    expect(o).toMatchObject({ kind: "upload", lead: "From", name: "nursing-skills", date: "Nov 17, 2026", others: 2 })
  })
  it("a pasted list and the v2 import read plainly", () => {
    expect(skillOrigin(withBatch({ label: "Pasted list, Nov 17" }), skillId, lists).lead).toBe("From a pasted list")
    expect(skillOrigin(withBatch({ label: "Import from fall-2026.csv" }), skillId, lists)).toMatchObject({ lead: "From", name: "fall-2026.csv" })
  })
  it("a starting point: Copied from its name", () => {
    expect(skillOrigin(withBatch({ kind: "starter-library", label: "ADN fundamentals" }), skillId, lists)).toMatchObject({ kind: "starter", lead: "Copied from", name: "ADN fundamentals" })
  })
  it("created on a list: Created in that list, which is a link target", () => {
    const o = skillOrigin(withBatch({ kind: "add-several", label: "Add skills, Nov 17, 2026", listId: base.id }, { addedByHand: true }), skillId, lists)
    expect(o).toMatchObject({ kind: "list", lead: "Created in", name: base.name, listId: base.id })
  })
  it("created on a list the batch does not name: says so without inventing the list", () => {
    const o = skillOrigin(withBatch({ kind: "add-several", label: "Add skills, Nov 17, 2026" }, { addedByHand: true }), skillId, lists)
    expect(o.lead).toBe("Created while adding to a skill list")
    expect(o.name).toBeUndefined()
  })
  it("added several in the library, and one added by hand with no date", () => {
    expect(skillOrigin(withBatch({ kind: "add-several", label: "Add several, Nov 17, 2026" }, { addedByHand: true }), skillId, lists).lead).toBe("Added several at once in the library")
    const hand: V2State = { ...seed, skills: seed.skills.map((k) => (k.id === skillId ? { ...k, addedByHand: true } : k)) }
    const o = skillOrigin(hand, skillId, lists)
    expect(o).toMatchObject({ kind: "hand", lead: "Added by hand" })
    expect(o.date).toBeUndefined()
  })
})

describe("the Used in tab renders names, words and the first three", () => {
  it("shows each list and course by name with its tag, three courses then and 2 more, and Added", async () => {
    const { SkillPanel } = await import("@/components/lab/library/skill-panel")
    const { useLibrary } = await import("@/components/lab/library/use-library")
    const { useLists } = await import("@/components/lab/admin-a/use-admin-data")
    const { V2StoreProvider, useV2State } = await import("@/lib/v2/react")
    const handlers = { onEdit: vi.fn(), onDeactivate: vi.fn(), onReactivate: vi.fn(), onDelete: vi.fn() }
    const Host = () => {
      const api = useLibrary()
      const { lists: now, setLists } = useLists(useV2State())
      React.useEffect(() => { if (now.length === 1) setLists([...now, second]) }, [now, setLists])
      const r = api.byId.get(MAPPED)
      return r ? <SkillPanel row={r} rows={[r]} allRows={[r]} handlers={handlers} api={api} onOpen={vi.fn()} onClose={vi.fn()} dirty={false} onDirty={vi.fn()} attempt={(a) => a()} discards={0} /> : null
    }
    render(<V2StoreProvider><Host /></V2StoreProvider>)
    await userEvent.click(await screen.findByRole("tab", { name: "Used in" }))

    const listsBlock = await screen.findByText((_, el) => el?.getAttribute("data-used-in") === "lists")
    await within(listsBlock).findByRole("link", { name: "Senior capstone list" })
    expect(within(listsBlock).getByRole("link", { name: base.name })).toBeInTheDocument()
    expect(within(listsBlock).getByText("Required")).toBeInTheDocument()
    expect(within(listsBlock).getByText("Optional")).toBeInTheDocument()

    const coursesBlock = screen.getByText((_, el) => el?.getAttribute("data-used-in") === "courses")
    const links = within(coursesBlock).getAllByRole("link")
    expect(links.map((a) => a.textContent)).toEqual(["NUR 101 Fundamentals of Nursing", "NUR 150 Nursing Care of Adults I", "NUR 201 Transition Nursing"])
    expect(links[0]!.getAttribute("href")).toContain("offering=")
    expect(within(coursesBlock).getByText("Mandatory")).toBeInTheDocument()
    await userEvent.click(within(coursesBlock).getByRole("button", { name: "Show 2 more courses" }))
    expect(within(coursesBlock).getAllByRole("link")).toHaveLength(5)
    expect(within(coursesBlock).queryByRole("button")).toBeNull()

    expect(screen.getByText("Added")).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.getAttribute("data-used-in") === "origin")).toHaveTextContent("From the program's starting list")
    expect(screen.queryByText("Came from")).toBeNull()
  }, 90000)
})
