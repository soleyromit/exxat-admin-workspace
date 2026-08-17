import * as React from "react"
import { useParams } from "react-router"

import {
  AdminRecordDetail,
  AdminRecordNotFound,
  type AdminRecordField,
} from "@/components/admin/admin-record-detail"
import { ADMIN_PERSONNEL, adminPersonnelUsage } from "@/lib/mock/admin-directory"
import { initialsFromDisplayName } from "@/lib/initials-from-name"

const BACK_TO = { label: "Personnel", href: "/personnel" }

export default function AdminPersonnelDetailPage() {
  const { personnelId = "" } = useParams()
  const person = React.useMemo(
    () => ADMIN_PERSONNEL.find(row => row.id === personnelId),
    [personnelId],
  )

  const usage = React.useMemo(() => (person ? adminPersonnelUsage(person) : []), [person])

  if (!person) {
    return (
      <AdminRecordNotFound
        backTo={BACK_TO}
        message="This personnel record is no longer in the workspace. The site may have sent a replacement roster that dropped it."
      />
    )
  }

  const fields: AdminRecordField[] = [
    { label: "Workspace ID", value: person.personCode, mono: true },
    { label: "Role", value: person.role },
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
    { label: "Brand", value: person.brand },
    { label: "Site", value: person.site },
    { label: "Credentials", value: person.credential },
  ]

  return (
    <AdminRecordDetail
      backTo={BACK_TO}
      title={person.name}
      subtitle={`${person.role}, ${person.site}`}
      initials={initialsFromDisplayName(person.name)}
      status={person.status}
      source={person.source}
      lastSyncedOn={person.lastSyncedOn}
      fields={fields}
      usage={usage}
      usageEmptyState="No product references this person yet. They appear here once they are named on a placement or given a preceptor assignment."
    />
  )
}
