# T2 Student audit (v2 prototype, read-only)

Scope: student role. Paths are relative to `apps/skills-checklist/admin/` unless stated. Tags: [REQ id] [OD-n] [CALL] [BUILD-PROMPT §n] [INFER]. Status words: PRESENT / PARTIAL / MISSING / OUT (intentionally out, with reason). Every PRESENT below was checked in the code at the cited line, not from docs.

## Summary

1. The student core is well built and genuinely connected: progress is derived live from the shared store, so a rule change (AE-02), an unpublish (IM-09), an approval (AR-06) or a return (RV-02) shows up on the student's home without any student-side copy of the data (`lib/v2/student.ts:65-149`, `:305-348`).
2. Pending vs counted never mix in the rule or the dots. One display inconsistency: the home waffle counts unsent requests as "waiting" and the per-skill dots do not (`lib/v2/student-viz.ts:40-41` vs `:63-65`).
3. Biggest REQ gaps: no program-defined submission details (SC-13, ST-10), no per-skill self-evaluation toggle (SC-15, ST-11), cannot name an unrecorded evaluator by email (ST-09), no different evaluator on correction or new attempt (RV-04), no course narrowing on the record (SH-06).
4. Biggest BUILD-PROMPT gaps: 4 of 10 student screens absent (stuoverview, sturadar, stutarget, and stuplace is only a course list); nudges N-03 absent, N-01 and N-04 implicit only; no "likely/starred" skills from a placement; evaluator "not adopted/unverified" and "expired link" do not exist anywhere in student flows.
5. Web-first vs mobile-first: v2 is phone-first (bottom nav, 28rem column, "on this phone" copy, role labelled "Student (mobile)"). REQ and CALL say nothing about device (zero hits for mobile/phone/offline/QR). The BUILD-PROMPT (Romit, 25 Oct) is explicit: web first. Web-first is right. v2's phone column is left-aligned at 48rem on a 1440 screen and leaves a third of the page empty (`docs/v2/screenshots/v2-student-desktop.png`).
6. Complaint check: too much text (yes, see cuts: same progress is shown 3 ways on home; the same lab note 3 times; Saved screen says "saved" 3 times). Too many nav items: student is 4 rows, which matches BUILD-PROMPT §3.3 (Home, Checklist, Requests, Placements) in count, but Log and Requests are one task split in two. Dots not connected: connected inside the app, but the student never sees an evaluator email, no-account evaluator, expiry, or adoption state.

## Source notes (what each source actually says about the student)

- REQ §6 (ST-01..14) opens "Students work from their own login." No device is named. REQ §14 puts remediation, notifications, reminders and expiry out of scope.
- CALL (both transcripts): "likely ones" for a course are soft mapping, shown bold or starred, but "they should still go to the main" list. Report as launch page at student level (OD-29). No mention of offline, QR, hand-over, photo of paper, CLR, or mobile.
- v2 itself records QR, offline sync, hand-over, photo of paper form, CLR 2.0 and remediation as v2-only [PROPOSED] scope changes approved by Romit (`docs/v2/decisions-and-open-questions.md` D2, D19). So they are legitimate for the prototype but are not requirements.
- BUILD-PROMPT §2.1: "Web first... Student and evaluator screens are web apps first. Do not start from a phone frame." StudentShell is 2 columns at 1440 (about 45% progress and next actions, 55% item list), bottom tab bar only at 375.

## 1. Feature checklist

### 1a. REQ student-owned IDs

