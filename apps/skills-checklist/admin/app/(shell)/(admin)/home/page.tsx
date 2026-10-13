import { Suspense } from "react"
import { HomeClient } from "@/components/home/home-client"
import { HomeSkeleton } from "@/components/home/home-view"

// HY-01 Home (Layout 2). useSearchParams needs a Suspense boundary at build time.
export default function Page() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeClient />
    </Suspense>
  )
}
