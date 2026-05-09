# Form Pattern Rubric

> Required reading before designing any input surface.
> Binds DESIGN.md rules CONTENT-003 (errors explain), A11Y-001 (icon-only requires aria-label), A11Y-006 (DialogTitle required), DS-001 (use DS Button).

---

## The five form shapes

| Shape | When | Pattern |
|---|---|---|
| **Inline single field** | One value to capture (search, filter, quick edit) | DS `Input` + `Label` |
| **Standard form** | 3–10 fields, single screen, single submit | DS `Field` + `FieldGroup` + react-hook-form |
| **Multi-step (wizard)** | Multi-page flow; user benefits from chunking | (P4) `multi-step-wizard.md` |
| **Inline edit** | Edit one row of a table without leaving the table | (P4) `inline-table-edit.md` |
| **Bulk action form** | Apply changes to N selected items | DS `FloatingActionBar` + confirmation Dialog |

---

## Validation rules

| Type | Where | Display |
|---|---|---|
| Required field | Client-side, on submit (NOT on first-touch) | DS `FieldError` below the field |
| Format (email, phone) | Client-side, on blur after first edit | DS `FieldError` below the field |
| Async (uniqueness, server constraint) | After client-side passes | DS `FieldError` + Banner if scope is the whole form |
| Cross-field | After all touched | Banner at top of form section |

**Per A11Y rules:**
- Every field has a `<Label>` (visible or `sr-only`).
- Errors associate via `aria-describedby` (DS `FieldError` does this automatically).
- Required fields use `aria-required="true"` AND visual indicator.

## Decision flow

```
What is the user doing?
├─ One value, no submit ceremony       → inline single field
├─ 3–10 fields, single screen          → standard form (Field + FieldGroup)
├─ Many fields, paged for cognitive load → multi-step wizard (P4)
├─ Edit one row of a table             → inline table edit (P4)
├─ Apply same change to N items        → bulk action form (FloatingActionBar)
└─ User must confirm a destructive action → Dialog with explicit destructive Button
```

---

## Anti-patterns

- ❌ Validate on first keystroke — interrupts thought
- ❌ Show all errors only on submit if the form is long — let blur-validation surface them as the user moves
- ❌ Use raw `<button>` for submit — DS-001 violation; use DS `Button type="submit"`
- ❌ Use `<input>` without a `<Label>` — A11Y violation
- ❌ Use placeholder as the only label — disappears on input
- ❌ Disabled submit button without explaining what's needed — show inline list of remaining fields

## Pattern catalogue (this folder)

P3 (this round):
- `field-validation.md` — DS Field + FieldError + react-hook-form integration

P4+ (later): `multi-step-wizard.md`, `inline-table-edit.md`, `bulk-action-form.md`, `autosave.md`
