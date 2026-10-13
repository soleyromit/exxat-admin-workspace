"use client"

import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import type { Db } from "@/lib/domain/types"
import { buttons, filterIssueText } from "@/lib/copy"
import type { FilterIssue } from "@/lib/store"

/** RP-09: explains a filter combination that cannot produce evidence, instead of returning an unexplained empty result. */
export function ImpossibleFilterExplainer({ issue, db, onClear }: { issue: FilterIssue; db: Db; onClear?: () => void }) {
  return (
    <LocalBanner variant="info" action={onClear ? { label: buttons.clearFilters, onClick: onClear } : undefined}>
      {filterIssueText(issue, db)}
    </LocalBanner>
  )
}
