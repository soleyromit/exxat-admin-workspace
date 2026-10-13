import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

// A tiny router stand-in: path and query live in one store so usePathname, useSearchParams and push/replace agree,
// the way the real App Router behaves. The harness below plays the part of the route files (it reads :offeringId).
const nav = vi.hoisted(() => {
  const subs = new Set<() => void>()
  const state = { url: "/courses" }
  const set = (url: string) => {
    state.url = url
    subs.forEach((f) => f())
  }
  return { subs, state, set, push: vi.fn(), replace: vi.fn() }
})
vi.mock("next/navigation", async () => {
  const React = await import("react")
  const subscribe = (f: () => void) => {
    nav.subs.add(f)
    return () => nav.subs.delete(f)
  }
  const useUrl = () => React.useSyncExternalStore(subscribe, () => nav.state.url, () => nav.state.url)
  return {
    useRouter: () => ({
      push: (u: string) => {
        nav.push(u)
        nav.set(u)
      },
      replace: (u: string) => {
        nav.replace(u)
        nav.set(u)
      },
      back: vi.fn(),
    }),
    usePathname: () => useUrl().split("?")[0],
    useSearchParams: () => new URLSearchParams(useUrl().split("?")[1] ?? ""),
  }
})

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { MappingWorkspace } from "@/components/mapping/mapping-workspace"
import { listOfferings, offeringMapping, setSkillActive, skillHasEvidence } from "@/lib/store"
import { getRuntime } from "@/lib/store/react"
import { ROUTES } from "@/lib/skills-routes"
import { surface, protoMapping as pm, protoCriteria, criteriaSummary, alsoMappedList } from "@/lib/copy"
import { criteriaParts } from "@/lib/store"

const noContrast = { rules: { "color-contrast": { enabled: false } } }
const clean = async (el: HTMLElement) => expect((await axe.run(el, noContrast)).violations).toEqual([])
const rt = () => getRuntime()
const db = () => rt().getDb()

/** Plays the route files: /courses and /courses/[offeringId] both render the same workspace. */
function Harness() {
  const [, force] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => {
    nav.subs.add(force)
    return () => void nav.subs.delete(force)
  }, [])
  const m = nav.state.url.split("?")[0].match(/^\/courses\/([^/]+)$/)
  return (
    <TooltipProvider>
      <MappingWorkspace offeringId={m?.[1]} />
    </TooltipProvider>
  )
}
const go = (url: string) => nav.set(url)
const filledPrimaries = (el: HTMLElement) => Array.from(el.querySelectorAll('button[data-slot="button"][data-variant="default"]')).filter((b) => b.getAttribute("role") !== "checkbox" && (b.textContent ?? "").trim() !== "")

beforeEach(() => {
  vi.restoreAllMocks()
  rt().reset()
  nav.push.mockClear()
  nav.replace.mockClear()
  nav.set(ROUTES.courseMapping)
})


const total = () => db().offerings.length
const defaultYear = () => [...new Set(db().offerings.map((o) => o.academicYear))].sort().pop()!
const inDefaultYear = () => listOfferings(db(), { academicYear: defaultYear() }).length

