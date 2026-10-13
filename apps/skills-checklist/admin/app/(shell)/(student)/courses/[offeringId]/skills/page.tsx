import { redirect } from "next/navigation"

export default async function Page({ params }: { params: Promise<{ offeringId: string }> }) {
  const { offeringId } = await params
  redirect(`/student?course=${encodeURIComponent(offeringId)}`)
}
