"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import type { NewSkill } from "@/lib/v2/admin-actions"

export interface EditSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  initial: NewSkill
  /** Return an error message to keep the dialog open, or null when saved. */
  onSave: (values: NewSkill) => string | null
}

/** Name, category and description of one skill. Used for library skills and for proposed skills before they are created. */
export function EditSkillDialog(props: EditSkillDialogProps) {
  if (!props.open) return null
  return <EditSkillForm {...props} />
}

function EditSkillForm({ onOpenChange, title, description, initial, onSave }: EditSkillDialogProps) {
  const [values, setValues] = React.useState<NewSkill>(initial)
  const [error, setError] = React.useState<string | null>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = onSave(values)
    if (err) setError(err)
    else onOpenChange(false)
  }
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="edit-skill-name">Skill name</FieldLabel>
            <Input
              id="edit-skill-name"
              value={values.name}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "edit-skill-error" : undefined}
              onChange={(e) => {
                setValues({ ...values, name: e.target.value })
                setError(null)
              }}
            />
            {error ? <FieldError id="edit-skill-error" errors={[{ message: error }]} /> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-skill-category">Category</FieldLabel>
            <Input id="edit-skill-category" value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })} />
            <FieldDescription>Optional. Leave empty for no category.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-skill-description">Description</FieldLabel>
            <Textarea id="edit-skill-description" rows={3} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="default">
              Save skill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
