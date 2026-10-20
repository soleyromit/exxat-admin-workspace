import { notFound } from "next/navigation"
import { VerificationRecordPage } from "@/components/v2/director/verification-pages"
import { isRoleId } from "@/lib/v2/roles"

export default async function Page({ params }: { params: Promise<{ role: string; studentId: string }> }) {
  const { role, studentId } = await params
  if (!isRoleId(role) || !["admin", "reviewer", "director"].includes(role)) notFound()
  return <VerificationRecordPage role={role} studentId={studentId} />
}
