"use client"

/**
 * Lab state for the skills library screens: the shared v2 store plus a lab-local overlay (skills added by hand, edits, copied
 * settings). Deactivate, reactivate and delete of store skills write the shared store (decisions D-X14, D-X15), so every
 * report figure changes with them. One hook so variants A, B and C and the add-skill screens behave identically.
 * Demo states via ?state=loading | empty | error.
 */
import * as React from "react"
import { useConfigureMany } from "@/components/lab/library/configure-many"
import { useSearchParams } from "next/navigation"
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
  draftToSkill,
  severalDrafts,
  type SeveralItem,
  addSkillsToStore,
  type AddedSkill,
  type LibraryOverlay,
  type LibraryRow,
  type SkillDraft,
} from "@/lib/lab/library"
import { countSkills, skillNoun } from "@/lib/lab/terms"

export type LibraryDemo = "loading" | "empty" | "error" | null

export interface LibraryBanner {
  variant: "success" | "info" | "warning"
  title: string
  body: string
  action?: { label: string; href?: string; onClick?: () => void }
}

/** The program administrator writes library changes; stamped on the demo day. */
const ACTOR = IDS.ross
const at = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`

/** SL-05: categories and tags typed in an Add a skill picker join the shared list when the skill is saved. */
const withVocab = (s: V2State, skills: ReadonlyArray<{ category?: string; tags?: readonly string[] }>) =>
  ensureVocab(ensureVocab(s, "categories", skills.map((k) => k.category ?? "").filter(Boolean), ACTOR, at()), "tags", skills.flatMap((k) => k.tags ?? []), ACTOR, at())

export function useLibrary() {
  const store = useV2Store()
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const raw = params?.get("state") ?? null
  const demo: LibraryDemo = raw === "loading" || raw === "empty" || raw === "error" ? raw : null
  const [overlay, setOverlay] = React.useState<LibraryOverlay>(EMPTY_OVERLAY)
  const [banner, setBanner] = React.useState<LibraryBanner | null>(null)
  // Lab bar "Reset edits": drop the skills added, edited or removed on this page and the result banner.
  React.useEffect(() => {
    const onReset = () => { setOverlay(EMPTY_OVERLAY); setBanner(null) }
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
      if (returned !== "saved" || !Number.isInteger(n) || n < 1) return
      announced.current = key
      setBanner({ variant: "success", title: `${countSkills(n)} configured`, body: "They can now be mapped to courses." })
      return
    }
    const k = state.skills.find((x) => x.id === returnedId)
    if (!k) return
    announced.current = key
    setBanner(
      returned === "saved"
        ? { variant: "success", title: `${k.name} is configured`, body: "It can now be mapped to courses." }
        : { variant: "info", title: `Draft saved for ${k.name}`, body: "It stays not configured until you save the configuration." },
    )
  }, [hydrated, returned, returnedId, savedParam, state.skills])
  const seq = React.useRef(0)
  // SL-05: a category or tag created in an Add a skill picker joins the shared list (Settings and every picker) on save.
  const keepVocab = React.useCallback((skills: ReadonlyArray<{ category?: string; tags?: readonly string[] }>) => {
    store.update((s) => withVocab(s, skills))
  }, [store])
  /** Added skills go to the shared store (Not configured), so Configure, mapping and every count see them at once. */
  const keepAdded = React.useCallback((skills: AddedSkill[]) => {
    store.update((s) => addSkillsToStore(withVocab(s, skills), skills, ACTOR, at()))
    const ids = skills.map((k) => k.id)
    const req = skills.filter((k) => k.requiredToGraduate).map((k) => k.id)
    setOverlay((o) => ({ ...o, fresh: [...(o.fresh ?? []), ...ids], required: [...(o.required ?? []), ...req] }))
  }, [store])
  const configureMany = useConfigureMany()

  const rows: LibraryRow[] = React.useMemo(() => (hydrated && demo !== "empty" ? buildLibrary(state, overlay) : []), [hydrated, state, overlay, demo])
  const counts = React.useMemo(() => countLibrary(rows), [rows])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])
  const byId = React.useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  const add = React.useCallback((d: SkillDraft): LibraryRow["id"] => {
    seq.current += 1
    const id = `lab-skill-${Date.now().toString(36)}-${seq.current}`
    const skill = draftToSkill(d, id)
    keepAdded([skill])
    setBanner({ variant: "success", title: `${skill.name} added`, body: "Not configured yet.", action: { label: "Configure it", href: configureHref(id) } })
    return id
  }, [keepAdded])

  /** Add several (add a skill, variant C): every name becomes a skill that is not configured, in one category or none. */
  const addMany = React.useCallback((items: SeveralItem[], defaults: { category: string; tags: string[] }): string[] => {
    const stamp = Date.now().toString(36)
    // A line that replaces a library twin [REQ IM-06] updates that skill's details in place, keeping its id; the rest are new.
    const fresh = items.filter((it) => !it.replaces)
    const replacing = items.filter((it) => it.replaces)
    const skills = severalDrafts(fresh, defaults).map((d) => {
      seq.current += 1
      return draftToSkill(d, `lab-skill-${stamp}-${seq.current}`)
    })
    if (skills.length) keepAdded(skills)
    if (replacing.length) {
      const drafts = severalDrafts(replacing, defaults)
      keepVocab(drafts.map((d, i) => draftToSkill(d, replacing[i]!.replaces!)))
      setOverlay((o) => {
        let next = o
        drafts.forEach((d, i) => {
          const id = replacing[i]!.replaces!
          const s = draftToSkill(d, id)
          next = next.added.some((a) => a.id === id)
            ? { ...next, added: next.added.map((a) => (a.id === id ? { ...a, ...s } : a)) }
            : { ...next, edits: { ...next.edits, [id]: { name: s.name, description: s.description ?? "", section: s.section, group: s.group, category: s.category, tags: s.tags } } }
        })
        return next
      })
    }
    const ids = skills.map((k) => k.id)
    const replaced = replacing.length ? ` ${countSkills(replacing.length)} replaced.` : ""
    setBanner({
      variant: "success",
      title: ids.length ? `${countSkills(ids.length)} added` : `${countSkills(replacing.length)} replaced`,
      body: ids.length ? `Not configured yet.${replaced}` : "Not configured yet.",
      action: (() => { const c = configureMany([...ids, ...replacing.map((it) => it.replaces!)]); return { label: c.many ? "Configure them together" : c.label, href: c.href } })(),
    })
    return ids
  }, [configureMany, keepAdded, keepVocab])

  const edit = React.useCallback((id: string, d: SkillDraft) => {
    keepVocab([draftToSkill(d, id)])
    setOverlay((o) => {
      const isAdded = o.added.some((a) => a.id === id)
      if (isAdded) return { ...o, added: o.added.map((a) => (a.id === id ? { ...a, ...draftToSkill(d, id) } : a)) }
      const s = draftToSkill(d, id)
      return { ...o, edits: { ...o.edits, [id]: { name: s.name, description: s.description ?? "", section: s.section, group: s.group, category: s.category, tags: s.tags } } }
    })
    setBanner({ variant: "success", title: "Changes saved", body: "Evaluation settings did not change." })
  }, [keepVocab])

  /** Store skills carry the flag; skills added by hand in this tab stay in the overlay. */
  const setActive = React.useCallback((ids: string[], active: boolean) => {
    const inStore = new Set(store.getSnapshot().skills.map((k) => k.id))
    const storeIds = ids.filter((id) => inStore.has(id))
    const localIds = ids.filter((id) => !inStore.has(id))
    if (storeIds.length) store.update((s) => { const r = setSkillsActive(s, storeIds, active, ACTOR, at()); return r.ok ? r.state : s })
    if (localIds.length) setOverlay((o) => ({ ...o, inactive: active ? o.inactive.filter((x) => !localIds.includes(x)) : [...new Set([...o.inactive, ...localIds])] }))
  }, [store])

  const deactivate = React.useCallback((ids: string[]) => {
    setActive(ids, false)
    setBanner({
      variant: "success",
      title: `${countSkills(ids.length)} deactivated`,
      body: ids.length === 1 ? "Evidence is kept. It no longer appears in mapping, student selection or reports." : "Evidence is kept. They no longer appear in mapping, student selection or reports.",
      action: { label: "Undo", onClick: () => { setActive(ids, true); setBanner(null) } },
    })
  }, [setActive])

  const reactivate = React.useCallback((ids: string[]) => {
    setActive(ids, true)
    setBanner({ variant: "success", title: `${countSkills(ids.length)} reactivated`, body: ids.length === 1 ? "It can be mapped and selected again." : "They can be mapped and selected again." })
  }, [setActive])

  const remove = React.useCallback((id: string, name: string) => {
    let unmapped: string[] = []
    if (store.getSnapshot().skills.some((k) => k.id === id)) {
      store.update((s) => { const r = deleteSkill(s, id, ACTOR, at()); if (!r.ok) return s; unmapped = r.unmapped; return r.state })
    } else setOverlay((o) => ({ ...o, deleted: [...o.deleted, id] }))
    setBanner({ variant: "success", title: `${name} deleted`, body: unmapped.length ? `It was unmapped from ${unmapped.join(", ")}.` : "It had no evidence and no course, so nothing else changed." })
  }, [store])

  const copyConfig = React.useCallback((sourceId: string, targetIds: string[]) => {
    const source = byId.get(sourceId)
    setOverlay((o) => ({ ...o, copiedFrom: { ...o.copiedFrom, ...Object.fromEntries(targetIds.filter((t) => t !== sourceId).map((t) => [t, sourceId])) } }))
    setBanner({ variant: "success", title: `Settings copied to ${countSkills(targetIds.length)}`, body: `From ${source?.name ?? `the chosen ${skillNoun()}`}, as drafts. Open each to check and save it.` })
  }, [byId])

  return { hydrated, demo, rows, counts, names, byId, overlay, banner, setBanner, add, addMany, edit, deactivate, reactivate, remove, copyConfig }
}

export type LibraryApi = ReturnType<typeof useLibrary>
