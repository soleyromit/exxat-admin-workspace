import { redirect } from "next/navigation"

/**
 * Root route — redirects to the main dashboard.
 * Add additional top-level routes here as the DS grows.
 */
export default function Page() {
  redirect("/dashboard")
}
