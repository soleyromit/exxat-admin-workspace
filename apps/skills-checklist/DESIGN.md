# DESIGN.md — Skills Checklist

> Extends `/Users/romitsoley/Work/DESIGN.md` (workspace v0.1.0).
> L2 layer: product strategy, personas, workflows, content. L0/L4 rules inherit unchanged.

**Version:** 0.0.1 (2026-05-08 — scaffold, no product content yet)
**Owner:** Romit Soley
**Phase:** Not yet scaffolded — directory exists in `pnpm-workspace.yaml`, no app code, no design work.

---

## Inherited from workspace (2026-05-08)

This product inherits the cross-product architectural decisions from workspace `/DESIGN.md` §11–§15:

- §11 — Cross-product entity universe (master courses, students, faculty, competencies, accommodations, etc.)
- §12 — Module sellability + Prism launcher (this product opens in a new tab)
- §13 — Phase-1 persona collapse to 3 view tiers (admin / faculty / student)
- §14 — AI-first thinking pattern
- §15 — LMS-integration-first default

When this product is scaffolded, do NOT redefine these locally. Reference workspace `docs/decisions/` ADR-001..006.

---

## ⚠️ Status: SCAFFOLD ONLY

This file is a placeholder. **No product strategy, personas, or workflows are documented yet.**

The intake skill writes here when product work begins. Do not infer strategy from this file — it is empty by design until real meeting context, decisions, and personas are captured.

## When to fill this in

Triggered by the first real product input (Granola meeting, decision, persona research). After 3–5 meetings of context exist, promote this DESIGN.md from scaffold to v0.1.0.

## What we know today

| Field | Value |
|---|---|
| Admin package | `@exxat/skills-checklist-admin` |
| Admin port | 3007 |
| Student package | `@exxat/skills-checklist-student` |
| Student port | 3008 |
| Status | Not yet scaffolded |

Everything else awaits real input. Don't fabricate.
