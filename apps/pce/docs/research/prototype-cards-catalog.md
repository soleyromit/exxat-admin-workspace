---
type: design-reference
date: 2026-05-09
product: pce
source: apps/pce/prototype/pce-evaluation.html (canonical 8-persona prototype)
related: apps/pce/docs/research/meetings/aarti-approved-designs-may-5-8.md
status: Reference (read-only catalog)
---

# PCE Prototype — Cards Catalog

> Maps every dashboard card / screen in `apps/pce/prototype/pce-evaluation.html` to whether Aarti has validated it (in current Granola transcripts) and what the redesign disposition should be.
>
> **Why this exists:** Romit 2026-05-09 — *"you were supposed to pull the cards Aarti liked from the prototype and use them for the new design."* This catalog is the bridge between the prototype version (8 personas, ~6,169 lines of HTML) and any future Next.js production work.
>
> **Tag the prototype as a frozen version:** `pce-prototype-v1` git tag.

## How to launch the prototype

```bash
bash scripts/serve-pce-prototype.sh
# → http://localhost:8000/pce-evaluation.html
```

Stop with `kill $(lsof -ti :8000)`.

## Disposition legend

- ✅ **Keep — Aarti-validated** — direct quote endorsing this card or its data need. Pull into redesign.
- ⏳ **Keep — pattern-validated** — Aarti endorsed the underlying pattern (e.g., "drone view → click down"); this card is a faithful application. Pull into redesign.
- ⚠️ **Phase 2** — Aarti capped Phase 1 at 3 roles (admin / faculty / student). Persona-specific cards for PD / CCC / Chair / DCE / Coordinator / Adjunct collapse into the admin role for v1.
- ❌ **Don't carry forward** — Aarti pushed back on this idea or pattern.
- ❓ **Unverified** — not yet reviewed with Aarti; stays as reference until validated.

---

## Personas in the prototype (8, with renderer line-numbers in `pce-evaluation.html`)

| # | Persona | Built? | Renderer | Phase 1 disposition |
|---|---|---|---|---|
| 1 | Program Director (PD) | Built | `renderPD()` line 1944 | ⚠️ Collapses into "admin" view per Aarti A12 (3 views only) |
| 2 | Curriculum Committee Chair (CCC) | Built | `renderCCC()` line 5566 | ⚠️ Collapses into admin |
| 3 | Department Chair | Built | `renderChair()` line 5780 | ⚠️ Collapses into admin |
| 4 | DCE (Director of Clinical Education) | Built | `renderDCE()` line 5936 | ⚠️ Collapses into admin |
| 5 | Coordinator | Built | (referenced via `setPersona('coord')`) | ⚠️ Collapses into admin |
| 6 | Faculty | Built | `renderFaculty()` line 3636 | ✅ Keep — own role tier |
| 7 | Adjunct | Built | `renderAdjunct()` line 6070 | ⚠️ Faculty tier sub-role; NOT a separate view |
| 8 | Student | Built | `renderStudent()` line 4952 | ✅ Keep — own role tier |
| (deferred) | Dean / President | Phase 2 | — | — |
| (deferred) | Associate Dean | Phase 2 | — | — |

Per Aarti (May 8, A12): *"Within the administrator view… I only want three views. Administrator, faculty, and students."* Phase 1 production work uses 3 view tiers; the 8 prototype personas are reference for what the admin tier needs to handle internally.

---

## PD persona dashboard cards

Source: lines 2225–3500 in `pce-evaluation.html`. PD is the most card-rich persona in the prototype.

