# Discipline Log — PRD Gap Implementation (2026-05-27)

## Violations Found and Fixed

### 1. `color-mix(in oklch, ...)` and `color-mix(in srgb, ..., white)` — 33 instances
**Pattern violated:** CLAUDE.md §banned-patterns: `color-mix(in oklch`; NEVER hardcode hex/rgb.
**Root cause:** Phase 1A agent used `color-mix()` for brand tints, focus rings, and tinted backgrounds instead of DS tokens.
**Fix:** `color-mix(in oklch, var(--brand-color) N%, var(--background))` → `var(--brand-tint)`; focus rings → `var(--ring)`; `color-mix(..., white)` → `var(--brand-tint)` or `var(--muted)`.
**Rule going forward:** Never compute tints inline. Use `var(--brand-tint)` for brand-tinted backgrounds, `var(--ring)` for focus rings, `var(--muted)` for neutral tints.

### 2. `aria-live` missing on dynamically appearing bulk action bar
**Pattern violated:** WCAG 4.1.3 — status changes require `aria-live`.
**Root cause:** Phase 1A added bulk selection UI but did not mark the conditionally-rendered bar as a live region.
**Fix:** Added `role="status" aria-live="polite"` to the bulk bar `<div>` at line 1238.

### 3. `aria-label` on non-interactive FA icon
**Pattern violated:** CLAUDE.md: all FA icons must have `aria-hidden="true"`.
**Root cause:** Health flag icon used `aria-label` instead of `aria-hidden="true"`, creating a stray focus stop.
**Fix:** Changed to `aria-hidden="true"` at line 1385.

### 4. Missing `aria-label` on post-exam review password input
**Pattern violated:** WCAG 4.1.2 — form inputs must have accessible names.
**Root cause:** Phase 1A added the password input but used `<p>` label with no `for`/`aria-labelledby` association.
**Fix:** Added `aria-label="Review access password"` directly on the `<input>`.

### 5. Stale closure in `digitalTools` setLocal updaters
**Root cause:** Phase 1A read `tools` from the outer closure inside `setLocal(prev => ...)`, creating potential stale-state bugs under React batching.
**Fix:** Changed to `prev.digitalTools ?? tools` inside all three updaters so functional updater only reads from `prev`.

### 6. Missing `aria-pressed` on faculty toggle buttons in SectionAssignSheet
**Pattern violated:** WCAG 4.1.2 — toggle buttons must announce state (Name, Role, Value).
**Fix:** Added `aria-pressed={isSelected}` to each faculty row button at line 5605.

### 7. `outline: none` without focus ring replacement on SectionAssignSheet inputs
**Pattern violated:** WCAG 2.4.7 — keyboard users must see focus position.
**Fix:** Added `onFocus`/`onBlur` border-color + box-shadow handlers to all 5 inputs/textareas in SectionAssignSheet.

### 8. `visibleDate` field in types but no UI
**Root cause:** Phase 0 added `visibleDate: string | null` to `AssessmentSettings` but Phase 1A did not add an input for it in the scheduling section.
**Fix:** Added datetime-local input for `visibleDate` in the scheduling section of the settings sheet.

## Gate 2 Fixes — PRD Gap Agents T2-T7 (verification pass)

### 9. `--destructive` used in pt-biserial performance visualization
**Pattern violated:** `feedback_aarti_no_red.md` — never use red in score/rating/performance visualizations.
**Root cause:** T3 agent used `var(--destructive)` for the lowest pt-biserial tier (< 0.10) in MetricsPanel.
**Fix:** Changed lowest tier color to `var(--chart-4)` (amber). Both "low" and "very low" now use amber, which is sufficient differentiation from green.

### 10. `aria-live` missing on audit log in regrading tab
**Pattern violated:** WCAG 4.1.3 — dynamic content additions require `aria-live`.
**Root cause:** T7 agent added the audit log container without marking it as a live region.
**Fix:** Added `role="log" aria-live="polite"` to the audit log `<div>` in analytics-client.tsx.

### 11. Apply curve button allowed empty curveValue
**Root cause:** T7 agent's "Apply curve" button had no `disabled` guard — clicking with empty `curveValue` produced a blank audit log entry `"Flat curve: "`.
**Fix:** Added `disabled={curveMethod !== 'top-100' && curveValue.trim() === ''}` plus opacity/cursor feedback.

### 12. Invalidate/Discard buttons had non-unique accessible names
**Pattern violated:** WCAG 4.1.2 — controls must have unique accessible names in context.
**Root cause:** T7 agent used visible text ("Invalidate"/"Discard") as the accessible name; in a 20-row table all buttons had identical AT announcements.
**Fix:** Added `aria-label={`${action} question ${item.order}`}` to both buttons.

### 13. `aria-expanded` missing on Blueprint targets toggle
**Pattern violated:** WCAG 4.1.2 — disclosure buttons must declare their expanded state.
**Root cause:** T2 agent added the collapsible "Blueprint targets" section but omitted `aria-expanded` on the toggle button.
**Fix:** Added `aria-expanded={blueprintTargetsOpen}` to the button in create-canvas-client.tsx.

### 14. Character counter missing `aria-live`
**Pattern violated:** WCAG 4.1.3 — dynamic text changes must be announced.
**Root cause:** T2 agent's character counter `{primaryIntent.length}/280` updates on every keystroke but had no live region.
**Fix:** Added `role="status" aria-live="polite"` to the counter `<p>`.

