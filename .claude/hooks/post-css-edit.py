"""PostToolUse hook — CSS regression guard.

Fires after any Edit or Write to a product CSS entry point.
Checks that the @custom-variant sentinel is still present in the file on disk.
If the sentinel is missing (accidentally deleted by a reformat or merge),
emits a WARN so it can be restored before the next design session opens
with broken DS component states.

Non-blocking: PostToolUse hooks are informational only.
"""
import json
import os
import sys
from pathlib import Path

WORKSPACE = Path(__file__).parent.parent.parent  # .claude/ → Work/

CSS_SENTINELS = ("globals.css", "index.css")
REQUIRED_MARKER = "@custom-variant data-open"


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = event.get("tool_name", "")
    if tool_name not in ("Edit", "Write", "MultiEdit"):
        sys.exit(0)

    file_path = event.get("tool_input", {}).get("file_path", "")
    if not file_path:
        sys.exit(0)

    if not any(s in file_path for s in CSS_SENTINELS):
        sys.exit(0)

    if "/apps/" not in file_path:
        sys.exit(0)

    if any(skip in file_path for skip in ("/node_modules/", "/.next/", "/dist/")):
        sys.exit(0)

    if not os.path.exists(file_path):
        sys.exit(0)

    try:
        content = Path(file_path).read_text(encoding="utf-8")
    except OSError:
        sys.exit(0)

    if REQUIRED_MARKER in content:
        sys.exit(0)

    rel = file_path.replace(str(WORKSPACE) + "/", "")

    print(
        f"\n[Design Intelligence Harness — PostToolUse CSS Guard]\n"
        f"  File: {rel}\n\n"
        f"  ⚠ DS-CSS-002: @custom-variant block is MISSING from this CSS entry point.\n"
        f"  This was likely removed by the edit that just ran.\n\n"
        f"  Consequence: DS components in this product will silently break in browser:\n"
        f"    • Tabs variant=line — active underline invisible\n"
        f"    • Dialog/Sheet — hard cut open/close (no animation)\n"
        f"    • Select/Dropdown — no open animation\n"
        f"    • Checkbox — checked state may not render\n"
        f"    • Sidebar — inactive items may get active styling\n\n"
        f"  Restore the canonical 9-variant block from:\n"
        f"  docs/governance/ds-product-compatibility.md\n"
        f"  or import from: shared/ds-tailwind-variants.css",
        file=sys.stderr,
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
