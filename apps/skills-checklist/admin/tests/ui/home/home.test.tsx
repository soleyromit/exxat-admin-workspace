import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { home } from "@/lib/copy/home"
import { homeSummary } from "@/lib/home/derive"
import { HOME_LINKS } from "@/lib/home/links"
import { PREVIEW_ROUTES, ROUTES } from "@/lib/skills-routes"
import * as React from "react"
import { render } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { HomeClient } from "@/components/home/home-client"
import { HomeSkeleton } from "@/components/home/home-view"
import Page from "@/app/(shell)/(admin)/home/page"
import { db, expectNoAxeViolations, libraryOf, renderHome } from "./harness"

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ replace: vi.fn() }) }))
const fail = vi.hoisted(() => ({ on: false }))
vi.mock("@/lib/home/derive", async (orig) => {
  const m = await orig<typeof import("@/lib/home/derive")>()
  return { ...m, homeSummary: (...a: Parameters<typeof m.homeSummary>) => { if (fail.on) throw new Error("store read failed"); return m.homeSummary(...a) } }
})

const href = (el: HTMLElement) => el.closest("a")?.getAttribute("href")
const link = (name: string | RegExp) => screen.getByRole("link", { name })

describe("Loading (L)", () => {
  it("renders a skeleton in the final layout with an announced status and no data", () => {
    renderHome({ status: "loading" })
    expect(screen.getByTestId("home-skeleton")).toBeInTheDocument()
    expect(screen.getAllByRole("status")).toHaveLength(1)
    expect(screen.getAllByText(home.loading).length).toBeGreaterThan(0)
    expect(screen.queryByTestId("setup-card")).toBeNull()
    expect(screen.getByRole("heading", { level: 1, name: "Home" })).toBeInTheDocument()
  })
})

describe("Error (Er)", () => {
  it("shows the error banner with retry, every figure reads Not available, never a stale or zero value", async () => {
    const onRetry = vi.fn()
    renderHome({ status: "error", onRetry })
    expect(screen.getByText(home.error)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: home.buttons.retry }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText(home.unavailable).length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByTestId("setup-card")).toBeNull()
    // the page is not blanked: heading, attention region and the Attainment pointer are still there
    expect(screen.getByRole("heading", { level: 2, name: home.attention.heading })).toBeInTheDocument()
    expect(link(home.buttons.openAttainment)).toHaveAttribute("href", ROUTES.attainment)
  })
  it("a single failed row does not blank the page", () => {
    renderHome({ unavailable: ["lab"] })
    const rows = screen.getAllByTestId("attention-row")
    const lab = rows.find((r) => within(r).queryByText(home.attention.lab.label))!
    expect(within(lab).getByTestId("attention-count")).toHaveTextContent(home.unavailable)
    expect(screen.getByTestId("setup-card")).toBeInTheDocument()
    expect(rows.length).toBeGreaterThan(1)
  })
})

describe("First run (library empty)", () => {
  it("SL-01 / IM-01 / IM-12: no skill, category or tag is shown; both entry actions are offered once, with equal prominence", () => {
    renderHome({ scenario: "firstRun" })
    const imp = screen.getAllByRole("link", { name: home.actions.import })
    const add = screen.getAllByRole("link", { name: home.actions.add })
    expect(imp).toHaveLength(1)
    expect(add).toHaveLength(1)
    expect(imp[0].getAttribute("href")).toBe(ROUTES.import)
    expect(add[0].getAttribute("href")).toBe(ROUTES.skillNew)
    expect(imp[0].className).toBe(add[0].className)
    expect(screen.queryByText(/Category|Tag A|Sample skill|Wound|Catheter/i)).toBeNull()
    expect(screen.getByTestId("setup-headline")).toHaveTextContent(home.firstRunHeadline)
    expect(document.body.textContent).not.toMatch(/required|must/i)
  })
  it("steps 2 to 4 are disabled with a visible reason, not hidden", () => {
    renderHome({ scenario: "firstRun" })
    for (const n of [2, 3, 4]) {
      const step = screen.getByTestId(`setup-step-${n}`)
      expect(within(step).getByText(home.disabled.afterAdd)).toBeInTheDocument()
      expect(within(step).getByRole("button")).toBeDisabled()
    }
  })
  it("E: the attention list holds one quiet row, no counts and no KPI strip", () => {
    renderHome({ scenario: "firstRun" })
    expect(screen.getByRole("heading", { level: 3, name: home.attention.emptyFirstRun })).toBeInTheDocument()
    expect(screen.queryAllByTestId("attention-row")).toHaveLength(0)
    expect(screen.queryByTestId("glance")).toBeNull()
  })
})

