# Focus workflow & exam lock pattern

**Audience:** engineers + AI agents building distraction-free, route-owned task surfaces.

**Job doc:** [`jobs/focus-workflow.md`](./jobs/focus-workflow.md). **Rules:** `.cursor/rules/exxat-focus-workflow.mdc`, `.cursor/rules/exxat-wizard.mdc`.

---

## When to use

Use a **focus shell** when the user's primary job is a **single task** that should not compete with hub navigation, global search, or AI side panels:

| Surface | Examples | Template |
|---------|----------|----------|
| **Focus workflow** | Create question wizard, short compose flow | `FocusWorkflowTemplate` |
| **Exam lock** | Timed assessment delivery, proctored attempt | `ExamLockTemplate` |

Use a **normal hub** (`ListPageTemplate`) when the user compares, filters, or pivots across many records.

---

## Path registration

Product-agnostic suffixes live in:

- `apps/web/lib/focus-workflow.ts` — `FOCUS_WORKFLOW_PATH_SUFFIXES` (`/library/new`, `/focus-workflow`)
- `apps/web/lib/exam-lock-shell.ts` — `EXAM_LOCK_PATH_SUFFIXES` (`/exam-lock`)

Both strip the product prefix (`/prism`, `/design-os`, …) before matching.

```ts
isSidebarHiddenPath(pathname)  // focus + exam lock
isFocusWorkflowPath(pathname)  // focus only
isExamLockPath(pathname)       // exam lock only
```

---

## App shell wiring

### Focus workflow

- Primary + secondary sidebars hidden via `isSidebarHiddenPath` + `SidebarAutoCollapse`.
- `CommandMenu`, `SystemBannerSlot`, and Ask Leo **remain available** unless product explicitly hides them.

### Exam lock

`App.tsx` short-circuits when `isExamLockPath(pathname)`:

- Renders `<Outlet />` in a full-width `bg-sidebar` wrapper.
- **No** `AppSidebar`, `SecondaryPanel`, `CommandMenu`, `SystemBannerSlot`, or `AskLeoSidebar`.

---

## Layout anatomy

### Exam lock (`ExamLockTemplate`)

```
bg-sidebar p-2 (brand canvas, uniform gutter)
├── ExamLockAppHeader (transparent — title, tools, timer, avatar)
└── <main> inset card (rounded-xl bg-background shadow-sm)
    ├── progress bar (optional, flush top — variant="card-top")
    └── question body + nav
```

### Focus workflow (`FocusWorkflowTemplate`)

```
bg-sidebar (or page canvas per template)
└── centered column + PageHeader + workflow body
    └── optional Wizard (≤6 top-level steps — see wizard-pattern.md)
```

Reference: `components/focus-workflow-showcase-client.tsx`, `components/new-library-item-form.tsx`, `components/design-system/wizard-previews.tsx`.

### Multi-step create (`Wizard`)

Use the shared **`Wizard`** primitive for sequential chapters — **not** `Tabs`.

| Steps | Orientation | Notes |
|------:|-------------|-------|
| 3–4 | Horizontal `numbered` or `icons` | Ideal — full rail visible |
| 5–6 | Horizontal `compact` or vertical | Show `WizardStepGuidance` at 7+ |
| 7+ | Vertical rail or split routes | Catalog 8-step demo is overflow QA only |

Full policy: [`wizard-pattern.md`](./wizard-pattern.md).

---

## Keyboard & feedback

- Workflow primary action: **Enter** + inline `<Kbd variant="bare">⏎</Kbd>` + `<Shortcut keys="Enter" />`.
- Cancel/dismiss: **Esc** + inline `<Kbd>Esc</Kbd>`.
- **No toast** — use inline confirmation or blocking dialog on submit.

---

## MUST NOT

- Register exam-lock routes without updating `exam-lock-shell.ts` and `App.tsx`.
- Wrap exam content in `PrimaryPageTemplate` / `SidebarInset` (causes double margin + horizontal scroll).
- Use `HubTable` for question delivery — use `exam-lock/*` question renderers.

---

## Reference implementations

| File | Role |
|------|------|
| `components/exam-lock-showcase-client.tsx` | Design OS demo |
| `components/exam-lock/exam-lock-app-header.tsx` | Lock header |
| `components/templates/exam-lock-template.tsx` | Shell |
| `components/focus-workflow-showcase-client.tsx` | Focus demo |
| `components/templates/focus-workflow-template.tsx` | Focus shell |
| `components/new-library-item-form.tsx` | Production focus workflow |
