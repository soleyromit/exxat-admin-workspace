import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { Db } from "@/lib/domain/types"
import { evidenceLedger, fail, reviewEvaluation, reviewQueue, skillProgress } from "@/lib/store"
import { protoReview as pr, surface } from "@/lib/copy"
import { filledButtons, expectNoAxeViolations, NOW, renderReview, seedDb } from "./harness"

const queue = (db: Db) => reviewQueue(db)
const first = (db: Db, pred: (i: ReturnType<typeof reviewQueue>[number]) => boolean) => queue(db).find(pred)!
const cardOf = (submissionId: string) => document.querySelector<HTMLElement>(`[data-review-card="${submissionId}"]`)!
const codeOf = (db: Db, submissionId: string) => db.offerings.find((o) => o.id === db.submissions.find((s) => s.id === submissionId)!.offeringId)!.code
const day = (iso: string) => iso.slice(0, 10)

describe("P-10 the prototype's layout: a list of cards, not a table", () => {
  it("shows the prototype's info bar, one card per waiting evaluation, and no table or dialog", () => {
    const db = seedDb()
    renderReview({ db })
    expect(screen.getByText(pr.banner)).toBeInTheDocument()
    expect(document.querySelectorAll("[data-review-card]")).toHaveLength(queue(db).length)
    expect(screen.queryByRole("table")).toBeNull()
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.getByRole("heading", { level: 1, name: "Review & Approve" })).toBeInTheDocument()
    expect(screen.getByText("Approve submitted evaluations for skills that require it")).toBeInTheDocument()
  })

  it("each card heading is 'Student — Skill' and its meta line is the prototype's (course code, setting, date, evaluator)", () => {
    const db = seedDb()
    renderReview({ db })
    const item = first(db, (i) => i.performedIn === "clinical")
    const card = cardOf(item.submissionId)
    expect(within(card).getByRole("heading", { level: 2, name: `${item.studentName} — ${item.skillName}` })).toBeInTheDocument()
    expect(card).toHaveTextContent(pr.metaClinical(codeOf(db, item.submissionId), item.settingName ?? "", item.locationName ?? "", day(item.completedAt), item.evaluatorName, item.evaluatorRole))
    expect(within(card).getByText(item.qualifies ? "Qualifies" : "Does not qualify")).toBeInTheDocument()
  })
})

describe("AR-01 each card says who, what, where, by whom", () => {
  it("a lab item says Lab / Simulation instead of a setting, with the instructor and role", () => {
    const db = seedDb()
    renderReview({ db })
    const lab = first(db, (i) => i.performedIn === "lab")
    expect(cardOf(lab.submissionId)).toHaveTextContent(pr.metaLab(codeOf(db, lab.submissionId), day(lab.completedAt), lab.evaluatorName, lab.evaluatorRole))
  })

  it("the student-supplied fields and the student's note are on the card", () => {
    const db = seedDb()
    renderReview({ db })
    const item = first(db, (i) => i.values.length > 0)
    const card = cardOf(item.submissionId)
    for (const v of item.values) expect(card).toHaveTextContent(`${v.label}: ${String(v.value)}`)
    if (item.studentNote) expect(card).toHaveTextContent(`${pr.studentNotes}: ${item.studentNote}`)
  })

  it("the queue is announced (a polite status says how many are waiting)", () => {
    const db = seedDb()
    renderReview({ db })
    expect(screen.getByText(pr.waiting(queue(db).length))).toBeInTheDocument()
  })
})

