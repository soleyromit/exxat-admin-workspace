# UX 08 — Interaction Specs (reusable patterns)

> **Build alignment (2026-10-08):** containers changed to the prototype's. Behaviour in these patterns is unchanged; where a pattern names a rail, sheet or page, read the dialog form: P-01/P-02/P-03/P-05 (S-09) happen inside the 3-step Wizard dialog (lineage panel and form preview in step 2; Copy configuration and Apply to selected skills as secondary controls); P-04 import review is the 1024px import dialog; P-07 drill-down is stacked 1024px dialogs (Esc closes the top one) opened by `?student=&skill=&evaluation=`; P-08 sticky bar is unchanged; P-09 send-for-review is a 1024px dialog (`?send=1&skills=`); P-10 history is a 1024px dialog (`?history=`); P-12 approval is the card list (Approve filled and Return for correction outline on every card, one-primary exception, DEC-018). See `docs/build/prototype-parity.md` and each contract's Build alignment section.

**Purpose:** one definition per interaction so every surface behaves the same way. Surface-level layouts are in `07-screen-inventory-and-wireframes.md`; DS components in `10-component-inventory-and-ds-map.md`; copy is owned by `09` (written by another worker). **Copy hooks** below are keys (`09#<key>`). `09-content-and-microcopy.md` is organised by surface (§5 S-01…S-18), shared patterns (§3), four-state labels (§4) and the failed-rule generator (§7); look the key up by surface and pattern name there. Where the two differ, `09` owns the words and this file owns the behaviour.
**Tags:** `[REQ id]` · `[OD-n]` · `[PROTO]` illustration · `[CALL 09-23]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER. Pattern IDs P-01…P-18 are referenced from `07` and `10`.
**Global rules** (apply to every pattern): one filled primary CTA per surface · text-only action buttons · product feedback via `LocalBanner`, never toast · status never colour-only (WCAG 1.4.1) · focus ring always visible (2.4.7) · targets ≥24×24 CSS px (2.5.8), student/preceptor surfaces ≥44px `[INFER]` · `prefers-reduced-motion` honoured (P-16) · nothing created or destroyed without explicit confirmation (IM-13, RV-03).

---

## P-01 Model → criteria lineage panel, and changing the model

**When:** S-09 (and read-only in S-04 row expansion). Makes the dependency *evaluation model → evidence → qualification rule → achievement criteria → status* visible `[REQ SC-17, §1.5]`. `[PROTO]` shows this as "Configuration lineage"; keep the idea.
**Anatomy** (persistent, sticky beside the form on ≥1024px; collapsible above the form below that):
```
 LINEAGE
 1 Evaluation model      Demonstration-Level Outcome
 2 Evidence per eval     Observed / With assistance / Independent
 3 An evaluation counts  Each completed demonstration counts
 4 Achievement requires  5 demonstrations · ≥1 observed · ≥1 with assistance · ≥3 independent · 1 in Inpatient
 5 Skill status          No evidence → Some qualifying → Achieved   (AE-04: four states, see below)
```
Each row updates live as the form changes; the row that just changed is highlighted for 1s and announced politely (`aria-live="polite"`).
**Model change (SC-09):** changing the model **rebuilds** rules 3–4. Flow:
1. User picks another model tile → if nothing downstream is configured, switch immediately.
2. If downstream settings exist, open `Dialog` ("Change evaluation model?") listing what will be discarded (qualification rule, level/question set, level minimums) and what is kept (submission fields, comment setting, workflow toggles, setting minimums `[INFER]`: setting minimums are model-independent per SC-11 "any skill can require…").
3. Primary action "Change model" (filled), secondary "Keep current model" (outline). Default focus on the **safe** option "Keep current model".
4. On confirm: criteria section re-initialises to the new model's empty state; focus moves to the first required field of the new model; `LocalBanner variant="info"` states what was reset.
5. If the skill has **recorded evidence**, add a line: "Existing evaluations are kept. How they count will be recalculated when you save." `[REQ AE-02]` and flag P-03.
**No default model** `[REQ SC-02]`: a new skill shows the four tiles unselected and the rest of the form disabled with reason text ("Choose how this skill is evaluated to continue").
**Keyboard:** tiles are a radio group (arrow keys move, Space selects); dialog traps focus, Esc = Keep current model.
**A11y:** lineage is a `<ol>` with `aria-label="How this skill is evaluated"`; arrows are decorative (`aria-hidden`).
**Copy hooks:** `09#lineage.title`, `09#lineage.model-change.title/body/confirm/cancel`, `09#config.model.required`.
**REQ:** SC-02, SC-09, SC-17, AE-04.

