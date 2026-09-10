---
description: Exxat DS — sequential Wizard stepper (not Tabs); step budget, scroll, and focus-workflow pairing
activation: glob
globs: {components,lib,src,packages}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-wizard.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — Wizard

**Authoritative narrative:** `docs/exxat-ds/wizard-pattern.md` (workspace: `docs/exxat-ds/wizard-pattern.md`).

## MUST

1. **Use `Wizard` for sequential multi-step jobs** — numbered/icons/compact variants; horizontal or vertical orientation. Import `@exxatdesignux/ui/components/wizard` or `@/components/ui/wizard`.
2. **Prefer ≤6 top-level steps** — `WIZARD_RECOMMENDED_MAX_STEPS`. For 6–8 named chapters, regroup first and use a vertical rail only when every chapter must remain visible. At 9+, split independent jobs into routes and support save-draft-resume.
3. **Not interchangeable with Tabs** — wizards have completed/current/upcoming states and linear gating; tabs switch peer views on one record.
4. **Horizontal overflow** — when the step rail overflows, compose `HorizontalScrollControls` + `useHorizontalScrollItemIntoView` (see `exxat-horizontal-scroll.md`). Active step MUST scroll into view.
5. **Focus workflow pairing** — production wizards on create routes use `FocusWorkflowTemplate` / hidden sidebars (`exxat-focus-workflow.md`), one H1, one primary footer action.
6. **Brand step states** — completed `bg-brand` + check; current `bg-brand-tint-subtle`; min `text-sm` labels.
7. **Panel headings** — `WizardStepHeading` (H2) per active panel; page keeps single H1.

## MUST NOT

- Add a fourth “tabs” variant to `Wizard` — use `Tabs` for non-sequential view switching.
- Ship 7+ top-level steps without IA review. Carbon, PatternFly, and SAP Fiori all treat progress indicators as orientation and disclosure tools, not permission to expose an arbitrarily long horizontal rail.
- Use horizontal orientation for 8+ product steps. The catalog horizontal example is an overflow stress test only.
- Hide horizontal overflow without keyboard-accessible prev/next controls.
- Use toast on step advance — inline validation + `error` on step object.
- Pixel-copy legacy stepper chrome from screenshots — map IA only (`exxat-no-image-pixel-copy.md`).

## Reference files

- `packages/ui/src/components/ui/wizard.tsx`
- `docs/exxat-ds/wizard-pattern.md`
- `components/design-system/wizard-previews.tsx`
- `components/templates/new-focus-template.tsx`
- `components/new-library-item-form.tsx`

## See also

- **`exxat-focus-workflow.md`** — shell and chrome stripping
- **`exxat-horizontal-scroll.md`** — step rail overflow controls
- **`exxat-kbd-shortcuts.md`** — wizard footer chords
- **`exxat-drawer-vs-dialog.md`** — >3 steps often needs a route
