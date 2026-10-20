import { notFound } from "next/navigation"
import { StepPage } from "@/components/v2/step-page"
import { STEPS, stepForRoute } from "@/lib/v2/scenario"

export function generateStaticParams() {
  return STEPS.map((s) => ({ role: s.role, slug: s.id }))
}

export default async function Page({ params }: { params: Promise<{ role: string; slug: string }> }) {
  const { role, slug } = await params
  const step = stepForRoute(role, slug)
  if (!step) notFound()
  return <StepPage stepId={step.id} />
}
