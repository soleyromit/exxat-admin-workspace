#!/usr/bin/env python3
"""Export the design intelligence spec as a machine-readable bundle.

Produces docs/exports/v<version>/ — a directory of JSON files that any
non-Claude agent (MagicPatterns Agent 2.0, Pencil.dev SWARM, custom tooling)
can consume to enforce the same DS rules and use the same patterns.

Outputs:
  meta.json       — version, layers, axes, generated_at
  rules.json      — every DS-NNN / A11Y-NNN / VIZ-NNN / CONTENT-NNN /
                    INTAKE-NNN / PERF-NNN / I18N-NNN rule with gate + path
  triggers.json   — user-prompt regex → action map
  patterns.json   — pattern catalogue with metadata (category, path, summary)
  products.json   — per-product overview (DESIGN.md, storytelling files)
  ds-snapshot.json — copy of canonical snapshot for portability
  README.md       — what's in this bundle and how to consume it

Schema: docs/governance/spec-schema.md
Versioning: matches DESIGN.md version field
Run via: python3 scripts/export-design-spec.py [--out <dir>]
"""
import argparse
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path


WORKSPACE = Path("/Users/romitsoley/Work")
DESIGN_MD = WORKSPACE / "DESIGN.md"
TRIGGERS_MD = WORKSPACE / "docs/triggers.md"
DS_SNAPSHOT = WORKSPACE / "`node tools/ds/source.mjs --list`"
PATTERNS_DIR = WORKSPACE / "docs/patterns"
APPS_DIR = WORKSPACE / "apps"
DEFAULT_OUT_BASE = WORKSPACE / "docs/exports"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--out", default=None,
                   help="Output dir; defaults to docs/exports/v<version>/")
    return p.parse_args()


def read_design_version() -> str:
    if not DESIGN_MD.exists():
        return "0.0.0"
    text = DESIGN_MD.read_text()
    m = re.search(r"\*\*Version:\*\*\s*(\d+\.\d+\.\d+)", text)
    return m.group(1) if m else "0.0.0"


