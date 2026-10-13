// IM-02, IM-04, IM-05, IM-07, IM-08, IM-13: the optional AI reading in the import dialog. The network is a SYNTHETIC stub of the three
// import routes; nothing here says anything about the model's accuracy.
import * as React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/library",
  useSearchParams: () => new URLSearchParams(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { ImportDialog } from "@/components/import"
import { importAiCopy, surface } from "@/lib/copy"
import { getRuntime } from "@/lib/store/react"
import type { InterpretationResult } from "@/lib/import-ai/types"

if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as Record<string, unknown>
  proto.hasPointerCapture ??= () => false
  proto.setPointerCapture ??= () => undefined
  proto.releasePointerCapture ??= () => undefined
  proto.scrollIntoView ??= () => undefined
}

const db = () => getRuntime().getDb()
const noContrast = { rules: { "color-contrast": { enabled: false } } }

const RESULT: InterpretationResult = {
  rows: [
    { name: "Suction", description: "Clear the airway", categoryName: "Respiratory", sourceRef: "Suction - Clear the airway", line: 1, origin: "model" },
    { name: "Oxygen therapy", description: "", categoryName: "Respiratory", sourceRef: "Oxygen therapy", line: 2, origin: "model", cue: { reasons: ["lowSkillConfidence", "categoryUncertain"] } },
  ],
  unread: [{ text: "Page 3 of 12", reason: "uncertain", location: "Line 3" }],
  meta: { mode: "ai", model: "jev-1.13.0", candidatesAsked: 2, requests: 1, inputTokens: 600 },
}

interface Net {
  status?: { ai: boolean } | "fail"
  interpret?: unknown | "hang"
  extract?: { status: number; body: unknown }
}
const calls: Array<{ url: string; body?: unknown }> = []
function stubNet(net: Net) {
  calls.length = 0
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const entry: { url: string; body?: unknown } = { url: String(url) }
      if (typeof init?.body === "string") entry.body = JSON.parse(init.body)
      calls.push(entry)
      if (String(url).endsWith("/api/import/status")) {
        if (net.status === "fail") throw new TypeError("network")
        return new Response(JSON.stringify({ ai: net.status?.ai ?? false, extractors: { xlsx: true, docx: true, pdf: true }, maxUploadBytes: 4194304 }), { status: 200 })
      }
      if (String(url).endsWith("/api/import/interpret")) {
        if (net.interpret === "hang") {
          await new Promise<never>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))
        }
        return new Response(JSON.stringify(net.interpret), { status: 200 })
      }
      if (String(url).endsWith("/api/import/extract")) return new Response(JSON.stringify(net.extract?.body ?? {}), { status: net.extract?.status ?? 200 })
      throw new TypeError("unexpected url")
    }),
  )
}

function open() {
  const onOpenChange = vi.fn()
  render(
    <TooltipProvider>
      <ImportDialog open onOpenChange={onOpenChange} />
    </TooltipProvider>,
  )
  return { onOpenChange }
}
const paste = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.click(screen.getByRole("textbox", { name: /pasted skills list/i }))
  await user.paste(text)
}
const aiSwitch = () => screen.queryByRole("switch", { name: /Use AI to help read this list/ })

beforeEach(() => {
  window.localStorage.clear()
  getRuntime().reset()
})
afterEach(() => vi.unstubAllGlobals())

describe("IM-13: the AI switch is optional, off by default, and only offered when the server says it is available", () => {
  it("no key (status says ai:false): no switch is shown and nothing about AI appears", async () => {
    stubNet({ status: { ai: false } })
    open()
    await waitFor(() => expect(calls.some((c) => c.url.endsWith("/status"))).toBe(true))
    expect(aiSwitch()).toBeNull()
    expect(screen.queryByText(importAiCopy.switchHelp)).toBeNull()
  })

  it("the status call failing is treated as 'not available'", async () => {
    stubNet({ status: "fail" })
    open()
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(aiSwitch()).toBeNull()
  })

  it("available: the switch is present, OFF by default, with the disclosure that the list text is sent and nothing is added until you confirm", async () => {
    stubNet({ status: { ai: true } })
    open()
    const sw = await screen.findByRole("switch", { name: /Use AI to help read this list/ })
    expect(sw).toHaveAttribute("aria-checked", "false")
    expect(screen.getByText(importAiCopy.switchHelp)).toBeInTheDocument()
    expect(importAiCopy.switchHelp).toMatch(/sent to TypeSafe/)
    expect(importAiCopy.switchHelp).toMatch(/Nothing is added until you confirm/)
  })

  it("IM-13: with the switch off the standard reader runs and the interpret route is never called", async () => {
    stubNet({ status: { ai: true } })
    const user = userEvent.setup()
    open()
    await screen.findByRole("switch", { name: /Use AI/ })
    await paste(user, "Suction\nOxygen therapy")
    await user.click(screen.getByRole("button", { name: "Read the list" }))
    expect(await screen.findByText(/Review 2 skills found/)).toBeInTheDocument()
    expect(calls.some((c) => c.url.endsWith("/interpret"))).toBe(false)
    expect(db().importBatches.at(-1)?.interpretation).toBeUndefined()
    expect(screen.queryByText(importAiCopy.fallbackBanner)).toBeNull()
  })

  it("voice: 'AI' appears only to disclose; never smart, automatic, accuracy or powered-by wording", () => {
    for (const s of [importAiCopy.switchLabel, importAiCopy.switchHelp, importAiCopy.info, importAiCopy.infoNoCue, importAiCopy.fallbackBanner]) {
      expect(s.toLowerCase(), s).not.toMatch(/smart|automatic|accura|understood|powered by|confident|%/)
      expect(s, s).not.toMatch(/[—–!]/)
    }
  })
})

