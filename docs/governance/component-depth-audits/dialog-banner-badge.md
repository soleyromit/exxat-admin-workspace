# Dialog / Banner / Badge — Shallow-use audit (2026-05-11)

Sibling to `card.md`, `chart.md`, `key-metrics.md`, `tabs.md`. Same audit shape: workspace imports the DS component, but uses only the structural slot — skips validation slots, retry/action props, and the variant range.

---

## Dialog

### Library reality
**Source:** `/Users/romitsoley/Work/exxat-ds/packages/ui/src/components/ui/dialog.tsx`
**Library demo:** http://localhost:4000/library/dialog

Slots: `Dialog` (Radix Root), `DialogTrigger`, `DialogContent` (with `showCloseButton`, `overlayClassName`), `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` (with `showCloseButton`), `DialogClose`. Built-in: top-end ghost close button (44px target via icon-sm), backdrop with backdrop-blur, focus trap (Radix). Width capped at `sm:max-w-sm`, gap-4 internal. No validation slot — the slot for that is `Field` + `FieldError` from `field.tsx:176` (exported in DS index).

### Adoption snapshot
| Workspace | Total Dialog files | Contains form Inputs | Uses `aria-invalid` | Uses `FieldError` | Surfaces submission errors |
|---|---:|---:|---:|---:|---:|
| PCE admin | 10 | 8 | 0 | 0 | 0 |
| exam-mgmt admin | 13 | 5 | 0 | 0 | 0 |

**Zero `aria-invalid`. Zero `FieldError`. Zero submission-failure paths.** Validation is uniformly implemented as `disabled={!draft.x.trim()}` on the submit Button — a presence-of-text gate, not a validation surface. Required marker is a literal `*` in the label and `aria-required="true"` on Input; no error message ever renders.

### Per-file: validation depth

**PCE admin · entity Add dialogs** — `apps/pce/admin/app/(app)/admin/`:
- `courses/page.tsx:234-290` — Add master course (code, name, dept). Required fields gated only by submit `disabled` (line 284). No duplicate-code check, no max-length, no submission failure UX. **Fix:** wrap Input in `Field` + `FieldError`; set `aria-invalid={!!error}` on Input; show inline error when code collides with an existing master course id.
- `competencies/page.tsx:216-256` — Add competency. Same shape. `aria-required` on line 225/239 but no error surface.
- `content-areas/page.tsx:181-234` — Add content area. Same.
- `offerings/page.tsx:298-410` — Add course offering (master course + term + faculty + section number). Three required dropdowns + section number Input (line 385) with no numeric validation. **Highest risk** Dialog: 4 required fields + 1 numeric field, all silent.
- `permissions/page.tsx:272-338` — Grant role. Faculty + role gates submit. Scope sub-form not validated.
- `standards/page.tsx:182-217` — Add standard. Same gate pattern.
- `students/page.tsx:309-396` — Add student (studentId, firstName, lastName, email, phone). **Email and phone get no format check at all** (lines 343, 354). Disabled gate is `.trim()` only.
- `terms/page.tsx:196-260` — Add term (name, AY, startDate, endDate). `startDate < endDate` ordering not enforced; if user picks Dec 1 → Jan 1, no warning.
- `accommodations/page.tsx:260-336` — Add custom accommodation (code/name/etc.). Same pattern.

**PCE admin · workflow dialogs** — `apps/pce/admin/components/pce/pce-modals.tsx`:
- `DeleteTemplateDialog` (line 140) — confirmation only, no form. Correct shape; but the hand-rolled warning strip at `pce-modals.tsx:152-160` is a Banner-imposter (see Banner section below).
- `CloseSurveyDialog` (line 368) — confirmation, no form. Correct shape.
- `ReleaseBulkDialog` (line 554) — confirmation, no form. Correct shape.

**exam-mgmt admin · workflow dialogs** — `apps/exam-management/admin/components/`:
- `add-accommodation-modal.tsx:160-440` — **multi-step** form (step 1 student search, step 2 type + custom note, step 3 dates). Step validation is per-step `canAdvanceStep1` / `canAdvanceStep2` (lines 422, 431). No `aria-invalid`; no per-field error. Custom note Input at line 301 and date Input at line 392 have zero error surface. **This is a Sheet candidate** (multi-step with date pickers > 600px content).
- `create-assessment-modal.tsx:125-410` — multi-step (basics → schedule → access). Six Inputs across steps (lines 151, 162, 247, 263, 333, 339, 348, 354). Submit gated by `canAdvanceStep1/2 && canSubmit` (line 407) but no field-level errors. **Sheet candidate** — same shape as `CreateTemplateSheet` and `CreateSurveySheet` in PCE which correctly chose Sheet.
- `assign-practice-dialog.tsx:99-260` — assignment form with target count, due-date, note Textarea. `canSubmit` gate (line 254). The "+1 …" composed action label on line 206 is the kind of stringly-joined affordance that hides error states.
- `intervention-dialog.tsx:67-210` — multi-step intervention with Textarea note. Validation: none — the `Assign practice` button never disables. Submission failure unhandled.
- `ai-generate-modal.tsx:121-440` — AI question generator. Inputs for prompt/objective + count. The "drafts are starting points" notice at line 290 is a Banner-imposter (see Banner section).

