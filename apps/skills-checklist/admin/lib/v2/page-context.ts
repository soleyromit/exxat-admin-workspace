import type { V2State } from "./types"

/** The one context line under a course-scoped page title: "{course code}, {term}" (V2-CONSISTENCY section 2). */
export function contextLine(state: Pick<V2State, "course">): string {
  return `${state.course.code}, ${state.course.term}`
}
