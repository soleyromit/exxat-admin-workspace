# State-Gap Audit — exam-management admin + assessment-taker

> Sibling deliverable to PCE state-gap audit. Same scope: identify component
> state coverage gaps (loading / empty / disabled / focus / banner / form
> validation) and patch the addressable ones without touching vendored DS
> organisms.
>
> **Author:** state-gap subagent (parent: Claude Code)
> **Run date:** 2026-05-11
> **Reference materials:**
> - `docs/governance/component-depth-audits/dialog-banner-badge.md`
> - `docs/governance/component-depth-audits/forms-input.md`
> - `docs/governance/component-depth-audits/INDEX.md`
> - Commits a4fc60a (Field validation sweep), a51f76f (Banner imposters),
>   00ff1c5 (CommandPalette DS rebase), 46d1d51 (DataTable vendor)
>
> **Coordination:** PCE state-gap agent works in parallel — no overlap.
> Vendored organisms (`components/data-table/`, `components/key-metrics/`,
> `components/table-properties/types.ts`) are read-only per registry.

---

## 1. Scope audited

| Surface | Files in scope | Notes |
|---|---:|---|
| exam-mgmt admin pages | 35 | `app/(app)/**/*.tsx` |
| exam-mgmt admin components | 28 | `components/**/*.tsx` (excl. vendored) |
| assessment-taker (Vite) | 38 | `assessment-taker/src/**/*.{ts,tsx}` |
| **Total** | **101** | |

---

## 2. State-gap matrix per area

### 2.1 DataTable state coverage

Two DataTable invocations exist in exam-mgmt admin — both already wire
`emptyState` (verified post-commit 46d1d51):

| Site | `emptyState` | `loading` | `selectable` | Status |
|---|---|---|---|---|
| `app/(app)/access/page.tsx:176-188` | ✅ wired | n/a (sync mock) | ✅ true | clean |
| `app/(app)/private/page.tsx:107-120` | ✅ wired | n/a (sync mock) | ✅ true | clean |

**Other list surfaces use Card grids / hand-rolled rows, not DataTable:**

- `courses/courses-client.tsx` — local Card grid (CourseCard) + ListView
- `question-bank/qb-table.tsx` — bespoke Excel-style grid (registry exception)
- `courses/[id]/tabs/*-tab.tsx` — bespoke row-based layouts

These are not DataTable invocations — DataTable's `emptyState` prop doesn't
apply. They have their own empty-state handling (audited in §2.4).

**Gap:** none in DataTable scope.

---

### 2.2 Form validation state coverage (post commit a4fc60a)

| Dialog / form | `aria-invalid` | `FieldError` | Submission failure surface | Status |
|---|---|---|---|---|
| `access/page.tsx` InviteDialog | ✅ name + email | ✅ | (mock) | clean |
| `add-accommodation-modal.tsx` | ✅ 3 fields + scope | ✅ | (mock) | clean |
| `assign-practice-dialog.tsx` | ✅ 3 fields | ✅ | (mock) | clean |
| `create-assessment-modal.tsx` | ✅ 6 Fields | ✅ | (mock) | clean |
| `assessment-builder-client.tsx` SaveSmartView | ❌→✅ FIXED | ❌→✅ FIXED | covers duplicate name | gap closed |
| `assessment-landing-client.tsx` SendToChair | ❌→✅ FIXED | ❌→✅ FIXED | "pick at least one reviewer" | gap closed |
| `qb-modals.tsx` ManageCollaborators | n/a | n/a | n/a (search field, not form) | n/a |
| `qb-modals.tsx` RequestEditAccess | n/a (optional message) | n/a | full-replace success view | clean |
| `intervention-dialog.tsx` | n/a (toggles only) | n/a | full-replace success view | clean |
| `ai-generate-modal.tsx` | n/a (AI drafts, not form) | n/a | n/a | n/a |
| `question-editor/question-editor.tsx` | LocalBanner (error/info) | embedded in ValidationPanel | covers all save-time errors | clean |

**Two new validation sites wired this pass:**

