# Form Error Identification + Announcement

**Question answered:** When form submission fails, how does a screen reader user discover (a) that submission failed, (b) which fields, and (c) what to fix?

**Pattern ID:** `A11Y-PATTERN-004`
**Binds rules:** A11Y-011 (form labels), A11Y-013 (live regions for status), CONTENT-003 (error messages explain); WCAG 3.3.1 Error Identification, 3.3.3 Error Suggestion (AA), 4.1.2 Name/Role/Value

## The complete pattern

Three layers, all required:

1. **Field-level**: each invalid field has `aria-invalid="true"` + `aria-describedby` pointing to its error message
2. **Summary-level**: top-of-form summary appears in an `aria-live` region listing all failures
3. **Focus-level**: focus moves to the first invalid field on submit failure (or the summary, if multi-error)

## Anatomy (DS-correct)

```tsx
import { Field, FieldLabel, FieldDescription, FieldError } from '@exxat/ds/packages/ui/src'

<Field orientation="vertical">
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <FieldDescription id="email-hint">
    We'll only use this for password reset.
  </FieldDescription>
  <Input
    id="email"
    type="email"
    aria-invalid={!!errors.email}
    aria-describedby={`email-hint ${errors.email ? 'email-error' : ''}`.trim()}
    {...register('email')}
  />
  {errors.email && (
    <FieldError id="email-error" errors={[errors.email]} />
  )}
</Field>

{/* Summary banner (only on submit failure) */}
{submitFailed && Object.keys(errors).length > 0 && (
  <LocalBanner role="alert" aria-live="assertive" className="mb-4">
    <p className="font-medium">Cannot submit form — fix these fields:</p>
    <ul className="list-disc ms-5 mt-1">
      {Object.entries(errors).map(([field, error]) => (
        <li key={field}>
          <a href={`#${field}`} className="underline">
            {fieldLabels[field]}: {error.message}
          </a>
        </li>
      ))}
    </ul>
  </LocalBanner>
)}
```

After submit failure:
```tsx
// Move focus to summary OR first invalid field
const firstInvalidField = Object.keys(errors)[0]
document.getElementById(firstInvalidField)?.focus()
```

## Why each layer

- `aria-invalid` — surfaced by screen readers as "invalid entry"
- `aria-describedby` — links the input to its hint AND its error so both are announced
- Summary banner — gives the BIG picture for forms with many errors
- Focus move — saves the user from hunting for the error

## Anti-patterns

- ❌ Toast for form errors (DS-005 ban; use banner)
- ❌ Error message only in red text without `aria-invalid` / `aria-describedby` (color-only encoding; A11Y-008 violation)
- ❌ "Please check the form" (no specifics — CONTENT-003 violation)
- ❌ Errors clear on next keystroke without `aria-live` update (announcement disappears)
- ❌ No focus move on submit failure (user has to hunt visually)
- ❌ `aria-invalid="true"` always (lying about state)
- ❌ Multiple `<FieldError>` components for one field (consolidate)

## DS `<FieldError>` defaults

The `FieldError` component from `@exxat/ds/packages/ui/src` already:
- Renders to inline error text styled with `--destructive`
- Accepts `errors` array compatible with react-hook-form

What it does NOT do automatically:
- Set `aria-invalid` on the related input — you do this on the `<Input>` yourself
- Wire `aria-describedby` — you do this with a unique `id` on the `<FieldError>`
- Move focus on submit fail — you do this in the submit handler

## Verification

1. Submit empty/invalid form → focus moves to first error or summary
2. NVDA / VoiceOver: announces "invalid entry" + the error message + the hint
3. Tab through invalid fields → each announces its error in turn
4. Fix a field → on next submit, only remaining errors announce

## See also

- DESIGN.md A11Y-011, A11Y-013, CONTENT-003
- W3C WCAG 3.3.1: https://www.w3.org/WAI/WCAG21/Understanding/error-identification
- W3C WCAG 3.3.3: https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion
