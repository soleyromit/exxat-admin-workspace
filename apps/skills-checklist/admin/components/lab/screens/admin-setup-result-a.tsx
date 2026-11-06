"use client"

/**
 * Setup summary is gone (D-L77; Sankalp, Granola 365abc25 chunk 17: every step can change it, so there is no one summary). Its by-group table is
 * now Course mapping's Coverage view, so an old link lands there. Set up skills keeps its own variants on this screen (C, D).
 */
import * as React from "react"
import { useRouter } from "next/navigation"
import { LoadingState } from "@/components/lab/admin-a/parts"
import { mappingLink } from "@/lib/lab/mapping"

export function AdminSetupResultA() {
  const router = useRouter()
  React.useEffect(() => router.replace(mappingLink({ by: "coverage" })), [router])
  return <LoadingState label="Opening Coverage" />
}
