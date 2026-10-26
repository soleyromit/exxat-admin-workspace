# v2 research: IA, content strategy and data visualization

**Status:** research and recommendations only. No app code or contract was edited. Nothing here decides an `OD-*`.
**Written:** 2026-10-25 · **Branch:** `feat/skills-checklist-v2` · **Answers Romit's v2 feedback:** (a) too much subtitle and instruction text, (b) IA research too thin, (c) almost no charts or visuals.
**Tags:** `[REQ xx-nn]` only for IDs present in `docs/source/requirements.extracted.txt` · `[CALL date]` raw transcript · `[PROTO]` Sankalp's prototype · `[PROPOSED]` beyond the requirements · `[INFER]` my reading · `[DS]` installed `@exxatdesignux/ui` 1.6.5.

**Sources consulted.**
- Repo: `CLAUDE.md` (workspace and product), `docs/build/contracts/V2-IA-shell-and-nav.md` (confirmed), `docs/journeys/01..03`, `docs/personas.md` (empty placeholder, no confirmed personas), `docs/strategy/01`, `docs/strategy/06`, `docs/source/screens/01-overview-by-student.png`, `19-student-view.png`, v2 screenshots `docs/v2/screenshots/v2-admin-reports-desktop.png`, `v2-student--iv-in-use-phone.png`, all of `admin/components/v2/**`, `admin/lib/v2/{reports,student,queue,coverage,verification,types,seed}.ts`, `admin/package.json`, `node_modules/@exxatdesignux/ui` 1.6.5 types and `src/globals.css`.
- Vault: `_Insights.md` (Skills rows), `Meetings/exxat/2026-09-23-skills-checklist-with-sankalp.md`, raw transcript `Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (keyword pass: report, lagging, heatmap, bottom 20%), `Research/skills-checklist/research/meetings/2026-10-08-...prototype-analysis.md`. Aarti's 2026-10-08 statements are taken from `docs/journeys/01` and `02` "New evidence" sections, which quote the raw call.
- Mobbin: 8 screen searches (web and iOS), 14 references kept (section 2).

**Self-brief (recurring failures that apply):** "Action surfaces show work, not counts"; "No basic progress-bar dashboard viz" and "Progress bars are last resort"; "Aarti dislikes red in score viz"; "Viz first, text annotates"; "Never render internal notes in UI copy"; "A claim cannot reach further than its check" (section 8 lists what I did not verify).

---

## 1. The ten findings that matter most

1. **Copy volume is measurable and high.** v2 has 106 subtitle, section-description and muted helper strings totalling 1,470 words; median 14 words; 47 of them are 15 words or longer (scan of `admin/components/v2/**/*.tsx`, section 3.5). Most explain how to operate the UI or restate the title. A budget with numbers (section 3.1) fixes this mechanically.
2. **The reports page already has the right core visual, but buries it.** `reports-page.tsx:275` renders a students by skills heat grid with token shades, icon and words per cell (good, never red). It sits fourth on the page under a 5-tile KPI row, a filter section with a description, and an instruction paragraph, beside four more tabs and two signing sections. Promote it, cut the prose, move signing and checking into an Export sheet.
3. **There is no visual anywhere on the admin Home, Courses, Review queue, Records, Outcomes, preceptor or student Record pages.** The only quantitative visuals in v2 are the reports heat grid and the student skill-card pips (`skill-card.tsx:16`). Section 5 proposes 1 to 2 visuals per page, 14 in total, each answering a named question.
4. **The program's actual reporting questions are "where are they lagging" (by skill) and "bottom 20% by completion" (by student)** `[CALL 09-23]`, and Aarti wants the admin's launch page to show "who has met what" with counts against targets `[CALL 10-08, via journeys/01]`. The confirmed admin Home (contract 4.4) answers setup and worklist but shows no attainment. Adding a compact skill attainment strip and a "behind pace" dot strip to Home answers both without deciding OD-29 (section 4, G1).
5. **The student has no view of progress over time or of overall vs this-course standing.** Aarti: "how many things did they check off [in this course], and overall where do they stand" `[CALL 10-08, via journeys/02]`. Today the home shows three bare numbers (`student-home.tsx:58-79`). Recommend a cumulative "evaluations counted vs expected pace" line on Record and a mandatory-skills waffle with a course lens on Home (G2).
6. **Seed data cannot support several honest charts.** One preceptor wrote 59 of 68 evaluations, so "Rater comparison" compares one person with themselves; 10 of 12 students are "behind pace" and cohort mandatory attainment is 6%, so every pace chart reads as a uniform failure; there are 0 verifications, 0 lab batches, 0 log entries and only 5 submissions (queue age has 5 points); the store holds one course, so course coverage across offerings cannot be drawn; skills have no tags, so `[REQ RP-04]` by-tag cannot be shown. Seed changes are a prerequisite task (section 6, task T0).
7. **The DS can render what we need without a new library.** `KeyMetrics` takes `chart: { kind: "sparkline" | "bars" }` and `alert` per tile `[DS key-metrics.d.ts]`; `ChartContainer`, `ChartTooltip`, `ChartLegend` exist at the subpath `@exxatdesignux/ui/components/ui/chart` (not in the root barrel); `ProgressCell`, `SignalBarsCell`, `StatusBadge`, `Tip` are in the barrel. Recharts 3.10 is installed only as a DS dependency and is not hoisted, so the app must add `recharts` to `admin/package.json` before using `ChartContainer` children. Most proposed visuals are grids, waffles, bullets and dot strips, which are better as token-coloured HTML and SVG than as a chart library.
8. **The DS categorical chart tokens fail as a 5-slot palette.** Converted `--chart-1..5` (light) to hex and ran the dataviz validator: lightness and chroma failures, and `--chart-4` vs `--chart-5` sit at ΔE 8.5 under normal vision (hard fail below 15). The 3-slot subset `--chart-1, --chart-2, --chart-4` separates well (normal ΔE 23, CVD ΔE 14) but `--chart-2` reads grayish in light mode. So: use one sequential hue plus status tones with icons, never more than 3 categorical slots, always direct-labelled. Raise the palette with the DS owner (section 5.1).
9. **Reports and the review queue carry the most removable copy.** Reports alone has 5 explanatory paragraphs (`reports-page.tsx:183,263,308,329,352`) and a 70-word signature note (`:434`); the queue has a whole "Where each item goes" section (`review-queue-page.tsx:226`) that restates what the Approve and Return buttons do. Each becomes a button consequence, a column-header `Tip`, or a "How this is counted" sheet.
10. **The confirmed nav holds up against analogues; no blocker found.** Approvals as a badged top-level row matches Deel ("Action required") and Workable (Inbox). The student's 4-tab bottom bar matches Babbel and Strava (3 to 5 tabs). Two non-blocking proposals: rename the Reports tabs to the three `[REQ RP-02, RP-03]` views, and give the reviewer an age-sorted queue rather than a Home (consistent with contract 3.2).

---

## 2. Analogues (Mobbin-first, then beyond)

| # | App and screen | Pattern | What we borrow | For |
|---|---|---|---|---|
| A1 | SchoolAI, class session view ([screen](https://mobbin.com/screens/1e4632b3-7192-445e-a6f4-955905044362)) | Per-outcome stacked bars (count of students at each level) above a student list where each row has one dot per outcome | Skill attainment strip: one horizontal stacked bar per skill, segments = students Achieved / In progress / Not met yet / Not started, counts printed in segments. Row dots per student mirror our heat grid | Admin Home, Reports by skill |
| A2 | Headspace, course levels ([screen](https://mobbin.com/screens/81a53f98-3a1e-4b83-bfdb-35089dd9bd00)) | Numbered circles per session, filled when done, current one highlighted | Validates our pips (`skill-card.tsx:16`); extend to "one circle per required evaluation", with a distinct mark for "waiting" and for "did not meet" | Student skill card |
| A3 | Babbel, learning plan home ([screen](https://mobbin.com/screens/832f5742-a189-409a-8bb1-06f5ed82bb60)) | Greeting, a small ring with "8/12 lessons completed", then a single next-action card | One compact progress figure with its denominator above "Do this next"; no explanatory subtitle | Student Home |
| A4 | Quizlet, set progress ([screen](https://mobbin.com/screens/439e68be-eb63-4fb8-985a-ab27b24e3ff2)) | Three buckets (Not studied / Still learning / Mastered) as tappable rows with counts | Mandatory skills as three tappable buckets (Not started / In progress / Achieved) that filter the list below | Student Home |
| A5 | Strava, streak and weekly goal widget ([screen](https://mobbin.com/screens/1c996718-ab94-4247-85b3-80885bab44c9)) | Weekly bars against a goal, plus day dots | Weekly bars of evaluations counted on the student Record, with the expected pace as a reference line | Student Record |
| A6 | Plane, cycle burn-down ([screen](https://mobbin.com/screens/125f1a8e-fd93-41f8-a189-233b59da10c7)) | Actual line vs dashed ideal line, with "Trailing by N" stated in words beside the chart | Cumulative evaluations counted vs a dashed pace line; the gap stated as text ("2 evaluations behind the pace") | Student Record, Reports by student |
| A7 | Linear, project progress ([screen](https://mobbin.com/screens/c1cc22aa-69de-468c-b200-cf80f05ac1c7)) | Scope / Started / Completed as three small counts above a quiet area chart; low-chrome page | Quiet, label-first chart framing; counts as the legend | Reports, Records |
| A8 | Workable, inbox with inline approval ([screen](https://mobbin.com/screens/206a61d4-bf58-4bca-b9b6-8226d88ffc66)) | One row per request with relative age ("36 minutes ago"), expandable to details with Approve / Reject on the row | Age on every queue row; decide from the expanded row when outcomes agree | Review and approve |
| A9 | Deel, Action required ([screen](https://mobbin.com/screens/ebede796-0ca0-408a-bf05-630420732e1f)) | Badged nav row, filter chips, bulk "Approve all your pending (71)" in an Actions menu | Bulk approve only the agreeing items, behind one menu, with the count in the label | Review and approve |
| A10 | Squarespace, Get started home ([screen](https://mobbin.com/screens/70de1eae-15ad-40fc-b63c-1ea9d6fe9d74)) | Grouped setup checklist, each group with "6/7" and a thin meter, collapsible | The contract's Setup block, with one "n of N configured" meter per group instead of a sentence | Admin Home |
| A11 | Apollo, Next steps ([screen](https://mobbin.com/screens/1dc11d19-505d-4259-81a5-a55cc4948e89)) | Setup rows with a single filled "Finish" on the current row, outline "Start" elsewhere, "Completed" disabled | One filled primary per page (already a contract rule); completed rows collapse to a muted line | Admin Home |
| A12 | Uxcel, credential page ([screen](https://mobbin.com/screens/bf35c09e-6390-47e0-9e2a-464b30807b83)) | "Credentials verified", completion date and ID in one meta line, then the certificate, then Share and Download | Signed-record share: one meta line (verified by, date, version, evaluation count), preview, two actions; no paragraph about signatures | Student Share verified record |
| A13 | Peerlist and Clerk, activity heat calendar ([Peerlist](https://mobbin.com/screens/6d0ce0ed-0684-45ad-a16c-68c909ec358d), [Clerk](https://mobbin.com/screens/095cfa3a-f33c-42c4-a48e-213de19070e0)) | Day cells shaded by activity count, "Less ... More" legend, tooltip with the exact count | Optional: a term calendar of counted evaluations on the student Record (one cell per day, single hue) | Student Record (P3) |
| A14 | Codecademy, Skills tracking ([screen](https://mobbin.com/screens/597bbefb-e6cf-401c-abc6-47789b29e5b7)) | Per-subject horizontal bars on a shared axis | Counter-example: bars without a target say nothing about "enough". We use a bullet (bar plus required-minimum tick) instead | Anti-reference |

Beyond Mobbin `[INFER]`:
- **Bullet chart (Stephen Few)** for every "have N of required M" figure: a thin bar for counted, a tick at the required minimum, an optional lighter band for "waiting". It is the honest replacement for progress bars because it shows the target, and it fits in a table cell.
- **Waffle (unit) chart** for small integer goals (3 evaluations, 5 mandatory skills, 12 students): each unit is a square, so "2 of 3" is countable without reading a number. Students on phones read units faster than percentages.
- **Mastery heat grid (students x skills)**, as in competency-based education gradebooks, sorted by row and column totals so the weak skill and the lagging students sit at the edges.
- **Dumbbell** for "attempts until success" per skill: first attempt date to achieved date, or attempts used vs attempts needed.
- **Quiet pages (Linear, Notion):** title, one line of scope, content. Instruction lives in empty states and tooltips, not under the title.

---

## 3. Content strategy

### 3.1 Copy budget (numeric)

| Element | May contain | Must not contain | Limit |
|---|---|---|---|
| Page title (h1) | The nav label, or the object name on a sub-page | Verbs addressed to the user, "your", process words ("Add skills to...") | 1 to 3 words on nav pages; 6 on object pages |
| Subtitle | Scope facts only: course, term, cohort, or one state fact ("3 waiting") | Instructions, restating the title, how the page works, "Open a name to..." | Optional. 12 words max. Default is none. If scope is shown in a filter chip or breadcrumb, no subtitle |
| Section heading | A noun, with a count in brackets when it is a list | "Where each item goes", questions | 4 words |
| Section description | A rule the user cannot guess that affects the next action, or a privacy fact | Sorting order ("Newest first"), how to use the control, accessibility implementation notes | Default none. 10 words max |
| Field helper | Format, limit, requirement ("Required by the program") | What the field is for when the label already says it | 12 words |
| Row primary label | Object name | Category prefixes repeated in a column | 6 words |
| Row secondary line | One state or provenance fact ("With J. Delgado, 3 days") | Full sentences | 8 words |
| Status text | Fixed vocabulary from `lib/v2` (`STATUS_LABEL`, `OUTCOME_WORD`, `CELL_WORD`) with icon | New synonyms per page | 4 words |
| Empty state | What will appear here and, if useful, the one action that makes it appear | Explanations of the product | Title 6 words, body 14 words |
| Banner (`LocalBanner`) | A state change, a block with its fix, or an irreversible consequence | Tips, onboarding, descriptions | Title 8 words, body 20 words |
| Button | Verb plus object; consequence in the label when it is irreversible ("Approve and count") | "Click", "Submit" alone | 4 words |
| Tooltip (`Tip`) | Definition, basis of a number, why a control is disabled | The only copy of something required on a phone | 20 words |
| Sheet ("How this is counted") | Method, basis, audit, provenance | Anything needed to complete the task | No limit; one sheet per page max |
| Visible prose budget per page | Everything above except data, labels and buttons | | Desktop: 40 words above the fold. Phone: 25 words above the fold |

### 3.2 Delete, keep, move

**Delete** (the string and its container):
- Instructions that explain the UI ("Tick several to approve them together", "Press a cell to change it").
- Restating the title or the nav label in the subtitle ("What each evaluation did to a student's record").
- Process narration ("Filters re-scope the evidence first, then every figure is recalculated").
- Sort and layout notes ("Newest first", "Each shows its state in words as well as an icon").
- Prototype and demo caveats (already covered by contract section 7).

**Keep, at the point of decision, one line:**
- State ("Waiting for J. Delgado, RN, 3 days").
- Consequence of an action, on the action ("Returned items do not count until the student resends").
- Irreversible warnings ("A saved session cannot be edited", "The first link stops working").
- Requirement-driven rules the user cannot guess: lab never satisfies a clinical-setting minimum `[REQ SC-12]`; evidence from any course counts `[REQ SH-06]`; mapping is not eligibility `[REQ CM-05]`; pending evidence does not count `[REQ AR-06]`; tag figures overlap `[REQ RP-04]`; a failed rule stated so the student can act `[REQ SH-03]`.
- Privacy facts for staff ("Staff only. Never in a student view or export").

**Move to progressive disclosure:**
- Basis of a computed figure (pace, single-rater flag, met rate) to a `Tip` on the column header or KPI label, and the full method to one "How this is counted" sheet per page.
- Signature and verification mechanics to the Export sheet.
- Version and audit detail to the existing version timeline.

### 3.3 Decision rule: text, control, or visual

Apply in order; stop at the first match.

1. **Is it a quantity, a comparison to a target, or a distribution?** Make it a visual with the number printed on it (bullet, waffle, stacked bar, grid). The sentence goes.
2. **Does it tell the user how to operate something?** Delete it and fix the control: clearer label, visible affordance, disabled state with a `Tip` giving the reason.
3. **Is it what happens after an action?** Put it on the action: button label, confirm dialog, or the inline result after the action.
4. **Is it a status?** `StatusBadge` with icon and word from the fixed vocabulary.
5. **Is it a rule the user cannot infer and needs before acting?** One line, 10 words max, next to the control it governs.
6. **Is it a method, basis, or provenance?** `Tip` (one sentence) and the page's "How this is counted" sheet.
7. **Anything else** is a candidate for deletion.

### 3.4 Hover and progressive disclosure rules

- Desktop: DS `Tip` (`label`, `side`) on column headers, KPI labels, chart marks and disabled buttons. `Tip` is hover and focus only, so it is never the only carrier of required information.
- Phone (student, preceptor): no hover. Use an inline `Collapsible` "How this is counted" under the visual, or a bottom `Sheet`. A chart mark opens its detail on tap, not on hover.
- Disabled buttons keep their reason reachable: wrap in `Tip` on desktop and print the reason as the helper line on phones.
- One "How this is counted" entry point per page, in the page header actions, opening a `Sheet` (DS OS convention: `FloatingSheetPanel` per workspace memory, verify the export at build).
- Every chart has a visible "Show as table" toggle or a sibling table, so no fact is only in a tooltip.

### 3.5 Before and after (current v2 code, literal text)

| # | File:line | Current text | After | Rule |
|---|---|---|---|---|
| 1 | `review/review-queue-page.tsx:85` | subtitle "{code}, {term}. Evaluations waiting for approval and photos of signed paper forms. Nothing here counts until you approve it." | subtitle "{code}, {term}". The consequence moves to the decision: Approve button "Approve and count" | 3, 5 |
| 2 | `review/review-queue-page.tsx:123` | "Tick several to approve them together. Open a student's name to compare the evaluation with their self-rating, or to send it back." | delete | 2 |
| 3 | `review/review-queue-page.tsx:226` | section "Where each item goes", description "Approved items count toward progress at once. Returned items do not count, and the student reads your reason." | delete the section. Return dialog keeps: "Does not count until the student resends. They see your reason." | 3 |
| 4 | `review/review-queue-page.tsx:180` | "A request that has waited too long with its evaluator. Hand it to someone else who is qualified; the old link stops working for the first person." | tab "Stalled (1)" with a "Waiting" age column; reassign dialog keeps "The first link stops working." | 1, 3 |
| 5 | `reports/reports-page.tsx:168` | subtitle "{code}, {term}, {cohort}. Counted evidence only. Open a name to read the evidence behind a figure." | subtitle "{code}, {term}, {cohort}. Counted evidence only." | 2, 5 |
| 6 | `reports/reports-page.tsx:183` | Filters description "Filters re-scope the evidence first, then every figure is recalculated from what is left." | delete; filters become one row of controls above the views, chips below | 2 |
| 7 | `reports/reports-page.tsx:263` | "Each cell is a student's progress against the skill's own rule. The words and symbol in the cell say the same as the shade. The Student table tab lists every cell in words." | delete; the legend row stays, plus a "Show as table" toggle | 2, 6 |
| 8 | `reports/reports-page.tsx:308` | 60-word pace basis ending "The requirements do not define pace; this is the prototype's reading." | `Tip` on "Expected by now": "The term is {n}% through, so about {n}% of required evaluations." Full basis in the "How this is counted" sheet | 6 |
| 9 | `reports/reports-page.tsx:329` | "Observations are counted evaluations of any outcome. A skill is flagged when it has two or more observations and one evaluator behind all of them. That is not wrong, but one person's judgement carries the whole skill." | flag icon with `Tip` "One evaluator behind every observation"; definition of Observations in the column-header `Tip` | 6 |
| 10 | `reports/reports-page.tsx:434` | 70-word signature note | moves into the Export sheet; page shows nothing | 6 |
| 11 | `admin/starter-library-page.tsx:30` | "Both ways create skills without an evaluation model. You choose the model for each skill when you configure it." | "Added skills need configuring before students can use them." `[REQ IM-09]` | 5 |
| 12 | `admin/map-courses-page.tsx:73` | "Gaps in how this course is covered. They do not block anything. Fix them or decide to accept them." | "Warnings do not block students." | 5 |
| 13 | `outcomes/outcomes-page.tsx:41` | subtitle "{code}, {term}. What each evaluation did to a student's record, and what happens after a fail." | subtitle "{code}, {term}" | restates title |
| 14 | `outcomes/outcomes-page.tsx:56` | "The newest first. Open one to see every version and, if needed, reopen it." | delete; the Date column header shows the sort | 2 |
| 15 | `outcomes/outcomes-page.tsx:111` | "Program staff only. A student never sees these, in the app or in an export." | keep as a lock icon plus "Staff only" badge on the heading; full sentence in `Tip` | privacy |
| 16 | `director/verification-pages.tsx:64` | "Open a name to read the record. A verification names the director, the date and the exact evaluations it rests on. It is never edited; a later change adds a version." | delete from the list; the verify dialog keeps "A verification is never edited. A later change adds a version." | 2, 3 |
| 17 | `preceptor/lab-grid-page.tsx:200` | "Press a cell to change it: Met, Not met, Not yet, Not recorded. Tick Absent for a student who was not there. Blank cells are not saved." | legend chips Met / Not met / Not yet; "Blank cells are not saved." beside Save | 2, 3 |
| 18 | `preceptor/lab-grid-page.tsx:262-263` | "Lab and simulation results count as evidence. They never count toward a clinical setting." plus a setting-specific line | one line under the setting control: "Never counts toward a clinical setting." `[REQ SC-12]` | 5 |
| 19 | `student/student-home.tsx:92` | Mandatory description "What NURS 350 expects of every student." | delete | restates heading |
| 20 | `student/request-signoff.tsx:145` | subtitle "One request can carry several skills. Evaluators need no account." | no subtitle; "No account needed" as the evaluator picker helper | 2 |
| 21 | `student/sync-page.tsx:129` | "Newest problems first. Each shows its state in words as well as an icon." | delete | implementation note |
| 22 | `student/history-page.tsx:57` | "Showing every course. All of your evidence so far is from {code}, so narrowing to one course would show the same list." | course filter control disabled with `Tip` "All your evidence is from {code}" | 2 |
| 23 | `student/log-flow.tsx:153` | subtitle "Saved on this phone as you go, so nothing is lost if the signal drops." | no subtitle; the sync chip already shows "Saved on phone" | 1 (state lives in a control) |
| 24 | `preceptor/evaluation-form.tsx:84` | "A request appears here when a student sends one that names you. Students send it by QR code, link or by handing you their phone." | empty state "Nothing waiting" / "Requests appear when a student names you." | empty-state budget |

Contract note: `V2-IA-shell-and-nav.md` 4.1 keeps several subtitles "unchanged" (for example rows 1, 13). Trimming them is a body change beyond that contract, so it is `[PROPOSED]` and needs its own copy contract (section 6, task T1).

---

## 4. IA and UX critique beyond the contract

### 4.1 Landing pages: top questions and the single primary action

| Role, landing | Top 3 questions (in order) | Single primary action | Gap today |
|---|---|---|---|
| Admin, Home | 1. What still blocks students (unconfigured, unpublished, unmapped)? `[REQ IM-10]` 2. Which skills is the cohort weak on, and who is behind? `[CALL 09-23]` 3. What is waiting on me? | Setup phase: "Configure next skill". Steady state: "Open Review and approve" | Contract 4.4 answers 1 and 3 with rows; 2 is only a name list. No attainment visual |
| Admin, Skills library | 1. How many still need configuring? 2. Which ones? 3. Where did each come from? | "Configure next" | Count is a sentence in a banner; no meter `[REQ IM-10]` |
| Admin, Courses | 1. What does this course expect (mandatory vs optional)? `[REQ CM-03]` 2. Can every mandatory skill actually be achieved here? 3. What is not mapped? | Change a skill's level | Warnings are prose; no coverage summary |
| Reviewer, Review and approve | 1. What is waiting and how long? 2. Which can I approve quickly (outcomes agree)? `[REQ AR-02]` 3. What is stalled with an evaluator? | Approve | No age column, no agreement indicator at list level |
| Director, Records | 1. Who is ready to verify? 2. Who has gaps, and which? 3. What changed since I verified? | Verify | Flat list; readiness is not grouped |
| Staff, Outcomes | 1. Who did not meet a skill recently? 2. Which plans are open and stalled? 3. Any concerns? (staff only) | Open the evaluation | Three object types stacked on one page |
| Staff, Reports | 1. Which skills is the cohort weak on? `[REQ RP-03]` 2. Which students are lagging (bottom 20%)? `[REQ RP-02]` `[CALL 09-23]` 3. What evidence sits behind this number? `[REQ RP-05, RP-06]` | Open the student or skill behind a figure | 5 tabs plus PDF signing plus PDF checking on one page |
| Student, Home | 1. What is left, overall and in this course? `[REQ ST-01]` `[CALL 10-08]` 2. What do I do next? 3. What is waiting, and with whom? `[REQ SH-02]` | "Do this next" (already built, good) | Three bare numbers; no overall vs course view |
| Student, Record | 1. What counted and why not? `[REQ SH-02, SH-03]` 2. Am I on pace this term? 3. Can I share a verified record? | Open a skill's attempts | No time view; per-setting progress is text only `[REQ SH-05]` |
| Preceptor, Requests | 1. Who is waiting for me? 2. How long have they waited? 3. How many skills per request? | Open the evaluation | No wait age on rows `[REQ EV-05]` |
| Lab instructor, Lab sessions | 1. Who is here, who is absent? 2. Which skills tonight? 3. Is everyone recorded before I save? | Save session | Completion is a sentence (`lab-grid-page.tsx:260`) not a visible tally |

### 4.2 Confirmed nav against the analogues

- Admin, 7 rows (`V2-IA` 3.1). Deel and Workable keep approvals as a badged top-level row; Squarespace and Apollo keep setup on Home, not as a nav row. Matches. No change.
- Reviewer, no Home, lands on the queue (3.2). Workable and Deel land approvers on the inbox. Matches.
- Director, lands on Records (3.3). Fine for verification. Observation only: director questions 2 and 3 (gaps, changes) need the readiness grouping in G5, not a new row.
- Student, 4 rows mirrored in the bottom bar (3.5). Babbel (3 tabs), Strava (5), Speak (5). Matches. Progress over time belongs inside Record, not a new tab.
- Preceptor (demo shell, 3.4). The product truth is shell-free `[REQ EV-01]`; nothing here changes that.

**No blocker found. No confirmed nav row is reopened.**

### 4.3 Gaps, numbered (severity: High = a top-3 question unanswered; Medium = answered but slow or ambiguous; Low = polish)

| # | Severity | Gap | Recommendation | Tags |
|---|---|---|---|---|
| G1 | High | Admin cannot see weak skills or lagging students without opening Reports and choosing a tab | Add to Home a "Cohort" block under Needs attention: skill attainment strip (top 5 weakest mandatory skills) and a behind-pace dot strip, each linking to Reports with that view open. Keeps the OD-29 seam: Home stays one route | `[REQ RP-02, RP-03, RP-05]` `[CALL 09-23]` `[PROPOSED]` |
| G2 | High | Student cannot see overall vs this-course standing or progress over time | Home: mandatory waffle with a "This course / All courses" segmented lens. Record: cumulative counted vs pace line | `[REQ ST-01, SH-06]` `[CALL 10-08]` `[PROPOSED]` |
| G3 | High | Reports overloads one page (KPIs, filters, 5 tabs, PDF, PDF check) | Three views matching the requirements: Students, Skills, Evaluators (the last only when evaluator count is at least `SMALL_NUMBERS`). Heat grid becomes the Students view default. Export, signing and check move into an Export sheet | `[REQ RP-02, RP-03, RP-10]` |
| G4 | Medium | Queue rows carry no age and no agreement signal | Age column ("3 days"), agreement icon (agreed / differed / not comparable from `compareEvaluation`), sort by age. Bulk approve offered only for agreed items, count in label | `[REQ AR-01, AR-02]` |
| G5 | Medium | Records list is flat | Group or segment: Ready to verify / Has gaps / Changed since verified / Verified, with counts | `[PROPOSED]` D29 |
| G6 | Medium | Courses shows prose warnings and no coverage summary | A coverage bar for the course (mandatory / optional / not expected, with blocked skills marked) and warnings as rows with an icon per kind | `[REQ CM-03, CM-05]` |
| G7 | Medium | Preceptor rows do not show how long a student has waited | Add "Sent {n} days ago" from `Submission.daysWaiting` | `[REQ EV-05]` `[INFER]` |
| G8 | Medium | Seed variance makes several charts dishonest (finding 6) | Seed task T0 before any chart ships | `[INFER]` |
| G9 | Low | Outcomes mixes evaluations, plans and concerns | Tabs: Evaluations / Plans / Concerns (staff only), counts in tab labels | `[PROPOSED]` D21, D22 |
| G10 | Low | By-tag report absent; skills have no `tags` field | Out of v2 unless Romit wants RP-04 shown; needs a type and seed change | `[REQ RP-04]` |
| G11 | Low | Student per-setting progress is a text line | Per-setting mini bullets inside the skill card, with lab marked "does not count here" | `[REQ SH-05, SC-12]` |

---

## 5. Data visualization plan

### 5.1 Rendering approach (one recommendation)

**Recommend: DS-native, three tiers, token-coloured.**
1. **KPI tiles:** DS `KeyMetrics` with `chart: { kind: "sparkline" | "bars", series }` and `alert: "warning"` where action is needed. No custom KPI cards. Max four tiles (workspace `exxat-kpi-max-four`).
2. **Grids, waffles, bullets, dot strips, stacked bars:** small app components rendered as semantic HTML (a `Table` for grids) or inline SVG, coloured only with tokens. These forms are tables or unit marks, not plotted axes, so a chart library adds weight and accessibility work without benefit. The existing heat grid (`reports-page.tsx:275`) is the template.
3. **The one true time series** (cumulative counted vs pace): `ChartContainer` + `ChartTooltip` + `ChartLegend` from `@exxatdesignux/ui/components/ui/chart`, with Recharts `LineChart`. Requires adding `recharts@^3.10` to `admin/package.json` (it is installed only under `.pnpm` as a DS dependency and not hoisted, verified).

Why not Plot or ECharts here: PCE adopted them for dense analytics; this product's visuals are small, count-based and must render on phones and in shell-free evaluator pages. Staying on DS primitives keeps one tooltip and legend style and no new dependency beyond Recharts. `[INFER]`

**Colour:**
- Magnitude (attainment, counts): one sequential hue, light to dark. Keep the existing heat scale steps (`bg-background`, `bg-muted`, `bg-brand-tint`, `bg-brand`) or move to a non-brand chart hue if the "no brand for states" rule is applied strictly (workspace memory `feedback_ds_typography_color_discipline`). Decide once, apply everywhere.
- Status (Achieved, In progress, Waiting, Did not meet, Not started): `StatusBadge` tones success / info / neutral / warning / neutral with icons. **Did not meet uses warning (amber), never destructive red** (Aarti).
- Categorical (only where series are the subject, for example Clinical / Lab / Simulation): at most 3 slots, `--chart-1`, `--chart-2`, `--chart-4`, always direct-labelled. Validator results: the 5-slot DS set fails (normal ΔE 8.5 between `--chart-4` and `--chart-5`); the 3-slot set passes CVD and normal-vision separation in light (#2b62ef, #007668, #c18200) and dark (#6d9afe, #33cb91, #f3b100) but fails the soft chroma check (`--chart-2` light) and the dark lightness band. Raise with the DS owner; mitigate with labels and icons.
- Never `color-mix(in oklch` in product code (workspace grep gate). Use Tailwind opacity on a token class if a step is needed.

**Accessibility, every visual:** a text alternative (visible caption with the headline figure, plus "Show as table" or an adjacent table); identity never by colour alone (icon, label, or position); marks at least 8 px and touch targets 44 px on phones; chart marks focusable with the same tooltip content as hover (`chartTooltipKeyboardSyncProps` exists for this `[DS]`); no text under 12 px.

### 5.2 Page by page

Data source column: every selector or field named was found in `admin/lib/v2` (file noted). "Seed" says whether today's seed gives the chart enough variance.

| Page | Visual | Question it answers | Chart type and why | Data source (verified) | Seed | Accessibility | Mobile |
|---|---|---|---|---|---|---|---|
| Admin Home | V1 Setup meters | How far is setup? `[REQ IM-10]` | Bullet per group (configured / published / mapped out of total), not a progress bar: the tick shows "all" and the count is printed | `Skill.configured`, `Skill.published` (`types.ts:109`), `mappingSummary` (`coverage.ts:63`) | 31 skills, 27 configured, 12 published, 8 mapped: enough | Count in text beside the bar | Stacks; bars full width |
| Admin Home | V2 Cohort strip | Which mandatory skills are weakest; who is behind? `[CALL 09-23]` | Stacked horizontal bar per skill (Achieved / In progress / Not met yet / Not started), sorted weakest first, top 5 (SchoolAI A1). Plus a dot strip of students by "evaluations short", bottom 20% labelled | `heatmap(s, NO_FILTERS)` rows and cells (`reports.ts:121`), `behindPace` (`reports.ts:201`) | Weak: 6% attainment, 10 of 12 behind, so bars are nearly uniform. Needs T0 | Segment counts printed; legend with icons; links to Reports | Bars stack, labels above bars |
| Skills library | V3 Configuration meter | How many still need configuring? `[REQ IM-10]` | KPI tile with `progress`/`progressMax` or a single bullet in the header, plus a "Needs configuration" filter chip with count | `Skill.configured` | Enough | Text "27 of 31 configured" | Same |
| Courses | V4 Coverage bar | What does the course expect, and what is blocked? `[REQ CM-03]` | One stacked bar: Mandatory / Optional / Not expected, with blocked skills hatched (texture, not colour) | `MappingRow.level` (`types.ts:124`), `coverageWarnings` kinds (`coverage.ts:24`) | 9 mappings (5/3/1) on one course: enough for one course; no cross-offering view possible (single `course`) | Segment labels; warnings as icon rows | Full width |
| Review and approve | V5 Queue age | What has waited longest? | Age column with `SignalBarsCell`-style bucket (0 to 2, 3 to 6, 7+ days) plus a KPI "Oldest: 9 days" with `alert` when over 7 | `Submission.daysWaiting`, `createdAt` (`types.ts:188`), `queueItems`, `stalledRequests` (`queue.ts:65,94`) | Thin: 5 submissions, ages 0, 3, 2, 9, 0. Add 6 to 10 in T0 | Days as text; sortable column | Age as secondary line |
| Review and approve | V6 Agreement mix | How many can I approve quickly? `[REQ AR-02]` | Three counts as a segmented filter (Agreed / Differed / Not comparable), not a chart | `compareEvaluation` (`queue.ts:469`) | 3 awaiting approval: thin | Words plus icon | Same |
| Outcomes | V7 Outcome mix by skill | Where do students not meet? | Small multiples: one row per skill, unit dots per evaluation coloured by outcome (Met / Not yet / Did not meet in amber), newest right | `Evaluation.outcome`, `date`, `skillId` (`types.ts:157`), `outcomeRows` (`outcomes.ts:219`) | 48 met, 12 not yet, 8 not met over 39 dates: enough | Icon per outcome; count per row | Rows scroll horizontally inside the card, labels sticky |
| Outcomes | V8 Plan steps | Are plans moving? | Step pips per plan (done / not done), like A2 | `Remediation.steps`, `status` (`types.ts:320`) | 1 plan: thin, add 2 in T0 | "2 of 4 steps" text | Same |
| Records | V9 Readiness bars | Who can I verify now, who has gaps? | Bullet per student: mandatory skills achieved vs total, with a marker for pending items; grouped by status | `verificationRows`, `mandatoryProgress`, `gaps`, `verificationStatus` (`verification.ts:40,83,109,161`) | 0 verifications, so every row is "Not verified". Add 3 verified and 1 changed in T0 | Status badge plus "4 of 5" | Card list |
| Reports, Students | V10 Heat grid (existing) | Who has met what? `[REQ RP-02]` | Keep the students x skills grid; sort rows by achieved count ascending (lagging first) and columns by attainment ascending (weakest first); add row and column totals as bullets | `heatmap` (`reports.ts:121`) | Variance low (see V2) | Already has icon plus words per cell; add "Show as table" | Grid scrolls with sticky name column; phone default switches to a per-student list with mini waffles |
| Reports, Skills | V11 Skill attainment | Which skills are weak? `[REQ RP-03]` | Same stacked bar as V2 for every skill in scope, mandatory first, with simulation share as a small inline figure | `skillStats` (`reports.ts:228`) fields `achieved`, `students`, `observations`, `simulationShare`, `singleRater` | Enough for 8 skills | Counts printed; single-rater flag icon with `Tip` | Stack |
| Reports, Students | V12 Pace | Who is behind, by how much? | Dot plot: each student's collected vs expected, a vertical "expected by now" line, dots left of the line labelled with "short by n". Replaces the Behind pace table as the lead visual, table below | `paceRows` (`reports.ts:179`) fields `collected`, `needed`, `expected`, `behindBy` | 10 of 12 behind: reads as all-red-ish; T0 should give 3 to 4 behind | Amber for behind, never red; labels on behind dots only | Vertical list of rows, each a mini bullet |
| Student Home | V13 Mandatory waffle with lens | What is left, overall and in this course? `[REQ ST-01]` `[CALL 10-08]` | One square per mandatory skill (Achieved filled, In progress half, Waiting outlined with clock icon, Not started empty), segmented control "This course / All courses"; tapping a bucket filters the list (Quizlet A4). Replaces the three-number `dl` at `student-home.tsx:58-79` | `courseWork(s).summary`, `mandatory`, `optional` (`student.ts:305`), `skillProgress` (`student.ts:65`) | Maya: 1 of 5 achieved, 2 waiting: enough. "All courses" lens has no second course in seed | Each square has an accessible name; bucket counts in text | Designed for 390 px |
| Student skill card | V14 Pips plus setting bullets | How many more, and where? `[REQ SH-05]` | Keep pips; add distinct marks for waiting (outlined with clock) and did not meet (amber ring), and one mini bullet per named setting with lab shown as "does not count here" | `SkillProgress.counted`, `need`, `awaiting`, `notMet`, `settings[]` (`student.ts:25`) | Depends on setting minimums in seed: verify at build | Text line already present (`skill-card.tsx:50`) | Native |
| Student Record | V15 Cumulative vs pace | Am I on pace this term? | Line: cumulative counted evaluations by week, dashed pace line from `TERM.start` to `TERM.end`, gap stated in words (Plane A6). Weekly bars as an alternative on phones (Strava A5) | `studentHistory` (`student.ts:730`) attempts with dates, or `Evaluation.date` filtered to the student; `TERM`, `termShare` (`reports.ts:142,147`) | Maya has 8 evaluations Aug 18 to Oct 16: enough | Caption "6 counted, pace says 7 by now"; table toggle | Weekly bars, 8 to 16 bars fit at 390 px |
| Preceptor Requests | V16 Wait age | Who has waited longest? | Not a chart: "Sent 3 days ago" per row, sorted oldest first | `waitingFor` (`preceptor.ts:298`), `Submission.daysWaiting` | Thin (see V5) | Text | Native |
| Lab sessions | V17 Live tally | Is everyone recorded? | Waffle of students (recorded / absent / blank) in the sticky Save bar, replacing the sentence at `lab-grid-page.tsx:260` | `labCounts` (`lab.ts:89`) fields `results`, `studentsWithResults`, `blank` | Computed live from input: enough | "9 recorded, 1 absent, 2 blank" text | In the sticky bar |

Pages deliberately without a chart: configure wizard (a form), import (a review table), single evaluation and remediation pages (records, not data), sync (a queue).

### 5.3 Banned forms here

Donuts and pies (ClassDojo-style, Mobbin result: one-slice donut adds nothing); plain progress bars without a target (Codecademy A14); dual axes; red for "did not meet"; radar charts (Uxcel competency radar: unreadable for 8+ skills and invites peer comparison, which students must never see); rater league tables (FERPA and fairness risk, and the seed has one dominant rater).

---

## 6. Prioritised recommendations and build split

### 6.1 Recommendations

| P | Recommendation | Effort | Refs |
|---|---|---|---|
| P0 | Seed variance pass: 3 to 4 students behind (not 10), cohort attainment 30 to 60%, second preceptor with 25%+ of evaluations, 8 to 10 submissions with ages 0 to 12 days, 3 verified records and 1 changed, 2 remediation plans, 1 saved lab batch | M | finding 6, G8 |
| P0 | Copy budget applied to all v2 pages (section 3.1, rows of 3.5) via a copy contract | M | finding 1 |
| P0 | Student Home mandatory waffle with course lens (V13) | M | G2 |
| P1 | Admin Home Cohort block (V2) plus setup meters (V1), within the contract 4.4 layout | M | G1 |
| P1 | Reports restructure: Students / Skills / Evaluators views, heat grid sorted, V11, V12, Export sheet for PDF sign and check | L | G3 |
| P1 | Review queue age and agreement (V5, V6) | S | G4 |
| P1 | "How this is counted" sheet pattern, one per page that has a computed figure (Reports, Home, Record) | S | 3.4 |
| P2 | Student Record cumulative vs pace (V15) and skill card setting bullets (V14) | M | G2, G11 |
| P2 | Records readiness grouping and bullets (V9) | S | G5 |
| P2 | Courses coverage bar (V4) | S | G6 |
| P2 | Outcomes tabs and small multiples (V7, V8) | M | G9 |
| P3 | Preceptor wait age (V16), lab live tally (V17) | S | G7 |
| P3 | Term activity calendar on the student Record (A13) | S | optional |
| P3 | DS palette request: a validated 3 to 5 slot categorical set and a non-brand sequential ramp | S (outside repo) | 5.1 |

### 6.2 Build tasks with disjoint file ownership

Every task needs its own design contract before code (product hook). T0 runs first; T1 to T6 then run in parallel.

| Task | Owns (only these files edit) | Delivers |
|---|---|---|
| T0 Seed | `admin/lib/v2/seed.ts`, `admin/tests/v2/seed-variance.test.ts` (new); update any test that asserts seed counts | P0 seed pass. Check `docs/v2/verify/*.mjs` counters still pass |
| T1 Copy | `review/review-queue-page.tsx`, `outcomes/outcomes-page.tsx`, `director/verification-pages.tsx`, `admin/starter-library-page.tsx`, `admin/map-courses-page.tsx`, `student/request-signoff.tsx`, `student/sync-page.tsx`, `student/log-flow.tsx`, `student/history-page.tsx`, `preceptor/evaluation-form.tsx` | Section 3.5 rows in those files. No layout change |
| T2 Viz primitives | new `admin/components/v2/viz/` (`bullet.tsx`, `waffle.tsx`, `stacked-bar.tsx`, `dot-strip.tsx`, `how-counted-sheet.tsx`), `admin/package.json` (add `recharts`), new `admin/tests/v2/viz.test.tsx` | Token-only primitives with table fallbacks; `ds-adoption-reviewer` verdict first |
| T3 Student | `student/student-home.tsx`, `student/skill-card.tsx`, `student/record-page.tsx` (Record visual area only if V15 lands there; else a new `student/record-progress.tsx`) | V13, V14, V15. Imports T2 primitives |
| T4 Admin Home | `role-home.tsx`, `admin/admin-home.tsx`, `lib/v2/home.ts` (the contract T2 files; coordinate if that contract task is still open) | V1, V2 |
| T5 Reports | `reports/reports-page.tsx`, new `reports/export-sheet.tsx` | G3, V10 to V12, rows 5 to 10 of 3.5 |
| T6 Queue, records, lab | `review/review-queue-page.tsx` is owned by T1 for copy, so T6 runs after T1 for that file; `director/verification-pages.tsx` likewise; `preceptor/lab-grid-page.tsx` | V5, V6, V9, V17 |

Conflict note: T1 and T6 share `review-queue-page.tsx` and `verification-pages.tsx`. Either merge T6 into T1 for those two files, or sequence T6 after T1. Every other pair is disjoint.

---

## 7. Blockers

- **No blocker to the confirmed nav.**
- **Seed variance (T0) blocks honest charts** on Home V2, Reports V12, Records V9, Queue V5 and anything evaluator-based.
- **Recharts must be added** to `admin/package.json` before V15 can use `ChartContainer`; all other visuals need no dependency.
- **One course in `V2State`** means "this course vs all courses" (V13 lens) and cross-offering coverage cannot be demonstrated without a second course in the type and seed. Decide: fake a second course in T0, or show the lens disabled with a `Tip`.
- **By-tag reporting** `[REQ RP-04]` cannot be shown: `Skill` has no tags field.
- **OD-29** (report as launch page) stays open. G1 puts attainment on Home without changing the landing route.

## 8. Not verified

- No visual rendered: no screenshots, no visual-diff, no axe. Every visual above is a proposal, so any verdict is static only.
- Mobbin screens were read from low-resolution previews.
- `FloatingSheetPanel` was not checked in the installed DS 1.6.5 exports; `ChartContainer` subpath import was inferred from the `./components/ui/*` export map, not test-imported.
- The dark-mode validator run used the DS dark chart tokens against the validator's default dark surface, not the Prism or Lavender dark `--background`.
- Aarti's 2026-10-08 statements were read from the journeys docs' quotations, not re-pulled from the raw transcript in this pass.
- Whether seed skills carry setting minimums enough for V14 was not checked.
- Word counts in finding 1 come from a regex over string literals and `<p className="text-sm|xs text-muted-foreground">` paragraphs; strings built across several expressions may be under-counted.