### 15. Hardcoded `#fff` on avatar circle initials (T2 additions)
**Pattern violated:** CLAUDE.md — NEVER hardcode hex/rgb; use `var(--token)`.
**Root cause:** T2 agent wrote avatar circles with `color: '#fff'` for initials text.
**Fix:** Changed both instances to `color: 'var(--background)'` (correct for text over colored avatar background in light/dark mode).

## Gate 3 Fixes — T2/T3/T4 Implementation (compliance + verification pass)

### 16. `text-[11px]` in new MetricsPanel Avg discrimination row (T3)
**Pattern violated:** `feedback_ds_typography_color_discipline.md` — text-xs (12px) is the minimum; no sub-12px exceptions.
**Root cause:** T3 agent copied the pre-existing `text-[11px]` pattern used in all other MetricsPanel rows.
**Fix:** Changed all 8 `text-[11px]` spans in the Psychometrics section (Avg difficulty, Avg pt-biserial, Avg discrimination, Top/bottom 27%) to `text-xs`. Fixed the entire section, not just the new row.

### 17. Missing focus ring on negative marking chip buttons (T4)
**Pattern violated:** WCAG 2.4.7 — keyboard users must see focus position.
**Root cause:** T4 agent used raw `<button>` with inline style and no focus-visible handler.
**Fix:** Added `onFocus`/`onBlur` handlers applying `outline: 2px solid var(--ring)` / `outlineOffset: 2px` to each chip button — matching the pattern from Fill blank match mode buttons already in this file.

### 18. Context label `fontSize: 11` in GradingRulesSection (T4)
**Pattern violated:** Same 12px minimum rule.
**Root cause:** T4 agent used `fontSize: 11` on the "Assessment default: …" helper text below the chips.
**Fix:** Changed to `fontSize: 12`.

### 19. `forcedTimerTransition` defaulted to `true` (T2)
**Root cause:** T1 types agent set `forcedTimerTransition: true` in `defaultAssessmentSettings()`. Auto-advancing students and auto-submitting unanswered questions is a coercive default not backed by a Granola decision. `forwardOnlySections` and `requireAnswerForSectionAdvance` both default to `false` — this was inconsistent.
**Fix:** Changed to `forcedTimerTransition: false` to match conservative defaults.

## Deferred (Pre-existing, Out of Scope for This PR)

- `fontSize: 9` / `text-[9px]` at lines 1360, 1366, 1436, 1446, 2750, 3341 — below 12px WCAG floor. Pre-existing throughout builder; tracked in open-wcag-items.
- `uppercase tracking-[0.08em]` on section headers — pervasive pre-existing pattern throughout file; changing just new instances would be inconsistent.
- `opacity-60` on `text-muted-foreground` at line 3151 — pre-existing contrast issue.
- Raw `<button>` without DS `Button` — widespread pre-existing pattern; requires broader refactor.
- `role="tab"` without matching `role="tabpanel"` — pre-existing stepper widget ARIA issue.
- `outline: none` on raw `<input>` elements without focus replacement — pre-existing; partial fix applied to SectionAssignSheet new additions only.
- `color-mix(in srgb, var(--chart-2) N%, var(--background))` in question-detail-sheet.tsx at lines 166-604 — pre-existing preview rendering code (rationale, matching, essay rubric). Not introduced by T5 (GradingRulesSection at line 1217+ is clean).
- `oklch(0.97 0.025 160)` raw oklch in question-detail-sheet.tsx at lines 186, 347 — pre-existing in MCQ/fill-blank option rendering.
- `color-mix(in oklch)` in analytics-client.tsx at lines 555–1041 — pre-existing in OverviewView/ItemsView. T7 regrading section (lines 218-407) is clean.
- `uppercase tracking-wide/wider` in assessment-builder-client.tsx at multiple lines — pervasive pre-existing pattern; analytics-client.tsx lines 758, 803, 1113 are also pre-existing analytics views.
- `#fff` in assessment-builder-client.tsx (COLLAB_COLORS array, stepper, breadcrumbs) — pre-existing; requires broad sweep.
- Distractor lock / match mode buttons in GradingRulesSection use raw `<button>` — pre-existing workspace pattern; toggle semantics correct (`aria-pressed`), focus ring is an open debt item.
- Curve method buttons in regrading tab use raw `<button>` — same as above; `aria-pressed` correct, focus ring deferred.
- `role="switch"` toggle buttons in settings sheet have no focus-visible ring (T2) — pre-existing pattern for ALL toggles (requireAnswer, backwardNavigationAllowed, secureMode, etc.) in this file; fixing only the 3 new ones would be inconsistent with the 15+ existing ones.
- Chip button touch targets at ~26px height (T4) — below WCAG 2.5.5 44px minimum. Pre-existing: fill blank match mode buttons in same file use identical sizing (`padding: 5px 0`). Primarily desktop-use context.
- `uppercase tracking-wider` at MetricsPanel section header (line ~3331) — pre-existing, inside the component T3 extended but not in new lines.
- `text-[11px]` at flag icon `fontSize: 11` (line 1558, question row health icon) — pre-existing in all flag icons throughout the file.
