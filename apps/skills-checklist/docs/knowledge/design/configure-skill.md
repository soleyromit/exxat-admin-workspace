# Configure a skill, with the rule change impact check (design lab, Tier 1)

Written 2026-10-26. Consulted: `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md`, `strategy/02` (text budget, confirm dialog, failed-rule sentence), `strategy/03` (section 9 rule change, H11, deactivate vs new list), `strategy/04` (6+ steps use a left step list; severity distinct), `strategy/05` (C17 impact pair), `ds-usage-map.md`, `docs/v2/audit/T1-admin.md`, REQ sections 4 and 12, competitive digest, build prompt section 5.

Routes: `/lab/admin/configure-skill?variant=A|B|C`, `/lab/admin/rule-change-impact`. Add `&change=sample` for a stricter rule (2 different evaluators and 1 in Inpatient), `&skill=sk-pressure-injury` for an unconfigured skill, `&state=loading` for the skeleton.

## 1. The job and what v2 lost

Admin job: "When a standard changes, tell me what changes for students" [REQ AE-02; brief section 2]. Moment of truth: can the admin predict the effect of the save they are about to press [strategy 03 section 1].

| v2 finding [AUDIT T1] | This design |
|---|---|
| 7 steps, 3 not in REQ (Simulation, Prerequisites, "If a student does not pass") | 6 steps, all REQ: Model, Outcomes and levels, Achievement rule, Settings and minimums, Who can sign off, Check and publish |
| "Strength: strong" heuristic card | Removed. The plain rule sentence stays [REQ SC-17] |
| Step position stated 3 times | Said once (the step list). `WizardProgress` is `sr-only` and `aria-live`, so it is announced, not repeated |
| Two forward buttons | One: Next. On the last step: "Check impact and publish" |
| "Evaluations already completed are not changed" | "Completed evaluations stay as recorded. Status is recalculated from the new rule for 121 students with evidence." Then the counts |
| No impact view | Before and after table, named students, who sees what, the open choice [REQ AE-02] |
| NURS 350 hard-coded in publish | No course is named; the success banner names the skill only |
| No SC-05/SC-07 rules, no SC-13 fields, no self-evaluation toggle | All present |
| Credential, years and training qualification (v2 invention) | Not shown. PROPOSED in v2 only; not in REQ SC-16 (roles only). Awaits Romit [LEDGER Q5] |
| Last-N currency rule (REQ 14 expiry, out of scope) | Not editable. Where a published v2 rule still uses it (or the simulation share), it is shown read-only as "Kept from the current rule" with a Proposed badge and a Remove action, so counts never change silently |

## 2. Shared regions (all variants)

