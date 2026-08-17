import type { ExamLockStemMedia } from "./exam-lock-delivery-types"

/**
 * Unsplash — close-up medical monitor with vital signs (Design OS demo).
 * @see https://unsplash.com/photos/close-up-of-a-medical-monitor-displaying-vital-signs-gzTKtM5biaA
 */
const EXAM_LOCK_DEMO_UNSPLASH_ID = "photo-1770836037704-44bd8c7b6978"

function unsplashClinicalFigureUrl(width: number, height: number) {
  return `https://images.unsplash.com/${EXAM_LOCK_DEMO_UNSPLASH_ID}?w=${width}&h=${height}&fit=crop&q=80`
}

export const EXAM_LOCK_DEMO_CLINICAL_FIGURE: ExamLockStemMedia = {
  kind: "image",
  src: unsplashClinicalFigureUrl(960, 720),
  fullscreenSrc: unsplashClinicalFigureUrl(1920, 1440),
  alt: "Close-up of a hospital monitor displaying heart rate and vital signs",
  caption: "Unsplash demo figure. Not diagnostic.",
}
