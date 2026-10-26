import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"

import { V2StoreProvider } from "@/lib/v2/react"
import { createV2Store } from "@/lib/v2/store"
import { ReportsPage } from "@/components/v2/reports/reports-page"
import { VerificationListPage } from "@/components/v2/director/verification-pages"
import { LabGridPage } from "@/components/v2/preceptor/lab-grid-page"
import { LibraryTable } from "@/components/v2/admin/library-table"
import { ReviewQueuePage } from "@/components/v2/review/review-queue-page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/v2/admin",
  useSearchParams: () => new URLSearchParams(),
}))

/** The pages that list people or skills still render at 123 students and 178 skills, with no NaN, undefined or Infinity in the text. */
const wrap = (el: React.ReactElement) => render(<V2StoreProvider store={createV2Store({ storage: null })}>{el}</V2StoreProvider>)

describe("pages at 123 students", () => {
  const cases: Array<[string, () => React.ReactElement]> = [
    ["reports", () => <ReportsPage role="admin" />],
    ["director list", () => <VerificationListPage role="director" />],
    ["lab grid", () => <LabGridPage />],
    ["skills library", () => <LibraryTable announce={() => {}} />],
    ["review queue", () => <ReviewQueuePage role="reviewer" />],
  ]
  for (const [name, make] of cases) {
    it(`renders ${name} without crashing or printing NaN`, () => {
      const t = performance.now()
      const { container } = wrap(make())
      const took = performance.now() - t
      console.log(`${name}: ${container.querySelectorAll("*").length} elements, rendered in ${took.toFixed(0)} ms`)
      expect(container.textContent).not.toMatch(/NaN|undefined|Infinity/)
      expect(container.querySelectorAll("*").length).toBeGreaterThan(10)
    })
  }
})
