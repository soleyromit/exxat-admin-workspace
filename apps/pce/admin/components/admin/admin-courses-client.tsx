"use client"

/**
 * Courses — the master catalogue that Curriculum Mapping, Learning Activities
 * and Surveys all read from.
 *
 * One view, because a course does not come in types the way a person does.
 * Program is a filter, not a tab.
 */

import * as React from "react"
import { useNavigate } from "react-router"

import { buildAdminCourseColumns } from "@/components/admin/admin-columns"
import { AdminHubClient, type AdminHubView } from "@/components/admin/admin-hub-client"
import { ADMIN_COURSES, adminCoursesKpi, type AdminCourse } from "@/lib/mock/admin-directory"

export function AdminCoursesClient() {
  const navigate = useNavigate()

  const views = React.useMemo<AdminHubView<AdminCourse>[]>(
    () => [
      {
        id: "courses",
        label: "Courses",
        icon: "fa-books",
        rows: ADMIN_COURSES,
        columns: buildAdminCourseColumns(ADMIN_COURSES),
        emptyState: "No courses yet. Import the catalogue from your student system.",
      },
    ],
    [],
  )

  const metrics = React.useMemo(() => adminCoursesKpi(ADMIN_COURSES), [])

  return (
    <AdminHubClient<AdminCourse>
      title="Courses"
      hubKey="admin-courses"
      views={views}
      metrics={metrics}
      searchAriaLabel="Search courses"
      objectLabel="courses"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.courseCode}
      getRowHref={row => `/courses/${row.id}`}
      onRowNavigate={href => navigate(href)}
      defaultSort={{ key: "courseCode", dir: "asc" }}
    />
  )
}