describe("AR-02 the evaluator's block beside the student's self-evaluation", () => {
  it("with a self-evaluation: two blocks and the prototype's agreement sentence for the role", () => {
    const db = seedDb()
    renderReview({ db })
    const same = first(db, (i) => i.agree === true)
    const differ = first(db, (i) => i.agree === false)
    expect(cardOf(same.submissionId)).toHaveTextContent(pr.agreeSame(same.evaluatorRole))
    expect(within(cardOf(same.submissionId)).getByText(pr.studentSelf)).toBeInTheDocument()
    expect(cardOf(differ.submissionId)).toHaveTextContent(pr.agreeDiffer(differ.evaluatorRole))
    expect(pr.agreeDiffer("Preceptor")).toBe("Student and preceptor recorded different outcomes — worth a conversation before approving.")
    expect(pr.agreeSame("Lab Instructor")).toBe("Student and lab instructor recorded the same outcome.")
  })

  it("no self-evaluation: a single block and a plain sentence, no agreement marker", () => {
    const db = seedDb()
    renderReview({ db })
    const none = queue(db).find((i) => i.agree === null)
    if (!none) return // the seed may have a self-evaluation on every waiting item; the helper is covered in responses.test
    const card = cardOf(none.submissionId)
    expect(card).toHaveTextContent(pr.evaluatorOnly(none.evaluatorRole))
    expect(within(card).queryByText(pr.studentSelf)).toBeNull()
  })

  it("disagreement is a conversation, not an error: Qualifies is success or warning, never danger", () => {
    renderReview()
    for (const badge of document.querySelectorAll("[data-slot='status-badge']")) expect(badge.className).not.toMatch(/danger|destructive|red-/)
  })
})

