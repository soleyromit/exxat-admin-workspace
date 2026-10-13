# Product architecture, Variant A: lifecycle / journey-first

Date: 2026-10-09 · Mode: `/design-variants` spec (ASCII and rationale, no TSX, nothing built, nothing published) · Scope: the OVERALL product architecture of Prism Skills Tracking, not one page
Status: **proposal for Romit.** Not a confirmed contract. Every `OD-*` stays OPEN and is built as its named seam.
Tags: `[REQ id]` requirement · `[OD-n]` open decision, never treated as decided · `[PROTO]` Sankalp's prototype · `[CALL 09-23]` raw call transcript · `[MOBBIN name]` a Mobbin screen or flow whose image was viewed · `[BUILD]` read in `admin/` on 2026-10-09 · `[INFER]` my inference, to validate. Precedence for behaviour: REQ > CALL > PROTO > INFER. For visual layout inside the DS shell: PROTO, per Romit 2026-10-08 `[docs/README.md]`.
Illustrative numbers (counts, names such as "Foley catheter insertion") are placeholders generated for this document. Prism ships no skills `[REQ SL-01]`.
Companions read in full: `docs/README.md`, `strategy/01, 02, 05, 07`, `journeys/01-03`, `ux/01, 03, 07, 10, 11`, `design/brief-v2.md`, `design/mobbin-evidence.md`, `design/friction-baseline.md`, `build/ds-shell-anatomy.md`, `build/contracts/HY-01-home.md`, `admin/lib/skills-nav.tsx`, `admin/lib/skills-routes.ts`, raw transcript `2026-09-23-skills-checklist-with-sankalp.md`.

---

## 1. Thesis and the one question

**Thesis.** A nursing program does not use a skills record once; it runs it in a loop: define what skilled means, tell each course what it expects, run a term of evidence and sign-off, then read the result and fix the definition. Variant A makes that loop the spine of the admin product. The rail has three labelled groups, **Set up**, **Run**, **Understand**, ordered by *when in the program year* the work happens, with **Home** above them as the place that says which group needs you now. Phases are lenses, never gates: every row is always open, nothing is locked, and readiness is stated in words and one count, never a bar. Student and evaluator are not in the lifecycle rail at all; they enter by event (a course page, an email) and see the same cycle as a short worklist: needed, waiting, done `[INFER]`.

**The one question this architecture optimises for:**

> **"Where is my program in its year, and what is the next thing that needs me?"**

It deliberately does not optimise for "show me every object" (an object-first index) or "who is behind" (a matrix) `[INFER]`.

### 1.1 Seven architecture rules

| # | Rule | Why | Source |
|---|---|---|---|
| R1 | **Phases are lenses, never gates.** No row is locked or hidden by readiness. The only conditional row content is approvals, which exists only when a skill turns approval on. | Mapping is expectation, not eligibility; activation as a separate step is undecided | `[REQ CM-05]` `[REQ SC-15]` `[OD-15]` `[HY-01 §6]` |
| R2 | **The rail is stable; content adapts.** The rail never reorders, collapses or re-labels by readiness. Home changes emphasis instead. | Muscle memory for a weekly user; an adaptive rail is a wizard in disguise | `[INFER]` |
| R3 | **Readiness is words plus one count.** No progress bar, no percent ring, no "3 of 5 steps". | Workspace rule: progress bars are a last resort | `[ux/11 DP-9]` `[REQ IM-10]` |
| R4 | **Every attention item deep-links to its home phase** with the filter applied, and the page it lands on says which phase it is in. | The loop has to be navigable in both directions | `[INFER]` |
| R5 | **No date logic in v1.** Phase emphasis comes from counts (unconfigured, awaiting approval), not from term dates. | Term and cohort entities come from other Prism modules | `[REQ CM-01]` `[docs/strategy/07 G-10]` |
| R6 | **Nouns stay nouns.** Phases group pages; they never rename an object ("Setup skills" is not a thing). Labels use REQ terms. | Vocabulary rules | `[ux/03 §6]` |
| R7 | **Nothing from the hard-stop list is hidden behind a label.** No taxonomy shipped, no default model, no editing a completed evaluation, no preceptor login, no remediation or reminders. | Do-not-assume list | `[docs/strategy/07 §D]` |

### 1.2 Lineage: what this builds on, and where it consciously departs

| Source | Builds on | Departs from, and why |
|---|---|---|
| **Direction A, guided setup** (`brief-v2` §4) | The journey framing. Import, configure, preview, map as an ordered path. Home as the place that shows it. | **The locked "Go live" gate** and "Map to courses" as a prerequisite: REQ has no go-live step and mapping never gates `[REQ CM-05, SC-02]` `[OD-15]`. **The progress bar** (`▓▓▓░░`): banned as primary viz. **"Spot-check 2 of 4"**: needs a stored self-attestation, REQ SC-19 only requires a preview exists. These were already rejected in `HY-01 §6`. |
| **Direction B, command center** (`brief-v2` §4) | The idea that the weekly user opens on *what needs me*. Becomes the **Run** group and the Run card on Home. | Today is not its own product front door; it is one third of the lifecycle. "Behind" list is **not** adopted (needs `OD-27`). |
| **Direction C, matrix** | Nothing in v1. | Matrix stays a possible future **Understand** view behind a seam; no precedent at 150 x 100 `[docs/design/mobbin-evidence.md]`. |
| **Hybrid recommendation** (`brief-v2` §5, 6 steps) | Shell and role-scoped nav first; one Home with two states; Reviews as grouped list; matrix last. | **Re-groups** the same five destinations under three labels instead of one flat list. This is the only structural change to the rail. |
| **HY-01 Home, Layout 2** (confirmed 2026-10-09) | Everything on it: setup card that shrinks, attention list, no Go-live, no status counts, no "behind". | The single setup card becomes **one of three phase cards** (Set up, Run, Understand). |
| **Current built IA** (`skills-nav.tsx`: Home, Skills, Courses, Attainment, Reviews) | Same five destinations, same routes, same tabs inside Skills. | Adds group labels and renames Reviews to Evaluations. Small structural diff, see section 8. |

---

## 2. Architecture map

### 2.0 The loop, and when in the program year each phase is the live one

```
                      ┌─────────────────────────── program year ───────────────────────────┐
  weeks before term   │  term in progress (clinical + lab blocks)        │  term close       │  between terms
  ─────────────────── │ ──────────────────────────────────────────────── │ ───────────────── │ ────────────────
  SET UP              │  (rare edits: new skill, rule change)            │                   │  SET UP again
   library, import,   │                                                  │                   │  new offerings
   configure, map     │                                                  │                   │  need mapping
  RUN                 │  RUN: students send, evaluators sign off,        │                   │
                      │  admin approves where the skill needs it         │                   │
  UNDERSTAND          │  (spot checks)                                   │  UNDERSTAND:      │  UNDERSTAND:
                      │                                                  │  attainment,      │  accreditation
                      │                                                  │  evidence, export │  visit evidence
                      └──────────────────────────────────────────────────┴───────────────────┴─────────────────
   Loop: Understand shows a gap  ->  Set up edits the rule or the mapping  ->  Run collects better evidence
```
`[INFER]` throughout: the timeline is a teaching model for the labels, not logic. REQ gives no calendar `[REQ §1-§12]`; term and academic year exist only as offering fields `[REQ CM-01]`. R5 applies.

### 2.1 Admin sitemap (administrator and reviewer; one role, `[docs/strategy/07 G-8]`)

Legend: **P** page (own route) · **T** tab inside a page · **O** overlay opened by URL parameter (dialog today per DEC-019, panel later) · **A** action, no route · counter `(n)` is a rail badge.
Depth rule: rail row = level 1, tab = level 2. Overlays are not navigation.

