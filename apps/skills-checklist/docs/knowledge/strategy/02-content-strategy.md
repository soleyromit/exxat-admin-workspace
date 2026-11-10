# 02 Content strategy: the words, how many of them, and why

**Written:** 2026-10-26 · **Status:** proposal for Romit. No app code was changed. No `OD-*` is treated as decided.
**Siblings:** `01-information-architecture.md` (structure the words sit in), `03-ux-and-interaction.md`, `04-ui-and-visual.md`, `05-data-viz-and-charts.md` (written in parallel; chart labels and interaction copy belong there). Inputs: `../00-design-brief.md`, `../glossary.md` (the vocabulary authority), `../02-decisions-ledger.md`, `../01-competitive-digest.md`, `docs/v2/audit/T1..T4`, `docs/ux/09-content-and-microcopy.md`, `docs/build/research/v2-ia-and-content-strategy.md`.
**Tags:** `[REQ id]` · `[CALL]` · `[COMP name]` · `[BUILD-PROMPT §n]` · `[AUDIT Tn]` · `[LEDGER D-x/Q-n]` · `[GLOSSARY]` · `[UX-09]` `docs/ux/09-content-and-microcopy.md` · `[RESEARCH-v2]` the earlier IA and content research · `[V1]` shipped, tested v1 copy · `[INFER]`. `PENDING-ROMIT` = his call, both options written. Precedence REQ > CALL > PROTO > INFER. **No em dashes appear in this file or in any string it proposes** [BUILD-PROMPT §2.8].

## Why this doc exists

1. Romit's complaints are about words as much as rows: too much instruction text, "items" is the wrong word, and screens that say the same sentence two or three times [LEDGER D-B] [AUDIT T1, T3, T4]. This doc sets the rules once so a new screen is reviewed against them, not against his taste.
2. Each rule carries its reason, what we rejected and a test. Strings are examples of the rules, not a finished string table (the rename table with file:line is `../glossary.md` section 4).
3. Copy is a hard-stop surface: it can leak requirement IDs, imply Prism ships skills, or call a thing by two names. The rules here keep wording honest to the requirements.

## Reading guide: the 8 content decisions

| # | Decision | Status |
|---|---|---|
| C-1 | The program's noun is a variable, `{skill}`; "item" never reaches a user | Settled [LEDGER D-B] |
| C-2 | One word per concept; the glossary is the only vocabulary source | Settled intent [GLOSSARY] |
| C-3 | Say it once: one helper line per section, default none; a numeric text budget per element | Recommended; budgets from [RESEARCH-v2 3.1] kept |
| C-4 | Say the rule, not the verdict (every "did not count" names the failed rule and the next step) | Required [REQ SH-03] |
| C-5 | Status words come from one fixed table; no per-page synonyms | Recommended |
| C-6 | Evaluator copy is the shortest copy in the product | Recommended [UX-09] |
| C-7 | Nothing internal ever renders (IDs, ODs, names, notes, scaffolding) | Settled [memory: no internal notes in UI] |
| C-8 | Open: student noun, "In progress" vs "Not yet met", feedback-only outcome, verification vocabulary | PENDING-ROMIT (section 12) |

---

## 1. Voice and tone by role and moment

### 1.1 Base voice (all roles)

Professional, plain, calm, specific. Active voice, sentence case, no exclamation marks, no colloquialisms ("heads up", "oops"), no emoji, no em dashes [BUILD-PROMPT §2.8] [UX-09 section 1] [memory: professional microcopy].
**Why:** the audience is clinical education staff and learners handling assessment records; levity reads as unserious on a record that affects progression. **Rejected: a friendly, conversational voice for students.** Student stress is highest exactly when a skill did not count; warmth is delivered by specificity and a next step, not by tone words. [INFER]

### 1.2 By role

| Role | Register | Sentence length | Address | Why |
|---|---|---|---|---|
| Admin | Task-first, precise, consequence-aware | Up to 20 words | Imperative on buttons; third person for system facts | Configures a rule that changes other people's progress [REQ AE-02]; needs the consequence at the decision |
| Student | Plain, supportive by clarity, "you" | 8 to 14 words | "You have 1 of 2 sign-offs" | Reads on a phone between shifts; must know what to do next [REQ SH-03] |
| Evaluator | Shortest in the product; one instruction per screen | 6 to 12 words | Direct, polite ("Please") only in the email | Busy, no account, no training; target under 2 minutes [COMP: 22 s to 2.7 min] [UX-09] |
| Reviewer | Evidence-first, neutral, decisive | 8 to 16 words | States cause: "Held because the skill requires approval" | Decides fast; needs why, not readiness [AUDIT T3 gap 3] |
| Director | Brief, figure-first | 8 to 14 words | "3 verified, 1 changed" | Wants readiness and who is behind [REQ RP-05, RP-06] |

### 1.3 By moment

