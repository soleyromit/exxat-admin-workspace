/**
 * Search and filters for My requests (Romit 2026-10-27: "I don't see search, filter in My requests"; LEDGER D-L20). One pure filter
 * for every tab: search by skill or evaluator name; filters by course, evaluator, setting (clinical, lab, simulation) and a date
 * range. All of it lives in the URL (`q`, `fcourse`, `fwho`, `fsetting`, `ffrom`, `fto`), so a reload or a shared link keeps it.
 * A request's setting and course are read from its own record (the evaluation for answered work, the entries for sent work and
 * drafts); a request with no recorded course never matches a course filter. Nothing here changes a figure.
 */
import type { Setting, V2State } from "@/lib/v2/types"
import type { EvaluatorGroup, RequestRow } from "./student"
import type { LoggedSitting } from "./logged"

export interface RequestFilter {
  q: string
  course: string
  who: string
  setting: "" | Setting
  from: string
  to: string
}

export const FILTER_KEYS = { q: "q", course: "fcourse", who: "fwho", setting: "fsetting", from: "ffrom", to: "fto" } as const

export function readFilter(param: (k: string) => string | null): RequestFilter {
  const setting = param(FILTER_KEYS.setting) ?? ""
  return {
    q: param(FILTER_KEYS.q) ?? "",
    course: param(FILTER_KEYS.course) ?? "",
    who: param(FILTER_KEYS.who) ?? "",
    setting: setting === "clinical" || setting === "lab" || setting === "simulation" ? setting : "",
    from: param(FILTER_KEYS.from) ?? "",
    to: param(FILTER_KEYS.to) ?? "",
  }
}

/** Filters applied (search not counted): the number on the Filters button. */
export const filterCount = (f: RequestFilter) => [f.course, f.who, f.setting, f.from || f.to].filter(Boolean).length
export const anyFilter = (f: RequestFilter) => !!(f.q.trim() || filterCount(f))

interface Facts {
  setting: Setting | null
  course: string | null
}

/** The setting and course a request row carries, from its own record. */
export function rowFacts(s: V2State, rowId: string): Facts {
  const ev = s.evaluations.find((e) => e.id === rowId)
  if (ev) return { setting: ev.setting, course: ev.courseId ?? null }
  const sub = s.submissions.find((x) => x.id === rowId)
  const entries = sub ? s.logEntries.filter((e) => (sub.entryIds ?? []).includes(e.id)) : []
  const evs = sub ? s.evaluations.filter((e) => e.submissionId === sub.id) : []
  return {
    setting: entries[0]?.setting ?? evs[0]?.setting ?? null,
    course: entries.find((e) => e.sitting?.course)?.sitting?.course ?? evs.find((e) => e.courseId)?.courseId ?? null,
  }
}

const day = (iso: string) => iso.slice(0, 10)
const inRange = (date: string, f: RequestFilter) => (!f.from || day(date) >= f.from) && (!f.to || day(date) <= f.to)
const has = (hay: string[], q: string) => hay.some((h) => h.toLowerCase().includes(q))

function rowMatches(s: V2State, g: EvaluatorGroup, r: RequestRow, f: RequestFilter): boolean {
  const q = f.q.trim().toLowerCase()
  if (q && !has([...r.skillNames, g.name], q)) return false
  if (f.who && g.id !== f.who) return false
  if (!inRange(r.date, f)) return false
  if (f.setting || f.course) {
    const facts = rowFacts(s, r.id)
    if (f.setting && facts.setting !== f.setting) return false
    if (f.course && facts.course !== f.course) return false
  }
  return true
}

/** The groups with only the rows that match, groups left empty dropped. */
export function filterGroups(s: V2State, groups: EvaluatorGroup[], f: RequestFilter): EvaluatorGroup[] {
  if (!anyFilter(f)) return groups
  return groups
    .map((g) => ({ ...g, waiting: g.waiting.filter((r) => rowMatches(s, g, r, f)), returned: g.returned.filter((r) => rowMatches(s, g, r, f)), done: g.done.filter((r) => rowMatches(s, g, r, f)) }))
    .filter((g) => g.waiting.length + g.returned.length + g.done.length > 0)
}

/** Drafts that match: skills and the chosen evaluator's name for search; course, evaluator, setting and date performed. */
export function filterDrafts(s: V2State, drafts: LoggedSitting[], f: RequestFilter): LoggedSitting[] {
  if (!anyFilter(f)) return drafts
  const q = f.q.trim().toLowerCase()
  return drafts.filter((d) => {
    const whoName = d.who ? s.people.find((p) => p.id === d.who)?.name ?? "" : ""
    if (q && !has([...d.skillNames, whoName], q)) return false
    if (f.who && d.who !== f.who) return false
    if (f.setting && d.setting !== f.setting) return false
    if (f.course && d.course !== f.course) return false
    if ((f.from || f.to) && (!d.date || !inRange(d.date, f))) return false
    return true
  })
}
