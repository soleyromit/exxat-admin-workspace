"use client"

/**
 * What the evaluator will answer for each chosen skill, exactly as the program configured it, read only [REQ EV-03, SC-04..SC-07;
 * Thursday flow S2 "reviewing the set of questions basis the configuration done by the admin"]. One component for every student
 * surface that shows it: Send C (its own step) and Log A (beside the self-rating), so the words never differ.
 * Nothing here changes how a skill is evaluated; the items are the program's own words (data-user-content).
 */
import * as React from "react"
import { TYPE } from "@/components/lab/type-scale"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { skillById } from "@/lib/v2/evidence-index"
import type { V2State } from "@/lib/v2/types"
import { evaluationPreview } from "@/lib/lab/student2"

export function QuestionPreview({ s, ids, columns = true, className }: { s: V2State; ids: string[]; columns?: boolean; className?: string }) {
  const previews = ids.map((id) => skillById(s, id)).filter((k): k is NonNullable<typeof k> => !!k).map(evaluationPreview)
  if (previews.length === 0) return null
  return (
    <div className={cn("grid gap-4", columns && previews.length > 1 ? "lg:grid-cols-2" : "", className)} data-question-preview>
      {previews.map((p) => (
        <section key={p.skillId} className="flex flex-col gap-2 rounded-lg border border-border p-4" aria-label={`Questions for ${p.name}`}>
          <h3 className={TYPE.group}>{p.name}</h3>
          <p className={TYPE.helper} data-viz-label>{`They answer: ${p.answer}`}</p>
          {p.items.length ? (
            <ol className="flex list-decimal flex-col gap-1 ps-5 text-sm text-foreground" data-user-content>
              {p.items.map((q) => <li key={q}>{q}</li>)}
            </ol>
          ) : null}
          {p.rule || p.notes.length ? <p className={TYPE.helper} data-user-content>{[p.rule, ...p.notes].filter(Boolean).join(" ")}</p> : null}
        </section>
      ))}
    </div>
  )
}