### Dialogs that should be Sheets
Rule of thumb (DS demo intent): Dialog = short confirmation (1–3 fields, no multi-step). Sheet = multi-step form, > 4 fields, or anything with date pickers + searchable selects.

- `apps/exam-management/admin/components/add-accommodation-modal.tsx` — 3 steps, dates, custom note. **Convert to Sheet.**
- `apps/exam-management/admin/components/create-assessment-modal.tsx` — 3 steps, schedule, access. **Convert to Sheet.** PCE already uses Sheet for the analogous CreateSurvey at `apps/pce/admin/components/pce/pce-modals.tsx:213-301` — parity argument.
- `apps/pce/admin/app/(app)/admin/offerings/page.tsx:298-410` — borderline. 4 required selects + section number. Either keep Dialog and add validation, or upgrade to Sheet for room.
- `apps/exam-management/admin/components/intervention-dialog.tsx` — borderline; if intervention grows beyond note + 2 checkboxes, move to Sheet.

### Missing Dialogs (modal-shaped UX without Dialog)
None found in this pass at the admin entity level. PCE entity pages correctly route all "Add X" / "Delete X" through Dialog. The destructive actions in `DropdownMenuItem variant="destructive"` (e.g., `accommodations/page.tsx:363`) trigger `handleArchive` (`courses/page.tsx:85`) **without a confirmation Dialog** for the archive/reactivate flip — that's an intentional toggle, not a missing Dialog.

### Recommended next 2 fixes
1. **Wire `Field` + `FieldError` into the 8 PCE entity Add dialogs.** Start with `students/page.tsx:309` (email/phone format) and `terms/page.tsx:196` (date ordering). Replace the bare `<Field>` wrappers with `Field` blocks that render `FieldError` when `aria-invalid={!!errors.foo}` fires. Add a state `errors: Record<keyof draft, string|undefined>` and validate on blur + submit.
2. **Convert `add-accommodation-modal.tsx` and `create-assessment-modal.tsx` to Sheets.** Both are 3-step forms — Dialog's `sm:max-w-sm` ceiling is fighting the content. PCE's `CreateSurveySheet` is the reference shape.

---

## Banner

### Library reality
**Source:** `/Users/romitsoley/Work/exxat-ds/packages/ui/src/components/ui/banner.tsx`
**Library demo:** http://localhost:4000/library/banner

Two exports:
- `SystemBanner` — full-width strip for top of app. 5 variants (info / warning / error / success / promo). Props: `title`, `dismissible` (default true), `onDismiss`, `action` (`label` + `href` or `onClick`), `actionPosition` (`inline` | `bottom`), `icon` override. role/aria-live set per variant.
- `LocalBanner` — inline page-section alert. Same 5 variants. Props: `title`, `dismissible` (default false), `onDismiss`, `action`, `retry` (`label` + `onClick` — built-in retry icon `fa-arrow-rotate-right`), `icon` override.

Built-in icons (info/warning/error/success/promo → fa-circle-info / fa-triangle-exclamation / fa-circle-exclamation / fa-circle-check / fa-star-christmas). Color: `border-{tint}-500/30 bg-{tint}-500/5` for LocalBanner; darker `bg-{tint}-900` for SystemBanner so contrast holds on full-width.

### Adoption snapshot
| Workspace | LocalBanner usages | SystemBanner usages | Hand-rolled info strips |
|---|---:|---:|---:|
| PCE admin | 2 | 0 | **9** |
| exam-mgmt admin | 2 | 1 | **3** |

### Banner-shaped hand-rolls (the high-value find)

These are raw `<div>` blocks with `fa-circle-info` / `fa-triangle-exclamation` / `fa-circle-check` + a tinted background. Every one of them is a `<LocalBanner>` waiting to be replaced.

