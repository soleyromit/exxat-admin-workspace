import { redirect } from "next/navigation"
import { ROUTES } from "@/lib/skills-routes"
import { walkthroughStart } from "@/lib/lab/walkthrough"

/** The first screen is the admin walkthrough at its first stop (Romit 2026-11-04, D-L64). `/lab` holds every variant and flow. */
export default function Landing() {
  redirect(walkthroughStart() ?? ROUTES.home)
}
