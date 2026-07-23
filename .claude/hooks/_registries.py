"""Shared registry-tracking helper.

Tracks mtimes of workspace registry files so hooks can detect when
they've changed and surface the diff to the assistant. Used by:

- session-start.py — initial inventory after compact/resume
- user-prompt-submit.py — per-prompt freshness check (mid-session
  registry edits get picked up without a new session)

State is persisted at docs/telemetry/registry-state.json. Failures are
silent: hooks must not break when the state file is missing or corrupt.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

REPO_ROOT = Path("/Users/romitsoley/Work")
STATE_PATH = REPO_ROOT / "docs" / "telemetry" / "registry-state.json"

# The registries this module watches. Adding a new registry → add it here
# AND add the read in session-start.py / user-prompt-submit.py.
REGISTRIES: list[str] = [
    "DESIGN.md",
    "CLAUDE.md",
    "tools/ds/source.mjs",
    "docs/PRODUCTS.md",
    "docs/ANALOGIES.md",
    "docs/RESEARCH-SIGNALS.md",
    "docs/COMPETITOR-INTEL.md",
    "docs/triggers.md",
]


def _load_state() -> dict[str, float]:
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _save_state(state: dict[str, float]) -> None:
    try:
        STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")
    except OSError:
        pass


def get_changed() -> list[tuple[str, float]]:
    """Return list of (path, current_mtime) for registries whose mtime
    differs from the saved state. Updates state to reflect the current
    snapshot. Returns an empty list if nothing changed (or first run).
    """
    state = _load_state()
    changed: list[tuple[str, float]] = []

    new_state: dict[str, float] = {}
    for rel in REGISTRIES:
        full = REPO_ROOT / rel
        try:
            mtime = full.stat().st_mtime
        except OSError:
            continue
        new_state[rel] = mtime
        prior = state.get(rel)
        if prior is None:
            # First-run: don't mark as changed (would dump every registry
            # on first session). Just record the mtime.
            continue
        if mtime > prior:
            changed.append((rel, mtime))

    _save_state(new_state)
    return changed


def reset() -> None:
    """Wipe state. Next call to get_changed will treat all registries as
    first-seen (no change report)."""
    try:
        STATE_PATH.unlink()
    except OSError:
        pass


def snapshot_summary() -> str:
    """Brief human-readable summary of all tracked registries' current
    state. Used at SessionStart compact-recovery to remind the assistant
    what registries exist + how big they are."""
    lines = ["Workspace registries (last seen on disk):"]
    for rel in REGISTRIES:
        full = REPO_ROOT / rel
        try:
            row_count = sum(1 for line in full.read_text(encoding="utf-8").splitlines()
                            if line.startswith("|") and not line.startswith("|---")
                            and "id" not in line.lower()[:8])
            size_kb = full.stat().st_size // 1024
            lines.append(f"  - {rel} ({size_kb}kB, ~{row_count} rows)")
        except OSError:
            lines.append(f"  - {rel} (NOT FOUND)")
    return "\n".join(lines)
