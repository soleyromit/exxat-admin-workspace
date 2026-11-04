# Evaluation settings: three concepts that add context without text (2026-11-03)

Status: proposals only. No app code changed. Nothing here is decided; no OD is treated as decided.
Ask (Romit, 2026-11-03): "can we come up with a better version of evaluation settings? I see a lack of context." Constraint (Romit, same message): no dense text or subtext anywhere; context comes from structure, examples, previews, visuals, counts and links.

Consulted (worktree copy `.claude/worktrees/sc-scale`): `docs/knowledge/00-design-brief.md` (section 0), `02-decisions-ledger.md` (D-L27, D-L28, D-L30, D-L34 to D-L37, D-X41, D-X44, D-X47), `docs/build/2026-11-02-admin-flow-gap-and-placement.md`, contract `docs/build/contracts/V2-06-admin-setup-and-program-settings.md`, `docs/source/requirements.extracted.txt` (SC, IM, AE-07), `admin/components/lab/screens/admin-evaluation-settings-{a,b,c}.tsx`, `components/lab/configure/{program-parts,program-layout,live-panel,check,impact}.tsx`, `lib/lab/program-settings.ts`, `lib/lab/configure.ts`. Glossary not re-read in full this pass (vocabulary below is taken from labels already in code).
Applies: D-L34, D-L36 (no subtext), D-L37 (four sections, one vocabulary), D-X41, D-X44, D-X47, D-L27, D-L28, D-X30 (full width), hard stops SC-02, IM-09.

## 0. What is wrong today, in numbers (seed, measured 2026-11-03)

Probe: `createSeed()` + `notConfiguredIds()` in a throwaway vitest file (deleted after).

| Fact | Value | Shown on the page today? |
|---|---|---|
| Skills in the library | 178 (176 active) | No |
| Not configured | 31 | No |
| Skills already using Independence level | 107 | No |
| Questions, then a final result | 23 | No |
| Scored | 19 | No |
| Approved or not approved | 11 | No |
| No model yet | 16 | No |
| Program settings saved | None (every row "Not set") | Yes, as 12 "Not set" lines |

The page hides the single most important fact: the library is already mixed across four models. On the first save `planProgramApply` treats every active skill as taking the program settings (no previous program settings means no skill counts as "own"). Picking one model would rewrite up to 145 configured skills. The confirm dialog shows the counts, but only after the admin has made every choice blind. That is the real "lack of context".

The four context gaps Romit named, and the device each concept uses (never a paragraph):

| Gap | Device |
|---|---|
| What each model means and looks like | A drawn sample of the evaluator's control (A: live form; B: mini form inside each tile; C: sample inside the editing sheet) |
| Scope: applies to N skills, how many differ | One scope line with counts that are links |
| What happens to existing evaluations if changed | Counts per outcome (changes, keeps, needs its own questions) before save; evidence choice stays open (D-X27) |
| Why later sections are empty | The section shows its locked shape (greyed controls, lock glyph, the name of the section that unlocks it) instead of an empty sentence |
| Relation to the per-skill times needed | "Different from 3: 14 skills" as a link to the list on the same page (D-X44) |

## 1. Requirement coverage the page must keep (all three concepts)

| ID | Quoted (shortened) | How every concept keeps it |
|---|---|---|
| SC-01 | "Creating a skill and configuring how it is evaluated are separate actions." | Settings page separate from Add a skill |
| SC-02 | "The model must be chosen explicitly; no default is assumed" | Nothing preselected; previews show a neutral sample until a model is picked; summary reads "Not set" |
| SC-03 | binary: both labels program-defined, which qualifies recorded explicitly | Outcomes section, "Which one counts" required |
| SC-04 | question and scored: "the program defines and maintains the question set" | Per skill; skills without questions are counted as "Need their own questions" (D2) |
| SC-05, SC-06, SC-07 | question rule; satisfiable; scored scale and rule | Reused `OutcomesSection` |
| SC-08 | levels program-defined, ordered, no fixed three-point scale | Level list editor; "Use a starting set" menu fills labels only |
| SC-09 | changing the model rebuilds the criteria | `withModel()`; previews redraw |
| SC-10 | total and minimum per level | Times needed + per-skill minimums |
| SC-13 | what the student supplies, typed fields | Who signs, student fields |
| SC-14, SC-15, SC-16 | feedback, self-evaluation, approval, signer roles per skill | Program value + "Change one skill" override (D-X41) |
| SC-17 | "The dependency from evaluation model ... to the achievement criteria must be apparent" | This is the requirement the page fails today; each concept answers it visually |
| SC-18 | unsatisfiable configuration not savable | Save validation, fix list |
| SC-19 | "review everything it will ask of the student and the evaluator, together" | A: always visible; B: on the summary column; C: in each sheet |
| IM-09 | imported skills unconfigured and distinguishable | "31 not configured" link |
| IM-10 | see how many still require configuration and work through them | Same count, opens the list |
| IM-13 | no configuration without explicit human confirmation | Save confirm with counts |
| IM-14 | apply a configuration to several selected skills | The program save is that, for all; "Only these skills" stays |
| AE-07 | removing a question or level removes it from rules | Reused editors |

