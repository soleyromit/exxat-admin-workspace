# Journey 2 — Student

**Hat:** UX + interaction. **Prototype screen:** *Student View* (an admin-side "view as student" switcher; real students use their own login `[REQ §6]`).
Persona anchor: the *Stressed Health Science Student* — mobile/tablet during shifts, single-tap CTAs, visible feedback, auto-save, never sees peers `[exxat-domain-context P2]`. **The prototype is desktop only; the requirements never state mobile**, but the persona makes it a design risk. `[INFER]`

## Why this journey exists / so what

The student is the **trigger and the owner of the record** `[CALL 03-05]`. If submitting is slow they skip it; evidence gets thin; programs cannot prove readiness. If outcomes are opaque ("did not count" with no reason) they cannot self-correct, and the absence of a remediation workflow `[REQ §14]` makes *clarity of the failed rule* the only remediation lever the product offers (SH-03).

## The arc

```
1 Know what's expected ─▶ 2 Choose skill(s) ─▶ 3 Say where & who ─▶ 4 Give details (+ self-eval)
                                                                        │
8 Act on result ◀─ 7 Track every attempt ◀─ 6 Confirmation ◀─ 5 Send ──┘
        └─ revise & resend (returned / not yet assessed) | further attempt (did not meet)
```

## Stage table

| # | Stage | What the student does | System behaviour (REQ) | PROTO observed | Emotion `[INFER]` | Risk |
|---|---|---|---|---|---|---|
| 1 | Know expectations | Opens a course; sees mapped skills, mandatory flag, progress per skill | ST-01 | Header: student + course selector, cohort/group, placements text. List: IV Insertion "Mandatory for this course · In Progress · 4/5 demonstrations · model name"; progress bar; "View history (n)". Achieved skill shows green note "you can still request another evaluation" | Oriented / pressured | Mixed units "4/5 demonstrations" vs "2/3 qualifying evaluations" is accurate; but per-level & setting progress not shown on the card (SH-05) |
| 2 | Select skills | Ticks one or several skills (batch) | ST-04 | Checkboxes; sticky bar "N skills selected · Clear · **Send for review**" | In flow | Selecting an already-achieved skill is allowed (good) |
| 2b | Unmapped skills | Opens "Other skills" (collapsed row with count of sent) | ST-02, CM-05, ST-03 | "Other skills · 2 sent — Not mapped to this course. Evidence still counts toward your skill record." + toggle "Show only skills I have sent for review" | — | Library may be large; search behaviour inside "Other skills" **not verified** |
| 3 | Where did you do it? | Clinical or Lab/Simulation | ST-05 | Radio-style toggle | — | — |
| 3a | Clinical setting & location | Chooses from placement-derived options; single option is inferred | ST-06 | Select "Outpatient Clinic — Harbor Family Practice / Perioperative — Northgate… / Outpatient Clinic — Northgate…" with helper "From your 2 placements for this course. You may move between settings…" | — | If single option exists PROTO behaviour **not verified** (ST-06 says infer) |
| 3b | No placement on record | Still can submit, drawing on the program's full setting list | ST-07 | **Not observed** | — | Needs fixture without placement |
| 4 | Who evaluates | Role then person; role constrained by setting + skill's allowed roles; explain if no valid combination | ST-08, ST-09 | Clinical → roles Preceptor / Clinical Faculty; Lab → Clinical Faculty / Lab Instructor. Person select. Unlisted lab instructor: name + email — **not observed** (need choose Lab Instructor) | — | **Defect**: after switching Clinical→Lab the stale preceptor was kept and the confirmation read "A. Whitfield, RN (clinical faculty)". See `07-gaps…` |
| 5 | Details & self-eval | Fills program-required fields; optional one note; self-evaluates where configured | ST-10..12 | Per-skill card "Details for this submission · Incomplete" with Completion date *, Student notes; Send disabled until valid. Self-evaluation form **not observed in this flow** (Foley has none configured) | Careful | Setting/location captured once per submission in PROTO → answers **OD-07** implicitly |
| 6 | Send & confirm | Sends; sees what/to whom/role/setting/location | ST-13 | Toast-like banner "Sent 1 skill to … for evaluation — lab / simulation." + row "Awaiting preceptor evaluation" with chips per skill and evaluator | Relief | The banner is feedback; workspace rule prefers `LocalBanner` over toast |
| 7 | Track | Opens history per skill: attempts in order, outcome, who, feedback, counts | SH-01..07 | Header counters "Counted so far 4 · In progress 1 · Returned 1"; toggle "All courses (5) / NURS 350 only (1)"; per-attempt card: Attempt n, date, Clinical — setting, location, course, outcome pill, evaluator+role+outcome, student details, "You rated yourself", preceptor feedback, reviewer note, "Revised and resent 1 time", **View form**, **Revise and resend** | Anxious → informed | **SH-03** (state the failed rule) not seen; no failing example in seeded student |
| 8a | Revise | Corrects a *returned* or *not yet assessed* submission; same record, revision count + reason retained; may switch evaluator | RV-01, RV-02, RV-04 | "Revise and resend" on returned attempt; reviewer note shown | Corrective | Clears or retains evaluator answers? **OD-08** |
| 8b | Further attempt | After a *completed* evaluation did not meet criteria, creates a new attempt; original intact | RV-03 | Not observed | Motivated | Needs fixture |
| 8c | Locked | Counted or awaiting approval → cannot edit/resend | RV-05 | Not observed | — | — |

