# Cross-Product Research Signals

> Catalog of design signals that appear across 3+ workspace products, with evidence per product. The 3-product threshold is what elevates a single product's observation into a **platform-wide design principle**.
>
> Loaded by SessionStart hook. Referenced when designing any product feature: "does this principle apply here? what does the evidence look like?"

## Threshold rule

A signal belongs in the **Confirmed** table when it has documented evidence in **3+ products** (where products are entries in `docs/PRODUCTS.md` with status ≠ planned).

Less-evidenced observations live in the **Watchlist** below — they're real, but not yet platform-wide. They graduate when a 3rd product's evidence lands.

This discipline matters because: a one-product observation tells us about that product. A 3-product observation tells us about the **workspace's users**, which is what design principles should be grounded in.

## Confirmed signals (≥3 products)

| id | signal | evidence | implication | last_updated |
|---|---|---|---|---|
| **S-01** | **AI-first thinking pattern** — every product surface should ask "where does AI fit here?" before shipping. AI lane (themes, insights, action plans) vs Pulled lane (trends, metrics, averages). | `exam-management/docs/storytelling/ai-layer.md` (Aarti's 3 AI pillars, 2026-05-06) · `pce/docs/storytelling/ai-layer.md` (Aarti's 3 AI pillars for CFE, 2026-05-06) · `patient-log/docs/storytelling/ai-layer.md` (inherits via workspace ADR-005) | Workspace ADR-005 (AI-first thinking pattern). Surface AI affordance per `docs/patterns/viz/ai-vs-pulled-lane.md`. | 2026-05-09 |
| **S-02** | **LMS-first integration default** — admin surfaces assume LMS sync (Canvas, Brightspace) is the default; off-LMS is the fallback. Faculty / student lists are typically read-only with sync indicator. | `docs/decisions/002-lms-integration-first-default.md` (workspace ADR-002) · referenced from all 3 active product CLAUDE.md files · explicit in PCE student-mgmt page (apps/pce/admin/app/(app)/admin/students/page.tsx) | When designing any admin master-list (faculty, students, courses), default to LMS-on read-only with manual fallback. Vishaka's domain realism. | 2026-05-09 |
| **S-03** | **Match-then-extend (parity discipline)** — never drop existing functionality during rebuilds, even for innovation. Applies to ExamSoft → Exact migration, internal V3 → V4, and any product replacing a customer's existing tool. | `apps/exam-management/docs/storytelling/aarti-perspective.md` §2 (3 dated quotes, 2026-05-06/05-07) · workspace ADR-002 reasoning · `apps/pce/docs/storytelling/aarti-perspective.md` (parity applies to PCE replacing Trajecsys/Time2Track) | Every product's ADRs / use-cases must call out parity targets explicitly. `docs/COMPETITOR-INTEL.md` is the source of those targets. | 2026-05-09 |
| **S-04** | **Persona collapse (3-tier)** — admin / faculty / student is the right grain for Phase 1; finer divisions (PD, course-coordinator, SCCE, DCE…) defer to Phase 2 unless a feature demands them. | `docs/decisions/004-phase-1-persona-collapse.md` (workspace ADR-004) · applies in exam-mgmt + pce + skills-checklist + learning-contracts + patient-log scaffolds | When designing any new product surface, default to 3 tiers. Add finer grain only with named feature justification. | 2026-05-09 |

## Watchlist (1–2 products with evidence; not yet a platform signal)

These are real observations. They're documented in their products' storytelling files. They don't *yet* meet the 3-product threshold for elevation. When a 3rd product's evidence appears, promote to Confirmed and link the new evidence.

| id | candidate signal | evidence so far | promotion trigger |
|---|---|---|---|
| W-01 | Cognitive overload under constraint — students/faculty under time pressure or accreditation deadlines need progressive disclosure, not feature reduction | `apps/exam-management/docs/storytelling/aarti-perspective.md` (compound benefit frame) · `apps/exam-management/docs/storytelling/vishaka-perspective.md` ("main course before dessert") | Need PCE / Skills evidence (likely lands during Skills work — preceptors with N students mentioned in scoped notes) |
| W-02 | Faculty conservatism on new questions / templates — 99.9% of users have validated content; they're slow to author new | `apps/exam-management/docs/storytelling/aarti-perspective.md` §4 (2026-05-07) | Need PCE evidence (whether faculty are similarly conservative on new evaluation templates) |
| W-03 | Curricular loop framing (teach → assess → review → adjust) | `apps/exam-management/docs/storytelling/aarti-perspective.md` §1 · `apps/pce/docs/storytelling/aarti-perspective.md` (loop applies to clinical eval) | Need a 3rd product's framing — likely Skills Checklist when scaffolded |
| W-04 | Manual configuration debt — workflow features today require Exxat-team manual setup; users want self-service | (no current evidence in our storytelling — referenced in BOOTSTRAP for FaaS but FaaS storytelling not yet built) | Build FaaS storytelling first; revisit |
| W-05 | Multi-campus fragmentation — features need campus-level overrides without full reconfig | (mentioned in scope but no dated quote yet) | Capture in next admin-design conversation with Aarti |

## How signals shape design

When designing a feature in any product:

1. Read this file
2. For each Confirmed signal, ask: "does this apply here? if so, how is it expressed?" Surface the answer in the design output.
3. For each Watchlist signal where this product is named, log evidence (or absence) — that observation is the promotion trigger.
4. Don't invent signals. If a signal doesn't apply, say so explicitly.

## Maintenance

- **When you add a perspective file or storytelling section that adds evidence to a Watchlist signal:** promote it.
- **When you find a Confirmed signal contradicted in a new product:** document the contradiction in the row's `evidence` column. Don't silently demote.
- **When the 3rd product's evidence is *inferred* not direct:** keep the signal in Watchlist until direct evidence lands.

## Why this registry exists

A workspace with 5+ products has a coherence problem: each product can converge to local optima that disagree at the platform level. The 3-product threshold is the simplest forcing function: only observations seen across products elevate to platform principles. Everything else stays local.

This is downstream of `docs/governance/context-architecture.md` Tier 1 #3 (backlink graph): signals are the *cross-product backlink shape*, where multiple storytelling files share an inference and we capture it once.
