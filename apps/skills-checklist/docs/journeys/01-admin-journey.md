# Journey 1 — Administrator (Program coordinator / admin)

**Hat:** UX + product. **Prototype screens:** Skills Library, Import, Edit/Configure wizard, Course Mapping, Review & Approve, Overview (see `strategy/03-prototype-walkthrough.md`).
Persona note: REQ says "administrator" / "the program" without naming a title. DCE / Placement Coordinator (workspace P1) is the closest persona, high density, bulk ops, filter chips above the fold. `[INFER]`

## Why this journey exists / so what

The admin is the **only person who decides what "skilled" means**. If their setup is slow, wrong, or contradictory, every downstream actor (student, preceptor, report) inherits the damage. The journey therefore optimises for **fast first value** (import), **impossible-to-misconfigure** (model → criteria), and **drillable proof** (aggregate → evidence).

## The arc

```
 A. Seed library ──▶ B. Configure each skill ──▶ C. Map to offerings ──▶ D. Go live
   (import/manual)     (model, rule, criteria)      (mandatory?)             │
                                                                              ▼
 G. Report & export ◀── F. Drill to evidence ◀── E. Review & approve (if enabled)
```

## Stage table

Legend: `REQ` = requirement. `PROTO` = how the prototype shows it. **Emotion** and **pain** are `[INFER]` (hypotheses to validate with Aarti/Sarah).

### A. Seed the library

| Item | Detail |
|---|---|
| Goal | Get 40–200 existing skills into Prism without re-typing |
| Trigger | Programme holds a Word/Excel/PDF list `[REQ §3]` `[CALL 09-23]` |
| Actions | **Import** (upload or paste) → system proposes skills, descriptions, groupings as categories, any evaluation questions → admin edits/renames/merges/splits/discards/adds → duplicate check (skip/replace/keep both) → unparsed lines shown with original text → confirm → create. Or **Add skill** by hand `[IM-01..08, IM-12, IM-13]` |
| System rules | No template/column order required; nothing created without confirmation; import is repeatable & traceable per import; skills arrive **unconfigured** `[IM-03, IM-05, IM-09, IM-11]` |
| PROTO | Paste a sample → "Review 8 skills found" (found / will be created / possible duplicates counters, "create 3 new categories" checkbox, editable name+description rows, unread lines with reason) → **Create 8 skills** → banner "cannot be used until each one is configured" with *Configure them now / Show them / Dismiss* |
| Not shown in PROTO | File upload parsing (paste only), merge/split controls, duplicate resolution UI (counter shows 0), per-import traceability `[IM-06, IM-11]`, merge/split `[IM-05]` |
| Emotion | Relief → wary ("will it get my 200 right?") |
| Pain | AI mis-parses headings as skills (PROTO flags "SECTION 2 — ADVANCED PROCEDURES" as heading — good) |
| Design implication | The review table is the product's trust moment. Make "what we could not read" first-class, not a footnote. |

### B. Configure each skill

| Item | Detail |
|---|---|
| Goal | Make each skill *achievable* and unambiguous |
| Entry | "Needs configuration" filter or **Configure** on a row; counter of unconfigured skills `[IM-10]` |
| Steps (PROTO: 3-step modal) | 1 Skill definition (name, description, category 0..1, tags, status) → 2 Evaluation configuration → 3 Achievement criteria |
| Step 2 contents | Pick model (4 tiles, explicit) → model-specific editor (labels / questions + qualification rule / scale + rule / ordered levels) → student submission fields → evaluator comment optional/required → review workflow toggles (self-eval, admin approval) → allowed evaluator roles → **form preview** (student + evaluator view together) `[SC-01..19]` |
| Step 3 contents | Criteria limited to what model can produce; per-level minimums only for demonstration; optional per-clinical-setting minimums `[SC-09..12]` |
| Cross-step | "Configuration lineage" panel: model → evidence → qualifies when → criteria → status `[SC-17]` `[PROTO]` |
| Bulk | Copy config from one skill / apply to many `[IM-14]` — **not seen in PROTO** |
| Emotion | Concentrated; fatigue by skill #30 |
| Pain | Repetition; fear of misconfig; consequences of changing a live skill (AE-02 re-applies to held evidence — admin must *understand* that) |
| Design implication | Show the consequence of a rule change on existing evidence before save (e.g. "12 students move from Achieved → In progress"). `[INFER]` — REQ AE-02 implies it; it never asks for a preview. |

