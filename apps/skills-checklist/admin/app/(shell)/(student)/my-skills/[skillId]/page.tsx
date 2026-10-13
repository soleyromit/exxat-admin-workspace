import { Suspense } from "react"
import { HistoryView } from "@/components/student/history-view"

export default async function Page({ params }: { params: Promise<{ skillId: string }> }) {
  const { skillId } = await params
  return (
    <Suspense fallback={null}>
      <HistoryView skillId={skillId} />
    </Suspense>
  )
}