## P-02 Save-blocking validation (configuration)

**Rule:** a configuration that cannot be satisfied must not be savable `[REQ SC-18]`; qualification rules must be satisfiable `[REQ SC-06]`.
**Checks** (each with a stable error id):
| id | Condition | Where shown |
|---|---|---|
| E-LBL | Unlabelled question or level (SC-18) | on the field |
| E-DUP | Duplicate question or level label (SC-18); binary labels must differ (SC-03) | on the second occurrence, referencing the first |
| E-SUB | Named-subset rule with zero questions ticked (SC-05, SC-06) | on the rule group |
| E-NM | "At least N of M": N < 1 or N > M (SC-05) | on N |
| E-MIN | Per-level minimums sum > total required, or any minimum > total (SC-18) | on the total and the offending level |
| E-SET | Setting minimum > total required `[INFER from SC-18 "minimums that exceed the total required"]` | on the setting row |
| E-QSET | Question/Likert model with 0 questions; demonstration model with 0 levels `[INFER]` | on the editor |
| E-SCALE | Likert scale undefined or min ≥ max `[INFER]` | on the scale |
**Timing:** validate on blur for a field, on change for cross-field sums (debounced 300ms), and fully on Save. Do not show errors on untouched fields before first Save attempt.
**Save attempt with errors:** `Save` stays enabled (disabled buttons hide *why*); on press, (1) a `LocalBanner variant="error"` summarises "N things to fix" with a link per error that moves focus to the field, (2) first invalid control receives focus, (3) fields show `FieldError` and `aria-invalid="true"`, (4) `aria-live="assertive"` announces the count once.
**Large question sets (SC-06 "usable where a skill carries a large question set"):** the subset editor is a searchable checklist (`Command` list + "Select all / none / invert"), error summaries group by rule, and the list virtualises beyond ~100 rows `[INFER]`.
**Saved with warnings:** none. There is no warn-and-save path for unsatisfiable rules.
**Copy hooks:** `09#validation.<id>` per id above; `09#validation.summary`.
**REQ:** SC-03, SC-05, SC-06, SC-18. **Maps to:** `docs/strategy/06` EC-1…EC-4.

## P-03 Rule-change impact preview `[INFER]`

**Why:** the achievement engine re-applies the current rule to held evidence `[REQ AE-02]`; the requirements never ask for a preview. An admin editing a live skill can silently move students between states, so I propose showing the consequence. Needs Sankalp's agreement; **seam:** a read-only `previewImpact(skillId, draftConfig)` returning counts per state.
**When:** Save on a skill with ≥1 evaluation recorded and a change to model, qualification rule, criteria totals, level set or setting minimums. Label/question-text renames do **not** trigger it (presentation only `[REQ AE-06]`).
**Anatomy:** `Dialog` titled "Review the effect of this change" with a table: state before → state after → students (e.g. Achieved → Some qualifying evidence: 12). A "View students" link opens S-01 filtered to affected students *after* save. Primary "Save change"; secondary "Back to editing". Default focus on "Back to editing".
**States:** loading (skeleton rows, "Calculating…"), none affected (single line, still confirm), error (cannot compute: allow save with explicit "Save without preview"? **No**: block and offer retry; a silent recalculation is worse).
**Keyboard/a11y:** table has caption; counts announced; Esc = Back to editing.
**Copy hooks:** `09#impact.title/body/none/error`.
**REQ:** AE-02, AE-06 · `[INFER]`.

## P-04 Import review table

