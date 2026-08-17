import * as React from "react"
import { useParams } from "react-router"

import {
  AdminRecordDetail,
  AdminRecordNotFound,
  type AdminRecordField,
} from "@/components/admin/admin-record-detail"
import {
  ADMIN_PEOPLE,
  ADMIN_PERSON_TYPE_LABEL,
  adminPersonUsage,
} from "@/lib/mock/admin-directory"
import { initialsFromDisplayName } from "@/lib/initials-from-name"

const BACK_TO = { label: "People", href: "/people" }

export default function AdminPersonDetailPage() {
  const { personId = "" } = useParams()
  const person = React.useMemo(
    () => ADMIN_PEOPLE.find(row => row.id === personId),
    [personId],
  )

  const usage = React.useMemo(() => (person ? adminPersonUsage(person) : []), [person])

  if (!person) {
    return (
      <AdminRecordNotFound
        backTo={BACK_TO}
        message="This person is no longer in the workspace directory. They may have been merged into another record or removed by a feed."
      />
    )
  }

  const fields: AdminRecordField[] = [
    { label: "Workspace ID", value: person.personCode, mono: true },
    { label: "Type", value: ADMIN_PERSON_TYPE_LABEL[person.type] },
    {
      label: "Email",
      value: (
        <a
          href={`mailto:${person.email}`}
          className="rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {person.email}
        </a>
      ),
    },
    { label: "Program", value: person.program },
    person.type === "student"
      ? { label: "Cohort", value: person.cohort }
      : { label: "Department", value: person.department },
  ]

  const subtitle =
    person.type === "student"
      ? `${person.program}, ${person.cohort}`
      : `${ADMIN_PERSON_TYPE_LABEL[person.type]}, ${person.department || person.program}`

  return (
    <AdminRecordDetail
      backTo={BACK_TO}
      title={person.name}
      subtitle={subtitle}
      initials={initialsFromDisplayName(person.name)}
      status={person.status}
      source={person.source}
      lastSyncedOn={person.lastSyncedOn}
      fields={fields}
      usage={usage}
      usageEmptyState="No product references this person yet. Students appear here once they are placed, and faculty once they are assigned to a course or an evaluation."
    />
  )
}
