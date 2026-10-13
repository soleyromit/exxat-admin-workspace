import * as React from "react"
import { beforeEach, describe, expect, it } from "vitest"
import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

import { PreceptorView } from "@/components/preceptor/preceptor-view"
import { EvaluatorForm } from "@/components/evaluator/evaluator-form"
import { DEFAULT_PREFS } from "@/lib/store/runtime"
import { getRuntime } from "@/lib/store/react"
import { SK, addRequest, db, noContrast, resetStore } from "./helpers"

const E = "—"
const STU = "stu-07"
const stuName = () => db().students.find((x) => x.id === STU)!.name
/** The mailbox row of the request just added for STU (the seed has other open links with the same dates). */
const rowOfStu = () => screen.getAllByRole("listitem").find((li) => (li.textContent ?? "").includes(stuName()) && /Requested 2026-08-24/.test(li.textContent ?? ""))!

async function answerAll(user: ReturnType<typeof userEvent.setup>, root: HTMLElement) {
  for (const g of Array.from(root.querySelectorAll("fieldset"))) {
    await user.click(within(g as HTMLElement).getAllByRole("radio")[0])
  }
  for (const t of Array.from(root.querySelectorAll("textarea"))) await user.type(t as HTMLTextAreaElement, "Clear technique throughout.")
}

beforeEach(() => {
  resetStore()
})

describe("P-12 Preceptor Evaluation page: the mailbox (EV-01, EV-02)", () => {
  it("shows the prototype page title, subtitle and the 'Evaluations sent' card with its description", async () => {
    render(<PreceptorView />)
    expect(await screen.findByRole("heading", { level: 1, name: "Preceptor Evaluation" })).toBeInTheDocument()
    expect(screen.getByText(`The form an evaluator opens from their emailed link ${E} preceptors do not sign in to Prism`)).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Evaluations sent" })).toBeInTheDocument()
    expect(screen.getByText("Preceptors receive a delegator link by email. Faculty and lab instructors can open the same form in Prism. Open one to see what the evaluator sees.")).toBeInTheDocument()
  })

  it("lists each open request as: student, 'course · Requested date · evaluator (role)', skill pills and an Open link button", async () => {
    addRequest({ token: "tok-p12-a", skillIds: [SK.iv, SK.foley], studentId: "stu-04" })
    render(<PreceptorView />)
    const open = await screen.findAllByRole("button", { name: "Open link" })
    expect(open.length).toBeGreaterThan(0)
    const row = screen.getAllByRole("listitem").find((li) => /Requested 2026-08-24 · A\. Whitfield, RN \(Preceptor\)/.test(li.textContent ?? ""))!
    expect(row).toBeTruthy()
    expect(within(row).getByText(new RegExp(`NURS 350 ${E} Clinical Practicum \\u00b7 Requested 2026-08-24`))).toBeInTheDocument()
    expect(within(row).getByText("IV Insertion")).toBeInTheDocument()
    expect(within(row).getByText("Foley Catheter Insertion")).toBeInTheDocument()
    expect(within(row).getByRole("button", { name: "Open link" }).className).toContain("min-h-11")
  })

  it("EV-01: there is no sign-in, password or account anywhere on the page", async () => {
    const { container } = render(<PreceptorView />)
    await screen.findByRole("heading", { level: 1 })
    expect(container.querySelector('input[type="password"]')).toBeNull()
    expect(screen.queryByRole("link", { name: /sign in|log in|create an account/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /sign in|log in|create an account/i })).toBeNull()
  })

  it("a submitted request leaves the mailbox", async () => {
    const user = userEvent.setup()
    const token = addRequest({ studentId: STU, token: "tok-p12-b", skillIds: [SK.dressing] })
    const before = (await (async () => { render(<PreceptorView />); return screen.findAllByRole("button", { name: "Open link" }) })()).length
    const row = rowOfStu()
    await user.click(within(row).getByRole("button", { name: "Open link" }))
    await answerAll(user, screen.getByTestId("evaluator-form"))
    await user.click(screen.getByRole("button", { name: /^Submit evaluation$/ }))
    expect(await screen.findByTestId("confirmation")).toBeInTheDocument()
    expect(db().links.find((l) => l.token === token)?.submittedAt).toBeTruthy()
    await user.click(screen.getByRole("button", { name: "Back to sent links" }))
    expect((await screen.findAllByRole("button", { name: "Open link" })).length).toBe(before - 1)
  })
})

