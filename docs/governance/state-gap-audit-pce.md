# State-gap audit — PCE (admin + student) — 2026-05-11

Next-layer audit after the per-component depth audits at `docs/governance/component-depth-audits/`. Depth audits asked "is this component imported / used appropriately." This audit asks "in every state the company-defined-as-required (loading / empty / error / focused / disabled / etc.), does the product render the canonical pattern?"

## ⚠️ Scope of this audit (Pattern A transparency)

**Method**: static source analysis + default-state HTTP fetch + axe-core scan on the default-rendered HTML.

**What was checked:**
- Does the source declare an `emptyState` prop, validation handler, `aria-invalid`, etc.?
- Does the default-rendered DOM show the right slot composition?
- Does axe-core flag any accessibility violations in the default state?

**What was NOT checked (Romit caught this gap explicitly):**
- ❌ Interaction states triggered live (hover, focus-visible, active, pressed)
- ❌ Open states of overlays (dialogs, sheets, popovers, dropdowns) — they render closed by default
- ❌ Validation-error states triggered by submitting invalid forms
- ❌ Submission feedback states (success banner, error banner) — never fired
- ❌ Loading states (no async data fetching in PCE today; forward-looking)
- ❌ Theme switching (theme-one vs theme-prism rendering)
- ❌ Responsive / mobile breakpoint behavior

Closing the gap: see `tools/visual-check/interactions.mjs` (Playwright interaction-test runner, separate session) for the layer that drives state transitions + captures each. Until then, this audit's GREENLIGHT claim is bounded by the "static + default-state" qualifier.

Companion docs:
- `docs/governance/component-depth-audits/forms-input.md` — validation-depth = 0% finding
- `docs/governance/component-depth-audits/dialog-banner-badge.md` — submission-failure UX missing
- `docs/governance/component-state-catalog.md` — canonical state spec from localhost:4000

---

## Scope

- `apps/pce/admin/app/(app)/**/*.tsx` (16 routes)
- `apps/pce/admin/components/pce/*.tsx` (7 feature components + modals)
- `apps/pce/student/app/**/*.tsx` (5 routes)
- `apps/pce/student/components/**/*.tsx` (none — empty dir)

Vendored DS organisms (`data-table/`, `key-metrics/`, `table-properties/`) excluded per constraint.

---

## Pages audited: 21

| Surface | Path | Uses DataTable | Empty | Loading | Form-dialog | Banner-after-save |
|---|---|---|---|---|---|---|
| Home (PCE) | `app/(app)/page.tsx` | n/a (FolderCard grid) | n/a | n/a | n/a | n/a |
| Admin landing | `app/(app)/admin/page.tsx` | n/a (EntityCard grid) | n/a | n/a | n/a | n/a |
| Surveys | `app/(app)/surveys/page.tsx` | Yes | Inline (EmptySurveys) | sync | CreateSurveySheet | none |
| Survey detail | `app/(app)/surveys/[id]/page.tsx` | n/a | n/a | sync | n/a | n/a |
| Survey responses | `app/(app)/surveys/[id]/responses/page.tsx` | (read-only) | n/a | sync | n/a | n/a |
| Templates | `app/(app)/templates/page.tsx` | Yes | Inline (EmptyState) | sync | CreateTemplateSheet | none |
| Template detail | `app/(app)/templates/[id]/page.tsx` | n/a | n/a | sync | n/a | n/a |
| My surveys | `app/(app)/my-surveys/page.tsx` | Yes | Inline (EmptyFaculty, filter-aware) | Suspense + Skeleton | n/a | n/a |
| My survey results | `app/(app)/my-surveys/[id]/results/page.tsx` | (chart-only) | n/a | sync | n/a | n/a |
| Moderation | `app/(app)/moderation/page.tsx` | Yes | Inline (all-caught-up affirmation) | sync | ReleaseSheet | none |
| Analytics | `app/(app)/analytics/page.tsx` | Yes (inner) | Inline (outer hasData gate) | sync | n/a | n/a |
| Programmatic surveys | `app/(app)/programmatic-surveys/page.tsx` | n/a (full-page coming-soon) | n/a | sync | n/a | n/a |
| Admin · Master Courses | `app/(app)/admin/courses/page.tsx` | Yes | Inline (filter-aware) | sync | Add course | none |
| Admin · Terms | `app/(app)/admin/terms/page.tsx` | Yes | **was: NONE → emptyState** | sync | Add term | none |
| Admin · Offerings | `app/(app)/admin/offerings/page.tsx` | Yes | **was: NONE → emptyState** | sync | Add offering | none |
| Admin · Students | `app/(app)/admin/students/page.tsx` | Yes | **was: NONE → emptyState** | sync | Add student | none |
| Admin · Faculty | `app/(app)/admin/faculty/page.tsx` | Yes | **was: NONE → emptyState** | sync | (Phase 2 — Add disabled) | n/a |
| Admin · Permissions | `app/(app)/admin/permissions/page.tsx` | n/a (Faculty cards) | Inline (search-aware) | sync | Grant role | none |
| Admin · Content Areas | `app/(app)/admin/content-areas/page.tsx` | Yes | Inline | sync | Add area | none |
| Admin · Competencies | `app/(app)/admin/competencies/page.tsx` | Yes | Inline (filter-aware) | sync | Add competency | none |
| Admin · Standards | `app/(app)/admin/standards/page.tsx` | Yes | **was: NONE → emptyState** | sync | Add standard | none |
| Admin · Assessment Types | `app/(app)/admin/assessment-types/page.tsx` | Yes | **was: NONE → emptyState** | sync | (read-only) | n/a |
| Admin · Accommodations | `app/(app)/admin/accommodations/page.tsx` | Yes | Inline (filter-aware) | sync | Add accommodation | none |
| Student · Survey list | `student/app/surveys/page.tsx` | n/a (cards) | Inline (all-done affirmation) | sync | n/a | n/a |
| Student · Take survey | `student/app/surveys/[id]/page.tsx` | n/a | n/a | sync + resumed banner | n/a | n/a |
| Student · Submitted | `student/app/surveys/[id]/submitted/page.tsx` | n/a | n/a | sync | n/a | n/a |

