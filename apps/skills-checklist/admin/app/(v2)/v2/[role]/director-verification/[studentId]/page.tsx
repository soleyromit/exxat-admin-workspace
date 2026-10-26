import { notFound } from "next/navigation"
import { VerificationRecordPage } from "@/components/v2/director/verification-pages"

/** The director's record page under the Records row's own path, so the sidebar lights Records (the DS matches nav rows by path prefix). */
export default async function Page({ params }: { params: Promise<{ role: string; studentId: string }> }) {
  const { role, studentId } = await params
  if (role !== "director") notFound()
  return <VerificationRecordPage role="director" studentId={studentId} />
}
