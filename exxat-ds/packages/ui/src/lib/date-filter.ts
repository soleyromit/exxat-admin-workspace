/**
 * Format any date string (ISO, MM/DD/YYYY, "Mar 15 2026", etc.) into the
 * app-wide display format: MM/DD/YYYY.
 * Returns "—" for empty / unparseable values.
 */
export function formatDateUS(raw: string | null | undefined): string {
  if (!raw || raw.trim() === "—" || raw.trim() === "-") return "—"
  // Already MM/DD/YYYY — return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw.trim())) return raw.trim()
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  const m  = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const y  = d.getFullYear()
  return `${m}/${day}/${y}`
}

/**
 * Format a Date (or ISO string) into "MM/DD/YYYY hh:mm AM/PM EST".
 * Time zone label is always appended as the literal string "EST" (display only).
 */
export function formatDateTimeUS(raw: Date | string | null | undefined): string {
  if (!raw) return "—"
  const d = raw instanceof Date ? raw : new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw)
  const m    = String(d.getMonth() + 1).padStart(2, "0")
  const day  = String(d.getDate()).padStart(2, "0")
  const y    = d.getFullYear()
  let   h    = d.getHours()
  const min  = String(d.getMinutes()).padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${m}/${day}/${y} ${String(h).padStart(2, "0")}:${min} ${ampm} EST`
}

/** Parse a human-readable date string into YYYY-MM-DD for comparison (local timezone). */
export function parseRowDateToYmd(raw: string): string | null {
  const t = raw.trim()
  if (!t || t === "—" || t === "-") return null
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Format YYYY-MM-DD for compact filter chip label. */
export function formatYmdForDisplay(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

/** Local noon to avoid timezone shifting the calendar day. */
export function ymdToLocalDate(ymd: string | undefined): Date | undefined {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

export function localDateToYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
