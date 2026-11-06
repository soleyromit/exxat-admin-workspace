"use client"

/**
 * Edit N skills (map D1b) [REQ IM-14, SL-03, SL-04, SL-05]: one change to many selected skills, from the selection bar. Every field starts at Keep current and only what is set is written.
 * Inactive rows are left out, and the panel names them [INFER]. Times needed names the students whose progress changes first [REQ AE-02]. Name, description and status are not here: those
 * are one skill's. Evaluation settings go through Configure N.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { FloatingSheetPanel } from "@/components/lab/shared/sheet"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { TYPE } from "@/components/lab/type-scale"
import { DiscardChangesDialog, useDialogDiscard, useLeaveGuard } from "@/components/lab/shared/unsaved-guard"
import { holdSecondPress } from "@/components/lab/shared/focus"
import { TIMES_MAX, timesNeededImpact } from "@/lib/lab/program-settings"
import { mergeTags, normName, type LibraryRow } from "@/lib/lab/library"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { useV2State } from "@/lib/v2/react"
import { CategoryPicker, TagsPicker, useVocabOptions } from "./category-tag-pickers"
import { ImpactDialog, parseTimes } from "./times-needed"
import type { BulkEdit } from "./use-library"

const KEEP = "Keep current"
const skillTags = (r: LibraryRow): readonly string[] => r.tags

export function BulkEditSheet({ rows, onClose, onApply }: { rows: LibraryRow[] | null; onClose: () => void; onApply: (ids: string[], edit: BulkEdit) => void }) {
  // Browser Back, like every other door (rule E6). Out here, so the history entry it keeps is still looked after once the form has gone.
  const [dirty, setDirty] = React.useState(false)
  const leave = useLeaveGuard(!!rows && dirty)
  return (
    <>
      {rows ? <Form key={rows.map((r) => r.id).join(",")} rows={rows} onClose={onClose} onApply={onApply} onDirty={setDirty} /> : null}
      <DiscardChangesDialog open={leave.asking} onKeep={() => leave.setAsking(false)} onDiscard={() => leave.go(() => { setDirty(false); onClose() })} />
    </>
  )
}

function Form({ rows, onClose, onApply, onDirty }: { rows: LibraryRow[]; onClose: () => void; onApply: (ids: string[], edit: BulkEdit) => void; onDirty: (d: boolean) => void }) {
  const state = useV2State()
  const vocab = useVocabOptions()
  const active = rows.filter((r) => r.status !== "inactive")
  const left = rows.filter((r) => r.status === "inactive")
  const ids = active.map((r) => r.id)
  const [category, setCategory] = React.useState("")
  const [addTags, setAddTags] = React.useState<string[]>([])
  const [removeTags, setRemoveTags] = React.useState<string[]>([])
  const [timesOn, setTimesOn] = React.useState(false)
  const [times, setTimes] = React.useState("")
  const [tried, setTried] = React.useState(false)
  const [typing, setTyping] = React.useState(false)
  const [ask, setAsk] = React.useState<{ need: number; students: Array<{ id: string; name: string }> } | null>(null)
  const removable = React.useMemo(() => mergeTags([], active.flatMap(skillTags)), [active])
  const n = timesOn ? parseTimes(times) : null
  const set = !!category || addTags.length > 0 || removeTags.length > 0 || timesOn || typing
  const timesError = tried && timesOn && n === null ? `Enter 1 to ${TIMES_MAX}.` : null
  const guard = useDialogDiscard(set, onClose)
  React.useLayoutEffect(() => { onDirty(set) }, [set, onDirty])
  React.useEffect(() => () => onDirty(false), [onDirty])
  // One tag cannot be asked for both ways: said as soon as it is so, and Update stops there.
  const clash = addTags.filter((t) => removeTags.some((r) => normName(r) === normName(t)))
  const clashError = clash.length ? `${clash.join(", ")} ${clash.length === 1 ? "is" : "are"} in both Add tags and Remove tags. Keep ${clash.length === 1 ? "it" : "them"} in one.` : null
  const edit = (): BulkEdit => ({ category, addTags, removeTags, times: n })
  const update = () => {
    setTried(true)
    if (clashError) {
      requestAnimationFrame(() => document.getElementById("bulk-remove-tags")?.focus())
      return
    }
    if (timesOn && n === null) {
      requestAnimationFrame(() => document.getElementById("bulk-times")?.focus())
      return
    }
    if (n !== null) {
      const seen = new Map<string, { id: string; name: string }>()
      for (const id of ids) for (const p of timesNeededImpact(state, id, n)) seen.set(p.id, p)
      if (seen.size) {
        setAsk({ need: n, students: [...seen.values()] })
        return
      }
    }
    onApply(ids, edit())
  }
  const title = `Edit ${countSkills(ids.length)}`
  const updateLabel = `Update ${countSkills(ids.length)}`
  return (
    <>
      <FloatingSheetPanel open onOpenChange={(o) => { if (!o) guard.close() }} modal>
        <FloatingSheetPanelContent contentSlot="lab-bulk-edit" side="right" size="sm" aria-modal="true" onOpenAutoFocus={(e) => { e.preventDefault(); document.getElementById("bulk-category")?.focus() }} onCloseAutoFocus={(e) => e.preventDefault()}>
          <FloatingSheetPanelHeader title={title} onClose={guard.close} />
          <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); update() }} data-bulk-edit>
            <FloatingSheetPanelBody className="flex flex-col gap-5 px-4 pt-1 pb-4">
              {left.length ? <p className={TYPE.helper} data-bulk-left-out>{`${left.length} inactive ${left.length === 1 ? skillNoun() : skillNounPlural()} left out: ${left.map((r) => r.name).join(", ")}.`}</p> : null}
              <Field>
                <FieldLabel id="bulk-category-label" htmlFor="bulk-category">Category</FieldLabel>
                <CategoryPicker id="bulk-category" labelId="bulk-category-label" value={category} options={vocab.categories} inactive={vocab.inactiveCategories} onChange={setCategory} emptyLabel={KEEP} className="w-full" />
              </Field>
              <Field>
                <FieldLabel id="bulk-add-tags-label" htmlFor="bulk-add-tags">Add tags</FieldLabel>
                <TagsPicker id="bulk-add-tags" labelId="bulk-add-tags-label" value={addTags} options={vocab.tags} inactive={vocab.inactiveTags} onChange={setAddTags} onTyping={setTyping} />
              </Field>
              <Field>
                <FieldLabel id="bulk-remove-tags-label" htmlFor="bulk-remove-tags">Remove tags</FieldLabel>
                <TagsPicker id="bulk-remove-tags" labelId="bulk-remove-tags-label" value={removeTags} options={removable} onChange={setRemoveTags} describedBy={clashError ? "bulk-remove-tags-error" : undefined} />
                {clashError ? <FieldError id="bulk-remove-tags-error">{clashError}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel id="bulk-times-mode-label" htmlFor="bulk-times-mode">Times needed</FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={timesOn ? "set" : "keep"} onValueChange={(v) => { setTimesOn(v === "set"); setTried(false); if (v === "set") requestAnimationFrame(() => document.getElementById("bulk-times")?.focus()) }}>
                    <SelectTrigger id="bulk-times-mode" className="w-44" aria-labelledby="bulk-times-mode-label"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[90]">
                      <SelectItem value="keep">{KEEP}</SelectItem>
                      <SelectItem value="set">Set a number</SelectItem>
                    </SelectContent>
                  </Select>
                  {timesOn ? <Input id="bulk-times" type="number" inputMode="numeric" min={1} max={TIMES_MAX} step={1} className="w-24 tabular-nums" aria-label={`Times needed for the selected ${skillNounPlural()}`} aria-invalid={timesError ? true : undefined} aria-describedby={timesError ? "bulk-times-error" : undefined} value={times} onChange={(e) => setTimes(e.target.value)} /> : null}
                </div>
                {timesError ? <FieldError id="bulk-times-error">{timesError}</FieldError> : null}
              </Field>
            </FloatingSheetPanelBody>
            <FloatingSheetPanelFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="default" onClick={guard.close}>Cancel</Button>
              {/* A double click: the panel leaves on the first press, and the second must not open the row behind it. */}
              <Button type="submit" variant="default" size="default" disabled={!set} onClick={holdSecondPress}>{updateLabel}</Button>
            </FloatingSheetPanelFooter>
          </form>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      {guard.question}
      <ImpactDialog open={!!ask} title={`Change times needed for ${countSkills(ids.length)}?`} students={ask?.students ?? []} onCancel={() => setAsk(null)} onConfirm={() => { setAsk(null); onApply(ids, edit()) }} />
    </>
  )
}