describe("Partially set up", () => {
  const partial = () => libraryOf(120, 34)
  it("IM-10: headline counts the unconfigured skills, equals the library filter, and cannot be dismissed", () => {
    const d = partial()
    renderHome({ db: d })
    expect(screen.getByTestId("setup-headline")).toHaveTextContent("86 skills need configuration. 34 of 120 are configured.")
    expect(homeSummary(d).unconfigured).toBe(d.skills.filter((s) => s.model === null).length)
    const card = screen.getByTestId("setup-card")
    expect(within(card).queryByRole("button", { name: /dismiss|close|hide|skip/i })).toBeNull()
    expect(within(card).queryByRole("button", { name: home.buttons.reviewSetup })).toBeNull()
    expect(card).toHaveAttribute("data-open", "true")
  })
  it("IM-09: step 2 says unconfigured skills cannot be mapped or used, and none is in a mapped or active count", () => {
    const d = partial()
    renderHome({ db: d })
    expect(within(screen.getByTestId("setup-step-2")).getByText(/cannot be mapped to a course or used by students/)).toBeInTheDocument()
    const s = homeSummary(d)
    expect(s.configuredActive).toBe(34)
    expect(s.mapped + s.unmapped).toBe(s.configuredActive)
  })
  it("SC-01 / SC-02: Continue opens the first unconfigured skill's dialog, nothing is preselected and Home saves nothing", async () => {
    const d = partial()
    const before = JSON.stringify(d)
    renderHome({ db: d })
    const cont = link(home.aria.continue)
    expect(cont).toHaveAttribute("href", ROUTES.skillConfigure("sk-t34"))
    await userEvent.click(cont).catch(() => undefined)
    expect(JSON.stringify(d)).toBe(before)
    expect(d.skills[34].model).toBeNull()
  })
  it("IM-14: no bulk, kit or apply-to-many action is offered on Home", () => {
    renderHome({ db: partial() })
    expect(document.body.textContent).not.toMatch(/bulk|kit|apply (a )?model to/i)
  })
  it("step 4 is Recommended and never blocks; the unmapped row says students can still submit", () => {
    const d = libraryOf(14, 12)
    renderHome({ db: d })
    expect(within(screen.getByTestId("setup-step-4")).getByText(home.badges.recommended)).toBeInTheDocument()
    const row = screen.getAllByTestId("attention-row").find((r) => within(r).queryByText(home.attention.unmapped.label))!
    expect(within(row).getByTestId("attention-count")).toHaveTextContent("12")
    expect(within(row).getByText("Students can still submit them.")).toBeInTheDocument()
  })
})

