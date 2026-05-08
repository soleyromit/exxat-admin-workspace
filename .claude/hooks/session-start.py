#!/usr/bin/env python3
"""SessionStart hook — Design Intelligence Harness.

Detects active DS profile from cwd and emits a summary as additionalContext
so the session is grounded in DESIGN.md and the relevant profile.

Reads JSON from stdin (Claude Code hook contract). Emits JSON on stdout
with hookSpecificOutput.additionalContext.
"""
import json
import os
import sys


def detect_profile(cwd: str) -> tuple[str | None, str | None]:
    """Return (profile_name, profile_relative_path) based on cwd."""
    if "/apps/" not in cwd:
        return None, None
    after_apps = cwd.split("/apps/", 1)[1]
    parts = after_apps.split("/")
    if len(parts) >= 2:
        app_type = parts[1]
        if app_type == "admin":
            return "admin", "docs/foundations/ds-profiles/admin.md"
        if app_type == "student":
            return "student", "docs/foundations/ds-profiles/student.md"
    return None, None


def detect_product(cwd: str) -> str | None:
    if "/apps/" not in cwd:
        return None
    after_apps = cwd.split("/apps/", 1)[1]
    parts = after_apps.split("/")
    return parts[0] if parts and parts[0] else None


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    cwd = payload.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    profile, profile_path = detect_profile(cwd)
    product = detect_product(cwd)

    summary_lines = [
        "[Design Intelligence Harness — SessionStart]",
        "",
        "Spec: /DESIGN.md (canonical scholastic spec — read first for any UI work)",
        "Trigger map: docs/triggers.md (auto-fires skills/MCPs)",
        f"Active product: {product or 'workspace-level (not in apps/<product>/)'}",
        f"Active DS profile: {profile or 'not-detected (set when cwd enters apps/<product>/<admin|student>/)'}",
    ]
    if profile_path:
        summary_lines.append(f"Profile path: {profile_path}")
    summary_lines.extend([
        "",
        "Rules in force (DESIGN.md §4):",
        "  DS-001..010, A11Y-001..008, VIZ-001..005, CONTENT-001..004, INTAKE-001..004",
        "",
        "Memories loaded (apply unconditionally):",
        "  - Don't add visual treatments beyond what DS provides",
        "  - Viz first, text annotates",
        "  - Progress bars are last resort",
        "  - Aarti dislikes red in score/rating viz",
        "",
        "PreToolUse hook is in WARNING-ONLY mode (v0.1) for tuning false-positive rate.",
    ])

    print(json.dumps({
        "hookSpecificOutput": {
            "additionalContext": "\n".join(summary_lines)
        }
    }))


if __name__ == "__main__":
    main()