## Student moments of truth

1. **"What do I need to do on this rotation?"** — must be answerable from the first screen (ST-01).
2. **The send dialog** — fewest decisions possible; setting/role derive from placement and skill config instead of free choice.
3. **The returned/did-not-count card** — must say *what rule failed* and *what to do next* (SH-03, SH-02).
4. **Cross-course record** — one skill, all courses, narrow to one (SH-06).

## Rules students must never be surprised by

- They may submit skills not mapped to their course `[CM-05]`.
- Evidence from other courses counts `[CM-07]`.
- Lab evidence never satisfies a clinical-setting minimum `[SC-12]` → the *progress against each named setting* must be visible so this is not a surprise (SH-05).
- Waiting states name *who* it is with `[SH-02]`.

## Data the student never sees (scope)

Other students' records; evaluator contact details beyond name (not specified in REQ — `[INFER]` per RBAC "no preceptor contact info" in workspace framework).

## Mobile / auto-save (design risk, not a requirement)

Persona implies mobile + no loss on timeouts. REQ is silent. Flag as OD-candidate: *"Should Send-for-review support saving a partially completed submission?"* `[INFER]` — add to `05-open-decisions.md` as proposed OD-14.

---

## New evidence 2026-10-09 (raw Granola review; CALL tier, nothing decided)

Sources: `strategy/08-raw-granola-findings-oct-2026.md`, tags `[CALL 10-08 Aarti]` (Aarti, inferred), `[CALL 10-09]`, `[CALL 09-25]`. The REQ-derived stages above stand. The notes below change how the student's moments of truth are framed.

| Moment | What the raw calls change | Firmness | Open decision |
|---|---|---|---|
| **The home is the one student-level checklist, not the course** | Stage 1 above ("Know expectations") opens a course and lists mapped skills. Aarti: skills are "agnostic of course"; a course is a lens that bolds, stars or colours "the ones you're more likely to do", but "they should still go to the main skills." The student's first screen is the whole checklist at student level with course emphasis as an overlay. This does not change CM-05 or ST-02 (mapped then other skills) | Firm that mapping is soft; moderate on the presentation | OD-29, OD-01 |
| **Counts against targets, and the trigger, in one place** | "I know that I have to do at least 5, 5, 5, 5, 5 of each. I know I've done 2 of these, 4 of these, 6 of these." and "I see I have not met this, I trigger a review of it." Stage 1 and Stage 5 (send) collapse into one page: see what is unmet, start the review from it. A placement may also host the trigger ("that's okay") but lands on the one checklist | Firm | OD-29 |
| **This course vs overall** | "I can have the view in this course, how many things did they check off, and overall where do they stand." The student sees both a course-scoped progress and an overall progress. A program total (for example 100 skills) would feed "overall where do they stand" | Moderate | OD-30, OD-27 |
| **Auto evidence is not something the student sends** | If a skill is credited from an assessment, a course grade or pass, or an end-of-rotation form, the student did nothing. SH-02 and SH-03 (what counted, why not) need a source line ("counted from: course grade") or the record looks unexplained. v1 stays student-submitted; the history card should leave room for a source label | Moderate; REQ silent | OD-31, OD-32 |
| **Student assertion alone** | Some programs accept "just students saying is enough." The student journey in that case has no evaluator wait state (Stage 6 "waiting, with whom" is absent). Never a default | Moderate | OD-37, SC-02 |
| **Logging over days** | Multi-response form: a student submits a record against skill 1, returns "after 2 days" with skill 5. Supports save-and-return and multiple sends, and lowers the pressure of one big submission | Moderate | OD-14 |
| **Where evidence happened does not matter to the headline** | The main view ignores rotation; setting and location still sit in each attempt (Stage 7) and the setting minimum progress (SH-05) so the lab-never-counts rule (SC-12) is not a surprise | Firm for headline; REQ governs rules | OD-22, `07` C-16 |

Student moments of truth, amended: (1) "What do I still need, overall and in this course, and can I start the review from here?"; (2) the send sheet; (3) the returned or did-not-count card; (4) the cross-course record (now the default view, not a toggle).

Not stated by anyone: how the student triggers for a course-pass skill (no trigger exists), and whether students see peers' counts or a class average (the platform's competency view shows a published class average, `[CALL 09-25]`; the REQ section on peers is silent, so the existing rule "never see other students' records" stands).