### C. Map skills to offerings

| Item | Detail |
|---|---|
| Goal | Tell students what each rotation expects |
| Entry | Course Mapping |
| Actions | Find offering (search; filter by cohort, term, academic year, professional year) → open it → tick skills to map → toggle Mandatory / Non-mandatory → see counts mapped / mandatory `[CM-01..04, CM-06]` |
| PROTO | Left list of 42 offerings (14 match filters) with mandatory/total pill; right panel "Skills mapped — NURS 301" with search, per-skill checkbox, Mandatory/Non-mandatory buttons, "Also mapped in …" cross-reference text. Newly-mapped skill defaults to **Mandatory** (observed) |
| Rules | Expectation not eligibility; per-offering requirement may differ for same skill `[CM-05, CM-06]` |
| OPEN | Carry-forward between terms: **OD-01**. Bulk-map the same skill set across many offerings is *implied by volume* (42 offerings) but not required; PROTO has no bulk map. `[INFER]` |
| Design implication | Volume is the problem here (same course × many terms/years). A "copy mapping from offering X" action is the obvious need; wait for OD-01 before building. |

### D. Go live

Skills are usable once **configured + active** `[SC-02, IM-09, SL-11]`. There is no separate "activate" step in REQ; `[CALL 09-23]` suggested activation as a distinct step after configuration ("skills cannot be activated until you configure"). **Gap: is activation a state or just `active` + `configured`?** → logged in `07-gaps…`.

### E. Review & approve (only for skills that require it)

| Item | Detail |
|---|---|
| Goal | Internal quality check before evidence counts `[REQ §8]` |
| Queue | Student, skill, course, setting, location, evaluator, role `[AR-01]` (PROTO shows all but explicitly lists them in a sentence) |
| Compare | Student self-evaluation vs evaluator, with agreement flag `[AR-02]` — PROTO: "Student and preceptor recorded different outcomes — worth a conversation before approving" |
| Full responses | "See the full responses" `[AR-03]` |
| Note | Optional review note kept with evaluation `[AR-04]` |
| Decision | **Approve** (counts) or **Return** (goes back for correction, does not count) `[AR-05]` |
| Rule | Pending evidence is excluded from achievement `[AR-06]` |
| PROTO divergences | Button says **"Return to preceptor"**; REQ says the evaluation "goes back for correction" and the student's history says the reviewer returned it asking the *student* to correct and resend (RV-01). Who actually corrects: student or evaluator? → `07-gaps…` |

### F–G. Report, drill, export

| Item | Detail |
|---|---|
| Goal | See attainment across a population; get to the individual evidence without restarting |
| Views | By student / By skill / By tag `[RP-02..04]` |
| Filters | Cohort, group, clinical course, category, tag, location, setting; chip row of applied filters, each removable `[RP-01]` — PROTO: "Showing everything" summary text + filter panel; verify chip removal (not observed) |
| KPIs (PROTO) | Students in view · Avg skills achieved · Students achieving all skills in scope · Skills needing attention (<50%) — **not required by REQ**; `[PROTO]` choice |
| Drill | Student → skills with progress; skill → per-level breakdown + evidence ledger (date, setting, location, evaluator, role, recorded, result) → "View form" full evaluation with student-supplied details, responses, comment `[RP-05..07]` |
| Tag report | States that figures overlap `[RP-04]` — PROTO footnote says so |
| Export | Aggregate (current view) and evidence detail (row per evaluation); filters written into file header; CSV opening in Excel `[RP-10]`, **OD-10** open |
| Not observed | Drill from By-skill row to individuals (RP-05 for skills); impossible filter combos message (RP-09) |

## Admin moments of truth

1. **Import review** — "did it understand my list?"
2. **Save of a config** — "will this ever be achievable?"
3. **Queue of approvals** — "can I decide without opening five tabs?"
4. **Report → evidence** — "can I show an accreditor the evaluation behind this number?"

## Failure modes to design for

