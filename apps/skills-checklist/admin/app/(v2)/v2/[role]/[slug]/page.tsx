import * as React from "react"
import { notFound } from "next/navigation"
import { StepPage } from "@/components/v2/step-page"
import { ReviewQueuePage } from "@/components/v2/review/review-queue-page"
import { StepScreen } from "@/components/v2/step-screen"
import { STEPS, stepForRoute } from "@/lib/v2/scenario"

export function generateStaticParams() {
  // The review queue is also an administrator page (the reviewer reaches it as scenario step 10).
  return [...STEPS.map((s) => ({ role: s.role, slug: s.id })), { role: "admin", slug: "review-queue" }]
}

export default async function Page({ params }: { params: Promise<{ role: string; slug: string }> }) {
  const { role, slug } = await params
  if (role === "admin" && slug === "review-queue") {
    return (
      <React.Suspense fallback={null}>
        <ReviewQueuePage role="admin" />
      </React.Suspense>
    )
  }
  const step = stepForRoute(role, slug)
  if (!step) notFound()
  return (
    <React.Suspense fallback={null}>
      <StepScreen stepId={step.id} fallback={<StepPage stepId={step.id} />} />
    </React.Suspense>
  )
}