| ID | Status | Evidence and note |
|---|---|---|
| ST-01 see skills expected, mandatory, progress | PRESENT | `components/v2/student/student-home.tsx:96-116` mandatory and optional blocks; progress per skill against its own rule `lib/v2/student.ts:65-149`; card `skill-card.tsx:54-115`. |
| ST-02 submit a skill not mapped | PRESENT | `log-flow.tsx:49-52` "Other skills" and "Not mapped to this course. Evidence still counts toward your record." Caveat `log-flow.tsx:51` hard-codes `k.specialty === "bsn-med-surg"`, so skills from other specialty libraries are never offered [INFER defect]. |
| ST-03 isolate already-submitted skills | PARTIAL | Record page lists only skills with attempts (`lib/v2/student.ts:739`) which is effectively the filter, but there is no search or "submitted only" control on the Log picker (`log-flow.tsx:287-324`). Fine at 31 skills, fails "library of any size". |
| ST-04 several skills together | PRESENT | Multi-select picker `log-flow.tsx:292-316`; one request carries many entries `lib/v2/student.ts:588-647`. |
| ST-05 clinical vs lab/sim recorded | PRESENT | Step 2 `log-flow.tsx:173-221`; stored on the entry `lib/v2/student.ts:538`. |
| ST-06 setting from placement, choose among several, location recorded | PRESENT | `lib/v2/student.ts:675-685`: placements for the course become options, location from the placement; single option is preselected. |
| ST-07 no placement, full program list | PRESENT | `lib/v2/student.ts:679` falls back to `s.program.clinicalSettings` and asks for location (`log-flow.tsx:111`). |
| ST-08 evaluator role limited by setting and skill, told why when none | PARTIAL | Reasons per person `lib/v2/student.ts:403-417`; "No evaluator can sign this off" banner `request-signoff.tsx:203-207`. But the only setting rule is "lab instructors never sign clinical" (`:408`); a lab or simulation entry never reaches the request screen at all (D14, `request-signoff.tsx:69`), so a lab-only skill (SC-16 case) can never be sent for sign-off by a lab instructor from the student side. |
| ST-09 pick evaluator; may name unrecorded one with email | PARTIAL | Pick from recorded people only (`lib/v2/student.ts:424-438`). Naming a person with an email is MISSING (grep for "email" in `components/v2/student` and `lib/v2/student.ts` returns nothing). `docs/v2/traceability.md:74` already admits it. [OD-05] related. |
| ST-10 program-required details captured and enforced | PARTIAL | Only setting and location are enforced (`lib/v2/student.ts:495-498`). No program-defined fields (date, unit, case reference) exist in `SkillConfig` (`lib/v2/types.ts:59-88`). See SC-13. |
| ST-11 self-evaluation against the evaluator's criteria, where configured | PARTIAL | Always asked when the model has levels, outcome or questions (`lib/v2/student.ts:446-453`, `log-flow.tsx:114-127`); no config flag, so "where configured" is not honoured. Scored model gets "not asked" (`log-flow.tsx:369`) even though REQ says the same criteria. `docs/v2/traceability.md:73` admits the SC-15 toggle is not built. |
| ST-12 at most one narrative note per submission | PARTIAL | One note per skill entry (`log-flow.tsx:371-376`), a stated [INFER] reading (D16). Per submission vs per skill is OD-07 territory. |
| ST-13 confirmation: what, to whom, role, setting, location | PRESENT | `request-signoff.tsx:117-125` text names skills, evaluator, role (only when one evaluator), setting and location. Shown as a dismissible banner, not a page. |
| ST-14 setting once vs per skill (OD-07) | OUT / seam | Built as once per log, stored on each entry (`log-flow.tsx:25`, D16). Not decided; keep as a seam. |
| SC-08 program's own level names | PRESENT | `lib/v2/student.ts:456-463` uses `config.levels`; no hard-coded scale. |
| SC-11 progress per named clinical setting | PRESENT | `lib/v2/student.ts:107-111`; shown `skill-card.tsx:35-41` as "{setting}: {have} of {min}". |
| SC-12 lab or sim never fills a setting | PRESENT | `lib/v2/student.ts:110` requires `setting === "clinical"` and a matching `clinicalSetting`; stated on card (`skill-card.tsx:40`) and in log step 2 (`log-flow.tsx:195`). |
| SC-13 program-defined submission details (label, type, mandatory) | MISSING | No field config in `lib/v2/types.ts:59-88`; the student form has no such inputs. [REQ SC-13, OD-04]. |
| SC-14 / SC-15 student side | PARTIAL | Student never sees whether feedback or approval applies to the skill before sending; only the wait text after (`lib/v2/student.ts:277-278`). |
| EV-01 request reaches evaluator without an account | PRESENT (as prototype) | QR, hand-over, link all open `/v2/preceptor/preceptor-evaluation?request=` (`lib/v2/student.ts:577`). No email is composed or shown on the student side. Real email only exists as a dev preview (`components/evaluator/email-preview.tsx`). |
| EV-02 several evaluator kinds by setting | PRESENT | `lib/v2/student.ts:398-409`. |
| EV-05 several skills sent together | PRESENT | One request holds all skills (`lib/v2/student.ts:600-636`). |
| EV-07 told whether it counts now or waits for approval | PARTIAL | After send the card says "Waiting for X" or "Waiting for the reviewer to approve" (`lib/v2/student.ts:270-288`), but the student is not told up front which applies. |
| AE-01 only completed evidence counts | PRESENT | `lib/v2/student.ts:71-76` counted only; awaiting excluded and shown in notes (`:129`). |
| AE-02 current rule re-applied to held evidence | PRESENT | Progress is computed on read from the skill's current config (`lib/v2/student.ts:65-112`); nothing stored. |
| AE-03 achieved only when every criterion met | PRESENT | `lib/v2/student.ts:112` count, distinct evaluators and every setting minimum. |
| AE-04 four states | PARTIAL | Student status is three: achieved, in progress, not started (`lib/v2/student.ts:221-222`, `:292-294`). "Evidence exists but none qualifies" is folded into In progress; the did-not-meet count is only visible on the card (`skill-card.tsx:43-48`). OD-03 is open, so keep it a seam but make it visible. |
| AE-05 one record per skill across courses | PRESENT | History keyed by skill only (`lib/v2/student.ts:734-775`). |
| AE-06 / AE-07 renames and removals | PARTIAL | Self-rating is stored as the label string (`lib/v2/student.ts:541`), so a later rename leaves a stale label on old entries [INFER]. |
| RV-01 correct and resend a returned submission | PRESENT | `components/v2/student/returned-panel.tsx:17-69`, `lib/v2/queue.ts:279-316`. |
| RV-02 same record, revision count, reason kept | PRESENT | `lib/v2/queue.ts:305-312` revision +1; reason shown `returned-panel.tsx:33-35`. |
| RV-03 further attempt after did-not-qualify, original intact | PARTIAL | History keeps the original and says "You can make a further attempt" (`lib/v2/student.ts:760`). There is no button on that attempt; the student must go back to Home or Log and start a new entry. The only action is the generic "Log X" on the card (`skill-card.tsx:107`). |
| RV-04 either path may go to a different evaluator | MISSING (student) | Resend always returns to the same evaluator (`lib/v2/queue.ts` resend uses `evaluatorOf(x)`, line ~308). Reassign exists for staff on stalled requests only (`lib/v2/queue.ts:406-410`). No "change evaluator" for the student. |
| RV-05 counted or awaiting-approval cannot be edited or resent | PARTIAL | Logic PRESENT `lib/v2/queue.ts:283`. UI defect: `RequestCard` treats everything except done and returned as open (`request-signoff.tsx:316`), so a request already completed and awaiting approval still shows "Show QR code" and "Copy link" (`:332-349`) [INFER, code-read, not run]. |
| RV-06 clear or keep previous answers | OUT | OD-08 open, evaluator side. |
| SH-01 every submission in order by attempt | PRESENT | `history-page.tsx:89-96`, attempt numbering `lib/v2/student.ts:742`. |
| SH-02 explicit outcome, who it is with | PRESENT | `lib/v2/student.ts:743-771` Counted, Did not meet, Not yet, Waiting with name, Returned. |
| SH-03 rule failed in student terms | PRESENT | `lib/v2/student.ts:757,760` `ruleSentence`; shown `history-page.tsx:103-107`. |
| SH-04 counted, outstanding, returned counts | PRESENT | `history-page.tsx:40-59`. Note it shows "Waiting 3" while Home says "2 waiting for review" (different counting, see Gaps). |
| SH-05 progress per named setting | PRESENT | `history-page.tsx:86` reuses `SkillProgressViz`. |
| SH-06 record covers every course, narrow to one | MISSING | No course control on the record (`history-page.tsx`). `docs/v2/traceability.md:26` says "not built". Data holds one course so it cannot be demonstrated. |
| SH-07 completed evaluation in full | PARTIAL | Dialog shows outcome, evaluator, setting, date, versions (`history-page.tsx:130-182`) and links to `/v2/student/evaluation/<id>`; the store holds no evaluator responses for seeded history (`docs/v2/traceability.md:75`). |
| AE-08, OD-03 | OUT / seam | Open decision. |
| Remediation visibility (v2 only) | PRESENT, out of REQ | `student-home.tsx:57-72` card plus `/v2/student/remediation/<id>` (`lib/v2/roles.ts:86`). [REQ §14] lists remediation as out of scope; v2 D2 records Romit's v2-only exception. |
| Verified record sharing (v2 only) | PRESENT, out of REQ | `record-page.tsx:66-155`, gating by verification status. [PROPOSED]. Not a REQ item. |

