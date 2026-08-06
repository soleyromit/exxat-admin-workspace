# Step 2 "Survey Design" — Scenario Redesign: Flow, Journey, Feature & Interaction Spec

- **Date:** 2026-08-04
- **Author:** Romit Soley (Product Designer II) · drafted on Claude Sonnet 5
- **Product:** PCE · `apps/pce/admin` · push wizard, Step 2 (`components/pce/courses-evaluatees/step-survey-instances.tsx`)
- **Status:** Design spec — for review with PM tomorrow (2026-08-05). Not yet built.
- **Source:** Raw Granola transcripts — "Step two design — template selection, aspect deduplication, and auto-update logic with Romit" (2026-08-04, primary), "Survey evaluation workflow — step separation and duplicate detection" (2026-07-24, superseded decision noted below), "Exact Prism evaluation setup — UX feedback and workflow refinement" (2026-07-31, referenced but out of scope — see §6).
- **Depends on / builds on:** `2026-08-03-step2-survey-design-faculty-coverage-gap-analysis.md`, `2026-08-03-step2-survey-design-implementation-plan.md` — this doc extends that implementation with five scenarios the Aug 4 call surfaced which are not yet covered by the shipped Action-column/Status/Preview redesign.
- **Design protocol:** Gate 1 (this doc) → Mobbin references before JSX → `ds-adoption-reviewer` before any new component file → Gate 2 (`ds-conformance-reviewer`, `state-review`, `verification-reviewer`) before claiming any of this built.

---

## 0. Why this doc exists

Today's stakeholder call locked five requirement threads for Step 2 that the current shipped design (Action column, compact Status badge, inline Preview) doesn't cover. One of them (S2) requires relaxing a documented data-model invariant, not just new UI. This doc is the scenario-by-scenario spec — flow, journey, UI, interaction — for what to design and show in tomorrow's review, scoped per the decisions confirmed with Romit (§0.1).

### 0.1 Scope confirmed for this doc

| Scenario | In scope for tomorrow | Depth |
|---|---|---|
| S1 — Human vs. non-human aspect split | ✅ | Full |
| S2 — Override vs. Create-new-survey | ✅ | **Full**, including the resulting two-row coexisting-survey table state |
| S3 — Edit-existing-template escape hatch | ✅ | Full |
| S4 — Auto Update "deselected but in Prism" visibility | ✅ | Full |
| S5 — Draft/term-card resume | ⚠️ Correction only | Not a design task — flag to PM that it's mostly already built |
| S6 — Jul 31 pre-Step-2 visibility / terminology feedback | ❌ Excluded | Parked as a separate future review |

### 0.2 One decision reversal to flag in review

**Jul 24 call ("final decision" at the time):** duplicate-aspect re-evaluation = **soft warning**, reversible — PM's stated reasoning was that a hard block risks P0 support tickets if the assumption turns out wrong.

**Aug 4 call (today, reviewed with Vishaka + David):** duplicate-aspect re-evaluation = **hard block**, non-negotiable — "you cannot evaluate them."

The current shipped code already implements the hard-block direction (`roleOverlapConflicts()`, `lib/pce-push-validation.ts:250-274`; `gate.reasons.length > 0` fully blocks Continue). **No design work needed here** — just surface to the PM in review that the earlier soft-warning call was consciously overturned today, so it reads as confirmation, not silent rework.

---

## 1. Revised user flow (Step 2 only)

