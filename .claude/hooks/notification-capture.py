#!/usr/bin/env python3
"""Notification hook capture (Step 1 of two-step plan).
Captures agent_completed payloads to notification-payloads.log for Step 2 parse-spec.
Passes through silently for all other events (permission prompts, agent_needs_input, etc).
TS SDK 0.3.233: Notification now also fires for permission prompts — filter is required.
NOTE: field path for notification type is unconfirmed from changelog; inspect first capture.
"""
import json, sys, pathlib, datetime

raw = sys.stdin.read()
try:
    payload = json.loads(raw)
except json.JSONDecodeError:
    sys.exit(0)

# Candidate field paths for notification type (verify against first captured payload)
notification_type = (
    payload.get("notification", {}).get("type")
    or payload.get("type", "")
)
if notification_type not in ("agent_completed",):
    sys.exit(0)

log_path = (
    pathlib.Path(__file__).parent.parent.parent
    / "docs" / "governance" / "notification-payloads.log"
)
log_path.parent.mkdir(parents=True, exist_ok=True)
with log_path.open("a") as f:
    f.write(f"# {datetime.datetime.utcnow().isoformat()}Z\n")
    f.write(raw.strip())
    f.write("\n\n")

sys.exit(0)
