import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exxatdesignux/ui/components/ui/card"
import { PageFrame } from "@/components/skills/page-header"
import type { PlaceholderMeta } from "@/lib/skills-routes"

/**
 * Scaffold-only page body. One h1, one purpose line (copy from docs/ux/09), and the confirmed
 * contract this surface will be built from. No data, no feature logic. Replace per surface.
 */
export function PlaceholderPage({ meta }: { meta: PlaceholderMeta }) {
  return (
    <PageFrame title={meta.title} subtitle={meta.subtitle}>
      <PlaceholderBody meta={meta} />
    </PageFrame>
  )
}

/** The "Not built yet" card alone, for a placeholder that lives inside another page (a tab panel). */
export function PlaceholderBody({ meta }: { meta: PlaceholderMeta }) {
  return (
    <>
      <Card>
        <CardHeader>
          {/* asChild: the DS CardTitle is an h3; under the page h1 the next level is h2 (WCAG heading order). */}
          <CardTitle asChild className="flex items-center gap-2 text-base">
            <h2>
              Not built yet
              <Badge variant="outline">{meta.surface}</Badge>
            </h2>
          </CardTitle>
          <CardDescription>
            This surface is built from its confirmed contract: {meta.contract}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The scaffold provides the shell and route only.
        </CardContent>
      </Card>
    </>
  )
}
