# 03 — Prototype Walkthrough (UI + interaction hat)

**Artifact:** `source/prism-skills-prototype.html` — self-contained React app, in-memory state ("a refresh restores the seeded data"), all data placeholder. Title: *Prism — Skills & Competencies Prototype*. Authored by Sankalp using Claude; **purpose per Sankalp: show requirements, "don't go by the design"** `[CALL 09-23]`.
**Method:** opened headless Chromium at 1440×900; clicked every nav item, tab, wizard step, dialog and flow listed below; captured 25 screens to `source/screens/`; scripts in `source/walkthrough-scripts/` (re-runnable). The Chrome extension was not connected, so this is Playwright, not a hand-driven session.
**Not exercised (honest list):** real file upload parsing · Export download contents · deactivation · validation errors on Save · removing a level/question · further-attempt after a *failed* evaluation · filter removal chips · skill→students drill · mobile viewport · keyboard/axe checks.

## Shell & IA

```
┌ exxat Prism ──────────────────────────────────────────────────────────────┐
│ ADMINISTRATOR      │ Skills & Competencies / Nursing                       │
│  Overview          │ <Page title + one-line purpose>                       │
│  Skills Library    │ <content>                                             │
│  Course Mapping    │                                                       │
│  Review & Approve  │                                                       │
│ STUDENT            │                                                       │
│  Student View      │   (admin "view as student" switcher: 40 students,     │
│ EVALUATOR          │    course select)                                     │
│  Preceptor Eval.   │                                                       │
└────────────────────┴───────────────────────────────────────────────────────┘
```
Three **roles in one sidebar** is a demo device. Real IA: admin items in the admin app; Student View lives inside the student's course page ("Course activities" next to forms/evaluations/patient logs `[CALL 09-23]`); Preceptor Evaluation is an emailed link with **no shell**. `[INFER]`

## Screen inventory (screens captured → `source/screens/`)

| # | Screen | Key elements actually seen | Capture |
|---|---|---|---|
| 1 | **Overview › By student** | Filters button + "Showing everything"; context line "Showing data for 150 students · All cohorts · All groups · All clinical courses · 9 skills in scope"; 4 KPIs (150 / 3.2 of 9 / 0 / 6); tabs By student·By skill·By tag; search; sort (Highest/Lowest/Name A–Z); Export; table Student, Cohort·Group, Achieved, In progress, Not met, Attainment bar+%; "Showing 25 of 150 … Show 25 more" | 01 |
| 2 | Student drill-down | Panel: name, cohort, "7 of 9 skills achieved", three counters with **Show these only**, each skill row with model·criteria text, n/N progress, status; expandable evidence | 02 |
| 3 | Evidence ledger | Per skill: levels breakdown "Observed 2/1 …", table Date, Setting (Clinical + clinical setting / Lab), Location, Evaluator + role, Recorded, Result "Counts as evidence", View form, evaluator comment | 06 |
| 4 | Evaluation detail | "IV Insertion — {student}", date·Clinical (setting)·location·course, Completed, Counts, evaluator, "Supplied by the student", responses (with the scale rendered), comment | 07 |
| 5 | By skill | Skill, Category, Model, Students in view, Achieved, In progress, Not met, % achieved, Courses; footnote: % counts every student in view incl. those whose courses don't recommend the skill — filter by course to narrow | 03 |
| 6 | By tag | Tag, Skills, Categories spanned, Achieved, In progress, Not met, % achieved, Students achieving all; footnote about overlap | 04 |
| 7 | Filters | Cohort · Group (disabled "Select a cohort first") · Clinical course · Category · Tag ("Cuts across categories") · Location · Setting ("Filters the evidence"). Settings list includes "Lab / Simulation" | 05 |
| 8 | **Skills Library › Skills** | 9 skills; table Skill (+desc, tags), Category, Model badge, Achievement criteria text, Courses count (link), Status, Edit; filters; **Import**, **Add skill** | 08 |
| 9 | Library › Categories / Tags / Settings / Lab Instructors | Tabs with counts. Tags tab has "Where each tag reaches" cards. Settings tab shows evidence recorded per setting. Lab instructors tab: roster + "Named by students, not on the roster" | 09–11 |
| 10 | **Import** | Dialog: Upload a file / Or paste the list / "Paste a sample list" → **Read the list** → Review table → **Create 8 skills** | 12 |
| 11 | Post-import banner | "Added 8 skills… cannot be used until each one is configured. Configure them now / Dismiss" + filter banner "8 skills… not configured… Show them"; rows "Not configured — Needs configuration — **Configure**" | 13 |
| 12 | **Edit/Configure (3 steps)** | Step 1 Skill definition · Step 2 Evaluation configuration · Step 3 Achievement criteria; stepper at top; lineage panel pinned | 14–16 |
| 13 | **Course Mapping** | Left: offerings (search + 4 filters + Clear + "14 of 42 match · count shows mandatory / total"); right: "Skills mapped — {offering}" with checkbox per skill + Mandatory/Non-mandatory + "Also mapped in …" | 17 |
| 14 | **Review & Approve** | Cards per pending evaluation (see Journey 3) | 18 |
| 15 | **Student View** | Student + course selectors; "Awaiting preceptor evaluation" strip; checklist with sticky action bar; history drawer; Other skills; Send dialog | 19–22 |
| 16 | **Preceptor Evaluation** | "Evaluations sent" mailbox; evaluation form; result summary | 23–24 |
| 17 | Export menu | "Export (CSV, opens in Excel): By student — this table / Evidence detail" | 25 |

