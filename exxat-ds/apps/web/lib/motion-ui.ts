/**
 * Motion presets — same spirit as Animate UI (open component distribution:
 * https://animate-ui.com/docs — copy/tweak in-repo, Motion + Tailwind).
 */
export const motionEaseOut = [0.22, 1, 0.36, 1] as const

export const motionHeaderEnter = {
  duration: 0.22,
  ease: motionEaseOut,
} as const
