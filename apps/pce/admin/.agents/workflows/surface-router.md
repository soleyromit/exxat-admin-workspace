---
description: Pick the smallest Exxat DS context packet before opening docs or editing files.
---

# /surface-router — Exxat DS context router

## When to use

- First turn on any Exxat DS feature, hub, overlay, or design change.
- User says "build X" but archetype is unclear.

## Steps

1. List surfaces:

   ```bash
   node scripts/agent-context-router.mjs list
   ```

2. Pick the closest archetype (`hub-list`, `record-detail`, `overlay`, `focus-workflow`, `navigation`, `chart-dashboard`, `token-theme`, `accessibility`, `bug-fix`).

3. Run:

   ```bash
   node scripts/agent-context-router.mjs <surface>
   ```

4. Read **only** the files listed in the packet.
5. Load skills from the packet (paths under `.agents/skills/`).
6. Open `docs/exxat-ds/component-selection-guide.md` **only** if the archetype is still ambiguous.

## Do not

- Open full `AGENTS.md` unless the packet or user asks for publish/architecture work.
- Open every `*-pattern.md` doc — follow the packet.
