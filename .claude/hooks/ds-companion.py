#!/usr/bin/env python3
"""
DS Companion — PostToolUse hook. Your always-on @exxatdesignux/ui conformance
companion. Fires after every edit to an app page/component and, point-blank,
drives the DS-conformance workflow so it is never skipped and never a promise.

It is the CONSCIENCE; Claude is the EXECUTOR. After a UI edit it:
  1. does a fast STATIC heads-up (residual deviations the write-time blocker
     can't express),
  2. injects the binding instruction to run the DETERMINISTIC render check +
     the DS-grounded reviewer and report DS-MATCH / DEVIATIONS point-blank.

Output is injected as context (PostToolUse). Never blocks — a companion, not a gate.
"""
import json
import re
import sys
import os

def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    ti = payload.get("tool_input", {}) or {}
    path = ti.get("file_path") or ti.get("path") or ""
    # Only speak for app UI files.
    if not re.search(r"/apps/[^/]+/(admin|student)/.*\.tsx$", path):
        sys.exit(0)
    if path.endswith(".d.ts") or "/node_modules/" in path:
        sys.exit(0)

    rel = path.split("/Work/", 1)[-1]
    fname = os.path.basename(path)

    # Fast static heads-up — soft deviations not hard-blocked at write time.
    heads = []
    try:
        src = open(path, encoding="utf-8").read()
    except Exception:
        src = ""
    # display heading rendered without the DS serif (belt-and-suspenders vs DS-013)
    for m in re.finditer(r"<h[12]\b(?![^>]*font-heading)[^>]*\btext-(?:2xl|3xl|4xl|5xl|6xl|\[(?:2[4-9]|[3-9]\d)px\])", src):
        heads.append("a display heading is not using `font-heading` (DS serif) — titles are serif, not sans bold")
    # KPI-ish big number in a span/div without font-heading (the offline.html numerals are serif)
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
    sys.exit(0)

if __name__ == "__main__":
    main()
