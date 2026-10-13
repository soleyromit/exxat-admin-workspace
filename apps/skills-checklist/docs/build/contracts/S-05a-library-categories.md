# Design contract: S-05a Library, categories

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Tags: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[INFER]`. Precedence REQ > CALL > PROTO > INFER.
S-05 is a **pair of tabs** (S-05a Categories, S-05b Tags), each with exactly one filled primary `[INFER, DEC in docs/ux/11]`. Paired contract: `_draft-S-05b-library-tags.md`.

## 1. Surface and wave

**Surface.**
S-05a Library: categories (tab 2 of 5)                          Wave: W1

## 2. Persona and RBAC

P-A Program administrator (R/W). Others: no access (docs/ux/03 §9). RBAC row: Administrator (program scope).

## 3. Scope and data seen

Program-defined category list with description, skill count, status. No student data.

## 4. Job to be done and why

**Job-to-be-done.**
When I organise my library, I want to define the categories my program uses, so skills group the way my  
program thinks and reports read correctly.

**Why → So what.**
Prism ships no taxonomy [REQ SL-01, §1.6]; the program owns its structure. A category is the one-per-skill  
grouping; tags (S-05b) carry cross-cutting themes [CALL 09-23]. So-what: grouping the admin chose,  
never one we imposed, and retiring a category never silently strips it from skills [REQ SL-06].

## 5. Requirements and open decisions

REQ: SL-01, SL-03, SL-05, SL-06, IM-07 (categories can also arrive from import headings; created only after confirmation).
Open decisions: none directly. **Seam kept:** category is a first-class table (`id, name, description, active`) with a nullable `categoryId` on skill, so a later "hierarchy of skills" (OD-20, Mar call) or category merge is additive. Merge is **not** in REQ and is not designed.

## 6. Prototype reference (keep / do not copy)

`docs/source/screens/08-library-skills.png` (tab strip) and the Categories tab text in `docs/source/prototype-text-dump.txt` ("Categories are defined by the program, Prism does not ship a standard taxonomy… Each skill belongs to at most one").
**Keep:** the sentence that the program defines categories and a skill sits in at most one; skill count column; status column.
**Do NOT copy:** placeholder rows "Category A/B/C … Program-defined category" as shipped data `[REQ SL-01]`; a combined Categories+Tags page (two filled primaries; replaced by two tabs); uppercase tracking-wide headers.

## 7. Pattern and reference hub

- **Pattern:** route `{base}/library/categories`; table plus **add/edit in a `Dialog`** (short, single-object form; reversible; docs/ux/03 §3 puts it in a dialog).
- **Reference hub:** `apps/pce/admin/app/(app)/admin/competencies/page.tsx`: `DataTable` + `Dialog` add/edit, `Field/FieldLabel/FieldError` with `aria-invalid`, `LocalBanner variant="error"` summarising "Fix the following before saving", status badge, `DropdownMenu` row actions. Same shape as a program-defined list, which is exactly this surface.
- **Interactions:** docs/ux/08 P-14 (optimistic insert for library entries with rollback), P-15 (deactivation is inline for categories), P-17, P-13.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** All IMPORT (`DataTable`, `Dialog`, `Field`, `ToggleSwitch`, `StatusBadge`). EmptyState = VENDOR.


Verified 2026-10-08 against `1.5.1` (source.mjs) and `1.6.5` (`dist/index.d.ts`): all exported. Pin caveat per docs/ux/10 banner.

| Need | Component | Verdict |
|---|---|---|
| Tabs | `Tabs` | IMPORT |
| Table | `DataTable` (+ `emptyState`) | IMPORT |
| Add/edit form | `Dialog`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Input`, `Textarea` | IMPORT |
| Active switch | `ToggleSwitch` (controlled `{checked,onChange,aria-label}`) or `Select` Active/Inactive | IMPORT |
| Status | `StatusBadge` semantic (`success` Active, `neutral` Inactive), `sm`/`md` | IMPORT |
| Errors/feedback | `LocalBanner` | IMPORT |
| Row menu | `DropdownMenu` | IMPORT |
| Empty state | vendored `empty-state.tsx` from `apps/pce/admin/components/` | VENDOR |
| Loading | `Skeleton` | IMPORT |

## 9. Layout, content and behaviour

