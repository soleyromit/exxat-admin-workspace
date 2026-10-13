import * as React from "react"
import { renderToString } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

import { EvaluatorForm } from "@/components/evaluator/evaluator-form"
import { LinkMessage } from "@/components/evaluator/link-message"
import EvaluatorLayout, { metadata } from "@/app/(evaluator)/layout"
import { evaluatorRequest, submitEvaluation } from "@/lib/store"
import { getRuntime } from "@/lib/store/react"
import { draftKey, type DraftStorage } from "@/components/evaluator/form-state"
import { SK, addRequest, db, noContrast, replaceDb, resetStore } from "./helpers"

class Mem implements DraftStorage {
  m = new Map<string, string>()
  failWrites = false
  getItem = (k: string) => this.m.get(k) ?? null
  setItem = (k: string, v: string) => {
    if (this.failWrites) throw new Error("quota")
    this.m.set(k, v)
  }
  removeItem = (k: string) => void this.m.delete(k)
}

const view = (token: string, storage: DraftStorage | null = new Mem()) => render(<EvaluatorForm token={token} storage={storage} />)
const submitButton = () => screen.getByRole("button", { name: /^Submit evaluation$|^Submitting$/ })
const isDisabledLooking = (el: HTMLElement) => el.getAttribute("aria-disabled") === "true" || (el as HTMLButtonElement).disabled

/** Answer every control of a rendered skill card with the first option. */
async function answerAll(user: ReturnType<typeof userEvent.setup>, card: HTMLElement) {
  const groups = Array.from(card.querySelectorAll("fieldset"))
  for (const g of groups) {
    const first = within(g as HTMLElement).getAllByRole("radio")[0]
    await user.click(first)
  }
}
const cardOf = (skillId: string) => screen.getByTestId(`skill-${skillId}`)

beforeEach(() => {
  resetStore()
})

describe("EV-01 no login, no account, no shell", () => {
  it("opens the form directly with no sign-in prompt, no password field and no navigation", () => {
    const token = addRequest({ skillIds: [SK.dressing] })
    const { container } = view(token)
    expect(screen.getByRole("heading", { level: 1, name: "Evaluate Olivia Martin" })).toBeInTheDocument()
    expect(container.querySelector("nav")).toBeNull()
    expect(container.querySelector('input[type="password"]')).toBeNull()
    expect(screen.queryByText(/sign in|log in|password/i, { selector: "label, button, a, legend" })).toBeNull()
    expect(screen.getByText("Submitting records your answers. You will not be asked to sign in.")).toBeInTheDocument()
  })

  it("the layout has no shell: no nav, no sidebar, no outbound links, no referrer, never indexed", () => {
    const { container } = render(<EvaluatorLayout>content</EvaluatorLayout>)
    expect(container.querySelector("nav, aside, a[href]")).toBeNull()
    expect(container.querySelectorAll("main")).toHaveLength(1)
    expect(metadata.referrer).toBe("no-referrer")
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it("completing the form creates no account: only evaluations, submissions and the link change", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    const before = db()
    view(token)
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    const after = db()
    const changed = (Object.keys(after) as Array<keyof typeof after>).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]))
    expect(changed.sort()).toEqual(["evaluations", "links", "seq", "submissions"])
  })
})

describe("EV-02 / EV-08 roles", () => {
  it.each([
    ["preceptor", "Preceptor", "A. Whitfield, RN"],
    ["clinical_faculty", "Clinical faculty", "Dr. R. Castellano"],
    ["lab_instructor", "Lab instructor", "T. Ferreira"],
  ])("%s completes the same form and the recorded role matches the request", async (roleId, label, name) => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing], roleId, evaluatorName: name, performedIn: roleId === "lab_instructor" ? "lab" : "clinical" })
    view(token)
    expect(screen.getByText(new RegExp(`You are completing this as ${label}\\.`))).toBeInTheDocument()
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    const ev = db().evaluations.at(-1)!
    expect(ev.evaluator.roleId).toBe(roleId)
    expect(ev.evaluator.name).toBe(name)
  })

  it("AT-14: a fourth role stored as data renders with no code change", () => {
    replaceDb((d) => ({ ...d, roles: [...d.roles, { id: "dietitian", label: "Dietitian" }] }))
    const token = addRequest({ skillIds: [SK.dressing], roleId: "dietitian" })
    view(token)
    expect(screen.getByText(/You are completing this as Dietitian\./)).toBeInTheDocument()
  })

  it("SC-16: the form never offers a role switch", () => {
    const token = addRequest({ skillIds: [SK.dressing] })
    view(token)
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.queryByRole("button", { name: /role|switch/i })).toBeNull()
  })

  it("SL-09 / AT-20: a student-named instructor sees the same form and nothing about roster status", () => {
    const token = addRequest({ skillIds: [SK.dressing], roleId: "lab_instructor", performedIn: "lab", evaluatorSource: "studentNamed", evaluatorName: "R. Whitmore" })
    const { container } = view(token)
    expect(screen.getByText(/You are completing this as Lab instructor\./)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/roster|not listed|unlisted|adopt|named by/i)
  })
})

