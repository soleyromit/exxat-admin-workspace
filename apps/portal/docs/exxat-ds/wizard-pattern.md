# Exxat DS — Wizard (sequential stepper)

**Audience:** humans + AI agents. **Binding rule:** `.cursor/rules/exxat-wizard.mdc` (synced by `exxat-ui sync-extras`).

`Wizard` is a **sequential stepper** for linear or gated multi-step tasks. It is **not** `Tabs`.

**Step budget:** prefer ≤6 top-level steps (`WIZARD_RECOMMENDED_MAX_STEPS`). The 8-step catalog demo is an overflow stress test only.

Full narrative in the workspace: `apps/web/docs/wizard-pattern.md`.
