import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { walkthroughStart } from "@/lib/lab/walkthrough"

vi.mock("next/font/google", () => ({ Source_Sans_3: () => ({ variable: "prism-font-test" }) }))
vi.mock("next/navigation", () => ({ redirect: () => { throw new Error("redirected") } }))

import Landing from "@/app/page"

describe("PRISM home at /", () => {
  it("renders the dashboard instead of redirecting", () => {
    render(<Landing />)
    expect(screen.getByRole("heading", { level: 1, name: "Home Page" })).toBeTruthy()
    expect(screen.getByRole("heading", { level: 2, name: "Curriculum Management" })).toBeTruthy()
  })
  it("has Skills checklist as a full row in Curriculum Management and as a drawer row, both visible without a click, to the walkthrough start", () => {
    const { container } = render(<Landing />)
    const card = screen.getByRole("link", { name: "Skills checklist" })
    expect(card.getAttribute("href")).toBe("/admin/lists")
    const section = card.closest("section")
    expect(section?.getAttribute("aria-labelledby")).toBe("prism-curriculum")
    const row = card.closest(".prism-row")
    expect(row?.querySelector("i.fa-list-check")).toBeTruthy()
    expect(row?.querySelector(".prism-row-desc")?.textContent?.trim().length).toBeGreaterThan(0)
    expect(row?.textContent).not.toMatch(/\bitems?\b/i)
    expect(container.querySelector(".prism-row-link")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }))
    const links = screen.getAllByRole("link", { name: "Skills checklist" })
    expect(links).toHaveLength(2)
    for (const l of links) { expect(l.getAttribute("href")).toBe("/admin/lists"); expect(l.getAttribute("href")).toBe(walkthroughStart()) }
    expect(links.find((l) => l.closest(".prism-drawer"))?.querySelector("i.fa-list-check")).toBeTruthy()
    expect(container.querySelectorAll('a[href="#"]').length).toBe(0)
  })
})
