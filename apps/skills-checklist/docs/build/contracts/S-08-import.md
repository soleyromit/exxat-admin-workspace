# Design contract: S-08 Import (input and review)

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Tags: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

## 1. Surface and wave

**Surface.**
S-08 Import: step 1 input (dialog) and step 2 review (full page)        Wave: W2

## 2. Persona and RBAC

P-A Program administrator (W). RBAC row: Administrator (program scope). P-R none.

## 3. Scope and data seen

The admin's own source file/paste, the proposed list, the existing library (for duplicate matching: names and  
whether a skill has evidence, never student identities). No student data.

## 4. Job to be done and why

**Job-to-be-done.**
When my program already holds a 40-200 skill list in Word, Excel or PDF, I want to bring it in without  
re-typing, reviewing a draft before anything is created, so I see value in minutes, not days.

**Why → So what.**
"The largest single obstacle to adopting the module" [REQ §3]; the doc says re-keying 200 skills is days of work  
"before any value is seen" and a client may decline it. So-what: import is the first-value moment, and the  
review table is the trust moment: if the admin cannot see what was read and what was not, they will not use it.

## 5. Requirements and open decisions

REQ: IM-01, IM-02, IM-03, IM-04, IM-05, IM-06, IM-07, IM-08, IM-09, IM-10 (post-create banner), IM-11, IM-12 (manual create remains: link), IM-13, SL-05 (categories created from headings). IM-14 lives in S-04/S-09. IM-15 is OD-12.
Open decisions and the seam each leaves open:

| OD | Seam |
|---|---|
| **OD-12** interpretation proposes model/criteria? | Import schema carries an **optional** `proposedQuestions[]` per row; the UI renders it only if present in the source and as an editable draft; model/criteria are never proposed (default = no). Nothing created without confirmation `[IM-13]`. |
| **OD-13** re-import of a skill that has evidence | Duplicate resolver returns a per-row decision (`skip | replace | keepBoth`). Default `skip`. `replace` is **disabled** for a matched skill that has evidence (safe default; the real rule is undecided). |
| OD-04 | Import never creates submission fields. |
| OD-15 | Created skills are `configured=false`; no activation step is added. |

## 6. Prototype reference (keep / do not copy)

`docs/source/screens/12-import-review.png`, `13-import-unconfigured-banner.png`; text: "Review 8 skills found in pasted list… Nothing is added until you confirm", counters, "Create 3 new categories", "1 lines were not read as skills… Line 9: SECTION 2 — ADVANCED PROCEDURES · Looks like a section heading".
**Keep:** counters; category opt-in; unread lines with original text and reason; post-create banner (Configure them now / Show them).
**Do NOT copy:** paste-only input (upload is REQ IM-02); a "Possible duplicates 0" counter with no resolution UI; review inside a modal; any wording that suggests the system understood the list (REQ IM-13; strategy/07 C-5). **Not exercised in the prototype:** real file parsing, merge/split/add, duplicate resolution, import-batch label.

## 7. Pattern and reference hub

- **Pattern:** step 1 `Dialog` (Upload / Paste) from S-04 `Import`; step 2 a **full page** `{base}/library/import/{batchId}/review` (500-row lists do not fit a modal `[INFER]`, docs/ux/07 §S-08). Result returns to S-04 with the banner.
- **Reference (read in repo):** `apps/pce/admin/components/admin/admin-import-sheet.tsx` for the *entry* pattern only: source choice cards, hub stays visible behind, banner on completion ("queues an import and reports what will happen"). Its header states the column-mapping editor and the row-level exception review are **not built there**, so our review table (P-04) is net-new and has no repo precedent. Table primitives: `apps/pce/admin/components/data-table/`.
- **Interactions:** docs/ux/08 P-04 (full spec), P-14 (parsing progress), P-15 (Replace), P-17 (unreadable file), P-13.
- **State machine:** SM-04 (docs/ux/05).

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** File upload = **HAND-ROLL one file `SkillsFileUpload`** (no DS primitive; pattern from `apps/pce/admin/components/pce/template-import-dialog.tsx`: hidden `<input type="file" accept=... aria-label>` triggered by `Button variant="outline"`, wrapped in `Field`; accept spreadsheets, word-processed documents and PDF per IM-02, or paste). C-9 import review table = `DataTable` configuration with `InlineInputCell` (IMPORT, not a component file). C-10 duplicate resolver = `RadioGroup` only (skip / replace / keep both).


Verified 2026-10-08 (`source.mjs` 1.5.1; `index.d.ts` 1.6.5): `Dialog`, `Textarea`, `Field*`, `Button`, `DataTable` (+ `InlineInputCell`), `Checkbox`, `Select`, `RadioGroup`, `DropdownMenu`, `Badge`, `StatusBadge`, `LocalBanner`, `Skeleton`, `Collapsible`/`Accordion` exported → IMPORT.
**Gaps (not exported in either version):** `FileUpload`, `Dropzone` → HAND-ROLL a labelled file input inside `Field` (visible `Button`-styled label; no raw `<button>`) or VENDOR if a sibling product has one (none found in `apps/pce/admin`; the import sheet there is a presentation of choices); standalone `Pagination` → use `DataTablePaginated`; `Stepper` not needed (two steps with Back). Custom compositions (docs/ux/10 §5): **C-9 import review table** (DataTable + editable cells), **C-10 duplicate resolver** (`RadioGroup` skip/replace/keep both; ToggleGroup is not used).
Counters row: `KeyMetrics variant="compact"` is allowed but a plain counters strip of `Badge`s is proposed to avoid KPI weight `[INFER]`.