```
Utility bar (DS):  [toggle] [product switcher] | page title                [Search] [Notifications] [Help] [Ask Leo] | [scope] [profile]   [BUILD shell-frame]

RAIL (one flat list per view; the DS renders NavSection labels for the groups)

  Home                                         P  /home                              no badge
  ───────────────────────────────────────────────────────────────────────────────────────────
  Set up                                       (group label, not a link)
    Skills library  (n unconfigured)           P  /skills/library                    badge: unconfigured skills [REQ IM-10]
      T  Skills                                      S-04   list, Configure (S-09 O), Import (S-08 O), Add skill (S-09 O)
      T  Kits                                        HY-02  proposal, not in REQ, not confirmed; tab exists as a placeholder [BUILD]
      T  Categories                                  S-05a
      T  Tags                                        S-05b
      T  Clinical settings                           S-06
      T  Lab instructors                             S-07   incl. "named by students, not on roster" [REQ SL-09]
    Course mapping                             P  /courses                           no badge (mapping is expectation) [REQ CM-05]
      P  Offering detail                             S-10   /courses/{offeringId}  master-detail, not a nav row
  ───────────────────────────────────────────────────────────────────────────────────────────
  Run                                          (group label)
    Evaluations  (n need approval)             P  /reviews (redirect from /evaluations)   badge: awaiting approval only [REQ AR-01]
      T  Needs approval                              S-11   shown only when a skill has approval on [REQ SC-15]
      T  Waiting on evaluators                       [INFER] read-only; name of who holds it, no age, no resend (OD-18 seam)
  ───────────────────────────────────────────────────────────────────────────────────────────
  Understand                                   (group label)
    Attainment                                 P  /attainment                        no badge
      T  By student   T  By skill   T  By tag         S-01   [REQ RP-02, RP-03, RP-04]
      O  Student                                     S-02   ?student=            [REQ RP-05]
      O  Evidence and evaluation                     S-03   ?skill= ?evaluation= [REQ RP-06, RP-07]
      A  Export                                      S-17   popover on S-01      [REQ RP-10]

Profile menu: View as student / evaluator (demo only, chip in bar)   [BUILD user-menu; ds-shell-anatomy §3]
Command palette (⌘K), grouped by phase:  Set up: Import skills, Add skill, Skills needing configuration, Course mapping, Clinical settings, Lab instructors
                                         Run: Evaluations needing approval          Understand: Attainment, Export attainment
```

**Rail rendering in DS terms.** `NavPrimaryLayout { preamble: [Home], sections: [{label:"Set up"}, {label:"Run"}, {label:"Understand"}] }` with `NavLinkItem.badge` numeric `[source.mjs NavLinkItem, @exxatdesignux/ui@1.5.1]`. The type exists; **I did not verify that the installed `AppSidebar` renders `sections` or that PCE-style flat compact shells accept them** `[INFER]`. The current build returns a flat `{ primary: NavLinkItem[] }` `[BUILD skills-nav.tsx]`.

**Conditional rows, stated exactly.**

| Condition | Rail result |
|---|---|
| No skill has approval on `[REQ SC-15]` | Evaluations row stays (it holds "Waiting on evaluators"); "Needs approval" tab is hidden; no badge |
| "Waiting on evaluators" is cut by Sankalp (see Q1) | Evaluations row and the whole **Run** label disappear when no skill needs approval. The rail becomes Set up + Understand. Nothing else changes |
| Zero skills in the library | Rail is unchanged (R2). Home shows the empty-library state. No example skills are shown `[REQ SL-01]` |

### 2.2 Badges, counters and what each is allowed to mean

| Place | Value | Source of truth | Allowed meaning | Not allowed |
|---|---|---|---|---|
| Rail: Skills library | Count of active unconfigured skills; hidden at 0 | `homeSummary().unconfigured` `[BUILD lib/home/derive.ts]` `[REQ IM-10]` | "Work left that blocks mapping and student use" | A percent; a deadline |
| Rail: Evaluations | Count awaiting approval; hidden at 0 and when approval is off | `reviewQueue(db).length` `[BUILD]` `[REQ AR-01]` | "Waiting for an administrator decision" | Count of requests with evaluators (not a to-do for the admin) |
| Rail: Course mapping | none | n/a | n/a | Any obligation signal: mapping never gates `[REQ CM-05]` |
| Rail: Attainment | none | n/a | n/a | Any status count (OD-03 open) |
| Home phase cards | Counts in sentences | `homeSummary()` | Facts of state | Skill-status counts (Achieved, Not met), student names, "behind" `[HY-01 §3]` `[OD-03]` `[OD-27]` |
| Page header subtitle on each Set up page | One readiness sentence | same | "34 of 120 configured. Unconfigured skills cannot be mapped or used by students." | A button; a lock |

### 2.3 How readiness shows up (the "visible readiness" promise, honestly)

```
Layer 1  Rail badge            one number on Skills library                 DS today: yes (NavLinkItem.badge)
Layer 2  Home sentence         "34 of 120 skills are configured. 86 ..."    PageHeader subtitle, derived, nothing stored [HY-01]
Layer 3  Phase cards on Home   Set up / Run / Understand, state in words    Card, Collapsible, StatusBadge
Layer 4  Page subtitle         same sentence under each Set up page title   PageHeader subtitle
Layer 5  Optional DS ask       a readiness line in the rail footer          NOT verified in the DS; Square, Slite, Apollo, Vanta all do it [MOBBIN]
```
Honest limit: with the DS as it stands, the rail itself can show readiness in **one number**. Everything richer lives on Home. If the DS adds a footer slot (layer 5), the same derived sentence is reused `[INFER]`.

### 2.4 Student sitemap (own Prism login, student shell) `[REQ ST intro]`

The lifecycle lives *inside the page* as three blocks, not in the rail: **Returned** (act), **Waiting** (who has it), **Still needed** (what the course expects) `[REQ SH-02, ST-01]` `[INFER]`.

```
RAIL (student, 2 rows; bottom tab bar under 768px [MOBBIN Binance via brief-v2])

  Course skills                          P  /student?course=   S-12   course switcher inside the page
     blocks: Returned · Waiting (with whom) · Still needed (mandatory first) · Other skills (collapsed, searchable)
     O  Send for review                      S-13   sheet on mobile, 1024px dialog on desktop [DEC-019]   [REQ ST-04..ST-13]
     O  Skill history                        S-14   ?history=skillId                                      [REQ SH-01..SH-07, RV-01..RV-05]
  My skills                              P  /my-skills          S-15   one record per skill, all courses  [REQ SH-06, AE-05]
     O  Skill history (all courses by default)
```
`NavSection` labels are not used for students: two rows do not need grouping `[INFER]`. Never shown to a student: other students, evaluator contact details beyond name `[ux/01 P-S]` `[INFER]`.

### 2.5 Evaluator (preceptor, lab instructor, faculty by link): no shell, no nav `[REQ EV-01]`

```
S-18 email  ──one link──▶  /e/{token}  S-16   ONE page, one request, one or many skills [REQ EV-05]
                                  │
                                  ├─ form                    answers only; cannot alter how the skill is judged [REQ EV-03]
                                  │    student context + self-evaluation as context [REQ EV-04]
                                  │    per skill, BEFORE submit: "counts when you submit" or "goes to administrator review" [REQ EV-07]
                                  ├─ submitted               repeats the above per skill; no achievement status [OD-17 seam]
                                  └─ link not usable         invalid, expired or used; lifecycle is OPEN [OD-18]
(no sidebar, no breadcrumb, no account, nothing else reachable)   [REQ EV-01]
```
Faculty who work inside Prism may open the same form in the Prism shell `[REQ §7 intro]`. **Nothing in this IA says where they find it** (homeless, section 6).

### 2.6 Reviewer is the administrator in the approval role

One admin role `[docs/strategy/07 G-8]`. The reviewer reaches Evaluations > Needs approval from the Run card on Home, the rail badge, or ⌘K. Approve or Return for correction; the label stays neutral until `OD-16` `[ux/07 S-11]`.

### 2.7 Role entry table

