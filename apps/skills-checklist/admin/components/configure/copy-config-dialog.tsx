"use client"

import * as React from "react"
import { Checkbox, CheckboxLabel } from "@exxatdesignux/ui/components/ui/checkbox"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { applyConfig, configParts } from "@/lib/copy"
import type { Id } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"
import { ALL_CONFIG_PARTS, copyConfigDraft, type ConfigPart, type CopiedSummary, type SkillConfigDraft } from "@/lib/store"
import { useDb } from "@/lib/store/react"
import { SafeDialog } from "./dialogs"

export interface CopyResult {
  draft: SkillConfigDraft
  copied: CopiedSummary
  dropped: ConfigPart[]
  sourceName: string
}

/**
 * S-09 (T23): copy another skill's configuration INTO THIS FORM. It lands in the draft as independent copies, so the
 * form stays editable and the usual validation and impact review run on Save. Nothing is saved here.
 */
export function CopyConfigDialog({ open, onOpenChange, targetId, cfg, targetConfigured, onCopy }: { open: boolean; onOpenChange: (open: boolean) => void; targetId: string; cfg: SkillConfigDraft; targetConfigured: boolean; onCopy: (r: CopyResult) => void }) {
  const db = useDb()
  const [sourceId, setSourceId] = React.useState<Id | "">("")
  const [parts, setParts] = React.useState<Set<ConfigPart>>(new Set(ALL_CONFIG_PARTS))
  React.useEffect(() => {
    if (!open) return
    setSourceId("")
    setParts(new Set(ALL_CONFIG_PARTS))
  }, [open])
  const sources = db.skills.filter((s) => s.id !== targetId && isConfigured(s))
  const overwrites = targetConfigured && cfg.model !== null

  const confirm = () => {
    const r = copyConfigDraft(db, sourceId, targetId, cfg, [...parts])
    if (!r.ok) return
    onCopy({ draft: r.draft, copied: r.copied, dropped: r.dropped, sourceName: db.skills.find((s) => s.id === sourceId)?.name ?? "" })
    onOpenChange(false)
  }
  const togglePart = (part: ConfigPart, on: boolean) =>
    setParts((p) => {
      const n = new Set(p)
      if (on) n.add(part)
      else n.delete(part)
      return n
    })

  return (
    <SafeDialog
      open={open}
      onOpenChange={onOpenChange}
      title={applyConfig.copyTitle}
      description={applyConfig.copyBody}
      safeLabel={applyConfig.cancel}
      onSafe={() => onOpenChange(false)}
      confirmLabel={applyConfig.copyConfirm}
      onConfirm={confirm}
      confirmDisabled={!sourceId || parts.size === 0}
    >
      <div className="flex flex-col gap-4 text-sm">
        {overwrites ? <LocalBanner variant="warning">{applyConfig.copyOverwrite}</LocalBanner> : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="copy-source">Copy from</Label>
          <Select value={sourceId} onValueChange={(v) => setSourceId(v)}>
            <SelectTrigger id="copy-source">
              <SelectValue placeholder={applyConfig.sourcePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="font-medium">{applyConfig.partsLegend}</legend>
          {ALL_CONFIG_PARTS.map((part) => (
            <div key={part} className="flex items-center gap-2">
              <Checkbox id={`copy-part-${part}`} checked={parts.has(part)} onCheckedChange={(c) => togglePart(part, c === true)} />
              <CheckboxLabel htmlFor={`copy-part-${part}`}>{configParts[part]}</CheckboxLabel>
            </div>
          ))}
        </fieldset>
      </div>
    </SafeDialog>
  )
}
