# T4 cross-role audit: nav, connectivity, text volume

Auditor: read-only. App state audited = the uncommitted working tree on `feat/skills-checklist-v2` (229 changed paths; other workers were editing during the audit, the first nav row label flipped from "Home" to "Dashboard" mid-session). Browser run at 1440 wide against `localhost:3007/v2`. Screenshots: `/tmp/sc-audit/shots/`. Browser demo store was cleared at the end (localStorage key removed).
Tags: [REQ id] [CALL] [BUILD-PROMPT n] [INFER]. Where a claim is code-only it says "code".

## Summary

1. The store really is shared. I exercised the chain in the browser: preceptor submit -> student home and director counts moved; reviewer approve -> queue badge 9 to 8 and student "waiting" note cleared; director verify -> student "Verified, version 1"; admin publish IV catheter -> student Mandatory 4 to 5 with the skill listed. State propagation is NOT the problem.
2. The "dots not connected" problem is the entry points and links, not the data. After each handoff the receiving role gets no signal that it happened, and records are linked by hand-built path URLs (about 40 hardcoded hrefs, no shared `linkTo`, no `stu`/`item` context in the URL, no "same record in other views") [BUILD-PROMPT 8.1, 8.4, 8.5].
3. Nav is 19 rows across 5 roles. Three admin rows (Review, Outcomes, Records) plus Reports render the very same components that the reviewer and director use (identical word counts 270/914/929 per page across roles). Proposed: 12 rows.
4. Text is already much leaner than the brief implies: 0 requirement IDs or OD notes rendered on any of 23 routes sampled; no "what this step does" blocks left. Remaining volume is concentrated in the admin wizard hints, reports method sheet, outcomes page and student record/history helper lines.
5. Chrome is the heavier problem: product switcher + role switcher + Demo menu (14 walkthrough links + 6 device toggles + reset) + Search (searches only the 2-7 nav rows) + Notifications + Help + profile, on every page, including the preceptor page that is supposed to be a no-login link.
6. Several links jump roles by accident (hardcoded `/v2/reviewer/...` inside admin and director pages).

## Proposed nav per role

Current: admin 7, reviewer 3, director 3, preceptor 2, student 4 = 19. Proposed: 4 + 2 + 2 + 1 + 3 = 12.

| Role | Current rows | Proposed rows | Justification |
|---|---|---|---|
| Admin (4) | Home, Skills library, Courses, Review and approve (badge), Outcomes, Records, Reports | **Home, Skills, Review (badge), Reports** | Skills library + Courses are one setup job ("add, configure, publish, map"); the publish success banner already says "Map it to NURS 350 next", so mapping is a tab or step inside Skills. Outcomes and Records are drill-downs of a student or skill, not places an admin goes first: reach them from Reports rows, Home "Needs attention" rows and student-name links. Home already carries counts for both. Keep Review because it carries the work badge. [INFER] |
| Reviewer (2) | Review and approve (badge), Outcomes, Records | **Review and approve (badge), Students** | The reviewer's job is the queue [CALL: coordinator approves]; Outcomes (evaluation versions, remediation) and Records are both "look up one student". Merge into one student-keyed page (list, then record with outcomes + remediation tabs). [INFER] |
| Director (2) | Outcomes, Records, Reports | **Records, Reports** | Director's job is verify. Outcomes is the same page as admin/reviewer (914 words, identical); make it a tab on Reports or a drill from a record. Landing stays Records (already the landing). |
| Preceptor (1 or none) | Requests (badge), Lab sessions | **No sidebar; one page "Requests" with a "Record a lab session" button** | Preceptors have no login (CLAUDE.md hard stop; [REQ EV] evaluator via link). A 2-row app sidebar, product switcher and role switcher on their page contradicts that. Lab sessions is a second job only for R. Whitmore; a button on the same page serves it. |
| Student (3) | Home, Log skills, Requests (unsent badge), Record | **Home, Log, Record** | Home already answers "what is left / what is waiting" and its skill cards say "Waiting for J. Delgado". Requests is the second half of the Log flow (Ask for sign-off is the last button in log-flow.tsx:416); put the unsent badge on Log. Verified record is already a sub-route of Record (history-page.tsx:202). |

