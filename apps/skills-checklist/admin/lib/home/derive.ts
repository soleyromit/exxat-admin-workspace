// HY-01 Home derivations. Pure functions of Db. Nothing is stored, ticked or dismissed: every figure is recomputed from the
// library, the mappings and the review queue (contract 9.2). Inactive skills are excluded from every count (SL-11).
import type { Db, Id } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"
import { labInstructorRows, reviewNavVisible, reviewQueue } from "@/lib/store"

export interface HomeSummary {
  /** Active skills (configured or not). Inactive skills never count (SL-11). */
  total: number
  /** Active and configured. */
  configuredActive: number
  /** Active and not configured (IM-10). Never inferred from a default (SC-02). */
  unconfigured: number
  /** First unconfigured active skill, so "Continue" resumes work in one click. */
  firstUnconfiguredId: Id | null
  /** Unread lines of the most recent confirmed import (IM-08). 0 when there is no import. */
  unreadLines: number
  offerings: number
  /** Offerings with at least one configured, active skill mapped (CM-05: informational, never a gate). */
  offeringsWithSkills: number
  /** Configured active skills mapped to no offering (informational). */
  unmapped: number
  /** Configured active skills mapped to at least one offering. */
  mapped: number
  /** SC-15: at least one configured skill has administrator approval turned on. */
  approvalEnabled: boolean
  /** AR-01, AR-06: evaluations waiting for an administrator decision. */
  awaitingApproval: number
  /** SL-09: student-named lab instructors not on the roster. */
  namedLabInstructors: number
  students: number
}

export function homeSummary(db: Db): HomeSummary {
  const active = db.skills.filter((s) => s.active)
  const configured = active.filter((s) => isConfigured(s))
  const unconfigured = active.filter((s) => !isConfigured(s))
  const configuredIds = new Set(configured.map((s) => s.id))
  const mappedSkillIds = new Set<Id>()
  const offeringsWith = new Set<Id>()
  for (const m of db.offeringSkillMaps) {
    if (!configuredIds.has(m.skillId)) continue
    mappedSkillIds.add(m.skillId)
    offeringsWith.add(m.offeringId)
  }
  const lastImport = db.importBatches
    .filter((b) => b.status === "confirmed")
    .reduce<(typeof db.importBatches)[number] | null>((best, b) => (!best || b.createdAt >= best.createdAt ? b : best), null)
  return {
    total: active.length,
    configuredActive: configured.length,
    unconfigured: unconfigured.length,
    firstUnconfiguredId: unconfigured[0]?.id ?? null,
    unreadLines: lastImport?.unread.length ?? 0,
    offerings: db.offerings.length,
    offeringsWithSkills: offeringsWith.size,
    unmapped: configured.length - mappedSkillIds.size,
    mapped: mappedSkillIds.size,
    approvalEnabled: reviewNavVisible(db),
    awaitingApproval: reviewQueue(db).length,
    namedLabInstructors: labInstructorRows(db).named.length,
    students: db.students.length,
  }
}

/** Setup card is open while any skill is unconfigured or the library is empty (IM-10, IM-11). Derived, so a re-import re-opens it. */
export const setupOpen = (s: HomeSummary): boolean => s.total === 0 || s.unconfigured > 0
export const isFirstRun = (s: HomeSummary): boolean => s.total === 0