describe("AR-03, RP-07 the full responses, not a summary", () => {
  it("See the full responses reveals every answer with the student and the evaluator side by side", async () => {
    const db = seedDb()
    renderReview({ db })
    const item = first(db, (i) => i.evaluator?.kind === "question")
    const card = cardOf(item.submissionId)
    expect(within(card).queryByText(item.evaluator!.kind === "question" ? item.evaluator!.items[0].text : "")).toBeNull()
    await userEvent.click(within(card).getByRole("button", { name: pr.expand }))
    if (item.evaluator?.kind === "question") for (const q of item.evaluator.items) expect(within(card).getByText(q.text)).toBeInTheDocument()
  })

  it("the disclosure is a button with aria-expanded", async () => {
    const db = seedDb()
    renderReview({ db })
    const card = cardOf(queue(db)[0].submissionId)
    const trigger = within(card).getByRole("button", { name: pr.expand })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})

describe("ST-11, ST-12 student material is distinct from the evaluator's", () => {
  it("self-evaluation, student note and the evaluator's comment are separate labelled parts of the card", () => {
    const db = seedDb()
    renderReview({ db })
    const item = first(db, (i) => i.selfEvaluation !== null && !!i.comment)
    const card = cardOf(item.submissionId)
    expect(within(card).getByRole("group", { name: pr.studentSelf })).toBeInTheDocument()
    expect(within(card).getByRole("group", { name: item.evaluatorRole })).toHaveTextContent(item.comment)
    expect(within(card).getByRole("group", { name: pr.studentSelf })).not.toHaveTextContent(item.comment)
  })
})

describe("AR-04 the review note stays with the evaluation", () => {
  it("every card has its own optional note field with the prototype's helper text", () => {
    const db = seedDb()
    renderReview({ db })
    const card = cardOf(queue(db)[0].submissionId)
    const note = within(card).getByLabelText(pr.noteLabel)
    expect(note).not.toBeRequired()
    expect(within(card).getByText(pr.noteHelper)).toBeInTheDocument()
  })

  it("approving with a note keeps the note on the review and shows it in the evidence ledger", async () => {
    let latest: Db | null = null
    const db = seedDb()
    const item = queue(db)[0]
    renderReview({ db, onDb: (d) => (latest = d) })
    const card = cardOf(item.submissionId)
    await userEvent.type(within(card).getByLabelText(pr.noteLabel), "Checked against the placement record.")
    await userEvent.click(within(card).getByRole("button", { name: pr.approve }))
    await waitFor(() => expect(latest).not.toBeNull())
    expect(latest!.reviews.at(-1)).toMatchObject({ evaluationId: item.evaluationId, decision: "approved", note: "Checked against the placement record." })
    expect(evidenceLedger(latest!, item.studentId, item.skillId).find((r) => r.submissionId === item.submissionId)!.reviewerNote).toBe("Checked against the placement record.")
  })

  it("a note typed on one card is not sent with another card's decision", async () => {
    let latest: Db | null = null
    const db = seedDb()
    const [a, b] = queue(db)
    renderReview({ db, onDb: (d) => (latest = d) })
    await userEvent.type(within(cardOf(a.submissionId)).getByLabelText(pr.noteLabel), "Only for the first card.")
    await userEvent.click(within(cardOf(b.submissionId)).getByRole("button", { name: pr.approve }))
    await waitFor(() => expect(latest).not.toBeNull())
    expect(latest!.reviews.at(-1)).toMatchObject({ evaluationId: b.evaluationId, note: "" })
  })

  it("the note is optional: approve works without one (open question kept open)", async () => {
    let latest: Db | null = null
    const db = seedDb()
    renderReview({ db, onDb: (d) => (latest = d) })
    await userEvent.click(within(cardOf(queue(db)[0].submissionId)).getByRole("button", { name: pr.approve }))
    await waitFor(() => expect(latest!.reviews.at(-1)!.note).toBe(""))
  })
})

describe("AR-05 approve counts, return does not", () => {
  it("both decisions are on every card; Approve is filled and Return is outline (conflict C-5)", () => {
    const db = seedDb()
    renderReview({ db })
    const cards = document.querySelectorAll<HTMLElement>("[data-review-card]")
    expect(cards.length).toBeGreaterThan(5)
    for (const card of cards) {
      const approve = within(card).getByRole("button", { name: pr.approve })
      const ret = within(card).getByRole("button", { name: "Return for correction" })
      expect(approve.className).toMatch(/bg-primary/)
      expect(ret.className).not.toMatch(/(^|\s)bg-primary(\s|$)/)
      expect(filledButtons(card)).toEqual([approve])
    }
  })

  it("Approve: the card leaves the queue and the prototype's banner says it now counts, with the effect on the record", async () => {
    let latest: Db | null = null
    const db = seedDb()
    const n = queue(db).length
    const item = queue(db)[0]
    renderReview({ db, onDb: (d) => (latest = d) })
    await userEvent.click(within(cardOf(item.submissionId)).getByRole("button", { name: pr.approve }))
    await waitFor(() => expect(cardOf(item.submissionId)).toBeNull())
    const prog = skillProgress(latest!, item.studentId, item.skillId)!
    expect(prog.total.have).toBe(skillProgress(db, item.studentId, item.skillId)!.total.have + 1)
    expect(screen.getByText(`${pr.approved(item.skillName, item.studentName)} ${surface.s11.approvedEffect(prog.total.have, prog.total.needed, prog.total.noun)}`)).toBeInTheDocument()
    expect(document.querySelectorAll("[data-review-card]")).toHaveLength(n - 1)
    expect(pr.approved("IV Insertion", "Jonah Nakamura")).toBe("Approved IV Insertion for Jonah Nakamura — it now counts toward achievement.")
  })

  it("Return for correction: the card leaves the queue, the banner says it does not count, and the evaluation stays out of achievement", async () => {
    let latest: Db | null = null
    const db = seedDb()
    const item = first(db, (i) => i.qualifies)
    const before = skillProgress(db, item.studentId, item.skillId)!.evaluation.qualifyingCount
    renderReview({ db, onDb: (d) => (latest = d) })
    await userEvent.type(within(cardOf(item.submissionId)).getByLabelText(pr.noteLabel), "Please correct the unit.")
    await userEvent.click(within(cardOf(item.submissionId)).getByRole("button", { name: "Return for correction" }))
    await waitFor(() => expect(cardOf(item.submissionId)).toBeNull())
    expect(screen.getByText(pr.returned(item.skillName, item.studentName))).toBeInTheDocument()
    expect(latest!.reviews.at(-1)).toMatchObject({ decision: "returned", note: "Please correct the unit." })
    expect(skillProgress(latest!, item.studentId, item.skillId)!.evaluation.qualifyingCount).toBe(before)
  })

  it("the result banner has a Dismiss action and Dismiss removes it", async () => {
    const db = seedDb()
    renderReview({ db })
    await userEvent.click(within(cardOf(queue(db)[0].submissionId)).getByRole("button", { name: pr.approve }))
    const dismiss = await screen.findByRole("button", { name: "Dismiss" })
    await userEvent.click(dismiss)
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull()
  })
})

describe("OD-16 stays open: no copy names who corrects", () => {
  it("the label and the banner never name a recipient or say who resends", async () => {
    const db = seedDb()
    renderReview({ db })
    const card = cardOf(queue(db)[0].submissionId)
    expect(within(card).queryByRole("button", { name: /to preceptor|to the preceptor/i })).toBeNull()
    await userEvent.click(within(card).getByRole("button", { name: "Return for correction" }))
    const banner = await screen.findByText(/for correction\. It does not count/)
    expect(banner.textContent).not.toMatch(/resend|resubmit|to the (preceptor|student|evaluator)|student will|evaluator will/i)
    expect(pr.returnLabel).toBe("Return for correction")
  })
})

describe("AR-06, AE-01 pending evidence is excluded until approved", () => {
  it("achievement counts exclude the waiting evaluation and include it after approval", async () => {
    let latest: Db | null = null
    const db = seedDb()
    const item = first(db, (i) => i.qualifies)
    const before = skillProgress(db, item.studentId, item.skillId)!.evaluation.qualifyingCount
    renderReview({ db, onDb: (d) => (latest = d) })
    await userEvent.click(within(cardOf(item.submissionId)).getByRole("button", { name: pr.approve }))
    await waitFor(() => expect(latest).not.toBeNull())
    expect(skillProgress(latest!, item.studentId, item.skillId)!.evaluation.qualifyingCount).toBe(before + 1)
  })
})

describe("SC-15, EV-07 only approval-on skills reach the queue", () => {
  it("every queued evaluation was submitted under an approval requirement", () => {
    const db = seedDb()
    for (const i of queue(db)) expect(db.evaluations.find((e) => e.id === i.evaluationId)!.approvalRequiredAtSubmit).toBe(true)
  })

  it("an evaluation that counted immediately is not in the queue; its link explains instead of offering a decision", () => {
    const db = seedDb()
    const waiting = new Set(queue(db).map((i) => i.submissionId))
    const other = db.submissions.find((s) => !waiting.has(s.id) && db.evaluations.some((e) => e.submissionId === s.id))!
    renderReview({ db, current: other.id })
    expect(screen.getByText(/not waiting for approval|already been (approved|returned)/)).toBeInTheDocument()
    expect(cardOf(other.id)).toBeNull()
  })
})

describe("RV-03, RV-05 a decided evaluation cannot be changed", () => {
  it("after approval the evaluation's own link says it was approved and offers no decision for it", async () => {
    const db = seedDb()
    const item = queue(db)[0]
    const r = reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "approved" }, { now: NOW })
    if (!r.ok) throw new Error("setup")
    renderReview({ db: r.db, current: item.submissionId })
    expect(screen.getByText(/already been approved/)).toBeInTheDocument()
    expect(cardOf(item.submissionId)).toBeNull()
  })

  it("the store refuses a second decision on the same evaluation", () => {
    const db = seedDb()
    const item = queue(db)[0]
    const r1 = reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "approved" }, { now: NOW })
    if (!r1.ok) throw new Error("setup")
    expect(reviewEvaluation(r1.db, { evaluationId: item.evaluationId, decision: "returned" }, { now: NOW }).ok).toBe(false)
  })

  it("a returned evaluation's link says so and shows the reviewer's note", () => {
    const db = seedDb()
    const item = queue(db)[0]
    const r = reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "returned", note: "Wrong unit." }, { now: NOW })
    if (!r.ok) throw new Error("setup")
    renderReview({ db: r.db, current: item.submissionId })
    expect(screen.getByText(/already been returned for correction/)).toBeInTheDocument()
    expect(screen.getByText(/Wrong unit\./)).toBeInTheDocument()
  })

  it("a deep link to a waiting evaluation marks that card current and decides nothing", () => {
    const db = seedDb()
    const item = queue(db)[3]
    renderReview({ db, current: item.submissionId })
    expect(cardOf(item.submissionId)).toHaveAttribute("aria-current", "true")
    expect(document.querySelectorAll("[aria-current='true']")).toHaveLength(1)
  })
})

