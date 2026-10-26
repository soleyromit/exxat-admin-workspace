# T3 audit: preceptor / lab instructor, reviewer, program director, outcomes (v2)

Read-only audit, 2026-10-26. Branch `feat/skills-checklist-v2`. Paths are under `apps/skills-checklist/admin/` unless stated. Precedence REQ > CALL > PROTO > INFER; build-prompt = `[BUILD-PROMPT §n]` (Romit's outcome doc). No OD treated as decided.

## Summary

1. The evaluator and reviewer happy paths are well built: one-pass multi-skill form, mandatory feedback, held-vs-counts message, side-by-side self vs evaluator, bulk approve with named blockers, return with reason, append-only versions, numbered director verifications.
2. The "dots" between roles are the weak part. There is no evaluator identity lifecycle at all (no unverified name, no adopt, no merge): `[REQ SL-09]`, `[REQ ST-09]`, `[BUILD-PROMPT §7 admevals, J7]` are MISSING. Everything downstream (reviewer "why is this here", director gate, consistency view) lacks its input.
3. A reviewer cannot see WHY a record is held (skill configured for approval, unverified evaluator, paper form). Status says "Ready to approve", which is readiness, not cause (`components/v2/review/review-queue-page.tsx:192-199`).
4. Nothing is time-driven: "stalled" is a seeded status, never computed (grep: no transition into `"stalled"` outside `seed.ts`). Nudges N-04 / N-09 / N-11 and the evaluator-consistency view are absent.
5. RV-04 is half done: a returned request is re-sent to the SAME evaluator (`lib/v2/queue.ts:296`, `assignedToId: evaluatorOf(x)`); only stalled requests can be reassigned (`queue.ts:414`).
6. Hard-stop tension: staff "Reopen to edit" works on `counted` and `awaiting-approval` evaluations (`lib/v2/outcomes.ts:152`), against `[REQ RV-03]`, `[REQ RV-05]` and the hard stop "completed evaluations immutable". v2 frames it as append-only versions `[PROPOSED D20]`, but the label says "edit" and a reviewer can flip an evaluator's Not met to Met.
7. Out-of-REQ scope is large in these roles (remediation `[REQ §14]`, confidential concern, director verification, reopen, paper-form entry). All are `[PROPOSED]` in `docs/v2/decisions-and-open-questions.md` D2/D20/D23/D29, so they are intentional, but they drive Romit's "too much" complaint.
8. Nav can shrink: Reviewer and Director do not need separate IA from Admin; they need a permission difference (see Simplicity).
9. Not verified: any runtime behaviour (no browser opened); only 4 of the relevant screenshots were opened.

## Feature checklist

Status: PRESENT / PARTIAL / MISSING / OUT (intentionally out). Evidence is file:line from code I read.

### Evaluator (EV) and evaluation page

| ID | Feature | Status | Evidence / note |
|---|---|---|---|
| EV-01 | Complete without login, link opens directly | PRESENT | `lib/v2/preceptor.ts:49-75` `requestAccess` keyed by request id; `components/v2/preceptor/evaluation-form.tsx:33-56`. Demo "open as" via `?as=`. Real email/QR delivery is simulated `[INFER]` |
| EV-02 | Preceptor, faculty, lab instructor; roles valid by where performed | PARTIAL | Clinical: `lib/v2/student.ts:403-417` (lab instructor refused for clinical, role per skill `evaluatorRoles`). Lab: separate batch page, not the request link (`lib/v2/lab.ts:26-35`). A student cannot request a lab sign-off, so the lab path is instructor-initiated only |
| EV-03 | Evaluator sees program form, cannot alter it | PRESENT | `evaluation-form.tsx:254-355` renders `skill.config` questions/levels read-only; labels from `outcomeChoices` `preceptor.ts:113-120` |
| EV-04 | Sees student details and self-evaluation | PARTIAL | Behind a collapsed full-width button (`evaluation-form.tsx:275-298`). Self-rating shows only "N of M answered yes" or a level word (`:290`), not the per-question answers the reviewer later compares |
| EV-05 | Several skills in one sitting, own outcome + feedback each | PRESENT | `evaluation-form.tsx:201-204`; `preceptor.ts:214-288` one evaluation per skill, one pass |
| EV-06 | Mandatory feedback blocks submit | PRESENT | `preceptor.ts:176-179`; error summary with jump links `evaluation-form.tsx:181-198` |
| EV-07 | Counts now or held; evaluator told which | PRESENT | `preceptor.ts:240,256`; line `evaluation-form.tsx:240-242`; per-skill receipt `:397` |
| EV-08 | Fixed vs program-defined roles (OD-06) | PARTIAL (seam) | Roles are a TS enum `types.ts:21` (`kind`), not data rows. OD-06 recommends roles as data `[INFER]`; not a violation, an open seam |
| (SL-09 / ST-09) | Student names unrecorded lab instructor + email; program sees and adopts name | MISSING | `lib/v2/student.ts:613` returns "That person is not an evaluator on record. Choose someone from the list." `docs/v2/traceability.md:74` already states "naming an unrecorded lab instructor is not built". No `adopted`/`verified` field on `Person` (`lib/v2/types.ts:16-27`) |
| (not in REQ) | Level-of-supervision AND outcome both asked | PRESENT `[INFER]` | `evaluation-form.tsx:330-344` two decisions on one card |
| (not in REQ) | "Not yet, feedback only" third outcome | PRESENT `[PROPOSED]` | `preceptor.ts:117` |
| (not in REQ) | Credential attestation per pass | PRESENT `[PROPOSED]` | `preceptor.ts:126-142`, `evaluation-form.tsx:231-238` |
| (not in REQ) | Confidential concern flag | PRESENT `[PROPOSED D23]` | `evaluation-form.tsx:213-228`; `preceptor.ts:272-277` |

### Build-prompt screens (evaluator side)

| Screen | Status | Evidence / note |
|---|---|---|
| evinvite (one email listing all open requests across students) | MISSING in v2 | Only `components/evaluator/email-preview.tsx` (v1 store `lib/store`, route `app/(shell)/(admin)/dev/email/page.tsx`, "S-18 template"). No `/v2` email surface; one request = one link (`preceptor.ts:42,291`) |
| evpage default | PARTIAL | See EV rows. No attempt number shown on the form when it is a further attempt (no `attempt` reference in `evaluation-form.tsx`) |
| evpage corrected request (revision +1) | PARTIAL | Revision exists on request (`queue.ts:279-304` `revisions`) and reviewer sees it (`review-item-page.tsx:157-162`). The evaluator form shows no "revision 2", no prior answers, no return reason: `blankPass` is blank (`preceptor.ts:102-105`). OD-08 open, so fresh form is a valid seam, but the evaluator is not told why they are back |
| evpage forwarded | MISSING (OUT per OD-18 open) | Another person opening gets "not-on-request" and is blocked (`preceptor.ts:70-73`). No forward/adopt path; OD-18 `[OD-18]` must stay open |
| evpage expired | MISSING | `AccessKind` has no expiry (`preceptor.ts:24`). Closest is `missing`/`completed`. `[OD-18]` |
| evpage submitted | PRESENT | `Receipt` `evaluation-form.tsx:372-414`; "It cannot be changed from this page." `:380` |
| Multi-student evaluator (student switcher chips) | PARTIAL | List of cards across students `evaluation-form.tsx:68-103` (`waitingFor` `preceptor.ts:291`); no switcher inside the form, each student is a separate full form. Acceptable, simpler than chips |
| facqueue (faculty queue, lab batches, oldest requests) | MISSING | `lab-grid-page.tsx` is instructor-initiated recording. There is no queue of student lab requests, no oldest-first; a lab instructor's "Requests" nav row (`lib/v2/roles.ts:75`) leads to a form they are refused (`student.ts:408`) |
| Lab batch grid (J9) | PRESENT `[PROPOSED OD-19]` | `components/v2/preceptor/lab-grid-page.tsx:94-366`; `lib/v2/lab.ts:108-185`; lab never satisfies setting minimum (`lab.ts:4-9`, no `clinicalSetting` on lab evals `:145-157`); simulation limited per skill `lab.ts:62`; absent students get no result `:136` |

### Reviewer / approver (AR) and return/revision (RV)

| ID | Feature | Status | Evidence / note |
|---|---|---|---|
| AR-01 | See every held evaluation with student, skill, course, setting, location, evaluator, role | PRESENT | Columns `review-queue-page.tsx:181-209`; role appended in evaluator cell `:187-190`. Course column is a constant (`:207`) |
| (why held) | Reason a record is in the queue | MISSING `[BUILD-PROMPT §7 aprqueue]` | Status column shows ready/needs-outcome/blocked only (`:192-199`). Hold cause (skill `approvalRequired`, `preceptor.ts:240`) is never stated. Unverified-evaluator cause does not exist |
| AR-02 | Self vs evaluator side by side, agreed or not | PRESENT | `queue.ts:463-515`; `review-item-page.tsx:258-324`; column + filter `review-queue-page.tsx:200-204,105` |
| AR-03 | Full set of responses | PRESENT | `review-item-page.tsx:301-321` (rows + extra responses + feedback) |
| AR-04 | Reviewer note retained | PARTIAL | Optional note on approve only (`review-item-page.tsx:200-205`, `queue.ts:202`). A return carries the reason as its note. Note is not shown in a later queue view; visible on evaluation facts to staff (`evaluation-page.tsx:67-72`) |
| AR-05 | Approve counts; return goes back, does not count | PRESENT | `queue.ts:202-238, 248-268`; return requires reason `:240-246` |
| AR-06 | Held evidence excluded from achievement | PRESENT | `lib/v2/student.ts:34,62` (selector comment + logic), verification counts only `counted` `verification.ts:56` |
| RV-01 | Student corrects and resends returned OR not-yet-assessed submission | PARTIAL | Returned: `queue.ts:279-304`. Not-yet-assessed: `if (x.status !== "returned") return error` `:283` so a pending request cannot be corrected |
| RV-02 | Correction continues the same record, revision count, return reason retained | PRESENT | `queue.ts:248-268,293-299`; shown `review-item-page.tsx:157-175`, `review-queue-page.tsx:255` |
| RV-03 | Completed evaluation cannot be edited; failure -> further attempt, original intact | PARTIAL | Receipt says unchangeable (`evaluation-form.tsx:380`), request locks `preceptor.ts:57-60`. But staff "Reopen to edit" exists (`evaluation-page.tsx:158`). Attempt 2 is a separate record (student history, other auditor) |
| RV-04 | Either path may go to a different evaluator | PARTIAL | Stalled only: `queue.ts:410-436`, UI `review-queue-page.tsx:231-234,354-418` (qualified only, audit entry). Return/resend keeps same evaluator `queue.ts:296`. Did-not-qualify new attempt choice is student-side (not read by me) |
| RV-05 | Counted or awaiting-approval cannot be edited or resent | PARTIAL / contradicted | Resend blocked for non-returned `queue.ts:283`; but `REOPENABLE = ["counted","awaiting-approval","reopened"]` `outcomes.ts:152` |
| RV-06 | Correction clears or retains previous answers (OD-08) | PARTIAL (seam) | Previous returned evaluation stays as history; new form blank. Seam kept, OD untouched `[OD-08]` |
| Paper form (not in REQ) | Photo + reviewer enters outcome | PRESENT `[PROPOSED]` | `review-item-page.tsx:392-486`, `queue.ts:336-404` |
| Bulk approve | Names blocked items before confirm | PRESENT | `review-queue-page.tsx:313-352` |
| Evaluator adoption (J7) | Adopt / merge unverified names | MISSING | see SL-09 above; `admevals` has no v2 equivalent |
| admconsistency | Return / not-qualifying rate by evaluator vs average | MISSING | no code (`grep consisten` in `components/v2`, `lib/v2`: only unrelated hits). `[OD-11]` open and build-prompt marks it Recommendation, so OUT is defensible |
| N-04 waiting 3+ days / N-11 8+ days (cctracker) | PARTIAL | Only as an age bar in the queue: buckets 0-2 / 3-6 / 7+ (`queue-viz.ts:22-24`, `review-queue-page.tsx:48-57`). Build-prompt thresholds are 3 and 8 (`§10`); v2 uses 7. No evaluator-waiting tracker, no nudge |
| N-09 approvals over 3 days | PARTIAL | Same age bar; "Oldest waiting" KPI `review-queue-page.tsx:112`. No nudge/digest |
| Stalled (request with no response) | PARTIAL | Tab + reassign exist; status never computed from age (seed only: `grep '"stalled"'` outside `seed.ts` finds readers only) |

### Director verification, outcomes, remediation, versions, audit

| ID | Feature | Status | Evidence / note |
|---|---|---|---|
| Director verify / sign-off | Numbered, append-only, evidence + versions snapshot | PRESENT `[PROPOSED D29]` | `lib/v2/verification.ts:119-146`; UI `director/verification-pages.tsx:89-292` |
| What verification gates | Blocks on held evaluations, reopened, open requests, returned-unfixed, zero counted, nothing new | PRESENT | `verification.ts:58-80,98-104`. Gaps (mandatory skills not achieved) do NOT block; only listed + a checkbox (`:111`, `verification-pages.tsx:237-246`) |
| Changed since verified | Reopen flags record, new version | PRESENT | `verification.ts:88-96`; banner `verification-pages.tsx:164-173`; warn on reopen `evaluation-page.tsx:171-175` |
| Unverified evaluator in evidence | Gate or flag | MISSING | no evaluator verification concept |
| Outcomes pass/fail/not yet | Per skill dots, list with filter | PRESENT | `outcomes-page.tsx:59-106` |
| Remediation plan | Steps, attempts, close with reason | PRESENT `[PROPOSED]`, REQ §14 out of scope | `remediation-page.tsx:144-211`; D2 states the scope change |
| Attempt limit / min days enforced | Block a premature new attempt | PARTIAL | `attemptInfo` `outcomes.ts:134-147` is read only by the plan page (`remediation-page.tsx:29`); no reference in `lib/v2/student.ts` submit path |
| Confidential concern | Staff only, never in exports | PRESENT `[PROPOSED D23]` | `outcomes.ts:13,29`; `outcomes-page.tsx:133-161`. Display only: no status, owner or resolve action |
| Version history | Who, when, why, what recorded, read-only | PRESENT | `outcomes/version-timeline.tsx:69-103`; reopen `outcomes.ts:166-190`, confirm `:193` |
| Immutable completed evaluation | PARTIAL | see RV-03/05 |
| Audit log | Written | PRESENT (write) / MISSING (read) | `lib/v2/store.ts:115-116`; no screen lists `s.audit`; only a count (`selectors.ts:38`). Review dialog promises "Kept in the audit log" (`review-queue-page.tsx:403`) with nowhere to read it |
| advtimeline (advisor) | MISSING / OUT | No advisor role in v2 (`lib/v2/roles.ts:12-18`); build-prompt marks it Recommendation `[BUILD-PROMPT §11]` |

## Scenario coverage

| Scenario | Result |
|---|---|
| New evaluator name -> Awaiting approval | NOT MODELLED. Student cannot name an unrecorded evaluator (`student.ts:613`). "Awaiting approval" in v2 means the SKILL requires approval (`preceptor.ts:240`), not that the evaluator is unverified. `[BUILD-PROMPT J2]` says "Awaiting approval for new names" |
| Corrected request revision +1 | Works from reviewer side (`queue.ts:293-299`). Evaluator is not shown revision, prior answers or the return reason on their page |
| Did not qualify -> new attempt | Evaluation `not-met` records and opens a plan (`preceptor.ts` header, `remediation-page.tsx:134` "Log a new attempt"). Original intact. Attempt limit and wait days are displayed but not enforced (see above). Preceptor form does not say "attempt 2" |
| Expired / forwarded link | Not modelled. Forwarded recipient is blocked with "sent this request to X, not to Y" (`preceptor.ts:70-73`). Expiry absent. `[OD-18]` |
| Lab instructor | Instructor-initiated batch grid only. No student request to a lab instructor, no faculty queue. Absent student handled, never assessed (`lab.ts:136,172`) |
| Multi-student evaluator | One list of cards, oldest first (`evaluation-form.tsx:69`, `queue-viz` `oldestFirst`); one form per student |
| Immutable completed evaluation | Evaluator page: yes (`preceptor.ts:57-60`). Staff: reopen adds version, evaluation stops counting until confirm (`outcomes.ts:166-190`). Conflicts with RV-05 wording |
| What a reviewer must see to decide | Present: who, what skill, setting, location, source, self vs evaluator per question, full responses, feedback, earlier attempts, prior returns, student note. Missing: why it was held, whether the evaluator is verified, what approving does to the student's rule status ("this makes 2 of 3") |
| What director verification gates | Open items listed above; not skill gaps; not evaluator status. Verifier name and version shown in student record (per README) |

## Gaps (ranked)

P0 (breaks a REQ or hard stop)
1. Evaluator adoption absent: `[REQ SL-08, SL-09, ST-09]`, J7, admevals. Add student path "name a lab instructor + email", `Person.verified:false`, queue "why" chip, an adopt/merge screen. Without it the approval loop has no real driver.
2. Reopen of counted / awaiting evaluations contradicts `[REQ RV-05]` wording and the hard stop in product CLAUDE.md (D2 says kept, D20 says ask Sankalp). At minimum rename "Reopen to edit" to a request-for-correction that goes back to the evaluator, rather than staff overwriting an outcome.

P1
3. Reviewer cannot see why a record is held (`review-queue-page.tsx:192-199`).
4. RV-04: return/resend cannot change evaluator (`queue.ts:296`); only stalled can be reassigned.
5. RV-01: a not-yet-assessed request cannot be corrected (`queue.ts:283`).
6. No time-driven states: "stalled" never computed; N-04/N-09/N-11 absent; queue bucket 7 days vs build-prompt 3/8.
7. Evaluator page lacks revision/attempt/return-reason context after a return or a failed attempt.

P2
8. Student -> lab-instructor request and faculty queue missing (facqueue, J9 second half). Lab "Requests" nav row is a dead end for R. Whitmore.
9. Attempt limit and wait days not enforced outside the plan page.
10. Audit log has no reader; two UI promises point at it.
11. Director "Open the review queue" hard-links `/v2/reviewer/review-queue` (`verification-pages.tsx:226`), which switches role context; `remediation-page.tsx:108` and `evaluation-page.tsx:201` do the same pattern.
12. Verification allows sign-off with mandatory gaps (checkbox only, `verification.ts:111`); semantics of "verify" undefined `[INFER]`, ask Sankalp.
13. Concern has no owner/status/resolve; display only.

P3
14. Expired and forwarded link states (OD-18 open; design as seam only).
15. admconsistency, advtimeline (Recommendation tier, OD-11 open).
16. Evaluator form shows self-rating only as a count (EV-04) and hides it behind an expander.
17. Outcome label inconsistent: "Not met" on the form (`preceptor.ts:114`), "Did not meet the criteria" everywhere else (`outcomes.ts:10`). For a binary skill the program label wins (SC-03), so this may be intended, but non-binary skills show both strings.

## Simplicity: text / clutter cuts

Quote (file:line) -> proposed cut.

Review queue (`review-queue-page.tsx`)
- Four KPI cards (`:110-115`) repeat the three tab counts (`:153-155`: "Awaiting (9)" "Stalled (1)" "Returned (0)"). Cut cards, keep the tabs and a single line "Oldest: 12 days, Amara Nwosu".
- 11 columns (`:180-210`). Course ("NURS 350", constant, already in the page subtitle `:128`), Since (duplicate of Age), Source, Setting, Location -> move to the item page. Keep Student, Skills, Evaluator, Age, Why held, Self-rating. At 1440 px the Self-rating cell is already clipped ("Not comparabl", screenshot `v2-admin-review-queue-desktop.png`).
- Filter bar with three filters over nine rows (`:163-165`, "No items match these filters."). Cut for the prototype; keep only a Self-rating "Differed" shortcut.
- Sheet "How this is counted" (`:263-270`): "Approved evaluations count toward the student's record at once. Returned items do not count..." Cut; the same facts are in the confirm dialog and banner.
- Bulk banner string `:287` and dialog `:328` say the same thing twice. Keep the dialog.

Review item (`review-item-page.tsx`)
- Facts card (`:133-165`) + Student card + Evaluator card (`:272-324`) render the same question rows twice (`c.rows` at `:280` and `:302`). Replace with one table: Question | Student | Evaluator | Match.
- "Back to the review queue" button (`:214-216`) duplicates the sidebar and the Decided screen button (`:79-81`). Cut.
- "Earlier attempts at X (0)" collapsible per skill (`:325-347`) shows "This is the first attempt the student has made at this skill." Cut when zero.
- Badge text "Self-rating and evaluator agreed" (`:33`) plus "Outcome: ..." plus per-row "Agreed" (`:307`): three signals for one fact. Keep the row-level one.

Evaluator form (`evaluation-form.tsx`)
- Every card repeats the skill name 4 times: card title `:270`, expander "What Maya supplied for Indwelling urinary catheter insertion" `:278`, legend "Outcome for ..." `:339`, "Feedback for ... (optional)" `:347`. Cut to "Student's entry", "Outcome", "Feedback".
- `:341` "Feedback only. No pass or fail is recorded." and `:349` "0 of 2000 characters. The student reads this." Cut the counter until 90 percent full.
- Subtitle `:272` (`evaluatorLine`: "The level of supervision you observed.") repeats the legend `:332`. Cut.
- Page subtitle "Opened as J. Delgado, RN" (`:50`) is demo scaffolding; fine for review, hide in the real flow.
- Third outcome "Not yet, feedback only" plus a level question plus attestation plus concern flag: four decisions beyond REQ on a phone form. Keep outcome + feedback; move attestation to a one-time per-evaluator confirmation and concern to a link `[INFER]`.

Lab grid (`lab-grid-page.tsx`)
- Three mechanisms show the same count: hatched square wall (`:71-75`), counts row (`:76-82`), and a cell key (`:251-256`). Keep the counts row only.
- Four sections (Session, skills, Results, Saved sessions) and the sentence "Never counts toward a clinical setting." twice (`:231`, repeated in the model). Keep once as helper text.
- "Open the cohort reports" (`:344-346`) is unrelated to recording. Cut.
- "Set column to Met / Clear column" links per column (`:268-269`): keep "Set column to Met" only.

Director (`verification-pages.tsx`)
- Four KPI cards (`:47-52`) over 12 students; "Students in the cohort" is a constant. Cut to one sentence "3 verified, 1 changed".
- "Needs action" filter (`:62`) for 12 rows. Cut.
- Status card (`:150-162`) says the same as History (`:272-282`) and the list pill. Cut the card, keep the pill in the header.
- Gaps banner ends "The verification lists these gaps." (`:244`), then the checkbox repeats it (`:257`). Cut the sentence.
- Mandatory skills as cards with "Read in full" links per evaluation (`:185-210`) is the right content; one line each is enough.

Outcomes / remediation / versions
- `outcomes-page.tsx`: four KPI cards (`:45-50`), dots + 5-item key including "Oldest on the left" (`:75-81`), table, plan cards, concern cards: five sections on one page. Split by task (plans list; evaluations list) or fold dots into Reports.
- `evaluation-page.tsx:130` "A correction adds a version. Earlier ones stay." and `version-timeline.tsx:87` "Earlier version, kept exactly as it was." and `:86` "First version, as the evaluator submitted it." Keep one.
- Two "Back to ..." buttons (`evaluation-page.tsx:214-218`, `remediation-page.tsx:172-176`). Cut.
- `remediation-page.tsx:131` "Your coordinator confirms each step." plus per-step "Not done yet" (`:70`). Cut the sentence.

### Do Reviewer and Director need separate nav from Admin?
No. They differ by permission (`canReview` `queue.ts:21`, `isDirector` `verification.ts:18`, `CONCERN_ROLES` `outcomes.ts:13`), not information architecture. Today: Admin 7 rows, Reviewer 3, Director 3, Preceptor 2 (`lib/v2/roles.ts:49-80`). Proposal `[INFER]`:
- One staff nav of 4 rows for admin, reviewer and director: **To do** (approvals, stalled, records ready to verify, reopened), **Students** (record + outcomes + remediation + verification in one per-student page), **Skills** (library + courses, admin only), **Reports**. Actions are enabled per role; a director sees the Verify button, a reviewer sees Approve.
- "Outcomes" and "Records" both end up at a student; merge them. Outcomes-by-skill dots belong in Reports.
- Preceptor nav (Requests, Lab sessions) should be one row: a lab instructor has no clinical requests, a preceptor no lab sessions; show the one that applies.
- Director's nav order differs between code (Outcomes, Records, Reports: `roles.ts:62-66`) and screenshot (Records, Reports, Outcomes), so the screenshots are stale.

## Unverified

- No browser opened; no interaction, focus, keyboard, or runtime check. Screenshots opened: `v2-admin-review-queue-desktop.png`, `v2-preceptor-preceptor-evaluation-request-sub-maya-1-desktop.png`, `v2-director-director-verification-stu-maya-desktop.png`, `v2-preceptor-lab-batch-grid-desktop.png`. Phone variants and the other ~100 screenshots were not opened; screenshot timestamps vs current code not checked (director nav order mismatch suggests staleness).
- Student-side surfaces (request-signoff, history, returned panel, attempt numbering) and the admin library were read only by grep; they belong to other tasks. Statements about "student cannot name an unrecorded evaluator" rest on `lib/v2/student.ts:608-614` and `docs/v2/traceability.md:74`, not a UI read of `request-signoff.tsx`.
- `docs/source/requirements.extracted.txt` IDs mapped by line from `/tmp/sc-audit/requirements.txt`; SL-08/SL-09/ST-09/SC-12/SC-16 text confirmed. Granola call transcripts were grepped, not read fully; no CALL tag claims beyond the broad statement that students may name any evaluator (`call-followup.txt` lines 166-168).
- Seed: which skills carry `approvalRequired` true was not enumerated (default false at `lib/v2/config.ts:38`).
- Tests (`tests/v2`) not run.