### 1b. BUILD-PROMPT student screens (§7)

| Screen | Status | Evidence and note |
|---|---|---|
| stuhub (progress, report, request in one place; default, empty, offline) | PARTIAL | `/v2/student` is one column: next action, waffle, skills (`student-home.tsx:40-137`). Empty and offline states exist (`student-home.tsx:97,108`; `student-frame.tsx:47-50`). Not two-column; no "report" (state strip, per-section) beyond the mandatory waffle. [CALL: report is the launch page, OD-29 open]. |
| stuoverview (mosaic and hierarchy of whole list) | MISSING | Only mandatory skills get a viz (`lib/v2/student-viz.ts:32-53`). With 31 skills and a hierarchy of category to skill, nothing shows the whole list. |
| sturadar (by section vs cohort median, groups of 5+) | MISSING | No section roll-up on the student side. Seed has `skill.category` (`skill-card.tsx:70`) so the data exists. |
| stuplace (from a placement: likely items starred and sorted first, placement-ending nudge) | PARTIAL | Home groups by course mapping, mandatory, optional, not expected (`student-home.tsx:96-136`), which is the REQ CM-03 grouping, not a placement-driven "likely" list. No star, no placement end date (`lib/v2/types.ts:244-250` has no dates). [CALL: bold or star the likely ones but keep the full list]. |
| stuitem (rule sentence, parts, ladder/pips, settings as context, attempts timeline) | PARTIAL | No item page. Pieces are split: card (`skill-card.tsx`), history attempt list (`history-page.tsx:89-117`), evaluation page. Rule sentence appears only when the rule has a window, distinct evaluators or settings (`skill-card.tsx:76`), so a plain "3 evaluations" rule shows no rule sentence. |
| stureq (items, where, who, details; no valid role state) | PARTIAL | Single page with items, method, who, photo (`request-signoff.tsx:162-251`). No "anyone by name and email" and no details step. No-valid-role PRESENT (`:203-207`). |
| stuconfirm (sent, what happens next) | PARTIAL | A dismissible banner (`request-signoff.tsx:150-155`); no "what happens next" beyond the QR dialog or wait text. |
| sturequests (grouped by evaluator: waiting, returned, done) | PARTIAL | "Your requests" newest first, ungrouped (`request-signoff.tsx:253-262`, `lib/v2/student.ts:650-652`). Status chips come from sync, not from request status (`:324`). |
| stufix (returned revision; did-not-qualify new attempt) | PARTIAL | Returned: PRESENT (`returned-panel.tsx`). Did not qualify: no dedicated screen or action (see RV-03, RV-04). |
| stutarget (program requirements: required and total, sections, hours separate) | MISSING | No program-requirement entity. [CALL 10-08 Aarti, OD-30, OD-29]. |

