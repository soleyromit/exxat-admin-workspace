# Gap Analysis — Aarti's Aug 12 Design Feedback vs. Current Build

- **Date:** 2026-08-17
- **Source:** Three linked Aarti sessions, 2026-08-12 — "Survey design and review — aspects, templates, and response rates" (9:30 AM, `d6d6e961-ff67-4643-8d74-70cfce33c870`), "Course evaluation survey — roles, status tracking, and response rate thresholds" (1:39 PM, `0ef80c33-115a-4909-b408-a7909785c41d`), "Survey completion dashboard and role-based admin design" (2:32 PM, `611feaa6-7e53-4ace-a0c6-f9e2ec00586c`). Raw transcripts pulled directly — Granola's participant metadata doesn't tag her by name on any of the three (see `project_aarti_granola_metadata_untagged` memory), so this required a content read, not a name search.
- **Method:** Explore-agent code audit of the live push wizard (`distribute-wizard/` — confirmed live via `app/(app)/surveys/push/page.tsx` imports, not the stale `courses-evaluatees/` paths the Aug 11 audits pointed at) and the term dashboard/results surfaces. Every line below is file:line cited.
- **Headline:** Most of Aarti's Aug 12 feedback was implemented within 24–48 hours (dated comments in the code confirm same-day and next-day turnaround). One item is a direct contradiction with an existing, named prior directive and needs her explicit resolution, not a silent pick.

---

## 1. Already resolved — no action needed

| Aarti's ask (Aug 12) | Current state | Verdict |
|---|---|---|
| Accordion → drawer (match Exam Management) | `step-survey-instances.tsx:2498-2502` — shared `FloatingSheetPanel` replacing per-row accordion, dated **2026-08-12**, same day as the ask | ✅ BUILT |
| One template per course, no multi-template complexity | `page.tsx:69-81` — all entry points retired 2026-08-12, comment cites "the reviewer's 'one template, one course' rule" | ✅ BUILT |
| Remove single faculty from an aspect without disabling the whole aspect | `step-survey-instances.tsx:1000-1013` — per-person checkboxes added 2026-08-13, comment explicitly cites this ask ("how I can add or remove") | ✅ BUILT |
| Already-evaluated instructor state must be clear | `step-survey-instances.tsx:1016-1033` — locked grayscale row, lock icon, "Already covered by a {status} survey opened {date}" tooltip | ✅ BUILT |
| Recipients summary is confusing/redundant, restructure | `step-review.tsx:85-94` — old aggregate row removed 2026-08-12, comment: "repeated content... could never say anything new" | ✅ BUILT |
| Faculty display: avatar + hover names, not count-only | `EvaluateeChipCluster`, `step-survey-instances.tsx:721-798` — `AvatarGroup` of `AvatarInitials`, name on hover, reopened 2026-08-13 citing this exact ask | ✅ BUILT |
| Actions attached to their data column, not buried in a menu | `term-workspace.tsx:384-449` — Remind/Extend/View-results as row buttons; only Preview sits in the overflow menu, with a 2026-08-14 comment removing a duplicate | ✅ BUILT |
| Dedicated completion/collection dashboard, separate from results, bundling reminder+extend | `term-workspace.tsx` (`course-evaluation/term/[termId]/page.tsx`) — exists, bundles both actions | ✅ BUILT |
| Extended-survey highlighting ("like a star or something") | `term-workspace.tsx:305-309` — literal `fa-solid fa-star` icon next to the close date, tooltip "Extended past the term's standard close" | ✅ BUILT — matches her wording exactly |
| Days-remaining shown alongside the extend decision | `term-workspace.tsx:314-316` — "closes today" / "Xd left" rendered directly under the deadline, in the same Closes column as the star | ✅ BUILT |
| Status-adaptive primary action (draft→preview, live→remind/extend, finished→review/view results) | `term-workspace.tsx:335-424` — exact draft/live/finished branching she described | ✅ BUILT |
| Faculty-specific dashboard (own course offerings, collection status, results) | `app/(app)/my-surveys/page.tsx`, `app/(app)/my-surveys/[id]/results/page.tsx`, `app/(app)/my-dashboard/page.tsx` | ✅ BUILT (predates this meeting — she was reviewing existing work) |

