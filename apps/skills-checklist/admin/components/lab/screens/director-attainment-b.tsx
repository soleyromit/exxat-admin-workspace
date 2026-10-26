"use client"

/**
 * Director Attainment B, skills ranked. The admin skills table, most students not achieved first, with the four-state distribution
 * and a linked count per state, under the same readiness line. Export allowed, no configure links. Question: does ranking skills
 * tell the director what to raise with faculty faster than a students matrix?
 */
import * as React from "react"
import { DirectorAttainment } from "@/components/lab/rbac/director-attainment"

export function DirectorAttainmentB() {
  return <DirectorAttainment variant="B" view="skills" />
}
