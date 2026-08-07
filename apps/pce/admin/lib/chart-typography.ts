/**
 * Recharts tick / label sizes — numeric px values that mirror `@theme` `--text-xs` (12px).
 * Recharts requires numbers; never go below the 12px product floor.
 */
export const CHART_TICK_FONT_SIZE = 12 as const

/** Default axis tick props — spread onto `<XAxis tick={…} />` / `<YAxis tick={…} />`. */
export const CHART_AXIS_TICK = { fontSize: CHART_TICK_FONT_SIZE } as const
