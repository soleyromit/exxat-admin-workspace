// @vitest-environment jsdom
import * as React from "react"
import { describe, expect, it, beforeAll } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { CategoryPicker } from "@/components/lab/library/category-tag-pickers"

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
})

function Harness() {
  const [v, setV] = React.useState("")
  return (
    <>
      <span id="l">Category</span>
      <CategoryPicker id="c" labelId="l" value={v} options={["Airway"]} inactive={["Old unit"]} onChange={setV} />
      <output data-testid="v">{v}</output>
    </>
  )
}

const type = (text: string) => {
  fireEvent.click(document.getElementById("c")!)
  fireEvent.change(screen.getByPlaceholderText("Find or create a category"), { target: { value: text } })
}

describe("category picker, a deactivated name typed (SL-06)", () => {
  it("answers with a disabled row, not No category matches and not Create", () => {
    render(<Harness />)
    type("old UNIT")
    const row = document.querySelector("[data-category-inactive-row]")!
    expect(row.textContent).toBe("old UNIT, Inactive")
    expect(row).toHaveAttribute("aria-disabled", "true")
    expect(screen.queryByText("No category matches.")).toBeNull()
    expect(screen.queryByText(/^Create/)).toBeNull()
    fireEvent.click(row)
    expect(screen.getByTestId("v").textContent).toBe("")
  })

  it("still offers Create for a new name", () => {
    render(<Harness />)
    type("Brand new")
    expect(screen.getByText('Create "Brand new"')).toBeTruthy()
    expect(document.querySelector("[data-category-inactive-row]")).toBeNull()
  })
})
