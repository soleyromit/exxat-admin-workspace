# Interaction-state sweep (2026-05-11)

> Full backlog of interaction-state a11y violations across both products, surfaced
> by `tools/visual-check/interactions.mjs`. Closes the discipline-log entry 2026-05-11
> Pattern A ("interaction states never exercised"). Coverage: 39 routes × ~12 states each.

## Coverage by product

| Product | Routes swept | Total interactions captured | Critical+serious nodes |
|---|---|---|---|
| **PCE admin** (port 3005) | 20 | 116 | 61 |
| **PCE student** (port 3006) | 3 | 6 | 0 |
| **exam-management admin** (port 3001) | 16 | 89 | 49 |
| **Total** | 39 | — | **110** |

## Findings by rule (cross-product)

### `aria-hidden-focus` (64 nodes, 35 routes, PCE admin, exam-management admin)

- **Surfaced in states**: mobile-viewport, open-dropdown
- **Routes**: 35
  - PCE admin: /admin/accommodations
  - PCE admin: /admin/assessment-types
  - PCE admin: /admin/competencies
  - PCE admin: /admin/content-areas
  - PCE admin: /admin/courses
  - PCE admin: /admin/faculty
  - PCE admin: /admin/offerings
  - PCE admin: /admin/permissions
  - … and 27 more

### `document-title` (19 nodes, 19 routes, PCE admin)

- **Surfaced in states**: mobile-viewport
- **Routes**: 19
  - PCE admin: /admin/accommodations
  - PCE admin: /admin/assessment-types
  - PCE admin: /admin/competencies
  - PCE admin: /admin/content-areas
  - PCE admin: /admin/courses
  - PCE admin: /admin/faculty
  - PCE admin: /admin/offerings
  - PCE admin: /admin/permissions
  - … and 11 more

### `html-has-lang` (19 nodes, 19 routes, PCE admin)

- **Surfaced in states**: mobile-viewport
- **Routes**: 19
  - PCE admin: /admin/accommodations
  - PCE admin: /admin/assessment-types
  - PCE admin: /admin/competencies
  - PCE admin: /admin/content-areas
  - PCE admin: /admin/courses
  - PCE admin: /admin/faculty
  - PCE admin: /admin/offerings
  - PCE admin: /admin/permissions
  - … and 11 more

### `color-contrast` (7 nodes, 2 routes, exam-management admin)

- **Surfaced in states**: default, focus-first-button, focus-first-dropdown, focus-first-input, focus-first-select, open-dropdown
- **Routes**: 2
  - exam-management admin: /questions/q-001
  - exam-management admin: /questions/q-001/edit

### `button-name` (1 nodes, 1 routes, PCE admin)

- **Surfaced in states**: open-dialog
- **Routes**: 1
  - PCE admin: /templates

## Findings by state (which interaction surfaces most violations)

| State | Total violation nodes |
|---|---|
| `mobile-viewport` | 80 |
| `open-dropdown` | 71 |
| `focus-first-select` | 7 |
| `default` | 7 |
| `focus-first-input` | 7 |
| `focus-first-button` | 7 |
| `focus-first-dropdown` | 7 |
| `open-dialog` | 1 |

## Coverage gaps (interactions skipped)

Many states are skipped on routes that lack the trigger element. Not a bug — the runner is best-effort. But it tells us which surfaces have no Dialog/Sheet/Command palette/theme toggle to test.

### PCE admin
- Captured: {'default': 19, 'focus-first-dropdown': 19, 'open-dropdown': 19, 'mobile-viewport': 19, 'focus-first-button': 15, 'open-dialog': 9, 'focus-first-select': 7, 'dialog-validation': 6, 'open-sheet': 2, 'focus-first-input': 1}
- Skipped: {'command-palette': 19, 'theme-toggle': 19, 'focus-first-input': 18, 'open-sheet': 17, 'focus-first-select': 12, 'open-dialog': 10, 'focus-first-button': 4, 'dialog-validation': 1}

### PCE student
- Captured: {'default': 3, 'mobile-viewport': 3}
- Skipped: {'focus-first-button': 3, 'focus-first-input': 3, 'focus-first-select': 3, 'focus-first-dropdown': 3, 'open-dialog': 3, 'open-sheet': 3, 'open-dropdown': 3, 'command-palette': 3, 'theme-toggle': 3}

### exam-management admin
- Captured: {'default': 16, 'focus-first-dropdown': 16, 'mobile-viewport': 16, 'open-dropdown': 15, 'focus-first-button': 12, 'focus-first-select': 9, 'open-dialog': 3, 'focus-first-input': 2}
- Skipped: {'open-sheet': 16, 'command-palette': 16, 'theme-toggle': 16, 'focus-first-input': 14, 'open-dialog': 13, 'focus-first-select': 7, 'focus-first-button': 4, 'dialog-validation': 3, 'open-dropdown': 1}

## Top 5 fix priority (cross-product)

Ranked by leverage (single fix × routes affected):

1. **`aria-hidden-focus` fix in vendored DropdownMenu** — affects 64 nodes across 35 routes (every page with a row-action dropdown). Already partially fixed in `apps/pce/admin/components/data-table/pagination.tsx:76` via `modal={false}` (commit pending). Propagate to every DropdownMenu in product code that mounts via Radix Portal.
2. **`document-title` + `html-has-lang` on mobile viewport** — 38 nodes total. Investigation: Next.js `metadata` not propagating through viewport-resize re-render. Fix likely in `apps/pce/admin/app/layout.tsx` (verify metadata export) OR in `tools/visual-check/interactions.mjs` (add `waitForLoadState` after `setViewportSize`).
3. **`color-contrast` on question-editor pages** — 7 nodes / 2 routes. Real color-token bug specific to `/questions/q-001` + edit. Likely `text-chart-N` on tinted backgrounds inside the editor (same class as the recently-fixed StatusPill).
4. **`button-name` on /templates dialog** — 1 node. A button in the templates page modal lacks discernible text. Single-site fix.
5. **Promote state-coverage audit rules to block** once each rule hits 0. `aria-hidden-focus` is at 64 hits today; once the modal={false} fix propagates, promote.

## What this sweep did NOT cover

- **Keyboard-only navigation flow** — Tab order through a full page (the runner only Tabs until first match per type)
- **Live form submission** — interactions.mjs only triggers EMPTY-form validation; not happy-path submit
- **Long-content modals** — modals with scrolling content captured at default scroll
- **Real loading states** — mock data is synchronous; loading skeletons never render
- **Theme switching** — no theme toggle exists in either product; theme-toggle state always skipped
- **Stakeholder fit** — your eye + Aarti/Vishaka feedback still required

## Per-route deep evidence

All screenshots and axe JSON at `/tmp/visual-check/interactions/<slug>.<interaction>.{png,axe.json}` — preserved for the visual-review subagent to read on demand.
