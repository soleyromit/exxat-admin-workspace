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
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import {
  EMPTY_DRAFT,
  EMPTY_OVERLAY,
  configureHref,
  buildLibrary,
  countLibrary,
  draftToSkill,
  type LibraryOverlay,
  type LibraryRow,
  type SkillDraft,
} from "@/lib/lab/library"
import { countSkills } from "@/lib/lab/terms"

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
  const seq = React.useRef(0)
  const configureMany = useConfigureMany()

  const rows: LibraryRow[] = React.useMemo(() => (hydrated && demo !== "empty" ? buildLibrary(state, overlay) : []), [hydrated, state, overlay, demo])
  const counts = React.useMemo(() => countLibrary(rows), [rows])
  const names = React.useMemo(() => rows.map((r) => r.name), [rows])
  const byId = React.useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  const add = React.useCallback((d: SkillDraft): LibraryRow["id"] => {
    seq.current += 1
    const id = `lab-skill-${Date.now().toString(36)}-${seq.current}`
    const skill = draftToSkill(d, id)
    setOverlay((o) => ({ ...o, added: [skill, ...o.added] }))
    setBanner({ variant: "success", title: `${skill.name} added`, body: "Not configured yet.", action: { label: "Configure it", href: configureHref(id) } })
    return id
  }, [])

  /** Add several (add a skill, variant C): every name becomes a skill that is not configured, in one category or none. */
  const addMany = React.useCallback((names: string[], section: string): string[] => {
    const stamp = Date.now().toString(36)
    const skills = names.map((name) => {
      seq.current += 1
      return draftToSkill({ ...EMPTY_DRAFT, name, section }, `lab-skill-${stamp}-${seq.current}`)
    })
    setOverlay((o) => ({ ...o, added: [...skills, ...o.added] }))
    const ids = skills.map((k) => k.id)
    setBanner({
      variant: "success",
      title: `${countSkills(ids.length)} added`,
      body: "Not configured yet.",
      action: (() => { const c = configureMany(ids); return { label: c.many ? "Configure them together" : c.label, href: c.href } })(),
    })
    return ids
  }, [configureMany])

  const edit = React.useCallback((id: string, d: SkillDraft) => {
    setOverlay((o) => {
      const isAdded = o.added.some((a) => a.id === id)
      if (isAdded) return { ...o, added: o.added.map((a) => (a.id === id ? { ...a, ...draftToSkill(d, id) } : a)) }
      const s = draftToSkill(d, id)
      return { ...o, edits: { ...o.edits, [id]: { name: s.name, section: s.section, group: s.group, category: s.category, tags: s.tags } } }
    })
    setBanner({ variant: "success", title: "Changes saved", body: "Evaluation settings did not change." })
  }, [])

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
    setBanner({ variant: "success", title: `Settings copied to ${countSkills(targetIds.length)}`, body: `From ${source?.name ?? "the chosen skill"}. Review each before you publish.` })
  }, [byId])

  return { hydrated, demo, rows, counts, names, byId, overlay, banner, setBanner, add, addMany, edit, deactivate, reactivate, remove, copyConfig }
}

export type LibraryApi = ReturnType<typeof useLibrary>
