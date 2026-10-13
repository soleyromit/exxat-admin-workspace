#!/usr/bin/env python3
"""
ds-claim-gate — Stop hook.

Blocks ending the turn when the final assistant message emits the affirmative
runtime DS verdict — "GREENLIGHT (runtime)" — but no fresh, PASSING
localhost:4000 visual diff backs it up.

Design notes (learned from a false positive on 2026-06-12):
- Key off the DELIBERATE verdict token only ("greenlight (runtime)"), NOT loose
  prose like "matches the DS". Otherwise merely *discussing* the DS, or honestly
  *reporting deviations*, trips the gate. "GREENLIGHT (static)" is the honest
  "didn't open the browser" path and is always allowed.
- Judge freshness by MARKER AGE (a recent run), not by comparing to the last
  user-message timestamp. Stop-hook feedback is itself recorded as a user turn,
  which made a legit marker look "stale" and got the turn stuck.

A real run leaves .claude/state/last-visual-diff.json (written by
tools/visual-check/visual-diff.mjs) with {ts, result, deviations}.
"""
import json
import os
import sys
from datetime import datetime, timezone

MARKER = ".claude/state/last-visual-diff.json"
FRESH_SECONDS = 30 * 60  # a run within the last 30 min counts as "this turn's"

# The affirmative runtime verdict — the only thing that asserts a visual DS pass.
CLAIM_TOKEN = "greenlight (runtime)"
# Honest non-claims that are always fine even without a marker.
CAVEAT_PHRASES = (
    "greenlight (static)",
    "not visually verified",
    "no visual diff",
    "could not run the visual",
    "server not running",
    "server is down",
)


def parse_ts(s):
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            b.get("text", "")
            for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        )
    return ""


def last_assistant_text(transcript):
    """Most recent assistant text block in the transcript."""
    out = ""
    try:
        with open(transcript) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    e = json.loads(line)
                except json.JSONDecodeError:
                    continue
                role = e.get("type") or (e.get("message") or {}).get("role")
                if role == "assistant":
                    t = text_of((e.get("message") or {}).get("content"))
                    if t.strip():
                        out = t
    except OSError:
        pass
    return out


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    if payload.get("stop_hook_active"):  # avoid loops
        sys.exit(0)

    transcript = payload.get("transcript_path")
    if not transcript or not os.path.exists(transcript):
        sys.exit(0)

    low = last_assistant_text(transcript).lower()
    if CLAIM_TOKEN not in low:
        sys.exit(0)  # no affirmative runtime verdict — nothing to gate
    if any(c in low for c in CAVEAT_PHRASES):
        sys.exit(0)  # also stated an honest non-verification caveat

    # Affirmative runtime verdict: require a fresh, PASSING marker.
    fresh = False
    passing = False
    if os.path.exists(MARKER):
        try:
            with open(MARKER) as f:
                m = json.load(f)
            mts = parse_ts(m.get("ts"))
            if mts is not None:
                if mts.tzinfo is None:
                    mts = mts.replace(tzinfo=timezone.utc)
                age = (datetime.now(timezone.utc) - mts).total_seconds()
                fresh = 0 <= age <= FRESH_SECONDS
            passing = m.get("deviations") == 0 or str(m.get("result", "")).upper() == "DS-MATCH"
        except Exception:
            pass

    if fresh and passing:
        sys.exit(0)

    if fresh and not passing:
        reason = (
            "BLOCKED: message says GREENLIGHT (runtime) but the fresh visual diff "
            "this turn reported DEVIATIONS (.claude/state/last-visual-diff.json). "
            "Don't issue a runtime pass over a failing diff — either fix the flagged "
            "values to the nearest DS token and re-run visual-diff.mjs until it says "
            "DS-MATCH, or report the deviations instead of GREENLIGHT (runtime)."
        )
    else:
        reason = (
            "BLOCKED: message says GREENLIGHT (runtime) but no fresh localhost:4000 "
            "visual diff backs it up (no/old .claude/state/last-visual-diff.json).\n"
            "Either run the real diff:\n"
            "  BASE_URL=http://localhost:<port> node tools/visual-check/visual-diff.mjs \"<route>\"\n"
            "  (needs the product dev server AND the DS viewer at localhost:4000)\n"
            "or downgrade to \"GREENLIGHT (static) — NOT visually verified vs "
            "localhost:4000\" and say why, per Romit's standing rule."
        )
    print(reason, file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()