| Region | DS component | Why | Reference |
|---|---|---|---|
| Page header: skill name, status, facts | `PageHeader` via `PageFrame`, `StatusBadge` | Object title up to 6 words; state is glyph + word | Klaviyo app listing header with status and primary action, https://mobbin.com/screens/54764a4b-32bd-41c4-8d8a-cfbee5b59653 |
| Model choice, nothing preselected | `SelectionTileGrid` (`interaction="radio"`, value empty) | REQ SC-02: no default. Empty state says "Nothing is chosen for you" | Square automations template picker (choose before building), https://mobbin.com/screens/5650b601-9f43-470f-b4a5-cf1d074c6965 |
| Fields | `Field`, `FieldSet`, `FieldLegend`, `FieldError`, `Input`, `Select`, `RadioGroup`, `Checkbox` | Every control has an id that an error can focus | |
| Toggles: mandatory feedback, self-evaluation, approval | `ToggleSwitch` rows with title + one detail line | REQ SC-14, SC-15; one helper line per control [strategy 02 4.2] | Tally settings toggle rows, https://mobbin.com/screens/207ac2b2-d24f-4dae-80cc-86cc183458cb |
| Live rule sentence | text block, `aria-live="polite"` | REQ SC-17: model, evidence, rule, achievement visible as one chain | Plane automation IF/THEN readable summary with config panel, https://mobbin.com/screens/ca0015e8-6573-4a12-a045-dae30b85c104 |
| Student / evaluator preview | `Tabs` (line) + disabled `RadioGroup`, `Textarea` | REQ SC-19 together; EV-03 evaluator sees the form, not the achievement rule; EV-07 told whether it counts now | Stripe payment link, form left, live preview right, https://mobbin.com/screens/ffb06d29-b252-42ea-a2b2-6a732a669a8c |
| "Today" line on real data | `StatusBadge` amber when anyone loses Achieved | Live effect on a real group [BUILD-PROMPT admconfig] | Stripe invoice template preview against a real record, https://mobbin.com/screens/e8befb4c-a84c-4307-bd73-122dd9e1472d |
| Error summary with focus links | `LocalBanner variant="error"` + link `Button`s | Hard block, visibly different from warnings [strategy 02 7.6]; REQ SC-18 | |
| Impact check | `Dialog` (A to C), full page (impact screen); `Table`, `StatusBadge`, `RadioGroup`, `Tip`, `Badge` | Number plus a named list, not a chart [strategy 05 C17] | beehiiv review and publish with audience counts, https://mobbin.com/screens/2db03188-943e-4176-bf6c-ef9e761e9ccd ; Kajabi grouped confirm, https://mobbin.com/screens/e1f914d5-3f7c-4509-b4c4-0fa58fceabda |
| Evidence-already-held choice | `RadioGroup`, no default, `Badge` "Decision pending" with `Tip` | AE-02 says re-apply; option B (version by cohort) is open [BUILD-PROMPT 11; COMP Elentra]. PENDING-ROMIT, so both are shown and publish waits for a choice | Klaviyo "Changes affect live A/B tests", two explicit choices, https://mobbin.com/screens/9ef7e93b-77bf-41d8-9ae2-42eab8aeb5b5 |
| After publish | `LocalBanner variant="success"` (focused, scrolled into view) + `Card` "What affected students see" | Never toast; banner in view [AUDIT T4 P2-4]; H11 line names the new rule and what is left. In product only: notifications are REQ 14 | |

Copy notes: "evaluations", not "sign-offs", because the glossary bans sign-off as a noun for the record; "Check and publish", not "Review and publish" (glossary rename 43 frees "Review" for approvals); "In progress" [LEDGER D-L1]; "Evidence does not qualify" and amber, never red, for the skill-record state; Met/Unmet default labels [REQ SC-03].

## 3. Variants and the question each tests

### A. Wizard with a persistent live panel (recommended)

```
| step list (6)     | Step heading                         | What achievement requires     |
| 1 Model        v  | fields for this step only            | Get 3 evaluations rated Met,  |
| 2 Outcomes     v  |                                      | from 2 different evaluators,  |
| 3 Rule         o  |                                      | with 1 in Inpatient.          |
| 4 Settings        |                                      | Today: 113 of 123 achieved    |
| 5 Sign off        |                                      | [!] 15 students change  See who|
| 6 Check, publish  | [Back]                      [Next]   | [Student sees | Evaluator sees]|
```
Tests: do six REQ steps, one forward button and a live sentence keep configuration manageable? Vertical `Wizard` because 6+ steps need a left list [strategy 04 5.5]. Next is disabled until a model is chosen, with the reason beside it. Steps with problems show the DS error state once visited. Reference for the stepper with live preview: Stripe payment link (above); for the left step list: Mintlify settings, https://mobbin.com/screens/6d6c9462-ada1-4b2b-a83b-618becbddecd.

### B. One page with a section list

Tests: is one page faster for an expert re-configuring 142 skills? Header: "Copy configuration from" (`Select` of 161 configured skills) and "Apply to other skills" (`Sheet` with search, unconfigured first, "Select all not configured", and a per-skill table of students who change for skills already in use) [REQ IM-14]. Errors appear only after the first publish attempt, with counts on the section list. Reference: Klaviyo app listing in-page section nav, https://mobbin.com/screens/54764a4b-32bd-41c4-8d8a-cfbee5b59653 ; Browserbase settings list, https://mobbin.com/screens/afed0e5d-556b-4298-a286-e8cf31a331de.

