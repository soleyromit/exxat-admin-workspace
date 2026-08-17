#!/usr/bin/env python3
"""Notification hook — Step 1 of ADOPT-2 (docs/governance/claude-updates/
2026-08-15-v2222-2226.md). Captures raw agent_completed / agent_needs_input
payloads so their shape can be confirmed before any parsing logic is wired
into subagent-stop.py (Step 2). Read-only: appends raw JSON, never blocks.

Delete this hook + its log once Step 2 lands and the payload shape is
folded into subagent-stop.py / _telemetry.py.

Reads JSON from stdin; emits empty JSON on stdout.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

CAPTURE_LOG = Path("/Users/romitsoley/Work/docs/governance/notification-payloads.log")


def main() -> None:
    try:
        payload = sys.stdin.read()
        json.loads(payload)  # validate only; log the raw text as received
    except Exception:
        payload = "{}"

    try:
        ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
        with CAPTURE_LOG.open("a", encoding="utf-8") as f:
            f.write(f"{ts}\t{payload}\n")
    except Exception:
        pass

    print(json.dumps({}))


if __name__ == "__main__":
    main()