def parse_rules() -> list[dict]:
    """Extract every rule line from DESIGN.md §4."""
    if not DESIGN_MD.exists():
        return []
    text = DESIGN_MD.read_text()

    # Slice §4 (Rules Catalogue) until next top-level section
    section_match = re.search(r"##\s+4\.\s+Rules Catalogue([\s\S]+?)(?=\n##\s+\d+\.|---\s*\n##|\Z)", text)
    if not section_match:
        return []
    section = section_match.group(1)

    rules: list[dict] = []
    current_category: str | None = None
    rule_re = re.compile(
        r"^-\s+\*\*([A-Z0-9-]+-\d+)\*\*\s+(?:\([^)]+\)\s+)?—\s+(.+?)(?=\*Gate:\*|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    gate_re = re.compile(r"\*Gate:\*\s*([^.]+?)(?=\.|\n|$)", re.DOTALL)
    cat_re = re.compile(r"^###\s+([A-Z0-9]+)\s*—\s*(.+?)$", re.MULTILINE)

    # Walk line-by-line so we can carry the current category through rules
    pos = 0
    cat_iter = list(cat_re.finditer(section))
    for i, cat_m in enumerate(cat_iter):
        cat_id = cat_m.group(1).strip()
        cat_label = cat_m.group(2).strip()
        start = cat_m.end()
        end = cat_iter[i + 1].start() if i + 1 < len(cat_iter) else len(section)
        cat_body = section[start:end]

        for rm in rule_re.finditer(cat_body):
            rule_id = rm.group(1).strip()
            description = rm.group(2).strip()
            gate_m = gate_re.search(description)
            gate = gate_m.group(1).strip() if gate_m else ""
            # Strip the *Gate:* clause from description for cleanliness
            description = gate_re.sub("", description).strip().rstrip(".").strip()
            rules.append({
                "id": rule_id,
                "category": cat_id,
                "category_label": cat_label,
                "description": description,
                "gate": gate,
            })

    return rules


def parse_triggers() -> list[dict]:
    """Extract trigger pattern → action map from docs/triggers.md."""
    if not TRIGGERS_MD.exists():
        return []
    text = TRIGGERS_MD.read_text()
    triggers: list[dict] = []
    section_re = re.compile(r"^###\s+(.+?)$", re.MULTILINE)
    # Match a markdown table row whose first column contains backtick-wrapped
    # content. Allow escaped pipes (\|) inside the regex pattern. Capture the
    # second column up to the closing pipe.
    row_re = re.compile(
        r"^\|\s*`([^`]+)`[^|]*\|\s*(.+?)\s*\|",
        re.MULTILINE,
    )

    sections = list(section_re.finditer(text))
    for i, section_m in enumerate(sections):
        section_label = section_m.group(1).strip()
        if section_label.lower().startswith("priority"):
            continue
        start = section_m.end()
        end = sections[i + 1].start() if i + 1 < len(sections) else len(text)
        body = text[start:end]
        for rm in row_re.finditer(body):
            pattern = rm.group(1).strip()
            action = rm.group(2).strip()
            triggers.append({
                "section": section_label,
                "pattern": pattern,
                "action": action,
            })

    return triggers


def parse_patterns() -> list[dict]:
    """Walk docs/patterns/<category>/ for pattern files."""
    if not PATTERNS_DIR.exists():
        return []
    patterns: list[dict] = []
    for category_dir in sorted(PATTERNS_DIR.iterdir()):
        if not category_dir.is_dir():
            continue
        for pattern_file in sorted(category_dir.glob("*.md")):
            text = pattern_file.read_text()
            # Pattern ID
            id_m = re.search(r"\*\*Pattern ID:\*\*\s*`([^`]+)`", text)
            # First-paragraph "question answered" or top heading
            q_m = re.search(r"\*\*Question answered:\*\*\s*(.+?)\n", text)
            # Title (first H1)
            title_m = re.search(r"^#\s+(.+?)$", text, re.MULTILINE)
            patterns.append({
                "category": category_dir.name,
                "name": pattern_file.stem,
                "title": title_m.group(1).strip() if title_m else pattern_file.stem,
                "pattern_id": id_m.group(1) if id_m else None,
                "question_answered": q_m.group(1).strip() if q_m else None,
                "path": str(pattern_file.relative_to(WORKSPACE)),
            })
    return patterns


def parse_products() -> list[dict]:
    """Per-product overview: paths to DESIGN.md + storytelling files + decisions count."""
    if not APPS_DIR.exists():
        return []
    products: list[dict] = []
    for product_dir in sorted(APPS_DIR.iterdir()):
        if not product_dir.is_dir():
            continue
        # Skip hidden dirs and non-product dirs (apps/.claude, apps/docs)
        if product_dir.name.startswith("."):
            continue
        if product_dir.name in {"docs", "node_modules"}:
            continue
        # A product is a dir with either DESIGN.md or package.json
        design_md = product_dir / "DESIGN.md"
        if not design_md.exists() and not (product_dir / "package.json").exists():
            continue
        product_name = product_dir.name
        storytelling = product_dir / "docs/storytelling"
        decisions = product_dir / "docs/decisions"

        storytelling_files: list[str] = []
        if storytelling.exists():
            for f in sorted(storytelling.glob("*.md")):
                storytelling_files.append(f.name)

        decision_count = 0
        if decisions.exists():
            decision_count = sum(
                1 for d in decisions.glob("*.md")
                if not d.name.startswith("_") and d.name.upper() != "README.MD"
            )

        products.append({
            "name": product_name,
            "design_md": str(design_md.relative_to(WORKSPACE)) if design_md.exists() else None,
            "storytelling_files": storytelling_files,
            "decisions_count": decision_count,
        })
    return products


def write_readme(out_dir: Path, version: str, generated_at: str, counts: dict) -> None:
    content = f"""# Design Intelligence Spec — Export Bundle v{version}

Generated: {generated_at}

This directory is a **machine-readable export** of the workspace's design
intelligence harness. Any agent (MagicPatterns Agent 2.0, Pencil.dev SWARM,
or custom tooling) can consume this bundle to enforce the same DS rules
and use the same patterns that Claude Code follows.

## Files

| File | Purpose | Records |
|---|---|---|
| `meta.json` | Version, layers, axes, generation metadata | 1 |
| `rules.json` | Every DESIGN.md §4 rule with category + gate | {counts['rules']} |
| `triggers.json` | User-prompt regex → action map | {counts['triggers']} |
| `patterns.json` | Pattern catalogue with paths + summaries | {counts['patterns']} |
| `products.json` | Per-product overview (DESIGN.md, storytelling, decisions count) | {counts['products']} |
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
"""
    (out_dir / "README.md").write_text(content)


def main() -> None:
    args = parse_args()
    version = read_design_version()
    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    out_dir = Path(args.out) if args.out else DEFAULT_OUT_BASE / f"v{version}"
    out_dir.mkdir(parents=True, exist_ok=True)

    rules = parse_rules()
    triggers = parse_triggers()
    patterns = parse_patterns()
    products = parse_products()

    meta = {
        "spec_name": "Exxat Design Intelligence",
        "version": version,
        "generated_at": generated_at,
        "lineage": "Inspired by Google's open-sourced DESIGN.md (May 2026)",
        "layers": [
            "L0 Foundations", "L1 Patterns", "L2 Product UX", "L3 Process",
            "L4 Quality Gates", "L5 Governance", "L7 Storytelling",
        ],
        "axes": ["Scholastic", "Deterministic", "Stochastic"],
        "phases_complete": [
            "P0 Keystone", "P1 Scholastic enforcement", "P2 Living context",
            "P3 Pattern library", "P4 Stochastic variance",
            "P5 Designer override loop", "P5.5 DS conformance hardening",
            "P6 Process & telemetry", "P7 Performance & i18n",
            "P8 Platform-agnostic packaging",
        ],
    }

    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2))
    (out_dir / "rules.json").write_text(json.dumps(rules, indent=2))
    (out_dir / "triggers.json").write_text(json.dumps(triggers, indent=2))
    (out_dir / "patterns.json").write_text(json.dumps(patterns, indent=2))
    (out_dir / "products.json").write_text(json.dumps(products, indent=2))

    if DS_SNAPSHOT.exists():
        shutil.copy2(DS_SNAPSHOT, out_dir / "ds-snapshot.json")

    counts = {
        "rules": len(rules),
        "triggers": len(triggers),
        "patterns": len(patterns),
        "products": len(products),
    }
    write_readme(out_dir, version, generated_at, counts)

    rel = out_dir.relative_to(WORKSPACE)
    print(f"Spec exported → {rel}/")
    for k, v in counts.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