| Role | Auth | Entry | Shell | First screen | Device `[INFER]` |
|---|---|---|---|---|---|
| Administrator / coordinator | Prism login `[REQ §2-5]` | Prism launcher or product switcher | Full DS shell, labelled rail | Home | Desktop |
| Reviewer (admin in approval role) | Same login `[REQ §8]` | Rail badge, Home Run card | Same | Evaluations | Desktop |
| Student | Own login `[REQ §6]` | Prism student course page, or Course skills row | DS compact shell, bottom tab bar on phone | Course skills | Phone or tablet between tasks |
| Preceptor | **None** `[REQ EV-01]` | Email link `[ux/07 S-18]` | **None** | Form | Phone, from email |
| Lab instructor | **None**; name and email only `[REQ SL-08]` | Email link | **None** | Form | Phone or desktop |
| Clinical faculty | Prism **or** link `[REQ §7 intro]` | Email link; in-Prism entry **undefined** | None via link | Form | Desktop |

### 2.8 Moving between setup, daily operation and reporting

| From | To | How, in this IA | Rule |
|---|---|---|---|
| Home | any phase | The phase card's one action; or the rail | Card action carries the filter (e.g. Skills library with Needs configuration applied) |
| Any page | Home | Rail Home | Home is always the same row |
| Run (an approval shows a rule problem) | Set up | "Edit this skill's configuration" link inside the detail (opens S-09 O) | Opening S-09 never changes evidence on its own; a rule edit re-applies to held evidence `[REQ AE-02]` and must say so before save `[INFER]` |
| Understand (a skill is low) | Set up | "Open this skill" link in the By skill row | Same note as above |
| Understand | Run | "Waiting for approval" caveat in By student links to Evaluations > Needs approval | Pending evidence is excluded from achievement `[REQ AR-06]`; the caveat is a link, not a number |
| Set up (a skill is configured) | Understand | Never automatic; no "next" nag | `[REQ §14]` no reminders |
| Set up page | next phase | One optional text link at the bottom: "Next in your cycle" | Passive, one line, test it (risk 8) |
| Between terms | Set up | Home Set up card re-opens when offerings have no skills mapped; OD-01 seam says nothing about "copy from last term" | `[OD-01]` |

### 2.9 Surface placement ledger (every S-xx plus Home and Kits)

| ID | Surface | Role | Phase | Where in this IA | Container | Status in this variant |
|---|---|---|---|---|---|---|
| HY-01 | Home | Admin | all | Rail preamble, `Home` | Page | **Kept**, setup card becomes the Set up phase card |
| HY-02 | Kits | Admin | Set up | Tab `Kits` in Skills library | Tab | **Kept as unconfirmed proposal**: not in REQ, no contract; realises `[REQ IM-14]` only by inference `[docs/design/kits-variants-2026-10-09.md]` |
| S-01 | Overview (attainment) | Admin | Understand | `Attainment` | Page, 3 tabs | Kept |
| S-02 | Student drill-down | Admin | Understand | Overlay on Attainment | Dialog 1024px `[DEC-019]` | Kept; container open (see 2.1 note) |
| S-03 | Evidence ledger and evaluation detail | Admin, student (own) | Understand | Overlay on Attainment; also from S-14 | Dialog, stacked | Kept; stacked dialogs flagged in `brief-v2 §1.3` |
| S-04 | Library: skills list | Admin | Set up | `Skills library` tab Skills | Page tab | Kept; **add** selection column and bulk bar |
| S-05a | Categories | Admin | Set up | Tab | Tab | Kept |
| S-05b | Tags | Admin | Set up | Tab | Tab | Kept |
| S-06 | Clinical settings | Admin | Set up | Tab | Tab | Kept |
| S-07 | Lab instructors | Admin | Set up | Tab; attention link from Home Run card | Tab | Kept |
| S-08 | Import | Admin | Set up | Overlay from Skills library and Home | Dialog 672px then review | Kept |
| S-09 | Skill configure | Admin | Set up | Overlay from library row, Home Continue, Evaluations detail | 3-step Wizard in 1024px dialog `[DEC-016]` | Kept |
| S-10 | Course mapping | Admin | Set up | `Course mapping`, offering detail | Page, master-detail | Kept; recurring each term, see risk 1 |
| S-11 | Review and approve | Admin (reviewer) | Run | `Evaluations` tab Needs approval | Page, card list `[DEC-018]` | Kept; bulk approve proposed in section 8 |
| S-12 | Student course skills | Student | n/a | `Course skills` | Page | Kept; blocks re-ordered by state |
| S-13 | Student send for review | Student | n/a | Overlay on S-12 | Sheet or dialog | Kept |
| S-14 | Student skill history | Student | n/a | Overlay on S-12 and S-15 | Dialog | Kept |
| S-15 | Student my skills | Student | n/a | `My skills` | Page | Kept |
| S-16 | Evaluator form | Evaluator | n/a | `/e/{token}` | Standalone page | Kept |
| S-17 | Export | Admin | Understand | Action on Attainment | Popover | Kept |
| S-18 | Evaluation-request email | System | n/a | Email, contains S-16 link | Email | Kept |
| new | "Waiting on evaluators" | Admin | Run | Tab in Evaluations | Tab | **Proposed [INFER]**, cuttable |
| cut | Heatmap, preceptor consistency, QR codes, batch grid, hierarchy, learning contract | n/a | n/a | Not in IA | n/a | **Cut**: raised on calls, not in REQ `[CALL 09-23]` `[OD-19]` `[OD-20]` `[OD-23]` |

---

## 3. Object model as the user sees it

### 3.1 The nouns, and which are first-class pages