| Moment | Tone rule | Example (good) | Anti-example | Why |
|---|---|---|---|---|
| First use / empty library | State what will appear; say the program defines the skills | "Your skills library is empty. Add skills from a file or one at a time." | "Get started with our skills library!" | Prism ships none [REQ SL-01, §1.7] |
| Routine work | Neutral, no praise | "Request sent to J. Delgado." | "Great job!" | Praise on routine acts is noise |
| Success after consequence | State the consequence once | "Approved. 2 evaluations now count toward Maya's record." | "Approved successfully!" | Reader learns what changed |
| Waiting | Name who holds it and how long | "Waiting for J. Delgado, 3 days" | "Pending" | [REQ SH-02] requires the holder; "pending" is retired [GLOSSARY] |
| Did not meet criteria (sensitive) | Factual, rule first, then a way forward; never "failed" | "This evaluation did not meet criteria. You need 2 sign-offs from 2 evaluators; you have 1. Make a further attempt." | "You failed." | [REQ SH-03] [UX-09 section 7] |
| Returned | Who, why, what to do | "Dr. Lee returned this: add the setting. Fix it and send again." | "Rejected" | [REQ AR-05, RV-01] |
| Blocked | Reason plus the way out | "This setting allows only lab instructors. Choose a lab instructor." | Disabled button, no reason | [REQ ST-08] DP-4 |
| Error | What failed, then what to do, no blame | "The file could not be read. Check that it is a .pdf and try again." | "Oops, something went wrong" | [UX-09 3.2] |
| Destructive or irreversible | Put the consequence in the button; state what stays | "Publish and apply to 123 students. Completed evaluations are kept." | "Are you sure?" | The only irreversible acts are publish and verify |
| Clinical-safety adjacent | Never imply a count is proof of competence | "Counted: 4 of 5." | "Competent" | Counts are a floor, not proof [COMP: Dawson 2021] |

**Review check:** read the string aloud as that role at that moment; if it would feel patronising, vague or alarming to them, rewrite.

---

## 2. Vocabulary governance

### 2.1 The rule

`../glossary.md` is the **only** vocabulary source for UI strings (its section 2 table: Use / Not / Who / Config). This doc does not redefine terms; it governs how they are applied and kept.

| Rule | Why | Check |
|---|---|---|
| **"Items" is banned in UI.** Use the precise noun: skill (`{skill}`), submission, evaluation, open request, change | "Item" is the build prompt's internal generic, never a REQ word; v2 leaks it in about 20 strings, mostly the review queue [GLOSSARY 1.2] [LEDGER D-B] | grep `\bitems?\b` in user-visible strings returns nothing |
| **The program's noun is a variable.** Skill, Competency, EPA, Essential or Procedure comes from one term map (`{skill}`, `{skills}`, `{Skill}`, `{Skills}`, article a/an) | Build prompt rule 6; OD-28 (one list or two) is open and calls drift toward one umbrella list, so the noun must stay swappable [BUILD-PROMPT §2.6] [CALL 10-08, 10-09] | No hard-coded "skill" in nav, titles, buttons; v2 has about 580 literal occurrences to move behind `lib/v2/terms.ts` [GLOSSARY 4.6] |
| **One word per concept, one concept per word.** The student's sent thing is a submission; the message to an evaluator is a request; "Record" is the student's own history only | v2 used "request", "submission" and "item" for one object and "Records" for four things [GLOSSARY section 1] | Glossary "Not" column grep per release |
| **Nav and page titles read from the term map**, not literals | If the program says "Competencies", the nav says Competencies | Rename the noun in the term map in a test; every nav row and title follows |
| **REQ's own words win** for requirement concepts (Met/Unmet default, Did not meet criteria, Awaiting approval, mandatory / non-mandatory) | The requirement doc and tested v1 copy already settled these [REQ section 4.1, SH-02, CM-03] [V1 DEC-003] | See section 6 |
| **Never say "pending", "reject", "fail", "retake", "entry" alone, "ticket", "record" as a verb** | [GLOSSARY] banned list | grep |
| **Never name Prism as the supplier of skills**; no nursing-specific default wording | [REQ SL-01, §1.6] | Examples use neutral placeholders |
| **Program-defined labels stay program-defined**: outcome labels, level names, clinical settings, evaluator role names are data, not copy | [REQ SC-03, SC-08, SL-07] [AE-06] | No literal "Pass/Fail" or "Inpatient" in components |

### 2.2 Adding or changing a term

1. Propose in `../glossary.md` with Use, Not, Who, Config, source tag. 2. If the source is an `OD-*`, mark it and keep a neutral wording until decided [UX-09 "neutral on undecided behaviour"]. 3. Add the rename rows (file:line) and the tests that assert current strings. 4. Only then change UI.
**Why this order:** v2 introduced "verification", "student record" and "log" without a source, so they sit as `[INFER]` and are now contested [GLOSSARY 2.1]. **Rejected: let writers coin terms per screen.** That is how one object got three names.

### 2.3 Features whose vocabulary is itself contested (flag, do not extend)

| Term | Problem | Rule until Romit decides |
|---|---|---|
| Remediation | REQ section 14 excludes a remediation workflow [REQ 14] | No new copy; leave existing strings, do not add nav or KPI copy |
| Starter libraries | Conflicts with "no shipped skills" [REQ SL-01]; prototype says "starter template" | If kept, frame as "a copy your program owns and edits" [COMP rec 12] |
| Verification / verified record | Not in REQ, calls or build prompt; prototype's "Unverified" means an evaluator name not yet adopted [GLOSSARY section 1 point 4] | Keep "Verification" for the director act only; never use "verified" for evaluator adoption; use "Adopted"/"Not yet recorded" for evaluator names [INFER] |
| Reopen / edit a counted evaluation | [REQ RV-03, RV-05] immutable | "Request a correction" or "Add a correction", never "Edit" or "Reopen to edit" [GLOSSARY 4.5] [LEDGER Q1] |

---

## 3. Patterns: titles, headings, labels, buttons (with real before and after)

### 3.1 Pattern rules

| Element | Pattern | Why |
|---|---|---|
| Page title (h1) | Nav label, or the object name on a sub-page. 1 to 3 words on nav pages, up to 6 on object pages. No verbs, no "your", no process words | Titles are wayfinding; the nav row is the anchor [RESEARCH-v2 3.1] |
| Student page titles | May use "Your" for personal objects: "Your record" | Personal ownership is the point [GLOSSARY 4.2 row 42] |
| Section heading | A noun, 4 words max, count in brackets for lists: "Awaiting approval (9)" | Scannable; tabs read alone in a screen reader [GLOSSARY 4.3 row 55] |
| Button | Verb + object; consequence in the label when irreversible; max 4 words; text-only on action buttons | [UX-09 3.1] [memory: no icons on CTA buttons] |
| One filled primary per surface | The only filled button is the thing the role came to do | Hierarchy; [UX-09] |
| Column header | Noun, no category prefix repeated in rows | [RESEARCH-v2 3.1] |
| Link text | The record name or figure | Section 11 |
| Tab | Noun with count; same wording as the filter it replaces | Screen readers announce tabs alone |
| Breadcrumb | Once; not duplicated by a back button | [UX-03 section 3] |

