import { describe, expect, it } from "vitest"
import { buildEvaluationRequestEmail, EMAIL_BUTTON_BACKGROUND, SKILL_LIST_CAP, whereLine, type EvaluationRequestEmailInput } from "@/components/evaluator/email"

const base: EvaluationRequestEmailInput = {
  programName: "Nursing program",
  studentName: "Olivia Martin",
  courseCode: "NURS 350",
  evaluatorName: "A. Whitfield, RN",
  evaluatorEmail: "a.whitfield@example.org",
  roleLabel: "Preceptor",
  skillNames: ["IV Insertion", "Foley Catheter Insertion"],
  performedIn: "clinical",
  settingName: "Outpatient clinic",
  locationName: "Harbor Family Practice",
  url: "https://prism.example.test/e/tok-abc123",
}
const build = (o: Partial<EvaluationRequestEmailInput> = {}) => buildEvaluationRequestEmail({ ...base, ...o })

describe("S-18 subject, greeting and intro", () => {
  it("subject uses the count so a multi-skill request is not mistaken for several", () => {
    expect(build().subject).toBe("Olivia Martin has asked you to evaluate 2 skills")
    expect(build({ skillNames: ["IV Insertion"] }).subject).toBe("Olivia Martin has asked you to evaluate 1 skill")
  })

  it("greets by name, or plainly when the name is unknown", () => {
    expect(build().text.startsWith("Hello A. Whitfield, RN,\n")).toBe(true)
    expect(build({ evaluatorName: "  " }).text.startsWith("Hello,\n")).toBe(true)
  })

  it("the intro names the student with the course code and program; with no course code only the program", () => {
    expect(build().text).toContain("Olivia Martin (NURS 350, Nursing program) has asked you to evaluate\n".replace("\n", " ").trimEnd())
    expect(build({ courseCode: undefined }).text).toContain("Olivia Martin (Nursing program) has asked you to evaluate 2 skills they performed:")
  })
})

