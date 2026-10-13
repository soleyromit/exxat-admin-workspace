# Design contract — S-16 Evaluator form (tokenised link, shell-free)

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
**Surface:** S-16 · **Flow:** F-07 (entered from F-06 via S-18) · **Wave:** W3 (Student + Evaluator) · **Patterns:** P-13 (keyboard/focus), P-14 (loading), P-17 (error recovery), `ux/09 §5 S-16`, `§6`.

## 1. Surface and wave

Design contract — S-16 Evaluator form (tokenised link, shell-free). Wave: W3 (docs/build/01-build-plan.md §4). Derived from the contract title; no separate surface label was drafted.

## 2. Persona and RBAC

| Item | Value | Source |
|---|---|---|
| Personas | P-P preceptor at the placement site (no login); P-F clinical faculty (may use Prism or the link); P-L lab instructor (not a Prism user) | `[REQ EV-02, SL-08]` |
| Access | Emailed link opens the form directly; **no Prism login, no account is created** | `[REQ EV-01]` |
| RBAC row | Clinical Site / Preceptor: verify student hours / submit evaluations via tokenised email links; **no curriculum, no university analytics, no password wall** | `[exxat-domain-context RBAC]` |
| Sees | Only the single request behind the token: student name, course, setting and location, skills requested, student-supplied details, the student's self-evaluation where one exists, the program's configured form per skill | `[REQ EV-03, EV-04]` |
| Never sees | Other students, other requests, history, aggregates, the student's resulting achievement status or counts (OD-17 default: not shown), other evaluators, administrator review notes | `[INFER]`, DEFECT-05 |
| Cannot do | Alter how a skill is evaluated; edit a completed evaluation | `[REQ EV-03, RV-03]` |

## 3. Scope and data seen

Covered in §2 (Persona and RBAC) and §5.

## 4. Job to be done and why

- **JTBD:** *When a student I supervised asks me to sign off skills, I want to open one link and record my assessment against the program's criteria in minutes, so the student's evidence is recorded without me creating an account or learning another system.* `[REQ EV-01, EV-03, EV-05]`
- **Why:** Authority enters the record here. A heavy experience means no evidence; a loose one means evidence nobody trusts `[journeys/03]`. Preceptors are volunteers and high-stress `[exxat-domain-context P3]`.
- **So what:** Fast, shell-free completion raises the share of requests that become evidence; showing "counts now" or "held for approval" removes ambiguity about what the evaluator's answer does `[REQ EV-07]`.

## 5. Requirements and open decisions

**Requirements.**
| Group | IDs | How S-16 satisfies it |
|---|---|---|
| Access | EV-01 | Link from email opens the form; no sign-in, no account creation |
| Roles | EV-02, EV-08 | Preceptor, clinical faculty, lab instructor can all complete; role label shown as data; fixed three vs program-defined = OD-06 (roles read from data, three seeded) |
| Fidelity | EV-03 | Controls are answers only; no configuration affordance |
| Context | EV-04, ST-12 | Student-supplied details and (if configured) the student's self-evaluation shown as read-only context; the student's single note shown distinct from the evaluator's comment |
| Batch | EV-05 | Several skills in one sitting, each with its own outcome and comment |
| Feedback | EV-06, SC-14 | Mandatory comment enforced where the program set it; optional elsewhere |
| Routing | EV-07, SC-15 | Per skill, told before and after submit whether it counts now or is held for approval |
| Role limits | SC-16 | The evaluator can only reach a request addressed to a role the skill permits (enforced at send in S-13 `ST-08`; S-16 never offers a role switch) |
| Self-eval | SC-15, ST-11 | Self-evaluation block shown read-only where the skill is configured for it |
| Evaluation models | SC-03, SC-04, SC-05, SC-07, SC-08 | Control rendered from the skill's model: binary labels, Yes/No per question, scored scale, ordered levels |
| Immutability | RV-03, RV-05 | Once submitted the link shows "already submitted" and nothing is editable |
| Lab instructors | SL-08, SL-09 | Evaluator may be a name+email recorded by the program or named by a student |
| Engine | AE-01 | Evidence counts only when complete (and approved where required) |

