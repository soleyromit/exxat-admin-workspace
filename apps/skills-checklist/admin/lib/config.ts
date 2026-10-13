import type { SkillStatusDisplay } from "@/lib/domain/types"

/**
 * OD-03 is OPEN: whether "no evidence yet" and "evidence does not qualify" are reported separately
 * ("four") or merged as "Not met" ("merged"). Every status surface reads this ONE flag through
 * SkillStatusBadge and the status copy helpers; the dev toggle at /dev/state overrides it per browser.
 */
export const SKILL_STATUS_DISPLAY_DEFAULT: SkillStatusDisplay = "merged"
// Default "merged" since 2026-10-08 (parity spec C-1, Romit: build Sankalp's prototype, which shows Achieved / In progress /
// Not met with "Not met" including no evidence yet). OD-03 stays OPEN: the engine is four-state and /dev/state flips it.

/** localStorage keys (versioned). Bump DB_VERSION when the Db shape changes. */
export const DB_VERSION = 1
export const STORAGE_KEY_DB = `skills-checklist:db:v${DB_VERSION}`
export const STORAGE_KEY_PREFS = `skills-checklist:prefs:v${DB_VERSION}`

/** Fixed "today" for the demo seed and tests. Real code passes the clock into actions as ctx.now. */
export const SEED_NOW = "2026-10-08T09:00:00.000Z"
