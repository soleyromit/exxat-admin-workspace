"use client"

/**
 * Starting points (PENDING-ROMIT: REQ SL-01 says Prism ships no skills library; LEDGER D-X5 keeps them only as editable
 * starting points the program owns, labelled). Shared by starter-library variants A and B: the preview body and the copy dialog.
 * The copy is owned by the program, shares no evidence or versions with the starting point, and arrives not configured.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { DEFAULT_LIST, IMPORT_GROUPING, TARGET_LABEL, copyPlan, importTargets, sectionsOf, type StartingPoint } from "@/lib/lab/import"
import { countSkills } from "@/lib/lab/terms"
import type { Skill } from "@/lib/v2/types"

export function StartingPointPreview({ point }: { point: StartingPoint }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{point.summary}</p>
      {sectionsOf(point).map((s) => {
        const list = point.skills.filter((k) => k.section === s)
        return (
          <section key={s} aria-label={`${s}, ${countSkills(list.length)}`} className="flex flex-col gap-1">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">{s}<span className="text-xs font-normal tabular-nums text-muted-foreground">{list.length}</span></h3>
            <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
              {list.map((k, i) => (
                <li key={`${k.name}-${i}`} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground">{k.name}</span>
                  {k.group ? <span className="shrink-0 text-xs text-muted-foreground">{k.group}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export interface CopyResult { point: StartingPoint; target: string; copied: number }

export function CopyDialog({ point, skills, onClose, onCopied }: { point: StartingPoint | null; skills: Skill[]; onClose: () => void; onCopied: (r: CopyResult) => void }) {
  const targets = React.useMemo(() => importTargets(skills), [skills])
  const [target, setTarget] = React.useState(DEFAULT_LIST)
  const [repeats, setRepeats] = React.useState<"skip" | "keep">("skip")
  React.useEffect(() => { if (point) { setTarget(DEFAULT_LIST); setRepeats("skip") } }, [point])
  const library = React.useMemo(() => skills.filter((k) => k.specialty === target).map((k) => ({ id: k.id, name: k.name, configured: k.configured })), [skills, target])
  const plan = point && target ? copyPlan(point, library, repeats === "keep") : null
  return (
    <Dialog open={!!point} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        {point ? (
          <>
            <DialogHeader>
              <DialogTitle>{`Copy ${point.label}`}</DialogTitle>
              <DialogDescription>{`Names, ${IMPORT_GROUPING.categories} and ${IMPORT_GROUPING.tags} are copied; models, rules and evidence are not. Your program owns the copy.`}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="copy-b-target">Copy into</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger id="copy-b-target" className="w-full"><SelectValue placeholder="Choose a list" /></SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => <SelectItem key={t.id} value={t.id}>{`${t.label} (${countSkills(t.count)})`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {plan && plan.repeats.length > 0 ? (
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium text-foreground">{`${plan.repeats.length} of these match names already in this list`}</legend>
                  <p className="text-xs text-muted-foreground">{plan.repeats.slice(0, 3).join(", ")}{plan.repeats.length > 3 ? `, and ${plan.repeats.length - 3} more` : ""}</p>
                  <RadioGroup value={repeats} onValueChange={(v) => setRepeats(v as "skip" | "keep")}>
                    <div className="flex items-center gap-2"><RadioGroupItem id="rep-b-skip" value="skip" /><Label htmlFor="rep-b-skip">Skip them</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem id="rep-b-keep" value="keep" /><Label htmlFor="rep-b-keep">Keep both, marked as a copy</Label></div>
                  </RadioGroup>
                </fieldset>
              ) : null}
              {plan ? <p className="text-sm text-foreground" aria-live="polite">{`${countSkills(plan.copy)} will be added to ${TARGET_LABEL[target]}, each not configured.`}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="default" onClick={onClose}>Cancel</Button>
              <Button type="button" variant="default" size="default" disabled={!plan || plan.copy === 0} onClick={() => { if (plan) onCopied({ point, target: TARGET_LABEL[target], copied: plan.copy }); onClose() }}>
                {plan ? `Copy ${countSkills(plan.copy)}` : "Copy"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