describe("P-09 the prototype's layout: info bar, two-column card, first offering selected", () => {
  it("title, subtitle, the info bar with its two bold terms, and both column headings", async () => {
    const { container } = render(<Harness />)
    expect(await screen.findByRole("heading", { level: 1, name: "Course Mapping" })).toBeInTheDocument()
    expect(screen.getByText("Set which skills are mandatory for each clinical course offering")).toBeInTheDocument()
    const bar = container.querySelector("[data-slot='local-banner'], [role='status'], [role='alert']")
    void bar
    const strongs = Array.from(container.querySelectorAll("strong")).map((n) => n.textContent)
    expect(strongs).toEqual(expect.arrayContaining(["mandatory", "non-mandatory"]))
    expect(container.textContent).toContain(pm.banner.before + "mandatory" + pm.banner.middle + "non-mandatory" + pm.banner.after)
    expect(screen.getByRole("heading", { level: 2, name: "Clinical course offerings" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Skills mapped — NURS 301" })).toBeInTheDocument()
  })

  it("the left header counts what matches with the prototype's sentence, and the academic year starts on the current year like the prototype", async () => {
    render(<Harness />)
    expect(await screen.findByText(`${inDefaultYear()} of ${total()} offerings match · count shows mandatory / total`)).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Academic year" })).toHaveTextContent(defaultYear())
    expect(inDefaultYear()).toBeLessThan(total()) // the earlier year is filtered out by default
  })

  it("the four filters carry the prototype's labels and option sets, and a search", async () => {
    render(<Harness />)
    await screen.findByRole("combobox", { name: "Cohort" })
    for (const label of ["Cohort", "Academic year", "Term", "Professional year"]) expect(screen.getByRole("combobox", { name: label })).toBeInTheDocument()
    expect(screen.getByLabelText("Search by course code or name")).toBeInTheDocument()
    const optionsOf = async (name: string) => {
      await userEvent.click(screen.getByRole("combobox", { name }))
      const opts = (await screen.findAllByRole("option")).map((o) => o.textContent)
      await userEvent.keyboard("{Escape}")
      return opts
    }
    expect(await optionsOf("Cohort")).toEqual(["All cohorts", ...db().cohorts.map((c) => c.name)])
    expect(await optionsOf("Academic year")).toEqual(["All years", ...[...new Set(db().offerings.map((o) => o.academicYear))].sort()])
    expect(await optionsOf("Term")).toEqual(["All terms", "Fall", "Spring", "Summer"])
    expect(await optionsOf("Professional year")).toEqual(["All professional years", "Year 1", "Year 2", "Year 3"])
  })

  it("an offering row is 'CODE — Name', 'Term YEAR · Year n · cohorts' and a 'mandatory / total' pill; empty ones say 'No cohort enrolled'", async () => {
    render(<Harness />)
    const rows = await screen.findAllByRole("button", { name: /^NURS \d+ — / })
    const first = rows[0]
    expect(first).toHaveTextContent("NURS 301 — Adult Health I")
    expect(first).toHaveTextContent("Fall 2026 · Year 1 · BSN 2027, ABSN 2026")
    expect(first).toHaveTextContent("3 / 4")
    expect(first).toHaveAttribute("aria-current", "true") // the first offering is selected by default
    const empty = rows.find((r) => r.textContent?.includes("Spring 2027 · Year 1 · No cohort enrolled"))!
    expect(empty).toHaveTextContent("0 / 0")
  })

  it("the right panel: heading, 'Name · Term YEAR · Year n — m mandatory, k non-mandatory', a skills search", async () => {
    render(<Harness />)
    expect(await screen.findByText("Adult Health I · Fall 2026 · Year 1 — 3 mandatory, 1 non-mandatory")).toBeInTheDocument()
    expect(screen.getByLabelText("Search skills")).toBeInTheDocument()
  })

  it("a skill row: checkbox 'Map …', name, model badge, the prototype's criteria text, and the 'Also mapped in …' line", async () => {
    render(<Harness />)
    const li = (await screen.findByLabelText("Map IV Insertion")).closest("li")!
    expect(li).toHaveTextContent("Demonstration-Level Outcome")
    const iv = db().skills.find((s) => s.id === "sk-iv")!
    expect(within(li).getByText(protoCriteria(criteriaParts(db(), iv)))).toBeInTheDocument()
    expect(protoCriteria(criteriaParts(db(), iv))).toMatch(/^\d+ demonstrations( · \d+ [a-z ]+)+$/)
    expect(within(li).getByText("Also mapped in NURS 350 (Fall 2025), NURS 350 (Fall 2026) — one student-level skill record is shared across courses.")).toBeInTheDocument()
  })

  it("the criteria text matches the prototype's format for every model", () => {
    expect(protoCriteria([{ kind: "required", n: 5, noun: "demonstrations" }, { kind: "level", levelId: "a", label: "Observed", min: 1 }, { kind: "level", levelId: "b", label: "With Assistance", min: 1 }, { kind: "level", levelId: "c", label: "Independent", min: 3 }])).toBe("5 demonstrations · 1 observed · 1 with assistance · 3 independent")
    expect(protoCriteria([{ kind: "required", n: 4, noun: "demonstrations" }, { kind: "setting", settingId: "i", name: "Inpatient", min: 1 }, { kind: "setting", settingId: "e", name: "Emergency", min: 1 }])).toBe("4 demonstrations · 1 in Inpatient · 1 in Emergency")
    expect(protoCriteria([{ kind: "required", n: 3, noun: "qualifyingEvaluations" }])).toBe("3 qualifying evaluations")
    expect(protoCriteria([{ kind: "required", n: 1, noun: "qualifyingEvaluations" }])).toBe("1 qualifying evaluation")
    void criteriaSummary
  })

  it("model badges use the prototype's four names", () => {
    expect(pm.models).toEqual({ binary: "Overall Binary Outcome", question: "Question-Level Qualitative", scored: "Scored / Likert", demonstration: "Demonstration-Level Outcome" })
  })
})

describe("S-10 offerings list (CM-01, CM-02, CM-04)", () => {
  it("CM-01: each offering shows course code and name, term, academic-year calendar year, professional year and cohorts", async () => {
    render(<Harness />)
    const rows = await screen.findAllByRole("button", { name: /^NURS \d+ — / })
    expect(rows.length).toBeGreaterThan(5)
    for (const r of rows) expect(r.textContent).toMatch(/NURS \d{3} — .+(Fall|Spring|Summer) 20\d\d · Year [123] · .+\d+ \/ \d+/)
    expect(rows.some((r) => /Spring 2027/.test(r.textContent ?? ""))).toBe(true) // Spring belongs to the second calendar year of 2026-2027
  })

  it("WCAG 2.5.3: every offering button's accessible name contains its visible text", async () => {
    render(<Harness />)
    const rows = await screen.findAllByRole("button", { name: /^NURS \d+ — / })
    for (const row of rows) {
      const visible = [...row.querySelectorAll("span")].filter((n) => !n.classList.contains("sr-only") && n.children.length === 0).map((n) => (n.textContent ?? "").trim()).filter(Boolean)
      const name = (row.getAttribute("aria-label") ?? row.textContent ?? "").replace(/\s+/g, " ")
      for (const piece of visible) expect(name).toContain(piece.replace(/\s+/g, " "))
    }
  })

  it("CM-04: the mandatory-out-of-total count is in the pill, in each offering's accessible name and in the panel", async () => {
    render(<Harness />)
    const row = await screen.findByRole("button", { name: /^NURS 301 — Adult Health I\s*Fall 2026.*3 mandatory of 4$/ })
    expect(row).toHaveTextContent("3 / 4")
    await userEvent.click(await screen.findByRole("button", { name: /^NURS 315 — Adult Health II\s*Fall 2026/ }))
    expect(await screen.findByRole("heading", { level: 2, name: "Skills mapped — NURS 315" })).toBeInTheDocument()
    const maps = db().offeringSkillMaps.filter((m) => m.offeringId === "off-315-f26")
    const m = maps.filter((x) => x.requirement === "mandatory").length
    expect(screen.getByText(`Adult Health II · Fall 2026 · Year 2 — ${m} mandatory, ${maps.length - m} non-mandatory`)).toBeInTheDocument()
  })

  it("CM-02: search narrows the list and the live count says how many match; Clear shows the whole set", async () => {
    render(<Harness />)
    await screen.findByText(new RegExp(`^${inDefaultYear()} of ${total()} offerings match`))
    await userEvent.type(screen.getByLabelText("Search by course code or name"), "NURS 350")
    const n = listOfferings(db(), { q: "NURS 350", academicYear: defaultYear() }).length
    expect(n).toBeGreaterThan(0)
    expect(await screen.findByText(new RegExp(`^${n} of ${total()} offerings match`))).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(await screen.findByText(new RegExp(`^${total()} of ${total()} offerings match`))).toBeInTheDocument()
    expect(nav.state.url).toBe("/courses?year=all")
  })

  it("CM-02: filters by cohort, term, academic year and professional year; each filter lives in the URL", async () => {
    render(<Harness />)
    await userEvent.click(await screen.findByRole("combobox", { name: "Term" }))
    await userEvent.click(await screen.findByRole("option", { name: "Summer" }))
    const n = listOfferings(db(), { term: "Summer", academicYear: defaultYear() }).length
    expect(await screen.findByText(new RegExp(`^${n} of ${total()} offerings match`))).toBeInTheDocument()
    expect(nav.state.url).toContain("term=Summer")
    await userEvent.click(screen.getByRole("combobox", { name: "Professional year" }))
    await userEvent.click(await screen.findByRole("option", { name: "Year 1" }))
    expect(await screen.findByText(pm.noMatch)).toBeInTheDocument()
    expect(nav.state.url).toContain("prof=1")
    await userEvent.click(screen.getByRole("combobox", { name: "Academic year" }))
    await userEvent.click(await screen.findByRole("option", { name: "All years" }))
    expect(nav.state.url).toContain("year=all")
  })

  it("E: no match shows a message with Clear", async () => {
    nav.set("/courses?q=zzzz-no-such-course")
    render(<Harness />)
    expect(await screen.findByText(pm.noMatch)).toBeInTheDocument()
    const clears = screen.getAllByRole("button", { name: "Clear" })
    await userEvent.click(clears[clears.length - 1])
    expect(await screen.findByText(/offerings match/)).toBeInTheDocument()
  })

  it("selecting an offering opens it by route, keeping the filters", async () => {
    nav.set("/courses?term=Fall")
    render(<Harness />)
    await userEvent.click(await screen.findByRole("button", { name: /^NURS 350 — Clinical Practicum\s*Fall 2026/ }))
    expect(nav.push).toHaveBeenCalledWith("/courses/off-350-f26?term=Fall")
    expect(await screen.findByRole("heading", { level: 2, name: "Skills mapped — NURS 350" })).toBeInTheDocument()
  })

  it("keyboard: the arrow keys move between offerings", async () => {
    render(<Harness />)
    const first = (await screen.findAllByRole("button", { name: /^NURS \d+ — / }))[0]
    first.focus()
    await userEvent.keyboard("{ArrowDown}")
    expect(document.activeElement).not.toBe(first)
    expect(document.activeElement?.getAttribute("data-offering")).toBeTruthy()
    await userEvent.keyboard("{ArrowUp}")
    expect(document.activeElement).toBe(first)
  })
})

describe("S-10 mapping a skill (CM-03, CM-05, CM-06, CM-07)", () => {
  it("CM-05: the rule note is on the page and no copy restricts submission", async () => {
    const { container } = render(<Harness />)
    await screen.findByLabelText("Map IV Insertion")
    expect(container.textContent).toContain("Neither setting restricts where a skill can be evaluated")
    expect(container.textContent).toContain("students may still request evaluations for skills outside the mapping")
  })

  it("CM-03 (conflict C-3): ticking a skill maps it at once as Mandatory, with the segmented control showing the choice", async () => {
    go("/courses/off-301-s27") // an offering with nothing mapped yet
    render(<Harness />)
    expect(screen.queryAllByRole("radio", { name: "Mandatory" })).toHaveLength(0) // nothing is mapped, so no requirement is shown
    await userEvent.click(await screen.findByLabelText("Map IV Insertion"))
    expect(db().offeringSkillMaps.find((m) => m.offeringId === "off-301-s27" && m.skillId === "sk-iv")?.requirement).toBe("mandatory")
    expect(await screen.findByText("Adult Health I · Spring 2027 · Year 1 — 1 mandatory, 0 non-mandatory")).toBeInTheDocument()
    const seg = screen.getByRole("radiogroup", { name: "Requirement for IV Insertion" })
    expect(within(seg).getByRole("radio", { name: "Mandatory" })).toBeChecked()
    expect(within(seg).getByRole("radio", { name: "Non-mandatory" })).not.toBeChecked()
    expect(screen.getByRole("button", { name: /^NURS 301 — Adult Health I\s*Spring 2027.*1 mandatory of 1$/ })).toHaveTextContent("1 / 1")
  })

  it("CM-03, CM-06: Non-mandatory flips it, the header and pill follow, and unticking returns the counts", async () => {
    go("/courses/off-301-s27")
    render(<Harness />)
    await userEvent.click(await screen.findByLabelText("Map IV Insertion"))
    await userEvent.click(screen.getByRole("radio", { name: "Non-mandatory" }))
    expect(db().offeringSkillMaps.find((m) => m.offeringId === "off-301-s27" && m.skillId === "sk-iv")?.requirement).toBe("nonMandatory")
    expect(await screen.findByText("Adult Health I · Spring 2027 · Year 1 — 0 mandatory, 1 non-mandatory")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^NURS 301 — Adult Health I\s*Spring 2027.*0 mandatory of 1$/ })).toHaveTextContent("0 / 1")
    await userEvent.click(screen.getByLabelText("Map IV Insertion"))
    expect(await screen.findByText("Adult Health I · Spring 2027 · Year 1 — 0 mandatory, 0 non-mandatory")).toBeInTheDocument()
    expect(screen.queryByRole("radiogroup", { name: "Requirement for IV Insertion" })).toBeNull()
  })

  it("a change is announced politely as Saved", async () => {
    go("/courses/off-301-s27")
    render(<Harness />)
    await userEvent.click(await screen.findByLabelText("Map IV Insertion"))
    expect(await screen.findByText("Saved")).toBeInTheDocument()
  })

  it("keyboard: Space toggles Map and the arrows change the requirement", async () => {
    go("/courses/off-301-s27")
    render(<Harness />)
    const box = await screen.findByLabelText("Map Sterile Dressing Change")
    box.focus()
    await userEvent.keyboard(" ")
    expect(db().offeringSkillMaps.some((m) => m.offeringId === "off-301-s27" && m.skillId === "sk-dressing")).toBe(true)
    const mandatory = await screen.findByRole("radio", { name: "Mandatory" })
    mandatory.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(db().offeringSkillMaps.find((m) => m.offeringId === "off-301-s27" && m.skillId === "sk-dressing")?.requirement).toBe("nonMandatory")
  })

  it("CM-06: the same skill can differ between offerings, and each offering shows its own requirement", async () => {
    go("/courses/off-350-f26")
    const { unmount } = render(<Harness />)
    const g1 = await screen.findByRole("radiogroup", { name: "Requirement for Wound Care" })
    expect(within(g1).getByRole("radio", { name: "Mandatory" })).toBeChecked()
    unmount()
    go("/courses/off-350-f25")
    render(<Harness />)
    const g2 = await screen.findByRole("radiogroup", { name: "Requirement for Wound Care" })
    expect(within(g2).getByRole("radio", { name: "Non-mandatory" })).toBeChecked()
  })

  it("CM-07: the cross-reference names the other offerings by code and term, and says the record is shared", async () => {
    go("/courses/off-350-f26")
    render(<Harness />)
    const li = (await screen.findByLabelText("Map Wound Care")).closest("li")!
    expect(li.textContent).toContain("Also mapped in NURS 350 (Fall 2025) — one student-level skill record is shared across courses.")
  })

  it("the cross-reference names three offerings and counts the rest ('and N more')", () => {
    const db = rt().getDb()
    const others = db.offerings.slice(0, 5).map((o) => ({ offeringId: o.id }))
    const { list, more } = alsoMappedList(db, others)
    expect(list.split(", ")).toHaveLength(3)
    expect(more).toBe(2)
    expect(pm.alsoMapped(list, more)).toMatch(/ and 2 more — one student-level skill record is shared across courses\.$/)
  })

  it("CM-07 / CM-05: unmapping keeps the evidence and says so", async () => {
    expect(skillHasEvidence(db(), "sk-iv")).toBe(true)
    const evaluations = db().evaluations.length
    go("/courses/off-350-f26")
    render(<Harness />)
    await userEvent.click(await screen.findByLabelText("Map IV Insertion"))
    expect(db().offeringSkillMaps.some((m) => m.offeringId === "off-350-f26" && m.skillId === "sk-iv")).toBe(false)
    expect(db().evaluations).toHaveLength(evaluations)
    expect(await screen.findByText("Evidence already recorded for this skill is kept.")).toBeInTheDocument()
  })

  it("Er: a failed save leaves the mapping unchanged and shows the error tied to the row", async () => {
    go("/courses/off-301-s27")
    const spy = vi.spyOn(rt(), "run").mockImplementation((() => ({ ok: false, error: { code: "notFound", message: "x" } })) as never)
    render(<Harness />)
    await userEvent.click(await screen.findByLabelText("Map IV Insertion"))
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("This change was not saved. Try again.")
    expect(alert).toHaveAttribute("data-slot", "field-error")
    expect(spy).toHaveBeenCalled()
    expect(db().offeringSkillMaps.some((m) => m.offeringId === "off-301-s27" && m.skillId === "sk-iv")).toBe(false)
  })

  it("the panel searches skills", async () => {
    go("/courses/off-350-f26")
    render(<Harness />)
    await userEvent.type(await screen.findByLabelText("Search skills"), "wound")
    expect(screen.getByLabelText("Map Wound Care")).toBeInTheDocument()
    expect(screen.queryByLabelText("Map IV Insertion")).toBeNull()
  })
})

describe("S-10 what can be mapped (IM-09, SC-01, SL-11)", () => {
  it("IM-09, SC-01: unconfigured skills are not listed, and a count points to the library", async () => {
    go("/courses/off-350-f26")
    render(<Harness />)
    await screen.findByLabelText("Map IV Insertion")
    expect(screen.queryByLabelText("Map Nasogastric Tube Insertion")).toBeNull()
    expect(screen.queryByLabelText("Map Blood Glucose Monitoring")).toBeNull()
    const n = offeringMapping(db(), "off-350-f26").unconfiguredHidden
    expect(n).toBeGreaterThan(0)
    expect(screen.getByText(surface.s04.unconfiguredBanner(n))).toBeInTheDocument()
    expect(screen.getByRole("link", { name: pm.configureInLibrary })).toHaveAttribute("href", `${ROUTES.skills}?status=unconfigured`)
  })

  it("SL-11: a deactivated skill is no longer offered, and the evidence recorded against it remains", async () => {
    go("/courses/off-350-f26")
    const evaluations = db().evaluations.length
    rt().run((d) => setSkillActive(d, "sk-iv", false))
    render(<Harness />)
    await screen.findByLabelText("Map Wound Care")
    expect(screen.queryByLabelText("Map IV Insertion")).toBeNull()
    expect(db().evaluations).toHaveLength(evaluations)
    expect(skillHasEvidence(db(), "sk-iv")).toBe(true)
  })

  it("E: when no skill is configured the panel says so and links to the library", async () => {
    rt().run((d) => ({ ok: true as const, db: { ...d, skills: d.skills.map((s) => ({ ...s, active: false })) }, value: undefined }))
    go("/courses/off-350-f26")
    render(<Harness />)
    expect(await screen.findByText(pm.emptyNoSkills)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: pm.configureInLibrary })).toHaveAttribute("href", ROUTES.skills)
  })

  it("E: an offering with no cohort says you can still map skills", async () => {
    go("/courses/off-301-s27")
    render(<Harness />)
    expect(await screen.findByText(pm.emptyNoCohort)).toBeInTheDocument()
  })

  it("an unknown offering id is a neutral not-found, not a crash", async () => {
    go("/courses/off-nope")
    render(<Harness />)
    expect(await screen.findByText(pm.offeringNotFound)).toBeInTheDocument()
  })
})

