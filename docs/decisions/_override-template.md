---
type: decision
subtype: override
date: YYYY-MM-DD
product: workspace | <product>
status: Active | Sunset | Permanent-pending-amendment
source: conversation | intake
session:
overrides_rule: DS-NNN | A11Y-NNN | VIZ-NNN | CONTENT-NNN | INTAKE-NNN
overrides_pattern: docs/patterns/<category>/<name>.md  # if overriding a pattern, not a rule
sunset: <one-line criterion>
---

# Override ADR-NNN — <One-line description of the override>

## Status

Active | Sunset | Permanent-pending-DESIGN.md-amendment

## Context

What rule (or pattern) is being overridden, and what is the situation that doesn't fit it? Cite the rule ID + the rule's text (from DESIGN.md §4 or the pattern file). 1–2 paragraphs.

## Decision

We override `<RULE-ID>` for `<scope>` because `<rationale in one sentence>`.

**Scope:**
- File / directory: `<paths>` (or "single PR")
- Persona: `<admin|faculty|student|all>`
- Time bound: `<duration>`

**Rationale (the durable why):**

`<1–3 sentences. This is what future-you needs to judge whether the override should be lifted.>`

## Sunset criterion

Required. The override ends when:

- `<criterion>` (e.g., "Exxat-DS ships a `<NewComponent>` we currently lack")
- `<criterion>` (e.g., "Phase 2 begins; revisit then")
- "Permanent — propose amendment to DESIGN.md §4 to expand the rule" (in which case file a follow-up task to amend the spec)

If no sunset criterion is appropriate, the override is actually a **DESIGN.md amendment proposal** — file that instead.

## Alternatives considered

- **Comply with the rule** — rejected because `<reason>`
- **<other workaround>** — rejected because `<reason>`

## Consequences

- Positive: `<what this enables>`
- Negative: `<what this costs>` (e.g., "DS conformance audit will flag this until DESIGN.md is amended")
- Follow-up: `<actions required>` (e.g., "amend DESIGN.md §4 DS-NNN", "propose new DS component", "review at Phase 2")

## Affected files

- `<file path>` — `<what's non-conformant here>`
- `<file path>` — `<same>`

## Ledger

This override is tracked in `docs/governance/exceptions.md`. Update that ledger when status changes (Active → Sunset → Closed).