**Open decisions and seams.**
| OD | Seam in this surface | Default (reversible) |
|---|---|---|
| OD-06 roles fixed vs program-defined | Role label rendered from data; three seeded rows | Three roles |
| OD-08 corrected submission: evaluator starts afresh or sees previous answers | The form accepts an optional `previousEvaluation` snapshot to prefill and mark | Not prefilled; shows "A previous evaluation was returned" only if one exists `[INFER]` |
| OD-17 does the evaluator see the student's achievement? | No achievement fields in the S-16 data contract at all | **Not shown** (DEFECT-05) |
| OD-18 link lifecycle (expiry, reuse, revoke, resend) | Single `LinkState` enum drives the standalone page; copy neutral | Neutral copy; see cross-cutting §10 L-1..L-10 |
| OD-14 partial save | Draft autosave is per field against the token; no student-side dependency | Autosave on (evaluator persona); REQ silent `[INFER]` |
| OD-16 return target | After a return the evaluator may or may not receive a new request | Not designed here; student-corrects is the recommended branch `[INFER]`, in S-13/S-14 |
| OD-03 | No skill status shown on S-16 | n/a |
| OD-24 | Skill deactivated while a request is open: the link still resolves; behaviour undefined | Show the form unchanged and flag the question; do not invent copy |

## 6. Prototype reference (keep / do not copy)