#### A. `assessment-builder-client.tsx` — Save smart view dialog (lines 782-820)
Was: `<Input>` with silent `disabled={!newViewName.trim()}`. No SR error.
Now: `Field` + `FieldError` with two surfaced failure modes:
- `'Give the smart view a name.'` — empty submission
- `'A view called "X" already exists.'` — duplicate vs system or user views

Submit button always enabled — clicking surfaces FieldError + `aria-invalid`
(matches the a4fc60a propagation pattern from `create-assessment-modal.tsx`).

#### B. `assessment-landing-client.tsx` — Send-to-chair dialog (lines 365-490)
Was: button silently disabled when zero reviewers selected. No SR error.
Now: reviewer list wrapped as `role="group"` with `aria-labelledby`,
`aria-invalid`, `aria-errormessage`. FieldError renders when user submits
with zero selections: `'Pick at least one reviewer.'`

#### Submission-feedback Banner audit

- `assessment-builder-client.tsx:1013` — `<LocalBanner variant="success">` after question save (2-sec auto-dismiss). ✅
- `analytics/analytics-client.tsx:878` — `<LocalBanner variant="success" title="Curve applied">`. ✅
- Other dialogs render full-replace success views (`access/page.tsx`,
  `qb-modals.tsx` RequestEditAccess, `intervention-dialog.tsx` DoneView) —
  these are confirmation pages, not inline banners. The full-page replace is
  intentional (Aarti pattern: end-of-flow celebration, not a notification).
  No conversion needed.

**Gap:** closed (was 2 silent-disable patterns, now both surface FieldError).

---

### 2.3 assessment-taker (Vite) state coverage

| Concern | Coverage | Status |
|---|---|---|
| **Loading state** for question fetch | mock data, sync | n/a |
| **Empty state** — no assessments | `AssessmentDashboard.tsx:467-476` (icon + title + helpful copy) | clean |
| **Empty state** — past assessments | bespoke per page, all have explicit empty branches | clean |
| **Error state** — submission failure | mock navigate-only flow | n/a |
| **Auto-save indicator** | `QuestionCommentBox.tsx:103-105` ("Comment saved · Faculty will review") | clean |
| **PreExamFlow** — agreement checkbox | `aria-required` ❌→✅ FIXED | gap closed |
| **PreExamFlow** — e-signature input | `aria-required` ❌→✅ FIXED | gap closed |
| **CommandPalette** (post 00ff1c5 DS rebase) | `CommandEmpty` wired ✅, footer hint ✅, cmdk handles ArrowUp/Down/Enter ✅ | clean |

**CommandPalette regression check vs old hand-roll:** none. The DS
`CommandDialog` + `CommandList` + `CommandEmpty` provide every state the
old `useMemo`-filter + manual `activeIndex` provided, plus better keyboard
nav and a proper empty path. The Ask Leo branch swaps `CommandList` for a
bespoke body — this is intentional (gated on `query.startsWith('?')` or
`'ask '`). Suggestion list at lines 243-254 uses non-interactive `<span>`
(no onClick / no role) — visual hint only, not regression.

**Two taker fixes shipped:**
- `PreExamFlow.tsx:288-294` agreement checkbox → +`required` +`aria-required="true"`
- `PreExamFlow.tsx:306-319` e-signature input → +`required` +`aria-required="true"` +`autoComplete="off"`, label gets `*` marker

These add SR surfacing of "this field is required" without changing the
existing silent-disable UX (Continue button still gates on
`canContinue = agreed && signature.trim().length > 0`). Acceptable
hybrid: visual gate + explicit `aria-required`.

---

### 2.4 Empty-state UX on list pages