Utility bar / menus (redundant controls):
- Role switcher (5 roles), command menu "Roles" group (same 5, `v2-command-menu.tsx:50-54`) and Demo > Walkthrough (14 steps, each a role+route) do the same job three ways. Keep the role switcher; make the Walkthrough a single "Start story" step player (BUILD-PROMPT 9 player bar) instead of a 14-item dropdown. [INFER]
- Command menu "Pages" lists the nav rows only (2-7 items), so Search finds nothing the sidebar does not already show. Either index students/skills/evaluators (what search is for) or drop the Search button. `v2-command-menu.tsx:46`.
- Demo menu mixes story navigation, student-phone fault toggles (offline, signed out, update pending, fail next sync, simulate edit), an "Open evaluator link as" radio and Reset. Fault toggles belong on the student sync page for the student role only.
- Notifications and Help buttons are inert chrome for the prototype (not exercised, see Unverified).
- Product switcher "Clinical Education" is a shell piece; fine for the Prism look, meaningless for a no-login preceptor.

## Handoff chain

Legend: Propagates? = state change visible in the receiving role's data (exercised in browser unless "code").

| # | Handoff | Propagates? | Entry point for receiver | Evidence |
|---|---|---|---|---|
| 1 | Admin publishes skill -> student sees it | YES (browser). Published IV catheter at `/v2/admin/validate-publish`; student home then showed "Mandatory (5)" with IV catheter, 0 of 4 | None. No badge, banner or "new skill" cue for the student; the previous "1 skill is not open yet" banner just disappeared. Admin side is good: success banner "Map it to NURS 350 next" + button | `lib/v2/admin-actions.ts:109-123`, `lib/v2/student.ts:308-312` (student reads `skill.published` + mapping) |
| 2 | Admin maps skill to course -> student | YES (code; browser only exercised publish, not map) | Same as 1; mapping + published is the double gate. Admin Home shows "5 skills in use, not in NURS 350" with an Open Courses button (good) | `admin-actions.ts:127-142`, `student.ts:308` |
| 3 | Student logs + requests sign-off -> preceptor | YES (code). `createRequest` writes a Submission (`student.ts:588-646`), then `flushQueue`; preceptor list is `waitingFor` (`preceptor.ts:291`). Seed already holds Maya's pending request, so I started from it. Offline phone keeps it `on-device` so preceptor does not see it (by design) | Preceptor "Requests" nav badge (2) + card per student with "Start the evaluation of Maya" (browser). There is no email/link artifact: the receiver is reached only by switching role. Student side has "Open what the evaluator sees" (`request-signoff.tsx:383`) | Browser: preceptor list, `?request=sub-maya-1` |
| 4 | Preceptor evaluates -> outcome | YES (browser). Submitted 2 skills; preceptor badge 2 to 1; student home 6 of 12 -> 8 of 12, "2 of 4 skills achieved"; Outcomes list shows both as Counts; Oct 26 | Preceptor sees "Evaluation completed" but a dead end: no "Back to requests", no next request link. Student gets no "J. Delgado signed 2 skills" message (home still said "Fix 1 sync conflict"). Feedback text only in Record | Browser; `preceptor.ts:214-290`; screenshot `preceptor-submitted.jpg` |
| 5 | Evaluation held for approval -> reviewer queue | YES (code: `holds = config.approvalRequired` -> status `awaiting-approval`, submission `awaiting-review`, `preceptor.ts:239-269`). Both seeded skills (catheter, oral meds) have `approvalRequired` off so nothing entered the queue: in the demo the story branch "preceptor -> reviewer" cannot be triggered live from steps 8-9 | Reviewer nav badge, queue table; admin Home "Needs attention" rows link to the exact item (`home.ts:93`) | Not exercised end to end for this reason |
| 6 | Reviewer approves -> student/director/report | YES (browser). Approved Maya glucose (`/reviewer/review-queue/ev-maya-7`): reviewer badge 9 to 8, admin badge 8, student home glucose "waiting" line removed | Reviewer lands on an "Approved" page with 2 buttons (back to queue, open outcomes). Student gets no signal | Browser; screenshot `reviewer-item.jpg` |
| 7 | Reviewer returns item -> student | YES (code) | Student home "Do this next: Fix and send again" with the reviewer's reason (`student.ts:356`), Returned tab for staff | Code only, not clicked |
| 8 | Reviewer/admin/anyone -> director verify | YES (browser). Director list "Maya 2 of 4 mandatory" matches student "2 of 4 skills achieved" and reports "Maya 2 of 7 met" (see Consistency) | Director has NO nudge that anything is ready: Records is a list of all 12 students, every one under "Has unmet mandatory skills (12)", status "Not verified". Nothing says which record changed or is ready | Browser; screenshot `director-records.jpg`. `verification.ts:100-107`: unmet mandatory skills are explicitly not a blocker |
| 9 | Director verifies -> student verified record | YES (browser). Verified Maya (2 of 4) as version 1; student `/verified-record` shows "Verified, version 1 ... by Dr. K. Brennan on Oct 26" and lists only the 2 achieved skills | Student home has no mention of verification (0 matches for "verif"); `verified-record` is not a nav row, reachable only via a link at the bottom of Record (`history-page.tsx:202`) | Browser; screenshot `student-verified-record.jpg` |
| 10 | Verification -> reports | YES (code via `verificationRows`, `lib/v2/verification.ts`; counter `verified`). Reports page KPI cards (mandatory achieved %, behind pace, single evaluator, simulation) do NOT include a "records verified" figure; director Records KPI does | Not shown in reports | Browser (reports text) |
| 11 | Preceptor lab batch -> reports | YES (code, `lab.ts`) | Lab page ends with "Open the cohort reports" (`lab-grid-page.tsx:345`), a link to `/v2/admin/reports` from the preceptor role: jumps to an admin the preceptor is not | Code |