describe("EV-03 the evaluator only answers", () => {
  it("renders answer controls and a comment, with no control that edits labels, questions, scale, levels or rules", () => {
    const token = addRequest({ skillIds: [SK.dressing, SK.foley, SK.h2t, SK.iv] })
    const { container } = view(token)
    expect(container.querySelectorAll("input[type=text], input[type=number], select")).toHaveLength(0)
    expect(screen.queryByRole("button", { name: /add|edit|rename|remove|delete|configure/i })).toBeNull()
    const buttons = screen.getAllByRole("button").map((b) => b.textContent)
    expect(buttons).toEqual(["Submit evaluation"])
    // the only text inputs are the four comment boxes
    expect(screen.getAllByRole("textbox")).toHaveLength(4)
  })
})

describe("EV-04 / SC-15 / ST-12 student context", () => {
  const selfEval = { kind: "demonstration" as const, levelId: "iv-l2" }
  it("shows the supplied details, the self-evaluation and the student's note read-only BEFORE the answer controls, distinct from the evaluator's comment (AT-4, AT-10)", () => {
    const token = addRequest({
      skillIds: [SK.iv],
      values: { "sk-iv-f-date": "2026-08-20", "sk-iv-f-unit": "5 East" },
      note: "Felt I needed a prompt on preparation.",
      selfEvaluation: selfEval,
    })
    view(token)
    const card = cardOf(SK.iv)
    const ctx = within(card).getByRole("heading", { name: "Supplied by the student" }).closest('[role="group"]') as HTMLElement
    expect(within(ctx).getByText("Completion date")).toBeInTheDocument()
    expect(within(ctx).getByText("2026-08-20")).toBeInTheDocument()
    expect(within(ctx).getByText("5 East")).toBeInTheDocument()
    const note = within(card).getByTestId("student-note")
    expect(note).toHaveTextContent("Felt I needed a prompt on preparation.")
    const self = within(card).getByTestId("self-evaluation")
    expect(self).toHaveTextContent("With assistance")
    // read-only: text, not inputs
    expect(ctx.querySelector("input, textarea, select")).toBeNull()
    // before the controls
    const fieldset = card.querySelector("fieldset")!
    expect(ctx.compareDocumentPosition(fieldset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // the student's note is not inside the evaluator's comment box and has its own label
    const comment = within(card).getByRole("textbox", { name: /Your comment/ })
    expect(comment).toHaveValue("")
    expect(note.contains(comment)).toBe(false)
  })

  it("a skill with no self-evaluation configured shows none", () => {
    const token = addRequest({ skillIds: [SK.dressing], note: "" })
    view(token)
    expect(screen.queryByTestId("self-evaluation")).toBeNull()
  })

  it("AT-19: a question model's self-evaluation lists each answer beside the evaluator's own controls", () => {
    const token = addRequest({ skillIds: [SK.foley], selfEvaluation: { kind: "question", answers: { "foley-q1": true, "foley-q2": false, "foley-q3": true } } })
    view(token)
    const self = within(cardOf(SK.foley)).getByTestId("self-evaluation")
    expect(within(self).getByText("Performs the procedure correctly").nextSibling).toHaveTextContent("No")
    expect(within(cardOf(SK.foley)).getAllByRole("radio").length).toBe(6) // the evaluator's own controls
  })
})

describe("SC-03 SC-04 SC-05 SC-07 SC-08 / AT-9 controls follow the program's model", () => {
  it("binary: both program labels, equal weight, the qualifying label is never indicated", () => {
    const token = addRequest({ skillIds: [SK.dressing] })
    view(token)
    const card = cardOf(SK.dressing)
    const radios = within(card).getAllByRole("radio")
    expect(radios.map((r) => r.getAttribute("id"))).toHaveLength(2)
    expect(within(card).getByLabelText("Met")).toBeInTheDocument()
    expect(within(card).getByLabelText("Unmet")).toBeInTheDocument()
    expect(card.textContent).not.toMatch(/qualif|counts when|threshold/i)
  })

  it("question: a Yes or No group per program question, every question listed", () => {
    const token = addRequest({ skillIds: [SK.foley] })
    view(token)
    const card = cardOf(SK.foley)
    for (const q of ["Performs appropriate preparation", "Performs the procedure correctly", "Maintains appropriate technique"]) {
      const g = within(card).getByRole("group", { name: q })
      expect(within(g).getByRole("radio", { name: "Yes" })).toBeInTheDocument()
      expect(within(g).getByRole("radio", { name: "No" })).toBeInTheDocument()
    }
  })

  it("scored: the program's scale per question, min to max", () => {
    const token = addRequest({ skillIds: [SK.h2t] })
    view(token)
    const g = within(cardOf(SK.h2t)).getByRole("group", { name: "Accuracy of findings" })
    expect(within(g).getAllByRole("radio").map((r) => r.nextElementSibling?.textContent ?? r.getAttribute("value"))).toHaveLength(5)
    expect(within(cardOf(SK.h2t)).getAllByText("Score from 1 to 5.")).toHaveLength(1)
  })

  it("demonstration: the levels in the configured order, most supervised first", () => {
    const token = addRequest({ skillIds: [SK.iv] })
    view(token)
    const g = within(cardOf(SK.iv)).getByRole("group", { name: "Demonstration outcome" })
    const labels = within(g).getAllByRole("radio").map((r) => (g.querySelector(`label[for="${r.id}"]`) as HTMLElement).textContent)
    expect(labels).toEqual(["Observed", "With assistance", "Independent"])
  })

  it("single choice is a radio group with arrow-key navigation and a row of at least 44px", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    view(token)
    const radios = within(cardOf(SK.dressing)).getAllByRole("radio")
    for (const r of radios) expect(r.closest("div")!.className).toMatch(/min-h-11/)
    radios[0].focus()
    await user.keyboard("{ArrowDown}")
    expect(radios[1]).toHaveFocus()
  })
})

describe("EV-05 several skills in one sitting", () => {
  it("AT-5: answers three skills and submits once, recording three evaluations each with its own outcome and comment", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.iv, SK.foley, SK.dressing] })
    view(token)
    expect(screen.getByText("0 of 3 answered")).toBeInTheDocument()
    await answerAll(user, cardOf(SK.iv))
    await user.type(within(cardOf(SK.iv)).getByRole("textbox"), "Sound technique")
    await answerAll(user, cardOf(SK.foley))
    await user.type(within(cardOf(SK.foley)).getByRole("textbox"), "Good")
    await answerAll(user, cardOf(SK.dressing))
    expect(screen.getByText("3 of 3 answered", { selector: "p:not(#ev-remaining)" })).toBeInTheDocument()
    const before = db().evaluations.length
    await user.click(submitButton())
    const added = db().evaluations.slice(before)
    expect(added).toHaveLength(3)
    expect(added.map((e) => e.responses.kind).sort()).toEqual(["binary", "demonstration", "question"])
    expect(added.find((e) => e.responses.kind === "demonstration")!.comment).toBe("Sound technique")
    expect(added.find((e) => e.responses.kind === "question")!.comment).toBe("Good")
    expect(added.find((e) => e.responses.kind === "binary")!.comment).toBe("")
  })

  it("two skills with different models and different comment rules in one sitting", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.vitals, SK.med] }) // vitals mandatory comment, med optional
    view(token)
    expect(within(cardOf(SK.vitals)).getByLabelText("Your comment (required)")).toBeInTheDocument()
    expect(within(cardOf(SK.med)).getByLabelText("Your comment (optional)")).toBeInTheDocument()
    await answerAll(user, cardOf(SK.vitals))
    await answerAll(user, cardOf(SK.med))
    expect(isDisabledLooking(submitButton())).toBe(true) // vitals comment still missing
  })
})

