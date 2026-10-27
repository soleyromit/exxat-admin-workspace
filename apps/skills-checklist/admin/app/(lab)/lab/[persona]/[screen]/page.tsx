import * as React from "react"
import { notFound, redirect } from "next/navigation"
import { LabFrame } from "@/components/lab/lab-frame"
import { LabBar } from "@/components/lab/lab-bar"
import { PlaceholderScreen } from "@/components/lab/placeholder-screen"
import { VARIANT_COMPONENTS } from "@/components/lab/screens"
import { isPersonaId } from "@/lib/lab/personas"
import { findScreen, resolveVariant, screenKey } from "@/lib/lab/screens"
import { isPresent } from "@/lib/lab/present"
import { legacyDirectoryHref, legacySettingsHref } from "@/lib/lab/admin-ia"

/** Short slugs that point at a registered screen (03-lab-architecture.md section 5.1). Query params are kept. */
const ALIASES: Record<string, string> = { "admin/import": "admin/import-ai-review" }

type Search = Record<string, string | string[] | undefined>

function toQuery(sp: Search): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x))
    else if (v !== undefined) q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ""
}

export default async function LabScreenPage({ params, searchParams }: { params: Promise<{ persona: string; screen: string }>; searchParams: Promise<Search> }) {
  const { persona, screen: slug } = await params
  const sp = await searchParams
  const alias = ALIASES[`${persona}/${slug}`]
  if (alias) redirect(`/lab/${alias}${toQuery(sp)}`)
  // Categories and tags left Settings for its own page under Skills (D-L21); Lab instructors and the evaluator directory are the
  // Settings section Evaluators (D-L24): old links land where the content lives now.
  if (persona === "admin" && slug === "settings") {
    const moved = legacySettingsHref(new URLSearchParams(toQuery(sp)))
    if (moved) redirect(moved)
  }
  if (persona === "admin" && slug === "evaluator-directory") redirect(legacyDirectoryHref(new URLSearchParams(toQuery(sp))))
  if (!isPersonaId(persona)) notFound()
  const screen = findScreen(persona, slug)
  if (!screen) notFound()
  // Present mode shows only the recommended variant (granola 2026-10-26 item 20).
  const present = isPresent(typeof sp.present === "string" ? sp.present : undefined)
  const requested = !present && typeof sp.variant === "string" ? sp.variant : undefined
  const variant = resolveVariant(screen, requested)
  const key = `${screenKey(screen)}/${variant.id}`
  const Built = variant.file ? VARIANT_COMPONENTS[key] : undefined
  const bar = (
    <React.Suspense fallback={<div className="h-10 shrink-0 border-b border-border" data-lab-chrome aria-hidden="true" />}>
      <LabBar persona={persona} screen={screenKey(screen)} variant={variant.id} />
    </React.Suspense>
  )
  return (
    <LabFrame persona={persona} bar={bar} page={{ screen: screenKey(screen), variant: variant.id }}>
      <React.Suspense fallback={null}>{Built ? <Built /> : <PlaceholderScreen screen={screen} variant={variant} />}</React.Suspense>
    </LabFrame>
  )
}