---

## Gaps found by class

### Class A — DataTable empty state missing (6 pages) — **FIXED**

| Page | Pre-fix state | Post-fix |
|---|---|---|
| `admin/assessment-types/page.tsx` | Fell through to DataTable default "No results match your filters" | `emptyState` prop with icon + search-clear hint |
| `admin/faculty/page.tsx` | Same | `emptyState` prop, LMS-aware copy |
| `admin/offerings/page.tsx` | Same | `emptyState` prop, filter-aware copy |
| `admin/standards/page.tsx` | Same | `emptyState` prop, source-filter-aware copy |
| `admin/students/page.tsx` | Same | `emptyState` prop, LMS-aware copy |
| `admin/terms/page.tsx` | Same | `emptyState` prop, LMS-aware copy |

Pattern used: small icon (24px) + heading + 1-line explanation. Renders inside the table's single empty cell (preserves toolbar — search/properties remain interactive). Distinct from the `surveys/page.tsx` "full-page replacement" pattern, which is appropriate when there's a primary CTA to surface (Create Survey).

### Class B — `opacity-60` descendant-contrast risk (1 site) — **FIXED**

| Site | Fix |
|---|---|
| `admin/page.tsx:88-94` (EntityCard) | `opacity-60` on Card root → `aria-disabled + bg-muted/30 + cursor-not-allowed`. Parity with `apps/pce/admin/app/(app)/page.tsx` FolderCard fix (commit 6f180c1, 2026-05-11). |

Note: all current entities are `status: 'available'`, so the disabled branch was dead code today — but the pattern would have shipped wrong the first time a `phase-2` / `shared` entity landed. Preventive fix.

### Class C — Banner state coverage (workspace-wide) — **DEFERRED**

5 LocalBanner variants exist (info / warning / error / success / promo). Adoption in PCE today:

| Variant | Usage count | Sites |
|---|---|---|
| warning | 2 | `DeleteTemplateDialog` ("in use"), `analytics` (mixed templates) |
| error | 8 | All admin Add dialogs ("Fix the following before saving") |
| info | 0 | — |
| success | 0 | — |
| promo | 0 | — |

**Success-after-save is the biggest miss.** Every admin Add dialog (8 dialogs) currently closes silently on save. Screen-reader users have no confirmation that the save succeeded; sighted users only get the visual change of the new row appearing in the table (which may scroll off-screen).