describe("EV-06 / SC-14 mandatory comment", () => {
  it("AT-6: Submit looks disabled with the missing items stated, pressing it records nothing, moves focus to the comment and names the skill", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.vitals] })
    view(token)
    await answerAll(user, cardOf(SK.vitals))
    expect(screen.getByText("1 item still to complete. Next: a comment for Vital Signs Assessment.")).toBeInTheDocument()
    expect(isDisabledLooking(submitButton())).toBe(true)
    const before = db().evaluations.length
    await user.click(submitButton())
    expect(db().evaluations.length).toBe(before)
    expect(screen.getByText("Add a comment for Vital Signs Assessment before you submit. The program requires one.")).toBeInTheDocument()
    expect(within(cardOf(SK.vitals)).getByRole("textbox")).toHaveFocus()
    expect(within(cardOf(SK.vitals)).getByRole("textbox")).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByTestId("live")).toHaveTextContent("Not submitted. 1 item needs your attention.")
  })

  it("an optional comment never blocks Submit; a whitespace-only mandatory comment still does", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.vitals, SK.dressing] })
    view(token)
    await answerAll(user, cardOf(SK.vitals))
    await answerAll(user, cardOf(SK.dressing))
    await user.type(within(cardOf(SK.vitals)).getByRole("textbox"), "   ")
    expect(isDisabledLooking(submitButton())).toBe(true)
    await user.type(within(cardOf(SK.vitals)).getByRole("textbox"), "Calm and accurate")
    expect(isDisabledLooking(submitButton())).toBe(false)
  })

  it("unanswered questions block with a message naming the skill and focus on the first unanswered control", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.foley] })
    view(token)
    await user.click(within(cardOf(SK.foley)).getAllByRole("radio")[0]) // answers only the first question
    await user.click(submitButton())
    expect(screen.getByText("Answer every question for Foley Catheter Insertion to submit.")).toBeInTheDocument()
    const second = within(cardOf(SK.foley)).getByRole("group", { name: "Performs the procedure correctly" })
    expect(within(second).getAllByRole("radio")[0]).toHaveFocus()
    expect(screen.getByRole("link", { name: "Skip to first unanswered" })).toHaveAttribute("href", expect.stringMatching(/^#ev-sub-t\d+-0-h$/))
  })
})