## What the prototype gets right (keep the idea, not the pixels)

1. **Model → criteria lineage panel** that stays visible while configuring (SC-17). Strongest idea in the prototype.
2. **Form preview** shows student + evaluator views together (SC-19).
3. **Import review** is a proper human-in-the-loop with an unread-lines list (IM-05, IM-08).
4. **Cross-course honesty**: "Also mapped in NURS 350 (Fall 2025), …" on every mapping row, "one student-level skill record is shared across courses".
5. **Reports state their own caveats** (overlapping tags, % denominator).
6. **Evaluator told what happens next** ("Goes to review").
7. **Agreement sentence** in the approval card.

## What the prototype is not (do not copy)

| Prototype choice | Why not to copy |
|---|---|
| Three roles in one shell | Different apps/auth in reality |
| Modal 3-step wizard for configuration | Config is the product's heaviest work; a modal is cramped (≈5 sections + preview). Consider a full page or sheet. `[INFER]` |
| Generic "Category A / Tag A" content | Placeholder; but note real programs have meaningful names |
| Custom Tailwind look (blue buttons, navy sidebar) | Not Exxat DS. Rebuild with `@exxatdesignux/ui` |
| `Send for review` as blue filled CTA in a sticky bar *and* in the dialog | Fine as pattern; one filled primary per surface |
| Colored attainment bars (amber/green) | Aarti dislikes red in score viz; DS says viz first but no basic progress bars as the *only* viz. See memory notes |
| "Not met" = no evidence + failed | Conflicts with AE-04 |
| Toast/banner "Sent …" | Use `LocalBanner` per workspace rules |

## Data-quality quirks in the seed (ignore when reasoning about behaviour)

- Submission dates and "completion date" values disagree in places (e.g. attempt 4 submitted 2026-07-04, completion 2026-04-07).
- IV Insertion "4 / 5 demonstrations" on the student card vs. "Counted so far 4 · In progress 1 · Returned 1" is consistent; "Medication Reconciliation" shows "2 / 1 qualifying" — over-achievement displayed as ratio >1.
- 150 students; many names repeat (two "Owen Ashford", different cohorts) — real data would need disambiguation (ID/email) in tables. `[INFER]`
- Numbers in tag table: Tag A 149/265/186 → counts are **student-skill records** (sum 600 = 150×4), not students.
