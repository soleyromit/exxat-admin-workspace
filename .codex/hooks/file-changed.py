#!/usr/bin/env python3
"""FileChanged hook — fires when one of the workspace registries is
edited via Edit/Write/MultiEdit (synchronous detection by Claude Code's
file-watcher).

Pairs with the mtime-tracking inside user-prompt-submit.py:
- This hook catches in-session edits by Claude tools (synchronous).
- The mtime-tracking catches edits from external editors (next prompt).

Output: brief additionalContext that tells the assistant "registry X
changed; re-read before relying on prior summaries."

Reads JSON from stdin; emits JSON on stdout (Claude Code hook contract).
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

    # Hook payload schema for FileChanged includes the changed file path.
    # Claude Code conventions vary slightly; check known field names.
    file_path = (
        payload.get("file")
        or payload.get("file_path")
        or payload.get("path")
        or ""
    )
    if not file_path:
        # Without the file path, we can't say anything useful
        print(json.dumps({}))
        return

    _telemetry_emit("registry.file-changed", file=file_path)

    # Show a short note. Don't dump the file content — the assistant can
    # Read it on demand. Surface only the fact + path + reason.
    rel = file_path
    if file_path.startswith("/Users/romitsoley/Work/"):
        rel = file_path[len("/Users/romitsoley/Work/"):]

    lines = [
        "[FileChanged — workspace registry edited]",
        "",
        f"  Path: {rel}",
        "",
        "Re-read this file before relying on prior summaries — your in-context",
        "view is now stale. The pre-commit hook will regenerate the digest on",
        "next commit; if you need a current digest now, run:",
        "  python3 scripts/generate-digest.py",
    ]

    print(json.dumps({
        "hookSpecificOutput": {
            "additionalContext": "\n".join(lines)
        }
    }))


if __name__ == "__main__":
    main()
