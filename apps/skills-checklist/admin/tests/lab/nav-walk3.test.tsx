/**
 * Walk 3 (Sankalp, 2026-11-15: "walk the flow forwards and backwards and see if the navigation flow is proper"; ledger D-L155):
 * D1  Bulk upload: with a file read, every way out (a link anywhere, browser Back) asks "Discard this import?", as Cancel does; nothing read, nothing asked.
 * D6  Confirm's Back returns to Fix when the file had lines to fix.
 * D7  Bulk upload opened plainly reads "Skills > Library > Bulk upload".
 * D11 Walkthrough sidebar rows that open nothing carry no badge and do not look live.
 * D12 Log a skill and the student Fix page ask on every way out, through the same guard.
 * D13 "Back to {list}" only with return context; Configure carries it onward; the student Fix crumb follows ?from=progress.
 */
import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const nav = vi.hoisted(() => ({ pathname: "/lab", search: "", push: vi.fn() }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LabFrame, LabProviders } from "@/components/lab/lab-frame"
import { resolveStep } from "@/lib/lab/flows"
import { carryReturn, inPageReturn, returnTarget } from "@/lib/lab/return-to"
import { crumbParentFor } from "@/lib/lab/personas"
import { useCancel } from "@/components/lab/import/import-parts"
import type { ImportSession } from "@/components/lab/import/use-import-session"
import { confirmBackStep } from "@/components/lab/screens/admin-import-a"
import { useLeaveGuard, DiscardChangesDialog } from "@/components/lab/shared/unsaved-guard"

afterEach(() => {
  cleanup()
  nav.push.mockClear()
  nav.search = ""
  window.sessionStorage.clear()
})

const WALK = "setup-walkthrough"

function frameOn(step: string, search = "") {
  // Bulk upload is no longer a walkthrough stop (D-ADD1117: the four add steps became one, "Add skills"): its crumbs are read on its own lab route.
  if (step === "bulk") {
    nav.pathname = "/lab/admin/import-ai-review"
    nav.search = search
    return render(
      <LabProviders><LabFrame persona="admin" navPersona="admin" page={{ screen: "admin/import-ai-review", variant: "A" }}><div>page</div></LabFrame></LabProviders>,
    )
  }
  const r = resolveStep(WALK, step, "1")!
  nav.pathname = `/lab/flow/${WALK}/${step}`
  nav.search = search
  return render(
    <LabProviders><LabFrame persona="admin" navPersona="admin" page={{ flow: WALK, step, screen: `${r.screen.persona}/${r.screen.slug}`, variant: r.variant.id }}><div>page</div></LabFrame></LabProviders>,
  )
}

function crumbsOn(step: string, search = ""): Array<{ text: string; href: string | null }> {
  const { container, unmount } = frameOn(step, search)
  const full = container.querySelector('nav[aria-label="Breadcrumb"] ol')!
  const out = Array.from(full.querySelectorAll("li")).filter((li) => !li.getAttribute("role")).map((li) => {
    const a = li.querySelector("a")
    return { text: (li.textContent ?? "").trim(), href: a ? a.getAttribute("href") : null }
  }).filter((c) => c.text && c.text !== "Design lab" && c.text !== "Admin" && !(step === "bulk" && c.text === "Administrator"))
  unmount()
  return out
}

describe("D7: Bulk upload's crumb names the page", () => {
  // The Library row is gone (Romit 2026-11-16): the skills page is one list's, under Skill lists.
  it("opened plainly: Dashboard > Skills > Skill lists > {list} > Bulk upload, the list a link to its skills", () => {
    const crumbs = crumbsOn("bulk")
    expect(crumbs.map((c) => c.text)).toEqual(["Dashboard", "Skills", "Skill lists", "Clinical skills checklist", "Bulk upload"])
    expect(crumbs.find((c) => c.text === "Clinical skills checklist")?.href).toMatch(/library\?(.*&)?list=list-clinical/)
    expect(crumbs.at(-1)?.href).toBeNull()
  })
  it("opened from the list's menu (?from=skills): the same words, not Skills twice", () => {
    expect(crumbsOn("bulk", "from=skills&list=list-clinical").map((c) => c.text)).toEqual(["Dashboard", "Skills", "Skill lists", "Clinical skills checklist", "Bulk upload"])
  })
  it("the list's skills page reads Skills > Skill lists > {list}", () => {
    expect(crumbsOn("library").map((c) => c.text)).toEqual(["Dashboard", "Skills", "Skill lists", "Clinical skills checklist"])
  })
})

describe("D11: inert walkthrough rows do not look live", () => {
  it("Approvals, Reports and Settings carry no badge, no pointer cursor and say why", () => {
    const { container, unmount } = frameOn("library")
    const inert = Array.from(container.querySelectorAll<HTMLElement>("[data-inert-row]"))
    expect(inert.length).toBeGreaterThanOrEqual(3)
    for (const row of inert) {
      expect(row.getAttribute("aria-disabled")).toBe("true")
      expect(row.hasAttribute("href")).toBe(false)
      expect(row.className).toContain("cursor-not-allowed")
      expect(row.className).not.toMatch(/(^|\s)cursor-pointer(\s|$)/)
    }
    const approvals = inert.find((r) => /Approvals/.test(r.textContent ?? ""))!
    expect(approvals.textContent?.replace("Approvals", "").trim()).toBe("")
    unmount()
  })
})

/** A stand-in import session: only what useCancel reads. */
const sessionIn = (phase: ImportSession["phase"]) => ({ phase, reset: vi.fn() }) as unknown as ImportSession

function ImportExit({ session, stepsInUrl = false }: { session: ImportSession; stepsInUrl?: boolean }) {
  const { onCancel, dialog } = useCancel(session, nav.push, { stepsInUrl })
  return (
    <>
      <a href="/admin/lists">Skill lists</a>
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
      {dialog}
    </>
  )
}

describe("D1: every way out of Bulk upload asks once a file is read", () => {
  it("a sidebar, crumb or panel link asks Discard this import?, and Discard goes there", async () => {
    const user = userEvent.setup()
    const session = sessionIn("review")
    render(<ImportExit session={session} />)
    await user.click(screen.getByRole("link", { name: "Skill lists" }))
    expect(await screen.findByRole("alertdialog", { name: "Discard this import?" })).toBeInTheDocument()
    expect(nav.push).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Discard" }))
    expect(session.reset).toHaveBeenCalled()
    expect(nav.push).toHaveBeenCalledWith("/admin/lists")
  })
  it("Keep working stays on the page", async () => {
    const user = userEvent.setup()
    render(<ImportExit session={sessionIn("review")} />)
    await user.click(screen.getByRole("link", { name: "Skill lists" }))
    await user.click(await screen.findByRole("button", { name: "Keep working" }))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(nav.push).not.toHaveBeenCalled()
  })
  it("browser Back past the first step asks (steps in the URL: the stop below the page)", async () => {
    render(<ImportExit session={sessionIn("review")} stepsInUrl />)
    act(() => { window.dispatchEvent(new PopStateEvent("popstate", { state: { labPageStart: true } })) })
    expect(await screen.findByRole("alertdialog", { name: "Discard this import?" })).toBeInTheDocument()
  })
  it("closing the tab gets the browser's prompt while a file is read", () => {
    render(<ImportExit session={sessionIn("reading")} />)
    const e = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })
  it("with nothing read, links just go and Cancel does not ask", async () => {
    const user = userEvent.setup()
    render(<ImportExit session={sessionIn("empty")} />)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(nav.push).toHaveBeenCalled()
  })
})

describe("D6: Confirm's Back returns to Fix when the file had lines to fix", () => {
  it("on the page: a file with lines to fix, opened on Confirm, goes Back to Fix the lines, and writes ?step=fix", async () => {
    const { createV2Store } = await import("@/lib/v2/store")
    const { V2StoreProvider } = await import("@/lib/v2/react")
    const { createSeed } = await import("@/lib/v2/seed")
    const { labState } = await import("@/lib/lab/reviewer")
    const { AdminImportA } = await import("@/components/lab/screens/admin-import-a")
    const state = labState(createSeed())
    nav.search = "state=clear"
    const user = userEvent.setup()
    render(<V2StoreProvider store={createV2Store({ storage: null, seed: () => state })}><AdminImportA /></V2StoreProvider>)
    expect(await screen.findByRole("heading", { name: /^Create \d+ skills|^Nothing new/ })).toBeInTheDocument()
    await user.click(screen.getAllByRole("button", { name: /^Back$/ }).at(-1)!)
    expect(await screen.findByRole("heading", { name: "Fix the lines" })).toBeInTheDocument()
    expect(window.location.search).toContain("step=fix")
  })
  it("lines to fix, open or decided: Fix (step 3); none: Review (step 2)", () => {
    expect(confirmBackStep(0, 2)).toBe(2)
    expect(confirmBackStep(3, 2)).toBe(2)
    expect(confirmBackStep(0, 0)).toBe(1)
  })
})

describe("D12: the student's work asks on every way out (same guard)", () => {
  function Draft({ dirty }: { dirty: boolean }) {
    const leave = useLeaveGuard(dirty, { backWithinPage: true })
    return (
      <>
        <a href="/student">My progress</a>
        <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(() => undefined)} />
      </>
    )
  }
  it("a crumb or sidebar link asks while a skill is ticked", async () => {
    const user = userEvent.setup()
    render(<Draft dirty />)
    await user.click(screen.getByRole("link", { name: "My progress" }))
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument()
  })
  it("browser Back asks while a skill is ticked", async () => {
    render(<Draft dirty />)
    act(() => { window.dispatchEvent(new PopStateEvent("popstate", { state: { labPageStart: true } })) })
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument()
  })
  it("the Log a skill and Fix pages use the guard", async () => {
    const fs = await import("node:fs")
    const request = fs.readFileSync("components/lab/screens/student-request-c.tsx", "utf8")
    expect(request).toMatch(/useLeaveGuard\(hasWork, \{ backWithinPage: true \}\)/)
    const fix = fs.readFileSync("components/lab/student/fix.tsx", "utf8")
    expect(fix).toMatch(/<UnsavedChangesGuard dirty=\{dirty\}/)
  })
})

