# Patient Log — AI Layer

⚠️ **Scaffold.** No AI features specified yet for Patient Log.

## What likely applies (per workspace ADR-005)

Until Patient Log has its own AI direction, the workspace AI-first thinking pattern applies:
- Pulled lane: trends, averages, comparative metrics
- AI lane: themes, insights, action plans, summaries
- AI affordance per `docs/patterns/viz/ai-vs-pulled-lane.md`

## Aarti's 3 AI pillars (cross-product baseline)

From CFE: theme extraction + action item recommendations + template builder. Patient Log will likely have analogues:
- Encounter theme extraction (patterns across logged encounters)
- Action item recommendations (e.g., "you've under-logged emergency cases this rotation — discuss with preceptor")
- Encounter template / form builder

But these are **not yet discussed by stakeholders**. Don't fabricate.

## When populated

Same structure as `apps/exam-management/docs/storytelling/ai-layer.md`:
- AI strategy
- Per-feature AI (F1, F2, …)
- AI lanes (pulled vs AI per surface)
- What AI does NOT do
- Cross-product AI patterns inherited
- AI roadmap
- Source provenance