### 3.2 Before and after, from real v2 strings

File paths are relative to `apps/skills-checklist/admin/`. Lines were read from a moving working tree [AUDIT T4]; re-grep before applying. "Why" names the rule broken.

| # | file:line | Before | After | Rule |
|---|---|---|---|---|
| 1 | `lib/v2/roles.ts:50` | nav "Dashboard" | "Home" | One landing word for every role [AUDIT T4 P3-3] |
| 2 | `lib/v2/roles.ts:51` | "Skills library" | `{Skills}` (program noun), Library as first tab | Short, configurable [GLOSSARY 4.2 row 19] |
| 3 | `lib/v2/roles.ts:53` | "Review and approve" | "Approvals" | Two verbs; a second "Review and ..." exists (publish) [GLOSSARY section 1 point 7] |
| 4 | `lib/v2/roles.ts:54` | "Outcomes" (a list of evaluations) | "Attainment" / merged into Students | "Outcome" is the result of one evaluation, not a page [REQ SH-02] |
| 5 | `lib/v2/roles.ts:74` | "Log skills" | "Log" | Verb; plural redundant |
| 6 | `components/v2/v2-titles.ts:22` | "Review item" | "Submission" | "Item" banned [LEDGER D-B] |
| 7 | `components/v2/review/review-queue-page.tsx:164` | "No items match these filters." | "No submissions match these filters." | Precise noun |
| 8 | `review-queue-page.tsx:111` | KPI "Awaiting review" | "Awaiting approval" | REQ state word [REQ AR-01] |
| 9 | `components/v2/review/review-queue-page.tsx:85` (via [RESEARCH-v2 3.5 row 1]) | subtitle "{code}, {term}. Evaluations waiting for approval and photos of signed paper forms. Nothing here counts until you approve it." | subtitle "{code}, {term}"; button "Approve and count" | Consequence moves onto the action |
| 10 | `review-queue-page.tsx:123` | "Tick several to approve them together. Open a student's name to compare the evaluation with their self-rating, or to send it back." | delete | Explains the UI; fix the control instead |
| 11 | `lib/v2/outcomes.ts:10` | "Did not meet the criteria" | "Did not meet criteria" | REQ and V1 wording, tested [REQ SH-02] [V1 copy.test.ts:77] |
| 12 | `lib/v2/config.ts:27` | default labels "Met" / "Not met" | "Met" / "Unmet" | REQ default [REQ section 4.1] |
| 13 | `components/v2/viz/tokens.ts:18` | "Waiting for review" | "Awaiting approval" | One phrase for one state |
| 14 | `components/v2/student/student-home.tsx:107` | "Optional (n)" | "Non-mandatory (n)" | [REQ CM-03]; "optional/required" banned [UX-09 §2] |
| 15 | `components/v2/student/log-flow.tsx:416` | "Ask for sign-off" | "Send for evaluation" (PENDING-ROMIT: student noun) | Names the act, not the form; "sign off" stays a verb [GLOSSARY 4.4 row 82] |
| 16 | `components/v2/student/request-signoff.tsx:253` | "Your requests (n)" | "Your submissions (n)" (PENDING-ROMIT) | The record is a submission [GLOSSARY] |
| 17 | `lib/v2/student.ts:364` | "Waiting on sign-off" | "Waiting for J. Delgado" | Name the holder [REQ SH-02] |
| 18 | `components/v2/outcomes/evaluation-page.tsx:158` | "Reopen to edit" | "Request a correction" | Immutable evaluations [REQ RV-05] |
| 19 | `components/v2/outcomes/remediation-page.tsx:135` | "Log a new attempt" | "Make a further attempt" | Attempt = new separate submission [REQ RV-03] |
| 20 | `admin/import-panel.tsx:118` | "Use the list you already have. No template or column order is needed. Skills are proposed for your review, and nothing is created until you confirm." | "Skills are proposed for review first." | Say it once; the review table is the proof [REQ IM-05] [AUDIT T4 text cut 2] |
| 21 | `admin/import-panel.tsx:217` | "These lines were not read as skills. They are shown as written so nothing disappears quietly. Add any skill you need after you create the others." | heading "Lines not read as skills"; list below | Also removes an instruction pointing at a control that does not exist (no manual create [REQ IM-12]) [AUDIT T1 summary 4] |
| 22 | `admin/wizard-steps.tsx:371` | "Require administrator approval: A completed evaluation waits for an administrator to approve it before it counts toward the student's progress." | label "Require approval" + tooltip with the sentence | Label is self-explanatory; definition to `Tip` [AUDIT T4 cut 4] |
| 23 | `admin/wizard-steps.tsx:370` | "Require written feedback: The evaluator cannot submit without a narrative comment. Turn off to make feedback optional." | "Require written feedback" + tooltip "The evaluator cannot submit without a comment." | Second sentence restates the toggle |
| 24 | `lib/v2/rules.ts:213` | "This is a strong rule. It asks for repeat evidence from several people." | delete | Editorialising; the rule sentence above already says it |
| 25 | `admin/configure-wizard.tsx:221` | "Evaluations already completed are not changed" | "Completed evaluations are kept. Students' progress is recalculated: 6 students change status." | True of records, misleading about achievement [REQ AE-02] [AUDIT T1 summary 3] |
| 26 | `student/student-home.tsx:41-53`, `student-frame.tsx:32`, `lib/v2/student.ts:360` | conflict stated three times: banner "1 conflict needs you", card "Fix 1 sync conflict / Two versions of the same entry disagree. Nothing is lost until you choose." and button "Open sync and fix conflicts" | One card only: "1 change needs you. Nothing is lost until you choose." Button "Fix change" | Say it once [AUDIT T4 cut 11] |
| 27 | `student/history-page.tsx:163` | "A completed evaluation is never edited. A correction adds a version and keeps the earlier ones." on every expanded evaluation | delete here; keep on the version timeline | Repetition |
| 28 | `student/history-page.tsx:198,200` | "Your program director has not verified your record yet. You can share a verified record once they do." | status chip "Not verified" + one line | Only if verification is kept |
| 29 | `preceptor/evaluation-form.tsx:278,339,347` | skill name repeated four times per card: card title, "What Maya supplied for ...", "Outcome for ...", "Feedback for ... (optional)" | title once; "Student's entry", "Outcome", "Feedback" | Repetition [AUDIT T3] |
| 30 | `preceptor/evaluation-form.tsx:341,349` | "Feedback only. No pass or fail is recorded." and "0 of 2000 characters. The student reads this." | counter appears at 90 percent; first line only if the outcome exists | Noise [AUDIT T3] |

