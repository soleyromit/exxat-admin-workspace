import * as React from "react"
import { notFound } from "next/navigation"
import { ReviewQueuePage } from "@/components/v2/review/review-queue-page"
import { ReportsPage } from "@/components/v2/reports/reports-page"
import { LoadingBlocks } from "@/components/v2/shared-loading"
import { StepScreen } from "@/components/v2/step-screen"
import { STEPS, stepForRoute } from "@/lib/v2/scenario"

export function generateStaticParams() {
  // The review queue is also an administrator page (the reviewer reaches it as walkthrough step 10).
  return [...STEPS.map((s) => ({ role: s.role, slug: s.id })), { role: "admin", slug: "review-queue" }, { role: "director", slug: "reports" }]
}

export default async function Page({ params }: { params: Promise<{ role: string; slug: string }> }) {
  const { role, slug } = await params
  if (role === "admin" && slug === "review-queue") {
    return (
      <React.Suspense fallback={<LoadingBlocks label="Opening the page" rows={5} />}>
        <ReviewQueuePage role="admin" />
      </React.Suspense>
    )
  }
  if (role === "director" && slug === "reports") return <ReportsPage role="director" />
  const step = stepForRoute(role, slug)
  if (!step) notFound()
  return (
    <React.Suspense fallback={<LoadingBlocks label="Opening the page" rows={5} />}>
      <StepScreen stepId={step.id} />
    </React.Suspense>
  )
}
