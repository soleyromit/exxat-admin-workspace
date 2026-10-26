import { DEMO_TODAY } from "./seed-core"

/**
 * One way to write numbers, dates, shares and initials on every screen (docs/knowledge/design/consistency-audit.md). Pure.
 * Screens import these instead of redefining `fmt`, `plural`, `pctOf`, `shortDate` or `initialsOf` locally.
 */

/** 1,547 */
export const fmt = (n: number): string => n.toLocaleString("en-US")

/** "1 student" / "28 students", with the number formatted. */
export const plural = (n: number, one: string, many: string): string => `${fmt(n)} ${n === 1 ? one : many}`

/** Whole percent, 0 when the denominator is 0. Shown as `${pctOf(a, b)}%`. */
export const pctOf = (n: number, d: number): number => (d === 0 ? 0 : Math.round((n / d) * 100))

/** "Oct 26"; "Oct 26, 2025" when the date is not in the demo year. UTC, en-US. */
export function shortDate(iso: string, today: string = DEMO_TODAY): string {
  const sameYear = iso.slice(0, 4) === today.slice(0, 4)
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" })
}

/** "Oct 26, 2026" (always with the year), for records and exports. */
export const longDate = (iso: string): string => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

/** "today", "1 day", "12 days". */
export const ageLabel = (days: number): string => (days === 0 ? "today" : days === 1 ? "1 day" : `${fmt(days)} days`)

/**
 * Credentials written after a name ("Courtney Norwood, MSN, RN"); never initials. Compared without dots, case-insensitive.
 * Two-letter tokens that are also surnames (Do, Ma, Pa) are left out on purpose.
 */
const CREDENTIALS = new Set(["RN", "BSN", "MSN", "DNP", "LPN", "LVN", "CCRN", "CEN", "CNE", "CNL", "CNS", "NP", "APRN", "FNP", "FNPBC", "PHD", "EDD", "MD", "PAC", "MPH", "MBA", "CNA", "EMT", "DPT", "OTR", "RRT"])
const isCredential = (w: string) => CREDENTIALS.has(w.replace(/[^A-Za-z]/g, "").toUpperCase())

/**
 * "MF" for "Maya Ferreira". Titles, credentials and punctuation are ignored: "Dr. K. Brennan" -> "KB",
 * "S. Okonkwo, RN" -> "SO", "Courtney Norwood, MSN, RN" -> "CN", "Jon Delgado RN" -> "JD".
 */
export function initialsOf(name: string): string {
  const bare = name.replace(/\b(Dr|Mr|Ms|Mrs|Mx|Prof)\.?\s+/gi, "")
  // Everything after the first comma is credentials ("Name, RN, BSN"); keep the part before it when it holds a name.
  const head = bare.split(",")[0].trim() ? bare.split(",")[0] : bare
  const parts = head.split(/\s+/).filter((w) => w && !isCredential(w)).map((p) => p.replace(/[^\p{L}]/gu, "")).filter(Boolean)
  if (parts.length === 0) return "?"
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}
