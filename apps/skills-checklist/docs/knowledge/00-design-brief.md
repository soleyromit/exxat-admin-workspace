# Skills Checklist: Design Brief (read before any design, copy, chart or nav decision)

**Product:** Prism Skills Tracking (initiative owner Sankalp Panda; design Romit Soley). **Written:** 2026-10-26.
**Companions:** `glossary.md` (vocabulary, written separately; use its terms) · `02-decisions-ledger.md` (what Romit has decided or still owes) · `01-competitive-digest.md` · `../README.md` (source tags, precedence) · `../strategy/05-open-decisions.md` (ODs).
**Tags:** `[REQ id]` requirements doc · `[CALL]` Oct 8 and Oct 9 transcripts · `[COMP]` competitive analysis (Oct 19) · `[BUILD-PROMPT §n]` build prompt (Oct 25) · `[AUDIT Tn]` v2 audits (Oct 26) · `[LEDGER]` `02-decisions-ledger.md` · `[INFER]` unverified inference · `[PENDING-ROMIT]` needs his confirmation. Untagged means unverified.
**Precedence for behaviour:** REQ > CALL > BUILD-PROMPT/PROTO > INFER. No `OD-*` is decided. v2 is a reference, not final [LEDGER].
**Density standard (before any layout):** `strategy/07-ux-laws-and-density.md` sets the per-page-type budget (dashboard: 5 regions in the 1440 x 900 first viewport, 4 figures, 3 charts per [LEDGER D-X21] and `admin/tests/lab/density-budget.mjs`, 8 controls, 40 words, one colour per meaning) and the 15-check review; count it before claiming a screen done.
**Requirement coverage (before any layout, and before done):** list the requirement IDs each screen must satisfy, quoted from `../source/requirements.extracted.txt` (per-screen checklist: `req-coverage-lab.md` once it exists), and confirm each is visible or reachable in every variant. A screen missing a required field is not done, whatever the other gates say. Simplify without removing anything a requirement asks for: the density budget is met by merging, progressive disclosure (a 'More' or a sheet) or moving to a secondary place, never by dropping a required field, filter, state or action; compact variants (inline rows, one page, many at once) carry the same required fields as the full variant (`strategy/07` section 1.2).

## 0. Leadership and stakeholder direction (read first)

