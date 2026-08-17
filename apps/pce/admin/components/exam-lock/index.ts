/**
 * Exam lock delivery primitives — compose with `ExamLockTemplate`.
 *
 * Pattern:
 * - `ExamLockTemplate` — viewport shell (`ExamLockAppHeader` + scrollable `<main>`)
 * - `ExamLockAppHeader` — locked assessment toolbar (title, tools, timer, learner avatar)
 * - `ExamLockHeaderToolbar` — keyboard / calculator / settings popover
 * - `ExamLockDeliveryQuestion` + `ExamLockQuestionRenderer` — type-routed delivery
 * - `ExamLockQuestionStem` — optional `stemMedia` image above prompt (MCQ, T/F, fill, essay, …)
 * - `ExamLockQuestionBody` + `ExamLockQuestionNav` — scroll region + footer (reflow-safe at ≥200% zoom)
 * - `useExamLockSessionController` + `ExamLockInterruptionPanel` — hard pause / timer freeze
 *
 * Spec: `exam-lock-delivery-types.ts` (maps all 10 `AuthoringQuestionType` values).
 *
 * Reference: `components/exam-lock-showcase-client.tsx` (Design OS).
 */

export {
  EXAM_LOCK_COLOR_MODE_ICONS,
  EXAM_LOCK_COLOR_MODE_LABELS,
  EXAM_LOCK_COLOR_MODES,
  type ExamColorMode,
  type ExamLockColorMode,
} from "./exam-lock-color-mode"

export {
  EXAM_LOCK_DELIVERY_IMPLEMENTED,
  EXAM_LOCK_STEM_SUPPORTS_IMAGE,
  blankIdForIndex,
  countFillBlanksInStem,
  isExamLockDeliveryImplemented,
  isExamLockQuestionAnswered,
  parseFillBlankStem,
  type ExamLockAnswerValue,
  type ExamLockDeliveryQuestion,
  type ExamLockDeliveryType,
  type ExamLockEssayDelivery,
  type ExamLockFillBlankDelivery,
  type ExamLockMcqSingleDelivery,
  type ExamLockQuestionChrome,
  type ExamLockStemMedia,
  type ExamLockTrueFalseDelivery,
} from "./exam-lock-delivery-types"

export { EXAM_LOCK_DEMO_CLINICAL_FIGURE } from "./exam-lock-demo-assets"
export { ExamLockCautionStrip, type ExamLockCautionStripProps } from "./exam-lock-caution-strip"
export {
  ExamLockAppHeader,
  type ExamLockAppHeaderProps,
  type ExamLockLearnerIdentity,
} from "./exam-lock-app-header"
export { ExamLockAnswerProgress, type ExamLockAnswerProgressProps } from "./exam-lock-answer-progress"
export { ExamLockColorModeToggle, type ExamLockColorModeToggleProps } from "./exam-lock-color-mode-toggle"
export { ExamLockEssayQuestion, type ExamLockEssayQuestionProps } from "./exam-lock-essay-question"
export { ExamLockFillBlankQuestion, type ExamLockFillBlankQuestionProps } from "./exam-lock-fill-blank-question"
export { ExamLockHeaderToolbar, type ExamLockHeaderToolbarProps } from "./exam-lock-header-toolbar"
export {
  ExamLockInterruptionPanel,
  type ExamLockInterruptionPanelProps,
  type ExamLockInterruptionSupportActions,
} from "./exam-lock-interruption-panel"
export {
  EXAM_LOCK_DEMO_PROCTOR_PASSWORD,
  ExamLockResumeAuthDialog,
  type ExamLockResumeAuthDialogProps,
} from "./exam-lock-resume-auth-dialog"
export {
  EXAM_LOCK_INTERRUPTION_PRESETS,
  EXAM_LOCK_INTERRUPTION_CATEGORY_CHROME,
  examLockInterruptionCategory,
  type ExamLockInterruptionCategory,
  type ExamLockInterruptionPreset,
} from "./exam-lock-interruption-presets"
export {
  ExamLockMcqQuestion,
  ExamMcqQuestion,
  type ExamLockMcqQuestionProps,
  type ExamMcqQuestionProps,
} from "./exam-lock-mcq-question"
export { ExamLockQuestionBody, type ExamLockQuestionBodyProps } from "./exam-lock-question-body"
export { ExamLockQuestionNav, type ExamLockQuestionNavProps } from "./exam-lock-question-nav"
export { ExamLockQuestionRenderer, type ExamLockQuestionRendererProps } from "./exam-lock-question-renderer"
export {
  ExamLockSessionAlert,
  type ExamLockSessionAlertKind,
  type ExamLockSessionAlertProps,
} from "./exam-lock-session-alert"
export {
  DEFAULT_EXAM_LOCK_INTERRUPTION_POLICY,
  type ExamLockInterruptionPolicy,
  type ExamLockPauseReason,
  type ExamLockSessionState,
} from "./exam-lock-session-types"
export {
  ExamLockTimerDisplay,
  formatExamLockTimer,
  type ExamLockTimerDisplayProps,
} from "./exam-lock-timer-display"
export { ExamLockQuestionIndex, ExamLockQuestionStem, ExamLockQuestionResponseLayout, type ExamLockQuestionStemProps, type ExamLockQuestionResponseLayoutProps } from "./exam-lock-question-stem"
export { ExamLockStemFigure, type ExamLockStemFigureProps } from "./exam-lock-stem-figure"
export { ExamLockSettingsPopover, type ExamLockSettingsPopoverProps } from "./exam-lock-settings-popover"
export {
  ExamLockTrueFalseQuestion,
  type ExamLockTrueFalseQuestionProps,
} from "./exam-lock-true-false-question"
export { useExamColorMode, useExamLockColorMode } from "./use-exam-lock-color-mode"
export {
  useExamLockSessionController,
  type UseExamLockSessionControllerOptions,
} from "./use-exam-lock-session-controller"
