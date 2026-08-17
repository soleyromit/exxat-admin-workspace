# Step 2 — Survey Design & Faculty Coverage (ST-02): Implementation Plan

- **Date:** 2026-08-03
- **Author:** Romit Soley (Product Designer II) · drafted on Claude Sonnet 5
- **Product:** PCE · `apps/pce/admin` · push wizard, Step 2
- **Status:** Implementation plan — sequencing + file-level scope; not yet built
- **Depends on:** `2026-08-03-step2-survey-design-faculty-coverage-gap-analysis.md` (requirements + gap table; read that first)
- **Design protocol:** each UI-touching phase below still owes Gate 1/Gate 2 of `docs/governance/design-review-protocol.md` (ds-adoption-reviewer before new components, ds-conformance-reviewer + state-review + verification-reviewer before claiming done) — not restated per-phase below, but not waived either.

---

## 0. Why this order

Four of the ten gaps are genuine **rule/architecture changes**, not additive UI (gap-analysis §2, items 1–2, and two more surfaced during this pass — see §0a). Building the UI before the data model underneath it is settled would mean re-deriving the UI twice. So this plan goes **data model → engine → state/persistence → UI**, in that order, with a decision gate before each phase that touches a rule the gap-analysis doc flagged as unresolved.

### 0a. Two additional dependencies found while planning (not in the gap-analysis doc)

- **ST-16 (Cancel survey) and ST-09 (Archive survey) don't exist yet.** Grepped `pce-state.tsx` and `surveys-table.tsx` for `cancelSurvey`/`archiveSurvey`/any Cancel or Archive row action — none exist. `PceState` only has `releaseSurvey`, `closeSurvey`, `enableResults`. ST-02's hard-block message tells the Admin to "cancel or archive the existing survey" — that resolution path has to exist before the block is anything more than a dead end. **This plan stubs minimal versions of both** (Phase 1) so Step 2's block is actually actionable; the full ST-16/ST-09 surfaces (their own dedicated UI, confirmation copy, etc.) are out of scope here and should be tracked as their own stories.
- **`isDefaultForType` vs. the "one template per type" auto-assign wording is ambiguous**, flagged as a decision in Phase 2, not assumed.

---

## Phase 0 — Status & publish-status vocabulary reconciliation

**Files:** `lib/pce-mock-data.ts` (`SurveyStatus`, `PceTemplate.status`), every read-site of both (`pce-push-validation.ts`, `pce-badges.tsx`, `surveys-table.tsx`, `templates-hub.tsx`, term-metrics/evaluations files).