```
Step 1 (Courses & Students)
        │
        ▼
┌───────────────────────── Step 2 — Survey Design ─────────────────────────┐
│                                                                            │
│  For each selected course:                                               │
│                                                                            │
│   ┌─ Template assigned? ──No──▶ Assign template (Select)                 │
│   │        │ Yes                                                          │
│   │        ▼                                                              │
│   │  Offering already has a Scheduled/Draft survey                        │
│   │  under a DIFFERENT template?                                          │
│   │        │ Yes                              │ No                        │
│   │        ▼                                  ▼                           │
│   │  AlertDialog — S2                    Proceed (current, shipped)       │
│   │  "Override" vs "Create new"                                           │
│   │        │                    │                                         │
│   │   Override              Create new                                    │
│   │        │                    │                                         │
│   │        ▼                    ▼                                         │
│   │  Replace T1 in place   T1 unchanged + new sub-row for T2               │
│   │  (shipped behavior)    Overlapping aspect → hard-block (shipped)      │
│   │                        + "Edit existing template" escape hatch — S3   │
│   │        │                    │                                         │
│   │        └────────┬───────────┘                                         │
│   │                 ▼                                                     │
│   │  Aspects render, split human / non-human — S1                        │
│   │                 │                                                     │
│   │        ┌────────┴────────┐                                           │
│   │        ▼                 ▼                                           │
│   │  Non-human aspect   Human aspect                                     │
│   │  (Course content)   │                                                │
│   │  → no action ever   ▼                                                │
│   │               No person in Prism? ──▶ Action: "Assign {role}" (shipped)
│   │                     │ Has person(s)                                   │
│   │                     ▼                                                 │
│   │               In Prism but deselected                                 │
│   │               from THIS survey? — S4                                 │
│   │                     │ Yes            │ No                             │
│   │                     ▼                ▼                                │
│   │               New "excluded"     Included (shipped avatar)            │
│   │               visual state                                           │
│   │                                                                       │
│   └──────────────────────────────┬────────────────────────────────────  │
│                                   ▼                                       │
│                          Continue → Step 3 (Communication)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. S1 — Human vs. non-human aspect split

> **Source quote (Aug 4):** "there are two type of aspects. One is non-person aspect which can be course or general. And then there would be a real human aspect... I would force you to also think from a human and non-human aspect separately, so that the next information where user needs to take action can also be intuitively filled."

### Journey
Admin assigns a template → sees the course's aspects render → immediately understands which ones are "already handled" (course content, no person needed, ever) vs. "need a decision" (a role, may or may not have a person yet) — without reading Status text.

### Current gap
`EvaluateesPickerCell` (`step-survey-instances.tsx:363+`) renders course-material and person avatars in one flat row. Nothing distinguishes "structurally can't need action" from "might need action."

### UI — before / after

```
BEFORE (shipped today)                         AFTER — S1 split
┌────────────────────────┐                     ┌────────────────────────────────┐
│ Evaluatees              │                     │ Evaluatees                      │
│ [📖][👤][👤+1]          │                     │  Course content  📖              │
└────────────────────────┘                     │  ─────────────────────────────  │
  one flat avatar rail,                        │  People needed   [👤][👤+1]      │
  no grouping                                  └────────────────────────────────┘
                                                  two visually distinct rows —
                                                  non-human aspect is its own
                                                  static line, human aspects
                                                  keep the avatar-rail pattern
