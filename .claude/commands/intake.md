---
description: Force-route the current selection / next paste through the intake skill (transcript save, ADR draft, glossary entry, or persona update). Use when the auto-trigger didn't fire or when you want to be explicit.
---

Invoke the intake skill (`.claude/skills/intake/SKILL.md`) on the user's intent or pasted content.

## Routing

If `$ARGUMENTS` is empty:
- Treat the most recent user turn as the intake input.
- Auto-detect format: transcript (Granola pattern), decision text, glossary proposal, or persona note.
- Route to the matching playbook in the skill.

If `$ARGUMENTS` is provided:
- `transcript` — force transcript-paste flow (extract decisions, glossary, personas; confirm each)
- `adr` or `decision` — force ADR draft flow
- `glossary` or `term` — force glossary-add flow
- `persona` — force persona-update flow
- `granola <query>` — force Granola query flow (pull recent meetings matching the query)

## Behavior

- Resolve active product from cwd (per the skill).
- Confirm before every write — non-negotiable per INTAKE-002 / INTAKE-003.
- Surface paths created/updated, ADR numbers assigned, glossary terms added.
- After completion, return control to the prior task.
