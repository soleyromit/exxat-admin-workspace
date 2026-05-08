# PCE / CFE — AI Layer

> Per workspace ADR-005 (AI-first thinking pattern). Aarti's 3 explicit AI pillars for CFE.

---

## AI strategy (per Aarti, 2026-05-06)

> "We want to use AI in the research analytics. We want to use AI for providing action items from that. And we want to use AI for building the actual evaluation template. So those are the three things… please make sure that you write them down."

Three pillars:

1. **Research analytics / theme extraction** — AI reads open-text responses, extracts themes
2. **Action item recommendations** — AI suggests action plans tied to negative themes
3. **Evaluation template builder** — AI assists schools in authoring templates

Plus the workspace-wide **pulled vs AI lane** distinction (workspace ADR-005).

## Per-feature AI

### F1 — Theme extraction from open-text responses

| Field | Detail |
|---|---|
| **What AI does** | Reads open-text student responses → clusters into themes → surfaces 3-6 themes per course/faculty. |
| **Trust contract** | Themes are AI-generated; provenance always cited ("Based on 47 open-text responses · 6 themes"). User cannot edit a theme directly (themes are a computed view); user can flag a theme as inaccurate (Phase 2). |
| **Pulled lane** | Survey response data, response counts, response demographics. |
| **AI lane** | Themes, sentiment polarity (positive/negative/neutral), theme citations. |
| **Failure modes** | Bad clustering → false themes. Mitigation: minimum response volume threshold (≥10) before extraction; user can flag (Phase 2). |
| **Quality bar (Aarti)** | Per ADR-005: don't force schools to pre-tag. AI extracts dynamically. |
| **AI affordance** | Per `docs/patterns/viz/ai-vs-pulled-lane.md` — DS Banner with sparkles icon. |

### F2 — Action plan recommendations

| Field | Detail |
|---|---|
| **What AI does** | From a negative theme, AI recommends 2-4 action plan steps (e.g., "Redistribute lecture content weeks 8-10; add a checkpoint quiz week 9"). |
| **Trust contract** | User accepts / edits / clears / types-own. AI-recommended steps are clearly labeled. |
| **Pulled lane** | The negative theme + response volume. |
| **AI lane** | Recommended action steps, source citation. |
| **Failure modes** | Generic / unhelpful recommendations. Mitigation: edit affordance is mandatory. |
| **Quality bar** | Per Aarti ADR-005: AI recommends, human decides. |
| **Phase 1 status** | Lite (no heavy tracking — Phase 2/3 for tracking infrastructure per D31) |

### F3 — Evaluation template builder

| Field | Detail |
|---|---|
| **What AI does** | AI suggests sections + questions for a new evaluation template based on course type / cohort / standards mapping. |
| **Trust contract** | Schools edit / accept / reject every AI-suggested question. Templates remain school-authored — AI is starting point, not final state. |
| **Pulled lane** | Course type, cohort context, standards mapping (where present). |
| **AI lane** | Suggested sections + questions, with rationale. |
| **Failure modes** | Generic templates that don't fit school's culture. Mitigation: school edits before activation. |
| **Quality bar** | Per Aarti — net-new pillar (no competitor doing this). High value when shipped well. |

### F4 — Faculty self-reflection prompt generation (deferred to Layer 3)

| Field | Detail |
|---|---|
| **What AI does** | Future: AI generates personalized reflection prompts for each faculty based on their specific theme patterns. |
| **Phase** | Future / Phase 2+ (Vishal 2026-05-06) |

### F5 — Comment analysis (Watermark-class)

| Field | Detail |
|---|---|
| **What AI does** | Beyond theme extraction: AI categorizes comments by sentiment, topic, urgency. Available for chat-based exploration in Phase 2. |
| **Phase** | Phase 1 baseline (sentiment + theme); Phase 2 chat interface |
| **Competitor parity** | Watermark + ExplorerBlue Amply do this; Aarti called out Watermark explicitly 2026-05-06. |

## AI lanes — pulled vs AI in CFE

| Surface | Pulled lane | AI lane |
|---|---|---|
| Admin program overview | Term-level averages, response rates, trend lines, leaderboards | (Optional) AI insight summarizing program-level patterns across courses |
| All courses tab | Per-course averages, response %, trend deltas | (Per-row optional) AI quick-insight chip |
| Course detail | Course-level averages, per-faculty comparison, per-question breakdown | AI insights pane (positive themes / improvement areas) — primary AI surface |
| Faculty self-view | Course rating + faculty rating + trend + lifetime + comparative | AI insight per faculty (themes from their open-text responses) |
| Action plan | Source theme (cite) | AI-recommended action steps |

## What AI does NOT do in CFE

| Thing | Why |
|---|---|
| Rate students (cohort readiness) | Aarti killed — wrong product |
| Rate competencies | Competencies are outcomes, not student-rated |
| Auto-publish action plans | User must explicitly accept |
| Edit themes (themes are computed) | Themes are a view of data, not editable content |
| Generate evaluation responses | Students respond; AI doesn't fabricate |
| Force a taxonomy on user-authored questions | ADR-005 — extract dynamically |

## Cross-product AI patterns this product uses

- **Pulled vs AI lane** — `docs/patterns/viz/ai-vs-pulled-lane.md`
- **Two-question dashboard** — applicable for "Am I rating fairly?" + "Are themes consistent across cohorts?" (Phase 2 pattern application)
- **AI-first thinking** — workspace ADR-005

## AI roadmap

| Phase | AI scope |
|---|---|
| **Phase 1 (Sept 15, 2026)** | F1 (theme extraction); F2 (action plan recommendations — lite); F3 (evaluation template builder — basic) |
| **Phase 2 (2027)** | F4 (faculty self-reflection prompts); F5 chat interface (Watermark-class); theme drift across cohorts |
| **2027+** | Cross-product analytics (didactic + clinical correlation — FERPA blocker per HANDOFF OQ-07) |

## Source provenance

- Aarti 2026-05-06 roadmap planning (`a73456ab`) — three pillars stated explicitly
- Aarti 2026-05-08 design review (`4e1c850e`) — AI extracts themes dynamically; pulled vs AI distinction; action plan flow lite
- Vishal 2026-05-06 PCE persona mapping (`1b317110`) — 3-layer analytics framework (L1/L2/L3) referenced; AI in Layer 3