```

### Interaction
- No new interaction — this is purely a rendering split inside the existing `EvaluateesPickerCell`. The Popover+Command picker (`step-survey-instances.tsx:363+`) still opens the same way; only the resting-state avatar rail changes shape.
- Non-human aspect row (Course content, General) is never clickable — no popover, since there's nothing to assign. Render as a static line with the book icon, matching the existing `fa-book-open` decorative pattern already used in `EvaluateeAvatar` (`step-survey-instances.tsx:342-350`).
- Human aspect row keeps today's avatar-rail + Popover interaction unchanged.

### Component notes
Reuses `EvaluateeAvatar`, `AvatarGroup`/`AvatarGroupCount` — no new DS component. Split is a template-level grouping done once per row: partition `templateCriteria(template)` into `scope === 'course'` vs. person-scoped, per the existing `SurveyInstance.scope` field (`lib/pce-push-validation.ts:201-220`).

---

## 3. S2 — Override vs. Create-new-survey (full design)

> **Source quote (Aug 4):** "There can be two scenarios right... you want to override this... or you want to create a new survey... both coexist." Confirmed after Romit pushed back on confusing "duplicate" messaging for a not-yet-live (Scheduled) survey — PM conceded the point and clarified the real fork is Override vs. New Survey, not a blanket duplicate label.

### Journey

1. Course 101 already has a **Scheduled** survey via **T1** (Course content + Instructor).
2. Admin reopens Step 2 for this term, sees T1 already assigned, decides to reassign the Template select to **T2** (Course content + Course Coordinator) — for one of two reasons:
   - *"I picked the wrong template"* → wants a literal correction (Override).
   - *"I also want to evaluate Course Coordinator now"* → wants to keep the existing survey AND add new coverage (Create new survey).
3. System can't tell which the admin means from the Select change alone — it asks.

### Data model note (not this doc's deliverable, but must be flagged in review)

This scenario means a course offering can legitimately carry **two coexisting Scheduled surveys** under different templates — which `draftOrScheduledMatch()` (`lib/pce-push-validation.ts:282-291`) currently documents as "should ever exist... if more than one turns up, that's a fixture bug." Reconciliation approach (validated in architecture review, for engineering to scope separately):

- Relax the invariant to **one Draft/Scheduled survey per (offering, template)**, not per offering.
- `templateAssignments: Record<offeringId, string>` → `Record<offeringId, string[]>`; `gatesByOffering` keys become `${offeringId}|${templateId}`.
- `expandInstances()` stays single-template — called once per templateId in the offering's array, results merged.
- `draftOrScheduledMatch` → `.filter()` not `.find()`; resume hydration (`page.tsx:390-503`) needs multi-match handling.
- **This is real engineering scope, not absorbed silently into "a Step 2 redesign."** Present the mockups below as target state; flag the data layer as a follow-up scoping conversation.

### UI — the AlertDialog moment

```
Admin changes Template select on a row with an existing Scheduled survey:

┌──────────────────────────────────────────────────────────┐
│  DPT-101   Human Anatomy & Kinesiology                     │
│  Template: [ Midterm Coordinator Eval        ▾ ]  ← just changed
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
        ╔═══════════════════════════════════════════════╗
        ║  Change template for DPT-101?                   ║
        ║                                                 ║
        ║  This course already has a survey scheduled     ║
        ║  using "End-of-Term Evaluation"                 ║
        ║  (Course content, Instructor).                  ║
        ║                                                 ║
        ║  ○ Replace the existing survey                  ║
        ║    The scheduled survey is replaced entirely     ║
        ║    with this template. Nothing sends twice.      ║
        ║                                                 ║
        ║  ○ Keep both — create a new survey               ║
        ║    The existing survey stays scheduled as-is.    ║
        ║    A second survey is set up from this           ║
        ║    template for anything it covers that the      ║
        ║    first one doesn't.                            ║
        ║                                                 ║
        ║              [ Cancel ]   [ Continue ]           ║
        ╚═══════════════════════════════════════════════╝
```

- Radio-style choice (not two competing buttons) so the decision reads as one question with two answers, not two destructive actions to pick between — matches `AlertDialog` composition already used for "Reset all templates to defaults?" (`step-survey-instances.tsx:1122-1148`), extended with radio content instead of plain copy.
- Triggered synchronously inside `onTemplateChange` (`page.tsx:1006-1007`) — the new template value is held pending until the admin picks an option; dismissing (Cancel/Escape) reverts the Select to its previous value so nothing half-applies.
- **Never shown** when there's no existing Scheduled/Draft survey for the offering (today's default path, unchanged) — this is strictly additive to the conflict case.

### UI — the resulting coexisting-row state (after "Keep both")

```
▾ DPT-101  Human Anatomy & Kinesiology         Classroom          — Scheduled ×2
  ├─ End-of-Term Evaluation          👁   Course content 📖 · Dr. Chen 👤   ✅ Ready      —
  └─ Midterm Coordinator Eval        👁   Course content 📖 (blocked) · Dr. Lee 👤  🟡 Gap   [+ Assign Coordinator]
       ⓘ Course content already covered by "End-of-Term Evaluation" (scheduled).
         [Edit that template to add Course Coordinator instead →]   ← S3 escape hatch
