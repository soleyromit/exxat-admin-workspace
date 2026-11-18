"use client"

/**
 * Who a change to a list applies to (D-LS1116-c, Proposed; prototype 11-16 [16], merging D-L119). Asked at Save, only for a list students are on.
 * The safe choice is selected first: a new list, which current students do not get (Aarti, 205da2dd ch 9: a change is a new version).
 * The primary repeats the choice and its scope, never "Are you sure?".
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@exxatdesignux/ui/components/ui/radio-group"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { ABOVE_PANEL } from "@/components/lab/overlay-layer"
import { plural } from "@/lib/v2/format"
import { skillListNoun } from "@/lib/lab/terms"

type Scope = "everyone" | "new"

export function SaveScopeDialog({ open, listName, students, onCancel, onUpdate, onSaveNew }: {
  open: boolean
  listName: string
  students: number
  onCancel: () => void
  onUpdate: () => void
  onSaveNew: () => void
}) {
  const [scope, setScope] = React.useState<Scope>("new")
  React.useEffect(() => { if (open) setScope("new") }, [open])
  const who = plural(students, "student", "students")
  const options: Array<{ value: Scope; label: string; line: string }> = [
    { value: "everyone", label: "Update it for everyone on it", line: "Evaluations already recorded still count." },
    { value: "new", label: `Save as a new ${skillListNoun()}`, line: `Current students keep ${listName}.` },
  ]
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className={`sm:max-w-md ${ABOVE_PANEL}`} overlayClassName={ABOVE_PANEL} data-save-scope-dialog>
        <DialogHeader>
          <DialogTitle>Who should this change apply to?</DialogTitle>
          <DialogDescription>{`${who} ${students === 1 ? "is" : "are"} on ${listName}.`}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={scope} onValueChange={(v) => setScope(v as Scope)} aria-label="Who the change applies to" className="flex flex-col gap-3">
          {options.map((o) => (
            <div key={o.value} className="flex items-start gap-3" data-save-scope={o.value}>
              <RadioGroupItem value={o.value} id={`save-scope-${o.value}`} className="mt-0.5" aria-describedby={`save-scope-${o.value}-line`} />
              <span className="flex flex-col gap-0.5">
                <Label htmlFor={`save-scope-${o.value}`} className="font-normal">{o.label}</Label>
                <span id={`save-scope-${o.value}-line`} className="text-sm text-muted-foreground">{o.line}</span>
              </span>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="default" size="sm" onClick={scope === "everyone" ? onUpdate : onSaveNew} data-save-scope-confirm>
            {scope === "everyone" ? `Update for ${who}` : "Save as new list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