## 9. Layout, content and behaviour

Wireframe: docs/ux/07 §S-08. Hierarchy: step 1 = two source options + one filled primary `Read the list`; step 2 = counters → category opt-in → table → "Not read" region → footer.
- **Exactly one filled primary per step:** step 1 `Read the list`; step 2 `Create {n} skills`. `Back` and `Cancel` are `outline`/`ghost`.
- Row columns: include checkbox · Skill name (editable) · Description (editable) · Category (select: existing / new-from-source / none) · Source reference (original line/row/page, read-only) · Match status (New / Possible duplicate / Heading?).
- Row menu: Exclude, Rename, **Merge with…**, **Split**, **Add a skill here**, Move to category (P-04). Bulk: Exclude, Set category, Include.
- Duplicates: 3-way choice per matched row, default Skip; shows the existing skill name; Replace disabled with reason when evidence exists.
- Not read region: always rendered; zero state reads "Everything was read." with original text of any item otherwise, reason, actions `Add as skill` / `Add as category` / `Ignore`.
- Draft framing line is always visible: "Nothing is added until you confirm. The list below is a draft and may be incomplete." No accuracy claims.
- Skills are created `configured=false`; this is stated before the confirm button.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| **L**oading | Step 1 dialog opens at once. Parsing: determinate progress if row count known, else indeterminate with **Cancel**; review table skeleton on navigation |
| **E**mpty | Nothing pasted/chosen: `Read the list` stays enabled but errors on press ("Choose a file or paste a list."); 0 skills found: "No skills were found in this source. Check the file, or paste the list." with the Not-read list shown |
| **Er**ror | File unreadable: "This file could not be read. Try another file, paste the list, or add skills one at a time." paste box kept; parse service failure: same with Retry; create failure: nothing created, banner + Retry, review state preserved |
| **V**alidation | Row name empty → row cannot be included; two included rows with the same name → inline warning and require rename/merge; category name collisions merged by the resolver; unsupported file type message |
| **S**aving | `Create {n} skills` busy and disabled; **not optimistic** (creates library entries and categories) |
| **Su**ccess | `LocalBanner success`: "Added {n} skills to the library. They cannot be used until each one is configured." actions `Configure them now`, `Show them`; batch label recorded |
| **D**isabled | `Create` disabled when 0 rows are included, with reason; Replace disabled with reason when evidence exists |
| **P**artial | Some rows unread: Not-read region counts them; confirming creates only included rows; leaving the page prompts "Discard this import?" when edits exist |
| **Bl**ocked | Cannot create when any included row is an unresolved exact duplicate (must choose skip/replace/keep both); the row says so in text |

## 11. Edge cases

EC-27 (re-import of the same list: duplicates detected, no silent overwrite) · EC-28 (imported skills cannot be mapped or submitted) · 500+ rows (virtualised, keyboard row navigation) · heading detected as a skill (proposal: "Looks like a section heading" → Add as category) · source with evaluation questions present (carried as optional draft only, OD-12 seam) · second file added to the same batch `[INFER]` · import cancelled before confirm creates nothing `[REQ IM-13]` · skill name that matches a category name.

## 12. Copy and interactions

`docs/ux/09` §5 **S-08** (all strings including prohibited words), §1 rule "No claims about import accuracy", §3.1 buttons, §3.2 banners, §8 index. Missing in 09 (flag): merge/split confirmation, "Discard this import?" prompt, "Choose a file or paste a list." error.

## 13. Accessibility (WCAG 2.1 AA)

Keyboard (P-04): Up/Down between rows, Space toggles include, Enter edits a name, Esc cancels an edit, row menu with Shift+F10 or visible "⋯" button; Tab leaves the table. Dialog: focus to first option, trap, Esc closes, focus returns to Import. Progress and counters announced politely; errors via summary banner + field errors. Match status is text (not colour). File input has a visible label and is reachable by keyboard. Targets ≥24×24; the review table keeps sticky header without hiding the focused row.

## 14. Out of scope

REQ §14; automatic creation without confirmation `[IM-13]`; proposing evaluation models or criteria (OD-12, not decided); mapping or configuring during import; migrating from the Evaluations module; remembering formats per client; marketing claims about AI.

## 15. Acceptance tests (Given / When / Then)

