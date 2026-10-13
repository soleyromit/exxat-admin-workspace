import { Suspense } from "react"
import { StudentView } from "@/components/student/course-skills-view"

/**
 * The prototype's "Student View" (parity card P-11): viewing-as student and course selects, the skills list, and the
 * Send for review and history DIALOGS. Course, send and history live in the query string (?course=, ?send=1, ?history=).
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <StudentView />
    </Suspense>
  )
}
