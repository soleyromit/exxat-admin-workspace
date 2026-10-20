# V2-03a Preceptor evaluation, both skills in one pass (scenario step 8)

**Status:** Stage 3 contract. Narrows `00-cross-cutting.md` and `V2-02c`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              The evaluator form a preceptor reaches from the student's QR code, link or handed-over phone, with no
                      account. Route /v2/preceptor/preceptor-evaluation?request=<id>[&as=<personId>][&handover=1].   Wave: V2 Stage 3
Persona(s) & role:    J. Delgado, RN (preceptor, no account, hard stop). Also R. Whitmore (lab instructor) and any person on
                      record, to show the qualified-evaluator block. The student is Maya Ferreira.
Scope / data seen:    The ONE request the link names: its skills, the student's own entries for them (date, setting, location,
                      self-rating, answers, note), each skill's configured form. Never the student's achievement status
                      (OD-17 kept) and never other students.
Job-to-be-done:       Record an honest outcome for every skill the student asked about, in one sitting, in under two minutes
                      on a phone, with the program's own levels and questions, and know what happens next.
Why -> So what:       The FAQ gaps: sign-off is one skill at a time, preceptors have no read-only view, outcomes are ambiguous.
                      One pass per request removes repeated link opening. "Not yet, feedback only" gives a preceptor an honest
                      third answer that does not punish the student. The concern flag gives a preceptor a safe place to say
                      something that must not reach the student. Attestation makes the qualification rule visible at the moment
                      of signing.
Requirements:         EV-01 (no login; the link opens directly), EV-02 (preceptor, faculty and lab instructor are all evaluators;
                      valid roles depend on setting), EV-03 (the evaluator sees what the program configured and cannot alter it),
                      EV-04 (student details and self-evaluation are shown as context), EV-05 (several skills in one sitting, each
                      with its own outcome and feedback), EV-06 (feedback cannot be skipped where the program made it mandatory),
                      EV-07 (told on submit whether the evidence counts now or is held for approval), SC-14 (narrative feedback on
                      every evaluation, mandatory per skill), SC-15 (approval toggle read from the skill; the wizard control is
                      not built), SC-16 (who may sign off), SC-08 (the program's own level names), RV-03 (a submitted evaluation
                      is a record, the page then shows it read-only), AE-01 (only completed evidence counts)
Open decisions hit:   OD-17 (evaluator never sees achievement status) kept. OD-18 (link lifecycle) not decided: no expiry text.
                      OD-06 (fixed evaluator roles) untouched. OD-08 (correction clears answers or retains them) untouched, no
                      correction path here. [PROPOSED] "Not yet, feedback only" outcome (the requirements allow Met or not met);
                      confidential concern flag shown to program staff only; credential attestation before submit; overall
                      supervision rating beside a checklist; "first evaluator to finish completes a link request".
Prototype reference:  docs/source/prism-skills-prototype.html evaluator screen for layout intent only (behaviour is illustration).
                      NOT copied: a login wall, a single-skill form, a score summary.
Pattern:              One column (max 48rem). Top: who you are evaluating and a plain line "You opened this link, no account is
                      needed". Then one Card per skill (student's entry collapsed, assessment items, outcome, feedback). Then one
                      Card for the whole pass: confidential concern, credential attestation, Submit. Reference: ux/07 S-16.
DS mapping:           PageFrame/PageSection (existing), Card, Collapsible, RadioGroup (outcome, yes/no, level), Textarea, Checkbox,
                      Field, FieldError, FieldLabel, Button (default lg for the one primary), Badge/StatusBadge, LocalBanner,
                      Select (demo "open this link as") -> IMPORT. Composition only: skill assessment card, error summary with
                      field links (new-components-needed.md). No hand-rolls.
States:               L  Seed first, saved state after mount; skeleton text "Opening the request".
                      E  No request named: list of requests waiting for this evaluator (or "Nothing is waiting for you").
                         Unknown id: "This link does not match a request. Ask the student to send a new one."
                      Er Validation (below). Store refusal: LocalBanner error with the reason and what to do.
                      V  See "Validation".
                      S  Submitting: button disabled and labelled "Submitting".
                      Su Receipt: per skill outcome, "Counts now" or "Held for approval", concern recorded (without text),
                         "You can close this page". Read-only on reopen.
                      D  Submit disabled never; errors are shown instead (a disabled button with no reason is banned).
                      P  Request still on the student's phone ("Not sent yet"): explains it works once the phone is online.
                      Bl  Evaluator not on the request, unqualified for a skill (credential, years, training, role, lab
                         instructor in clinical): whole form replaced by a block naming the skill and the reason, and "Ask Maya
                         to send this request to a qualified evaluator."
                      X  Request already completed by someone else (link to several evaluators): read-only receipt naming who
                         completed it and when.
