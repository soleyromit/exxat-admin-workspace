import * as React from "react"
import { LabIndexFrame } from "@/components/lab/lab-frame"
import { LabIndex } from "@/components/lab/lab-index"

export default function LabIndexPage() {
  return (
    <LabIndexFrame>
      <React.Suspense fallback={null}>
        <LabIndex />
      </React.Suspense>
    </LabIndexFrame>
  )
}
