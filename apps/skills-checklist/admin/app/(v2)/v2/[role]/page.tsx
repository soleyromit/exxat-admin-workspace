import { notFound } from "next/navigation"
import { RoleHome } from "@/components/v2/role-home"
import { isRoleId, ROLES } from "@/lib/v2/roles"

export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.id }))
}

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!isRoleId(role)) notFound()
  return <RoleHome role={role} />
}
