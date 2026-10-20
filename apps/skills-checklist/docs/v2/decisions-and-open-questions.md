# v2 decisions and open questions

Format: **what**, **why**, **status**. "Decided" here means decided for this prototype by the person named. Nothing in this file decides a requirements `OD-*`.

## Decisions taken for v2

| # | Decision | Why | Status |
|---|---|---|---|
| D1 | **DS choice:** build every v2 screen on `@exxatdesignux/ui` 1.6.5. `studentUX` and `exxat-ds` are read-only visual references and are never edited or imported for v2 screens. | The package is the canonical admin DS per the workspace rules, and the existing admin app already uses it. | Decided by Romit (stated in the Stage 0 brief). |
| D2 | **Hard-stop scope change (v2 prototype only).** Items that `strategy/07` section D and `strategy/05` forbid or leave undecided are in scope for the v2 prototype: starter libraries (hard stop 1, `SL-01`), a default evaluation model (hard stop 2, `SC-02`), remediation (hard stop 9, section 14 of the requirements), QR codes and heatmaps (hard stop 12), batch grid (`OD-19`), offline sync, CLR 2.0, photo of a signed paper form, tamper-evident PDF, evaluator qualification and expiry. They are labelled `[PROPOSED]` in docs only and never shown as such in the UI. No `OD-*` is treated as decided. The hard stops that v2 keeps: completed evaluations are immutable, preceptors have no login, lab never satisfies a clinical-setting minimum, mapping is not eligibility, `REQ` section 14 stays out of scope unless named above. | Romit wants a connected prototype that shows the whole story, including ideas the requirements have not settled, so stakeholders can react. | Decided by Romit (stated in the Stage 0 brief). The product `CLAUDE.md` hard-stop line still reads as before; it applies to the production build, not this prototype. Needs a note in `strategy/07` once Romit agrees where to record it. |
| D3 | **Scored model default.** Four models are offered and configurable (binary, question-level, scored, demonstration). Binary is the pre-selected default in v2 screens. Scored is never the default. | Keeps the demo simple and avoids showing scores by default (`strategy/07` hard stop 10). Pre-selecting binary conflicts with `SC-02` ("no default is assumed"), so it is part of D2 and flagged as `[PROPOSED]`. | Decided by Romit (stated in the Stage 0 brief). |
| D4 | **Route group.** v2 lives in `app/(v2)/v2/...` with its own layout, store provider and nav. The v1 `(shell)` and `(evaluator)` groups are untouched. Routes are `/v2`, `/v2/<role>` and `/v2/<role>/<step>`. | Keeps v1 working while v2 is built, avoids a shared store, and lets the role come from the URL. | Decided by me `[INFER]`, easy to change. |
| D5 | **Store.** React context plus `useSyncExternalStore`, localStorage persistence with guarded access, no new dependency. Hydration happens after mount so server and client markup match. A shape check discards bad persisted data. | The brief allows a zustand-free store. The existing v1 store is a separate, richer engine and is not reused for v2 mock data. | Decided by me `[INFER]`. |
| D6 | **Role switcher is URL-driven.** A role change navigates to that role's home. The Student role is "Student (mobile)" and is designed for 390 px but renders in the same shell on desktop. R. Whitmore (lab instructor) uses the Preceptor role. | Mirrors how the v1 shell derives its view from the route. | Decided by me `[INFER]`. |
| D7 | **Sample people.** L. Haddad (reviewer) and Dr. K. Brennan (program director) are invented sample names, as are the eleven other students. | The brief names Maya, J. Delgado, R. Whitmore and A. Ross only. | Placeholder, replace if the team supplies names. |

### Stage 1 decisions (admin setup)

