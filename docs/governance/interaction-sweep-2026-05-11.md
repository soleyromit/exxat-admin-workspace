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

---

## Addendum: assessment-taker sweep (2026-05-11)

The Vite-based `apps/exam-management/assessment-taker/` (default port 5173) was added to the sweep coverage in a second pass. Three NavShell-wrapped routes were exercised: `/`, `/competency`, `/history`. The exam engine itself (`/exam/:id/take`) was deliberately excluded — it's a full-screen lockdown surface that intentionally suppresses chrome.

### Coverage

| Route | Captured states | Critical | Serious | Total nodes (crit+serious) |
|---|---:|---:|---:|---:|
| `/` (AssessmentDashboard) | 11 | 1 | 7 | 8 |
| `/competency` (CompetencyDashboard) | 11 | 1 | 5 | 6 |
| `/history` (PastAssessments) | 11 | 9 | 21 | 30 |
| **Total** | **33** | **11** | **33** | **44** |

### Findings by rule

| Rule | Impact | Nodes | State-instances | Notes |
|---|---|---:|---:|---|
| `color-contrast` | serious | 30 | 13 | Affects every route; appears on default + every focus state |
| `button-name` | critical | 8 | 4 | `/history` only — likely an unlabelled icon button in the table |
| `aria-required-children` | critical | 3 | 3 | Triggers on `open-dropdown` across all 3 routes. Caused by `CommandDialog`/cmdk internals (see escalation S1 in `ds-escalations-2026-05-11.md`) |
| `aria-hidden-focus` | serious | 3 | 3 | Triggers on `open-dropdown` across all 3 routes. Same root cause as the Next.js admin app DropdownMenu issue (modal={false}). Vite app doesn't have the same fix yet. |

### Console errors

All three routes log the same runtime error 6-7 times:
```
TypeError: Cannot read properties of undefined (reading 'subscribe')
  at P (cmdk.js?v=fc018e14:484:35)
```

The error is thrown when `CommandDialog` mounts. Symptom: CommandPalette (Meta+K) does not work in the assessment-taker. Hypothesis: cmdk version mismatch between Vite's dep-bundled cmdk and the version shipped by DS, or a Radix portal mismatch under React Router v6. Worth confirming whether this is fixable by pinning cmdk in the assessment-taker's `package.json`.

Also one console warning on `/`: `Font Awesome Kit: TypeError: Failed to fetch` — kit ID `d9bd5774e0` may need to be re-confirmed for the assessment-taker domain (or the script is racing).

### Fix priority (assessment-taker-specific)

1. **`button-name` on `/history`** — 8 nodes, single-route fix. Likely an icon-only Button in the past-assessments table row missing `aria-label`. Inspect `apps/exam-management/assessment-taker/src/pages/PastAssessments.tsx`.
2. **`color-contrast` on every route** — 30 nodes. Cross-cutting; almost certainly the assessment-taker's Prism theme (the dev server reports `class="theme-prism"`) hits a different contrast surface than the admin's Lavender theme. Should be triaged against the actual offending nodes (see screenshots at `/tmp/visual-check/interactions/`).
3. **`aria-hidden-focus` on DropdownMenu** — same as the admin sweep's #1 finding. Add `modal={false}` to whichever DropdownMenu the assessment-taker uses (likely in `NavShell.tsx`).
4. **`aria-required-children` + cmdk console errors** — escalate as DS gap S1 (see `ds-escalations-2026-05-11.md`). Not a product-code fix.

### Coverage gap

Exam engine route (`/exam/:id/take`) was not swept. The route deliberately omits NavShell and renders a full-screen lockdown experience; it would benefit from a dedicated keyboard-only test rather than the standard interaction set. Defer to a follow-up.