### 1c. Nudges

| Nudge | Status | Evidence |
|---|---|---|
| N-01 one away from done | PARTIAL | Not a nudge. `nextAction` sorts ready skills by fewest evaluations left (`lib/v2/student.ts:367`) and says "Left: ..." (`:370`), but never says "one away". |
| N-03 placement ending, likely items not started | MISSING | No placement dates (`lib/v2/types.ts:244-250`). |
| N-04 waiting 3+ days | PARTIAL | `requestWaitText` says "Waiting for X for N days" only for status `stalled` (`lib/v2/student.ts:279`), and `nextAction` puts waiting last among actions (`:378-382`), after "log". No 3-day rule computed from `daysWaiting`. |
| N-05 returned | PRESENT | Highest-priority next action (`lib/v2/student.ts:351-357`) plus home card. |
| Digest cap (one per person per day) | OUT | In-product only; REQ §14 puts notifications out; BUILD-PROMPT cap not needed without delivery. |

## 2. Scenario coverage

| Scenario | Status | Evidence |
|---|---|---|
| Offline | PRESENT (demo toggle) | `lib/v2/sync.ts:24-34,66-98` offline blocks flush, entries and requests are saved first; banner `student-frame.tsx:46-50`; toggle lives in the Demo menu (`components/v2/scenario-menu.tsx:98`). Not `navigator.onLine` (D19). QR and link need a connection; hand-over works offline (`request-signoff.tsx:248`). |
| Conflict | PRESENT, narrow | Conflict only on note or rating of a log entry (`lib/v2/sync.ts:145-174`); keep mine, theirs, both with consequences (`sync-page.tsx:181-185`), "both" blocked for a rating (`lib/v2/sync.ts:176-179`). Conflicting entry cannot be sent (`request-signoff.tsx:176-180`). Not covered: conflict after the evaluator already completed the request. |
| Returned | PRESENT | See RV-01, RV-02. |
| Did not qualify | PARTIAL | Shown with failed rule (`lib/v2/student.ts:760`), amber triangle on card (`skill-card.tsx:43-48`), remediation card when a plan opens (`student-home.tsx:57-72`). No "new attempt" button or next action; AE-04 state folded into In progress. |
| Rule needs N distinct evaluators | PRESENT in logic, weak in UI | `lib/v2/student.ts:106,118` "Evaluations from N more different evaluators (you have X)" appears as "Also needed" (`skill-card.tsx:75`). Dots count evaluations only, so a student with 3 of 3 from one evaluator sees full dots and "Also needed". |
| Level thresholds | PRESENT | `lib/v2/student.ts:74,103` below-minimum evaluations are met but left out with a reason; reason is shown only in the history (`:753`). |
| Pending vs counted never mixing | PRESENT with one inconsistency | Rule uses counted only (`lib/v2/student.ts:71`); dots and waffle use separate states. Waffle counts `max(awaiting, inRequest)` so an unsent on-device request fills a "waiting" square (`lib/v2/student-viz.ts:40-41`) while the card dots only count approval-held evaluations (`:63-65`). Same skill can show 0 waiting on the card and 1 on the home waffle [INFER, code-read]. |
| Unconfigured skill not submittable | PRESENT | `lib/v2/student.ts:483-485,503`; picker row disabled with reason (`log-flow.tsx:50`); "not open yet" banner (`student-home.tsx:86-94`). |
| Evaluator not adopted / unverified | MISSING | No adopted flag on `Person` in student flows (grep "adopt|unverified" in `lib/v2/types.ts`, `student.ts`, `preceptor.ts` returns nothing). [BUILD-PROMPT §4 Evaluator.adopted, J2, J7]. Not a REQ item; OD-05 relates. |
| Request to evaluator with no account | PARTIAL | No account needed (EV-01 PRESENT). The student cannot send to a person who is not already on record (ST-09 MISSING). |
| Expired link | MISSING | grep "expired" over student, preceptor and lib files returns nothing. [BUILD-PROMPT §7 evpage states]. REQ silent; REQ §14 puts expiry out of scope, so treat as [INFER] optional. |
| Hand phone to evaluator | PRESENT | `request-signoff.tsx:396-451`. |
| Photo of paper form | PRESENT | `request-signoff.tsx:211-237`, type and size checks `:92-106`, `lib/v2/student.ts:616-620`. |
| Multiple items per request | PRESENT | `lib/v2/student.ts:600`. |
| Placement-based likely skills | MISSING | See stuplace. |

