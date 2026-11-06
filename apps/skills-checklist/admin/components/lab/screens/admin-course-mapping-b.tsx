"use client"

/**
 * Course mapping B: opens By skill (a skill, its level on each offering). The By course view is one toggle away; both are
 * components/lab/admin-a/mapping-views.tsx (stakeholder review 2026-11-04, D-L61). The library's "Not mapped" link lands here with
 * ?skill=. Demo states: ?state=loading | empty | error.
 */
import { MappingFrame } from "@/components/lab/admin-a/mapping-frame"
import { MappingViews } from "@/components/lab/admin-a/mapping-views"

export function AdminCourseMappingB() {
  return <MappingFrame variant="B">{(m) => <MappingViews m={m} fallback="skill" />}</MappingFrame>
}
