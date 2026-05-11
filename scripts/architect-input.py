#!/usr/bin/env python3
"""architect-input — Bundles the inputs the `architect` subagent reads.

The architect needs evidence to propose governance changes. This script
gathers that evidence into a single JSON envelope so the agent can read
once instead of grepping six places.

Outputs to stdout (default) or --out <file>. The architect spec at
.claude/agents/architect.md reads from this script's output.

Usage:
    python3 scripts/architect-input.py
    python3 scripts/architect-input.py --since 2026-04-01 --out /tmp/architect.json
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GOVERNANCE = REPO_ROOT / "docs" / "governance"
RUNS_INDEX = GOVERNANCE / "architect-runs" / "INDEX.md"
TELEMETRY = GOVERNANCE / "subagent-invocations.log"

def last_run_date() -> str:
    """ISO date of the most recent architect run, or 30 days ago if none."""
    if not RUNS_INDEX.exists():
        return (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    # Find the latest YYYY-MM-DD in INDEX.md
    text = RUNS_INDEX.read_text(encoding="utf-8", errors="ignore")
    dates = re.findall(r"\b(20\d{2}-\d{2}-\d{2})\b", text)
    return max(dates) if dates else (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")

def git_log(since: str) -> list[dict]:
    """Commit summaries since the given ISO date."""
    try:
        out = subprocess.check_output(
            ["git", "log", f"--since={since}", "--pretty=format:%H|%ad|%s", "--date=short"],
            cwd=REPO_ROOT, text=True, stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return []
    rows = []
    for line in out.splitlines():
        if not line.strip():
            continue
        parts = line.split("|", 2)
        if len(parts) != 3:
            continue
        sha, date, subject = parts
        # Categorize by conventional-commit prefix
        m = re.match(r"^(\w+)(?:\([\w-]+\))?:", subject)
        kind = m.group(1) if m else "other"
        rows.append({"sha": sha[:8], "date": date, "kind": kind, "subject": subject})
    return rows

def discipline_log_entries() -> list[dict]:
    """Extract the discipline log table rows from verification-discipline.md.

    Simpler than section-based parsing: match the table-row shape directly
    across the whole file. The row format is unambiguous (ISO-date in column 1,
    single-letter pattern in column 3) and only appears inside the log table.
    """
    path = GOVERNANCE / "verification-discipline.md"
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8", errors="ignore")
    rows = []
    for line in text.splitlines():
        m = re.match(
            r"^\|\s*(20\d{2}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*([A-F])\s*\|\s*(.+?)\s*\|\s*$",
            line,
        )
        if m:
            date, caught_by, pattern, miss = m.groups()
            rows.append({
                "date": date,
                "caught_by": caught_by.strip(),
                "pattern": pattern.strip(),
                "miss": miss.strip(),
            })
    return rows

def blind_spots_rows() -> list[dict]:
    """Extract row #, status, and one-line summary from blind-spots.md."""
    path = GOVERNANCE / "blind-spots.md"
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8", errors="ignore")
    rows = []
    for line in text.splitlines():
        # Match: | 14 | description… | … | ⏳ partial 2026-05-11 | workaround… |
        m = re.match(r"^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|\s*$", line)
        if m and m.group(1).isdigit():
            rows.append({
                "row": int(m.group(1)),
                "description": m.group(2)[:200],
                "why": m.group(3)[:150],
                "status": m.group(4),
                "workaround": m.group(5)[:200],
            })
    return rows

def audit_hits() -> dict:
    """Current per-rule hit counts from the DS-adoption audit."""
    try:
        out = subprocess.check_output(
            ["python3", str(REPO_ROOT / "scripts" / "ds-adoption-audit.py"), "--json"],
            cwd=REPO_ROOT, text=True, stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return {"error": "audit script failed"}
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        return {"error": "audit output not JSON"}
    # Aggregate per-rule across all products
    rule_counts: dict[str, int] = {}
    block_by_product: dict[str, int] = {}
    warn_by_product: dict[str, int] = {}
    for entry in data:
        key = f"{entry['product']}/{entry['role']}"
        block_by_product[key] = entry.get("blocks", 0)
        warn_by_product[key] = entry.get("warns", 0)
        for g in entry.get("gaps", []):
            rule_counts[g["rule"]] = rule_counts.get(g["rule"], 0) + 1
    return {
        "rule_counts": rule_counts,
        "block_by_product": block_by_product,
        "warn_by_product": warn_by_product,
    }

def subagent_telemetry() -> dict:
    """Read append-only subagent invocation log. Empty if file missing."""
    if not TELEMETRY.exists():
        return {"status": "telemetry-gap", "note": "scripts/subagent-telemetry.py not wired yet"}
    rows = []
    for line in TELEMETRY.read_text(encoding="utf-8", errors="ignore").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            rows.append({"timestamp": parts[0], "subagent": parts[1], "context": parts[2] if len(parts) > 2 else ""})
    counts: dict[str, int] = {}
    for r in rows:
        counts[r["subagent"]] = counts.get(r["subagent"], 0) + 1
    return {"invocations": rows[-30:], "counts": counts}

def existing_subagents() -> list[str]:
    """List subagent spec filenames so the architect doesn't propose duplicates."""
    agents_dir = REPO_ROOT / ".claude" / "agents"
    if not agents_dir.exists():
        return []
    return sorted(p.name for p in agents_dir.glob("*.md"))

def existing_audit_rules() -> list[str]:
    """Extract rule slugs from the audit script."""
    path = REPO_ROOT / "scripts" / "ds-adoption-audit.py"
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8", errors="ignore")
    # Match: rule="<slug>",
    return sorted(set(re.findall(r'rule="([a-z][\w-]+)"', text)))

def past_architect_runs() -> list[dict]:
    """Read the architect-runs index, return the last 5 runs."""
    runs_dir = GOVERNANCE / "architect-runs"
    if not runs_dir.exists():
        return []
    runs = []
    for p in sorted(runs_dir.glob("20*.md"), reverse=True)[:5]:
        runs.append({"path": str(p.relative_to(REPO_ROOT)), "date": p.stem.split("-")[0:3]})
    return runs

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--since", help="ISO date (default: last architect run, or 30 days ago).")
    ap.add_argument("--out", help="Write JSON to this path instead of stdout.")
    args = ap.parse_args()

    since = args.since or last_run_date()

    bundle = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "since": since,
        "git_log": git_log(since),
        "discipline_log": discipline_log_entries(),
        "blind_spots": blind_spots_rows(),
        "audit": audit_hits(),
        "subagent_telemetry": subagent_telemetry(),
        "existing_subagents": existing_subagents(),
        "existing_audit_rules": existing_audit_rules(),
        "past_architect_runs": past_architect_runs(),
    }

    text = json.dumps(bundle, indent=2)
    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"Wrote {args.out}", file=sys.stderr)
    else:
        print(text)

if __name__ == "__main__":
    main()
