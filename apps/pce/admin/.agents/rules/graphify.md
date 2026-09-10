---
description: Use Graphify first for broad codebase discovery and architecture questions
activation: model_decision
---

<!-- Synced from .agents/rules/graphify.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Graphify (scoped rule; enforcement is the hook)

This file stays `alwaysApply: false` because the repo caps always-on rules at five. Agents still skip a constitution one-liner when Glob cannot see gitignored `graphify-out/`. The floor is **`.cursor/hooks/exxat-graphify-gate.mjs`** plus the sessionStart Graphify block.

## MUST

- Treat `graphify-out/graph.json` as present unless a Shell `test -f graphify-out/graph.json` fails. Do **not** Glob `graphify-out/**`.
- For architecture, dependency, impact, ownership, or broad "where/how" questions, run via Shell **before** Grep, Glob, or explore agents:

```bash
graphify query "<question>" --budget 1200
```

- Use `graphify path "<A>" "<B>"` for cross-module relationships and `graphify explain "<symbol>"` for one concept.
- Read only the source files and locations Graphify returns.
- After substantive code edits, run `graphify update .` from the repo root.

## MUST NOT

- Do not read `GRAPH_REPORT.md` in full (hundreds of KB). Query instead.
- Do not use Graphify instead of reading a known target file, reviewing a diff, or running tests. It narrows context; source and runtime evidence remain authoritative.
