# Admin flow (Sankalp, 2026-11-02): gap, placement point of view, build order

Status: analysis, read only. Nothing here is decided; open items are listed for Romit at the end.
Consulted (worktree copy `.claude/worktrees/sc-scale`): `docs/knowledge/00-design-brief.md`, `glossary.md`, `02-decisions-ledger.md` (3b to D-L29, 3c to D-X39), `docs/source/requirements.extracted.txt` (SL, IM, SC, CM, section 1.4), `admin/lib/lab/screens.json`, `flows.json`, `lib/lab/configure.ts`, `lists.ts`, `mapping.ts`, `components/lab/configure/*`, `components/lab/library/*`, Granola raw transcript e72ea925 (2026-11-02, Sankalp, Vaibhav, Romit).
Applies: D-L20/D-X33 (Skills panel IA), D-X28 (category, tags), D-X31 (assign step), D-X27 (list inheritance), D-L27/D-L28/D-L26 (wizard just changed), D-X12, hard stops SL-01, SC-02, IM-09.
Tier: Sankalp's six steps and the call are CALL, below REQ. Where they disagree with REQ it is flagged, not resolved.

## A. Gap table

| # | Sankalp step | Today in the lab | State | Change needed |
|---|---|---|---|---|
| 1a | Add one at a time | Add a skill A (sheet), B (inline row): `components/lab/screens/admin-add-skill-a.tsx`, `-b.tsx` | Exists | None for the flow. Drop "configure as the next step" from A's exit once config is program level (the skill is ready when added) |
| 1b | Bulk (paste or upload) | Add a skill C (paste 5 to 30), Bulk upload A/B/C (`admin-import-*.tsx`, Phase 2 "Later"), Starting points A/B (SL-01 conflict flagged, D-X5) | Exists | None. Keep import labelled Later [CALL 10-26]. Starting points: Sankalp again floated domain lists with Sarah [CALL 11-02]; still an SL-01 conflict |
| 1c | Where the library sits | Skills panel: Library, Groups of skills, Categories and tags, Course mapping (D-L20) | Partial | No Prism host chosen; see section B (touches OD-02) |
| 2 | Tags and categories | Categories and tags A/B (`admin-categories-tags-*.tsx`), pickers in every add path (D-X28), library filter | Exists | None. Create inline already meets SL-05 |
| 3a | Program-level evaluation settings | None. Configure the skill A/B/C is per skill (`admin-configure-skill-*.tsx`, `CONFIGURE_STEPS` in `lib/lab/configure.ts:682`). Nearest: "Apply to other skills" sheet (`configure/bulk-apply.tsx`), Copy settings (`library/row-actions.tsx:201`), Configure C `?skills=a,b,c` | Missing | New "Evaluation settings" page: how it's judged, criteria (levels, which level counts), who signs (student, evaluator, approval). Reuse the sections, see C |
| 3b | Only frequency per skill | `need` lives inside each skill's rule (step "How many times") | Contradicted | Per-skill editable "Times needed" column in the library (matrix), prefilled from the program number |
| 3c | Every skill configured | "Not configured" is a first-class state: library tabs, Setup board C, IM-10 counts | Contradicted by the call | Not configured shows only before program settings exist (or for a skill whose model needs its own questions, see D2) |
| 4 | Groups of skills (optional) | Groups of skills A/B (`admin-lists-cohorts-*.tsx`, `lib/lab/lists.ts`) | Exists | Rename to "Requirements" asked; collides with the glossary (D3). Keep optional: nothing downstream may require a group |
| 5 | Assign to student groups, one skill or a group | Assign step A (list to cohorts, tracks, custom groups, D-X31); individual skills A/B (`admin-a/lists-individual.tsx`, `setIndividualSkills`) | Exists | Cohorts first is already the order. Check the entry for "one skill at a time" is visible on A, not only in B's side panel |
| 6a | Course first mapping | Course mapping A (`admin-course-mapping-a.tsx`) | Exists | Level set to Mandatory, Recommended (see D4) |
| 6b | Skill first, longitudinal | Course mapping B (`admin-course-mapping-b.tsx`): one skill across one term's offerings (term filter) | Partial | Show the skill against offerings across terms or professional years (columns by term), not one term. Sarah called this the more useful view [CALL 11-02]: make it the default tab, both reachable by a toggle |

