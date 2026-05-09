#!/usr/bin/env python3
"""Backlink audit — Tier 1 #3 of context-architecture.md §6.

Walks ADRs, storytelling perspectives, and patterns; reports artifacts
that are missing source citations. The point is to keep the workspace's
implicit knowledge graph tight: every decision should cite its origin
meeting/insight, every persona section should be dated, every pattern
should bind to a workspace ADR or DESIGN.md rule.

Run from the repo root:

    python3 scripts/backlink-audit.py             # full report
    python3 scripts/backlink-audit.py --strict    # exit 1 if any gaps
    python3 scripts/backlink-audit.py --json      # machine-readable

What it checks
--------------
ADRs (docs/decisions/, apps/<product>/docs/decisions/):
- frontmatter has `source:` (granola | research | design-review | self | external)
- if source=granola → also has `granola_meeting:` (UUID-ish)
- if source=research → also has `insight_ref:` or `insight_path:`
- body has a `## Context` or `## Background` section

Storytelling (apps/<product>/docs/storytelling/<persona>-perspective.md):
- contains at least one dated quote anchor (`— YYYY-MM-DD`)
- has at least one ADR or use-case backref (link to decisions/ or use-cases.md)

Patterns (docs/patterns/<category>/<name>.md, excluding RUBRIC.md):
- has a `**Pattern ID:**` line
- has a `**Binds rules:**` line citing workspace ADR or DESIGN.md rule code

What it does NOT check
----------------------
- Whether the cited file actually exists (would require resolving) —
  Phase 2 if the audit shows enough cite churn to warrant it.
- READMEs, index files (`INDEX.md`, `README.md`) — they're navigation
  not knowledge artifacts.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# ----------------------------------------------------------------------
# helpers


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""


def parse_frontmatter(text: str) -> dict[str, str]:
    """Tiny YAML-frontmatter parser — flat key:value only, good enough."""
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    out: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ":" not in line or line.strip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        out[key.strip()] = value.strip().strip("'\"")
    return out


# ----------------------------------------------------------------------
# audit data shape


@dataclass
class Gap:
    artifact: str        # "adr" | "storytelling" | "pattern"
    path: str            # repo-relative
    rule: str            # short code, e.g., "missing-source"
    message: str

    def to_dict(self) -> dict[str, str]:
        return {
            "artifact": self.artifact,
            "path": self.path,
            "rule": self.rule,
            "message": self.message,
        }


@dataclass
class Report:
    gaps: list[Gap] = field(default_factory=list)
    files_checked: int = 0

    def add(self, gap: Gap) -> None:
        self.gaps.append(gap)


# ----------------------------------------------------------------------
# audit: ADRs

GRANOLA_ID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}", re.IGNORECASE)
CONTEXT_HEADING_RE = re.compile(r"^##+\s+(Context|Background)\b", re.IGNORECASE | re.MULTILINE)


def audit_adr(path: Path, report: Report) -> None:
    rel = str(path.relative_to(REPO_ROOT))
    if path.name in {"README.md", "_override-template.md", "000-record-architecture-decisions.md"}:
        return
    report.files_checked += 1
    text = read(path)
    fm = parse_frontmatter(text)

    source = fm.get("source")
    if not source:
        report.add(Gap("adr", rel, "missing-source",
                       "no `source:` in frontmatter (should be: granola | research | design-review | self | external)"))
        return  # downstream checks depend on source

    if source == "granola":
        gm = fm.get("granola_meeting", "")
        if not gm:
            report.add(Gap("adr", rel, "missing-granola-meeting",
                           "source=granola but no `granola_meeting:` UUID in frontmatter"))
        elif not GRANOLA_ID_RE.match(gm):
            report.add(Gap("adr", rel, "bad-granola-id",
                           f"`granola_meeting: {gm}` doesn't look like a UUID (expected 8-4-4-4-12 hex)"))

    elif source == "research":
        if not (fm.get("insight_ref") or fm.get("insight_path")):
            report.add(Gap("adr", rel, "missing-insight-ref",
                           "source=research but no `insight_ref:` or `insight_path:` pointing to research/insights/"))

    if not CONTEXT_HEADING_RE.search(text):
        report.add(Gap("adr", rel, "missing-context-section",
                       "no `## Context` or `## Background` heading — readers won't know why this decision was made"))


# ----------------------------------------------------------------------
# audit: storytelling

DATED_QUOTE_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
BACKREF_RE = re.compile(r"\b(ADR-\d{3}|UC-\d{2}|use-cases\.md|decisions/)\b")


def audit_storytelling(path: Path, report: Report) -> None:
    if path.name in {"README.md", "INDEX.md"}:
        return
    rel = str(path.relative_to(REPO_ROOT))
    report.files_checked += 1
    text = read(path)

    # use-cases.md is a case catalog (not a perspective), vision/principles/ai-layer
    # are narrative-only by design. None of them need dated quotes or backref-to-ADR.
    skip_names = {"vision.md", "experience-principles.md", "ai-layer.md", "use-cases.md"}
    if path.name in skip_names:
        return

    is_perspective = "perspective" in path.name

    if is_perspective and not DATED_QUOTE_RE.search(text):
        report.add(Gap("storytelling", rel, "no-dated-content",
                       "no `YYYY-MM-DD` references at all — perspectives must be dated to track when views shifted"))

    if is_perspective and not BACKREF_RE.search(text):
        report.add(Gap("storytelling", rel, "no-backrefs",
                       "no link to ADR / UC / decisions/ — perspective files should cite the decisions/use-cases they shape"))


# ----------------------------------------------------------------------
# audit: patterns

PATTERN_ID_RE = re.compile(r"\*\*Pattern ID:\*\*\s+`?[A-Z][A-Z0-9_-]*-\d{3}`?")
BINDS_RULES_RE = re.compile(r"\*\*Binds rules?:\*\*", re.IGNORECASE)


def audit_pattern(path: Path, report: Report) -> None:
    if path.name in {"README.md", "RUBRIC.md", "INDEX.md"}:
        return
    rel = str(path.relative_to(REPO_ROOT))
    report.files_checked += 1
    text = read(path)

    if not PATTERN_ID_RE.search(text):
        report.add(Gap("pattern", rel, "missing-pattern-id",
                       "no `**Pattern ID:** XXX-NNN` line"))

    if not BINDS_RULES_RE.search(text):
        report.add(Gap("pattern", rel, "missing-binds-rules",
                       "no `**Binds rules:**` line — pattern should bind to workspace ADR or DESIGN.md rule code"))


# ----------------------------------------------------------------------
# walkers


def walk_adrs(report: Report) -> None:
    for base in [REPO_ROOT / "docs" / "decisions", *((REPO_ROOT / "apps").glob("*/docs/decisions"))]:
        if not base.is_dir():
            continue
        for path in sorted(base.glob("*.md")):
            audit_adr(path, report)


def walk_storytelling(report: Report) -> None:
    for base in (REPO_ROOT / "apps").glob("*/docs/storytelling"):
        for path in sorted(base.glob("*.md")):
            audit_storytelling(path, report)


def walk_patterns(report: Report) -> None:
    base = REPO_ROOT / "docs" / "patterns"
    if not base.is_dir():
        return
    for path in sorted(base.rglob("*.md")):
        audit_pattern(path, report)


# ----------------------------------------------------------------------
# output


def print_human(report: Report) -> None:
    if not report.gaps:
        print(f"✓ All {report.files_checked} artifacts have backlinks. No gaps.")
        return

    by_artifact: dict[str, list[Gap]] = {}
    for gap in report.gaps:
        by_artifact.setdefault(gap.artifact, []).append(gap)

    print(f"Checked {report.files_checked} artifacts. Found {len(report.gaps)} gaps:\n")
    for artifact in ("adr", "storytelling", "pattern"):
        gaps = by_artifact.get(artifact, [])
        if not gaps:
            continue
        print(f"## {artifact.upper()}S — {len(gaps)} gap(s)\n")
        for gap in gaps:
            print(f"  [{gap.rule}]")
            print(f"    {gap.path}")
            print(f"    → {gap.message}")
            print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit backlinks across ADRs, storytelling, and patterns.")
    parser.add_argument("--strict", action="store_true", help="Exit 1 if any gaps")
    parser.add_argument("--json", action="store_true", help="Machine-readable output")
    args = parser.parse_args()

    report = Report()
    walk_adrs(report)
    walk_storytelling(report)
    walk_patterns(report)

    if args.json:
        print(json.dumps({
            "files_checked": report.files_checked,
            "gap_count": len(report.gaps),
            "gaps": [g.to_dict() for g in report.gaps],
        }, indent=2))
    else:
        print_human(report)

    return 1 if (args.strict and report.gaps) else 0


if __name__ == "__main__":
    sys.exit(main())
