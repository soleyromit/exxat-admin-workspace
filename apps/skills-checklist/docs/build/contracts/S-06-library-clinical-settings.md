# Design contract: S-06 Library, clinical settings

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Tags: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

## 1. Surface and wave

**Surface.**
S-06 Library: clinical settings (tab 4 of 5)                     Wave: W1

## 2. Persona and RBAC

P-A Program administrator (R/W). RBAC row: Administrator (program scope).

## 3. Scope and data seen

Program-defined settings with evidence-recorded counts (aggregate numbers only), status. No student rows.

## 4. Job to be done and why

**Job-to-be-done.**
When I define where clinical evidence can be gathered, I want a list of settings my program recognises, so  
students pick from it and I can require evidence per setting.

**Why → So what.**
Programs ask "complete this skill in this setting at least once" [CALL 09-23]. The list is the vocabulary for  
SC-11 minimums and for filtering reports by setting [RP-01]. So-what: if the list is wrong or unstable,  
minimums become unsatisfiable, so deactivating a setting must never silently break a skill's criteria.

## 5. Requirements and open decisions

REQ: SL-07, SC-11, SC-12 (display only: lab is never a clinical setting and never satisfies one), SL-01 (nothing pre-seeded; the prototype's five names are sample data).
Open decisions: proposed **OD-26** (setting deactivation block; see below) and proposed **OD-25** (the role → evidence-type validity map that makes a setting minimum satisfiable; seeded data, not edited from this surface). **Not in REQ, proposed `[INFER]`:** deactivating a setting referenced by any skill's setting minimum is blocked with a reason naming the skills (F-14 branch b in docs/ux/04). This protects SC-18 (unsatisfiable configs) and is logged as **OD-26** in docs/strategy/05. Needs Sankalp's confirmation; **seam:** a `referencedBy(settingId)` query that returns skills; the block is one rule that can be switched to a warning.

## 6. Prototype reference (keep / do not copy)

`docs/source/screens/10-library-settings.png`: paragraph "A student on one placement may move between several settings… Applies to clinical evidence only; lab evidence is recorded as lab." plus table Setting / Evidence recorded / Status.
**Keep:** the explanatory paragraph (it prevents the SC-12 surprise). **Do NOT copy:** sample names as shipped data; the large evidence counts as KPI-style emphasis (they are information to judge impact, not a metric).

## 7. Pattern and reference hub

Route `{base}/library/settings`. Table + add/edit `Dialog`. Reference hub: `apps/pce/admin/app/(app)/admin/competencies/page.tsx` (list CRUD with Dialog and `FieldError`) and `apps/pce/admin/components/admin/admin-hub-client.tsx` (hub + tabs). Interactions: P-14, P-15, P-17, P-13.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** All IMPORT. EmptyState = VENDOR. The role→evidence-type validity map is data owned under proposed **OD-25**; deactivation block rule is proposed **OD-26**.


Verified 2026-10-08, `1.5.1` and `1.6.5`: `Tabs`, `DataTable`, `Dialog`, `Field*`, `Input`, `StatusBadge` semantic, `ToggleSwitch`, `LocalBanner`, `DropdownMenu`, `Skeleton`, `Tooltip` all exported → IMPORT. `EmptyState` not exported → VENDOR `apps/pce/admin/components/empty-state.tsx`. Blocked-deactivation explanation uses `LocalBanner variant="warning"` inside the dialog.

## 9. Layout, content and behaviour

Regions: header · explanatory paragraph (always visible) · tabs · table. **One filled primary: `Add setting`.** Columns: Setting · Evidence recorded · Referenced by (count of skills with a minimum on it, link to S-04) `[INFER]` · Status. Order is alphabetical; the prototype order is arbitrary.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| **L** | Skeleton rows |
| **E** | "No clinical settings yet. Add the settings your program tracks, for example inpatient or outpatient." Students cannot record clinical evidence until at least one exists; the empty state says so `[INFER from ST-06/07]` |
| **Er** | Fetch/save error banner + retry; dialog values kept |
| **V** | Name required; duplicate name rejected; a name that equals the reserved word "Lab" or "Simulation" is rejected with "Lab and simulation are recorded separately and are not clinical settings." `[REQ SC-12, INFER rule]` |
| **S** | Optimistic insert with rollback; deactivation waits for server (affects scope) |
| **Su** | Banner "{Setting} added." / "{Setting} deactivated. Evidence already recorded is kept." |
| **D** | Deactivate disabled with tooltip reason while blocked |
| **P** | Setting deactivated but historical evidence remains and reports still show it filterable |
| **Bl** | **Deactivation blocked** if referenced by a minimum: dialog states "{Setting} is required by {n} skills: {names}. Remove the minimum first." with links `[INFER]` |

## 11. Edge cases

EC-5 (setting minimum with lab-only evidence is not satisfied) is an engine rule exposed as copy here · EC-12/13/14 consume this list in S-13 (single setting inferred, no placement → full list) · reactivation restores availability · rename of a setting never changes recorded evidence (labels are presentation `[REQ AE-06]` analogue; confirm).

## 12. Copy and interactions

`docs/ux/09` §5 **S-06** (intro, button, columns, empty). Blocked deactivation copy to be added to 09 §8 (not present today; flagged).

## 13. Accessibility (WCAG 2.1 AA)

Keyboard as S-05a; blocked-reason text associated with the disabled control via `aria-describedby`; counts are text; status is text. Explanatory paragraph is plain text above the table (not a tooltip).

## 14. Out of scope

REQ §14; location records (sites/locations come from placements, not this list `[REQ ST-06]`); regional or rotation-based thresholds (OD-21); setting hierarchies.

## 15. Acceptance tests (Given / When / Then)

| # | Test | REQ |
|---|---|---|
| T1 | Given clinical settings I defined, When a student records clinical evidence in S-13, Then the options come from this list | SL-07 |
| T2 | Given a skill with a minimum of 1 in Emergency, When I try to deactivate Emergency, Then it is blocked with the skill names and no skill becomes unsatisfiable (proposal pending confirmation) | SC-11 `[INFER]` |
| T3 | Given lab evidence recorded for a skill, Then it never appears in "Evidence recorded" for any clinical setting | SC-12 |
| T4 | Given a new program, Then no settings exist | SL-01 |
| T5 | Given the tab renders, Then Add setting is the only filled primary and the explanatory paragraph is visible | global |
| T6 | Given a setting is deactivated (no minimum references it), Then it is not offered to students and evidence already recorded remains filterable | SL-07 `[INFER]` |
| T7 | Given Emergency is referenced by a skill's setting minimum, When I try to deactivate it, Then it is blocked with a reason naming the skill(s), so no saved criteria become unsatisfiable (proposed OD-26). | SC-18 |

## 16. Risks and unknowns (max 3)

1. The block-on-reference rule is my proposal; REQ is silent on setting deactivation.
2. Whether Prism already holds a tenant-level list of placement settings that this should read instead (dependency; see blueprint 06).
3. Renaming a setting after evidence exists (presentation only; confirm).

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: setting-specific minimums "at least once in this setting", wish-list of setting/rotation/regional levels) · `Meetings/exam-management/2026-03-05-...md` · `_Insights.md` scanned: nothing further on settings.

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

- 07 §S-06 says the deactivation block "needs REQ confirmation"; 04 F-14 branch and 02 do not list it as a proposed decision with an ID; 05-open-decisions has no row for it. Proposal: log as proposed OD (not yet in `docs/source/proposed-ids.txt`); not added by this worker.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Clinical Settings is a tab (`?tab=settings`): intro bar, one filled Add setting, table Setting / Evidence recorded / Status. Add and Edit use a 672px dialog. The OD-26 block (a setting that a skill's per-setting minimum references cannot be deactivated) now appears INSIDE the setting dialog naming the blocking skills, replacing the separate blocked-deactivation dialog.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-05 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** SL-07, SC-11/SC-12 (lab evidence never satisfies a setting), OD-26 block with reason and the `?setting=` link to the skills list, SC-18.

**Weakened or traded away (honest list):** The confirmation-before-deactivate dialog was removed; the 'Required by' link to S-04 depends on the dialog's message rather than a table column.
