import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"

// Anatomy A9 (2026-10-30): one filter entry point per table. The exact DataTable subpath is aliased to the lab wrapper
// (components/data-table/index.tsx), which starts the DS filter bar hidden, so an unfiltered table shows the toolbar filter
// icon only and no dashed "+ Add filter" chip beside it.
type Row = { id: string; name: string; section: string }
const rows: Row[] = [
  { id: "1", name: "Wound care", section: "Clinical" },
  { id: "2", name: "IV insertion", section: "Lab" },
]
const columns: ColumnDef<Row>[] = [
  { key: "name", label: "Skill", width: 200, sortable: true },
  { key: "section", label: "Section", width: 160, sortable: true },
]

describe("lab DataTable: one filter entry point", () => {
  it("shows the toolbar filter icon alone, and adding a filter from it shows a removable chip", async () => {
    const user = userEvent.setup()
    render(<DataTable<Row> data={rows} columns={columns} getRowId={(x) => x.id} selectable={false} searchable showQueryControls edgeInset={false} emptyState={<p>No skills yet.</p>} />)
    const entries = screen.getAllByRole("button", { name: /^Add filter$/ })
    expect(entries).toHaveLength(1)
    expect(entries[0]!.textContent?.trim()).toBe("")

    await user.click(entries[0]!)
    await user.click(await screen.findByRole("menuitem", { name: "Section" }))
    // The DS filter pill for the chosen field is now on the toolbar.
    expect(screen.getAllByText("Section").length).toBeGreaterThan(1)
  })
})