describe("EV-07 counts now or held, told before and after", () => {
  it("AT-7: before submit each skill states its routing; after submit the confirmation says held or counts now and shows no student status", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.iv, SK.dressing] })
    view(token)
    expect(within(cardOf(SK.iv)).getByText("This skill is held for administrator approval after you submit.")).toBeInTheDocument()
    expect(within(cardOf(SK.dressing)).getByText("This skill counts as soon as you submit.")).toBeInTheDocument()
    await answerAll(user, cardOf(SK.iv))
    await user.type(within(cardOf(SK.iv)).getByRole("textbox"), "Good")
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    const conf = screen.getByTestId("confirmation")
    expect(within(conf).getByRole("heading", { level: 1, name: "Evaluation submitted for Olivia Martin. 2 skills recorded." })).toBeInTheDocument()
    expect(within(conf).getByText("IV Insertion: recorded. It is held for administrator approval and does not count until approved.")).toBeInTheDocument()
    expect(within(conf).getByText("Sterile Dressing Change: recorded. It counts toward the student's record now.")).toBeInTheDocument()
  })

  it("AT-13 / AE-01: the held evaluation is recorded as awaiting approval and does not count until approved", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.iv] })
    view(token)
    await answerAll(user, cardOf(SK.iv))
    await user.type(within(cardOf(SK.iv)).getByRole("textbox"), "Good")
    await user.click(submitButton())
    const ev = db().evaluations.at(-1)!
    expect(ev.approvalRequiredAtSubmit).toBe(true)
    expect(db().reviews.some((r) => r.evaluationId === ev.id)).toBe(false)
  })
})

