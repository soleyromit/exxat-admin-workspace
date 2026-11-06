import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const nav = vi.hoisted(() => ({ search: "student=stu-maya&skills=sk-ng-tube" }))
vi.mock("next/navigation", () => ({
  usePathname: () => "/lab/flow/fulfillment-walkthrough/form",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
}))

import { useLinkedRequest } from "@/components/lab/evaluator/use-evaluator"
import { createV2Store } from "@/lib/v2/store"
import { V2StoreProvider } from "@/lib/v2/react"
import { createSeed } from "@/lib/v2/seed"

/** D-L71: visiting a stop never writes. A walk with Next only left two phantom requests before this. */
function Probe() {
  const l = useLinkedRequest()
  const sub = l.state.submissions.find((x) => x.id === l.id)
  return <p data-testid="probe">{`${l.preview}|${sub?.studentId ?? "none"}|${sub?.skillIds.join(",") ?? ""}`}</p>
}

describe("a stop opened without Send", () => {
  it("reads Maya's request as a preview and leaves the store unchanged, however many times it renders", () => {
    const store = createV2Store({ storage: null, seed: createSeed })
    const before = store.getSnapshot().submissions.length
    const tree = () => <React.StrictMode><V2StoreProvider store={store}><Probe /></V2StoreProvider></React.StrictMode>
    const { rerender } = render(tree())
    rerender(tree())
    expect(screen.getByTestId("probe").textContent).toBe("true|stu-maya|sk-ng-tube")
    expect(store.getSnapshot().submissions.length).toBe(before)
    expect(store.getSnapshot().logEntries.some((e) => e.studentId === "stu-maya" && e.skillId === "sk-ng-tube")).toBe(false)
  })
})