| Direction | Source | What it means on screen |
|---|---|---|
| Wizard and form pages use the full width with no white space | Leadership via Romit, 2026-10-27 [LEDGER D-L5, D-X30] | Fill width with structure (columns, preview panel), not stretched fields; check at 1920 as well as 1440 and 375 |
| Category (one, optional) and Tags (many, created inline) in every Add a skill path, plus library filters | Romit relaying Sankalp, 2026-10-27 [LEDGER D-L5, D-X28] [REQ SL-03, SL-04, SL-05, SL-10] | Tags are a chip text box with suggestions, not a dropdown; every compact variant carries both |
| A setup step does one job, titled in the step's words; no reporting figures or lab labels on it | Sankalp via Romit, 2026-10-27 ("he didn't understand the screen at all") [LEDGER D-L6, D-X31] | Skill lists has one job: the lists and who each applies to (D-L106 replaced the Assign step) |
| My progress is a student dashboard with real charts; student screens carry far less text | Romit, 2026-10-27 ("My progress is a dashboard for a student... Check if there is too much text added everywhere") [LEDGER D-L7] | Dashboard budget (3 charts, 4 figures, 40 words); every chart has a summary line and a table; next actions 3 at most; wizard steps titled as the step, with a summary panel instead of empty width |
| Reporting headers: one Filters button, chips, no manual refresh; plain titles, nothing hidden on dashboards | Romit, 2026-10-27 ("looks clunky with so many dropdowns and asking user to refresh"; "'Where are the 28?' title doesn't make sense") [LEDGER D-L8, D-L9] | Subtitle "Term · Courses · Updated"; Filters popover holds every scope filter; applied values are removable chips with Clear all (RP-01); figures refresh on their own; card titles state what they show; no collapsed dashboard groups |
| Student IA: three rows (My progress, My requests, My evaluations, D-L19); drafts live in My requests, Drafts; "Log a skill" is the one entry action | Romit, 2026-10-27 ("can't we merge Log a skill with My requests"; "I still can't find a place to log a skill"; "why does the dropdown change when I am changing a course") [LEDGER D-L10, D-L16, D-L17, D-X32] | "Log a skill" in every student header and empty state opens course, skills, self-evaluation, send; the last step is Send for evaluation with Save for later; the course view is its own page (My progress > NURS 350); Drafts can be sent several at once, grouped by evaluator (D-L18) |
| No Sample data tags anywhere | Romit, 2026-10-27 ("Remove sample data tags from everywhere") [LEDGER D-L11] | The chip renders nothing; the data stays fictional (D-X23) |
| Admin IA: Dashboard, Skills (panel: Library, Skill lists, Categories and tags, Course mapping), Approvals, Reports; Settings after the main rows; director Dashboard, Reports | Romit, 2026-10-27 ("yes, apply it" on the proposed admin nav) [LEDGER D-L20, D-X33] | Every one of Sankalp's admin steps has a sidebar home; "Reports" replaces "Attainment" in nav, titles and crumbs (slugs unchanged); crumbs "Skills > Course mapping", "Settings > Evaluators" |
| Categories and tags is its own page under Skills, not in Settings | Romit, 2026-10-27 ("why are categories and tags at Settings? When I click on them, it switches to the Skills navigation") [LEDGER D-L21, D-X34] | Settings shows Clinical settings and Evaluators only; opening Settings never switches to the Skills panel; old Settings links redirect |
| The evaluator directory is the Settings section "Evaluators"; Lab instructors merged into it | Romit, 2026-10-27 ("sure") [LEDGER D-L24, D-X37] | No "Evaluator directory" header button; unverified rows show "Not verified", linking to Approvals, New evaluators; OD-05 stays open |
| No Naming tab: the program's noun is a backend setting | Romit, 2026-10-27 ("naming can be changed in the backend, so we need to remove this tab for now") [LEDGER D-L25, D-X38] | Settings shows Clinical settings and Evaluators only; labels still follow the noun (lib/lab/terms.ts) |
| Configure "Who does what" (was "Who signs") is grouped by subject: Student, Evaluator, Approval | Romit relaying Sankalp, 2026-10-28 ("What student adds position looks wrong") [LEDGER D-L26, D-X39] | One column beside the preview; each switch sits with its subject; Check and save lists the step in the same order |
| Admin setup in Sankalp's six steps, configured once for the program; only times needed per skill; a POV on where skills sit | Romit relaying Sankalp, 2026-11-02 [LEDGER D-L30; Proposed D-X40, D-X41, D-X44] | One Skills module; Evaluation settings page reuses the Configure sections with times needed on the same page; per-skill changes off the main path; OD-02 open |
| The admin walkthrough is clear, and groups of skills, student groups and courses lead to a visible end state | Romit, 2026-11-02 [LEDGER D-L31, D-L32; Proposed D-X45, D-X46] | Walkthrough starts at the library; the end state is the Coverage view on Course mapping, neutral, since mapping is an expectation only [REQ CM-05] (D-L77, which takes Setup summary off the path and panel) |
| No setup checklist; times needed with the other settings; no subtext on any page or step | Romit, 2026-11-02 [LEDGER D-L34] | Each page: title, controls, primary action. Labels and errors stay; helper lines, fact lines, captions and descriptions go unless the control is ambiguous without them |
| Sarah: level labels and the counting level are the program's; times needed from 1 | Romit relaying the Sarah call, 2026-11-02 [LEDGER D-L33] | No hardcoded level names; Times needed accepts 1; rubrics, regression, editable Excel export are future (not designed) |
| Navigation model A: setup pages are hubs; the way back is the breadcrumb and the Skills panel | Romit, 2026-11-03 (chose model A) [LEDGER D-L42] | No walkthrough footer, chapter rail or "Back to" control on any page with breadcrumbs; page actions in the header, one filled; wizards only in focus workflows, sheets and dialogs |
| Set up skills is one flow: landing and step 1 are one program and one add pattern; variant D has the vertical rail | Romit, 2026-11-04 ("it doesn't look like a complete flow at all... When I am adding a skill at the landing page, then why does step 1 look like this?") [LEDGER D-L46, Proposed] | `/lab/setup`: landing Library on the new program, add row and editable list shared with step 1, "Set up skills" / "Continue setup" opens the wizard, exit returns to the same list. Outside the flow the hub Library keeps the seeded program |
| Configure B: settings left, a sticky Steps panel right; "Who does what"; group check-off under Evaluator; "Counts when" with the questions | Romit, coordinator relaying, 2026-11-04 [LEDGER D-L52] | One panel [Steps, Evaluator, Student], absent until a model is chosen; a row of steps below 1280 px |
| A whole skill list goes to students; skills are not picked individually | Stakeholder review, 2026-11-04; Sankalp, 2026-11-05; designer 2026-11-05 [LEDGER D-L53, D-L59, D-L106] | Add students, a dialog from the list's panel: one search box over Groups and Students, Filters with chips, Select all; "Has it", and a muted "Also on" only on rows the admin ticks. No Save, no Keep both or Move off, no exceptions. No skill picker, no Create a group (Settings, D-L79), no Map to courses; a second list on a student stays possible. Aarti's call speaks of groups: raise on Nov 23 |
| "Skill lists": one page, one table, one panel; one default, new versions for changes, each list shows who uses it | Stakeholder review, 2026-11-04; designer 2026-11-05 ("super confusing with a lot of text, toggles, tabs") [LEDGER D-L58, D-L60, D-L104, D-L106] | Name, Skills, Assigned to, row menu of Rename, New version, Delete where allowed; a row click opens the panel; a list on anyone is not edited in place. The toggle "New student groups get this list" moves the default |
| Course mapping per offering, no term columns, three views; rebuilt as two panes because the designer asked for this page to be better | Stakeholder review, 2026-11-04; designer 2026-11-05 [LEDGER D-L61, D-L75, D-L76, D-L77, D-L100] | Light list left, one table right; offerings grouped by course and cohort, each its own row; By skill, By course and Coverage under the title; levels Mandatory, Recommended, Not mapped, and Not mapped is quiet; no carry-forward wording, OD-01 stays open. State the Optional removal on the Nov 23 review |
| Reports never merge lists | Stakeholder review, 2026-11-04 [LEDGER D-L63] | A list select when the scope reaches more than one |
| "Required to graduate" is gone; those figures count every active skill assigned to the student | Coordinator relaying, 2026-11-04 [LEDGER D-L54, D-L62, Proposed] | No UI text about it; "Required this term" became a Reports view, D-L102; the graduating cohort reads 31 / 4 / 0 / 3 on its own list; director verification scope still open |
| The admin walkthrough is the first screen, as a path of recommended pages; variants live at `/lab` | Romit, 2026-11-04 [LEDGER D-L64, D-L66, D-L77] | `/` opens stop 1 of 4 (Library, Evaluation settings, Skill lists, Course mapping; Assign merged into Skill lists, D-L106); Configure N skills and Categories and tags are side steps; the bar holds only the path and Exit; one job per page; a number on one stop matches the next |
| The student and evaluator path continues the admin path | Romit via coordinator, 2026-11-04; student changed 2026-11-05 [LEDGER D-L67 to D-L70, D-L110] | 7 stops, one student (Maya Ferreira, NURS 350, My progress variant 1) and one skill (Nasogastric tube care, 3 evaluations); email or QR opens the same form; the evaluator's submit really moves the count |
| A skill has two separate fields: Status (Active or Inactive) and Configuration (Default configuration, Edited, or Not configured). "Edited" is our word, accepted with "go". The words "Program default" and "Own settings" were replaced | Romit, 2026-11-05 ("go") [LEDGER D-L88, D-L89, D-L90], replacing D-L72 and D-L82 wording | Not configured only before the program's first save, or when a skill's model needs questions it lacks; no skill is kept as an exception. Prism ships no default and preselects nothing. First save confirms for all skills in a dialog with counts. Sankalp is still to amend IM-09 and SC-02 wording |
| Evaluation setup for one skill moves to a full page; the panel keeps quick edits. Density is the acceptance test | Designer, 2026-11-05 ("We have made a full page before, but the UX and ui along with content were too dense.") [LEDGER D-L115, reversing in part D-L91 and D-L97] | Panel: details, Times needed, rule sentence, Evaluation settings row with Configure; Active switch; Used in. Page: form and "What they will see" side by side; Default reads the package aloud, Custom is single-open sections; Save and Cancel only after a change; Save lands in the Library, same filters and scroll, panel open. Budget at 1440: Default 3 fields, 65 words; Custom 9 fields, 50 words; 115 words with the preview; 3 other buttons; fits 900 px. Times needed always editable, naming students first when progress changes [REQ AE-02]. Inactive skills stay editable [REQ SL-11]. About 12 sample skills start Custom |
| The edit panel uses named patterns: Active switch in a fixed header, tabs Details and Used in; a save footer only with unsaved changes. Evaluation settings is Default or Custom; Custom replaces Edited, Default replaces Default configuration | Romit, 2026-11-05 ("a Deactivate button should have been a toggle"; "Default configuration needs a better representation"; "correct UX patterns must be used") [LEDGER D-L97, D-L98; Evaluation tab and segmented control moved to the page, D-L115] | Table: plain Default and Active, badges only for Custom, Not configured, Inactive. The Skills menu stays as the admin set it. Other rows of this table that say Edited or Default configuration read Custom and Default from this date |
| "Levels that count" offers every level as a box; all ticked reads "at any level" | Independent review of the edit panel, 2026-11-05 [LEDGER D-L95, Proposed; question for Sankalp] | Sentence, closed summary and boxes say the same thing; the links stay (D-L74); removing a level never clears every box |
| Evaluation settings is plain label and control rows; the question model has no final result; "Apply to new evidence only" is not offered | Romit, 2026-11-04, accepted recommendation [LEDGER D-L73, D-L78, D-L80] | No summary card, no aside, no cards; Preview is a dialog; label "Questions"; the save dialog names who changes [REQ AE-02] |
| Evaluation settings: four named sections, and a sticky panel of what they will see from 1100 px | Designer's request, 2026-11-05 [LEDGER D-L99, words Proposed] | Amends the row above: the panel shows the forms, not a summary; Preview is a dialog only below 1100 px; no cards inside cards |
| The program's question set goes to skills on the default configuration with none of their own; Score on a scale has no final outcome either | Recommendation, 2026-11-05, Romit may overrule [LEDGER D-L96] [REQ SC-04]; Sankalp 11-04 Granola 365abc25 chunk 15 | Evaluation settings holds Questions under both question models; the save dialog says who takes them and who keeps their own; the result comes from the answers or scores |
| My progress reads the skill list; course mapping says where | Romit, 2026-11-05 ("go, make my progress read the skill list") [LEDGER D-L102, D-L103] | Total and "N of M" read the list; two lists are two tabs, never merged; no list reads as a plain message and can still submit; Reports, dashboard and readiness read the same function. A group or student with no list reads "Not assigned" everywhere, with no fallback. "Required this term" is now only the Reports view "Mandatory this term" |
| Live and Draft are gone from Skill lists; per-skill Replace with a new version is gone | Romit, 2026-11-05 [LEDGER D-L104, D-L105, D-L106] | A row shows who it is assigned to, or a muted Not assigned; a list on anyone is not edited in place (New version), an unassigned one can be. IM-06's Skip, Replace, Keep both stay |
| A page is done only when its task scripts pass, another agent reviews it, and Romit tries it | Romit, 2026-11-04 ("go") [LEDGER D-L87] | Task scripts: `../build/2026-11-04-admin-workflow-map.md` section F. One page at a time. No new variants until a page's tasks pass. Feedback tracked in `../build/feedback-log.md` |
| The further-attempt page reads like Send | Romit, 2026-10-27 ("Need a better form layout") [LEDGER D-L12] | Context banner, path said once, numbered sections in a 40rem column, summary aside from 1280 px, Send footer |

