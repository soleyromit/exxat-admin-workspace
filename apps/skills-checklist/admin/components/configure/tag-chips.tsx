"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import type { Id, Tag } from "@/lib/domain/types"

/**
 * Tags as toggle chips, as the prototype draws them in both the Add skill dialog and step 1 of the wizard. Each chip is a
 * DS Button with aria-pressed; selection also shows a check icon, so state is not carried by colour alone. Only active
 * tags are offered; a selected tag that has since been deactivated stays visible and removable, marked "(inactive)" (SL-06).
 */
export function TagChips({ tags, value, onChange, labelledBy }: { tags: Tag[]; value: Id[]; onChange: (next: Id[]) => void; labelledBy: string }) {
  const shown = tags.filter((t) => t.active || value.includes(t.id))
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap items-center gap-2">
      {shown.map((t) => {
        const on = value.includes(t.id)
        return (
          <Button key={t.id} type="button" variant="outline" size="sm" className="rounded-full" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== t.id) : [...value, t.id])}>
            <i className={on ? "fa-solid fa-check" : "fa-light fa-plus"} aria-hidden="true" />
            {t.name}
            {t.active ? "" : " (inactive)"}
          </Button>
        )
      })}
    </div>
  )
}
