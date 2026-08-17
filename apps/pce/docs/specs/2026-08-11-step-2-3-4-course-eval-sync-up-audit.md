# Step 2 / 3 / 4 — Course Eval Sync Up (Aug 11): Design Audit

- **Date:** 2026-08-11
- **Author:** Romit Soley (Product Designer II) · drafted on Claude Sonnet 5
- **Product:** PCE · `apps/pce/admin` · push wizard (`app/(app)/surveys/push/page.tsx`), Steps 2–4
- **Status:** Audit only — no code changed by this doc. Awaiting Romit's call on the open questions in §5 before build.
- **Trigger:** Today's "Course Eval sync up" call (raw transcript below) plus the same-day "Survey design and exam management solution review" call, which never got past scheduling (rescheduled to tomorrow 7pm IST — nothing substantive to extract).

---

## 0. Provenance

| Source | What it gave |
|---|---|
| **Granola — "Course Eval sync up," Aug 11, 2026 9:30 AM EDT** (`2a204119-7804-444f-b087-32c4817e00b1`), raw transcript | The PM (Monil, screen-sharing step 2/3/4 designs) walked strip-by-strip through Step 2, then Step 3 ("communication flow... create survey user stories"), then Step 4. All quotes below are verbatim from this transcript. |
| **Vault — `Decisions/pce/2026-06-30-course-eval-course-level-dates-and-registry-refresh.md`** | Prior (Jun 30) decision already establishing per-course date overrides on top of term-level dates — today's ask is a **restatement**, not a new idea, and confirms it's been settled for 6 weeks without shipping. |
| **Vault — `Decisions/pce/2026-07-27-communication-rules-visibility-cross-survey.md`** | The "See · Compare · Resolve" model that justified the "Already messaging these students" rail + the Reminder-frequency delta banner — now partially superseded (§5.1). |
| **Vault — `Decisions/pce/2026-07-24-push-two-step-split-instance-grain-duplicates.md`** | The UC5 Review-step ledger design ("courses · template · window · student count · evaluity count," template-grouped) — now directly contradicted by today's call (§3). |
| **Direct reads** | `step-survey-instances.tsx` (Step 2), `step-communication.tsx` (Step 3), `step-review.tsx` (Step 4), `app/(app)/surveys/push/page.tsx`, `lib/pce-mock-data.ts` (`CourseOffering`), `lib/pce-push-validation.ts` (`courseDates`). |
| **This session's earlier work (same day)** | Step 2 "Additional templates" removal, Step 3 "Reminder frequency" + "Already messaging" + "Results released" removal, Step 3 Save-draft repositioning — all landed **before** this transcript was reviewed. Cross-checked against it below; every one is independently confirmed correct by Monil's own words (§1, §2). |

---

## 1. Step 2 — Survey Design