| # | Test | REQ |
|---|---|---|
| T1 | Given a spreadsheet of skill names, When I upload it, Then a proposal list is produced without any prescribed template or column order | IM-01, IM-03 |
| T2 | Given a Word document and a PDF, When I upload each, Then each is accepted as a source (pasted text also works) | IM-02 |
| T3 | Given a source with descriptions and headings, When read, Then descriptions fill the description field and headings are proposed as categories applied to the skills beneath them | IM-04, IM-07 |
| T4 | Given the proposal, When I edit, rename, merge, split, discard and add entries and then Back, Then nothing exists in the library until I confirm | IM-05, IM-13 |
| T5 | Given a proposed skill named like an existing one, When I review, Then I choose skip, replace or keep both for that row, and Replace is disabled when the existing skill has evidence | IM-06 (OD-13 safe default) |
| T6 | Given lines that could not be interpreted, Then each appears with its original text and reason in a Not-read region and none are silently dropped; if all read, the region says so | IM-08 |
| T7 | Given I confirm, Then the skills are created unconfigured, are marked "Needs configuration", and cannot be mapped to an offering or submitted against | IM-09 |
| T8 | Given 8 imported skills, When I return to the library, Then a banner shows how many need configuration and "Show them" filters them | IM-10 |
| T9 | Given a second import, When I confirm, Then skills are added without replacing the library and I can filter to each import batch | IM-11 |
| T10 | Given I prefer manual entry, Then Add skill remains available beside Import | IM-12 |
| T11 | Given any interpretation result, Then the page frames it as a draft and no copy claims accuracy; no skill, category or configuration exists before explicit confirmation | IM-13 |
| T12 | Given categories proposed from headings, When I leave the opt-in unchecked, Then no categories are created | SL-05, IM-07 |
| T13 | Given the source includes evaluation questions, Then they appear only as an editable draft or not at all, and no evaluation model or criteria are proposed (OD-12 default) | IM-15 (OD-12) |
| T14 | Given each step, Then exactly one filled primary is present and no action button has an icon | global |
| T15 | Given the post-import banner, When I choose "Configure them now", Then S-04 opens filtered to Needs configuration, where copy and apply configuration are available (entry point only; tested in S-09). | IM-14 |

## 16. Risks and unknowns (max 3)

1. **Interpretation quality** (the riskiest dependency; docs/build/01 §7): the call says AI will scan documents; REQ IM-13 forbids acting without confirmation. The interpreter is an unbuilt service here; the UI must work with its contract (rows with source reference, optional description, optional heading) `[INFER]`.
2. **No file-upload primitive** in the DS and no vendor candidate found; a hand-rolled accessible file input is needed.
3. **OD-13** may later allow Replace for skills with evidence.

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: 40-50 skill lists in Word/Excel/PDF; do not restrict to specific document types; upload means "adding" and "configuring" must be separate and unconfigured skills cannot be activated) · `Meetings/exam-management/2026-03-05-...md` · `_Insights.md` scanned: `Meetings/exam-management/2026-04-13-canvas-exam-management-capabilities-demo-with-carol` (Canvas has no bulk Word import; titled in the index, body not read) and `Meetings/exam-management/2026-07-30-exam-management-weekly-call` (import-one-at-a-time validated for exam content; analogy only).

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

- 08 P-04 line "Duplicates … `ToggleGroup`" vs 10 §5 C-10 (`RadioGroup`): resolved in the fix pass (08 P-04 updated to RadioGroup).
- 07 §S-08 wireframe: step 2 counters include "Excluded 0" and "Not read 1"; 09 counters list only Found / Will be created / Possible duplicates.
- 03 §4 gives the review route as `.../import/{batchId}/review`, 07 says "dialog for input; full page (or large sheet) for review"; 09 titles both as "Import skills" and "Review {n} skills found in {source}" (compatible).
- 05 SM-04 shows "Read failed" with an `[INFER]` copy; 09 has two error strings; the "Choose a file or paste a list." empty error is missing in 09.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-1. Strong fit: Melio (ready/needs-fixing banner, errors-only toggle, count on the confirm button), Copy.ai (All / Clean / Issues tabs), Attio (raw vs mapped value). No precedent for listing unread lines with original text (IM-08). Analogues only.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Import is a DS Dialog flow opened by `?dialog=import` on the library page (input 1024px; the review step shows the counters Found / Will be created / Possible duplicates / Not read, the editable row table, the create-categories opt-in and the Not read list with original text; created state returns to `/library/skills?imported=<batchId>` with the success banner and the Configure / Show them / Import another actions). The old `/library/import` and `/library/import/[batchId]/review` routes redirect or open the dialog. The duplicate decision (skip / replace / keep both) is in the review dialog when the count is above zero (parity C-12). An optional TypeSafe 'Read with AI' assist is designed in `docs/build/typesafe-import-design.md` (select-don't-generate; names, descriptions and category only, OD-12 open; never auto-confirms; IM-13).

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-06 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** IM-01..IM-13, nothing created before explicit confirmation, imported skills arrive unconfigured and are excluded from mapping and student lists (IM-09), junk lines never proposed as skills, ALL-CAPS headings proposed as opt-in categories, unread lines kept with original text (IM-08), batch traceability (IM-11).

**Weakened or traded away (honest list):** IM-02 is only partly met: text and CSV parse in the app; spreadsheet, document and PDF extraction exist only as the design until the TypeSafe build ships. The review table is a dialog (1024px), so very long lists scroll inside it. IM-14 copy and apply controls live in S-09, not here.
