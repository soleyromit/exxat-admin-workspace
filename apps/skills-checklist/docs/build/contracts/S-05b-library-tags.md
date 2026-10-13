# Design contract: S-05b Library, tags

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Tags: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[INFER]`. Paired with `_draft-S-05a-library-categories.md`; separate tab with its own single filled primary.

## 1. Surface and wave

**Surface.**
S-05b Library: tags (tab 3 of 5)                                Wave: W1

## 2. Persona and RBAC

P-A Program administrator (R/W). RBAC row: Administrator (program scope).

## 3. Scope and data seen

Program-defined tag list: description, skill count, categories spanned, status. No student data.

## 4. Job to be done and why

**Job-to-be-done.**
When I need a report that cuts across the category structure, I want to tag skills with a shared theme,  
so I can see attainment by that theme.

**Why → So what.**
Categories are one-per-skill; programs also want cross-cutting views (for example hard vs simple skills)  
[CALL 09-23]. So-what: tags let the report by tag (S-01 By tag, RP-04) answer questions the category  
structure cannot, and the tab shows where each tag reaches so admins can see it is doing that job.

## 5. Requirements and open decisions

REQ: SL-01, SL-04, SL-05, SL-06; supports RP-04 (By tag report; figures overlap and the report says so).
Open decisions: none directly. **Seam:** tag is a first-class table with an M:N `SkillTag`; nothing assumes tags partition skills.

## 6. Prototype reference (keep / do not copy)

`docs/source/screens/11-library-tags.png`: tag table plus **"Where each tag reaches"** cards (skills and categories spanned).
**Keep:** the reach cards (they show why tags exist beside categories). **Do NOT copy:** placeholder tag names as ship content; lumping tags and categories on one tab.

## 7. Pattern and reference hub

Route `{base}/library/tags`. Table + add/edit `Dialog`; below the table a "Where each tag reaches" section (cards or an `Accordion` per tag listing skills). Reference hub: `apps/pce/admin/app/(app)/admin/competencies/page.tsx` (same CRUD shape, `DataTable` + `Dialog` + `FieldError` + `LocalBanner`) and `apps/pce/admin/components/admin/admin-hub-client.tsx` (hub + tabs). Interactions: P-14, P-15, P-17, P-13; docs/ux/08.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** All IMPORT. EmptyState = VENDOR. Reach cards are plain `Card` + `Accordion`.


Same verified exports as S-05a (1.5.1 and 1.6.5). Additions: `Accordion` (+ `AccordionItem/Trigger/Content`) for reach lists, `Card` for reach cards, `Badge` for skill chips. All IMPORT. Empty state VENDOR (`empty-state.tsx`). Custom composition: **tag-reach card** (docs/ux/10 §3 S-05 row), HAND-ROLL on `Card` + `Badge`.

## 9. Layout, content and behaviour

Regions: header · intro line · library tabs · tags table · reach section. **One filled primary: `Add tag`.** Columns: Name · Description · Skills (link to S-04 filtered by tag) · Status. Reach card: "{n} skills across {m} categories" + skill chips.
Inline create from S-09 `Create "{text}" as a new tag` `[REQ SL-05]`.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| **L** | Skeleton rows and cards |
| **E** | "No tags yet. Tags are optional." + Add tag; no reach section |
| **Er** | Same as S-05a (banner + retry, dialog entries kept) |
| **V** | Name required; duplicate name message `A tag named "{name}" already exists. Use a different name.` `[INFER, mirrors 09 duplicate pattern]` |
| **S** | Optimistic insert with rollback (P-14) |
| **Su** | Banner "{Name} added." |
| **D** | Controls disabled only while saving |
| **P** | Tag deactivated while assigned: stays on skills labelled inactive; reach card shows "includes inactive skills if any" only if relevant `[INFER]` |
| **Bl** | None |

## 11. Edge cases

EC-9 (inactive tag stays on skill, removable deliberately) · EC-21 (a tag spans categories: reach text states the span and the By tag report states overlap `[REQ RP-04]`) · tag with 0 skills.

## 12. Copy and interactions

`docs/ux/09` §5 **S-05** (Tags intro, buttons, columns, tag reach card, inline create, duplicate, empty); S-01 By tag overlap sentence belongs to S-01's contract.

## 13. Accessibility (WCAG 2.1 AA)

Same as S-05a; reach cards are a list with headings per tag, `Accordion` triggers are buttons with `aria-expanded`; counts are text.

## 14. Out of scope

REQ §14; pre-seeded tags; tag hierarchy; tag colours as meaning (colour is never the only signal); weighting or scoring by tag (RP-04 only requires attainment by tag).

## 15. Acceptance tests (Given / When / Then)

| # | Test | REQ |
|---|---|---|
| T1 | Given a skill, When I add 3 tags, Then any number is allowed | SL-04 |
| T2 | Given Tag X on skills in two categories, When I open Tags, Then the reach card states skills and categories spanned and the tag may span categories | SL-04 |
| T3 | Given I am defining a skill, When I create a tag inline, Then it is available immediately | SL-05 |
| T4 | Given a tag deactivated after assignment, Then it is absent from pickers and remains on skills labelled inactive until removed | SL-06 |
| T5 | Given a fresh program, Then no tags exist | SL-01 |
| T6 | Given the tab renders, Then Add tag is the only filled primary and Categories is a separate tab | global |
| T7 | Given a tag spans 3 categories, When I view the reach cards, Then the card states its skill count and categories spanned; the overlap rule for reports is tested in S-01. | RP-04 |

## 16. Risks and unknowns (max 3)

1. Reach section length for large tag sets (collapse by default).
2. Whether tags need an owner or description (REQ gives name only; description shown in prototype) `[INFER]`.
3. How RP-04 consumes inactive tags (reports include evidence regardless).

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: tags for cross-cutting reports, "complicated vs simple" example) · `Meetings/exam-management/2026-03-05-...md` · `_Insights.md` scanned: nothing further.

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

- 07 §S-05 section title and `Surface index` still list S-05 as one row; the pair split is explained inline (acceptable); 03 §9 permissions row names "S-05 Categories/Tags" as one row (fine, same permission).
- 12 and 06 do not mention the split (low impact).

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Categories and Tags are tabs on the single library page (`?tab=categories`, `?tab=tags`), each a bordered card with the intro bar, one filled Add button and the prototype's column set. Add and Edit use a 672px DS Dialog with the prototype's fields and helper text; status (Active/Inactive) is edited in the dialog. The Tags tab keeps the 'Where each tag reaches' cards (RP-04 context).

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-05 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** SL-03/SL-04/SL-05/SL-06 (inactive-but-assigned stays visible and removable), SL-10 filters, inline create from S-09.

**Weakened or traded away (honest list):** No separate deactivate confirmation dialog (status is changed inside the edit dialog); the old standalone route pages are redirects.
