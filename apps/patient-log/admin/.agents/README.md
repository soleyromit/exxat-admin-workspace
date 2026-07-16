# Exxat DS — Google Antigravity agent context

This folder mirrors the Cursor agent corpus (`.cursor/`) for **Google Antigravity IDE**.

| Artifact | Path | Cursor equivalent |
| --- | --- | --- |
| **Rules** | `.agents/rules/*.md` | `.agents/rules/*.mdc` |
| **Skills** | `.agents/skills/exxat-*/SKILL.md` | `.agents/skills/exxat-*/` |
| **Workflows** | `.agents/workflows/*.md` | — (slash commands) |
| **Index** | `.agents/INDEX.yaml` | `docs/exxat-ds/INDEX.yaml` |
| **Jobs / patterns** | `docs/exxat-ds/` | shared (not duplicated) |

## Quick start

1. Open this repo in **Google Antigravity**.
2. In **Customizations → Rules**, confirm these four are **Always On**:
   - `_constitution.exxat-ds.md`
   - `exxat-product-context.md`
   - `exxat-product-routing.md`
   - `exxat-ux-discovery-protocol.md`
3. Load skill **`exxat-ds-router`** or run workflow **`/surface-router`** on any DS task.

## Sync from Cursor (maintainers)

After editing `.cursor/rules` or `.agents/skills/exxat-*`:

```bash
npx exxat-ui sync-extras
```

Source of truth remains **`.cursor/`** in the monorepo; Antigravity copies are generated.

## Workflows (slash commands)

| Command | Purpose |
| --- | --- |
| `/surface-router` | Pick smallest context packet by archetype |
| `/design-brief` | Senior UX brief before IA/layout work |
| `/build-hub` | Scaffold or extend a list hub |
| `/a11y-ship` | Axe ship matrix + report |
| `/ux-audit` | Structured UX audit of a surface |
| `/react-doctor` | React health scan before commit |

## See also

- `docs/exxat-ds/agents/antigravity-parity.md` — full mapping table
- `docs/exxat-ds/agent-context-architecture.md` — layer model
- `./AGENTS.md` — ship checklist §13