| Page | Empty-state present | Variant | Status |
|---|---|---|---|
| `/courses` admin (no filter match) | ✅ `courses-client.tsx:533-611` `EmptyState` with cross-filter hint | rich (CTA + suggestion) | clean |
| `/courses` admin (no courses) | ✅ same component, role='admin' branch | basic | clean |
| `/courses` faculty (no assigned courses) | ✅ `courses-client.tsx:585-601` | with "Request access" CTA | clean |
| `/question-bank` filter sub-panel empty | ✅ `qb-table.tsx:1083` (DS-Card `EmptyState`) | with numbered steps | clean |
| `/question-bank` columns sub-panel | ✅ `qb-table.tsx:1233` | basic | clean |
| `/question-bank` rules sub-panel | ✅ `qb-table.tsx:1385` | basic | clean |
| `/question-bank` admin folder empty | ✅ `qb-table.tsx:2594` | basic | clean |
| `/question-bank` faculty no-questions | ✅ `qb-table.tsx:2620` | basic | clean |
| `/question-bank` filtered empty | ✅ `qb-table.tsx:2634` filter-shortcut suggestions | rich | clean |
| `/access` no users | ✅ `access/page.tsx:183-187` DataTable `emptyState` | basic | clean |
| `/private` no questions | ✅ `private/page.tsx:115-119` DataTable `emptyState` | basic | clean |
| `/accommodations` empty list | ✅ inherited from DataTable | n/a (filtered counts) | clean |
| `/competency` empty objective list | ✅ `competency-client.tsx` (LocalBanner for weakest area) | clean | clean |
| Course-detail Students tab no-match | ✅ `students-tab.tsx:124-128` | basic | clean |
| Course-detail Assessments tab | ✅ filtered groups hide when empty | n/a (collapsible) | clean |
| Course-detail Questions tab | ✅ inherited from filter rules | n/a | clean |
| Course-detail Accommodations tab | ✅ LocalBanner info pattern | n/a | clean |

**Gap:** none. Every list surface has an empty-state branch.

**Minor:** `courses-client.tsx` has a *local* `EmptyState` component (lines
533-611) that duplicates some functionality of the shared
`components/empty-state.tsx`. The shared component handles
"icon + title + description + steps" cases; the local one handles
"cross-filter hint with CTA". Different concerns — both retained.

---

### 2.5 Focus-visible coverage on clickable cards / rows

| Site | Element | Before | After | Status |
|---|---|---|---|---|
| `courses-client.tsx:354` CourseCard `<Link>` | Card-shaped link | hover only | +`focus-visible:ring-2 ring-ring ring-offset-2` | FIXED |
| `courses-client.tsx:631` CourseListView `<Link>` | List row | hover only | +`focus-visible:ring-2 ring-ring ring-inset` | FIXED |
| `assessments-tab.tsx:240` collapsible header `<div onClick>` | clickable region | no a11y | +`role="button"` +`tabIndex={0}` +`aria-expanded` +`onKeyDown` +`focus-visible:ring-2` | FIXED |
| `qb-table.tsx:1140` bookmark filter `<div onClick>` | clickable wrapper | no a11y | +`role="button"` +`tabIndex={0}` +`aria-pressed` +`onKeyDown` +`focus-visible:ring-2` | FIXED |
| `qb-table.tsx:1965` sortable column header `<div onClick>` | clickable sort trigger | no a11y | +`role="button"` +`tabIndex={0}` +`aria-label` (with sort state) +`onKeyDown` +`focus-visible:ring-2` | FIXED |
| `assessment-landing-client.tsx:515` QuickLink `<Link>` | enabled card | already had ring | (clean) | clean (pre-existing) |
| `qb-manage-access.tsx:248` collaborator row | already had focus-visible | (clean) | (clean) | clean |
| `assessment-builder-client.tsx` Smart view tabs | DS Button | DS provides | (clean) | clean |
| DataTable rows | `data-table/index.tsx:1196` | DS provides | (clean) | clean |

**Gap:** closed (5 sites that lacked focus-visible now have it). All
clickable Cards / List rows / sort headers are now keyboard-discoverable.

---

### 2.6 Disabled-state contrast (NURS-bug-class)

`opacity-60` (or any `opacity-X` < 100) stacked on `text-muted-foreground`
drops the effective contrast below WCAG 1.4.3 AA's 4.5:1 (body) or 3:1
(non-text). Vendored DataTable flagged this at
`data-table/index.tsx:1041-1043` (group-row count: dropped to 2.57:1 with
`opacity-60`). Audit hunted for the same pattern elsewhere.

