# Evaluator and lab instructor screens (design lab)

**Written:** 2026-10-26. **Personas:** J. Delgado, RN (preceptor, no login); R. Whitmore (lab instructor, no login).
**Consulted:** `00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md` (D-L1, D-L2), `strategy/02` (section 5 budget, section 8 email and receipt), `strategy/03` (section 4.2 evaluator journey, H2, H3, H3b), `strategy/04` (evaluator shell, 820 px), `strategy/07` (evaluator budget: 3 regions, 15 words), `ds-usage-map.md`, `docs/v2/audit/T3` and `T4`, REQ EV-01..EV-07, SC-12, SC-14, SC-15, RV-01..RV-06, build prompt section 7 (`evinvite`, `evpage`) and J2, J9, competitive digest.
**Data:** real seed through `lib/v2` selectors, read-only. Maya Ferreira's request `sub-maya-1` (2 skills, 4 West, Inpatient, self-rating "Works with prompts"); Priya Raman's stalled request; 123 students in 4 cohorts and 11 groups for the lab grid. A "Lab sample, 7 skills" toggle shows every published NURS 350 skill (all four evaluation models) and is labelled "Lab sample" on screen.
**Code:** `lib/lab/evaluator.ts` (pure view models), `components/lab/evaluator/*` (frame, fields, gate, states, lab controls, lab grid parts), `components/lab/screens/evaluator-*.tsx`, `lab-instructor-*.tsx`, tests `tests/lab/evaluator.test.ts`.

## 1. Screens and the question each variant tests

| Screen | Route | Variant | Tests |
|---|---|---|---|
| Evaluation form (tier 1) | `/lab/evaluator/evaluation-form` | **A** one page, a card per skill, sticky submit (recommended) | Can a nurse finish every skill on one phone scroll in under 2 minutes? |
| | | **B** stepper, one skill per screen, review step (DS Wizard) | Does it keep a 7-skill request from losing the evaluator's place? |
| | | **C** fast batch table, inline chips, one shared drawer | Is it faster for a lab instructor signing many skills at once? |
| Invitation email (tier 3) | `/lab/evaluator/invitation-email` | A | Can a preceptor tell from the subject who and how many, and open each request? |
| Submitted (tier 3) | `/lab/evaluator/submitted` | A | Does the evaluator know at a glance whether each skill counts now or waits? |
| Expired or not for you (tier 3) | `/lab/evaluator/expired` | A | Does a wrong or late link show nothing of the request and say what to do? |
| Lab batch grid (tier 2) | `/lab/lab-instructor/lab-batch-grid` | **A** students by skills grid (recommended) | Can an instructor record a 123-student cohort on several skills in one pass? |
| | | **B** roll call, one skill at a time, touch chips | Is it faster at the bench on a tablet than the grid? |

Every state is a URL (`?state=`), so a reviewer can open it directly. Lab controls sit in a strip marked `data-lab-chrome` (excluded from density counts) under the variant bar: state, request sample, and Options (program settings and pending decisions).

## 2. Layout and regions

**Shell.** No login, no app chrome (REQ EV-01; strategy/04). A light header names the program and says "Secure link, no account needed" once ("No account needed" under 640 px). No sidebar, nav, search, switcher or link out of the evaluation. The column is 820 px at 1440 (strategy/04 C-2) and full width minus a 16 px gutter at 375. The form is designed at 375 first; 1440 is the same column centred.

```
375                                   1440 (centred 820 column)
+-----------------------------+       +--------------------------------------------+
| Program        No account   | R1    | Harbor University BSN   Secure link, no... | R1 header
+-----------------------------+       +--------------------------------------------+
| Maya Ferreira               | R2    | Maya Ferreira                               | R2 who + where
| 2 skills · NURS 350 · 4 West|       | 2 skills · NURS 350 · Harbor General, 4 West|
+-----------------------------+       | +----------------------------------------+ |
| [Card] Indwelling catheter  | R3    | | Indwelling urinary catheter insertion  | | R3 first skill
|  Maya rated Works w/ prompts|       | |  Maya rated Works with prompts "..."    | |
|  Outcome [ Met ][ Not met ] |       | |  Outcome  [   Met   ] [  Not met  ]    | |
|  Feedback (optional) [    ] |       | |  Feedback (optional) [               ] | |
+-----------------------------+       +--------------------------------------------+
| [ Submit 2 skills ] (sticky)|       | 0 of 2 done              [ Submit 2 skills ]| sticky action
+-----------------------------+       +--------------------------------------------+
```

