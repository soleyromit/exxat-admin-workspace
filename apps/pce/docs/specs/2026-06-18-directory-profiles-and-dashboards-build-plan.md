# Build Plan — Directory Profiles, Monitoring Dashboards & a Real Viz System

**Date:** 2026-06-18 · **Owner:** Romit · **Status:** Plan (pre-build)
**Companion:** `apps/pce/docs/research/2026-06-18-lovable-survey-app-audit.md` (the gap audit this plan resolves)

---

## 0. The thesis

Two layers, one viz language:

```
MONITORING (Dashboard)            DEEP-DIVE (Entity profiles)
─ at-a-glance + intervention      ─ one entity, full history, complex viz
─ "what needs me right now?"      ─ "how does THIS faculty/course/term/offering perform?"
─ /analytics (renamed Dashboard,  ─ /analytics/<entity>/<id>
   now nav-first)                    reached from each directory row
```

Every **directory** entity (Students · Faculty · Course Offerings · Terms) gets a **profile**
— like the Lovable faculty detail, but with the complex viz we already ship on Faculty/Course
profiles *plus* what each entity specifically warrants. The Dashboard absorbs the Lovable
monitoring elements we're missing (at-risk, status distribution, response-by-type).

**Non-negotiables:** DS-only (tokens, `ChartContainer`, `KeyMetrics`, `DataTable` native filter,
`PageHeader`); viz must beat default recharts/Claude (§3); ds-conformance gate before "done."

---

## 1. Current state

| Surface | State |
|---|---|
| Dashboard (`/analytics`) | EXISTS as analytics hub — By Term / By Faculty / By Course tabs + Nudge. **No** at-risk panel, status distribution, or response-by-type. |
| Faculty profile (`/analytics/faculty/[id]`) | EXISTS — radar + rating-over-time distribution band + offerings table |
| Course profile (`/analytics/course/[code]`) | EXISTS — radar + distribution band + offerings table |
| Course Offering profile | **MISSING** |
| Term profile | **MISSING** |
| Student profile | **MISSING** (FERPA-sensitive — see §4.5) |

---

## 2. Product analogies (benchmark before we draw)

### Course-evaluation / survey platforms
| Product | What they nail | Borrow |
|---|---|---|
| **eXplorance Blue** | Dashboards segmented by role; response-rate monitor with live thermometer | Real-time response monitor; role-scoped dashboards |
| **Watermark (EvaluationKIT)** | Response-rate-by-course-type; project (term) rollups | Response-by-type viz; term rollup |
| **Qualtrics CoreXM** | Drivers/keymage analysis; topic sentiment on comments | Comment sentiment + driver analysis on profiles |
| **AEFIS** | Outcome/competency linkage to eval items | Tie eval items → our Competencies/Content Areas |
| **SmartEvals / Anthology** | "At-risk" low-response nudging workflows | At-risk panel + nudge (we have nudge, not the panel) |
| **Lovable "Exxat Surveys"** (reference) | At-risk table, status distribution, response-by-type, clean target-population scoping | All four (see audit P1) |

### Dashboard / viz craft (not survey-specific)
| Product | Pattern to steal |
|---|---|
| **Datadog / Grafana** | Dense small-multiples; sparklines in tables; threshold bands |
| **Amplitude / Mixpanel** | Cohort heatmaps; funnel/retention; distribution (not averages) |
| **Stripe** | Calm KPI cards with period deltas + spark; restraint |
| **Linear** | Slopegraphs, cycle/velocity charts, monochrome-with-one-accent |
| **Vercel Analytics** | Cumulative curves; percentile bands over a single line |

---

## 3. Viz system — beyond default recharts/Claude

**Chart vocabulary** (pick by question, not by habit):