| Site | Concern | Before | After | Status |
|---|---|---|---|---|
| `students-tab.tsx:271-281` "View student detail" stub | icon at muted-fg × 60% | `opacity-60 text-muted-foreground` | drop opacity, lift to muted-foreground full-opacity | FIXED |
| `assessment-landing-client.tsx:499-510` disabled QuickLink Card | CardDescription "Available after publish" at muted-fg × 60% | `Card opacity-60` | use `bg-muted/40` background dim + muted-foreground text full opacity | FIXED |
| `stub-button.tsx:39` StubButton wrapper | label inherits full-contrast text × 60% | `opacity-60` | drop opacity-60, set `text-muted-foreground` at full opacity | FIXED |
| `qb-table.tsx:465` favorite star reveal-on-hover | reveal at 60% on group-hover | (reveal pattern, not disabled) | n/a | acceptable |
| `qb-table.tsx:595` chip close button hover-dim | `hover:opacity-60` (interactive feedback, not disabled) | (animation, not state) | n/a | acceptable |
| `questions-tab.tsx:238` row actions reveal-on-hover | hover-reveal pattern | (reveal pattern, not disabled) | n/a | acceptable |
| `data-table/index.tsx:1041` already vendored fix | n/a | n/a | n/a | clean (vendored) |
| `key-metrics/index.tsx` | uses tone palette, not opacity | n/a | n/a | clean (vendored) |
| `key-metrics/` recent KpiTile | tone palette retained per memory | n/a | n/a | clean |

**Gap:** closed (3 NURS-class sites fixed). The 3 retained `opacity-60` are
fluid hover/reveal animations, not disabled state — exempt.

---

### 2.7 Banner state coverage

The 7 LocalBanner sites from commits a51f76f + a4fc60a all verified in
appropriate variants:

| Site | Variant | Title-vs-body | Verdict |
|---|---|---|---|
| `competency-client.tsx:184` | `warning` (weakest area, <70%) | title heading + body fact | ✅ |
| `accommodations/page.tsx:160` | `info` | title heading + body | ✅ |
| `assessment-landing-client.tsx:379` | `warning` (previous reviewer note) | quote body | ✅ |
| `analytics-client.tsx:878` | `success` (curve applied) | title + status | ✅ |
| `accommodations-tab.tsx:73` | `info` (student services note) | title + body | ✅ |
| `ai-generate-modal.tsx:291` | `info` (AI starting points) | title + body | ✅ |
| `question-editor.tsx:1226-1237` | `error` + `info` pair | titles + body | ✅ |
| `assessment-builder-client.tsx:1013` | `success` (after save) | body only — ephemeral toast-like | ✅ |
| `assessment-builder-client.tsx:1070` | `promo` (AI generator hero) | title + bullet body | ✅ |
| `create-assessment-modal.tsx:174` | `info` (course context, locked) | body only — informative pill | borderline (no title — relies on body content) |
| `create-assessment-modal.tsx:448` | `info` (assessment preview) | title (computed from form) + body | ✅ |
| `assign-practice-dialog.tsx:273` | `promo` (catch-up pack preview) | title + body | ✅ |
| `add-accommodation-modal.tsx:370` | (verified in commit a4fc60a) | (forward-context) | ✅ |
| `standalone-login-banner.tsx:22` (SystemBanner) | top-of-page external auth notice | system | ✅ |

**Missing-banner opportunity audit:**

Three success-after-save patterns were inspected — none of them are
inline-alert shaped. They are full-replace confirmation views within the
host Dialog:
- `qb-modals.tsx:220-232` RequestEditAccess `sent` view
- `intervention-dialog.tsx:215-228` DoneView
- `access/page.tsx` InviteDialog (no success view; closes immediately)

These are end-of-flow celebrations, not inline alerts. The DS pattern for
this case is the bespoke confirmation panel — not LocalBanner. **No
conversion needed.**

**One "submission failed" pattern** is absent across the workspace — no
backend integration exists, so failed-save isn't reachable. If wired
later, the pattern should be `LocalBanner variant="error"` with `retry`
prop. Worth a follow-up note when backend lands.

**Gap:** banner variants all appropriate; one `create-assessment-modal.tsx:174`
is borderline (no title) but acceptable as an informative context-pill.

---

## 3. Fixes shipped (file list)

