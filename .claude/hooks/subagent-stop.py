#!/usr/bin/env python3
"""SubagentStop hook — emits a telemetry event when any subagent
finishes.

Lets us measure subagent usage:
  - Which subagent types are spawned most
  - How long they take (if duration_ms is in the payload)
  - Outcome distribution (success / error / cancelled)

This hook is silent on stdout — it doesn't inject context. Its job is
just to emit telemetry. Telemetry feeds `scripts/telemetry-report.py`
which surfaces patterns over time (e.g., "research-cross-corpus is
spawned 12x but always returns < 200 words — consider downgrading to
inline read").

Reads JSON from stdin; emits empty JSON on stdout.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    from _telemetry import emit as _telemetry_emit
except ImportError:
    def _telemetry_emit(*a, **k): pass


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    # Hook payload schema for SubagentStop:
    # - subagent_type / agent_type / type — which agent
    # - duration_ms (if available)
    # - tool_calls_count or similar
    # - outcome (completed / cancelled / error)
    agent_type = (
        payload.get("subagent_type")
        or payload.get("agent_type")
        or payload.get("type")
        or "unknown"
    )
    duration_ms = payload.get("duration_ms") or payload.get("duration") or 0
    outcome = payload.get("outcome") or payload.get("status") or "completed"
    tool_calls = payload.get("tool_calls_count") or payload.get("tool_uses") or 0

    _telemetry_emit(
        "subagent.stop",
        agent_type=str(agent_type),
        outcome=str(outcome),
        duration_ms=int(duration_ms) if duration_ms else 0,
        tool_calls=int(tool_calls) if tool_calls else 0,
    )

    print(json.dumps({}))


if __name__ == "__main__":
    main()
