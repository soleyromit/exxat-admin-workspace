# DESIGN.md — Patient Log

> Extends `/Users/romitsoley/Work/DESIGN.md` (workspace v0.1.0).
> L2 layer: product strategy, personas, workflows, content. L0/L4 rules inherit unchanged.

**Version:** 0.0.1 (2026-05-08 — scaffold, no product content yet)
**Owner:** Romit Soley
**Phase:** Not yet scaffolded — directory exists in `pnpm-workspace.yaml`, no app code, no design work.

---

## ⚠️ Status: SCAFFOLD ONLY

This file is a placeholder. **No product strategy, personas, or workflows are documented yet.**

The intake skill is configured to write here when product work begins. Do not infer strategy from this file — it is empty by design until real meeting context, decisions, and personas are captured.

## When to fill this in

Triggered by:
- First Granola transcript referencing patient-log → INTAKE-001 saves to `docs/research/meetings/`
- First decision about scope, persona, or workflow → INTAKE-002 saves an ADR to `docs/decisions/`
- First glossary term → INTAKE-003 writes to `docs/content.md`

After 3–5 meetings worth of context exists, this DESIGN.md should be promoted from scaffold to v0.1.0 with sections matching the PCE / Exam Management template:

1. North star
2. Principles
3. Personas — see `docs/personas.md`
4. Workflows — see `docs/workflows/`
5. Content — see `docs/content.md`
6. Design references
7. Active build status
8. Open product questions

## What we know today

| Field | Value |
|---|---|
| Admin package | `@exxat/patient-log-admin` |
| Admin port | 3003 |
| Student package | `@exxat/patient-log-student` |
| Student port | 3004 |
| Status | Not yet scaffolded |

That's it. Everything else awaits real input.

## How to extend this file

Don't write hypothetical content. Use the intake skill on real context.
