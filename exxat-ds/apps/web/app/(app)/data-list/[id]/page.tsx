import { notFound } from "next/navigation"
import { PlacementDetail } from "@/components/placement-detail"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { getPlacementById } from "@/lib/mock/placements"

export default async function PlacementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const placement = getPlacementById(Number(id))
  if (!placement) notFound()

  return (
    <PrimaryPageTemplate
      siteHeader={{
        title: "Placement Details",
        breadcrumbs: [{ label: "Placements", href: "/data-list" }],
      }}
      maxWidthClassName="max-w-4xl"
      contentClassName="px-4 lg:px-6 py-6"
      bodyClassName="overflow-y-auto"
    >
      <PlacementDetail placement={placement} />
    </PrimaryPageTemplate>
  )
}