**PCE admin — "LMS integration is OFF" footnote (8 copies of the same string)** — these are all `<p className="text-xs text-muted-foreground">` with `fa-light fa-circle-info` icon, not tinted backgrounds:
- `app/(app)/admin/courses/page.tsx:224-227`
- `app/(app)/admin/terms/page.tsx:187-189`
- `app/(app)/admin/offerings/page.tsx:288-290`
- `app/(app)/admin/students/page.tsx:299-301`
- `app/(app)/admin/permissions/page.tsx:263-265`
- `app/(app)/admin/accommodations/page.tsx:251-253`
- `app/(app)/admin/faculty/page.tsx:157-159`
- `app/(app)/admin/assessment-types/page.tsx:103-105`

These are **borderline**. They are not banner-shaped (no tint, no border), they're footnote-shaped — a soft annotation, not an alert. **Verdict:** keep as-is. They are intentionally quiet because the user is *expected* to know LMS is off. Forcing a LocalBanner here would visually shout 8 times per session.

**PCE admin — real Banner imposters:**
- `apps/pce/admin/components/pce/pce-modals.tsx:152-160` (inside `DeleteTemplateDialog`) — raw div with `border: 1px solid var(--pce-impact-border)`, custom `var(--pce-impact-bg)`, `fa-triangle-exclamation text-destructive`. **Should be `<LocalBanner variant="warning">`** with the survey count. Currently uses bespoke `--pce-impact-*` tokens; LocalBanner's `warning` variant already provides amber-tinted border/bg/fg. Net: deletes 3 lines of inline style + standardizes role="alert" announcement.

**exam-mgmt admin — real Banner imposters:**
- `apps/exam-management/admin/app/(app)/courses/[id]/tabs/accommodations-tab.tsx:69-79` — `<section className="rounded-xl border border-chart-1/22 bg-chart-1/5 p-3 flex items-start gap-3">` with `fa-circle-info text-chart-1` + title + body. **Pure LocalBanner info variant.** Should be `<LocalBanner variant="info" title="Accommodations are managed by Student Services">…</LocalBanner>`.
- `apps/exam-management/admin/components/ai-generate-modal.tsx:289-293` — `<section className="rounded-lg border border-chart-1/22 bg-chart-1/5 p-3 flex items-start gap-3">` with `fa-circle-info text-chart-1` and disclaimer copy. **Pure LocalBanner info variant.**
- `apps/exam-management/admin/components/question-editor/question-editor.tsx:1217-1224` — two adjacent inline strips with `fa-circle-exclamation text-destructive` and `fa-circle-info text-chart-4`. The first is `LocalBanner variant="error"`; the second is `LocalBanner variant="info"`. Currently both are open `<div>` blocks with no role.