| Question | Chart | Notes |
|---|---|---|
| Where does X sit in the population? | **Distribution band** (have) / **beeswarm** / **strip plot** | Shaded min–max + median + the entity's line. Beeswarm for per-course points. |
| How did X change term-over-term? | **Slopegraph** | Two-to-N term columns, one line per section/faculty — reads direction instantly. |
| Is X above/below target? | **Bullet chart** | Bar + target tick + qualitative band. Replaces progress bars. |
| Shape of the score spread? | **Histogram** / **strip plot** | Response-rate spread across a term's courses. |
| Score by dimension? | **Radar** (have) | 5 survey sections. Keep. |
| Question × cohort intensity? | **Heatmap** | Item-level scores; sequential ramp (no red — Aarti). |
| Collection progress over the window? | **Cumulative response curve** | Velocity of responses vs close date — predicts final rate. |
| Inline trend in a table cell? | **Sparkline** | Per-row response-rate trend. |
| Status mix? | **Segmented horizontal bar** | Live/Scheduled/Closed/Draft — NOT a pie. |

**Rules (from established feedback):**
- **Banned:** pie/donut, 3D, gratuitous progress bars (*last resort* only — genuine 0→100% in-flight), `uppercase tracking-wide` chart labels, default recharts legend/tooltip chrome.
- **No red** in score/rating/performance viz (`--destructive` / oklch hue ~25). "Below threshold" = amber/orange.
- **Viz-first:** the chart answers the question alone; text labels values, never replaces the chart; draw outliers/comparisons on the viz, not in prose.
- **DS-bound:** every chart inside `ChartContainer`; colors = `--chart-1..n` + `--brand-color`; never raw hex; tokenized grid/axis (`--border`, `--muted-foreground`).

```
Bullet (response rate vs 70% target)      Slopegraph (section scores, F25 → S26)
 Delivery   ████████████▏·· 64%  ┆target   Delivery   4.6 ●─────────● 4.2  ↓
 Prep       ███████████████▏ 78% ┆         Prep       4.1 ●─────────● 4.4  ↑
 Access     █████████▏······ 52% ┆         Access     3.9 ●─────────● 3.9  →
```

---

## 4. Entity profiles (the drill-in layer)

Shared shell (DS): `SiteHeader` breadcrumb (back-references originating directory via `?from=`) →
profile header (avatar/icon + name + status badge + "Open in Prism") → `KeyMetrics` compact strip →
charts row → `DataTable` sub-list / tabs.

