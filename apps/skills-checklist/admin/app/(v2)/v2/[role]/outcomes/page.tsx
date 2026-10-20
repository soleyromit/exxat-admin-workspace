import { notFound } from "next/navigation"
import { OutcomesPage } from "@/components/v2/outcomes/outcomes-page"
import { isRoleId } from "@/lib/v2/roles"

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!isRoleId(role) || !["admin", "reviewer", "director"].includes(role)) notFound()
  return <OutcomesPage role={role} />
}
