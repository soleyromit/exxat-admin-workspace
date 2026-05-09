---
type: decision
date: 2026-05-08
product: workspace
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# ADR-005 — AI-first thinking pattern for analytics surfaces

## Status

Accepted (Aarti, 2026-05-08)

## Context

When Aarti reviewed PCE/CFE designs, Romit had built screens that asked schools to pre-tag evaluation questions into theme categories. Aarti pushed back:

> "You're still thinking that everything has to be tagged and grouped and organized. But, no, like, let it be dynamic. AI is good at finding themes and grouping the information by themes. Just let AI do that work."

Same pattern applies anywhere user-authored content (open-text responses, reflections, action plans) needs to be summarized for an audience.

## Decision

Every analytics surface splits content into two lanes:

| Lane | Source | Examples | Visual treatment |
|---|---|---|---|
| **Pulled** | Computed from structured data | Trends, averages, comparative metrics, distributions, leaderboards | Standard chart/number affordances; no AI badge |
| **AI** | LLM-extracted from user-authored content | Themes from open-text, insights, action-plan recommendations, summaries | Distinct affordance — icon, badge, or tone — so users know it's machine-generated |

Schools do NOT pre-tag their open-text responses. AI extracts themes dynamically, on whatever question set the school configured.

When AI output is editable (action plans, draft notes), the UI affords accept / edit / clear / type-own.

## Alternatives considered

- **Manual taxonomy + tagging** — rejected per Aarti. Doesn't scale across schools with different question sets.
- **No AI; trends only** — rejected because qualitative response data is most of the signal in evaluation; ignoring it strips PCE of half its value.
- **AI without visual differentiation** — rejected because users must know which content is computed vs generated for trust and accountability.

## Consequences

- Positive: Designs scale across schools that author their own questions without tagging discipline.
- Positive: AI value is visible (badged) — users can attribute insights to AI rather than mistake them for ground-truth.
- Positive: Reusable pattern across every analytics-heavy module (PCE, Exam Mgmt, future).
- Negative: AI quality must be high enough to earn trust; bad theme extraction will be visible and undermine the product.
- Negative: AI features need an "explain why" affordance for users who want to verify (defer to Phase 2).
- Follow-up: P3 viz pattern — define the visual treatment for AI-lane content (badge style, icon, tone, edit affordance).
- Follow-up: Define the AI prompts that drive theme extraction; these become a P3 pattern.
