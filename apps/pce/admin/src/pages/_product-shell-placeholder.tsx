import { useLocation, useParams } from "react-router"

import { PageHeader } from "@/components/page-header"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Card, CardContent } from "@/components/ui/card"
import { useProduct } from "@/contexts/product-context"
import { prismHubMetaForSegment } from "@/lib/prism-hub-meta"
import { oneSchoolsHubMetaForSegment } from "@/lib/one-schools-hub-meta"
import { oneSitesHubMetaForSegment } from "@/lib/one-sites-hub-meta"

/**
 * Generic hub placeholder for tenant product routes under
 * `/:productRootSegment/<hub>/*`. Renders DS chrome + an empty body until
 * the hub ships a real `ListPageTemplate` surface.
 */
export default function ProductShellPlaceholder() {
  const { pathname } = useLocation()
  const { productRootSegment = "" } = useParams()
  const { product } = useProduct()

  const pathSegments = pathname.split("/").filter(Boolean)
  const hubSegment = pathSegments[1] ?? productRootSegment
  const meta =
    product === "exxat-one-schools"
      ? oneSchoolsHubMetaForSegment(hubSegment)
      : product === "exxat-one-sites"
        ? oneSitesHubMetaForSegment(hubSegment)
        : prismHubMetaForSegment(hubSegment)

  return (
    <PrimaryPageTemplate siteHeader={{ title: meta.title }}>
      <div className="flex flex-col gap-6 py-4 md:py-6">
        <PageHeader title={meta.title} subtitle={meta.description} />
        <Card
          size="sm"
          className="mx-4 min-h-[40vh] border-dashed bg-card/40 text-center lg:mx-6"
          role="status"
        >
          <CardContent className="flex h-full flex-col items-center justify-center py-6">
            <span
              aria-hidden="true"
              className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary-panel-bg text-xl text-brand"
            >
              <i className="fa-light fa-compass-drafting" />
            </span>
            <p className="max-w-md text-sm font-medium text-foreground">
              {meta.title} is not available yet.
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Ask your Exxat administrator when this hub opens for your program.
            </p>
          </CardContent>
        </Card>
      </div>
    </PrimaryPageTemplate>
  )
}