## 3. Gaps ranked

P0 (breaks a REQ or hard stop, or the web-first direction)
1. Device framing contradicts the latest direction: phone-first shell and copy vs web-first [BUILD-PROMPT §2.1]. `student-frame.tsx:114` (max-w-md below md, 48rem reading column above), `use-student.tsx:9` ("Phone first, so it applies at every width"), `lib/v2/roles.ts:17` label "Student (mobile)", copy "Saved on this phone" in about 12 strings. REQ and CALL are device-silent.
2. SC-13 and ST-10: no program-defined submission details. A student can send a clinical entry with only setting and location. [REQ SC-13, OD-04].
3. ST-09: cannot name an evaluator who is not on record with an email. This is the main "no account" path for a new preceptor. [REQ ST-09, EV-01, OD-05].
4. RV-04: neither a returned correction nor a new attempt can go to a different evaluator from the student side (`lib/v2/queue.ts` resend keeps `evaluatorOf(x)`).

P1 (REQ partial, visible to the student)
5. SC-15 and ST-11: self-evaluation is always on (`lib/v2/student.ts:446-453`) with no per-skill switch, and the scored model gets none.
6. SH-06: no course narrowing on the record; AE-04 "evidence but none qualifies" not separated on the student status (`lib/v2/student.ts:292-294`).
7. RV-03: did-not-qualify has no "Make a further attempt" action, no choice of evaluator, and is not a next action.
8. RV-05 UI: QR, link and hand-over buttons remain on a request that is already completed and awaiting approval (`request-signoff.tsx:316,332-349`).
9. stuplace and CALL "likely" behaviour: no star or sort for likely skills; no placement dates, so no N-03. Home is the CM-03 grouping only.
10. Missing student screens: stuoverview, sturadar, stutarget [BUILD-PROMPT §7; CALL OD-29, OD-30].