| Region | DS component | Notes |
|---|---|---|
| R1 light header | plain header in `EvaluatorFrame` | One "no account" line (strategy/02 C-6) |
| R2 who and where | `PageHeader` (h1 = student, subtitle = count, course, location, setting) | Data only, no prose |
| State banner (only when it applies) | `LocalBanner` info/warning | Corrected (revision + return reason), name not on record, offline. Never toast |
| Error summary (after a failed submit) | `LocalBanner` error + `Button variant="link"` per issue | Focused on submit; each link moves focus to the field |
| R3 skill | `Card` (A), `Wizard` + `WizardPanel` (B), `Table` + `Sheet` (C) | Skill name said once per skill (v2 said it four times) |
| Answer choices | `ToggleGroup` single, outline, 44 px (`--control-height-touch`) | The only touch-size controls. Selected = DS soft brand tint |
| Feedback | `Label` + `Textarea` | "(required)" or "(optional)" in the label; no character counter |
| Sticky action | `Button` default, full width on phone | One primary. Count "0 of 2 done" from 640 px up |

## 3. States (all three form variants share them)

| State | What shows | Source |
|---|---|---|
| Default | Form | EV-01, EV-03, EV-05 |
| Corrected request | Info banner "Sent again, revision 2" + return reason; each skill shows "Earlier answer". Form starts blank; Options "prefill earlier answers" fills it | RV-02; OD-08 open, so both are shown, neither decided |
| Further attempt | "Attempt 2" badge on each skill (and "of N" when the program set a limit) | RV-03 |
| Forwarded | "Is this for you?" with "Yes, I am J. Delgado" / "No, someone else". No request content before the answer | D-L2 privacy; OD-18 open, so nobody signs as someone else |
| Expired | "This link is no longer active", badge "Expired Nov 9", "Ask Maya to resend" | OD-18 open; date is a lab sample (sent + 14 days) |
| Not for you | "This request is for J. Delgado, RN", "Tell Maya" | RV-04 |
| Already completed | "Already signed off", "A completed evaluation cannot be changed." | RV-03, RV-05 |
| Submitted | Per skill: answer + `StatusBadge` "Counts now" (neutral, check) or "Waits for program approval" (amber, clock) | EV-07, SC-15 |
| Offline, queued | Warning banner; receipt "Saved on this phone", each skill "Queued on this device" | COMP rec 9 |
| Validation errors | Error summary with focus links; field messages under each control | EV-06 |
| Name not on record | Info banner "Maya named you as the evaluator. The program may confirm your details before this counts." + editable name field; receipt repeats the "may" line | SL-09, ST-09; ledger Q9 open, so "may", never "will" |

**Pending decisions behind Options (all off by default):** rule hint per skill (strategy/05 bias concern), third answer "Feedback only" (strategy/02 Q-C3), prefill on a corrected request (OD-08). "Program requires feedback" and "Program holds for approval" preview SC-14 and SC-15; their defaults come from the seed configuration.

**What the evaluator never sees:** student progress, the achievement rule (unless the pending hint is on), other students, configuration (EV-03; strategy/03 section 4.2). No "Next request" button after submit: D-L2 says a link exposes only its own request, so the receipt points back to the email. This overrides strategy/03 H3b and strategy/04 "Back to requests"; flag for Romit.

## 4. Variant reasoning

