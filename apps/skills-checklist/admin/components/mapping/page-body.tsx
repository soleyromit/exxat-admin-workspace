import * as React from "react"
import { PageFrame } from "@/components/skills/page-header"

/** Course Mapping and Review & Approve page chrome: the shared PageFrame (kept as a named alias for existing callers). */
export function PageBody({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <PageFrame title={title} subtitle={subtitle}>{children}</PageFrame>
}
