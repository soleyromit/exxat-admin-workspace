import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

import { BulletMeter, CumulativeLine, DotStrip, HeatGrid, SegmentedDots, StackedBar, Waffle } from "@/components/v2/viz"

const noContrast = { rules: { "color-contrast": { enabled: false } } }
const clean = async (el: HTMLElement) => expect((await axe.run(el, noContrast)).violations).toEqual([])

describe("HeatGrid", () => {
  const columns = [{ id: "a", label: "IV start" }, { id: "b", label: "Wound care", sublabel: "Mandatory" }]
  const rows = [
    { id: "r1", label: "Maya Chen", cells: { a: "met", b: "met" } as const },
    { id: "r2", label: "Jon Ruiz", cells: { a: "notMet", b: "pending" } as const },
    { id: "r3", label: "Ana Lee", cells: { a: "notYet" } as const },
  ]
  it("names every cell with row, column and state word, and sorts fewest met first", async () => {
    const { container } = render(<HeatGrid caption="Students by skills" rowHeader="Student" columns={columns} rows={rows} />)
    expect(screen.getByRole("img", { name: "Jon Ruiz, IV start: Did not meet" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Jon Ruiz, Wound care: Waiting for review" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Ana Lee, Wound care: No evidence" })).toBeInTheDocument()
    const order = Array.from(container.querySelectorAll("[data-heat-row]")).map((r) => r.getAttribute("data-heat-row"))
    expect(order).toEqual(["r3", "r2", "r1"]) // 0,0,2 met; ties by name
    expect(container.querySelector("[data-scroll-hint]")).toHaveTextContent("Scroll sideways")
    await userEvent.click(screen.getByRole("button", { name: /Student/ }))
    expect(Array.from(container.querySelectorAll("[data-heat-row]")).map((r) => r.getAttribute("data-heat-row"))[0]).toBe("r1")
    await clean(container)
  })
  it("makes cells buttons when selectable", async () => {
    const onSel = vi.fn()
    render(<HeatGrid caption="x" rowHeader="Student" columns={columns} rows={rows} sortable={false} onCellSelect={onSel} />)
    await userEvent.click(screen.getByRole("button", { name: "Maya Chen, IV start: Met" }))
    expect(onSel).toHaveBeenCalledWith("r1", "a", "met")
  })
})

describe("StackedBar", () => {
  it("summarises the data in its accessible name and a hidden list", async () => {
    const { container } = render(<StackedBar label="Skills by level" unit="skill" segments={[{ id: "m", label: "Mandatory", value: 5 }, { id: "o", label: "Optional", value: 3 }, { id: "n", label: "Not expected", value: 1, hatched: true }]} />)
    expect(screen.getByRole("img", { name: "Skills by level: 5 Mandatory, 3 Optional, 1 Not expected, 9 skills in all" })).toBeInTheDocument()
    expect(screen.getByText("Mandatory: 5 skills").closest("ul")).toHaveClass("sr-only")
    await clean(container)
  })
})

describe("BulletMeter", () => {
  it("exposes value, minimum and pace as a meter", async () => {
    const { container } = render(<BulletMeter label="Wound care" value={6} required={8} pace={7} />)
    const m = screen.getByRole("meter", { name: "Wound care" })
    expect(m).toHaveAttribute("aria-valuetext", "Wound care: 6 counted, minimum 8, expected by now 7")
    expect(screen.getByText("6 of 8")).toBeInTheDocument()
    expect(container.querySelector("[data-viz=bullet-meter] .recharts-responsive-container")).not.toBeNull() // DS ChartContainer
    await clean(container)
  })
})

describe("Waffle", () => {
  it("summarises counts for the count form", async () => {
    const { container } = render(<Waffle unit="mandatory skill" counted={1} pending={2} total={5} />)
    expect(screen.getByRole("img", { name: "1 of 5 mandatory skills counted, 2 waiting for review, 2 still to do" })).toBeInTheDocument()
    expect(container.querySelectorAll("[data-square]")).toHaveLength(5)
    expect(container.querySelectorAll("[data-square=pending]")).toHaveLength(2)
    await clean(container)
  })
  it("names each square in the per-square form", async () => {
    const { container } = render(<Waffle unit="skill" squares={[{ state: "counted", label: "IV start" }, { state: "remaining", label: "Catheter" }]} />)
    const list = screen.getByRole("list", { name: /1 of 2 skills counted/ })
    expect(within(list).getByText("IV start: counted")).toBeInTheDocument()
    expect(within(list).getByText("Catheter: still to do")).toBeInTheDocument()
    await clean(container)
  })
})

describe("Waffle groups and custom words", () => {
  it("separates groups and uses custom state words", async () => {
    const sq = [{ state: "counted" as const }, { state: "counted" as const }, { state: "remaining" as const }, { state: "pending" as const }]
    const { container } = render(<Waffle unit="skill" squares={sq} groups={[2, 2]} stateWords={{ counted: "met", pending: "in progress", remaining: "not started" }} />)
    expect(container.querySelectorAll("[data-group-end]")).toHaveLength(1)
    expect(screen.getByRole("list", { name: "2 of 4 skills met, 1 in progress, 1 not started" })).toBeInTheDocument()
    expect(screen.getByText("skill 3: not started")).toBeInTheDocument()
    await clean(container)
  })
})