Rule: any new direction Romit relays from leadership, Sankalp, Arthi (Aarti) or Vishakha is recorded the same day in `02-decisions-ledger.md` section 3b (his words, dated) and in this table, so workers read it.


## 1. Goal and outcomes per role

One sentence: a program defines the skills it expects, students gather signed evidence, evaluators sign without an account, the program sees who has achieved what and can trace every figure to the evidence behind it [REQ §1.1, §1.2].

| Role | Outcome they came for | Done when |
|---|---|---|
| Admin (program) | Get a 100+ skill library live without re-typing it, configure how each is judged, map it to courses, see attainment | Every skill is configured or visibly "not configured"; rule changes show who flips before publish [REQ IM-01, IM-10, SC-19; AUDIT T1] |
| Student | Know what is left, ask for a sign-off in seconds, understand why something did not count | Progress, waiting, returned and counted are always visible; every "did not count" states the failed rule [REQ SH-02..04; REQ SH-03] |
| Preceptor, lab instructor (evaluator) | Sign one or several skills in one sitting, with no login, in under 2 minutes | Link opens straight to the form; told if it counts now or waits for approval [REQ EV-01, EV-05, EV-07; COMP research: 22 s to 2.7 min] |
| Reviewer (faculty or coordinator) | Clear the approval queue and know why each record is there | Approve or return with a note; sees self versus evaluator answers side by side [REQ AR-01..05; AUDIT T3] |
| Director | Confirm the cohort is ready and find who is behind | Drill from a figure to students to the evidence [REQ RP-05, RP-06] |

