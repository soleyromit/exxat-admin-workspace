import * as React from "react"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { PageFrame } from "@/components/skills/page-header"
import type { ScreenDef, VariantDef } from "@/lib/lab/screens"

/** Placeholder for a screen or variant that is not built yet. DS has no EmptyState export, so this composes Card + text. */
export function PlaceholderScreen({ screen, variant }: { screen: ScreenDef; variant: VariantDef }) {
  return (
    <PageFrame title={screen.title} subtitle={`Variant ${variant.id} is planned and not built yet.`}>
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <i className="fa-light fa-drafting-compass text-2xl text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Planned</h2>
              <Badge variant="outline">Tier {screen.tier}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">This variant tests: {variant.question}</p>
            <p className="text-sm text-muted-foreground">It must use: {screen.requiredDsComponents.join(", ")}.</p>
          </div>
        </CardContent>
      </Card>
    </PageFrame>
  )
}
