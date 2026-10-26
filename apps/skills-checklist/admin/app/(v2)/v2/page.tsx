import { redirect } from "next/navigation"

export default async function Page() {
  redirect("/v2/admin")
}
