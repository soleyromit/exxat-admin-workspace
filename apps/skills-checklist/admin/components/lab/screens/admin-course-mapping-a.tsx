"use client"

/**
 * Course mapping A: opens By course (each offering, its skills at a level). The By skill view is one toggle away; both are
 * components/lab/admin-a/mapping-views.tsx (stakeholder review 2026-11-04, D-L61). Demo states: ?state=loading | empty | error.
 */
import { MappingFrame } from "@/components/lab/admin-a/mapping-frame"
import { MappingViews } from "@/components/lab/admin-a/mapping-views"

export function AdminCourseMappingA() {
  return <MappingFrame variant="A">{(m) => <MappingViews m={m} fallback="course" />}</MappingFrame>
}
