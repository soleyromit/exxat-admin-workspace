/**
 * Ask Leo borrows the primary sidebar's width. The contract worth pinning is the
 * handback: a rail that was collapsed before Leo must still be collapsed after,
 * because an expanded primary makes the secondary scope rail compact itself and
 * the user loses the rail they were reading.
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"

import { useBorrowedPrimarySidebar } from "./use-borrowed-primary-sidebar"

function Probe({ borrowing }: { borrowing: boolean }) {
  useBorrowedPrimarySidebar(borrowing)
  const { state } = useSidebar()
  return <span data-testid="primary">{state}</span>
}

const primary = () => screen.getByTestId("primary").textContent

function mount(defaultOpen: boolean) {
  return render(
    <SidebarProvider defaultOpen={defaultOpen}>
      <Probe borrowing={false} />
    </SidebarProvider>,
  )
}

function setBorrowing(rerender: ReturnType<typeof mount>["rerender"], defaultOpen: boolean, borrowing: boolean) {
  rerender(
    <SidebarProvider defaultOpen={defaultOpen}>
      <Probe borrowing={borrowing} />
    </SidebarProvider>,
  )
}

describe("useBorrowedPrimarySidebar", () => {
  it("collapses while borrowing and stays collapsed for a rail that was already collapsed", () => {
    const { rerender } = mount(false)
    expect(primary()).toBe("collapsed")

    setBorrowing(rerender, false, true)
    expect(primary()).toBe("collapsed")

    setBorrowing(rerender, false, false)
    expect(primary()).toBe("collapsed")
  })

  it("gives an expanded rail back expanded", () => {
    const { rerender } = mount(true)
    expect(primary()).toBe("expanded")

    setBorrowing(rerender, true, true)
    expect(primary()).toBe("collapsed")

    setBorrowing(rerender, true, false)
    expect(primary()).toBe("expanded")
  })

  it("leaves the saved preference alone", () => {
    document.cookie = "sidebar_state_v2=true; path=/"
    const { rerender } = mount(true)

    setBorrowing(rerender, true, true)
    expect(primary()).toBe("collapsed")
    expect(document.cookie).toContain("sidebar_state_v2=true")

    setBorrowing(rerender, true, false)
    expect(document.cookie).toContain("sidebar_state_v2=true")
  })
})