Screens: `docs/source/screens/23-preceptor-form.png`, `24-preceptor-submitted.png`. Wireframe: `docs/ux/07 S-16`.
**Keep `[PROTO]`:** per-skill numbered cards headed "n. Skill — Model" (the prototype's trailing "Achievement" word is a label for the criteria line, which is NOT carried over: see the next list); "Supplied by the student" block; "Goes to review" badge; Submit disabled until valid; comment marked required with the line "This program requires a comment on this skill."
**Do not copy:**
- The admin shell and sidebar around the form (DEFECT-06).
- The post-submit table that reveals "4 / 3 qualifying evaluations · Achieved" (DEFECT-05, OD-17).
- The "Evaluations sent" mailbox list as part of S-16; it is a demo of the inbox.
- The "Achievement: 5 demonstrations · 1 observed · …" criteria line inside the evaluator's skill header; it tells the evaluator the program's threshold and can bias the answer `[INFER; REQ silent]`. Show the skill name and model only.

## 7. Pattern and reference hub

- **Pattern:** standalone route (`/e/{token}`), one column, max width about 720px on desktop, full-width on mobile. No shell. Wordmark and request context only `[REQ EV-01]`.
- **Regions (top to bottom):** header (student, course, requested date, "You are completing this as {role}"); progress line ("1 of 2 answered") that is text, not colour-only; skill cards in order; footer with the explanatory line and the only filled primary `Submit evaluation`.
- **Skill card anatomy:** number and skill name; setting line (Clinical (setting) at location, or Lab or simulation); routing line ("This skill counts as soon as you submit." or "This skill is held for administrator approval after you submit."); collapsible "Supplied by the student" block (expanded by default for the first skill) with the student's note; self-evaluation read-only line if configured; answer group; comment field (required or optional).
- **Mobile `[INFER]`:** same single column; answer options stack full width; sticky submit bar shows count of unanswered and the missing item on press.
- **Faculty-in-Prism variant:** identical component rendered inside the Prism shell `[REQ §7 intro]`; not a separate design.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** `RadioGroup` for Yes/No, levels and scores; shared `EvaluatorAnswerGroup` composition (HAND-ROLL, one file, shared with S-13 self-evaluation). `Field`, `Textarea`, `Button`, `LocalBanner` IMPORT. No app shell. Large targets for mobile.


| Need | Component | Verdict (proposal) | Evidence |
|---|---|---|---|
| Answer groups | `RadioGroup` (`itemVariant` default/outline/secondary/destructive/success/warning/muted; `itemSize` default/sm/lg; `itemMotion`) | IMPORT; use `itemSize="lg"` for targets | `node tools/ds/source.mjs RadioGroup` |
| Comment | `Textarea`, `Field`, `FieldLabel`, `FieldError` | IMPORT | `source.mjs Textarea`, `Field` |
| Submit | `Button` `variant="default"` `size="lg"`; secondary links `variant="link"` | IMPORT | `source.mjs Button` |
| Banners | `LocalBanner` (`error`, `success`, `info`) | IMPORT | `source.mjs LocalBanner` |
| Loading | `Skeleton` | IMPORT | `source.mjs Skeleton` |
| Disclosure of student details | `Collapsible` or a plain section | IMPORT | exported (earlier check) |
| Routing badge | `Badge` `variant="outline"` | IMPORT | `source.mjs Badge` |
| Request summary | `EvaluationRequestSummary` | HAND-ROLL on tokens | `docs/ux/10 §5` |
No raw `<button>`, no hardcoded colours, no toast, no icons on the submit button.

## 9. Layout, content and behaviour

| Model | Control | Notes |
|---|---|---|
| Overall Binary Outcome | `RadioGroup`, two options labelled with the program's labels | Which label qualifies is **never** shown to the evaluator (`SC-03`) `[INFER]` |
| Question-Level Qualitative | One `RadioGroup` Yes / No per question | Large targets; every question required |
| Scored / Likert | `RadioGroup` of the program scale per question | Scale labels from data; no red scoring colours |
| Demonstration-Level Outcome | `RadioGroup` of the ordered levels | Order as configured, most supervised first |
| Comment | `Textarea` in a `Field`; label "Your comment (required)" or "(optional)" | `SC-14` |
Single choice is a radio group, not a multi-select toggle (cross-cutting; critic N1).

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour | Source |
|---|---|---|
| **L** Loading | Skeletons in header and skill-card shapes; do not render the form until the request resolves | P-14 |
| **E** Empty | A request always has at least one skill; zero skills renders the "cannot be used" page (treated as invalid) | EV-05 |
| **Er** Link invalid / expired / revoked | Standalone page: "This link cannot be used. Contact the student or program that sent it." No data, no hint of reason | ⚑ OD-18, `ux/09` |
| **Er** Already submitted | "An evaluation has already been submitted for this request." No answers shown | ⚑ OD-18, RV-05 |
| **Er** Submit fails | Banner: "Your evaluation was not submitted. Your answers are kept. Try again." Answers retained | P-17 |
| **Er** Autosave fails | Quiet inline "Not saved" with retry; never blocks answering | INFER |
| **V** Validation | Press on disabled Submit announces the first missing item; inline "Add a comment for {skill} before you submit. The program requires one." and "Answer every question for {skill} to submit." Focus moves to the first invalid control | EV-06, SC-14 |
| **S** Submitting | Button `disabled` + `aria-busy`, label "Submitting"; no optimistic success | P-14, AE |
| **Su** Success | Confirmation page: per skill "recorded. It counts toward the student's record now." or "recorded. It is held for administrator approval and does not count until approved." No student status | EV-07 |
| **D** Disabled | Submit disabled until every skill answered and mandatory comments present; a visible count says what remains | EV-06 |
| **P** Partial | Multi-skill: answers may be partial; autosaved; "1 of 2 answered"; submit sends all skills together | EV-05 |
| **Bl** Blocked | A role not permitted for a skill cannot reach the form (blocked at send, `ST-08`); S-16 shows no role switch | SC-16 |
| Deactivated skill, open request | Undefined (OD-24); no copy invented | OD-24 |

## 11. Edge cases

EC-17 evaluator unavailable → the student resends elsewhere (`RV-04`); EC-19 admin return → no new action on S-16 until a new request exists; evaluator opens the link twice; evaluator forwards the email; link scanner prefetches the URL (L-10); evaluator on a poor mobile connection mid-form; keyboard-only completion; screen-reader completion; two skills with different models in one sitting; one skill needing a comment and one not; (the case "configured self-evaluation but none recorded" cannot reach the evaluator because S-13 disables Send until the self-evaluation is complete, DEC-001; it can occur only if OD-14 partial save is accepted, and then the form shows "The student did not add a self-evaluation" `[INFER]`).

## 12. Copy and interactions

Source: `docs/ux/09 §5 S-16` and `§6`. Required keys: header, subline, per-skill header, setting line, student details, self-evaluation block, question control, level control, comment (required/optional), comment error, incomplete answers, routing badge, submit, footer, result banner, counts-now, held, error, invalid link, already submitted. Copy that depends on open decisions stays neutral. Professional register, sentence case, no em-dashes, no colloquialisms, no internal notes `[workspace memory]`.

## 13. Accessibility (WCAG 2.1 AA)

- Landmarks: `main` only; `h1` is "Evaluate {student}"; each skill is a `section` with a heading.
- Radio groups have a group label (the question or "Demonstration outcome"); arrow-key navigation; selected state is not colour-only.
- Targets 44px or larger `[INFER]`; no hover-only affordances; text reflows to 320 CSS px.
- Focus: on load the page title receives focus; "Skip to first unanswered" link; after a validation failure focus goes to the first invalid control.
- Live region announces autosave status and submit result.
- Page `lang` set; no auto-advancing; no timeouts that discard answers.
- Test with VoiceOver and with keyboard only; run axe at default, validation-error, invalid-link and confirmation states `[ds-conformance-reviewer]`.

## 14. Out of scope

QR codes `[CALL 09-23, not in REQ]`; reminders and escalation `[REQ §14]`; evaluator accounts; evaluator dashboards or histories; showing student progress; editing a submitted evaluation; email deliverability engineering (see S-18 questions); mobile native apps.

## 15. Acceptance tests (Given / When / Then)

| # | REQ | Test |
|---|---|---|
| AT-1 | EV-01 | Given an emailed link, when opened in a private browser with no cookies, then the form renders with no sign-in prompt and no account is created |
| AT-2 | EV-02 | Given requests addressed to a preceptor, a clinical faculty member and a lab instructor, when each opens their link, then each completes the same form and the recorded role matches the request |
| AT-3 | EV-03 | Given any skill, when the page renders, then there is no control that changes labels, questions, scale, levels or rules |
| AT-4 | EV-04 | Given a skill with a self-evaluation and student details, when the form opens, then both appear read-only before the answer controls |
| AT-5 | EV-05 | Given a request for 3 skills, when the evaluator answers all and submits once, then three evaluations are recorded each with its own outcome and comment |
| AT-6 | EV-06, SC-14 | Given a skill with a mandatory comment, when submit is pressed with the comment blank, then submission is blocked, focus moves to that comment and the message names the skill |
| AT-7 | EV-07, SC-15 | Given a skill with approval on and one with approval off, when the evaluator submits, then the confirmation says "held" for the first and "counts now" for the second and no student status is shown |
| AT-8 | SC-16 | Given a skill that permits only lab instructors, when a student tries to send it to a preceptor in S-13, then the send is blocked with a reason and no S-16 link is created |
| AT-9 | SC-03, SC-04, SC-05, SC-07, SC-08 | Given one skill of each model, when rendered, then each shows the matching radio group with program-defined labels in the configured order |
| AT-10 | ST-12 | Given a student note and an evaluator comment, when rendered, then the two are visually and programmatically distinct |
| AT-11 | RV-03, RV-05 | Given a submitted request, when the link is opened again, then no editable controls render and the already-submitted page shows |
| AT-12 | SL-08 | Given a lab instructor recorded with name and email only, when a request is sent, then the email goes to that address and the instructor completes it with no account |
| AT-13 | AE-01 | Given an evaluation held for approval, when the achievement for the skill is computed, then it is excluded until approved |
| AT-14 | EV-08 | Given roles stored as data, when a fourth role row is added in a test fixture, then S-16 renders it with no code change |
| AT-15 | OD-17 | Given any submit confirmation, when inspected, then it contains no achievement status or count of the student's evidence |
| AT-16 | OD-18 | Given an invalid, revoked or already-used link, when opened, then the page is neutral, shows no student data and states no expiry rule |
| AT-17 | a11y | Given a keyboard-only user, when completing the form, then every control is reachable, focus is visible and the result is announced |
| AT-18 | ST-08 | Given a request can only be created for a role valid for the setting (tested in S-13), When an evaluator opens any link, Then they never see a request for an invalid role and setting combination. |
| AT-19 | ST-11 | Given a skill configured for self-evaluation, When the evaluator opens the form, Then the student's answers are shown read-only as context beside the evaluator's own controls (EV-04). |
| AT-20 | SL-09 | Given a request addressed to an instructor named by the student and not yet on the roster, When the evaluator opens the link, Then the form renders identically and says nothing about roster status (adoption is tested in S-07). |

## 16. Risks and unknowns (max 3)

1. **FAST dependency:** whether the form is a FAST runtime-generated form or a native page is unresolved `[CALL 09-23]`; REQ does not name FAST. The contract describes behaviour, not implementation.
2. **Link lifecycle undefined (OD-18):** a wrong default can strand evidence or widen exposure.
3. **Disclosure drift:** pressure to show student progress to evaluators (the prototype does) conflicts with FERPA scoping unless OD-17 is decided.

## 17. Vault notes consulted

- `~/Documents/research-repos/Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw): delegator links unique, forms generated from configuration, FAST feasibility open, lab technician workaround, QR mention.
- `~/Documents/research-repos/Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md`: evaluations sent to whoever worked with the student that day.
- `docs/ux/07 S-16`, `08 P-13/P-14/P-17`, `09 §5–§6`, `03 §2.3, §9`, `docs/strategy/06`, `07`, `journeys/03`; `_Insights.md` index entries for the two meetings above only.

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

**Review log.**
| Reviewer | Verdict | Date |
|---|---|---|
| ds-adoption-reviewer | not yet run | — |
| skills-requirements-auditor | not yet run | — |
| skills-ux-critic | not yet run | — |
| Romit confirmation | pending | — |

**Contradictions found while drafting (carry to the fix pass).**
1. `ux/07 S-16` says "You are signing as {role}" while `ux/09` says "You are completing this as {role}"; this contract follows `09` (professional microcopy source).
2. `ux/07 S-16` shows an "Exxat Prism" wordmark and "Exxat chrome" only as wordmark; `ux/03 §2.3` says nothing else reachable. Wordmark is allowed, no links.
3. `ux/07` states per-field autosave `[INFER]`; no document says where drafts are stored without an account (cross-cutting L-7).
4. `ux/07` header repeats the achievement criteria in the prototype card; this contract removes the criteria line from the evaluator view as a bias risk `[INFER]`; confirm with Sankalp.
5. `ux/03 §9` shows Faculty "W via token or Prism"; S-16 therefore has two render contexts (shell-free and in-shell) that need one shared component.

**Deviations from the cross-cutting contract.**
None, except the single-use link decision which is intentionally left to OD-18.

## 20. What was not verified

Runtime behaviour, axe, mobile rendering, 1.6.5 component exports, the FAST implementation path, any real preceptor behaviour.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-8. Weak to partial: large single-choice rows, explicit 'optional' labels, Send disabled until valid (eBay, talabat). All references are signed-in in-app feedback; none evidences the no-login email-link entry (EV-01).

## Build note (2026-10-08, fix pass)

- **Link states.** The built page keeps what the state table in this contract specifies: an invalid, expired, revoked or superseded link shows the single neutral message; only "already submitted" has its own message. A holder of a link can therefore tell that it was used. This is the contract's choice and part of **OD-18**, which stays open; if OD-18 settles on one message for every state, change `LinkMessage` and its tests only. `[INFER]` DEC-015.
- **Landmarks.** The Prism wordmark sits inside the `main` landmark so it is never outside every landmark; no banner or navigation landmark is added (EV-01).
- **Targets.** Submit evaluation is at least 44px tall (`min-h-11`).

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Two evaluator surfaces now exist. (1) The real emailed link `/e/[token]` is unchanged: shell-free, no login, no achievement or progress data, neutral link states. (2) The prototype's Preceptor Evaluation demo page `/preceptor` sits in the shell: an 'Evaluations sent' mailbox with Open link, then the same form inline ('Back to sent links', 'Evaluate student skills', 'Model · Achievement: criteria', 'Goes to review' badge, post-submit result table Skill / Recorded / Qualifies? / Progress / Status). The demo-only extras are controlled by `evaluatorSeesProgress` (default ON on `/preceptor`, never read on `/e/[token]`; parity C-6).

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-12 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** EV-01..EV-08, SC-14/SC-15/SC-16, EV-06 mandatory comment, EV-07 counts-now versus held, OD-17 safe default on the real link, OD-18 link states, DEFECT-05 closed on the real link.

**Weakened or traded away (honest list):** The demo page shows the evaluator the criteria line and the student's progress after submit, which the OD-17 safe default forbids; it is limited to the flagged in-shell demo and OD-17 stays OPEN. The in-shell form brings its own heading, so the page uses an h2 for it.
