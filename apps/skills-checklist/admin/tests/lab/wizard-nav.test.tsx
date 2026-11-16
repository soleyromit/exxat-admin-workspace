/**
 * New skill list, steps 3 and 4, walked forwards and backwards (Sankalp 2026-11-15, audit walk3 D2, D3, D8, D9).
 * D2: a typed Times needed number is never lost silently: Esc, Back and the panel's exit all settle it the same way.
 * D3: the question about it offers Save and leave, Discard and Keep editing, and the first two go on to where the admin was going.
 * D8: each arrow names the step it goes to.
 * D9: stepping back from step 4 keeps the ticked students with no question; leaving the wizard asks, in one sentence.
 */
import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {}, replace() {}, back() {} }), usePathname: () => "/", useSearchParams: () => new URLSearchParams() }))

import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { ASSIGN_UNSAVED, seedLists, studentGroups, type SkillList } from "@/lib/lab/lists"
import { setTimesNeededMany, timesCellOf, timesNeededImpact, TIMES_MAX } from "@/lib/lab/program-settings"
import { ListSetupLevel, NewListPage } from "@/components/lab/admin-a/lists-new-page"
import { AssignWizard, draftHasPicks, type AssignDraft } from "@/components/lab/admin-a/lists-add-students"
import { V2StoreProvider, activeV2Store } from "@/lib/v2/react"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { FloatingSheetPanelContent } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import type { ListsModel } from "@/components/lab/admin-a/lists-parts"
import type { V2State } from "@/lib/v2/types"

afterEach(() => cleanup())
// 150-row steps render slowly under a loaded machine.
vi.setConfig({ testTimeout: 120000 })

const state = labState(createSeed())
const lists = seedLists(state)
const model: ListsModel = { state, lists, groups: studentGroups(state), setLists: () => {}, addGroup: () => {}, renameGroup: () => {}, removeGroup: () => {}, applyNow: () => {} }
const list = lists.reduce((a, b) => (b.skillIds.length > a.skillIds.length ? b : a))

/** A skill on the list, and a number for it that moves students (`moves`) or moves nobody. */
function pickSkill(s: V2State, moves: boolean): { id: string; name: string; need: number } {
  for (const id of list.skillIds) {
    const now = timesCellOf(s, id).value
    for (let need = 1; need <= TIMES_MAX; need++) {
      if (need === now) continue
      if (setTimesNeededMany(s, [id], need, { at: "2026-11-15T00:00:00Z", byId: "x" }).failed.length) continue
      if ((timesNeededImpact(s, id, need).length > 0) === moves) return { id, name: s.skills.find((k) => k.id === id)!.name, need }
    }
  }
  throw new Error(`no skill on ${list.name} with a number that ${moves ? "moves" : "moves no"} students`)
}

function renderStep3(props: Partial<React.ComponentProps<typeof ListSetupLevel>> = {}) {
  const onBack = vi.fn()
  const onNext = vi.fn()
  const leaveRef: React.MutableRefObject<(() => void) | null> = { current: null }
  const exitRef: React.MutableRefObject<((go: () => void) => void) | null> = { current: null }
  render(
    <V2StoreProvider>
      <FloatingSheetPanel open onOpenChange={(o) => { if (!o) leaveRef.current?.() }}>
        <FloatingSheetPanelContent side="right" size="lg">
          <ListSetupLevel model={model} list={list} leaveRef={leaveRef} exitRef={exitRef} onBack={onBack} onNext={onNext} {...props} />
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </V2StoreProvider>,
  )
  return { onBack, onNext, leaveRef, exitRef }
}

const footerBack = () => document.querySelector<HTMLElement>("[data-slot=floating-sheet-panel-footer] button")!
const snapshot = () => activeV2Store()!.getSnapshot()
const cell = (id: string) => document.getElementById(`times-cell-${id}`) as HTMLInputElement

/** Types a number into a cell, leaving it focused and unsaved, as the admin does before pressing a way out. */
async function typeNumber(id: string, need: number) {
  const input = cell(id)
  act(() => input.focus())
  fireEvent.change(input, { target: { value: String(need) } })
  await waitFor(() => expect(input).toHaveValue(need))
}

