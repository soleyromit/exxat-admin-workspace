"use client"

/**
 * Add a skill, option set 2 "One page": an inline row at the end of a category in the library tree. The category is
 * where the row sits and can be changed; tags can be picked or created on the same row (REQ SL-03, SL-04, SL-05; decision
 * D-X28). Category and tags stay set for the next name, so a run of skills shares them. Enter adds and keeps the row open;
 * Escape closes (with a guard when a name is typed). Required to graduate is set later from the skill's panel; the
 * evaluation model on Configure. Same name validation as the sheet (duplicates, length).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { TableCell, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { EMPTY_DRAFT, NO_CATEGORY, validateDraft, type SkillDraft } from "@/lib/lab/library"
import { aNoun, skillNoun } from "@/lib/lab/terms"
import { CategoryPicker, TagsPicker } from "./category-tag-pickers"

/** The quiet row that opens the inline add for one category. */
export function InlineAddTrigger({ category, colSpan, onOpen }: { category: string; colSpan: number; onOpen: () => void }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="ps-7 py-1">
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onOpen}>
          {category === NO_CATEGORY ? `Add ${aNoun()}` : `Add ${aNoun()} to ${category}`}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function InlineAddRow({ category, colSpan, names, options, onAdd, onClose }: {
  category: string
  colSpan: number
  names: readonly string[]
  /** The program's own categories and tags (pickerOptions over the live library). */
  options: { sections: readonly string[]; tags: readonly string[] }
  onAdd: (d: SkillDraft) => void
  onClose: () => void
}) {
  const [name, setName] = React.useState("")
  const [section, setSection] = React.useState(category === NO_CATEGORY ? "" : category)
  const [tags, setTags] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | undefined>()
  const [added, setAdded] = React.useState(0)
  const [guard, setGuard] = React.useState(false)
  const ref = React.useRef<HTMLInputElement>(null)
  const id = React.useId()
  const submit = () => {
    const e = validateDraft({ ...EMPTY_DRAFT, name }, names).name
    setError(e)
    if (e) return ref.current?.focus()
    onAdd({ ...EMPTY_DRAFT, name, section, tags })
    setName("")
    setAdded((n) => n + 1)
    ref.current?.focus()
  }
  const close = () => (name.trim() ? setGuard(true) : onClose())
  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30" data-inline-add>
      <TableCell colSpan={colSpan} className="ps-8 py-2">
        <form
          noValidate
          aria-label={`Add ${aNoun()} to ${category}`}
          className="flex flex-wrap items-end gap-x-3 gap-y-2"
          onSubmit={(e) => { e.preventDefault(); submit() }}
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); close() } }}
        >
          {/* Three labelled fields, so Category (one, a select) and Tags (many, a tag input) read as two different things. */}
          <Field className="w-72 max-w-full gap-1" data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={`${id}-name`} className="text-xs">Name</FieldLabel>
            <Input
              ref={ref}
              id={`${id}-name`}
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(undefined) }}
              placeholder={`${skillNoun().charAt(0).toUpperCase()}${skillNoun().slice(1)} name`}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? `${id}-error` : `${id}-help`}
            />
            {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
          </Field>
          <Field className="w-48 gap-1">
            <FieldLabel id={`${id}-cat-label`} htmlFor={`${id}-cat`} className="text-xs">Category</FieldLabel>
            <CategoryPicker id={`${id}-cat`} labelId={`${id}-cat-label`} value={section} options={options.sections} onChange={setSection} size="sm" className="w-full" />
          </Field>
          <Field className="w-72 max-w-full gap-1">
            <FieldLabel id={`${id}-tags-label`} htmlFor={`${id}-tags`} className="text-xs">Tags</FieldLabel>
            <TagsPicker id={`${id}-tags`} labelId={`${id}-tags-label`} value={tags} options={options.tags} onChange={setTags} size="sm" />
          </Field>
          <Button type="submit" variant="default" size="sm">Add</Button>
          <Button type="button" variant="ghost" size="sm" onClick={close}>Done</Button>
          <p id={`${id}-help`} className="basis-full text-xs text-muted-foreground" aria-live="polite">
            {added ? `${added} added. Type the next name, or press Escape.` : "Enter adds it. Escape closes."}
          </p>
        </form>
        <AlertDialog open={guard} onOpenChange={setGuard}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{`Discard the ${skillNoun()} you started?`}</AlertDialogTitle>
              <AlertDialogDescription>{`${name.trim()} has not been added.`}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline" size="sm">Keep editing</AlertDialogCancel>
              <AlertDialogAction variant="default" size="sm" onClick={() => { setGuard(false); onClose() }}>Discard</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}
