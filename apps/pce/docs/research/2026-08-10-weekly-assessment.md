---
type: weekly-assessment
date: 2026-08-10
range: 2026-08-04 to 2026-08-10
products: [pce]
agent: granola-deep-assessment
---

# Weekly Design Assessment — Aug 4–10, 2026

---

## Meetings analysed

| Title | Date | Granola ID | Included | Directives |
|---|---|---|---|---|
| Step two design — template selection, aspect deduplication, and auto-update logic | Aug 4 | 5f6c8679 | ✅ | 11 |
| Course Eval sync up (Mona) | Aug 6 | 182b0d8a | ✅ | 7 |
| Astrology consultation — career, finances, relationships, and health remedies | Aug 8 | 00878afc | ❌ SKIP | Personal |
| 👋 The UX Chats: Team Meet | Aug 6 | 0d10a701 | ❌ SKIP | Non-Exxat community (external participants only) |
| 👋 The UX Chats: Team Meet | Aug 4 | f3781a92 | ❌ SKIP | Non-Exxat community (external participants only) |

**Total included: 2 meetings | Total directives: 18 | Code-applicable directives: 1 (already correct)**

---

## Five-pass analysis summary

### Meeting 1 — Aug 4: Step 2 design (Monil + Romit)

**Pass 1 — Physical layout**
- Human vs. non-human aspect categories must be visually separated in Step 2 table
- Aspect chip deselection affordance (click to deselect hard-blocked duplicates)
- Auto-update OFF state: deselected/greyed rows for excluded Prism faculty visible inline

**Pass 2 — Scope changes**
- Hard block: same aspect cannot be evaluated twice for same course-term (even if Scheduled state)
- Template switch in Step 2 = system asks Override vs. New Survey — not a silent switch
- Auto-update ON: roster refreshes at go-live date; OFF: frozen at Step 2 completion
- Draft retrieval and term-card re-entry: DEFERRED explicitly by Monil

**Pass 3 — Missing data fields**
- Admin needs to see excluded Prism faculty when auto-update is OFF ("Doctor Y is deselected")
- Dashboard/list view: notification when Prism faculty exist but are not in evaluation (proposed by Romit, aligned by Monil)

**Pass 4 — Killed / deferred**
- Draft retrieval scenario (D_PCE_0804_09): explicitly deferred — "I think you don't have to design this scenario"
- Term card re-entry point for dropped-off flows (D_PCE_0804_10): explicitly deferred

**Pass 5 — Code cross-reference**
All 11 directives target the not-yet-built Step 2 of the T129 wizard. `surveys/push/page.tsx` is the pre-T129 legacy 3-step flow. No existing screen file is the right target for any of these directives. Tasks T141–T148 already added to backlog.

---

### Meeting 2 — Aug 6: Course eval sync up (Mona + Romit)

**Pass 1 — Physical layout**
- Role-level toggle: on/off at role level only (not per-person); summary count of personas is acceptable
- Newly added Prism faculty: inline within the evaluatee column of the existing course row — not as separate horizontal cards above the table
- Primary view: Course Material + Instructor only; rare roles hidden behind "+" or "see more"

**Pass 2 — Scope changes**
- Template change restricted to first selection step only; inline row-level switch killed
- 80% rule: design for course material + instructor; other N faculty roles = overflow pattern
- Cancel evaluation: not in wizard — only at "view survey list"

**Pass 3 — Missing data fields**
- No new missing data fields identified beyond what Aug 4 meeting established

**Pass 4 — Killed / deferred**
- Inline template switching at row level: killed ("This is too complex for user")
- Faculty profile images in setup wizard: killed ("avoid using images because some of the faculties might not have images uploaded")
- Cancel CTA inside wizard: not to be built ("they have to go to view survey list and there they can cancel")