### 4.1 Faculty profile — EXTEND (exists)
- **Lovable gaps to capture:** contact (email + **phone**), title line (rank · dept · role e.g. "Department Chair"), **status badge**, **Surveys tab** (alongside Courses).
- **New viz:** section-score **slopegraph** term-over-term; question-level **heatmap**; response-rate **cumulative curve** per active eval.
- **Keep (we're ahead of Lovable):** radar + distribution band.

### 4.2 Course profile — EXTEND (exists)
- **New viz:** **faculty-comparison** (which instructor rates higher on this course — grouped bullet); term-over-term **slopegraph**; didactic/clinical **peer band**.

### 4.3 Course Offering profile — NEW
- One offering = course × term × faculty. Header: course code/name · term · primary faculty · enrolled.
- **KPIs:** response rate, avg rating, days-to-close, completion velocity.
- **Viz:** **cumulative response curve** (vs close date — the headline), **section radar**, question **heatmap**, comment **sentiment** strip.
- Links to the existing **Evaluation Card** + Push/Nudge actions.

### 4.4 Term profile — NEW
- One term's eval cycle (this is "By Term" scoped to a single term, as a page).
- **KPIs:** courses, overall response rate (+Δ vs last term), faculty evaluated, **# at-risk**.
- **Viz:** response-rate **histogram/beeswarm** across the term's courses; **response-by-course-type** (didactic vs clinical bullet); status **segmented bar**; collection **velocity curve**.
- **At-risk** sub-list (below threshold) with inline nudge.

### 4.5 Student profile — NEW (gated)
- **FERPA + Monil's read-only directive:** participation only, **no peer comparison, no scores**.
- **KPIs:** surveys assigned / completed, completion rate. **Viz:** participation timeline; outstanding-surveys list.
- ⚠ **Blocked on Aarti confirmation (Baroda week, ~Jun 22)** before building an analytics entry point for students. Ship the directory profile as read-only first.

---

## 5. The Dashboard (monitoring layer) — `/analytics`

Absorbs Lovable P1 elements on top of our existing tabs:

| Block | Viz | Source |
|---|---|---|
| KPI strip | `KeyMetrics` compact, **with period deltas** ("+4% vs last term") and absolute counts ("470 of 1,006") | Lovable P1 #10–12 |
| Evaluation status | **segmented horizontal bar** (Live/Scheduled/Closed/Draft) | Lovable P1 |
| Response by course type | **bullet** (Didactic 86% / Clinical 61% vs target) | Lovable P1 #3 |
| **At-risk evaluations** | ranked list, response-rate **bullet** + days-left + inline **Nudge** | Lovable P1 #1–2 (we have Nudge) |
| Top responding / Recent | compact `DataTable` with **sparkline** trend cells | Lovable |

Keep By Term / By Faculty / By Course tabs as the analytical layer beneath the monitor.

---

## 6. Lovable-element completeness map (nothing dropped)

| Lovable element | Lands in | Status |
|---|---|---|
| At-risk table | §5 Dashboard | NEW |
| Status distribution | §5 Dashboard | NEW |
| Response-by-course-type | §5 Dashboard + §4.4 Term | NEW |
| KPI deltas + absolute counts | §5 KPI strip | EXTEND |
| Faculty Type/Rank/Position/Status cols | Faculty directory | EXTEND |
| Faculty contact + role + Surveys tab | §4.1 | EXTEND |
| Course Offerings: Program col, group totals, active-only toggle | Offerings directory | EXTEND |
| Students: Campus/Category cols, On-Leave/Graduated | Students directory | EXTEND |
| General Surveys "Target population" | Programmatic surveys list | EXTEND |
| Settings → RBAC matrix + custom roles + audit trail | Setup → Permissions | NEW (matrix = Phase 2 / Vishaka R7) |
| Academic Calendar in Settings | (we keep Terms entity) | DECISION (§8) |
| New-evaluation flow, Template editor | — | **NOT YET AUDITED** — need their screens |

---

## 7. DS conformance

- **Components:** `PageHeader` (serif h1 + subtitle + actions), `KeyMetrics variant="compact"`,
  `DataTable` **native filter popover** (`ColumnDef.filter` — done for Courses; roll out everywhere,
  no loose Selects), `ChartContainer` + `ChartTooltip`, `Badge`, `Tabs`, `SiteHeader` breadcrumbs.
- **Filters:** behind the filter affordance only — never loose controls beside the header.
- **Gate:** `ds-conformance-reviewer` (vs localhost:4000) + `state-review` + `verification-reviewer`
  on every profile/dashboard before "done"; grep `uppercase tracking-wide` · `py-20 text-center` ·
  `color-mix(in oklch`; axe path in the evidence block.
- ds-conformance verdict for *this turn's* changes (nav/filters/rename): **see the running
  reviewer's verdict — to be pasted on completion.**

---

## 8. Phasing & open decisions

**Phasing**
- **P1** — Dashboard monitoring layer (at-risk · status · response-by-type · KPI deltas). Highest value, reuses existing data + Nudge.
- **P2** — Course Offering profile + Term profile (new viz: cumulative curve, beeswarm, slopegraph).
- **P3** — Faculty/Course profile extensions; Student profile (gated on §4.5); directory column parity.

**Open decisions for Romit**
1. **IA:** nest Course Offerings + Faculty under Course Evaluation (Lovable-style, contextual) vs current generic Directory?
2. **Terms:** keep as first-class entity (drives Activation wizard) vs Lovable's "Academic Calendar in Settings"? (Recommend keep.)
3. **Student analytics scope:** confirm read-only-only with Aarti before any student analytics entry point.
4. **Dashboard vs Reports split:** one "Dashboard" (now) or split monitor (Dashboard) from analysis (Reports) like Lovable?