The reviewer queue is REQ; the director role and "verification" are v2 proposals, not REQ [AUDIT T3].

## 2. Jobs to be done

- Admin: "When I hold a spreadsheet of 150 skills, let me bring it in, fix what the machine misread, and configure in bulk" [REQ IM-01, IM-05, IM-14]. "When a standard changes, tell me what changes for students" [REQ AE-02; AUDIT T1].
- Student: "When I just did something, let me ask the right person to sign it before I forget" [CALL; COMP]. "When I look at my list, tell me what is left without making me add it up" [REQ SH-04].
- Evaluator: "Let me assess exactly what the program configured, and nothing about how it is judged" [REQ EV-03].
- Reviewer: "Show me why this is held, then let me decide fast" [AUDIT T3].
- Director/admin: "Make my report my launch page, so I do not hop between viewing and acting" [CALL Oct 8; OD-29].

## 3. Success metrics

REQ states no metrics. These are targets to validate with Romit [PENDING-ROMIT] [INFER] unless tagged.
- Evaluator form completes in under 2 minutes [COMP research].
- Zero entries lost: every draft saved on the device first; shown as queued, synced or conflict [COMP rec 9].
- A student can state, in one glance, skills achieved, waiting, returned [REQ SH-04].
- Consistency invariant: the same student shows the same counts on every screen [BUILD-PROMPT §8.9, §13.2].
- Approval turnaround visible; waiting 3+ days and 8+ days surfaced [BUILD-PROMPT §10 N-04, N-09, N-11].
- Import: review of an imported list takes hours, not days [COMP rec 6].

