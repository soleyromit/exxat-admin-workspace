import { notFound } from "next/navigation"
import { ReviewItemPage } from "@/components/v2/review/review-item-page"
import { isRoleId } from "@/lib/v2/roles"

export default async function Page({ params }: { params: Promise<{ role: string; id: string }> }) {
  const { role, id } = await params
  if (!isRoleId(role) || !["admin", "reviewer"].includes(role)) notFound()
  return <ReviewItemPage role={role} id={id} />
}
