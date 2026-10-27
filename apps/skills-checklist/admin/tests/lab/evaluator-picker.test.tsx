import * as React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { EvaluatorPicker, PICKER_VISIBLE, type WhoValue } from "@/components/lab/student2/log-parts"
import type { EvaluatorOption } from "@/lib/lab/student2"

/**
 * Who signs off (Romit 2026-10-27: "who signs off should have had a search textbox?"): a search box under the label, at most 5
 * matches before "Show all n", the previous evaluator pinned first with "Signed before", "Someone not listed" always last, and a
 * no-match line. [REQ ST-08, ST-09]
 */
const opt = (id: string, name: string, here: boolean, eligible = true): EvaluatorOption => ({ id, name, role: here ? "Preceptor, Harbor General" : "Faculty", here, eligible, reason: eligible ? null : "Cannot sign lab evidence", initials: name.slice(0, 2).toUpperCase() })
const OPTIONS = [opt("a", "Ana Castillo", true), opt("b", "Ben Ortiz", true), opt("c", "Cara Ng", false), opt("d", "Dev Patel", false), opt("e", "Eli Moss", false), opt("f", "Fay Lin", false), opt("g", "Gus Hale", false, false)]

function Harness({ pinnedId }: { pinnedId?: string }) {
  const [v, setV] = React.useState<WhoValue>(null)
  return <EvaluatorPicker options={OPTIONS} value={v} onChange={setV} fresh={{ name: "", email: "" }} onFresh={() => {}} errors={{}} showErrors={false} pinnedId={pinnedId} />
}

afterEach(cleanup)

describe("EvaluatorPicker", () => {
  it("shows a search box, at most 5 rows before Show all, and Someone not listed last", () => {
    const { container } = render(<Harness />)
    expect(screen.getByRole("searchbox", { name: "Search evaluators by name" })).toBeTruthy()
    expect(container.querySelectorAll("[data-who-row]").length).toBe(PICKER_VISIBLE)
    expect(screen.getByRole("button", { name: `Show all ${OPTIONS.length}` })).toBeTruthy()
    const radios = screen.getAllByRole("radio")
    expect(radios[radios.length - 1].id).toBe("who-new")
    expect(screen.queryByText("Find an evaluator")).toBeNull()
  })

  it("filters as you type, and says so when nothing matches", () => {
    const { container } = render(<Harness />)
    const box = screen.getByRole("searchbox")
    fireEvent.change(box, { target: { value: "cas" } })
    expect([...container.querySelectorAll("[data-who-row]")].map((r) => r.getAttribute("data-who-row"))).toEqual(["a"])
    fireEvent.change(box, { target: { value: "zzz" } })
    expect(container.querySelectorAll("[data-who-row]").length).toBe(0)
    expect(screen.getByText("No match. Add someone not listed.")).toBeTruthy()
    expect(screen.getByRole("radio", { name: /Someone not listed/ })).toBeTruthy()
  })

  it("Enter in the search picks the first eligible match; the pinned previous evaluator comes first with Signed before", () => {
    const { container } = render(<Harness pinnedId="d" />)
    expect(container.querySelector("[data-who-row]")?.getAttribute("data-who-row")).toBe("d")
    expect(screen.getByText("Signed before")).toBeTruthy()
    const box = screen.getByRole("searchbox")
    fireEvent.change(box, { target: { value: "ortiz" } })
    fireEvent.keyDown(box, { key: "Enter" })
    expect((screen.getByRole("radio", { name: /Ben Ortiz/ }) as HTMLElement).getAttribute("data-state")).toBe("checked")
  })
})
