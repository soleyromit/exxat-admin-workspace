function toHexByte(n: number): string {
  return n.toString(16).padStart(2, "0")
}

/**
 * Resolve any CSS color (var, oklch, lab, color-mix) to #rrggbb for canvas charts.
 *
 * THIS USED TO RETURN THE FALLBACK FOR EVERY TOKEN. The old implementation assigned the token
 * straight to `ctx.fillStyle` — but a canvas has NO CSS cascade, so it cannot resolve
 * `var(--brand-color)`. Worse, assigning an invalid fillStyle is a SILENT NO-OP: fillStyle
 * keeps its previous value (the fallback), the guard reads it back, sees a valid "#..." and
 * returns it as if resolution had succeeded. No error, no warning, always wrong.
 *
 * Measured in-browser before this fix:
 *   resolveCssColor("var(--brand-color)", "#4f46e5") → "#4f46e5"   (true value: Prism pink)
 *   resolveCssColor("var(--chart-2)",     "#e5e7eb") → "#e5e7eb"   (true value: rgb(0,110,100))
 * So every consumer silently rendered its hardcoded fallback — which is why charts came out
 * indigo next to a pink DS.
 *
 * The fix is two steps, because each solves a different half:
 *   1. PROBE — put a real element in the document and read `getComputedStyle().color`. Only
 *      the cascade can resolve `var()`, so only the DOM can do this.
 *   2. RASTER — the cascade hands back the AUTHORED space (this theme returns `lab(...)` and
 *      `oklch(...)`), which `hexToRgb` can't parse. Painting one pixel and reading it back
 *      converts any space to sRGB bytes. Canvas is the right tool here — just for conversion,
 *      never for resolution.
 */
export function resolveCssColor(token: string, fallback = "#6366f1"): string {
  if (typeof document === "undefined") return fallback
  try {
    // 1. Resolve through the cascade.
    const probe = document.createElement("span")
    probe.style.color = token
    probe.style.display = "none"
    document.body.appendChild(probe)
    const computed = getComputedStyle(probe).color
    probe.remove()
    if (!computed) return fallback

    // 2. Convert whatever space it came back in to sRGB bytes.
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return fallback
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = computed
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `#${toHexByte(r ?? 0)}${toHexByte(g ?? 0)}${toHexByte(b ?? 0)}`
  } catch {
    return fallback
  }
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

/**
 * The mix ceiling at which `--foreground` still clears WCAG AA (4.5:1) on the fill.
 *
 * MEASURED against the live prism brand on --card, not guessed: dark text passes up to t=0.85,
 * light text only from t=0.925. So t in (0.85, 0.925) is a DEAD ZONE where NEITHER text colour is
 * legible — and the DS ramp ends at 0.88, inside it. That is the whole of the 34 axe
 * color-contrast failures the tinted grid surfaced (and the canvas hid).
 *
 * Capping keeps the ramp MONOTONIC, so colour still encodes value. Lightening only the failing
 * cells would fix contrast by breaking the encoding, which is worse than the bug.
 */
export const HEATMAP_AA_MAX_MIX = 0.85

/** WCAG 2.1 relative luminance of an [r,g,b] triplet. */
function relativeLuminance([r, g, b]: [number, number, number]) {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/**
 * Contrast ratio between two colours, 1–21. Exists because `heatmapCellUsesLightText` decides
 * text colour from a MIX PERCENTAGE (>=52) rather than from contrast — which is why it returns
 * "light" across a whole band where light text measures 2.4:1.
 */
export function contrastRatio(aHex: string, bHex: string) {
  const la = relativeLuminance(hexToRgb(aHex))
  const lb = relativeLuminance(hexToRgb(bHex))
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Interpolate card → brand for heatmap intensity. `maxMix` caps the ramp — see the AA note. */
export function heatmapCellColor(
  value: number,
  max: number,
  brandHex?: string,
  cardHex?: string,
  maxMix = 0.88,
) {
  const brand = brandHex ?? readChartToken("--brand-color", "#4f46e5")
  const card = cardHex ?? readChartToken("--card", "#ffffff")
  const [r1, g1, b1] = hexToRgb(card)
  const [r2, g2, b2] = hexToRgb(brand)
  // `maxMix - 0.12` replaces the hardcoded 0.76 span; the 0.88 default is byte-identical to
  // the DS ramp, so existing callers are untouched.
  const t = max > 0 ? 0.12 + (value / max) * (maxMix - 0.12) : 0.12
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
