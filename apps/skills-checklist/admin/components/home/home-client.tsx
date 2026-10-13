"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ROUTES } from "@/lib/skills-routes"
import { useDb } from "@/lib/store/react"
import { PageFrame } from "@/components/skills"
import { home } from "@/lib/copy/home"
import { HomeErrorBanner, HomeView, type HomeStatus } from "./home-view"

/**
 * Catches a failure while Home loads or derives its figures (store read, derivation) in every environment and shows the
 * error banner with a real retry, which clears the error and re-runs the load. The page frame stays so nothing goes blank.
 */
export class HomeErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  retry = () => this.setState({ failed: false })
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <PageFrame title={home.title} subtitle={home.subtitle}>
        <HomeErrorBanner onRetry={this.retry} />
      </PageFrame>
    )
  }
}

/**
 * Connected Home. Shows the skeleton until the persisted program data has loaded (so a first paint never flashes the seed),
 * then derives everything from the store. `?imported=<n>` shows the post-import reminder (Su state). In development only,
 * `?preview=loading|error` forces those two states so they can be reviewed (a real failure is caught by HomeErrorBoundary).
 */
function HomeConnected() {
  const db = useDb()
  const sp = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const preview = process.env.NODE_ENV !== "production" ? sp?.get("preview") : null
  const forced: HomeStatus | null = preview === "loading" || preview === "error" ? preview : null
  const status: HomeStatus = forced ?? (mounted ? "ready" : "loading")

  const raw = Number(sp?.get("imported") ?? "")
  const imported = Number.isInteger(raw) && raw > 0 ? raw : null
  const clean = React.useCallback(() => router.replace(ROUTES.home, { scroll: false }), [router])

  return <HomeView db={db} status={status} onRetry={forced === "error" ? clean : undefined} imported={imported} onDismissImported={clean} />
}

export function HomeClient() {
  return (
    <HomeErrorBoundary>
      <HomeConnected />
    </HomeErrorBoundary>
  )
}