```

- Nests as two sub-rows under one collapsible course header — reuses the existing `Collapsible`/`CollapsibleTrigger` chevron pattern already in this file (`step-survey-instances.tsx:919-965`) for the overlap-disclosure case, rather than inventing a new nesting pattern.
- Each sub-row is independently a full row: own Template cell (with its own inline Preview icon, per the shipped design), own Evaluatees/Status/Action cells.
- The course-level checkbox (top of the collapsible header) controls course removal from the push entirely — **not** either sub-row's unit selection. Each sub-row's own row content owns its own unit-level selection state, resolving the checkbox-semantics conflation the architecture review flagged.
- The blocked aspect (Course content, on the T2 sub-row) shows the same hard-block treatment already shipped (`ListHubStatusBadge` "Blocked" + Tip detail) — plus a new inline note directly under it linking to S3's escape hatch, since this is the moment the admin most needs that option.

---

## 4. S3 — Edit-existing-template escape hatch

> **Source quote (Aug 4, PM agreed):** "why aren't we giving them the access of existing template where they can add a new aspect... that's a good approach we can take instead of having a separate template."

### Journey
From the blocked-aspect state (either the Status tooltip on a single-template row, or the new note in S2's coexisting-row state), the admin realizes the "cleaner" fix is adding the missing aspect to the ALREADY-scheduled template, instead of running two templates. They click through, land on the template editor, and come back.

### Constraint (from Jul 31 transcript, still binding)
Admins should be able to add/remove **people** inline during setup, but not edit template **questions** inline. Confirmed via code: a **published** template has no in-place edit — the only path is Unpublish → edit → Republish (`components/pce/template-editor.tsx:1744-1761`). So this escape hatch is honestly a bigger action than "quick add" — it needs to say so.

### UI — the escape-hatch link and its consequence

```
Status tooltip (single-template row, shipped) or S2's coexisting-row note:
  "Course content already covered by 'End-of-Term Evaluation' (scheduled).
   [Edit that template to add Course Coordinator instead →]"
                              │
                              ▼
        ╔═══════════════════════════════════════════════╗
        ║  ⚠ This will unpublish "End-of-Term Evaluation" ║
        ║                                                 ║
        ║  This template is used by 6 other scheduled     ║
        ║  surveys across your courses. Unpublishing it    ║
        ║  to add Course Coordinator will pause all of     ║
        ║  them until you republish.                       ║
        ║                                                 ║
        ║        [ Cancel ]   [ Unpublish & edit ]         ║
        ╚═══════════════════════════════════════════════╝
                              │
                              ▼
              → navigates to Template Editor,
                pre-scrolled to the aspect list,
                "Add aspect" affordance highlighted
                              │
                    (admin adds Course Coordinator,
                     republishes)
                              │
                              ▼
              → returns to Step 2, wizard state
                preserved, template-drift notice
                shown on the affected row (existing
                LocalBanner pattern from the
                Draft-resume flow, page.tsx:462-475)
```

- The "N other scheduled surveys" count is a real, honest consequence check — not a generic warning. Needs a lookup of how many currently-Scheduled/Live surveys reference this templateId before showing the count.
- This is a bigger interruption than S2's dialog on purpose — republishing a live template is a wider-blast-radius action than choosing Override/New-survey for one course, and the UI should not undersell that.

---

## 5. S4 — Auto Update: visible "in Prism, excluded from this distribution" state

> **Source quote (Aug 4):** "how do we show this user scenario in the screen so that user knows that only David is evaluating, there is another person called John but is not being evaluated."

### Journey
Auto Update is OFF for a course. Admin scheduled the survey with only Dr. David as instructor. Days later, someone adds Dr. John as a second instructor in Prism. Because Auto Update is off, John is silently NOT part of the scheduled survey — today, nothing in Step 2 shows this. The admin needs to see it without having to already know to look.

### Good news — no data-model change needed
`unitSelections: Record<key, 'selected'|'deselected'>` (`lib/pce-push-validation.ts:300-301`) already distinguishes "never seen this unit" from "explicitly deselected though present in Prism" — `reconcileUnitsOnRefresh()` (`lib/pce-push-validation.ts:317-331`) already implements the correct non-destructive Refresh semantics. **The gap is purely visual** — there's no rendering today for a `fresh` instance whose `unitSelections[key] === 'deselected'`.

### UI — the new excluded state

```
BEFORE (today — John is invisible)              AFTER — S4
┌────────────────────────┐                      ┌──────────────────────────────┐
│ Evaluatees               │                      │ Evaluatees                     │
│  People needed [David]   │                      │  People needed                 │
└────────────────────────┘                      │   [David] [John ⊘]              │
                                                  │           ↑                    │
                                                  │   muted / struck-through        │
                                                  │   avatar ring, distinct from     │
                                                  │   the dashed "gap" indicator     │
                                                  └──────────────────────────────┘
                                                    Tip on hover/focus: "In Prism,
                                                    not part of this survey (Auto
                                                    Update is off). Click to include."
