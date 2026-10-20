# V2-03b Outcomes, remediation plans (scenario step 9)

**Status:** Stage 3 contract. Narrows `00-cross-cutting.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              (1) Staff outcomes page: recent evaluations, remediation plans, confidential concerns. Routes
                      /v2/reviewer/outcome-remediation and /v2/admin/outcomes.
                      (2) Remediation plan: staff view and student view. Routes /v2/<admin|reviewer|director>/remediation/<id>
                      and /v2/student/remediation/<id>.                                                  Wave: V2 Stage 3
Persona(s) & role:    L. Haddad (clinical coordinator, reviewer), A. Ross (administrator); Maya Ferreira (student, sees her own
                      plan only). Preceptors have no screen here.
Scope / data seen:    Staff: all evaluations, plans, concerns for NURS 350. Student: her own plan, steps and attempts. Concerns
                      are never read by any student selector.
Job-to-be-done:       Staff: see what each pass or fail did, follow a student who did not meet a skill, close the plan when it
                      is done. Student: know exactly what to do next after a fail and when she may try again.
Why -> So what:       A fail that ends in silence is the commonest complaint. A plan with steps, a status and a next-attempt date
                      turns a fail into a path. A pass visibly moving progress shows the evidence chain working end to end.
Requirements:         RV-03 (completed evaluation is a record; a fail leads to a further attempt recorded separately, original
                      intact), SH-02 (explicit outcome), SH-03 (the rule not met in words the student can act on), SH-04 (counts),
                      AE-01 (only completed evidence counts), AE-03, AE-04 (four states), AR-04 (a note kept with the evaluation:
                      the plan's close note), SC-17 family (failure path from configuration: attempt limit, days between,
                      auto-remediation read from the skill; SC-17 itself is the wizard's)
Open decisions hit:   None decided. [PROPOSED] Remediation plan (REQ section 14 is out of scope for production, D2 allows it in
                      this prototype), staff-only concern list, close plan with outcome, attempts used against the limit and the
                      earliest next attempt date. Hard stop D2 labels these proposals.
Prototype reference:  None for v2.
Pattern:              Staff: KeyMetrics-like summary line, Tabs over a DS DataTable of evaluations (Latest, Did not meet, Not yet,
                      Reopened), a plan list, a staff-only concern list. Plan page: header, status, steps as an ordered list,
                      attempt facts, actions. Reference: mobbin-evidence "Job type 5".
DS mapping:           PageFrame/PageSection, Tabs, DataTable via V2Grid, Card, Badge/StatusBadge, Checkbox (staff step toggle),
                      Dialog, Textarea, RadioGroup, Button, LocalBanner, Collapsible -> IMPORT. Composition: plan steps list,
                      concern list item (new-components-needed.md).
States:               L  Seed first. E  No plans: "No remediation plans. A plan opens when a student does not meet a skill whose
                      failure path says so, or when staff open one." No concerns: "No confidential concerns."
                      Er Store refusal as LocalBanner error. V Close without finishing needs a reason. S Saved: polite live
                      region plus banner. Su "Plan closed." D Closed plan: steps read-only, shows closed date, by, note.
                      P n/a. Bl Student opening someone else's plan: "This plan belongs to another student." (staff pages open
                      any plan.)
Edge cases:           Plan opens on fail (and when a reopened evaluation is confirmed as a fail) only if the skill's failure
                      path enables auto-remediation; staff can open one from a failed evaluation. One open plan per student and
                      skill: a second fail adds a note on the existing plan instead of a duplicate. Status derives from steps:
                      open (none done), in progress (some done), closed (staff closed it). Closing does not change any
                      evaluation. A student cannot change a plan. Attempt facts: attempts used (met or not met only; Not yet is
                      not an attempt), limit, earliest next attempt = last fail date + days between attempts.
Copy:                 "Remediation plan: Sterile dressing change". Step toggle "Mark done: Practice session in the skills lab".
                      Close: "Close plan" opens a dialog "Close this plan?" with "Completed all steps" or "Closing early, reason
                      required", buttons "Close plan", "Keep plan open". Student: "Next attempt from Oct 26. You have used 1 of 3
                      attempts." "Log a new attempt".
A11y:                 Steps are an ordered list with status text plus icon, never colour alone; the toggle label names the step;
                      dialog traps focus and returns it; tables are the DS DataTable; Tabs keyboard per DS.
Out of scope:         Reminders and escalation, student-editable plans, plan templates per skill, attempt limits enforced at
                      request time (shown, not enforced), the review queue (Stage 4).
Acceptance tests:     tests/v2/outcomes.test.ts: plan opens on fail only with auto-remediation; one plan per student and skill;
                      manual open; toggle step changes status; close needs reason when incomplete; closed plan is read-only;
                      attemptInfo numbers; concerns invisible to student and preceptor roles; student plan access is own only.
                      Browser: student fail -> plan visible to student and staff -> staff marks steps -> close.
Risks / unknowns:     Plan step wording is sample text.
Vault notes consulted:Same as V2-02a.
```
