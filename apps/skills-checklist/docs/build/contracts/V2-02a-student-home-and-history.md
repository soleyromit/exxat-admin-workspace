# V2-02a Student home ("what's left") and student history (Stage 2)

**Status:** Stage 2 contract for the connected prototype v2. Narrows `00-cross-cutting.md` and `V2-00-foundation.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`. Student wireframe base: `docs/ux/07-screen-inventory-and-wireframes.md` S-12 mobile and S-14.

```
Surface:              Student home: what is left in NURS 350, per-skill progress against the published achievement rule,
                      next best action, sync status. Student history: the verified record so far.
                      Routes /v2/student (role home) and /v2/student/history.                     Wave: V2 Stage 2
Persona(s) & role:    Maya Ferreira, BSN 2027, mostly on a phone (390 px). On desktop the same screens sit in a centred
                      column (max 28rem), not stretched. RBAC: 00-cross-cutting.md section 7. Sample data only.
Scope / data seen:    Maya's own evaluations, requests, log entries, placements and sync items. Never other students.
                      Confidential concerns (faculty only) are never read by this surface.
Job-to-be-done:       Answer "what do I still need to do on this rotation, and what is my best next move?" in the first
                      screen, then "which of my attempts counted, which did not, and why?".
Why -> So what:       The student triggers and owns the record (journeys/02). A student who cannot see what is left, or who
                      sees "did not count" with no reason, stops logging. Mobile reliability is the top market complaint
                      (Exxat Student 1.4/5 on iOS, competitors under 2.7), so the sync state is on every screen.
Requirements:         ST-01 (mapped skills, mandatory, progress), ST-04 (several skills together, entry point), ST-05
                      (setting shown per attempt), SH-01 (every attempt for a skill, in order, by attempt number), SH-02
                      (explicit outcome, who it is with), SH-03 (the rule that was not met, in plain words), SH-04 (counts),
                      SH-05 (progress per named setting), SH-06 (all courses, narrow to one), SH-07 (completed evaluation in
                      full, as far as the store holds it), SC-12 (lab and simulation never satisfy a named clinical setting),
                      AR-06 (awaiting approval is excluded from achievement), IM-09 (unconfigured skills never shown)
Open decisions hit:   OD-07 (setting captured once or per skill) is not decided: this surface only displays it. OD-17 is
                      untouched: the student sees their own outcome, not another person's achievement status.
                      [PROPOSED] Next best action, progress dots, prerequisite checklist on the card, "Not open yet" list.
Prototype reference:  None for v2. v1 S-12 and S-14 wireframes read for the field set only. No studentUX import.
Pattern:              Mobile list of skill Cards (not a table) with a summary card on top and one primary action.
                      Reference: ux/07 S-12 mobile, mobbin-evidence "Job type 4" (summary first, rows show the number first).
DS mapping:           PageHeader (via StudentPage), Card, Badge, StatusBadge (sync chip), Button (explicit variant and size,
                      44 px touch on phone), Collapsible (Not expected), LocalBanner, Dialog (attempt detail), Select
                      (course filter), Separator  -> IMPORT. Mobile skill card, bottom navigation, sync chip: composed from
                      DS primitives, registered in docs/v2/new-components-needed.md. Hand-rolls: none.
States:               L  Seed first render, saved state after mount (store hydration). No spinner.
                      E  No mandatory skills: "NURS 350 has no mandatory skills." A skill with no attempts says "No attempts
                         yet." History with nothing: "You have not sent anything yet" with a link to log a skill.
                      Er Store unreadable falls back to the seed (foundation). A mandatory skill the program has not put in use
                         is listed under "Not open yet" with the reason, never hidden silently.
                      V  n/a (read only).   S  A new evaluation or entry changes the cards, counts and next action at once.
                      Su Banner after returning from a request ("Request sent").   D  n/a.   P  n/a.
                      Bl  A skill with unmet prerequisites shows a "Clinical attempt locked" line with what to do.
Edge cases:           Achieved skill still offers "Log again" (ST-01 text: more evidence is allowed). Evidence awaiting approval
                      is shown as waiting and excluded from the count (AR-06). A reopened evaluation does not count until the
                      reviewer closes it. Lab and simulation evaluations count toward the number, never toward a named
                      clinical setting minimum. Simulation above the configured cap is shown as not counted, with the cap.
Copy:                 Sentence case, no em dashes. Statuses are text: "Achieved", "In progress", "Not started", "Waiting for
                      J. Delgado, RN". "Left: 2 more successful evaluations, 1 more in Inpatient." Next action buttons name
                      the action: "Log IV catheter insertion". Not met: "Did not meet the criteria. Rule: 4 of your last 5
                      evaluations met, from at least 2 evaluators."
A11y:                 One h1; section h2; each skill a labelled article with h3. Status is text plus icon, never colour only.
                      Progress dots are aria-hidden with the same facts as text. Bottom nav is a nav landmark with
                      aria-current. Targets 44 px (var(--control-height-touch)). Sync strip is role=status, aria-live polite.
Out of scope:         Share and CLR export (Stage 5, step 13). Revise and resend (RV-01, RV-02). Skill search across the
                      library (ST-03). Evaluator form responses in full (the store holds outcome, versions and reason only,
                      so SH-07 is partial).
Acceptance tests:     1. remaining-work calc: count rule, last-n rule, distinct evaluators, named setting minimum, lab and
                      simulation excluded from the named setting, simulation cap, awaiting approval excluded
                      (tests/v2/student.test.ts).
                      2. courseWork groups mandatory, optional, not expected, and lists unpublished mandatory skills as not
                      open; next best action picks the closest mandatory skill, then a locked one, then "up to date".
                      3. History counts (counted, waiting, did not meet) equal the evaluations in the store.
                      4. Browser: home shows 5 mandatory and 3 optional for Maya; a new request changes "Waiting" and the next
                      action; Reset demo restores. History opens an evaluation and shows its versions.
Risks / unknowns:     (1) The progress calculation reads outcome only; a per-level minimum (SC-10) is applied when an
                      evaluation carries a level, which seed data does not yet. (2) "Next best action" is a heuristic.
Vault notes consulted:Research/skills-checklist meeting 2026-10-08 (create is not configure; mapping is expectation, not
                      eligibility). _Insights.md has no mobile or offline note for this product. Source docs: ux/07, ux/09,
                      journeys/02, requirements sections 6 and 10.
```