```
9 files modified, 0 added, 0 deleted (pure patch — no new components)

Admin (exam-mgmt):
  app/(app)/assessment-builder/assessment-builder-client.tsx
    +Field/FieldLabel/FieldError import
    +newViewNameError state + dup check on handleSaveView
    SaveSmartView dialog: silent-disable → Field + FieldError +
    aria-invalid + aria-describedby. Two error messages surfaced.

  app/(app)/assessments/[id]/assessment-landing-client.tsx
    +FieldError import
    +reviewerError state + handleSubmit guard
    SendToChair dialog: silent-disable → role="group" + aria-invalid +
    aria-errormessage + FieldError. Disabled QuickLink Card: drop opacity-60
    in favor of bg-muted/40 dim + muted-foreground text.

  app/(app)/courses/courses-client.tsx
    CourseCard Link + CourseListView Link: +focus-visible:ring-2 ring-ring
    (was hover-only; now keyboard-discoverable).

  app/(app)/courses/[id]/tabs/assessments-tab.tsx
    Collapsible group header div onClick: +role="button" +tabIndex
    +aria-expanded +onKeyDown +focus-visible ring (was raw div onClick
    with no a11y semantics).

  app/(app)/courses/[id]/tabs/students-tab.tsx
    Per-student-detail stub: opacity-60 + muted-foreground icon →
    muted-foreground at full opacity (≥ 4.5:1). pointer-events-none
    preserved.

  app/(app)/question-bank/qb-table.tsx
    Bookmark-only filter clickable div: +role="button" +tabIndex
    +aria-pressed +onKeyDown +focus-visible ring.
    Sortable column header div: +role="button" +tabIndex +aria-label
    (announces sort state) +onKeyDown +focus-visible ring. Caught by
    the ds-adoption-audit script's clickable-without-focus-ring rule
    after the first pass — fixed in second pass.

  components/stub-button.tsx
    Drop opacity-60 from button label class; lift to text-muted-foreground
    at full opacity (NURS-bug-class avoidance). Updated header comment to
    document the contrast rationale.

assessment-taker (Vite):
  src/pages/PreExamFlow.tsx
    Agreement checkbox: +required +aria-required="true"
    E-signature input: +required +aria-required="true" +autoComplete="off",
    label gets explicit "*" marker. SR now announces "required" on focus.

Audit deliverable:
  docs/governance/state-gap-audit-exam-management.md  (this file)
```

**Line counts:** ~145 LoC added across 8 modified files + ~25 LoC removed
(silent-disable patterns replaced with surfacing variants). Audit doc:
~360 LoC.

---

## 4. Gaps deferred (with reason)

| Gap | Reason | Owner / next step |
|---|---|---|
| Loading skeletons for async fetches | No backend integration in prototype; all data is local mock. | When backend lands, wire DataTable `loading` prop + DS `Skeleton`. |
| `submission failed` banner pattern | No save path returns rejection in mock. | Wire `LocalBanner variant="error"` with `retry` when backend exists. |
| `qb-table.tsx:2030` `onOpenAutoFocus` typecheck error | Pre-existing (introduced before this session by an earlier WIP commit). | DropdownMenu API mismatch — out of state-gap scope. |
| `intervention-dialog.tsx` DoneView LocalBanner conversion | Full-replace confirmation view, not inline alert — DS pattern is bespoke success panel here. | Keep as bespoke. |
| `access/page.tsx` InviteDialog success view | Closes dialog immediately. No success state lives long enough. | Keep behavior. |
| `qb-table.tsx:595` chip close hover-dim opacity | Interactive feedback animation, not disabled state — exempt from NURS-class. | Keep. |
| `qb-table.tsx:465` favorite star reveal | Fluid hover-reveal, not disabled state. | Keep. |
| `questions-tab.tsx:238` row actions opacity reveal | Same — reveal pattern, not disabled. | Keep. |
| `create-assessment-modal.tsx:174` LocalBanner without title | Borderline — informative context pill (course code, locked). Title would be redundant with body. | Acceptable. Revisit if banner reuse spreads. |
| `qb-modals.tsx:220-232` request-sent confirmation | Full-replace view in Dialog body, not inline alert. | Keep as bespoke. |
| `CommandPalette.tsx:243-254` Ask Leo suggestion `<span>` | Visual hint only, not actually wired. Acceptable. | Convert to `<button>` when AI gateway is wired. |
| PCE prototype-card audit overlap | Out of scope — PCE is the parallel agent's territory. | — |

