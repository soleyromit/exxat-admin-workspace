import { Suspense } from "react"
import { MappingWorkspace } from "@/components/mapping/mapping-workspace"

export default async function Page({ params }: { params: Promise<{ offeringId: string }> }) {
  const { offeringId } = await params
  return (
    <Suspense>
      <MappingWorkspace offeringId={offeringId} />
    </Suspense>
  )
}
