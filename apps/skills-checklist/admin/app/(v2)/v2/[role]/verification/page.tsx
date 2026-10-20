import { notFound } from "next/navigation"
import { VerificationListPage } from "@/components/v2/director/verification-pages"
import { isRoleId } from "@/lib/v2/roles"

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!isRoleId(role) || !["admin", "reviewer", "director"].includes(role)) notFound()
  return <VerificationListPage role={role} />
}
// staff roles read the list; only the director verifies