Worth noting: with the seed no student has all mandatory skills, so the "director verifies" step demonstrates verifying a 2 of 4 record with only a checkbox ("I reviewed this student's evidence and the gaps listed above"). It returned "Verified" and a shareable record. Whether a partial record should be verifiable is an open product question, not decided anywhere I read [INFER, flag for Romit].

### Consistency invariant [BUILD-PROMPT 8.9]
Same student, same moment (after my 2 evaluations):
- Maya mandatory achieved: student home "2 of 4 skills achieved", director list "2 of 4 mandatory", director record "Achieved" on catheter + vital signs, verified record "2 mandatory skills not achieved". Match.
- Evaluations that count: admin Reports "of 113 evaluations", reviewer Outcomes "Evaluations that count 113". Match.
- Waiting for approval: reviewer badge and admin badge both 8 after one approval; reviewer KPIs "Awaiting review 9" before. Match.
- Different denominators for the same person are not labelled: student "8 of 12 evaluations" (mandatory only), director "10 evaluations" (all counted), reports "2 of 7 met" (all skills). All correct but a reader sees 3 different totals for Maya.
- NOT tested: counts after the new mandatory skill (IV catheter) is published, i.e. whether director/reports flip from "of 4" to "of 5" and mark Maya's verified version as changed. Not run.

## Record names that are plain text instead of links

| Where | What | File:line |
|---|---|---|
| Outcomes evaluations table (admin, reviewer, director) | Student and Skill cells are plain strings; only a "Version history" button links | `components/v2/outcomes/outcomes-page.tsx:92-93` |
| Review item page | Student, Course, Skill, Evaluator are a plain definition list; no link to the student's record, the skill config or the evaluator | `components/v2/review/review-item-page.tsx` (header facts block, only links are Back / Outcomes) |
| Reports heat grid and skill/evaluator tabs | Student row labels in the grid ("Maya Ferreira 2 of 7 met") plain; only the pace table (`reports-page.tsx:242`) and student x skill grid (`:395`) use `link()` | `reports-page.tsx:131` helper, used 3 times |
| Remediation page header | student name text only | `components/v2/outcomes/remediation-page.tsx:95` |
| Admin Home "Needs attention" stalled row | label names student + skill + evaluator but href is the generic review list, not the item | `lib/v2/home.ts:94` |
| Preceptor Requests cards | student name is the card title; the evaluator is not linked to anything (ok), but skill names are plain | `evaluation-form.tsx:93` |
| Outcomes "Confidential concerns" | "About Hannah Brooks" plain | outcomes page (browser) |