Wireframe: docs/ux/07 §S-05 (S-05a half). Regions: header · intro line · library tabs · table.
**One filled primary: `Add category`.** Secondary: `Edit` per row; dialog footer `Save category` (filled within the dialog; it is the only primary while the dialog is open) / `Cancel`.
Columns: Name · Description · Skills (count, links to S-04 filtered by category) · Status.
Inline create from S-09 (`Create "{text}" as a new category`) creates an **active** category immediately and returns focus to the picker `[REQ SL-05]`.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| **L** | Skeleton rows; tabs render at once |
| **E** | "No categories yet. Add one, or leave skills without a category." + Add category; also explains import can propose categories from headings `[REQ IM-07]` |
| **Er** | Fetch error: `LocalBanner error` + Try again; save error: dialog stays open with entries intact, banner in dialog |
| **V** | Name required; duplicate name (case-insensitive) → "A category named "{name}" already exists. Use a different name." on blur and on Save; summary banner when more than one error |
| **S** | Optimistic insert row marked "Saving", rolled back with banner + Retry on failure (P-14, library entries only) |
| **Su** | Row appears; `LocalBanner success` "{Name} added." dismissible |
| **D** | Add disabled never; Status switch disabled while saving |
| **P** | Category assigned to skills and then deactivated: row shows Inactive with the count of skills still carrying it |
| **Bl** | None. Deactivation is never blocked (REQ SL-06) |

## 11. Edge cases

EC-9 (deactivated category stays on the skill as inactive and is removable deliberately; only active categories offered in pickers) · duplicate names · category created inline in S-09 then S-09 cancelled (category persists; it was created at the point of need `[REQ SL-05]`) · category arriving from import is created only after the admin confirms the import `[REQ IM-13]`.

## 12. Copy and interactions

`docs/ux/09` §5 **S-05** (Categories intro, buttons, columns, inactive-on-a-skill, remove inactive, duplicate name, empty). `{Name} (inactive). It stays on this skill until you remove it.` is the S-09 side of SL-06.

## 13. Accessibility (WCAG 2.1 AA)

Keyboard: tabs (arrows) → Add category → table rows (arrows) → row menu (Enter / Shift+F10) → dialog (focus first field, trap, Esc cancels). Focus returns to the originating button after the dialog closes; after a successful add focus moves to the new row. Errors via `aria-invalid` + `FieldError` + summary banner announced once (assertive only for the blocking summary on Save). Status in text. Targets ≥24×24.

## 14. Out of scope

REQ §14 items; pre-seeded categories `[REQ SL-01]`; category hierarchy/nesting (not in REQ); merge categories (not in REQ); permanent delete (deactivate only `[INFER]`); competency/standards linkage (OD-02).

## 15. Acceptance tests (Given / When / Then)

| # | Test | REQ |
|---|---|---|
| T1 | Given a new program, When I open Categories, Then it is empty and nothing is pre-supplied | SL-01 |
| T2 | Given categories, When I assign one to a skill in S-09, Then a skill has at most one category and the category is optional | SL-03 |
| T3 | Given I am defining a skill, When I type a new category and choose Create, Then it exists immediately and is assigned, without a separate setup exercise | SL-05 |
| T4 | Given a category assigned to 3 skills, When I deactivate it, Then it is absent from pickers, remains on the 3 skills labelled inactive, and I can remove it from each skill deliberately | SL-06 |
| T5 | Given an import confirmed with "Create 3 new categories", Then the three categories exist and none existed before confirmation | IM-07 |
| T6 | Given the tab renders, Then exactly one filled primary (Add category) is present and Tags is a separate tab | global |
| T7 | Given a duplicate name, When I save, Then the dialog shows the duplicate message and does not create the category | SL-03 (integrity) `[INFER]` |

## 16. Risks and unknowns (max 3)

1. Whether "merge categories" is demanded by real libraries after import (REQ silent).
2. Case/whitespace normalisation rule for duplicates `[INFER]`.
3. Category order (alphabetical by default; manual order not in REQ).

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: category vs tag; one category per skill; cross-cutting reports via tags) · `Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md` (hierarchical skills noted as OD-20) · `_Insights.md` scanned for taxonomy/category: no additional skills-specific decision found.

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Categories and Tags are tabs on the single library page (`?tab=categories`, `?tab=tags`), each a bordered card with the intro bar, one filled Add button and the prototype's column set. Add and Edit use a 672px DS Dialog with the prototype's fields and helper text; status (Active/Inactive) is edited in the dialog. A skill belongs to at most one category (SL-03).

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-05 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** SL-03/SL-04/SL-05/SL-06 (inactive-but-assigned stays visible and removable), SL-10 filters, inline create from S-09.

**Weakened or traded away (honest list):** No separate deactivate confirmation dialog (status is changed inside the edit dialog); the old standalone route pages are redirects.
