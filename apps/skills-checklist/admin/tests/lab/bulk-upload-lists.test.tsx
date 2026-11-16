import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { listCanEdit, programLists, skillLists, uploadPreview, uploadToList, validateListName } from "@/lib/lab/lists"
import { buildReview, importListIds, resolve, buildSampleText, applySuggestions, LIBRARY_TARGET, NEW_LIBRARY } from "@/lib/lab/import"
import { V2StoreProvider } from "@/lib/v2/react"
import { createV2Store } from "@/lib/v2/store"

/** Bulk upload into a skill list (Romit 2026-11-15; ADMIN-D6a amendment 2026-11-15d). */
const params = new URLSearchParams()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, replace() {} }), usePathname: () => "/", useSearchParams: () => params }))

const state = labState(createSeed())
const lists = skillLists(programLists(state))

describe("uploadToList: alongside, never removing, never twice", () => {
  const open = lists.find(listCanEdit)!
  const assigned = lists.find((l) => !listCanEdit(l))!
  it("adds new skills after the list's own and skips ones already on it", () => {
    const already = open.skillIds[0]!
    const r = uploadToList(lists, open.id, [already, "new-a", "new-b", "new-a"], "v")!
    const after = r.lists.find((l) => l.id === open.id)!
    expect(after.skillIds.slice(0, open.skillIds.length)).toEqual(open.skillIds)
    expect(after.skillIds.slice(open.skillIds.length)).toEqual(["new-a", "new-b"])
    expect(r.added).toBe(2)
    expect(r.lists).toHaveLength(lists.length)
  })
  it("a list someone has is not edited in place: the skills go on a new version, the original keeps its skills and students", () => {
    const r = uploadToList(lists, assigned.id, ["new-a"], "list-v")!
    expect(r.versionOf?.id).toBe(assigned.id)
    expect(r.lists.find((l) => l.id === assigned.id)!.skillIds).toEqual(assigned.skillIds)
    const v = r.lists.find((l) => l.id === "list-v")!
    expect(v.skillIds).toEqual([...assigned.skillIds, "new-a"])
    expect(v.groupIds).toEqual([])
    expect(uploadPreview(lists, assigned.id, ["new-a"])!.listName).toBe(v.name)
  })
})

