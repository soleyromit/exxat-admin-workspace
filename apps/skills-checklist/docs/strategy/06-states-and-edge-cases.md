# 06 — State Coverage, Edge Cases, Accessibility, Privacy

Feeds the `state-review` agent (workspace `docs/governance/component-state-catalog.md`). One row per surface; every cell must be designed, not "handled later".

## 1. State coverage map

States: **L**oading · **E**mpty · **Er**ror · **V**alidation · **S**aving/sending · **Su**ccess/confirmation · **D**isabled · **P**artial/in-progress · **Bl**ocked-with-reason

| Surface | L | E | Er | V | S | Su | D | P | Bl | Specific cases (source) |
|---|---|---|---|---|---|---|---|---|---|---|
| Library › Skills | ✔ | ✔ | ✔ | — | — | — | — | ✔ | — | E: no skills at all → lead to Import/Add; filtered-to-zero. P: "N need configuration" `[IM-10]` |
| Import: input | ✔ | ✔ | ✔ | ✔ | ✔ | — | ✔ | — | — | E: nothing pasted; V: unsupported file; Er: file unreadable; parse in progress |
| Import: review | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — | ✔ | — | Zero skills found; all excluded; duplicates; unread lines (never silent `[IM-08]`); confirm creates N |
| Skill configure | ✔ | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | V: SC-06/SC-18 rules (empty subset, duplicate labels, minimum>total); model change → criteria rebuild confirm `[SC-09]`; save blocked with reason; rule change on skill with evidence → impact notice `[AE-02]` |
| Categories/Tags/Settings/Lab instr. | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — | — | — | Inactive-but-assigned `[SL-06]`; duplicate names; student-named instructor adoption `[SL-09]` |
| Course mapping | ✔ | ✔ | ✔ | — | ✔ | ✔ | — | ✔ | — | E: offering with no cohort ("0/0"), no results for filters; unconfigured skills excluded `[IM-09]`; inactive skills excluded `[SL-11]` |
| Review & approve | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — | — | E: queue empty; disagreement flagged; return requires note? (REQ: note optional `[AR-04]`) |
| Student: course skills | ✔ | ✔ | ✔ | — | — | — | — | ✔ | — | E: no skills mapped to course; achieved-but-resubmittable; evidence in other courses counts `[SH-06]` |
| Student: send dialog | ✔ | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Bl: no valid setting×role combination → say why `[ST-08]`; no placement `[ST-07]`; single setting inferred `[ST-06]`; unlisted lab instructor needs email `[ST-09]`; mandatory fields `[ST-10]` |
| Student: history | ✔ | ✔ | ✔ | — | ✔ | ✔ | ✔ | ✔ | — | Four outcomes `[SH-02]`; failed-rule explanation `[SH-03]`; locked states `[RV-05]` |
| Evaluator form (no login) | ✔ | — | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Er: link expired/invalid (OD-18); already submitted; mandatory comment `[EV-06]`; multi-skill partial; counts-now vs held message `[EV-07]` |
| Reports | ✔ | ✔ | ✔ | — | ✔ | ✔ | — | — | ✔ | Bl/explain: impossible filter combination `[RP-09]`; E: no students in view; export in progress; full filtered scope not just page `[RP-10]` |

## 2. Edge-case catalogue (derive tests from these)

| # | Case | Expected | Source |
|---|---|---|---|
| EC-1 | Skill with 200 questions in qualification rule | Usable; subset picker scales | SC-06 |
| EC-2 | Two levels same label | Save blocked | SC-18 |
| EC-3 | Binary labels identical | Save blocked | SC-03 |
| EC-4 | Level minimums sum > total required | Save blocked | SC-18 |
| EC-5 | Setting minimum with lab-only evidence | Not satisfied | SC-12 |
| EC-6 | Rule edited after evidence exists | Evidence re-qualified; students may change state | AE-02 |
| EC-7 | Question renamed | Past answers unchanged, counts unchanged | AE-06 |
| EC-8 | Level deleted | Removed from rules; evidence retained but no longer counts toward that level `[PROTO text]` | AE-07 |
| EC-9 | Category deactivated while assigned | Remains on skill flagged inactive | SL-06 |
| EC-10 | Skill deactivated with evidence | Withdrawn from mapping/selection/reporting scope; evidence retained | SL-11 |
| EC-11 | Student submits unmapped skill | Allowed; counts | CM-05 |
| EC-12 | Student rotates across 3 locations/settings | Choose one per submission (OD-07) | ST-06 |
| EC-13 | No placement recorded | Full settings list | ST-07 |
| EC-14 | Setting requires role the skill forbids | Explain; no dead end | ST-08 |
| EC-15 | Lab instructor not on roster | Student supplies name+email; admin sees & adopts | ST-09, SL-09 |
| EC-16 | Misspelt lab instructor twice | Adoption merges, avoids duplicates | SL-09 |
| EC-17 | Evaluator unavailable | Student resends to another | RV-04 |
| EC-18 | Completed eval didn't meet criteria | Student makes *further attempt*; original untouched | RV-03 |
| EC-19 | Admin returns an eval | Does not count; student corrects (OD-16) | AR-05 |
| EC-20 | Evidence awaiting approval | Cannot edit/resend; not counted | RV-05, AR-06 |
| EC-21 | Tag spans categories | Report states overlap | RP-04 |
| EC-22 | Filter by location with a setting not offered there | Explain | RP-09 |
| EC-23 | Filter location+setting | Count only evidence there, recompute progress | RP-08 |
| EC-24 | Export while filtered | Full filtered scope; filters in header | RP-10 |
| EC-25 | Student achieved skill, asks again | Allowed (program may want more evidence) `[PROTO copy]` | — |
| EC-26 | Two students same name | Disambiguate in tables `[INFER]` | — |
| EC-27 | Import re-run with same list | Duplicates detected; no silent overwrite | IM-06, OD-13 |
| EC-28 | Imported skill unconfigured | Cannot map or submit | IM-09 |

## 3. Accessibility (WCAG 2.1 AA) — design obligations, not yet tested

- The prototype uses **colour pills** (amber/green/blue) for status; every status must also carry text/icon `[WCAG 1.4.1]`.
- Segmented controls & icon buttons need `aria-label` + visible focus ring `[CLAUDE.md]`.
- Modals/sheets: focus trap, Esc, return focus. The prototype's wizards are modals: keyboard path must be tested.
- Evaluator form on a phone: ≥24×24 targets, large Yes/No, no hover-only affordances.
- Tables with 150 rows: pagination or virtualised with row headers; sort state announced.
- Charts/progress: text equivalents; no "progress bars as sole viz".
- Run `axe` per route in default + each interaction state before any "done" claim (`ds-conformance-reviewer`).

## 4. Privacy / role scope (FERPA, RBAC) `[exxat-domain-context]`

- Student sees only own record `[INFER]`. No peer data.
- Evaluator link exposes **only that request**: student name, course, skill, submitted details. Do not show historical or aggregate data (see OD-17).
- Lab instructor and preceptor emails are PII: store once (OD-05), show to admin only.
- Review notes are internal; the prototype shows "Reviewer note" to the student after a return — decide intentionally (it is *the reason it was returned*, `[RV-02]` requires the reason retained).
- Exports contain student data: record who exported and filters used (`[RP-10]` records filters; audit trail not required but advisable `[INFER]`).
