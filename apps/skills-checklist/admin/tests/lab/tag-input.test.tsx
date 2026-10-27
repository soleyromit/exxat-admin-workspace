import * as React from "react"
import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { CategoryPicker, TagsPicker } from "@/components/lab/library/category-tag-pickers"

/**
 * Tags are a tag input, not a dropdown (Romit 2026-10-27, decision D-X28): chips with their own remove button inside one text
 * box, suggestions while typing, Enter or comma commits, Backspace in an empty box removes the last chip. Category is a
 * separate single-choice select.
 */
function Harness({ initial = [] as string[] }) {
  const [tags, setTags] = React.useState<string[]>(initial)
  return (
    <div>
      <span id="tags-label">Tags</span>
      <TagsPicker id="tags" labelId="tags-label" value={tags} options={["Infection prevention", "Patient safety", "Invasive procedures"]} onChange={setTags} />
      <output data-testid="value">{tags.join("|")}</output>
    </div>
  )
}

const box = () => screen.getByRole("combobox", { name: "Tags" })
const value = () => screen.getByTestId("value").textContent

describe("tag input", () => {
  it("is a text box (combobox) with no dropdown trigger", () => {
    render(<Harness />)
    expect(box().tagName).toBe("INPUT")
    expect(box()).toHaveAttribute("aria-autocomplete", "list")
    expect(document.querySelector("[data-tags-picker] .fa-chevron-down")).toBeNull()
  })

  it("suggests matching tags while typing and commits the highlighted one on Enter", () => {
    render(<Harness />)
    fireEvent.change(box(), { target: { value: "pat" } })
    expect(box()).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("option", { name: "Patient safety" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: 'Create "pat"' })).toBeInTheDocument()
    fireEvent.keyDown(box(), { key: "Enter" })
    expect(value()).toBe("Patient safety")
    expect(box()).toHaveValue("")
  })

  it("creates a new tag from what was typed, with comma, and never twice", () => {
    render(<Harness />)
    fireEvent.change(box(), { target: { value: "Year 2" } })
    fireEvent.keyDown(box(), { key: "ArrowDown" })
    fireEvent.keyDown(box(), { key: "ArrowDown" })
    // Only "Create" is offered, so Enter commits it.
    fireEvent.keyDown(box(), { key: "Enter" })
    fireEvent.change(box(), { target: { value: "year 2," } })
    expect(value()).toBe("Year 2")
  })

  it("removes a chip with its own button and the last chip with Backspace in an empty box", () => {
    render(<Harness initial={["Patient safety", "Year 2", "Infection prevention"]} />)
    fireEvent.click(screen.getByRole("button", { name: "Remove tag Year 2" }))
    expect(value()).toBe("Patient safety|Infection prevention")
    fireEvent.keyDown(box(), { key: "Backspace" })
    expect(value()).toBe("Patient safety")
  })

  it("closes the suggestions on Escape without clearing the text", () => {
    render(<Harness />)
    fireEvent.change(box(), { target: { value: "inf" } })
    fireEvent.keyDown(box(), { key: "Escape" })
    expect(box()).toHaveAttribute("aria-expanded", "false")
    expect(box()).toHaveValue("inf")
  })

  it("keeps Category a separate single-choice select with its own label", () => {
    render(
      <div>
        <span id="cat-label">Category</span>
        <CategoryPicker id="cat" labelId="cat-label" value="Nutrition" options={["Nutrition", "Airway"]} onChange={() => {}} />
      </div>,
    )
    const trigger = screen.getByRole("button", { name: /Category\s+Nutrition/ })
    expect(trigger).toHaveAttribute("data-category-picker")
    expect(screen.queryByRole("combobox", { name: "Category" })).toBeNull()
  })
})