Context/linking architecture vs BUILD-PROMPT 8: no `stu`/`item`/`coh` query context, no context bar, no `linkTo(screen, ctx)` helper, no "same record in other views" panel (all 4 absent; about 40 hand-built `href`s counted by grep in `components/v2`). Routes are role-prefixed, so a record opened by a reviewer has a different URL from the same record opened by a director.

Cross-role link bugs (all code-verified, not clicked):
- `remediation-page.tsx:108`: staff link is `/v2/${staff ? "reviewer" : "student"}/evaluation/...`, so an admin or director reading a plan lands in the reviewer role.
- `review-item-page.tsx:84`: "Open outcomes and remediation" is hardcoded `/v2/reviewer/outcome-remediation`, wrong for admin.
- `director/verification-pages.tsx:226`: director "Open the review queue" goes to reviewer.
- `lab-grid-page.tsx:345`: preceptor to `/v2/admin/reports`.
- Two URL forms for the same page: `/v2/director/director-verification` vs `/v2/director/verification/<id>`, `/v2/admin/verification`; `roles.ts` SUB_ROUTES lists the second form but the Records row URL is the first.

## Text volume

Measured visible words per route (main region, desktop, `innerText`): admin Home 410, Skills library 528, Configure 265, Map courses 235, Review queue 296, Outcomes 914, Records 270, Reports 929; student Home 546, Record/history 531, Verified record 236, Pick-and-rate 111, Sync 104; preceptor Requests 20, Evaluation form 36 when loading (full form is ~150), Lab grid 204; reviewer/director = the same components as admin (queue 296, outcomes 914, records 270, reports 929). Requirement IDs / OD-n / "what this step does" blocks rendered: 0 on all 23 routes (grep of `components/v2` also finds none outside comments). Instructional copy is now concentrated as below. Words per page are inflated by hidden per-dot accessibility text on Outcomes (the 914-word "Outcomes by skill" list renders one line per evaluation; assumed screen-reader-only, could not confirm it is not visible).

Worst offenders:

| # | String | File:line | Verdict |
|---|---|---|---|
| 1 | "Counted evidence only. Filters narrow the evidence first, then every figure is recalculated." + Method terms "Grid cells / One evaluator ..." | `reports/reports-page.tsx:316,319,321` | Shrink to tooltip / info icon on each figure; keep in the Method sheet only |
| 2 | "Use the list you already have. No template or column order is needed. Skills are proposed for your review, and nothing is created until you confirm." | `admin/import-panel.tsx:118` | Cut to "Skills are proposed for review first." |
| 3 | "These lines were not read as skills. They are shown as written so nothing disappears quietly. Add any skill you need after you create the others." | `admin/import-panel.tsx:217` | Cut to "Lines not read as skills" heading; keep list |
| 4 | "Require administrator approval: A completed evaluation waits for an administrator to approve it before it counts toward the student's progress." | `admin/wizard-steps.tsx:371` | Shrink to tooltip (label is self-explanatory) |
| 5 | "Require written feedback: The evaluator cannot submit without a narrative comment. Turn off to make feedback optional." | `wizard-steps.tsx:370` | Cut second sentence |
| 6 | "An evaluator needs at least one of the ticked credentials. Tick none to accept any credential." | `wizard-steps.tsx:365` | Shrink to tooltip |
| 7 | "Add one overall supervision rating beside the checklist: The evaluator also records one level of supervision for the whole attempt, using levels you name." | `wizard-steps.tsx:147` | Shrink to tooltip |
| 8 | "Copy the settings of a skill you already configured, then change what differs. This replaces the settings below." / "Each setting is counted on its own. Lab and simulation evidence never counts toward a clinical setting." | `wizard-steps.tsx:84,228` | Keep 84 (destructive warning, shorten); cut 228 (repeats `lab-grid-page.tsx:231`) |
| 9 | "This is a strong rule. It asks for repeat evidence from several people." | `lib/v2/rules.ts:213` (shown on Review and publish) | Cut: editorialising, the rule sentence above it already says it |
| 10 | "{skill} can be published. Read through what it will ask of students and evaluators first." + banner title "No problems found" | `admin/configure-wizard.tsx:269` | Cut second sentence |
| 11 | Student Home states a conflict three times: top banner "1 conflict needs you / Sync details", then card "Fix 1 sync conflict / Two versions of the same entry disagree. Nothing is lost until you choose." and button "Open sync and fix conflicts" | `student/student-frame.tsx:32`, `lib/v2/student.ts:360`, `student-home.tsx:41-53` | Cut: keep one (the Do this next card); drop banner while the card shows it |
| 12 | "Your program director has not verified your record yet. You can share a verified record once they do." / "Your program changed an evaluation after it was verified. The earlier verification is kept, and your director verifies the new version." | `student/history-page.tsx:198,200` | Shrink: status pill + 1 short line |
| 13 | "A completed evaluation is never edited. A correction adds a version and keeps the earlier ones." (on every expanded evaluation) | `student/history-page.tsx:163` | Cut (keep on the version timeline page) |
| 14 | "A signed PDF. Whoever receives it can check that it has not changed since it was issued." / "CLR 2.0 JSON, one achievement per skill. Unsigned, so not a verifiable credential yet." | `student/record-page.tsx:142,148` | Shrink; "CLR 2.0 JSON" is jargon for a student |
| 15 | Student verified record "What is not included" block: 3 explainer cards ("They were not achieved when the record was verified. Partial progress is not shared." ...) | `student/record-page.tsx` (browser screenshot `student-verified-record.jpg`) | Shrink to one line each or a count with a disclosure |

Also cut or keep:
- Admin Home: 9 rows of "X, Y, Z and 12 more" lists above the fold (410 words, 37 links). Keep the counts and the button, cut the example lists to the first item. `lib/v2/home.ts`.
- Preceptor: subtitle "No account needed." (`evaluation-form.tsx:45`) and "It cannot be changed from this page." (`:380`): keep the first once, cut the second. "Opened as J. Delgado, RN" fine.
- Keep: error strings (`import-panel.tsx:23-27,71`, PDF failures) since they are state messages, not instructions.
- Student Mandatory card sub-headings "What is counted, waiting and left." (`student-home.tsx:75`): cut; the legend under the squares says it.

## Screenshots (1440 viewport; the shell content area renders ~1144 px wide)

Saved: `admin-home.jpg`, `student-home.jpg`, `preceptor-requests.jpg`, `reviewer-queue.jpg`, `director-records.jpg`, `preceptor-eval-form.jpg`, `preceptor-submitted.jpg`, `reviewer-item.jpg`, `director-record.jpg`, `student-verified-record.jpg`, `admin-publish.jpg`, `admin-skills-library.jpg` in `/tmp/sc-audit/shots/`.
What I see:
- Admin Home: calm, 2 sections (Set up / Needs attention), one meter, names as links. The "In use 12 of 31" meter is a plain horizontal bar, and every row has an outline button saying "Open Courses" or "Open Reports" on the right; rows are text-heavy (skill lists) rather than visual. The first nav row reads "Home" in one capture and "Dashboard" in a later one.
- Student Home: the first thing a student sees is a conflict banner and then a conflict card; the real "what is left" content starts below the fold. Student at 1440 renders in the desktop shell (sidebar + 720 px column), not a phone frame, although the role is "Student (mobile)".
- Preceptor: a full app sidebar with 2 rows, product switcher and role switcher around a 2-card page. It reads as an admin app, not a link a nurse opens from email.
- Reviewer queue: 4 KPI cards (Awaiting 9, Oldest 12 days, Stalled 1, Returned 0) with large empty vertical space under them, then tabs, an "Add filter" dashed button, and the table; the Status column is clipped off the right edge at this width ("Rea...", "Nee..."). Student names are links (good).
- Director Records: progress bars + "Review record" buttons per student; all 12 in one group "Has unmet mandatory skills (12)", so there is no "ready to verify" queue.
- Director record: clean evidence-per-skill list with "Read in full" links per evaluation (best-connected screen in the product).
- Admin publish page: confirm dialog is clear; after confirm the page stays on the same step and the success banner is at the top, out of view when the button is at the bottom of a long page (I had to read it with script).
- A red Next dev "1 Issue" badge showed on reviewer item and Skills library pages (not investigated).