P2
11. Pending counts disagree: card dots vs home waffle vs Record "Waiting 3" (`lib/v2/student-viz.ts:40-41,63-65`; `history-page.tsx:44-49`).
12. N-01 and N-04 are implicit; no 3-day rule from `daysWaiting`.
13. sturequests is not grouped by evaluator and status; status chip is sync state, not request state (`request-signoff.tsx:324`).
14. Hard-coded specialty in the picker (`log-flow.tsx:51`) and a single `STUDENT_ID` (`lib/v2/student.ts:11`): no student picker or cross-specialty; BUILD-PROMPT §8 wants the student in context.
15. Distinct-evaluator progress has no visual (dots count evaluations only).
16. Rule sentence hidden for simple count rules (`skill-card.tsx:76`).

P3
17. Demo affordance in product UI: "Open what the evaluator sees" in the QR dialog (`request-signoff.tsx:382-385`); "Sync details" strip on every page.
18. Self-rating stored as a label string (AE-06 risk).
19. Evaluator unverified and expired-link states not designed on either side.

## 4. Simplicity: text and clutter cuts

Quote, location, proposed cut. Student pages are the heaviest in the app on repeated reassurance copy.

Home (`components/v2/student/student-home.tsx`)
- Title `What's left in ${s.course.code}` plus subtitle `contextLine(s)` = "NURS 350, Fall 2026" (`:41`). The code is said twice. Cut the title to "Home" or "What's left" and keep the subtitle.
- Next-action card: "Do this next" label + title + reason + full-width button, where title and button usually say the same thing ("Log Indwelling urinary catheter insertion" / "Log Indwelling..." `lib/v2/student.ts:370`). Keep title and reason, make the button "Log it" or drop the title.
- Waffle card: title "Mandatory skills", description "What is counted, waiting and left." (`:75`), legend, and a sentence "6 of 12 evaluations collected, on pace. 2 waiting for review. 1 of 4 skills achieved." (`:81`). Then below, four cards each with dots and "2 of 3 successful evaluations". The same progress appears three times. Keep the per-skill dots and one line; drop the waffle or the dots, and drop the description.
- "1 skill is not open yet" banner (`:86-94`) repeats a row the mapping list could hold. Fold into the Mandatory list as a disabled row with a "Not open" pill.
- Three section headings "Mandatory (4)", "Optional (n)", "Not expected for NURS 350 (n)" with empty-state sentences (`:97,108`). Keep Mandatory; put Optional and Not expected in one collapsed "Other skills".

