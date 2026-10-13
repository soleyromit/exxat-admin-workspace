import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

vi.mock("next/navigation", async () => (await import("./nav")).navigationMock)

import { CourseSkillsView } from "@/components/student/course-skills-view"
import { resetNav } from "./nav"
import { SCENARIO, db, resetStore } from "./helpers"

const OFF = "off-350-f26"
const noContrast = { rules: { "color-contrast": { enabled: false } } }

async function openSheet(skills: string, offering = OFF) {
  resetNav(`/courses/${offering}/skills/send`, `skills=${skills}`)
  render(<CourseSkillsView offeringId={offering} initialSendOpen />)
  return screen.findByRole("dialog")
}

async function choose(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, combo: RegExp, option: string | RegExp) {
  await user.click(within(dialog).getByRole("combobox", { name: combo }))
  await user.click(await screen.findByRole("option", { name: option }))
}

beforeEach(() => {
  resetStore(SCENARIO.olivia)
})

describe("S-13 where, setting and role (ST-05, ST-06, ST-07, ST-08)", () => {
  it("opens as a dialog titled Send for review naming the skills and the course, Send request disabled WITH a stated reason", async () => {
    const dialog = await openSheet("sk-foley,sk-med")
    expect(within(dialog).getByRole("heading", { name: "Send for review" })).toBeInTheDocument()
    expect(within(dialog).getByText(/2 skills \u00b7 NURS 350 \u2014 Clinical Practicum/)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Send request" })).toBeDisabled()
    expect(within(dialog).getByText("Choose where this was performed to send this request.")).toBeInTheDocument()
  })

  it("ST-05: Clinical or Lab is a single-choice RadioGroup and the dependent controls follow it", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    expect(within(dialog).getByRole("radio", { name: "Clinical" })).toBeChecked()
    expect(within(dialog).getByRole("combobox", { name: /Which clinical setting/ })).toBeInTheDocument()
    await user.click(within(dialog).getByRole("radio", { name: "Lab / Simulation" }))
    expect(within(dialog).getByRole("radio", { name: "Lab / Simulation" })).toBeChecked()
    expect(within(dialog).queryByRole("combobox", { name: /Which clinical setting/ })).toBeNull() // clinical setting hidden in a lab
  })

  it("ST-06: with two placements the student chooses 'Setting, Location' from their own placements", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    expect(within(dialog).getByText(/From your 2 placements for this course/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole("combobox", { name: /Which clinical setting/ }))
    const options = (await screen.findAllByRole("option")).map((o) => o.textContent)
    expect(options).toEqual(["Outpatient clinic \u2014 Harbor Family Practice", "Perioperative \u2014 Northgate Surgical Center", "Outpatient clinic \u2014 Northgate Surgical Center"])
  })

  it("ST-06: with exactly one placement the setting is inferred and shown read-only with its source", async () => {
    const seed = db()
    let found: { studentId: string; offeringId: string; setting: string; location: string } | null = null
    for (const st of seed.students) {
      for (const off of seed.offerings) {
        const ps = seed.placements.filter((p) => p.studentId === st.id && p.offeringId === off.id)
        if (ps.length !== 1) continue
        const loc = seed.locations.find((l) => l.id === ps[0].locationId)!
        const settings = loc.settingIds.filter((id) => seed.clinicalSettings.find((s) => s.id === id && s.active))
        if (settings.length === 1) {
          found = { studentId: st.id, offeringId: off.id, setting: seed.clinicalSettings.find((s) => s.id === settings[0])!.name, location: loc.name }
          break
        }
      }
      if (found) break
    }
    expect(found).not.toBeNull()
    resetStore(found!.studentId)
    const dialog = await openSheet("sk-foley", found!.offeringId)
    expect(within(dialog).getByText(`Recorded as ${found!.setting} at ${found!.location}, from your placement.`)).toBeInTheDocument()
    expect(within(dialog).queryByRole("combobox", { name: /Which clinical setting/ })).toBeNull()
  })

  it("ST-07: with no placement recorded the student chooses from the program's full list and can still send", async () => {
    resetStore(SCENARIO.elena)
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    expect(within(dialog).getByText("No placement is recorded for this course. Choose from your program's clinical settings.")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("combobox", { name: /Which clinical setting/ }))
    expect((await screen.findAllByRole("option")).map((o) => o.textContent)).toEqual(db().clinicalSettings.filter((s) => s.active).map((s) => s.name))
  })

  it("ST-08: a skill that only a lab instructor can sign off cannot be sent as clinical evidence; the warning explains and offers Switch to Lab", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-o2")
    expect(within(dialog).getByText(/Oxygen Therapy Administration can only be signed off by Lab instructor, who cannot sign off clinical evidence\. Choose Lab or simulation, or ask your program administrator\./)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Send request" })).toBeDisabled()
    expect(within(dialog).getByText("Send request is unavailable because no evaluator role can sign off this request.")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Switch to Lab or simulation" }))
    expect(within(dialog).getByRole("radio", { name: "Lab / Simulation" })).toBeChecked()
    expect(within(dialog).queryByText(/who cannot sign off clinical evidence/)).toBeNull()
  })

  it("SC-16, EV-02: only the roles the skill permits, and valid for the setting, are offered", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-wound") // Wound Care: Preceptor or Clinical faculty
    await user.click(within(dialog).getByRole("combobox", { name: /Send for review to/ }))
    expect((await screen.findAllByRole("option")).map((o) => o.textContent)).toEqual(["Preceptor", "Clinical faculty"])
  })
})