## 4. Hard stops (never violate; from CLAUDE.md and README)

No shipped skills or taxonomy [REQ SL-01] · no default evaluation model from Prism [REQ SC-02] (the program's own first save becomes its default, D-L72, D-L90, recorded deviation until Sankalp amends the wording) · unconfigured skills cannot be mapped or submitted [REQ IM-09] · completed evaluations are immutable; a further attempt, never an edit [REQ RV-03, RV-05] · mapping is expectation, not eligibility [REQ CM-05] · preceptors have no login [REQ EV-01] · lab evidence never satisfies a clinical-setting minimum [REQ SC-12] · REQ §14 is out of scope (patient-encounter linkage, expiry, remediation workflow, notifications, Evaluations migration) · never treat an OD as decided · the engine, not the evaluator, decides what qualifies [REQ AE-02; COMP].

Known v2 deviations still awaiting Romit's call: shipped starter libraries, last-N currency rule, remediation in nav, staff "Reopen to edit" on counted evaluations [AUDIT T1, T3; LEDGER open Q].

## 5. UX principles

1. **Fewer nav rows.** Romit's complaint: too many. Audit proposal: 19 rows across 5 roles down to 12 (admin 4: Home, Skills, Review, Reports; reviewer 2; director 2; preceptor none or 1; student 3: Home, Log, Record) [AUDIT T4; LEDGER]. Proposal only; Romit has not approved the rows.
2. **Say it once.** Do not repeat the same sentence on a page, a dialog and a banner. One helper line per control group. Audit found sentences repeated 2 to 3 times per page [AUDIT T1, T3, T4].
3. **Record-linked navigation.** Every student, skill, group, site, course, evaluator and count that names a record is a link to where that record is acted on, carrying the record in the URL (`stu`, `item`, `coh`, `site`, `course`, `evaluator`, `list`). One `linkTo` helper, never hand-built URLs [BUILD-PROMPT §8.1, §8.4; AUDIT T4: about 40 hardcoded hrefs today].
4. **Handoff cues between roles.** When a student sends, the evaluator gets one email listing all open requests; when an evaluator submits, the student sees the change and the reviewer sees why it is held; a returned item says who, why, and what to do next. "Dots must connect per role": each screen names what the previous role did and what the next role will see [LEDGER; BUILD-PROMPT §9; AUDIT T4].
5. **Web-first, mobile as adaptation.** Design 1440 px first (1280 minimum), adapt to 1024 and 375, and check 1920 for empty space (section 0); mobile is the same screen adapted, not a separate design [BUILD-PROMPT §2.1]. v2 is phone-first and leaves a third of a desktop page empty [AUDIT T2]. `[PENDING-ROMIT]`: web-first versus phone-first is not confirmed for student and evaluator surfaces. Public reviews say mobile reliability is the main risk [COMP].
6. **Soft mapping.** Highlight "likely" skills for a course or placement (star, bold), never restrict; all skills remain reachable [CALL Oct 8; REQ CM-05].
7. **Report is the launch page** at student level; trigger review from the same place [CALL Oct 8; OD-29, open].
8. **Show the cause.** Status names who holds it and why ("waiting for X", "needs approval because Y"), not just a readiness label [REQ SH-02; AUDIT T3].
9. **Model constrains criteria.** Show the chain evaluation model, evidence, rule, achievement as one visible dependency [REQ §1.5, SC-09, SC-17].

## 6. UI rules

- Design system only: `@exxatdesignux/ui` components, tokens via `var(--token)`, no hex, no raw `<button>` or `<table>`; `LocalBanner` not toast; icon-only buttons need `aria-label`; no icons on text CTAs [CLAUDE.md; memory].
- Run `node tools/ds/source.mjs <Component>` before JSX. Build new components only for the indicator and chart layer, on DS tokens [BUILD-PROMPT §1].
- Layout: DS base shell (left nav, utility bar, page header); evaluator shell is a light header with a centered column up to 820 px and no app chrome, since evaluators have no account [BUILD-PROMPT §3.3; AUDIT T4: chrome on preceptor page contradicts no-login].
- WCAG 2.1 AA; every chart has a table and a text summary; no state by colour alone (glyph plus label); full keyboard use with visible focus [BUILD-PROMPT §2.7].
- No sub-12 px text; neutral colours for active states; severity must be visually distinct (hard block differs from warning) [memory].

## 7. Interaction patterns

- **Offline-first drafts.** Save every draft on the device first; each entry shows queued, synced, or conflict; logging continues when sign-in or an update fails [COMP rec 9; BUILD-PROMPT stuhub offline state]. `[PENDING-ROMIT]` scope for v1.
- **Correction versus new attempt.** A correction continues the same record and keeps a revision count and reason; a further attempt is a new, separate record [REQ RV-01..03]. Say which one the screen is doing.
- **Lock on sign-off.** Counted or awaiting-approval cannot be edited or resent [REQ RV-05]. After sign-off, an edit reopens the item with history visible [COMP rec 10] (conflicts with RV-03 immutability; open question in ledger).
- **Pending never counts.** Waiting and awaiting-approval are overlays on state, never states [REQ AE-01, AE-06; BUILD-PROMPT §5].
- **Explain empty results.** An impossible filter or role combination is explained, not shown as empty [REQ RP-09, ST-08].
- **Four evaluation models, all required:** approved or not approved, Questions, Independence level, Score on a scale [REQ 4.1, SC-07]. Scored is not Proposed, whatever older notes say [LEDGER D-L86].
- **Save blocked configurations** that cannot be satisfied, with the reason [REQ SC-18].
- **Review before use.** Admin previews what student and evaluator will see before publish [REQ SC-19].
- **Evaluator form:** one sitting for several skills, each with its own outcome and feedback; feedback mandatory only when configured [REQ EV-05, EV-06]. Optional "feedback only, not yet" outcome is a competitive recommendation, not REQ [COMP rec 5].

## 8. Charting and visual strategy

Viz first, text annotates [memory]. Choose by question; each needs a table fallback and text summary [BUILD-PROMPT §10].

| Question | Visual | Notes |
|---|---|---|
| How far is this student? | Progress ring (required achieved) plus state strip | Four states: no evidence, none qualifies, in progress, achieved [REQ AE-04] |
| Who in the cohort is behind, and on what? | Heat-grid (students by sections), scrollable, 43 rows must hold | Mandatory dimension; `[INFER]` sort by furthest behind |
| Where does each student sit against the bar? | Dot-strip (required % per student) | Avoids a rank list of bars |
| Are we on pace over time? | Burn-up (achieved over weeks) | Not a bare progress bar; progress bars are a last resort [memory] |
| How long are requests waiting? | Aging stacks 0 to 3, 4 to 7, 8 to 14, 15+ days, by site | Links to the evaluator and site |
| Where does evidence drop off? | Funnel: sent, submitted, counted | |
| Which skills are attempted but not achieved? | Scatter (percent attempted vs achieved) | |
| Student against cohort by section | Radar, only for groups of 5 or more | Hide below n = 5 (privacy and meaning) |
| Self versus evaluator answers | Side-by-side agreement view | [REQ AR-02] |
| Required skills by course coverage | Coverage matrix | [BUILD-PROMPT admcourse] |
| 100+ skills at a glance | Mosaic, hierarchy with roll-up bars | Open question: how to show 140 skills and nested levels [CALL Oct 9] |

Rules: glyph plus label, never colour alone. **Aarti dislikes red in score and rating visualisation: use amber or orange for below-bar** [memory feedback_aarti_no_red]. Red is reserved for hard blocking errors, not student shortfall. Setting bars show context, not a gate [BUILD-PROMPT §10; REQ SC-11]. Counts are a floor, not proof of competence; do not imply otherwise [COMP research: Dawson 2021].

## 9. Scale reality

Design and test with at least 100 students per cohort and 100+ skills across clinical and didactic. Reference dataset: 123 students, 153 skills in 10 sections and 18 groups, 2,141 sites, 403 evaluators, 8,879 evidence records [BUILD-PROMPT §6]. Implications: virtualised or searchable lists, grouped skill lists that scroll inside their panel, heat-grid with 43 rows, bulk configure and bulk approve [REQ IM-14, SL-10]. A seven-skill demo hides the real problems [LEDGER].

## 10. Copy rules

- Plain, active, specific; sentence case; no em dashes anywhere, including comments and docs [BUILD-PROMPT §2.8; memory feedback_professional_microcopy_standard].
- Never the word "items" in UI. Use the program's own noun, normally "skills"; do not hard-code it where a program could rename it ({itemNoun}) [LEDGER; BUILD-PROMPT §2.6]. Use `glossary.md` terms (verbs: ask for sign-off, sign off, return, count).
- Never render requirement IDs, ODs or stakeholder names in UI [memory feedback_no_internal_notes_in_ui].
- A failed-rule message states the rule in terms the student can act on: "Needs 2 sign-offs from 2 different evaluators; you have 1" [REQ SH-03].
- Do not say a thing is "saved" three times on one screen; say it once [AUDIT T2].

## 11. How to use this brief

State at the top of any design response which of this brief, the glossary and the ledger you consulted. If a claim you need is not here or in `../README.md`, mark it `[INFER]` and ask Romit; do not re-ask him for goals already written here.