| # | Decision | Why | Status |
|---|---|---|---|
| D8 | **The configure Wizard has 8 steps**, above the DS recommendation of 6 (the DS logs a console warning in dev). It uses the horizontal compact variant, which scrolls with arrow controls at narrow widths. Opening the review step directly (route `validate-publish`) shows steps 1 to 7 as completed, because the DS marks every earlier step done. | The brief names 8 steps. Merging them would hide the failure path and re-validation, which stakeholders want to react to. Not deviating from the brief. | Decided by the Stage 1 brief. Open: split into two flows? |
| D9 | **Starter libraries are static sample catalogues** (`lib/v2/starter-libraries.ts`), separate from the seed. The seed's 31 skills are already the program's library; copying adds only skills not already present (name match) and creates them unconfigured. A duplicate can be ticked to keep both. "Replace" is not offered because it would overwrite configuration that may carry evidence. | Keeps "nothing is created until confirm" real while the seed precondition (31 skills, 4 specialties) stays as Stage 0 defined it. | Decided by me `[INFER]`. |
| D10 | **Import uses the local `/api/import/extract` route** (code only, no network, no AI key) to read a PDF, and a rule-based proposal (`lib/v2/import.ts`) instead of the AI reading. The bundled `public/v2/sample-skills-checklist.pdf` is generated by `scripts/make-v2-sample-pdf.mjs`. Line numbers count the extractor's lines, which drops blank lines. | The brief asks for no network. The v1 AI path (OD-12) stays a v1 concern. | Decided by me `[INFER]`. |
| D11 | **Evaluator attributes are sample data.** Credentials, years of practice and training were added to the preceptors and lab instructor, and three more preceptors (S. Okonkwo, M. Castillo, T. Aldridge) were added so the qualified-evaluator preview has something to filter. | The "who counts as qualified" rule needs people to qualify. | Placeholder, replace with real data. |
| D12 | **Wizard draft lives in the store** (`drafts[skillId]`, including the current step) and is saved on every edit without an audit entry. Moving to the next step and publishing are audited. | State must survive navigation between the two routes and a reload, and the audit log should record decisions, not keystrokes. | Decided by me `[INFER]`. |
| D13 | **Stage 0 changes forced by the new data:** `ENVELOPE_VERSION` went from 1 to 2 (saved Stage 0 browser state is discarded once), `SkillConfig` gained fields and lost `prerequisiteSkillIds` and `failurePath`, `Program` and `Course` gained clinical settings, and one assertion in `tests/v2/store.test.ts` changed from `toEqual` to `toMatchObject` on the achievement rule. | The rule engine needs the fields; no Stage 0 behaviour changed. | Done. |
| D14 | **Strength thresholds are my heuristic** (`strengthHint` in `lib/v2/rules.ts`: points for evaluations, evaluators, top level, recent window, named settings). | A plain-language hint needs some rule. It is not a requirement and should be reviewed. | `[INFER]`, needs Sankalp's view. |
| D15 | **"No setting can satisfy it" in coverage** is read as: a mandatory skill requires evidence in a named clinical setting that the course does not place students in. | The requirements do not define the warning. | `[INFER]`. |

## Stage 1 findings (DS and tooling, not v2 decisions)

- **Open DS Select fails two axe rules behind it.** While a Radix Select listbox is open, axe reports `aria-hidden-focus` for the page behind it and, for a long list, `scrollable-region-focusable` for the option list. Tab also cannot leave an open listbox. `shoot.mjs` records these as `knownAxe` for the menu states and checks ArrowDown and Escape instead. A DS bug report is the right fix.
- **DS TabsList can take focus without a focus ring** (Radix roving root, after a mouse click on a tab). v2 adds the DS ring tokens to the tab list and to the tab panels it renders.
- **DS Wizard console warning** for more than 6 steps (D8).
- **Radix ToggleGroup single mode renders `role="radio"`**, so the accept and reject controls are radios to assistive tech, not buttons.

## Naming and relation to `docs/design/brief-v2.md`

`docs/design/brief-v2.md` is the **Design Brief v2 (three directions)** from 2026-10-08, a proposal written before any v2 code. This folder, `docs/v2/`, is the **Connected prototype v2**. The names collide but the artifacts differ:

| | `docs/design/brief-v2.md` | `docs/v2/` and `app/(v2)/` |
|---|---|---|
| What | Three IA and workflow directions, no code | One connected clickable prototype with shared mock data |
| Status | Proposal awaiting Romit's choice | Built in stages |
| Scope | The existing hybrid IA of the v1 admin app | The 14-step cross-role story, including `[PROPOSED]` items |

Open: whether to rename one of them (suggestion: call this one "connected prototype" in all docs and keep "brief v2" for the directions). Not renamed in Stage 0 to avoid breaking existing links.

## Open questions

1. **Where does D2 get recorded?** `strategy/07` section D and the product `CLAUDE.md` still say the hard stops apply. Romit to decide whether to add a "v2 prototype exception" note there.
2. **Sample names** in D7: use real program staff names or keep placeholders?
3. **Student on desktop.** Should `/v2/student/*` force a phone-width frame on desktop, or stay fluid? Stage 0 keeps it fluid.
4. **Vercel or local only?** v2 reads and writes `localStorage` only, so a hosted copy would show each viewer their own state. Fine for demos, wrong for a shared review session.
5. **Which stakeholders see `[PROPOSED]` items?** The UI never labels them, so a reviewer could mistake a proposal for a requirement. Option: a one-line "Prototype, not the requirements" note in the Scenario menu.

## Findings during Stage 0 (not v2 decisions)

- **Pre-existing hydration error under reduced motion.** The DS Ask Leo launcher renders different markup on the server and the client when the browser prefers reduced motion. React regenerates the tree, which also left the mobile sidebar sheet open in a 390 px screenshot. The v1 shell (`/home`) shows it too. v2 renders the launcher after mount to avoid it. The v1 shell is not changed in this stage. A DS bug report is the right fix.
- **DS version skew.** `node tools/ds/source.mjs` prints `@exxatdesignux/ui@1.5.1`, while the admin app installs 1.6.5. Component APIs used in Stage 0 were checked against the installed 1.6.5 `.d.ts` files.
- **Stale file in the product `CLAUDE.md`.** It says the product is "not yet scaffolded"; the admin app, 18 contracts and a store engine already exist.
