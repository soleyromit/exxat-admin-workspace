import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import type { LineageStep } from "@/lib/copy"
import * as surface from "@/lib/copy/surfaces"

/**
 * C-1: the pinned "Configuration lineage" panel (SC-17). Skeleton: props are the five steps already worded by
 * lib/copy/lineage.ts. The S-09 worker may extend it (highlight the step being edited, anchor links). It is an ordered
 * list, so the dependency reads top to bottom for assistive tech.
 */
export function ModelCriteriaLineage({ steps, title = "How this skill is determined" }: { steps: LineageStep[]; title?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle asChild className="text-sm font-semibold">
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{surface.s09.lineage.helper}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-col gap-0.5 border-l-2 border-border pl-3">
              <span className="text-xs font-medium text-muted-foreground">
                {i + 1}. {s.label}
              </span>
              <span className="text-sm text-foreground">{s.value}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
