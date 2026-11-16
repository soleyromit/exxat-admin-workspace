/**
 * Sankalp point 7 (2026-11-15, "no way to exit back to the skill lists page; navigation feels broken"):
 * 1. The "Skills" crumb leads to Skill lists, as the Skills row does; every crumb before the leaf is a link; a page reached from a list
 *    sits under Skills; the breadcrumb is named "Breadcrumb".
 * 2. Links out of step 3 of New skill list carry the way back to that step.
 * 3. Esc on step 4 (Assign) steps back to step 3, as Esc does on steps 2 and 3: the level's Back survives the hand-over from step 3.
 */
import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const nav = vi.hoisted(() => ({ pathname: "/lab", search: "" }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { LabFrame, LabProviders } from "@/components/lab/lab-frame"
import { resolveStep } from "@/lib/lab/flows"
import { fromSetup, returnTarget } from "@/lib/lab/return-to"
import { createSeed } from "@/lib/v2/seed"
import { labState } from "@/lib/lab/reviewer"
import { programLists, seedLists, studentGroups } from "@/lib/lab/lists"
import { ListSetupLevel } from "@/components/lab/admin-a/lists-new-page"
import { AssignWizard } from "@/components/lab/admin-a/lists-add-students"
import { V2StoreProvider } from "@/lib/v2/react"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { FloatingSheetPanelContent } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import type { ListsModel } from "@/components/lab/admin-a/lists-parts"

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
})

const WALK = "setup-walkthrough"

function crumbsOn(step: string, search = ""): Array<{ text: string; href: string | null }> {
  const r = resolveStep(WALK, step, "1")!
  nav.pathname = `/lab/flow/${WALK}/${step}`
  nav.search = search
  const { container, unmount } = render(
    <LabProviders><LabFrame persona="admin" navPersona="admin" page={{ flow: WALK, step, screen: `${r.screen.persona}/${r.screen.slug}`, variant: r.variant.id }}><div>page</div></LabFrame></LabProviders>,
  )
  expect(container.querySelector('[aria-label="Lab location"]')).toBeNull()
  const full = container.querySelector('nav[aria-label="Breadcrumb"] ol')
  expect(full).not.toBeNull()
  const out = Array.from(full!.querySelectorAll("li[data-slot=breadcrumb-item], li")).filter((li) => !li.getAttribute("role")).map((li) => {
    const a = li.querySelector("a")
    return { text: (li.textContent ?? "").trim(), href: a ? a.getAttribute("href") : null }
  }).filter((c) => c.text)
  unmount()
  return out
}

describe("1. The Skills crumb leads to Skill lists everywhere", () => {
  it.each(["lists", "library", "settings", "categories", "map"])("on %s: Dashboard links to the PRISM home and Skills to Skill lists", (step) => {
    const crumbs = crumbsOn(step)
    expect(crumbs.find((c) => c.text === "Dashboard")?.href).toBe("/")
    expect(crumbs.find((c) => c.text === "Skills")?.href).toBe("/admin/lists")
    // Every crumb before the leaf is a link.
    for (const c of crumbs.slice(0, -1)) expect(c.href, c.text).not.toBeNull()
  })

  it("Bulk upload opened from a list reads Dashboard > Skills > Skill lists > Bulk upload", () => {
    const crumbs = crumbsOn("bulk", "from=lists&to=list-clinical&list=list-clinical")
    expect(crumbs.map((c) => c.text).filter((t) => t !== "Design lab" && t !== "Admin")).toEqual(["Dashboard", "Skills", "Skill lists", "Bulk upload"])
    expect(crumbs.find((c) => c.text === "Skills")?.href).toBe("/admin/lists")
  })

  it("Evaluation settings opened from step 3 of a list leads back to that list's step 3, by name", () => {
    const state = labState(createSeed())
    const list = programLists(state)[0]!
    const crumbs = crumbsOn("settings", `from=setup&list=${list.id}`)
    const back = crumbs.find((c) => c.text === list.name)
    expect(back?.href).toContain(`list=${list.id}`)
    expect(back?.href).toContain("setup=configure")
  })
})

describe("2. Links out of step 3 carry the way back", () => {
  it("fromSetup adds from=setup and the list; the return target reopens step 3 of that list", () => {
    expect(fromSetup("/admin/library?skill=sk-1", "list-a")).toBe("/admin/library?skill=sk-1&from=setup&list=list-a")
    expect(returnTarget("setup", "list-a")?.href).toMatch(/list=list-a&setup=configure$/)
  })
})

describe("3. Esc on step 4 steps back to step 3", () => {
  const state = labState(createSeed())
  const lists = seedLists(state)
  const model: ListsModel = { state, lists, groups: studentGroups(state), setLists: () => {}, addGroup: () => {}, renameGroup: () => {}, removeGroup: () => {}, applyNow: () => {} }
  const list = lists.find((l) => l.skillIds.length > 0)!

  it("after Next from step 3, the level's Back is step 4's own, and it returns to step 3 (StrictMode, as in dev)", async () => {
    const user = userEvent.setup()
    const leaveRef: React.MutableRefObject<(() => void) | null> = { current: null }
    const dirtyRef = { current: false }
    function Steps() {
      const [step, setStep] = React.useState<3 | 4>(3)
      return (
        <FloatingSheetPanel open>
          <FloatingSheetPanelContent side="right" size="lg">
            {step === 3
              ? <ListSetupLevel model={model} list={list} leaveRef={leaveRef} onBack={() => {}} onNext={() => setStep(4)} />
              : <AssignWizard model={model} list={list} initialQuery="" stepLabel="Step 4 of 4" leaveRef={leaveRef} dirtyRef={dirtyRef} onClose={() => setStep(3)} onAdd={() => {}} />}
          </FloatingSheetPanelContent>
        </FloatingSheetPanel>
      )
    }
    render(<React.StrictMode><V2StoreProvider><Steps /></V2StoreProvider></React.StrictMode>)
    expect(leaveRef.current).not.toBeNull()
    await user.click(screen.getByRole("button", { name: /^Next/ }))
    expect(await screen.findByText(/Step 4 of 4/)).toBeInTheDocument()
    // Before the fix step 3's cleanup (and the dev double effect) cleared this, so the panel's Esc closed the whole wizard.
    expect(leaveRef.current).not.toBeNull()
    act(() => leaveRef.current!())
    expect(await screen.findByText(/Step 3 of 4/)).toBeInTheDocument()
    expect(leaveRef.current).not.toBeNull()
  })
})
