# Strategy 03: UX and interaction (what each role should feel, and how the screens make them feel it)

**Product:** Prism Skills Tracking. **Written:** 2026-10-26 for Romit Soley. **Status:** strategy, not a contract. No screen is approved by this file.
**Siblings (written separately, link by filename):** `01-information-architecture.md` (nav rows, page set) · `02-content-strategy.md` (words, labels, microcopy) · `04-ui-and-visual.md` (layout, tokens, DS) · `05-data-viz.md` (charts). This file owns behaviour: journeys, states, handoffs, interaction patterns, nudges, edge cases.
**Inputs read:** `00-design-brief.md`, `01-competitive-digest.md`, `02-decisions-ledger.md`, `glossary.md`, `dataset-spec.md`, audits T1 to T4, journeys 01 to 03, `ux/01, 02, 04, 05, 08, 11`, `strategy/06`, REQ, both calls, build prompt.
**Tags:** `[REQ id]` · `[CALL]` (Oct 8 and Oct 9 transcripts) · `[COMP name]` (competitive analysis, Oct 19) · `[BUILD-PROMPT §n]` · `[AUDIT Tn]` · `[LEDGER]` · `[INFER]` (my reasoning, unverified) · `PENDING-ROMIT`. Precedence REQ > CALL > PROTO > INFER. No `OD-*` is treated as decided.
**How every decision is written:** DECISION -> WHY (evidence) -> REJECTED (and why not) -> REVIEW CHECK (how a reviewer tests a screen against it).

---

## 1. The central UX thesis

One sentence: **every role should always know what the system holds for them, why, and what happens next, without being told the same thing twice.**
The feeling is the product. Prism's market problem is not missing features; it is mobile reliability and not seeing what is left [COMP: Exxat Student iOS 1.4 of 5, "students cannot see what is left"]. So we design for confidence first, then for speed.

| Role | The feeling we are building | Done when (observable) | WHY this feeling | REJECTED alternative | REVIEW CHECK |
|---|---|---|---|---|---|
| Student | **Confident about what is left.** One glance: achieved, waiting, returned, still to do | Home answers "what do I still need, overall and in this course" in 2 seconds [REQ SH-04; CALL Oct 8] | Aarti: "I know I have to do 5, 5, 5; I know I've done 2, 4, 6" and trigger the review from the same page [CALL]. Students quit logging when they cannot see progress [COMP] | A course-first home that hides the whole list (v2 `student-home`) | Cover everything but the top screen: can I say how many are left and what to do next? |
| Evaluator (preceptor, lab instructor, faculty) | **Done in under 2 minutes, no login, no doubt.** | Email tap to submitted receipt in under 2 min; receipt says "counts now" or "held for approval" [REQ EV-01, EV-07] | Mobile sign-off takes 22 s to 2.7 min in studies; a login wall is the top reason evaluators vanish [COMP: Chen 2019, Hasan 2021] | App-style shell with sidebar and role switcher around the form (v2 today) [AUDIT T4 P1-3] | Is there any chrome, sign-in or decision beyond outcome and feedback? |
| Reviewer (faculty, coordinator) | **Knows why a record is held** and can decide fast | Every row states its hold cause; compare view on one card [REQ AR-01..05; AUDIT T3] | A queue that only says "Ready to approve" gives readiness, not cause; reviewers then open five tabs | Status-only queue | Can I name the cause of each row without opening it? |
| Director | **Trusts the record** they are about to put their name to | Every figure drills to evidence; verification says exactly what it covers [REQ RP-05..07; AUDIT T3] | Verification is a v2 proposal, not REQ; overclaiming readiness is a named market risk [COMP section 9] | A one-checkbox verify over a 2-of-4 record (v2 today) | Does the verified document state its own gaps? |
| Admin | **Can configure without a vendor.** 150 skills live in hours, rule changes never surprise | Import to configured library without retyping; rule change shows who flips before publish [REQ IM-01, IM-10, SC-19, AE-02] | Trajecsys keeps competencies vendor-built and not editable by coordinators [COMP]; the stated adoption risk is hand-entry [REQ section 3] | Admin edits that silently recalculate every student (v2 today) [AUDIT T1] | Can an admin predict the effect of the save they are about to press? |

**Analogies used in this file (each one plain sentence, each teaches one thing):**
- **Order tracking:** a parcel page always says who holds it right now ("with courier", not "in transit"). Teaches: a waiting status must name who holds it.
- **Pull-request review:** a reviewer sees what the author claimed next to what was done, with a reason chip for why it is on their list. Teaches: the approval card and the "why held" chip.
- **Boarding pass:** one scannable pass, no account, everything needed at the gate. Teaches: the evaluator link is the whole product for that person.
- **Flight status board:** a wall of flights sorted so the delayed ones are on top. Teaches: at 100+ students, show who is behind first, not an alphabetical roll.
- **Bank ledger:** you never edit a past line; you add a correcting line and both stay visible. Teaches: correction versus new attempt, and why counted evidence is locked.

---

## 2. Principles

