"use client"

/**
 * Lab state for the skills library screens. Every change writes the shared v2 store, so a saved edit is true on every page and after a
 * reload: a success message must be true (Romit 2026-11-04). One hook so variants A, B and C and the add-skill screens behave identically.
 * Demo states via ?state=loading | empty | error.
 */
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { deleteSkill, setSkillsActive } from "@/lib/v2/admin-actions"
import { ensureVocab } from "@/lib/v2/vocabulary"
import type { V2State } from "@/lib/v2/types"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import {
  EMPTY_OVERLAY,
  configureHref,
  buildLibrary,
  countLibrary,
  configurationWords,
  draftToSkill,
  keepBothSeveralName,
  libraryCsv,
  mergeTags,
  normName,
  severalDrafts,
  type DuplicateChoice,
  type SeveralItem,
  addSkillsToStore,
  removeSkillsFromStore,
  restoreSkillsToStore,
  setSkillDetailsInStore,
  type Removal,
  type SkillDetailsPatch,
  type AddedSkill,
  type LibraryOverlay,
  type LibraryRow,
  type SkillDraft,
} from "@/lib/lab/library"
import { countSkills, skillNounPlural } from "@/lib/lab/terms"
import { LAB_ADMIN } from "@/lib/lab/library"
import { longDate } from "@/lib/v2/format"
import type { ResultBannerValue } from "@/components/lab/shared/result-banner"
import { configurationOf, notConfiguredReason, saveSkillSettings, setTimesNeededMany, timesCellOf } from "@/lib/lab/program-settings"
import { skillReach } from "@/lib/lab/mapping"
import { skillLists } from "@/lib/lab/lists"
import { useLists, useMappingOverlay } from "@/components/lab/admin-a/use-admin-data"
import { programRuleIn, type LabRule } from "@/lib/lab/configure"
import { focusAfterBanner } from "@/components/lab/shared/focus"
import { pushPageUrl } from "@/components/lab/shared/unsaved-guard"

export type LibraryDemo = "loading" | "empty" | "error" | null

export type LibraryBanner = ResultBannerValue

