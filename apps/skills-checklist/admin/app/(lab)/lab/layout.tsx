import * as React from "react"
import { LabProviders } from "@/components/lab/lab-frame"
import { PageTitleSync } from "@/components/lab/shared/page-title-sync"
import "@/components/lab/viz-tokens.css"

export const metadata = { title: "Prism Skills Tracking" }

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <LabProviders><PageTitleSync />{children}</LabProviders>
}
