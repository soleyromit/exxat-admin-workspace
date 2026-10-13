# Skills Tracking: Design Brief v2 (three directions)

Date: 2026-10-08 · Author: design worker (fork) · Status: **proposal for Romit's decision, nothing built from this**
Why this exists: Romit's feedback on the build: *"you didn't use your design or UX skills to come up with a better alternative design and workflow; I was expecting a different design,"* and *"the header doesn't match the Exxat DS header and menu hierarchy."* The current build re-renders Sankalp's prototype almost verbatim. This brief applies design judgement to the jobs behind it.
Skills applied: `exxat-senior-ux` (brief template), `exxat-design-contract` (spec parse, Mobbin before layout, DS table, states), `design-variants` (spec mode, divergent directions), `better-layout`, `better-interface` (cross-discipline lens), `design:design-critique`, `exxat-domain-context`.
Companions: `docs/design/friction-baseline.md` (measured friction), `docs/design/mobbin-evidence.md` (31 Mobbin URLs, patterns not pixels).
Tags: `[REQ x]` requirement · `[OD-n]` open decision · `[CALL 09-23]` raw transcript · `[CALL 03-05]` vault note · `[MOBBIN url]` · `[PCE file]` read in `apps/pce/admin` · `[INFER]` my inference.
Source precedence unchanged for **behaviour**: REQ > CALL > PROTO > INFER. This brief only changes **structure, workflow and layout**, and says where a direction weakens a requirement.

---

## 0. The brief (senior-UX template)

```
Problem:            A program holds 40 to 200 skills in a document and must prove, per student,
                    that each was performed and signed off. Today it re-types them one by one,
                    cannot see who is behind, and students and preceptors lose time on forms. [REQ 1.1, 3] [CALL 09-23]
User & frequency:   Program admin: heavy at setup (once per program), light weekly after.
                    Student: daily on shift, seconds between tasks, often on a phone.
                    Preceptor: occasional, no account, one request at a time.
                    Reviewer/coordinator: weekly queue; per-term reporting.
Job-to-be-done:     Admin: get to a trusted, live library fast, then know who is lagging.
                    Student: log evidence in seconds and know what counted.
                    Preceptor: sign off without friction. Reviewer: clear the queue.
Pattern:            Role-scoped IA inside the Exxat DS shell (below), one home per role,
                    side-panel drill-down instead of stacked dialogs.
Reference (repo):   apps/pce/admin shell: utility bar, AppSidebar with collapsible children,
                    SecondaryPanel, PageHeader [PCE app/(app)/layout.tsx, lib/pce-nav.tsx]
Reference (modern): Klaviyo Helpdesk (rail + secondary panel + list + detail), Vanta (guided setup),
                    Plain (keyboard triage), Airtable (status grid), Oura (log sheet with recents)
Principles applied: one job per surface, recognition over invention, DS is vocabulary not design,
                    density follows frequency, status visible without scrolling
Deviations:         none from REQ hard stops; weakened requirements listed per direction (section 4)
Out of scope:       REQ section 14 (remediation, notifications/reminders/escalation, expiry,
                    encounter linkage, accreditation outputs, Evaluations migration)
Open questions:     section 6
```

---

## 1. Honest critique of the current build

### 1.1 The shell and menu are not the Exxat hierarchy

What the real DS shell does (read from PCE) `[PCE app/(app)/layout.tsx, components/utility-bar-slot.tsx, lib/pce-nav.tsx]`:

```
┌ UtilityBar (full width, above the sidebar row) ────────────────────────────────┐
│ ☰  [product switcher ▾]  [school/program switcher]      🔍  🔔  What's new  ✦ Leo  (profile ▾)│
├────────────┬─────────────────────────────────────────────────────────────────┤
│ AppSidebar │ SidebarInset > PageHeader (breadcrumb · title · actions)         │
│ (icon rail │                                                                  │
│  by default│  page content                                                    │
│  items with│                                                                  │
│  children →│  SecondaryPanel (optional): scoped sub-nav for one primary item  │
│  flyout)   │                                                                  │
│ Search/Leo │                                                                  │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

- **One product, one role-scoped menu.** PCE has `NAV_ADMIN` and `NAV_FACULTY`, chosen by who is signed in. Role is not a group label inside one sidebar.
- **Hierarchy lives in children and the secondary panel**, not in section headers per role.
- **Global actions** (search, notifications, Ask Leo, profile, product and school switchers) sit in the utility bar.

What I built: a flat three-group sidebar (ADMINISTRATOR / STUDENT / EVALUATOR) copied from the prototype's demo shell, a reduced utility bar with no product switcher and no notifications, and no secondary panel. **This is the prototype's demo chrome inside the DS frame, not the DS hierarchy.** In production the student uses a separate login and the preceptor has no shell at all `[REQ EV-01]`, so a combined role menu cannot exist.

### 1.2 The jobs fight the structure

Numbers from `docs/design/friction-baseline.md` (estimates `[INFER]`):

| Job | Current | Why it hurts |
|---|---|---|
| Admin setup (100 skills) | about **2,000** interactions (about 650 if Apply is found) | Object-by-object work (one skill, one offering) while the admin thinks in groups. Bulk apply exists in the store (`IM-14`) but the prototype layout hides it inside the wizard |
| Student submit | **8 to 10** (11 to 18 with self-evaluation) | Re-answers setting, role and person every time; a centred dialog on a phone |
| Preceptor sign-off | 8 to 11 | Fine shape; no "what you are signing and what happens next" before the first scroll |
| Reviewer, 16 waiting | about **25** | 16 filled Approve buttons, no grouping by agree/differ, no bulk `[AR-02]` |
| Find a lagging student's evidence | **6 across 3 stacked dialogs** | Drill-down is dialog on dialog; no next step; "Not met" merges "never tried" with "tried and failed" `[OD-03]` |

### 1.3 Moments of truth we fail (from `docs/journeys/*`)

| Journey | Moment | Current answer | Verdict |
|---|---|---|---|
| Admin A | "Did it understand my list?" | Import review is good (unread lines, duplicates) | Keep |
| Admin B | "Will this ever be achievable?" | Lineage panel in a modal, per skill, x100 | Right idea, wrong container and no group path |
| Admin C | "42 offerings, same skills" | Per-offering ticking, no copy | Fails at volume |
| Student | "What do I still need on this rotation?" | Progress bars plus a list | Passable; "still needed" is not the headline |
| Student | "Why didn't it count and what do I do?" | Inside History dialog | Too deep `[SH-03]` |
| Preceptor | "Is this quick?" | One page, no login | Passes |
| Reviewer | "Can I decide without five clicks?" | Cards; no bulk | Partial |
| Coordinator | "Show me the evidence behind the number" | 3 stacked dialogs | Fails |

### 1.4 What the prototype got right and we must keep (requirements demand it)

- Four evaluation models; **the model constrains the criteria**; the lineage panel `[REQ 1.5, SC-09, SC-17]`.
- **Create is separate from configure**; unconfigured skills cannot be mapped or submitted `[SC-01, IM-09]`.
- **Evidence is a ledger; status is derived** `[AE-02, RV-03]`.
- Mapping is expectation, not eligibility `[CM-05]`; one record per skill across courses `[CM-07]`.
- Honest caveats in the UI (overlapping tags, denominators, impossible filters).

---

## 2. Principles for v2 (seven)

1. **Open on what needs me, not on a table.** Every role lands on a home that answers "what now?"
2. **Configure the program, then the exception.** Choose a model for a *group* of skills in one decision; per-skill tweaks are the exception. Create stays separate from configure `[SC-01]`; the model stays an explicit human choice per group, never a default `[SC-02]`.
3. **Never ask what we already know.** Setting and location come from placement `[ST-06]`; offer recent evaluators; carry mappings forward only as an explicit copy `[OD-01]`.
4. **Every number is a door, and the door opens in place.** Aggregate to person to evidence in one side panel with a breadcrumb, never dialog on dialog `[RP-05, RP-06]`.
5. **Say why, and say what next, in every blocked, failed or returned state** `[SH-03, ST-08, RP-09, EV-07]`.
6. **Role-scoped shells.** Admin and reviewer inside the DS shell with role-scoped nav; student mobile-first; preceptor with no shell `[EV-01]`.
7. **Numbers first, colour never alone.** Counts and words carry state; glyphs and colour support them `[WCAG 1.4.1]`; no red in score visuals (Aarti).

---

## 3. Shared across all three directions

### 3.1 DS-correct admin shell (fixes the header and menu complaint)

```
UtilityBar:  ☰  exxat Prism ▾ (product switcher: Skills)   <program switcher>   🔍 ⌘K   🔔   ✦ Leo   AD ▾
                                                                      profile menu: Workspace settings · View as ▸ (demo only)
AppSidebar:  role-scoped primary items (per direction) · collapsible children · quick actions (Search, Ask Leo)
SecondaryPanel: only where one primary item has 4+ siblings (Library)
PageHeader:  breadcrumb  Skills & Competencies / Nursing / <page>  ·  title  ·  page actions
```
- Product switcher and program switcher follow `[PCE UtilityBarProductSwitcher / UtilityBarSchoolSwitcher]`; Skills appears as a module in the Prism launcher `[DESIGN.md section 12]`.
- "View as Student / Preceptor link" lives in the **profile menu** for demos `[INFER]`, replacing the three-group sidebar. In production these are separate logins.
- Component exports verified with `node tools/ds/source.mjs`: `SidebarShell, AppSidebar, SecondaryPanel, SecondaryPanelProvider, SidebarInset, PageHeader, Breadcrumb` exist; `ProductSwitcher` and `SchoolSwitcher` are **not** DS exports (they are PCE-local compositions to vendor). `UtilityBar` is likewise a product composition over DS shell pieces.

### 3.2 Student and preceptor surfaces (common skeleton)

- **Student shell:** DS shell in compact/mobile mode; bottom tab bar under 768px `[MOBBIN Binance]`. One log sheet used by all directions (3.3).
- **Preceptor:** no shell; one page; header "Sign off 3 skills for {student}"; a plain "what happens next" line before Submit `[EV-07]`.

### 3.3 The log sheet (student, all directions)

```
Mobile (bottom sheet, scroll-safe)         Desktop (right Sheet, size lg)
┌─────────────────────────────┐           ┌ Log evidence ─────────────────────┐
│ ▬                           │           │ Skills   [Foley catheter ✕] [+]   │
│ Log evidence       Close ✕  │           │ Where    (● Clinical  ○ Lab)      │
│ Foley catheter insertion    │           │ Setting  Outpatient · Harbor FP ▾ │
│ Where  (● Clinical ○ Lab)   │           │ Who observed                      │
│ Setting Outpatient · Harbor │           │  [J. Delgado] [S. Nakamura] [New] │
│ Who observed                │           │ Date     [ today ▾ ]              │
│ [J. Delgado][S. Nakamura][+]│           │ Note     [__________________]     │
│ Date [ today ▾ ]            │           │ ▸ Self-evaluation (required)      │
│ ▸ Self-evaluation (3 qns)   │           │              [Cancel]  [Send]     │
│ [        Send request      ]│           └───────────────────────────────────┘
└─────────────────────────────┘
```
Rules: setting inferred from placement, a choice only when several `[ST-06]`; evaluator role constrained by setting and skill `[ST-08]`; "Who observed" shows the student's own last three evaluators as chips (privacy: their own data); self-evaluation sits **inside** the sheet before Send `[ST-11, DEC-001]`; Send disabled with the stated reason `[ST-10]`. Date defaults to today but stays editable and required `[INFER]`.
`[MOBBIN Oura https://mobbin.com/screens/e36be41d-a899-40b0-a1f8-5cb2f2a412c3, BitePal https://mobbin.com/screens/62ca4e3b-cba9-4bc0-8d7d-0c4a04f9828f]`

---

## 4. The three directions

Scoring uses estimates `[INFER]`; counts come from `friction-baseline.md`.

---

### Direction A: "Guided setup journey"

**Thesis.** Adoption is decided in the first hour. Turn setup into a visible path (**Bring in, Sort into kits, Spot-check, Map, Go live**) so the admin always knows the next step and never configures 100 skills one by one. Configure becomes a **workspace**, not a modal. After go-live the same home becomes a calm status page.
**Favours:** the program admin / coordinator, the first-time buyer, Sankalp's "40 to 50 skills in a Word document" scenario `[CALL 09-23]`.

**IA and menu (role-scoped, DS shell).**
```
Primary nav (Program admin)
  ▸ Home            ← setup journey until Go live, then program status
  ▸ Skills          ← secondary panel: Library · Categories · Tags · Clinical settings · Lab instructors
  ▸ Courses         ← mapping (skill-centric and offering-centric views)
  ▸ Attainment      ← who is where; side-panel drill-down
  ▸ Reviews (n)     ← shown only when some skill needs approval [SC-15]
Quick actions: Search · Ask Leo
```

**Workflow redesign for the five jobs.**

| Job | v2 flow (A) | Interactions |
|---|---|---|
| 1 Setup | Home step 1 **Import** (limits stated first, per-line problems, land on the populated library `[MOBBIN Zapier, Bonsai]`). Step 2 **Sort into kits**: the pool of unconfigured skills left, grouped by detected category; select a group, **choose the evaluation model once** (tiles, no default), set rule and criteria once, preview, Apply to N with an impact list. Per-skill tweak in the same workspace. Step 3 spot-check one skill per kit in the student/preceptor preview. Step 4 **Map**: "map these skills to all NURS 350 offerings" or "copy from last term" (explicit, `[OD-01]` stays open). Step 5 **Go live** gate: configured + active + mapped, with a plain checklist | about 80 for configure, about 80 for mapping, about 16 import = **about 180** |
| 2 Student | Course page headline "Still needed: 3 (2 mandatory)"; tap a skill, log sheet (3.3) | **3 to 5** |
| 3 Preceptor | No shell, one page, per-skill large single-choice, "what happens next" line | 5 to 8 |
| 4 Review | Reviews: list grouped **Agree (n) / Differ (n)**; select all agreeing, one primary "Approve selected"; differing items open a detail pane with the compare, Return for correction (neutral wording `[OD-16]`) | about **12** for 16 |
| 5 Report | Attainment: KPI strip, tabs, table; row opens a **side panel** (non-modal `FloatingSheetPanel`) with breadcrumb student > skill > evaluation; Export the filtered view `[RP-10]` | **3** in one surface |

**Six pivotal screens (ASCII).**

1) Home during setup
```
┌ PageHeader: Home ────────────────────────────────────── Skills & Competencies / Nursing ┐
│  Get your program ready                                    3 of 5 steps  ▓▓▓▓▓░░░░░    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │ ✓ 1  Bring in your skills            100 skills read, 2 lines not read     ›  │   │
│  │ ✓ 2  Sort into kits                  4 of 4 kits applied · 100 configured  ›  │   │
│  │ ● 3  Spot-check one of each          2 of 4 checked  (about 2 min)         ›  │   │
│  │ ○ 4  Map to courses                  0 of 6 course families                ›  │   │
│  │ 🔒 5  Go live                         finish steps 3 and 4 first               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│  What students and preceptors will see   [ Student view ]  [ Preceptor view ]        │
└───────────────────────────────────────────────────────────────────────────────────┘
```
`[MOBBIN HoneyBook, Vanta, Remote]`. One filled primary per step row ("Continue").

2) Sort into kits (configure workspace)
```
┌ Skills > Sort into kits ───────────────────────────────── ⟲ Unsaved  [Discard][Save] ┐
│ Pool (100)  [search]      │ Kit: "Procedures with 3 supervision levels"  (25 skills)   │
│ ☑ Wound care      unset   │ Evaluation model  [Binary][Questions][Scored][● Demo...]   │
│ ☑ IV insertion    unset   │ Levels (ordered)  1 Observed · 2 With assistance · 3 Indep.│
│ ☐ Vital signs     unset   │ Qualifies when    every completed demonstration counts     │
│ ☑ Tracheostomy    unset   │ Needs             5 demonstrations · 1 observed · 3 indep. │
│  ... grouped by category  │ Student supplies  Date* · Unit* · Notes                    │
│                           │ ┌ Lineage ───────────────┐ ┌ Preview: student · preceptor ┐│
│ 25 selected               │ │ model > evidence > rule │ │ (live form)                  ││
│ [ Apply to 25 skills ]    │ │ > criteria > status     │ │                              ││
└───────────────────────────┴─┴────────────────────────┴─┴──────────────────────────────┘
```
Selecting skills left, editing right, preview right: `[MOBBIN Greptile https://mobbin.com/screens/2a746782-8550-4a0f-9ce6-862b6384b4ee, Chatbase https://mobbin.com/screens/80f2af65-c869-4e7b-955b-ffbd0c1e50c2, Klaviyo https://mobbin.com/screens/f52a782b-e32c-4215-92f2-d4bfd18a8dce]`.

3) Student course page (mobile) with the log entry
```
┌─ Foundations of Practice ─┐
│ Still needed: 3           │
│ ┌ Foley catheter  2 of 3 ┐│
│ │ Mandatory · In progress ││
│ │ Need: 1 more qualifying ││
│ └──────────────[ Log ]────┘│
│ ┌ Wound care      4 of 4 ┐│
│ │ Not yet achieved        ││
│ │ Need: 1 in Inpatient,   ││
│ │ 1 in Emergency          ││
│ └──────────────[ Log ]────┘│
│ Other skills ▾            │
├───────────────────────────┤
│  Courses   Log   My skills│
└───────────────────────────┘
```

4) Evaluator (mobile, no shell)
```
┌ Prism ────────────────────┐
│ Sign off 3 skills         │
│ Olivia Martin · NURS 350  │
│ You are J. Delgado, RN    │
│ ─ Foley catheter ───────  │
│ Performs preparation?     │
│ [   Yes   ] [    No    ]  │
│ Performs procedure?       │
│ [   Yes   ] [    No    ]  │
│ Comment (required)        │
│ [______________________]  │
│ ─ IV insertion ─────────  │
│ ...                       │
│ After you submit: Foley   │
│ counts now; IV goes to    │
│ the administrator.        │
│ [   Submit 3 skills   ]   │
└───────────────────────────┘
```

5) Reviews (list + detail)
```
┌ Reviews (16) ──────────────┬─ Detail ────────────────────────────────────────┐
│ Agree (12)    ☑ select all │ Rina Okonkwo · IV insertion · NURS 350            │
│ ☑ Rina O.  IV insertion    │ Student: Independent  │ Evaluator: Independent    │
│ ☑ Noah Z.  Foley           │ Agree.   Counts toward: 4 of 5 demonstrations     │
│ ...                        │ Note (optional) [________________]                │
│ Differ (4)                 │            [Return for correction] [ Approve ]    │
│ ○ Jonah N. IV insertion    │                                                   │
│ [ Approve 12 selected ]    │                                                   │
└────────────────────────────┴───────────────────────────────────────────────────┘
```
`[MOBBIN Klaviyo https://mobbin.com/screens/59324e5f-91ad-49d1-9c3f-a5a958120291, Deel https://mobbin.com/screens/9769884d-9bfb-4666-9287-3e8e1c1fb12b]`

6) Attainment with an in-place panel
```
┌ Attainment ──────────────────────────────────┬─ Noah Zeller ─────────── ✕ ┐
│ [Filters ▾] cohort BSN 2027 ✕  Showing 40    │ Skills > Noah Zeller        │
│ ┌KPI┐┌KPI┐┌KPI┐┌KPI┐                         │ Foley   3 of 3  Achieved    │
│ [By student][By skill][By tag]  🔍  Export    │ Wound   4 of 4  Not yet: 1  │
│ Student      Achieved  In prog  Not met  ▓▓▓ │  in Inpatient, 1 in Emerg.  │
│ Noah Zeller      7        0       2     78%  │ ▸ Evidence (4)              │
└──────────────────────────────────────────────┴────────────────────────────┘
```

**DS component map (verified exports).** Home steps: `Card`, `Collapsible`, `ProgressCell`, `Badge`, `Button`. Workspace: `SecondaryPanel` (pool list via `Checkbox`), `SelectionTileGrid` (model, radio), `Field`, `RadioGroup`, `Select`, `Command`+`Popover` (multi-pick; no `MultiSelect`), `Accordion`, `LocalBanner` (impact), floating unsaved bar (hand-roll, `Button`). Mapping: `DataTable`, `FilterBar`. Review: `DataTable` + `Checkbox`, `FloatingSheetPanel`. Report: `KeyMetrics`, `Tabs`, `DataTable`, `FloatingSheetPanel`, `Breadcrumb`. Sheet bottom ignores `size` (scroll-safe content). Not exported: `Stepper` (use `Wizard` only if a gated linear flow is wanted; the Home list does not need it), `Progress` (`ProgressCell`), `Combobox`, `MultiSelect`, `FileUpload`.

**Hard stops and open decisions.** Model chosen explicitly per group `[SC-02]`; create separate from configure `[SC-01]`; unconfigured cannot be mapped or submitted `[IM-09]`; Go-live gate never changes REQ semantics. Seams: `OD-01` copy is explicit; `OD-03` status flag; `OD-12` import never proposes models; `OD-16` neutral; `OD-25` role map as data.
**Weakens:** nothing in REQ. `CM-03`: no silent mandatory default (admin states the level in the group map action). `IM-14` strengthens.
**Risks.** Kits imply "skills in a group behave identically": admins may over-apply; mitigated by the impact list and one-click per-skill exception. The Go-live gate could feel gatekeeping for programs that want to start with 10 skills: allow partial go-live per skill (`active` is already per skill).
**Build cost (from current code).** Domain, engine, store (`applyConfiguration`, `copyMappings`, `proposeImport`) and seed **reused as is**. New UI: Home journey, configure workspace (reuse wizard step components C-1 to C-8), group-apply UX, skill-centric mapping, Reviews list/detail, side-panel drill-down. **Medium**.
**Mobbin evidence:** HoneyBook https://mobbin.com/screens/7c915d6b-2a99-4eb0-956d-e7a3a97bb265 (always-visible Setup with progress) · Vanta https://mobbin.com/screens/d6c8a960-3253-4ca4-b4aa-06e902fa0e4e (locked steps, grouped) · Remote https://mobbin.com/screens/156170a2-7331-438f-9a0a-e7eba294b489 (tasks remaining) · Klaviyo https://mobbin.com/screens/f52a782b-e32c-4215-92f2-d4bfd18a8dce (workspace + unsaved bar) · Zapier flow https://mobbin.com/flows/aee2762e-5616-4ea7-bd10-2d5a0841edc1 (limits first, land on result).

---

### Direction B: "Action-first command center"

**Thesis.** Nobody opens a skills product to browse tables; they open it to *do the next thing*. Make a **Today** worklist the home for every role, and reach reports from work items. Setup is simply the first item in the list.
**Favours:** the week-to-week users: coordinators clearing approvals, students with returned items, anyone who asks "what is waiting on me?".

**IA and menu.**
```
Primary nav (Program admin)
  ▸ Today (n)       ← worklist: grouped queues with counts, list + detail pane
  ▸ Skills          ← secondary panel: Library · Categories · Tags · Settings · Instructors
  ▸ Courses         ← mapping
  ▸ Students        ← secondary panel: Behind · All students · By skill · By tag
Quick actions: Search · Ask Leo
```
Student: **Today** (do next), Courses, History. Preceptor: the email is the worklist.

| Job | v2 flow (B) | Interactions |
|---|---|---|
| 1 Setup | "Bring in your skills" is the first Today item; after import, "Needs configuration (100)" is a queue worked top to bottom: the editor opens in the right pane, **Save and next** (J/K), and "Apply this to N similar" suggestions (same category and model) | about **150** (about 1.5 per skill after the first of each pattern) |
| 2 Student | Today shows three cards: **Returned** (fix), **Waiting** (who, since when), **Still needed** (this rotation); each opens the log sheet (3.3) prefilled | **3 to 5** |
| 3 Preceptor | As A | 5 to 8 |
| 4 Review | Today > Approvals (16): list grouped agree/differ, select all agreeing, approve; detail pane for differ | about **12** |
| 5 Report | Students > **Behind**: students with a skill below the program's own threshold or no evidence by a date the program sets, each row with the reason chips ("0 of 3 Foley", "last evidence 41 days ago"); open in a side panel; Export the list. No reminders, no auto-notify `[§14]` | **3** |

**Six pivotal screens.**

1) Today (admin)
```
┌ Today ───────────────────────────────────────────────── Skills & Competencies / Nursing ┐
│ ┌ Needs you (4 groups) ─────────────────────┐  ┌ Context ───────────────────────────┐ │
│ │ ▸ Approvals waiting            16  [Open] │  │ Foley catheter insertion           │ │
│ │ ▸ Skills to configure           2  [Open] │  │ Question model · 3 qualifying      │ │
│ │ ▸ Requests waiting > 7 days     7  [Open] │  │ 31 of 40 achieved                  │ │
│ │ ▸ Students behind (Foley)       5  [Open] │  │ [Open skill]                       │ │
│ └───────────────────────────────────────────┘  └────────────────────────────────────┘ │
│ ✓ Nothing waiting in: Imports                                                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
`[MOBBIN Zendesk https://mobbin.com/screens/f2e7d89f-72b1-4da1-8820-fd9bd4df3350, Oyster https://mobbin.com/screens/ffefa4cd-b1d6-4b73-9b46-d4184f2eaf06]`. "Requests waiting > 7 days" is **visibility only**: the seven-day figure is a proposed display default, not a reminder.

2) Configure inside the queue
```
┌ Needs configuration (100) ──┬ Editor ───────────────────────────────────────────┐
│ ● Wound care       unset ◄  │ Wound care                         [Save and next] │
│ ○ IV insertion     unset    │ Model   [Binary][Questions][Scored][● Demonstration]│
│ ○ Vital signs      unset    │ ... same editors as A ...                          │
│ Similar (24) ▸              │ ⓘ 24 other skills in "Procedures" use this model.  │
│ [ Apply to 24 similar ]     │   [ Apply to 24 similar ]                          │
└─────────────────────────────┴────────────────────────────────────────────────────┘
```

3) Student Today (mobile)
```
┌ Today ────────────────────┐
│ ⚠ Returned (1)            │
│  IV insertion · fix date  │
│  [ Revise and resend ]    │
│ ⏳ Waiting (2)             │
│  Foley · J. Delgado, 2d   │
│  Wound · lab, K. Larsen   │
│ ◎ Still needed (3)        │
│  Foley · Wound · Trach.   │
│  [ Log evidence ]         │
├───────────────────────────┤
│  Today   Courses  History │
└───────────────────────────┘
```

4) Evaluator (mobile): as Direction A.

5) Approvals (list + detail): as Direction A screen 5, entered from Today.

6) Behind (report as a work list)
```
┌ Students > Behind (5) ────────────────────────────── Course [NURS 350 ▾]  Export ┐
│ Priya Tran     Foley  0 of 3   no evidence yet · requested 0                       │
│ Milo Whitfield Wound  4 of 4   not achieved: needs 1 Inpatient, 1 Emergency        │
│ Nina Bansal    Foley  1 of 3   last qualifying evidence 41 days ago                │
│ Row opens a side panel: student > skill > evidence ledger                          │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**DS map.** `DataTable` (queues), `SecondaryPanel` (Students sections), `FloatingSheetPanel` (detail), `Card`, `Badge`/`StatusBadge` (tones success/warning/info/neutral; no red), `Checkbox`, `LocalBanner`, `Collapsible`. Hand-roll: the Today group list (composition of `Card` + `Collapsible`), the stalled-request age chip. `KeyMetrics` only on Students.
**Hard stops and ODs.** Never decides `OD-03` (Behind separates "no evidence" from "not achieved" by reason chip). "Behind" needs a new proposed decision **OD-27: how a program defines "behind"** (threshold, date, per course). The call mentions "bottom 20% lagging" `[CALL 09-23]`; the vault notes at-risk ownership sits with Sankalp (`[vault 2026-04-09 Vishaka<>Romit QB review, via _Insights]`, `[INFER]`). **No reminders or notifications `[§14]`**; "resend to the same evaluator" is `OD-18`, not built.
**Weakens:** `RP-02/RP-04` reporting breadth is reached through Students, one step deeper than today.
**Risks.** Worklists need data to feel useful; a new program's Today is mostly empty ("setup" must carry it). Thresholds can look like judgements about students (FERPA and fairness: show reasons, not scores).
**Build cost.** Selectors exist (`unconfiguredCount`, `reviewQueue`, `reportBySkill`, `evaluatorRequest.requestedAt`); add a worklist selector and the "Behind" rule. UI: Today, queue editor, Behind. **Medium**.
**Mobbin evidence:** Klaviyo Helpdesk https://mobbin.com/screens/59324e5f-91ad-49d1-9c3f-a5a958120291 · Gorgias https://mobbin.com/screens/5dddc6f5-d48f-4fac-9cdc-8c86c81fbd7a · Plain https://mobbin.com/screens/03143e01-39f7-4352-a836-041ff5e3260e · Wrike https://mobbin.com/screens/20ad47f6-2249-48aa-a3c2-e8fb4503b4b0 · Zendesk https://mobbin.com/screens/f2e7d89f-72b1-4da1-8820-fd9bd4df3350.

---

### Direction C: "Student x skill matrix"

**Thesis.** The object everyone asks about is *student x skill*. Make the **cohort matrix** the home; every other surface hangs off a cell, a row or a column header. Reports stop being a separate place.
**Favours:** program directors and accreditation leads, lab instructors (a nursing need per the Granola summary `[Granola query summary, unverified]` and `OD-19`), anyone scanning a whole cohort.

**IA and menu.**
```
Primary nav (Program admin)
  ▸ Matrix          ← home: cohort x skill grid, KPI strip, filters
  ▸ Library         ← secondary panel: Skills · Categories · Tags · Settings · Instructors
  ▸ Courses         ← mapping as a grid (offering x skill)
  ▸ Reviews (n)
```
Student: **Portfolio** (their row), Courses. Preceptor: email link.

| Job | v2 flow (C) | Interactions |
|---|---|---|
| 1 Setup | Import fills Library; columns appear in the matrix as **ghost columns "needs configuration"**; shift-select columns, configure in a side workspace ("Configure 25 skills"); Courses grid: select a row (offering) and fill requirement across skills, or copy a row from last term | about **150** to configure, about 60 to map |
| 2 Student | Portfolio list (their row) with states and "Needed now" filter, floating **Log**; log sheet (3.3) | **3 to 5** |
| 3 Preceptor | As A | 5 to 8 |
| 4 Review | Filter matrix to "waiting" cells; keyboard through cells; toolbar "Approve all that agree" | about **12** |
| 5 Report | Matrix itself: sort rows by completion, column footer = % achieved per skill (where the cohort lags), click a cell for the evidence panel, header for the skill; Export the matrix `[RP-10]` | **2 to 3** |

**Six pivotal screens.**

1) Matrix (home)
```
┌ Matrix ──────────────────────────────────────────── [Filters ▾]  BSN 2027 ✕   Export ┐
│ KPI: 40 students · 2.0 of 10 avg · 0 all-done · 9 skills below 50%                   │
│ ┌ student ────────┬ Foley ┬ IV ┬ Wound ┬ Trach ┬ Vitals ┬ ... (grouped by category)  │
│ │ Noah Zeller      │ ✓ 5/3 │ ✓  │ ◐ 4/4 │ ✓     │ ○      │                            │
│ │ Priya Tran       │ ○ 0/3 │ ◐  │ ○     │ ○     │ ✕ 0/2  │                            │
│ │ ...              │       │    │       │       │        │                            │
│ │ % achieved       │ 78%   │ 35%│ 10%   │ 20%   │ 59%    │  ← where the cohort lags   │
│ └──────────────────┴───────┴────┴───────┴───────┴────────┘                            │
│ Legend: ✓ Achieved  ◐ In progress  ✕ Evidence does not qualify  ○ No evidence yet     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
Cells always carry text or a count, never colour alone; the glyph set is the four AE-04 states and collapses to three under the `OD-03` flag. `[MOBBIN Airtable https://mobbin.com/screens/b582185d-6401-42a4-bcc7-f2f76d2639d0, Fresha https://mobbin.com/screens/3b1a8630-7e3d-4e22-aa49-f38180943f60]`; **no precedent found at 150 x 100 scale**.

2) Cell panel (non-modal)
```
┌ Priya Tran × Foley catheter insertion ──────────────── ✕ ┐
│ ✕ Evidence does not qualify   2 evaluations, 0 qualify    │
│ Rule: all 3 questions Yes. Needed: 3 qualifying           │
│ Evidence ledger  05-11 Clinical · Outpatient · Delgado: 2 of 3 Yes │
│ [ Open evaluation ]                                       │
└────────────────────────────────────────────────────────────┘
```

3) Student portfolio (mobile)
```
┌ My skills ────────────────┐
│ 7 of 10 achieved          │
│ (● Needed now) (○ All)    │
│ Foley       2 of 3   ›    │
│ Wound care  4 of 4 ⚠ ›    │
│ IV insertion 5 of 5 ✓ ›   │
│                    [ + Log ] │
├───────────────────────────┤
│ Portfolio  Courses        │
└───────────────────────────┘
```
`[MOBBIN Acorns https://mobbin.com/screens/4705850a-207b-4209-891c-37fbce629d4c, Believe https://mobbin.com/screens/414901db-ef40-4732-9705-16ad5296f049]`.

4) Evaluator (mobile): as Direction A.

5) Review mode: matrix filtered to waiting cells; side panel shows the compare; toolbar Approve agreeing.

6) Courses grid
```
┌ Courses ─ copy row from ▾ ──────────────────────────────────────────────┐
│ offering             Foley  IV   Wound  Trach   Vitals                    │
│ NURS 350 Fall 2026    M      M    M      O       ·                       │
│ NURS 350 Spr 2027     [copy from Fall 2026]  M=mandatory  O=optional  ·=none│
└────────────────────────────────────────────────────────────────────────┘
```

**DS map.** `DataTable` can render typed cells but **a 150 x 100 heat grid is not a DS component**: hand-roll a virtualised `grid` (ARIA grid, roving tabindex, cell labels) using `StatusBadge`-style glyphs; `FloatingSheetPanel` for the cell panel; `KeyMetrics`, `FilterBar`, `Command`+`Popover`, `Tabs`. `ViewSegmentedControl` for matrix/list. High hand-roll cost.
**Hard stops and ODs.** Unconfigured columns visibly unusable `[IM-09]`; `OD-03` flag drives the glyph set; `OD-19` (batch sign-off) is **not** assumed: batch evaluation is not in REQ, so lab group sign-off stays a flagged question.
**Weakens:** `ST-04` and the student's per-course context are less prominent (student sees a row, not a course); `RP-04` tag overlap needs a column-group view; accessibility of a dense grid is the hardest in the set.
**Risks.** Density on tablets and phones, screen-reader navigation of 15,000 cells, a heat map that implies ranking students (Aarti's no-red and fairness cautions); the pattern has no external precedent at this scale.
**Build cost.** Engine and store reused; new `skillProgress` cell selector (exists), virtualised grid, cell panel, Courses grid. **High**.
**Mobbin evidence:** Airtable https://mobbin.com/screens/b582185d-6401-42a4-bcc7-f2f76d2639d0 · Fresha https://mobbin.com/screens/3b1a8630-7e3d-4e22-aa49-f38180943f60 · Miro https://mobbin.com/screens/3cc382a7-ae87-4d28-a04f-8cecd412cafb · Aboard https://mobbin.com/screens/d6a6ad47-6520-44f4-af42-41feb0a611de · Acorns https://mobbin.com/screens/4705850a-207b-4209-891c-37fbce629d4c.

---

## 5. Comparison

Scores 1 (poor) to 5 (strong), `[INFER]`; they are for discussion, not measurement.

| Criterion | A Guided setup | B Command center | C Matrix |
|---|---|---|---|
| Job 1 Setup (about 2,000 today) | **5** (about 180) | 4 (about 150) | 4 (about 210) |
| Job 2 Student submit | 4 | **5** (Today + log) | 4 (portfolio + log) |
| Job 3 Preceptor | 4 | 4 | 4 |
| Job 4 Review | 4 | **5** | 4 |
| Job 5 Report / intervene | 3 | 4 (Behind list) | **5** (matrix) |
| REQ coverage | no weakening | `RP-02/04` one step deeper | `ST-04`, `RP-04`, grid a11y |
| Build cost (reuse of store/engine/seed 100%) | Medium | Medium | **High** (hand-rolled grid) |
| DS fit | High (all exports) | High | Low (grid hand-rolled) |
| Risk | Over-applied kits; gate feels strict | Empty-state weakness; "behind" definition (new OD-27) | Density, a11y, no precedent at scale |
| Distinct from the prototype | High | High | **Highest** |

### Recommendation

**Do the hybrid, in this order (minimal regret):**

1. **Shell and IA first (all directions need it):** DS-correct role-scoped nav, utility bar, secondary panel for Library, the profile "View as" demo switch. Fixes the header and menu complaint.
2. **One Home, two states:** Direction A's journey while the program is being set up, becoming Direction B's **Today** worklist after go-live. Same page, same nav item.
3. **Kit-based configure workspace and skill-centric mapping with explicit copy** (from A).
4. **Student log sheet with recent evaluators and "Still needed" headline; preceptor one-screen with "what happens next"** (all directions).
5. **Reviews as grouped list + detail with "approve all agreeing"** (A and B).
6. **Matrix last, as the Attainment "Cohort" view** (C), after a density and keyboard prototype is tested with real coordinators; keep the By-student table as the fallback.

Why: A removes the worst measured friction (setup, about 90% fewer interactions) and is mostly reusing built parts; B is what weekly users feel; C is the most distinctive but the riskiest, so it is last and testable. This also stays inside every REQ hard stop. The current prototype-parity build remains available as the fallback (Direction 0).

---

## 6. Questions to answer (recommendation first)

**For Romit**
1. Go with the **hybrid** above? (Recommended.) Or pick one of A, B, C as the base.
2. Confirm **role-scoped nav**: admin and reviewer inside the DS shell; student mobile-first; preceptor no shell; no combined role sidebar except a demo "View as" in the profile menu.
3. Keep Sankalp's prototype as a **reference for behaviour and copy**, not as the layout? (Recommended, per your feedback.)

**For Sankalp**
4. Is **group configure ("kits")** consistent with `SC-01/SC-02`? My reading: yes if the admin explicitly picks the model for the group and can override per skill.
5. How should "behind" be defined (threshold, date, per course)? Proposed new **OD-27**. The call mentions "bottom 20%" `[CALL 09-23]`.
6. `OD-01`: is **explicit copy from last term** acceptable in place of automatic carry-forward?
7. `OD-18`: is **visibility of stalled requests** (no reminders) acceptable, and may an admin re-send a stalled link to the same evaluator?

**For Aarti**
8. Is a cohort heat grid acceptable given the no-red and fairness cautions, and is a count-first "Behind" list preferable for coordinators?

**For Sarah (nursing SME)**
9. Do lab instructors need **batch sign-off** (students as rows, one skill) (`OD-19`), and do students really log from phones during shifts?

**Research to run before building (see `docs/ux/12`):** a 5-user concept test of the Home and the log sheet; a density and keyboard test of the matrix before committing to C.

---

## 7. Review through the cross-discipline lens (better-interface, static)

| Domain | Finding on this brief |
|---|---|
| Accessibility | Matrix needs ARIA grid and roving tabindex; every state needs a text label; bottom sheets must be scroll-safe; targets at least 44px for student and preceptor |
| Layout | Side panel replaces stacked dialogs; groups separated by space not lines; secondary panel only where 4+ siblings |
| Writing | Plain verbs ("Log evidence", "Sign off 3 skills"); say what happens next; "Return for correction" stays neutral until `OD-16` |
| Typography/colour | Counts in tabular numerals; state is text first; no red in score or status |
| UI | One filled primary per surface (Reviews uses one bulk primary, not N); DS tokens only |
| Not verified | No prototype was built from this brief; no user test; counts are estimates |

**Not verified:** none of the three directions has been rendered or tested; Mobbin analogues are not clinical education; the matrix at scale has no precedent found.
