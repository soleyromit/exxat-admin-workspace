# Google DESIGN.md — Schema Alignment

> Track what Google's open-sourced DESIGN.md initiative (May 2026) shares with this workspace's spec, and where they diverge.
>
> **Status:** placeholder. Populate as Google publishes their schema and as we evaluate alignment opportunities.

---

## Why this exists

Google open-sourced DESIGN.md as part of Material 3.5 / open agentic UI tooling effort (May 2026). The premise — a workspace-rooted scholastic spec that any agent can read — is the same as ours. If we can keep our schema close to Google's, two benefits:

1. Tools built for Google's ecosystem (open-source pattern libraries, agent harnesses) become consumable for us with minimal adaptation.
2. Our spec becomes consumable by tools built for theirs, reducing lock-in to Claude Code.

## What we know about Google's schema (as of 2026-05-08)

- Top-level `DESIGN.md` lives at workspace root
- Layers terminology overlaps with our L0–L7 model (Google calls them "tiers" but the concept maps)
- Material design tokens have schema parity with shadcn-style `--color-*` / `--radius-*` / `--font-*` patterns
- Pattern catalogue concept exists but Google packages them differently (their patterns are component-coupled, ours are workspace-level)

(Refine this section as Google publishes their canonical schema doc.)

## Where we align by default

| Concept | Ours | Google's | Aligned? |
|---|---|---|---|
| Workspace-root `DESIGN.md` | ✅ | ✅ | yes |
| Versioning at file top | ✅ semver | ✅ semver | yes |
| Per-product extension | ✅ (apps/<product>/DESIGN.md) | TBD | likely yes |
| Rules with stable IDs | ✅ DS-001 etc. | TBD | likely yes |
| Token references via CSS custom properties | ✅ | ✅ | yes |
| Pattern files in `docs/patterns/<category>/` | ✅ | TBD | partial |
| Stakeholder narrative (L7 storytelling) | ✅ | TBD | unknown — may be unique to us |

## Where we diverge by intent

| Concept | Ours | Why |
|---|---|---|
| Storytelling layer (L7) | Stakeholder voice + product narrative + use cases per product | Captures the "why" behind decisions in a way generic spec docs don't. May not have a Google equivalent. |
| Aarti/Vishaka perspective files | Per-stakeholder voice extraction | Specific to our org's stakeholder model. Generic equivalents would be "designer" / "PM" / "engineer" perspectives. |
| Per-product DS-profile switching | admin / student / assessment-taker | Specific to Exxat's multi-app architecture. Generic agents wouldn't need this. |
| Override ledger (governance/exceptions.md) | Workspace-tracked | Specific governance choice; equivalent could be Google PR descriptions. |

## Open alignment questions

These need an explicit decision once Google's schema is more concrete:

1. **Rule ID prefix.** We use `DS-NNN`, `A11Y-NNN`, `VIZ-NNN`. Google might use `RULE.MATERIAL.NNN` or similar. Worth aligning if migration cost is low.
2. **Pattern manifest format.** Our `patterns.json` is a flat list with paths. Google might use a nested category tree. Could expose both views.
3. **DS surface format.** Our `ds-snapshot.json` is workspace-specific. If Google ships a generic `ds-surface.json` schema, generate both.
4. **Trigger map.** Our `triggers.json` is regex → action. Google might use a more structured event/handler model. May be agent-specific.

## Migration plan (if/when needed)

If Google's schema diverges meaningfully and we want to align:

1. Spec the gap in an ADR
2. Update `scripts/export-design-spec.py` to emit Google-shaped JSON alongside our format (`docs/exports/v<version>/google/`)
3. Or: add a translation layer in the consumer agents

## What to track

- Google's published schema URL (link here when available)
- Their rule ID convention
- Their pattern manifest format
- Their treatment of stakeholder narrative (if any)
- Any open-source agent harnesses that consume Google's format (so we know who'd benefit from alignment)

(Update this doc as Google's initiative matures.)
