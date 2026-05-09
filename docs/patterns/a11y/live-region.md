# Live Region for Async Status

**Question answered:** How does a screen reader user know that something happened (banner appeared, save succeeded, validation failed) without losing focus?

**Pattern ID:** `A11Y-PATTERN-002`
**Binds rules:** A11Y-013; DS-005 (no toasts in product feedback); WCAG 4.1.3 Status Messages (Level AA)

## When to use

- Banner announcing save success / failure
- Inline validation message appearing after blur
- Async list updating with new items
- Real-time monitoring counts changing
- Anything that changes WITHOUT user-initiated focus change

## When NOT to use

- Modal/dialog content (already announced when focus enters)
- Visible page navigation (route change announces title)
- User-initiated changes that come with focus (clicking a tab; the new tab's content is announced via focus)

## The two intensities

| Use | `aria-live` value | Example |
|---|---|---|
| Non-blocking, informational | `polite` | "Saved 4 minutes ago", "3 new submissions arrived" |
| Blocking, requires attention | `assertive` | "Form submission failed: 3 fields invalid", "Connection lost — changes not saved" |

**Default to `polite`.** `assertive` interrupts the user's current focus reading; reserve for genuinely critical.

## Anatomy

```tsx
{/* Banner (DS LocalBanner / SystemBanner already includes role="status") */}
<LocalBanner role="status" aria-live="polite">
  Saved {formatRelative(savedAt)}
</LocalBanner>

{/* Critical error */}
<LocalBanner role="alert" aria-live="assertive">
  Connection lost — your last 3 edits were not saved.
</LocalBanner>

{/* Inline validation appearing on blur */}
<FieldError aria-live="polite" errors={[fieldError]} />

{/* Programmatic announcement (no visible UI) */}
<div role="status" aria-live="polite" className="sr-only">
  {announcement}
</div>
```

Tip: `<LocalBanner>` from `@exxat-ds/ui` defaults to `role="status"`. Verify via `ds-component-check`.

## Anti-patterns

- ❌ Toast / Sonner for product feedback (DS-005 ban; use banner)
- ❌ `aria-live="assertive"` on every announcement (interrupts the user constantly; reserve for critical)
- ❌ Announcing every keystroke or every count tick (noise; use `aria-atomic` to control granularity, or debounce)
- ❌ Multiple live regions announcing simultaneously (race condition; one region per concern)
- ❌ Live region added to DOM dynamically (some screen readers won't pick it up; render it always-present, fill content on event)

## Verification

1. NVDA (Windows): trigger the event → wait → screen reader speaks the new content
2. VoiceOver (Mac): same
3. Hide visible UI temporarily and confirm announcement still happens

## See also

- DESIGN.md A11Y-013, DS-005
- W3C WCAG 4.1.3: https://www.w3.org/WAI/WCAG21/Understanding/status-messages
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