| # | Item | Current state | Required change | Status | Source |
|---|---|---|---|---|---|
| 2.1 | "Additional templates" / "+ Add another template" | Already removed this session (`step-survey-instances.tsx`) | **Confirmed correct — go further.** Multi-template-per-course is not supported *at all*: "we will not be doing this as per the requirement... we are not supporting multi-template selection for a course, it will only be one template." The fix path is "switch a template" or "make sure the template selected has that role in create template flow." | ✅ done, but **see 2.1a** | "So what right now we are not supporting multi-template selection for a course, it will only be one template... there won't be add another template flow... you can remove this additional template thing." |
| 2.1a | Remaining secondary-template infrastructure — `secondaryTemplateAssignments`, "Also evaluating" cards, S2 conflict "Create new survey" branch (`onResolveReassign` `choice === 'create-new'` in `page.tsx:1187-1192`) | Still fully wired; only the **add** trigger was removed today. An offering can still end up with 2+ templates via the S2 conflict dialog's "Create new" path. | **Open question, not auto-applied here** — see §5.2. If "only one template, period" is literal, the whole secondary-template model (not just the button) is now spec-violating, not just its entry point. | ⚠ needs Romit's call | Same quote as 2.1 — "we are not supporting multi-template selection for a course" is unconditional, no carve-out mentioned for the conflict-resolution path. |
| 2.2 | Role toggle vs. multi-instructor naming | Toggle is role-level; when 2 co-instructors share a role, avatar cluster shows initials, no inline names. When exactly **one** instructor holds the role, Monil read the same toggle as "disabling Anita specifically," not the role. | Needs a visual language that reads as role-level even at headcount=1 — names still need to show, "but we have to show it in a different way." **Not decided** — Monil is deferring to David for the concrete answer. | ⏸ pending (David) | "This is sort of confusing for the user... if it is only one instructor, then I feel that this enable/disable is on Anita's level... I think we haven't tested with David. Right. So let him give the call out." |
| 2.3 | Template-switch confirmation dialog (`AlertDialog`, "Switching to \{template\} updates every \{criterion\} to match its role") | Shipped, unchanged | **No change — explicitly praised.** | ✅ confirmed good | "Perfect. This is perfect." |
| 2.4 | Broader step-2 visual pass | N/A | A separate stakeholder ("visual") reviewed the designs and has feedback, possibly including a new column. Monil is intentionally not relaying it secondhand. | ⏸ pending (separate handoff, out of scope for this audit) | "On this design, visual had a lot of feedback... I will not hijack those conversations... He had some design in mind by introducing a new column. So you can check with him later." |
| 2.5 | Step-1 feedback thread from David (faculty-template association, "assign and move ahead" framing) | Referenced but not reviewed by Monil yet ("I will review it and take a call") | No action — informational only, Monil owns follow-up. | ⏸ pending (Monil) | "I need to know what was his feedback which is fine... I think you shared the recording to me, I will review it and take a call." |

---

## 2. Step 3 — Communication (Distribution)

### 2a. Confirmed correct (already shipped this session, independently validated)

| Item | Transcript confirmation |
|---|---|
| "Reminder frequency" toggle group removed | "this item reminder frequency we are deprioritizing it for now... So you can remove this entire section." |
| "Already messaging these students" card removed | "what is this reminders already messaging these students... this is something which David spoke about that I would need to remove... it's repetitive information." — Monil didn't even need to ask; Romit had already flagged it. |
| "Results released" date field removed | "You need to remove release date... we will not have result release date in the survey distribution... it is admin's job to go to each survey and release it to faculties one by one [from the closed-survey flow, later]." |

### 2b. Net-new requirements (not yet built)

| # | Item | Spec | Status | Source |
|---|---|---|---|---|
| 3.1 | **Survey title** field | Per-survey title with merge-field placeholders ("a sort of pre-built formula" — e.g. `{{course_name}} – {{academic_year}} – …`), or free text. Has a default value. | 🆕 new build | "We are introducing survey title and survey instructions... you can use some merge fields... whenever a new course is picked up, they will use this placeholder and the survey title will be populated. Or they can use some plain language." + "Is there a default title? ... Yeah, this would be the default." |
| 3.2 | **Survey instructions** field | Plain-English free text, admin-authored, own default value. | 🆕 new build | "There will also be survey instructions. Survey instruction is just plain English that they can write." |
| 3.3 | **Per-course survey window override** | Global open/close still exists at the top (already built). New: below/beside it, a list of the selected courses (10+ in the real case) where the admin can independently override open/close **per course**, running independently of the global window. Corroborated by the Jun 30 vault decision — this has been settled for 6 weeks, today is a re-spec, not a new ask. | 🆕 new build (largest item in this audit) | "Inside evaluation window there will also be per-course override that you can define... I can give an evaluation date at a global level... but for a particular course... you can define one survey window here, or else for each course you can change the open and close, which will run independently of this survey window." + vault: "Scheduling UI must expose an optional per-course date override on top of the term defaults." |
| 3.4 | "Share report to faculty" | Mentioned in the spec walkthrough as a line item | **Not needed** — confirm it doesn't exist in current build (it doesn't — grep confirms no such string in `step-communication.tsx`), no action required. | ✅ N/A, already absent | "Then share report to faculty. This is not needed." |

