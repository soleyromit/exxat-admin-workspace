import * as React from "react"
import { useParams } from "react-router"

import {
  AdminRecordDetail,
  AdminRecordNotFound,
  type AdminRecordField,
} from "@/components/admin/admin-record-detail"
import { ADMIN_COURSES, adminCourseUsage } from "@/lib/mock/admin-directory"

const BACK_TO = { label: "Courses", href: "/courses" }

export default function AdminCourseDetailPage() {
  const { courseId = "" } = useParams()
  const course = React.useMemo(
    () => ADMIN_COURSES.find(row => row.id === courseId),
    [courseId],
  )

  const usage = React.useMemo(() => (course ? adminCourseUsage(course) : []), [course])

  if (!course) {
    return (
      <AdminRecordNotFound
        backTo={BACK_TO}
        message="This course is no longer in the catalog. It may have been retired by the SIS feed or replaced by a renumbered course."
      />
    )
  }

  const fields: AdminRecordField[] = [
    { label: "Course code", value: course.courseCode, mono: true },
    { label: "Program", value: course.program },
    { label: "Credits", value: course.credits },
    { label: "Delivery", value: course.delivery },
    { label: "Faculty of record", value: course.owner },
    { label: "Enrolled", value: course.enrolled },
  ]

  return (
    <AdminRecordDetail
      backTo={BACK_TO}
      title={course.title}
      subtitle={`${course.courseCode}, ${course.program}`}
      status={course.status}
      source={course.source}
      lastSyncedOn={course.lastSyncedOn}
      fields={fields}
      usage={usage}
      usageEmptyState="No product references this course yet. It appears here once a rotation, a curriculum map or an evaluation is built on it."
    />
  )
}
