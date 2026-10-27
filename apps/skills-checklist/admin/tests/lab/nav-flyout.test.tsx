import * as React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

// The phone navigation sheet (2026-10-27): it opened by itself after a page change and stayed open over the next page.
// Two causes, one test each. Runtime cover: tests/lab/nav-sheet.mjs (375 and 1440, student, admin, reviewer).

const nav = vi.hoisted(() => ({ pathname: "/lab/flow/my-progress/home", search: "set=1&term=Fall%202026", push: vi.fn() }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { SidebarProvider, useSidebar } from "@exxatdesignux/ui/components/ui/sidebar"
import { FlyoutStartsClosed, SidebarCarry } from "@/components/lab/lab-frame"

const realMatchMedia = window.matchMedia
function phone(on: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: on && /max-width/.test(query),
    media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => { nav.push.mockReset() })
afterEach(() => { window.matchMedia = realMatchMedia })

describe("SidebarCarry", () => {
  it("adds the set to a sidebar row click without hiding the click from the row (so the DS closes the flyout)", () => {
    const rowClick = vi.fn()
    render(
      <>
        <SidebarCarry />
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- stands in for the DS sidebar row's anchor */}
        <a data-sidebar="menu-button" href="/lab/flow/ask-for-evaluation/requests" onClick={rowClick}>My requests</a>
      </>,
    )
    fireEvent.click(screen.getByText("My requests"))
    expect(nav.push).toHaveBeenCalledWith(expect.stringMatching(/^\/lab\/flow\/ask-for-evaluation\/requests\?.*set=1/))
    // Before the fix a capture-phase stopPropagation kept the row's own handler (dismissNavFlyout) from running.
    expect(rowClick).toHaveBeenCalledTimes(1)
    expect(rowClick.mock.calls[0]![0].defaultPrevented).toBe(true)
  })
})

describe("FlyoutStartsClosed", () => {
  function State() {
    const { open, isNavFlyout } = useSidebar()
    return <output data-testid="state">{`${isNavFlyout ? "flyout" : "rail"}:${open ? "open" : "closed"}`}</output>
  }
  // First: the DS caches its reflow-viewport reading on first use, so the desktop case runs before any phone case.
  it("leaves the desktop rail open", () => {
    phone(false)
    render(<SidebarProvider defaultOpen><FlyoutStartsClosed /><State /></SidebarProvider>)
    expect(screen.getByTestId("state").textContent).toBe("rail:open")
  })
  it("a shell mounted on a phone (a client page change) starts with the navigation sheet closed", () => {
    phone(true)
    render(<SidebarProvider defaultOpen><FlyoutStartsClosed /><State /></SidebarProvider>)
    expect(screen.getByTestId("state").textContent).toBe("flyout:closed")
  })
  it("without it, the DS keeps defaultOpen on a phone mount (the bug)", () => {
    phone(true)
    render(<SidebarProvider defaultOpen><State /></SidebarProvider>)
    expect(screen.getByTestId("state").textContent).toBe("flyout:open")
  })
})