describe("OD-17 the evaluator never sees the student's achievement (DEFECT-05)", () => {
  const STATUS = /achieved|in progress|not started|evidence does not qualify|no evidence yet|not met|\d+ ?\/ ?\d+ (qualifying|demonstrations)|qualifying evaluations|criteria|threshold/i

  it("AT-15: the data behind the link has no achievement, progress, criteria or record fields", () => {
    const token = addRequest({ skillIds: [SK.iv, SK.foley] })
    const json = JSON.stringify(evaluatorRequest(db(), token))
    expect(json).not.toMatch(/achiev|progress|criteria|requiredCount|levelMinimums|settingMinimums|state|history|qualifyingLabel/i)
  })

  it("no achievement fields anywhere in the DOM: before, after a blocked submit, and on the confirmation", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.iv, SK.dressing] })
    const { container } = view(token)
    expect(container.textContent).not.toMatch(STATUS)
    await user.click(submitButton())
    expect(container.textContent).not.toMatch(STATUS)
    await answerAll(user, cardOf(SK.iv))
    await user.type(within(cardOf(SK.iv)).getByRole("textbox"), "Good")
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    expect(container.textContent).not.toMatch(STATUS)
  })

  it("no other student, other request, history or reviewer note is reachable", () => {
    const a = addRequest({ skillIds: [SK.dressing], studentId: "stu-01" })
    addRequest({ skillIds: [SK.foley], studentId: "stu-02" })
    const { container } = view(a)
    const other = db().students.find((s) => s.id === "stu-02")!.name
    expect(container.textContent).not.toContain(other)
    expect(container.textContent).not.toContain("Foley Catheter Insertion")
    expect(container.textContent).not.toMatch(/reviewer|review note|attempt \d/i)
  })
})

describe("OD-18 link states are one neutral page (RV-03, RV-05)", () => {
  const MESSAGE = "This link cannot be used. Contact the student or program that sent it."

  it("AT-16: an invalid token shows the neutral message, no student data, no expiry rule", () => {
    const { container } = view("tok-does-not-exist")
    expect(screen.getByRole("heading", { level: 1, name: MESSAGE })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/expire|valid until|\bdays?\b|\bhours?\b|revoked|already/i)
    expect(container.querySelector("input, textarea, button")).toBeNull()
  })

  it("a superseded link is indistinguishable from an invalid one", () => {
    const token = addRequest({ skillIds: [SK.dressing] })
    replaceDb((d) => ({ ...d, links: d.links.map((l) => (l.token === token ? { ...l, supersededAt: "2026-09-01T00:00:00.000Z" } : l)) }))
    const { container } = view(token)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(MESSAGE)
    expect(container.textContent).not.toContain("Olivia")
  })

  it("AT-11: after submit, opening the link again shows 'already submitted' and nothing editable", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    const first = view(token)
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    first.unmount()
    const { container } = view(token)
    expect(screen.getByRole("heading", { level: 1, name: "An evaluation has already been submitted for this request." })).toBeInTheDocument()
    expect(container.querySelector("input, textarea, button, [role=radio]")).toBeNull()
    expect(container.textContent).not.toContain("Olivia")
    // and the store refuses a second submission
    const again = getRuntime().run((d, ctx) => submitEvaluation(d, { token, answers: [] }, ctx))
    expect(again.ok).toBe(false)
    if (!again.ok) expect(again.error.code).toBe("alreadySubmitted")
  })

  it("a link whose request has no usable skill is treated as invalid (zero skills)", () => {
    const token = addRequest({ skillIds: ["sk-ng"] }) // unconfigured skill
    view(token)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(MESSAGE)
  })

  it("link isolation: each token shows only its own request", () => {
    const a = addRequest({ skillIds: [SK.dressing], studentId: "stu-01" })
    const b = addRequest({ skillIds: [SK.foley], studentId: "stu-02" })
    const first = view(a)
    expect(first.container.textContent).toContain("Sterile Dressing Change")
    expect(first.container.textContent).not.toContain("Foley Catheter Insertion")
    first.unmount()
    const second = view(b)
    expect(second.container.textContent).toContain("Foley Catheter Insertion")
    expect(second.container.textContent).not.toContain("Sterile Dressing Change")
  })
})

