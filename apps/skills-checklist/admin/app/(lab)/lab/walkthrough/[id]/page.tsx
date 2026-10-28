import { notFound, redirect } from "next/navigation"
import { WALKTHROUGH_ROUTES, walkthroughStart } from "@/lib/lab/walkthrough"

/**
 * `/lab/walkthrough/admin` and `/lab/walkthrough/student` (old `setup` / `fulfillment` still resolve): the entry URLs of the walkthroughs (lib/lab/walkthrough.ts). Opens its first step in present
 * mode; the presenter control and the product's own buttons take it from there.
 */
export default async function LabWalkthroughPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const flowId = WALKTHROUGH_ROUTES[id]
  const start = flowId ? walkthroughStart(flowId) : undefined
  if (!start) notFound()
  redirect(start)
}
