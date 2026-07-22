# Google Antigravity ↔ Exxat DS parity map

**Audience:** developers using Google Antigravity IDE on this monorepo.

**Sync command:** `pnpm sync-agent-context` (or `pnpm sync-antigravity` for Antigravity only).

Copies **all** `.cursor/rules/*.mdc`, **all** `.cursor/skills/*`, and hook reference scripts into `.agents/`. Hand-maintained: `exxat-ds-router` skill + `workflows/`.

---

## Platform layout

| Concept | Google Antigravity | Cursor (source of truth) |
| --- | --- | --- |
| Always-on constraints | `.agents/rules/` + Customizations → Always On | `.cursor/rules/*.mdc` `alwaysApply: true` |
| Scoped constraints | `.agents/rules/` (glob / model decision) | `.cursor/rules/*.mdc` with `globs` |
| Procedures | `.agents/skills/<name>/SKILL.md` | `.cursor/skills/<name>/` |
| Slash commands | `.agents/workflows/*.md` | — (use chat + skills in Cursor) |
| Global user rules | `~/.gemini/GEMINI.md` | Cursor User Rules |
| Global skills | `~/.gemini/config/skills/` | `~/.cursor/skills/` |
| Job / pattern narrative | `apps/web/docs/` | shared |
| Machine index | `.agents/INDEX.yaml` + `apps/web/docs/INDEX.yaml` | `apps/web/docs/INDEX.yaml` |

Antigravity also supports legacy `.agent/rules` and `.agent/workflows` — this repo uses **`.agents/`** (preferred).

---

## Always-on rules (set Activation → Always On in Antigravity)

| File | Purpose |
| --- | --- |
| `_constitution.exxat-ds.md` | Ten commandments, precedence, UX router entry |
| `exxat-product-context.md` | Product / Scope / Persona in briefs |
| `exxat-product-routing.md` | Four-app URL roots, persistKey namespacing |
| `exxat-ux-discovery-protocol.md` | Brief-before-design gate |

---

## Workflows → Cursor equivalent

| Antigravity slash | Cursor workflow |
| --- | --- |
| `/surface-router` | `node scripts/agent-context-router.mjs <surface>` + `exxat-surface-router` skill |
| `/design-brief` | `exxat-senior-ux` skill + wait for user |
| `/build-hub` | `jobs/list-hub.md` + reference `library-table.tsx` |
| `/a11y-ship` | `pnpm a11y:axe:all --variants ship` + `exxat-accessibility` skill |
| `/ux-audit` | `exxat-ux-audit` skill |
| `/react-doctor` | `react-doctor` skill |

---

## Agent roles (docs)

| Role | Doc | When |
| --- | --- | --- |
| Hub builder | `hub-builder.md` | New list hub, columns, views |
| A11y guardian | `a11y-guardian.md` | Ship gate, axe failures |
| DS doc author | `ds-doc-author.md` | Generate primitive docs via OpenRouter |
| Senior UX | `senior-ux.md` | IA/layout decisions, briefs |

---

## Maintainer checklist

After editing `.cursor/rules`, `.cursor/skills`, or `.cursor/hooks`:

```bash
pnpm sync-agent-context
```

Or individually: `pnpm sync-claude`, `pnpm sync-antigravity`, `pnpm --filter @exxatdesignux/ui vendor:consumer-extras`, then `pnpm agent:context:validate`.

After editing workflows or agent role docs — commit directly (hand-authored).

Do **not** edit generated `.agents/rules/` or synced skills by hand — changes will be overwritten on next sync.

**Exception:** `.agents/skills/exxat-ds-router/` and `.agents/workflows/` are hand-maintained.

---

## SDK note

The **`google-antigravity-sdk`** Python package (global skill at `~/.gemini/config/plugins/google-antigravity-sdk/`) is for **autonomous SDK agents**, not this React monorepo. Use **`exxat-ds-router`** for Exxat DS web work here.