---

## 4. How much text per surface (the text budget)

### 4.1 Rule and reason

Visible instructional prose is a **budget**, not a style. Measured v2 state: 106 subtitle, section-description and muted helper strings totalling 1,470 words, median 14 words, 47 of them 15 words or longer [RESEARCH-v2 finding 1]; sentences repeated 2 to 3 times per page [AUDIT T1, T3, T4]; zero requirement IDs rendered on 23 sampled routes (keep it so) [AUDIT T4]. Most explain how to operate the UI or restate the title.
**Why a number:** "less text" is unreviewable; a number is. **Rejected: remove all helper text.** Some copy is required by the requirements (the failed-rule sentence [REQ SH-03], privacy facts, irreversible consequences). The test is "does the reader need it before the next action", not "is it short".

### 4.2 Element budgets (kept from [RESEARCH-v2 3.1], extended)

| Element | May contain | Must not contain | Limit |
|---|---|---|---|
| Page title | Nav label or object name | Verbs to the user, "your" (except student personal pages) | 1 to 3 words (nav), 6 (object) |
| Subtitle | Scope facts only: course, term, cohort, one state fact | Instructions, restating the title | **Default none.** 12 words max |
| Section heading | Noun + count | Questions, "Where each item goes" | 4 words |
| Section description | A rule the reader cannot guess that changes their next action, or a privacy fact | Sort order, how a control works | **Default none.** 10 words; **one per section** |
| Field helper | Format, limit, requirement | What the label already says | 12 words |
| Row primary / secondary | Object name / one state or provenance fact | Sentences | 6 / 8 words |
| Status text | A word from the section 6 table | New synonyms | 4 words |
| Empty state | What will appear + the one action | Product explanations | Title 6, body 14 |
| Banner (`LocalBanner`) | A state change, a block with its fix, or an irreversible consequence | Tips, onboarding | Title 8, body 20 |
| Confirm dialog | Consequence + what is kept | Restating the page | Title 6, body 20 |
| Button | Verb + object | "Submit", "OK" | 4 words |
| Tooltip (`Tip`) | Definition, basis of a number, why disabled | The only copy of required information (phones have no hover) | 20 words |
| "How this is counted" sheet | Method, basis, provenance | Anything needed to finish the task | 1 per page |
| **Prose above the fold** | Everything above except data, labels, buttons | | **Desktop 40 words; phone 25; evaluator form 15** |

**Changes from the earlier budget:** (a) one description per **section** and none per control group where a heading already exists; (b) evaluator form gets its own, stricter ceiling because the evaluator has the least context and time; (c) confirm-dialog row added; (d) phone ceiling applies to student and evaluator surfaces regardless of the web-first decision, because narrow widths are where overruns show first [INFER].

### 4.3 Where text goes instead

Apply in order, stop at the first match [RESEARCH-v2 3.3]:

```
quantity / comparison / distribution?  -> a visual with the number on it; delete the sentence  (see 05-data-viz-and-charts.md)
tells how to operate the UI?           -> delete; fix the control (label, affordance, disabled reason)
what happens after an action?          -> put it on the action: button label, confirm dialog, inline result
a status?                              -> StatusBadge, icon + word from section 6
a rule the reader cannot infer?        -> one line, 10 words, next to the control it governs
a method, basis or provenance?         -> Tip (1 sentence) + the page's single "How this is counted" sheet
anything else                          -> delete
```

| Destination | Use for | Not for |
|---|---|---|
| Tooltip (hover/focus) | Definition of a column or KPI; why a control is disabled | Anything a phone user needs: no hover |
| Empty state | What will appear here and the one action that makes it appear | Tutorials |
| Inline error | What is wrong with this field and how to fix it | General advice |
| Confirm dialog | Irreversible consequence and what is kept | Restating the page |
| Banner | A state that changed or a block with its fix | Permanent explanations |
| Sheet | Method and provenance; one per page | Required task information |
| Disabled control | Keep the reason reachable: `Tip` on desktop; printed as the helper line on phone | A grey button with no cause |

**Review check:** count the words above the fold excluding data, labels and buttons; compare to the ceiling; for each sentence ask "which row of the table above does this belong to".

### 4.4 Examples of the budget at work (T4 and T3 cuts that were adopted)

