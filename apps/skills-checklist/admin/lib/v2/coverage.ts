import { qualifiedEvaluators } from "./rules"
import type { Skill, V2State } from "./types"

export interface CoverageWarning {
  id: string
  kind: "no-mandatory" | "not-in-use" | "setting-missing" | "no-evaluator" | "unconfigured-mapped"
  skillId: string | null
  message: string
}

/** Why a skill cannot be mapped yet, or null when it can. An unconfigured skill cannot be mapped or submitted against (IM-09). */
export function mapBlockReason(skill: Skill): string | null {
  if (!skill.configured || !skill.model || !skill.config) {
    return "Configure this skill first. A skill with no evaluation model cannot be mapped to a course or submitted against."
  }
  return null
}

/**
 * Gaps in how a course is covered, derived from the mapping and the configured rules. These are warnings for the program, not
 * eligibility rules (CM-05). [PROPOSED] The "setting missing" reading is an inference: a mandatory skill that needs evidence in a
 * named clinical setting the course does not place students in cannot be completed through that course.
 */
export function coverageWarnings(s: V2State, courseId: string = s.course.id): CoverageWarning[] {
  const rows = s.mappings.filter((m) => m.courseId === courseId)
  const mandatory = rows.filter((m) => m.level === "mandatory")
  const out: CoverageWarning[] = []
  const code = s.course.code

  if (mandatory.length === 0) {
    out.push({ id: "no-mandatory", kind: "no-mandatory", skillId: null, message: `${code} has no mandatory skills. Students will see nothing they must complete.` })
  }

  for (const row of rows) {
    const skill = s.skills.find((k) => k.id === row.skillId)
    if (!skill) continue
    const blocked = mapBlockReason(skill)
    if (blocked) {
      out.push({ id: `unconfigured-${skill.id}`, kind: "unconfigured-mapped", skillId: skill.id, message: `${skill.name} is mapped but not configured, so students cannot submit against it. Configure it or remove the mapping.` })
      continue
    }
    if (row.level !== "mandatory" || !skill.config) continue
    if (!skill.published) {
      out.push({ id: `not-in-use-${skill.id}`, kind: "not-in-use", skillId: skill.id, message: `${skill.name} is mandatory but not in use yet, so students cannot see it. Publish it from the configure screen.` })
    }
    for (const m of skill.config.achievement.settingMinimums) {
      if (m.setting && !s.course.clinicalSettings.includes(m.setting)) {
        out.push({
          id: `setting-${skill.id}-${m.setting}`,
          kind: "setting-missing",
          skillId: skill.id,
          message: `${skill.name} is mandatory but requires ${m.min} ${m.min === 1 ? "evaluation" : "evaluations"} in ${m.setting}, and ${code} has no ${m.setting} placements. No setting in this course can satisfy it.`,
        })
      }
    }
    if (qualifiedEvaluators(s, skill.config).length === 0) {
      out.push({ id: `no-evaluator-${skill.id}`, kind: "no-evaluator", skillId: skill.id, message: `No evaluator on record is qualified to sign off ${skill.name}, which is mandatory. Lower a qualification or add an evaluator.` })
    }
  }
  return out
}

export function mappingSummary(s: V2State, courseId: string = s.course.id): { mapped: number; mandatory: number } {
  const rows = s.mappings.filter((m) => m.courseId === courseId)
  return { mapped: rows.length, mandatory: rows.filter((m) => m.level === "mandatory").length }
}