describe("Ready (all configured)", () => {
  it("collapses the setup card to one line with Review setup, and the readiness sentence is plain text", async () => {
    renderHome({ scenario: "ready" })
    const card = screen.getByTestId("setup-card")
    expect(card).toHaveAttribute("data-open", "false")
    const n = homeSummary(db("ready")).configuredActive
    expect(screen.getByTestId("readiness")).toHaveTextContent(`${n} skills are configured and active. Students can submit evidence for them.`)
    expect(screen.getByRole("heading", { level: 2, name: /^All \d+ skills are configured\.$/ })).toBeInTheDocument()
    const toggle = screen.getByRole("button", { name: home.buttons.reviewSetup })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByTestId("setup-step-1")).toBeNull()
    await userEvent.click(toggle)
    expect(screen.getByRole("button", { name: home.buttons.hideSetup })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByTestId("setup-step-1")).toBeInTheDocument()
  })
  it("OD-15: no Go live or Activate control anywhere, in any state", async () => {
    for (const scenario of ["sample", "firstRun", "ready", "readyQuiet"] as const) {
      const { unmount } = renderHome({ scenario })
      expect(screen.queryByRole("button", { name: /go live|activate/i })).toBeNull()
      expect(screen.queryByRole("link", { name: /go live|activate/i })).toBeNull()
      unmount()
    }
  })
  it("IM-11: importing new unconfigured skills re-opens the card with the new count, no manual reset", () => {
    const d = libraryOf(120, 120)
    const first = renderHome({ db: d })
    expect(screen.getByTestId("setup-card")).toHaveAttribute("data-open", "false")
    first.unmount()
    const grown = libraryOf(130, 120)
    renderHome({ db: grown })
    expect(screen.getByTestId("setup-card")).toHaveAttribute("data-open", "true")
    expect(screen.getByTestId("setup-headline")).toHaveTextContent("10 skills need configuration")
  })
  it("E: the quiet steady state shows Nothing needs your attention with a link to Attainment", () => {
    renderHome({ scenario: "readyQuiet" })
    expect(screen.getByRole("heading", { level: 3, name: home.attention.emptyTitle })).toBeInTheDocument()
    expect(screen.queryAllByTestId("attention-row")).toHaveLength(0)
    expect(screen.getAllByRole("link", { name: home.buttons.openAttainment }).length).toBeGreaterThan(0)
  })
})

describe("Attention rows (derived from data)", () => {
  it("AR-01 / AR-06: the approvals row shows the queue count and links to the approval queue; the count is not in an achievement-implying figure", () => {
    const d = db("sample")
    const n = homeSummary(d).awaitingApproval
    expect(n).toBeGreaterThan(0)
    renderHome({ db: d })
    const row = screen.getAllByTestId("attention-row").find((r) => within(r).queryByText(home.attention.approvals.label))!
    expect(within(row).getByTestId("attention-count")).toHaveTextContent(String(n))
    expect(within(row).getByText(home.attention.approvals.reason)).toBeInTheDocument()
    expect(href(within(row).getByRole("link"))).toBe(ROUTES.reviews)
    // the approvals count appears once on Home, in Needs attention (not in the glance strip)
    expect(within(screen.getByTestId("glance")).queryByText("Awaiting approval")).toBeNull()
  })
  it("SC-15: no approval-enabled skill, no approvals row", () => {
    const d = db("sample")
    const noApproval = { ...d, skills: d.skills.map((s) => ({ ...s, requiresApproval: false })) }
    renderHome({ db: noApproval })
    expect(screen.queryByText(home.attention.approvals.label)).toBeNull()
  })
  it("SL-09: lab instructors named by students show the count and link to the roster; absent when none", () => {
    const d = db("sample")
    const n = d.namedLabInstructors.filter((x) => !x.adoptedAs).length
    expect(n).toBeGreaterThan(0)
    const first = renderHome({ db: d })
    const row = screen.getAllByTestId("attention-row").find((r) => within(r).queryByText(home.attention.lab.label))!
    expect(within(row).getByTestId("attention-count")).toHaveTextContent(String(n))
    expect(href(within(row).getByRole("link"))).toBe(HOME_LINKS.labInstructors)
    first.unmount()
    renderHome({ db: { ...d, namedLabInstructors: [] } })
    expect(screen.queryByText(home.attention.lab.label)).toBeNull()
  })
  it("SL-11: a deactivated skill leaves every count", () => {
    const d = libraryOf(10, 10)
    const before = homeSummary(d)
    const after = homeSummary({ ...d, skills: d.skills.map((s, i) => (i === 0 ? { ...s, active: false } : s)) })
    expect(after.total).toBe(before.total - 1)
    expect(after.configuredActive).toBe(before.configuredActive - 1)
    expect(after.unmapped).toBe(before.unmapped - 1)
    const un = homeSummary({ ...libraryOf(10, 4), skills: libraryOf(10, 4).skills.map((s, i) => (i === 9 ? { ...s, active: false } : s)) })
    expect(un.unconfigured).toBe(5)
  })
})

