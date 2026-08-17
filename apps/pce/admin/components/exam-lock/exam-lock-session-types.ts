export type ExamLockPauseReason =
  | "offline"
  | "degraded"
  | "visibility_hidden"
  | "leave_attempt"
  | "idle_timeout"
  | "fullscreen_exit"
  | "sync_failed"
  | "policy_violation"
  | "time_expired"
  | "session_revoked"

export type ExamLockInterruptionSeverity = "soft" | "hard" | "terminal"

export type ExamLockSessionPhase = "active" | "paused" | "submitted" | "terminated"

export interface ExamLockInterruptionPolicy {
  /** Hard-pause when the document is hidden (tab switch). Default true. */
  pauseOnVisibilityHidden: boolean
  /** Hard-pause when the browser goes offline. Default true. */
  pauseOnOffline: boolean
}

export const DEFAULT_EXAM_LOCK_INTERRUPTION_POLICY: ExamLockInterruptionPolicy = {
  pauseOnVisibilityHidden: true,
  pauseOnOffline: true,
}

export interface ExamLockSessionState {
  phase: ExamLockSessionPhase
  pauseReason: ExamLockPauseReason | null
  severity: ExamLockInterruptionSeverity | null
  secondsRemaining: number
  timerPaused: boolean
  canResume: boolean
  violationCount: number
}
