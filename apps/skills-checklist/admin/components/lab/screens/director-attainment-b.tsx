"use client"

/**
 * Director Reports B (D-L8c): one page, two tabs. Attainment (default) ranks skills, most not achieved first, under a readiness
 * line; Readiness shows the report beside a preview of the signed PDF or CSV before export. Question: does ranking skills and
 * seeing the file first build more trust in what the director shares?
 */
import * as React from "react"
import { DirectorReportsPage } from "@/components/lab/director/reports-page"

export function DirectorAttainmentB() {
  return <DirectorReportsPage variant="B" />
}
