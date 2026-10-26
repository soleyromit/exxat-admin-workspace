import { notFound, redirect } from "next/navigation"
import { findFlow, mainSteps } from "@/lib/lab/flows"

type Search = Record<string, string | string[] | undefined>

/**
 * `/lab/flow/{flow}?set=n` opens the flow's first step with the same query. The sidebar links a row to its flow here, so
 * every step of that flow (`/lab/flow/{flow}/...`) highlights the row by path prefix.
 */
export default async function LabFlowPage({ params, searchParams }: { params: Promise<{ flow: string }>; searchParams: Promise<Search> }) {
  const { flow: id } = await params
  const sp = await searchParams
  const flow = findFlow(id)
  const first = flow ? mainSteps(flow)[0] : undefined
  if (!flow || !first) notFound()
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v)
  const s = q.toString()
  redirect(`/lab/flow/${flow.id}/${first.id}${s ? `?${s}` : ""}`)
}