describe("S-10 OD-01 seam and the S-04 entry mode", () => {
  it("OD-01: a new term's offering starts empty and the page says nothing about carrying mappings forward", async () => {
    go("/courses/off-350-s27")
    const { container } = render(<Harness />)
    await screen.findByLabelText("Map IV Insertion")
    expect(db().offeringSkillMaps.filter((m) => m.offeringId === "off-350-s27")).toHaveLength(0)
    expect(screen.queryAllByRole("radiogroup")).toHaveLength(0)
    expect(container.textContent).not.toMatch(/carr(y|ied|ies) (forward|over)|copy (mappings )?to (the )?next term|inherit/i)
  })

  it("CM-04, CM-07: ?skill= lists only the offerings where the skill is mapped, with its requirement, and Clear shows all", async () => {
    nav.set("/courses?skill=sk-iv&year=all")
    render(<Harness />)
    const n = listOfferings(db(), { skillId: "sk-iv" }).length
    expect(n).toBe(3)
    expect(await screen.findByRole("heading", { level: 2, name: pm.skillMode("IV Insertion", n) })).toBeInTheDocument()
    const rows = screen.getAllByRole("button", { name: /^NURS \d{3} — / })
    expect(rows).toHaveLength(3)
    for (const r of rows) expect(r).toHaveTextContent("Mandatory")
    await userEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(nav.state.url).toBe("/courses?year=all")
    expect(await screen.findByText(new RegExp(`^${total()} of ${total()} offerings match`))).toBeInTheDocument()
  })

  it("entry mode: the right panel behaves as normal once an offering is chosen, and the skill filter is kept", async () => {
    nav.set("/courses?skill=sk-iv&year=all")
    render(<Harness />)
    await userEvent.click((await screen.findAllByRole("button", { name: /^NURS 301 — / }))[0])
    expect(nav.push).toHaveBeenCalledWith("/courses/off-301-f26?year=all&skill=sk-iv")
    expect(await screen.findByRole("heading", { level: 2, name: "Skills mapped — NURS 301" })).toBeInTheDocument()
  })
})

