# PCE Admin — UI Consistency Spec

## Goal

Bring all 8 PCE admin pages into visual and structural alignment with the exam-management admin app (the reference standard). Both apps share the same DS but PCE was built independently and drifted on typography, spacing, theme, and token usage.

## Scope

All pages in `apps/pce/admin/app/(app)/`:

| Page | File |
|------|------|
| Layout | `app/layout.tsx` |
| Surveys list | `app/(app)/surveys/page.tsx` |
| Survey responses | `app/(app)/surveys/[id]/responses/page.tsx` |
| Templates list | `app/(app)/templates/page.tsx` |
| Template detail | `app/(app)/templates/[id]/page.tsx` |
| Moderation | `app/(app)/moderation/page.tsx` |
| Analytics | `app/(app)/analytics/page.tsx` |
| My Surveys list | `app/(app)/my-surveys/page.tsx` |
| Faculty results | `app/(app)/my-surveys/[id]/results/page.tsx` |

---

## Design Decisions

### 1. Theme: `theme-prism` → `theme-one`

PCE admin currently uses `theme-prism` (Exxat Prism Rose). It should use `theme-one` (Exxat One Lavender) — the same as exam-management. One change in `app/layout.tsx`.

### 2. Page H1 Typography

**Before:** `className="text-sm font-semibold"` — 14px Inter bold, looks like a breadcrumb label.

**After:** `style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}` — Ivypresto 22px regular, matches exam-management page titles exactly.

Applied to every page's `<h1>` (or the element serving as the page title).

### 3. Header + Content Spacing

**Before:** `className="px-4 py-3"` header, `className="p-4"` or `className="p-6"` content.

**After:**
- Page header: `style={{ padding: '18px 28px 14px' }}`
- Page content area: `style={{ padding: '0 28px 28px' }}` (or `className="flex-1 overflow-auto"` with inner padding `0 28px 28px`)

Applied to every page's `<header>` and `<main>`.

### 4. Cell Typography

**Before:** `className="text-sm"` (14px) everywhere, including table cells.

**After:**
- Primary cell content (course code, name, key data): `style={{ fontSize: 13, fontWeight: 500 }}`
- Secondary/subtitle cell content: `style={{ fontSize: 11, color: 'var(--muted-foreground)' }}`
- Numerical values (rates, scores): `style={{ fontSize: 13, fontWeight: 600 }}`

### 5. Table Presentation

Keep the existing `<div className="border border-border rounded-lg overflow-hidden">` wrapper around all `<Table>` components. No structural change to table containers.

---

## Per-Page Bug Fixes

On top of the uniform typography/spacing/theme pass, three pages have additional DS violations:

### moderation/page.tsx — AvatarFallback token

**Line ~167:** `<AvatarFallback className="text-xs bg-primary text-primary-foreground">`

**Fix:** `<AvatarFallback style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', fontSize: 11 }}>`

The `bg-primary` class hardcodes the dark primary color. The DS token `--avatar-initials-bg` correctly resolves to a light brand-tinted surface on `theme-one`.

### analytics/page.tsx — Product token names

**Lines ~21, ~30, ~140, ~141:** Uses `var(--pce-rate-bar-track)` and `var(--pce-rate-bar-fill)` — product-local tokens that aren't defined anywhere.

**Fix:**
- `var(--pce-rate-bar-track)` → `var(--muted)`
- `var(--pce-rate-bar-fill)` → `var(--brand-color)`

### my-surveys/page.tsx — Wrong subtitle field

**Line ~82:** Table row subtitle shows `survey.term` (e.g. "Spring 2026") — same as what the term filter already shows. Should show the course name.

**Fix:** `survey.term` → `survey.courseName`

---

## What Does NOT Change

- All DS component usage (Button, Badge, InputGroup, Collapsible, etc.) — already fixed in previous session
- Sentiment group logic in `my-surveys/[id]/results/page.tsx` — already correct
- Status-group collapsible UX in `surveys/page.tsx` — already correct
- Mock data and state — no changes
- Student app files — out of scope

---

## Reference: exam-management Patterns

```tsx
// Page header (from courses-client.tsx)
<header style={{ padding: '18px 28px 14px', borderBottom: '1px solid var(--border)' }}>
  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Courses</h1>
</header>

// Primary cell
<span style={{ fontSize: 13, fontWeight: 500 }}>{courseCode}</span>

// Secondary/subtitle cell
<span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{courseName}</span>

// Avatar
<AvatarFallback style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', fontSize: 11 }}>
  {initials}
</AvatarFallback>
```