Simplify guardrail: no concept removes a field, state or action above. Compact parts (tiles, sheets) carry the same fields as the current sections.

## 2. Research

| Reference | What it teaches | Not to copy |
|---|---|---|
| [Calendly, event settings beside a live booking preview](https://mobbin.com/screens/e73f7627-0f89-45f3-b5d3-304b86e31a37) | Settings as collapsed rows each showing its current value in one line ("Asking for first name, last name, +2 questions"); the preview is the larger region | Preview-first at the cost of the settings; "This is a preview" banner |
| [incident.io, create custom field with preview](https://mobbin.com/screens/2f0a19d1-ffdc-4f31-b79f-9341aac268de) | A changing control type redraws a real preview beside it, no explanation needed | Half the width empty below a tiny preview |
| [Featurebase, survey templates as rendered mini surveys](https://mobbin.com/screens/b5adb8c8-4756-4508-9122-11d4fd14c920) | Each choice is shown as the thing respondents will actually see | Description sentences on every card (Romit's no-subtext rule) |
| [HoneyBook, question type thumbnails](https://mobbin.com/screens/8d4f1d25-196b-41ad-9ef3-16c7cebcb8cd) | A drawn thumbnail per type replaces a definition | Icon-only tiles (which is what we have today) |
| [Square, buy button preview inside the section](https://mobbin.com/screens/f34b19ca-4955-48e6-bd92-e72b96f0b4ca) | Preview can sit inside the section it explains, not only in a side panel | Toggle walls |

Analogies outside SaaS: A is print preview (you see the page before you print it); B is a menu with photos (you pick the dish by looking, not by reading); C is a bank statement or pull request (each line shows old value, new value and how many accounts it touches).

## 3. Shared elements (used by all three)

- Scope line, directly under the title, one row: `176 skills · 31 not configured · 14 different from 3` where the last two are links (Library filtered; the times list on this page). Before the first save: `176 skills · 31 not configured · 4 models in use`. No sentence, only counts and links.
- Locked sections show their real control shape at muted weight with a lock glyph and the unlocking section's name as the only words (for example "After How skills are judged"). Replaces "Choose how skills are judged first."
- Save confirm (existing dialog, `planProgramApply`) as a four-row count table: Change · Already match · Keep their own · Need their own questions. Each count opens the named skills.
- Labels and status words from `lib/v2/labels.ts`, `inSentence()` for labels mid-sentence; no "tick", "items", "pending".

## 4. Concept A: Form beside the choices (live preview)

Mental model: what I pick is what the evaluator and the student get. Primary job: choose the four settings while watching the evaluator form and the student request assemble.

```
1440 x 900 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
│ Skills ▸ Evaluation settings                                                                                            │
│ Evaluation settings                                                                                                     │
│ 176 skills · 31 not configured ↗ · 4 models in use ↗                                                                    │
├───────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┤
│ How skills are judged                                         │  [ Evaluator ]  Student                     sample skill │
│ ┌──────────────┐┌──────────────┐┌──────────────┐┌───────────┐ │ ┌─────────────────────────────────────────────────────┐ │
│ │ ○ Approved or││ ● Questions, ││ ○ Independ-  ││ ○ Scored  │ │ │  Prism  ·  Evaluation for Maya Chen                 │ │
│ │   not        ││   then a     ││   ence level ││           │ │ │  IV insertion · Date performed 2026-10-28           │ │
│ │ 11 skills ↗  ││   result     ││ 107 skills ↗ ││ 19 skills↗│ │ │ ─────────────────────────────────────────────────── │ │
│ └──────────────┘│ 23 skills ↗  │└──────────────┘└───────────┘ │ │  1 Verifies patient identity        ( Yes ) ( No )  │ │
│                 └──────────────┘                              │ │  2 Selects the correct site         ( Yes ) ( No )  │ │
│ What counts as achieved                                       │ │  3 Maintains a sterile field        ( Yes ) ( No )  │ │
│  Qualifies when  [ All questions Yes        ▾ ]               │ │                                                     │ │
│  Result labels   [ Met     ] [ Not met  ]  Counts [ Met ▾ ]   │ │  Result        ( Met )  ( Not met )   ◀ highlights  │ │
│                                                               │ │  Feedback      [                               ]    │ │
│ How many evaluations                                          │ │                                                     │ │
│  Each skill needs [ 3 ] evaluations rated met                 │ │                         [ Sign and submit ]         │ │
│  Different from 3: 14 skills ↗                                │ └─────────────────────────────────────────────────────┘ │
│                                                               │   ● changed  "Result" redrew after your last choice    │
│ Who signs                                   (below the fold)  │                                                         │
├───────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┤
│                                                                                       [ Save settings ]                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Before a model is chosen, the preview is the skeleton of a form (grey bars, no options), and the summary words "Not set" disappear: the preview is the summary. Student tab shows the request card the student fills (the `studentFields`, self-rating if on) and the one-line rule the student will read ("3 evaluations rated met").

| Line | Count | Budget (form) |
|---|---|---|
| Regions | header+scope, settings, preview, footer = 4 | 4, OK |
| Figures | scope line counts as 1 figure line; per-model counts are 4 more | 1, OVER (see risks) |
| Charts | 0 (preview is not a chart) | 1, OK |
| Controls | 4 model tiles (one group = 1), 2 tabs, 3 fields, save = about 7 | 7, at limit |
| Words above fold | about 30 excluding preview content | 40, OK |
| Primary | 1 | 1 |

What it adds and how: meaning of a model = the drawn form (SC-17, SC-19); scope = scope line and per-tile counts; empty sections = locked shape; existing evaluations = save confirm counts; times needed = the inline "Different from 3" link.
DS: `PageFrame`, `SelectionTileGrid` (tiles with `leading` for nothing, label + count link) or `RadioGroup` cards as today, `Tabs` (line) for Evaluator / Student, `Card` holding the reused `PreviewCard` / `PeopleSee` from `configure/check.tsx` made live, `Field*`, `Input`, `Select`, `StickyFooter`, `Dialog` for the confirm, `StatusBadge` for "Not configured".
Not on the page: model definitions, helper lines, the separate label-and-value Summary card (B today), any "what this means" panel.
Risks: the preview duplicates labels shown in the settings (Result labels appear twice); at 1280 to 1439 the preview squeezes the settings; sample skill and sample student must come from the seed, not invented; per-tile counts push figures over the form budget (ask Romit or move them into the confirm only); reverses the D-L37 audit fix "samples only on Check and save" (that was Proposed, not Romit's words, and SC-19 supports showing them).
Question it tests: does seeing the evaluator form remove the need for any explanation?

## 5. Concept B: Pick by example (progressive, example-driven)

Mental model: choosing from a set of drawn examples, then filling in only what that example needs. Primary job: pick the model by recognising it, then answer the few questions it opens, one band at a time.

```
1440 x 900 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
│ Skills ▸ Evaluation settings                                                                                            │
│ Evaluation settings                                                                                                     │
│ 176 skills · 31 not configured ↗                                                                                        │
│                                                                                                                         │
│ ① How skills are judged                                                                                                 │
│ ┌──────────────────────────┐┌──────────────────────────┐┌──────────────────────────┐┌──────────────────────────┐        │
│ │  ┌────────────────────┐  ││  ┌────────────────────┐  ││  ┌────────────────────┐  ││  ┌────────────────────┐  │        │
│ │  │ IV insertion       │  ││  │ 1 Identity  Y / N  │  ││  │ ○ Observed         │  ││  │ 1 Identity  1 2 3 4│  │        │
│ │  │ (Approved)(Not)    │  ││  │ 2 Site      Y / N  │  ││  │ ○ With assistance  │  ││  │ 2 Site      1 2 3 4│  │        │
│ │  │                    │  ││  │ Result (Met)(Not)  │  ││  │ ● Independent      │  ││  │ Average 3.5        │  │        │
│ │  └────────────────────┘  ││  └────────────────────┘  ││  └────────────────────┘  ││  └────────────────────┘  │        │
│ │ ○ Approved or not        ││ ○ Questions, then result ││ ○ Independence level     ││ ○ Scored                 │        │
│ │   11 skills today        ││   23 skills today        ││   107 skills today       ││   19 skills today        │        │
│ └──────────────────────────┘└──────────────────────────┘└──────────────────────────┘└──────────────────────────┘        │
│                                                                                                                         │
│ ② What counts as achieved   🔒 After How skills are judged     ░░░░░░░░ ░░░░░░  ░░░░░░░░░░                             │
│ ③ How many evaluations      🔒 After What counts as achieved   Each skill needs [ ░ ] ░░░░░░░░░                         │
│ ④ Who signs                 🔒 After How skills are judged     ░░░░  ░░░░░░  ░░░░░░                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       [ Save settings ]  (disabled hint │
│                                                                                        only after first failed attempt) │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

After choosing "Independence level" (band ① collapses to one row, ② opens):

│ ① How skills are judged   Independence level   107 skills already use it · 69 will change ↗          [ Change ]          │
│ ② What counts as achieved                                                                                               │
│    Levels  [ Observed ] [ With assistance ] [ Independent ] [ + Add ]   Use a starting set ▾                            │
│    Counts  ( Any level ) ( With assistance or above ) (● Independent only )                                             │
│    ┌ the drawn tile redraws with the program's own labels, the counting levels outlined ┐                                │
│ ③ How many evaluations   🔒 …                                                                                          │
```

"69 will change" is a floor: 176 active minus the 107 on Independence level; skills on that model with other level labels or rules change too, so the real figure comes from `planProgramApply` at runtime.

The tiles are a drawn sample, not a description: each holds the real control shape the evaluator taps, at small size, with a fixed sample skill. After the choice, the tile redraws with the program's own labels (levels and which count, D-L27). "69 will change" is the one consequence figure, linked to the named skills.

| Line | Count | Budget (form) |
|---|---|---|
| Regions | header+scope, tile band, locked bands, footer = 4 | 4, OK |
| Figures | 1 scope line; tile counts ("11 skills today") as part of the tile = 4 | 1, OVER |
| Charts | 0 | 1 |
| Controls | tile group 1, 3 locked bands (not interactive), save = 2 | 7, OK |
| Words | about 25 | 40, OK |
| Primary | 1 | 1 |

What it adds and how: meaning = the drawn tile; dependency (SC-17) = bands unlock in order and show their shape before they open; scope and change = "107 already use it · 69 will change" on the collapsed band; times needed = band ③ holds the number and "Different from 3" link; existing evaluations = the confirm.
DS: `SelectionTileGrid` with `leading` set to the mini sample (the API supports a custom graphic), `Accordion` or `Collapsible` for the bands (one open at a time, each trigger showing its chosen value), `Button` (`variant="outline"`, "Change"), `Field*`, `Input`, `RadioGroup`, `DropdownMenu` ("Use a starting set"), `StickyFooter`, `Dialog`.
Not on the page: the side summary card (the collapsed bands are the summary), option descriptions, a stepper with "Step n of m".
Risks: mini samples at tile size must stay legible (12 px floor; 4 tiles at 1440 give about 300 px each, tight for Scored); progressive locking can feel like a wizard on a settings page that admins revisit (on return, all bands open collapsed with values, nothing locked); "69 will change" before save may alarm without the evidence choice next to it; tile counts again over the form figure budget.
Question it tests: does picking by looking, with sections that wait their turn, make the order and the dependency obvious?

## 6. Concept C: Settings as a ledger of scope (impact-first)

Mental model: a statement where each line is a setting, its program value, and how many skills follow it or differ. Primary job: see the whole program at once, edit one line in a side sheet, and know before saving how many skills each change touches.

```
1440 x 900 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
│ Skills ▸ Evaluation settings                                                                                            │
│ Evaluation settings                                                                                                     │
│ 176 skills · 31 not configured ↗                                                                                        │
│                                                                                                                         │
│ ┌──────────────────────────────┬─────────────────────────────────┬──────────────────┬──────────────────┬───────────────┐│
│ │ Setting                      │ Program                         │ Follow           │ Differ           │               ││
│ ├──────────────────────────────┼─────────────────────────────────┼──────────────────┼──────────────────┼───────────────┤│
│ │ How skills are judged        │ ⚠ Not set                       │ —                │ 4 models ↗       │ [ Set ]       ││
│ │ What counts as achieved      │ 🔒 After How skills are judged  │                  │                  │               ││
│ │ How many evaluations         │ ⚠ Not set                       │ —                │ 14 own numbers ↗ │ [ Set ]       ││
│ │ What the student adds        │ Date performed                  │ 160              │ 16 ↗             │ [ Edit ]      ││
│ │ Student rates themselves     │ Off                             │ 150              │ 26 ↗             │ [ Edit ]      ││
│ │ Who can sign off             │ ⚠ Not set                       │ —                │ —                │ [ Set ]       ││
│ │ Feedback                     │ ⚠ Not set                       │ —                │ —                │ [ Set ]       ││
│ │ Approval before it counts    │ ⚠ Not set                       │ —                │ —                │ [ Set ]       ││
│ │ Group check-off              │ 🔒 After How skills are judged  │                  │                  │               ││
│ └──────────────────────────────┴─────────────────────────────────┴──────────────────┴──────────────────┴───────────────┘│
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       [ Save settings ]                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

[ Set ] on "How skills are judged" opens a non-modal sheet (FloatingSheetPanel, md) beside the table:

                                                 ┌──── How skills are judged ───────────────────────── ✕ ┐
                                                 │ ( ) Approved or not       11 skills                   │
                                                 │ ( ) Questions, then result 23 skills                  │
                                                 │ (●) Independence level    107 skills                  │
                                                 │ ( ) Scored                19 skills                   │
                                                 │ ───────────────────────────────────────────────────── │
                                                 │  Evaluator sees                                       │
                                                 │  ┌──────────────────────────────────────────────┐     │
                                                 │  │ ○ Observed  ○ With assistance  ○ Independent │     │
                                                 │  └──────────────────────────────────────────────┘     │
                                                 │ ───────────────────────────────────────────────────── │
                                                 │  On save   69 change ↗  · 107 match                    │
                                                 │                                   [ Done ]            │
                                                 └───────────────────────────────────────────────────────┘
```

Follow and Differ are computed from `differsFromProgram()` per setting against the current skills (before the first save, Differ shows the spread of values in use). Each Differ count links to the named skills; from there "Change one skill" is one click (SC-14 to SC-16). The table is the summary; nothing is said twice.

| Line | Count | Budget (form) |
|---|---|---|
| Regions | header+scope, ledger, footer = 3 (sheet counts alone when open) | 4, OK |
| Figures | Follow and Differ columns are table data, not KPI figures; scope line 1 | 1, OK by the table rule; flag if the density script counts cells |
| Charts | 0 | 1 |
| Controls | one row action per row (9), save | 7, OVER unless row actions count as one control (row click opens the sheet; drop the button column) |
| Words | about 40 (row labels) | 40, at limit |
| Primary | 1 | 1 |

What it adds and how: scope per setting = Follow / Differ columns; existing skills and the effect of a change = "On save 69 change" inside the sheet and the confirm; times needed = its own row with "14 own numbers" opening the list; meaning of a model = the "Evaluator sees" sample inside the sheet only.
DS: `Table` (DS matrix table; or `DataTable` without toolbar), `StatusBadge` via `StatusPill` for "Not set" (warning tone with glyph, never red), `FloatingSheetPanel` (md, non-modal), `RadioGroup`, `Field*`, `Button` (`variant="ghost"`, `size="sm"` per row or whole-row click), `StickyFooter`, `Dialog`.
Not on the page: the four section headings as blocks (rows replace them), a side summary card, any preview outside the sheet.
Risks: a table of settings reads as admin plumbing and hides the evaluator experience until a sheet opens; nine rows each with a "Not set" amber badge on first use is a wall of amber (consider neutral "Not set" until the first failed save); Follow/Differ per setting needs a new selector (cheap, but new); a table is weaker than A or B for the very first setup, stronger for every later visit.
Question it tests: does showing reach (how many skills follow or differ) per setting give more context than showing the form?

## 7. Concept table

| Concept | Mental model | Primary job | First viewport (regions/budget) | DS components | Not on the page | Risk | Question it tests |
|---|---|---|---|---|---|---|---|
| A Form beside the choices | Print preview | Choose while watching the evaluator form | 4/4; figures over unless tile counts move to confirm | SelectionTileGrid or RadioGroup, Tabs, Card + PreviewCard, Field, StickyFooter, Dialog | Summary card, definitions | Labels twice; reverses D-L37 sample placement | Does the form replace explanation? |
| B Pick by example | Menu with photos | Recognise the model, then answer what it opens | 4/4; figures over (tile counts) | SelectionTileGrid `leading`, Accordion/Collapsible, RadioGroup, DropdownMenu, StickyFooter, Dialog | Side summary, stepper | Tiny samples; wizard feel on revisit | Do drawn choices and ordered bands make the dependency obvious? |
| C Ledger of scope | Bank statement / pull request | See reach per setting, edit in a sheet | 3/4; controls over unless rows are the control | Table, StatusPill, FloatingSheetPanel, RadioGroup, Field, StickyFooter, Dialog | Section blocks, page preview | Plumbing feel on first setup; amber wall | Does reach per setting beat showing the form? |

## 8. Recommendation

Build A as the new B variant (replacing today's B, which is the one shown), with two pieces taken from B and C:
1. A's live Evaluator / Student preview, because SC-17 and SC-19 are exactly the gaps Romit felt and a drawn form answers them with zero prose.
2. B's locked shape for sections that wait on the model, instead of "Choose how skills are judged first."
3. C's reach numbers only where they change a decision: the per-model count on each tile and "69 will change" in the confirm. If Romit does not want tile counts (figure budget), keep them in the confirm only.

Update rather than add (variant process step 4): A (anchored index) gains the scope line and locked shapes; B becomes Concept A; C (tabs) becomes Concept C (ledger), because "one group at a time in tabs" and "ledger with sheets" test a similar question (short focus vs whole page) and the ledger tests it with more context. Concept B (pick by example) is worth a new variant D only if Romit wants the progressive model compared directly.

## 9. Critique and proposals

Critique of the current page and of these concepts:
- Today's model tiles are icon + name only: the one place a picture would explain the most has none.
- "Not set" twelve times in the Summary card is the loudest element on the page and says the same thing twelve times.
- The first save silently treats 145 configured skills as taking the program model; this is a data risk, not only a context gap. Every concept must surface "will change" before Save, and the confirm must offer "Only skills not configured" (IM-13, IM-14).
- All three concepts exceed the form figure budget if per-model counts sit on the page; I have not raised the limit, it needs Romit's call.

Proposals:
1. First-save safety: when the library already holds configured skills, the confirm defaults to nothing selected and asks, with counts: "Skills not configured (31)" / "All 176 skills". No default chosen (SC-02 spirit, IM-13).
2. Sample skill selector in the preview header ("sample skill ▾") limited to real library skills, so admins can see a question-model skill with its own questions (D2).
3. Neutral "Not set" until the first failed save; amber only once it blocks.
4. Replace the summary card in today's B with the preview; the side column has one job.
5. Fix comment drift: file headers of `admin-evaluation-settings-{a,b,c}.tsx` say "five groups" (C lists Judging, Completion, People, Review, Group check-off); `PROGRAM_GROUPS` has four (D-L37).

## 10. Open, not decided

- D-X27 "Apply to new evidence only": what happens to held evidence when program settings change. Concepts only show counts; the evidence choice is not designed here.
- D1/D2/D5 (gap doc): per-skill override placement, question and scored skills needing their own questions, no shipped number.
- D-L37 (Proposed audit fix) put student and evaluator samples on Check and save only; Concept A and the recommendation move them onto the settings page. Romit's call.
- D-L36 lists "worked examples" among removed text. Drawn samples are visuals, not prose, but Romit should confirm this reading.
- OD-02 placement unchanged.

NOT verified: no screenshots taken this pass (dev server not started; the description of today's page comes from the brief given); density counts are by hand, not `tests/lab/density-budget.mjs`; DS `FloatingSheetPanel` and `Table` APIs not re-looked-up this pass (SelectionTileGrid, Accordion, Collapsible, ToggleGroup were).