describe("D2: a typed Times needed number on step 3 is never lost silently", () => {
  it("Esc with a number that moves students asks first; the cell keeps the number and the step does not move", async () => {
    const { onBack } = renderStep3()
    const k = pickSkill(snapshot(), true)
    await typeNumber(k.id, k.need)
    fireEvent.keyDown(cell(k.id), { key: "Escape" })
    expect(await screen.findByRole("alertdialog", { name: `Change times needed for ${k.name}?` })).toBeInTheDocument()
    expect(onBack).not.toHaveBeenCalled()
    expect(cell(k.id)).toHaveValue(k.need)
    expect(timesCellOf(snapshot(), k.id).value).not.toBe(k.need)
  })
  it("Esc with a number that moves nobody saves it, as a blur does, and steps back", async () => {
    const { onBack } = renderStep3()
    const k = pickSkill(snapshot(), false)
    await typeNumber(k.id, k.need)
    fireEvent.keyDown(cell(k.id), { key: "Escape" })
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1))
    expect(timesCellOf(snapshot(), k.id).value).toBe(k.need)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
  it("the footer Back and the arrow go through the same question", async () => {
    const user = userEvent.setup()
    const { onBack } = renderStep3()
    const k = pickSkill(snapshot(), true)
    await typeNumber(k.id, k.need)
    await user.click(footerBack())
    expect(await screen.findByRole("alertdialog", { name: `Change times needed for ${k.name}?` })).toBeInTheDocument()
    expect(onBack).not.toHaveBeenCalled()
  })
  it("a number outside 1 to the maximum asks Discard or Keep editing, never Save", async () => {
    const { exitRef } = renderStep3()
    const k = pickSkill(snapshot(), true)
    const input = cell(k.id)
    act(() => input.focus())
    fireEvent.change(input, { target: { value: "0" } })
    const go = vi.fn()
    act(() => exitRef.current!(go))
    const dialog = await screen.findByRole("alertdialog", { name: "Discard your changes?" })
    expect(dialog).toHaveTextContent(`from 1 to ${TIMES_MAX}`)
    expect(screen.queryByRole("button", { name: /^Save/ })).not.toBeInTheDocument()
    expect(go).not.toHaveBeenCalled()
  })
  it("a number the skill's rule refuses is never saved on the way out: the question says why and offers Discard", async () => {
    const { exitRef } = renderStep3()
    const s = snapshot()
    const refused = list.skillIds.flatMap((id) => [1, 2, 3].filter((n) => n !== timesCellOf(s, id).value).map((n) => ({ id, n, r: setTimesNeededMany(s, [id], n, { at: "2026-11-15T00:00:00Z", byId: "x" }).failed[0] }))).find((x) => x.r)
    if (!refused) return
    await typeNumber(refused.id, refused.n)
    act(() => exitRef.current!(() => {}))
    const dialog = await screen.findByRole("alertdialog", { name: "Discard your changes?" })
    expect(dialog).toHaveTextContent(refused.r!.error)
    expect(screen.queryByRole("button", { name: /^Save/ })).not.toBeInTheDocument()
  })
})

describe("Cause found in Chrome: the guard's history write while typing reset the cell", () => {
  it("step 3 writes its history entry when it opens, and typing a number writes none, so the typed number stays in the cell", async () => {
    const push = vi.spyOn(window.history, "pushState")
    const replace = vi.spyOn(window.history, "replaceState")
    renderStep3()
    await waitFor(() => expect(push).toHaveBeenCalled())
    const writes = push.mock.calls.length + replace.mock.calls.length
    const k = pickSkill(snapshot(), true)
    await typeNumber(k.id, k.need)
    expect(push.mock.calls.length + replace.mock.calls.length).toBe(writes)
    expect(cell(k.id)).toHaveValue(k.need)
    push.mockRestore()
    replace.mockRestore()
  })
})