**Pass 5 — Code cross-reference**
- Template change confirmation dialog: not in code — future T129 spec (T151)
- Role-level toggle: not in code — future T129 spec (T149)
- Newly added faculty inline: not in code — future T129 spec (T152, supplements T134)
- 80% rule overflow pattern: not in code — future T129 spec (T153)
- No cancel in wizard: not in code — carry-forward spec for T129 (T155)
- Faculty names only (no images): ✅ ALREADY CORRECT — `pce-modals.tsx` uses `AvatarFallback` with initials; no photo-based display exists in production code (D_PCE_0806_06)

---

## Change inventory

### WILL APPLY (safe, unambiguous)

_None this week._ All directives target the not-yet-built T129 setup evaluations wizard. Both meeting notes files were already filed by the daily sync routine before this weekly run; backlog tasks T141–T155 are already entered.

---

### NEEDS REVIEW (complex, needs Romit's judgment)

| # | Directive | Product | Why flagged | Suggested approach | Source quote |
|---|---|---|---|---|---|
| NR-01 | Step 2: Human vs. non-human aspect visual separation | PCE | New screen component — no existing file to edit; requires design of two-category table layout | Two visual groups in Step 2 table: (A) non-person (Course Content, General) — no further action once template assigned; (B) person/faculty — show faculty assignment states | "I would force you to also think from a human and non-human aspect separately." (Monil, Aug 4) |
| NR-02 | Step 2: Template switch prompt — Override vs. New Survey | PCE | Cannot implement without knowing the dialog wording and state management for dual-path decision | Dialog on template re-select for same course: "(A) Override — replace survey; (B) New Survey — add independent one." | "If you switch template a new survey would be created based on new template." (Monil, Aug 4) |
| NR-03 | Step 2: Hard-blocked duplicate aspect + deselection affordance | PCE | New interaction pattern — aspect chip greyed, deselection click required; distinct from T130 soft warning | Blocked aspect chip: deselected by default, with message ("already being evaluated — deselect to proceed"). Click confirms deselection. | "You cannot system cannot select course content that's what I'm seeing this is the hard block." (Monil, Aug 4) |
| NR-04 | Step 2: Auto-update toggle ON/OFF + excluded-faculty display | PCE | Two distinct states require separate design treatment; excluded-faculty rows are new UI pattern | ON: label communicating roster refreshes at go-live. OFF: show excluded Prism faculty as deselected rows in table. | "You will have to show in the UI that Doctor Y is… is deselected." (Monil, Aug 4) |
| NR-05 | Step 2: Manual Prism data refresh button | PCE | New affordance — button placement and loading feedback need design direction | Button at top of Step 2; pulls latest Prism faculty associations. Demo: simulates pull. | "Right now you can propose a manual refresh button on the top." (Monil, Aug 4) |
| NR-06 | Step 2: Empty state for person aspect with no Prism faculty | PCE | Two-state design needed (empty + populated) — no existing pattern in production code | "No person assigned" + "Assign faculty" CTA (navigates to Prism). After assign + refresh: names appear. | (From T129 spec — both states must be designed) |
| NR-07 | Dashboard/list: excluded-Prism-faculty notification | PCE | New surface outside of Step 2 — requires design exploration before any code | Indicator in dashboard or course list view when faculty exist in Prism but are not in evaluation. | "It's a good idea to show somewhere outside also." (Monil, Aug 4) |
| NR-08 | Step 2: Role-level toggle (not person-level) | PCE | Core interaction pattern for T129 Step 2 — toggle logic and summary display need design direction | Toggle at role level; summary count ("2 instructors") acceptable; no individual name display at toggle level | "That toggle Romit would be only on the roll level." (Mona, Aug 6) |
| NR-09 | Step 2: Template change confirmation dialog (first step only) | PCE | New dialog — wording and trigger conditions need to be designed and implemented in T129 | Dialog on template change: "Are you sure? All evaluatees will be updated." Cannot be silent. | "You will give a dialogue that are you sure you want to change the template." (Mona, Aug 6) |
| NR-10 | Step 2: Newly added faculty inline in evaluatee column | PCE | Supplements T134 — inline placement within existing course row requires layout design | New Prism-sync faculty appear as rows in the evaluatee column of their course, not as separate horizontal cards above the table | "Think of a solution in the table itself… show newly added evaluities on that evaluity column itself." (Mona, Aug 6) |
| NR-11 | Step 2: 80% rule — course material + instructor primary; overflow for rare roles | PCE | New overflow pattern — requires design of "+" / "see more" affordance | Default view: Course Material + Instructor only. Additional roles: hidden behind overflow control. Design overflow pattern. | "80% of our users will run course evaluation to evaluate the following: Course material and instructor. For rest of them it is like a plus button or see more." (Mona, Aug 6) |

