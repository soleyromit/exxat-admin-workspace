# V2-01b Configure wizard and publish (scenario steps 2 and 3)

**Status:** Stage 1 contract for the connected prototype v2. Narrows `00-cross-cutting.md` and `V2-00-foundation.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              A multi-step Wizard that configures one skill (default IV catheter insertion) and a final review
                      and publish step. Routes /v2/admin/configure-skill (steps 1 to 7, then "Review and publish") and
                      /v2/admin/validate-publish (the same wizard opened on step 8). Optional ?skill=<id>, ?step=<n>.
                      Steps: 1 Evaluation model, 2 Achievement rules, 3 Simulation, 4 Prerequisites, 5 Qualified
                      evaluators, 6 If a student does not pass, 7 Re-validation, 8 Review and publish.   Wave: V2 Stage 1
Persona(s) & role:    Program administrator (A. Ross). RBAC: 00-cross-cutting.md section 7. Sample data only.
Scope / data seen:    One skill's draft configuration (store.drafts), other skills (for prerequisites and copy-from), the
                      people on record (for the qualified-evaluator preview).
Job-to-be-done:       Decide exactly what a skill asks of students and evaluators, see in plain words how strong the
                      achievement rule is, fix anything unsatisfiable, then put the skill in use.
Why -> So what:       A rule that cannot be met strands students, and a rule that is too easy proves nothing. A live
                      plain-language strength hint and a blocking review make the consequences visible before publish.
                      Publishing writes to the shared store so mapping, student, evaluator and report screens read the
                      same rules.                                            (journeys/01, strategy/02)
Requirements:         SC-01, SC-02, SC-03, SC-04, SC-08, SC-09, SC-10, SC-11, SC-12, SC-15, SC-16, SC-17, SC-18, SC-19,
                      IM-09, IM-14 (copy one skill's configuration into the draft)
                      Questions for the question and scored models are an editable list; their qualification rule
                      (SC-05, SC-07), student-supplied fields (SC-13) and narrative feedback (SC-14) are out of scope.
Open decisions hit:   SC-02 vs pre-selected binary: v2 pre-selects binary for a skill with no model (decisions D2, D3,
                      [PROPOSED]); an existing model is never overwritten. OD-12 untouched. OD-17 (what evaluators
                      see) not touched. No OD is treated as decided.
                      Beyond the requirements, tagged [PROPOSED] in docs only: last-N window ("4 of last 5"), minimum
                      distinct evaluators, simulation cap and allow list, practice-trial prerequisite, lab check-off,
                      evaluator credential, years and training, attempt limit, days between attempts, retake score cap,
                      auto remediation, event-based re-validation, optional calendar expiry (off by default), overall
                      supervision rating beside a checklist.
Prototype reference:  None for v2. v1 S-09 (components/configure) is read for patterns only; v1 routes untouched.
Pattern:              Page-level DS Wizard (non-linear nav, 8 steps; the DS recommends at most 6, see docs/v2
                      decisions D8, deviation recorded) + Dialog to confirm publish.   Reference: components/configure/wizard-dialog.tsx
DS mapping:           Wizard, WizardNav, WizardPanel, WizardStepHeading  -> IMPORT (Wizard orientation vertical on desktop,
                      horizontal compact on phone)
                      RadioGroup (model tiles), Input, Field/FieldLabel/FieldDescription, Checkbox, ToggleSwitch, Select,
                      Button, Badge, Card, Dialog, LocalBanner, Tooltip  -> IMPORT
                      DataTable via components/v2/v2-grid.tsx for the read-only review summary  -> IMPORT
                      Editable level list: composed from Input + Button (icon-sm) like v1 level-editor, registered in
                      new-components-needed.md. Strength hint: Card + Badge composed.
States:               L  Skill picked from the query string; the wizard renders the draft from the store (seed first, saved
                         state after mount, so a skeleton is not needed).
                      E  A skill with no model: binary is pre-selected as the starting point and says so. No levels:
                         the level list shows "Add at least two levels" with an Add button.
                      Er Field errors under each field (what is wrong, how to fix) and a summary on step 8.
                      V  Per-field validation (rules.ts) shown after the field is touched or the admin opens the review
                         step; Next never blocks (the admin can move around), Publish does.
                      S  Every change writes the draft to the store; the strength hint and simulation share update live.
                      Su "Published" status badge, success banner with a link to map the skill to NURS 350.
                      D  Fields that do not apply to the chosen model are not shown (retake score cap only for scored)
                         and say why in one line.
                      P  n/a.   Bl  Publish is disabled with a visible reason and lists every issue; each issue is a
                         link that opens the step and focuses the field.
Edge cases:           Changing the model rebuilds model-specific settings and keeps the rest (SC-09). Removing a level a
                      minimum refers to resets the minimum. Allow list with nothing ticked is an issue. No evaluator on
                      record meets the qualification is an issue. Prerequisite skill not in use is an issue (it can
                      never be satisfied). Published skill reopened: editing allowed, Publish changes re-validates.
                      Reload mid-wizard: draft and step are restored from the store (the step is saved with the draft; ?step only opens a given step once).
Copy:                 Wizard step labels as above. Buttons: "Next: Achievement rules", "Back", "Review and publish",
                      "Publish IV catheter insertion", "Copy configuration", "Add level", "Remove level 2".
                      Hint: "A student needs 4 successful evaluations out of their last 5, from at least 2 different
                      evaluators, at Works alone or above. Strength: strong." Errors: "Level 3 has no name. Name it, or
                      remove the level." Dialog: "Publish IV catheter insertion? Students and evaluators will see these
                      rules. Evaluations already completed are not changed."
A11y:                 Wizard nav is a list with current step marked; WizardStepHeading ties panel to step. Focus moves to
                      the step heading on step change and to the field on an issue link. All fields have visible labels.
                      Level controls have names ("Move level 2 up"). Hint is in an aria-live polite region (debounced by
                      React batching). Strength shown as a word plus badge, never colour alone. Errors use
                      aria-invalid and aria-describedby.
Out of scope:         SC-05..SC-07 rule detail, SC-13, SC-14, "apply to several skills", rule-change impact preview,
                      real evaluator qualification enforcement at request time (Stage 2/3 read the rules), section 14.
Acceptance tests:     1. validateDraft returns an issue (with step and field id) for: no model, equal binary labels,
                      blank or duplicate levels or questions, fewer than two levels, last-N window smaller than need,
                      distinct evaluators greater than need, setting minimums above need, empty allow list, simulation
                      cap outside 0 to 100, prerequisite not in use, no role, no qualified evaluator, calendar months
                      out of range (SC-18).  tests/v2/rules.test.ts
                      2. strengthHint is deterministic and the text names need, window, evaluators and level.
                      3. simulationShare gives the count a cap allows and never lets settings minimums use simulation (SC-12).
                      4. publishSkill refuses with issues, and on a clean draft sets model, config, configured, published
                      and appends an audit entry (SC-19, IM-09).  tests/v2/admin-actions.test.ts
                      5. Browser: configure -> inject a blank level -> review step lists it and Publish is disabled ->
                      follow the link, fix -> Publish -> published counter rises -> reload keeps it.
Risks / unknowns:     (1) Eight steps exceed the DS recommendation of six. (2) The strength thresholds are my own
                      [INFER] heuristic, not a requirement. (3) Qualified-evaluator sample attributes are invented.
Vault notes consulted:Not consulted in this run (no Obsidian vault access). Source docs read: requirements.extracted.txt
                      section 4, S-09-skill-configure.md, V2-00-foundation.md, docs/v2/*.
```
