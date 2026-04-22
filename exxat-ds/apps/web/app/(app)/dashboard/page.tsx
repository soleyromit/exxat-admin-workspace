import dynamic from "next/dynamic"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Skeleton } from "@/components/ui/skeleton"
import { DASHBOARD_METRICS, DASHBOARD_INSIGHT } from "@/lib/mock/dashboard"

const DashboardTabs = dynamic(
  () => import("@/components/dashboard-tabs").then(m => ({ default: m.DashboardTabs })),
  {
    loading: () => (
      <div className="flex flex-col gap-4 p-4 md:p-6" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-9 w-56 max-w-full" />
        <Skeleton className="h-11 w-full max-w-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="min-h-[320px] w-full rounded-xl" />
      </div>
    ),
  },
)

export default function Page() {
  return (
    <PrimaryPageTemplate siteHeader={{ title: "Dashboard" }}>
      <DashboardTabs
        title="Dashboard"
        subtitle="Good morning, Himanshu · Overview for March 2026"
        metrics={DASHBOARD_METRICS}
        insight={DASHBOARD_INSIGHT}
      />
    </PrimaryPageTemplate>
  )
}
