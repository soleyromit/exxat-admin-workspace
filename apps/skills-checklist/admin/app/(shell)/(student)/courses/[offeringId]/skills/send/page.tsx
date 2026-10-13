import { redirect } from "next/navigation"

/** Deep link for S-13: opens the Send for review dialog for the skills named in `?skills=a,b` on the Student View. */
export default async function Page({ params, searchParams }: { params: Promise<{ offeringId: string }>; searchParams: Promise<{ skills?: string }> }) {
  const { offeringId } = await params
  const { skills } = await searchParams
  const qs = new URLSearchParams({ course: offeringId, send: "1" })
  if (skills) qs.set("skills", skills)
  redirect(`/student?${qs.toString()}`)
}
