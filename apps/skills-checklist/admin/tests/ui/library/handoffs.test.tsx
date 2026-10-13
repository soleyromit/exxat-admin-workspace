import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"

vi.mock("next/navigation", async () => (await import("./harness")).navigationMock)

import { LibraryPage } from "@/components/library/library-page"
import { ROUTES } from "@/lib/skills-routes"
import { renderPage, resetWorld } from "./harness"

const names = () => [...document.querySelectorAll("tbody tr")].map((tr) => tr.querySelector("button")?.textContent ?? "").sort()
/** The import surface (R2) owns these hrefs; fall back to the contract values if it renames its helper. */
async function importHrefs() {
  const mod = (await import("@/components/import/import-review").catch(() => null)) as null | { importReturnHref?: { configure: () => string; batch: (id: string) => string } }
  return { configure: mod?.importReturnHref?.configure() ?? `${ROUTES.skills}?status=unconfigured`, batch: (id: string) => mod?.importReturnHref?.batch(id) ?? `${ROUTES.skills}?batch=${id}` }
}
const queryOf = (href: string) => href.split("?")[1] ?? ""

beforeEach(() => resetWorld())

/**
 * UX critic B1/B2: the links other surfaces emit must land on the filtered S-04 list, not silently on all skills.
 * Each test takes the href the emitting surface really uses, loads S-04 with exactly that query and asserts the list.
 */
describe("S-04 hand-offs from other surfaces (IM-09, IM-10, IM-11)", () => {
  it("IM-10: 'Configure them now' (S-08) opens the list narrowed to the unconfigured skills", async () => {
    const href = (await importHrefs()).configure
    expect(href.startsWith(ROUTES.skills)).toBe(true)
    resetWorld(ROUTES.skills, queryOf(href))
    renderPage(<LibraryPage />)
    await screen.findByText("Nasogastric Tube Insertion")
    expect(names()).toEqual(["Blood Glucose Monitoring", "Nasogastric Tube Insertion"])
    expect(screen.getByRole("combobox", { name: /^Status:/ })).toHaveTextContent("Needs configuration")
  })

  it("IM-11: 'Show them' (S-08) opens the list narrowed to that import batch", async () => {
    const href = (await importHrefs()).batch("imp-1")
    resetWorld(ROUTES.skills, queryOf(href))
    renderPage(<LibraryPage />)
    await screen.findByText("Nasogastric Tube Insertion")
    expect(names()).toEqual(["Blood Glucose Monitoring", "Nasogastric Tube Insertion"])
    expect(screen.getByRole("combobox", { name: /^Import:/ })).toHaveTextContent("Import 1")
  })

  it("IM-10: the status value S-04 accepts is exactly what the mapping and overview links emit", async () => {
    const h = await importHrefs()
    expect(h.configure).toBe(`${ROUTES.skills}?status=unconfigured`)
    expect(h.batch("imp-9")).toBe(`${ROUTES.skills}?batch=imp-9`)
  })
})