/** The program administrator writes library changes; stamped on the demo day. */
const ACTOR = IDS.ross
const at = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`

/** SL-05: categories and tags typed in an Add a skill picker join the shared list when the skill is saved. */
const withVocab = (s: V2State, skills: ReadonlyArray<{ category?: string; tags?: readonly string[] }>) =>
  ensureVocab(ensureVocab(s, "categories", skills.map((k) => k.category ?? "").filter(Boolean), ACTOR, at()), "tags", skills.flatMap((k) => k.tags ?? []), ACTOR, at())

/** Edit N skills (map D1b): a field left alone is not here. */
export interface BulkEdit {
  category: string
  addTags: string[]
  removeTags: string[]
  times: number | null
}

export function useLibrary() {
  const store = useV2Store()
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const router = useRouter()
  /** The banner that says a skill was saved: the next edit on the form makes it old news (rule E10). */
  const savedBanner = React.useRef<ResultBannerValue | null>(null)
  const raw = params?.get("state") ?? null
  const demo: LibraryDemo = raw === "loading" || raw === "empty" || raw === "error" ? raw : null
  const [overlay, setOverlay] = React.useState<LibraryOverlay>(EMPTY_OVERLAY)
  const [banner, setBanner] = React.useState<LibraryBanner | null>(null)
  /** The skills the last add put in or replaced: the table shows them first, marked, until the next add or a reload. */
  const [justAdded, setJustAdded] = React.useState<string[]>([])
  /** Of those, the ones replaced in place: they read Updated, never New (map D2). */
  const [justReplaced, setJustReplaced] = React.useState<string[]>([])
  // Lab bar "Reset edits": drop the skills added, edited or removed on this page and the result banner.
  React.useEffect(() => {
    const onReset = () => { setOverlay(EMPTY_OVERLAY); setBanner(null); setJustAdded([]); setJustReplaced([]) }
    window.addEventListener("lab:reset", onReset)
    return () => window.removeEventListener("lab:reset", onReset)
  }, [])
  // Coming back from Configure (decision D-X31): "?skill=&saved=1" after Save configuration, "&draft=1" after Save draft, and
  // "?saved=<n>" after several were saved at once. The row opens in the detail panel (its primary is the next step), and one
  // banner says what happened, once per arrival.
  const savedParam = params?.get("saved") ?? null
  const returned = savedParam ? "saved" : params?.get("draft") ? "draft" : null
  const returnedId = params?.get("skill") ?? null
  const announced = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!hydrated || !returned) return
    const key = `${returned}|${returnedId ?? savedParam}`
    if (announced.current === key) return
    if (!returnedId) {
      const n = Number(savedParam)
      // From several skills at once: those saved, plus any left as they were (D-L48), and the Inactive ones left out of the selection.
      const kept = Number(params?.get("kept") ?? 0)
      const held = Number(params?.get("held") ?? 0)
      const usedDefault = params?.get("default") === "1"
      const leftIds = (params?.get("inactive") ?? "").split(",").filter(Boolean)
      if (returned !== "saved" || !Number.isInteger(n) || n < 0 || (n === 0 && !kept && !held)) return
      announced.current = key
      const leftNames = leftIds.map((id) => state.skills.find((x) => x.id === id)?.name).filter((x): x is string => !!x)
      const notes = [
        kept ? `${countSkills(kept)} ${kept === 1 ? "stays" : "stay"} not configured.` : "",
        held ? `${countSkills(held)} kept ${held === 1 ? "its" : "their"} current rule.` : "",
        leftNames.length ? `Left out, Inactive: ${leftNames.slice(0, 3).join(", ")}${leftNames.length > 3 ? ` and ${leftNames.length - 3} more` : ""}.` : "",
      ].filter(Boolean).join(" ")
      const title = n === 0 ? `No ${skillNounPlural()} saved.` : usedDefault ? `${countSkills(n)} ${n === 1 ? "uses" : "use"} the default configuration.` : `${countSkills(n)} saved.`
      setBanner(n > 0 ? { variant: "success", title, body: notes || undefined } : { variant: "info", title, body: notes || undefined })
      // Said once: a reload must not say it again.
      const once = new URLSearchParams(window.location.search)
      for (const p of ["saved", "kept", "held", "default", "inactive"]) once.delete(p)
      const rest = once.toString()
      router.replace(rest ? `${window.location.pathname}?${rest}` : window.location.pathname, { scroll: false })
      return
    }
    const k = state.skills.find((x) => x.id === returnedId)
    if (!k) return
    announced.current = key
    const said: LibraryBanner = returned === "saved"
      ? { variant: "success", title: `${k.name} saved.` }
      : { variant: "info", title: `Draft saved for ${k.name}`, body: "It stays not configured until you save the configuration." }
    if (returned === "saved") savedBanner.current = said
    setBanner(said)
    // Said once: a reload must not say it again.
    const q = new URLSearchParams(window.location.search)
    q.delete("saved")
    q.delete("draft")
    router.replace(`${window.location.pathname}?${q.toString()}`, { scroll: false })
  }, [hydrated, returned, returnedId, savedParam, state.skills, params, router])
  const seq = React.useRef(0)
  /** Added skills go to the shared store (Not configured), so Configure, mapping and every count see them at once. */
  const keepAdded = React.useCallback((skills: AddedSkill[], batch?: { id: string; kind: "add-several"; label: string }) => {
    store.update((s) => addSkillsToStore(withVocab(s, skills), skills, ACTOR, at(), batch))
    const ids = skills.map((k) => k.id)
    setOverlay((o) => ({ ...o, fresh: [...(o.fresh ?? []), ...ids] }))
  }, [store])

  // The empty demo state still shows what was added on it: the page must not stay empty after an add says it worked.
  // A row's courses are `skillReach`'s, lists included and one per course and cohort: the figure the panel, Deactivate and Course mapping show (audit L8). `buildLibrary` alone sees only
  // the store's direct mappings, and a load-time cycle keeps it from reading the lists.
  const [mappingOverlay] = useMappingOverlay()
  const { lists } = useLists(state)
  const rows: LibraryRow[] = React.useMemo(() => {
    if (!hydrated) return []
    const reach = new Map(skillReach(state, mappingOverlay, "", lists).map((r) => [r.id, r]))
    const held = new Map<string, number>()
    for (const l of skillLists(lists)) for (const id of l.skillIds) held.set(id, (held.get(id) ?? 0) + 1)
    const built = buildLibrary(state, overlay).map((r) => ({ ...r, courses: reach.get(r.id)?.courses ?? 0, mandatoryCourses: reach.get(r.id)?.mandatoryCourses ?? 0, onLists: held.get(r.id) ?? 0 }))
    return demo === "empty" ? built.filter((r) => overlay.fresh?.includes(r.id)) : built
  }, [hydrated, state, overlay, demo, mappingOverlay, lists])
  const counts = React.useMemo(() => countLibrary(rows), [rows])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])
  const byId = React.useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  /** The result banner for skills just added, by the configuration they got (D0 rule 3). One wording with the Add several summary. */
  const addedBanner = React.useCallback((ids: string[], what: string): LibraryBanner => {
    const after = store.getSnapshot()
    const first = after.skills.find((k) => k.id === ids[0])
    if (!first || configurationOf(after, first) !== "not-configured") return { variant: "success", title: `${what} added. ${configurationWords(ids.length, "default")}` }
    const questions = notConfiguredReason(after, first) === "questions"
    return { variant: "success", title: `${what} added. ${configurationWords(ids.length, "not-configured")}`, action: questions ? { label: "Add questions", href: configureHref(first.id) } : { label: "Set how skills are judged", href: `${LAB_ADMIN}/evaluation-settings${params?.get("program") ? `?program=${params.get("program")}` : ""}` } }
  }, [store, params])

  const add = React.useCallback((d: SkillDraft): LibraryRow["id"] => {
    seq.current += 1
    const id = `lab-skill-${Date.now().toString(36)}-${seq.current}`
    const skill = draftToSkill(d, id)
    keepAdded([skill])
    setBanner(addedBanner([id], skill.name))
    setJustAdded([id])
    setJustReplaced([])
    return id
  }, [keepAdded, addedBanner])

  /** Replace [REQ IM-06]: the same skill and id, with its settings and course mapping. Only what was supplied changes; a blank field leaves it as it is [INFER]. */
  const replaceDetails = React.useCallback((id: string, s: AddedSkill) => {
    const patch: SkillDetailsPatch = { name: s.name, ...(s.description ? { description: s.description } : {}), ...(s.category ? { category: s.category } : {}), ...(s.tags.length ? { tags: s.tags } : {}) }
    store.update((st) => setSkillDetailsInStore(withVocab(st, [s]), [id], patch, ACTOR, at()))
  }, [store])

  /** Add a skill, with the program's choice when the name is already in the library [REQ IM-06]: the same three as Add several. */
  const addDraft = React.useCallback((d: SkillDraft, duplicate?: { choice: DuplicateChoice; twin: Pick<LibraryRow, "id" | "name"> }) => {
    if (!duplicate) { add(d); return }
    const { choice, twin } = duplicate
    // The sheet does not submit with Skip chosen; nothing happened, so there is no result to announce.
    if (choice === "skip") return
    if (choice === "keep-both") { add({ ...d, name: keepBothSeveralName(d.name.trim().replace(/\s+/g, " "), store.getSnapshot().skills.map((k) => k.name)) }); return }
    const s = draftToSkill(d, twin.id)
    replaceDetails(twin.id, s)
    setBanner({ variant: "success", title: `${s.name} replaced. Its settings stay.` })
    setJustAdded([twin.id])
    setJustReplaced([twin.id])
  }, [add, replaceDetails, store])

  /** Add several lines. A line that replaces a library twin [REQ IM-06] updates that skill in place, keeping its id; the rest are new. */
  const addLines = React.useCallback((items: SeveralItem[], defaults: { category: string; tags: string[] }, batch?: { id: string; kind: "add-several"; label: string }) => {
    const stamp = Date.now().toString(36)
    const fresh = items.filter((it) => !it.replaces)
    const replacing = items.filter((it) => it.replaces)
    const skills = severalDrafts(fresh, defaults).map((d) => {
      seq.current += 1
      return draftToSkill(d, `lab-skill-${stamp}-${seq.current}`)
    })
    if (skills.length) keepAdded(skills, batch)
    severalDrafts(replacing, defaults).forEach((d, i) => { const id = replacing[i]!.replaces!; replaceDetails(id, draftToSkill(d, id)) })
    const ids = skills.map((k) => k.id)
    // What this add touched, the replaced ones too, so Show them shows both, also after a reload. Replacing does not move a skill's Came from.
    if (batch && skills.length && replacing.length) {
      const again = replacing.map((r) => r.replaces!)
      store.update((s) => ({ ...s, batches: s.batches.map((x) => (x.id === batch.id ? { ...x, skillIds: [...x.skillIds, ...again] } : x)) }))
    }
    const replaced = replacing.length ? ` ${countSkills(replacing.length)} replaced.` : ""
    const b: LibraryBanner = ids.length ? addedBanner(ids, countSkills(ids.length)) : { variant: "success", title: `${countSkills(replacing.length)} replaced.` }
    setJustAdded([...ids, ...replacing.map((r) => r.replaces!)])
    setJustReplaced(replacing.map((r) => r.replaces!))
    return { ids, replaced: replacing.length, banner: { ...b, title: ids.length ? `${b.title}${replaced}` : b.title } }
  }, [keepAdded, replaceDetails, addedBanner, store])

  /** Lists that add in place on a page with no filter to show them on (the Set up skills list and add steps). */
  const addMany = React.useCallback((items: SeveralItem[], defaults: { category: string; tags: string[] }): string[] => {
    const { ids, banner: b } = addLines(items, defaults)
    setBanner(b)
    return ids
  }, [addLines])

  /** Show them: the table, filtered to one add several, on every tab. In the URL, so it survives a reload, and a new history entry, so Back returns to the whole list. The banner has done its job. */
  const showAdded = React.useCallback((batchId: string) => {
    const q = new URLSearchParams(window.location.search)
    for (const k of ["cat", "tag", "config", "different", "status", "from", "nolist"]) q.delete(k)
    q.set("added", batchId)
    setBanner(null)
    // Same page, so no server trip: the filter applies at once and cannot be lost to a slow navigation (Next keeps useSearchParams in step with pushState).
    pushPageUrl(`${window.location.pathname}?${q.toString()}`)
    focusAfterBanner()
  }, [])

  /** Add several on the Library: one batch, so the program can tell where these came from [REQ IM-11] and Show them can filter to it. */
  const addSeveral = React.useCallback((items: SeveralItem[], defaults: { category: string; tags: string[] }) => {
    seq.current += 1
    const batchId = `add-several-${Date.now().toString(36)}-${seq.current}`
    const { ids, replaced, banner: b } = addLines(items, defaults, { id: batchId, kind: "add-several", label: `Add several, ${longDate(DEMO_TODAY)}` })
    const label = ids.length + replaced === 1 ? "Show it" : "Show them"
    if (!ids.length) { setBanner(b); return }
    // The next job when there is one, and Show them beside it, in one style.
    const show = { label, onClick: () => showAdded(batchId) }
    setBanner(b.action ? { ...b, secondaryAction: show } : { ...b, action: show })
  }, [addLines, showAdded])

  /**
   * Save from the edit panel: name, description, category, tags and, when they changed, the evaluation settings together, written to the shared store
   * (map D1a, D-L91). New categories and tags join the shared vocabulary only here, when the skill that carries them is saved [REQ SL-05]. Returns
   * why it could not be saved, or null.
   */
  const saveEdit = React.useCallback((id: string, patch: SkillDetailsPatch, settings: { rule: LabRule; edited: boolean } | null): string | null => {
    let error: string | null = null
    store.update((s) => {
      let next = setSkillDetailsInStore(withVocab(s, [{ category: patch.category, tags: patch.tags }]), [id], patch, ACTOR, at())
      if (settings) {
        const r = saveSkillSettings(next, id, settings.rule, { at: at(), byId: ACTOR, edited: settings.edited })
        if (!r.ok) { error = r.error; return s }
        next = r.state
      }
      return next
    })
    if (error) return error
    const k = store.getSnapshot().skills.find((x) => x.id === id)
    const said: LibraryBanner = { variant: "success", title: `${k?.name ?? "It"} saved.` }
    savedBanner.current = said
    setBanner(said)
    return null
  }, [store])

  /** A new edit or a new problem list on the form: the save it follows is no longer the news (rule E10, one banner at a time). Any other banner stays. */
  const clearSaved = React.useCallback(() => {
    setBanner((b) => (b && b === savedBanner.current ? null : b))
  }, [])

  const edit = React.useCallback((id: string, d: SkillDraft) => {
    const s = draftToSkill(d, id)
    saveEdit(id, { name: s.name, description: s.description ?? "", category: s.category, tags: s.tags }, null)
  }, [saveEdit])

  /** Store skills carry the flag; skills added by hand in this tab stay in the overlay. */
  const setActive = React.useCallback((ids: string[], active: boolean) => {
    const inStore = new Set(store.getSnapshot().skills.map((k) => k.id))
    const storeIds = ids.filter((id) => inStore.has(id))
    const localIds = ids.filter((id) => !inStore.has(id))
    if (storeIds.length) store.update((s) => { const r = setSkillsActive(s, storeIds, active, ACTOR, at()); return r.ok ? r.state : s })
    if (localIds.length) setOverlay((o) => ({ ...o, inactive: active ? o.inactive.filter((x) => !localIds.includes(x)) : [...new Set([...o.inactive, ...localIds])] }))
  }, [store])

  const reactivateRef = React.useRef<(ids: string[]) => void>(() => undefined)
  const deactivate = React.useCallback((ids: string[]) => {
    // A late press on a dialog that is already closing has nothing to act on, and must not report "0 skills deactivated".
    if (!ids.length) return
    const one = ids.length === 1 ? store.getSnapshot().skills.find((k) => k.id === ids[0])?.name : undefined
    setActive(ids, false)
    setBanner({
      variant: "success",
      title: `${one ?? countSkills(ids.length)} deactivated.`,
      // The same as Reactivate on the panel and the row menu: a result banner, and an open panel stays open.
      // Its own button goes with the banner, so focus moves to the row it acted on.
      action: { label: "Reactivate", onClick: () => { reactivateRef.current(ids); focusAfterBanner(ids[0]) } },
    })
  }, [setActive, store])

  const reactivate = React.useCallback((ids: string[]) => {
    if (!ids.length) return
    const one = ids.length === 1 ? store.getSnapshot().skills.find((k) => k.id === ids[0])?.name : undefined
    setActive(ids, true)
    // What it was edited from while Inactive has been asked about, or changed nobody.
    const back = new Set(ids)
    store.update((s) => (s.skills.some((k) => back.has(k.id) && k.inactiveBaseline !== undefined) ? { ...s, skills: s.skills.map((k) => { if (!back.has(k.id) || k.inactiveBaseline === undefined) return k; const { inactiveBaseline: _done, ...rest } = k; return rest }) } : s))
    setBanner({ variant: "success", title: `${one ?? countSkills(ids.length)} reactivated.` })
  }, [setActive, store])

  reactivateRef.current = reactivate

  const remove = React.useCallback((id: string, name: string) => {
    if (store.getSnapshot().skills.some((k) => k.id === id)) {
      store.update((s) => { const r = deleteSkill(s, id, ACTOR, at()); return r.ok ? r.state : s })
    } else setOverlay((o) => ({ ...o, deleted: [...o.deleted, id] }))
    // The dialog named the courses it leaves, so the result says it once.
    setBanner({ variant: "success", title: `${name} deleted.` })
  }, [store])

  /**
   * Edit N skills (map D1b) [REQ IM-14, SL-03, SL-04]: what was set, on each selected skill; the rest stays. New names join the shared vocabulary [REQ SL-05]. The banner counts the skills that really
   * changed, says of the rest that they already had these values, and names each failure with its reason (rule E9).
   */
  const bulkEdit = React.useCallback((ids: string[], edit: BulkEdit) => {
    const changed = new Set<string>()
    const failed = new Map<string, string>()
    store.update((s) => {
      const found = ids.filter((id) => s.skills.some((k) => k.id === id))
      for (const id of ids) if (!found.includes(id)) failed.set(id, "This skill is no longer in the library.")
      let next = withVocab(s, [{ category: edit.category, tags: edit.addTags }])
      if (edit.category) {
        const moving = found.filter((id) => next.skills.find((x) => x.id === id)?.category !== edit.category)
        if (moving.length) next = setSkillDetailsInStore(next, moving, { category: edit.category }, ACTOR, at())
        moving.forEach((id) => changed.add(id))
      }
      if (edit.addTags.length || edit.removeTags.length) {
        const off = new Set(edit.removeTags.map(normName))
        const key = (tags: readonly string[]) => tags.map(normName).sort().join("|")
        for (const id of found) {
          const had = next.skills.find((x) => x.id === id)!.tags ?? []
          const tags = mergeTags(had.filter((t) => !off.has(normName(t))), edit.addTags)
          if (key(tags) === key(had)) continue
          next = setSkillDetailsInStore(next, [id], { tags }, ACTOR, at())
          changed.add(id)
        }
      }
      if (edit.times !== null) {
        const r = setTimesNeededMany(next, found, edit.times, { at: at(), byId: ACTOR })
        next = r.state
        r.written.forEach((id) => changed.add(id))
        r.failed.forEach((f) => failed.set(f.id, f.error))
      }
      return next
    })
    const nameOf = (id: string) => byId.get(id)?.name ?? id
    // A skill can take its category and refuse its number: then it is updated, and only the number is reported.
    const reasons = new Map<string, string[]>()
    for (const [id, error] of failed) {
      const reason = `${error.trim().replace(/\.$/, "")}.`
      reasons.set(reason, [...(reasons.get(reason) ?? []), nameOf(id)])
    }
    // With nothing updated the title has said so, so the line only has to name who and why.
    const lead = !changed.size ? "" : edit.category || edit.addTags.length || edit.removeTags.length ? "Times needed not changed: " : "Not updated: "
    const failures = [...reasons].map(([reason, names]) => `${lead}${names.join(", ")}. ${reason}`)
    const same = ids.filter((id) => !changed.has(id) && !failed.has(id)).length
    if (!changed.size && !failed.size) {
      setBanner({ variant: "info", title: `No ${skillNounPlural()} changed.`, body: same === 1 ? "It already has these values." : `All ${same} already have these values.` })
      return
    }
    const already = same ? `${same} already ${same === 1 ? "has" : "have"} these values.` : ""
    setBanner({
      variant: failed.size ? "warning" : "success",
      title: changed.size ? `${countSkills(changed.size)} updated.` : `No ${skillNounPlural()} updated.`,
      body: [...failures, already].filter(Boolean).join(" "),
    })
  }, [byId, store])

  /** Header More, Export (map D1): the whole library as a CSV, in the table's words; the banner says so once. */
  const exportCsv = React.useCallback(() => {
    const snapshot = store.getSnapshot()
    const csv = libraryCsv(rows, (id) => timesCellOf(snapshot, id).value)
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "skills-library.csv"
    a.click()
    URL.revokeObjectURL(url)
    setBanner({ variant: "success", title: `${countSkills(rows.length)} exported.` })
  }, [rows, store])

  /**
   * Set up skills step 1, list variant (D-L46): edits in place write the store. New categories and tags join the shared vocabulary (SL-05).
   */
  const setDetails = React.useCallback((ids: string[], patch: SkillDetailsPatch) => {
    store.update((s) => setSkillDetailsInStore(withVocab(s, [{ category: patch.category, tags: patch.tags }]), ids, patch, ACTOR, at()))
  }, [store])

  /** Takes skills out of the list and returns what Undo needs (D-L46). No banner here: the step draws its own, with Undo. */
  const removeMany = React.useCallback((ids: string[]): Removal => {
    let removal: Removal = { skills: [] }
    store.update((s) => { const r = removeSkillsFromStore(s, ids, ACTOR, at()); removal = r.removal; return r.state })
    return removal
  }, [store])

  const restore = React.useCallback((removal: Removal) => {
    store.update((s) => restoreSkillsToStore(s, removal, ACTOR, at()))
  }, [store])

  return { hydrated, demo, programSaved: !!programRuleIn(state), rows, counts, names, byId, overlay, banner, setBanner, clearSaved, justAdded, justReplaced, add, addDraft, addMany, addSeveral, edit, saveEdit, deactivate, reactivate, remove, bulkEdit, exportCsv, setDetails, removeMany, restore }
}

export type LibraryApi = ReturnType<typeof useLibrary>
