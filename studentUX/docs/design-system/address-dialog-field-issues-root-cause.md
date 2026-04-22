# Root Cause: Address Information Edit Dialog Field Styling Issues

## Symptoms

- **Light grey background** instead of white on Input and Select fields
- **Light grey border** instead of intended lighter border (≈ #90929A)

## Root Causes

### 1. Default Component Styling (Primary)

**Input** (`src/components/ui/input.tsx`):
- Uses `variant="default"` which applies `bg-input-background`
- `--input-background` = `oklch(0.97 0.002 270)` — light grey

**SelectTrigger** (`src/components/ui/select.tsx`):
- Uses `bg-input-background` in base classes
- Same light grey as Input

**Intended design** for profile dialog: white (`var(--background)` = `oklch(1 0 0)`).

---

### 2. CSS Override Unreliability (Secondary)

The `.profile-card-dialog-form` rules in `globals.css` (lines 157–171) were meant to override:

```css
.profile-card-dialog-form input[data-slot="input"],
.profile-card-dialog-form [data-slot="select-trigger"] {
  background-color: var(--background) !important;
  border-color: var(--border-control-3) !important;
  /* ... */
}
```

**Why this may not apply reliably:**

| Factor | Explanation |
|--------|--------------|
| **Radix Dialog Portal** | Dialog content is rendered via `createPortal` to `document.body`. The `.profile-card-dialog-form` class is on `DialogContent`, which wraps the form. Inputs are descendants, so the selector *should* match. |
| **CSS layer order** | Tailwind uses `@layer utilities`. Unlayered rules (like `.profile-card-dialog-form`) override layered rules. So the override should win. |
| **Selector specificity** | `.profile-card-dialog-form input[data-slot="input"]` has higher specificity than `.bg-input-background`. With `!important`, it should override. |
| **Possible edge case** | Build order, CSS purging, or a different DOM structure in some flows could prevent the override from applying. |

---

### 3. Class Merge Order (Mitigated by twMerge)

When `Input` receives `className={PROFILE_FIELD_CLASS}` where `PROFILE_FIELD_CLASS = "bg-background border-[var(--control-border)]"`:

- Input base includes `bg-input-background` (from `inputVariants.default`)
- `cn()` uses `twMerge`, which keeps the **last** conflicting utility
- `className` is passed last, so `bg-background` should override `bg-input-background`

So the explicit `className` approach is more reliable than relying on the CSS override.

---

### 4. Why Only This Dialog?

**ProfileCardDialog** is the only place in the app with editable form fields (Input, Select). Other dialogs:

- Profile settings modal: read-only display (`ReadOnlyField`)
- Apply job modal: card selection, not form inputs
- Build profile flow: uses ProfileCardDialog for editing

So the issue only appears in the Address (and other) edit dialogs opened from the profile card.

---

## Summary

| Root Cause | Impact |
|------------|--------|
| Input/Select use `bg-input-background` (grey) by default | Fields look grey instead of white |
| CSS override may not apply in all cases | Override is not guaranteed |
| No `variant` for “white background” in dialog context | Default variant always applies grey |

## Fix Applied

Apply `PROFILE_FIELD_CLASS = "bg-background border-[var(--control-border)]"` directly to every `Input` and `SelectTrigger` in the profile card dialog. This:

1. Overrides `bg-input-background` via `twMerge` (last class wins)
2. Does not depend on `.profile-card-dialog-form` CSS
3. Works regardless of portal or layer order

## Alternative Fix (Component-Level)

Add an `outline` variant to Input (already exists) and use it in the profile dialog:

```tsx
<Input variant="outline" ... />  // outline uses bg-background
```

Or add a `dialog` variant that uses `bg-background` for both Input and SelectTrigger.