describe("importListIds: created skills plus exact library matches", () => {
  it("puts every created skill and every line skipped as already in the library on the list, nothing else", () => {
    const library = state.skills.map((k) => ({ id: k.id, name: k.name, configured: k.configured }))
    const review = buildReview(buildSampleText("standard"), library)
    const decisions = applySuggestions(review, {}, library)
    const resolved = resolve(review, decisions)
    const ids = importListIds(review, resolved, (rowId) => `new:${rowId}`)
    const created = resolved.filter((r) => r.status === "ready" && !r.replaces).length
    const known = resolved.filter((r) => r.status === "left-out" && r.outcome === "Skipped, already in the library").length
    expect(ids.filter((id) => id.startsWith("new:"))).toHaveLength(created)
    expect(ids.length).toBeGreaterThanOrEqual(created)
    expect(ids.length).toBeLessThanOrEqual(created + known + resolved.filter((r) => r.replaces).length)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("Bulk upload step 1: where they go", () => {
  const store = () => createV2Store({ storage: null, seed: () => state })
  it("lists the library, every real skill list with its size, then a new list; no specialty libraries", async () => {
    const { AdminImportA } = await import("@/components/lab/screens/admin-import-a")
    const user = userEvent.setup()
    render(<V2StoreProvider store={store()}><AdminImportA /></V2StoreProvider>)
    await user.click(await screen.findByRole("combobox", { name: /^Skill list/ }))
    const options = (await screen.findAllByRole("option")).map((o) => o.textContent ?? "")
    expect(options[0]).toMatch(/^The library/)
    for (const l of lists) expect(options.some((o) => o.startsWith(l.name) && o.includes(String(l.skillIds.length)))).toBe(true)
    expect(options[options.length - 1]).toBe("A new skill list")
    expect(options.some((o) => /Medical-surgical|Paramedic/.test(o))).toBe(false)
    expect(LIBRARY_TARGET).not.toBe(NEW_LIBRARY)
  })
  it("asks for the new list's name once, on step 1, and checks it like New skill list", async () => {
    const { AdminImportA } = await import("@/components/lab/screens/admin-import-a")
    const user = userEvent.setup()
    render(<V2StoreProvider store={store()}><AdminImportA /></V2StoreProvider>)
    await user.click(await screen.findByRole("combobox", { name: /^Skill list/ }))
    await user.click(await screen.findByRole("option", { name: "A new skill list" }))
    const field = screen.getByRole("textbox", { name: "Name of the new skill list" })
    await user.type(field, lists[0]!.name)
    await user.tab()
    expect(await screen.findByText(validateListName(lists, lists[0]!.name)!)).toBeInTheDocument()
    expect(screen.getAllByRole("textbox", { name: /Name of the new/ })).toHaveLength(1)
    expect(screen.queryByRole("textbox", { name: /Import name/i })).not.toBeInTheDocument()
  })
  it("a link from a list's panel (?to=<id>) opens with that list chosen", async () => {
    const target = lists.find((l) => /Core clinical/.test(l.name)) ?? lists[0]!
    params.set("to", target.id)
    const { AdminImportA } = await import("@/components/lab/screens/admin-import-a")
    render(<V2StoreProvider store={store()}><AdminImportA /></V2StoreProvider>)
    expect(await screen.findByRole("combobox", { name: /^Skill list/ })).toHaveTextContent(target.name)
    params.delete("to")
  })
})

describe("the way back to the list's panel", () => {
  it("Cancel from an upload started on a list returns to Skill lists with that list's panel open", async () => {
    const { returnCarry, returnHref } = await import("@/lib/lab/return-to")
    const { LIBRARY_HREF } = await import("@/components/lab/import/import-parts")
    const p = new URLSearchParams("from=lists&list=list-core&to=list-core")
    const href = returnHref(p.get("from"), LIBRARY_HREF, returnCarry(p.get("from"), p))
    expect(href).toMatch(/list=list-core/)
    expect(href).not.toMatch(/skills-library/)
  })
})

describe("Confirm: every line in one group, and the groups agree with the sentence (rework 1)", () => {
  const library = state.skills.map((k) => ({ id: k.id, name: k.name, configured: k.configured }))
  const review = buildReview(buildSampleText("standard"), library)
  const resolved = resolve(review, applySuggestions(review, {}, library))
  it("the groups add up to the lines read, with or without a list", async () => {
    const { confirmGroups } = await import("@/lib/lab/import")
    const core = lists.find((l) => l.id === "list-core") ?? lists[0]!
    for (const onList of [null, new Set(core.skillIds)]) {
      const g = confirmGroups(review, resolved, onList)
      expect(g.created.length + g.inLibrary.length + g.onListAlready.length + g.mergedOrJoined.length + g.leftOut.length).toBe(resolved.length)
      if (!onList) expect(g.onListAlready).toHaveLength(0)
    }
  })
  it("with a list, created plus 'already in the library, added' is what goes on the list", async () => {
    const { confirmGroups } = await import("@/lib/lab/import")
    const core = lists.find((l) => l.id === "list-core") ?? lists[0]!
    const g = confirmGroups(review, resolved, new Set(core.skillIds))
    const plan = uploadPreview(lists, core.id, importListIds(review, resolved, (rowId) => `new:${rowId}`))!
    const createdOnList = g.created.filter((r) => !(r.replaces && core.skillIds.includes(review.library[r.row.id]?.skillId ?? ""))).length
    expect(plan.added).toBe(createdOnList + g.inLibrary.length)
  })
})

describe("Sidebar: Bulk upload from a list lights Skill lists (rework 1)", () => {
  it("from=lists or ?to= selects Skill lists; from the Library it stays Library", async () => {
    const { skillsPanelItemFor } = await import("@/lib/lab/admin-ia")
    expect(skillsPanelItemFor("admin/import-ai-review", new URLSearchParams("from=lists&list=list-core&to=list-core"))?.key).toBe("groups")
    expect(skillsPanelItemFor("admin/import-ai-review", new URLSearchParams("to=list-core"))?.key).toBe("groups")
    expect(skillsPanelItemFor("admin/import-ai-review", new URLSearchParams("from=skills"))?.key).toBe("library")
    expect(skillsPanelItemFor("admin/import-ai-review", null)?.key).toBe("library")
  })
})

describe("Confirm v3: heading and button agree, left out is the one amber group, lines add up", () => {
  type S = Parameters<typeof import("@/components/lab/screens/admin-import-a").confirmHeading>[0]
  const sess = (o: Partial<{ listPlan: { listName: string; added: number; versionOf?: { name: string } } | null; isNewList: boolean; newListCount: number; newLibraryName: string }>) =>
    ({ listPlan: null, isNewList: false, newListCount: 0, newLibraryName: "", ...o }) as unknown as S
  it("the heading states the button's action, with the same verb and number", async () => {
    const { confirmHeading, primaryLabel } = await import("@/components/lab/screens/admin-import-a")
    const cases: Array<[S, number]> = [
      [sess({ listPlan: { listName: "Core clinical skills v2", added: 104, versionOf: { name: "Core clinical skills" } } }), 5],
      [sess({ listPlan: { listName: "Practicum competencies", added: 12 } }), 3],
      [sess({ isNewList: true, newListCount: 152, newLibraryName: "Spring 2027 uploads" }), 5],
      [sess({}), 5],
    ]
    for (const [s, total] of cases) {
      const h = confirmHeading(s, total), b = primaryLabel(s, total)
      expect(h.split(" ").slice(0, 3).join(" ")).toBe(b.split(" ").slice(0, 3).join(" "))
    }
    expect(confirmHeading(sess({}), 0)).toBe("Nothing new to create")
  })
  it("Confirm lists every line in one tab per outcome, the tabs add up to the lines, and only Left out is amber", async () => {
    const { ConfirmSummary } = await import("@/components/lab/import/import-parts")
    const library = state.skills.map((k) => ({ id: k.id, name: k.name, configured: k.configured }))
    const review = buildReview(buildSampleText("standard"), library)
    const resolved = resolve(review, applySuggestions(review, {}, library))
    const core = lists.find((l) => l.id === "list-core") ?? lists[0]!
    const session = { review, resolved, targetList: core, isNewList: false, listPlan: uploadPreview(lists, core.id, importListIds(review, resolved, (id) => `new:${id}`)), fileName: "Clinical skills checklist.pdf", newLibraryName: "" } as never
    render(<V2StoreProvider store={createV2Store({ storage: null, seed: () => state })}><ConfirmSummary session={session} onChange={() => {}} /></V2StoreProvider>)
    const tabs = [...document.querySelectorAll("[data-line-group]")]
    const sum = tabs.reduce((n, t) => n + Number(t.getAttribute("data-line-count")), 0)
    expect(sum).toBe(resolved.length)
    expect(screen.getByText(`${resolved.length} lines read`)).toBeInTheDocument()
    const amber = tabs.filter((t) => t.querySelector(".fa-triangle-exclamation"))
    expect(amber.map((t) => t.getAttribute("data-line-group"))).toEqual(tabs.some((t) => t.getAttribute("data-line-group") === "left-out") ? ["left-out"] : [])
    expect(document.querySelector("[data-confirm-version]")?.textContent).toMatch(/keep it/)
  })
})

describe("Steps v4: the four steps agree", () => {
  const store = () => createV2Store({ storage: null, seed: () => state })
  it("Review shows the destination read only with Change, figures that add up to the lines read, and no amber", async () => {
    params.set("state", "review")
    const { AdminImportA } = await import("@/components/lab/screens/admin-import-a")
    render(<V2StoreProvider store={store()}><AdminImportA /></V2StoreProvider>)
    expect(await screen.findByRole("heading", { name: "Review what was read" })).toBeInTheDocument()
    const answers = document.querySelector("[data-confirm-answers]")!
    expect(answers.textContent).toMatch(/Skill list\s*The library/)
    expect(screen.queryByRole("combobox", { name: /^Skill list/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^Change/ }).length).toBeGreaterThanOrEqual(2)
    const read = Number(document.querySelector("[data-review-summary]")!.getAttribute("data-lines-read"))
    expect(answers.textContent).toContain(`${read} lines read`)
    expect(document.querySelector("[data-review-summary] .fa-triangle-exclamation, [data-category-list] .fa-triangle-exclamation")).toBeNull()
    params.delete("state")
  })
  it("Fix: Next stays off until no line is open; Accept all opens it and offers Undo", async () => {
    params.set("state", "review")
    const { AdminImportA } = await import("@/components/lab/screens/admin-import-a")
    const user = userEvent.setup()
    render(<V2StoreProvider store={store()}><AdminImportA /></V2StoreProvider>)
    await user.click(await screen.findByRole("button", { name: /^Fix \d+ lines/ }))
    expect(await screen.findByRole("heading", { name: "Fix the lines" })).toBeInTheDocument()
    const nextBtn = () => screen.getAllByRole("button", { name: /^Next$/ }).at(-1)!
    expect(nextBtn()).toBeDisabled()
    expect(Number(document.querySelector("[data-fix-counts]")!.getAttribute("data-fix-open"))).toBeGreaterThan(0)
    await user.click(screen.getByRole("button", { name: "Accept all suggestions" }))
    expect(nextBtn()).toBeEnabled()
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument()
    expect(document.querySelector("[data-fix-counts]")!.getAttribute("data-fix-open")).toBe("0")
    params.delete("state")
  })
  it("Upload asks Skill list and File once, with no promise tiles", async () => {
    const { AdminImportA } = await import("@/components/lab/screens/admin-import-a")
    render(<V2StoreProvider store={store()}><AdminImportA /></V2StoreProvider>)
    expect(await screen.findByRole("heading", { name: "Upload a file" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: /^Skill list/ })).toBeInTheDocument()
    expect(document.querySelector("[data-import-promises]")).toBeNull()
  })
})
