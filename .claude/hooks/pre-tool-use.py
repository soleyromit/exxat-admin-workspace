#!/usr/bin/env python3
"""PreToolUse hook — Design Intelligence Harness DS conformance + a11y advisory.

v0.1: warning-only mode. All violations emit advisory via stderr but exit 0.
Switch to blocking (exit 2) per-rule once supervised observation confirms low
false-positive rate.
"""
import json
import re
import sys


# Rules: (rule_id, regex_pattern, message, file_path_pattern, blocking)
RULES: list[tuple[str, str, str, str, bool]] = [
    ("DS-002a", r"#[0-9a-fA-F]{3,8}\b",
     "Hex color literal banned in apps/**. Use var(--token).",
     r"/apps/", False),
    ("DS-002b", r"\brgba?\s*\(",
     "rgb()/rgba() banned in apps/**. Use var(--token).",
     r"/apps/", False),
    ("DS-002c", r"\bhsla?\s*\(",
     "hsl()/hsla() banned in apps/**. Use var(--token).",
     r"/apps/", False),
    ("DS-003", r"\bbox[Ss]hadow\s*[:=]",
     "Inline boxShadow banned (DS-003). Use shadow-{sm,md,lg} or DS shadow tokens.",
     r"/apps/", False),
    ("DS-001", r"<button(\s|>)",
     "Raw <button> banned in apps/** (DS-001). Use DS Button with explicit variant + size.",
     r"/apps/", False),
    ("DS-004", r"<table(\s|>)",
     "Raw <table> banned in apps/** (DS-004). Use DS Table (admin) or DataTable (student).",
     r"/apps/", False),
    ("DS-005", r"\btoast\s*\(|from\s+['\"]sonner['\"]",
     "toast()/Sonner banned in admin apps (DS-005). Use LocalBanner / SystemBanner.",
     r"/apps/[^/]+/admin/", False),
    ("A11Y-004", r"<i\s+className\s*=\s*[\"']fa-[^\"']+[\"'](?![^>]*aria-hidden)",
     "FA icon missing aria-hidden=\"true\" (A11Y-004 / WCAG 1.3.1).",
     r"/apps/", False),
]


def get_content(tool_name: str, tool_input: dict) -> str:
    if tool_name == "Write":
        return tool_input.get("content", "") or ""
    if tool_name == "Edit":
        return tool_input.get("new_string", "") or ""
    if tool_name == "MultiEdit":
        edits = tool_input.get("edits", [])
        return "\n".join(e.get("new_string", "") or "" for e in edits)
    return ""


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = payload.get("tool_name", "")
    if tool_name not in ("Edit", "Write", "MultiEdit"):
        sys.exit(0)

    tool_input = payload.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    if not file_path or "/apps/" not in file_path:
        sys.exit(0)
    if not file_path.endswith((".tsx", ".ts")):
        sys.exit(0)
    if any(skip in file_path for skip in ["/node_modules/", ".test.", ".spec.", "/.next/", "/dist/"]):
        sys.exit(0)

    content = get_content(tool_name, tool_input)
    if not content:
        sys.exit(0)

    violations: list[tuple[str, str, bool]] = []
    for rule_id, pattern, message, path_pattern, blocking in RULES:
        if not re.search(path_pattern, file_path):
            continue
        try:
            if re.search(pattern, content):
                violations.append((rule_id, message, blocking))
        except re.error:
            continue

    if not violations:
        sys.exit(0)

    lines = [
        "[Design Intelligence Harness — PreToolUse advisory (v0.1, warning-only)]",
        f"File: {file_path}",
        "",
    ]
    for rule_id, message, blocking in violations:
        marker = "BLOCK" if blocking else "WARN"
        lines.append(f"  [{marker}] {rule_id}: {message}")
    lines.extend([
        "",
        "v0.1 is warning-only while rules are tuned for false-positive rate.",
        "Address violations now; will move to hard-block in v0.2.",
    ])

    print("\n".join(lines), file=sys.stderr)

    has_blocking = any(b for _, _, b in violations)
    sys.exit(2 if has_blocking else 0)


if __name__ == "__main__":
    main()
