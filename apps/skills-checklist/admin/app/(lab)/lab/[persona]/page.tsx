import { notFound, redirect } from "next/navigation"
import { PERSONAS, isPersonaId } from "@/lib/lab/personas"

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

/** /lab/<persona> opens that persona's landing screen (for example /lab/admin opens the Dashboard). */
export default async function LabPersonaIndex({ params, searchParams }: { params: Promise<{ persona: string }>; searchParams: Promise<Search> }) {
  const { persona } = await params
  if (!isPersonaId(persona)) notFound()
  const def = PERSONAS.find((p) => p.id === persona)
  if (!def) notFound()
  redirect(`/lab/${persona}/${def.landing}${toQuery(await searchParams)}`)
}