describe("S-13 evaluator (ST-08, ST-09, DEFECT-01)", () => {
  it("DEFECT-01: switching Clinical to Lab clears the chosen preceptor, so a preceptor can never be sent as another role", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    await choose(user, dialog, /Send for review to/, "Preceptor")
    await choose(user, dialog, /^Preceptor/, "A. Whitfield, RN")
    expect(within(dialog).getByRole("combobox", { name: /^Preceptor/ })).toHaveTextContent("A. Whitfield, RN")
    await user.click(within(dialog).getByRole("radio", { name: "Lab / Simulation" }))
    expect(within(dialog).queryByText("A. Whitfield, RN")).toBeNull()
    expect(within(dialog).getByRole("combobox", { name: /Send for review to/ })).toHaveTextContent("Choose a role")
    expect(within(dialog).queryByRole("combobox", { name: /^Preceptor/ })).toBeNull()
  })

  it("the person list shows names only, never contact details (RBAC)", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    await choose(user, dialog, /Send for review to/, "Preceptor")
    await user.click(within(dialog).getByRole("combobox", { name: /^Preceptor/ }))
    const opts = (await screen.findAllByRole("option")).map((o) => o.textContent ?? "")
    expect(opts.length).toBeGreaterThan(0)
    expect(opts.every((t) => !t.includes("@"))).toBe(true)
  })

  it("ST-09: a lab instructor who is not on the roster can be named with an email; the email is validated on blur", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-o2")
    await user.click(within(dialog).getByRole("button", { name: "Switch to Lab or simulation" }))
    await choose(user, dialog, /^Lab instructor/, "Someone not listed\u2026")
    expect(within(dialog).getByText(/Enter their name and email so the request can reach them/)).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText("Name"), "J. Doe")
    await user.type(within(dialog).getByLabelText("Email"), "not-an-email")
    await user.tab()
    expect(await within(dialog).findByText("Enter a valid email address. The request is sent here.")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Send request" })).toBeDisabled()
  })
})

describe("S-13 details and self-evaluation (ST-10, ST-11, ST-12, SC-13, SC-15)", () => {
  it("ST-10: a required field shows its error after blur and keeps Send disabled with the count in the reason", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    await choose(user, dialog, /Which clinical setting/, "Outpatient clinic \u2014 Harbor Family Practice")
    await choose(user, dialog, /Send for review to/, "Preceptor")
    await choose(user, dialog, /^Preceptor/, "A. Whitfield, RN")
    expect(within(dialog).getByText("Complete the 1 required field to send this request.")).toBeInTheDocument()
    const date = within(dialog).getByLabelText(/Completion date/)
    await user.click(date)
    await user.tab()
    expect(await within(dialog).findByText("Completion date is required.")).toBeInTheDocument()
    expect(date).toHaveAttribute("aria-invalid", "true")
    expect(within(dialog).getByRole("button", { name: "Send request" })).toBeDisabled()
  })

  it("ST-11, SC-15: a skill configured for self-evaluation shows the same criteria BEFORE send and keeps Send disabled until answered", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-iv")
    expect(within(dialog).getByText("Evaluate yourself first")).toBeInTheDocument()
    expect(within(dialog).getByText(/They see your answers while evaluating/)).toBeInTheDocument()
    expect(within(dialog).getByRole("radio", { name: "Independent" })).toBeInTheDocument()
    await choose(user, dialog, /Which clinical setting/, "Outpatient clinic \u2014 Harbor Family Practice")
    await choose(user, dialog, /Send for review to/, "Preceptor")
    await choose(user, dialog, /^Preceptor/, "A. Whitfield, RN")
    fireEvent.change(within(dialog).getByLabelText(/Completion date/), { target: { value: "2026-09-01" } })
    await user.type(within(dialog).getByLabelText(/^Unit/), "3 West")
    expect(within(dialog).getByRole("button", { name: "Send request" })).toBeDisabled()
    expect(within(dialog).getByText("Complete your self-evaluation to send this request.")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("radio", { name: "Independent" }))
    expect(within(dialog).getByRole("button", { name: "Send request" })).toBeEnabled()
  })

  it("a skill that is not configured for self-evaluation shows no self-evaluation block", async () => {
    const dialog = await openSheet("sk-foley")
    expect(within(dialog).queryByText("Evaluate yourself first")).toBeNull()
  })
})

