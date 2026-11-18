/**
 * Details collected with every evaluation (D-EM1116-c; Romit 2026-11-17 asked for the prototype's framing). The tab names what it is in the
 * prototype's heading and one line, always shows who fills each detail in and whether it is required, lists a dropdown's choices under its
 * name, and closes with how the details are used, linking to a method, where Preview shows them in place.
 */
import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, within } from "@testing-library/react"

const nav = vi.hoisted(() => ({ pathname: "/lab/admin/evaluation-settings", search: "variant=Q&tab=details" }))
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { createV2Store } from "@/lib/v2/store"
import { V2StoreProvider } from "@/lib/v2/react"
import { createSeed } from "@/lib/v2/seed"
import { methodsOf } from "@/lib/lab/methods"
import { addDetail } from "@/lib/lab/details"
import { DetailsTable } from "@/components/lab/configure/details-table"

afterEach(() => cleanup())

function mount() {
  const store = createV2Store({ storage: null, seed: () => createSeed() })
  const r = addDetail(store.getSnapshot(), { name: "Shift worked", type: "choice", by: "student", required: false, choices: ["Day", "Evening", "Night"] })
  if (!r.ok) throw new Error(r.error)
  store.update(() => r.state)
  render(<V2StoreProvider store={store}><DetailsTable adding={false} setAdding={() => {}} onBanner={() => {}} /></V2StoreProvider>)
  return store
}

describe("Details tab", () => {
  it("says what it is, in the prototype's heading and one line", () => {
    mount()
    expect(screen.getByRole("heading", { level: 2, name: "Details collected with every evaluation" })).toBeInTheDocument()
    expect(screen.getByText(/Set up once for the program\./)).toBeInTheDocument()
  })

  it("always shows Filled in by and Required, and lists a dropdown's choices under its name", () => {
    mount()
    expect(screen.getAllByText("Filled in by").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Required").length).toBeGreaterThan(0)
    expect(screen.getByText("Day · Evening · Night")).toBeInTheDocument()
    // A built-in name already says its choices: no second line under it.
    expect(screen.queryByText("Graded · Practice")).toBeNull()
  })

  it("closes with how the details are used and opens a method to preview them", () => {
    const store = mount()
    const closing = document.querySelector("[data-details-closing]") as HTMLElement
    expect(closing).toHaveTextContent(/fills these in once\. On the check-off grid they are entered once for the session\./)
    const first = methodsOf(store.getSnapshot())[0]
    const link = within(closing).queryByRole("link", { name: "open any method" })
    if (first) {
      expect(link).toHaveAttribute("href", expect.stringContaining(`method=${first.id}`))
      expect(link?.getAttribute("href")).toContain("variant=Q")
      expect(link?.getAttribute("href")).not.toContain("tab=details")
    } else {
      expect(closing).toHaveTextContent(/Once a method exists/)
    }
  })
})
