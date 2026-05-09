# Exam Management — Research Insights

Distilled insights from rr-insights, customer interviews, ethnography, surveys.

## Naming

`YYYY-MM-DD-<short-slug>.md` — e.g., `2026-05-09-faculty-pb-distrust.md`.

Themes go in `themes/<slug>.md`.

## Frontmatter

```yaml
---
type: research-insight
date: YYYY-MM-DD
product: exam-management
source: rr-insights | interview | ethnography | survey | customer-call
study: <study name or ID>
participants: [P3, P5]   # IDs only — no PII
strength: <"4 of 5" | "single" | "n=12">
themes: [theme-slug-1]
personas_referenced: [Course Coordinator]
status: New | Distilled | Superseded
session: <claude-session-id>
---
```

## How to add one

Reference an insight in conversation:

- Paste with attribution: `"I never look at point-biserial." — Faculty 4 (P3 study)`
- Use `insight:` or `from rr-insights:` prefix
- Use `theme: ...` for cross-participant themes

The research-intake skill (`.claude/skills/research-intake/SKILL.md`) handles routing + distillation. Confirm-before-write per INTAKE-002/003.

## PII rule

**Participant IDs only.** No names, no emails, no identifying details. Even if rr-insights has them. The workspace doesn't need them; recovering from a leak is impossible.