describe("OD-08 / OD-24 seams", () => {
  it("OD-08: a revised submission says a previous evaluation was returned and does not prefill answers", () => {
    const link = db().links.find((l) => {
      const s = db().submissions.find((x) => x.id === l.submissionIds[0])!
      return s.revision > 0 && !l.submittedAt
    })
    if (!link) throw new Error("sample data has no revised open request")
    view(link.token)
    expect(screen.getByText("A previous evaluation was returned.")).toBeInTheDocument()
    expect(screen.queryAllByRole("radio", { checked: true })).toHaveLength(0)
  })

  it("OD-24: a skill deactivated while a request is open still renders unchanged", () => {
    const token = addRequest({ skillIds: [SK.dressing] })
    replaceDb((d) => ({ ...d, skills: d.skills.map((s) => (s.id === SK.dressing ? { ...s, active: false } : s)) }))
    view(token)
    expect(within(cardOf(SK.dressing)).getByRole("heading", { level: 2, name: "1. Sterile Dressing Change" })).toBeInTheDocument()
  })
})

describe("setting line and context", () => {
  it("shows Clinical (setting) at location, or Lab or simulation", () => {
    const clinical = addRequest({ skillIds: [SK.dressing] })
    const a = view(clinical)
    expect(screen.getByText("Clinical (Outpatient clinic) at Harbor Family Practice")).toBeInTheDocument()
    a.unmount()
    const lab = addRequest({ skillIds: [SK.dressing], performedIn: "lab", roleId: "lab_instructor" })
    view(lab)
    expect(screen.getByText("Lab or simulation")).toBeInTheDocument()
  })

  it("the subline names the course, the requested date and the role", () => {
    const token = addRequest({ skillIds: [SK.dressing] })
    view(token)
    expect(screen.getByText("NURS 350 Clinical Practicum, Fall 2026. Requested August 24, 2026. You are completing this as Preceptor.")).toBeInTheDocument()
  })
})

describe("submit states, errors, autosave", () => {
  it("S: Submit goes busy with the label Submitting and success is never optimistic; a double press records once (guard)", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    const rt = getRuntime()
    const spy = vi.spyOn(rt, "run")
    view(token)
    await answerAll(user, cardOf(SK.dressing))
    const before = db().evaluations.length
    await user.dblClick(submitButton())
    expect(db().evaluations.length).toBe(before + 1)
    expect(spy.mock.calls.length).toBe(1)
    spy.mockRestore()
  })

  it("Er: a failed submit keeps the answers, shows the banner and can be tried again", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    const rt = getRuntime()
    const real = rt.run
    const spy = vi.spyOn(rt, "run").mockReturnValueOnce({ ok: false, error: { code: "invalid", message: "x", fields: {} } } as never)
    view(token)
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    expect(screen.getByText("Your evaluation was not submitted. Your answers are kept. Try again.")).toBeInTheDocument()
    expect(within(cardOf(SK.dressing)).getAllByRole("radio").some((r) => r.getAttribute("aria-checked") === "true")).toBe(true)
    spy.mockImplementation(real as never)
    await user.click(submitButton())
    expect(screen.getByTestId("confirmation")).toBeInTheDocument()
    spy.mockRestore()
  })

  it("state review F2: the submit-error banner carries its own Try again action, and it resubmits the kept answers", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    const rt = getRuntime()
    const real = rt.run
    const spy = vi.spyOn(rt, "run").mockReturnValueOnce({ ok: false, error: { code: "invalid", message: "x", fields: {} } } as never)
    view(token)
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    const banner = screen.getByText("Your evaluation was not submitted. Your answers are kept. Try again.").closest('[role="alert"]') as HTMLElement
    spy.mockImplementation(real as never)
    await user.click(within(banner).getByRole("button", { name: "Try again" }))
    expect(screen.getByTestId("confirmation")).toBeInTheDocument()
    spy.mockRestore()
  })

  it("state review F7: the neutral link page moves focus to its heading on load", () => {
    render(<LinkMessage problem="invalid" />)
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus()
  })

  it("a link already used elsewhere while the form is open ends on the neutral page", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    const rt = getRuntime()
    vi.spyOn(rt, "run").mockReturnValueOnce({ ok: false, error: { code: "alreadySubmitted", message: "x" } } as never)
    view(token)
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("An evaluation has already been submitted for this request.")
    vi.restoreAllMocks()
  })

  it("autosave: an answer is saved on this device, restored on a new visit, and cleared after submit", async () => {
    const user = userEvent.setup()
    const store = new Mem()
    const token = addRequest({ skillIds: [SK.foley] })
    const first = view(token, store)
    await user.click(within(cardOf(SK.foley)).getAllByRole("radio")[0])
    await user.type(within(cardOf(SK.foley)).getByRole("textbox"), "Calm")
    expect(screen.getByText("Answers saved on this device.")).toBeInTheDocument()
    expect(store.getItem(draftKey(token))).toContain("Calm")
    first.unmount()
    view(token, store)
    expect(within(cardOf(SK.foley)).getByRole("textbox")).toHaveValue("Calm")
    expect(within(cardOf(SK.foley)).getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "true")
  })

  it("autosave failure is quiet: shows 'Not saved.' with a retry, never blocks answering", async () => {
    const user = userEvent.setup()
    const store = new Mem()
    store.failWrites = true
    const token = addRequest({ skillIds: [SK.dressing] })
    view(token, store)
    await user.click(within(cardOf(SK.dressing)).getAllByRole("radio")[0])
    expect(screen.getByText("Not saved.")).toBeInTheDocument()
    store.failWrites = false
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(screen.getByText("Answers saved on this device.")).toBeInTheDocument()
    expect(within(cardOf(SK.dressing)).getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "true")
  })

  it("autosave clears the draft once the evaluation is submitted", async () => {
    const user = userEvent.setup()
    const store = new Mem()
    const token = addRequest({ skillIds: [SK.dressing] })
    view(token, store)
    await answerAll(user, cardOf(SK.dressing))
    expect(store.getItem(draftKey(token))).not.toBeNull()
    await user.click(submitButton())
    expect(store.getItem(draftKey(token))).toBeNull()
  })

  it("L: the first paint is a loading state with no student data", () => {
    const token = addRequest({ skillIds: [SK.dressing] })
    const html = renderToString(<EvaluatorForm token={token} storage={null} />)
    expect(html).toContain("Loading the evaluation")
    expect(html).not.toContain("Olivia")
    expect(html).not.toContain("This link cannot be used")
  })
})

