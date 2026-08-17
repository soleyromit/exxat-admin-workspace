"use client"

/**
 * People directory hubs — Students, Faculty, and Staff as primary destinations.
 *
 * Students keep in-page tabs (All / Current / Invited) because DCE workflows
 * hinge on enrollment state and invite clearance. Faculty and Staff stay flat;
 * status is a table filter, not a second nav layer (domain: faculty/staff are
 * not cohort-batched the way students are).
 */

import * as React from "react"
import { useNavigate } from "react-router"

import { buildAdminPeopleColumns } from "@/components/admin/admin-columns"
import { AdminHubClient, type AdminHubView } from "@/components/admin/admin-hub-client"
import {
  ADMIN_PEOPLE,
  adminPeopleTypeKpi,
  type AdminPerson,
  type AdminPersonType,
} from "@/lib/mock/admin-directory"

const TYPE_META: Record<
  AdminPersonType,
  { title: string; objectLabel: string; icon: string; empty: string }
> = {
  student: {
    title: "Students",
    objectLabel: "students",
    icon: "fa-graduation-cap",
    empty: "No students in this program. Import a roster to get started.",
  },
  faculty: {
    title: "Faculty",
    objectLabel: "faculty",
    icon: "fa-chalkboard-user",
    empty: "No faculty yet. Import a roster to get started.",
  },
  staff: {
    title: "Staff",
    objectLabel: "staff",
    icon: "fa-user-tie",
    empty: "No staff yet. Import a roster to get started.",
  },
}

/** Student status tabs — Current = active; Invited = not signed in; Alumni = inactive. */
const STUDENT_STATUS_VIEWS: {
  id: string
  label: string
  icon: string
  empty: string
  filter: (row: AdminPerson) => boolean
}[] = [
  {
    id: "all",
    label: "All",
    icon: "fa-users",
    empty: "No students in this program. Import a roster to get started.",
    filter: () => true,
  },
  {
    id: "current",
    label: "Current",
    icon: "fa-circle-check",
    empty: "No currently enrolled students.",
    filter: row => row.status === "active",
  },
  {
    id: "invited",
    label: "Invited",
    icon: "fa-envelope",
    empty: "No invited students waiting to sign in.",
    filter: row => row.status === "invited",
  },
  {
    id: "alumni",
    label: "Alumni",
    icon: "fa-user-graduate",
    empty: "No alumni in this program yet.",
    filter: row => row.status === "inactive",
  },
]

export function AdminPeopleClient({ personType }: { personType: AdminPersonType }) {
  const navigate = useNavigate()
  const meta = TYPE_META[personType]
  const typeRows = React.useMemo(
    () => ADMIN_PEOPLE.filter(person => person.type === personType),
    [personType],
  )

  const views = React.useMemo<AdminHubView<AdminPerson>[]>(() => {
    if (personType === "student") {
      return STUDENT_STATUS_VIEWS.map(view => {
        const rows = typeRows.filter(view.filter)
        return {
          id: view.id,
          label: view.label,
          icon: view.icon,
          rows,
          columns: buildAdminPeopleColumns(rows, "student"),
          emptyState: view.empty,
        }
      })
    }

    return [
      {
        id: personType,
        label: meta.title,
        icon: meta.icon,
        rows: typeRows,
        columns: buildAdminPeopleColumns(typeRows, personType),
        emptyState: meta.empty,
      },
    ]
  }, [meta.icon, meta.empty, meta.title, personType, typeRows])

  const metrics = React.useMemo(() => adminPeopleTypeKpi(typeRows, personType), [personType, typeRows])

  return (
    <AdminHubClient<AdminPerson>
      title={meta.title}
      hubKey={`people-${personType}`}
      views={views}
      metrics={metrics}
      searchAriaLabel={`Search ${meta.objectLabel}`}
      objectLabel={meta.objectLabel}
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.name}
      getRowHref={row => `/people/${row.id}`}
      onRowNavigate={href => navigate(href)}
      defaultSort={{ key: "name", dir: "asc" }}
    />
  )
}
