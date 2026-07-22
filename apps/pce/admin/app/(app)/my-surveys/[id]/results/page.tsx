import { redirect } from 'next/navigation'

// Legacy faculty results route — superseded by the shared, role-gated
// /results/[id] terminal (Flow 4 · ST-15, Jul 8 2026). The id here is a
// survey id; /results/[id] resolves it to the viewer's own result.
export default async function LegacyFacultyResultsRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/results/${encodeURIComponent(id)}?from=my-surveys`)
}
