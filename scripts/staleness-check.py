#!/usr/bin/env python3
"""Staleness check — Tier 2 #4 of context-architecture.md §6.

Walks the workspace and flags artifacts that have decayed:

1. **Stale ADRs / storytelling** — files untouched > 90 days. These
   either need re-validation or have silently superseded.

2. **Superseded ADRs missing link** — an ADR with `status: Superseded`
   in frontmatter MUST cite the superseder in `superseded_by:` so the
   chain is traceable.

3. **Pattern files with broken DS imports** — patterns that reference
   a DS component (e.g., `Button`, `Sheet`) that's no longer in
   `exxat-ds/packages/ui/src/index.ts` or has been renamed.

4. **Hub-file INDEX rows with missing files** — every row in
   `apps/<product>/docs/research/hub-files/INDEX.md` should reference
   a file that exists in the same directory.

5. **Override-ledger entries past sunset** — rows in
   `docs/governance/exceptions.md` whose sunset criterion has likely
   passed (date-based heuristic).

Run from repo root:

    python3 scripts/staleness-check.py             # human report
    python3 scripts/staleness-check.py --strict    # exit 1 if any gaps
    python3 scripts/staleness-check.py --json      # machine-readable
    python3 scripts/staleness-check.py --age 60    # custom days threshold

What it does NOT check
----------------------
- Whether content is *correct* — that's the backlink-audit's job
- Whether a file is *unused* — too noisy on a workspace with many
  pointers
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
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


def days_since(path: Path) -> int:
    try:
        mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
        return (datetime.now(timezone.utc) - mtime).days
    except OSError:
        return -1


# ----------------------------------------------------------------------


@dataclass
class Gap:
    category: str
    path: str
    rule: str
    message: str

    def to_dict(self) -> dict[str, str]:
        return {
            "category": self.category,
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
# 1. Stale ADRs / storytelling


def check_stale_files(report: Report, threshold_days: int) -> None:
    bases: list[Path] = [REPO_ROOT / "docs" / "decisions"]
    bases.extend((REPO_ROOT / "apps").glob("*/docs/decisions"))
    bases.extend((REPO_ROOT / "apps").glob("*/docs/storytelling"))

    for base in bases:
        if not base.is_dir():
            continue
        for path in sorted(base.glob("*.md")):
            if path.name in {"README.md", "INDEX.md", "_override-template.md",
                              "000-record-architecture-decisions.md"}:
                continue
            report.files_checked += 1
            age = days_since(path)
            if age > threshold_days:
                rel = str(path.relative_to(REPO_ROOT))
                report.add(Gap(
                    "stale-files", rel, "untouched-too-long",
                    f"untouched {age} days (threshold: {threshold_days})",
                ))


# ----------------------------------------------------------------------
# 2. Superseded ADRs missing link

SUPERSEDED_RE = re.compile(r"^\s*status\s*:\s*superseded\b", re.IGNORECASE | re.MULTILINE)


def check_superseded_links(report: Report) -> None:
    bases: list[Path] = [REPO_ROOT / "docs" / "decisions"]
    bases.extend((REPO_ROOT / "apps").glob("*/docs/decisions"))
    for base in bases:
        if not base.is_dir():
            continue
        for path in sorted(base.glob("*.md")):
            if path.name in {"README.md", "_override-template.md"}:
                continue
            text = read(path)
            fm = parse_frontmatter(text)
            if fm.get("status", "").lower() == "superseded":
                if not (fm.get("superseded_by") or fm.get("supersededBy")):
                    rel = str(path.relative_to(REPO_ROOT))
                    report.add(Gap(
                        "superseded-no-link", rel, "missing-superseded-by",
                        "status=superseded but no `superseded_by:` link in frontmatter",
                    ))


# ----------------------------------------------------------------------
# 3. Pattern files with broken DS imports

DS_INDEX_PATH = REPO_ROOT / "exxat-ds" / "packages" / "ui" / "src" / "index.ts"


def _ds_known_components() -> set[str]:
    """Best-effort parse of the DS index.ts to extract component names.
    The index re-exports from `./components/ui/<name>` files. We pick
    out the file references."""
    if not DS_INDEX_PATH.exists():
        return set()
    text = DS_INDEX_PATH.read_text(encoding="utf-8")
    # match: from './components/ui/button' or "components/ui/something-with-dashes"
    out = set()
    for m in re.finditer(r"['\"]\./components/ui/([a-z][a-z0-9-]*)['\"]", text):
        # convert kebab to PascalCase variants and the bare name
        kebab = m.group(1)
        out.add(kebab)
        out.add(kebab.replace("-", ""))
        pascal = "".join(p.capitalize() for p in kebab.split("-"))
        out.add(pascal)
    return out


COMPONENT_MENTION_RE = re.compile(
    r"`<?(?P<name>[A-Z][A-Za-z0-9]+)`?",
)
KNOWN_NON_DS_NAMES = {
    # Common React identifiers we don't want to flag
    "React", "Component", "Fragment", "Suspense",
    # Workspace-defined component patterns
    "Button", "Badge",  # always in DS — listing here is just a safety net
}


def check_pattern_imports(report: Report) -> None:
    """Currently a soft check: only verify that the DS index exists. A
    deeper check would parse each pattern file's component references
    and confirm each is in the DS — too aggressive for a first version
    given pattern files mention components conceptually as well as
    importable. Defer the deep check to the backlink-audit script if
    it becomes a real source of drift."""
    if not DS_INDEX_PATH.exists():
        report.add(Gap(
            "ds-index", "exxat-ds/packages/ui/src/index.ts", "missing",
            "DS index.ts not found — submodule may be detached or removed",
        ))
        return


# ----------------------------------------------------------------------
# 4. Hub-file INDEX rows with missing files


def check_hub_indexes(report: Report) -> None:
    for index_path in (REPO_ROOT / "apps").glob("*/docs/research/hub-files/INDEX.md"):
        report.files_checked += 1
        text = read(index_path)
        # Pick out file names from the table rows: | <filename.ext> | ... |
        for line in text.splitlines():
            if not line.startswith("|") or line.startswith("|---"):
                continue
            # First-cell value (between the first two pipes)
            parts = [c.strip() for c in line.split("|")[1:-1]]
            if not parts:
                continue
            cell = parts[0]
            # Skip header row + empty placeholder
            if cell.lower() in {"file", "_(empty — add rows as files are mirrored)_", ""}:
                continue
            # Cell may be a markdown link or bare filename — extract first token
            m = re.match(r"\[?([^\]\s|]+\.\w+)", cell)
            if not m:
                continue
            filename = m.group(1)
            file_path = index_path.parent / filename
            if not file_path.exists():
                rel = str(index_path.relative_to(REPO_ROOT))
                report.add(Gap(
                    "hub-index", rel, "missing-file",
                    f"INDEX row references `{filename}` which does not exist alongside the INDEX",
                ))


# ----------------------------------------------------------------------
# 5. Override-ledger sunset

EXCEPTION_PATH = REPO_ROOT / "docs" / "governance" / "exceptions.md"
DATE_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")


def check_overrides(report: Report, today: datetime) -> None:
    if not EXCEPTION_PATH.exists():
        return
    text = read(EXCEPTION_PATH)
    # Heuristic: scan rows for "sunset" cells with a YYYY-MM-DD date that
    # has passed. We match each table row, find a "sunset" column header
    # by counting | positions.
    lines = text.splitlines()
    header_idx = None
    sunset_col = None
    for i, line in enumerate(lines):
        if not line.startswith("|"):
            continue
        cells = [c.strip().lower() for c in line.split("|")[1:-1]]
        if "sunset" in " ".join(cells):
            for col_idx, cell in enumerate(cells):
                if "sunset" in cell:
                    header_idx = i
                    sunset_col = col_idx
                    break
            break

    if sunset_col is None:
        return  # no sunset column — nothing to enforce

    for line in lines[header_idx + 2:]:  # skip header + separator
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.split("|")[1:-1]]
        if sunset_col >= len(cells):
            continue
        sunset_cell = cells[sunset_col]
        m = DATE_RE.search(sunset_cell)
        if not m:
            continue
        try:
            sunset = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)),
                              tzinfo=timezone.utc)
        except ValueError:
            continue
        if sunset < today:
            # First cell is usually the override id
            id_cell = cells[0] if cells else "(unknown)"
            rel = str(EXCEPTION_PATH.relative_to(REPO_ROOT))
            report.add(Gap(
                "override-sunset", rel, "past-sunset",
                f"override `{id_cell}` had sunset {sunset_cell} — "
                f"either close it or extend the sunset",
            ))


# ----------------------------------------------------------------------
# output


def print_human(report: Report, threshold_days: int) -> None:
    if not report.gaps:
        print(f"✓ No staleness gaps. Checked {report.files_checked} artifacts "
              f"with threshold {threshold_days}d.")
        return

    by_cat: dict[str, list[Gap]] = {}
    for g in report.gaps:
        by_cat.setdefault(g.category, []).append(g)

    print(f"Checked {report.files_checked} artifacts (threshold: {threshold_days}d). "
          f"Found {len(report.gaps)} gap(s):\n")
    order = ["stale-files", "superseded-no-link", "ds-index",
             "hub-index", "override-sunset"]
    for cat in order:
        gaps = by_cat.get(cat, [])
        if not gaps:
            continue
        print(f"## {cat.upper().replace('-', ' ')} — {len(gaps)} gap(s)\n")
        for g in gaps:
            print(f"  [{g.rule}]")
            print(f"    {g.path}")
            print(f"    → {g.message}")
            print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit workspace artifacts for staleness.")
    parser.add_argument("--strict", action="store_true", help="Exit 1 if any gaps found")
    parser.add_argument("--json", action="store_true", help="Machine-readable output")
    parser.add_argument("--age", type=int, default=90, metavar="DAYS",
                        help="Days threshold for stale files (default: 90)")
    args = parser.parse_args()

    report = Report()
    today = datetime.now(timezone.utc)

    check_stale_files(report, args.age)
    check_superseded_links(report)
    check_pattern_imports(report)
    check_hub_indexes(report)
    check_overrides(report, today)

    if args.json:
        print(json.dumps({
            "files_checked": report.files_checked,
            "threshold_days": args.age,
            "gap_count": len(report.gaps),
            "gaps": [g.to_dict() for g in report.gaps],
        }, indent=2))
    else:
        print_human(report, args.age)

    return 1 if (args.strict and report.gaps) else 0


if __name__ == "__main__":
    sys.exit(main())
