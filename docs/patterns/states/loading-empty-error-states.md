# Loading / Empty / Error States

**Question answered:** Why is this surface not showing populated content?

**Pattern ID:** `STATES-001`
**Binds rules:** CONTENT-002, CONTENT-003, DS-005, A11Y-002

---

## When to use

Every data-bearing surface has these three states. There is no exception.

## Anatomy

```
┌─ Card / Section ────────────────────────────┐
│  Header (always visible)                    │
│  ────────────────────────                   │
│  ▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢      │  ← Loading: skeleton matches final layout
│  ▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢▢                  │
│                                             │
│  ─ OR ─                                     │
│                                             │
│  📄 No assessments yet                      │  ← Empty: propose action
│  Build your first from this course's        │
│  question bank.                             │
│                       [ New assessment → ]  │
│                                             │
│  ─ OR ─                                     │
│                                             │
│  ⚠ Couldn't load assessments                │  ← Error: explain + retry
│  The server returned 503. Your data is      │
│  safe — try refreshing in a minute.         │
│                              [ Retry ]      │
└─────────────────────────────────────────────┘
```

## Per-state spec

### Loading

| Element | Spec |
|---|---|
| Component | Skeleton (DS `Skeleton`) sized to match final layout |
| Animation | Subtle pulse (DS default) — no spinning gears |
| Duration assumption | Skeleton must remain visible if data takes >150ms; otherwise skip skeleton (no flash) |
| Layout | MUST match final populated layout's dimensions and shape |

### Empty

| Element | Spec |
|---|---|
| Component | Inline message centered in the surface |
| Tone | Propose-action, not "no data" (CONTENT-002) |
| Icon (optional) | Small, muted (DS `text-muted-foreground`); never a sad-face emoji or warning |
| CTA | DS `Button variant="outline" size="sm"`, primary action — what should the user do? |
| Multi-line | Headline + 1-line explanation + CTA. No more |

### Error

| Element | Spec |
|---|---|
| Component | DS `LocalBanner` or inline message at the top of the surface |
| Tone | Explain what happened, why, what to do (CONTENT-003) |
| Detail | Show server status / error code in collapsed `<details>` if useful for support |
| CTA | "Retry" button — DS `Button variant="outline" size="sm"` |
| Toast? | NEVER. DS-005 violation. Banners only |

## A11y notes

- Loading skeleton: `aria-busy="true"` on the wrapping container; `aria-live="polite"` to announce when content loads
- Empty: text is real text (not background image); CTA has `aria-label` if icon-only
- Error: `role="alert"` on the banner so screen readers announce; focus moves to retry button on first error

## Code recipe — admin profile

```tsx
'use client'
import { Skeleton, Button, LocalBanner } from '@exxat/ds/packages/ui/src'

type Props<T> = {
  isLoading: boolean
  error: Error | null
  data: T[] | null
  onRetry: () => void
  emptyHeadline: string
  emptyMessage: string
  emptyAction: { label: string; onClick: () => void }
  children: (data: T[]) => React.ReactNode
}

export function StatefulSurface<T>({
  isLoading, error, data, onRetry,
  emptyHeadline, emptyMessage, emptyAction,
  children,
}: Props<T>) {
  if (isLoading) {
    return (
      <div aria-busy="true" className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <LocalBanner variant="destructive" role="alert">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">Couldn't load this section</p>
            <p className="text-sm text-muted-foreground">
              {error.message || 'The server returned an error. Your data is safe.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
        </div>
      </LocalBanner>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium text-foreground">{emptyHeadline}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{emptyMessage}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={emptyAction.onClick}>
          {emptyAction.label}
        </Button>
      </div>
    )
  }

  return <>{children(data)}</>
}
```

## Code recipe — student profile

Swap to per-file imports:

```tsx
import { Skeleton } from '@exxat/student/components/ui/skeleton'
import { Button } from '@exxat/student/components/ui/button'
// LocalBanner equivalent in student: use Alert
import { Alert, AlertDescription } from '@exxat/student/components/ui/alert'
```

Touch-target adjustments (A11Y-005): Button `size="default"` (not `sm`) to hit 44px on mobile.

## Anti-patterns

- ❌ Spinner over a blank rectangle (use skeleton matching final layout)
- ❌ "No data" / "Nothing to show" / "Empty" — CONTENT-002 violation
- ❌ Toast for load-failed — DS-005 violation
- ❌ Hiding the surface entirely while loading — user loses spatial context
- ❌ Generic "Try again" CTA — must say what failed
- ❌ Empty state without a CTA — every empty state must propose action