describe("Imports and unread lines", () => {
  it("IM-08: step 1 states the unread lines of the latest import and Review lines opens the import dialog", () => {
    renderHome({ scenario: "sample" })
    const step = screen.getByTestId("setup-step-1")
    expect(within(step).getByText(/1 line could not be read\./)).toBeInTheDocument()
    expect(href(within(step).getByRole("link", { name: home.buttons.reviewLines }))).toBe(ROUTES.import)
  })
  it("Su: the post-import reminder is a LocalBanner and dismissible", async () => {
    const onDismiss = vi.fn()
    renderHome({ imported: 3, onDismissImported: onDismiss })
    expect(screen.getByText("3 skills were added. They need configuration before they can be mapped or used.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /dismiss|close/i }))
    expect(onDismiss).toHaveBeenCalled()
  })
})

describe("Links, preview and attainment", () => {
  it("SC-19: Preview opens the student view, the evaluator view is one link away, and no checked state is tracked", () => {
    renderHome({ scenario: "sample" })
    const step = screen.getByTestId("setup-step-3")
    expect(href(within(step).getByRole("link", { name: home.aria.previewStudent }))).toBe(PREVIEW_ROUTES.student)
    expect(href(within(step).getByRole("link", { name: home.aria.previewEvaluator }))).toBe(PREVIEW_ROUTES.preceptor)
    expect(step.textContent).not.toMatch(/checked|viewed|reviewed/i)
  })
  it("RP-02: no student or per-skill attainment figure appears; Open Attainment links to Attainment", () => {
    const d = db("sample")
    renderHome({ db: d })
    for (const stu of d.students.slice(0, 5)) expect(document.body.textContent).not.toContain(stu.name)
    expect(document.body.textContent).not.toMatch(/achieved|not met|in progress \d|%|behind|bottom/i)
    expect(link(home.buttons.openAttainment)).toHaveAttribute("href", ROUTES.attainment)
  })
  it("CM-05: step 4 links to Course mapping and says students can still submit unmapped skills", () => {
    renderHome({ scenario: "sample" })
    const step = screen.getByTestId("setup-step-4")
    expect(within(step).getByText(home.steps.map.description)).toBeInTheDocument()
    expect(href(within(step).getByRole("link"))).toBe(ROUTES.courses)
  })
})

describe("Partial recalculation (P)", () => {
  it("figures read Updating inside a polite live region", () => {
    renderHome({ scenario: "ready", updating: true })
    expect(screen.getByRole("status")).toHaveTextContent(home.updating)
    expect(screen.getAllByText(home.updating).length).toBeGreaterThan(0)
  })
})

describe("Copy and hard stops", () => {
  const walk = (o: unknown, out: string[] = []): string[] => {
    if (typeof o === "string") out.push(o)
    else if (o && typeof o === "object") Object.values(o as Record<string, unknown>).forEach((x) => walk(x, out))
    return out
  }
  const statics = walk(home)
  const fns = [home.headline(86), home.headlineSub(34, 120), home.stepDetail.inLibrary(1), home.stepDetail.unread(2), home.stepDetail.configured(1, 2), home.stepDetail.offerings(0, 6), home.collapsed(120), home.readiness(34), home.imported(10)]

  it("voice: no em-dash, no exclamation mark, no time or ranking words, no accuracy claim, no requirement ids", () => {
    for (const s of [...statics, ...fns]) {
      expect(s, s).not.toMatch(/[—–!]/)
      expect(s, s).not.toMatch(/\b(overdue|due|stalled|behind|lagging|bottom|go live|great job|you're all set|skip)\b/i)
      expect(s, s).not.toMatch(/\bai\b|smart|automatically|accura|we found/i)
      expect(s, s).not.toMatch(/\b[A-Z]{2}-\d{2}\b|Sankalp|Aarti|Vishaka/)
    }
  })
  it("Home source has no raw button, hex or rgb literal, toast, progress component, red or Not-used word", () => {
    const files = [
      ...readdirSync(path.join(__dirname, "../../../components/home")).map((f) => path.join(__dirname, "../../../components/home", f)),
      path.join(__dirname, "../../../lib/home/derive.ts"),
      path.join(__dirname, "../../../lib/copy/home.ts"),
    ]
    for (const f of files) {
      const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
      expect(src, f).not.toMatch(new RegExp("<" + "button\\b"))
      expect(src, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
      expect(src, f).not.toMatch(/toast\(/)
      expect(src, f).not.toMatch(/<Progress\b|role="progressbar"|ProgressCell/)
      expect(src, f).not.toMatch(/text-red|bg-red|destructive|danger/)
      expect(src, f).not.toMatch(/[—–]/)
    }
  })
  it("no icon sits on an action button (icons only decorate status chips and the empty state)", () => {
    renderHome({ scenario: "sample" })
    for (const el of [...screen.getAllByRole("link"), ...screen.queryAllByRole("button")]) expect(el.querySelector("i.fa-light, i.fa-solid")).toBeNull()
    for (const i of document.querySelectorAll("i")) expect(i.getAttribute("aria-hidden")).toBe("true")
  })
  it("outline: one h1, setup card h2, attention h2, no skipped levels", () => {
    renderHome({ scenario: "sample" })
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([home.setupTitle, home.attention.heading])
  })
})

describe("Accessibility (axe) per state", () => {
  const states: Array<[string, Parameters<typeof renderHome>[0]]> = [
    ["loading", { status: "loading" }],
    ["error", { status: "error", onRetry: () => undefined }],
    ["first run", { scenario: "firstRun" }],
    ["partially set up", { scenario: "sample" }],
    ["ready (collapsed)", { scenario: "ready" }],
    ["ready and quiet", { scenario: "readyQuiet" }],
    ["updating", { scenario: "ready", updating: true }],
  ]
  for (const [name, props] of states) {
    it(`${name}: no axe violations`, async () => {
      renderHome(props)
      await expectNoAxeViolations()
    })
  }
  it("ready with setup reviewed (expanded): no axe violations", async () => {
    renderHome({ scenario: "ready" })
    await userEvent.click(screen.getByRole("button", { name: home.buttons.reviewSetup }))
    await expectNoAxeViolations()
  })
})

describe("Production error path and page fallback", () => {
  it("a thrown load shows the error banner with a title and a retry button, and retry recovers", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    fail.on = true
    render(<TooltipProvider><main><HomeClient /></main></TooltipProvider>)
    expect(await screen.findByText(home.errorTitle)).toBeInTheDocument()
    expect(screen.getByText(home.error)).toBeInTheDocument()
    const retry = screen.getByRole("button", { name: home.buttons.retry })
    fail.on = false
    await userEvent.click(retry)
    expect(screen.queryByText(home.errorTitle)).toBeNull()
    expect(await screen.findByTestId("setup-card")).toBeInTheDocument()
    err.mockRestore()
  })
  it("the page-level Suspense fallback is the busy skeleton", () => {
    const el = Page() as React.ReactElement<{ fallback: React.ReactElement }>
    expect(el.props.fallback.type).toBe(HomeSkeleton)
    render(el.props.fallback)
    expect(screen.getByTestId("home-skeleton")).toHaveAttribute("aria-busy", "true")
  })
})