| Card | Line | Aarti validation | Disposition |
|---|---|---|---|
| **Score landscape** (sorted bar chart of all released courses) | ~2498 | ✅ A4 — *"You either need the chart or you need those numbers. You don't need both."* Bars + numbers shown together. **Pull into redesign — strip duplicate values when bar lengths convey magnitude.** | Keep with simplification |
| **Program trend** (last 5 terms, current highlighted) | ~2505 | ✅ A3 endorsed: *"If this course was offered last time, I wanna know that this was it's going up or it's going down."* | Keep |
| **CQI evidence** (count of CQI actions tied to recent feedback) | ~2510 | ⏳ Aligned with A4 (loop closure pattern); not specifically reviewed | Keep as pattern |
| **Score spread / scatter** (every released course as a dot) | ~2518 | ⏳ Aarti-endorsed drone-view pattern: *"top drone view and then click down. For everything."* Scatter is the drone view for distribution. | Keep |
| **At-risk courses / Course health** (conditional empty state) | ~2525 | ⏳ Course health frame is positive/safe; at-risk pattern aligned with course-trend endorsement | Keep |
| **Pending admin review** (closed surveys awaiting moderation + grade-lock) | ~2533 | ✅ A4-aligned moderation flow Aarti approved | Keep — relabel "grades pending" → "pending admin review" per Aarti b2de feedback |
| **Latest faculty reflections** (full-width feed of faculty next-cohort notes) | ~2556 | ⏳ A1 (drone view → click down) loop closure | Keep |
| **Survey lifecycle for [term]** (kanban: not configured / scheduled / active / closed) | ~2827 | ✅ A11 prototype kanban demoed Apr 21; Aarti's team confirmed two distinct closed states | Keep |
| **Next 14 days** (calendar marker view of survey opens) | ~2844 | ⏳ A11-aligned timeline; not explicitly reviewed | Keep |
| **Triggering this week** (surveys opening in next 7 days) | ~2853 | ⏳ A11-aligned | Keep |
| **Currently collecting** (live response rates per active survey) | ~2859 | ✅ Aarti b2de — *"Show completion rates (e.g., '8 out of 14', '12 out of 42') even for open surveys"* | Keep |
| **System health** (issues blocking autopilot — LMS not connected, no template bound) | ~2863 | ⏳ A11/A8-aligned (LMS-disable, template binding) | Keep |
| **Recent activity** (notifications and actions feed) | ~2867 | ⏳ Standard activity-feed pattern | Keep |
| **Templates list + creator** | ~2611 | ✅ A14 unified module + A17 configurable defaults | Keep |
| **CQI Log** (actions, status, CAPTE 2C export) | (referenced in setView('cqi')) | ⏳ A4 loop closure | Keep |

---

## Coordinator persona cards

Source: PD/Coordinator share many cards; coord-specific is the **Autopilot dashboard** + **Create Surveys wizard** + **Audit Trail**.

| Card | Aarti validation | Disposition |
|---|---|---|
| Autopilot dashboard (per-term ops) | ✅ A11 lifecycle pattern | Keep — collapses into admin tier |
| Create Surveys wizard (4 steps) | ⏳ Pattern-aligned with A17 configurable | Keep |
| Audit Trail | ❓ Not explicitly reviewed | Keep as Phase 2 candidate |

---

## Faculty persona cards

Source: `renderFaculty()` line 3636+.

| Card | Aarti validation | Disposition |
|---|---|---|
| Grade-locked + min-N suppressed self-view | ✅ A12 — explicit faculty role tier; A4-aligned (privacy) | **Critical to keep** — Aarti's "no peer comparisons" guardrail (D-4) |
| 5-term trend (sparkline) | ✅ A3 — going up/down across offerings | Keep |
| Themes (AI-extracted) | ✅ A4 — AI insights at each level | Keep |
| Structured reflection prompt | ⏳ A4 loop closure pattern | Keep |
| 2-sentence next-cohort note | ✅ Faculty action follow-through; aligned with feedback | Keep |
| Faculty dossier (scores vs department + university average) | ✅ A5 — *"How am I doing? And how am I doing with respect to others? compared to the department average to the university average."* | **Pull verbatim — Aarti specifically validated this pattern** (cited Anthology/Watermark as proof of concept) |

---

## CCC persona cards

Source: `renderCCC()` line 5566+. **Phase 2** — collapses into admin tier for Phase 1.

| Card | Aarti validation | Disposition |
|---|---|---|
| Multi-cohort trends with sparklines | ⏳ A3 + A11 cohort-grouping aligned | Keep concepts; merge into admin term/cohort views in Phase 1 |
| Competency coverage matrix | ❓ Not reviewed | Keep as Phase 2 candidate |
| Cross-course themes | ✅ A4 AI insights | Keep — already at term level in admin |

---

## Chair persona cards

Source: `renderChair()` line 5780, `renderChairRoster()` 5786, `renderChairDossier()` 5837. **Phase 2**.

| Card | Aarti validation | Disposition |
|---|---|---|
| Faculty roster (sortable list) | ⏳ A11 pattern | Keep concept; Phase 2 |
| Faculty dossier (longitudinal scores) | ✅ Same as faculty dossier (A5) | Keep — same component as faculty self-view but different access scope |

