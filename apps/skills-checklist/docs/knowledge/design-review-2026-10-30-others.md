# Design review: reviewer, director, student, evaluator, course faculty (2026-10-30)

Reviewer: skills-ux-critic, read-only. Saved by the coordinator.

- **Scope:** recommended variants, at 1440 (student and evaluator also at 375).
- **Screenshots:** `apps/skills-checklist/admin/docs/knowledge/design/review-shots/others/`.
- **Not verified:** runtime interactions, axe, visual diff, 1920 width, loading and error states.

## Cross-screen patterns

- **CP-1. Negative outcomes are grey for staff but amber for students.** Counted and Unmet (reviewer record), Ready and Changed-since-verified (director) look the same. Only `RECORD_STATE_META.unqualified` carries the warning tone (`lib/v2/labels.ts`). Fix: use one tone map, amber for not-counted or attention, across all personas.
- **CP-2. Four words for one idea:** "Did not count", "Unmet", "Not yet" and "Evidence does not qualify", stacked in one row. Fix: lead with the one student-facing phrase. Show the engine word only in the explanation, and only when it changes the action.
- **CP-3. Dead or constant columns.** Reviewer Students: Status is "Waiting 8+ days" on every row. Director Readiness: In progress and Does not qualify are zero for everyone. Check-off: 3 of 6 columns are all "-". Fix: suppress or collapse them.
- **CP-4. Dead canvas at 1440** on skill detail, my-requests, offline and review item. Fix: balance the columns.
- **CP-5. Helpers that don't name their subject.** Send has two identical "What the evaluator checks" rows with no skill name. Check-off headers carry unexplained clock and ⓘ glyphs. The evaluator form reads "Maya rated With assistance" (casing).
- **CP-6. Verdict numbers set flat.** Director Readiness puts Attainment % last, left-aligned and at the same weight as everything else. Reviewer "Required achieved" mixes denominators. Fix: right-align numbers and emphasise one verdict number per row.

## Top 10 issues

1. **Course check-off: a cell shows both an empty checkbox and a "qualifying evidence" check badge,** and the empty state shows no commit control. (Coordinator note: the record bar appears once something is ticked. Ticking a cell that already has evidence is the prototype's intent, so this needs Romit's call.)
2. CP-1 grey negatives (reviewer, director).
3. Reviewer approvals mixes three action layouts in one unlabelled column, says "35" twice, and uses two names for the unverified-evaluator state.
4. Director Readiness has zero columns, and Attainment % comes last and flat.
5. Constant and dead columns (CP-3).
6. Four synonyms for "did not count" (CP-2).
7. The director dashboard has two competing hero numbers (31 Complete and 29 ready to verify). Its square strip encodes only one band. The worklist's trailing value mixes a gap count with a skill name.
8. Send shows two "What the evaluator checks" rows without the skill name.
9. Dead canvas at 1440 (CP-4).
10. The attainment matrix uses a 4-step brand-pink scale. The invitation email's subject says "3 skills" while the body says "2 requests".

## Per screen (short)

| Screen | Issues |
|---|---|
| Reviewer approvals | Action column; 35 shown twice; "Not yet recorded" vs "Not named yet"; four-figure metric strip competes with the table |
| Review item (strongest reviewer screen) | "Asked" header should read "Question / Evaluator answer"; whitespace |
| Reviewer students | Constant Status column; mixed denominators |
| Reviewer student record | Counted and Unmet both grey; "Request a correction" on all 9 rows (move it into an overflow menu) |
| Director dashboard | Competing heroes; strip encodes one band; mixed trailing values |
| Director Attainment tab | Pink 4-step scale; "0 short" zero bucket |
| Director Readiness tab (weakest) | Zero columns; Attainment % flat and last; left-aligned numbers |
| Verification detail (strongest director screen) | Use as the model |
| Student My progress | 5-state glyph legend on tiny squares; "No mandatory skills:" is ambiguous; the returned item appears twice |
| Student Send | Disclosure rows don't name the skill |
| Student My requests | A single card floats on an empty page |
| Student record | Stacked synonyms per attempt; filters truncate at 375 |
| Student skill detail | Empty lower half; waiting-attempt slot empty |
| Student offline | Card-in-card conflict; "Keep this device" pre-selected as the filled primary (risky) |
| Evaluator form | Met and Unmet both have a brand border when unselected; casing |
| Evaluator submitted and expired | Good |
| Evaluator invitation email | "3 skills" vs "2 requests" |
| Course check-off (most confusing) | Checkbox plus badge; commit not visible when nothing is ticked; dead columns; overloaded headers |