Skill card (`skill-card.tsx`)
- Every card has a full-width primary "Log {skill name}" button (`:106-108`). Four identical primary CTAs plus the next-action CTA. Make the whole card tappable and keep one primary on the page.
- Stack of small text: category line (`:70`), summary (`:74`), "Also needed: ..." (`:75`), rule sentence (`:76`), notes (`:77-81`), "Lab and simulation do not count here." (`:40`), plus the prerequisite box (`:88-104`). Show dots, one status line and, only when blocked, the single reason. Move rule and notes behind the card.
- "Clinical attempt locked" or "Before a clinical attempt: all done" box (`:90`) repeats prerequisites that the next-action and the picker also state.

Log flow (`log-flow.tsx`)
- "Step 1 of 4" paragraph followed by an h2 of the step name (`:159-162`); four steps for what is two decisions on web. Merge to pick plus where, then rate plus review.
- "Lab and simulation never count toward a clinical setting minimum." (`:195`) is said again on the card (`skill-card.tsx:40`) and in each lab option description (`lib/v2/student.ts:682-683`). Say it once.
- Per-skill note help text: "{n} of 500 characters. One note per skill, kept apart from the evaluator's comment." (`:374`). Keep only the counter near the limit.
- Review step: "Saves on this phone, sends when you are online." (`:264`), then the Saved screen shows a banner "Saved on this phone", a status line and an h2 "{n} entries saved" (`:389-393`). One confirmation is enough. Three stacked buttons on Saved (`:414-426`): keep "Ask for sign-off" and a text link.

Requests (`request-signoff.tsx`)
- Page holds ready-to-send list, 4 method tiles, who, photo, create button and the full request history together (`:162-262`). Split by task: send (3 steps) and "My requests".
- Every qualified evaluator row repeats "Qualified for the skills you picked" (`:289`). Say nothing for eligible rows; show reasons only for disabled ones.
- Block descriptions "Lab and simulation practice trials are not sent." (`:162`), "Only qualified evaluators are listed. No account needed." (`:201`). Drop one.
- QR dialog: description, readonly link field, Copy link, "Open what the evaluator sees", Done (`:366-389`). Keep code, one "Copy link", Done; remove the demo link from the product.
- Hand-over sheet narrates three screens with sentences each (`:407-446`). Keep names and two buttons.
- Four sign-off methods are all equal tiles. Make link the default and show QR, hand over, photo as "More ways". [INFER]

Record (`history-page.tsx`, `record-page.tsx`)
- "Pace this term" chart (`history-page.tsx:35-39`) says again what the home waffle says ("on pace"). Keep one place.
- Five counters (Counted, Waiting, Did not meet, Not yet, Returned or reopened `:44-48`). Show three: Counted, Waiting, Needs action.
- Per-skill card repeats the same progress viz and summary as home (`:85-86`). Show only attempts.
- Detail dialog sentence "A completed evaluation is never edited. A correction adds a version and keeps the earlier ones." (`:163`) plus a version list plus a link to the full page. Link only.
- Share page: subtitle "Only verified evidence can be shared." (`record-page.tsx:68`), a status card repeating the same state (`:78-83`), "Sharing is off" banner, block descriptions (`:96,138`), explanatory paragraph under each download (`:142,148`). Keep status, included, two buttons.

Sync (`sync-page.tsx`, `student-frame.tsx`)
- Sync strip card on every student page (`student-frame.tsx:19-37`), including when everything is saved ("Everything is saved and sent" `lib/v2/sync.ts:226`). Show only when offline, failed, queued or conflict; otherwise nothing.
- Phone status card Connection / Account / App (`sync-page.tsx:83-100`) and a four-chip counts card (`:102-117`) duplicate the strip and the list. "App: Up to date" is demo noise. Cut both; keep the grouped list and "Send all".

