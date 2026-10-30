import { describe, expect, it, vi } from "vitest"
import { screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as S from "@/lib/store"
import { SCENARIO } from "@/lib/seed"
import { r4, surface } from "@/lib/copy"
import type { Db } from "@/lib/domain/types"
import { db0, expectNoAxeViolations, hasHeader, renderOverview } from "./harness"

/** The student dialog (prototype P-02): a centered dialog named after the student. The evaluation dialog stacks above it. */
const studentDialog = () => screen.findByRole("dialog", { name: /^[^,]+$/ })
const evalDialog = () => screen.findByRole("dialog", { name: / — / })
const ledgerOf = (skillId: string) => screen.getByTestId(`ledger-${skillId}`)
const rowFor = (skillId: string) => document.querySelector<HTMLElement>(`[data-skill-row="${skillId}"]`)!
const noRecordEdit = (el: HTMLElement) => expect(within(el).queryAllByRole("button", { name: /\b(edit|resend|delete|save|approve|return for correction|revise)\b/i })).toEqual([])
/** The footer Close is the only filled primary; the DS also adds an X with the same name. */
const footerClose = (dlg: HTMLElement) => dlg.querySelector<HTMLElement>("[data-slot='dialog-footer'] button") ?? within(dlg).getAllByRole("button", { name: "Close" })[0]
const ledgerRows = (id: string) => within(ledgerOf(id)).getAllByRole("row").slice(1)

describe("S-02 student drill-down dialog (RP-05, AE-03, AE-04, SC-10..12, SH-05, DEFECT-07)", () => {
  it("opens as a centered 1024px dialog with the prototype's header: name, cohort · group · n of m skills achieved", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.olivia } })
    const d = await studentDialog()
    const o = S.studentOverview(db, SCENARIO.olivia)!
    expect(within(d).getByText("Olivia Martin")).toBeInTheDocument()
    expect(within(d).getByText(r4.studentDialog.subline(o.cohortName, o.groupName, o.counts.achieved, o.rows.length))).toBeInTheDocument()
    expect(d.className).toMatch(/max-w-5xl/) // 64rem = 1024px
    expect(d.getAttribute("data-dialog")).toBe("student")
  })

  it("AE-04 (flag four): the counters show the four states separately and add up to the skills in scope", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.olivia }, display: "four" })
    const r = await studentDialog()
    const o = S.studentOverview(db, SCENARIO.olivia)!
    const n = (k: string) => Number(within(r).getByTestId(`counter-${k}`).textContent)
    expect(n("achieved")).toBe(o.counts.achieved)
    expect(n("partial")).toBe(o.counts.partial)
    expect(n("evidenceDoesNotQualify")).toBe(o.counts.evidenceDoesNotQualify)
    expect(n("noEvidence")).toBe(o.counts.noEvidence)
    expect(n("achieved") + n("partial") + n("evidenceDoesNotQualify") + n("noEvidence")).toBe(o.rows.length)
  })

  it("AE-04 (flag merged, the default): three counters Achieved / In progress / Not met; states 1 and 2 count together", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.priya }, display: "merged" })
    const r = await studentDialog()
    const o = S.studentOverview(db, SCENARIO.priya)!
    expect(Number(within(r).getByTestId("counter-notMet").textContent)).toBe(o.counts.evidenceDoesNotQualify + o.counts.noEvidence)
    expect(within(r).queryByText("No evidence yet")).toBeNull()
    const counters = within(within(r).getByRole("region", { name: "Skill status counts" }))
    expect(counters.getByText("Achieved")).toBeInTheDocument()
    expect(counters.getByText("In progress")).toBeInTheDocument()
    expect(counters.getByText("Not met")).toBeInTheDocument()
  })

  it("Show these only filters in place and toggles back; a counter with nothing to show has no control (prototype: In progress 0)", async () => {
    const user = userEvent.setup()
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.olivia }, display: "four" })
    const r = await studentDialog()
    const o = S.studentOverview(db, SCENARIO.olivia)!
    expect(o.counts.evidenceDoesNotQualify).toBe(0)
    expect(within(r).queryByRole("button", { name: /Evidence does not qualify: show these only/i })).toBeNull()
    const none = within(r).getByRole("button", { name: /No evidence yet: show these only/i })
    await user.click(none)
    expect(none).toHaveAttribute("aria-pressed", "true")
    expect(r.querySelectorAll("[data-skill-row]")).toHaveLength(o.counts.noEvidence)
    await user.click(none)
    expect(r.querySelectorAll("[data-skill-row]")).toHaveLength(o.rows.length)
  })

  it("each skill row reads model · needs criteria, a progress bar, 'n / m demonstrations' and a status badge", async () => {
    renderOverview({ initial: { student: SCENARIO.olivia } })
    const row = within(rowFor("sk-iv"))
    expect(row.getByText(/Demonstration-level outcome · needs 5 demonstrations, 1 at observed, 1 at with assistance, 3 at independent/)).toBeInTheDocument()
    expect(row.getByText("4 / 5 demonstrations")).toBeInTheDocument()
    expect(within(rowFor("sk-iv")).getAllByRole("progressbar", { hidden: true }).length).toBeGreaterThan(0)
  })

  it("DEFECT-07 / AE-03b / SH-05: Wound Care at 4 of 4 demonstrations is In progress and names exactly what is still needed, per setting", async () => {
    renderOverview({ initial: { student: SCENARIO.olivia } })
    await studentDialog()
    const row = within(rowFor("sk-wound"))
    expect(row.getByText("In progress")).toBeInTheDocument()
    expect(row.getByText("4 / 4 demonstrations")).toBeInTheDocument()
    expect(row.getByTestId("still-needed")).toHaveTextContent(/Still needed:.*1 in inpatient.*1 in emergency|Still needed:.*1 in emergency.*1 in inpatient/)
    const lines = row.getByTestId("setting-progress")
    expect(lines).toHaveTextContent("Inpatient: 0 of 1")
    expect(lines).toHaveTextContent("Emergency: 0 of 1")
  })

  it("SC-10 / AE-03: expanding a demonstration skill shows 'Demonstration levels:' with each level as have / minimum, and the unmet level is named", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv" } })
    await studentDialog()
    const p = S.skillProgress(db, SCENARIO.olivia, "sk-iv")!
    const ledger = within(ledgerOf("sk-iv"))
    expect(ledger.getByText("Demonstration levels:")).toBeInTheDocument()
    for (const l of p.levels) expect(ledger.getByText(`${l.label}: ${l.have} / ${l.min}`)).toBeInTheDocument()
    expect(within(rowFor("sk-iv")).getByTestId("still-needed")).toHaveTextContent("1 at independent")
  })

  it("SC-10: a student whose total is met but whose with-assistance minimum is not is In progress, not Achieved", async () => {
    const db = db0()
    let found: { student: string; skill: string } | null = null
    for (const st of db.students) {
      const p = S.skillProgress(db, st.id, "sk-iv")
      if (p && p.levels.some((l) => l.have < l.min) && p.evaluation.state !== "achieved" && p.total.have >= (p.total.needed ?? 0)) found = { student: st.id, skill: "sk-iv" }
    }
    expect(found).not.toBeNull()
    renderOverview({ db, initial: { student: found!.student } })
    await studentDialog()
    const row = within(rowFor("sk-iv"))
    expect(row.getByText("In progress")).toBeInTheDocument()
    expect(row.getByTestId("still-needed")).toHaveTextContent(/at (observed|with assistance|independent)/)
  })

  it("SC-12: lab or simulation evidence is reported separately and never counted toward a clinical setting", async () => {
    renderOverview({ initial: { student: "stu-13" } })
    await studentDialog()
    const lines = within(rowFor("sk-wound")).getByTestId("setting-progress")
    expect(lines).toHaveTextContent(/lab or simulation records? (is|are) not counted toward a clinical setting/)
  })

  it("AE-05: one record per skill even when evidence comes from several courses", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.olivia } })
    await studentDialog()
    expect(document.querySelectorAll('[data-skill-row="sk-iv"]')).toHaveLength(1)
    const courses = new Set(db.submissions.filter((s) => s.studentId === SCENARIO.olivia && s.skillId === "sk-iv").map((s) => s.offeringId))
    expect(courses.size).toBeGreaterThan(1)
  })

  it("AE-01: evidence waiting for approval is listed as waiting and is not in the achieved count", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.jonah } })
    await studentDialog()
    expect(within(rowFor("sk-iv")).getByText("1 waiting, not counted yet")).toBeInTheDocument()
    const p = S.skillProgress(db, SCENARIO.jonah, "sk-iv")!
    expect(within(rowFor("sk-iv")).getByText(`${p.total.have} / ${p.total.needed} demonstrations`)).toBeInTheDocument()
  })

  it("SL-11 and IM-09: a deactivated skill and an unconfigured skill are not listed as in scope", async () => {
    const db = db0()
    const off = S.setSkillActive(db, "sk-recon", false)
    if (!off.ok) throw new Error("failed")
    renderOverview({ db: off.db, initial: { student: SCENARIO.olivia } })
    await studentDialog()
    expect(document.querySelector('[data-skill-row="sk-recon"]')).toBeNull()
    expect(document.querySelector('[data-skill-row="sk-ng"]')).toBeNull()
    expect(document.querySelectorAll("[data-skill-row]")).toHaveLength(9)
  })

  it("RP-08: with a setting filter the dialog says it counts only that evidence and Show all evidence restores the full figures", async () => {
    const user = userEvent.setup()
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.olivia, filters: { settingId: "set-emergency" } } })
    const r = await studentDialog()
    const filtered = S.studentOverview(db, SCENARIO.olivia, { settingId: "set-emergency" })!
    const all = S.studentOverview(db, SCENARIO.olivia)!
    expect(within(r).getByText("Counting evidence recorded in Emergency only")).toBeInTheDocument()
    expect(Number(within(r).getByTestId("counter-achieved").textContent)).toBe(filtered.counts.achieved)
    await user.click(within(r).getByRole("button", { name: "Show all evidence" }))
    expect(within(r).getByText("Counting all evidence recorded.")).toBeInTheDocument()
    expect(Number(within(r).getByTestId("counter-partial").textContent)).toBe(all.counts.partial)
    expect(within(r).queryByRole("button", { name: "Show all evidence" })).toBeNull()
  })

  it("Esc closes the dialog (Radix) and the table behind is never lost (P-07)", async () => {
    const user = userEvent.setup()
    const seen: Array<[string | null, string | null]> = []
    renderOverview({ initial: { student: SCENARIO.olivia, skill: "sk-iv" }, onChange: (p) => seen.push([p.student, p.skill]) })
    await studentDialog()
    await user.keyboard("{Escape}")
    expect(seen.at(-1)).toEqual([null, null])
    expect(hasHeader("Student")).toBe(true)
  })

  it("Er and no-access: an unknown record says so without leaking a name; an error offers Try again", async () => {
    const onRetry = vi.fn()
    const a = renderOverview({ initial: { student: "stu-999" } })
    expect(await screen.findByText("You do not have access to this record.")).toBeInTheDocument()
    a.unmount()
    renderOverview({ status: "error", onRetry, initial: { student: SCENARIO.olivia } })
    expect(await screen.findByText("This student's record could not be loaded. Try again.")).toBeInTheDocument()
  })

  it("L: the dialog opens with a skeleton, not a blank panel", async () => {
    renderOverview({ status: "loading", initial: { student: SCENARIO.olivia } })
    const r = await studentDialog()
    expect(r.querySelector("[aria-busy='true']")).not.toBeNull()
  })

  it("is read-only: no control to edit, resend, delete or approve anywhere in the record (RV-03)", async () => {
    renderOverview({ initial: { student: SCENARIO.olivia } })
    noRecordEdit(await studentDialog())
  })
})

