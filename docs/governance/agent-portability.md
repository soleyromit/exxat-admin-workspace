# Agent Portability Guide

> The design intelligence harness was built for Claude Code, but the **rules, patterns, and DS surface are platform-agnostic**. This guide explains how MagicPatterns Agent 2.0, Pencil.dev SWARM, custom tooling, or any other AI/automation can consume the same spec and enforce the same conformance.

---

## What's Claude-specific vs portable

| Surface | Claude-specific | Portable |
|---|---|---|
| `.claude/hooks/*.py` | ✅ | — (other agents wire their own equivalents) |
| `.claude/skills/*.md` | ✅ | — |
| `.claude/commands/*.md` | ✅ | — |
| `/DESIGN.md` (rules + spec) | — | ✅ |
| `docs/triggers.md` (regex → action map) | partially | ✅ (regex is portable; action handlers are agent-specific) |
| `docs/patterns/**` (pattern catalogue) | — | ✅ |
| `node tools/ds/source.mjs --list` | — | ✅ |
| `apps/<product>/docs/storytelling/**` | — | ✅ |
| `docs/exports/v<version>/` | — | ✅ (this is THE consumer-facing bundle) |

**Bottom line:** the export bundle at `docs/exports/v<version>/` IS the portable contract. Every other tool consumes it.

## How to consume the export bundle

### 1. Pin a version

```python
import json
from pathlib import Path

EXPORT_DIR = Path("docs/exports/v1.0.0")
meta = json.loads((EXPORT_DIR / "meta.json").read_text())
assert meta["version"].startswith("1."), f"Pinned to v1.x, got {meta['version']}"
```

### 2. Enforce DS rules at write time

Mirror Claude's PreToolUse hook (`/Users/romitsoley/Work/.claude/hooks/pre-tool-use.py`):

```python
import json
import re

snapshot = json.loads((EXPORT_DIR / "ds-snapshot.json").read_text())
admin_exports = set(snapshot["profiles"]["admin"]["exports"])

def check_admin_imports(file_content: str) -> list[str]:
    """Return list of hallucinated DS imports."""
    violations = []
    pattern = re.compile(
        r"import\s+\{([^}]+)\}\s+from\s+['\"]@exxat/ds/packages/ui/src['\"]"
    )
    for m in pattern.finditer(file_content):
        for raw in m.group(1).split(","):
            name = raw.strip().split(" as ")[0].strip()
            if name and name not in admin_exports:
                violations.append(f"DS-010: hallucinated import '{name}'")
    return violations
```

Same logic for student primitives (use `snapshot["profiles"]["student"]["primitives"]`) and shared (`snapshot["profiles"]["student"]["shared"]`).

### 3. Look up a rule by ID

```python
rules = json.loads((EXPORT_DIR / "rules.json").read_text())
ds_010 = next((r for r in rules if r["id"] == "DS-010"), None)
print(ds_010["description"])
print(ds_010["gate"])
```

### 4. Wire equivalent prompt routing

For agents that intercept user prompts:

```python
triggers = json.loads((EXPORT_DIR / "triggers.json").read_text())

def match_prompt(prompt: str) -> list[dict]:
    matched = []
    for t in triggers:
        try:
            if re.search(t["pattern"], prompt, re.IGNORECASE):
                matched.append(t)
        except re.error:
            continue
    return matched
```

The `action` field is free-form text describing what to do (e.g., "intake skill action=adr-draft"). Different agents will have different ways of executing it; the action labels are conceptual handles, not callable APIs.

### 5. Use the pattern catalogue

```python
patterns = json.loads((EXPORT_DIR / "patterns.json").read_text())
viz_patterns = [p for p in patterns if p["category"] == "viz"]

# Fetch the pattern body (markdown) on demand:
for p in viz_patterns:
    body = Path(p["path"]).read_text()
```

Patterns are markdown with embedded code recipes. Agents that need structured pattern data should request the L1 layer's `patterns.json` for metadata and lazy-fetch the markdown when generating.

### 6. Per-product context

```python
products = json.loads((EXPORT_DIR / "products.json").read_text())
exam_mgmt = next((p for p in products if p["name"] == "exam-management"), None)

if exam_mgmt["design_md"]:
    product_design = Path(exam_mgmt["design_md"]).read_text()

# Storytelling files (long-form narrative)
for fname in exam_mgmt["storytelling_files"]:
    sf_path = Path(f"apps/{exam_mgmt['name']}/docs/storytelling/{fname}")
    body = sf_path.read_text()
```

## Equivalent surfaces in non-Claude agents

| Claude surface | Generic equivalent | What it does |
|---|---|---|
| SessionStart hook (Python) | Agent init / startup script | Resolve active product + DS profile from cwd |
| UserPromptSubmit hook (Python) | Prompt preprocessor | Match `triggers.json` regexes; surface required actions |
| PreToolUse hook (Python) | Pre-write validator | Check `rules.json` (DS-010 against `ds-snapshot.json`); block on violation |
| Skills (markdown procedures) | Agent's own playbook system | Mirror the procedural docs |
| Slash commands (markdown) | Agent's command system | Mirror the command surface |
| Memory (markdown files) | Agent's persistent state | The intake skill writes durable artifacts; memory is for ephemeral state |

## What you DON'T need to mirror

- The intake skill's specific implementation (you can implement intake your own way as long as the resulting artifacts go to `docs/decisions/`, `docs/research/meetings/`, `apps/<product>/docs/storytelling/`)
- The telemetry write helper (you can write to your own log; the analyzer just reads JSONL)
- The /design-variants slash command (you can spawn parallel agents your own way; the pattern at `docs/patterns/process/design-variants.md` describes the conceptual flow)

## Schema versioning

Pin your consumer to a major version. When the spec bumps minor, no breaking changes — your code keeps working. When it bumps major, expect schema-level changes; review the changelog at `docs/governance/spec-schema.md` and update.

## Lineage

This architecture is inspired by Google's open-sourced DESIGN.md initiative (May 2026). Schema-alignment notes — what's shared, what diverges — live at `docs/governance/google-design-md-alignment.md` (placeholder; populate as Google publishes their schema and we evaluate).

## Contributing back

If your agent enforces a rule that should be in DESIGN.md §4, file an ADR proposing the addition. The export bundle is a one-way artifact today (Claude → others), but the rule catalogue is intended to be portable across the whole agent ecosystem we work with.
