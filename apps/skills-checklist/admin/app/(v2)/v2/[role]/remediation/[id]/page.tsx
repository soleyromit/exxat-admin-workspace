import { notFound } from "next/navigation"
import { RemediationPage } from "@/components/v2/outcomes/remediation-page"
import { isRoleId } from "@/lib/v2/roles"

const ALLOWED = ["admin", "reviewer", "director", "student"]

export default async function Page({ params }: { params: Promise<{ role: string; id: string }> }) {
  const { role, id } = await params
  if (!isRoleId(role) || !ALLOWED.includes(role)) notFound()
  return <RemediationPage role={role} id={id} />
}
