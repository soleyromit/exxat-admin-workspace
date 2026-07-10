# Job: Focus workflow & exam lock

**Pattern:** [`focus-workflow-pattern.md`](../focus-workflow-pattern.md). **Wizard:** [`wizard-pattern.md`](../wizard-pattern.md). **Rules:** `.cursor/rules/exxat-focus-workflow.mdc`, `.cursor/rules/exxat-wizard.mdc`.

---

## Job-to-be-done

Let a user **complete one primary task without hub distraction** — compose a record, run a timed assessment, or finish a wizard — with clear progress, keyboard submit, and minimal chrome.

---

## Variants

| Variant | User | Template | Route suffix |
|---------|------|----------|--------------|
| **Focus workflow** | Author / coordinator | `FocusWorkflowTemplate` | `/library/new`, `/focus-workflow` |
| **Exam lock** | Learner in delivery | `ExamLockTemplate` | `/exam-lock` |

---

## IA checklist

- [ ] One H1 (exam title in lock header, or `PageHeader` in focus template)
- [ ] One primary action (Submit / Create) — filled button only
- [ ] Progress visible without scroll (exam: header timer + card-top progress bar)
- [ ] Empty / error / loading for async question load
- [ ] Post-submit confirmation (exam: `submitted` screen — no navigation chrome)

---

## Shell checklist

- [ ] Path registered in `lib/focus-workflow.ts` and/or `lib/exam-lock-shell.ts`
- [ ] Exam lock: `App.tsx` omits sidebar, ⌘K, Leo, banner
- [ ] Focus: sidebars hidden via `isSidebarHiddenPath` + `SidebarAutoCollapse`
- [ ] No `HubTable` / `ListPageTemplate` on exam delivery
- [ ] Workflow buttons: Enter + Esc kbd hints + `<Shortcut>` bindings

---

## Product context (brief lines)

```
Product: <exxat-prism | exxat-one-schools | …>
Scope: <school > program | brand > site > location>
Persona: <from personas.md — e.g. learner vs DCE coordinator>
```

Exam lock → learner persona. Focus create flows → coordinator / author.

---

## Reference

| Surface | File |
|---------|------|
| Exam demo | `components/exam-lock-showcase-client.tsx` |
| Focus demo | `components/focus-workflow-showcase-client.tsx` |
| Production wizard | `components/new-library-item-form.tsx` |
| Wizard primitive | `packages/ui/src/components/ui/wizard.tsx` — ≤6 top-level steps |

---

## Ship gate

- [ ] axe zero WCAG 2.x AA on focus `<main>`
- [ ] Timer / progress accessible (not color-only)
- [ ] Icon-only header tools: Case C (aria-label + tooltip)
- [ ] No toast on submit