describe("P-12 Preceptor Evaluation page: the inline form (EV-03..EV-07, C-6)", () => {
  it("Open link opens the form IN the page: Back to sent links, 'Evaluate student skills', and the sub line with the evaluator and role", async () => {
    const user = userEvent.setup()
    addRequest({ studentId: STU, token: "tok-p12-c", skillIds: [SK.iv] })
    render(<PreceptorView />)
    await screen.findAllByRole("listitem")
    const row = rowOfStu()
    await user.click(within(row).getByRole("button", { name: "Open link" }))
    expect(await screen.findByRole("button", { name: "Back to sent links" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Evaluate student skills" })).toBeInTheDocument()
    expect(screen.getByText(`${stuName()} · NURS 350 ${E} Clinical Practicum · evaluated by A. Whitfield, RN (Preceptor)`)).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1) // the page's h1 only: the embedded form uses h2
    await user.click(screen.getByRole("button", { name: "Back to sent links" }))
    expect(await screen.findByRole("heading", { level: 2, name: "Evaluations sent" })).toBeInTheDocument()
  })

  it("C-6 [PROTO]: with the pref ON (the demo default) each skill shows 'Model · Achievement: criteria'", async () => {
    expect(DEFAULT_PREFS.evaluatorSeesProgress).toBe(true)
    const user = userEvent.setup()
    addRequest({ studentId: STU, token: "tok-p12-d", skillIds: [SK.iv] })
    render(<PreceptorView />)
    await screen.findAllByRole("listitem")
    const row = rowOfStu()
    await user.click(within(row).getByRole("button", { name: "Open link" }))
    expect(await screen.findByTestId("criteria-line")).toHaveTextContent(/^Demonstration-Level Outcome · Achievement: .*demonstrations/)
  })

  it("C-6: after submit the demo page shows the Skill / Recorded / Qualifies? / Progress / Status table", async () => {
    const user = userEvent.setup()
    addRequest({ studentId: STU, token: "tok-p12-e", skillIds: [SK.dressing] })
    render(<PreceptorView />)
    await screen.findAllByRole("listitem")
    const row = rowOfStu()
    await user.click(within(row).getByRole("button", { name: "Open link" }))
    await answerAll(user, await screen.findByTestId("evaluator-form"))
    await user.click(screen.getByRole("button", { name: /^Submit evaluation$/ }))
    const table = await screen.findByTestId("progress-table")
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Skill", "Recorded", "Qualifies?", "Progress", "Status"])
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(2) // one header row plus one row for the one skill sent
    expect(rows[1].textContent).toMatch(/dressing/i)
    expect(rows[1].textContent).toMatch(/Qualifies|Does not qualify/)
  })

  it("OD-17 seam: with the pref OFF the demo page shows neither the criteria line nor the progress table", async () => {
    const user = userEvent.setup()
    act(() => getRuntime().setPrefs({ evaluatorSeesProgress: false }))
    addRequest({ studentId: STU, token: "tok-p12-f", skillIds: [SK.dressing] })
    render(<PreceptorView />)
    await screen.findAllByRole("listitem")
    const row = rowOfStu()
    await user.click(within(row).getByRole("button", { name: "Open link" }))
    expect(screen.queryByTestId("criteria-line")).toBeNull()
    await answerAll(user, await screen.findByTestId("evaluator-form"))
    await user.click(screen.getByRole("button", { name: /^Submit evaluation$/ }))
    expect(await screen.findByTestId("confirmation")).toBeInTheDocument()
    expect(screen.queryByTestId("progress-table")).toBeNull()
  })
})

describe("the real shell-free link never reads the demo pref (EV-01, OD-17, DEFECT-05)", () => {
  it("/e/[token]: no criteria line and no progress table even when the pref is ON", async () => {
    const user = userEvent.setup()
    expect(getRuntime().getPrefs().evaluatorSeesProgress).toBe(true)
    const token = addRequest({ skillIds: [SK.dressing] })
    render(<EvaluatorForm token={token} storage={null} />)
    expect(await screen.findByRole("heading", { level: 1, name: "Evaluate Olivia Martin" })).toBeInTheDocument()
    expect(screen.queryByTestId("criteria-line")).toBeNull()
    await answerAll(user, screen.getByTestId("evaluator-form"))
    await user.click(screen.getByRole("button", { name: /^Submit evaluation$/ }))
    expect(await screen.findByTestId("confirmation")).toBeInTheDocument()
    expect(screen.queryByTestId("progress-table")).toBeNull()
    expect(document.body.textContent).not.toMatch(/Achievement:|Achieved|In progress|Not met/)
  })
})

describe("P-12 accessibility", () => {
  it("axe: the mailbox and the open form have no violations", async () => {
    const user = userEvent.setup()
    addRequest({ studentId: STU, token: "tok-p12-g", skillIds: [SK.iv] })
    const { container } = render(<PreceptorView />)
    await screen.findByRole("heading", { level: 1 })
    expect((await axe.run(container, noContrast)).violations).toEqual([])
    const row = rowOfStu()
    await user.click(within(row).getByRole("button", { name: "Open link" }))
    await screen.findByTestId("evaluator-form")
    expect((await axe.run(container, noContrast)).violations).toEqual([])
  })
})