## Gaps ranked

P0
- P0-1. No receiving-role signal on handoffs 1, 4, 6, 9: the student is never told that an evaluation counted, was approved, was verified, or that a skill opened; the director is never told a record is ready or changed. This is exactly "dots aren't connected with each role". Add per-role "what changed for you" items on Home/nav badges (student badge on Record when something new counted or verified; director badge for "ready/changed"). [BUILD-PROMPT 8.3, INFER]
- P0-2. No record context carried between screens: no `stu`/`item` params, no `linkTo`, plain-text student and skill names on Outcomes, Review item and Reports grid, so a reviewer cannot move from an evaluation to the student's record and back [BUILD-PROMPT 8.1, 8.4, 8.5].

P1
- P1-1. Nav duplication: 19 rows, 4 admin rows are the same pages as reviewer/director rows. Reduce to 12 (table above).
- P1-2. Cross-role hardcoded links (4 listed above): remediation-page:108, review-item-page:84, verification-pages:226, lab-grid-page:345.
- P1-3. Preceptor experience wrapped in the admin shell (sidebar, product + role switcher, Demo menu), contradicting "preceptors have no login". Submit leaves a dead end.
- P1-4. Director can verify a record that is 2 of 4 mandatory with one checkbox; and all 12 students sit in one "unmet" group so the verify queue has no priority. Open question for Romit, not decided [INFER].
- P1-5. Story step 8->9 cannot show the "held for approval" branch live: the two skills evaluated at step 8 have `approvalRequired` off, so submitting never creates a reviewer item (`preceptor.ts:239`). A reviewer never receives the evaluation Maya just got.
- P1-6. Student Home leads with the sync conflict (stated 3 times) rather than skills left.

P2
- P2-1. Search indexes only the nav rows. Command menu duplicates the role switcher.
- P2-2. Three different "totals" for the same student (8 of 12, 10, 2 of 7) without labels.
- P2-3. Admin Home stalled rows link to the list not the item (`home.ts:94`).
- P2-4. Publish success banner not in view after confirm; the "Map it to NURS 350" button is in it.
- P2-5. Reports omit a "records verified" metric even though verification feeds `verificationRows` for reports (`verification.ts`).
- P2-6. Two URL spellings for Records (`director-verification` vs `verification`).
- P2-7. Reviewer queue Status column clipped at 1440.

P3
- P3-1. Text cuts 1-15 above (about 40% of helper copy).
- P3-2. Outcomes page 914 words (hidden per-dot text) repeated on 3 roles.
- P3-3. Nav label drift "Home"/"Dashboard" during concurrent edits.

## Unverified

- Handoff 3 live (student creating a new request) and handoff 7 (return) were read in code only; I started from the seeded pending request. Handoff 5 (held for approval) not triggered because the demo skills do not hold.
- Whether director list/report counts re-base after publishing a 5th mandatory skill, and whether Maya's verified version flips to "Changed since verified"; not run.
- Student at phone width (390), the offline/signed-out device states, QR/handover, PDF export, CLR export, command menu behaviour, Notifications and Help panels: not opened.
- The Next dev "1 Issue" badge content was not read; hydration/console state unknown.
- Whether the 914-word Outcomes list is screen-reader-only or visible text below the fold: only seen via `innerText`.
- Requirement-level claims: I did not re-read `/tmp/sc-audit/requirements.txt` for each REQ id; IDs cited are inferred from build-prompt and the existing docs and may need checking by a requirements auditor.
- Other workers edited files while I ran; some observations (nav label) changed mid-audit.
