#!/usr/bin/env python3
"""Practices-audit staleness check.

Reads `last_full_audit:` from `docs/governance/claude-practices.md`
frontmatter and compares to today.

Exit codes:
  0 = fresh (< 30 days)
  0 = soft reminder (30-60 days; warning printed but no error)
  1 = stale (> 60 days; pre-commit treats this as a warning, not block)

Usage:
  python3 scripts/practices-audit-staleness.py            # human report
  python3 scripts/practices-audit-staleness.py --json     # machine-readable
  python3 scripts/practices-audit-staleness.py --threshold 90   # custom days
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PRACTICES_PATH = REPO_ROOT / "docs" / "governance" / "claude-practices.md"


def read_last_audit() -> datetime | None:
    if not PRACTICES_PATH.exists():
        return None
    text = PRACTICES_PATH.read_text(encoding="utf-8")
    m = re.search(r"^last_full_audit\s*:\s*(\d{4}-\d{2}-\d{2})\s*$",
                  text, re.MULTILINE)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Check practices-audit staleness.")
    parser.add_argument("--json", action="store_true", help="Machine-readable output")
    parser.add_argument("--threshold", type=int, default=60, metavar="DAYS",
                        help="Days threshold past which audit is stale (default: 60)")
    parser.add_argument("--soft-threshold", type=int, default=30, metavar="DAYS",
                        help="Days at which soft reminder appears (default: 30)")
    args = parser.parse_args()

    last_audit = read_last_audit()
    if last_audit is None:
        msg = ("docs/governance/claude-practices.md missing or has no "
               "`last_full_audit:` field — invoke the practices-audit skill")
        if args.json:
            print(json.dumps({"status": "missing", "message": msg}))
        else:
            print(f"⚠ {msg}")
        return 1

    today = datetime.now(timezone.utc)
    age_days = (today - last_audit).days

    status = "fresh"
    if age_days >= args.threshold:
        status = "stale"
    elif age_days >= args.soft_threshold:
        status = "soft-reminder"

    if args.json:
        print(json.dumps({
            "status": status,
            "last_full_audit": last_audit.strftime("%Y-%m-%d"),
            "age_days": age_days,
            "soft_threshold": args.soft_threshold,
            "stale_threshold": args.threshold,
        }))
    else:
        if status == "fresh":
            print(f"✓ Practices audit fresh ({age_days}d ago, "
                  f"under {args.soft_threshold}d soft threshold)")
        elif status == "soft-reminder":
            print(f"○ Practices audit reminder: {age_days}d since last full audit "
                  f"(soft threshold: {args.soft_threshold}d). Consider invoking the "
                  f"practices-audit skill.")
        else:
            print(f"⚠ Practices audit STALE: {age_days}d since last full audit "
                  f"(threshold: {args.threshold}d). Invoke the practices-audit skill.")

    return 1 if status == "stale" else 0


if __name__ == "__main__":
    sys.exit(main())