| Surface | Before | After | Saved |
|---|---|---|---|
| Admin Home | 9 rows of "X, Y, Z and 12 more" lists, 410 words, 37 links | counts + button + first item | about 40 percent [AUDIT T4] |
| Reports | 5 explanatory paragraphs + 70-word signature note | Tip on each figure; one "How this is counted" sheet; signature in Export sheet | 929 words to about 500 [AUDIT T4] [RESEARCH-v2 3.5 rows 5 to 10] |
| Review queue | KPI cards repeating the three tab counts; "How this is counted" sheet; bulk banner and dialog saying the same thing | tabs with counts; one line "Oldest: 12 days, Amara Nwosu"; dialog only | [AUDIT T3 simplicity] |
| Evaluator form | 4 repetitions of skill name; counters; subtitle repeating legend | see row 29 and 30 | form words about 150 to under 100 [INFER] |

---

## 5. What never appears in the UI

| Never | Why | Check |
|---|---|---|
| Requirement IDs (`SC-09`), strategy IDs (`X-`, `F-`, `N-`), `OD-n`, "per Sankalp/Aarti/Vishaka/Nipun", stakeholder names | Internal provenance is for the docs panel and code comments, not users [memory: no internal notes in UI] [BUILD-PROMPT §8.7: requirement IDs show only in the prototype's documentation panel] | grep `\b[A-Z]{2}-\d{2}\b` and `OD-` over strings; v2 currently clean [AUDIT T4] |
| "Prototype", "demo", "mock", "Sample data" in product copy | The build prompt wants a visible "Sample data" label on synthetic people, sites and evidence only; it belongs to the demo layer | One persistent label, not scattered notes |
| Scaffolding like "Opened as J. Delgado, RN" or "No account needed" repeated on every screen | Demo scaffolding [AUDIT T3] | Evaluator header states "no account needed" once |
| The word "item", "pending", "entry", "ticket" | Section 2 | grep |
| Claims about import accuracy: "AI-powered", "smart", "we understood your list", percentages | [REQ IM-13] [UX-09]; the word "AI" appears only to disclose that list text is sent to an AI service | review |
| "Failed", "rejected", "retake", red text for a shortfall | [GLOSSARY]; Aarti dislikes red in score and rating text [memory] | review |
| Nursing-specific default wording | [REQ §1.6] multi-discipline | placeholders neutral |
| Statements that Prism supplies skills | [REQ SL-01] | review |
| Statements of undecided behaviour as fact (whether a correction clears the evaluator's answers, whether no-evidence and not-qualifying merge) | OD-03, OD-07, OD-08 [UX-09] | neutral wording or hidden |
| Promises with no control behind them: "Add any skill you need after you create the others", "Kept in the audit log" with no log viewer, "add the evaluator's details to the program" | Three found in v2 [AUDIT T1, T3] | every instruction points at a control that exists |
| Hidden accessibility text that reads as clutter when visible (one line per dot on Outcomes, 914 words) | Confirm it is screen-reader only; if visible, cut [AUDIT T4] | inspect |

---

## 6. Status and outcome wording system

### 6.1 Principles

One value, one label, everywhere (a label appears in nav tabs, chips, aria-labels, tests and exports identically). **Four different concepts are kept apart because mixing them was the biggest wording defect:** the *outcome of one evaluation*, the *state of one submission*, the *state of a skill record*, and the *overlay* "waiting" [REQ SH-02, AE-04, AE-01] [GLOSSARY section 1 point 6]. Status never relies on colour: glyph + word always [BUILD-PROMPT §2.7]. Below-bar is amber or neutral, never red; red only for hard blocking errors [memory: Aarti no red].

### 6.2 Outcome of one evaluation

| Label (default) | Meaning | Source | Notes |
|---|---|---|---|
| **Met** / **Unmet** | Binary skill, default program labels; programs may rename (Pass/Fail) | [REQ section 4.1, SC-03] | v2 default is "Not met": change [GLOSSARY 4.3 row 57] |
| **Did not meet criteria** | An evaluation that does not qualify under the skill's current rule | [REQ SH-02] [V1 DEC-003] | Always with the failed rule (section 7.4). Never "Did not meet", "Not met", "Failed" |
| (Question-level, scored, demonstration models) | Show the program's answers/levels, then "Qualifies" or "Did not meet criteria" | [REQ SC-05..SC-08] | The engine decides qualification, not the evaluator [COMP: Trajecsys; REQ AE-02] |
| **Feedback only** | Third evaluator answer: no pass/fail recorded | Not REQ; [COMP rec 5]; v2 label "Not yet, feedback only" | PENDING-ROMIT; if kept use "Feedback only" (the v2 label collides with "Not yet met") [GLOSSARY 4.3 row 61] |

### 6.3 State of a submission (what the student sees per submission)

| Label | Meaning | Who holds it shown as | Source |
|---|---|---|---|
| **Waiting for {name}** | Sent; no completed evaluation yet | Evaluator's name | [REQ SH-02] |
| **Awaiting approval** | Evaluation complete, held for approval; does not count | "Waiting for approval by {program}" is allowed as the long form | [REQ SC-15, AR-01, AE-01] |
| **Counted** | Counts toward achievement | none | [REQ SH-02] |
| **Did not meet criteria** | Completed, does not qualify; a further attempt is a new submission | none | [REQ SH-02, RV-03] |
| **Returned** | Reviewer returned it with a reason; student can revise | Reviewer's name + reason | [REQ AR-05, RV-01] |
| **Not sent** (student side) | Saved on the device or unsent | none | offline states |

"Waiting" and "awaiting approval" are overlays on state, never states in the engine, and **pending evidence never counts** [BUILD-PROMPT §5] [REQ AE-01]. Do not say "pending" anywhere.

### 6.4 State of a skill record

| Label | Meaning | Source | Notes |
|---|---|---|---|
| **No evidence yet** | No completed evaluations | [REQ AE-04] [UX-09 §4] | Distinct from "not mapped" |
| **Evidence does not qualify** | Evidence exists, none qualifies | [REQ AE-04] | OD-03 open on whether to merge these two; build both labels, merge by configuration [UX-09 §4] |
| **In progress** | Some qualifying evidence, criteria not yet met; sub-line "2 of 3 qualifying evaluations" | [REQ AE-04] [UX-09 §4] [PROTO] | **Conflict:** `../glossary.md` says "Not yet met". I recommend "In progress" because "Not yet met" collides with "Not yet" (feedback only), has three drifted spellings in v2 ("Not met yet", "Not yet", "Not yet met") and reads as a failure; the sub-line carries the precision. PENDING-ROMIT; align the glossary after the call. |
| **Achieved** | Every criterion met | [REQ AE-03] | Never "Complete", "Passed" |

### 6.5 Other status vocabularies

| Domain | Labels | Rule |
|---|---|---|
| Review queue tabs | Awaiting approval (n) · Stalled (n) · Returned (n) | "Stalled" = the evaluator has not answered the request; correct usage [GLOSSARY 4.4 row 68] |
| Why held (queue column) | Skill requires approval · New evaluator name · Paper form | The cause, not readiness [BUILD-PROMPT aprqueue] [AUDIT T3] |
| Self vs evaluator | Agreed · Differed · Not comparable | One signal per row (the v2 item page shows three) [AUDIT T3] |
| Evaluator identity | Adopted · Not yet recorded (n) | Do not use "Verified/Unverified" for names: collides with verification [GLOSSARY] [INFER] |
| Sync (student device) | Saved on this device · Syncing · Synced · Conflict | One chip; "changes" not "conflict items" [GLOSSARY 4.1 row 17] |
| Configuration | Not configured · Configured · Published | [REQ IM-09, IM-10]; "Draft/Incomplete" banned [UX-03] |
| Requirement level | Mandatory · Non-mandatory | [REQ CM-03]; "recommended/optional" banned |
| Verification (if kept) | Ready · Has gaps · Changed since verified · Verified, version n | [AUDIT T3] [INFER] |
| Nudge ages | Waiting 3+ days · Waiting 8+ days | Thresholds from [BUILD-PROMPT §10 N-04, N-11] |

**Review check:** pick a status on the screen; find its row in this table; the label, the glyph and the holder match; the same value reads identically in the aria-label and the export.

---

## 7. Message formulas

### 7.1 Error (system or input)

`{What failed}. {What to do}.` No blame, no "oops", sentence case, near the cause, `aria-describedby`, plus a summary banner when several [UX-09 3.2, 3.3].
Good: "The file could not be read. Check that it is a PDF and try again." Bad: "Error 500." Why: the reader must act. Field form: `{Field} {problem}. {How to fix}.` ("Feedback is required. Add a comment before you submit." [REQ EV-06])

### 7.2 Blocked with reason (cannot proceed)

`{Thing} cannot {act}: {reason}. {Way out}.` Example: "No evaluator can be chosen for this setting. This skill allows only lab instructors." [REQ ST-08]. A blocked state is explained, never an empty select or a disabled button with no cause. **Why:** DP-4 and [REQ ST-08, RP-09, SC-18].

### 7.3 Empty state

`{What will appear here}. {One action}.`

| Surface | Copy | Why |
|---|---|---|
| Library | "Your skills library is empty. Add skills from a file or one at a time." | [REQ SL-01] |
| Approvals, none waiting | "Nothing is waiting for approval." (+ when no skill requires approval: "No {skills} require approval. Turn it on in a skill's settings.") | Explains the empty row [section 3.4 of 01] |
| Student with no skills yet | "No {skills} are open in {course} yet." | Says why, not "nothing here" |
| Evaluator, none | "Nothing waiting. Requests appear when a student names you." | [RESEARCH-v2 3.5 row 24] |
| Impossible filter | "No evidence exists for {site} in {setting}. This site does not offer that setting. Clear the setting filter." | [REQ RP-09]; never an empty table |

### 7.4 Failed-rule sentence (every "did not count")

Composition from [UX-09 section 7], tightened: `This evaluation did not meet criteria. {Rule, with numbers}. {Next step}.` List at most three unmet criteria, most actionable first (settings, levels, totals); end with a next action from the button vocabulary; never "failed", never red [REQ SH-03].
Worked: "You need 2 sign-offs from 2 evaluators and have 1. Send it to a second evaluator." Lab case: "Lab or simulation evidence does not count toward Inpatient. You need clinical evidence there." [REQ SC-12]. The text is generated at read time from the **current** rule, never stored, because a rule change re-applies to existing evidence [REQ AE-02, AE-06].
**Why this matters more than any other string:** only SimCapture documents showing a student why something did not count [COMP: rare]; it is one of the four rare capabilities the digest says to lead with.

### 7.5 Confirmation and success

Success banner: `{Object} {past tense verb}.` plus the consequence once ("Approved. 2 evaluations now count toward Maya's record.") and, only when a next step exists, one link ("Map it to NURS 350"). Feedback is a `LocalBanner`, not a toast, and it must be in view after the action (v2's publish banner was off screen [AUDIT T4 P2-4]).
Confirm dialog: title is the action ("Publish {skill}?"), body gives the consequence and what is kept, primary button repeats the verb with scope: "Publish and apply to 123 students". Impact is a number the admin can check, not a reassurance ("6 students change status") [REQ AE-02] [AUDIT T1 summary 3]. **Rejected: "Are you sure?"** It carries no information.

### 7.6 Warnings versus blocks (severity must be distinct)

| Severity | Words | Presentation | Example |
|---|---|---|---|
| Hard block | "Cannot" + reason | Blocking, destructive/error style, button disabled with `Tip` | "Cannot publish: 2 required fields are empty." |
| Soft warning | "Check" / "Will not block" | Informational, amber/neutral, does not stop | "3 mandatory skills are not mapped to this course. Students are not blocked." |
| Info | A fact | Neutral | "Counted evidence only." |

**Why:** a hard block must not look like a soft warning [memory: severity must be visually distinct]; the Courses warnings are "gaps that do not block anything" [RESEARCH-v2 3.5 row 12].

### 7.7 Destructive and irreversible acts in this product

Only publish (changes everyone's progress), verify (if kept), reassign a stalled request ("The first link stops working."), deactivate a skill (withdraws it from mapping and selection, evidence retained [REQ SL-11]) and approve (counts evidence). Each states the consequence on the button or in the dialog; none use "delete" because completed evaluations cannot be deleted [REQ RV-05].

---

## 8. Notifications and email copy

Scope: REQ section 14 puts notifications out of scope [REQ 14]; the only outbound message in v1 is the **evaluator invitation** [REQ EV-01]. Nudges are Recommendation with a cap of one digest per person per day and N-07 (evaluator reminder) off by default [BUILD-PROMPT §10]. In-product cues are specified in `01-information-architecture.md` section 6.

### 8.1 Evaluator invitation (the single email)

Rules: plain text first, one link, no account language beyond one line, no student progress shown to the evaluator [OD-17, DEFECT-05], no promise of a reminder, no completion-time claim until measured [UX-09 S-18 notes]. The email lists **every open request for this evaluator**, so a busy preceptor signs several students in one visit [BUILD-PROMPT evinvite]. Sentence case subject, no emoji, no exclamation.

```
Subject: {Student name} asks you to evaluate {n} {skills}          (if several students: "{n} students ask you to evaluate {m} {skills}")

Hello {Evaluator name},

{Student name} ({course code}) has asked you to evaluate {n} {skills}:
  - {Skill 1}
  - {Skill 2}
Where: {Setting at location | Lab or simulation}
You are asked to evaluate as: {Preceptor | Clinical faculty | Lab instructor}

[ Open evaluation ]

You do not need to sign in, and no account is created.
The form shows what {Program name} has set up. You record your assessment.
{Program name} may review an evaluation before it counts.

Not the right person? Please tell {Student name} so they can send it to someone else.

{Program name}
```

| Choice | Why | Rejected |
|---|---|---|
| Subject names student + count | Triage in an inbox; the first 40 characters decide whether it is opened | "Action required: evaluation request" (a phishing-lookalike) |
| One button, label "Open evaluation" | Verb + object | "Click here" |
| One "no account" line | [REQ EV-01]; the evaluator's biggest worry | Repeating it in the header, the body and the footer (v2 repeats it on the page too) |
| "{Program name}" as sender identity, no "via Prism" tagline | The program has the relationship; Prism supplies no content [REQ SL-01] | Product branding in the signature [INFER] |
| No "takes about N minutes" | Not yet measured [UX-09 S-18] | A guessed number |
| Plain "Not the right person?" line, no decline link | A decline path is not specified; promise nothing [REQ RV-04] [OD-18 area] | A decline/forward button |

### 8.2 Receipt (evaluator, on submit)

Per skill: "Counted." or "Held for approval. It does not count until approved." [REQ EV-07] plus "Back to requests" (and "Next request: {Student}" if any). One line "It cannot be changed from this page." only once. Rejected: a thank-you paragraph; the evaluator should leave in seconds.

### 8.3 In-product cues that act as notifications (text only here)

| Cue (receiver) | Text |
|---|---|
| Student, new skills | "{n} new {skills} in {course}" |
| Student, signed | "J. Delgado signed 2 {skills}. 2 counted." |
| Student, returned | "Dr. Lee returned {Skill}: {reason}. Fix it and send again." |
| Reviewer, new | badge count only |
| Admin, backlog | "{n} {skills} are not configured" (N-12) |
| Director | "{n} ready to verify, {m} changed since verified" (if kept) |
| Nudges (if enabled) | Waiting 3+ days / 8+ days / "{Skill} is one sign-off away" (N-01): factual, no urgency words |

If notifications are added later they reuse these strings.

---

## 9. Accessibility of copy

| Rule | Why | Check |
|---|---|---|
| **Reading level:** student and evaluator copy at about US grade 8; staff at about grade 10; sentences under 20 words; no idiom or abbreviation not in the glossary | Learners read tired on phones; evaluators are not trained on the product [INFER]; thresholds are a recommendation, not a REQ | Run a readability tool over each surface's strings; fix the outliers |
| **No state by colour alone**: every status is glyph + word, and the word is in the accessible name | [BUILD-PROMPT §2.7] WCAG 1.4.1 | Greyscale screenshot still readable; aria-label includes the word |
| **Link text names the destination**, never "click here" or "view"; the same text is not used for two destinations on one page | Screen-reader link lists; row-level "Open" buttons repeated 12 times fail this | List links; each is unique |
| **Icon-only controls have `aria-label`**; decorative icons `aria-hidden` | Workspace rule [CLAUDE.md] | grep |
| **aria-labels do not repeat visible text**: a table row's "Open" is "Open Maya Ferreira's record", the cell text is the name | Avoid double announcement | review |
| **Chart text equivalents**: every chart has a table version and a text summary; summary states the finding, not "chart of X" | [BUILD-PROMPT §2.7] (detail in `05-data-viz-and-charts.md`) | present |
| **Error messages are programmatically associated** (`aria-describedby`) and summarised at the top when several | [UX-09 3.3] | test |
| **Tooltips are never the only carrier** of required information | Keyboard and touch users | phone check |
| **Hidden per-item text** (the Outcomes dots) stays screen-reader-only and is concise | 914-word list was ambiguous [AUDIT T4] | inspect |
| **Plain numerals and units**: "3 days", "2 of 3", not "three"; dates in the program's locale with the year when over 6 months old | Scan speed [INFER] | review |
| **No sub-12 px text**, and no content that disappears at 200 percent zoom | WCAG; DS rule [memory] | zoom |
| **Language of the interface**: sentence case, no ALL CAPS styling for status (screen readers can spell it) | Section 3 | review |

---

## 10. Options considered and rejected (content-level)

| Option | Why attractive | Why rejected |
|---|---|---|
| Keep instructional subtitles under every title for first-time clarity | Onboarding | Measured median 14 words, 106 strings; users learn from the control; onboarding belongs in empty states and one first-run hint [RESEARCH-v2 finding 1] |
| Tooltips for everything | Clean surface | Hover does not exist on phones; required information must be inline [RESEARCH-v2 3.4] |
| "Not met" everywhere for brevity | Short | Collides with the REQ default "Unmet" and with the record-level state; v2 had 7 spellings of one value [GLOSSARY section 1 point 6] |
| Friendly student voice | Reduces anxiety | Specificity reduces anxiety more; tone words add length |
| Localised per-role vocabulary ("clinician sign-off" vs "faculty approval") | Role-natural | Same object, same word across roles is what makes "dots connect" [LEDGER D-C] |
| A style guide of 40 pages | Complete | Unread; this doc plus the glossary and a checklist is reviewable |

## 11. Link, label and writing conventions (short list)

Sentence case everywhere (titles, tabs, buttons, column headers, nav) [UX-09 1]; numerals for counts; names as the program stores them ("J. Delgado, RN"), not "Dr." added by us; dates "Oct 26" in lists and the full form in detail; abbreviations only if in the glossary; ellipses only for truncation; punctuation: full stop for sentences, none for labels and buttons; "and" not "&"; one filled primary per surface; avoid "please" except in the email.

---

## 12. Open questions for Romit

| # | Question | Recommendation | Alternative and consequence | Marker |
|---|---|---|---|---|
| Q-C1 | **Student noun: "submission" or "request"?** | Submission for the record, "request" only for the message to the evaluator [GLOSSARY 2.3] | Request throughout: fewer student-string changes (about 25), but the review queue and REQ/V1 copy then disagree and "item" has no replacement | PENDING-ROMIT |
| Q-C2 | Third skill-record state: "In progress" or "Not yet met"? | In progress with a precise sub-line | "Not yet met" (glossary today, tested in `viz.test.tsx`): matches REQ phrasing "criteria not yet met" but collides with "Not yet" and reads as failure | PENDING-ROMIT, linked to OD-03 |
| Q-C3 | Keep the evaluator's third answer "Feedback only" (not REQ; [COMP rec 5] and research on faculty avoiding recording poor performance)? | Keep, label "Feedback only" | Drop: two outcomes only, simpler form; loses the capture path the research favours | PENDING-ROMIT |
| Q-C4 | Director verification vocabulary: keep "Verification / Verified record / Student record"? | Only if the feature is kept; otherwise remove strings | Drop feature: remove about 143 strings and the student "Share record" copy [GLOSSARY 1.1] | PENDING-ROMIT (same as Q-IA3) |
| Q-C5 | Evaluator names: "Adopted / Not yet recorded" in place of "Unverified"? | Yes, avoids collision with Verification | Keep prototype "Unverified": matches Sankalp's prototype but collides if Verification stays | PENDING-ROMIT |
| Q-C6 | Do program nouns apply to the nav ("Competencies") or only body copy? | Nav too (single term map) | Body only: nav stays "Skills"; inconsistent for a program that renamed | Open, depends on OD-28 |
| Q-C7 | Is "Sample data" label wording final, and where does it live (one persistent chip)? | One chip in the utility bar | Banner per page: noisy | INFER |
| Q-C8 | Reading-level target (grade 8 / 10) acceptable? | Yes | No target: not testable | INFER |

---

## 13. How to review a screen against this doc (copy checklist)

- [ ] **Vocabulary:** every noun is in the glossary's "Use" column; none from "Not"; the program's noun is a variable; no "item", "pending", "failed".
- [ ] **One word per concept:** the same object has the same name on this screen, its aria-labels, its export and the next role's screen.
- [ ] **Say it once:** no sentence repeats the title, a heading, a banner or a dialog on the same page.
- [ ] **Budget:** title 1 to 3 words; subtitle absent or scope facts only; at most one description per section; prose above the fold under the ceiling (desktop 40, phone 25, evaluator 15 words).
- [ ] **No instructions about the UI:** anything that explains a control was replaced by a clearer control, a disabled reason or a consequence on the button.
- [ ] **Every instruction points at a control that exists.**
- [ ] **Buttons:** verb + object, max 4 words, consequence in the label if irreversible, text-only, one filled primary.
- [ ] **Status:** every status word is in section 6; glyph + word; holder named for waiting; not colour alone; no red for shortfall.
- [ ] **Did not count:** states the failed rule in numbers and a next step (section 7.4); generated from the current rule.
- [ ] **Errors, empties, blocks:** follow the formulas in section 7; blocks and warnings are visibly different.
- [ ] **Nothing internal:** no IDs, ODs, stakeholder names, scaffolding or "prototype" text; no claim that Prism supplies skills; no AI accuracy claims.
- [ ] **Undecided behaviour** is stated neutrally or hidden.
- [ ] **Evaluator surfaces:** shortest copy, one instruction per screen, account language at most once.
- [ ] **Accessibility:** link text unique and descriptive; icon-only controls labelled; required information not only in a tooltip; reading level within target; sentence case, no em dashes.
