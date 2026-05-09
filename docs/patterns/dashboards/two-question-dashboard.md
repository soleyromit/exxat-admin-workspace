# Two-Question Dashboard

**Question answered:** How do we structure a dashboard that asks both "Am I doing X?" and "Is X working?"

**Pattern ID:** `DASHBOARDS-001`
**Binds rules:** D14 (Aarti audit — two-question framework), workspace ADR-005 (AI-first thinking), dashboards/RUBRIC.md

---

## When to use

Any analytics surface where the user needs both:

1. **Coverage / completeness** — "Am I doing the thing I said I'd do?"
2. **Outcome / quality** — "Is the thing I'm doing actually working?"

Aarti called this out for Exam Management:

> "Am I teaching everything I must teach?" + "Am I testing what I'm teaching?"

It generalizes:

| Module | Question 1 (coverage) | Question 2 (outcome) |
|---|---|---|
| Exam Mgmt | Am I teaching every standard? | Are my assessments testing what I'm teaching? |
| PCE / CFE | Am I getting evaluations from every cohort? | Are themes consistent across cohorts? |
| Skills Checklist | Am I observing every required skill? | Are observations consistent across preceptors? |
| Patient Log | Am I logging the required encounters? | Are encounter outcomes meeting expectations? |
| Learning Contracts | Are all contracts on track? | Are outcomes meeting commitments? |

## The shape

Two side-by-side surfaces, NOT one combined surface. Each surface is a coherent answer to its question.

```
┌─ Course health: PHARM 101 ─────────────────────────────────────────────────┐
│                                                                             │
│  ┌─ Q1: Am I teaching everything? ─┐  ┌─ Q2: Am I testing what I teach? ─┐ │
│  │                                  │  │                                   │ │
│  │  Standards mapped to objectives  │  │  Standards covered by questions  │ │
│  │  ────────────────────────────    │  │  ────────────────────────────    │ │
│  │  Patient Care        ████ 8/8    │  │  Patient Care        ████ 4/8    │ │
│  │  Pharmacology       ████ 5/5    │  │  Pharmacology       ████ 5/5    │ │
│  │  Communication      ███▢ 3/4    │  │  Communication      ▢▢▢▢ 0/4    │ │
│  │  Professionalism    ████ 6/6    │  │  Professionalism    ██▢▢ 3/6    │ │
│  │                                  │  │                                   │ │
│  │  ⓘ 1 standard partial            │  │  ⚠ 2 standards uncovered          │ │
│  │                                  │  │     ─ Communication               │ │
│  │                                  │  │     ─ Professionalism (partial)   │ │
│  │                                  │  │     [ Generate questions w/ AI ]  │ │
│  └──────────────────────────────────┘  └───────────────────────────────────┘ │
│                                                                             │
│   AI insight (across both):                                                 │
│   "Your Communication standard is mapped to 4 objectives but has zero       │
│    questions. Add ~12 questions to align coverage."   [ Suggested Qs ]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Per-question card spec

| Element | Spec |
|---|---|
| Header | Question stated as a question ("Am I teaching everything?") — not a noun |
| Coverage viz | Frequency counts per item ("8/8" or "3/4"), NOT percentages (D17) |
| Bar fill | DS `--chart-2` for full, `--chart-4` for partial (NEVER red — VIZ-004) |
| Empty / zero | Render the row, don't omit; "0/4" with empty bar makes the gap visible |
| Footer summary | "1 standard partial" / "2 standards uncovered" — count the gaps |
| CTA per gap | Specific action ("Generate questions with AI", "Map this standard to a course") — never generic |

## AI-lane insight (per ADR-005)

Below the two question cards, an AI insight summarizes across both:

| Element | Spec |
|---|---|
| Visual lane | Distinct affordance — DS `Banner` variant with sparkle icon (not the `fa-star-christmas` reserved for Leo) |
| Tone | Specific, action-oriented: name the gap + recommend a fix |
| Edit affordance | "Suggested Qs" → opens AI-generated questions; user accepts/edits/clears (per ADR-005) |
| Source | Always cite ("Based on your standards mapping + question bank coverage") |

## Decision flow

```
Designing analytics for a curriculum/assessment context?
├─ Single coverage view enough?            → use a frequency-coverage chart, skip this pattern
├─ Need both coverage AND outcome?         → use this pattern
└─ Coverage but no outcome data yet?       → use coverage card alone with Q2 placeholder
```

## A11y notes

- Each Q card is a `<section>` with an `<h2>` (the question itself)
- Bar fills use color + count text together (A11Y-008 — color is not the only encoding)
- AI lane has `role="region"` with `aria-label="AI insight"`
- Suggested-Qs CTA is a DS `Button variant="outline"` with `aria-label` describing what opens

## Anti-patterns

- ❌ Combining both questions in one card with mixed metrics ("PHARM 101: 80%") — each question deserves its own answer
- ❌ Using percentages for coverage data — D17 violation
- ❌ Red for partial / uncovered — VIZ-004 violation
- ❌ AI lane visually identical to pulled-data lane — ADR-005 violation
- ❌ Dashboards without per-gap CTAs — surfaces the problem without proposing fix
- ❌ Empty bars / rows hidden ("we don't have data for Communication so we won't show it") — invisibility hides the gap