```

- Visually distinct from BOTH the solid "included" avatar and the dashed-circle "gap" indicator already shipped — a third state needs its own treatment (e.g. reduced-opacity avatar with a small ⊘/slash badge), not reuse of either existing glyph, so it doesn't get misread as "assigned" or "needs a person."
- Clicking it opens the same `EvaluateesPickerCell` popover already shipped, where the person shows as an unchecked-but-present row (`unitSelections[key]` flips to `'selected'` on check) — no new interaction pattern, just a new resting-state avatar.
- Action column: a course with ONLY excluded-not-gap people (no true gaps) doesn't need a new Action-column state — "Assign" is for gaps (nobody in the role yet); this is "somebody exists but isn't included," a different, lower-urgency signal that lives in the Evaluatees column itself via the Tip, not the Action column.

### Noted, not designed here
Romit's follow-up point (PM agreed) that this needs visibility beyond Step 2 at scale (10+ courses/admin) — e.g. a dashboard/list-view surface — is a separate proposal for a later session, not blocking tomorrow's review.

---

## 6. S5 — Draft/term-card resume (correction, not a design task)

> **Source quote (Aug 4):** "you don't have to design this scenario... keep a note of this as a to-do item for later."

**Correction to raise in review:** this is already substantially built. `page.tsx:390-503` ("ST-02 Phase 3 — Draft/Scheduled resume") already pulls a matching Draft/Scheduled survey into the wizard for editing when the same course+term is reselected, including a template-drift notice if the template changed since the draft was saved (the same `LocalBanner` pattern referenced in §4 above).

**What's confirmed NOT wired:** every term-dashboard entry point (`admin/setup/page.tsx:625`, `directory/term/page.tsx:196`, `directory/courses/page.tsx:279,309`, `surveys/remind/page.tsx:250`) only passes `?term=<id>`, landing on Step 1 course selection — none deep-links straight into a specific in-progress draft. Worth correcting the PM's assumption rather than quietly re-scoping this as new design work.

---

## 7. Excluded from this doc — S6

Jul 31 raw transcript ("Exact Prism evaluation setup — UX feedback") surfaced real, repeated feedback — confusing "N evaluations across N courses" terminology, a need for pre-Step-2 visibility of already-configured courses, bulk-select restricted to unconfigured courses only, "evaluate again" copy reading as "re-send to students." All of it is genuine and unresolved. **None of it was re-litigated in the Aug 4 call**, and per the scope decision confirmed with Romit, it is excluded from this doc entirely — parked as its own future review, not folded into tomorrow's Step 2 deliverable. Referenced here only so it isn't lost.

---

## 8. Verification

This is a design/spec deliverable — no code changes accompany it.

1. Review this doc with Romit before touching JSX — confirm the mockups above match intent for S1–S4, and that the §0.1 scope table still holds.
2. Mobbin pass for the AlertDialog radio-choice pattern (S2) and the muted/excluded avatar treatment (S4) before generating any component — per `feedback_mobbin_first`.
3. `ds-adoption-reviewer` before any new component file once building starts (the AlertDialog radio content and the coexisting-row nesting are the two candidates for genuinely new composition, not just prop changes to existing components).
4. Full Gate 2 (`ds-conformance-reviewer`, `state-review`, `verification-reviewer`) before any of this is claimed done, per the same discipline applied to the Action-column/Status/Preview work already shipped.
