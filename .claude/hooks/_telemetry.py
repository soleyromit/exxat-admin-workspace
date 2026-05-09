"""Shared telemetry helper for SessionStart / UserPromptSubmit / PreToolUse hooks.

Writes JSONL events to docs/telemetry/events.jsonl. Failures are silent —
telemetry must never break a hook.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path


_EVENTS_PATH = Path("/Users/romitsoley/Work/docs/telemetry/events.jsonl")


def emit(event: str, **fields) -> None:
    """Append a single JSONL event. Silent on failure."""
    try:
        _EVENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "event": event,
            "session": os.environ.get("CLAUDE_SESSION_ID", ""),
            **fields,
        }
        with _EVENTS_PATH.open("a") as f:
            f.write(json.dumps(record, separators=(",", ":")) + "\n")
    except Exception:
        # Telemetry must never break a hook
        pass
