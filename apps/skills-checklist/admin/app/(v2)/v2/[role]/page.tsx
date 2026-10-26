import { notFound, redirect } from "next/navigation"
import { RoleHome } from "@/components/v2/role-home"
import { isRoleId, ROLE_BY_ID, ROLES } from "@/lib/v2/roles"

export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.id }))
}

export default async function Page({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  if (!isRoleId(role)) notFound()
  // Reviewer, director and preceptor have no Home: they land on the role's explicit `landing` page (director: Records).
  if (role !== "admin" && role !== "student") redirect(ROLE_BY_ID[role].landing)
  return <RoleHome role={role} />
}