| # | DECISION | WHY (evidence) | REJECTED | REVIEW CHECK |
|---|---|---|---|---|
| P1 | **Say it once.** One helper line per control group; a fact lives in one place (page, dialog or banner, never two) | Romit's "too much text"; audit found the same sentence 2 to 3 times per page and one sync conflict stated 3 times on student Home [AUDIT T1, T2, T4; LEDGER D-A] | "Reassurance" copy on every card | grep the screen text: any sentence or fact appearing twice? |
| P2 | **Fewer destinations.** One staff shell with per-role actions; 12 rows across roles (admin 4, reviewer 2, director 2, preceptor 0 or 1, student 3) as the starting proposal | 19 rows, 4 admin rows render the same components as reviewer and director [AUDIT T3, T4; LEDGER D-A]. Detail: `01-information-architecture.md`. Row list is NOT approved | Separate IA per role | Does the screen add a nav row? Name the job that cannot live in an existing row |
| P3 | **Progressive disclosure.** Headline, then cause, then rule, then evidence. Rules and method text sit behind the figure they explain | 15 over-long strings found; admin Dashboard had 9 example-list rows above the fold [AUDIT T4] | Method paragraphs on the page | First screenful has at most one primary action and no explanatory paragraph |
| P4 | **Every number is a link** to the record it counts, carrying the record in the URL (`stu`, `item`, `coh`, `site`, `course`, `evaluator`, `list`) via one `linkTo` helper | The data already propagates; the "dots not connected" gap is entry points and links; about 40 hand-built hrefs, plain-text names on Outcomes, Review item, Reports grid [BUILD-PROMPT §8.1, §8.4; REQ RP-05, RP-06; AUDIT T4 P0-2] | Dead numbers; per-role URLs for the same record | Click every count and name: does it land on the exact record with the same filter? |
| P5 | **The system, not the evaluator, decides what qualifies.** Evaluator records an outcome against the program's criteria; the engine derives counted or not | The "Met is still your call" note in v2 and Trajecsys flagging approvals that contradict failure criteria show the failure mode [REQ AE-02, EV-03; COMP Trajecsys; AUDIT T1] | Letting evaluators or reviewers flip qualification | No control lets a human set "counts" except approve/return on a held evaluation |
| P6 | **Pending never counts.** Waiting and awaiting approval are overlays on a state, never a state; no widget mixes them into a total | [REQ AE-01, AE-06; BUILD-PROMPT §5]. v2 waffle vs dots disagreed on waiting [AUDIT T2 P2-11] | "Provisional" progress that includes waiting | Every total on screen: does it equal counted only? Is waiting drawn differently and labelled? |
| P7 | **Never lose an entry.** Draft saved on the device first; each entry shows queued, synced or conflict; failed sends keep all input | About 14 public complaints of lost entries; top barrier for 26% of trainees is connectivity [COMP rec 9; Harrington 2020] | Optimistic UI that discards on failure | Kill the network mid-send: is every field still there with a Try again? |
| P8 | **Show the cause.** Every non-final state names who holds it or what rule failed, in the user's terms | [REQ SH-02, SH-03, AR-01; COMP SimCapture]. Order-tracking analogy above | Readiness labels without cause | Each status chip has a "with whom / because" companion |
| P9 | **One meaning per signal.** A nav badge means "I must act". A "what changed for you" strip means "FYI". A banner means "this page is in an unusual state" | Badges used for FYI train users to ignore badges [INFER, notification fatigue; COMP rec: one digest per day] | Red dots for everything | Does this badge go to zero when the user has nothing to do? |
| P10 | **Scale is the default test.** 123 students, 153 skills, 403 evaluators, 2,141 sites; triage first | [LEDGER D-D; BUILD-PROMPT §6]. A 7-skill demo hides every real problem | Alphabetical rolls, example lists | Does the screen still work with 43 rows in a grid and 400 in a list? |

---

## 3. Handoffs: the receiver-side cue (Romit's "dots not connected")

The audit proved the store is shared and state propagates. What is missing is the **signal on the receiving side** [AUDIT T4 P0-1]. Rule: **a handoff is not designed until the next role's cue is named.**

```
 ADMIN ──H1──> STUDENT ──H2──> EVALUATOR ──H3──> STUDENT
   ^              |                |  \
   |              |                |   H4 (held) ──> REVIEWER ──H5 approve──> STUDENT
   |              H7 (did not      |                      |  \
   H10 (name      qualify, attempt)|                      |   H6 return ──> STUDENT (fix and resend)
   to adopt)                       |                      |
   +-- UNVERIFIED EVALUATOR <------+                      H8 (counted/ready) ──> DIRECTOR ──H9──> STUDENT
   H11: any rule change ──> STUDENT (what changed) + DIRECTOR (changed since verified)
```

