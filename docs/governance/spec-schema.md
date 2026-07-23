# Spec Schema — Export Bundle Format

> Defines the JSON schema for `docs/exports/v<version>/`. Other agents (MagicPatterns, Pencil.dev, custom tooling) consume the bundle to enforce the same DS rules and use the same patterns.
>
> Generator: `scripts/export-design-spec.py`. Source of truth: workspace `/DESIGN.md`, `docs/triggers.md`, `docs/patterns/`, `apps/<product>/`, `node tools/ds/source.mjs --list`.

---

## Bundle layout

```
docs/exports/v<X.Y.Z>/
├── README.md           # Auto-generated overview
├── meta.json           # Version, layers, axes, generated_at
├── rules.json          # Every DESIGN.md §4 rule
├── triggers.json       # User-prompt regex → action map
├── patterns.json       # Pattern catalogue
├── products.json       # Per-product overview
└── ds-snapshot.json    # Copy of canonical DS snapshot
```

## File schemas

### `meta.json`

```json
{
  "spec_name": "Exxat Design Intelligence",
  "version": "1.0.0",
  "generated_at": "2026-05-08T...",
  "lineage": "Inspired by Google's open-sourced DESIGN.md (May 2026)",
  "layers": ["L0 Foundations", "L1 Patterns", ...],
  "axes": ["Scholastic", "Deterministic", "Stochastic"],
  "phases_complete": ["P0 Keystone", ...]
}
```

### `rules.json`

Array of rule records. Every rule from DESIGN.md §4.

```json
[
  {
    "id": "DS-001",                              // Stable identifier
    "category": "DS",                            // DS | A11Y | VIZ | CONTENT | INTAKE | PERF | I18N
    "category_label": "Design System Conformance",
    "description": "No raw `<button>` in apps/**/*.tsx. Use DS Button with explicit variant + size.",
    "gate": "PreToolUse"                         // Where the rule is enforced
  }
]
```

**Categories** (as of v1.0.0):
- `DS` — 11 rules (Design System Conformance)
- `A11Y` — 9 rules (WCAG 2.2 AA + project rules)
- `VIZ` — 5 rules (Visualization Discipline)
- `CONTENT` — 4 rules (Voice, Glossary, Errors)
- `INTAKE` — 4 rules (Living Context)
- `PERF` — 6 rules (Performance Budgets)
- `I18N` — 4 rules (Internationalization Readiness)

**Gates** (free-form text — common values):
- `PreToolUse` — hook blocks at write time
- `Stop hook` — hook checks at agent stop
- `code review` — humans verify
- `Lighthouse CI` — CI workflow
- `architecture review` — design-time decision
- `governance` — quarterly review

### `triggers.json`

Array of regex → action mappings.

```json
[
  {
    "section": "Design intent (highest priority)",
    "pattern": "\\b(design|build|create|add)\\s+...",
    "action": "superpowers:brainstorming → mobbin search_screens → ..."
  }
]
```

**Section** is the markdown subsection header from `docs/triggers.md`.

### `patterns.json`

Array of pattern files in `docs/patterns/<category>/`.

```json
[
  {
    "category": "viz",
    "name": "bullet-vs-target",
    "title": "Bullet vs Target",
    "pattern_id": "VIZ-PATTERN-003",
    "question_answered": "Where does X stand vs target / cohort?",
    "path": "docs/patterns/viz/bullet-vs-target.md"
  }
]
```

The actual pattern body remains in markdown (too long for JSON; the path lets agents fetch it on demand).

### `products.json`

Per-product overview.

```json
[
  {
    "name": "exam-management",
    "design_md": "apps/exam-management/DESIGN.md",
    "storytelling_files": ["aarti-perspective.md", "ai-layer.md", ...],
    "decisions_count": 1
  }
]
```

`design_md` is `null` for products without a DESIGN.md (not yet scaffolded).

`storytelling_files` may be empty for unscaffolded products (only `README.md` scaffold exists).

`decisions_count` excludes `_template.md`, `_override-template.md`, and `README.md`.

### `ds-snapshot.json`

Copy of `node tools/ds/source.mjs --list`. See that file's structure — it's the DS surface map (admin profile + student profile, with components, hooks, exports, primitives, shared, tokens).

---

## Versioning

Bundle version = DESIGN.md `**Version:**` field.

| Bump | When |
|---|---|
| Patch (1.0.X) | Token additions, glossary edits, non-breaking pattern updates |
| Minor (1.X.0) | New rules, new patterns, new products, schema additions (backward-compatible) |
| Major (X.0.0) | Schema changes, rule removals, breaking restructure |

Past versions live as siblings (`docs/exports/v0.2.0/`, `docs/exports/v1.0.0/`, ...) so consumers can pin against a known schema.

## Stability guarantees

- **Rule IDs are forever.** Once a rule has an ID, that ID never gets reassigned. Removed rules become tombstones (`{"id": "X-NNN", "status": "deprecated", "reason": "..."}`).
- **Field names are stable within a major version.** Adding fields is OK; renaming requires a major bump.
- **`ds-snapshot.json` schema** is owned by the snapshot generator (`scripts/ds-snapshot.py`), not this export. Bumping the snapshot's internal `version` is independent.

## Consumer contract

A consumer using this bundle should:
1. Read `meta.json` first — verify version compatibility
2. Use `rules.json` for enforcement decisions
3. Use `ds-snapshot.json` for DS surface verification (DS-010 equivalent)
4. Use `triggers.json` to wire equivalent prompt-routing if the consumer is an agent
5. Reference `patterns.json` paths to fetch markdown bodies as needed

Don't try to derive rules from markdown by re-parsing — use `rules.json`. Markdown formatting changes don't bump the schema; JSON shape changes do.

## Re-exporting

Run after any of these changes:
- DESIGN.md edited (new rules, removed rules, version bump)
- New pattern added under `docs/patterns/`
- DS submodule updated (re-run snapshot first)
- New product added under `apps/`
- triggers.md edited

The post-merge git hook in `scripts/post-merge-ds-snapshot.sh` regenerates the snapshot. Consumers should re-pull the export bundle when they need fresh state.

## Future schema additions (planned)

- `events-schema.json` — telemetry event shapes (currently inline in `docs/telemetry/README.md`)
- `governance/exceptions.json` — machine-readable export of the override ledger
- `personas.json` — flattened per-product persona index
