/**
 * What the skill panel's "Used in" tab says (Romit 2026-11-17, "info looks vague"): the lists and courses by name, each with its own
 * fact, and where the skill came from in the most specific words the store holds. Pure, so the panel and its tests read the same thing.
 * Nothing here is invented: a fact the store does not keep (times needed per list, the date of a skill added one at a time) is left out.
 */
import type { V2State } from "@/lib/v2/types"
import { longDate } from "@/lib/v2/format"
import { offeringsForSkill, isPlaced, type MappingOverlay } from "./mapping"
import { skillLists } from "./lists"
import type { SkillList } from "./list-core"
import { aNoun, skillListNoun } from "./terms"

/** How many named rows show before "and N more". */
export const USED_IN_SHOWN = 3

export interface ListUse {
  id: string
  name: string
  /** Required or optional on that list (`requiredIds`); per list, so the same skill can differ between lists. */
  required: boolean
}

/** The lists that hold the skill, the default list first, then by name. */
export function listUses(lists: readonly SkillList[], skillId: string): ListUse[] {
  return skillLists(lists)
    .filter((l) => l.skillIds.includes(skillId))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name))
    .map((l) => ({ id: l.id, name: l.name, required: l.requiredIds.includes(skillId) }))
}

export interface CourseUse {
  /** Course code and cohort: one row per course and cohort, the unit the library and mapping count (`skillReach`). */
  key: string
  code: string
  name: string
  /** Only when the same course is mapped for more than one cohort, to tell the rows apart. */
  cohort?: string
  /** Mandatory when any offering of the course and cohort marks it Mandatory, as the mandatory count does. */
  level: "mandatory" | "recommended"
  /** The offering the link opens: the current term's, else the latest. */
  offeringId: string
}

/** The courses that map the skill (clinical courses, every term, as the course count beside it), Mandatory first, then by code. */
export function courseUses(state: V2State, overlay: MappingOverlay, skillId: string): CourseUse[] {
  const groups = new Map<string, ReturnType<typeof offeringsForSkill>>()
  for (const r of offeringsForSkill(state, overlay, skillId, "")) {
    if (!isPlaced(r.level)) continue
    const key = `${r.code}|${r.cohortId}`
    groups.set(key, [...(groups.get(key) ?? []), r])
  }
  const codeCount = new Map<string, number>()
  for (const offs of groups.values()) codeCount.set(offs[0]!.code, (codeCount.get(offs[0]!.code) ?? 0) + 1)
  return [...groups.entries()]
    .map(([key, offs]): CourseUse => {
      const first = offs[0]!
      // The offering running now, else the next one, else the latest.
      const open = offs.find((r) => r.current) ?? offs.find((r) => !r.past) ?? offs[offs.length - 1]!
      return {
        key,
        code: first.code,
        name: first.name,
        ...((codeCount.get(first.code) ?? 0) > 1 ? { cohort: first.cohort } : {}),
        level: offs.some((r) => r.level === "mandatory") ? "mandatory" : "recommended",
        offeringId: open.id,
      }
    })
    .sort((a, b) => Number(b.level === "mandatory") - Number(a.level === "mandatory") || a.code.localeCompare(b.code) || (a.cohort ?? "").localeCompare(b.cohort ?? ""))
}

/**
 * Where a skill came from, in words. `kind` says which store fact it rests on:
 *   seed       no batch and not added by hand: the program's own list the library started from (the "Program list" source)
 *   upload     a bulk upload (file or pasted list): the upload's name, without the short date the import adds to it
 *   starter    copied from a starting point offered on the Starting points page
 *   list       created while adding skills to a list (the list is kept on the batch from 2026-11-17)
 *   several    added several at once in the library
 *   hand       added one at a time: the store keeps no date and no place for it
 */
export interface SkillOrigin {
  kind: "seed" | "upload" | "starter" | "list" | "several" | "hand"
  /** The sentence before any link: "From", "Copied from", "Created in". */
  lead: string
  /** The named thing, when there is one. A list name is a link (listId). */
  name?: string
  listId?: string
  /** The batch, so "Added with N others" can show the skills that came with it. */
  batchId?: string
  /** Other skills that arrived in the same batch. */
  others: number
  /** "Nov 17, 2026" when the batch holds a time; never made up. */
  date?: string
}

/** "nursing-skills, Nov 17" -> "nursing-skills": the import names a batch "<file>, <Mon D>", and the date is said once, from the batch's own time. */
const withoutShortDate = (label: string): string => label.replace(/,\s*[A-Z][a-z]{2} \d{1,2}(, \d{4})?$/, "").trim()

export function skillOrigin(state: V2State, skillId: string, lists: readonly SkillList[]): SkillOrigin {
  const k = state.skills.find((x) => x.id === skillId)
  const batch = k?.batchId ? state.batches.find((b) => b.id === k.batchId) : undefined
  if (!batch) {
    if (k?.batchId) return { kind: "upload", lead: "From a bulk upload", others: 0 }
    return k && !k.addedByHand ? { kind: "seed", lead: "From the program's starting list", others: 0 } : { kind: "hand", lead: "Added by hand", others: 0 }
  }
  const date = batch.at ? longDate(batch.at) : undefined
  const others = Math.max(0, batch.skillIds.filter((id) => id !== skillId).length)
  const base = { batchId: batch.id, others, ...(date ? { date } : {}) }
  switch (batch.kind) {
    case "starter-library":
      return { kind: "starter", lead: "Copied from", name: batch.label, ...base }
    case "file-import": {
      // The v2 import names its batch "Import from {file}".
      const name = withoutShortDate(batch.label.replace(/^Import from /, ""))
      if (/^pasted list$/i.test(name)) return { kind: "upload", lead: "From a pasted list", ...base }
      if (/^several files$/i.test(name)) return { kind: "upload", lead: "From several uploaded files", ...base }
      return name ? { kind: "upload", lead: "From", name, ...base } : { kind: "upload", lead: "From a bulk upload", ...base }
    }
    case "add-several": {
      const list = batch.listId ? lists.find((l) => l.id === batch.listId) : undefined
      if (list) return { kind: "list", lead: "Created in", name: list.name, listId: list.id, ...base }
      // A list's Add skills names its batch "Add skills, {date}"; one saved before the list was kept on the batch, or a list since deleted, cannot be named.
      if (batch.listId || /^Add skills\b/.test(batch.label)) return { kind: "list", lead: `Created while adding to ${aNoun(skillListNoun())}`, ...base }
      return { kind: "several", lead: "Added several at once in the library", ...base }
    }
  }
}
