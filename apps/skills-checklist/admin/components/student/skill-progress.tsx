"use client"

import * as React from "react"
import type { Db, Id } from "@/lib/domain/types"
import type { SkillProgress } from "@/lib/store"
import { failedRule } from "@/lib/store"
import { ruleContext, surface, skillReasonText } from "@/lib/copy"
import { studentLocal as local } from "@/lib/copy"

const s12 = surface.s12

/**
 * Progress for one skill, numbers first (never a bar as the only cue: "progress bars are last resort").
 * Shows: the total ("4 of 5 demonstrations"), the per-level strip, progress against EACH named clinical setting (SH-05),
 * the lab-evidence note (SC-12) and, when the skill is not achieved, exactly what is still needed (fixes DEFECT-07).
 */
export function SkillProgressBlock({ db, studentId, progress, showNeeded = true, id, hideTotal = false }: { db: Db; studentId: Id; progress: SkillProgress; showNeeded?: boolean; id?: string; hideTotal?: boolean }) {
  const { total, levels, settings, evaluation, skill } = progress
  const line =
    total.needed === null
      ? `${total.have} ${total.noun === "demonstrations" ? "demonstrations" : "qualifying evaluations"}`
      : total.noun === "demonstrations"
        ? s12.progress.demonstrations(total.have, total.needed)
        : s12.progress.evaluations(total.have, total.needed)
  const labTotal = settings.reduce((m, x) => Math.max(m, x.labEvidence), 0)
  const needed = React.useMemo(() => {
    if (!showNeeded || evaluation.state === "achieved" || evaluation.state === "noEvidence") return []
    const f = failedRule(db, studentId, skill.id)
    if (!f) return []
    const ctx = ruleContext(db, skill)
    // The total is already stated above as "x of y", so only level and setting gaps are listed here (no repeated count).
    return f.skillReasons.filter((u) => u.rule !== "requiredCount").map((u) => skillReasonText(u, ctx, total.noun))
  }, [db, studentId, skill, evaluation, showNeeded, total.noun])

  return (
    <div id={id} className="flex flex-col gap-1 text-sm text-muted-foreground">
      {hideTotal ? null : <p className="text-foreground">{line}</p>}
      {levels.length > 0 ? (
        <p>
          {levels.filter((l) => l.min > 0).map((l) => `${l.label} ${l.have} of ${l.min}`).join(" · ")}
        </p>
      ) : null}
      {settings.length > 0 ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
          {settings.map((st) => (
            <li key={st.settingId}>
              {s12.settingProgress(st.name, st.have, st.needed)}
              {st.have >= st.needed ? <span className="sr-only"> ({local.settingMet})</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {settings.length > 0 && labTotal > 0 ? <p>{local.labNotCounted(labTotal)}</p> : null}
      {needed.length > 0 ? (
        <div>
          <p className="font-medium text-foreground">{local.stillNeeded}</p>
          <ul className="list-disc pl-5">
            {needed.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