Navigation
- Student rows: Home, Log skills, Requests, Record (`lib/v2/roles.ts:72-77`), plus Demo and role switch in the bar. Count matches BUILD-PROMPT §3.3 (4). Log and Requests are one job (log then ask), so a student switches tabs mid-task. Proposed: Home, Checklist (list plus log), Requests, Record; or fold Log into Home and have 3. The bottom bar label "Log" and the left label "Log skills" differ (`student-frame.tsx:73` vs `roles.ts:74`).
- Sync, Verified record, Remediation, Evaluation are secondary routes (`lib/v2/roles.ts:86`) and only reachable through links: fine, keep out of the nav.

## 5. Mobile-first vs web-first (explicit)

- Conflict: v2 treats the student as a phone app; BUILD-PROMPT §2.1 and §3.3 say web first (1440 primary, 1280 minimum, tablet 1024, mobile 375 as an adaptation, "do not start from a phone frame"), with a two-column StudentShell at 1440.
- What REQ and CALL say: nothing about device. REQ §6 says "from their own login". Zero hits for mobile, phone, offline or QR in the REQ and in both transcripts (only a transcription slip "entire phone" for "form"). Offline, QR, hand-over, photo and CLR are v2 [PROPOSED] (`docs/v2/decisions-and-open-questions.md` D2, D19).
- Verdict: web-first is right. It follows Romit's latest written instruction and is not contradicted by REQ or CALL. Keep the clinical-floor tasks (log, QR, photo, offline) as responsive behaviours, and do not let them define the shell.
- What to change: two-column at 1440 (progress and next action left, list right); drop `max-w-md` as the base; reword "on this phone" to "on this device"; rename the role "Student"; keep 44 px targets only below the breakpoint.

## 6. Visual review (screenshots only, no browser)

Looked at `docs/v2/screenshots/`: `v2-student-desktop.png`, `v2-student-phone.png`, `v2-student-request-signoff-desktop.png`, `v2-student-history-desktop.png`, `v2-student-pick-and-rate--step3-rating-phone.png`.
- Desktop home: single 48rem column pinned left; roughly a third of the 1440 width is empty (`v2-student-desktop.png`). Reads as a phone layout on a laptop.
- Sync strip is the first element on every page, above the title, even though the conflict is also the "Do this next" card on Home: the same conflict appears twice in the first screenful.
- Home first screen: sync strip, title, next-action card, waffle card, banner; the first skill card is below the fold on desktop (900 px) and the phone view.
- Waffle uses blue squares, hatched for waiting; skill cards use green check dots. Two different encodings and colours for the same "counted" meaning on one page.
- Requests page desktop: sparse and clear; the only card is the request with a long button label "Show QR code for Indwelling urinary catheter insertion and 1 more".
- Record desktop: pace chart takes the first screen; the actual attempts are below.
- Screenshots predate current uncommitted edits (the phone step-3 image shows subtitles "Saved on this phone as you go..." and "Rate yourself on each skill. The evaluator sees this as context..." that no longer exist in `log-flow.tsx:157-159,225`), so some visuals are stale.

## 7. Unverified

- No browser opened. Nothing was run: no tsc, no vitest, no Playwright, no axe. All "PRESENT" claims are from reading code.
- Screenshots may be older than the working tree (git status shows many modified student files).
- Not read in full: `lib/v2/qr.ts`, `lib/v2/pdf.ts`, `lib/v2/record.ts` internals (only their use from the student pages), `components/v2/outcomes/*`, `components/v2/preceptor/*` (the receiving side). So whether the evaluator page shows the student's self-rating and details (EV-04) and an expired state was checked only by grep.
- The RV-04, RV-05 UI and waffle-vs-dots inconsistency claims are from reading code, not reproduced.
- Dark mode, forced colors, screen reader, real device and DS visual-diff were not checked (and the repo's own docs say they were not either).
- "Waiting 3" vs "2 waiting" on Home and Record was read from screenshots and code, not re-run against the seed.
