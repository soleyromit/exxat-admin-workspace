#!/usr/bin/env python3
"""SubagentStop hook — emits telemetry when any subagent finishes,
AND appends a row to docs/governance/subagent-invocations.log so the
architect subagent can read invocation history on its next run.

Wired 2026-05-12 per docs/governance/claude-updates/2026-05-12-baseline.md
ADOPT-1 (minimal scope — closes architect-runs/2026-05-11-baseline.md open
Q #3). Two-channel emit:
  - events.jsonl  (machine-readable, scripts/telemetry-report.py reads it)
  - subagent-invocations.log  (the architect's documented input)

When Claude Code's 2.1.139 OTEL agent_id/parent_agent_id attributes ship
in the hook payload (currently inferred — verify against actual payload
on first SubagentStop fire), the extra fields land in the log row.

Reads JSON from stdin; emits empty JSON on stdout.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    from _telemetry import emit as _telemetry_emit
except ImportError:
    def _telemetry_emit(*a, **k): pass

INVOCATIONS_LOG = Path("/Users/romitsoley/Work/docs/governance/subagent-invocations.log")


def append_invocation_row(agent_type: str, context: str, agent_id: str, parent_id: str,
                          duration_ms: int, outcome: str, tool_calls: int) -> None:
    """Append a tab-separated row to the invocations log. Silent on failure
    (telemetry must never break a hook)."""
    try:
        ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
        # Format documented in the file header:
        #   <ISO-8601 timestamp>\t<subagent-name>\t<spawning-context>
        # Extended with optional fields (architect reads what's available):
        #   ...\t<agent_id>\t<parent_id>\t<duration_ms>\t<outcome>\t<tool_calls>
        row = "\t".join([
            ts, agent_type, context, agent_id, parent_id,
            str(duration_ms), outcome, str(tool_calls),
        ])
        with INVOCATIONS_LOG.open("a", encoding="utf-8") as f:
            f.write(row + "\n")
    except Exception:
        pass


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
    # - agent_id / parent_agent_id (Claude Code 2.1.139+ via OTEL plumbing —
    #   may or may not surface in hook payload; we extract speculatively)
    agent_type = (
        payload.get("subagent_type")
        or payload.get("agent_type")
        or payload.get("type")
        or "unknown"
    )
    duration_ms = payload.get("duration_ms") or payload.get("duration") or 0
    outcome = payload.get("outcome") or payload.get("status") or "completed"
    tool_calls = payload.get("tool_calls_count") or payload.get("tool_uses") or 0
    agent_id = payload.get("agent_id") or ""
    parent_id = payload.get("parent_agent_id") or payload.get("parent_id") or ""
    # Spawning context: where the agent was invoked from, if the payload says.
    context = (
        payload.get("description")
        or payload.get("prompt_summary")
        or payload.get("spawning_context")
        or "manual"
    )[:120]  # cap to keep log rows reasonable

    _telemetry_emit(
        "subagent.stop",
        agent_type=str(agent_type),
        outcome=str(outcome),
        duration_ms=int(duration_ms) if duration_ms else 0,
        tool_calls=int(tool_calls) if tool_calls else 0,
        agent_id=str(agent_id),
        parent_id=str(parent_id),
    )

    append_invocation_row(
        agent_type=str(agent_type),
        context=str(context),
        agent_id=str(agent_id),
        parent_id=str(parent_id),
        duration_ms=int(duration_ms) if duration_ms else 0,
        outcome=str(outcome),
        tool_calls=int(tool_calls) if tool_calls else 0,
    )

    print(json.dumps({}))


if __name__ == "__main__":
    main()
