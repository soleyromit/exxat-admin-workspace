# Exxat DS — Wizard (sequential stepper)

**Audience:** engineers + AI agents. **Binding rule:** [`.cursor/rules/exxat-wizard.mdc`](../../.cursor/rules/exxat-wizard.mdc).

`Wizard` is a **sequential stepper** for linear or gated multi-step tasks. It is **not** `Tabs` — tabs switch peer views; wizards advance a single job with completion states.

**Job doc:** [`jobs/focus-workflow.md`](./jobs/focus-workflow.md). **Primitive:** `packages/ui/src/components/ui/wizard.tsx`.

---

## Step budget (UX policy)

| Top-level steps | Verdict | Pattern |
|----------------:|---------|---------|
| **3–4** | Ideal | Horizontal `numbered` or `icons` |
| **5–6** | Upper bound for horizontal rail | `compact` if labels are long |
| **7+** | Avoid in product | Group into fewer chapters, use **vertical** rail, or split into a **route** per chapter |

Constants exported from the primitive:

- `WIZARD_RECOMMENDED_MAX_STEPS = 6` — show `WizardStepGuidance` above this count; dev `console.warn` in non-production.
- `WIZARD_SCROLL_THRESHOLD = 5` — horizontal overflow + scroll controls; vertical rail gets `max-h-96` scroll.

**Rule of thumb:** If you cannot name each step in ≤3 words and users cannot predict what is left from the rail alone, you have too many top-level steps. Put sections **inside** `WizardPanel` instead.

---

## When to use

| Surface | Use |
|---------|-----|
| Short create flow (3–5 decisions) inside focus shell | `Wizard` + `FocusWorkflowTemplate` |
| Long but still one URL / one task | Vertical `Wizard` rail + sections per panel |
| Branching or save-draft-resume | Dedicated **route** per chapter (`focus-workflow` job) |
| Switching peer views on one record | **`Tabs`**, not `Wizard` |

**Modern analogues:** Stripe Connect onboarding (M4, M7); Linear project setup (M1, M4). **Principles:** P1, P2, P3, P5, P6, P13, P19.

---

## Primitives

| Export | Role |
|--------|------|
| `Wizard` | Context: `steps`, `current`, `orientation`, `variant`, `linear`, `onStepClick` |
| `WizardProgress` | `Step N of M` — `aria-live="polite"` |
| `WizardStepGuidance` | Note when `steps.length > 6` |
| `WizardNav` | Horizontal or vertical step rail |
| `WizardContent` | Panel column |
| `WizardStepHeading` | One H2 per panel (`id` matches step) |
| `WizardPanel` | Renders when `step` index/id is active |
| `WizardFooter` | Back / Next / Submit row |

**Variants:** `numbered` · `icons` · `compact` (not tabs).

**Orientations:** `horizontal` (default) · `vertical` (sidebar rail).

---

## Horizontal overflow

When the step rail overflows (`steps.length > WIZARD_SCROLL_THRESHOLD` or narrow viewport):

1. Compose **`HorizontalScrollControls`** (`layout="group"`, `ariaLabel="Wizard steps"`) — see [`horizontal-scroll-pattern.md`](./horizontal-scroll-pattern.md).
2. **Auto-scroll** the active step into view (`useHorizontalScrollItemIntoView`).
3. Do **not** rely on touch/trackpad scroll alone — keyboard users need prev/next buttons.

---

## State colors

| State | Chrome |
|-------|--------|
| Completed | `bg-brand` + `fa-solid fa-check` |
| Current | `border-brand` + `bg-brand-tint-subtle` |
| Upcoming / disabled | muted border + fill |
| Error (current step) | `border-destructive` |

Minimum visible type: **`text-sm` (12px)** on labels and progress.

---

## Accessibility

- Step list: `<ol>` / `<li>` only; connectors inside items.
- Current step: `aria-current="step"` on marker.
- Linear gating: `aria-disabled` on future steps.
- Completed steps clickable only when `onStepClick` is set.
- One H1 on the page (focus template); panel title = `WizardStepHeading` (H2).
- Footer: `Kbd variant="bare"` on primary/secondary per `exxat-kbd-shortcuts.mdc`.

---

## Composition example

```tsx
<Wizard
  steps={steps}
  current={step}
  variant="numbered"
  orientation="horizontal"
  linear
  onStepClick={setStep}
>
  <WizardProgress />
  {steps.length > WIZARD_RECOMMENDED_MAX_STEPS ? <WizardStepGuidance /> : null}
  <WizardNav />
  <WizardContent>
    {steps.map((s, i) => (
      <WizardPanel key={s.id} step={i}>
        <WizardStepHeading id={s.id}>{s.label}</WizardStepHeading>
        {/* sections inside panel — not more top-level steps */}
      </WizardPanel>
    ))}
  </WizardContent>
  <WizardFooter onBack={back} onNext={next} onSubmit={submit} submitLabel="Create" />
</Wizard>
```

---

## Catalog note

The **8-step** design-system preview is an **overflow stress test** only. Do not ship eight top-level chapters in production without grouping or vertical/routing split.

---

## See also

- [`focus-workflow-pattern.md`](./focus-workflow-pattern.md)
- [`horizontal-scroll-pattern.md`](./horizontal-scroll-pattern.md)
- [`drawer-vs-dialog-pattern.md`](./drawer-vs-dialog-pattern.md) — >3 steps often belongs on a route
- `components/new-library-item-form.tsx` — production focus wizard reference