- **A, one page (recommended).** Matches a paper checklist and the 22 s to 2.7 min sign-off evidence; a 2-skill request fits in about two phone screens. Level and criteria appear only after an outcome is chosen (progressive disclosure), so the first viewport stays at outcome plus feedback. Risk: a 7-skill request becomes a long scroll; the sticky bar keeps Submit in reach.
- **B, stepper.** One skill per screen, swipe or Next, and a review list with "Change" links. Next checks only the current skill, so errors are caught where they happen. Costs more taps for a 2-skill request; earns its place at 5 or more skills.
- **C, fast batch.** Each skill is a table row with inline chips; level is an inline `Select` from 768 px; criteria and feedback for any row open in one shared `Sheet` (right at 1440, bottom at 375). "Mark all Met" never overwrites an answer already given. The link still exposes only one student's request (D-L2), so C is fast within a request, not across students. That is the lab grid's job.

## 5. Invitation email

`buildInvitation()` renders one email per evaluator listing every open request, oldest first, each with its own link (D-L2). Subject names the student or students and the count inside the first 40 characters: "Priya Raman and Maya Ferreira: 3 skills to sign off"; one request reads "Maya Ferreira asks you to sign off 2 skills". Body: greeting, one sentence, one block per request (student, course, location, skills, "Open Maya's request" button), "No account is needed. Links work until Nov 9." (expiry once), the "Not the right person?" line, program name as sender. A "Plain text" tab shows the text version with every URL. Rendered inside a `Card` labelled "Email preview"; nothing is sent (REQ section 14).

## 6. Lab batch grid

Light frame, wide column (1200 px). Header: "Skills lab", "NURS 350 · Oct 26 · R. Whitmore", badge "Lab evidence" + "Never counts toward a clinical setting." (said once; REQ SC-12). Toolbar: search, group `Select` (11 groups with counts), skills `DropdownMenu` (published NURS 350 skills; blocked ones disabled with the reason). The count is said once, in the save bar ("38 of 123 students done · 2 absent"). Absent students get no result.
- **A grid:** `Table` with a sticky header and first column inside its card; each cell is a compact `Button` that cycles the program's labels (Met, then Not met, then not recorded) with glyph + word; "All" in a column header fills only visible, present students with no mark.
- **B roll call:** pick one skill (compact `ToggleGroup`), then every student row has 44 px chips and an Absent checkbox; "Mark the rest Met" fills only the blanks.
Saving shows a `LocalBanner` success ("Saved sessions are not edited."). The lab does not write to the v2 store, so the demo repeats.

## 7. What v2 lost or got wrong (and what this fixes)

