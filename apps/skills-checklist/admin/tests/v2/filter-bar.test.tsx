import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"
import type { ActiveFilter } from "@exxatdesignux/ui/lib/table-properties-types"
import { filterValue, removeFilter, setFilter, V2FilterBar, v2SelectField } from "@/components/v2/v2-filter-bar"

const fields = [
  v2SelectField("setting", "Setting", [{ value: "inpatient", label: "Inpatient" }, { value: "outpatient", label: "Outpatient" }]),
  v2SelectField("category", "Category", [{ value: "med", label: "Medication" }, { value: "wound", label: "Wound care" }]),
  v2SelectField("mandatory", "Mandatory skills only", [{ value: "yes", label: "Yes" }]),
]

function Harness({ initial = [], count }: { initial?: ActiveFilter[]; count: (f: ActiveFilter[]) => number }) {
  const [f, setF] = React.useState<ActiveFilter[]>(initial)
  return <V2FilterBar fields={fields} filters={f} onChange={setF} resultCount={count(f)} resultNoun="skills" emptyMessage="No skill matches both filters. Clear one to see results." />
}

describe("filter helpers", () => {
  it("replace a field's value and remove one field alone", () => {
    let f = setFilter([], "setting", "inpatient")
    f = setFilter(f, "category", "med")
    f = setFilter(f, "setting", "outpatient")
    expect(f.map((x) => x.fieldKey)).toEqual(["category", "setting"])
    expect(filterValue(f, "setting")).toBe("outpatient")
    expect(removeFilter(f, "setting").map((x) => x.fieldKey)).toEqual(["category"])
  })
})

describe("V2FilterBar", () => {
  it("adds a chip through Add filter, removes it alone, and shows Clear all only from 2 chips", async () => {
    const user = userEvent.setup()
    render(<Harness count={() => 5} />)
    expect(screen.queryByRole("button", { name: /Clear all/ })).toBeNull()

    await user.click(screen.getByRole("button", { name: /Add filter/ }))
    await user.click(screen.getByRole("button", { name: "Setting" }))
    await user.click(screen.getByRole("button", { name: "Inpatient" }))
    expect(screen.getByRole("button", { name: "Remove filter Setting: Inpatient" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Clear all/ })).toBeNull()

    await user.click(screen.getByRole("button", { name: /Add filter/ }))
    await user.click(screen.getByRole("button", { name: "Category" }))
    await user.click(screen.getByRole("button", { name: "Wound care" }))
    expect(screen.getByRole("button", { name: /Clear all/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove filter Setting: Inpatient" }))
    expect(screen.queryByRole("button", { name: "Remove filter Setting: Inpatient" })).toBeNull()
    expect(screen.getByRole("button", { name: "Remove filter Category: Wound care" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Clear all/ })).toBeNull()
  })

  it("announces the count in a polite status region", () => {
    render(<Harness count={() => 3} />)
    const status = screen.getAllByRole("status").find((n) => n.textContent === "3 skills")
    expect(status).toBeTruthy()
  })

  it("explains an impossible combination and offers one clearing action", async () => {
    const user = userEvent.setup()
    const initial = [setFilter([], "setting", "inpatient")[0]]
    render(<Harness initial={initial} count={(f) => (f.length === 0 ? 4 : 0)} />)
    expect(screen.getByText("No skill matches both filters. Clear one to see results.")).toBeInTheDocument()
    const clears = screen.getAllByRole("button", { name: /Clear all/ })
    expect(clears).toHaveLength(1)
    await user.click(clears[0])
    expect(screen.queryByText(/No skill matches/)).toBeNull()
    expect(screen.queryByRole("button", { name: /^Remove filter/ })).toBeNull()
  })

  it("is a named group with no axe violations", async () => {
    const { container } = render(<Harness initial={setFilter([], "setting", "inpatient")} count={() => 2} />)
    expect(within(container).getByRole("group", { name: "Filters" })).toBeInTheDocument()
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })
    expect(r.violations).toEqual([])
  })
})
