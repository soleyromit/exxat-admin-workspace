import { Suspense } from "react"
import { LibraryPage } from "@/components/library/library-page"

/** Skills library (S-04 to S-07). Legacy ?tab= still selects a tab here. Filters and dialogs live in the query string, so Suspense. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <LibraryPage />
    </Suspense>
  )
}
