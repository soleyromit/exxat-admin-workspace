import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { LabFrame } from "@/components/lab/lab-frame"
import { LabBar } from "@/components/lab/lab-bar"
import { PlaceholderScreen } from "@/components/lab/placeholder-screen"
import { VARIANT_COMPONENTS } from "@/components/lab/screens"
import { isPersonaId } from "@/lib/lab/personas"
import { findFlow, resolveStep } from "@/lib/lab/flows"
import { isPresent } from "@/lib/lab/present"
import { screenKey } from "@/lib/lab/screens"

type Search = Record<string, string | string[] | undefined>

/**
 * `/lab/flow/{flow}/{step}?set=n`: one step of a flow in one option set (03-lab-architecture.md section 5.1). Resolves the
 * step's screen and the variant the set maps to, and renders it in the screen persona's frame with the lab bar. A step that
 * needs extra params (the publish step) gets them merged into the URL with a redirect, only when they are absent. An explicit
 * `?variant=` (a screen switching its own variant) wins over the set.
 */
export default async function LabFlowStepPage({ params, searchParams }: { params: Promise<{ flow: string; step: string }>; searchParams: Promise<Search> }) {
  const { flow: flowId, step: stepId } = await params
  const sp = await searchParams
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined)
  // Present mode shows only the recommended variant of each screen (granola 2026-10-26 item 20).
  const present = isPresent(one("present"))
  const requestedSet = present ? findFlow(flowId)?.recommendedSet : one("set")
  const r = resolveStep(flowId, stepId, requestedSet)
  if (!r) notFound()

  const missing = Object.entries(r.params).filter(([k]) => one(k) === undefined)
  if (missing.length) {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v)
    q.set("set", r.set)
    for (const [k, v] of missing) q.set(k, v)
    redirect(`/lab/flow/${flowId}/${stepId}?${q.toString()}`)
  }

  const persona = r.screen.persona
  if (!isPersonaId(persona)) notFound()
  const override = present ? undefined : one("variant")
  const variant = (override && r.screen.variants.find((v) => v.id === override)) || r.variant
  const key = `${screenKey(r.screen)}/${variant.id}`
  const Built = variant.file ? VARIANT_COMPONENTS[key] : undefined
  const navPersona = isPersonaId(r.flow.persona) ? r.flow.persona : persona
  const bar = (
    <React.Suspense fallback={<div className="h-10 shrink-0 border-b border-border" data-lab-chrome aria-hidden="true" />}>
      <LabBar persona={navPersona} flow={r.flow.id} step={r.step.id} set={r.set} variant={variant.id} />
    </React.Suspense>
  )
  return (
    <LabFrame persona={persona} navPersona={navPersona} title={r.screen.title} bar={bar} page={{ flow: r.flow.id, step: r.step.id, screen: screenKey(r.screen), variant: variant.id }}>
      <React.Suspense fallback={null}>{Built ? <Built /> : <PlaceholderScreen screen={r.screen} variant={variant} />}</React.Suspense>
    </LabFrame>
  )
}