describe("D13: Back to {list} only with return context, and carried onward", () => {
  it("only from=setup or from=lists with a list is return context", () => {
    expect(inPageReturn(new URLSearchParams("from=setup&list=l1"))).toEqual({ from: "setup", list: "l1" })
    expect(inPageReturn(new URLSearchParams("from=lists&list=l1"))).toEqual({ from: "lists", list: "l1" })
    expect(inPageReturn(new URLSearchParams("from=settings"))).toBeNull()
    expect(inPageReturn(new URLSearchParams(""))).toBeNull()
  })
  it("the Library panel's Configure keeps from=setup&list, so the configure page returns to step 3", () => {
    const href = carryReturn("/lab/admin/configure-skill?skill=sk-1", new URLSearchParams("skill=sk-1&from=setup&list=l1"))
    expect(href).toBe("/lab/admin/configure-skill?skill=sk-1&from=setup&list=l1")
    expect(returnTarget("setup", "l1")?.href).toMatch(/list=l1&setup=configure$/)
    expect(carryReturn("/lab/admin/configure-skill?skill=sk-1", new URLSearchParams("skill=sk-1"))).toBe("/lab/admin/configure-skill?skill=sk-1")
  })
  it("Evaluation settings keeps its plain way back to Skill lists (Sankalp point 7); every page's way back is one icon before the title (Romit 2026-11-16)", async () => {
    const fs = await import("node:fs")
    for (const f of ["components/lab/screens/admin-evaluation-settings-b.tsx", "components/lab/screens/admin-evaluation-settings-g.tsx"]) {
      expect(fs.readFileSync(f, "utf8"), f).toMatch(/<ReturnTitle plainToLists>/)
    }
    for (const f of ["components/lab/library/library-chrome.tsx", "components/lab/admin-b/settings-page.tsx", "components/lab/admin-a/mapping-frame.tsx"]) {
      expect(fs.readFileSync(f, "utf8"), f).toMatch(/<ReturnTitle>/)
    }
    const control = fs.readFileSync("components/lab/shared/return-link.tsx", "utf8")
    expect(control).toMatch(/size="icon"/)
    expect(control).toMatch(/fa-arrow-left/)
    expect(control).not.toMatch(/export function ReturnLink/)
  })
  it("a further attempt opened from My progress reads My progress in its crumb; else My requests", () => {
    expect(crumbParentFor("student/fix-returned", new URLSearchParams("skill=sk-1&from=progress"))?.label).toBe("My progress")
    expect(crumbParentFor("student/fix-returned", new URLSearchParams("skill=sk-1"))?.label).toBe("My requests")
  })
})
