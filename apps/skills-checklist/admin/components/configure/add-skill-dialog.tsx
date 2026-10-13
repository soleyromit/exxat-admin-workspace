"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { r2c } from "@/lib/copy/r2-configure"
import type { Id } from "@/lib/domain/types"
import { createSkill } from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import { TagChips } from "./tag-chips"

const NONE = "__none__"
const a = r2c.add

export interface AddSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "Add and configure": the skill now exists (unconfigured) and the host opens the wizard on it. */
  onConfigure: (skillId: Id) => void
  /** "Add to library": the skill exists and stays unconfigured (SC-01, IM-09). */
  onAdded?: (skillId: Id, name: string) => void
}

/**
 * P-07: the small (672px) Add a skill dialog. Name it now, decide how it is evaluated separately. Creating a skill never
 * configures it (SC-01): "Add and configure" creates it and then opens the wizard; "Add to library" leaves it as "Needs
 * configuration", unmappable and unsubmittable until configured (IM-09). No default evaluation model is chosen (SC-02).
 */
export function AddSkillDialog(props: AddSkillDialogProps) {
  if (!props.open) return null
  return <AddForm {...props} />
}

function AddForm({ open, onOpenChange, onConfigure, onAdded }: AddSkillDialogProps) {
  const db = useDb()
  const { run } = useActions()
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<Id | null>(null)
  const [tagIds, setTagIds] = React.useState<Id[]>([])
  const [configureNow, setConfigureNow] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [touched, setTouched] = React.useState(false)

  const valid = name.trim().length > 0
  const nameError = error ?? (touched && !valid ? a.nameRequired : null)

  const submit = () => {
    setTouched(true)
    if (!valid) return
    const r = run((d, ctx) => createSkill(d, { name, description, categoryId, tagIds }, ctx))
    if (!r.ok) {
      setError(r.error.code === "duplicate" ? a.duplicate : a.failed)
      return
    }
    onOpenChange(false)
    if (configureNow) onConfigure(r.value.skillId)
    else onAdded?.(r.value.skillId, name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" aria-describedby="add-skill-subtitle">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{a.title}</DialogTitle>
          <DialogDescription id="add-skill-subtitle">{a.subtitle}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Field>
            <FieldLabel htmlFor="add-skill-name">{a.name} *</FieldLabel>
            <Input
              id="add-skill-name"
              value={name}
              placeholder={a.namePlaceholder}
              aria-required="true"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "add-skill-name-err" : undefined}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              onBlur={() => setTouched(true)}
            />
            {nameError ? <FieldError id="add-skill-name-err" role={undefined}>{nameError}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="add-skill-description">{a.description}</FieldLabel>
            <Textarea id="add-skill-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="add-skill-category">{a.category}</FieldLabel>
              <Select value={categoryId ?? NONE} onValueChange={(v) => setCategoryId(v === NONE ? null : v)}>
                <SelectTrigger id="add-skill-category" aria-label={a.category}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{a.noCategory}</SelectItem>
                  {db.categories
                    .filter((c) => c.active)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FieldDescription>{a.optional}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel id="add-skill-tags">{a.tags}</FieldLabel>
              <TagChips tags={db.tags} value={tagIds} onChange={setTagIds} labelledBy="add-skill-tags" />
              <FieldDescription>{a.optional}</FieldDescription>
            </Field>
          </div>
          <div className="flex items-start gap-2 border-t border-border pt-4">
            <Checkbox id="add-skill-configure" checked={configureNow} onCheckedChange={(v) => setConfigureNow(v === true)} aria-describedby="add-skill-configure-help" className="mt-0.5" />
            <div className="flex flex-col">
              <FieldLabel htmlFor="add-skill-configure" className="font-normal">
                {a.configureNow}
              </FieldLabel>
              <span id="add-skill-configure-help" className="text-xs text-muted-foreground">
                {a.configureNowHelp}
              </span>
            </div>
          </div>
          <DialogFooter className="-mx-4 -mb-4">
            <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>
              {a.cancel}
            </Button>
            <Button type="submit" variant="default" size="default" disabled={!valid}>
              <i className="fa-light fa-check" aria-hidden="true" />
              {configureNow ? a.submitConfigure : a.submitLibrary}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
