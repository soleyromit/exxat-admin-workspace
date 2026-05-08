# Field Validation

**Question answered:** When and how should a form field show validation errors?

**Pattern ID:** `FORMS-001`
**Binds rules:** A11Y-001, CONTENT-003, DS-001

---

## When to use

Any form with structured fields (3+ fields, single submit). Use DS `Field` + `FieldGroup` + `FieldError` + react-hook-form.

## Validation timing

| Trigger | Validates | Display |
|---|---|---|
| First touch (focus) | Nothing — never validate before user has typed |
| First blur (after edit) | Format (email, phone, regex) + required (if user left it empty after touching) | `FieldError` below the field |
| Submit | Everything — required, format, async server constraints | `FieldError` per field + `LocalBanner` at top if cross-field |
| Async (uniqueness, server check) | After client-side passes | Spinner inside field; result as `FieldError` |

**Never** validate on every keystroke. Reading + thinking is interrupted.

## Anatomy

```
Course title *
[ Pharmacology I  ]
                                   ← Field renders Label + Input + Description + Error

Term *
[ Spring 2026  ]
└─ Required                        ← FieldError appears below after blur

Description
[                                ]
└─ Tell faculty what this course covers
                                   ← FieldDescription always visible
```

## DS API binding

```tsx
import {
  Field, FieldLabel, FieldDescription, FieldError,
  FieldGroup,
} from '@exxat/ds/packages/ui/src'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
```

## Code recipe — admin profile

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Field, FieldLabel, FieldDescription, FieldError, FieldGroup,
  Input, Button,
} from '@exxat/ds/packages/ui/src'

const Schema = z.object({
  title: z.string().min(3, 'At least 3 characters'),
  termId: z.string().min(1, 'Required'),
  description: z.string().max(500, 'Max 500 characters').optional(),
})
type FormData = z.infer<typeof Schema>

export function CourseOfferingForm({ onSubmit }: { onSubmit: (d: FormData) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    mode: 'onBlur',  // validates on blur after first edit
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field orientation="vertical">
          <FieldLabel htmlFor="title">Course title *</FieldLabel>
          <Input id="title" {...register('title')} aria-required="true" />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field orientation="vertical">
          <FieldLabel htmlFor="termId">Term *</FieldLabel>
          <Input id="termId" {...register('termId')} aria-required="true" />
          <FieldError errors={[errors.termId]} />
        </Field>

        <Field orientation="vertical">
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <FieldDescription>
            Tell faculty what this course covers. 500 chars max.
          </FieldDescription>
          <Input id="description" {...register('description')} />
          <FieldError errors={[errors.description]} />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Create course offering'}
        </Button>
      </FieldGroup>
    </form>
  )
}
```

## Async validation

```tsx
const { register, formState, setError, clearErrors } = useForm<FormData>({
  resolver: zodResolver(Schema),
  mode: 'onBlur',
})

async function onTitleBlur(value: string) {
  if (!value) return
  clearErrors('title')
  const exists = await checkTitleExists(value)
  if (exists) {
    setError('title', { type: 'async', message: 'A course with this title already exists' })
  }
}
```

## Cross-field validation

If two fields together violate a rule (e.g., end date before start date), show a `LocalBanner` at the top of the form section, not on either field.

```tsx
{errors.root?.message && (
  <LocalBanner variant="destructive">{errors.root.message}</LocalBanner>
)}
```

## A11y notes

- Every field has `<FieldLabel htmlFor>`
- Required fields use BOTH `aria-required="true"` AND visible `*` (color is not the only encoding)
- `FieldError` associates via `aria-describedby` (DS handles this)
- Submit failures move focus to the first invalid field
- Async validation: spinner inside field has `aria-label="Checking…"`

## Code recipe — student profile

```tsx
import { Field, FieldLabel, FieldDescription, FieldError } from '@exxat/student/components/ui/field'
import { Input } from '@exxat/student/components/ui/input'
import { Button } from '@exxat/student/components/ui/button'
```

Touch-target adjustments (A11Y-005): Inputs default to 44px height in studentUX; no override needed.

## Anti-patterns

- ❌ Validate on every keystroke — interrupts typing
- ❌ Show all errors only on submit if form is long — let blur surface them progressively
- ❌ Disabled submit button without explaining why — show what's missing
- ❌ Use raw `<button type="submit">` — DS-001 violation
- ❌ Use placeholder as the only label — disappears on input
- ❌ Toast notification on submit failure — use `LocalBanner` instead (DS-005)
