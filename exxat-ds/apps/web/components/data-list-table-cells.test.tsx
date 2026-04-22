import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { HireBadge, ReadinessBadge, StatusBadge } from "./data-list-table-cells"

describe("data-list-table-cells", () => {
  it("renders StatusBadge label for confirmed", () => {
    render(<StatusBadge status="confirmed" />)
    expect(screen.getByText("Confirmed")).toBeInTheDocument()
  })

  it("ReadinessBadge uses destructive variant for risk copy", () => {
    const { container } = render(<ReadinessBadge value="At risk" />)
    expect(container.querySelector("[data-slot='badge']")).toBeTruthy()
    expect(screen.getByText("At risk")).toBeInTheDocument()
  })

  it("HireBadge shows em dash for empty", () => {
    render(<HireBadge value="" />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })
})