### C. Sentence builder

```
Get [3] evaluations rated [Met v],
from [2] different evaluators, (Proposed) x
with [1] in [Inpatient v]. x
[Add a level minimum] [Add different evaluators] [Add a setting minimum]
> Outcomes, student fields and who can sign off   (Collapsible)
```
Tests: does editing the rule as one sentence beat forms? Clauses are added and removed whole, so the sentence never reads half built; punctuation sits at the end of each clause line. Questions or levels are asked for inline first when the rule needs them. Error links open the collapsible and focus the control. References: Devin automation trigger with inline value chips, https://mobbin.com/screens/a1236205-86f2-49f9-88bc-126448454481 ; Calendly routing IF/AND/THEN rows, https://mobbin.com/screens/d2ce399f-bd4c-441f-a786-2f1c5c8053a7.

## 4. States

| State | How it shows |
|---|---|
| Loading | Skeleton in the final two-column shape (`?state=loading`) |
| Unknown skill | Error banner with a link to the library |
| Unconfigured | Info banner "X is not configured. Students cannot send it and it cannot be mapped until it is published." [REQ IM-09]; nothing preselected; "No evidence recorded yet, so publishing changes nobody's status" |
| Invalid | Error summary, focus links, field errors, publish disabled with the reason [REQ SC-18] |
| No engine change (wording only) | Dialog says nobody changes; no choice asked [REQ AE-06] |
| Stricter rule | Table (113 achieved to 98), 15 named students with what is still needed, who sees what |
| New evidence only chosen | "No student changes status now"; table kept for comparison |
| Published | Success banner in view and focused, the student line, the panel re-baselines to "no change" |

## 5. Engine and data

`lib/lab/configure.ts` (pure, `tests/lab/configure.test.ts`): `LabRule` holds only REQ fields plus distinct evaluators (PROPOSED). `evaluateRule` re-runs a rule over a student's evaluations from the evidence index: only counted evidence counts [AE-01], lab and simulation never count toward a setting [SC-12], an unrecorded level never counts toward a level minimum, four states [AE-04]. `computeImpact` diffs before and after for all 123 students. A test proves the lab engine equals `lib/v2/student.ts skillProgress` (achieved and counted) for every student on five published skills, so the figures match every other screen. `lib/v2/rules.ts validateDraft` was not reused because it validates the v2-only steps (simulation, prerequisites, qualification); `validateRule` covers SC-02, SC-03, SC-05, SC-06, SC-07, SC-08, SC-10, SC-11, SC-13, SC-16, SC-18.

Real figures (sample change on Oral medication administration): 113 to 98 achieved, 6 to 21 in progress, 15 students change. Applying the same rule to Hand washing would change 69 students.

## 6. Open points for Romit

1. PENDING-ROMIT: re-evaluate existing evidence versus new evidence only. Shown as a choice, publish waits for it. REQ AE-02 reads as re-evaluate; the alternative is the build prompt's option B.
2. Different evaluators is PROPOSED (not in REQ SC) [LEDGER Q6].
3. The v2 simulation share for Oral medication administration computes to "at most 0 of 3" (33 percent of 3, rounded down), so simulation already never counts there. It is shown read-only with Remove.
4. Seed evaluations carry no recorded level, so a level minimum on today's data makes everyone fall short. A data gap, not a design choice.
5. Question and scored rules re-evaluate from recorded answers or scores when present; seeded evidence has none, so the recorded outcome is used.
6. Bulk apply in variant B assumes re-evaluation when it reports students who change; it does not ask the pending choice per skill.
7. Evaluator preview omits the achievement rule (REQ EV-03; strategy 05 avoids bias). Strategy 05 section 10.9 sketches a rule line on the evaluator form; confirm.
8. Publishing in the lab does not write the shared v2 store.
