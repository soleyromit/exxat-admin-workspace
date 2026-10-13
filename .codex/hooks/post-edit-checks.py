#!/usr/bin/env python3
"""PostToolUse hook — merged post-edit checks (one process instead of two).

Combines the former post-css-edit.py (CSS regression guard) and ds-companion.py
(DS conformance companion) into a single Python entrypoint so an edit pays ONE
interpreter cold-start, not two. Both checks are advisory / non-blocking and
self-gate on file type, so merging is behavior-preserving:
  • css_guard      — fires only on product CSS entry points (globals/index.css)
  • ds_companion   — fires only on app/(admin|student) .tsx files

Streams preserved from the originals: CSS warning → stderr, companion → stdout.
"""
import json
import os
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).parent.parent.parent  # .claude/ → Work/

# ── CSS regression guard (was post-css-edit.py) ────────────────────────────────
CSS_SENTINELS = ("globals.css", "index.css")
REQUIRED_MARKER = "@custom-variant data-open"


def css_guard(file_path: str) -> None:
    if not any(s in file_path for s in CSS_SENTINELS):
        return
    if "/apps/" not in file_path:
        return
    if any(skip in file_path for skip in ("/node_modules/", "/.next/", "/dist/")):
        return
    if not os.path.exists(file_path):
        return
    try:
        content = Path(file_path).read_text(encoding="utf-8")
    except OSError:
        return
    if REQUIRED_MARKER in content:
        return

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


# ── DS conformance companion (was ds-companion.py) ─────────────────────────────
def ds_companion(path: str) -> None:
    if not re.search(r"/apps/[^/]+/(admin|student)/.*\.tsx$", path):
        return
    if path.endswith(".d.ts") or "/node_modules/" in path:
        return

    rel = path.split("/Work/", 1)[-1]
    fname = os.path.basename(path)

    heads = []
    try:
        src = open(path, encoding="utf-8").read()
    except Exception:
        src = ""
    for _ in re.finditer(r"<h[12]\b(?![^>]*font-heading)[^>]*\btext-(?:2xl|3xl|4xl|5xl|6xl|\[(?:2[4-9]|[3-9]\d)px\])", src):
        heads.append("a display heading is not using `font-heading` (DS serif) — titles are serif, not sans bold")
    if re.search(r"text-(?:3xl|4xl|5xl|6xl)\b(?![^\"']*font-heading)", src) and "font-heading" not in src:
        heads.append("large display numerals may be sans — DS KPI numbers use `font-heading` serif")

    print("\n📐 DS COMPANION · @exxatdesignux/ui · " + fname)
    if heads:
        print("  ✗ STATIC HEADS-UP (per the DS):")
        for h in dict.fromkeys(heads):
            print("     · " + h + "  → FIX: add `font-heading`. See docs/governance/ds-visual-reference.md")
    print("  ACTION REQUIRED before saying this matches the DS — run the conformance gate point-blank:")
    print("    1. node tools/visual-check/ds-conformance.mjs \"<route>\"   (deterministic: serif titles · 12px-aware · fonts · radii vs the DS's own tokens)")
    print("    2. spawn the ds-conformance-reviewer agent                  (layout · pattern · components vs localhost:4000 + ds-visual-reference.md + the Claude Design HTML)")
    print("  Then tell Romit, point-blank: DS-MATCH, or each DEVIATION as { what's wrong · the DS value · the fix }.")
    print("  Rule: never claim \"matches the DS\" without having cited globals.css or localhost:4000. (file: " + rel + ")")


def main() -> None:
    try:
        event = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    if event.get("tool_name", "") not in ("Edit", "Write", "MultiEdit"):
        sys.exit(0)

    file_path = event.get("tool_input", {}).get("file_path", "")
    if not file_path:
        sys.exit(0)

    css_guard(file_path)
    ds_companion(file_path)
    sys.exit(0)


if __name__ == "__main__":
    main()
