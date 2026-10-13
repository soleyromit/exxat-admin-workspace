// Action results. Actions are pure functions: (db, input, ctx) => Result. They never mutate `db`.
import type { Db, Iso } from "@/lib/domain/types"
import type { Issue } from "@/lib/engine"

export type ErrorCode =
  | "notFound"
  | "invalid" // input failed validation; `issues` / `fields` say why
  | "duplicate"
  | "skillNotUsable" // unconfigured (IM-09) or inactive (SL-11)
  | "settingReferenced" // OD-26: a skill minimum still names the clinical setting
  | "replaceHasEvidence" // IM-06/OD-13: Replace is refused when the skill already holds evidence
  | "roleNotAllowed" // ST-08
  | "noValidRole" // ST-08 (empty set)
  | "locked" // RV-05: counted or awaiting approval
  | "notEditable"
  | "notFurtherAttempt" // RV-03
  | "linkInvalid" // neutral: OD-18 is open, so no reason is exposed beyond the code
  | "linkSuperseded"
  | "alreadySubmitted"
  | "notAwaitingApproval"

export interface ActionError {
  code: ErrorCode
  message: string
  /** Engine validation issues (save-blocking, SC-18). */
  issues?: Issue[]
  /** Field-level problems keyed by path, for FieldError and the summary banner. */
  fields?: Record<string, string>
  /** Extra data a surface may show (for example the skills that block a setting deactivation). */
  data?: Record<string, unknown>
}

export type Result<T = void> = { ok: true; db: Db; value: T } | { ok: false; error: ActionError }

export interface ActionCtx {
  /** The clock is injected so actions stay pure and deterministic. */
  now: Iso
  /** Opaque link tokens. The browser store passes crypto-random ones; tests and the seed use deterministic ones. */
  token?: (seed: number) => string
}

export const ok = <T>(db: Db, value: T): Result<T> => ({ ok: true, db, value })
export const fail = (code: ErrorCode, message: string, extra: Partial<ActionError> = {}): Result<never> => ({
  ok: false,
  error: { code, message, ...extra },
})