describe("S-13 send and confirmation (ST-04, ST-12, ST-13, OD-07 seam, P-14)", () => {
  it("ST-14 (OD-07 stays open): sends two skills together: one request, the confirmation names skills, evaluator, role, setting and location; the sheet closes", async () => {
    const user = userEvent.setup()
    const before = db().submissions.length
    const dialog = await openSheet("sk-foley,sk-med")
    await choose(user, dialog, /Which clinical setting/, "Outpatient clinic \u2014 Harbor Family Practice")
    await choose(user, dialog, /Send for review to/, "Preceptor")
    await choose(user, dialog, /^Preceptor/, "A. Whitfield, RN")
    const dates = within(dialog).getAllByLabelText(/Completion date/)
    fireEvent.change(dates[0], { target: { value: "2026-09-01" } })
    fireEvent.change(dates[1], { target: { value: "2026-09-02" } })
    await user.type(within(dialog).getAllByLabelText(/Your note \(optional\)/)[0], "One note only")
    await user.click(within(dialog).getByRole("button", { name: "Send request" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    const banner = await screen.findByText("Sent Foley Catheter Insertion and Medication Administration to A. Whitfield, RN, Preceptor. Clinical (Outpatient clinic) at Harbor Family Practice.")
    expect(banner.closest('[role="status"]')).toBeInTheDocument()
    const added = db().submissions.slice(before)
    expect(added).toHaveLength(2)
    expect(new Set(added.map((s) => s.requestId)).size).toBe(1) // ST-04: one request
    // OD-07 seam: setting and location are stored on EACH item, defaulted from what was chosen once
    expect(added.every((s) => s.clinicalSettingId === "set-outpatient" && s.locationId === "loc-harbor" && s.performedIn === "clinical")).toBe(true)
    // ST-12: exactly one student note per item, kept separate from the evaluator's comment
    expect(added[0].studentNote).toBe("One note only")
    expect(added[1].studentNote).toBe("")
    // the Waiting strip now lists the new requests and the selection is cleared
    const strip = await screen.findByRole("region", { name: /Awaiting preceptor evaluation/ })
    expect(within(strip).getByText("Foley Catheter Insertion \u00b7 A. Whitfield, RN (Preceptor)")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Selection actions" })).toBeNull()
  })

  it("a lab request sent to a student-named lab instructor is stored with that name and email, no account (ST-09, SL-08, SL-09)", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-o2")
    await user.click(within(dialog).getByRole("button", { name: "Switch to Lab or simulation" }))
    await choose(user, dialog, /^Lab instructor/, "Someone not listed\u2026")
    await user.type(within(dialog).getByLabelText("Name"), "J. Doe")
    await user.type(within(dialog).getByLabelText("Email"), "j.doe@example.edu")
    fireEvent.change(within(dialog).getByLabelText(/Completion date/), { target: { value: "2026-09-03" } })
    await user.click(within(dialog).getByRole("button", { name: "Send request" }))
    await screen.findByText("Sent Oxygen Therapy Administration to J. Doe, Lab instructor. Lab or simulation.")
    const named = db().namedLabInstructors.find((n) => n.name === "J. Doe")
    expect(named).toMatchObject({ email: "j.doe@example.edu", namedByStudentId: SCENARIO.olivia, adoptedAs: null })
    const sub = db().submissions.at(-1)!
    expect(sub.evaluator).toMatchObject({ source: "studentNamed", roleId: "lab_instructor", name: "J. Doe" })
    expect(sub.clinicalSettingId).toBeNull()
  })

  it("P-13: closing with unsaved changes asks 'Discard this request?' with the safe action focused; Keep editing keeps the answers", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    await user.type(within(dialog).getByLabelText(/Your note \(optional\)/), "draft text")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    const alert = await screen.findByRole("alertdialog")
    expect(within(alert).getByText("Discard this request?")).toBeInTheDocument()
    expect(within(alert).getByRole("button", { name: "Keep editing" })).toHaveFocus()
    await user.click(within(alert).getByRole("button", { name: "Keep editing" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(within(screen.getByRole("dialog")).getByLabelText(/Your note \(optional\)/)).toHaveValue("draft text")
  })

  it("closing with nothing entered closes at once, no prompt", async () => {
    const user = userEvent.setup()
    const dialog = await openSheet("sk-foley")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(screen.queryByRole("alertdialog")).toBeNull()
  })

  it("OD-14 is not built: there is no Save draft in the sheet", async () => {
    const dialog = await openSheet("sk-iv")
    expect(within(dialog).queryByRole("button", { name: /save draft/i })).toBeNull()
  })

  it("axe: the open sheet has no violations (default, with the ST-08 warning, and with the self-evaluation block)", async () => {
    const dialog = await openSheet("sk-iv")
    expect((await axe.run(dialog, noContrast)).violations).toEqual([])
  })

  it("axe: the ST-08 blocked state has no violations", async () => {
    const dialog = await openSheet("sk-o2")
    expect((await axe.run(dialog, noContrast)).violations).toEqual([])
  })
})