Contradiction note (3a to 3c). Today the per-skill Configure wizard asks the whole evaluation design for every skill (5 steps x 154 skills); Sankalp and Vaibhav want it once per program, with only "how many times" per skill. The wizard stays useful as the program settings page and as a per-skill override.

## B. Placement: where the library sits and where configuration sits

Constraint first: REQ section 1.4 says skills "sit within the broader Competency Management module" and are "distinct from the generic Standards supported today. Where exactly the boundary sits is an open decision (OD-02)." Any option below is a proposal against OD-02, not a decision.

| Option | Mental model | Library | Program settings and times needed | Requirements, mapping | Gains | Costs |
|---|---|---|---|---|---|---|
| 1. Split, like competencies (Vishakha) | Standards is the repository; a module does the tracking | Standards, new Skills tab (list, add, import, categories, tags) | New "Skills and competencies > Skills management", Setup | Same module | Mirrors the competency precedent; one repository of lists | Two places for one job (Sankalp and Vaibhav both said one place); REQ says skills are distinct from Standards; the times matrix wants the list beside it |
| 2. One module (recommended) | One "Skills" home that does everything; Standards only points to it | Skills management > Library | Same module, its own page "Evaluation settings"; times needed is a column in the Library | Same module: Requirements, Course mapping | One place [CALL 11-02]; matches REQ 1.4; matches the lab IA already approved (D-L20); one training path | A new menu; Standards users may look there first (cover with a read-only Skills tab that links in) |
| 3. All in Standards | Standards becomes the setup home for every list | Standards > Skills tab | Inside the same tab | Course mapping stays in curriculum or course pages | Vishakha's central repository taken literally | Standards has only ever held lists [CALL 11-02]; configuration there is new behaviour; mapping still lives elsewhere, so not one place |
| 4. Setup checklist hub | A guided "Set up skills" landing with the six steps as rows, each opening its page | Any host | Any host | Any host | Fits the Wednesday walkthrough; IM-10 progress visible | A layer, not a home; still needs 1, 2 or 3 underneath |

Recommendation: option 2, with option 4 as its landing. Program settings sit in the same area as the library but on their own page, not inside Add a skill: they are set once and rarely, and must not slow adding 150 names. Times needed is edited where the list is (a column in the Library), because that is the one per-skill decision left. A read-only Skills tab in Standards is optional and links into the module.

```
Skills (sidebar row, panel)
  Set up            checklist: 1 Library  2 Categories and tags  3 Evaluation settings  4 Groups  5 Assign  6 Course mapping
  Library           [Add] [Add several] [Bulk upload]   Name | Category | Tags | Times needed [3] | Status
  Evaluation settings   How it's judged | Criteria and which level counts | Who signs (Student, Evaluator, Approval)
  Groups of skills  (name pending: D3)  ->  Assign to cohorts
  Course mapping    [By skill | By course]
```

Note, Angular and React: on the transcript the concern is raised from Romit's microphone and Sankalp confirms it: the new DS is React, while Standards and competency management are Angular. Option 2 keeps the new screens in one React module; options 1 and 3 put React pages inside Angular pages. It argues for option 2 but should not decide placement.

## C. Build order (small slices)

