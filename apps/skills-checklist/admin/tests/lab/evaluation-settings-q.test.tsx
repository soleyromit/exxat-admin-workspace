/**
 * Evaluation methods Q, "Side panel" (Proposed, D-EM1117-q; contract ADMIN-D3 "round 8").
 * New method opens the panel over the list (no gallery, Romit 2026-11-17); the type select starts empty [REQ SC-02] and Create without a type
 * errors on it; a chosen type fills its starting values; Create writes the method and the result is a banner (never a toast) with "Assign to
 * skills". Description is a textarea, Preview a tab beside Settings with the primary on both; the SC-09 question guards a type change.
 */
import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const nav = vi.hoisted(() => ({ pathname: "/lab/admin/evaluation-settings", search: "", push: vi.fn(), replace: vi.fn() }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { createV2Store } from "@/lib/v2/store"
import { V2StoreProvider } from "@/lib/v2/react"
import { createSeed } from "@/lib/v2/seed"
import { methodsOf } from "@/lib/lab/methods"
import { ResultBannerSlot } from "@/components/lab/shared/result-banner"
import { AdminEvaluationSettingsQ } from "@/components/lab/screens/admin-evaluation-settings-q"

afterEach(() => {
  cleanup()
  nav.push.mockClear()
  nav.replace.mockClear()
  nav.search = ""
  window.sessionStorage.clear()
})

function mount(search: string) {
  nav.search = search
  const store = createV2Store({ storage: null, seed: () => createSeed() })
  render(<V2StoreProvider store={store}><ResultBannerSlot /><AdminEvaluationSettingsQ /></V2StoreProvider>)
  return store
}

/** The panel, once its opening focus has landed on Name (a select opened before that would be closed by it). */
async function openPanel() {
  const panel = await screen.findByRole("dialog")
  await waitFor(() => expect(document.getElementById("method-name")).toHaveFocus())
  return panel
}

async function chooseType(user: ReturnType<typeof userEvent.setup>, panel: HTMLElement, name: RegExp) {
  // A press that lands while the panel's opening focus settles can close the list again: open it until the option shows.
  const trigger = within(panel).getByRole("combobox", { name: /Type/ })
  await waitFor(async () => {
    if (!screen.queryByRole("option", { name })) await user.click(trigger)
    expect(screen.getByRole("option", { name })).toBeInTheDocument()
  })
  await user.click(screen.getByRole("option", { name }))
}

describe("Evaluation methods Q", () => {
  it("renders the methods list", async () => {
    mount("variant=Q")
    expect(await screen.findByRole("tab", { name: /Methods/ })).toBeInTheDocument()
    expect(document.querySelector("[data-region=methods]")).not.toBeNull()
  })

  it("New method opens the panel directly: no gallery, no template caption, the type select empty", async () => {
    mount("variant=Q&method=new")
    const panel = await openPanel()
    expect(document.querySelector("[data-method-gallery]")).toBeNull()
    expect(screen.queryByRole("heading", { name: "Choose a starting point" })).toBeNull()
    expect(within(panel).queryByText(/^From /)).toBeNull()
    expect(within(panel).queryByRole("button", { name: "Change template" })).toBeNull()
    expect(within(panel).getByRole("combobox", { name: /Type/ })).toHaveTextContent("Choose a type")
    expect(panel.querySelector("[data-section=picks]")).toBeNull()
    // The other sections show from the start.
    expect(within(panel).getByLabelText("Preceptor")).toBeInTheDocument()
  })

  it("Create with no type: an error on Type, and Settings stays (or comes back)", async () => {
    mount("variant=Q&method=new")
    const user = userEvent.setup()
    const panel = await openPanel()
    await user.type(within(panel).getByLabelText("Name"), "No type yet")
    await user.click(within(panel).getByRole("tab", { name: "Preview" }))
    expect(within(panel).getByText("Choose a type to see the evaluator's form.")).toBeInTheDocument()
    await user.click(within(panel).getByRole("button", { name: "Create method" }))
    expect(within(panel).getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true")
    expect(within(panel).getByRole("combobox", { name: /Type/ })).toHaveAttribute("aria-invalid", "true")
  })

  it("a chosen type fills its starting values, and Create shows the banner with Assign to skills", async () => {
    const store = mount("variant=Q&method=new")
    const user = userEvent.setup()
    const panel = await openPanel()
    const name = within(panel).getByLabelText("Name") as HTMLInputElement
    await user.click(within(panel).getByLabelText("Preceptor"))
    await chooseType(user, panel, /Independence level/)
    expect(within(panel).getByDisplayValue("Works alone")).toBeInTheDocument()
    expect(within(panel).getByDisplayValue("Needs coaching")).toBeInTheDocument()
    // Who can evaluate is kept, never filled by the type [REQ SC-16].
    expect(within(panel).getByLabelText("Preceptor")).toBeChecked()
    // Empty name: refused, the error under the field.
    await user.click(within(panel).getByRole("button", { name: "Create method" }))
    expect(name).toHaveAttribute("aria-invalid", "true")
    await user.type(name, "Supervision for Q")
    await user.click(within(panel).getByRole("button", { name: "Create method" }))
    expect(await screen.findByText("Supervision for Q created.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Assign to skills" })).toBeInTheDocument()
    expect(methodsOf(store.getSnapshot()).some((m) => m.name === "Supervision for Q" && m.rule.model === "demonstration")).toBe(true)
  })

  it("the panel: description a textarea, Preview a tab, primary on both tabs", async () => {
    mount("variant=Q&method=new")
    const user = userEvent.setup()
    const panel = await openPanel()
    expect(within(panel).getByLabelText("Description").tagName).toBe("TEXTAREA")
    expect(within(panel).queryByRole("button", { name: "Preview" })).toBeNull()
    expect(within(panel).queryByRole("button", { name: "Add a description" })).toBeNull()
    await chooseType(user, panel, /Approved or not approved/)
    const previewTab = within(panel).getByRole("tab", { name: "Preview" })
    expect(within(panel).getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true")
    await user.click(previewTab)
    expect(previewTab).toHaveAttribute("aria-selected", "true")
    expect(panel.querySelector("[data-method-preview]")).not.toBeNull()
    // One person's screen at a time: Evaluator open first, Student one press away, each framed under who sees it.
    const whose = within(panel).getByRole("radiogroup", { name: "Whose screen" })
    expect(within(whose).getAllByRole("radio").map((r) => r.textContent)).toEqual(["Student", "Evaluator"])
    expect(panel.querySelector("[data-preview-frame=Evaluator]")).not.toBeNull()
    expect(panel.querySelector("[data-preview-frame=Student]")).toBeNull()
    await user.click(within(whose).getByRole("radio", { name: "Student" }))
    expect(panel.querySelector("[data-preview-frame=Student]")).not.toBeNull()
    expect(panel.querySelector("[data-preview-frame=Evaluator]")).toBeNull()
    expect(within(panel).getByRole("button", { name: "Create method" })).toBeInTheDocument()
  })

  it("edit: changing the type in the select asks first when questions would be removed [SC-09]", async () => {
    mount("variant=Q&method=m-own-sk-sterile-dressing")
    const user = userEvent.setup()
    const panel = await openPanel()
    expect(within(panel).getByRole("combobox", { name: /Type/ })).toHaveTextContent("Questions")
    await chooseType(user, panel, /Approved or not approved/)
    const ask = await screen.findByRole("alertdialog")
    expect(within(ask).getByText(/will be removed/)).toBeInTheDocument()
    await user.click(within(ask).getByRole("button", { name: /^Keep/ }))
    expect(within(panel).getByRole("combobox", { name: /Type/ })).toHaveTextContent("Questions")
  })

  it("group check-off: the level select is nested on one row, with no helper line under it", async () => {
    mount("variant=Q&method=new")
    const user = userEvent.setup()
    const panel = await openPanel()
    await chooseType(user, panel, /Independence level/)
    expect(panel.querySelector("[data-checkoff-grant]")).toBeNull()
    await user.click(within(panel).getByLabelText("Let faculty check off a group at once"))
    expect(within(panel).getByRole("combobox", { name: "A group check-off counts as" })).toBeInTheDocument()
    expect(panel.querySelector("[data-checkoff-help]")).toBeNull()
    expect(within(panel).queryByText(/Faculty do not evaluate each student/)).toBeNull()
  })
})
