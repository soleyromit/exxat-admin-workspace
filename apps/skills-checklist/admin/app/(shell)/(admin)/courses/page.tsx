import { Suspense } from "react"
import { MappingWorkspace } from "@/components/mapping/mapping-workspace"

// useSearchParams in the workspace needs a Suspense boundary for static prerendering.
export default function Page() {
  return (
    <Suspense>
      <MappingWorkspace />
    </Suspense>
  )
}
