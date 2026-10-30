"use client"

/**
 * Director Reports A (D-L8c): one page, two tabs. Attainment (default) is the students by sections matrix, read-only with export,
 * under a readiness line; Readiness is one table with four views (by student, skill, section, tag) and the Export menu (signed PDF,
 * CSV). Question: does a matrix plus one report table, on one shared scope, answer the director's reporting job?
 */
import * as React from "react"
import { DirectorReportsPage } from "@/components/lab/director/reports-page"

export function DirectorAttainmentA() {
  return <DirectorReportsPage variant="A" />
}