**Data-model note for 3.3:** `CourseOffering` (`lib/pce-mock-data.ts:1781`) and the page's `openDate`/`closeDate` state are both singular/global today — no per-offering override field exists anywhere in the model. This needs new state, e.g. `Record<offeringId, {openDate?: Date; closeDate?: Date}>`, defaulting to the global window when absent, surfaced as a "Customize per course" disclosure under the existing Survey window card (mockup in §4).

---

## 3. Step 4 — Review

**Headline finding: the current design is a direct miss, not a refinement.** Monil: *"whatever you have proposed does not make sense... this does not give a right summary to the admin. This definition is per course offering... it has to be a list view instead of a summary."*

This contradicts the **shipped** Jul 24 UC5 decision (`Decisions/pce/2026-07-24-...`), which explicitly specified the template-grouped summary ("courses · template · window · student count · evaluity count") now live in `step-review.tsx`'s "Survey design" `Section` (lines 336–409, `courseGroups: ReviewCourseGroup[]` grouped by `templateTitle`). That decision is **superseded** by today's call.

| # | Item | Current state (`step-review.tsx`) | Required change | Status | Source |
|---|---|---|---|---|---|
| 4.1 | "Survey design" section shape | Grouped by **template**: one row per `templateTitle` + course count (`courseGroups.map(g => ...)`, lines 343–354) | Must become a **list view, one row per course offering** — not grouped, not summarized. "It has to be a list view instead of a summary." | 🔴 redesign | "This does not give a right summary to the admin... it has to be a list view instead of a summary... are we expecting that we need to show all the 13 courses with all the roles? — Yeah, it's a summary that we need to show because this does not give you the picture. This will not help admin to verify." |
| 4.2 | Template shown per row | N/A today (grouped BY template) | Once per-course, template is explicitly **not** needed on this screen: "template visualization is not important for admin — admin just wants to make sure I have all the courses that I had in my mind, and right roles are getting evaluated, and there are students in the course." | 🔴 redesign (omit) | Same quote. |
| 4.3 | Per-row fields | N/A | Course · course type · window (dates) · student count · roles evaluated. | 🆕 new row shape | "It would look something like this. You have a course, you have course type... window is necessary, count of students, and roles getting evaluated." |
| 4.4 | Roles-evaluated cell | N/A | Must **spell out each role**, not show a bare count: *"it is mentioning three but this should also describe more. It should not be three — it should be called as Instructor is evaluated, Course Coordinator is evaluated, Course material is evaluated."* | 🔴 redesign | Same quote. |
| 4.5 | "Results" row (`releaseDate`, `step-review.tsx:434`) | `['Results', fmtDate(releaseDate)]` inside the "Schedule & email" `Section` | Remove — same instruction as Step 3's field removal, restated for this screen: *"Survey release date is in previous step... you need to remove release date [here too]."* | 🔴 remove | "You need to remove release date... Not here [share-to-faculty] but you need to make an update on the screen — sorry, screen three [and this screen] — you need to remove release date." |
| 4.6 | Final top-level summary | Headline sentence exists today ("Creating N evaluations across M courses · reaching P people," `step-review.tsx:250-279`) | Keep, but this is now explicitly separate from the per-course list (4.1) — a real aggregate, not a replacement for it: *"we need like a summary view of what course offerings are there, number of students, roles getting evaluated and persons being evaluated."* Confirms both are wanted: aggregate summary **and** per-course list. | 🟡 verify current headline covers "roles getting evaluated" in aggregate — it currently doesn't (only counts + course/people counts, no role breakdown) | "And then final page, as we said, we need like a summary view of what course offerings are there, number of students, roles getting evaluated and persons being evaluated." |
| 4.7 | "Enable faculty access" / share-to-faculty | Not in Step 4 today | Correctly **out of scope for Step 4** — belongs in the dashboard, post-close, per-survey action. No change needed here. | ✅ confirmed out of scope | "We will create the share-to-faculty flow in the dashboard... once it is closed... admin's job to go to each survey and then release it to faculties one by one... you don't have to worry about that flow right now." |