**Decision needed before starting (Product/Romit):** ST-02 assumes six flat survey states (Draft/Scheduled/Live/Closed/Results Available/Archived) and three template states (Published/Unpublished/Archived). Today: `SurveyStatus = draft | scheduled | active | collecting | pending_review | released | closed` (no `archived`), `PceTemplate.status = active | draft` (no `archived`). Two ways to close this gap:
  - **(a) Add real new enum values** — `archived` to both `SurveyStatus` and `PceTemplate.status`; collapse the display-word mapping so `active`/`collecting` both read "Live" (already true via `OPEN_FLOW_WORD`, `pce-push-validation.ts:108-113`) and `released` reads "Results Available" (rename the display word only, not the underlying value, to avoid touching every `released` call site).
  - **(b) Keep the raw enum, add a derived "story status" mapping function** (`storyStatusOf(survey): 'draft'|'scheduled'|'live'|'closed'|'results_available'|'archived'`) that ST-02 logic reads, leaving the raw enum untouched everywhere else.
  - **Recommendation: (b)** — lower blast radius (7 existing `SurveyStatus`-typed call sites keep compiling unchanged), and the "archived" concept for a survey doesn't cleanly correspond to one raw status anyway (a `closed` survey becomes "archived" via an Admin action, not via time passing — see Phase 1's `archiveSurvey` stub). Templates get the same treatment: add `archived?: boolean` alongside existing `status: 'active'|'draft'` rather than expanding the union (fewer call-site breaks in `templates-hub.tsx`'s status filter).
- **Work:** add `storyStatusOf(survey: PceSurvey): StoryStatus` and `templateStoryStatusOf(t: PceTemplate): 'published'|'unpublished'|'archived'` to `pce-push-validation.ts` (or a new `lib/pce-story-status.ts` if it grows past a few lines). All ST-02 logic in later phases reads through these, never the raw `status` field directly.
- **Verification:** grep every new call site added in later phases to confirm none reads raw `.status`/`'active'` for an ST-02 decision — only through the new mapper.

---

## Phase 1 — Role-overlap (duplicate) engine re-architecture

**Files:** `lib/pce-push-validation.ts`, `lib/pce-course-readiness.ts` (read-only, `templateCriteria()` reused), `components/pce/pce-state.tsx` (new `cancelSurvey`/`archiveSurvey` stubs).

1. **New function `roleOverlapConflicts(offering, template, existingSurveys): RoleOverlapConflict[]`** — replaces the person-grain `coversInstance()` check for the ST-02 gate. For each existing survey on the same `offeringId` + term whose `storyStatusOf()` is `live|closed|results_available|archived`, compute its role coverage (reuse `templateCriteria()` against that survey's own `templateId`, falling back to its stamped `evalScope`/`evalRole` for legacy pre-split flows per the existing `coversInstance` legacy-flow handling, `pce-push-validation.ts:175-183`) and intersect with the new template's `templateCriteria()`. Any non-empty intersection → one `RoleOverlapConflict` entry per overlapping criterion, carrying the existing survey's id/status/dates for the accordion detail the UI notes describe (Evaluate?/Role/Assigned person(s)/Covered by columns).
2. **`draftOrScheduledMatch(offering, existingSurveys): PceSurvey | null`** — the same offering+term lookup but for `storyStatusOf() === 'draft'|'scheduled'`, returned separately since these never conflict and instead feed Phase 3's resume path. Only one such match should ever exist per offering+term (one-survey-per-course invariant) — if more than one is found in mock data, that's a data bug to fix in fixtures, not a case to handle.
3. **Keep `expandInstances()`** — it still does real work (per-person breakdown for the "ready" rows, gap detection). Change its duplicate branch: an instance is `'duplicate'` only when `roleOverlapConflicts` flags that instance's criterion, not via the old per-person `coversInstance` match. Remove the old soft-duplicate-becomes-instance-row path for the four blocked statuses; keep person-level rendering only for the non-blocking "ready" section and for showing *who* is affected inside a conflict's accordion detail.
4. **Recompute triggers** — `roleOverlapConflicts` must recompute on Term/AY or course-selection change only (per ST-02), independent of template/unit-selection edits; `expandInstances`'s gap detection keeps recomputing on every relevant change as today. This likely means the page (`app/(app)/surveys/push/page.tsx`) needs two separate `useMemo`s with different dependency arrays instead of one combined `instancePlan` memo.
5. **`cancelSurvey(id)` / `archiveSurvey(id)` stubs in `pce-state.tsx`** — minimal: `setSurveys(ss => ss.map(s => s.id === id ? { ...s, status: 'closed', /* archived marker via storyStatus rules from Phase 0 */ } : s))` for archive, and a `cancelled` marker (reuse `closed` + a `cancelledAt` field, or add a `cancelledReason` field) for cancel — whatever Phase 0's chosen mapping (`storyStatusOf`) needs to read to report `archived`/back-to-nothing correctly. These exist only so Step 2's hard-block message has a real action behind it; the dedicated ST-16/ST-09 UI (confirmation copy, a row action in `surveys-table.tsx`) is explicitly out of scope for this plan.

**Verification:** unit-style check (can be a throwaway script or a few `console.assert`s exercised via a dev route) — same person, different role → not a conflict; different person, same role → conflict; two templates with fully disjoint role coverage on the same offering → not a conflict (both createable, per ST-02's explicit example).

---

## Phase 2 — Auto-assign, evaluatee-unit selection state, Auto Update flag

**Files:** `app/(app)/surveys/push/page.tsx` (`autoAssignTemplates`, `defaultAssignments`), `components/pce/courses-evaluatees/step-survey-instances.tsx` (state model), new `lib/pce-course-scope.ts` addition or a new hook `useEvaluateeUnitSelection`.

1. **Decision needed (Product/Romit) — auto-assign tie-break:** ST-02 says auto-assign fires only "if there is one template in the system for the given course type." Current `autoAssignTemplates()` (`push/page.tsx:56-80`) falls back to `courseType` match even with multiple published templates, ignoring `isDefaultForType`. Two readings: **(a)** literal — auto-assign only when the published-template count for that type is exactly 1; multiple templates → row starts unassigned, Admin must pick. **(b)** `isDefaultForType` breaks ties when >1 exists. ST-02's "Reset to defaults" wording ("re-assigns every course's type default") implies a default exists even in the multi-template case, which only makes sense under (b). **Recommend (b)**, but flag it explicitly to Romit before implementing — this changes user-visible behavior (rows that today silently get "first template found" would instead show unassigned unless `isDefaultForType` is set).
2. **Evaluatee-unit state model** — replace the `included: Set<string>` reset-on-`planSig` pattern (`step-survey-instances.tsx:207-236`) with a per-offering map that distinguishes three states per unit key: `untouched | selected | deselected`. Shape: `Record<offeringId, Record<unitKey, 'selected'|'deselected'>>` — absence of a key = untouched (first-seen this session, gets the "all selected by default" or Auto-Update-driven default). This map is what Phase 4's persistence (Save as Draft) actually serializes — the old `included` Set can't distinguish "never seen" from "explicitly deselected," which ST-02's refresh rules require.
3. **Template-change reset rule** — changing a course's template must reset that course's entry in the new selection map entirely (§ST-02 "no prior selection carries forward, even for shared roles/people") — wire this into the existing `onTemplateChange` handler.
4. **Auto Update flag + manual refresh** — new top-of-step `ToggleSwitch` (state lives in the page, persisted per Phase 3), defaulting OFF. New "Refresh" button near the faculty-gap section (UI notes place it "under Faculty-gap check"). On click: re-run `expandInstances`-style unit resolution per offering, diff against the current selection map — units present now but absent from the map are new (auto-select if flag ON, add-deselected if OFF); units in the map but absent from the fresh resolution are removed from the map entirely; units present in both are left untouched. This is a pure diff function, testable in isolation — write it as `reconcileUnitsOnRefresh(current, fresh, autoUpdateOn)` so it doesn't get buried in a component effect.
5. **Course-checkbox parity with Step 1** — Step 2's course-level checkbox must write to the same selection state Step 1 owns (not a shadow copy), so unchecking here is indistinguishable from unchecking on Step 1. Confirm `selectedCourseIds` (currently owned by `push/page.tsx`, set via Step 1's `onSelectionChange`) is the single source Step 2 also toggles, rather than introducing a second boolean.

---

## Phase 3 — Draft/Scheduled resume ("pull in for editing") + Save as Draft

**Files:** `components/pce/pce-state.tsx` (`pushSurveyBatch`, `PushWizardConfig`), `app/(app)/surveys/push/page.tsx` (wizard entry/resume), new persisted-draft shape.

1. **Decide the Draft-wizard persistence shape.** Nothing today persists an in-progress wizard — `pushSurveyBatch` only ever creates final records (`pce-state.tsx:531-639`). Introduce a `PceWizardDraft` record (new type, stored alongside `surveys` in `PceState` or as a `PceSurvey` with `storyStatus === 'draft'` carrying the wizard's working state — template assignments, the Phase 2 selection map, Auto Update flag value, Step 3 window/release overrides). **Recommend modeling it as a `PceSurvey` row with status `'draft'`**, not a separate parallel type — this is what makes "completing the wizard updates that same survey in place" (ST-02) fall out naturally: the wizard just becomes an editor over one `PceSurvey` record from the moment a Draft exists, whether newly created or resumed.
2. **`saveDraft(config: Partial<PushWizardConfig> & { id?: string }): string`** — new `pce-state.tsx` action, upserts a `status: 'draft'` `PceSurvey` (creates on first save, updates in place on subsequent saves by id). Wire a "Save as Draft" button into the wizard shell (`app/(app)/surveys/push/page.tsx`) — none exists today.
3. **Resume entry point** — when the wizard is entered for a course+term that has a matching Draft or Scheduled survey (`draftOrScheduledMatch` from Phase 1), pre-populate Step 2 (and Step 3) from that survey's stored config instead of computing defaults. `pushSurveyBatch`'s final-submit path becomes an update-in-place (`setSurveys(ss => ss.map(...))`) when a draft/scheduled id is being edited, instead of always appending new records.
4. **Template-changed-since-Draft notice** — on resume, compare the Draft's stored `templateId`'s current `templateCriteria()` against what was true when saved (requires stamping a snapshot of covered criteria into the Draft at save time, since templates are mutable). If they differ and the template is still published, show the "template updated since Draft was saved" `LocalBanner` (pre-Live only, per spec). If the template is no longer published, treat as "no template assigned" (existing block).
5. **Open items NOT resolved here** (carried from the gap-analysis doc, still Product-owned): course-type-changed-since-Draft check; deleted/descoped-course Draft-resume behavior (options A/B/C); empty-course-set deep-link behavior. This phase's resume path should fail loudly (log + visible banner) rather than silently mishandling these cases, until Product decides.

---

## Phase 4 — Step 2 UI

**Files:** `components/pce/courses-evaluatees/step-survey-instances.tsx` (rewrite of the assign/render layer, same external props contract where possible), `components/pce/person-avatar.tsx` (reused), new small components for the chip-capped evaluatee display and the conflict accordion detail.

Per the PRD's UI notes, all net-new relative to the shipped Briefing accordion:
1. **Template picker** — single-select dropdown per row with a "Default" badge when the selected template is that course type's default (`isDefaultForType`, pending Phase 2's decision). Largely exists (`TemplateControl`, `step-survey-instances.tsx:127-178`) — add the badge.
2. **Evaluatee-unit checkbox chips, capped at 3, "+N more"/"Show less" expander** — replaces the current inline `NamesInline` faces-and-names row (`step-survey-instances.tsx:85-96`) for the row where selection actually matters. Each chip = one unit (role + person) with its own checkbox, backed by Phase 2's selection map.
3. **Amber left border + tint on gap/conflict rows** — row-level treatment, not card/section-level (current shipped design tints whole accordion sections, not individual rows within "ready"). Confirm this against `feedback_aarti_no_red` / the DS chip-ink-on-wash rule from the Jul 21/27 settled notes (amber only via `--chip-4`/`--icon-disc-chart-4-bg`-family tokens, never a raw background wash).
4. **"Action Needed" column** consolidating the gap warning + fix action (AddInPrismButton) into one column, replacing the current separate gap accordion section's row layout.
5. **Expandable accordion panel per conflicted row** — Evaluate?/Role/Assigned person(s)/Covered by columns, backed by Phase 1's `RoleOverlapConflict[]`. This is new; nothing today renders a role-by-role breakdown of an overlap.
6. **Exact Yes/No conflict question copy, teal "Confirmed" styling** — copy pending Romit's exact wording (not specified beyond "exact Yes/No conflict question copy" in the PRD) — flag as a copy TBD, don't invent it.
7. **Reset to defaults confirmation dialog** — currently a bare button with no confirmation (`step-survey-instances.tsx:335-338`); add an `AlertDialog` (matches the DS-dialog-vs-drawer convention) since the action is now explicitly "no undo after confirming."
8. **"Assign a template to preview" tooltip, "No templates for this course type" copy, "+Create new template" placement** — the create-template action already exists and already sits top-of-screen (`step-survey-instances.tsx:339-342`); confirm copy matches exactly, add the tooltip to the (new) Preview Survey button.
9. **Preview Survey per row** — wire the existing `/surveys/[id]/preview` full-fidelity page (or `survey-preview-dialog.tsx` for a lighter version — pick one; the PRD says "opens ST-10's read-only student preview," and the closest existing thing is labelled "ST-12" in its own header, so confirm these are the same surface before reusing it) as a per-row action, disabled with the tooltip until a template is assigned, rendering live against the row's current (possibly unsaved) assignment rather than a persisted survey id.

**Gate 2 reminder:** this phase is the one that needs `ds-adoption-reviewer` (new chip/accordion-detail components), `ds-conformance-reviewer`, `state-review` (this is exactly a form/async page), and `verification-reviewer` before any done claim — per `apps/pce/CLAUDE.md`'s sequential protocol. Not run as part of this planning pass.

---

## Phase 5 — Step 1 exposure (ST-01 "Existing survey status preview")

**Files:** `components/pce/courses-evaluatees/step-scope-courses.tsx`.

Bring forward the flow-ledger concept from the classic merged step (`step-courses-evaluatees.tsx:248-329`, `flowsByOffering`) into the current split Step 1 as a read-only, non-blocking column/badge — informational only, per ST-02's explicit statement that "this check remains the sole enforcement gate; Step 1's preview never blocks." Small, isolated change; can land independently of Phases 1–4 once Phase 0's `storyStatusOf()` exists (Step 1's preview should read status through the same mapper).

---

## Sequencing summary

```
Phase 0 (status vocabulary) ──┬──> Phase 1 (role-overlap engine + cancel/archive stubs) ──┬──> Phase 4 (UI)
                               │                                                            │
                               └──> Phase 5 (Step 1 preview, independent)                   │
                                                                                             │
Phase 2 (selection state + Auto Update) ────────────────────────────────────────────────────┤
                                                                                             │
Phase 3 (Draft/Scheduled resume + Save as Draft) ───────────────────────────────────────────┘
```

Phases 0 and 1 block everything else (the duplicate model is the load-bearing change). Phases 2 and 3 can proceed in parallel once Phase 1 lands. Phase 4 needs Phases 1–3 done to have real data to bind to. Phase 5 only needs Phase 0.

## Decisions required before coding starts (do not assume)

1. Phase 0: enum-expansion vs. derived-mapper approach for status vocabulary (recommended: derived mapper).
2. Phase 2: auto-assign tie-break when multiple published templates share a course type (recommended: `isDefaultForType` breaks the tie).
3. Phase 4: exact Yes/No conflict-question copy (not specified in the PRD).
4. Confirm whether "ST-10" and the existing "ST-12" full-fidelity preview page are the same surface, or ST-10 is a distinct one not yet built.
5. The four Product-owned open items from the gap-analysis doc (course-type-changed-since-Draft check; deleted/descoped-course resume behavior A/B/C; create-template round-trip state preservation; empty-course-set deep-link behavior) — Phase 3 explicitly does not resolve these; confirm whether any must be resolved before Phase 3 ships or can follow as fast-follows.
