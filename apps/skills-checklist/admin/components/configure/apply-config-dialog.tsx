"use client"

import * as React from "react"
import { Checkbox, CheckboxLabel } from "@exxatdesignux/ui/components/ui/checkbox"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { applyConfig, configParts } from "@/lib/copy"
import type { Id } from "@/lib/domain/types"
import { isConfigured } from "@/lib/engine"
import { ALL_CONFIG_PARTS, applyConfiguration, planApplyConfiguration, type ApplyReport, type ConfigPart } from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import { SafeDialog } from "./dialogs"

/**
 * IM-14, P-05: apply one configured skill's configuration to several skills.
 * - `bulk`: opened from the S-04 bulk bar. The targets are the selection; the admin chooses the source.
 * - `fromSkill`: opened from S-09. The source is the skill being edited (as saved); the admin chooses the targets.
 * The review text is a dry run of the same store action, so what it says is exactly what Apply will do.
 */
export type ApplyMode = { kind: "bulk"; targetIds: Id[] } | { kind: "fromSkill"; sourceId: Id }

export function ApplyConfigDialog({ open, mode, onOpenChange, onDone }: { open: boolean; mode: ApplyMode; onOpenChange: (open: boolean) => void; onDone: (report: ApplyReport) => void }) {
  const db = useDb()
  const { run } = useActions()
  const [sourceId, setSourceId] = React.useState<Id | "">(mode.kind === "fromSkill" ? mode.sourceId : "")
  const [picked, setPicked] = React.useState<Set<Id>>(new Set())
  const [parts, setParts] = React.useState<Set<ConfigPart>>(new Set(ALL_CONFIG_PARTS))
  const [confirmModel, setConfirmModel] = React.useState(false)
  const [confirmEvidence, setConfirmEvidence] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setSourceId(mode.kind === "fromSkill" ? mode.sourceId : "")
    setPicked(new Set())
    setParts(new Set(ALL_CONFIG_PARTS))
    setConfirmModel(false)
    setConfirmEvidence(false)
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const configured = db.skills.filter((s) => isConfigured(s))
  const targetIds = mode.kind === "bulk" ? mode.targetIds : [...picked]
  const input = { sourceSkillId: sourceId, targetSkillIds: targetIds, parts: [...parts], confirmModelRebuild: confirmModel, confirmOverwriteWithEvidence: confirmEvidence }
  const plan = sourceId && targetIds.length > 0 && parts.size > 0 ? planApplyConfiguration(db, input) : null
  const needModel = plan?.results.filter((r) => r.status === "needsModelConfirmation").length ?? 0
  const needEvidence = plan?.results.filter((r) => r.status === "needsEvidenceConfirmation").length ?? 0
  const invalid = plan?.results.filter((r) => r.status === "invalid") ?? []
  const wouldApply = plan?.applied ?? 0
  const noSource = configured.length === 0
  const sourceOptions = configured.filter((s) => mode.kind !== "bulk" || !mode.targetIds.includes(s.id))

  const toggleTarget = (id: Id, on: boolean) =>
    setPicked((p) => {
      const n = new Set(p)
      if (on) n.add(id)
      else n.delete(id)
      return n
    })
  const togglePart = (part: ConfigPart, on: boolean) =>
    setParts((p) => {
      const n = new Set(p)
      if (on) n.add(part)
      else n.delete(part)
      return n
    })

  const apply = () => {
    const r = run((d) => applyConfiguration(d, input))
    if (!r.ok) {
      setError(r.error.message)
      return
    }
    onDone(r.value)
    onOpenChange(false)
  }

  return (
    <SafeDialog
      open={open}
      onOpenChange={onOpenChange}
      title={applyConfig.applyTitle}
      description={applyConfig.applyBody}
      safeLabel={applyConfig.cancel}
      onSafe={() => onOpenChange(false)}
      confirmLabel={applyConfig.confirm}
      onConfirm={apply}
      confirmDisabled={wouldApply === 0}
    >
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
        {noSource ? <LocalBanner variant="info">{applyConfig.applyNoSource}</LocalBanner> : null}
        {error ? <LocalBanner variant="error">{error}</LocalBanner> : null}

        {mode.kind === "bulk" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apply-source">{applyConfig.sourceLabel}</Label>
            <Select value={sourceId} onValueChange={(v) => setSourceId(v)}>
              <SelectTrigger id="apply-source">
                <SelectValue placeholder={applyConfig.sourcePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {sourceOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="font-medium">{applyConfig.targetsLabel}</legend>
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-md border border-border p-2">
              {db.skills.filter((s) => s.id !== mode.sourceId).map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox id={`apply-target-${s.id}`} checked={picked.has(s.id)} onCheckedChange={(c) => toggleTarget(s.id, c === true)} />
                  <CheckboxLabel htmlFor={`apply-target-${s.id}`}>
                    {s.name} <span className="text-muted-foreground">{isConfigured(s) ? "(configured)" : "(not configured)"}</span>
                  </CheckboxLabel>
                </div>
              ))}
            </div>
            {targetIds.length === 0 ? <p className="text-muted-foreground">{applyConfig.targetsNone}</p> : null}
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="font-medium">{applyConfig.partsLegend}</legend>
          {ALL_CONFIG_PARTS.map((part) => (
            <div key={part} className="flex items-center gap-2">
              <Checkbox id={`apply-part-${part}`} checked={parts.has(part)} onCheckedChange={(c) => togglePart(part, c === true)} />
              <CheckboxLabel htmlFor={`apply-part-${part}`}>{configParts[part]}</CheckboxLabel>
            </div>
          ))}
        </fieldset>

        {plan ? (
          <div className="flex flex-col gap-2" role="status" aria-live="polite" data-testid="apply-plan">
            <p className="font-medium">{applyConfig.planSummary(plan.results.filter((r) => r.status !== "sameSkill" && r.status !== "notFound").length, plan.results.filter((r) => r.overwrites && r.status !== "sameSkill").length)}</p>
            {needModel > 0 ? (
              <div className="flex items-start gap-2">
                <Checkbox id="apply-confirm-model" checked={confirmModel} onCheckedChange={(c) => setConfirmModel(c === true)} />
                <CheckboxLabel htmlFor="apply-confirm-model">{applyConfig.needsModel(needModel)}</CheckboxLabel>
              </div>
            ) : null}
            {needEvidence > 0 ? (
              <div className="flex items-start gap-2">
                <Checkbox id="apply-confirm-evidence" checked={confirmEvidence} onCheckedChange={(c) => setConfirmEvidence(c === true)} />
                <CheckboxLabel htmlFor="apply-confirm-evidence">{applyConfig.needsEvidence(needEvidence)}</CheckboxLabel>
              </div>
            ) : null}
            {invalid.length > 0 ? (
              <LocalBanner variant="warning">
                {applyConfig.willBeInvalid(invalid.length)} {invalid.map((r) => r.name).join(", ")}.
              </LocalBanner>
            ) : null}
          </div>
        ) : null}
      </div>
    </SafeDialog>
  )
}

/** The result banner text for an apply (P-05 step 5), including what was left as it was. */
export function applyResultText(r: ApplyReport): string {
  if (r.applied === 0) return `${applyConfig.resultNone} ${r.skipped > 0 ? applyConfig.resultLeft(r.skipped) : ""}`.trim()
  const left = r.skipped - r.results.filter((x) => x.status === "sameSkill").length
  return `${applyConfig.result(r.applied, r.overwritten)}${left > 0 ? ` ${applyConfig.resultLeft(left)}` : ""}`
}
