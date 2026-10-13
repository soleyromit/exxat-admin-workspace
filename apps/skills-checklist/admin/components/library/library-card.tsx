"use client"

import * as React from "react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"

/**
 * The prototype's table card (P-05): a bordered card with an icon, a title and subtitle on the left, the surface's one filled
 * button on the right, then the table flush to the card edges. DS Card slots only; the shape is the DS's.
 */
export function LibraryCard({ icon, title, subtitle, action, children, headingId }: { icon: string; title: string; subtitle?: string; action?: React.ReactNode; children?: React.ReactNode; headingId?: string }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <i className={`fa-light ${icon} mt-0.5 text-muted-foreground`} aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <CardTitle asChild className="text-sm font-semibold">
              <h2 id={headingId}>{title}</h2>
            </CardTitle>
            {subtitle ? <CardDescription className="text-xs">{subtitle}</CardDescription> : null}
          </div>
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}
