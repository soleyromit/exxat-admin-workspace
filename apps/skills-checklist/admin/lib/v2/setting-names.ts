import type { Program, V2State } from "./types"

/**
 * A clinical setting's name after a rename, without touching what records already hold.
 *
 * Completed evaluations are immutable [REQ RV-03, RV-05], so a rename writes only the program's own lists (sites, courses, skill
 * rules) and one entry in `program.clinicalSettingAliases`: stored name to current name. Evaluations, log entries and placements
 * keep the value they were written with. The store shows them under the current name by projecting a view: readers, the engine and
 * every transition see current names, so no reader needs to know about aliases; what is saved stays the stored rows. Counts per
 * setting work because the view has one name per setting.
 */
export type SettingAliases = Record<string, string>

export const currentSettingName = (program: Pick<Program, "clinicalSettingAliases">, stored: string): string => program.clinicalSettingAliases?.[stored] ?? stored

/** The aliases after `from` is renamed to `to`. Earlier names follow; going back to an earlier name removes its alias. */
export function aliasesAfterRename(aliases: SettingAliases | undefined, from: string, to: string): SettingAliases {
  const next: SettingAliases = {}
  for (const [k, v] of Object.entries(aliases ?? {})) next[k] = v === from ? to : v
  next[from] = to
  delete next[to]
  return next
}

/** Rows shown under a current name, each pointing back at the row as stored. Holds no row alive. */
const storedRow = new WeakMap<object, object>()

function project<T extends object>(rows: T[], field: keyof T, aliases: SettingAliases): T[] {
  let changed = false
  const out = rows.map((r) => {
    const stored = r[field]
    const name = typeof stored === "string" ? aliases[stored] : undefined
    if (name === undefined) return r
    changed = true
    const view = { ...r, [field]: name }
    storedRow.set(view, r)
    return view
  })
  return changed ? out : rows
}

/** What readers see. Rows with no alias, and the whole state when there are no aliases, stay the same objects. */
export function withCurrentSettingNames(s: V2State): V2State {
  const aliases = s.program.clinicalSettingAliases
  if (!aliases || !Object.keys(aliases).length) return s
  return { ...s, evaluations: project(s.evaluations, "clinicalSetting", aliases), logEntries: project(s.logEntries, "clinicalSetting", aliases), placements: project(s.placements, "setting", aliases) }
}

function unproject<T extends object>(rows: T[]): T[] {
  let changed = false
  const out = rows.map((r) => {
    const stored = storedRow.get(r) as T | undefined
    if (!stored) return r
    changed = true
    return stored
  })
  return changed ? out : rows
}

/** What is saved: a row a transition left alone goes back to the row as stored. A row it really changed is a new row, under the name it then had. */
export const withStoredSettingNames = (s: V2State): V2State => ({ ...s, evaluations: unproject(s.evaluations), logEntries: unproject(s.logEntries), placements: unproject(s.placements) })
