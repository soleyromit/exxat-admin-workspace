import { Suspense } from "react"
import { OverviewClient } from "@/components/reporting/overview-client"

// S-01 Overview. useSearchParams requires a Suspense boundary at build time; the URL holds the filters, tab and rail level.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <OverviewClient />
    </Suspense>
  )
}
