# Design Intelligence Spec — Export Bundle v1.0.0

Generated: 2026-05-09T01:20:37+00:00

This directory is a **machine-readable export** of the workspace's design
intelligence harness. Any agent (MagicPatterns Agent 2.0, Pencil.dev SWARM,
or custom tooling) can consume this bundle to enforce the same DS rules
and use the same patterns that Claude Code follows.

## Files

| File | Purpose | Records |
|---|---|---|
| `meta.json` | Version, layers, axes, generation metadata | 1 |
| `rules.json` | Every DESIGN.md §4 rule with category + gate | 43 |
| `triggers.json` | User-prompt regex → action map | 24 |
| `patterns.json` | Pattern catalogue with paths + summaries | 26 |
| `products.json` | Per-product overview (DESIGN.md, storytelling, decisions count) | 5 |
| `ds-snapshot.json` | Copy of canonical DS snapshot (admin + student profiles) | — |

## Schema

See `docs/governance/spec-schema.md` for the full schema definition.

## How to consume

For an agent that wants to enforce the rules without reading markdown:

```python
import json

with open('rules.json') as f:
    rules = json.load(f)

# Find all PreToolUse-blocking rules
blocking = [r for r in rules if 'PreToolUse' in r['gate']]

# Find rules for a specific category
ds_rules = [r for r in rules if r['category'] == 'DS']
```

For DS component verification (mirrors what Claude's PreToolUse hook does):

```python
with open('ds-snapshot.json') as f:
    snap = json.load(f)

allowed_admin = set(snap['profiles']['admin']['exports'])
# Then: when generating an import from '@exxat/ds/packages/ui/src',
# check the imported name is in allowed_admin.
```

## Version policy

Bundle version = DESIGN.md version. Bump on rule add/remove/change. Past
versions live as siblings (e.g., `docs/exports/v0.2.0/`) so consumers
can pin against a known schema.

## Lineage

Inspired by Google's open-sourced DESIGN.md initiative (May 2026). See
`docs/governance/google-design-md-alignment.md` for schema alignment notes.
