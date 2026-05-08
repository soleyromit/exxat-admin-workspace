# Exam Management — Workflows

Long-form workflow specifications. One `.md` per canonical flow.

## Phase 1 canonical flows

| File (to be written) | Persona | Trigger |
|---|---|---|
| `faculty-entry.md` | Faculty | PRISM tile click / direct login |
| `question-authoring.md` | Faculty | "New question" or AI-generate from QB sandbox |
| `assessment-building.md` | Faculty | "New assessment" from course |
| `pre-publication-review.md` | Chair | Faculty submits assessment for approval (optional path) |
| `assessment-delivery.md` | Student (Assessment Taker) | Email link OR direct login |
| `results-publication.md` | Faculty | Faculty publishes (or post-review-window auto-publish) |
| `scheduled-review-session.md` | Student | Faculty schedules session post-publication |

## Per-flow shape

Each workflow file:

1. Trigger
2. Preconditions
3. Steps (numbered; actor + action + system response)
4. Edge cases (≥3)
5. Error states + recovery
6. References (Aarti decisions, prototype/Magic Patterns, FRs)

(Empty until first workflow is written.)
