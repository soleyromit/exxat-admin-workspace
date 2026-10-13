"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { r2c } from "@/lib/copy/r2-configure"
import type { Db, Skill, SkillStatusDisplay } from "@/lib/domain/types"
import type { ModelConfig } from "@/lib/engine"
import { criteriaParts } from "@/lib/store"
import { lineageSteps, statusLabel } from "@/lib/copy"

const L = r2c.lineage

/** The prototype's wording for what one evaluation records ("Met or Unmet", "Yes / No per question", ...). */
export function lineageEvidence(m: ModelConfig | null): string {
  if (!m) return "Not yet defined"
  switch (m.kind) {
    case "binary":
      return `${m.labels.a.label.trim() || "First outcome"} or ${m.labels.b.label.trim() || "second outcome"}`
    case "question":
      return "Yes / No per question"
    case "scored":
      return "A score per question"
    case "demonstration":
      return m.levels.length ? m.levels.map((l) => l.label.trim() || "Unnamed level").join(" / ") : "A level of supervision"
  }
}

/** The prototype's wording for when one evaluation qualifies ("Overall outcome is Met", "Q2 and Q3 answered Yes", ...). */
export function lineageQualifies(m: ModelConfig | null): string {
  if (!m) return "Not yet defined"
  switch (m.kind) {
    case "binary": {
      const q = m.qualifyingLabelId ? m.labels[m.qualifyingLabelId].label.trim() : ""
      return q ? `Overall outcome is ${q}` : "A qualifying outcome is not chosen yet"
    }
    case "question": {
      if (m.rule.kind === "all") return "All questions answered Yes"
      if (m.rule.kind === "atLeast") return `At least ${m.rule.n} of ${m.questions.length} answered Yes`
      const ids = m.rule.questionIds
      const names = m.questions.flatMap((q, i) => (ids.includes(q.id) ? [`Q${i + 1}`] : []))
      if (names.length === 0) return "No question is selected yet"
      return `${names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`} answered Yes`
    }
    case "scored":
      return m.rule.kind === "average" ? `Average score is ${m.rule.min} or above` : m.rule.kind === "minPerQuestion" ? `Every question scores ${m.rule.min} or above` : `Total score is ${m.rule.min} or above`
    case "demonstration":
      return "Each completed demonstration counts as evidence"
  }
}

/**
 * C-1 (SC-17), pinned at the right of steps 2 and 3, as the prototype draws it: the heading CONFIGURATION LINEAGE, five rows
 * joined by a vertical connector, and the footnote. The row that just changed is marked with TEXT ("Updated") plus a one
 * second background that is dropped under prefers-reduced-motion; changes are announced politely by the editor.
 */
export function LineagePanel({ db, skill, display, onChanged }: { db: Db; skill: Skill; display: SkillStatusDisplay; onChanged?: (labels: string[]) => void }) {
  const parts = criteriaParts(db, skill)
  const base = lineageSteps(skill.model, skill.criteria, parts, display)
  const none = !skill.model
  const steps = [
    { label: L.labels[0], value: skill.model ? r2c.step2.models[skill.model.kind].title : "Not chosen" },
    { label: L.labels[1], value: lineageEvidence(skill.model) },
    { label: L.labels[2], value: lineageQualifies(skill.model) },
    { label: L.labels[3], value: base[3]?.value ?? "" },
    { label: L.labels[4], value: display === "four" ? (["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"] as const).map((k) => statusLabel(k, display)).join(" → ") : L.statusMerged },
  ].map((x) => (none ? { ...x, value: L.waiting } : x))
  const prev = React.useRef<string[] | null>(null)
  const [changed, setChanged] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    const values = steps.map((s) => s.value)
    if (prev.current) {
      const next = new Set<number>()
      values.forEach((v, i) => {
        // The first fill after "Waiting on the step above" is not a change to announce.
        if (v !== prev.current![i] && prev.current![i] !== L.waiting) next.add(i)
      })
      if (next.size) {
        setChanged(next)
        const t = window.setTimeout(() => setChanged(new Set()), 1000)
        // Polite announcement, debounced so typing does not read out every keystroke.
        const a = window.setTimeout(() => onChanged?.([...next].map((i) => steps[i].label)), 600)
        prev.current = values
        return () => {
          window.clearTimeout(t)
          window.clearTimeout(a)
        }
      }
    }
    prev.current = values
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.map((s) => s.value).join("|")])

  return (
    <Card size="sm" id="sec-lineage">
      <CardHeader>
        <CardTitle asChild className="text-sm font-semibold">
          <h3>{L.title}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol aria-label={L.title} className="flex flex-col">
          {steps.map((s, i) => (
            <li key={s.label} data-changed={changed.has(i) ? "true" : undefined} className="relative flex flex-col gap-0.5 border-l-2 border-border pb-3 pl-4 last:border-l-transparent last:pb-0 data-[changed=true]:bg-muted motion-reduce:transition-none">
              <span aria-hidden="true" className="absolute -left-[5px] top-1 size-2 rounded-full bg-border" />
              <span className="text-xs font-medium text-muted-foreground">
                {s.label}
                {changed.has(i) ? ` (${L.updated.toLowerCase()})` : ""}
              </span>
              <span className="text-sm text-foreground">{s.value}</span>
            </li>
          ))}
        </ol>
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">{L.footnote}</p>
      </CardContent>
    </Card>
  )
}