| # | Slice | Touches the wizard just changed? | Notes |
|---|---|---|---|
| 1 | Data seam: split `LabRule` into `ProgramSettings` (model, labels, levels, `minLevelIndex`, scale and scored rule, question rule, distinct evaluators, student fields, feedback, self-evaluation, approval, roles, check-off) and per-skill `SkillSettings` (`need`, `levelMinimums`, `settingMinimums`, questions); `resolveRule()` returns today's `LabRule`, so `runRule` and every student and dashboard figure stay unchanged | Indirectly (same fields) | Tests first: resolved rule equals today's rule for the seeded skills |
| 2 | Evaluation settings page (program level) from the existing sections: `ModelSection`, `OutcomesSection` with `CountsFromField` (D-L27), `SignOffSection` (D-L26), `GroupCheckOffSection`, `ConfigSection` and the preview panel | Yes, reused as is | "How many times" becomes one number "Times needed for each skill" (the program's own, typed; no shipped default) reusing the D-L28 sentence ("needs [3] evaluations rated independent") |
| 3 | Library Times needed column, inline number edit, bulk set for selected rows; Configured counts follow | No | Replaces Setup board C as the "work through" view; IM-10 progress = skills without a number |
| 4 | Per-skill override: Configure A/B kept as "Change for this skill" (any section differs from the program, marked "Differs from program settings") | Yes, the same steps in skill scope | Keeps SC-14, SC-15, SC-16 per skill (D1) |
| 5 | Program settings change impact: reuse Rule change impact A/B with named students before save | No (reuses `impact.tsx`) | Program-wide change hits every skill; needs the impact preview most |
| 6 | Course mapping B longitudinal (terms as columns), make skill-first the default with a toggle | No | CM-02, CM-06 |
| 7 | Rename and level words once Romit answers D3, D4 | No | Copy only, through `labels.ts` and `terms.ts` |
| 8 | Set up checklist landing (option 4) and the Wednesday walkthrough order in `flows.json` | No | Steps 1 to 6 only, no reporting [CALL 11-02] |

## D. Conflicts with REQ, the ledger or an OD

| ID | Conflict | Source vs source | Suggested handling |
|---|---|---|---|
| D1 | Program-level config vs per-skill configuration | CALL 11-02 vs REQ section 3 ("configuration then happens per skill"), SC-01, SC-14 ("per skill whether feedback is mandatory"), SC-15, SC-16 | Program settings as the default every skill inherits, with a per-skill override (slice 4). REQ wins; the override keeps it met |
| D2 | Question and scored models need per-skill questions | SC-04 ("the program defines and maintains the question set") per skill; program-level only covers the shape | If the program picks questions or scores, each skill still needs its questions; those skills stay Not configured until they have them. Levels and Met or Unmet are fully program level |
| D3 | "Requirements" as the new name for Groups of skills | Glossary bans "requirements" as a synonym for the achievement rule and "graduation requirements" for Required to graduate (D-X12) | Ask Romit; alternatives "Skill sets", "Checklists" |
| D4 | Mandatory or Recommended only | REQ CM-03 (mandatory or non-mandatory) is met by two; the lab ships three (Mandatory, Recommended, Optional, CALL 10-26, glossary) | Sankalp now treats unmapped skills as available to all; Optional may be redundant. Ask Romit |
| D5 | "Every skill configured, default 3" | REQ SC-02 (no default assumed), IM-09 (imported skills created unconfigured), IM-13 (no configuration without explicit human confirmation) | The 3 is the program's own typed number, never shipped. New skills added after settings exist get them only after a visible confirm ("Apply evaluation settings to 12 new skills") |
| D6 | Placement | REQ 1.4 and OD-02 (boundary with competencies and Standards) | Section B is a proposal for Romit and Sankalp, not a decision |
| D7 | Admin approval: who approves | SC-15 (whether approval is needed) vs open "which admin" [CALL 11-02] | Keep the switch; do not design an approver picker |
| D8 | Mapping carry forward across terms (longitudinal view) | OD-01 | The longitudinal view shows per-offering levels; it must not imply they copy forward |
| D9 | Starting points | SL-01 vs domain lists with Sarah [CALL 11-02] | Unchanged, still flagged (D-X5) |

Ledger drift seen: D-L20 is used twice in 3b (admin IA and My requests search). Brief section 0 says the Who signs grouping is D-L26 and Configure has 5 steps; consistent with code.

## Open questions for Romit

1. Placement: take option 2 (one Skills module, settings on their own page, times needed in the library) to Sankalp as the point of view? (OD-02 stays open.)
2. Per-skill override: keep "Change for this skill" (needed for REQ SC-14 to SC-16), or hide it from the Wednesday walkthrough?
3. Name for Groups of skills: "Requirements" collides with the glossary; take it, or propose another?
4. Mapping levels: two (Mandatory, Recommended) plus unmapped, or keep Optional?
5. Times needed: should the program settings carry the number (typed by the program), or should the matrix start empty?