---

## DCE persona cards

Source: `renderDCE()` line 5936+. **Phase 2**.

| Card | Aarti validation | Disposition |
|---|---|---|
| Clinical dashboard | ⏳ Aligned with PCE clinical stage | Phase 2 |
| Cohort readiness facets | ❓ Not reviewed | Phase 2 |

---

## Adjunct persona

Source: `renderAdjunct()` line 6070. Per HANDOFF.md: *"email digest preview only (no app login per PRD)."*

| Card | Aarti validation | Disposition |
|---|---|---|
| Email digest preview | ⏳ Pattern-aligned with A11 lifecycle | Keep — but this is email, not app |

---

## Student persona cards

Source: `renderStudent()` 4952, `renderStudentList()` 4958, `renderStudentSurvey()` 5030, `renderStudentSubmitted()` 5141.

| Card | Aarti validation | Disposition |
|---|---|---|
| Mobile shell with anonymity badge | ✅ A12 student tier; A17 access defaults | Keep |
| Two sections (rated + open-text) | ⏳ Standard | Keep |
| Prior-cohort feedback note | ⏳ Continuity context | Keep |

---

## What Aarti pushed back on (DON'T carry forward)

| Pattern | Source quote | Disposition |
|---|---|---|
| Speculative trend graphs without validated use case | *"Before he spends hours and hours creating trend graphs and this graph and that graph… It's bullshit."* | ❌ Each viz must answer a specific user question |
| Separate "click here for insights" sections | *"I don't want a separate section saying click here to get insights."* | ❌ AI must be inline with workflow |
| Students-at-risk on question bank dashboard | *"Students at risk doesn't belong here at all… question bank dashboard and a course dashboard — those are two different concepts."* | ❌ Keep dashboards separated by domain |
| "Grades pending" terminology | b2de feedback — replace with "pending admin review" | ❌ Use "pending admin review" instead |

---

## Phase 1 production scope (what to actually build, post-redesign)

Per Aarti A12 (3 views only) + A14 (unified Course Eval + Surveys module) + A11 (term + cohort grouping):

```
ADMIN TIER (collapses PD + CCC + Chair + DCE + Coordinator)
├─ Term dashboard (✅ pull: score landscape, program trend, score spread,
│   AI insights, pending admin review, currently collecting, system health)
├─ Cohort dashboard (✅ pull: cross-cohort trends, multi-cohort themes)
├─ Survey lifecycle / autopilot (✅ pull: kanban, next 14 days, triggering)
├─ Templates + Banks (✅ pull: list, creator wizard, version-pinning)
├─ CQI Log (✅ pull: action creator, reassess, close, CAPTE export)
└─ Setup (✅ pull: LMS, course types, terms, decision admin, notifications)

FACULTY TIER
├─ Self-results (✅ pull: dossier, sparkline, themes, structured reflection,
│   2-sentence next-cohort note) — privacy-guarded (no peer-by-name)
└─ Adjunct: email digest only (no app)

STUDENT TIER
├─ Survey list
├─ Take survey (mobile-first, anonymity badge)
└─ Confirmation
```

---

## Tagging and preservation

This prototype is the **frozen reference** for Phase 1 redesign work. Tag the commit so the version is recoverable independent of subsequent refactors:

```bash
git tag -a pce-prototype-v1 -m "PCE prototype — 8-persona reference (frozen 2026-05-09)" $(git log -n 1 --format=%H -- apps/pce/prototype/)
git push origin pce-prototype-v1
```

After tagging, this catalog + the tag are the two artifacts pinning the prototype. Any future redesign work pulls from this catalog's "Keep" rows; "Phase 2" rows stay shelved until the explicit user/Aarti ask comes in.

## See also

- `apps/pce/prototype/HANDOFF.md` — engineering handoff: personas, FRs, data model, state machines, API surface, integrations
- `apps/pce/prototype/README.md` — local preview instructions
- `apps/pce/docs/research/meetings/aarti-approved-designs-may-5-8.md` — verbatim Aarti approvals from May 5-8
- `apps/pce/docs/specs/course-evaluation.md` — design spec (was used for the now-reverted Sprint 1-5 work)
- `scripts/serve-pce-prototype.sh` — one-line launch
