import { redirect } from "next/navigation"
import { ROUTES } from "@/lib/skills-routes"

export default function Landing() {
  redirect(ROUTES.home)
}
