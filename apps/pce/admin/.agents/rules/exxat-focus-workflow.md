---
description: Focus workflow and exam lock shells — no workspace chrome, route-owned templates
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-focus-workflow.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — focus workflow & exam lock shells

**Job doc:** `docs/exxat-ds/jobs/focus-workflow.md`. **Pattern:** `docs/exxat-ds/focus-workflow-pattern.md`.

## Two shell variants

| Variant | Template | Chrome hidden | Typical job |
|---------|----------|---------------|-------------|
| **Focus workflow** | `FocusWorkflowTemplate` | Primary + secondary sidebar | Create wizard, single-task compose (`/library/new`, `/focus-workflow`) |
| **Exam lock** | `ExamLockTemplate` | Full app chrome (sidebar, Leo, ⌘K, banner) | Timed assessment delivery (`/exam-lock`) |

## MUST

1. **Register paths** in `lib/focus-workflow.ts` and/or `lib/exam-lock-shell.ts` — product-agnostic suffixes; strip product prefix before match.
2. **`App.tsx` branch** — exam lock renders `<Outlet />` only (no `AppSidebar`, `CommandMenu`, `AskLeoSidebar`, `SystemBannerSlot`). Focus workflows use normal shell minus sidebars via `isSidebarHiddenPath` + `SidebarAutoCollapse`.
3. **One H1** — exam title in `ExamLockAppHeader`; focus workflow title in `PageHeader` inside template.
4. **Route-owned layout** — templates own canvas + card; do not fork `PrimaryPageTemplate` / `SidebarInset` for lock surfaces.
5. **Keyboard** — workflow Submit = Enter + inline `Kbd`; Cancel = Esc; pair with `<Shortcut>`.
6. **No toast** — submit confirmation inline or blocking dialog.
7. **Action pairs** — secondary **ghost** (Retry) **left**, filled primary (Raise hand) **right** (same as `DialogFooter` / wizard Back→Next). Pin with `sm:order-1` / `sm:order-2` when using `flex-col-reverse` on mobile.

## MUST NOT

- Add sidebar, command palette, or Ask Leo on exam-lock routes.
- Use `HubTable` / `ListPageTemplate` for timed delivery — question renderer + nav, not a data hub.
- Pixel-copy legacy exam UIs — map to DS tokens (`bg-sidebar` canvas, `bg-background` inset card).

## Reference

- `components/exam-lock-showcase-client.tsx` — exam lock demo
- `components/focus-workflow-showcase-client.tsx` — focus shell demo
- `components/new-library-item-form.tsx` — real focus workflow (library new)