---

## 4. Mockups (ASCII — ground the two biggest net-new pieces before JSX)

### 4.1 — Step 3: Survey title + instructions (new card, above "Survey window")

```
┌─ Survey details ──────────────────────────────────────────────────────┐
│ Survey title *                                                         │
│ ┌────────────────────────────────────────────────┐                    │
│ │ {{course_name}} – {{academic_year}} – EOT Eval  │  [Insert field ▾] │
│ └────────────────────────────────────────────────┘                    │
│ Populates per course from the merge fields above. Default shown.       │
│                                                                          │
│ Survey instructions                                                    │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Please rate each statement honestly. Your responses are          │   │
│ │ anonymous and will not be shared with instructors individually.  │   │
│ └────────────────────────────────────────────────────────────────┘   │
│ Shown to students at the top of the survey. Default shown — edit as   │
│ needed.                                                                 │
└──────────────────────────────────────────────────────────────────────┘
```
DS notes: `Input` + a merge-field inserter (mirrors the existing `resolveMerge()` token vocabulary already used for email subject/body preview in this same file — `{{course_name}}`, `{{term_name}}`, etc. — reuse, don't invent new tokens). Instructions = `Textarea` (not currently imported in `step-communication.tsx` — new DS import).

### 4.2 — Step 3: per-course window override (extends existing "Survey window" card)

```
┌─ Survey window ─────────────────────────────────────────────────────────┐
│ Opens on *                    Closes on *                                │
│ [ 12/04/2026            ▾ ]   [ 12/18/2026            ▾ ]               │
│                                                                            │
│ ▸ Customize per course · 2 of 13 overridden                              │  ← Collapsible, closed by default
├────────────────────────────────────────────────────────────────────────┤
│  DPT-501  Human Anatomy & Kinesiology            Uses survey window      │
│  DPT-502  Physiology & Pathophysiology           Uses survey window      │
│  DPT-510  Musculoskeletal Physical Therapy I     Dec 1 – Dec 15  [Reset] │
│  DPT-511  Musculoskeletal Physical Therapy II    [Set dates]             │
│  ...                                                                       │
└────────────────────────────────────────────────────────────────────────┘
```
DS notes: reuse the row shape already proven in the just-removed "Already messaging these students" rail (course code · label · right-aligned control, `step-communication.tsx` — deleted this session, but the pattern is still the closest precedent in this file) rather than inventing a new list primitive. "Uses survey window" state = muted text, no control; overridden rows get two compact `DatePickerField`s + a ghost "Reset" back to inherited. Given 10+ rows, this should NOT be a hand-rolled `<div>` list at that scale — flag for `ds-adoption-reviewer` at build time; the vendored `DataTable` (already used in Step 1, `components/data-table/`) may be the more correct primitive once row count is real instead of mocked.

### 4.3 — Step 4: redesigned per-course list (replaces the template-grouped "Survey design" section)

```
Creating 42 evaluations across 13 courses · reaching 476 people
Instructor, Course Coordinator, Course material evaluated          ← NEW aggregate role line (4.6)

┌─ Course offerings (13) ──────────────────────────────────────────────────┐
│ Course    Type   Window              Students   Evaluated                 │
│ DPT-501   CB      Dec 4 – Dec 18       48        Instructor is evaluated, │
│                                                    Course material is     │
│                                                    evaluated              │
│ DPT-505   CB      Dec 4 – Dec 18       48        Instructor is evaluated  │
│                                                    (Gap — Placement       │
│                                                    Faculty not assigned)  │
│ DPT-510   CB      Dec 1 – Dec 15      44        Instructor is evaluated, │
│           (custom window)                        Course Coordinator is   │
│                                                    evaluated, Course      │
│                                                    material is evaluated  │
│ ...                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```
DS notes: this is exactly the shape of Step 1's course table (`code · type pill · students · action`) plus a Window column and the spelled-out Evaluated column — strong candidate for reusing the vendored `DataTable` rather than `step-review.tsx`'s current hand-rolled `Section`/`rows` pattern, since it's now genuinely tabular, per-row data (component-consistency.md: DataTable governance). Template column dropped per 4.2. Existing ack-gates (subject/window/duplicate warnings, `AckGroup`) stay — they're a different concern (blocking issues) that this transcript never touched.

---

## 5. Open questions for Romit (do not auto-resolve)

### 5.1 — Does removing "Already messaging these students" also retire "Compare" + "Resolve"?

The Jul 27 decision (`2026-07-27-communication-rules-visibility-cross-survey.md`) modeled Reminders as **See → Compare → Resolve**: the rail (See, removed today), the cadence-delta banner ("Existing surveys remind X," still live in `step-communication.tsx`), and the "Match existing cadence" button (still live). Today's transcript only names the rail and the frequency picker for removal — it never mentions the delta banner or Match button. Functionally they still work standalone (they read `existingStreams` directly, not the rail). But conceptually, half of a three-part model now has no visible "See" step feeding it. **Flag, don't auto-remove** — worth a direct check with Monil/David rather than inferring.

### 5.2 — Is the secondary-template system (not just its "Add" button) now fully out of spec?

Per 2.1a — "we are not supporting multi-template selection for a course, it will only be one template" reads as unconditional, but the S2 conflict-resolution flow ("Create new survey" choice) still produces a second template on an offering, and the "Also evaluating" cards + person-grain late-added-co-instructor exception are all still fully wired. If the one-template rule is truly absolute, this is a much bigger removal than today's button (~150+ lines across `step-survey-instances.tsx` + `page.tsx`'s conflict-resolution branch) and needs explicit confirmation before touching — it would also change how the S2 Draft/Scheduled-conflict dialog resolves ("Override" would become the *only* option, "Create new" would need to go).

