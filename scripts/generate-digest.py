#!/usr/bin/env python3
"""Living digest — Tier 2 #5 of context-architecture.md §6.

Generates `docs/digest/<YYYY-MM-DD>.md` — a single file with one-line
summaries of:

- All workspace + per-product ADRs (id, title, status, date)
- All storytelling perspective files (product, persona, last-updated)
- All patterns by category
- Active overrides (from docs/governance/exceptions.md)
- Active subagents (from docs/SUBAGENTS.md)
- Cross-product signals (from docs/RESEARCH-SIGNALS.md)

The digest is loaded by SessionStart hook on `compact` matcher (and
optionally on `startup` if `--auto-load` is enabled in settings) so the
assistant has a current snapshot of "what decisions / personas /
patterns / overrides exist" without re-reading them all.

Run from repo root:

    python3 scripts/generate-digest.py             # writes to docs/digest/<today>.md
    python3 scripts/generate-digest.py --print     # prints to stdout, no file
    python3 scripts/generate-digest.py --strict    # error if no content found

Idempotent: re-running on the same day overwrites the day's digest.
"""
from __future__ import annotations

import argparse
import re
import sys
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


def first_h1(text: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line.lstrip("# ").strip()
    return "(no title)"


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


def fmt_mtime(path: Path) -> str:
    try:
        return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d")
    except OSError:
        return "?"


# ----------------------------------------------------------------------
# Section builders


def section_adrs() -> list[str]:
    lines = ["## Decisions (ADRs)\n"]
    workspace_adrs = sorted((REPO_ROOT / "docs" / "decisions").glob("*.md"))
    product_adrs = sorted((REPO_ROOT / "apps").glob("*/docs/decisions/*.md"))

    rows: list[tuple[str, str, str, str, str]] = []  # (scope, id, title, status, date)
    skip = {"README.md", "_override-template.md", "_template.md",
            "000-record-architecture-decisions.md"}
    for adr in workspace_adrs:
        if adr.name in skip:
            continue
        text = read(adr)
        fm = parse_frontmatter(text)
        rows.append(("workspace", adr.stem, first_h1(text),
                     fm.get("status", "Accepted"),
                     fm.get("date", fmt_mtime(adr))))
    for adr in product_adrs:
        if adr.name in skip:
            continue
        text = read(adr)
        fm = parse_frontmatter(text)
        # Path: apps/<product>/docs/decisions/<file>
        product = adr.relative_to(REPO_ROOT).parts[1]
        rows.append((f"apps/{product}", adr.stem, first_h1(text),
                     fm.get("status", "Accepted"),
                     fm.get("date", fmt_mtime(adr))))

    if not rows:
        lines.append("(none)\n")
        return lines

    lines.append("| Scope | ID | Title | Status | Date |")
    lines.append("|---|---|---|---|---|")
    for scope, adr_id, title, status, date in rows:
        # title is already H1 — strip the trailing path-anchored "(filename)"
        title_short = title[:80]
        lines.append(f"| `{scope}` | `{adr_id}` | {title_short} | {status} | {date} |")
    lines.append("")
    return lines


def section_storytelling() -> list[str]:
    lines = ["## Storytelling perspectives\n"]
    rows: list[tuple[str, str, str, str]] = []
    for path in sorted((REPO_ROOT / "apps").glob("*/docs/storytelling/*.md")):
        if path.name in {"README.md"}:
            continue
        product = path.parent.parent.parent.name
        title = first_h1(read(path))
        date = fmt_mtime(path)
        rows.append((product, path.stem, title, date))

    if not rows:
        lines.append("(none)\n")
        return lines

    lines.append("| Product | File | Title | Last updated |")
    lines.append("|---|---|---|---|")
    for product, stem, title, date in rows:
        lines.append(f"| `{product}` | `{stem}` | {title[:80]} | {date} |")
    lines.append("")
    return lines


def section_patterns() -> list[str]:
    lines = ["## Patterns by category\n"]
    by_cat: dict[str, list[tuple[str, str]]] = {}
    for path in sorted((REPO_ROOT / "docs" / "patterns").rglob("*.md")):
        if path.name in {"README.md", "RUBRIC.md", "INDEX.md"}:
            continue
        cat = path.parent.name
        title = first_h1(read(path))
        by_cat.setdefault(cat, []).append((path.stem, title))

    if not by_cat:
        lines.append("(none)\n")
        return lines

    for cat in sorted(by_cat):
        lines.append(f"### {cat}")
        for stem, title in by_cat[cat]:
            lines.append(f"  - `{stem}` — {title[:90]}")
        lines.append("")
    return lines


def section_overrides() -> list[str]:
    lines = ["## Active overrides\n"]
    path = REPO_ROOT / "docs" / "governance" / "exceptions.md"
    if not path.exists():
        lines.append("(no exceptions.md)\n")
        return lines
    text = read(path)
    rows = []
    in_table = False
    for line in text.splitlines():
        if line.startswith("|") and not line.startswith("|---"):
            cells = [c.strip() for c in line.split("|")[1:-1]]
            if not cells:
                continue
            # Skip header (first row that has all-text alphabetic headers)
            if cells[0].lower() in {"id", "override-id", "rule", "rule-id"} and not in_table:
                in_table = True
                continue
            if in_table:
                rows.append(cells)

    if not rows:
        lines.append("(no active overrides)\n")
        return lines

    lines.append(f"({len(rows)} active overrides — see `docs/governance/exceptions.md` for details)")
    for cells in rows[:10]:  # cap to first 10
        lines.append(f"  - `{cells[0]}` " + (": " + cells[1] if len(cells) > 1 else ""))
    lines.append("")
    return lines


def section_signals_and_competitors() -> list[str]:
    lines = ["## Cross-product signals (RESEARCH-SIGNALS.md)\n"]
    path = REPO_ROOT / "docs" / "RESEARCH-SIGNALS.md"
    if path.exists():
        text = read(path)
        # Pick out S-NN rows
        for m in re.finditer(r"\*\*(S-\d+)\*\*\s*\|\s*\*\*([^*]+)\*\*", text):
            lines.append(f"  - {m.group(1)} {m.group(2).strip()}")
        # Watchlist items
        for m in re.finditer(r"\| W-(\d+)\s*\|\s*([^|]+)\s*\|", text):
            lines.append(f"  - W-{m.group(1)} (watchlist) {m.group(2).strip()[:100]}")
    lines.append("")

    lines.append("## Competitor anchors (COMPETITOR-INTEL.md)\n")
    path = REPO_ROOT / "docs" / "COMPETITOR-INTEL.md"
    if path.exists():
        text = read(path)
        for m in re.finditer(r"^####\s*#([\w-]+)\s*$", text, re.MULTILINE):
            lines.append(f"  - `#{m.group(1)}`")
    lines.append("")
    return lines


def section_subagents() -> list[str]:
    lines = ["## Subagent registry (SUBAGENTS.md)\n"]
    path = REPO_ROOT / "docs" / "SUBAGENTS.md"
    if path.exists():
        text = read(path)
        # Pick out the type table rows: | **`name`** | ... |
        for m in re.finditer(r"\|\s*\*\*`([^`]+)`\*\*\s*\|", text):
            lines.append(f"  - `{m.group(1)}`")
    # Custom workspace agents (if any)
    custom = sorted((REPO_ROOT / ".claude" / "agents").glob("*.md")) if (REPO_ROOT / ".claude" / "agents").exists() else []
    if custom:
        lines.append("")
        lines.append("**Workspace-defined agents:**")
        for path in custom:
            lines.append(f"  - `{path.stem}` ({path.relative_to(REPO_ROOT)})")
    lines.append("")
    return lines


# ----------------------------------------------------------------------
# main


def build_digest() -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    lines: list[str] = [
        f"# Workspace Digest — {today}",
        "",
        f"> Auto-generated by `scripts/generate-digest.py` on {today}. "
        "One-line summary of every load-bearing artifact across the workspace. "
        "Loaded by the SessionStart hook on compact-recovery so the assistant "
        "has a current snapshot without re-reading every file.",
        "",
        "**Re-generate:** `python3 scripts/generate-digest.py`",
        "",
        "---",
        "",
    ]
    lines.extend(section_adrs())
    lines.extend(section_storytelling())
    lines.extend(section_patterns())
    lines.extend(section_signals_and_competitors())
    lines.extend(section_subagents())
    lines.extend(section_overrides())
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the workspace digest.")
    parser.add_argument("--print", action="store_true", help="Print to stdout, don't write file")
    parser.add_argument("--strict", action="store_true", help="Exit 1 if digest is empty")
    args = parser.parse_args()

    digest = build_digest()

    if args.strict and len(digest.splitlines()) < 30:
        print("ERROR: digest is suspiciously empty", file=sys.stderr)
        return 1

    if args.print:
        print(digest)
        return 0

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_dir = REPO_ROOT / "docs" / "digest"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{today}.md"
    out_path.write_text(digest, encoding="utf-8")

    # Also maintain a stable `latest.md` symlink-like pointer (regular file
    # so it works in environments without symlinks)
    latest = out_dir / "latest.md"
    latest.write_text(digest, encoding="utf-8")

    line_count = len(digest.splitlines())
    print(f"Wrote {out_path} ({line_count} lines, ~{len(digest)//4} tokens)")
    print(f"Wrote {latest} (latest pointer)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
