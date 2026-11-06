"use client"

/**
 * Categories and tags writes for both variants of the Categories and tags page (REQ SL-03 to SL-06): every change goes to the SHARED v2 store
 * (`state.vocabulary`, lib/v2/vocabulary.ts), persisted as a delta, so Add a skill, the library and the report filters read the
 * same list. Also the Rename dialog (DS Dialog with one field), shared by both variants.
 */
import * as React from "react"
import { NameDialog } from "@/components/lab/admin-a/lists-parts"
import { useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { addVocab, deleteVocab, renameVocab, setVocabActive, validateVocabName, type VocabKind, type VocabResult } from "@/lib/v2/vocabulary"
import type { V2State } from "@/lib/v2/types"
import { addClinicalSetting, deleteClinicalSetting, renameClinicalSetting, setClinicalSettingActive, validateClinicalSetting, type ClinicalSettingResult } from "@/lib/lab/settings"

/** The limit `validateVocabName` holds. */
const VOCAB_NAME_MAX = 80
const at = () => `${DEMO_TODAY}T${new Date().toISOString().slice(11)}`
export const isVocabKind = (t: string): t is VocabKind => t === "categories" || t === "tags"

/** Store writes; each returns the result so the page can show the outcome sentence once. */
export function useVocabularyActions() {
  const store = useV2Store()
  return React.useMemo(() => {
    const run = (fn: (s: V2State) => VocabResult): VocabResult => {
      let out: VocabResult = { ok: false, error: "Nothing was changed." }
      store.update((s) => {
        out = fn(s)
        return out.ok ? out.state : s
      })
      return out
    }
    return {
      add: (kind: VocabKind, name: string) => run((s) => addVocab(s, kind, name, IDS.ross, at())),
      rename: (kind: VocabKind, id: string, name: string) => run((s) => renameVocab(s, kind, id, name, IDS.ross, at())),
      setActive: (kind: VocabKind, id: string, active: boolean) => run((s) => setVocabActive(s, kind, id, active, IDS.ross, at())),
      remove: (kind: VocabKind, id: string) => run((s) => deleteVocab(s, kind, id, IDS.ross, at())),
    }
  }, [store])
}

/** The same for the program's clinical settings [REQ SL-07], held by name in `state.program`. `saved` is false when the browser refused the write. */
export function useClinicalSettingActions() {
  const store = useV2Store()
  return React.useMemo(() => {
    const run = (fn: (s: V2State) => ClinicalSettingResult): ClinicalSettingResult => {
      let out: ClinicalSettingResult = { ok: false, error: "Nothing was changed." }
      store.update((s) => {
        out = fn(s)
        return out.ok ? out.state : s
      })
      return out
    }
    return {
      add: (name: string) => run((s) => addClinicalSetting(s, name, IDS.ross, at())),
      rename: (from: string, name: string) => run((s) => renameClinicalSetting(s, from, name, IDS.ross, at())),
      setActive: (name: string, active: boolean) => run((s) => setClinicalSettingActive(s, name, active, IDS.ross, at())),
      remove: (name: string) => run((s) => deleteClinicalSetting(s, name, IDS.ross, at())),
      saved: () => !store.saveFailed(),
    }
  }, [store])
}

/** Outcome sentence for a rename, map section E rule 10: "{Object} {past verb}." The object is the name the admin chose to change; the row now shows the new one. */
export const renamedText = (from: string) => `${from} renamed.`

type RenameKind = VocabKind | "settings"

/**
 * Rename one category, tag or clinical setting: the one rename dialog, the same as a skill list's and a student group's (map E rule 14), titled with the object's name. The new name replaces the
 * old one everywhere it is carried. Every way out asks while the name has changed, browser Back too (E rule 6).
 */
export function RenameDialog({ kind, target, state, onClose, onRename, onCloseAutoFocus }: { kind: RenameKind; target: { id: string; name: string; uses: number; usedBy?: string | null } | null; state: V2State; onClose: () => void; onRename: (id: string, name: string) => string | null; /** Where focus goes when the dialog closes: it opened from a menu whose item is gone by then. */ onCloseAutoFocus?: (e: Event) => void }) {
  const back = React.useMemo(() => ({ onCloseAutoFocus: onCloseAutoFocus ?? (() => undefined) }), [onCloseAutoFocus])
  return (
    <NameDialog
      open={!!target}
      title={`Rename ${target?.name ?? ""}`}
      id="vocab-rename"
      initial={target?.name ?? ""}
      maxLength={VOCAB_NAME_MAX}
      back={back}
      validate={(name) => (!target ? null : kind === "settings" ? validateClinicalSetting(state, name, target.name) : validateVocabName(state, kind, name, target.id))}
      onClose={onClose}
      onSave={(name) => (target ? onRename(target.id, name) : null)}
    />
  )
}