| v2 (audit) | Here |
|---|---|
| Preceptor page inside the admin shell with sidebar and role switcher [AUDIT T4 P1-3] | Light header only, no nav, no links out |
| Skill name repeated four times per card [strategy/02 row 29] | Once per skill; generic labels "Outcome", "Feedback" |
| Character counter and "Feedback only. No pass or fail" sentence [row 30] | Removed; "(required)" or "(optional)" in the label |
| No revision, return reason or prior answers on a corrected request [AUDIT T3 #7] | Revision banner, reason, "Earlier answer" per skill |
| No attempt number on a further attempt [AUDIT T3] | "Attempt 2" badge |
| No expired or forwarded state [AUDIT T3 #14] | Both, without deciding OD-18 |
| Dead end after submit [AUDIT T4 #4] | Receipt per skill, counts now or waits, pointer to the email |
| Self-rating only as a count behind an expander [AUDIT T3 #16] | Self-rating and note shown inline, quieter than the evaluator's own answer |
| Lab grid shows the count three ways [AUDIT T4] | Count once, in the save bar |
| No email surface [AUDIT T3 evinvite] | Rendered email and plain text |

## 8. Mobbin references

| Reference | What it informs |
|---|---|
| [Trainline feedback form](https://mobbin.com/screens/23c45d7f-5403-4567-9c8b-0a39fea303c6) | A: one scrolling page, a card per question, required marker in the label |
| [Waymo rate your trip](https://mobbin.com/screens/bb235568-9202-4626-b71c-42e89afa4013) | Answer chips plus one text field and one full-width submit |
| [Mindtrip add review](https://mobbin.com/screens/0889f4b9-2bd4-4a25-9dbb-2bc547b7fe7b) | "(optional)" in field labels instead of a helper sentence |
| [Swiggy rate dishes](https://mobbin.com/screens/15bc780b-79e9-4dc6-a5ac-385aeb978076) | C: a row per thing with an inline answer, collapsed detail, one submit bar |
| [Neo Financial one question per screen](https://mobbin.com/screens/75bdb55a-7ad1-45b1-a939-9c1dbf133faf) | B: one question per step, Back and Continue in a bottom bar |
| [Lifesum question 7 of 7](https://mobbin.com/screens/c11cfa70-6e8f-4dea-a1a8-b838d958bd63) | B: "Skill 2 of 7" counter instead of a heavy stepper on a phone |
| [Meetup attendees](https://mobbin.com/screens/1f6e931a-508b-4ef1-b59b-fa59a8e049b8) | Lab grid B and C: a row per person with inline status chips, search above |
| [Square availability grid](https://mobbin.com/screens/10dfaf1b-fa80-4934-9fb4-c609ef88b61f) | Lab grid A: people by columns, sticky first column |
| [Calendly invitation, "This is not me"](https://mobbin.com/screens/7ac1e36a-0bf2-45b3-a50d-7bbcb98a9648) | Forwarded and not-for-you: name the intended person, offer the way out |
| [hilos invitation card](https://mobbin.com/screens/509e8fe1-9d4e-4e84-a8a8-f83cf2478348) | Expired and forwarded: one card, one action, "Not you?" |
| [Neo Financial request received](https://mobbin.com/screens/c9735eb3-ed10-42be-a213-6050b1cde3df) | Receipt says what happens next, not a thank-you paragraph |
| [Customer.io email preview](https://mobbin.com/screens/0dc4b8f3-bf9d-4169-932c-3da4a496b9c6) | Subject and sender above the rendered email |

## 9. Density, measured in the browser (2026-10-26)

Measured with a script over `[data-region]` in the evaluator frame, lab chrome excluded, at 375 x 812 and 1440 x 900, default state, seeded request.

| Screen | Regions above the fold | Controls above the fold | Prose words (not data, labels, buttons) | Budget |
|---|---|---|---|---|
| Form A, 375 | header, summary, first skill (+ second skill heading peeks) + sticky submit | 7 (4 answer tiles, 2 feedback, Submit) | 3 ("No account needed") | 3 regions, 15 words: pass, the peek is a scroll cue |
| Form B, 375 | header, summary, skill + Back/Next bar | 5 | 3 | pass |
| Form C, 375 | header, summary, skill table + submit | 8 (Mark all, 4 chips, 2 detail, Submit) | 3 | pass |
| Form A/B/C, 1440 | same regions in the 820 column | 7 / 5 / 9 | 5 ("Secure link, no account needed") | pass |
| Lab grid A, 1440 | header, summary, toolbar, grid + save bar | 58 (cells are the work) | 11 | 4 regions: pass |
| Lab grid B, 1440 | header, summary, toolbar, grid + save bar | 37 | 11 | pass |

## 10. Open points for Romit

1. D-L2 (link exposes only its request) versus strategy/03 H3b "Next request" button: built per D-L2 (no next button). Confirm.
2. Default outcome labels: the seed configuration says "Met / Not met"; the brief mentions "Met / Unmet". The form shows the program's own labels (SC-03); the code fallback when none is set is "Met / Unmet".
3. OD-08 (prefill on correction), OD-18 (link lifetime, forward), Q-C3 ("Feedback only"), the rule hint and ledger Q9 (unverified name) are all behind Options or worded as "may".
4. `components/lab/lab-frame.tsx` LightFrame caps its main at 768 px and its lab header overflows at 375 (persona switcher). The evaluator frame breaks out to 820 px itself; the polish worker could let LightFrame's main be full width.
