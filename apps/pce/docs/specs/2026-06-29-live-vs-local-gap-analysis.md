# PCE Course Evaluation — Live vs Local Gap Analysis & Build Spec

**Date:** 2026-06-29 · **Author:** Romit + Claude (Opus research pass)
**Status:** 🟢 RESEARCH COMPLETE — handoff to Sonnet for implementation
**Reference app:** https://pce-three.vercel.app/surveys/dashboard (the live design target)
**Local app:** `/Users/romitsoley/Work/apps/pce/admin` (port 3005)

---

## 0. How to use this document (READ FIRST — for the implementing agent / Sonnet)

This is the **single source of truth** for the next round of PCE design work. It was produced on Opus by (a) auditing every relevant localhost surface, (b) crawling the live app's navs/sub-navs, (c) comparing them, and (d) Mobbin-researching each flow.

**The most important thing to understand:** *the localhost app is far more built than earlier specs assumed.* Most of these are **UPDATES to existing surfaces, not new builds**. Earlier docs (`2026-06-28-course-eval-design-updates-spec.md`) contained build-from-scratch assumptions that are WRONG — e.g. the template editor (subject groups + role tags + clone) already exists; the activate wizard already does term+dates+email. **Do not rebuild what exists. Edit it.** Every section below states the exact existing files.

**Execution rules for each surface you touch (NON-NEGOTIABLE):**
1. Read this doc's section for the surface **and open the cited existing files** before any JSX.
2. Follow the DS Sheet convention (`component-consistency.md §6`): form drawers use `showOverlay={false}` + `showCloseButton={false}` + footer Cancel + ≤600px. **Never** the default X + scrim.
3. **No icons on action/CTA buttons** (Continue / Save / Push / Configure / Remind) — text only. Back-arrows on links + status spinners are exempt.
4. Tokens only (`var(--token)`); **amber `--insight-severity-warning-*` for at-risk/below-target, never `--destructive`** (Aarti: no red in score/rating viz).
5. Flat `border-b` list rows, not rounded cards. No `py-20 text-center` empty states (use dashed-border box). No `uppercase tracking-wide`. ≥12px fonts everywhere.
6. DS components only — verify each against the live snapshot with `node tools/ds/source.mjs <Component>` before importing. No raw `<button>/<input>/<table>`.
7. **Verification gates after every surface** (paste literal verdicts, fix all actionable):
   - `ds-conformance-reviewer` (localhost:4000 visual-diff + tokens + axe a11y)
   - `state-review` (loading/empty/error/validation/disabled/success)
   - `verification-reviewer` (patterns A–L; grep-verify every claim)
   - **Visual pass** — Playwright capture of each rendered state under `tools/visual-check/`
   - **WCAG** — ≥12px, aria-labels on icon-only buttons, contrast ≥4.5, focus order
8. Two-tier verdict + evidence block (tsc delta, route HTTP, DS import file:line, grep, screenshots).

The full pipeline is documented at `apps/pce/docs/surface-design-process.md` (this doc IS the step-0.5→step-4 output for these surfaces).

---

## 1. IA — Live nav tree vs Local

**Live (`pce-three.vercel.app`):**
```
Course Evaluations                 General Surveys
 ├─ Dashboard   /surveys/dashboard   └─ Directory  /directory/courses
 ├─ Templates   /templates                (tabs: Courses · Faculty · Students · Term)
 ├─ Analytics   /analytics           Get Help
 └─ Settings    /settings
Live "Push Survey" CTA → /surveys/setup   ·   "View All Terms" → terms list
```

**Local (current):**
```
Course Evaluation                  Programmatic Surveys     Directory
 ├─ Dashboard /course-evaluation/dashboard   ├─ Dashboard      ├─ Students /admin/students
 ├─ Templates /templates                     └─ Templates      ├─ Faculty  /admin/faculty
 ├─ Analytics /analytics                                       ├─ Course Offerings /admin/offerings
 └─ Settings  /admin/eval-settings                             └─ Terms    /admin/terms
```

**IA gaps:**
- **Directory:** live unifies **Courses / Faculty / Students / Term as TABS in one surface** (`/directory/courses`); local has **4 separate nav rows + routes**. → consolidate into a tabbed Directory (see §6).
- **Settings URL:** local is `/admin/eval-settings`; live is `/settings`. Local nav label "Course Evaluation" → Settings child points at `/admin/eval-settings` (scattered). Lower priority than content gaps.
- **"View All Terms":** live has a terms-list affordance from the dashboard; local Terms lives only in the Directory.
- Local "Course Evaluation" nav label is correct (confirmed by Romit); only URL coherence is an open follow-up (see `2026-06-28` doc).

---

## 2. Priority order (Romit-set)

1. **Setup Term** — reconcile the two competing flows (P1, highest-risk)
2. **Create Surveys** (push) — align to the live single "Set Up Surveys" flow
3. **Create Template** — fill the editor gaps (mostly built)
4. **Directory** — consolidate to tabbed surface
5. **Settings** — merge the standardization half (missing) with the communication half (built)