describe("S-03 evidence ledger (RP-06, RP-07, RP-08, AR-04, AR-06, SC-12, SH-03, AE-02, AE-06, RV-03)", () => {
  it("RP-06: clicking a skill row expands its ledger inside the dialog with the prototype's columns, and the table behind is untouched", async () => {
    const user = userEvent.setup()
    const seen: Array<string | null> = []
    renderOverview({ initial: { student: SCENARIO.olivia }, onChange: (p) => seen.push(p.skill) })
    const r = await studentDialog()
    await user.click(within(r).getByRole("button", { name: /^Show evidence for IV Insertion/ }))
    expect(seen.at(-1)).toBe("sk-iv")
    const heads = within(await screen.findByTestId("ledger-sk-iv")).getAllByRole("columnheader").map((h) => h.textContent)
    expect(heads).toEqual(r4.studentDialog.ledgerHeaders)
    const first = within(ledgerOf("sk-iv")).getByRole("button", { name: /^View form, 2026-04-07/ })
    expect(first).toHaveTextContent("View form")
    expect(hasHeader("Student", { hidden: true })).toBe(true)
  })

  it("the ledger's Result column uses the prototype wording: Counts as evidence, Returned, Waiting for approval", async () => {
    const a = renderOverview({ initial: { student: SCENARIO.olivia, skill: "sk-iv" } })
    await studentDialog()
    expect(within(ledgerOf("sk-iv")).getAllByText("Counts as evidence").length).toBe(4)
    expect(within(ledgerOf("sk-iv")).getByText("Returned")).toBeInTheDocument()
    a.unmount()
    renderOverview({ initial: { student: SCENARIO.jonah, skill: "sk-iv" } })
    await studentDialog()
    expect(within(ledgerOf("sk-iv")).getByText("Waiting for approval")).toBeInTheDocument()
  })

  it("AR-06: evidence waiting for approval is listed but the header counts only what counted", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.jonah, skill: "sk-iv" } })
    await studentDialog()
    const rows = S.evidenceLedger(db, SCENARIO.jonah, "sk-iv")
    const counted = rows.filter((x) => x.state === "counted").length
    expect(within(ledgerOf("sk-iv")).getByText(`${counted} counted of ${rows.length} records`)).toBeInTheDocument()
  })

  it("names the evaluator and role but never shows an email address", async () => {
    renderOverview({ initial: { student: SCENARIO.olivia, skill: "sk-iv" } })
    const r = await studentDialog()
    expect(r.textContent).toMatch(/Delgado/)
    expect(r.textContent).not.toMatch(/@/)
  })

  it("SC-12: lab evidence reads Lab / Simulation and has no location or clinical setting", async () => {
    renderOverview({ initial: { student: SCENARIO.elena, skill: "sk-iv" } })
    await studentDialog()
    const row = ledgerRows("sk-iv")[0]
    expect(row).toHaveTextContent("Lab / Simulation")
    expect(row).not.toHaveTextContent("Clinical")
  })

  it("RP-08: a setting filter lists only that evidence and Show all evidence lists everything; the two empty states are different messages", async () => {
    const user = userEvent.setup()
    const db = db0()
    const a = renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv", filters: { settingId: "set-emergency" } } })
    const r = await studentDialog()
    expect(ledgerRows("sk-iv")).toHaveLength(1)
    expect(within(r).getByText("Counts reflect the location or setting filter applied on the overview.")).toBeInTheDocument()
    await user.click(within(r).getAllByRole("button", { name: "Show all evidence" })[0])
    expect(ledgerRows("sk-iv")).toHaveLength(5)
    a.unmount()
    const b = renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv", filters: { settingId: "set-periop" } } })
    expect(await screen.findByText("No evidence matches the location or setting filter.")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Show all evidence" }).length).toBeGreaterThan(0)
    b.unmount()
    renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-dressing" } })
    expect(await screen.findByText("No evidence has been recorded for this skill yet.")).toBeInTheDocument()
  })

  it("a comment shows under the row's Recorded cell as '<Role> comment: ...' (prototype 08)", async () => {
    const db = db0()
    renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv" } })
    await studentDialog()
    const withComment = S.evidenceLedger(db, SCENARIO.olivia, "sk-iv").find((x) => x.comment)!
    expect(within(ledgerOf("sk-iv")).getAllByText(r4.studentDialog.commentLine(withComment.evaluatorRole, withComment.comment)).length).toBeGreaterThan(0)
  })

  describe("evaluation dialog stacked on the student dialog (RP-07, prototype 09)", () => {
    const open = (db: Db, student: string, skill: string, pick: (rows: S.LedgerRow[]) => S.LedgerRow) => {
      const row = pick(S.evidenceLedger(db, student, skill))
      renderOverview({ db, initial: { student, skill, evaluation: row.submissionId } })
      return row
    }

    it("opens as a second 1024px dialog with the prototype's header, badges and sections", async () => {
      const db = db0()
      const row = open(db, SCENARIO.olivia, "sk-iv", (rows) => rows[0])
      const r = await evalDialog()
      expect(within(r).getByText("IV Insertion — Olivia Martin")).toBeInTheDocument()
      expect(within(r).getByText("Completed")).toBeInTheDocument()
      expect(within(r).getByText("Counts as evidence")).toBeInTheDocument()
      expect(within(r).getByText(`${row.evaluatorName} (${row.evaluatorRole})`)).toBeInTheDocument()
      expect(within(r).getByText("Supplied by the student")).toBeInTheDocument()
      expect(within(r).getByRole("heading", { name: `${row.evaluatorRole} responses` })).toBeInTheDocument()
      expect(footerClose(r)).toBeInTheDocument()
      expect(r.className).toMatch(/max-w-5xl/)
    })

    it("closing the second dialog returns to the first (stacked, not replaced)", async () => {
      const user = userEvent.setup()
      const seen: Array<[string | null, string | null, string | null]> = []
      const db = db0()
      const row = S.evidenceLedger(db, SCENARIO.olivia, "sk-iv")[0]
      renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv", evaluation: row.submissionId }, onChange: (p) => seen.push([p.student, p.skill, p.evaluation]) })
      const r = await evalDialog()
      await user.click(footerClose(r))
      expect(seen.at(-1)).toEqual([SCENARIO.olivia, "sk-iv", null])
      await waitFor(() => expect(screen.getByTestId("ledger-sk-iv")).toBeInTheDocument())
    })

    it("a question-level evaluation shows EVERY question with its Yes or No, the comment and what the student supplied, not only a summary", async () => {
      const db = db0()
      const row = open(db, SCENARIO.olivia, "sk-foley", (rows) => rows[0])
      const r = await evalDialog()
      const d = row.recorded as Extract<S.RecordedDetail, { kind: "question" }>
      for (const q of d.items) expect(within(r).getByText(q.text)).toBeInTheDocument()
      expect(within(r).getAllByText(/^(Yes|No)$/)).toHaveLength(d.items.length)
      expect(within(r).getByText(`${d.yes} of ${d.total} questions answered Yes`)).toBeInTheDocument()
      expect(within(r).getByText("Supplied by the student")).toBeInTheDocument()
      for (const v of row.values) expect(within(r).getByText(`${v.label}:`)).toBeInTheDocument()
      expect(within(r).getByText(row.comment || r4.evaluation.none)).toBeInTheDocument()
    })

    it("a scored evaluation shows a score on every question with the average and the total", async () => {
      const db = db0()
      const stu = db.submissions.find((s) => s.skillId === "sk-h2t" && db.evaluations.some((e) => e.submissionId === s.id))!.studentId
      const row = open(db, stu, "sk-h2t", (rows) => rows.find((x) => x.recorded)!)
      const r = await evalDialog()
      const d = row.recorded as Extract<S.RecordedDetail, { kind: "scored" }>
      for (const q of d.items) expect(within(r).getByText(q.text)).toBeInTheDocument()
      expect(within(r).getAllByText(/^Score \d+$/)).toHaveLength(d.items.length)
      expect(r.textContent).toMatch(/Average score/)
      expect(r.textContent).toMatch(/Total score/)
    })

    it("a demonstration evaluation renders the answered control read-only, like the prototype: every level shown, the recorded one marked", async () => {
      const db = db0()
      const a = open(db, SCENARIO.olivia, "sk-iv", (rows) => rows[0])
      const r = await evalDialog()
      const level = (a.recorded as { level: string }).level
      const model = db.skills.find((s) => s.id === "sk-iv")!.model as { levels: Array<{ label: string }> }
      for (const l of model.levels) expect(within(r).getAllByText(l.label).length).toBeGreaterThan(0)
      const marked = r.querySelector('[aria-current="true"]')!
      expect(marked.textContent).toContain(level)
      expect(within(r).getAllByText("Demonstration outcome").length).toBeGreaterThan(0)
    })

    it("a binary evaluation shows both outcome labels with the recorded one marked", async () => {
      const db = db0()
      const stu = db.submissions.find((s) => s.skillId === "sk-recon" && db.evaluations.some((e) => e.submissionId === s.id))!.studentId
      const row = S.evidenceLedger(db, stu, "sk-recon").find((x) => x.recorded)!
      renderOverview({ db, initial: { student: stu, skill: "sk-recon", evaluation: row.submissionId } })
      const r = await evalDialog()
      expect(r.querySelector('[aria-current="true"]')!.textContent).toContain((row.recorded as { label: string }).label)
    })

    it("SH-03: an evaluation that did not meet the rule states the rule in plain words, never 'failed'", async () => {
      const db = db0()
      open(db, SCENARIO.priya, "sk-foley", (rows) => rows[0])
      const r = await evalDialog()
      expect(r.textContent).toMatch(/did not meet the criteria because/)
      expect(r.textContent).not.toMatch(/failed/i)
      expect(within(r).getAllByText("Did not meet criteria").length).toBeGreaterThan(0)
    })

    it("AR-04: the review note is kept with the evaluation, and a returned evaluation does not say who corrects it (OD-16)", async () => {
      const db = db0()
      open(db, SCENARIO.olivia, "sk-iv", (rows) => rows.find((x) => x.state === "returned")!)
      const r = await evalDialog()
      expect(within(r).getByText("Review note")).toBeInTheDocument()
      expect(within(r).getByText(/The unit is still missing/)).toBeInTheDocument()
      expect(within(r).getByText("Returned for correction")).toBeInTheDocument()
    })

    it("AR-03: an evaluation held for approval is shown in full with the student's self-evaluation and a plain note that it does not count yet", async () => {
      const db = db0()
      open(db, SCENARIO.jonah, "sk-iv", (rows) => rows.find((x) => x.state === "awaitingApproval")!)
      const r = await evalDialog()
      expect(within(r).getByText("Self-evaluation")).toBeInTheDocument()
      expect(within(r).getByText(/does not count yet/)).toBeInTheDocument()
      expect(within(r).getAllByText("Waiting for approval").length).toBeGreaterThan(0)
    })

    it("RV-03 and RV-05: a completed or counted evaluation has no edit, resend, delete or approve control", async () => {
      const db = db0()
      open(db, SCENARIO.olivia, "sk-iv", (rows) => rows.find((x) => x.state === "counted")!)
      noRecordEdit(await evalDialog())
    })

    it("AE-06: renaming a question shows the new text against the original answer and does not change the result", async () => {
      const db = db0()
      const before = S.evidenceLedger(db, SCENARIO.olivia, "sk-foley")[0]
      const clone = structuredClone(db)
      const foley = clone.skills.find((s) => s.id === "sk-foley")!
      ;(foley.model as { questions: Array<{ id: string; text: string }> }).questions[0].text = "Prepares the equipment (renamed)"
      renderOverview({ db: clone, initial: { student: SCENARIO.olivia, skill: "sk-foley", evaluation: before.submissionId } })
      const r = await evalDialog()
      expect(within(r).getByText("Prepares the equipment (renamed)")).toBeInTheDocument()
      expect(S.evidenceLedger(clone, SCENARIO.olivia, "sk-foley")[0].state).toBe(before.state)
    })

    it("AE-02: editing the qualification rule changes the result and gives a plain reason built from the CURRENT rule, with the stored answers untouched", async () => {
      const db = db0()
      const clone = structuredClone(db)
      const sub = S.evidenceLedger(clone, SCENARIO.olivia, "sk-foley")[0]
      const ev = clone.evaluations.find((e) => e.submissionId === sub.submissionId)!
      ;(ev.responses as { answers: Record<string, boolean> }).answers["foley-q1"] = false // setup: one No on a question the old rule ignores
      expect(S.evidenceLedger(clone, SCENARIO.olivia, "sk-foley")[0].state).toBe("counted")
      const answersBefore = JSON.stringify(ev.responses)
      const foley = clone.skills.find((s) => s.id === "sk-foley")!
      ;(foley.model as { rule: unknown }).rule = { kind: "all" }
      expect(S.evidenceLedger(clone, SCENARIO.olivia, "sk-foley")[0].state).toBe("didNotMeet")
      renderOverview({ db: clone, initial: { student: SCENARIO.olivia, skill: "sk-foley", evaluation: sub.submissionId } })
      const r = await evalDialog()
      expect(within(r).getAllByText("Did not meet criteria").length).toBeGreaterThan(0)
      expect(r.textContent).toMatch(/question was answered No/)
      expect(JSON.stringify(clone.evaluations.find((e) => e.id === ev.id)!.responses)).toBe(answersBefore)
    })

    it("opens directly from a deep link (student, skill, evaluation in the URL)", async () => {
      const db = db0()
      const row = S.evidenceLedger(db, SCENARIO.olivia, "sk-iv")[0]
      renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv", evaluation: row.submissionId } })
      const r = await evalDialog()
      expect(within(r).getByText(new RegExp(row.date.slice(0, 10)))).toBeInTheDocument()
    })
  })
})