describe("EV-01 EV-02 EV-05 content", () => {
  it("AT-2: states that no sign-in is needed and no account is created, in both parts", () => {
    const e = build()
    for (const part of [e.text, e.html]) expect(part).toContain("You do not need to sign in and no account is created.")
  })

  it.each(["Preceptor", "Clinical faculty", "Lab instructor", "Dietitian"])("AT-3: states the role %s the recipient is asked to act in (roles are data, EV-08)", (role) => {
    const e = build({ roleLabel: role })
    expect(e.text).toContain(`You are asked to complete this as: ${role}`)
    expect(e.html).toContain(role)
  })

  it("AT-4: one email lists every skill with exactly one link", () => {
    const e = build({ skillNames: ["IV Insertion", "Foley Catheter Insertion", "Sterile Dressing Change"] })
    for (const name of ["IV Insertion", "Foley Catheter Insertion", "Sterile Dressing Change"]) {
      expect(e.text).toContain(`  - ${name}`)
      expect(e.html).toContain(name)
    }
    const urls = new Set((e.text + e.html).match(/https?:\/\/[^\s"<]+/g))
    expect(urls.size).toBe(1)
    expect(e.text.split(base.url).length - 1).toBe(1)
  })

  it("caps a very long list and says how many more [INFER]", () => {
    const many = Array.from({ length: SKILL_LIST_CAP + 2 }, (_, i) => `Skill ${i + 1}`)
    const e = build({ skillNames: many })
    expect(e.text).toContain("Skill 10")
    expect(e.text).not.toContain("Skill 11")
    expect(e.text).toContain("and 2 more")
    expect(e.subject).toContain("12 skills")
  })

  it("ST-13 / AT-7: the where line carries the same facts the student saw", () => {
    expect(whereLine(base)).toBe("Clinical (Outpatient clinic) at Harbor Family Practice")
    expect(build({ performedIn: "lab" }).text).toContain("Where: Lab or simulation")
    expect(whereLine({ performedIn: "clinical", settingName: null, locationName: null })).toBe("Clinical")
  })

  it("AT-5 / AT-13 SL-08 SL-09: a lab instructor named by the student receives it at the supplied address, with no roster status", () => {
    const e = build({ evaluatorName: "R. Whitmore", evaluatorEmail: "r.whitmore@example.edu", roleLabel: "Lab instructor", performedIn: "lab" })
    expect(e.to).toEqual({ name: "R. Whitmore", email: "r.whitmore@example.edu" })
    expect(e.text).not.toMatch(/roster|not listed|adopt|named by/i)
    expect(e.text).toContain("Hello R. Whitmore,")
  })

  it("AT-6 RV-04: a re-sent request to a different evaluator renders for that person with the same template", () => {
    const a = build()
    const b = build({ evaluatorName: "Dr. R. Castellano", evaluatorEmail: "r.castellano@example.edu", roleLabel: "Clinical faculty" })
    expect(b.to.email).not.toBe(a.to.email)
    expect(b.text.replace("Dr. R. Castellano", "A. Whitfield, RN").replace("Clinical faculty", "Preceptor")).toBe(a.text)
  })
})

describe("OD-17 OD-18 AR-06 what the email never says", () => {
  it("AT-8: no score, count, progress or achievement status anywhere", () => {
    const e = build()
    for (const part of [e.subject, e.text, e.html]) expect(part).not.toMatch(/achiev|progress|score|qualif|criteria|threshold|\d+ of \d+/i)
  })

  it("AT-14: says only that the program may review before it counts, and never that evidence counts", () => {
    const e = build()
    expect(e.text).toContain("Nursing program may review an evaluation before it counts.")
    expect(e.text).not.toMatch(/counts toward|will count|has counted/i)
  })

  it("AT-12: no validity or expiry sentence while OD-18 is undecided; a supplied line appears once", () => {
    const e = build()
    expect(e.text).not.toMatch(/expire|valid for|valid until|single use|one time|reuse/i)
    const f = build({ validityText: "This link stays valid until the evaluation is submitted." })
    expect(f.text.split("This link stays valid until the evaluation is submitted.").length - 1).toBe(1)
    expect(f.html).toContain("This link stays valid until the evaluation is submitted.")
  })

  it("AT-10: no reminder, escalation or follow-up wording (reminders are out of scope, REQ section 14)", () => {
    const e = build()
    expect(e.text).not.toMatch(/remind|follow up|still waiting|overdue|escalat/i)
  })

  it("the input type has no field for progress or status (compile-time seam)", () => {
    const keys = Object.keys(base)
    expect(keys.some((k) => /status|progress|score|achiev|count/i.test(k))).toBe(false)
  })
})

describe("AT-11 accessibility and trust of the HTML part", () => {
  const html = build().html

  it("has a language, real text, a descriptive button and the URL repeated as text", () => {
    expect(html).toContain('<html lang="en">')
    expect(html).toMatch(/<a [^>]*href="https:\/\/prism\.example\.test\/e\/tok-abc123"[^>]*>Open evaluation<\/a>/)
    expect(html).toMatch(/<a href="https:\/\/prism\.example\.test\/e\/tok-abc123">https:\/\/prism\.example\.test\/e\/tok-abc123<\/a>/)
  })

  it("needs no images, no tracking pixel, no attachment, no script", () => {
    expect(html).not.toMatch(/<img|<script|<iframe|<link |url\(|tracking|pixel/i)
  })

  it("is dark-mode safe and reflows: no hard-coded page background, a max width not a fixed one", () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark">')
    expect(html).not.toMatch(/body[^>]*background/i)
    expect(html).toContain("max-width:560px")
    expect(html).not.toMatch(/[^-]width:\s*\d{3,}px/)
  })

  it("uses no hex or rgb colour literals (one CSS named colour for the button)", () => {
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklch\(/i)
    expect(html).toContain(`background-color:${EMAIL_BUTTON_BACKGROUND}`)
  })

  it("the button colour has at least 4.5:1 contrast with white text", () => {
    const named: Record<string, [number, number, number]> = { mediumvioletred: [199, 21, 133] }
    const [r, g, b] = named[EMAIL_BUTTON_BACKGROUND]
    const lin = (v: number) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
    expect(1.05 / (lum + 0.05)).toBeGreaterThanOrEqual(4.5)
  })

  it("the plain-text part is a first-class alternative with the same sentences", () => {
    const e = build()
    for (const s of ["What to expect", "After you submit", "If you are not the right person to evaluate Olivia Martin", "Thank you,", "Nursing program via Prism"]) {
      expect(e.text).toContain(s)
      expect(e.html).toContain(s)
    }
  })
})

describe("robustness", () => {
  it("escapes markup in names and keeps non-ASCII text", () => {
    const e = build({ studentName: "Zoë <b>O'Brien</b> & Co", skillNames: ["Soin <script>x</script>"], evaluatorName: "Dr. Müller" })
    expect(e.html).not.toContain("<script>")
    expect(e.html).not.toContain("<b>O'Brien</b>")
    expect(e.html).toContain("Zoë &lt;b&gt;O'Brien&lt;/b&gt; &amp; Co")
    expect(e.text).toContain("Zoë <b>O'Brien</b> & Co")
    expect(e.text).toContain("Hello Dr. Müller,")
  })

  it("the sender has a display name from the program and no invented address (infrastructure owner decides)", () => {
    const e = build()
    expect(e.from).toEqual({ displayName: "Nursing program via Prism", address: null })
  })

  it("is a pure function: same input, same output", () => {
    expect(build()).toEqual(build())
  })
})