---

### ALREADY DONE (directive found, code already correct)

| # | Directive | Product | File | Confirmed correct |
|---|---|---|---|---|
| AD-01 | Faculty display: names only, no profile images in setup wizard | PCE | `apps/pce/admin/components/pce/pce-modals.tsx` | `AvatarFallback` with initials only — no `AvatarImage` photo sources in production code. Image-based display was Lovable prototype only. ✅ D_PCE_0806_06 |

---

### BLOCKED (needs PM/Vishaka alignment first)

| # | Directive | Product | What's blocking |
|---|---|---|---|
| BL-01 | Dashboard / list view — excluded-Prism-faculty notification (T148) | PCE | Romit design exploration required before any code. No PM specification on surface or trigger. "It's a good idea to show somewhere outside also" is alignment only, not a spec. |
| BL-02 | Draft retrieval (D_PCE_0804_09) | PCE | Explicitly deferred by Monil Aug 4: "I think you don't have to design this scenario… this is for later purpose." No action until reactivated. |
| BL-03 | Term card re-entry to resume dropped-off setup flow (D_PCE_0804_10) | PCE | Explicitly deferred by Monil Aug 4: "for later purpose." No action until reactivated. |

---

## Pre-filing note

Both meeting notes were already created by a prior daily sync run before this weekly assessment:

- `apps/pce/docs/research/meetings/2026-08-04-step2-template-aspect-deduplication-autoupdate.md` ✅
- `apps/pce/docs/research/meetings/2026-08-06-course-eval-sync-up-mona.md` ✅

Backlog tasks T141–T155 already appended to `apps/pce/docs/workflows/_backlog.md` ✅

No additional doc updates or backlog additions are needed from this run.

---

## Weekly Assessment Complete — 2026-08-10

### Summary

| Metric | Count |
|---|---|
| Meetings analysed | 2 |
| Meetings skipped (personal / non-Exxat) | 3 |
| Directives found | 18 |
| Changes applied this run | 0 |
| Flagged for Romit's review | 11 |
| Already correct in code | 1 |
| Blocked (needs alignment) | 3 |

### Changes applied

None this run. All directives target the not-yet-built T129 wizard. No existing screen file required surgical changes.

### Needs Romit's review (Step 2 design priorities)

Highest priority items for T129 implementation:

1. **NR-08** (role-level toggle) + **NR-11** (80% overflow pattern) — core Step 2 UX shape; must be designed before any Step 2 code is written
2. **NR-03** (hard-blocked duplicate aspect + deselection chip) — distinct from T130 soft warning; design both states before engineering picks up T129
3. **NR-04** (auto-update ON/OFF states + excluded-faculty rows) — requires design of both toggle states and the excluded-faculty row indicator
4. **NR-01** (human vs. non-human aspect visual separation) — affects overall table structure
5. **NR-09** (template change confirmation dialog at first selection step) — new dialog, must be designed

### Blocked (needs alignment before proceeding)

- T148 (excluded-faculty dashboard notification) — Romit design exploration first
- D_PCE_0804_09 / D_PCE_0804_10 (draft retrieval + term-card re-entry) — explicitly deferred by Monil; await reactivation
