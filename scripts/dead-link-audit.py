#!/usr/bin/env python3
"""Dead-link audit — detect navigation that may dead-end on locked / empty states.

A real bug pattern (caught 2026-05-10): /analytics added a row click-through
to /my-surveys/[id]/results that wasn't gated by survey.status. Released
surveys → results page renders fine. Collecting surveys → locked empty
state. The link should have been disabled or routed elsewhere.

This audit catches the class of bug:
  1. Find <Link> / router.push() / useRouter().push() destinations in
     each .tsx file
  2. For each destination, see if the TARGET page renders an
     `if (!isReleased)` / `if (!isOpen)` / `if (locked)` style empty-state
  3. If the source link doesn't have a corresponding gate, flag it

Limitations (this is a heuristic, not perfect):
  - Cross-route prop drilling not analyzed
  - Async-loaded routes flagged conservatively
  - Dynamic destinations (string templates) traced best-effort

Run from repo root:

    python3 scripts/dead-link-audit.py
    python3 scripts/dead-link-audit.py --strict   # exit 1 on warning
    python3 scripts/dead-link-audit.py --json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Catches the most common gates that introduce empty-state dead-ends
GATE_PATTERN = re.compile(
    r"if\s*\(\s*!\s*(isReleased|isOpen|isAvailable|hasResults|isPublished|isLive|isLocked\s*===\s*false)",
    re.IGNORECASE,
)
# Also catches conditional renderers that show empty when state is wrong
CONDITIONAL_EMPTY_PATTERN = re.compile(
    r"\{\s*!\s*(isReleased|isOpen|isAvailable|hasResults|isPublished|isLive)\s*\?\s*\(",
)
# Variable definitions identifying the gate
STATE_GATE_DEF = re.compile(
    r"const\s+(isReleased|isOpen|isAvailable|hasResults|isPublished|isLive)\s*=",
)

# Source patterns: <Link href=...> / router.push(...) / Link as button asChild
LINK_HREF_PATTERN = re.compile(
    r"""<Link\s+(?:[^>]*?\s+)?href\s*=\s*\{?\s*[`'"]([^`'"]+)[`'"]"""
)
ROUTER_PUSH_PATTERN = re.compile(
    r"""router\.push\s*\(\s*[`'"]([^`'"]+)[`'"]"""
)
TEMPLATE_HREF_PATTERN = re.compile(
    r"""href\s*=\s*\{?\s*`(/[^`]+)`"""  # backtick template literals like `/foo/${x}/bar`
)


@dataclass
class Gap:
    source_file: str
    link_target: str
    target_file: str | None
    reason: str

    def to_dict(self) -> dict[str, str | None]:
        return {
            "source": self.source_file,
            "link_target": self.link_target,
            "target_file": self.target_file,
            "reason": self.reason,
        }


@dataclass
class Report:
    gaps: list[Gap] = field(default_factory=list)
    sources_checked: int = 0
    targets_with_gates: int = 0


def normalize_route(href: str) -> str:
    """Convert template literals to route shape — `/my-surveys/${id}/results`
    → `/my-surveys/[id]/results`."""
    return re.sub(r"\$\{[^}]+\}", "[id]", href)


def find_target_page(route: str, app_root: Path) -> Path | None:
    """Map a route like /my-surveys/[id]/results to apps/<...>/app/(app)/my-surveys/[id]/results/page.tsx."""
    # Strip query/hash
    clean = route.split("?")[0].split("#")[0].rstrip("/")
    if not clean:
        return None
    # Try common Next.js route group prefixes
    candidates = [
        app_root / "(app)" / clean.lstrip("/") / "page.tsx",
        app_root / clean.lstrip("/") / "page.tsx",
    ]
    for c in candidates:
        if c.exists():
            return c
    return None


def has_state_gate(target_file: Path) -> bool:
    """Return True if target file has a state-conditional empty state."""
    try:
        text = target_file.read_text(encoding="utf-8")
    except OSError:
        return False
    if not STATE_GATE_DEF.search(text):
        return False
    return bool(GATE_PATTERN.search(text) or CONDITIONAL_EMPTY_PATTERN.search(text))


def source_has_corresponding_gate(source_file: Path, target_route: str) -> bool:
    """Heuristic: does the source file gate the link by similar state?
    Looks for `isReleased` / `survey.status === 'released'` / etc. near the
    Link. If the file has the gate variable defined, assume the link is
    inside a conditional branch."""
    try:
        text = source_file.read_text(encoding="utf-8")
    except OSError:
        return False
    return bool(STATE_GATE_DEF.search(text)) or "status === 'released'" in text or "status === 'closed'" in text


def audit() -> Report:
    report = Report()

    for app_dir in (REPO_ROOT / "apps").glob("*/admin"):
        app_root = app_dir / "app"
        if not app_root.exists():
            continue

        for source in app_root.rglob("*.tsx"):
            try:
                text = source.read_text(encoding="utf-8")
            except OSError:
                continue
            report.sources_checked += 1

            link_targets: set[str] = set()
            for pattern in (LINK_HREF_PATTERN, ROUTER_PUSH_PATTERN, TEMPLATE_HREF_PATTERN):
                for m in pattern.finditer(text):
                    href = m.group(1)
                    if not href.startswith("/"):
                        continue
                    link_targets.add(normalize_route(href))

            for href in link_targets:
                target = find_target_page(href, app_root)
                if target is None:
                    continue
                if not has_state_gate(target):
                    continue
                report.targets_with_gates += 1

                if not source_has_corresponding_gate(source, href):
                    rel_source = str(source.relative_to(REPO_ROOT))
                    rel_target = str(target.relative_to(REPO_ROOT))
                    report.gaps.append(Gap(
                        source_file=rel_source,
                        link_target=href,
                        target_file=rel_target,
                        reason=("Target page has a state-conditional empty state "
                                "(isReleased/isOpen/etc.) but source link is not "
                                "gated by the same state."),
                    ))

    return report


def print_human(report: Report) -> None:
    if not report.gaps:
        print(f"✓ No dead-link gaps. {report.sources_checked} sources scanned, "
              f"{report.targets_with_gates} state-gated targets verified.")
        return

    print(f"Dead-link audit: {report.sources_checked} sources scanned. "
          f"Found {len(report.gaps)} potential dead-end navigation(s):\n")

    by_source: dict[str, list[Gap]] = {}
    for g in report.gaps:
        by_source.setdefault(g.source_file, []).append(g)

    for src, gaps in by_source.items():
        print(f"## {src}")
        for g in gaps:
            print(f"  → {g.link_target}")
            print(f"     target: {g.target_file}")
            print(f"     reason: {g.reason}")
        print()
    print("Fix: gate the link/router.push by the same state the target checks, "
          "or route to a different page when the gate fails.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit links to state-gated pages.")
    parser.add_argument("--strict", action="store_true", help="Exit 1 on any gap")
    parser.add_argument("--json", action="store_true", help="Machine-readable")
    args = parser.parse_args()

    report = audit()

    if args.json:
        print(json.dumps({
            "sources_checked":     report.sources_checked,
            "targets_with_gates":  report.targets_with_gates,
            "gap_count":           len(report.gaps),
            "gaps":                [g.to_dict() for g in report.gaps],
        }, indent=2))
    else:
        print_human(report)

    return 1 if (args.strict and report.gaps) else 0


if __name__ == "__main__":
    sys.exit(main())