| # | Handoff | Receiver | Cue (channel) | What the cue says | Deep link goes to | WHY this channel | Today (v2) |
|---|---|---|---|---|---|---|---|
| H1 | Admin publishes or maps a skill | Student | "What changed for you" strip on Home (FYI, max 3 lines) | "2 skills added to NURS 350: IV catheter (mandatory)" | The skill card | Student has an account; FYI, not work, so strip not badge (P9) | None: banner just disappears [AUDIT T4 #1] |
| H2 | Student sends a request | Evaluator | **Email**, one per evaluator, listing every open request with one link each | "Maya F. asked you to sign off 2 skills" + button "Start" | Form for that request, no login | Evaluator has no account [REQ EV-01]; email is the only channel they have. Boarding-pass analogy | No email surface in v2 [AUDIT T3 evinvite MISSING] |
| H3 | Evaluator submits | Student | Skill card state change + strip line; Requests row moves to Done | "J. Delgado signed Indwelling catheter: counted" or "Waiting with administrator review" | Skill card | Student must see the result without hunting [REQ SH-02] | Home still said "Fix 1 sync conflict" [AUDIT T4 #4] |
| H3b | Same event | Evaluator | Receipt: "Counts now" or "Held for approval" + **Next request** button | "Next: Priya S., 2 skills" | Next form | [REQ EV-07]. A dead end after submit loses the second request | Dead end [AUDIT T4 #4] |
| H4 | Evaluation held | Reviewer | **Nav badge** (work waiting) + row with a "Why held" chip | "Skill needs approval" / "New evaluator, not yet verified" / "Paper form, outcome to enter" | The submission | Reviewer must act; cause missing today [AUDIT T3 P1-3] | Status only |
| H5 | Reviewer approves | Student | Card flips to Counted with "Approved after review" | strip + card | Skill card | P9 | Student sees nothing [AUDIT T4 #6] |
| H6 | Reviewer returns | Student | **Badge on Home next-action** + top card "Fix and send again" with the reason | Reviewer's reason verbatim [REQ RV-02] | Revise form, prefilled | Student must act | PRESENT [AUDIT T4 #7] |
| H7 | Evaluation did not qualify | Student | Failed rule sentence + button "Make a further attempt" on that attempt | "You needed 2 sign-offs from 2 evaluators; you have 1" [REQ SH-03] | New attempt, skill preselected | The only remediation lever in v1 is clarity [REQ section 14] | No button [AUDIT T2 P1-7] |
| H8 | Record becomes ready or changes | Director | **Badge** counting "Ready to verify" + "Changed since verified"; list grouped in that order | "3 changed since you verified" | Student record | Director currently sees 12 students in one group [AUDIT T4 P1-4] | None |
| H9 | Director verifies | Student | Strip on Home + status on Record | "Your record was verified, version 1, Oct 26" | Share page | Verification is invisible to the student today [AUDIT T4 #9] | None |
| H10 | Student names an evaluator not on record | Admin | Row on the Dashboard "Needs you": "N names to adopt" | "Dr. Whitmore, named by 3 students" | Evaluator directory with adopt/merge | Without it the unverified-hold has no driver [REQ SL-09, ST-09; AUDIT T3 P0-1] | MISSING |
| H11 | Rule changed after evidence | Student, Director | Student strip line; director "Changed since verified" | "Rule changed Oct 26: 2 sign-offs from 2 evaluators now needed" | Skill card | [REQ AE-02]: state can flip; silent flip erodes trust | Silent [AUDIT T1] |

**Channel rule** `[INFER]`: email only to people with no account (evaluators). Everyone else gets in-product cues. REQ section 14 puts notifications and reminders out of scope and BUILD-PROMPT section 14 says show emails as rendered content, so no delivery engineering; the cue still must be designed and shown.
**REJECTED:** a single global notifications bell as the connector (the Notifications button is inert chrome today [AUDIT T4]); it would hide the cue from where the user already looks.
**REVIEW CHECK:** for any screen that changes another role's data, name the receiver, channel and deep-link target in the contract.

---

## 4. Per-role journeys (ASCII), moments of truth, failure modes

### 4.1 Student (owner of the record)

```
 HOME ───> pick skill(s) ───> where + who ───> details/self-rate ───> SEND ───> WAIT ───> RESULT
 "what's   (several at once    (setting from     (program fields;      draft     "waiting   counted | did not meet
  left"     ST-04; likely       placement ST-06;  one note ST-12)       saved     with J.    | returned
            ones starred,       anyone by name+                         on device Delgado"   |
            all reachable)      email ST-09)                            first                v
                                                                                     fix and resend (same record)
                                                                                     or further attempt (new record)
```
| Moment of truth | The test | Failure modes and what we show |
|---|---|---|
| 1. Home | "What do I still need, overall and in this course, and can I start the review from here?" [CALL Oct 8; REQ ST-01] | Empty (no skills mapped): say so, show the whole list. Unconfigured skill: row disabled with "Not open yet" [REQ IM-09] |
| 2. Send | Fewest decisions; setting and role derived [REQ ST-06, ST-08] | No valid role: banner with the reason and one switch action, never an empty select [REQ ST-08]. No placement: full settings list [REQ ST-07]. Offline: saved, queued |
| 3. Result card | Says what rule failed and what to do next [REQ SH-03] | Did not meet: rule sentence + "Make a further attempt" (with wait rule if any, section 9). Returned: reason + prefilled revise |
| 4. Record | One record per skill across courses, narrowable [REQ SH-06, CM-07] | Evidence from another course counts; show "from NURS 340" label |
**Handoff cue received:** H1, H3, H5, H6, H7, H9, H11 (section 3). **Sent:** H2.
**Web vs phone:** PENDING-ROMIT (section 11). Until decided, design web two-column first and keep logging usable at 375 [BUILD-PROMPT §2.1].

### 4.2 Evaluator (preceptor, lab instructor, faculty; no account)

```
 EMAIL ──tap──> FORM (one page, 820 px column, no shell)
                 context (student, course, details, self-rating)
                 per skill: outcome (+ level if configured) + feedback (mandatory if configured)
                 SUBMIT (disabled until complete; says why)
                    └──> RECEIPT: "Counts now" | "Held for approval"  + [Next request]
```
| Moment of truth | The test | Failure modes |
|---|---|---|
| First tap | Form renders at once, readable on a phone, no sign-in [REQ EV-01] | Link invalid or expired: one neutral message; "already submitted" is the only distinct one (DEC-015); text "Ask the student to send a new request" [OD-18 open] |
| Submit | Receipt answers "does it count?" [REQ EV-07] | Submit fails: answers kept, Try again, never re-answer [P7]. Mandatory comment missing: error summary with jump links [REQ EV-06] |
| After | No dead end | Multi-student evaluator: oldest-first list, next button |
**Not shown to the evaluator:** student achievement or progress [INFER; OD-17 proposed, not in REQ], other students beyond their own requests, any configuration.
**Handoff cue received:** H2 (email). **Sent:** H3, H4.
**Boarding-pass test:** if the evaluator needs more than the email and the form, the design failed.

### 4.3 Reviewer (faculty or coordinator; staff shell, "Approvals" row)

```
 BADGE ──> QUEUE (sorted oldest first; row = student, skills, evaluator, age, WHY HELD, self vs evaluator)
              └─> SUBMISSION card: student answers | evaluator answers | match? | feedback | notes
                      ├─ Approve (counts, locked, no undo)
                      └─ Return for correction (reason required) ──> student fixes (OD-16 default: student)
```
| Moment of truth | The test | Failure modes |
|---|---|---|
| Open queue | Can I decide without opening five tabs? [REQ AR-01..04] | Empty queue: "Nothing waiting. Approval applies only to skills that require it" + link to those skills. Bulk approve with blocked rows: name the blockers before confirm (PRESENT) |
| Compare | Disagreement is flagged in text, not colour [REQ AR-02] | No self-evaluation configured: single column, no match marker |
| Decide | Approve changes counts; say how: "This makes 2 of 3" [AUDIT T3] | Evaluator unverified: chip says so; approve still allowed, adoption separate |
**Pull-request analogy:** the chip is "review requested because...", the card is the diff between claim and observation.
**Handoff cue received:** H4. **Sent:** H5, H6.

### 4.4 Director (verification; not in REQ, a v2 proposal)

```
 BADGE ──> VERIFICATION list: [Changed since verified] [Ready] [Not ready]
             └─> STUDENT RECORD (evidence per skill, "Read in full") ──> Verify (numbered, append-only version)
                                                                           └──> student sees "verified, version n"
```
| Moment of truth | The test | Failure modes |
|---|---|---|
| Open list | Which records need me, in order | 12 of 12 under one "unmet" group = no priority [AUDIT T4] |
| Verify | "Do I trust this record?" | Unmet mandatory skills: PENDING-ROMIT (section 11). Reopened/held evidence blocks verify (PRESENT) |
| Later | A rule or evaluation changed | "Changed since verified" returns the record to the top; the old version stays |
**Handoff cue received:** H8, H11. **Sent:** H9. **Scope note:** director and verification are not in REQ [LEDGER Q3]; design only as far as the ledger allows.

### 4.5 Admin (program; owns what "skilled" means)

```
 IMPORT ──> REVIEW (nothing created until confirmed; unread lines listed) ──> CONFIGURE (N need configuration)
   ──> PREVIEW as student / evaluator ──> PUBLISH ──> MAP (soft: likely, never restricts) ──> ASSIGN to cohorts
   ──> DASHBOARD = report: who is behind, what needs me ──> DRILL to evidence ──> EXPORT
```
Rename note (2026-10-26): the staff landing is a Dashboard, not a Home [ROMIT 10-26]; scope bar, comparison basis, drill and refresh rules are in `06-dashboard-patterns.md`. Student "Home" mentions in this file are unchanged (06 section 2 proposes "Progress", PENDING-ROMIT).
| Moment of truth | The test | Failure modes |
|---|---|---|
| Import review | "Did it understand my list?" [REQ IM-05, IM-08, IM-13] | Zero found: explain + show unread lines. Re-import: duplicates detected, no silent create (T1: v2 silently creates a repeat) |
| Save a configuration | "Will this ever be achievable?" [REQ SC-18] | Unsatisfiable: save blocked, reason on the field |
| Launch page | Who has met what and trigger the review in one place [CALL Oct 8, OD-29 open] | Admin must leave the report to act: the exact split Aarti objects to |
| Rule change | See who flips before saving (section 9) | Silent recalculation (v2 today) |
**Handoff cue received:** H10 (names to adopt), config backlog. **Sent:** H1, H11.

---

## 5. State model per object, with the label the user sees

Labels follow `glossary.md` (use its terms; `02-content-strategy.md` owns final wording). Internal names are for engineers.

### 5.1 Submission / evaluation (SM-02) `[REQ SH-02, AR-06, RV-05]`

```
 Draft(on device) -> Sent -> Awaiting evaluator -> Completed -> Counted
                              |  ^                       |-> Awaiting approval -> Counted
                              |  | revise (same record)  |                    -> Returned -> Revised -> Awaiting evaluator
                              v  |                       '-> Did not meet -> [further attempt = NEW submission]
                           Returned
 LOCKED (no edit, no resend): Awaiting approval, Counted. IMMUTABLE: any Completed evaluation.
```
| Internal | Student label | Detail line (always) | Who can act |
|---|---|---|---|
| Draft (device) | Saved on this device | "Not sent yet" | Student: send |
| Awaiting evaluator | Waiting | "with J. Delgado, preceptor" | Student: resend to another [REQ RV-04] |
| Awaiting approval | Waiting | "with administrator review" + (if unverified) "new evaluator" | Reviewer |
| Counted | Counted | outcome, evaluator, role | none (locked) |
| Did not meet criteria | Did not meet the criteria | the failed rule | Student: further attempt |
| Returned | Returned | reviewer's reason | Student: revise and resend |
| Revised | Revised and resent n times | n | Evaluator |
**Hard rules:** only Counted counts; Awaiting approval cannot be edited or resent; a further attempt is a new record with `attempt + 1`, the original untouched [REQ RV-03].

### 5.2 Skill record per student (SM-03) `[REQ AE-04; OD-03 open]`
| Internal state | Label | Note |
|---|---|---|
| No evidence yet | No evidence yet | Storage keeps four states always |
| Evidence does not qualify | Evidence does not qualify | Merge with the row above is OD-03; not decided. Display flag `merged` is DEC-020 default only to match the prototype |
| In progress | In progress, n of N + per-level + per-setting lines | "4 of 4 and still In progress" must say "Still needed: 1 in Emergency" [REQ SH-05] |
| Achieved | Achieved | A student may still ask again if the program wants it [PROTO copy] |
Overlays on any state: **waiting** (with whom), **returned**, **unverified evaluator**. Overlays never change the state.

### 5.3 Skill configuration (SM-01) `[REQ SC-01, SL-02, SL-11, IM-09]`
| Internal | Admin label | Student sees | Mappable / submittable |
|---|---|---|---|
| Unconfigured | Needs configuration | "Not open yet" (disabled row) | No |
| Configured + active | Active | normal | Yes |
| Configured + inactive ("retired" in the COMP digest) | Inactive | gone from selection; past evidence kept in the record | No new |
| Unconfigured + inactive | Inactive + Needs configuration | gone | No |
| Model changed, criteria rebuilt | Needs configuration (flagged) | Held until re-saved | `[INFER]`: REQ SC-09 does not say it reverts; confirm with Sankalp before building |

### 5.4 Evaluator identity `[REQ SL-08, SL-09, ST-09; BUILD-PROMPT §4, J2, J7]`
| Internal | Label | Effect |
|---|---|---|
| On roster (adopted) | Verified | Evaluation follows the skill's own approval setting |
| Named by a student, not on roster | Unverified (admin sees "Named by students") | `[BUILD-PROMPT J2]`: evaluation goes to Awaiting approval with chip "New evaluator". This is Romit's rule; REQ SC-15 only has per-skill approval. Confirm (open question 5) |
| Merged duplicate spellings | Verified, merged | All evidence re-pointed; no loss [REQ SL-09] |

---

## 6. Interaction patterns: when to use, and why

| Pattern | Use when | Behaviour | WHY | REJECTED |
|---|---|---|---|---|
| **Offline draft + queued / synced / conflict** | Any student log, send, and evaluator draft | Device first, then sync. Chip per entry: Queued, Synced, Conflict. Banner only when offline, failed or conflict; nothing when all synced | [COMP rec 9; Harrington 2020]. v2 sync strip showed "Everything is saved" on every page (noise) [AUDIT T2] | Always-visible sync card |
| **Conflict resolution** | Two versions of one entry | Keep mine / keep theirs / keep both with consequences stated; "both" blocked for ratings; state reason | Nothing lost until the user chooses [P7] | Last write wins |
| **Correction vs new attempt** | After Returned vs after Did not meet | Revise = same record, prefilled, revision +1, reason shown. Further attempt = new record, "your previous attempt is kept". The screen names which one it is doing | Ledger analogy; [REQ RV-01..03]; Platinum Planner, AxialProgress, HealthTasks do this [COMP] | One generic "Edit" |
| **Lock on sign-off** | Counted or Awaiting approval | No edit control exists (not a disabled one); plain statement of why | [REQ RV-05]; Typhon's logs edited after approval is a named credibility loss [COMP] | Time-based lock at 72 h (Typhon) |
| **Reopen a counted evaluation** | Evaluator or staff made a mistake | PENDING-ROMIT (section 11) | Conflicts REQ RV-03/05 vs COMP rec 10 | n/a |
| **Undo vs confirm** | Undo for reversible low-impact config (copy settings: 60 s if a revision store exists). Confirm for anything that changes achievement (approve, return, publish, deactivate, rule change) | Confirm dialog states effect on evidence; focus on the safe button; approve has no dialog but explicit button + result banner | Achievement changes cannot be silently reversed; undo of approve would flicker counts [ux/08 P-12, P-14, P-15] | Undo on approve; confirm on every click |
| **Bulk approve** | Reviewer queue of 20+ | Select rows; before confirm, list rows that cannot be approved and why; approve the rest | High-volume evaluators and sign-off days [COMP New Innovations, Medtrics] | Bulk without a blocker list |
| **Batch lab grid** | Lab instructor signs many students on the same skills | Students x skills grid, Set column to Met, absent students get no result; lab never fills a clinical setting | Real lab blocks are batches; v2 PRESENT [AUDIT T3; REQ SC-12]. Raised on calls, not REQ [CALL] | One form per student |
| **Sign-off route: link (default)** | Always available | Email link, no login [REQ EV-01] | Table stakes [COMP] | n/a |
| **Sign-off route: QR / hand the phone over** | Student is with the evaluator now | Offered as "More ways", not equal tiles | Fastest and best liked, does not raise volume alone [COMP Snyder 2018]. QR and hand-over are v2 proposals, not REQ [AUDIT T2]; keep if Romit keeps them (Q5) | Four equal tiles |
| **Sign-off route: photo of paper form** | Paper-first site | Student attaches photo; reviewer enters outcome; held for review | [COMP rec 10]; v2 PROPOSED; not REQ | Counting a photo automatically |
| **Inline validation** | Forms with rules | On blur for a field, on change for cross-field sums (300 ms debounce), full on Save. Save stays enabled; error banner lists fixes with jump links; errors named by field | Disabled buttons hide why [ux/08 P-02]. Config save blocked for unsatisfiable rules [REQ SC-18] | Warn-and-save |
| **Impossible filter** | Location does not offer the setting | Info banner replacing the table: "Mercy Home Health does not offer Emergency" + Remove actions; KPI shows a dash | [REQ RP-09] | Empty table |
| **Keyboard and focus** | Everywhere | Visible focus; dialogs trap focus and return it; Esc closes top layer only; destructive dialogs default to the safe action; sticky headers never hide the focused row; status never colour only | WCAG 2.1 AA [BUILD-PROMPT §2.7; ux/08 P-13] | Hover-only affordances |
| **One primary action per surface** | Every screen | One filled button. Documented exception: approval cards (Approve filled, Return outline) | Hierarchy [ux/11 AP-18; DEC-018] | Four identical "Log" buttons on a list |
| **Optimistic update** | Library edits (category, tag) only | Row marked Saving, roll back with Retry | Anything affecting achievement is never optimistic: the count must not flicker [ux/08 P-14] | Optimistic approve |

---

## 7. Time-driven nudges

Source: BUILD-PROMPT section 10 lists triggers. Recipients are `[INFER]` (the prompt names triggers, not recipients). REQ section 14 puts notifications out of scope, so nudges are **in-product cues and a daily digest preview**, not new delivery infrastructure. The admin screen `admnudges` shows "would fire today" counts computed from data.

| Nudge | Trigger | Receiver | Where it appears | Default |
|---|---|---|---|---|
| N-01 One away from done | In progress with counted >= needed - 1 | Student | Home next-action ("1 sign-off left on Pulse") | On |
| N-03 Placement ending | Current placement has likely skills not started | Student | Home strip | On; needs placement dates (missing in v2) |
| N-04 Waiting 3+ days | Request waiting > 3 days | Student (and coordinator tracker) | Skill card "Waiting with X for 4 days" + Resend/Change evaluator | On |
| N-05 Returned | Reviewer returned a submission | Student | Next-action card | On (PRESENT) |
| N-07 Evaluator reminder | Request open past threshold | Evaluator | Email | **Off by default**; labelled Recommendation |
| N-09 Approvals over 3 days | Held evaluation > 3 days | Reviewer | Queue age bar + digest | On |
| N-10 Required skills not achieved | Required units unmet at a checkpoint | Student; coordinator list | Student Home; coordinator Dashboard "who is behind" | On |
| N-11 Waiting 8+ days | Request waiting > 8 days | Coordinator | Request tracker "Stalled" | On; v2 uses 7, prompt says 8 [AUDIT T3] |
| N-12 Configuration backlog | Unconfigured skills exist | Admin | Dashboard "Needs you" | On |
| N-13 Required skill with no likely course | Required skill unmapped everywhere | Admin | Mapping coverage view | On |
Not listed here: N-02, N-06, N-08, N-14, N-15 (named in the strategy prompt but not present in the files I read; do not invent).

**Rules:**
- **Cap: one digest per person per day** [BUILD-PROMPT §10]. Several nudges collapse into one list, ordered by who is blocked longest.
- **Evaluator reminders off by default.** WHY: reminders did not raise logging in the one study found [COMP Pregnall 2021]; evaluators have no account and no preference centre; the recommendation tier is never a default [BUILD-PROMPT §11]. REJECTED: automatic nag after 24 h.
- A nudge always names the next action and links to it (P4). A nudge with no action is not shipped.
- Thresholds (3, 8) are tenant data, not code; show the value in the settings screen.
- Coordinator "stalled" is computed from age, not seeded [AUDIT T3 P1-6].
- **Review check:** does the nudge disappear the moment the condition clears? Does a user with zero conditions receive nothing?

---

## 8. Empty, loading, error and blocked formulas

Every state is a sentence built from the same parts, so users learn one shape.

| State | Formula | Example | WHY |
|---|---|---|---|
| Empty (nothing yet) | **What is empty** + **why** + **one next action** | "No skills yet. Import your list or add one. Nothing is added until you confirm." | [REQ IM-12, DP-1] |
| Empty (filtered to zero) | "No {things} match {filter chips}." + Clear filters | "No submissions match Waiting 8+ days." | [ux/08 P-06] |
| Empty (valid but nothing recorded) | Say it is valid and what populates it | "No evidence recorded for Emergency yet." | Distinct from impossible [REQ RP-09] |
| Impossible | Info banner replaces table, with the cause and two Remove actions | See section 6 | [REQ RP-09] |
| Loading | Skeleton in the final layout's shape; previous rows stay dimmed up to 400 ms; "Recalculating" on a badge, never a stale Achieved | KPI strip + table skeleton | [ux/08 P-14] |
| Saving / sending | Button disabled with `aria-busy`, label changes ("Sending"); not optimistic for achievement | | [ux/08 P-14] |
| Error (recoverable) | **What failed** + **what is kept** + **Try again** | "Your request was not sent. Everything you entered is kept." | [P7; ux/08 P-17] |
| Error (permission) | "You do not have access to this." No hint of other records | | FERPA scope [strategy/06 section 4] |
| Blocked (rule) | **The reason in the user's terms** + the nearest legal action; control stays visible | "This skill cannot be sent from a lab. Only a preceptor or clinical faculty can sign it off. [Switch to Clinical]" | [REQ ST-08; DP-4] |
| Blocked (time) | Reason + the date it opens | "Next attempt from Nov 3 (7 days after your last attempt)." | Section 9 |
| Offline | Banner only while offline/failed/conflict; entries show Queued | "You are offline. 2 entries will send when you reconnect." | [COMP rec 9] |
Severity must be visually distinct: a hard block (cannot proceed) differs from a warning (can proceed) [memory feedback_severity]. No red for student shortfall; below-bar is amber [Aarti]. Red is for hard errors only.

---

## 9. Edge cases

| Case | DECISION | WHY | REJECTED | REVIEW CHECK |
|---|---|---|---|---|
| **Rule changed after evidence exists** | The engine re-derives (never freeze). Before publish, a preview table: state before -> state after -> students (e.g. Achieved -> In progress: 12) with "View students". After publish, affected students get an H11 line naming the new rule; verified records get "Changed since verified". Renames and wording do not trigger the preview | [REQ AE-02, AE-06]; T1 found the silent flip and a dialog saying "not changed" that is true of records, false of achievement; Elentra shows before/after; version-by-cohort lives behind a toggle [COMP; BUILD-PROMPT §11 option B] | Silent recalculation; freezing state at record time (violates AE-02); blocking changes once evidence exists | Save a rule on a skill with evidence: does the admin see a count before and the student a line after? |
| **Deactivate vs delete** | Two intents, two actions: **Fix a mistake** = Inactivate (leaves selection, mapping, reporting; evidence kept; reversible). **New standard** = create a new list for the new cohort. **Delete** exists only while a skill has no evidence and no mapping | [REQ SL-11]; Aarti: "Inactivate just means I made a mistake ... if it is a new standard, create a new list" [CALL Oct 9]; admchange [BUILD-PROMPT §7] | Delete with evidence; inactivating because the standard moved (kills reports silently) | Does the dialog make the admin choose the intent and state the effect on reports? |
| **Expired or invalid link** | One neutral page for invalid, expired, revoked, superseded; "already submitted" is the only distinct message. Student's Requests shows "Link no longer works. Send a new request." Lifetime not chosen | OD-18 open; DEC-015 avoids letting a link holder probe status | Showing student data; choosing a lifetime now | Open a bad token: no data, one next step |
| **Unverified evaluator** | Student may name a lab instructor (or anyone) with name + email; request goes out; evaluation lands in Awaiting approval with chip "New evaluator"; admin adopts or merges; the held evidence then counts per its skill setting | [REQ SL-09, ST-09]; Aarti: students send "to anyone they want", prior names shown as easy access [CALL Oct 9]; [BUILD-PROMPT J2, J7] | Blocking unknown names (v2 today: "not an evaluator on record"); auto-verifying on first use (typo spawns duplicates) | Student types an unknown email: is it sent? Does the reviewer see why it is held? |
| **Evaluator with students from several cohorts** | One email listing all open requests grouped by student; each row has its own link (per-request token). After submit, "Next request". Evaluator never sees cohort, progress or other evaluators | [BUILD-PROMPT evinvite, §3.3]; link must expose only that request [strategy/06 section 4]; AP-12 | One link to an inbox of every student (broader exposure if forwarded) | Does opening one link reveal anything beyond that request and the evaluator's own open list? |
| **Did not qualify: attempt limit and wait days** | If the program sets them (v2 proposes `attemptLimit`, `minDaysBetween`), enforce at the single point a further attempt starts. Button stays visible: "Make a further attempt (opens Nov 3)" or "Attempt limit reached. Contact your program." Evaluator form shows "Attempt 2 of 3". Staff override with a reason is `[INFER]` | v2 shows the numbers on the plan page but does not enforce them [AUDIT T3 P2-9]; Trajecsys "Times Before Pass" [COMP]. REQ is silent; remediation is REQ section 14 (Q5) | Hiding the button; enforcing only on the staff page | Fail an evaluation with limit 1: what does the student see and can they bypass it? |
| **Lab never counts for a clinical setting** | Show lab separately: "Lab: 2 recorded, not counted toward Inpatient" | [REQ SC-12, SH-05] | Merged totals | A skill 4 of 4 but not achieved states what is missing |
| **Evaluator unavailable** | Student resends to another evaluator on any path (returned, not assessed, stalled) | [REQ RV-04]; v2 only lets staff reassign stalled ones [AUDIT T3] | Same-evaluator-only resend | Change evaluator on a returned submission |
| **Mapped is not eligible** | Likely skills starred and sorted first; all skills reachable | [REQ CM-05; CALL Oct 8] | Hiding unmapped skills | Can the student log an unmapped skill from Home? |
| **Same student, three totals** | Label the denominator ("8 of 12 mandatory evaluations") | [AUDIT T4 P2-2; BUILD-PROMPT §8.9] | Unlabelled totals | Every count carries its scope in words |

---

## 10. How 100+ students change interaction

Reference: 123 students, 153 skills, 403 evaluators, 2,141 sites, 8,879 evidence records [BUILD-PROMPT §6].

| Change | Decision | WHY |
|---|---|---|
| **Triage, not roll-call** | Every staff list opens sorted by "furthest behind" or "oldest waiting", with a top strip "Needs you: 9" and the list below | Flight status board analogy; director's 12-student flat group does not survive 123 [AUDIT T4] |
| **"Who is behind" first** | Admin Dashboard leads with the people and skills behind pace, not a library meter; example lists capped at the first item plus "and 12 more" link | CALL: "my report is my launch page"; bottom 20% by completion [CALL 09-23, per ux/01] |
| **Group by cause** | Requests group by evaluator; approvals by "why held"; students by what blocks them | One action clears many rows (bulk) |
| **Saved filters** `[INFER]` | Per-user saved views: "Cohort 2026 behind on required", "Waiting 8+ days". Chips removable [REQ RP-01] | Weekly review cadence lifts attainment (aOR 0.41 for less frequent review) [COMP Chen 2026]; saves repeating the same 4 filters |
| **Search plus virtual lists** | Sites (2,141) and evaluators (403) are search-first; 153 skills grouped by section and scroll inside their panel | [BUILD-PROMPT §6]; global search indexes students, skills, evaluators, not just nav rows [AUDIT T4 P2-1] |
| **Bulk by default** | Bulk configure (copy / apply), bulk approve, bulk map. Never one-at-a-time for 100+ | [REQ IM-14, SL-10] |
| **Charts must hold 43 rows** | Heat grid scrolls inside its panel with sticky headers; text table equivalent | `05-data-viz.md` |
| **Small groups are hidden** | Radar and cohort medians only for groups of 5 or more | Privacy and meaning [BUILD-PROMPT §10] |
| **Counts are a floor** | Never imply competence from a count alone | [COMP Dawson 2021] |

---

## 11. PENDING-ROMIT decisions (recommendation, alternative, consequences)

| # | Decision | Recommendation | Alternative | Consequences |
|---|---|---|---|---|
| D1 | **Reopen on counted evaluations** (v2 "Reopen to edit"; REQ RV-03/05 say no edits; COMP rec 10 says reopen with history) | **Replace with "Request a correction"**: staff cannot change an outcome; the original evaluator is sent a new link; the new version appends, the old stays visible; the original keeps counting until the corrected one completes (`[INFER]`: removing counted evidence mid-flight flips student progress without a new fact). Ledger analogy | B: keep staff edit as append-only versions (faculty convenience). C: remove entirely, errors become further attempts | A honours the hard stop and COMP; costs one evaluator round trip. B lets a reviewer flip an evaluator's Not met to Met: breaks "the system and the evaluator decide" (P5) and weakens director trust. C is simplest but leaves no path for a typo |
| D2 | **Web-first vs phone-first** | **Web-first for staff and student (two-column at 1440); evaluator form designed small-screen-first inside its own 820 px column** because evaluators arrive on a phone from email. Offline queue is a behaviour, not a shell | Phone-first student (v2) | Web-first matches [BUILD-PROMPT §2.1] and REQ/CALL are device-silent [AUDIT T2]. Phone-first suits real clinical use but reproduces the mobile-app risk (iOS 1.4 stars) and wastes a third of a desktop page. Risk to test: logging on a 375 viewport must still finish in a few taps |
| D3 | **Director verifying with unmet mandatory skills** | **Allow, but the verified document states its own gaps** ("Verified: 2 of 4 mandatory achieved") and each gap needs a named acknowledgement, not one checkbox. Do not ship a "ready for practice" certification | Block until all mandatory achieved | Allow serves interviews and credentialing with honest partial records [COMP: logs kept for credentialing]. Block makes "verified" mean "ready", which REQ never asks for and COMP warns is an overclaim. Verification itself is not REQ (Q3, Q5) |
| D4 | **Lab return demonstration: does it count?** (No source text for the term in the inputs I read; reasoning is `[INFER]`) | **Counts toward the skill total when the skill allows a lab instructor (SC-16); never toward a clinical-setting minimum (SC-12)**; shown on its own line; optional per-skill cap on simulation evidence as v2 has | B: a prerequisite gate only (must pass lab before a clinical attempt), counts nowhere | A makes lab effort visible and matches REQ rules; B matches the v2 "clinical attempt locked until" prerequisite box and avoids double counting. Needs the term defined before building |

---

## 12. Open questions for Romit

1. D1 to D4 above: pick one option each.
2. Which of the four sign-off routes ship (link, QR, hand-over, photo)? v2 has all four; only link is REQ (Q5).
3. Are attempt limits and wait days in v1? They sit next to remediation, which is REQ section 14 (Q5).
4. Student request granularity: one link per request or one inbox link per evaluator? I recommend per-request; it changes the evinvite email design.
5. Is "New evaluator -> Awaiting approval" your rule (BUILD-PROMPT J2) and does it apply to every skill, not only those with approval on? REQ SC-15 alone does not say so.
6. Who gets stalled and 8+ day nudges: coordinator only, or student too? Recipients here are `[INFER]`.
7. Is the reviewer a separate nav or one staff shell with per-role actions (Q8)? This file assumes one shell.
8. Does the student see the cue "your record was verified" if verification stays out of REQ?
9. Evaluator link lifetime (OD-18): not chosen. Do you want a default for the prototype only?
10. Are saved filters wanted, or is "furthest behind" sort enough for v1?

---

## 13. Review a screen against this doc (checklist)

Answer pass, fail or N/A with evidence (screenshot or file:line). Any fail without a note is a block.

**Goal and feeling**
- [ ] The role's feeling (section 1) is answerable in 2 seconds from the first screenful.
- [ ] One primary action; no sentence or fact appears twice (P1).
- [ ] No new nav row without naming the job it carries (P2).

**Truth and records**
- [ ] Every count and name links to its record with context in the URL (P4).
- [ ] Totals equal counted evidence only; waiting is drawn and labelled apart (P6).
- [ ] Every non-final status names who holds it or which rule failed (P8).
- [ ] Denominators are stated in words; the same student matches on every screen.
- [ ] No control lets a human set "counts" except approve or return (P5).

**Handoffs**
- [ ] The contract names the receiver, channel (badge, strip, banner, email) and deep link for every change it causes (section 3).
- [ ] Badges go to zero when there is nothing to do (P9).
- [ ] The evaluator sees no progress, no shell, no sign-in, and has a Next request path.

**States and edges**
- [ ] Empty, filtered-empty, impossible, loading, saving, error, blocked (rule and time), offline all follow the formulas in section 8.
- [ ] Failed send keeps all input; offline entry shows Queued (P7).
- [ ] Rule-change, deactivate-or-new-list, expired link, unverified evaluator and attempt-limit cases are handled or explicitly marked out (section 9).
- [ ] Counted and awaiting-approval items have no edit control; correction and further attempt are named differently.

**Scale and access**
- [ ] Works with 43 grid rows and 400 list rows; opens sorted by furthest behind or oldest waiting (section 10).
- [ ] Keyboard path complete; focus visible and returned; status never colour only; no red for shortfall.

**Scope hygiene**
- [ ] No `OD-*` treated as decided; PENDING-ROMIT items show both branches or a seam.
- [ ] Nothing from REQ section 14 designed beyond what the ledger allows; v2-only features are tagged PROPOSED.
- [ ] No em dashes, no "items", no requirement IDs or stakeholder names in UI copy.