Validation:           (messages say what happened and how to fix)
                      - No outcome: "Choose an outcome for IV catheter insertion: Met, Not met or Not yet."
                      - Demonstration/overall level missing for Met or Not met: "Choose the supervision level you observed for X."
                      - Question unanswered for Met or Not met: 'Answer Yes or No to "Q" for X.'
                      - Feedback missing where mandatory or for Not yet: "Write feedback for X. The program requires it on every
                        evaluation." / "Write feedback for X. Not yet records feedback only, so the student needs your words."
                      - Feedback over 2000 characters: "Shorten the feedback for X to 2000 characters or fewer (now N)."
                      - Concern on, no description: "Describe the concern, or turn the flag off."
                      - Not attested: "Confirm your credentials before you submit."
                      A summary banner lists every problem; each item links to its field and moves focus there. Fields keep what
                      was typed. Errors clear when the field changes.
Edge cases:           Met with a No answer or a level below the program minimum is allowed and flagged beside the field ("This
                      answer does not meet the criteria; Met is still your call"); the engine then leaves it out of the rule
                      (it shows as met but not counted toward the minimum level). Two entries of one skill in a request give one
                      evaluation per skill using the latest entry. Not yet never opens a remediation plan and is not a recorded
                      pass or fail. Fail opens a plan only if the skill's failure path says so; staff can open one by hand.
                      Overall rating shown only when the skill enables it. Binary skills use the program's own outcome labels.
                      Handover (&handover=1): receipt adds "Give the phone back to Maya".
Copy:                 Page title "Evaluate Maya Ferreira". Outcome group "Outcome for X": "Met", "Not met", "Not yet, feedback only".
                      Concern: "Flag a confidential concern", help "Only program staff see this. The student never does."
                      Attestation: "I confirm I hold the credentials these skills require: RN, 2 or more years of practice,
                      trained in IV therapy." Button: "Submit evaluation of 2 skills". Counts: "This counts toward Maya's record
                      as soon as you submit." / "Program staff approve this before it counts."
A11y:                 One h1, h2 per skill, fieldset/legend semantics via RadioGroup aria-label, errors linked by aria-describedby
                      and aria-invalid, summary has role=alert and takes focus, targets 44 px, status is text plus icon, no red
                      for outcomes (Not met is amber/neutral), no colour-only signals, keyboard order = reading order.
Out of scope:         Correcting a returned submission (RV-01, Stage 4). Photo-of-paper submissions (the reviewer handles them,
                      Stage 4). Reminders and escalation (section 14). Link expiry (OD-18). Lab group batch grid (step 14).
                      Wizard controls for feedback-mandatory and approval-required (SC-14, SC-15): read from data, set in seed.
Acceptance tests:     1. requestAccess: missing id, on-device, not a candidate, unqualified (per reason), lab instructor in clinical,
                      completed by another, photo request, ok (tests/v2/preceptor.test.ts).
                      2. validatePass: each message above, plus a clean pass; Not yet needs only feedback.
                      3. submitEvaluation: creates one evaluation per skill with version 1 detail; pass counts now and moves
                      progress; approval skill is held; Not yet records no pass/fail and no plan; fail with autoRemediation opens
                      one plan, without it opens none; concern stored staff-only; request becomes done; second submit refused;
                      audit entries; unqualified refused.
                      4. Browser (stage3.e2e.mjs): student requests -> preceptor link -> blocked as unqualified evaluator ->
                      validation errors with focus -> submit both skills -> receipt -> student home and history updated.
Risks / unknowns:     (1) "Not yet" stored as outcome not-yet is the engine's existing neutral outcome. (2) Confidentiality in the
                      prototype is by screen, not by access control: the shared browser store holds the note.
Vault notes consulted:Same as V2-02a.
```