describe("S-02 and S-03 accessibility (axe in jsdom; contrast and landmark duplication of the DS KPI strip are excluded)", () => {
  it("has no violations with the student dialog, the expanded ledger and the evaluation dialog open", async () => {
    const db = db0()
    const row = S.evidenceLedger(db, SCENARIO.olivia, "sk-iv")[0]
    const a = renderOverview({ db, initial: { student: SCENARIO.olivia } })
    await studentDialog()
    await expectNoAxeViolations()
    a.unmount()
    const b = renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv" } })
    await studentDialog()
    await expectNoAxeViolations()
    b.unmount()
    renderOverview({ db, initial: { student: SCENARIO.olivia, skill: "sk-iv", evaluation: row.submissionId } })
    await evalDialog()
    await expectNoAxeViolations()
  })

  it("the dialog is named after the record and has a Close control; focus lands on the dialog, not inside a table header", async () => {
    renderOverview({ initial: { student: SCENARIO.olivia } })
    const r = await studentDialog()
    expect(r).toHaveAccessibleName("Olivia Martin")
    expect(within(r).getByRole("button", { name: "Close" })).toBeInTheDocument()
  })
})

describe("RP-05 skill and tag dialogs (prototype P-01b)", () => {
  it("the skill dialog tabs follow the display flag (merged: Achieved / In progress / Not met) and filter the students listed", async () => {
    const user = userEvent.setup()
    renderOverview({ display: "merged", initial: { tab: "skill" } })
    await user.click(screen.getByRole("button", { name: "IV Insertion" }))
    const dlg = await screen.findByRole("dialog", { name: "IV Insertion" })
    const tabs = within(dlg).getAllByRole("tab").map((t) => t.textContent)
    expect(tabs).toEqual([expect.stringMatching(/^Achieved \(\d+\)$/), expect.stringMatching(/^In progress \(\d+\)$/), expect.stringMatching(/^Not met \(\d+\)$/)])
    expect(within(dlg).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Student", "Group", "Progress", "Evidence", "Status"])
    await user.click(within(dlg).getByRole("tab", { name: /^In progress/ }))
    for (const b of within(dlg).getAllByText("In Progress")) expect(b).toBeInTheDocument()
  })

  it("four-state flag: the skill dialog shows a separate No evidence tab", async () => {
    const user = userEvent.setup()
    renderOverview({ display: "four", initial: { tab: "skill" } })
    await user.click(screen.getByRole("button", { name: "IV Insertion" }))
    const dlg = await screen.findByRole("dialog", { name: "IV Insertion" })
    expect(within(dlg).getAllByRole("tab")).toHaveLength(4)
  })

  it("the tag dialog carries the prototype's KPIs and its skill table", async () => {
    const user = userEvent.setup()
    renderOverview({ initial: { tab: "tag" } })
    await user.click(screen.getAllByRole("button", { name: "Tag A" })[0])
    const dlg = await screen.findByRole("dialog", { name: "Tag A" })
    for (const k of r4.tagDialog.kpis) expect(within(dlg).getByText(k)).toBeInTheDocument()
    expect(within(dlg).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(r4.tagDialog.headers)
  })
})

describe("surface strings used by the dialogs stay in lib/copy", () => {
  it("evidence ledger heading comes from the surface copy", () => {
    expect(surface.s03.ledgerHeading("IV Insertion")).toBe("Evidence for IV Insertion")
  })
})
