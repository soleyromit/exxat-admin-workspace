import * as React from "react"
import { LabProviders } from "@/components/lab/lab-frame"
import "@/components/lab/viz-tokens.css"

export const metadata = { title: "Design lab" }

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <LabProviders>{children}</LabProviders>
}
