# Architecture Decision Records — Workspace

Workspace-level ADRs (cross-product or platform-wide). Per-product ADRs live at `apps/<product>/docs/decisions/`.

## How to add one

1. Don't write directly. Trigger the intake skill: type the decision out (e.g., "we're going with X because Y") and confirm the draft.
2. Numbering is sequential, three-digit zero-padded. The intake skill assigns the next number.
3. Status starts as `Proposed`. Move to `Accepted` after the decision sticks for a sprint. Mark `Superseded by ADR-NNN` when overridden — never delete.

See `_template.md`.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| 000 | Record architecture decisions | Accepted | 2026-05-08 |
| 001 | Program-level entity universe shared across all 5 products | Accepted | 2026-05-08 |
| 002 | LMS-integration-first default for all new modules | Accepted | 2026-05-08 |
| 003 | Independent module sellability + Prism module launcher | Accepted | 2026-05-08 |
| 004 | Phase-1 persona collapse to 3 view tiers | Accepted | 2026-05-08 |
| 005 | AI-first thinking pattern for analytics surfaces | Accepted | 2026-05-08 |
| 006 | Accommodations as a shared cross-product module | Accepted | 2026-05-08 |

(Updated by the intake skill when new ADRs are written.)