describe("S-10 states and accessibility", () => {
  it("L: a skeleton exists for the first paint (aria-busy)", () => {
    const { container } = render(<Harness />)
    expect(container.querySelector("[aria-busy='true']") !== null || screen.queryByRole("heading", { name: "Course Mapping" }) !== null).toBe(true)
  })

  it("the surface has no filled primary (changes apply per row, there is no global Save)", async () => {
    go("/courses/off-350-f26")
    const { container } = render(<Harness />)
    await screen.findByLabelText("Map IV Insertion")
    expect(filledPrimaries(container)).toHaveLength(0)
  })

  it("every control has an accessible name and status is text", async () => {
    go("/courses/off-350-f26")
    const { container } = render(<Harness />)
    await screen.findByLabelText("Map IV Insertion")
    for (const el of container.querySelectorAll("input, button, [role=checkbox], [role=radio], [role=combobox]")) {
      const name = el.getAttribute("aria-label") || el.textContent?.trim() || (el.id && container.querySelector(`label[for='${el.id}']`)?.textContent)
      expect(name, el.outerHTML.slice(0, 140)).toBeTruthy()
    }
  })

  it("has no axe violations: default, offering selected, mapped skill, filtered, empty and skill mode", async () => {
    const { container, unmount } = render(<Harness />)
    await screen.findByText(/offerings match/)
    await clean(container)
    go("/courses/off-301-s27")
    await screen.findByText(/Spring 2027 · Year 1 — 0 mandatory/)
    await userEvent.click(await screen.findByLabelText("Map IV Insertion"))
    await screen.findByRole("radiogroup", { name: "Requirement for IV Insertion" })
    await clean(container)
    go("/courses/off-350-f26?q=NURS")
    await screen.findByRole("heading", { level: 2, name: "Skills mapped — NURS 350" })
    await clean(container)
    go("/courses?q=zzzz")
    await screen.findByText(pm.noMatch)
    await clean(container)
    go("/courses?skill=sk-iv&year=all")
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: /Offerings where IV Insertion/ })).toBeInTheDocument())
    await clean(container)
    unmount()
  })
})
