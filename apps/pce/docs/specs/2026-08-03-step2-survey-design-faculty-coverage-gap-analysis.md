# Step 2 — Survey Design & Faculty Coverage (ST-02): Gap Analysis vs. Shipped Design

- **Date:** 2026-08-03
- **Author:** Romit Soley (Product Designer II) · drafted on Claude Sonnet 5
- **Product:** PCE · `apps/pce/admin` · push wizard, Step 2
- **Status:** Design documentation — duplicate-model supersession confirmed with Romit; implementation/execution plan is the next deliverable
- **Supersedes:** the 2026-07-27 "Briefing" duplicate-toggle model (`step-survey-instances.tsx`, memory: `project_pce_push_wizard_final_design.md`) for surveys in Live, Closed, Results Available, or Archived status

---

## 0. Provenance

| Source | What it gave |
|---|---|
| **ST-02 PRD** | Pasted verbatim by Romit, 2026-08-03. Full acceptance criteria for "Step 2 — Survey Design & Faculty Coverage": template assignment, evaluatee-unit selection, Auto Update flag, role-overlap conflict check, Preview Survey, persistence, Draft/Scheduled resume, blocks, and four open items with named owners. |
| **Explore agent #1** | Mapped the current push-wizard route/component structure: `app/(app)/surveys/push/page.tsx`, `step-survey-instances.tsx`, `step-scope-courses.tsx`, `wizard-nav.tsx`, and the `/compare/push-survey-design` design-history route (7 prior variants, "Briefing" promoted). |
| **Explore agent #2** | Mapped the domain layer: `SurveyStatus` enum, `pce-push-validation.ts` duplicate/gap engine, `PceTemplate`/`templateCriteria()`, the readiness `Criterion` system, and confirmed no "Auto Update" or ST-numbered PRD tracking exists anywhere in the repo. |
| **Direct reads** | `components/pce/courses-evaluatees/step-survey-instances.tsx` (577 lines) and `lib/pce-push-validation.ts` (328 lines) — the current Step 2 UI and its duplicate/gap logic, read in full. |
| **Obsidian vault + `apps/pce/docs/specs/`** | Searched for any prior document using "ST-02" or related numbering — none exists. The closest prior-art vault note, `2026-07-20-survey-design-course-to-template-assignment-and-data-validation-flow.md`, covers a related but earlier decision (merging Step 1/2, soft warnings for missing faculty/students) — not this PRD's role-overlap or Auto Update mechanics. |
| **Memory** | `project_pce_push_wizard_final_design.md` (Jul 24 two-step split, PR #61), `project_pce_per_type_evaluation_status.md` (PR #49, per-evaluation-type status), `feedback_prd_compliance_process.md`, `project_pce_gap_analysis_doc.md`. |

---

## 1. ST-02 requirements, restated

### Template assignment
- One template per course. Auto-assign the single published template for a course type when exactly one exists.
- A course offering can carry multiple concurrent surveys — one per push — each with its own status, open/close window, and response count, covering whichever evaluatee units that push's template reaches. Two concurrent surveys for the same offering coexist only if their role coverage is disjoint (see Role-overlap check). One push still assigns exactly one template to one course — no splitting a push's role coverage across two surveys.
- Changing a course's template resets its evaluatee selection to "everything the new template covers" — no prior selection carries forward, even for roles/people shared between old and new template.
- Zero published templates for a course's type → row shows "none available." One screen-level "+ Create new template" action sends the Admin to the standalone template-creation flow; on return, the screen remembers all already-assigned templates.
- "Reset to defaults" re-assigns every course's type default in one shot — no undo after confirming.

### Role + Person evaluatee selection (Unit)
- The first time a course's associated faculty appear, all are selected by default (full template coverage) — unaffected by the Auto Update flag.
- Deselecting a unit (Faculty Role + Associated Person) excludes only that unit from this push: it drops out of the faculty-gap check, the role-overlap check, and won't be evaluated at push. Other units on the same row are unaffected.
- All units deselected on a course = that course row is treated as fully deselected.
- Step 2 carries Step 1's course-selection checkbox. Unchecking a course here deselects it (and every later step), same as unchecking on Step 1. Re-selecting requires manually re-assigning a template and re-selecting units — no restored prior state.

### Auto Update flag
- One toggle at the top of Step 2, applying to every course row — not per-row, not wizard-wide. Defaults OFF on a brand-new wizard; persists as part of Draft state (alongside template assignments and unit selections); restored on Draft resume.
- Flipping the toggle does nothing by itself — it only changes what the next manual refresh does. The manual refresh control (under the faculty-gap check) is the only fetch trigger.
- On refresh, the flag governs only units the row hasn't seen before: a unit newly present in PRISM is auto-selected if the flag is ON, or added-but-deselected if OFF.
- A unit no longer present in PRISM on refresh is removed from the row entirely — regardless of the flag.
- A unit already on the row with an Admin-set selection (selected or manually deselected) is never changed by refresh, regardless of the flag — the flag only decides a brand-new unit's starting state, never overrides a state the Admin already set.
- An auto-selected unit is still subject to the same role-overlap conflict check as any manually-selected unit — auto-selection only decides the checkbox's starting state, it never pre-answers a conflict.

### Role-overlap conflict check ("Duplicate check")
- Exactly one survey is allowed per course offering + role. A course's newly-assigned template is a duplicate — hard-blocked from this push — only if its role coverage overlaps the role coverage of an existing Live, Closed, Results Available, or Archived survey already on record for the same course offering (course + Term/Academic Year).
- Two surveys for the same offering whose role coverage is fully disjoint (e.g., Instructor-only vs. Course-Coordinator-only) are not duplicates — they coexist as independent, concurrent surveys.
- Draft and Scheduled surveys are NOT duplicates. Instead, a course whose existing survey for that course+term is Draft or Scheduled is pulled in for editing: Step 2 (and Step 3) pre-populate from that survey's current configuration (template, unit selections, window/result-release overrides) instead of starting from defaults, and completing the wizard updates that same survey in place rather than creating a second one.
- This course+term signal is previewed earlier, informationally, on Step 1 (ST-01's "Existing survey status preview") — that preview never blocks; this check remains the sole enforcement gate.
- Recomputes whenever Term/Academic Year (Step 1) or the course selection changes — unlike the faculty-gap check, it does NOT depend on template or unit-selection changes.
- The block is hard, not an acknowledgeable warning: the Admin must cancel (ST-16) or archive (ST-09) the existing survey before the course can be pushed again for that term.

### Preview Survey (per course)
- Available per row once a template is assigned; opens ST-10's read-only student preview, live against the row's current assignment. No survey title shown (not defined until Step 4, Admin-facing only anyway).

### Persistence
- Template assignments and unit selections survive forward/back navigation and Save as Draft.
- Going back to Step 1 and editing the course set only affects changed courses: a newly added course gets its type default pre-selected; an existing course with a manual override keeps it. Untouched rows never reset as a side effect.

### Draft and Scheduled resume
- Previously-assigned template still Published but edited since save (e.g. now covers a new role): row keeps the template, faculty-gap status recomputes against its current definition, and the row shows a "template updated since Draft was saved" notice. Applies pre-Live only — once Live, template content is frozen (Freeze & Sync Policy), so no equivalent notice applies there.
- Previously-assigned template since unpublished/archived: row treated as "no template assigned," blocks progress until a currently-published template is chosen.
- For a Scheduled survey pulled in this way, template reassignment follows the existing ST-17 rule (Scheduled-only, disabled once Live — moot here since only Draft/Scheduled ever reach this path); Step 3's window/result-release edits follow the normal per-course override mechanism (matching ST-19's existing treatment of a Scheduled row).

### Blocks
- Any course with no template assigned.
- Any course whose assigned template has since been unpublished or archived (identical treatment to "no template assigned").
- The course already has a Live, Closed, Results Available, or Archived survey for the selected Term/Academic Year (resolve via Cancel/ST-16 or Archive/ST-09 first). A Draft or Scheduled survey does not block — it's pulled in for editing instead.
- A course where every unit has been deselected (identical treatment to "no template assigned") — the Admin needs to uncheck the course instead.
- A course whose assigned template has only faculty roles and no faculty person assigned — would produce an empty evaluation, so the course cannot proceed.

### Doesn't block
- A faculty gap (missing instructor and/or coordinator) is informational only — the Admin still receives a warning on advancing, but the wizard proceeds regardless.

### Open items (unresolved in the PRD itself — not decided here)
1. Deep-link/refresh into this step's URL with an empty course set carried over — redirect, empty state, or something else. Likely applies to every step, Step 1–4. **Owner: Engineering.**
2. Whether any in-progress state (carried-over courses, other rows' assigned templates) survives the round trip to create a new template and back, or is lost. **Owner: Product.**
3. The Draft-resume validity check covers only the template's publish status, not whether the course's own type has changed since the Draft was saved (e.g. reclassified in PRISM) — whether this should be checked, and treated like an unpublished template if so, is unspecified. **Owner: Product.**
4. If a Draft's selected course has since been deleted/descoped from PRISM entirely: (A) silently drop the row with a notification of how many/why; (B) keep the row visible but marked unavailable, blocking progress until deselected; (C) fail the Draft resume outright, directing the Admin to start new. **Owner: Product.**

---

## 2. Confirmed-vs-current gap table

The shipped Step 2 (`step-survey-instances.tsx`, promoted 2026-07-27 as the "Briefing" variant of `/compare/push-survey-design`, per that file's own header comment) plus its duplicate/gap engine (`lib/pce-push-validation.ts`) already implement a mature, working step — but several ST-02 rules are not new UI on top of it; they change what the shipped code does.

| # | Gap | Class | Shipped reference | ST-02 requirement |
|---|---|---|---|---|
| 1 | Duplicate key changes from person-grain to role-grain | **Rule change** | `coversInstance()`, `pce-push-validation.ts:162-184` — key = `offering + criterion + personName` | Key = `offering + role coverage`, independent of which person holds the role |
| 2 | Duplicate handling changes from soft to hard | **Rule change** | "N evaluations already exist" info section, per-row "Evaluate again" `ToggleSwitch` defaulting off, `step-survey-instances.tsx:409-484` (Jul 27 UC4 soft-warning decision) | Role-overlap against Live/Closed/Results Available/Archived is a hard block — no toggle, no proceeding, until the other survey is cancelled/archived. **Confirmed superseding the toggle for these four statuses** (Draft/Scheduled keep the separate edit-in-place path, also not the toggle). |
| 3 | Draft/Scheduled "pull in for editing" doesn't exist | **New mechanism** | `pushSurveyBatch()`, `pce-state.tsx:531-639` — always creates new `PceSurvey` records | Loading an existing survey's saved config into Step 2/3 and updating it in place on finish |
| 4 | Survey status vocabulary mismatch | **Vocabulary/data-model gap** | `SurveyStatus = draft \| scheduled \| active \| collecting \| pending_review \| released \| closed` (`pce-mock-data.ts:1`) — no `archived` value for surveys at all; "Live" split across two values; "Results Available" has no literal match (`released` is closest) | Draft / Scheduled / Live / Closed / Results Available / Archived — six flat states |
| 5 | Auto Update flag + PRISM refresh is greenfield | **New mechanism** | No toggle/flag/manual-refresh exists; only the precedent that readiness data is always live-derived (`pce-course-readiness.ts:1-9`) | Persisted global flag gating what a manual refresh does to brand-new units only |
| 6 | Auto-assign ignores `isDefaultForType` | **Rule gap** | `autoAssignTemplates()`, `app/(app)/surveys/push/page.tsx:56-80` — matches on `courseType` only | ST-02's wording implies auto-assign only applies when exactly one template exists per type; worth confirming whether a tie should surface as "none available" or use `isDefaultForType` |
| 7 | Unit-selection state model differs | **New mechanism** | `included` Set is instance-level and re-derived off `planSig` whenever the instance plan changes (`step-survey-instances.tsx:207-236`) | Persisted, sticky per-unit Admin decisions that survive refresh and Save as Draft, distinguishing "never touched" from "Admin selected/deselected" |
| 8 | Preview Survey not wired into the wizard | **New wiring** | Full-fidelity preview exists at `/surveys/[id]/preview` (labelled "ST-12" in its own header) and a lighter `survey-preview-dialog.tsx`; neither is a Step-2 row action today | Per-row "Preview Survey" action, live against the row's current (possibly unsaved) assignment |
| 9 | "Save as Draft" for the push wizard doesn't exist | **New mechanism** | `pushSurveyBatch` only ever creates `scheduled`/`collecting` surveys on final submit; no resume-a-draft-wizard path | Draft persists Auto Update flag + assignments + unit selections; restored on resume |
| 10 | Template publish-status vocabulary mismatch | **Vocabulary/data-model gap** | `PceTemplate.status: 'active' \| 'draft'` ("Approved"/"Draft" in the templates hub) — no "archived" template status | Published / Unpublished / Archived |

---

## 3. Resolved decisions

- **ST-02 supersedes the Jul 27 Briefing duplicate-toggle model** for surveys in Live, Closed, Results Available, or Archived status: those become a hard block with no "Evaluate again" toggle. Draft and Scheduled surveys are excluded from this block entirely and instead route through the new edit-in-place resume path (§1, Draft and Scheduled resume) — they were never part of the toggle model either way.
- This decision is binding for the next implementation pass on `pce-push-validation.ts` and `step-survey-instances.tsx`.

---

## 4. Next deliverable

An implementation/execution plan is the explicit next step, out of scope for this document. It will need to touch, at minimum:
- `lib/pce-push-validation.ts` — re-architect the duplicate key from person-grain to role-grain, add the hard-block path, and add the Draft/Scheduled resume-for-editing path.
- `lib/pce-mock-data.ts` — reconcile the `SurveyStatus` and `PceTemplate.status` enums against ST-02's six/three-state vocabularies (gaps #4, #10).
- `components/pce/courses-evaluatees/step-survey-instances.tsx` — new Auto Update toggle + manual refresh control, sticky per-unit selection state, per-row Preview Survey action, and the role-overlap hard-block UI (replacing the "Evaluate again" toggle for the four blocked statuses).
- `components/pce/pce-state.tsx` — Save-as-Draft persistence for the wizard (currently `pushSurveyBatch` only creates final records) and Draft-resume loading.
- The four PRD open items (§1) remain unresolved and need Product/Engineering decisions before or during that implementation pass, not assumed.

---

## 5. Addendum — Granola cross-reference with David (added 2026-08-03, post-implementation-plan)

Two raw transcripts pulled directly (per the "always raw, never summaries" rule) to check whether ST-02 already covers gaps David raised in prior meetings:

**Jul 24 meeting** (`granola:10d48960-e5e8-4346-98cb-820bf2db1415`, "Survey evaluation workflow — step separation and duplicate detection") — the meeting that originally defined the shipped soft-warning duplicate model. Counterpart in the transcript is unlabeled ("Them" — not confirmed by name as David; vault frontmatter lists only Romit Soley as attendee). Key quote: soft warning was chosen **explicitly because** "hard block... risks a P0 support ticket if a legitimate re-evaluation is needed... it's an irreversible action" — and the re-evaluation use case was flagged as needing validation with Vishaka, "deferred; soft warning is safe default pending broader user research." ST-02's hard block for four statuses directly reverses this reasoning. Already confirmed by Romit as an intentional supersession (§3) — noted here as a reversal of a deliberate, reasoned tradeoff, not a fresh concern, in case the original P0 risk is worth re-raising with Vishaka before Phase 1 ships.

**Jul 28 "Post-Course Survey Cadence" meeting** (`granola:f2964952-3020-4acb-9f42-4275637b6157`, David + Vishaka + Monil + Vishal present — distinct from the same-dated `2026-07-28-course-eval-sync-up.md` vault note, which only lists Romit). Three points David raised that **ST-02 still does not address**:

1. **Multi-component courses.** A live-screen walkthrough surfaced a real customer case (nursing program: one course with classroom + lab + practice/rotation components simultaneously) that the template's course-type selector can't handle today (single-select, needs multi-select per David/Vishaka's on-screen feedback). ST-02 still assumes one course = one type = one template — no provision for a course spanning multiple simultaneous components. Not covered.
2. **"Mark as default for this course type" toggle.** Both David and Vishaka were confused by it live, unprompted ("I'm so confused as to what that would do for the user" — David; "I didn't know what this will do for me" — Vishaka), and suggested removing it from template creation entirely or moving default-selection to the templates-list level instead. ST-02's auto-assign wording ("if there is one template... for the given course type") still leaves the multi-template-per-type case unspecified — this is the same unresolved point as gap #6 / implementation-plan decision #2 (`isDefaultForType` tie-break), now confirmed as a previously-raised, still-open UX problem rather than a new one.
3. **Course Director question scope.** Open question — do Course Director questions cover course management or personal teaching quality? David and Monil explicitly deferred ("we should think about it... have a follow-up discussion"), no resolution reached. ST-02 doesn't touch this.

Consistent / not new gaps: the Jul 28 call confirmed the evaluatee-role list (Course, Instructor, Course Coordinator/Director, Lab Instructor; TA and Guest Lecturer out of scope/deferred) and that DCE evaluation stays out of PCE scope (annual survey, not course-tied) — both align with ST-02's evaluatee-unit model, no conflict.
