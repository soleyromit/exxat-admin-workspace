import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resolveStep } from "@/lib/lab/flows"
import { DirectorReportsPage } from "@/components/lab/director/reports-page"

const navigation = vi.hoisted(() => ({
  search: "set=1&tab=readiness&term=trm-fa26&cohort=BSN+2026&variant=B&peek=student-1",
  replace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.search),
  usePathname: () => "/lab/flow/confirm-readiness/reports",
  useRouter: () => ({ replace: navigation.replace }),
}))

// Exercise the real page's tab state and navigation without rendering the report data grid.
vi.mock("@/components/lab/director/frame", () => ({
  DirectorPage: ({ tabs }: { tabs: { value: string; items: Array<{ value: string; label: string }>; onChange: (value: string) => void } }) => (
    <div role="tablist">
      {tabs.items.map((tab) => <button key={tab.value} role="tab" aria-selected={tabs.value === tab.value} onClick={() => tabs.onChange(tab.value)}>{tab.label}</button>)}
    </div>
  ),
}))

describe("Director Reports tab navigation", () => {
  beforeEach(() => { navigation.replace.mockReset() })

  it("keeps Attainment explicit so the flow cannot restore its Readiness default", () => {
    navigation.search = "set=1&tab=readiness&term=trm-fa26&cohort=BSN+2026&variant=B&peek=student-1"
    const view = render(<DirectorReportsPage variant="B" />)
    fireEvent.click(screen.getByRole("tab", { name: "Attainment" }))
    const [href, options] = navigation.replace.mock.calls[0]
    const next = new URL(href, "https://lab.test")
    expect(next.searchParams.get("tab")).toBe("attainment")
    expect(next.searchParams.get("term")).toBe("trm-fa26")
    expect(next.searchParams.get("cohort")).toBe("BSN 2026")
    expect(next.searchParams.get("set")).toBe("1")
    expect(next.searchParams.get("variant")).toBe("B")
    expect(next.searchParams.has("peek")).toBe(false)
    expect(options).toEqual({ scroll: false })

    // The flow page only injects missing params. Its default must not undo this choice.
    for (const [key, value] of Object.entries(resolveStep("confirm-readiness", "reports", "1")!.params)) {
      if (!next.searchParams.has(key)) next.searchParams.set(key, value)
    }
    navigation.search = next.searchParams.toString()
    view.rerender(<DirectorReportsPage variant="B" />)
    expect(screen.getByRole("tab", { name: "Attainment" })).toHaveAttribute("aria-selected", "true")
  })

  it("switches back to Readiness without losing scope", () => {
    navigation.search = "set=1&tab=attainment&term=trm-fa26&cohort=BSN+2026"
    render(<DirectorReportsPage variant="A" />)
    fireEvent.click(screen.getByRole("tab", { name: "Readiness" }))
    const next = new URL(navigation.replace.mock.calls[0][0], "https://lab.test")
    expect(next.searchParams.get("tab")).toBe("readiness")
    expect(next.searchParams.get("cohort")).toBe("BSN 2026")
  })
})