Dashboard is already reconciled (see `2026-06-28` doc, chart-free, matches live). Analytics already has the charted monitor.

---

## 3. ① SETUP TERM — *reconcile, don't rebuild*

### What EXISTS locally (audit)
- **`components/pce/setup-term-sheet.tsx`** — a right Sheet, 2 phases: config (name/year/start/end, derived ±7d window) → readiness audit (offering gaps: no coordinator/instructor/roster + soft-warning override). Mounted on the Dashboard ("Configure Term Calendar"). V0 mock.
- **`app/(app)/surveys/activate/page.tsx`** + `components/pce/activate-wizard/*` — a **4-step wizard**: ① Term & Courses (select term, include/exclude offerings, **assign template per course**) → ② Dates (open/close/release, derived end−7/+14/+15) → ③ Email (sender/subject/body + reminder 0/3/7d) → ④ Review + "Save & schedule" + success screen. Scoped entry via `?offerings=` / `?faculty=`.
- **`app/(app)/admin/terms/page.tsx`** — Terms directory with a **create-term dialog** (name, AY YYYY–YYYY, start/end) + archive/edit row actions + "Activate term" button → `/surveys/activate`.

### What the LIVE app does
- "Push Survey" → **`/surveys/setup`** = one "Set Up Surveys" flow ("for one course, a selection, or an entire term"). Form rendered client-side (couldn't capture steps).
- "Configure Term Calendar" on the dashboard = the term-setup entry.

### THE GAP / design update
There are **THREE overlapping term-setup paths** locally: SetupTermSheet (readiness audit), the activate wizard (4-step scheduling), and the Terms create-dialog. This is the "competing wizards" smell. **The design job is reconciliation, not building.**

**Recommended reconciliation (confirm with Romit before code):**
- **Setup Term = the readiness gate + term creation.** `SetupTermSheet` owns: create/confirm the term (auto-detected next term, confirm-not-create) + run the **data-readiness audit** (its unique value). It should NOT also do dates/email — those are the push flow's job.
- **The activate wizard's dates/email steps fold into the Push/Create-Survey flow** (§4) — they're distribution concerns, not term setup. Retire the activate wizard as a separate entry OR make it the push flow.
- The Terms create-dialog stays as the directory's CRUD entry but shares the same term-creation component as the sheet.

### UX journey (target)
```
Dashboard → "Configure Term Calendar"
  → SetupTermSheet: confirm auto-detected next term (name/year/dates pre-filled, editable)
  → Readiness audit: offerings discovered from Prism; gaps flagged (no coordinator/instructor/roster)
     → "Add data" per gap (→ Prism, new tab) · re-run · OR push with soft-warning override
  → "Push survey" → hands to the Create-Survey flow (§4) with term pre-selected
```

### Mobbin analogies
- Readiness audit → [Apollo Data Health Center](https://mobbin.com/flows/cc88e7e2-b3c7-47eb-b1f0-fa4d90ae4179) · [Rox Needs-Attention](https://mobbin.com/flows/e88d71cc-ca76-4aec-848f-01c78fc7b29c)
- Term config = confirm-not-create → seeded form (already built)

### DS map
`Sheet` (showOverlay=false, showCloseButton=false, ≤600px — **fix the current sheet, it violates this**) · `Field`/`FieldLabel`/`FieldError` · `Input` · `Calendar`+`Popover` · `Badge` (warning tokens) · flat `border-b` rows · `LocalBanner` · `AlertDialog` (override).

### Sonnet tasks
1. **Decision needed first:** confirm the reconciliation (Setup Term = create+audit; activate's dates/email → push). Do NOT merge/retire workflows without Romit's sign-off (`feedback_no_unauthorized_consolidation`).
2. Fix `setup-term-sheet.tsx` to the DS Sheet convention.
3. Extract a shared `TermForm` used by both the sheet and the Terms create-dialog.

---

## 4. ② CREATE SURVEYS (Push) — *align the existing 4-step wizard*

### What EXISTS locally (audit)
- **`app/(app)/surveys/push/page.tsx`** + `components/pce/distribute-wizard/*` — a **4-step wizard**: ① **Scope & Design** (title, term, description + per-course template assignment, group-by-type, bulk assign) → ② **Distribution** (course table, duplicate-survey warning, access) → ③ **Communication** (Prism + manual recipients, survey window dates, email template editor, **multi-select reminders [1/2/3/5/7/14d]**) → ④ Success. Dual mode (CE / programmatic).

### What the LIVE app does
- `/surveys/setup` = "Set Up Surveys — for one course, a selection, or an entire term." (form not capturable). The live framing is **scope-flexible** (one / selection / whole term) and is the **"Push Survey" target**.

### THE GAP / design update
- Local push wizard is **robust and largely complete** — this is alignment, not a rebuild.
- **Reminder semantics inconsistency (cross-cutting):** push uses days-before-**close** [1/2/3/5/7/14]; activate uses days-before-**term-end** [0/3/7]; Settings cadence is yet another. **Unify to ONE anchor + one source** (Settings cadence, §7).
- **Auto-fill from Settings:** window/result/email/reminder should pre-fill from Settings defaults (the spec's minimum-click goal). Currently manual.
- **Remove "Run with AI"** (live dashboard still shows it; spec says drop).
- **Reconcile 4-step labels** with the activate wizard's 4 steps (don't keep two 4-step term flows).

### UX journey (target)
```
Dashboard "Push Survey" (or Directory "Push Surveys", or Setup Term → push)
  → ① Select scope: one course / selection / whole term (term pre-filled if from Setup)
  → ② Assign template (auto by course type, editable) — REUSES existing group-by-type UI
  → ③ Window (auto from Settings ±7d, editable) — currently a separate step; could merge
  → ④ Communication (email + reminder cadence, auto from Settings)
  → Success
```

### Mobbin analogies
[Wix numbered stepper + Campaign Overview](https://mobbin.com/flows/9ca0fc19-6356-44ef-b2cb-d55c68213c9a) · [Eventbrite recipients→schedule](https://mobbin.com/flows/dc7e7200-303e-403e-b8d9-546205d88df2) · [Pipedrive pre-send checklist](https://mobbin.com/flows/44e60417-3cfe-45c7-bc65-a922f4b34d5d)

### DS map
existing `distribute-wizard` stepper · `DataTable` (course select) · `Select` (pre-filled, "from Settings" hint) · `EmailTemplateSheet` (exists) · reminder toggle chips (exist) · `LocalBanner`.

### Sonnet tasks
1. Pre-fill window/email/reminder from Settings (read `setupDefaults`).
2. Unify reminder anchor (see §7) — single source.
3. Remove "Run with AI."
4. Reconcile the push vs activate 4-step duplication (gated on §3 decision).

---

## 5. ③ CREATE TEMPLATE — *fill editor gaps; structure already exists*

### What EXISTS locally (audit) — **this is the big corrected assumption**
- **`/templates`** hub (TemplatesHub) + **`/templates/new`** (3 paths: **Build / Copy / Import**) + **`/templates/[id]`** full editor.
- Editor = **2 tabs: Details + Builder**.
  - **Details:** title, description, **course type** (Classroom/Practice/Lab radio), **opening instructions**.
  - **Builder (CE mode):** **subject-group tabs** ("Course", "Faculty" + custom "+ Add group"); per-group **"Evaluates" role tags** (multi-select role picker, searchable, **Prism count per role**, remove); **sections** (collapsible, editable title, drag-reorder questions, duplicate, delete); **question attributes panel** (answer type, Likert 1–5 preview, help text, report title, Not-Applicable / Comments / Mandatory toggles).
  - **Clone:** via `/templates/new` Copy (deep-copy sections+questions) AND per-question duplicate.

> **So the spec's "3 aspects (Content/General/Faculty) + clone-from-role" is ALREADY BUILT** as subject groups + role tags + copy. Earlier assumption to "build this" was wrong.

### What the LIVE app does
- List columns: Template Name, Type, **Course Category** (Classroom/Practice Based), Last Updated. Filters: **Status (All/Draft/Approved)**, **Program**. Single "Create Template" → `/templates/new` (live shows only one entry; local has Build/Copy/Import — local is RICHER). Editor not capturable.
- Status terminology: live "**Approved**" vs local "**Active**".

### THE GAP / design update (small — mostly polish + completeness)
| Gap | Detail |
|---|---|
| **Answer types incomplete** | Enum has 8 (likert/free_text/single_choice/multiple_choice/title/number/select_dropdown/date_picker); UI only edits Likert + Free Text. Choices for single/multiple not editable. |
| **Likert scale not configurable per template** | `likertPointer` field exists (3/4/5/7/10) but UI shows fixed 1–5; should read from **Settings standardization** (§8) — if Settings locks 5-point, the template picker hides others. |
| **Status terminology** | Align "Active" ↔ live "Approved"? (confirm with Romit). |
| **Program filter** | Live filters by Program; local may not. |
| **Section description** | Type has it; UI doesn't edit it. |

### Mobbin analogies
Clone/duplicate section → [Lyssna Duplicate-section](https://mobbin.com/flows/3154c5f5-54db-4b3e-bb93-a31891fd1b9d) · [Maze Duplicate-block](https://mobbin.com/flows/54c92c68-a783-4236-be7e-33697593a15e) (the existing UI already matches these).

### DS map
existing editor components · `Tabs` (Details/Builder) · pill `Tabs` (subject groups) · role-tag multi-select (exists) · `DropdownMenu` (section overflow) · `Select`/`RadioGroup` (answer type — **lock to Settings scale**) · right attributes panel.

### Sonnet tasks (light)
1. Wire the Likert scale to Settings standardization (lock options when Settings fixes a scale).
2. Add choice editing for single/multiple_choice if those types are kept (confirm scope with Romit).
3. Align status terminology + add Program filter to match live.
4. **Do NOT rebuild the editor** — it's built; extend it.

---

## 6. ④ DIRECTORY — *consolidate 4 routes → one tabbed surface*

### What EXISTS locally (audit)
- **4 separate routes**, all read-only ("Synced from Prism"), all **clean (no assessment leftovers)**, each with list + detail/profile + analytics:
  - `/admin/students` (9 cols, filter cohort/status, group by cohort, FERPA-safe detail)
  - `/admin/faculty` (8 cols, bulk "Push course evaluations", profile dashboard)
  - `/admin/offerings` (9 cols, term/status filters, survey drilldown, radar+trend detail)
  - `/admin/terms` (6 cols, **create/archive dialog**, ByTerm analytics detail)

### What the LIVE app does — **the key divergence**
- **ONE Directory surface** at `/directory/courses` with **sub-nav TABS: Courses · Faculty · Students · Term**.
- Courses table: Code, Course Name, Type, Students, Faculty, Status, Evaluation, Results — **grouped by term** (Fall 2026 / Summer 2026 / …) with per-term counts.
- Top actions: **"Push Surveys"** + **"Add Course Offering"** (live directory has **CREATE** — local offerings is read-only).
- "View Results" links on completed courses.

### THE GAP / design update
1. **Consolidate** the 4 separate nav rows + routes into **one tabbed Directory** (Courses/Faculty/Students/Term) under "General Surveys" → `/directory/courses` (or keep local paths, add a tab shell). Matches live IA.
2. **Naming:** live uses "**Courses**" (not "Course Offerings") and "**Term**" (singular).
3. **"Add Course Offering"** — live allows creating an offering; local is read-only. Decide: add create, or keep Prism-synced read-only (confirm — may be a Prism-write concern).
4. Reuse the existing list components inside the tab shell (don't rebuild the tables).

### UX journey (target)
```
Nav "Directory" → /directory/courses
  Tabs: [Courses] Faculty Students Term
  Courses tab: table grouped by term + counts + "Push Surveys" + "Add Course Offering"
  → row → course detail (existing radar/trend analytics)
```

### Mobbin analogies
[Google Workspace Admin Directory](https://mobbin.com/flows/4dc2591b-2e12-405b-97a8-9a81a216a7a3) (left-nav Directory → sub-sections Users/Groups/Org-units, grouped tables) · [Confluence database table/card views](https://mobbin.com/flows/84152b11-57b0-4b6f-91ce-5c8f4d1898dc) (tabbed views over one dataset).

### DS map
`Tabs` (Courses/Faculty/Students/Term) over the existing `DataTablePaginated` tables · `Badge` (status) · grouped rows by term · toolbar actions (`Button` text-only).

### Sonnet tasks
1. Build a Directory shell with 4 tabs; mount the existing 4 list components inside.
2. Rename "Course Offerings"→"Courses", "Terms"→"Term".
3. Add a single Directory nav row → `/directory/courses` (collapse the 4 separate rows). **This is an IA consolidation — present as a brief, get Romit's OK first** (`feedback_no_unauthorized_consolidation`).
4. Confirm read-only vs "Add Course Offering" with Romit.

---

## 7. ⑤ SETTINGS — *merge the standardization half (missing) with the communication half (built)*

### What EXISTS locally (audit) — `/admin/eval-settings` (2 tabs)
- **Communication tab:** evaluation window (open −Nd / close +Nd / release +Nd offsets) · email template (subject+body, tokens) · reminder cadence (button group [1/3/7/10d]).
- **Rules tab:** Likert scale [3/5/7] · comment moderation toggle · minimum response-rate threshold (60%).
- Plus `/admin/email-templates` — Initial + Reminder templates with 8 `{{variables}}` + insertion chips.

### What the LIVE app does — `/settings` (DIFFERENT, complementary)
- **Likert Defaults:** **3 / 4 / 5 / 7**-point (local missing **4-point**).
- **Faculty Roles to Evaluate:** dropdown (Course Coordinator, Instructor, Teaching Assistant, Lab Assistant, Guest Lecturer); "No faculty roles configured yet." → **LOCAL MISSING.**
- **Benchmarks:** Target Response Rate · Target Course Score (/5) · Target Faculty Score (/5). → **LOCAL MISSING.**
- **Answer-Type Labels:** Low-End Label · High-End Label (customizable). → **LOCAL MISSING.**
- **Result Release:** Method (**Direct release / Review step**) + minimum threshold. (local has threshold, not the method toggle.)
- **ABSENT on live:** eval window rules, reminder cadence, comment moderation, email templates (these live ONLY in local).

### THE GAP / design update — **the merge**
Settings must contain BOTH halves. Target sections:
| Section | Source | Status |
|---|---|---|
| Scale standardization (3/4/5/7) | live + local | local has 3/5/7 → **add 4-point** |
| Answer-type labels (low/high end) | live | **BUILD** |
| Faculty roles to evaluate | live | **BUILD** — drives the Setup-Term audit (§3) |
| Benchmarks (response / course / faculty targets) | live | **BUILD** — drives Analytics reference lines |
| Evaluation window rule (±Nd) | local | built |
| Result release (method + threshold) | live + local | add **Direct/Review method** toggle |
| Reminder cadence | local | built — single source for §4 reminders |
| Communication / email templates | local | built |

This resolves the spec couplings: ① audit reads **faculty-roles-to-evaluate**; ③ push reads **window + cadence**; Analytics reads **benchmarks**; templates read **scale**.

### UX journey (target)
```
Nav "Settings" → sectioned settings (left section nav or tabs):
  Standardization (scale, labels, roles) · Schedule (window, release) · Communication (email, reminders) · Benchmarks
  Each control = "set once, applied everywhere"; show a live "resolves to…" preview for derived rules.
```

### Mobbin analogies
[15Five "Configuration: Performance Metrics"](https://mobbin.com/screens/ef50dc58-1f64-47a4-bfdd-761bdde150d7) (config cards + **real-data preview** of what the setting yields) · [15Five MEI weights](https://mobbin.com/screens/af67bb10-2ec6-46f6-bb11-983b426cda5a) (factor + numeric inputs + constraint) · [15Five secondary metrics](https://mobbin.com/screens/6fc4dbce-9ad1-467e-978f-92731796cd90).

### DS map
sectioned form · `RadioGroup`/`Select` (scale, method) · `Input` (labels, benchmark numbers) · multi-select (roles — reuse the template role-picker) · numeric steppers (cadence/window) · inline derived-value preview · `Switch` (moderation) · `LocalBanner` (save).

### Sonnet tasks
1. Add the 4 missing sections (answer labels, roles-to-evaluate, benchmarks, release-method) to `/admin/eval-settings` (or a restructured Settings).
2. Add 4-point to the scale options.
3. Wire the couplings: audit ← roles; push ← window/cadence; analytics ← benchmarks; template scale ← standardization.
4. Keep the built communication/window/reminder sections.

---

## 8. Cross-cutting issues (fix once, applies across surfaces)

1. **Reminder semantics inconsistency** — push [1/2/3/5/7/14d before close], activate [0/3/7d before term-end], settings cadence [1/3/7/10d]. → **ONE anchor + one source** (Settings cadence). Update push + activate to read it.
2. **Competing term flows** — SetupTermSheet vs activate wizard vs Terms dialog (§3). → reconcile (Romit decision).
3. **Window-derivation rule** — hardcoded ±7d in two places; should read from Settings window rule (§7). Single source.
4. **Scale source** — template editor shows fixed 1–5; should read Settings standardization (§5/§7).
5. **DS Sheet convention** — `setup-term-sheet.tsx` currently violates it; any new sheet must comply.
6. **"Run with AI"** — drop from push + dashboard.

---

## 9. Build sequence for Sonnet (priority order)

| # | Surface | Type of work | Gate on |
|---|---|---|---|
| 1 | **Settings merge** (§7) | BUILD 4 sections + wire couplings | do FIRST — it unblocks ②③④ couplings |
| 2 | **Dashboard term cards** (§11) | EDIT `TermCard` — window dates, at-risk inline, last-reminder, footer shortcut, "View All Terms" fix | no gate — independent of §7 |
| 3 | **Evaluations list** (§12) | REPLACE flat table with status sections; fix KPI bar (3 metrics); rename header CTA | no gate — independent of §7 |
| 4 | **Setup Term reconcile** (§3) | RECONCILE + fix DS Sheet convention | Romit decision on competing flows |
| 5 | **Create Survey align** (§4) | EDIT existing wizard (auto-fill, reminders, drop AI) | §7 settings + §3 decision |
| 6 | **Create Template gaps** (§5) | EXTEND existing editor (scale lock, choices, status) | §7 scale source |
| 7 | **Directory consolidate** (§6) | TAB SHELL over existing tables | Romit OK on IA consolidation + create |

> **Settings first** is the key sequencing insight — it's the single source the other surfaces read from. §11 + §12 (Dashboard + Evaluations list) have no dependency on Settings and can run in parallel with or immediately after §7.

---

## 10. Sonnet handoff checklist (per surface)

- [ ] Read this section + open the cited existing files (do not rebuild what exists).
- [ ] Confirm any IA consolidation / workflow merge with Romit BEFORE coding.
- [ ] Build/edit against DS components (verify via `source.mjs`), tokens, no-icon CTAs, amber-not-red, flat rows.
- [ ] DS Sheet convention on any drawer.
- [ ] tsc clean (delta, not absolute — repo baseline is large).
- [ ] `ds-conformance-reviewer` → paste verdict, fix.
- [ ] `state-review` → paste verdict, fix.
- [ ] `verification-reviewer` → paste verdict, fix.
- [ ] Visual pass (Playwright capture each state) → fix what renders wrong.
- [ ] WCAG: ≥12px, aria-labels, contrast, focus order.
- [ ] Two-tier verdict + evidence block.

---

## 11. ⑥ DASHBOARD TERM CARDS — supplemental audit (Jun 29 2026)

> This section was not in the original research pass. Romit flagged that the term cards and the click-through table were not checked against live. This section corrects that.

### What the LIVE dashboard shows (pce-three `/surveys/dashboard`)

**Current term card (Spring 2026):**
| Field | Value shown | Intent |
|---|---|---|
| Term name + badge | "Spring 2026" + `Current` badge | Identity + temporal orientation |
| Evaluation window | "Jan 20, 2026 – Dec 31, 2026" | Admin needs the exact open/close dates to know if they can still intervene — a countdown alone is insufficient when the window is weeks out |
| Countdown | "1d left until evaluation closes" | Urgency signal — the moment to act is *now* |
| Avg response rate | "Avg Response Rate 57%" | Single headline KPI for the term |
| Inline at-risk alert | "2 of 5 live courses below 40% response" | Surfaces the *problem count right on the card* so the admin knows to scroll to the worklist without having to find it |
| Last reminder timestamp | "Last reminder sent 5 days ago" | Prevents double-nudging — admin sees at a glance whether a recent reminder already went out; critical for deciding whether "Send Reminders" is appropriate or premature |
| Action on card | "Send Reminders to At-Risk (2)" button | Shortcut so admin can act without scrolling to the worklist |
| Link | "5 live · 1 pending · 9 total" → "View term →" | Drill-through to the per-course evaluations list |

**Last term card (Fall 2025):**
| Field | Value shown | Intent |
|---|---|---|
| Term name + badge | "Fall 2025" + `Last Term` badge | Historical reference point |
| Evaluation window | "Nov 20, 2025 – Dec 5, 2025" | Documents the data collection window for audit/records purposes |
| Total Surveys | "Total Surveys: 2" (labeled) | Snapshot of how many evaluations ran — labeled explicitly, not buried in a count string |
| Pending Review | "Pending Review: 1" (labeled) | Surfaces an unfinished action — if something is pending review, the admin needs to know it's there even after the term closed |
| Avg response | "Avg Response 80%" | Benchmark vs the current term (57%) — implicit comparison |
| Link | "View Results" | Goes to Analytics scoped to that term |

**Dashboard footer:**
- **"View All Terms (2)"** with a count — links to the terms *directory*, not the evaluations list. The number tells the admin how many archived terms exist. Local "View all terms" incorrectly goes to `/surveys` (the evaluations hub).

**Upcoming term:**
- "No upcoming term yet" + "Configure Term Calendar" — matches local.

### What LOCAL `dashboard-home.tsx` has vs what's missing

| Field | Local | Gap |
|---|---|---|
| Evaluation window dates | ❌ not shown | ADD to both current + last term cards |
| Inline at-risk count on card | ❌ only in the worklist section below | ADD to current term card body ("X of Y live below 40%") |
| Last reminder sent timestamp | ❌ not shown anywhere | ADD to current term card — drives the "should I remind now?" decision |
| "Send Reminders to At-Risk" on the card | ❌ only in the worklist section below | ADD shortcut button to the current term card footer (in addition to the worklist) |
| Last term "Total Surveys" + "Pending Review" as labeled fields | ❌ inline text "X live · X in review · X closed" | RELABEL the last term card to show named fields |
| "View All Terms" → correct destination | ❌ goes to `/surveys` (evaluations hub) | FIX to point to `/admin/terms` (the terms directory) |

### Why the last-reminder timestamp matters

The live admin is managing 5+ courses across a term. The "Send Reminders to At-Risk" button triggers an out-of-schedule email to non-responders. If the last reminder went out 2 days ago, sending another one today would spam students and erode open rates. The timestamp is a **guard rail** that lets the admin self-govern without a hard system block. Without it, they have no signal and must either remember or guess.

### Mobbin analogies

**Term card with date range + period-scoped KPI:**
[Turo Host Performance card](https://mobbin.com/screens/361cd854-5aba-4f47-8457-b63c3699c4ae) — date-range chip on the card header ("7/1/25 – 6/30/26"), per-period metric rows (Cancellation rate, Five-star rate), benchmark comparison inline. The pattern: period anchor → headline metric → deviation from target → action.

**Inline at-risk count + action directly on the summary card:**
[Apollo Data Health Center](https://mobbin.com/screens/b36c564d-0708-41cb-abdb-46e68975f8cf) — each enrichment card shows "74% jobs up-to-date / 9% jobs need enrichment" inline, with "View contacts" + "Schedule" CTAs directly below. The at-risk count lives *on the card*, not below it in a separate section.

**Last-reminder timestamp / activity log on card:**
[Deel Contract page](https://mobbin.com/screens/a69a3a79-47e4-47c9-9701-b66ecb1a63a2) — contract status card shows overdue task banner inline + "On Dec 10th" timestamp on the change request. The pattern: what needs action + when it was last touched, co-located on the entity card.

### DS map
`Card` + `CardContent` + `CardFooter` · `Badge` (Current / Last Term / Upcoming) · `Button` variant="ghost" (View term / View results) + variant="outline" (Send Reminders shortcut on current card) · date range as `text-xs text-muted-foreground` · at-risk count as inline amber `Badge` (`--insight-severity-warning-*`) · last-reminder as `text-xs text-muted-foreground` · "View All Terms" link → `/admin/terms`.

### Sonnet tasks
1. Add evaluation window date range to BOTH current and last term `TermCard` (from `MOCK_PROGRAM_TERMS[id].startDate` + `endDate` + the window offset).
2. Add inline at-risk count string ("X of Y live below 40%") to the current term card body. Derive from `atRisk.length` + `byTerm.current.live`.
3. Add "Last reminder sent X days ago" to the current term card (mock: hardcode `lastReminderDaysAgo` in mock data for now; wire to real API later).
4. Add a "Send Reminders to At-Risk (N)" shortcut `Button` in the current term `CardFooter` alongside "View term →" — delegates to the same `setRemindTarget(atRisk)` already used by the worklist.
5. Relabel last term card: replace the inline count string with two named fields ("Total Surveys" + "Pending Review") in a `dl` / two-column layout.
6. Fix "View all terms" link destination: `/admin/terms` (not `/surveys`).

---

## 12. ⑦ EVALUATIONS LIST (`/surveys`) — supplemental audit (Jun 29 2026)

> This section was not in the original research pass. The click-through from "View term →" on the current term card goes to `/surveys`. This page's structure was not compared against live.

### What the LIVE `/surveys` page shows

**KPI bar (3 metrics):**
| Metric | Label | Value |
|---|---|---|
| Active Surveys | "Currently open" | 5 |
| Pending Review | "Awaiting your review & release" | 1 |
| Released | "Faculty can view" | 2 |

**Content structure: STATIC STATUS SECTIONS (not a flat table, not collapsible)**
```
Section: Closed · Pending Review          (2 rows)
Section: Results Available                (2 rows)
Section: Live                             (5 rows)
Section: Scheduled                        (2 rows)
```
Sections are always expanded — no accordion toggle. Each section shows a header with the status label + count.

**Columns per row (all sections):**
Course Code · Course Title, Program · Term · Response Count / Total (%) · Response Rate % · Close Date / Status text · Action Button

**Row action buttons (per status):**
- Pending Review rows: **"Review & Release"** button (prominent)
- Released rows: **"View Results"** link
- Live rows: response rate + close date (no inline CTA, access via row menu)
- Scheduled: open date shown

**Header buttons:** "Set Up Surveys" (single CTA — not "Send Evaluations" + "Start Term Cycle")

### What LOCAL `/surveys` (`SurveysHub` → `SurveysTable`) has

**KPI bar (4 metrics):**
`Total evaluations` | `Live now` | `Needs review` | `Below threshold` (with avg response description)

→ **MISMATCH:** local has 4 metrics, live has 3. Local's "Below threshold" metric doesn't appear on live (it's a worklist concern handled on the Dashboard). Local is missing "Released" as a standalone KPI.

**Content structure: FLAT `DataTablePaginated`**
- Single paginated table, all rows intermixed, status shown as a `ListHubStatusBadge` column
- Status filtering via a dropdown filter chip (not section grouping)

→ **MISMATCH:** live organizes by status sections so admins scan *by job* (what needs review? what's live?) rather than scanning a flat list and filtering. The grouped layout is a UX pattern decision, not just a visual one — it surfaces the *pending review* cohort at the top (highest urgency), Results Available second, Live third, Scheduled last.

**Header buttons:** "Start Term Cycle" + "Send Evaluations" (two CTAs, different labels)

→ **MISMATCH:** live has a single "Set Up Surveys" — aligns with the live's simplified push entry point.

### Why status sections instead of a flat table

The admin's mental model on this page is **"what do I need to do right now?"** — not "show me all evaluations." The live grouping answers that directly:
- **Closed · Pending Review** = items blocked on ME (admin must act before faculty sees results)
- **Results Available** = completed cycle items (no action needed, just reference)
- **Live** = running collections (monitor only)
- **Scheduled** = future items (no action yet)

A flat sortable table requires the admin to mentally re-sort. Sections do the sort for them. This is the same pattern Linear, ClickUp, and Plane use for task boards — **status as an organizing axis, not a filter**.

### Mobbin analogies

**Status sections (grouped, not filtered):**
[Linear Issues grouped by In Progress / Todo / Backlog](https://mobbin.com/screens/46088879-314c-405c-88b5-eb7820c05efb) — section header shows status label + count (e.g. "In Progress 5"); rows collapse under the header; sections are static, not tabs.
[ClickUp Dashboard Revamp — grouped by status](https://mobbin.com/screens/946eb360-cb9d-486e-a666-5e02313f91db) — "Shipped / Review / In Development / In Design" sections with item counts; each section has its own "+Add Task" row.

**Pending-review surfaced at top (urgency order):**
[Plane Work Items — Backlog / Todo / In Progress / Done / Cancelled](https://mobbin.com/screens/3fcc0c3a-882c-4ff0-b684-863e8908aea5) — status sections ordered by action-urgency, not alphabetically; "Backlog" (needs triage) comes before "Done".

### DS map
`KeyMetrics` variant="flat" (3 metrics: Active / Pending Review / Released) · status-section headers as `<h2 className="text-sm font-semibold">` + count `Badge` · flat `border-b` rows (not DataTablePaginated) · `ListHubStatusBadge` per row · `Button` variant="default" size="sm" for "Review & Release" · `Button` variant="link" for "View Results" · `Button` variant="default" for header "Set Up Surveys".

### Sonnet tasks
1. **Replace the flat DataTablePaginated with status-section groups.** Four fixed sections in urgency order: Closed·Pending Review → Results Available → Live → Scheduled. Each section = `<section>` with `<h2>` header (label + count) + flat `border-b` rows.
2. **Update KPI bar** from 4 metrics to 3: Active Surveys (collecting/active) · Pending Review · Released. Remove "Below threshold" (it belongs on the Dashboard worklist, not here).
3. **Rename header CTA** from "Send Evaluations" to "Set Up Surveys"; remove "Start Term Cycle" button from this page (it has its own nav entry via the activate wizard).
4. **Add inline row CTAs per status:** "Review & Release" (→ `/surveys/[id]/moderation`) for pending_review rows; "View Results" (→ `/surveys/[id]`) for released rows.
5. Confirm with Romit: should sections be collapsible (accordion) or always-expanded? Live uses always-expanded. Collapsible would be useful when the list grows long.

---

## 13. ⑧ SURVEY-LEVEL ADMIN ACTIONS — supplemental click-through audit (Jul 7 2026)

> Use-case-driven click-through of the live app (view/filter · preview · remind · extend close date · per-question responses · download). Implemented same day — this section documents what live does and what was built locally.

**Live findings (pce-three):**
- "View term →" opens a **term monitor inside the dashboard** (KPI cards: coverage 9/16 · avg response · status donut; Table/Kanban toggle; filters Status/Course Type/**Completion**/search). Kanban has a **"No Survey Configured" column** with per-card "+ Set up survey" — coverage as an actionable worklist.
- Row kebab (status-gated; disabled when closed): **Send Reminders · Edit End Dates · Preview Survey · View Results**.
- Send Reminder confirm carries a **double guardrail**: "Last reminder was sent 1 day back and the upcoming reminder will be sent in 4 days."
- Edit End Date = minimal dialog (course code + one date field + Save).
- Result page: per-faculty chips (co-taught), Overview/**Reports** tabs, scorecards w/ program avg + prior-term, per-question histograms with **Median + Program Avg** benchmarks, comments grouped Course/Faculty with **sentiment chips (Positive/Constructive/Neutral)** + anonymity notice. Reports tab = Full Survey Report (PDF) + Raw Responses (CSV).
- Separate `/results` "Program Evaluation Results" hub (cross-term list, faculty filter, avg-score chips, Co-taught badge) — **not adopted locally** (overlaps /analytics; needs Romit IA decision).
- Live has **no row selection** — our bulk remind/extend via DataTable selection exceeds live.

**Built locally (Jul 7):** `PceSurvey.lastReminderSentAt/nextScheduledReminderAt/createdBy/originalDeadline` + sentiment on open-text responses (`pce-mock-data.ts`); `sendSurveyReminder`/`extendSurveyDeadline` actions (`pce-state.tsx`); row actions Preview/Remind/Edit End Date + Completion & Created-by filters + bulk Send reminders / Edit close dates (`surveys-table.tsx`); `SendReminderDialog` + `EditEndDateDialog` w/ guardrail + reminder-anchor impact note (`pce-modals.tsx`); detail page Preview form, Download reports section, score benchmarks in KPI strip, sentiment Badges (`surveys/[id]/page.tsx`); Median + Program avg per question (derived, `question-chart-block.tsx`); coverage line + "Survey remaining (N)" push link on the current term card (`dashboard-home.tsx`).

**Open (Romit decisions):** adopt a Kanban view toggle on /surveys? adopt a /results-style hub or keep /analytics? sweep pre-existing icon-on-CTA + dialog-footer `size` inconsistencies?

---

## Appendix — corrected assumptions (what earlier specs got wrong)

| Earlier assumption | Reality (this audit) |
|---|---|
| "Build Create Template: 3 aspects + clone-from-role" | Already built — subject groups + role tags + Copy/duplicate |
| "Build Settings: scale/labels/roles/benchmark" | Scale + window + reminders + email BUILT; labels/roles/benchmark MISSING |
| "Build Setup Term sheet" | Built — but overlaps the activate wizard + Terms dialog (reconcile) |
| "Build the push wizard 4-step" | Built (4-step) — needs alignment, not building |
| "Directory needs building / strip exam leftovers" | 4 entities built, read-only, CLEAN — needs tab consolidation, not cleanup |
| "Dashboard at-risk + reminders is new" | Existed in `DashboardMonitor`; already reconciled (chart-free dashboard) |