Thirteen items resolved, most within days of the meeting — several the code comments cite this transcript's Granola ID directly (`0ef80c33`). Worth naming as a pattern back to Aarti/Monil if useful — this cadence is working.

---

## 2. Contradiction — needs Aarti's explicit call, not a silent pick

### Response-rate validity: two-threshold red/orange/green vs. existing no-red rule

**What Aarti asked for (Aug 12, 1:39 PM):** two independently-editable percentages — a **minimum validity threshold** (below it, the survey can't be used in comparative analysis) and a **desired participation rate** — with **red / orange / green** color coding across the three bands.

**What's actually in the code:** `lib/pce-results.ts:260-264`, `rateColor()` — comment literally reads *"Response-rate text color — two tiers, no red (**aarti_no_red**): the spec's amber/red split below 70% collapses into a single amber tier."* This is a **named, dated prior Aarti directive** (the cross-product "no red in score/rating viz" rule, first stated 2026-04-28, reaffirmed at the Jun 10 PCE brief) already implemented as a single-cutoff, two-tier model.

**The conflict:** Aug 12's ask is explicit about three color bands including red for below-minimum-validity surveys. That's a different case than "red in a rating/score visualization" — it's a **data-quality/validity signal**, not a performance judgment. But the code comment shows this exact ambiguity was already resolved once, in the no-red direction, under her name. Building the Aug 12 model as literally described would silently reverse a rule that's currently cited as her own standing directive.

**Also not built:** the underlying two-threshold config itself doesn't exist anywhere — no `validityThreshold`/desired-participation pair. Current thresholds are all single cutoffs that disagree with each other across files: `AT_RISK_THRESHOLD = 60` (`pce-at-risk.ts:9`), `EVAL_RELEASE_THRESHOLD_PCT = 60` (`pce-mock-data.ts:130`), `RESPONSE_TARGET = 70` (`pce-term-metrics.ts:21`) vs `80` (`pce-analytics.ts:97`).

**Recommendation:** don't build any version of this without a direct Aarti/Monil confirmation on whether "invalid survey" red is exempt from the no-red rule, or whether the Aug 12 ask should be reinterpreted as amber/deep-amber instead of literal red. Flag both readings to her rather than picking one. This is the single highest-priority open item from the Aug 12 sessions.

---

## 3. Not built — real gaps, no prior contradiction

| Aarti's ask | Current state | Verdict |
|---|---|---|
| Response rate is survey-level (course + faculty combined), not per-aspect | `EvaluationInstance` still splits into `course_material` / `faculty_roles`, each with independent `responseRate` (`pce-mock-data.ts:11-29,361-365`) — closer to per-aspect than the survey-level model she described | 🔴 PARTIAL/CONTRADICTS — same class of issue as §2, worth bundling into the same resolution conversation since it's the same "how is response rate scoped" question |
| Board and grid status vocabulary must match exactly | `surveys-table.tsx:75-81` keeps 7 statuses distinct in the filter; `term-evaluations-board.tsx:85-100` and `surveys-hub.tsx:53-64` each collapse them differently (different casing, different bucketing) between board and hub | 🔴 NOT BUILT — the exact mismatch she called out is still live, just relocated |
| 5-role model (Super User / setup-admin / content-admin / Program Director / Course+Affiliation) | `UserRole = 'admin' \| 'faculty'` only (`pce-mock-data.ts:3`); the only multi-role construct is `step-report-access.tsx:17-34`'s 6-key results-visibility checklist, which is a per-template visibility matrix, not an RBAC/permission system | 🔴 NOT BUILT — no design work has started on this |
| Archive/deactivate a mistakenly-activated survey | `archiveSurvey`/`cancelSurvey` exist in state (`pce-state.tsx:140,146,271-279`) with `archivedAt` fields on the models, but **zero UI call sites** — unreachable from any screen | 🟡 PARTIAL (data layer only) — cheapest of the remaining gaps to close since the plumbing exists |
| Different Likert scales within one survey (3-pt satisfaction alongside 5-pt effectiveness) | `PceTemplate.likertPointer: 3\|4\|5\|7\|10` is one field per template (`pce-mock-data.ts:92-93`); no per-question override | 🔴 NOT BUILT — she called this "a must-have capability," not a nice-to-have |
| **Faculty avatar role-color-coding** — Program Director (program-wide visibility) shown in a distinct color from course-affiliated faculty | `components/pce/faculty-avatar-row.tsx:24-42` — its own header comment cites this exact meeting (`Granola 0ef80c33`) as the source for the avatar-consistency work, so the ask was read, but every avatar renders identically (`AvatarInitials`, no color branch). Data already exists to support it: `PceInstructor.position: string` (`pce-mock-data.ts:342`) carries `'Program Director'` as a literal value on real fixture data (`f3`, `pce-mock-data.ts:2358`) | 🟡 PARTIAL — narrowly missed; everything else in this ask shipped, only the color branch is absent. See §3a for a scoped fix. |
| Trend visualization: course rating vs. previous offering (not vs. static program average as a delta) | Not checked by this audit — flagged from the transcript, not yet verified against `results/[id]/page.tsx` or the analytics charts | ⚪ UNVERIFIED — needs a follow-up check before scoping |
| Percentile ranking alternative for comparing courses | Not checked | ⚪ UNVERIFIED |
| Smart nudge ("extend by 3 days → expect +2–3 completions") | Not checked | ⚪ UNVERIFIED |

---

## 3a. Scoped fix — faculty avatar role-color-coding

**Field to key off:** `PceInstructor.position === 'Program Director'` (string field, already populated on fixture data — no schema change). Distinguish from all other positions (Department Chair, Course Director, Clinical Coordinator, Core Faculty, Lab Instructor, etc.), which read as "course-affiliated" in Aarti's framing.

**Color choice — do NOT use `var(--brand-color)`.** [[feedback_ds_typography_color_discipline]] is explicit: brand-color is reserved for primary CTAs, never for semantic/identity states — the exact anti-pattern that caused a prior WCAG failure (pink-on-pink "Correct" badge). Note in passing: the "extended" star icon added this same meeting (`term-workspace.tsx:309`, `style={{ color: 'var(--brand-color)' }}`) already uses brand-color for a non-CTA indicator — a pre-existing instance of the same anti-pattern, out of scope for this fix but worth a follow-up grep sweep separately.

**Recommendation:** use a DS chart-family token (e.g. `var(--chart-2)` or another already-semantic token, confirm against `globals.css` at build time) for a colored ring or dot accent on the `AvatarInitials`, not a full background recolor — keep the initials legible. Per WCAG, color alone can't be the only signal: the existing per-avatar `Tip` (`faculty-avatar-row.tsx:33`) already carries the name on hover; extend its label to include the position ("Dr. Maria Williams — Program Director") so the distinction is available to screen readers and on hover, not just as a visual-only color cue.

**Scope:** single file (`faculty-avatar-row.tsx`), shared by both `term-workspace.tsx` (table) and `term-evaluations-board.tsx` (board) — fixing once fixes both surfaces consistently, in keeping with the file's own stated purpose. Run `ds-adoption-reviewer` before touching per Gate 1 (shared/governed component), and check `pce-ui-patterns.md` for any existing role-badge convention to reuse rather than invent a new one.

---

## 4. Suggested next step

1. **Take §2 to Aarti/Monil as an explicit either/or**, not a design decision made unilaterally: (a) keep no-red for validity states too, use amber/deep-amber instead of red/orange, or (b) treat data-validity red as a distinct exception to the rating-viz no-red rule. This also resolves the response-rate-scope question (survey-level vs. per-aspect) in the same conversation, since both hinge on the same underlying model.
2. **Board/grid vocabulary reconciliation** (§3) is a contained fix — pick one canonical status-label map and use it in both `term-evaluations-board.tsx` and `surveys-hub.tsx`.
3. **5-role model and mixed-Likert-scale support** are the two largest net-new items — both need their own design pass, not a quick patch. Recommend scoping as separate specs once §2 is resolved, since the role model may interact with report-access (`step-report-access.tsx`) and the archive-survey UI gap is cheap to close in the same pass (plumbing already exists).
4. Verify the three ⚪ UNVERIFIED items against `results/[id]/page.tsx` and the analytics chart components before scoping any visualization work.

Per workspace protocol: this is a static-code audit, not a design decision — no JSX should be written from this doc without running Gate 1 (vault + `pce-ui-patterns.md` + `ds-adoption-reviewer`) on whichever item gets picked up first, and §2/§3's role-model item should not proceed without Romit's explicit go-ahead per `feedback_no_unauthorized_consolidation`.
