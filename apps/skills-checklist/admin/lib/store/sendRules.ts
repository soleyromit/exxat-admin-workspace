// S-13 decision table (docs/ux/08 P-09, contract S-13 §9). Pure. The role x evidence-type validity is DATA
// (`db.roleEvidenceMap`, OD-25 open) and is never hardcoded here.
import type { Db, EvaluatorRef, Id } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"

export type PerformedIn = "clinical" | "lab"

export interface SettingChoice {
  settingId: Id
  /** null when the student has no placement and picks from the full list (ST-07). */
  locationId: Id | null
}

export interface PersonOption {
  personId: Id
  source: EvaluatorRef["source"]
  name: string
  email: string
  roleId: string
}

export interface SendOptions {
  /** Skills that cannot be sent at all (unconfigured, inactive: IM-09, SL-11), with the reason. */
  unusable: Array<{ skillId: Id; reason: "unconfigured" | "inactive" | "unknown" }>
  /**
   * ST-06, ST-07: 'inferred' = exactly one choice (read-only), 'choose' = several, 'full' = no placement recorded
   * (program's full setting list, location optional), 'none' = lab.
   */
  settingMode: "inferred" | "choose" | "full" | "none"
  settings: SettingChoice[]
  /** Roles allowed by EVERY chosen skill and valid for the performed-in type (ST-08). */
  roles: string[]
  /** ST-08 row 5: empty role set. Names which skills and constraints caused it, never a dead end. */
  blocked: null | {
    code: "noValidRole"
    perSkill: Array<{ skillId: Id; allowedRoles: string[]; validRoles: string[] }>
    /** Each skill alone has options: offer "Send these separately". */
    separately: boolean
    /** The other performed-in value that would work, if any ("Switch to Lab"). */
    switchTo: PerformedIn | null
  }
  evaluatorsByRole: Record<string, PersonOption[]>
  /** ST-09: lab instructor not on the roster may be named with an email. */
  canNameLabInstructor: boolean
}

export const validFor = (db: Db, roleId: string, performedIn: PerformedIn): boolean => db.roleEvidenceMap[roleId]?.[performedIn] === true

export function rolesForSkills(db: Db, skillIds: Id[], performedIn: PerformedIn): string[] {
  const skills = skillIds.map((id) => db.skills.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s)
  if (skills.length === 0) return []
  const all = skills.reduce<string[]>((acc, s, i) => (i === 0 ? [...s.allowedRoles] : acc.filter((r) => s.allowedRoles.includes(r))), [])
  return all.filter((r) => validFor(db, r, performedIn))
}

export function personsForRole(db: Db, roleId: string): PersonOption[] {
  if (roleId === "lab_instructor") {
    return db.labInstructors.filter((l) => l.active).map((l) => ({ personId: l.id, source: "roster" as const, name: l.name, email: l.email, roleId }))
  }
  return db.evaluators.filter((e) => e.active && e.roleId === roleId).map((e) => ({ personId: e.id, source: "recorded" as const, name: e.name, email: e.email, roleId }))
}

export function settingChoices(db: Db, studentId: Id, offeringId: Id, performedIn: PerformedIn): { mode: SendOptions["settingMode"]; settings: SettingChoice[] } {
  if (performedIn === "lab") return { mode: "none", settings: [] }
  const active = new Set(db.clinicalSettings.filter((s) => s.active).map((s) => s.id))
  const placements = db.placements.filter((p) => p.studentId === studentId && p.offeringId === offeringId)
  if (placements.length === 0) {
    return { mode: "full", settings: db.clinicalSettings.filter((s) => s.active).map((s) => ({ settingId: s.id, locationId: null })) }
  }
  const settings: SettingChoice[] = []
  for (const p of placements) {
    const loc = db.locations.find((l) => l.id === p.locationId)
    for (const sid of loc?.settingIds ?? []) if (active.has(sid)) settings.push({ settingId: sid, locationId: p.locationId })
  }
  return { mode: settings.length === 1 ? "inferred" : "choose", settings }
}

export function computeSendOptions(db: Db, input: { studentId: Id; offeringId: Id; skillIds: Id[]; performedIn: PerformedIn }): SendOptions {
  const unusable: SendOptions["unusable"] = []
  for (const id of input.skillIds) {
    const s = db.skills.find((x) => x.id === id)
    if (!s) unusable.push({ skillId: id, reason: "unknown" })
    else if (!isConfigured(s)) unusable.push({ skillId: id, reason: "unconfigured" })
    else if (!s.active) unusable.push({ skillId: id, reason: "inactive" })
  }
  const usable = input.skillIds.filter((id) => !unusable.some((u) => u.skillId === id))
  const { mode, settings } = settingChoices(db, input.studentId, input.offeringId, input.performedIn)
  const roles = rolesForSkills(db, usable, input.performedIn)
  let blocked: SendOptions["blocked"] = null
  if (usable.length > 0 && roles.length === 0) {
    const other: PerformedIn = input.performedIn === "clinical" ? "lab" : "clinical"
    blocked = {
      code: "noValidRole",
      perSkill: usable.map((id) => {
        const s = db.skills.find((x) => x.id === id)!
        return { skillId: id, allowedRoles: s.allowedRoles, validRoles: s.allowedRoles.filter((r) => validFor(db, r, input.performedIn)) }
      }),
      separately: usable.length > 1 && usable.every((id) => rolesForSkills(db, [id], input.performedIn).length > 0),
      switchTo: rolesForSkills(db, usable, other).length > 0 ? other : null,
    }
  }
  const evaluatorsByRole: Record<string, PersonOption[]> = {}
  for (const r of roles) evaluatorsByRole[r] = personsForRole(db, r)
  return { unusable, settingMode: mode, settings, roles, blocked, evaluatorsByRole, canNameLabInstructor: roles.includes("lab_instructor") }
}
