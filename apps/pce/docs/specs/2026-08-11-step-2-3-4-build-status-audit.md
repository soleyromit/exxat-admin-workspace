# Step 2 / 3 / 4 — Build Status Audit (refresh)

- **Date:** 2026-08-11 (same day as the sync-up call; this refreshes `2026-08-11-step-2-3-4-course-eval-sync-up-audit.md` against current code, post today's removal-restoration fixes)
- **Trigger:** Romit asked for (1) the exact per-course date-override requirement re-verified against the raw transcript, (2) the exact Step 4 "more course/evaluatee detail" requirement re-verified against the raw transcript, (3) a build-status list across Steps 2/3/4.
- **Source re-verified today:** `get_meeting_transcript` (raw, not summary) on **"Course Eval sync up," Aug 11, 2026 9:30 AM EDT** (`2a204119-7804-444f-b087-32c4817e00b1`) — the same transcript the prior audit used; re-pulled in full to confirm no detail was lost in the earlier summary pass.
- **Second same-day meeting checked:** "Survey design and exam management solution review" (`f97f9f0c-e401-460e-970e-ca707f514003`, 10:33 AM EDT) — raw transcript re-pulled; confirmed it is **still** just scheduling chatter, rescheduled to **Aug 12, 7pm IST**. Nothing substantive to extract. Re-check after that call happens.

---

## 1. Step 3 — per-course date override, verbatim

> "Yeah inside evaluation window there will also be per course override that you can define. Meaning I can give a evaluation date at a global level. I can say that this is my start date and this is my end date. But for a particular course... let's assume that there were 10 courses... in that case you can define one survey window here, or else for each course you can change the open and close, which will run independently of this survey window."

No additional mechanical detail exists in the transcript beyond this (Monil was walking a Figma prototype live — "you can refer to my prototype" — which isn't captured as text). The spec is: **global window stays; a per-course open/close override sits below it, independent of the global window.**

**Current build status: ✅ done.** `step-communication.tsx`:
- `CourseWindowOverride` type (`:108`), `courseWindowOverrides` prop + `onSetCourseWindowOverride`/`onClearCourseWindowOverride` (`:225-232`)
- Collapsible "Customize per course" disclosure under the Survey window card, closed by default, count in the trigger label (`overrideCount`, `:409`)
- Per-row: course code/name, `DatePickerField` ×2 **inline in the row** (not a nested Popover) when overridden, "Uses survey window" + "Set dates" when not (`:693-720`)
- Threaded end-to-end from `page.tsx` (`courseWindowOverrides` state, `:225` area) down through the wizard

**One thing worth flagging, not a defect:** the earlier `/compare/push-step3-course-window-override` exploration surfaced a real UX problem in variants D/F/H — editing via a row Popover that itself opens a *second*, nested `DatePickerField` popover, plus a DS-level bug where the calendar defaults to today's month instead of the selected date's month. **The shipped `step-communication.tsx` doesn't have this problem** — it renders the two `DatePickerField`s directly inline in the row, no nested popover. No action needed here; noting it so the distinction is on record before anyone assumes the compare-page finding applies to production code.

**Still open, from the original audit, unresolved:** with a real 10+ row list, the per-course override renders as a hand-rolled `<div>` list (`step-communication.tsx:696-724`), not the vendored `DataTable`. The original spec flagged this for `ds-adoption-reviewer` at build time once row count is real rather than mocked — still applies, not yet reviewed.

---

## 2. Step 4 — "more detail on course/evaluatees," verbatim

> "Whatever you have proposed does not make sense because here you say the recipients... this does not give a right summary to the admin. This definition is per course offering... it has to be a list view instead of a summary... are we expecting that we need to show all the 13 courses with all the roles? — Yeah, it's a summary that we need to show because this does not give you the picture. This will not help admin to verify."
>
> "Same for template also — each course offering will have different templates. At this screen template visualization is not important for admin — admin just wants to make sure I have all the courses that I had in my mind, and right roles are getting evaluated, and there are students in the course. So it would look something like this: you have a course, you have course type... template is not necessary so we can remove this mapping, window is necessary, count of students, and roles getting evaluated — here it is mentioning three but this should also describe more. It should not be three — it should be called as Instructor is evaluated, Course Coordinator is evaluated, Course material is evaluated."

Spec, restated plainly: replace the template-grouped summary with **one row per course offering**, columns = course · course type · window (dates) · student count · roles evaluated (spelled out, not counted), template dropped from this screen entirely.

**Current build status: 🔴 not built.** `step-review.tsx`'s "Survey design" `Section` (`:331-404`) is still exactly the shape Monil rejected:
- Grouped **by template** (`courseGroups: ReviewCourseGroup[]`, `{templateTitle, codes}` — `:12-15`)
- One line per template + a bare course **count** (`{g.codes.length} course{s}`, `:343-348`) — not one row per course
- No per-course window, no per-course student count, no roles-evaluated breakdown anywhere in this section

This is the single largest remaining gap across all three steps, and it's exactly what you're describing as "more details on which course, evaluatees, etc." — the admin currently sees "Course Evaluation Template · 13 courses," not which 13 courses, what window each runs, how many students, or which roles.

**Target shape** (mockup, unchanged from the original audit §4.3 — still the right reference):

```
Creating 42 evaluations across 13 courses · reaching 476 people
Instructor, Course Coordinator, Course material evaluated          ← new aggregate role line

┌─ Course offerings (13) ──────────────────────────────────────────────────┐
│ Course    Type   Window              Students   Evaluated                 │
│ DPT-501   CB      Dec 4 – Dec 18       48        Instructor is evaluated, │
│                                                    Course material is     │
│                                                    evaluated              │
│ DPT-510   CB      Dec 1 – Dec 15      44        Instructor is evaluated, │
│           (custom window)                        Course Coordinator is   │
│                                                    evaluated, Course      │
│                                                    material is evaluated  │
│ ...                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

DS note (unchanged): this is genuinely tabular per-row data — strong candidate for the vendored `DataTable` (already used in Step 1) rather than `step-review.tsx`'s current hand-rolled `Section`/`rows` pattern. `ds-adoption-reviewer` should run before this gets built, per Gate 1.

Data-model note: `step-communication.tsx`'s `courseWindowOverrides` (built today, §1 above) is the input this screen needs for the per-course "Window" column and the "(custom window)" annotation — **this item was correctly sequenced second** in the original build order (§6: "3.3 needs to exist before 4.1-4.6, since the per-course window column needs real per-course dates to show") and that dependency is now satisfied.

---

## 3. Full list — build status, Steps 2/3/4

### Step 2 — Survey Design

| # | Item | Status | Note |
|---|---|---|---|
| 2.1 | "+ Add another template" trigger removed | ✅ done (today) | `step-survey-instances.tsx` — trigger + dialog removed, "Also evaluating" cards + S2 conflict "Create new" path untouched |
| 2.1a | Secondary-template infrastructure beyond the button (still fully wired) | ⚠ open question | Not auto-resolved — needs explicit Romit/Monil call before touching (§5.2 below) |
| 2.2 | Role toggle reads as person-level at headcount=1 | ⏸ pending David | Monil explicitly deferred; no design direction yet |
| 2.3 | Template-switch confirmation dialog | ✅ shipped, praised | "Perfect. This is perfect." — no change |
| 2.4 | Separate "visual" stakeholder feedback, possible new column | ⏸ pending (out of scope) | Monil intentionally not relaying secondhand |
| 2.5 | David's Step-1 feedback thread | ⏸ pending Monil | Informational only |

### Step 3 — Communication (Distribution)

| # | Item | Status | Note |
|---|---|---|---|
| — | Reminder frequency toggle removed | ✅ done (today) | Cadence delta banner + Match button intentionally kept (§5.1 below) |
| — | "Already messaging these students" card removed | ✅ done (today) | `existingStreams` still feeds the delta banner internally |
| — | "Results released" field removed (Step 3 screen) | ✅ done (today) | `releaseDate` state kept internally in `page.tsx`, no longer wizard-editable |
| 3.1 | Survey title field (merge-field formula) | ✅ done | `step-communication.tsx:562-591` |
| 3.2 | Survey instructions field | ✅ done | `step-communication.tsx:599` |
| 3.3 | Per-course window override | ✅ done | See §1 above — no nested-popover issue in production code |

### Step 4 — Review

| # | Item | Status | Note |
|---|---|---|---|
| 4.1 | Per-course list view (replaces template-grouped summary) | 🔴 not built | See §2 above — largest remaining item across all three steps |
| 4.2 | Template dropped from this screen | 🔴 not built | Follows automatically once 4.1 ships |
| 4.3 | Per-row fields: course · type · window · students · roles | 🔴 not built | |
| 4.4 | Roles-evaluated spelled out, not counted | 🔴 not built | |
| 4.5 | "Results released" row removed (Step 4 screen) | ✅ done (today) | `step-review.tsx` — row + `fmtDate` + prop removed |
| 4.6 | Aggregate role line added to headline | 🔴 not built | "Instructor, Course Coordinator, Course material evaluated" — see §5.3 below for placement question |
| 4.7 | "Enable faculty access" stays out of Step 4 | ✅ confirmed correct | Belongs in dashboard, post-close |

---

## 4. Open questions carried forward (unresolved, do not auto-build)

- **§5.1** — Does removing "Already messaging" retire the cadence delta banner + "Match existing cadence" button too? Transcript only named the rail and the frequency picker. Flagged, not auto-removed — still needs a direct Monil/David check.
- **§5.2** — Is the secondary-template system (not just the removed button) now fully out of spec? The S2 conflict "Create new survey" path still produces a second template on an offering. If "only one template, period" is unconditional, this is a much bigger removal (~150+ lines across `step-survey-instances.tsx` + `page.tsx`'s conflict-resolution branch) — needs explicit confirmation before touching.
- **§5.3** — Step 4's aggregate role line (4.6): one clause appended to the existing headline sentence, or a small KPI strip? Given `feedback_no_basic_progress_bar_viz`/`feedback_viz_first` and the existing headline-sentence pattern, a headline clause is the more consistent fit — flagging so it isn't over-built into a KPI strip.

---

## 5. Suggested next step

**Step 4's redesign (4.1–4.6) is the one substantive build left.** Everything else across Steps 2–3 is either done, correctly deferred, or blocked on someone else's call (David, visual stakeholder, Monil re-confirmation on §5.1/§5.2).

Say the word and I'll run Gate 1 (vault + `pce-ui-patterns.md` + `ds-adoption-reviewer`, since this is a real new-component-shape decision — `DataTable` vs. continuing the hand-rolled `Section` pattern) before writing any JSX for Step 4.