**When:** S-08 step 2 (after "Read the list"). Proposal-only: nothing enters the library until confirmed `[REQ IM-05, IM-13]`.
**Anatomy:** counters row (Found · Will be created · Excluded · Possible duplicates · Not read) → options row ("Create N new categories from the groupings" checkbox `[REQ IM-07]`) → table → footer (Back · **Create N skills** = the single filled primary) → collapsible "Not read" region.
**Table columns:** include checkbox · Name (editable) · Description (editable) · Category (select: existing, new-from-source, none) · Source reference (original line/row, read-only) · Match status badge (New / Possible duplicate / Heading?).
**Row actions** (row menu `DropdownMenu`, also keyboard-reachable): Exclude, Rename (inline), **Merge with…** (pick another row; keeps name of target, concatenates descriptions, shows both source lines), **Split** (enter ≥2 names; creates rows with the same category), **Add a skill here** (blank row), Move to category. `[REQ IM-05]`
**Bulk:** header checkbox selects visible rows; bulk "Exclude", "Set category", "Include". Selection count uses `BadgeCount`.
**Duplicates `[REQ IM-06]`:** matched rows show the existing skill name and a 3-way `RadioGroup` choice (single choice, radio semantics): **Skip** (default), **Replace**, **Keep both**. If the existing skill **has evidence**, "Replace" is disabled with reason text ("This skill has recorded evaluations") `[INFER; OD-13 undecided so the safe default is: never replace silently]`.
**Unread lines `[REQ IM-08]`:** always rendered (never hidden when zero? show "Everything was read" as proof); each item shows original text verbatim + reason ("Looks like a section heading") + actions **Add as skill**, **Add as category**, **Ignore**. Ignored items stay listed with state "Ignored".
**Confirmation:** after Create, `LocalBanner variant="success"` "Added N skills. They cannot be used until each one is configured." with inline action "Configure them now" and secondary "Show them" `[PROTO, REQ IM-09/IM-10]`. Each import gets an **import batch label** (date + source name) stored on the skill and filterable `[REQ IM-11]`.
**No AI claims** in copy; the doc says interpretation is a draft that may be imperfect `[REQ IM-13]`.
**States:** parsing (progress + cancel), parse failed (what failed, retry, "paste instead"), 0 skills found (explain + show unread lines), partial (some unread), large (500+ rows: table virtualised, keyboard row navigation).
**Keyboard:** Up/Down moves between rows; Space toggles include; Enter on a name starts edit; Esc cancels edit; Tab leaves the table; row menu = Shift+F10 or the visible "⋯" button.
**Copy hooks:** `09#import.*` (counters, duplicates, unread, confirm, success).
**REQ:** IM-01…IM-13. **Seams:** OD-12 (no proposed model), OD-13.

## P-05 Bulk configure: copy and apply (IM-14)

**Why:** configuring 200 imported skills one by one is the stated adoption risk `[REQ §3]`. **`[PROTO]` has no such feature**, so this is net-new design.
**Entry points:** (a) S-04 multi-select → bulk bar "Apply configuration…"; (b) S-09 "Copy configuration from…" (single target).
**Flow:**
1. Choose **source skill** (searchable `Command`; only *configured* skills listed).
2. Choose **what to copy** (checkbox group, all on by default): evaluation model + rule + criteria · submission fields · evaluator comment setting · workflow (self-eval, approval) · allowed evaluator roles · setting minimums.
3. Choose **targets**: preselected from the selection; list shows each target's current state (unconfigured / already configured → "will overwrite").
4. Review (`Dialog`/Sheet): "Apply to 14 skills. 3 are already configured and will be overwritten." with expandable list. Primary "Apply configuration". Default focus "Cancel" when overwriting any configured skill.
5. Result `LocalBanner`: "Configured 11 skills. 3 were overwritten." plus **Undo** for 60s `[INFER]` (needs a revision store; otherwise omit undo and keep the confirmation strict).
**Rules:** copying the model copies question **text** but creates independent copies; later edits to one skill never change others. A skill with recorded evidence is never overwritten without P-03.
**Edge:** names inside a copied *named-subset* rule are remapped by index; show "n questions copied".
**Keyboard/a11y:** list uses `role="listbox"` semantics via `Command`; announce counts.
**Copy hooks:** `09#bulk.*`. **REQ:** IM-14, SC-01, SC-18 (each target validated; invalid targets listed, others proceed).

## P-06 Filter chips with individual removal, and impossible combinations

