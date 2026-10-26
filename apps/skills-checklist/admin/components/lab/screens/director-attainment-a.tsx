"use client"

/**
 * Director Attainment A, matrix. The admin students x sections heat matrix, read-only, under a readiness line for the graduating
 * cohort (preselected, still a filter). Export allowed, no configure links (director permission set, lib/lab/rbac.ts). A cell opens
 * the evidence beside the matrix. Question: does the matrix show the director where the graduating cohort is short at a glance?
 */
import * as React from "react"
import { DirectorAttainment } from "@/components/lab/rbac/director-attainment"

export function DirectorAttainmentA() {
  return <DirectorAttainment variant="A" view="matrix" />
}
