# Exxat DS: Toggle Switch pattern

**Audience:** engineers + AI agents. **Binding rule:** [`.cursor/rules/exxat-accessibility.mdc`](../../.cursor/rules/exxat-accessibility.mdc).

`ToggleSwitch` is the binary on/off control for **settings rows** and immediate preferences. It uses `role="switch"` with brand on-state token (`--switch-on`).

**Job:** Flip a persistent boolean preference with clear on/off state and an associated label.

---

## When to use

| Scenario | Use ToggleSwitch | Use instead |
|----------|------------------|-------------|
| Settings row (notifications, feature flag) | ✓ | |
| Table inline boolean column | | `BooleanToggleCell` |
| Toolbar icon pressed state | | `Toggle` / `ToggleGroup` |
| One-shot submit action | | `Button` |
| Destructive enable/disable | | `Dialog` confirm first |

---

## MUST requirements

- **MUST** pair every switch with a visible `FieldLabel` via shared `id` / `htmlFor`.
- **MUST** use `Field` + `FieldGroup` on settings pages for row rhythm.
- **MUST** expose `role="switch"` and `aria-checked` (primitive default).
- **MUST NOT** use for destructive or irreversible actions without confirmation.
- **MUST NOT** use `Button` or icon `Toggle` for persistent on/off settings.

---

## Composition example

```tsx
<Field orientation="horizontal" className="w-full items-center justify-between gap-4">
  <FieldLabel htmlFor="notify-email" className="min-w-0 shrink-0 sm:min-w-[9rem]">
    Email alerts
  </FieldLabel>
  <ToggleSwitch
    id="notify-email"
    checked={email}
    onChange={setEmail}
  />
</Field>
```

---

## See also

- **Primitive:** [`packages/ui/src/components/ui/toggle-switch.tsx`](../../packages/ui/src/components/ui/toggle-switch.tsx)
- **Related:** `field`, `toggle`, `boolean-toggle-cell`, `button`
