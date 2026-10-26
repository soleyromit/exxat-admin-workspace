"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import type { VariantDef } from "@/lib/lab/screens"

/** Variant switch (?variant=) shown above the screen's own page header, with the question the variant tests in one line. */
export function VariantBar({ variants, current, recommended }: { variants: VariantDef[]; current: string; recommended: string }) {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const params = useSearchParams()
  const active = variants.find((v) => v.id === current) ?? variants[0]
  // Up to 3 variants read "Variant A"; more than 3 (the dashboard carries 6) drop the word so the row stays one quiet line.
  const short = variants.length > 3
  const options = variants.map((v) => ({ value: v.id, label: `${short ? "" : "Variant "}${v.id}${v.file ? "" : short ? ", planned" : " (planned)"}` }))
  const set = (id: string) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    q.set("variant", id)
    router.replace(`${pathname}?${q.toString()}`)
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-1.5 md:px-6" data-lab-variant-bar data-lab-chrome>
      {variants.length > 1 ? <ViewSegmentedControl value={active.id} onValueChange={set} options={options} aria-label="Design variant" /> : <Badge variant="outline">Single layout</Badge>}
      {active.id === recommended && variants.length > 1 ? <Badge variant="secondary">Recommended</Badge> : null}
      <p className="min-w-0 flex-1 basis-72 truncate text-xs text-muted-foreground" title={active.question}>
        <span className="font-medium text-foreground">Tests: </span>
        {active.question}
      </p>
    </div>
  )
}