**Tally:** 3 hard-imposter sites in exam-mgmt admin + 1 in PCE = 4 high-value Banner conversions. (The Card audit's "5 of 22 Card-imposters were Banner candidates" is reachable once `courses/[id]/tabs/accommodations-tab.tsx`, the AI generator notice, the question-editor error and info strips, the AI generator full Card-wrapped "drafts are starting points" notice, and the pce-modals warning strip are migrated — overlap accounted for.)

### Verify recent PCE additions (2026-05-11)

- **`apps/pce/admin/app/(app)/analytics/page.tsx:485-497`** — `<LocalBanner variant="warning" title="Mixed templates in scope">`. **Correct.** Warning is the right variant for a guard-rail that flags partial-coverage section averages — it's a soft alert, not an error. `title` is used. No `dismissible` (correct — the condition is intrinsic to the scope and should remain visible). No `action` (defensible — the user resolves it by narrowing the scope filter, not by clicking the banner). **Verdict:** ship as is.

- **`apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx:109-111`** — `<LocalBanner variant="info" title="Hide individual comments…">…</LocalBanner>`. **Almost correct, but the title is doing double duty.** The whole moderation instruction is in `title`, and the `children` ("Hidden comments remain in the system and are never deleted.") is the supporting note — so the bold "title" is a full sentence and the muted body is a clarifier. Per banner.tsx:288-291 the title is `font-semibold leading-tight` and the children are `opacity-90` — that pairing was designed for short-title + supporting-body, not full-sentence + footnote. **Recommend:** swap. Title = `"Comments are private until release"`. Body (children) = `"Hide individual comments to remove them from the faculty view before releasing results. Hidden comments remain in the system and are never deleted."` Same content, the heading-vs-body hierarchy now matches the DS intent.

### Recommended next 2 fixes
1. **Convert the 3 exam-mgmt info strips** (`accommodations-tab.tsx:69-79`, `ai-generate-modal.tsx:289-293`, `question-editor.tsx:1217-1224`) to `<LocalBanner>`. Cuts 30+ lines of bespoke tint markup and standardizes role="status" / "alert" announcement.
2. **Tweak the surveys/responses LocalBanner title** to read as a heading not a full sentence (see above). Three-word change.

---

## Badge

### Library reality
**Source:** `/Users/romitsoley/Work/exxat-ds/packages/ui/src/components/ui/badge.tsx`
**Library demo:** http://localhost:4000/library/badge

`badgeVariants` cva, variants: `default` (primary bg), `secondary` (secondary bg), `outline` (border-border, transparent bg), `destructive` (destructive/10 bg + destructive fg, dedicated `aria-invalid` ring), `ghost` (transparent until hover), `link` (underline on hover). Base shape: `rounded-4xl` (pill). Override to rectangular via `className="rounded"` (DS convention from `/CLAUDE.md` §8). Supports `asChild`. `data-variant` attribute on the element for downstream styling.

### Variant adoption breakdown

Counted from `<Badge variant="…">` occurrences (excludes Button/DropdownMenuItem variant props which are noise in the original grep):

| Product | default | secondary | outline | destructive | ghost | link |
|---|---:|---:|---:|---:|---:|---:|
| PCE admin | 1 | 9 | 5 | **0** | 0 | 0 |
| exam-mgmt admin | 0 | ~28 | ~3 | **0** | 0 | 0 |

The pattern is the same in both products: **`secondary` is the default reach**, `outline` is the second tier, `destructive` is never reached for, and `default` / `ghost` / `link` are unused except for one count chip (PCE sidebar moderation pending badge — `apps/pce/admin/components/app-sidebar.tsx:176-181`).

### Wrong-variant usages

- `apps/exam-management/admin/components/qb/badges.tsx:14-22` — `StatusBadge` renders both `Saved` (success) and `Draft` (in-flight) as `variant="secondary"` with inline-style overrides via `var(--qb-status-saved-*)` / `var(--qb-status-draft-*)`. **The variant is doing no work** — the entire visual is style-overridden. If `Saved` ever flipped to `Failed`, the wrapper would still render `secondary` + a red inline style, breaking the destructive ring + focus contract from `badge.tsx:16`. **Recommended:** keep `secondary` for `Saved` (positive but quiet); use `destructive` for any failure status added later; drop the inline-style border once status tokens are removed.
- `apps/pce/admin/app/(app)/admin/competencies/page.tsx:138` — `<Badge variant={row.status === 'active' ? 'secondary' : 'outline'}>` for active/inactive. **Defensible.** `outline` for inactive is correct DS-speak (de-emphasized).
- `apps/pce/admin/app/(app)/admin/content-areas/page.tsx:118` — same pattern. Defensible.
- `apps/pce/admin/app/(app)/admin/standards/page.tsx:122` — same pattern. Defensible.
- `apps/pce/admin/app/(app)/admin/accommodations/page.tsx:149,160` — same active/inactive pattern. Defensible.
- `apps/pce/admin/app/(app)/admin/permissions/page.tsx:38` — `ROLE_BADGE_VARIANT` maps roles to `default | secondary | outline`. **Good.** Differentiates owner (default) from contributor (secondary) from viewer (outline).
- `apps/pce/admin/app/(app)/analytics/page.tsx:651-657` — at-risk **count** badge as `variant="secondary"` with inline brand-tint style. The count is meant to flag risk (at-risk courses below 3.7 avg), but the styling overrides drop the badge into the brand color. **Per memory `feedback_aarti_no_red.md`** Aarti dislikes red in score viz — so `destructive` is contraindicated here anyway. **Verdict:** keep `secondary` + brand-tint; the visual semantic is "count of items needing attention", not "error". This is correct.
- `apps/exam-management/admin/app/(app)/assessments/[id]/monitor/live-monitor-client.tsx:557` — `variant="secondary"` with inline `var(--chart-4)` background for a "flagged" state. The variant is again ignored. **No functional bug**, but the `data-variant="secondary"` attribute lies to downstream styling.

**Pattern across both products:** the Badge is used as a *shape* (pill), and the *color semantic* is layered on top via `className` + `style`. The `variant` prop is treated as a stylistic ceiling, not a semantic. The DS expectation per `badge.tsx:8` is that `variant="destructive"` carries the `aria-invalid` ring contract — but **no usage in the workspace ever reaches for `destructive`**, even for genuinely failed/error states (e.g., `QStatus = 'Failed'` would be added someday and silently render in brand color via the inline-style channel).

### SurveyStatusBadge wrapper

**File:** `apps/pce/admin/components/pce/pce-badges.tsx:46-61`

Maps 6 statuses (`draft`, `active`, `collecting`, `pending_review`, `released`, `closed`) → all rendered as `<Badge variant="secondary">` with inline-style overrides + a leading colored dot. The variant is decorative — **every status flattens to `secondary`** even when semantic warrants it:

| Status | Current variant | Semantic | Should be |
|---|---|---|---|
| `draft` | secondary + draft tokens | "not yet active" | `outline` |
| `active` | secondary + brand-tint | "currently in use" | `secondary` (correct) |
| `collecting` | secondary + collecting tokens | "in progress" | `secondary` or `default` |
| `pending_review` | secondary + pending tokens | "needs admin action" | `default` (CTA-color — draws the eye) |
| `released` | secondary + green tokens | "completed successfully" | `secondary` (correct) |
| `closed` | secondary + muted tokens | "archived" | `outline` |

**Verdict:** the wrapper flattens semantics in two ways: (1) `draft` and `closed` should be `outline` to read as de-emphasized; (2) `pending_review` is the only status with a user action attached (admin must release) — using `variant="default"` would actually pull the eye to it in dense tables. The current implementation makes every status the same visual weight, with only the dot color discriminating them. The colored dot is doing 100% of the work — strip the styling override on draft/closed and let `outline` carry it.

Also: no `destructive` is ever surfaced. There is no failure status in the survey lifecycle (`response_window_failed` or similar), but if one were added (e.g., "failed to deliver to faculty"), the wrapper has nowhere to put it. **Recommend adding** a `failed` mapping that returns `<Badge variant="destructive">` and removing the inline-style override for that case — let the DS handle the contrast contract.

### Recommended next 2 fixes
1. **Rework `SurveyStatusBadge` to actually use variant semantics:** `draft` → `outline`, `closed` → `outline`, `pending_review` → `default`. Drop the inline-style overrides on those three. Keeps the dot for status differentiation but lets the badge shape carry the urgency cue.
2. **Audit the exam-mgmt `StatusBadge` (qb/badges.tsx:10)** for forward-compatibility: define a `'Failed'` status path now that renders `<Badge variant="destructive">` so the moment a question-bank ingest fails, the DS contrast contract holds. Currently the type `QStatus` only has `'Saved' | 'Draft'` — extend or document the convention.

---

## Combined: 3 highest-leverage actions

1. **Add validation to PCE entity-admin Add dialogs.** 8 dialogs (`courses/`, `competencies/`, `content-areas/`, `offerings/`, `permissions/`, `standards/`, `students/`, `terms/`, `accommodations/`) currently gate submit by `.trim()` only. Wire `Field` + `FieldError` from `exxat-ds/packages/ui/src/components/ui/field.tsx:176` + `aria-invalid` per Input. Start with `students/page.tsx:309` (email format) and `terms/page.tsx:196` (date ordering) — both have real user-input failure modes today. **Impact:** unlocks the validation surface for all future entity admin work; no DS source changes needed.

2. **Replace 4 inline info/warning strips with `<LocalBanner>`.** Specific sites: `apps/pce/admin/components/pce/pce-modals.tsx:152-160` (warning), `apps/exam-management/admin/app/(app)/courses/[id]/tabs/accommodations-tab.tsx:69-79` (info), `apps/exam-management/admin/components/ai-generate-modal.tsx:289-293` (info), `apps/exam-management/admin/components/question-editor/question-editor.tsx:1217-1224` (error + info, two adjacent). **Impact:** -40 lines of bespoke tint markup, +4 sites with correct role="alert" / "status" announcement.

3. **Rework `SurveyStatusBadge` (pce-badges.tsx:46) to use variant semantics not flattened `secondary`.** `draft`/`closed` → `outline`; `pending_review` → `default`; keep dot for color differentiation; drop inline-style overrides on those three. **Impact:** dense survey tables get a real visual hierarchy (pending_review pulls the eye); aligns with workspace `feedback_viz_first.md` ("viz must answer alone") because the variant + dot together carry urgency without text.

---

## What audit can't see
- Whether Dialog submission paths actually fail in production (no backend integration tests in the workspace; all dialogs persist to local `useState` only).
- Whether `LocalBanner` copy matches the brand voice (only Aarti / stakeholder review).
- Whether the `default` variant's strong CTA color on `pending_review` actually reads correctly against the survey-list table background (needs visual diff against `surveys/page.tsx` rendered density).
- Whether `outline` on `draft`/`closed` reduces scan-ability below the threshold where users miss those rows entirely (need quick usability check — flip 3 badges and let it sit for a day).
- Whether the existing `--qb-status-*` tokens are still in use elsewhere (e.g., StatusPill in courses/students-tab) — token cleanup may need a separate pass.