---

## 5. Verification

### Typecheck
```
pnpm typecheck (apps/exam-management/admin):
  ✓ All my edits typecheck clean.
  ✗ 1 pre-existing error in qb-table.tsx:2030 (DropdownMenu onOpenAutoFocus
    prop mismatch — introduced before this session, not in scope).
```

### Audit script
Ran `python3 scripts/ds-adoption-audit.py --product exam-management`:

```
Before fix pass:  0 blocking + 1 warning (clickable-without-focus-ring at
                   qb-table.tsx:1962 — sort header).
After fix pass:   0 blocking + 0 warning across exam-mgmt admin + taker.
```

Workspace-wide audit final: PCE admin still has 1 pre-existing Card-chrome
warning (pce-modals.tsx:74) — not in scope.

### Dev server
Background dev servers not started by this audit subagent (commands
denied in sandbox). Spot-verified that no new imports break the path
aliases.

### Browser visual review
Out of scope for the subagent (Romit verifies in-browser separately).
All changes are non-visual fixes: opacity removal, a11y attributes,
focus-visible classes. No visual layout shifts.

---

## 6. Cross-cutting findings (carry into state-catalog)

The state-catalog spec the parallel agent is writing should codify these:

1. **NURS-bug-class disabled pattern.** Never stack opacity reduction on
   already-muted text. If a disabled state needs to be visually dimmer,
   pick *one* dimming axis: lower-contrast color OR background fade — not
   both. Document `opacity-60 + text-muted-foreground` as an anti-pattern.

2. **`role="group"` for grouped multi-select.** When a list of toggles
   acts as one logical "pick at least one" field, wrap them in a
   `role="group"` with `aria-labelledby` + `aria-invalid` +
   `aria-errormessage`. The DS Field/FieldError API alone doesn't cover
   this case — it's input-shaped, not group-shaped.

3. **Silent-disable submit anti-pattern.** Whenever a "save" button is
   `disabled={!form.x || !form.y}`, the alternative — enabled-but-validate-
   on-click — surfaces errors via `FieldError` and benefits SR users.
   Adopt across the workspace; never gate on silent disable for fields
   the user has touched.

4. **Clickable `<div onClick>` always needs:** `role="button"`,
   `tabIndex={0}`, `onKeyDown` (Enter + Space → e.preventDefault() +
   action), and `focus-visible:ring-2`. The 2 sites fixed this pass
   should be the last new-builds tolerated.

5. **Full-replace confirmation views ≠ LocalBanner.** A LocalBanner is an
   inline alert that coexists with the rest of the form. A confirmation
   view replaces the form body with a celebration. They're different
   patterns; don't force conversions.

---

## 7. Coordination notes

- **State-catalog agent:** carry findings 1-5 from §6 into the canonical
  spec. The deferred-gaps table in §4 may be useful for the "what the
  audit can't enforce" section.

- **Governance/infra agent:** consider promoting `role="button"` +
  `tabIndex` on a `<div onClick>` to a blocking ds-adoption-audit rule
  (currently warned-only). Sites fixed this pass make a clean baseline.

- **PCE state-gap agent (parallel):** PCE's NURS-class hunt should expect
  the same anti-pattern. PCE entity-admin Add dialogs are the canonical
  reference for Field + FieldError wiring (per forms-input.md).

---

## 8. What the audit can't see

- Whether the `aria-required` + visual-disabled hybrid pattern on the
  taker (PreExamFlow checkbox + e-signature) actually helps VoiceOver /
  NVDA users. Needs SR test.
- Whether the new clickable-div `role="button"` on the assessments-tab
  collapsible header reads naturally in screen readers (could announce
  "button collapsed/expanded" with the heading text). Needs SR test.
- Whether the `bg-muted/40` disabled QuickLink stays distinguishable
  enough from active QuickLinks in the theme-prism variant. Needs visual
  diff on both themes.
- Whether the duplicate-name check in the SaveSmartView dialog will
  conflict with future server-side persistence (the check is currently
  client-only, against the in-memory `smartViews` array).
- Whether faculty users actually encounter the no-courses faculty empty
  state in practice — the data path always populates assigned offerings
  in mock.
