// Small lookups and structured summaries shared by selectors. No copy here: wording lives in lib/copy.
import type { CourseOffering, Db, Id, Skill } from "@/lib/domain/types"
import type { Responses } from "@/lib/engine"

export const byId = <T extends { id: Id }>(list: T[], id: Id | null | undefined): T | undefined => (id ? list.find((x) => x.id === id) : undefined)

export const settingName = (db: Db, id: Id | null | undefined): string | null => byId(db.clinicalSettings, id)?.name ?? null
export const locationName = (db: Db, id: Id | null | undefined): string | null => byId(db.locations, id)?.name ?? null
export const roleLabel = (db: Db, id: string): string => db.roles.find((r) => r.id === id)?.label ?? id

export const offeringLabel = (o: CourseOffering): string => `${o.code} ${o.name}, ${o.term} ${o.academicYear.slice(0, 4)}`

/** Structured, copy-free description of "what the achievement criteria ask for" (S-04 column, S-09 preview). */
export type CriteriaPart =
  | { kind: "required"; n: number; noun: "demonstrations" | "qualifyingEvaluations" }
  | { kind: "level"; levelId: Id; label: string; min: number }
  | { kind: "setting"; settingId: Id; name: string; min: number }

export function criteriaParts(db: Db, skill: Skill): CriteriaPart[] {
  if (!skill.model) return []
  const out: CriteriaPart[] = []
  const c = skill.criteria
  if (c.requiredCount !== null) out.push({ kind: "required", n: c.requiredCount, noun: skill.model.kind === "demonstration" ? "demonstrations" : "qualifyingEvaluations" })
  if (skill.model.kind === "demonstration") {
    for (const l of skill.model.levels) {
      const min = c.levelMinimums[l.id]
      if (min) out.push({ kind: "level", levelId: l.id, label: l.label, min })
    }
  }
  for (const [id, min] of Object.entries(c.settingMinimums)) out.push({ kind: "setting", settingId: id, name: settingName(db, id) ?? id, min })
  return out
}

/** RP-07: the full recorded answers, never only a summary such as "9 of 12 answered Yes". */
export type RecordedDetail =
  | { kind: "binary"; label: string }
  | { kind: "question"; yes: number; total: number; items: Array<{ id: Id; text: string; yes: boolean }> }
  | { kind: "scored"; items: Array<{ id: Id; text: string; score: number }>; average: number; total: number }
  | { kind: "demonstration"; level: string }

export function recordedDetail(skill: Skill, r: Responses): RecordedDetail | null {
  const m = skill.model
  if (!m || m.kind !== r.kind) return null
  switch (m.kind) {
    case "binary": {
      const x = r as Extract<Responses, { kind: "binary" }>
      return { kind: "binary", label: m.labels[x.labelId].label }
    }
    case "question": {
      const x = r as Extract<Responses, { kind: "question" }>
      const items = m.questions.map((q) => ({ id: q.id, text: q.text, yes: x.answers[q.id] === true }))
      return { kind: "question", yes: items.filter((i) => i.yes).length, total: items.length, items }
    }
    case "scored": {
      const x = r as Extract<Responses, { kind: "scored" }>
      const items = m.questions.map((q) => ({ id: q.id, text: q.text, score: x.scores[q.id] }))
      const total = items.reduce((a, b) => a + (b.score ?? 0), 0)
      return { kind: "scored", items, total, average: items.length ? total / items.length : 0 }
    }
    case "demonstration": {
      const x = r as Extract<Responses, { kind: "demonstration" }>
      return { kind: "demonstration", level: m.levels.find((l) => l.id === x.levelId)?.label ?? x.levelId }
    }
  }
}
