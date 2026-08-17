/**
 * Leo ambience prefs — idle dots, thinking wash, composer veil.
 * Shell-global (same rationale as `shell:ask-leo-dock`).
 */

export const LEO_AMBIENCE_KEY = "shell:leo-ambience"
export const LEO_AMBIENCE_WINDOW_RECT_KEY = "shell:leo-ambience-window-rect"
export const LEO_AMBIENCE_WINDOW_OPEN_KEY = "shell:leo-ambience-window-open"

export type LeoBlobIntensity = "low" | "normal" | "high"
/**
 * The chip's lobe fills. Two levels, not three, because two is what the blob
 * field actually paints: `AnimatedBlobBackground` has `normal` and `high`, and
 * every other surface folds `low` into `normal`.
 */
export type LeoLauncherWashIntensity = "normal" | "high"
export type LeoComposerVeil = "off" | "soft" | "strong"
export type LeoBlobAnimationSpeed = "slow" | "normal" | "fast"
/** Leo Library / mode-switch search bar wash relative to the pill. */
export type LeoSearchBarWashMode = "inside" | "outside"
/**
 * Thinking chrome on the Ask Leo panel / window.
 * `blobs` — gradient wash. `pulse` — breathing brand perimeter (Beam Pulse IA).
 * Search bar stays on bar blobs either way.
 */
export type LeoThinkingAnimationStyle = "blobs" | "pulse"

export interface LeoAmbiencePrefs {
  /** Soft cursor spotlight dots while Leo is idle. */
  idleDots: boolean
  /** Relative density for idle dots (0.5 sparse → 3 dense). */
  idleDensity: number
  /** Spotlight radius in px for idle dots. */
  idleGlowRadius: number
  /** Gradient blob wash while Leo is thinking (and idle wash when enabled). */
  thinkingBlob: boolean
  /** Panel thinking look — blobs wash or pulse border. */
  thinkingAnimationStyle: LeoThinkingAnimationStyle
  thinkingBlobIntensity: LeoBlobIntensity
  /** Layer opacity for thinking / idle blobs (0.05–1). Also pulse strength. */
  thinkingBlobOpacity: number
  /** Cursor-spotlight dots while thinking (same field as idle). */
  thinkingOverlayDots: boolean
  /** Opacity for thinking cursor dots (0.05–1). */
  thinkingOverlayDotsOpacity: number
  /** Blob float / think keyframe animations. */
  blobAnimations: boolean
  /** Multiplier on blob keyframe durations. */
  blobAnimationSpeed: LeoBlobAnimationSpeed
  /** Blur veil under the composer. */
  composerVeil: LeoComposerVeil
  /** Thinking wash on the Leo search / mode-switch bar. */
  searchBarWash: boolean
  /** Paint wash inside the pill or around it (halo). */
  searchBarWashMode: LeoSearchBarWashMode
  /**
   * Free offset of the search-bar wash in px (no snap presets).
   * Positive X → right, positive Y → down.
   */
  searchBarOffsetX: number
  searchBarOffsetY: number
  /** Soft brand sheen sweep while the search bar is thinking. */
  searchBarSheen: boolean
  /** Thinking-dot overlay on the Leo search bar. */
  searchBarDots: boolean
  /**
   * Blob field inside the utility bar's Ask Leo chip (`AskLeoLauncherWash`).
   * Its own switch rather than a slice of `searchBarWash`: the chip is on
   * every page of the shell, the Leo search bar only exists inside Leo.
   */
  launcherWash: boolean
  /** Lobe fills for the chip. `high` applies only while Leo is working. */
  launcherWashIntensity: LeoLauncherWashIntensity
  /**
   * Scales the chip's contrast budget (`--ask-leo-chip-blob-opacity`), rather
   * than replacing it. 1 is the shipped field.
   */
  launcherWashStrength: number
  /** Sheen sweep across the chip while Leo is working. */
  launcherWashSheen: boolean
}

/** Tuned from the Ask Leo appearance panel (dogfood). */
export const LEO_AMBIENCE_DEFAULTS: LeoAmbiencePrefs = {
  idleDots: true,
  idleDensity: 0.85,
  idleGlowRadius: 176,
  thinkingBlob: true,
  thinkingAnimationStyle: "blobs",
  thinkingBlobIntensity: "high",
  thinkingBlobOpacity: 0.55,
  thinkingOverlayDots: true,
  thinkingOverlayDotsOpacity: 0.88,
  blobAnimations: true,
  blobAnimationSpeed: "slow",
  composerVeil: "soft",
  searchBarWash: true,
  searchBarWashMode: "inside",
  // The three lobes are placed symmetrically across the pill, so the shipped
  // default keeps them centred. Only Y is offset, to sit the wash low in the bar.
  searchBarOffsetX: 0,
  searchBarOffsetY: 64,
  searchBarSheen: true,
  searchBarDots: true,
  launcherWash: true,
  launcherWashIntensity: "high",
  launcherWashStrength: 1,
  launcherWashSheen: true,
}

/** Max |offset| for the free search-bar wash pad (px). */
export const LEO_SEARCH_BAR_OFFSET_MAX = 120

/**
 * Range for `launcherWashStrength`. The floor is a field you can still see
 * (below ~0.4 of the budget the chip reads as flat); the ceiling is the point
 * past which the brand fills start to compete with the label they sit behind.
 */
export const LEO_LAUNCHER_WASH_STRENGTH_MIN = 0.4
export const LEO_LAUNCHER_WASH_STRENGTH_MAX = 1.5

/** CSS `--leo-blob-anim-rate` multipliers (higher = slower). */
export const LEO_BLOB_ANIM_RATE: Record<LeoBlobAnimationSpeed, number> = {
  slow: 1.75,
  normal: 1,
  fast: 0.55,
}

export function mergeLeoAmbiencePrefs(
  partial: Partial<LeoAmbiencePrefs> | null | undefined,
): LeoAmbiencePrefs {
  const merged = { ...LEO_AMBIENCE_DEFAULTS, ...partial }
  if (merged.thinkingAnimationStyle !== "pulse") {
    merged.thinkingAnimationStyle = "blobs"
  }
  return merged
}

export function clampIdleDensity(value: number): number {
  return Math.min(3, Math.max(0.5, Math.round(value * 100) / 100))
}

export function clampIdleGlowRadius(value: number): number {
  return Math.min(320, Math.max(80, Math.round(value)))
}

export function clampThinkingBlobOpacity(value: number): number {
  return Math.min(1, Math.max(0.05, Math.round(value * 100) / 100))
}

export function clampThinkingOverlayDotsOpacity(value: number): number {
  return Math.min(1, Math.max(0.05, Math.round(value * 100) / 100))
}

export function clampSearchBarOffset(value: number): number {
  return Math.min(
    LEO_SEARCH_BAR_OFFSET_MAX,
    Math.max(-LEO_SEARCH_BAR_OFFSET_MAX, Math.round(value)),
  )
}