describe("a11y (WCAG 2.1 AA, jsdom: colour contrast is checked in a real browser)", () => {
  const run = async (node: HTMLElement) => (await axe.run(node, noContrast)).violations

  it("AT-17: one h1, the page title takes focus on load, status is announced in a live region", () => {
    const token = addRequest({ skillIds: [SK.iv, SK.foley] })
    const { container } = view(token)
    expect(container.querySelectorAll("h1")).toHaveLength(1)
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }))
    expect(screen.getByTestId("live")).toHaveAttribute("aria-live", "polite")
    expect(container.querySelectorAll("section h2").length).toBeGreaterThanOrEqual(2)
  })

  it("axe: default state of every model", async () => {
    const token = addRequest({ skillIds: [SK.iv, SK.foley, SK.h2t, SK.dressing] })
    const { container } = view(token)
    expect(await run(container)).toEqual([])
  })

  it("axe: validation-error state", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.vitals, SK.foley] })
    const { container } = view(token)
    await user.click(submitButton())
    expect(screen.getAllByRole("alert").length + screen.getAllByText(/before you submit|to submit\./).length).toBeGreaterThan(0)
    expect(await run(container)).toEqual([])
  })

  it("axe: invalid-link state", async () => {
    const { container } = view("nope")
    expect(await run(container)).toEqual([])
  })

  it("axe: confirmation state, and the confirmation heading takes focus", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    const { container } = view(token)
    await answerAll(user, cardOf(SK.dressing))
    await user.click(submitButton())
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1 }))
    expect(await run(container)).toEqual([])
  })

  it("keyboard only: every control is reachable and Submit is the last tab stop", async () => {
    const user = userEvent.setup()
    const token = addRequest({ skillIds: [SK.dressing] })
    view(token)
    await user.keyboard("{Tab}") // skip link or first radio
    let guard = 0
    while (document.activeElement !== submitButton() && guard++ < 20) await user.tab()
    expect(document.activeElement).toBe(submitButton())
  })
})