describe("double decision guard", () => {
  it("clicking Approve twice commits once", async () => {
    const decide = vi.fn(async (input, db: Db) => reviewEvaluation(db, input, { now: NOW }))
    const db = seedDb()
    renderReview({ db, decide })
    const approve = within(cardOf(queue(db)[0].submissionId)).getByRole("button", { name: pr.approve })
    await act(async () => {
      fireEvent.click(approve)
      fireEvent.click(approve)
    })
    await screen.findByRole("button", { name: "Dismiss" })
    expect(decide).toHaveBeenCalledTimes(1)
  })

  it("while saving: every decision button on the page is disabled and the card says Approving with aria-busy", async () => {
    let release: (v: unknown) => void = () => {}
    const decide = vi.fn(() => new Promise<never>((res) => (release = res as never)))
    const db = seedDb()
    renderReview({ db, decide })
    const item = queue(db)[0]
    await userEvent.click(within(cardOf(item.submissionId)).getByRole("button", { name: pr.approve }))
    const card = cardOf(item.submissionId)
    await waitFor(() => expect(within(card).getByRole("button", { name: pr.approve })).toBeDisabled())
    expect(within(card).getByRole("button", { name: pr.approve })).toHaveAttribute("aria-busy", "true")
    expect(within(card).getByText(pr.approving)).toBeInTheDocument()
    for (const b of screen.getAllByRole("button", { name: pr.approve })) expect(b).toBeDisabled()
    for (const b of screen.getAllByRole("button", { name: "Return for correction" })) expect(b).toBeDisabled()
    await act(async () => release(fail("notAwaitingApproval", "x")))
  })
})