describe("StackedBar legend and HeatGrid cell text", () => {
  it("hides the legend but keeps the name", () => {
    const { container } = render(<StackedBar label="L" showLegend={false} segments={[{ id: "a", label: "A", value: 2 }]} />)
    expect(container.querySelector("ul[aria-hidden=true]")).toBeNull()
    expect(screen.getByRole("img", { name: /L: 2 A/ })).toBeInTheDocument()
  })
  it("shows cell text and keeps it in the accessible name", () => {
    render(<HeatGrid caption="c" rowHeader="Student" columns={[{ id: "a", label: "IV" }]} rows={[{ id: "r", label: "Maya", cells: { a: "pending" }, cellText: { a: "2/3" } }]} />)
    expect(screen.getByRole("img", { name: "Maya, IV: Waiting for review, 2/3" })).toBeInTheDocument()
    expect(screen.getByText("2/3")).toBeInTheDocument()
  })
})

describe("DotStrip", () => {
  it("labels every dot and flags those behind pace", async () => {
    const { container } = render(<DotStrip label="Collected against expected" pace={60} dots={[{ id: "a", label: "Maya", value: 80 }, { id: "b", label: "Jon", value: 30, flagged: true, note: "short by 2" }, { id: "c", label: "Ana", value: 32, flagged: true, note: "short by 2" }]} />)
    expect(screen.getByRole("group", { name: "Collected against expected: 3 people, 2 behind the expected 60%" })).toBeInTheDocument()
    expect(screen.getByText("Jon: 30%, behind pace, short by 2")).toBeInTheDocument() // sr-only list; the chart shows it in the tooltip
    expect(container.querySelector("[data-viz=dot-strip] .recharts-responsive-container")).not.toBeNull() // DS ChartContainer
    expect(screen.getByText("Expected by now (60%)")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
    await clean(container)
  })
})

describe("DotStrip empty", () => {
  it("shows a short message instead of an empty axis", () => {
    const { container } = render(<DotStrip label="x" dots={[]} />)
    expect(container.textContent).toBe("No students to show.")
    render(<DotStrip label="y" dots={[]} emptyText="Nobody yet." />)
    expect(screen.getByText("Nobody yet.")).toBeTruthy()
  })
})

describe("StackedBar and BulletMeter render through the DS chart", () => {
  it("mounts the DS ChartContainer and keeps values in text", () => {
    const { container } = render(<StackedBar label="Skills by level" unit="skill" segments={[{ id: "m", label: "Mandatory", value: 5 }, { id: "n", label: "Not expected", value: 1, hatched: true }]} />)
    expect(container.querySelector("[data-viz=stacked-bar] [data-chart]")).not.toBeNull()
    expect(screen.getByText("Not expected: 1 skill")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /Skills by level: 5 Mandatory, 1 Not expected, 6 skills in all/ })).toBeInTheDocument()
  })
  it("DotStrip stays accessible with one dot", () => {
    render(<DotStrip label="One" dots={[{ id: "a", label: "Maya", value: 50 }]} />)
    expect(screen.getByRole("group", { name: "One: 1 person" })).toBeInTheDocument()
  })
})

describe("SegmentedDots", () => {
  it("summarises the row and names each dot", async () => {
    const { container } = render(<SegmentedDots label="Wound care outcomes" items={[{ id: "1", label: "Aug 18", state: "met" }, { id: "2", label: "Sep 2", state: "notMet" }, { id: "3", label: "Oct 1", state: "met" }]} />)
    expect(screen.getByRole("list", { name: "Wound care outcomes: 3 steps, 2 met, 1 did not meet" })).toBeInTheDocument()
    expect(screen.getByText("Sep 2: Did not meet")).toBeInTheDocument()
    await clean(container)
  })
})

describe("CumulativeLine", () => {
  const data = [{ week: "Wk 1", counted: 1, pace: 2 }, { week: "Wk 2", counted: 3, pace: 4 }, { week: "Wk 3", counted: 6, pace: 7 }]
  it("states the gap in words and lists the data", async () => {
    const { container } = render(<CumulativeLine label="Evaluations this term" unit="evaluation" data={data} />)
    expect(screen.getByText("6 counted, pace says 7 by now: 1 evaluation behind.")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /Evaluations this term\. 6 counted, pace says 7/ })).toBeInTheDocument()
    expect(screen.getByText("Wk 2: 3 counted, pace 4")).toBeInTheDocument()
    await clean(container)
  })
  it("forces the weekly bars variant", () => {
    const { container } = render(<CumulativeLine label="x" data={data} variant="bars" />)
    expect(container.querySelector("[data-variant=bars]")).not.toBeNull()
    expect(screen.getByText("Counted that week")).toBeInTheDocument()
  })
})
