import { redirect } from "next/navigation"

/** The history is a dialog on the Student View (prototype). The old URL redirects to it. */
export default async function Page({ params }: { params: Promise<{ offeringId: string; skillId: string }> }) {
  const { offeringId, skillId } = await params
  redirect(`/student?course=${encodeURIComponent(offeringId)}&history=${encodeURIComponent(skillId)}`)
}