describe("IM-04, IM-05, IM-07, IM-08: the AI reading fills the same draft", () => {
  async function readWithAi(text = "Suction - Clear the airway\nOxygen therapy\nPage 3 of 12") {
    stubNet({ status: { ai: true }, interpret: { result: RESULT } })
    const user = userEvent.setup()
    const view = open()
    await user.click(await screen.findByRole("switch", { name: /Use AI/ }))
    await paste(user, text)
    await user.click(screen.getByRole("button", { name: "Read the list" }))
    await screen.findByText(/Review 2 skills found/)
    return { user, ...view }
  }

  it("IM-05: reading sends the list text once and opens a draft; NOTHING is created until Create", async () => {
    const before = db().skills.length
    await readWithAi()
    expect(calls.filter((c) => c.url.endsWith("/interpret"))).toHaveLength(1)
    expect(calls.find((c) => c.url.endsWith("/interpret"))?.body).toMatchObject({ text: expect.stringContaining("Suction"), sourceKind: "paste" })
    expect(db().skills).toHaveLength(before)
    expect(db().importBatches.at(-1)).toMatchObject({ status: "review", interpretation: { mode: "ai" } })
  })

  it("IM-13: the review says AI helped, names the cue, and makes no accuracy claim", async () => {
    await readWithAi()
    expect(screen.getByText(importAiCopy.info)).toBeInTheDocument()
    const cue = screen.getByTestId("row-cue")
    expect(within(cue).getByText(importAiCopy.cueLabel)).toBeInTheDocument()
    // status is text, never colour only: the reasons are visible text too
    expect(within(cue).getByText(/This line may not be a skill\. The category for this skill is less clear\./)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\d+%|accura|confidence/i)
  })

  it("IM-08: a line the model rejected is in Not read with its original text and the 'Not clearly a skill' reason", async () => {
    await readWithAi()
    const list = screen.getByRole("region", { name: /lines were not read/i })
    expect(within(list).getByText("Page 3 of 12")).toBeInTheDocument()
    expect(within(list).getByText(surface.s08.unreadReason.uncertain)).toBeInTheDocument()
  })

  it("counters are unchanged by a cue: Found counts the proposed rows (flagged included), Will be created counts the included ones", async () => {
    await readWithAi()
    expect(screen.getByTestId("stat-found")).toHaveTextContent("2")
    expect(screen.getByTestId("stat-will-be-created")).toHaveTextContent("2")
  })

  it("'Show only rows to check' appears only when a cue exists and filters the table to the cued row", async () => {
    const { user } = await readWithAi()
    const filter = screen.getByRole("checkbox", { name: importAiCopy.onlyCheck })
    expect(screen.getAllByTestId("row-cue")).toHaveLength(1)
    await user.click(filter)
    const rows = screen.getAllByRole("row").filter((r) => within(r).queryByLabelText(/^Include /))
    expect(rows).toHaveLength(1)
    expect(within(rows[0]).getByLabelText("Include Oxygen therapy")).toBeInTheDocument()
  })

  it("IM-05: a cue is advice only: the cued row is still included and the admin can create it or exclude it", async () => {
    const { user } = await readWithAi()
    const box = screen.getByLabelText("Include Oxygen therapy") as HTMLInputElement
    expect(box.getAttribute("aria-checked") ?? String(box.checked)).toMatch(/true/)
    await user.click(box)
    await waitFor(() => expect(db().importBatches.at(-1)?.rows.find((r) => r.name === "Oxygen therapy")?.include).toBe(false))
    expect(screen.getByTestId("stat-will-be-created")).toHaveTextContent("1")
  })

  it("IM-07: the model-proposed category is an opt-in checkbox as with the standard reader (categories are not created unless confirmed)", async () => {
    await readWithAi()
    expect(screen.getByRole("checkbox", { name: /Create 1 new category from the groupings in this list/ })).toBeInTheDocument()
  })

  it("axe: the review with cues has no violations (contrast checked in the real-browser pass)", async () => {
    await readWithAi()
    const r = await axe.run(screen.getByRole("dialog"), noContrast)
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})

describe("IM-13: any AI failure falls back to the standard reader and says so", () => {
  for (const fallback of ["unavailable", "timeout", "rate_limited", "error"] as const) {
    it(`${fallback}: the draft is the standard reader's, stamped ai-fallback, with the info banner`, async () => {
      stubNet({ status: { ai: true }, interpret: { result: null, fallback } })
      const user = userEvent.setup()
      open()
      await user.click(await screen.findByRole("switch", { name: /Use AI/ }))
      await paste(user, "Suction\nOxygen therapy")
      await user.click(screen.getByRole("button", { name: "Read the list" }))
      await screen.findByText(/Review 2 skills found/)
      expect(screen.getByText(importAiCopy.fallbackBanner)).toBeInTheDocument()
      expect(db().importBatches.at(-1)?.interpretation).toEqual({ mode: "ai-fallback", fallbackReason: fallback })
      expect(screen.queryByTestId("row-cue")).toBeNull()
    })
  }

  it("Cancel while the list is being read aborts the request and creates no draft", async () => {
    stubNet({ status: { ai: true }, interpret: "hang" })
    const user = userEvent.setup()
    const { onOpenChange } = open()
    await user.click(await screen.findByRole("switch", { name: /Use AI/ }))
    await paste(user, "Suction")
    await user.click(screen.getByRole("button", { name: "Read the list" }))
    const busy = await screen.findByRole("button", { name: importAiCopy.reading })
    expect(busy).toHaveAttribute("aria-busy", "true")
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(db().importBatches.filter((b) => b.status === "review")).toHaveLength(0)
  })
})

describe("IM-02: spreadsheets, documents and PDFs are read on the server by code", () => {
  const upload = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
    const input = document.querySelector("input[type=file]") as HTMLInputElement
    await user.upload(input, new File(["x"], name))
    await user.click(screen.getByRole("button", { name: "Read the list" }))
  }

  it("a .xlsx goes to /extract (no AI needed); its text and column flags become the draft", async () => {
    stubNet({ status: { ai: false }, extract: { status: 200, body: { text: "Skill,Description,Category\nSuction,Clear the airway,Respiratory", sourceName: "skills.xlsx", columns: true, skipHeader: true } } })
    const user = userEvent.setup()
    open()
    await upload(user, "skills.xlsx")
    expect(await screen.findByText(/Review 1 skill found in skills\.xlsx/)).toBeInTheDocument()
    expect(calls.some((c) => c.url.endsWith("/extract"))).toBe(true)
    expect(db().importBatches.at(-1)?.rows[0]).toMatchObject({ name: "Suction", description: "Clear the airway", categoryName: "Respiratory" })
  })

  const errors: Array<[string, number, string, string]> = [
    ["a scanned PDF has no text to read", 422, "unreadable", importAiCopy.fileNoText],
    ["a file that is too large", 413, "too_large", importAiCopy.fileTooLarge],
    ["an unsupported type", 415, "unsupported", importAiCopy.fileTypeUnsupported],
  ]
  for (const [name, status, error, message] of errors) {
    it(`${name}: shows the honest message and creates no draft`, async () => {
      stubNet({ status: { ai: false }, extract: { status, body: { error } } })
      const user = userEvent.setup()
      open()
      await upload(user, "scan.pdf")
      expect(await screen.findByText(message)).toBeInTheDocument()
      expect(db().importBatches.filter((b) => b.status === "review")).toHaveLength(0)
    })
  }

  it("legacy .xls and .doc are refused in the browser without a server call", async () => {
    stubNet({ status: { ai: false } })
    const user = userEvent.setup()
    open()
    await upload(user, "old.xls")
    expect(await screen.findByText(importAiCopy.fileTypeUnsupported)).toBeInTheDocument()
    expect(calls.some((c) => c.url.endsWith("/extract"))).toBe(false)
  })

  it("no server (a static host): the honest 'could not be read here' message, pasted text is kept", async () => {
    stubNet({ status: "fail" })
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network") }))
    const user = userEvent.setup()
    open()
    await paste(user, "Kept pasted line")
    await upload(user, "skills.xlsx")
    expect(await screen.findByText(importAiCopy.fileReaderUnavailable)).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: /pasted skills list/i })).toHaveValue("Kept pasted line")
  })
})