| Noun (user's word) | What it is | First-class page? | Lives in | Source |
|---|---|---|---|---|
| **Skill** | One thing the program expects a student to do; name, description, one category, tags, active or not, configured or not | **No page.** It is a row and an overlay (S-09). A single-skill page is not needed by the lifecycle IA | Skills library | `[REQ SL-02..SL-04]` |
| **Configuration** | How the skill is evaluated and what achievement requires; exactly one model, chosen explicitly | No page; a step inside S-09 | S-09 | `[REQ SC-01, SC-02]` |
| **Category, tag, clinical setting, lab instructor** | Program lists | Tabs | Skills library | `[REQ SL-03..SL-09]` |
| **Course offering** | Course code, term, academic year, professional year, cohorts | **Yes**, `/courses/{id}` | Course mapping | `[REQ CM-01]` |
| **Mapping** | An offering expects a skill, mandatory or non-mandatory | No page; a panel in the offering | Course mapping | `[REQ CM-03, CM-05]` |
| **Evaluation request** (a student's submission) | One send of one or more skills to one evaluator | No page for admins except when it needs approval | Evaluations | `[REQ ST-04, AR-01]` |
| **Evaluation** | The immutable completed record | Overlay (S-03) | Attainment | `[REQ RV-03]` |
| **Student record** | One per student per skill, all courses | Overlay for admin (S-02); page for the student (S-15) | Attainment; My skills | `[REQ AE-05, CM-07]` |
| **Cohort / group** | Filters, from other Prism modules | Filter only | Attainment filters | `[REQ RP-01]` `[docs/strategy/07 G-10]` |
| **Import** | A repeatable batch; each skill traceable to it | Overlay; filter "Import batch" in the library | Skills library | `[REQ IM-11]` |

### 3.2 Phase by noun, one picture

```
                    SET UP                     RUN                        UNDERSTAND
 Skill              create, import, configure  (frozen unless edited)     appears as a row in By skill
 Category / tag     define                     -                          cut attainment by tag [REQ RP-04]
 Clinical setting   define                     chosen by student [ST-06]  filter [RP-01, RP-08]
 Lab instructor     define, adopt [SL-09]      signs off by link [EV-01]  -
 Offering           map skills to it           students see expectations  filter by course [RP-01]
 Request/evaluation -                          send, answer, approve      read, drill, export
 Student record     -                          grows with each evaluation read per student
```

### 3.3 Nouns we deliberately do not promote

| Not a noun in this IA | Why |
|---|---|
| **Kit** | Not in REQ; a persistent grouping can be read as the "many templates" Sankalp does not want `[CALL 09-23]` `[docs/design/kits-variants-2026-10-09.md F9]`. It stays a tab and a seam |
| **Competency, standard** | Boundary undecided `[OD-02]` |
| **Rotation, placement** | Other Prism modules; used only to derive setting `[REQ ST-06]` |
| **Learning contract** | Later phase `[OD-23]` |
| **Behind / at risk** | No definition `[OD-27]` |
| **Share** | There is no sharing requirement. `SH` in the REQ is "students tracking their own record" `[REQ §10]`, not "sharing". The brief's "SH sharing?" is a misreading; the only outbound path is export `[REQ RP-10]` |

---

## 4. Screens inside the DS shell

Rail rows are the real nav; PageHeader is title, one-line subtitle, actions. Buttons are text-only, one filled primary per surface, sentence case, no em-dashes, no red in any score or status `[ux/11]`.

### 4.1 Admin landing: Home (state A, library part-configured)

```
┌ Utility bar ──────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡] (P) Prism Skills ▾  │ Home                         [Search ⌘K] [Bell] [?] [Ask Leo] │ Nursing ▾ (RS) ▾ │
├────────────────────┬──────────────────────────────────────────────────────────────────────────────────┤
│ Home            ●  │ Home                                                [ Import skills ] [ Add skill ]│
│                    │ 34 of 120 skills are configured. 86 cannot be mapped or used until they are.      │
│ Set up             │                                                                                    │
│  Skills library 86 │ ┌ Set up ───────────────────────────────────────────────────────────────────────┐ │
│  Course mapping    │ │ 86 skills left to configure                                    [ Continue ]    │ │
│                    │ │ 1  Bring in your skills        Done      120 in library, 2 lines not read      │ │
│ Run                │ │                                          [ Review lines ]                      │ │
│  Evaluations       │ │ 2  Configure your skills       86 left   Unconfigured skills cannot be used    │ │
│                    │ │ 3  Preview what students and evaluators will see           [ Preview ]         │ │
│ Understand         │ │ 4  Course mapping, recommended    0 of 6 offerings have skills    [ Open ]     │ │
│  Attainment        │ └────────────────────────────────────────────────────────────────────────────────┘ │
│                    │ ┌ Run ───────────────────────────────────┐ ┌ Understand ────────────────────────┐ │
│                    │ │ Nothing is running yet.                 │ │ No evidence has been recorded yet. │ │
│                    │ │ Evaluations begin when students send   │ │ Attainment fills in as evidence    │ │
│                    │ │ evidence.                               │ │ arrives.                           │ │
│                    │ │                                         │ │              [ Open attainment ]   │ │
│                    │ └─────────────────────────────────────────┘ └────────────────────────────────────┘ │
└────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘
 Continue = the ONE filled primary; Import skills and Add skill are outline. No bar, no lock, no Go live.
```
**State B (steady: everything configured, evidence flowing).** Same layout, different emphasis. Set up card collapses to one line (`120 of 120 configured · 6 of 6 offerings have skills`, link `Edit library`). Run card leads:
```
┌ Run ─────────────────────────────────────────────────────────────┐
│ 4 evaluations need your approval                  [ Open approvals ]│   [REQ AR-01]; filled primary of the page
│ 7 requests are with evaluators                    [ View ]         │   [INFER] neutral count, no age
│ 2 lab instructors were named by students          [ Review names ] │   [REQ SL-09]
└──────────────────────────────────────────────────────────────────┘
┌ Understand ──────────────────────────────────────────────────────┐
│ 150 students in scope · BSN 2027 · Spring 2027    [ Open attainment ]│
└──────────────────────────────────────────────────────────────────┘
```
**Honest limits.** (a) The Understand card is a doorway, not a summary: Home may not show skill-status counts or student names `[HY-01 §3]` `[OD-03]` `[OD-27]`. (b) Home has no source requirement; every element not pointing at a REQ fact is `[INFER]` `[HY-01 §0]`. (c) "7 requests are with evaluators" is the single element that edges toward `[REQ §14]`; it is cuttable (Q1).

### 4.2 Core working screen: Skills library (Set up), first-hour state

```
┌ Utility bar ──────────────────────────────────────────────────────────────────────────────────────────┐
├────────────────────┬──────────────────────────────────────────────────────────────────────────────────┤
│ Home               │ Skills library                                      [ Import skills ] [ Add skill ]│
│ Set up             │ 34 of 120 configured. Unconfigured skills cannot be mapped or used by students.     │
│  Skills library 86●│ ┌ info ────────────────────────────────────────────────────────────────────────┐ │
│  Course mapping    │ │ 86 skills need configuration.        [ Continue configuring ]  [ Show them ]  │ │
│ Run                │ └──────────────────────────────────────────────────────────────────────────────┘ │
│  Evaluations       │ ( Skills 120 | Kits | Categories 6 | Tags 3 | Clinical settings 5 | Lab instructors 2 )│
│ Understand         │ [Search skills]  Category ▾  Tag ▾  Status: Needs configuration ✕  Import batch ▾    │
│  Attainment        │ ┌ 3 selected    Apply configuration from…    Deactivate    Clear ────────────────┐ │
│                    │ ☑ Skill               Category    Model            Achieves when     Courses  Status │
│                    │ ☑ Wound care          Category B  Not configured   none                  0   Needs config │
│                    │ ☑ Vital signs         Category A  Not configured   none                  0   Needs config │
│                    │ ☑ Tracheostomy care   Category B  Not configured   none                  0   Needs config │
│                    │ ☐ Foley insertion     Category A  Question-level   all 3 Yes, 3 times    4   Active  [Edit]│
│                    │                                                         Showing 25 of 120  [Show more]  │
│                    │ Next in your cycle: Course mapping, recommended. Students can still submit skills that  │
│                    │ are not mapped to their course.                           [ Open course mapping ]       │
└────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘
 Filled primary: Add skill (one). Continue configuring is a link-weight action in the banner, because the page already has a primary.
```
What is new against the current build `[BUILD components/library/skills-tab.tsx]`: the **selection column and bulk bar** (the S-04 table has none today, and bulk apply is reachable only inside the wizard `[friction-baseline]`), the readiness subtitle, and the **Next in your cycle** line. What is kept: banner, tabs, filters, model and criteria columns `[PROTO 08, 13]`. The Kits tab is shown because the placeholder exists today; it carries no behaviour in this document `[BUILD PLACEHOLDERS.kits]`.

### 4.3 Student landing (compact, phone)

```
┌ Course skills ─────────────┐   Blocks follow the state, not the lifecycle rail:
│ NURS 350 ▾                 │   Returned: act now [REQ RV-01, SH-02]
│ ┌ Returned (1) ──────────┐ │   Waiting: who has it [REQ SH-02]
│ │ IV insertion           │ │   Still needed: what the course expects, mandatory first [REQ ST-01]
│ │ Fix the date and unit  │ │   Wound care shows WHY 4 of 4 is not achieved [REQ SH-05, SC-12]; DEFECT-07
│ │ [ Revise and resend ]  │ │
│ └────────────────────────┘ │
│ Waiting (2)                │
│  Foley · with J. Delgado   │
│  Wound · lab, K. Larsen    │
│ Still needed (3)           │
│ ☐ Wound care   4 of 4      │
│   Needs 1 in Emergency     │
│   Lab does not count there │
│ ☐ Foley        2 of 3      │
│ Other skills ▾             │
│ ┌ 1 selected ────────────┐ │
│ │ [  Send for review  ]  │ │  the ONE filled primary; Revise and resend is outline
│ └────────────────────────┘ │
├────────────────────────────┤
│  Course skills   My skills │
└────────────────────────────┘
```
`[INFER]` for layout; REQ for every rule shown. Mobile is not stated in REQ; the persona implies it `[ux/01 P-S]`.

### 4.4 Evaluator mobile (no shell)

```
┌ Prism ─────────────────────┐
│ Sign off 2 skills          │
│ Olivia Martin · NURS 350   │
│ You are J. Delgado, RN     │
│ ─ Foley catheter ───────── │
│ Counts when you submit     │   [REQ EV-07] stated BEFORE the answers
│ Performs preparation?      │
│ [   Yes   ] [    No    ]   │
│ Comment (optional)         │
│ ─ IV insertion ─────────── │
│ Goes to administrator      │   [REQ EV-07, SC-15]
│ review                     │
│ Level: [Observed]          │
│        [With assistance]   │
│        [Independent]       │
│ Comment (required)  [____] │   [REQ EV-06, SC-14]
│ 1 of 2 answered            │
│ [   Submit 2 skills   ]    │   disabled with a stated reason until complete
│ Your answers are recorded  │
│ for the student. No sign-in│
│ is needed.                 │
└────────────────────────────┘
```
Shows no student achievement status and no progress `[OD-17 seam]` (`DEFECT-05`). Link problem states are a separate standalone page `[OD-18]`.

### 4.5 Attainment (Understand), compact, used by journeys 2 and 3

```
┌ Attainment ─────────────────────────────────────────────────────  [ Export ▾ ] ┐
│ Cohort BSN 2026 ✕   Setting Inpatient ✕   + Add filter            Clear          │
│ 40 students · counting evidence recorded in Inpatient                            │
│ ( By student | By skill | By tag )      [Search]      Sort: Lowest attainment ▾  │
│ Student            Achieved  In progress  Evidence does not qualify  No evidence  │
│ Priya Tran             3          1                 1                    5        │   four states behind one flag [OD-03]
│ …                                                         Showing 25 of 40       │
│ Caveat: figures exclude evaluations waiting for approval. [See them]             │   [REQ AR-06] link into Run
└──────────────────────────────────────────────────────────────────────────────────┘
```
"Lowest attainment" is a sort label, not a "behind" list `[OD-27]`.

---

## 5. Three journeys walked through the IA, with click counts

Counting rule: one click, tap, selection or typed field, as in `friction-baseline.md`. Each row is split into **IA-owned** clicks (navigation this architecture decides) and **surface-owned** clicks (inside a page, unchanged by this architecture). All counts are estimates `[INFER]`; nothing was timed and no user was observed.

### 5.1 Journey 1: first hour, 80 skills in, configured, one course family mapped

Assumptions: 80 skills, about 20 per evaluation model; a list file with 8 rows to fix and 2 unread lines; 3 offerings of one course family, 10 skills each; no copy-mapping control because `OD-01` is open; bulk apply reachable from the library bulk bar (new, see 4.2).

```
Home ──Import skills──▶ import dialog ──▶ Skills library (banner) ──Continue──▶ configure x4 models ──Apply──▶ 76 more
  │                                                                                                         │
  └────────────── Home "Preview" (2) ◀───────────────────────────────────── Course mapping (rail) ◀──────────┘
```

| # | Step | Where | Clicks | Owner |
|---|---|---|---|---|
| 1 | Open product, lands on Home (empty library state) | Home | 0 | IA |
| 2 | Import skills | Home action | 1 | IA |
| 3 | Choose file (2), Read the list (1), fix 8 rows (8), resolve 2 unread (2), Create 80 skills (1) | Import overlay | 14 | Surface `[REQ IM-05..IM-08]` |
| 4 | Continue configuring (banner on the library, arrives at the first unconfigured skill) | Skills library | 1 | IA |
| 5 | Configure one skill per model | S-09 overlay | 4 x 15 = 60 | Surface |
| 6 | Apply that configuration to the rest of each model | Bulk bar | 4 x 5 = 20 (filter by category, select all, Apply, confirm) up to 4 x 22 = 88 (tick about 19 each) | Surface |
| 7 | Preview what students and evaluators see | Home card | 2 | IA `[REQ SC-19]` |
| 8 | Open Course mapping | Rail | 1 | IA |
| 9 | Map 3 offerings, 10 skills each | S-10 | 33 | Surface |
| | **Total** | | **136 to 204** (IA-owned **5**, surface-owned **131 to 199**) | |

Reading: against the current build the same job is about 190 `[friction-baseline: about 16 + 144 + 33]`. **The lifecycle architecture saves 3 to 6 navigation clicks and nothing in the work itself.** Its real value in this journey is orientation and resumption: after a break, Home's `Continue` returns to the exact next unconfigured skill in 1 click, and the rail badge says how many are left. The accelerator for this journey is bulk selection (a surface decision) or kits (`HY-02`, unconfirmed), not the IA `[INFER]`.

### 5.2 Journey 2: weekly review, then who has the lowest attainment

Assumptions: 16 evaluations waiting, 12 where student and evaluator agree, 4 where they differ `[friction-baseline seed]`; approvals exist because a skill turned them on `[REQ SC-15]`.

| # | Step | Where | Clicks | Owner |
|---|---|---|---|---|
| 1 | Open product, Home shows Run card: "4 evaluations ..." (use the real count) | Home | 0 | IA |
| 2 | Open approvals | Run card or rail | 1 | IA |
| 3 | Clear the 12 agreeing: select the agreeing group, Approve selected | Needs approval | 2 (needs bulk; today 12) | Surface `[brief-v2 A5]` |
| 4 | Decide the 4 differing: open, full responses, type note, decide | Needs approval | about 4 x 3.5 = 14 | Surface `[REQ AR-02..AR-05]` |
| 5 | Open Attainment | Rail | 1 | IA |
| 6 | Sort Lowest attainment first (0 if the admin's last sort is remembered) | Attainment | 1 | Surface |
| 7 | Open the first student, open the failing skill, open the evaluation | S-02 then S-03 | 3 | Surface (3 stacked containers) |
| | **Total** | | **22** with bulk (12 + 4 + 6 phase work), **32** with today's per-card approve | IA-owned 2 |

Reading: current build is about 25 + 6 + 2 = 33 `[friction-baseline]`. The IA contributes the Home-to-Run shortcut and one phase hop (Run to Understand). The big saving, bulk approve, is a surface change that works in any IA. `[INFER]`

### 5.3 Journey 3: accreditation visit, evidence pull

Task: "Show that BSN 2026 met Foley catheter insertion, with the evidence, in Inpatient." Assumptions: By skill rows reach individuals `[REQ RP-05]` (not seen in the prototype for skills `[ux/07 S-01]`, needs building); export covers the full filtered scope with filters written to the header `[REQ RP-10]`.

| # | Step | Where | Clicks | Owner |
|---|---|---|---|---|
| 1 | Open Attainment | Rail (Understand) | 1 | IA |
| 2 | By skill tab | Attainment | 1 | Surface |
| 3 | Add filter Cohort, choose BSN 2026 | Filter bar | 2 | Surface |
| 4 | Add filter Setting, choose Inpatient | Filter bar | 2 | Surface `[REQ RP-08, RP-09]` |
| 5 | Open Foley row, see the students behind it | By skill | 1 | Surface (build) |
| 6 | Open a student, open the ledger row, open the full evaluation | S-02, S-03 | 3 | Surface |
| 7 | Export, Evidence detail (row per evaluation) | Export popover | 2 | Surface `[REQ RP-10]` |
| | **Total** | | **12** (IA-owned 1) | |

Reading: this journey is event-driven, not phase-driven. A visiting accreditor arrives in *Understand* only if the admin names it that. That is exactly what the first-click test in section 9 checks. Not answerable from this IA, whatever the label: which evaluator and which site, because `OD-11` leaves that dimension unexposed, and "accreditation-ready outputs beyond the exports" is out of scope `[REQ §14]`.

### 5.4 What the three journeys say about the architecture

| Observation | Consequence |
|---|---|
| IA-owned clicks are 1 to 5 of 12 to 204 | A navigation architecture cannot rescue a heavy surface. Do not sell Variant A as a speed-up |
| Orientation and resumption are the wins | Judge it by first-click accuracy and by "can I find where I was", not by click counts |
| Journey 3 depends on a label the user may not guess | Label risk is the main thing to test |

---

## 6. Requirement coverage: every REQ area, where it lives

| REQ area | IDs | Lives in this IA | Surface | Notes |
|---|---|---|---|---|
| **SL** Skills library | SL-01 to SL-11 | Set up > Skills library (tabs) | S-04 to S-07, S-09 | Empty state ships nothing `[REQ SL-01]`; deactivation withdraws from mapping and selection `[REQ SL-11]` |
| **IM** Import | IM-01 to IM-15 | Set up > Skills library, overlay; Home step | S-08 | Imported skills arrive unconfigured `[REQ IM-09]`; unconfigured count in rail `[REQ IM-10]`; bulk apply `[REQ IM-14]`; interpretation scope `[OD-12]` |
| **SC** Configure | SC-01 to SC-19 | Set up > Skills library, overlay | S-09 | Model never defaulted `[REQ SC-02]`; preview `[REQ SC-19]` |
| **CM** Course mapping | CM-01 to CM-08 | Set up > Course mapping | S-10 | Carry-forward `[OD-01]` seam only |
| **ST** Student submits | ST-01 to ST-14 | Student > Course skills | S-12, S-13 | Setting once or per skill `[OD-07]` seam |
| **EV** Evaluator | EV-01 to EV-08 | `/e/{token}`; no rail | S-16, S-18 | Role set fixed or program-defined `[OD-06]` seam |
| **AR** Approval | AR-01 to AR-06 | Run > Evaluations > Needs approval | S-11 | Return target `[OD-16]` open |
| **RV** Revision | RV-01 to RV-06 | Student > skill history | S-14 | Evaluator re-answers prefilled or fresh `[OD-08]` |
| **SH** Student's own record | SH-01 to SH-07 | Student > Course skills, My skills | S-12, S-14, S-15 | **Not "sharing"**; see 3.3 |
| **RP** Reporting | RP-01 to RP-11 | Understand > Attainment | S-01 to S-03, S-17 | CSV vs Excel `[OD-10]`; evaluator and site dimension `[OD-11]` not exposed |
| **AE** Achievement engine | AE-01 to AE-08 | Cross-cutting; no page | Visible in S-01, S-02, S-12, S-14, S-15 | Four states vs merged `[OD-03]` flag |

### 6.1 Homeless or weakly housed

| Item | Why homeless | Proposed handling `[INFER]` |
|---|---|---|
| **Faculty entry inside Prism** `[REQ §7 intro]` | Faculty "may already work inside Prism"; no requirement or surface says where they find a pending request | A "Requests for you" row in the faculty's own Prism nav, outside this module's rail. Needs Vishaka and Sankalp |
| **Admin visibility of requests with evaluators** | Not in REQ; `[HY-01]` permits an optional neutral count only; `[OD-18]` open | "Waiting on evaluators" tab, read-only, cuttable (Q1) |
| **Skill status vocabulary** `[AE-04, AE-08]` | Four states vs three is open | Display flag; both renderings kept `[OD-03]` |
| **Remediation, reminders, expiry, encounter linkage, Evaluations migration** | Out of scope `[REQ §14]` | No home by design |
| **Evaluator and site analytics** | `[OD-11]`; heat maps raised on call as possibly phase 2 `[CALL 09-23]` | No home in v1; data kept |
| **Sub-roles (who configures, who approves)** | `[docs/strategy/07 G-8]` | One admin role; Run could show to people who cannot act |
| **Sharing a report with an accreditor** | No requirement | Export only `[REQ RP-10]` |
| **Config change history** | `[docs/strategy/07 G-9]` | Not designed |

No requirement ID in the table above is without a home, apart from the items listed. AE has no page of its own by design.

---

## 7. Mobbin analogies (product-level; images viewed 2026-10-09)

Searches: compliance dashboards, LMS and creator admin, ATS and HRIS, audit and evidence tools, skills and competency trackers, healthcare credential tracking, no-account link completion, setup checklists in the rail, phase-grouped rails, learner progress for administrators. Fit means *relevance to this architecture claim for a nursing program admin with 40 to 200 skills and cohorts*.

| Product | What the IA is (what I saw) | What transfers | What does NOT transfer | Fit |
|---|---|---|---|---|
| **GitLab** [MOBBIN GitLab https://mobbin.com/screens/88cb55c2-f6df-4a7c-b765-3fe584e6b126] | Left rail grouped in lifecycle order: Manage, Plan, Code, Build, Secure, Deploy, Operate, Monitor, with children and a "Learn GitLab 50%" row | A shipped, phase-ordered, labelled rail with children works at scale; readiness sits in the rail | Nine phases for engineers who live in it daily; ours has three phases for a weekly user | **Strong** (grammar), Weak (audience) |
| **Apollo** [MOBBIN Apollo https://mobbin.com/screens/09da790a-fc80-4bd0-b0cf-0bc5fcedc394] | Rail groups Prospect and enrich, Engage, Win deals, Tools and automation, Inbound; Home has Setup steps; footer "Onboarding hub 37% completed" | Workflow-stage group labels plus a readiness line in the footer, on an admin-style product | Stages are a sales funnel of objects, not a calendar loop; percent in footer is a bar | **Strong** |
| **Vanta Starter Guide** [MOBBIN Vanta https://mobbin.com/screens/d6c8a960-3253-4ca4-b4aa-06e902fa0e4e] | "Finish Starter Guide, 15/20 tasks" in the rail header; steps grouped by outcome with locked steps; rail has labelled groups OVERVIEW, COMPLIANCE, TRUST, RISK, ORGANIZATION | Readiness in the rail; labelled groups; group steps by outcome | **Locked steps** (REQ CM-05, OD-15 forbid); the rail groups are domain objects, not phases | **Strong** (readiness), Weak (lock) |
| **Vanta Home** [MOBBIN Vanta https://mobbin.com/screens/377a125e-c3ed-4d8d-8433-96ee282e4def] | Home with "Compliance progress 99%" and Monitoring cards with "Needs attention" counts; Open Tasks panel | Home as counted attention cards that link into a filtered list | Percent bars as primary viz; domain-object rail | **Partial** |
| **HoneyBook** [MOBBIN HoneyBook https://mobbin.com/screens/a884b2a1-0ee1-4572-be9b-2e26115f8139] | "Setup" is the first rail row with "0/7 completed"; object rail below (Home, Projects, Calendar, Services) | Setup as an always-reachable destination with effort labels | Setup is a separate onboarding row, not a phase of a loop; object rail below it | **Partial** |
| **Wix** [MOBBIN Wix https://mobbin.com/screens/f04c5a3f-4176-4e4c-8243-c37aed09b1ef] | "Let's set up your blog 4/5 completed" above the rail; a Setup row; object rail (Home, Getting Paid, Sales, Catalog) | Readiness chip at the top of the rail | Same as HoneyBook; checklists retire | **Partial** |
| **Square** [MOBBIN Square https://mobbin.com/screens/8147869b-c430-407b-b49f-3ebdc1174ef8] | "Complete your setup 80%" bar at the top of the rail, object rail below | Readiness at the top of the rail | Bar is banned as primary viz | **Partial** |
| **Deputy** [MOBBIN Deputy https://mobbin.com/screens/6c234dac-ed5c-41ea-81ee-d8cad810fce7] | Top nav by domain (Timesheets, Payroll); Home "Set up labor compliance tools", "Setup tasks 5/7" chip, "Needs Attention / Needs Approval / What's happening" | The **Needs attention / Needs approval** triple is the Run card | Notifications and compliance-law framing | **Partial** |
| **Deel compliance and learning** [MOBBIN Deel https://mobbin.com/screens/9c17783e-46c9-45d2-8bfd-0f3d1cff575b, https://mobbin.com/screens/183566db-f0b6-42f8-b0e1-03e56e32ed35] | Count cards with denominators ("155 / 249 workers Not submitted"); learning Insights with Not started, In progress, Completed, Overdue | Counts with denominators, no heat; fits the four AE-04 states | Row action "Send message" is a notification, out of scope `[REQ §14]`; Overdue | **Partial** |
| **Workable onboarding** [MOBBIN Workable https://mobbin.com/screens/40687703-0318-4956-8fdb-c84eeeaee1b0] | Top nav Jobs, Candidates, Employees; Onboarding page with a status list Pending, Scheduled, In progress, Complete | Lifecycle expressed as a status list inside an object | Lifecycle is a filter, not the nav | **Partial** (supports status, argues against lifecycle nav) |
| **Employment Hero** [MOBBIN Employment Hero https://mobbin.com/screens/505c7ca8-e895-4ef9-a8e1-1f03aa008263] | Icon rail by domain: Start Guide, Home, Recruitment, People, Compliance, Time, Pay | Nothing about phases | Evidence that HR and ATS suites organise by domain object | **Weak** |
| **Gusto** [MOBBIN Gusto https://mobbin.com/screens/17e802d1-0d60-49bd-ad18-a9e44fe9a609] | Rail: Home, People, Pay, Reports, Taxes & Compliance with children Tax setup, Tax documents, Stay compliant | Setup as a child of a domain | Opposite of a phase rail | **Weak** |
| **Remote** [MOBBIN Remote https://mobbin.com/screens/4ded0f24-17fd-4c6f-998a-6d6d2074d1b0] | Rail with labelled groups by function (Payroll & payments, Reports & analytics, Workforce planning, HR tools) | Labelled groups of rows are a normal rail pattern | Groups by function, not time | **Partial** |
| **Uxcel** [MOBBIN Uxcel https://mobbin.com/screens/dd5c1897-0f5e-44c8-95c7-6a9faa0e90a5] | Team learning admin: Dashboard, Assignments, Reporting, Leaderboard, Members; assignments with Active, Completed, Missed | Assignment tracking with counts | Leaderboard and ranking invite the fairness problem `[Aarti memory]`; red/green chips | **Partial** |
| **SchoolAI / Circle / Kajabi** [MOBBIN SchoolAI https://mobbin.com/screens/00828d09-252c-4d02-92a1-58966ebbe19d, Kajabi https://mobbin.com/screens/1227af09-4d68-457a-a7ea-a5596e2c3e4f] | Class to learner to outcome drill; per-outcome dots per student; learner progress with module list | Aggregate to individual to item, the RP-05, RP-06 shape | Mastery gauge and mean score are not our model; progress rings | **Partial** |
| **15Five** [MOBBIN 15Five https://mobbin.com/screens/e99a8704-df37-4c4b-8047-fb770aaf5b47] | Competency results grid by self, manager, peer | The only people x competency grid found | Review cycle product, not evidence | **Weak** |
| **Aboard Skills settings** [MOBBIN Aboard https://mobbin.com/screens/f51d273f-f1ad-47f4-99fe-56b365c9eb36] | Skills as categories with skills, inside Settings | Confirms skills as a category tree | It is a settings list; ours is the product | **Weak** |
| **Fibery public form** [MOBBIN Fibery https://mobbin.com/flows/1c313a6b-81bb-4d0d-89b5-1eec073c9c53] | Public link opens a plain form, then "Thank you, your submission was successful" | No-account completion and end state | The end state tells nothing about counting or review `[REQ EV-07]` | **Partial** |
| **Mural visitor, Slite guest** [MOBBIN Mural https://mobbin.com/flows/24cc0af1-0866-455d-b3cc-11e1da34b922, Slite https://mobbin.com/flows/1a291f01-6644-445d-8280-a45abb3f1ca7] | Visitor interstitial before entering; guest invite that creates a guest member | Nothing | Gates and identity steps contradict `[REQ EV-01]` | **Weak** |

**Where no reference exists, said plainly.**
1. **No product found organises its primary rail by the operating calendar of a periodic program** (Set up, Run, Understand across a term). The closest lifecycle rails are GitLab and Apollo, both continuous workflows, not seasons.
2. **HR, ATS, compliance and LMS products overwhelmingly use a domain-object rail and put lifecycle inside objects or in a setup checklist that retires** (Employment Hero, Gusto, Remote, Workable, HoneyBook, Wix). That is evidence for the object-first alternative, not for this variant.
3. **No clinical-education or accreditation product** appeared. Mobbin returned none for nursing skills tracking.
4. **No guest-assessor completion flow with a result that says "counts now or held"** (Fibery is the nearest) `[docs/design/mobbin-evidence.md]` repeats the same gap.
5. **No student x skill grid at 150 x 100 with a drill-down** (15Five is the nearest and is not evidence).

---

## 8. DS component implications, and what is reused versus rebuilt

### 8.1 DS implications

| Need | Component | Status |
|---|---|---|
| Labelled rail groups | `NavPrimaryLayout`, `NavSection`, `NavLinkItem.badge` | Types exist `[source.mjs NavLinkItem, 1.5.1]`; **rendering by the installed AppSidebar not verified**; localhost:4000 not checked `[unverified]` |
| Phase cards on Home | `Card`, `CardHeader`, `CardTitle` (as `h2`), `Collapsible`, `StatusBadge` semantic mode, `Button` text-only | IMPORT `[HY-01 §8]`; one new composition `PhaseCard` on Card `[INFER]` |
| Readiness subtitle | `PageHeader` subtitle | IMPORT |
| Tabs inside pages | `Tabs` variant `line` | IMPORT |
| Bulk bar and selection | `DataTable` selection, `Checkbox`, `Badge` count | IMPORT; bulk bar is composition `[ux/10 C-17]` |
| Evaluations tabs | `Tabs`, `DataTable` or card list `[DEC-018]` | IMPORT |
| Student bottom tab bar | not in DS list reviewed | `[brief-v2 §3.2]` unverified |
| Readiness line in rail footer | **not available** | DS ask (layer 5 of 2.3) |
| Not used | `Stepper`, `Progress`, `Combobox`, `MultiSelect` | Not exported; not needed `[ux/10 §1]` |

### 8.2 Reuse versus rebuild, honest cost

S = under a day, M = a few days, L = a week or more of one engineer `[INFER]`; none measured.

| Area of the current build `[BUILD]` | Reused as is | Rebuilt or added | Cost |
|---|---|---|---|
| **Shell and nav** (`skills-nav.tsx`, `components/shell/*`) | Utility bar, switchers, profile menu, view chip | Return `NavPrimaryLayout` with three sections; rename Reviews row; badge rules | **S** if `sections` renders, **M** if the shell needs changes |
| **Home** (`components/home/*`, `lib/home/derive.ts`) | `homeSummary`, setup card, attention list, links, tests of derivations | Re-compose into three phase cards; empty Run and Understand states; state B | **M** |
| **Skills** (`components/library/*`, `components/configure/*`, import) | All tabs, dialogs, wizard, lineage, import | Selection column and bulk bar; readiness subtitle; next-in-cycle line | **M** (bulk bar), **S** (copy) |
| **Kits** | Placeholder tab | Entire feature `HY-02` | **L**, separate decision, not part of this variant |
| **Courses** (`components/mapping/*`) | Master-detail, mapping logic | "Only configured skills are shown, 86 are not" notice; no copy-from (blocked by `OD-01`) | **S** |
| **Evaluations / Reviews** (`components/review/*`) | Card list, agreement compare, responses | Row rename and redirect; tab "Waiting on evaluators" (read-only); bulk approve of agreeing items | **M** |
| **Attainment** (`components/reporting/*`) | KPI strip, tables, filters, export, dialogs | By skill rows reaching individuals `[REQ RP-05]`; sort default and remembered view; pending-approval caveat link | **M** |
| **Student** (`components/student/*`) | Course skills, send dialog, history, my skills | State-ordered blocks, "Still needed" headline; mobile bottom tab bar | **M** |
| **Evaluator** (`components/evaluator/*`, `/e/[token]`) | All of it | "What happens next" line before the answers | **S** |
| **Engine, store, seed** (`lib/engine`, `lib/store`, `lib/domain`) | All | Selector for "waiting on evaluators" count if not present | **S** |

Total: **Medium**. Engine and data are untouched; the cost is regrouping the rail, reworking Home, and three surface additions (bulk bar, bulk approve, By-skill drill) that any variant needs.

---

## 9. Strengths, risks, failure conditions, and a 5-user test

### 9.1 Strengths

| # | Strength |
|---|---|
| 1 | One sentence explains the whole product to a new admin ("set it up, run it, understand it"), which a flat list of five nouns does not |
| 2 | Orientation and resumption: Home answers "where was I" in one click and the rail badge is a real, derived number |
| 3 | Costs almost nothing in the engine: the same five destinations and routes, regrouped |
| 4 | Honours every hard stop, including the ones brief-v2 Direction A broke (no gate, mapping optional) |
| 5 | Gives accreditation and approvals a stable address that does not depend on remembering object names |

### 9.2 Risks

| # | Risk | Likelihood | Mitigation or test |
|---|---|---|---|
| 1 | **Phases are not exclusive.** Course mapping recurs every term and may be sought under Run | High | Test where users look for "add next term's course"; fallback: put Course mapping first under Run |
| 2 | **Run is thin for admins.** REQ gives the admin exactly one operational job, approvals, which many programs will not turn on | High | "Waiting on evaluators" tab; if cut, Run vanishes (2.1) and the lifecycle story is two phases |
| 3 | **Label ambiguity.** "Run" and "Understand" are not nursing-admin vocabulary | Medium | Closed card sort and alternates (Prepare, Track, Report) |
| 4 | **Accreditation is event-driven.** An admin needs "Reports" at the visit and may not map it to Understand | Medium | Journey 3 first-click task |
| 5 | **Readiness in the rail is one number** with today's DS | Certain | Home carries it; DS footer ask |
| 6 | **Implied order feels like a gate.** "Set up" before "Run" invites a belief that students cannot submit before mapping | Medium | Copy "recommended"; CM-05 line on Course mapping and on the library footer |
| 7 | **Home Understand card is a doorway.** HY-01 forbids status counts and "behind" lists, so it adds little | Certain | Accept; do not add counts without `OD-03` and `OD-27` |
| 8 | **"Next in your cycle" reads as a reminder.** Reminders and notifications are out of scope | Low | Passive text link; test whether users call it a nag; cut if so |
| 9 | **"Waiting on evaluators" drifts into chasing.** Resend and age are `OD-18` territory | Medium | Read-only, no age, no resend; review each release |
| 10 | **Section labels vs Design OS flat list.** PCE and the starter use flat rows with tabs `[ds-shell-anatomy §3]` | Medium | Ask Vishaka (Q10) |
| 11 | **Admin-centric.** Student and evaluator are roughly most of the volume and this variant changes almost nothing for them | Certain | State it; do not credit the variant for their outcomes |
| 12 | **If `OD-P1` makes Skills a section inside Prism admin**, three labelled groups become children of one "Skills" row and the lifecycle label weakens | Medium | Fallback: one `Skills` row with three children `Set up`, `Run`, `Understand`, each a page with tabs (still 2 levels) |

### 9.3 What would make this fail (stop conditions)

| Condition | Threshold | Action |
|---|---|---|
| First-click accuracy on tasks T1, T2, T3, T5 | below 4 of 5 users on any | Revert to the current object rail (Home, Skills, Courses, Attainment, Reviews) |
| T4 (accreditation evidence) | fewer than 3 of 5 click Understand | Rename Understand to Reports; retest |
| Users place Course mapping under Run | 3 or more of 5 | Move it; rethink the phase model |
| Users read the group labels as order of obligation | 2 or more of 5 say "I have to finish Set up first" | Drop the groups, keep Home cards |
| Run empty for the usual admin | most programs have no approvals and Sankalp cuts "Waiting on evaluators" | Two-phase rail, or drop Variant A |

### 9.4 Cheapest 5-user test (no build)

**Who.** 5 program admins or coordinators: at least 2 nursing, 1 PA or OT to keep the generic claim honest `[ux/01 P-A validation]`. Same sessions can host the other validation items in `docs/ux/12`; this is not a replacement.
**What.** One 30-minute moderated session on **static screens only** (the ASCII in section 4 redrawn as two images): **Tree A** (this variant: Home / Set up / Run / Understand) versus **Tree B** (the current rail: Home, Skills, Courses, Attainment, Reviews). Order counterbalanced across users.
**Tasks** (read aloud, first click recorded, then a one-line "what do you expect here"):

| # | Task | Correct under A | Correct under B |
|---|---|---|---|
| T1 | "You imported 80 skills yesterday. Find where to finish them." | Set up > Skills library | Skills |
| T2 | "A preceptor submitted a sign-off that needs your decision." | Run > Evaluations | Reviews |
| T3 | "Which students have the lowest skill attainment this term?" | Understand > Attainment | Attainment |
| T4 | "An accreditor asks for the evidence that your cohort met one skill in Inpatient." | Understand > Attainment | Attainment |
| T5 | "A new term starts. Tell students what skills the new course offering expects." | Set up > Course mapping | Courses |
| T6 | "A student named a lab instructor who is not on your list." | Set up > Skills library > Lab instructors | Skills |

**Measures.** First-click correctness per task and tree; time to first click; the user's one-sentence expectation; a closed card sort of 12 task cards into the three labels plus "somewhere else"; label preference between Set up/Run/Understand and Prepare/Track/Report. Tally against 9.3.
**Not tested here, on purpose:** the student and evaluator surfaces (their IA does not change).

---

## 10. Open questions

**For Sankalp (requirements and decisions)**
1. `OD-18`-adjacent: is **admin visibility of requests with evaluators** (a read-only "Waiting on evaluators" view with no age and no resend) acceptable, or is it a step toward reminders and escalation, which are out of scope `[REQ §14]`? If no, Run exists only when approvals are on.
2. `OD-15`: is activation a separate state? If yes, Home gains one action and the Set up / Run boundary gets a real edge. If no, phases stay lenses.
3. `OD-01`: do mappings carry forward? Decides whether Course mapping is a one-time Set up chore or a recurring per-term chore (risk 1).
4. `OD-27`: how does a program define "behind"? Until then Understand offers sorting only.
5. Who may approve versus configure `[docs/strategy/07 G-8]`: if approval is a sub-role, Run should be hidden from people who cannot act.
6. Is there a term-close or program-year ritual (for example a per-term sign-off) that deserves its own real step in the loop?

**For Aarti (product)**
7. Is Skills Tracking a **setup-heavy, then weekly** tool, or an **operational** one used daily? The lifecycle rail assumes the first.
8. Does "Understand" read as the place for accreditation evidence, or would "Reports" be expected?
9. Is a count of requests with evaluators on Home useful to a coordinator, or does it invite chasing?

**For Vishaka and Sarah (nursing SME)**
10. Vishaka: does a **labelled-section rail** fit the Exxat Design OS (PCE and the starter use flat rows with tabs `[ds-shell-anatomy §3]`), and where does Skills sit if `OD-P1` makes it a section of Prism admin?
11. Sarah: what does a coordinator actually do in a normal week of a term? (This decides whether Run has anything real beyond approvals.)
12. Sarah: do lab instructors need batch sign-off (`OD-19`)? It would put a second operational surface under Run.

**For Romit**
13. Keep **Kits** as a tab under Set up, or leave it out of the IA until a contract exists?
14. Is passive "Next in your cycle" text acceptable, or is any prompt too close to a reminder?
15. Which wins if tested close: the lifecycle rail or the current object rail with Home phase cards only (the cheaper half of this variant)?

---

## Appendix: what I could not verify

| Not verified | Why |
|---|---|
| That the installed `AppSidebar` renders `NavSection` labels and a numeric badge exactly as designed | Read the type only (`source.mjs NavLinkItem`, 1.5.1); `localhost:4000` not opened; no render |
| Any pixel, spacing, focus or axe result | Spec mode; nothing rendered |
| Click counts | Counted on paper from the build structure and `friction-baseline.md`; not timed, not observed |
| That the label "Run" or "Understand" works for nursing admins | No user evidence; only a test plan |
| That the phase model matches how real programs spend a year | `[INFER]`; REQ and the call do not describe a calendar |
| Product behaviour of the Mobbin references beyond the screens shown | Single screens and short flows; none is clinical education |
| The seeded counts on every wireframe | Placeholders |
| Whether "Waiting on evaluators" has a list selector today | `evaluatorRequest(db, token)` exists for one link (`lib/store/selectors/evaluator.ts`); no all-requests selector was found, so the tab needs one `[BUILD]` |
| REQ section 15 | Missing from the document body `[docs/README.md]` |