| Failure | Mitigation (REQ) |
|---|---|
| Admin changes a rule after evidence exists | AE-02 re-applies; surface impact before save `[INFER]` |
| Deactivated category/tag assigned to a skill | stays visible as inactive, removable deliberately `[SL-06]` |
| Student names an unrecorded lab instructor | admin sees and adopts into roster `[SL-09]` — PROTO: "Named by students, not on the roster → Add to roster" |
| Filter combo yields nothing | explain why `[RP-09]` |
| Half-configured library | visible count + filter `[IM-10]` |

## Requirement coverage for this journey

SL-01..11 · IM-01..15 · SC-01..19 · CM-01..08 · AR-01..06 · RP-01..11 · AE-all · OD-01..04, 10..13. Exact status in `strategy/04-requirements-traceability.md`.

---

## New evidence 2026-10-09 (raw Granola review; CALL tier, nothing decided)

Sources: `strategy/08-raw-granola-findings-oct-2026.md`, tags `[CALL 10-08 Aarti]` (Aarti, inferred), `[CALL 10-09]`, `[CALL 09-30..10-02 leaders]`. The REQ-derived stages above are unchanged; the notes below mark the moments of truth the raw calls change. Every `OD-*` stays open.

| Moment | What the raw calls change | Firmness | Open decision |
|---|---|---|---|
| **The launch page is the report (F-G collapse into the front door)** | Stage F-G above treats the report as a place the admin goes to after go-live. Aarti: "My report should be my launch page." and no "separate place where they have to go to trigger." The admin's first screen should show who has met what at student level, per skill counts against targets ("5, 5, 5, 5, 5 of each"), with the review trigger on the same page. The moment of truth "Report to evidence" and "Queue of approvals" become one moment | Firm, repeated | OD-29 |
| **Student-level, not rotation-level** | The headline view ignores rotation ("that's just FYI. On my main report, I don't care."). Setting and location stay in the evidence drill-down, so stage F-G drill rules (RP-05..RP-08) and SC-12 are unchanged | Firm for the headline view | OD-22, `07` C-16 |
| **One list, one name** | Stage A (seed the library) may be seeding "skills, competencies, EPAs, procedures" as one list; the admin's words for it vary by domain ("skills" entry level, "competency" doctorate, "procedures" PA). Nav label and library name are not settled | Moderate; Aarti says alignment is needed | OD-28, OD-02, OD-34 |
| **Evidence is not always a student send-for-review** | Stage B step 2 (pick a model, define evidence) assumes a student submits. Real programs also credit a skill from an assessment question, a whole assessment, a course grade or pass, or a standalone form, and some accept "students saying is enough". The admin may be choosing a **source** before a model. Keep v1 to student-submitted evidence; show the source as a named choice only if Sankalp confirms | Moderate; REQ silent | OD-31, OD-32, OD-37 |
| **Sign-off chain** | Stage B steps for "admin approval" and "allowed evaluator roles" may become an ordered chain (faculty 1 then faculty 2; faculty then preceptor; N signatures from distinct preceptors) | Moderate | OD-33, OD-06 |
| **Program requirements** | Stage C-D: there may be a place to set what every student must meet (for example 100 skills), separate from per-skill criteria and per-offering mapping. Hours stay out | Moderate | OD-30, OD-27 |
| **Mapping is a highlight** | Stage C: the admin maps a course to skills only to emphasise them to students ("bold ... star ... different color"). Mapping volume (42 offerings) matters less if mapping never gates anything and the student's main checklist is the home | Firm that it is soft | OD-01, CM-05 |
| **Existing forms** | Stage B may start from forms that already exist in FAST ("going to be the same. It's just the landing page") rather than a generated form. The configure experience could be an adapter over existing forms for some programs | Moderate (Romit, Oct 9) | OD-36 |

Admin moments of truth, amended: (1) import review, (2) save of a config, (3) **the launch page: can I see who has met what and trigger the review in one place?**, (4) report to evidence (now on the same page as 3). Failure mode added: an admin who must leave the report to act (the exact split Aarti objects to).

Not covered by any statement: whether the admin or the student triggers a review "at the student level", and whether an advisor may read the same page (read-scope and FERPA, OD-25).
