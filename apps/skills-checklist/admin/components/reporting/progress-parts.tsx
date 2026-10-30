import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import type { SkillProgress } from "@/lib/store"
import { surface } from "@/lib/copy"
import { reportingCopy as rc } from "@/lib/copy"
import { inSentence } from "@/lib/lab/terms"

/**
 * C-13 per-level strip (SC-10) and C-12 progress by setting (SH-05, SC-11, SC-12): HAND-ROLL on text rows and Badge
 * (docs/ux/10 §5). Numbers first, words rather than "7 / 5" notation, no progress bar, no red.
 */
export function LevelStrip({ progress }: { progress: SkillProgress }) {
  if (progress.levels.length === 0) return null
  return (
    <p className="text-xs text-muted-foreground" data-testid="level-strip">
      <span className="sr-only">{rc.rail.levelHeading}: </span>
      {progress.levels.map((l) => `${l.label} ${l.have} of ${l.min}`).join(" · ")}
    </p>
  )
}

/** One line per named clinical setting; lab or simulation evidence is reported separately and never counted (SC-12). */
export function SettingProgress({ progress }: { progress: SkillProgress }) {
  if (progress.settings.length === 0) return null
  return (
    <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground" aria-label={rc.rail.settingHeading} data-testid="setting-progress">
      {progress.settings.map((s) => (
        <li key={s.settingId}>
          <span className="text-foreground">{s.name}</span>: {s.have} of {s.needed}
          {s.labEvidence > 0 ? <span>. {rc.rail.labNotCounted(s.labEvidence)}</span> : null}
        </li>
      ))}
    </ul>
  )
}

/** Admin phrasing of what is still unmet ("Still needed: 1 in Emergency"), most actionable first, at most three (docs/ux/09 §7.2). */
export function stillNeededParts(progress: SkillProgress): string[] {
  const out: string[] = []
  const order = { settingMinimum: 0, levelMinimum: 1, requiredCount: 2 } as const
  const unmet = [...progress.evaluation.unmet].sort((a, b) => order[a.rule] - order[b.rule]).slice(0, 3)
  for (const u of unmet) {
    if (u.rule === "settingMinimum") out.push(`${u.needed - u.have} in ${inSentence(progress.settings.find((s) => s.settingId === u.settingId)?.name ?? u.settingId)}`)
    else if (u.rule === "levelMinimum") out.push(`${u.needed - u.have} at ${inSentence(progress.levels.find((l) => l.levelId === u.levelId)?.label ?? u.levelId)}`)
    else {
      const n = u.needed - u.have
      const unit = progress.total.noun === "demonstrations" ? (n === 1 ? "demonstration" : "demonstrations") : n === 1 ? "qualifying evaluation" : "qualifying evaluations"
      out.push(`${n} more ${unit}`)
    }
  }
  return out
}

export function StillNeeded({ progress }: { progress: SkillProgress }) {
  const parts = stillNeededParts(progress)
  if (parts.length === 0 || progress.evaluation.state === "achieved") return null
  return (
    <p className="text-xs text-foreground" data-testid="still-needed">
      {rc.rail.stillNeeded} {parts.join(", ")}
    </p>
  )
}

/** "4 of 5 demonstrations" in words (never the prototype's "7 / 5"). */
export function totalText(progress: SkillProgress): string {
  const { have, needed, noun } = progress.total
  const unit = noun === "demonstrations" ? "demonstrations" : "qualifying evaluations"
  return needed === null ? `${have} ${unit}` : `${have} of ${needed} ${unit}`
}

export function PerLevelBadges({ progress }: { progress: SkillProgress }) {
  if (progress.levels.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5" aria-label={rc.rail.levelHeading}>
      {progress.levels.map((l) => (
        <Badge key={l.levelId} variant="outline">
          {surface.s03.levelBreakdown(l.label, l.have, l.min)}
        </Badge>
      ))}
    </div>
  )
}
