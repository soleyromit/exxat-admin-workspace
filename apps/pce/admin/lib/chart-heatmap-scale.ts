/** Resolve any CSS color (var, oklch, color-mix) to #rrggbb for canvas charts. */
export function resolveCssColor(token: string, fallback = "#6366f1"): string {
  if (typeof document === "undefined") return fallback
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return fallback
  ctx.fillStyle = fallback
  try {
    ctx.fillStyle = token
  } catch {
    return fallback
  }
  const resolved = ctx.fillStyle
  if (typeof resolved === "string" && resolved.startsWith("#")) return resolved
  if (typeof resolved === "string" && resolved.startsWith("rgb")) return resolved
  return fallback
}

export function readChartToken(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback
  const varRef = name.startsWith("--") ? `var(${name})` : name
  return resolveCssColor(varRef, fallback)
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "")
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized.padStart(6, "0").slice(0, 6)
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number) {
  const part = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")
  return `#${part(r)}${part(g)}${part(b)}`
}

/** Interpolate card → brand for heatmap intensity (12–88% mix). */
export function heatmapCellColor(value: number, max: number, brandHex?: string, cardHex?: string) {
  const brand = brandHex ?? readChartToken("--brand-color", "#4f46e5")
  const card = cardHex ?? readChartToken("--card", "#ffffff")
  const [r1, g1, b1] = hexToRgb(card)
  const [r2, g2, b2] = hexToRgb(brand)
  const t = max > 0 ? 0.12 + (value / max) * 0.76 : 0.12
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

/** Brand-mixed heatmap cell fill — 12–88% mix like Highcharts colorAxis min/max. */
export function heatmapCellFill(value: number, max: number, brandVar = "var(--brand-color)") {
  const mix = max > 0 ? 12 + Math.round((value / max) * 76) : 12
  return `color-mix(in oklch, ${brandVar} ${mix}%, var(--card))`
}

/** Text on heatmap cells — swap to primary-foreground on darker fills. */
export function heatmapCellUsesLightText(value: number, max: number) {
  const mix = max > 0 ? 12 + Math.round((value / max) * 76) : 12
  return mix >= 52
}

export function heatmapColorScaleStops(max: number) {
  return [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max]
}
