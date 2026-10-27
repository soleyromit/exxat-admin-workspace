"use client"

/**
 * Categories and tags writes for both variants of the Categories and tags page (REQ SL-03 to SL-06): every change goes to the SHARED v2 store
 * (`state.vocabulary`, lib/v2/vocabulary.ts), persisted as a delta, so Add a skill, the library and the report filters read the
 * same list. Also the Rename dialog (DS Dialog with one field), shared by both variants.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { addVocab, deleteVocab, renameVocab, setVocabActive, validateVocabName, type VocabKind, type VocabResult } from "@/lib/v2/vocabulary"
import type { V2State } from "@/lib/v2/types"
import { plural } from "@/lib/v2/format"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"

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

/** Outcome sentence for a rename: what changed, and on how many skills, once. */
export const renamedText = (from: string, to: string, uses: number) => (uses ? `Renamed "${from}" to "${to}" on ${plural(uses, skillNoun(), skillNounPlural())}.` : `Renamed "${from}" to "${to}".`)

const WORD: Record<VocabKind, string> = { categories: "category", tags: "tag" }

/** Rename one category or tag. The new name replaces the old one on every skill that carries it. */
export function RenameDialog({ kind, target, state, onClose, onRename }: { kind: VocabKind; target: { id: string; name: string; uses: number } | null; state: V2State; onClose: () => void; onRename: (id: string, name: string) => string | null }) {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    setName(target?.name ?? "")
    setError(null)
  }, [target])
  const submit = () => {
    if (!target) return
    const e = validateVocabName(state, kind, name, target.id) ?? onRename(target.id, name)
    setError(e)
  }
  return (
    <Dialog open={!!target} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Rename ${WORD[kind]}`}</DialogTitle>
          <DialogDescription>{target && target.uses ? `${plural(target.uses, skillNoun(), skillNounPlural())} will show the new name.` : `Nothing uses this ${WORD[kind]} yet.`}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => { e.preventDefault(); submit() }} className="flex flex-col gap-4" id="vocab-rename-form">
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor="vocab-rename">Name</FieldLabel>
            <Input id="vocab-rename" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error || undefined} aria-describedby={error ? "vocab-rename-error" : undefined} className="h-8" />
            {error ? <FieldError id="vocab-rename-error">{error}</FieldError> : null}
          </Field>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="vocab-rename-form" variant="default" size="sm">Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
