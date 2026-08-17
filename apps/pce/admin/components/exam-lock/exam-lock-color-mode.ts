/** Exam lock surface color mode — maps to `useTheme()` + `useAppTheme().setContrast`. */
export type ExamLockColorMode = "light" | "dark" | "hc"

export const EXAM_LOCK_COLOR_MODES = ["light", "dark", "hc"] as const satisfies readonly ExamLockColorMode[]

export const EXAM_LOCK_COLOR_MODE_LABELS: Record<ExamLockColorMode, string> = {
  light: "Light",
  dark: "Dark",
  hc: "High contrast",
}

export const EXAM_LOCK_COLOR_MODE_ICONS: Record<ExamLockColorMode, string> = {
  light: "fa-sun",
  dark: "fa-moon",
  hc: "fa-circle-half-stroke",
}

/** @deprecated Use `ExamLockColorMode`. */
export type ExamColorMode = ExamLockColorMode