**When:** S-01 reports, S-10 offerings, S-04 library, S-15.
**Anatomy:** `FilterBar` (chip group named "Applied filters") under the page header. Each chip = `Dimension: value` + remove control (`aria-label="Remove filter Setting: Emergency"`). "Add filter" (`FilterBarAddButton`) and "Clear all" at the end. A one-line scope sentence below ("150 students · BSN 2026 · NURS 350 · Inpatient") mirrors the chips for screen readers and printing `[PROTO has "Showing data for…" line]`. `[REQ RP-01]`: applied filters evident, each removable on its own.
**Dimensions** `[REQ RP-01]`: cohort, group (disabled until cohort chosen; shows reason `[PROTO "Select a cohort first"]`), clinical course, category, tag, location, setting. Setting includes Lab/Simulation.
**Recalculation `[REQ RP-08]`:** location/setting filters recompute progress counting *only* evidence gathered there. The scope sentence states that: "Counting evidence recorded in Emergency only." Without it, a lowered percentage looks like a bug.
**Impossible combination `[REQ RP-09]`:** when the chosen location does not offer the chosen setting (or setting excludes the location's types), do **not** show an empty table.
- Detect on selection (use the reference data location→settings) and render, inside the table region, `LocalBanner variant="info"`: "No evidence can exist for this combination. Mercy Home Health does not offer Emergency." with two inline actions: "Remove Emergency" and "Remove Mercy Home Health". Table is replaced by the banner (not shown below an empty grid). KPI strip shows "—" not 0.
- The *opposite* case, valid combination with no evidence yet, shows the normal empty state: "No evidence recorded for this combination yet."
- Before/after is in `07` §S-01.
**States:** applying (table skeleton, previous rows stay until new data to avoid layout jump), filter returns zero rows (empty state with "Clear filters"), filter set invalid (above).
**Keyboard:** Backspace/Delete on a focused chip removes it; focus moves to the next chip, or the "Add filter" button if none.
**Copy hooks:** `09#filters.scope`, `09#filters.impossible`, `09#filters.empty`.
**REQ:** RP-01, RP-08, RP-09. **Maps to:** EC-22, EC-23.

## P-07 Drill-down without losing context (RP-05, RP-06)

**Chain:** S-01 aggregate (student/skill/tag row) → S-02 student → S-03 skill evidence ledger → evaluation detail. Never forces re-searching `[REQ §11]`.
**Mechanism:** a non-modal right rail (`FloatingSheetPanel`, `size="lg"`; table behind remains clickable) holds levels 2–4 as a stacked **breadcrumb inside the rail** (`Student › IV Insertion › Evaluation 2026-03-17`). Selecting another row in the table **swaps** the rail content (the DS "railTriggerProps" behaviour) instead of closing it. `[INFER]` choice of rail over route; alternative below.
**Back behaviour:** rail header Back = previous level; Esc = closes **one level**, then the rail at the root; browser Back mirrors rail levels (rail state in the URL: `?student=…&skill=…&evaluation=…`) so a shared link reopens the same view `[INFER]`. Filters and scroll position of the table are untouched.
**By-skill / by-tag rows** drill to *individuals*: By skill row → rail lists students with state for that skill → click student → evidence for that skill. (`[PROTO]` showed student→skill only; **RP-05 requires aggregate→individuals from any figure**, so by-skill and by-tag need this too.) The numbers in a tag row (student-skill records, overlapping) drill to a list of student-skill pairs, labelled as such.
**Filters follow the drill:** the evidence ledger respects active location/setting filters and says so (RP-08); a toggle "Show all evidence" exists in the ledger header `[INFER]`.
**Alternative (route instead of rail):** `/students/:id/skills/:skillId` full page with breadcrumb. Better for deep links and print; worse for scanning many students. Pick after Romit review; both satisfy RP-05/06.
**States:** rail loading (skeleton), evidence empty (explain whether "no evidence yet" vs "none matches the filters"), error (retry, keep rail open).
**Keyboard:** rail is non-modal: focus moves into it on open; Tab order = header Back, content, close; Esc as above; focus returns to the originating row on close.
**A11y:** rail is `role="complementary"` labelled by its title; level changes announced via live region.
**Copy hooks:** `09#drill.*`. **REQ:** RP-05, RP-06, RP-07, RP-08.

## P-08 Sticky multi-select action bar (ST-04)

**When:** S-12 (student selects several skills to send together `[REQ ST-04]`); also S-04 bulk actions.
**Anatomy:** appears when ≥1 row selected, pinned to the viewport bottom (mobile: above safe-area inset `[INFER]`): `[BadgeCount n] skills selected · Clear · Send for review`. "Send for review" is the **only filled primary** on the surface; opening it launches S-13 (Sheet), where the final "Send request" is the filled primary and the bar's button becomes `outline`. This resolves the prototype's two-blue-primaries problem `[PROTO]`.
**Selection rules:** only *configured, active* skills are selectable (IM-09, SL-11); an achieved skill remains selectable with the note "Already achieved; you can still request another evaluation" `[PROTO copy; REQ silent so flagged INFER]`.
**Limits:** none specified. `[INFER]` ask whether a send of 20+ skills is allowed (evaluator completes them in one sitting, EV-05).
**Keyboard:** Space toggles the focused row checkbox; the bar is reachable with Tab after the list and also via a skip-link "Go to selection actions"; Esc clears selection when focus is in the list.
**A11y:** bar is `role="region" aria-label="Selection actions"`; selection count in a live region (polite). Hit areas ≥44px on mobile.
**Copy hooks:** `09#select.count`, `09#select.send`. **REQ:** ST-04, IM-09.

## P-09 Send-for-review: setting × role constraint logic (ST-06, ST-07, ST-08)

**Goal:** the student never composes an invalid request; where no valid combination exists they are told why `[REQ ST-08]`.
**Inputs:** `performedIn` ∈ {Clinical, Lab/Simulation} `[ST-05]`; student's placements for the course; the skill's allowed evaluator roles `[SC-16]`; roles valid per setting `[EV-02]`; recorded evaluators.
**Decision table**
| # | performedIn | Placements for this course | Setting control | Role options | Evaluator list |
|---|---|---|---|---|---|
| 1 | Clinical | exactly 1 setting | Inferred and shown read-only with source ("From your placement at Harbor Family Practice") `[ST-06]` | `skill.allowed ∩ validForClinical` | evaluators recorded for that role |
| 2 | Clinical | several settings/locations | Select, options "Setting, Location"; location recorded with it `[ST-06]` | as 1 | as 1 |
| 3 | Clinical | **none recorded** | Select from the program's **full** setting list `[ST-07]`; location optional `[INFER]` | as 1 | as 1 |
| 4 | Lab / Simulation | n/a | hidden (lab is not a clinical setting) | `skill.allowed ∩ validForLab` | lab instructors roster **plus** "Name someone not listed" (name + email) `[ST-09, SL-09]` |
| 5 | any | any | any | **empty set** | Blocking explanation (below) `[ST-08]` |
**`validForClinical` / `validForLab`:** `[PROTO]` shows Clinical → Preceptor, Clinical faculty; Lab → Clinical faculty, Lab instructor. REQ §7 says only "which roles are valid depends on where the skill was performed" and OD-06 leaves role set open. **Seam:** store the role×location validity as data, seeded from the prototype, confirmed with Sankalp as proposed **OD-25**. S-09 reads the same table to block unsatisfiable skills (a clinical-setting minimum needs at least one clinical-valid allowed role, SC-18).
**Reset rules (fixes DEFECT-01):** changing `performedIn`, setting or role **clears** the person selection and any dependent fields, and re-validates. Never retain a person who is not valid for the new role. The confirmation must display the *actual* role of the chosen person.
**Blocking explanation (before/after in `07` §S-13):** inline `LocalBanner variant="warning"` above the controls: "This skill cannot be sent from a lab. It can only be signed off by a preceptor or clinical faculty, who sign off clinical evidence." Actions: "Switch to Clinical" (changes the toggle), "Contact your program" (no new surface; shows program contact only if the program has one, else omit `[INFER]`). Send is disabled **and** the reason is in the banner, never silent.
**Batch (several skills selected):** compute options per skill; role list = **intersection**. If the intersection is empty but each skill has options individually, offer "Send these separately" which splits the request, explained in one line.
**Unlisted lab instructor `[SL-09]`:** two fields (Name, Email), email validated on blur; the request can be sent; admin later sees the name in S-07 "Named by students" and can adopt it.
**Setting/location granularity `[OD-07]`:** UI captures **once per submission** (matches `[PROTO]`); data stored per submission item with the value defaulted from the submission, so a per-skill override is a UI-only change later.
**Confirmation `[REQ ST-13]`:** result banner and the "Awaiting evaluation" strip show *what, to whom, in what role, in which setting and location*.
**Copy hooks:** `09#send.setting.inferred`, `09#send.noplacement`, `09#send.noroles.<case>`, `09#send.confirm`.
**REQ:** ST-05, ST-06, ST-07, ST-08, ST-09, ST-13, SC-16, EV-02, SL-09 · **Seams:** OD-06, OD-07, OD-25.

## P-10 Revision vs further attempt (RV-01…RV-04)

Two different actions with different consequences `[REQ §9]`; the UI must make that difference visible, not rely on labels alone.
| | **Revise and resend** | **Make a further attempt** |
|---|---|---|
| Applies to | Returned submission, or one not yet assessed `[RV-01]` | Completed evaluation that did **not** meet the criteria `[RV-03]` |
| Effect on record | Same record continues; revision count +1 and the return reason retained `[RV-02]` | New record; original left intact `[RV-03]` |
| Evaluator | May change (original unavailable) `[RV-04]` | May change `[RV-04]` |
| Evaluator's previous answers | Cleared or retained: **OD-08** (seam: keep snapshot, UI toggle) | Not applicable (fresh) |
| Where it appears | S-14 card of that attempt: primary text button "Revise and resend" | S-14 skill header: "Make a further attempt" once the last attempt did not meet the criteria; **hidden** while any attempt is pending or returned `[INFER]` |
**Revise form:** pre-filled with the previous submission, banner at top shows the reviewer's note (the reason it was returned), changed fields marked "edited", Send primary = "Resend". Changing evaluator shows the role constraints (P-09).
**Further attempt:** opens S-13 with skill preselected, context copied from the failed attempt but editable, a line "Your previous attempt is kept and still shown in your history."
**History labelling:** attempts numbered chronologically and identified by attempt `[REQ SH-01]`; revisions appear as "Revised and resent n times" inside the attempt `[PROTO]`.
**Copy hooks:** `09#revise.*`, `09#attempt.*`. **REQ:** RV-01…RV-04, SH-01, SH-02. **Seam:** OD-08, OD-16 (who an admin-returned item goes back to; default to the **student** because RV-01 says "returned to them").

## P-11 Locked states (RV-05) and immutability (RV-03)

- A submission whose evaluation has **counted**, or is **awaiting administrator approval**, cannot be edited or resent `[REQ RV-05]`; the card shows **no** edit action and a plain statement of why ("This evaluation counted and can no longer be changed" / "Waiting for administrator approval").
- A **completed** evaluation is a record, never edited `[REQ RV-03]`; in S-03/S-14 the form view is read-only with no editable controls (not merely disabled-looking inputs): render values as text.
- Disabled controls use the component's `disabled`, never opacity on a parent (contrast).
- Admin can *return* an evaluation (AR-05) but cannot edit its answers `[INFER; REQ gives admin only note, approve, return]`.
**Copy hooks:** `09#locked.counted`, `09#locked.pending`. **Maps to:** EC-18, EC-20.

## P-12 Approval compare view (AR-02, AR-03, AR-04, AR-05)

**When:** S-11 (and S-03 evaluation detail for the same data). Layout `[INFER]`: S-11 is a DataTable queue (rows carry no filled buttons; only a "Review" row action) and this compare view opens in a right Sheet, so the surface has exactly one filled primary (Approve) at a time.
**Anatomy:** header (student · skill · course · setting · location · evaluator + role · submitted date) `[REQ AR-01]` → two equal columns **Student self-evaluation | Evaluator**; each lists the same questions/levels with the recorded answer; a row-level marker (text "Same" / "Differs") and a summary sentence ("Student and evaluator recorded different outcomes.") `[REQ AR-02]`; below, evaluator comment and student note, kept separate `[REQ ST-12]`; "See full responses" expands every question/level `[REQ AR-03]`; review note field `[REQ AR-04]`; decision row.
**When there is no self-evaluation** (skill not configured for it `[SC-15]`): single column, no agreement marker.
**Decision row:** **Approve** (filled primary) and **Return** (outline). Return opens a `Dialog` asking for a note (optional per REQ AR-04; `[INFER]` recommend requiring it for Return because RV-02 retains "the reason it was returned"; flag OD). Default focus in the dialog: note field.
**Target of Return:** the **student** corrects and resends (RV-01) `[REQ]`; the prototype label "Return to preceptor" contradicts this (DEFECT-03, OD-16). Spec label: **"Return for correction"**.
**After decision:** item leaves the queue with `LocalBanner variant="success"` ("Approved. This now counts toward Rina Okonkwo's IV Insertion record." / "Returned for correction. It does not count until the correction is complete." Neutral about who corrects until OD-16 is decided) and focus moves to the next item header. Undo is not offered (approval changes achievement `[REQ AR-06]`); instead an approved evaluation is reviewable in S-03.
**Pending evidence excluded from achievement** until approved `[REQ AR-06]`: the queue header states "Waiting evaluations do not count yet".
**Keyboard:** J/K next/previous item `[INFER]`, A approve is **not** bound (avoid accidental approvals); Enter on "See full responses" toggles.
**A11y:** columns are a two-column `<dl>` per question; differs/same conveyed as text.
**Copy hooks:** `09#review.*`. **REQ:** AR-01…AR-06, SC-15, ST-11, ST-12.

## P-13 Keyboard and focus maps

| Container | Open → focus | Tab order | Esc | Close → focus returns to |
|---|---|---|---|---|
| `Dialog` (confirm model change, return note, impact, bulk apply) | Safe action (Keep/Cancel) for destructive-ish; note field for note dialogs | Content → footer actions (cancel before primary visually right-aligned: primary last) | Cancel | Trigger |
| `Sheet` modal (S-13 send, S-14 history) | First field (S-13) / title (S-14) | Header → body → footer | Closes, unsaved changes prompt (see P-17 draft) | Trigger (button or sticky bar) |
| `FloatingSheetPanel` (S-02/S-03 rail) | Panel title | Non-modal: page remains tabbable; panel is next in DOM order after the table | One level back, then close | Originating row |
| `DataTable` | Grid semantics from DS | Row focus with arrows, Enter = open row | — | — |
| Tabs (Library, Overview) | Active tab | Roving tabindex; arrows switch | — | — |
| `FilterBar` | First chip | Chips → Add filter → Clear all | — | — |
| Evaluator form (S-16) | Page title; skip to first unanswered | Skill sections in order; Yes/No and level choices are a radio group each (arrow keys) | — | — |
**Rules:** a visible focus ring on every interactive element; no keyboard trap except modal dialogs/sheets; after destructive removal focus moves to the next logical item; tables with `aria-rowcount` for 150+ rows; sticky headers must not hide the focused row (scroll-padding) (WCAG 2.4.11).

## P-14 Loading and optimistic updates

| Situation | Behaviour |
|---|---|
| Initial page load | Skeleton in the shape of the final layout (KPI strip, table rows); no spinner-only |
| Filter/sort change | Keep prior rows dimmed 0.6 for ≤400ms then swap; if > 400ms show skeleton rows; announce "Updating results" (polite) |
| Create/edit library entries (category, tag, setting, instructor) | **Optimistic** insert with row marked "Saving", rolled back with `LocalBanner variant="error"` + Retry on failure `[INFER]` |
| **Anything that affects achievement** (send, evaluator submit, approve, return, rule change) | **Not optimistic**: wait for server, show "Sending…" on the button (`disabled`, `aria-busy`), then confirm `[INFER: counts must not flicker]` |
| Import parsing | Determinate progress if row count known, otherwise indeterminate with Cancel |
| Export | Button shows "Preparing export…" then the download; large exports state they cover the full filtered scope `[REQ RP-10]` |
| Evaluator form (S-16) | Per-field autosave of drafts `[INFER]` (preceptor persona: no loss on timeout; REQ silent). Submit is explicit |
**Never** show a stale "Achieved" while a recalculation is pending; show "Recalculating" on the affected badge.

## P-15 Destructive and irreversible confirmations

| Action | Reversible? | Confirmation |
|---|---|---|
| Deactivate a skill | Yes (reactivate); evidence retained `[REQ SL-11]` | `Dialog` stating the effects: withdrawn from mapping, student selection, reporting scope; evidence kept. Primary "Deactivate skill" |
| Deactivate category/tag/setting/instructor | Yes | Inline; if assigned, note that it stays on skills as inactive `[REQ SL-06]` |
| Remove a question/level | Yes until Save | Inline note: "Removed from N rules" `[REQ AE-07]`; recorded evidence retained; Dialog on Save if evidence exists (P-03) |
| Change model | Reverts only by redoing config | P-01 dialog |
| Import "Replace" | **No** | Disabled when evidence exists; else dialog |
| Approve evaluation | No (affects counts) `[REQ AR-06]` | No dialog (it is the decision) but explicit button and result banner |
| Return evaluation | Student can resend | Dialog with note |
| Edit a completed evaluation | **Not possible** `[REQ RV-03]` | No control exists |
| Delete data permanently | Not specified by REQ | Do not design deletion; deactivation only `[INFER]` |
**Wording rule:** destructive primary uses the verb of the action; secondary is "Cancel"; destructive uses `Button variant="destructive"` only for true deletion-like actions, otherwise default.

## P-16 Timing and motion

- Respect `prefers-reduced-motion: reduce`: replace slide/fade with instant state changes; highlight pulses (lineage) become a static 2px marker for 1s.
- Durations: sheet/dialog enter ≤200ms, row highlight ≤1s, banner enter ≤150ms. No auto-dismiss for errors; success banners auto-dismiss never (they carry facts) but are dismissible `[INFER]`.
- Live regions: polite for counts, assertive only for blocking errors on submit.
- No time-limited actions in student/evaluator flows (no countdowns).
- Link/session timeouts (evaluator link expiry): **OD-18**; spec the error state now (P-17) without choosing a lifetime.

## P-17 Error recovery

| Error | Where | Recovery |
|---|---|---|
| Network failure on send | S-13 | Keep all entries; `LocalBanner variant="error"` "Your request was not sent." + **Try again**; nothing is lost; draft kept for the session `[OD-14 seam]` |
| Send rejected (server: no valid evaluator) | S-13 | Explain per P-09 and re-open the offending control |
| Evaluator link invalid/expired/already used | S-16 | Standalone page (no shell): says which of the three; "Ask the student to send a new request"; no data shown `[OD-18]` |
| Evaluator submit fails | S-16 | Answers kept; Try again; never ask to re-answer |
| Import file unreadable | S-08 | Say what failed, keep the paste box, offer re-upload |
| Config save conflict (two admins) | S-09 | Banner "This skill was changed by someone else at 14:02" + "Review their changes" / "Keep mine" `[INFER]`; REQ silent |
| Export failure | S-17 | Retry; filters preserved |
| Permission/role mismatch | any | "You do not have access to this" with no data leak; no hint of other students |
**Unsaved changes:** leaving S-09/S-13 with edits prompts via `Dialog` "Discard changes?" (Cancel = stay, default focus).

## P-18 Explaining outcomes: failed rule (SH-03) and per-setting progress (SH-05)

**Failed rule `[REQ SH-03]`:** when an evaluation did not meet the criteria, the S-14 card shows the **rule in the student's terms** and which part was missed:
- Question-level, "named subset": "To count, you needed Yes on: Performs the procedure correctly, Maintains appropriate technique. You received No on: Maintains appropriate technique."
- Question-level "at least N of M": "You needed at least 9 of 12 Yes. You received 7."
- Scored average: "The average score needed is 3.0. Yours was 2.4."
- Scored minimum on every question: "Each question needs at least 3. Positioning scored 2."
- Binary: "This skill counts when the outcome is Met. The evaluator recorded Unmet."
- Demonstration: no failure (every completed demonstration is evidence `[INFER: rule]`); the explanation is on **criteria progress** instead (below).
Rendered with `LocalBanner variant="warning"` (no `emphasis` prop; that is SystemBanner-only) inside the card + the next step ("You can make a further attempt.") `[REQ RV-03]`. Before/after in `07` §S-14.
**Per-setting progress `[REQ SH-05, SC-11, SC-12]`:** wherever a skill's criteria include setting minimums (S-12 card, S-14 header, S-02 drill), show a line per named setting: "Inpatient 1 of 1 · Emergency 0 of 1". Lab evidence is shown separately ("Lab: 2 recorded, not counted toward clinical settings") so the rule in SC-12 is never a surprise. This resolves the **DEFECT-07** case: a card reading "4 / 4 demonstrations · In progress" must also say "Still needed: 1 in Emergency". Before/after in `07` §S-12.
**Copy hooks:** `09#explain.rule.<model>`, `09#explain.setting.*`.
**REQ:** SH-03, SH-05, SC-11, SC-12, RV-03.

## Pattern → surface index

| Pattern | Surfaces |
|---|---|
| P-01, P-02, P-03, P-05 | S-09, S-04 |
| P-04 | S-08 |
| P-06 | S-01, S-04, S-10, S-15 |
| P-07 | S-01, S-02, S-03 |
| P-08 | S-12, S-04 |
| P-09 | S-13 |
| P-10, P-11 | S-14, S-13, S-03 |
| P-12 | S-11, S-03 |
| P-13, P-14, P-15, P-16, P-17 | all |
| P-18 | S-12, S-14, S-02 |
