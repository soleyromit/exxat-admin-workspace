import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/library",
  useSearchParams: () => new URLSearchParams(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { ImportDialog } from "@/components/import"
import { getRuntime } from "@/lib/store/react"

if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as Record<string, unknown>
  proto.hasPointerCapture ??= () => false
  proto.setPointerCapture ??= () => undefined
  proto.releasePointerCapture ??= () => undefined
  proto.scrollIntoView ??= () => undefined
}

const noContrast = { rules: { "color-contrast": { enabled: false } } }
const db = () => getRuntime().getDb()
const filledPrimaries = (el: HTMLElement) => Array.from(el.querySelectorAll('button[data-slot="button"][data-variant="default"]')).filter((b) => (b.textContent ?? "").trim() !== "")

function open() {
  const onOpenChange = vi.fn()
  const onImported = vi.fn()
  render(
    <TooltipProvider>
      <ImportDialog open onOpenChange={onOpenChange} onImported={onImported} />
    </TooltipProvider>,
  )
  return { onOpenChange, onImported }
}

async function pasteAndRead(user: ReturnType<typeof userEvent.setup>, text = "") {
  if (text) {
    const box = screen.getByRole("textbox", { name: /paste the list/i })
    await user.click(box)
    await user.paste(text)
  } else await user.click(screen.getByRole("button", { name: "Paste a sample list" }))
  await user.click(screen.getByRole("button", { name: "Read the list" }))
}

beforeEach(() => {
  window.localStorage.clear()
  getRuntime().reset()
})

describe("Import dialog step 1: input (IM-01, IM-02, IM-03, IM-12, IM-13)", () => {
  it("P-06: 1024px dialog with the prototype's title, subtitle, info banner and two cards; one filled primary", () => {
    open()
    const dlg = screen.getByRole("dialog", { name: "Import skills" })
    expect(dlg.className).toContain("sm:max-w-5xl")
    expect(screen.getByText("Bring in a list you already hold instead of entering skills one at a time.")).toBeInTheDocument()
    expect(screen.getByText(/Skills arrive unconfigured/)).toBeInTheDocument()
    expect(screen.getByText("Upload a file")).toBeInTheDocument()
    expect(screen.getByText("Or paste the list")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Read the list" })).toBeInTheDocument()
    expect(filledPrimaries(dlg)).toHaveLength(1)
  })

  it("IM-01, IM-03: reading creates nothing; the review opens", async () => {
    const user = userEvent.setup()
    const before = db().skills.length
    open()
    await pasteAndRead(user)
    expect(await screen.findByText("Review 8 skills found in pasted list")).toBeInTheDocument()
    expect(db().skills.length).toBe(before)
  })

  it("has no axe violations on step 1", async () => {
    open()
    expect((await axe.run(screen.getByRole("dialog"), noContrast)).violations).toEqual([])
  })
})

describe("Import dialog step 2: review (IM-04..IM-08, IM-13)", () => {
  it("IM-13, IM-08: counters, categories opt-in and the unread line with its original text", async () => {
    const user = userEvent.setup()
    open()
    await pasteAndRead(user)
    await screen.findByText("Review 8 skills found in pasted list")
    expect(screen.getByText("Nothing is added until you confirm. Edit, exclude or rename anything before creating.")).toBeInTheDocument()
    expect(screen.getByText("1 lines were not read as skills")).toBeInTheDocument()
    expect(screen.getByRole("dialog").textContent).toContain("Line 9: SECTION 2 — ADVANCED PROCEDURES")
    expect(screen.getByText(/Create 3 new categories/)).toBeInTheDocument()
  })

  it("IM-06: the 3 sample names that match the library default to Skip, so 5 are created; IM-09, T13: Create adds the skills unconfigured, creates no model, and fires onImported", async () => {
    const user = userEvent.setup()
    const { onImported, onOpenChange } = open()
    const before = db().skills.length
    await pasteAndRead(user)
    await screen.findByText("Review 8 skills found in pasted list")
    await user.click(screen.getByRole("button", { name: "Create 5 skills" }))
    expect(db().skills.length).toBe(before + 5)
    const added = db().skills.slice(before)
    expect(added.every((s) => !s.model)).toBe(true)
    expect(onImported).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("IM-05: Back with edits asks before discarding; with none it leaves without a prompt", async () => {
    const user = userEvent.setup()
    open()
    await pasteAndRead(user)
    await screen.findByText("Review 8 skills found in pasted list")
    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByRole("heading", { name: "Import skills" }).textContent ?? screen.getByText("Upload a file")).toBeTruthy()
    expect(screen.getByText("Upload a file")).toBeInTheDocument()
  })

  it("has no axe violations on the review", async () => {
    const user = userEvent.setup()
    open()
    await pasteAndRead(user)
    await screen.findByText("Review 8 skills found in pasted list")
    expect((await axe.run(screen.getByRole("dialog"), noContrast)).violations).toEqual([])
  })
})
