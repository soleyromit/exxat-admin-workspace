# Exam Management — Hub-File Mirror

Local, git-tracked mirror of frequently-referenced files from the **Anthropic Project (Insights Hub)**: PDFs, screenshots, research PDFs, customer materials, slide decks.

## Why this exists

The Anthropic Project hub stores files outside the workspace. Claude can read them only when explicitly attached. Mirroring the most-used ones here gives every session direct file-system access without re-attaching, and keeps them git-tracked alongside the artifacts that cite them. See `docs/governance/context-architecture.md` §6 Tier 1 #2.

## What goes here

| Mirror | Don't mirror |
|---|---|
| Files cited by ≥2 ADRs / personas / patterns | One-off references |
| Reference materials Aarti / Vishaka cite repeatedly | Drafts, working files |
| Customer-facing materials still in active use | Files >5MB unless essential (use Git LFS or skip) |
| Stable references (CAPTE 2D template, ExamSoft comparison sheets) | Anything with PII (participant names, emails) |

## Naming

`<source>-<topic>-<YYYY-MM-DD>.<ext>`

Examples:
- `aarti-curricular-loop-diagram-2026-05-06.png`
- `examsoft-feature-parity-2026-05-07.pdf`
- `capte-2d-template-2026-04-30.pdf`

## Index file

Every mirrored file MUST have a one-line entry in `INDEX.md` (next to this README) so search works without opening files:

```
| File | Source | Cited by | Date |
|---|---|---|---|
| aarti-curricular-loop-diagram-2026-05-06.png | Aarti screenshare 2026-05-06 | aarti-perspective.md, ADR-001 | 2026-05-06 |
```

## When to mirror

Trigger: when adding the same external reference to a 2nd ADR / persona / pattern.

Process: download from Anthropic Project → save with naming convention → add row to INDEX.md → commit. Reference in the citing artifact as `apps/exam-management/docs/research/hub-files/<filename>`.

## PII rule

Same as `insights/`. Strip names, emails, identifying details before mirroring. If a hub file contains PII, redact-or-skip — never mirror raw.

## Out of scope

- Live Granola transcripts → already accessible via `mcp__claude_ai_Granola__*`
- rr-insights live data → research-intake skill handles distillation
- DS source files → already in the `exxat-ds/` and `studentUX/` submodules
