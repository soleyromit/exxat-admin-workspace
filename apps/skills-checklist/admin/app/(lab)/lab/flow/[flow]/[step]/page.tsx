import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { LabFrame } from "@/components/lab/lab-frame"
import { LabBar } from "@/components/lab/lab-bar"
import { PlaceholderScreen } from "@/components/lab/placeholder-screen"
import { VARIANT_COMPONENTS } from "@/components/lab/screens"
import { isPersonaId } from "@/lib/lab/personas"
import { findFlow, resolveStep } from "@/lib/lab/flows"
import { isPresent } from "@/lib/lab/present"
import { effectiveStep } from "@/lib/lab/walkthrough"
import { screenKey } from "@/lib/lab/screens"
import { legacySettingsHref } from "@/lib/lab/admin-ia"

/** Screens whose flow steps are titled by the step in the breadcrumb too (groups of skills, assign, map). */
const STEP_TITLED_SCREENS = new Set(["admin/lists-cohorts", "admin/course-mapping"])

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
  // A Settings step opened on a section that moved (an old link): Categories and tags is its own page under Skills (D-L21), Lab
  // instructors is the Evaluators section (D-L24).
  if (screenKey(r.screen) === "admin/settings") {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v)
    const moved = legacySettingsHref(q)
    if (moved) redirect(moved)
  }

  const missing = Object.entries(r.params).filter(([k]) => one(k) === undefined)
  if (missing.length) {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v)
    q.set("set", r.set)
    for (const [k, v] of missing) q.set(k, v)
    redirect(`/lab/flow/${flowId}/${stepId}?${q.toString()}`)
  }

  // A walkthrough screen that moves on by its own params (Send C's Continue, My progress opening a course) stays on its route:
  // the step it is really on names the page and drives the presenter control (lib/lab/walkthrough.ts effectiveStep).
  const step = effectiveStep(r.flow, r.step, r.set, { get: (k) => one(k) ?? null })
  const persona = r.screen.persona
  if (!isPersonaId(persona)) notFound()
  const override = present ? undefined : one("variant")
  const variant = (override && r.screen.variants.find((v) => v.id === override)) || r.variant
  const key = `${screenKey(r.screen)}/${variant.id}`
  const Built = variant.file ? VARIANT_COMPONENTS[key] : undefined
  const navPersona = isPersonaId(r.flow.persona) ? r.flow.persona : persona
  const bar = (
    <React.Suspense fallback={<div className="h-10 shrink-0 border-b border-border" data-lab-chrome aria-hidden="true" />}>
      <LabBar persona={navPersona} flow={r.flow.id} step={step.id} set={r.set} variant={variant.id} />
    </React.Suspense>
  )
  return (
    // A walkthrough names each page by its step, one string per step for the step, the breadcrumb and the page (comprehension
    // audit 2026-10-27); the design flows keep the screen's registry title, except Sankalp's A4 to A6 steps (2026-10-27: the
    // step, the breadcrumb and the H1 all say the step), where one screen serves two jobs (groups of skills, assign).
    <LabFrame persona={persona} navPersona={navPersona} title={r.flow.walkthrough || STEP_TITLED_SCREENS.has(step.screen) ? step.label : r.screen.title} bar={bar} page={{ flow: r.flow.id, step: step.id, screen: screenKey(r.screen), variant: variant.id }}>
      <React.Suspense fallback={null}>{Built ? <Built /> : <PlaceholderScreen screen={r.screen} variant={variant} />}</React.Suspense>
    </LabFrame>
  )
}