### 5.3 — Step 4 aggregate role line (4.6) — confirm exact wording/placement

Monil's ask ("summary view of what course offerings are there, number of students, roles getting evaluated and persons being evaluated") could mean either (a) one more clause appended to the existing headline sentence, or (b) a small KPI-style strip. Given `feedback_no_basic_progress_bar_viz` / `feedback_viz_first` memory and the existing headline-sentence pattern already in `step-review.tsx:244-279`, (a) is the more consistent fit — flagging so it isn't over-built into a KPI strip that doesn't match the rest of the step's voice.

---

## 6. Suggested build order

1. **Step 3 — Survey title + instructions** (3.1, 3.2): self-contained, no data-model change beyond two new string fields + defaults. Lowest risk, do first.
2. **Step 3 — per-course window override** (3.3): needs new per-offering date-override state threaded from `page.tsx` down through `StepCommunication` into Step 4's per-course window column (4.3) and the push payload. Largest single item — do as its own PR.
3. **Step 4 — list-view redesign** (4.1–4.6): depends on 3.3 existing (per-course window column needs real per-course dates to show). Do after 2.
4. **Resolve 5.1 and 5.2 with Romit/Monil** before either touches code — both are net-new deletions beyond what's already shipped, and both reverse previously-"settled" decisions, so they need an explicit go-ahead per the workspace's no-unauthorized-consolidation rule.

None of the above is implemented by this audit. Say the word on any item (or all of them) and I'll pick up implementation — Gate 1 (vault + `pce-ui-patterns.md` + `ds-adoption-reviewer`) runs again before any new component file, per protocol.
