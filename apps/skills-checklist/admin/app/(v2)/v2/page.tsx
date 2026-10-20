import { Suspense } from "react"
import { OverviewPage } from "@/components/v2/overview-page"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OverviewPage />
    </Suspense>
  )
}