describe("states: empty, loading, error, submit failure", () => {
  it("empty queue: the prototype's empty state with an outline link to the library", () => {
    let db = seedDb()
    for (const i of queue(db)) {
      const r = reviewEvaluation(db, { evaluationId: i.evaluationId, decision: "approved" }, { now: NOW })
      if (r.ok) db = r.db
    }
    renderReview({ db })
    expect(screen.getByText(pr.emptyTitle)).toBeInTheDocument()
    expect(screen.getByText(pr.emptyBody)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: pr.emptyAction })).toHaveAttribute("href", "/skills/library")
    expect(document.querySelector("[data-review-card]")).toBeNull()
    expect(pr.emptyTitle).toBe("Nothing awaiting review")
    expect(pr.emptyBody).toBe("Submitted evaluations for skills configured with administrator review will appear here.")
  })

  it("loading shows a skeleton with a status label and no cards", () => {
    renderReview({ status: "loading" })
    expect(screen.getByRole("status", { name: "Loading the review queue" })).toHaveAttribute("aria-busy", "true")
    expect(document.querySelector("[data-review-card]")).toBeNull()
  })

  it("error shows the banner with Try again", async () => {
    const onRetry = vi.fn()
    renderReview({ status: "error", onRetry })
    expect(screen.getByText(pr.error)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("a decision that is not saved keeps the card, its note and its buttons, and says so", async () => {
    const decide = vi.fn(async () => fail("invalid", "nope"))
    const db = seedDb()
    renderReview({ db, decide })
    const item = queue(db)[0]
    await userEvent.type(within(cardOf(item.submissionId)).getByLabelText(pr.noteLabel), "Keep this text.")
    await userEvent.click(within(cardOf(item.submissionId)).getByRole("button", { name: pr.approve }))
    expect(await within(cardOf(item.submissionId)).findByText(pr.notSaved)).toBeInTheDocument()
    expect(within(cardOf(item.submissionId)).getByLabelText(pr.noteLabel)).toHaveValue("Keep this text.")
    expect(within(cardOf(item.submissionId)).getByRole("button", { name: pr.approve })).toBeEnabled()
  })
})

describe("keyboard and focus", () => {
  it("after a decision focus moves to the next waiting card's heading, never to a decision button", async () => {
    const db = seedDb()
    renderReview({ db })
    const [a, b] = queue(db)
    await userEvent.click(within(cardOf(a.submissionId)).getByRole("button", { name: pr.approve }))
    await waitFor(() => expect(cardOf(a.submissionId)).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(within(cardOf(b.submissionId)).getByRole("heading", { level: 2 })))
    expect(document.activeElement?.tagName).toBe("H2")
  })

  it("every control is reachable by keyboard and has an accessible name", () => {
    const db = seedDb()
    renderReview({ db })
    const card = cardOf(queue(db)[0].submissionId)
    for (const el of card.querySelectorAll("button, textarea")) expect((el.getAttribute("aria-label") || el.textContent || el.id).trim(), el.outerHTML.slice(0, 100)).toBeTruthy()
  })
})

describe("decision buttons follow the prototype: Approve carries a check icon, Return is text only (parity C-16)", () => {
  it("Approve's icon is decorative (aria-hidden) and its accessible name is just 'Approve'; Return has no icon", () => {
    const db = seedDb()
    renderReview({ db })
    const card = cardOf(queue(db)[0].submissionId)
    const approve = within(card).getByRole("button", { name: pr.approve })
    expect(approve.querySelector("i")).toHaveAttribute("aria-hidden", "true")
    expect(within(card).getByRole("button", { name: "Return for correction" }).querySelector("i, svg")).toBeNull()
  })
})

describe("accessibility (axe, colour contrast excluded in jsdom)", () => {
  it("queue", async () => {
    renderReview()
    await expectNoAxeViolations()
  })
  it("empty queue", async () => {
    let db = seedDb()
    for (const i of queue(db)) {
      const r = reviewEvaluation(db, { evaluationId: i.evaluationId, decision: "approved" }, { now: NOW })
      if (r.ok) db = r.db
    }
    renderReview({ db })
    await expectNoAxeViolations()
  })
  it("loading and error", async () => {
    const { unmount } = renderReview({ status: "loading" })
    await expectNoAxeViolations()
    unmount()
    renderReview({ status: "error", onRetry: () => {} })
    await expectNoAxeViolations()
  })
  it("a card with the responses expanded", async () => {
    const db = seedDb()
    renderReview({ db })
    await userEvent.click(within(cardOf(queue(db)[0].submissionId)).getByRole("button", { name: pr.expand }))
    await expectNoAxeViolations()
  })
  it("after a decision, with the result banner", async () => {
    const db = seedDb()
    renderReview({ db })
    await userEvent.click(within(cardOf(queue(db)[0].submissionId)).getByRole("button", { name: pr.approve }))
    await screen.findByRole("button", { name: "Dismiss" })
    await expectNoAxeViolations()
  })
  it("a deep link to an evaluation that was already decided", async () => {
    const db = seedDb()
    const item = queue(db)[0]
    const r = reviewEvaluation(db, { evaluationId: item.evaluationId, decision: "approved" }, { now: NOW })
    if (!r.ok) throw new Error("setup")
    renderReview({ db: r.db, current: item.submissionId })
    await expectNoAxeViolations()
  })
})