**Deferred reason:** Establishing the success-after-save pattern correctly requires:
1. Lifted `lastSavedId` + `lastSavedLabel` state on each page
2. Timer-based auto-dismiss (3s typical, but Aarti hasn't ruled on it)
3. Placement decision: top-of-page LocalBanner vs row-highlight vs both
4. Live-region announcement strategy (LocalBanner has `role="status"` by default for success — adequate for SR, but need to test)
5. Interaction with future undo affordances (Aarti has mentioned undo as a Phase-2 polish)

These design questions are out of scope for a mechanical state-gap pass. Logging as the next state-coverage workstream after Aarti review.

### Class D — Submission-failure UX (0%) — **DEFERRED**

Per `docs/governance/component-depth-audits/dialog-banner-badge.md` headline: "Zero `aria-invalid`. Zero `FieldError`. Zero submission-failure paths."

PCE admin Add dialogs DO have `aria-invalid` + `FieldError` wired now (forms-input depth audit Recommendation 1 was completed and IS in place — see `terms/page.tsx`, `students/page.tsx`, `accommodations/page.tsx` etc. for the wired pattern). What's still missing:
- Server-side submission failures (network, conflict, validation-from-API) — but PCE prototype is mock-data with no async submit path, so this is forward-looking
- Disable-during-submit on the primary action (e.g., `Add term` button doesn't show a spinner while saving — instant local state mutation today)

**Deferred reason:** Mock data is synchronous. Forward-looking work — flag for the wire-up phase when API integration lands.

### Class E — Focus-visible coverage — **PASS**

- `FolderCard` (home, `app/(app)/page.tsx:55`): `focus-visible:ring-2 focus-visible:ring-ring` on hoverable path
- `EntityCard` (admin, `app/(app)/admin/page.tsx:92`): same
- DataTable rows: handled by vendored canonical (focus ring on hover-able rows; `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset` per `data-table/index.tsx:1196`)
- Analytics ScoreLandscape SVG bars: `tabIndex={0} role="button"` with Enter/Space activation — no visible ring is concerning. Logged as separate viz-focus gap (analytics/page.tsx:59 — `outline: 'none'` on `<g>` removes the default ring without replacement). Not fixed in this pass because adding focus styling to SVG `<g>` requires either an SVG `<rect>` ring or a CSS `:focus-visible` rule on the SVG — both need design review (visual scale + tier colour interaction).

### Class F — Disabled state contrast — **PASS (after Class B fix)**

`grep -rn "opacity-50\|opacity-60"` across PCE admin returns:
- `app/(app)/page.tsx:64` — `i.opacity-0 group-hover:opacity-100` on hover-revealed chevron icon (decorative, hidden by default, no contrast claim) — OK
- `app/(app)/admin/page.tsx:106` — same hover-revealed chevron — OK
- `components/data-table/index.tsx` — vendored, read-only

No surviving descendant-contrast risks after Class B fix.

### Class G — Selection-checkbox state — **PASS**

Handled inside the canonical DataTable (vendored). Visual state per `data-table/index.tsx` is consistent across all 15 PCE DataTable usages. No product-side overrides.

### Class H — Loading-state coverage — **PASS (forward-looking)**

- `my-surveys/page.tsx` already wraps content in `<Suspense fallback={<MySurveysSkeleton />}>` — pattern is established for when async data lands
- All other pages use sync mock data — no Skeleton needed today
- No `useEffect.*fetch` patterns found that lack Skeleton handling

### Class I — readonly states for LMS-managed entities — **PASS**

Per workspace ADR-002, when `MOCK_LMS_ENABLED = true`:
- Add buttons go disabled with explanatory Tooltip ("Managed by your LMS") — implemented at `terms/page.tsx:213-220`, `offerings/page.tsx:293-301`, `students/page.tsx:326-334`, `courses/page.tsx:172-180`, `faculty/page.tsx:133-141`
- Per-row Edit action goes disabled — implemented via RowActions `disabled: MOCK_LMS_ENABLED` flag
- LMS-sync indicator footer appears — implemented at `students/page.tsx:419-422`, `courses/page.tsx:218-221`

Consistent shape across 5 LMS-aware pages. No gaps.

---

## Fixes shipped (count: 7 files)

| File | Change |
|---|---|
| `apps/pce/admin/app/(app)/admin/assessment-types/page.tsx` | `emptyState` prop on DataTable |
| `apps/pce/admin/app/(app)/admin/faculty/page.tsx` | `emptyState` prop on DataTable (LMS-aware) |
| `apps/pce/admin/app/(app)/admin/offerings/page.tsx` | `emptyState` prop on DataTable (filter-aware) |
| `apps/pce/admin/app/(app)/admin/standards/page.tsx` | `emptyState` prop on DataTable (source-filter-aware) |
| `apps/pce/admin/app/(app)/admin/students/page.tsx` | `emptyState` prop on DataTable (LMS + filter-aware) |
| `apps/pce/admin/app/(app)/admin/terms/page.tsx` | `emptyState` prop on DataTable (LMS-aware) |
| `apps/pce/admin/app/(app)/admin/page.tsx` | EntityCard: `opacity-60` → `aria-disabled + bg-muted/30` |

---

## Deferred gaps (count: 2 classes)

| Class | Reason | Next step |
|---|---|---|
| C — Banner success-after-save (8 dialogs) | Needs Aarti's call on placement + timing + undo interaction | Spec out one canonical pattern, then propagate |
| D — Submission-failure UX | Mock data is synchronous; nothing to fail. Forward-looking | Revisit when API integration lands |

Additionally: SVG focus-ring on `ScoreLandscape` (analytics/page.tsx) — logged as a separate viz-focus gap, requires design review for visual treatment.

---

## Verification

```
$ cd /Users/romitsoley/Work/apps/pce/admin && pnpm typecheck
> @exxat/pce-admin@0.1.0 typecheck
> tsc --noEmit
(clean)
```

Student app pre-existing typecheck error in `studentUX/src/components/ui/badge.tsx` (vendored, not in scope).

---

## Files in scope (path inventory)

Admin app routes:
- `apps/pce/admin/app/(app)/page.tsx`
- `apps/pce/admin/app/(app)/layout.tsx`
- `apps/pce/admin/app/(app)/admin/page.tsx` *(edited)*
- `apps/pce/admin/app/(app)/admin/accommodations/page.tsx`
- `apps/pce/admin/app/(app)/admin/assessment-types/page.tsx` *(edited)*
- `apps/pce/admin/app/(app)/admin/competencies/page.tsx`
- `apps/pce/admin/app/(app)/admin/content-areas/page.tsx`
- `apps/pce/admin/app/(app)/admin/courses/page.tsx`
- `apps/pce/admin/app/(app)/admin/faculty/page.tsx` *(edited)*
- `apps/pce/admin/app/(app)/admin/offerings/page.tsx` *(edited)*
- `apps/pce/admin/app/(app)/admin/permissions/page.tsx`
- `apps/pce/admin/app/(app)/admin/standards/page.tsx` *(edited)*
- `apps/pce/admin/app/(app)/admin/students/page.tsx` *(edited)*
- `apps/pce/admin/app/(app)/admin/terms/page.tsx` *(edited)*
- `apps/pce/admin/app/(app)/analytics/page.tsx`
- `apps/pce/admin/app/(app)/moderation/page.tsx`
- `apps/pce/admin/app/(app)/my-surveys/page.tsx`
- `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx`
- `apps/pce/admin/app/(app)/programmatic-surveys/page.tsx`
- `apps/pce/admin/app/(app)/surveys/page.tsx`
- `apps/pce/admin/app/(app)/surveys/[id]/page.tsx`
- `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx`
- `apps/pce/admin/app/(app)/templates/page.tsx`
- `apps/pce/admin/app/(app)/templates/[id]/page.tsx`

Admin feature components (PCE-owned, not vendored):
- `apps/pce/admin/components/pce/ai-insight-card.tsx`
- `apps/pce/admin/components/pce/micro-trend.tsx`
- `apps/pce/admin/components/pce/pce-badges.tsx`
- `apps/pce/admin/components/pce/pce-modals.tsx`
- `apps/pce/admin/components/pce/pce-state.tsx`
- `apps/pce/admin/components/pce/response-gauge.tsx`
- `apps/pce/admin/components/pce/trend-sparkline.tsx`
- `apps/pce/admin/components/app-sidebar.tsx`
- `apps/pce/admin/components/command-palette.tsx`

Student app routes:
- `apps/pce/student/app/page.tsx`
- `apps/pce/student/app/layout.tsx`
- `apps/pce/student/app/surveys/page.tsx`
- `apps/pce/student/app/surveys/[id]/page.tsx`
- `apps/pce/student/app/surveys/[id]/submitted/page.tsx`