describe("D3: the question goes on to where the admin was going", () => {
  it("names the students, and Save and leave writes the number and then leaves", async () => {
    const user = userEvent.setup()
    const { exitRef } = renderStep3()
    const k = pickSkill(snapshot(), true)
    const students = timesNeededImpact(snapshot(), k.id, k.need)
    await typeNumber(k.id, k.need)
    const go = vi.fn()
    act(() => exitRef.current!(go))
    const dialog = await screen.findByRole("alertdialog", { name: `Change times needed for ${k.name}?` })
    expect(dialog).toHaveTextContent(students[0]!.name)
    expect(screen.getByRole("button", { name: "Keep editing" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save and leave" }))
    expect(go).toHaveBeenCalledTimes(1)
    expect(timesCellOf(snapshot(), k.id).value).toBe(k.need)
  })
  it("Discard leaves without writing and puts the cell back", async () => {
    const user = userEvent.setup()
    const { exitRef } = renderStep3()
    const k = pickSkill(snapshot(), true)
    const before = timesCellOf(snapshot(), k.id).value
    await typeNumber(k.id, k.need)
    const go = vi.fn()
    act(() => exitRef.current!(go))
    await user.click(await screen.findByRole("button", { name: "Discard" }))
    expect(go).toHaveBeenCalledTimes(1)
    expect(timesCellOf(snapshot(), k.id).value).toBe(before)
    expect(cell(k.id)).toHaveValue(before)
  })
  it("Keep editing stays, with the typed number in the cell and focus back in it", async () => {
    const user = userEvent.setup()
    const { exitRef } = renderStep3()
    const k = pickSkill(snapshot(), true)
    await typeNumber(k.id, k.need)
    const go = vi.fn()
    act(() => exitRef.current!(go))
    await user.click(await screen.findByRole("button", { name: "Keep editing" }))
    expect(go).not.toHaveBeenCalled()
    expect(cell(k.id)).toHaveValue(k.need)
    await waitFor(() => expect(document.activeElement).toBe(cell(k.id)))
  })
  it("Next says Save and continue, and continues to step 4 after saving", async () => {
    const user = userEvent.setup()
    const { onNext } = renderStep3()
    const k = pickSkill(snapshot(), true)
    await typeNumber(k.id, k.need)
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    await user.click(await screen.findByRole("button", { name: "Save and continue" }))
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(timesCellOf(snapshot(), k.id).value).toBe(k.need)
  })
})

describe("D8: each arrow names the step it goes to", () => {
  it("step 2's arrow reads Back to New skill list", async () => {
    const user = userEvent.setup()
    render(<V2StoreProvider><NewListPage model={model} onClose={() => {}} onSaved={() => {}} /></V2StoreProvider>)
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Arrow check")
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    expect(await screen.findByRole("button", { name: "Back to New skill list" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Back to the name" })).not.toBeInTheDocument()
  })
  it("step 3's arrow reads Back to Add skills, not the list's name", () => {
    renderStep3()
    expect(screen.getByRole("button", { name: "Back to Add skills" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: `Back to ${list.name}` })).not.toBeInTheDocument()
  })
  it("step 4's arrow reads Back to Configure skills; Assign opened from a list's panel still reads Back to the list", () => {
    const fresh: SkillList = { ...list, groupIds: [], studentIds: [] }
    const { unmount } = render(<V2StoreProvider><FloatingSheetPanel open><FloatingSheetPanelContent side="right" size="lg"><AssignWizard model={model} list={fresh} initialQuery="" stepLabel="Step 4 of 4" leaveRef={{ current: null }} dirtyRef={{ current: false }} onBack={() => {}} onClose={() => {}} onAdd={() => {}} /></FloatingSheetPanelContent></FloatingSheetPanel></V2StoreProvider>)
    expect(screen.getByRole("button", { name: "Back to Configure skills" })).toBeInTheDocument()
    unmount()
    render(<V2StoreProvider><FloatingSheetPanel open><FloatingSheetPanelContent side="right" size="lg"><AssignWizard model={model} list={fresh} initialQuery="" leaveRef={{ current: null }} dirtyRef={{ current: false }} onClose={() => {}} onAdd={() => {}} /></FloatingSheetPanelContent></FloatingSheetPanel></V2StoreProvider>)
    expect(screen.getByRole("button", { name: `Back to ${fresh.name}` })).toBeInTheDocument()
  })
})

describe("D9: stepping back from step 4 keeps the picks; leaving asks in one sentence", () => {
  const fresh: SkillList = { ...list, groupIds: [], studentIds: [] }
  const group = model.groups.find((g) => g.kind !== "all")!
  function Step4({ draft, onBack, onClose, leaveRef }: { draft: React.MutableRefObject<AssignDraft | null>; onBack?: () => void; onClose: () => void; leaveRef: React.MutableRefObject<(() => void) | null> }) {
    return <V2StoreProvider><FloatingSheetPanel open><FloatingSheetPanelContent side="right" size="lg"><AssignWizard model={model} list={fresh} initialQuery="" stepLabel={onBack ? "Step 4 of 4" : undefined} leaveRef={leaveRef} dirtyRef={{ current: false }} draft={draft} onBack={onBack} onClose={onClose} onAdd={() => {}} /></FloatingSheetPanelContent></FloatingSheetPanel></V2StoreProvider>
  }
  async function tickGroup(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("radio", { name: "Specific cohorts or students" }))
    await user.click(await screen.findByRole("checkbox", { name: new RegExp(`^${group.label}`) }))
  }
  it("Back, the arrow and Esc step back with no question, and the ticked group is still ticked on the way forward", async () => {
    const user = userEvent.setup()
    const draft: React.MutableRefObject<AssignDraft | null> = { current: null }
    const onBack = vi.fn()
    const leaveRef: React.MutableRefObject<(() => void) | null> = { current: null }
    const { unmount } = render(<Step4 draft={draft} onBack={onBack} onClose={() => {}} leaveRef={leaveRef} />)
    await tickGroup(user)
    await user.click(footerBack())
    expect(onBack).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole("button", { name: "Back to Configure skills" }))
    act(() => leaveRef.current!())
    expect(onBack).toHaveBeenCalledTimes(3)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(draftHasPicks(draft.current)).toBe(true)
    unmount()
    render(<Step4 draft={draft} onBack={onBack} onClose={() => {}} leaveRef={leaveRef} />)
    expect(await screen.findByRole("checkbox", { name: new RegExp(`^${group.label}`) })).toBeChecked()
  })
  it("Assign from a list's panel still asks before Cancel drops the picks, in the same sentence as the wizard's exit", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Step4 draft={{ current: null }} onClose={onClose} leaveRef={{ current: null }} />)
    await tickGroup(user)
    await user.click(screen.getByRole("button", { name: /^Cancel/ }))
    const dialog = await screen.findByRole("alertdialog", { name: "Discard your changes?" })
    expect(dialog).toHaveTextContent(ASSIGN_UNSAVED)
    expect(onClose).not.toHaveBeenCalled()
  })
})
