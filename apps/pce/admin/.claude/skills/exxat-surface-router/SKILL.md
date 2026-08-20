---
name: exxat-surface-router
description: Select the smallest Exxat DS context packet by surface archetype. Use before opening DS docs for hub/list, record detail, overlay, focus workflow, navigation, charts, tokens, accessibility, or bug-fix work.
disable-model-invocation: true
---

# Exxat Surface Router

Run the helper first:

```bash
# Monorepo
node scripts/agent-context-router.mjs list
node scripts/agent-context-router.mjs <surface>

# Consumer app with @exxatdesignux/ui installed
exxat-ui context list
exxat-ui context <surface>
```

Use the returned packet as the context budget:

1. Read only the listed files/skills first.
2. Apply the quality checks from the packet.
3. Open optional docs only when the target file or task needs them.
4. Do not open `AGENTS.md` unless the packet or user asks for architecture/publish/checklist work.

Surfaces are DS archetypes, not product pages: `hub-list`, `record-detail`, `overlay`, `focus-workflow`, `navigation`, `chart-dashboard`, `token-theme`, `accessibility`, `bug-fix`.
