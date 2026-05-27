#!/usr/bin/env python3
"""DS-012 globals.css conformance audit.

Walks every active admin app and verifies its `app/globals.css` contains
the required DS-overrides blocks (DS Tabs fix, sidebar token, datatable
tokens) per `docs/foundations/admin-globals-template.css`.

Without these blocks, DS components render with broken Tailwind classes
(esp. Tabs orientation) and the theme drifts on dark mode.

Run from repo root:

    python3 scripts/ds-globals-audit.py             # human report
    python3 scripts/ds-globals-audit.py --strict    # exit 1 if any gaps
    python3 scripts/ds-globals-audit.py --fix       # auto-prepend missing
                                                     blocks (use carefully)

What this checks (each is a required marker — case-sensitive substring):

  1. `@import '.../theme.css'`         — DS theme CSS
  2. `@import "tailwindcss"`           — Tailwind base
  3. `DS Tabs fix`                     — comment marker for Tabs fix
  4. `[data-slot="tabs"][data-orientation="horizontal"]`  — fix selector
  5. `[data-slot="tabs-list"][data-variant="line"]`       — line-variant fix
  6. `--sidebar:` or `--sidebar :`     — sidebar token
  7. `--dt-row-hover`                  — datatable tokens
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_PATH = REPO_ROOT / "docs" / "foundations" / "admin-globals-template.css"

# Each marker is a substring that must appear in the admin app's globals.css.
REQUIRED_MARKERS: list[tuple[str, str]] = [
    ("theme-import",    "@exxatdesignux/ui/src/globals.css"),
    ("tailwind-import", '@import "tailwindcss"'),
    ("tabs-fix-comment", "DS Tabs fix"),
    ("tabs-fix-horizontal-selector", '[data-slot="tabs"][data-orientation="horizontal"]'),
    ("tabs-fix-line-variant",        '[data-slot="tabs-list"][data-variant="line"]'),
    ("sidebar-token",   "--sidebar:"),
    ("datatable-token", "--dt-row-hover"),
]


@dataclass
class Gap:
    app: str
    marker_id: str
    description: str

    def to_dict(self) -> dict[str, str]:
        return {"app": self.app, "marker": self.marker_id, "description": self.description}


@dataclass
class Report:
    gaps: list[Gap] = field(default_factory=list)
    apps_checked: int = 0
    apps_clean: int = 0


def find_admin_globals() -> list[Path]:
    """Return all `apps/<product>/admin/app/globals.css` paths."""
    return sorted((REPO_ROOT / "apps").glob("*/admin/app/globals.css"))


def audit_one(globals_css: Path, report: Report) -> bool:
    text = globals_css.read_text(encoding="utf-8")
    rel = str(globals_css.relative_to(REPO_ROOT))
    app = rel.split("/")[1]
    report.apps_checked += 1
    missing = [(mid, snippet) for mid, snippet in REQUIRED_MARKERS if snippet not in text]
    if not missing:
        report.apps_clean += 1
        return True
    for mid, snippet in missing:
        report.gaps.append(Gap(app, mid,
            f"missing required marker: `{snippet[:60]}{'...' if len(snippet) > 60 else ''}`"))
    return False


def fix_one(globals_css: Path) -> bool:
    """Prepend the template's required blocks to a non-conforming globals.css.
    Skips header `@import` lines if they already match (avoids duplicate
    imports). Returns True if file was modified."""
    if not TEMPLATE_PATH.exists():
        return False
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    text = globals_css.read_text(encoding="utf-8")

    # Extract just the body of the template (everything after the header block)
    # so we don't duplicate imports if the file already has them.
    template_body_marker = "/* ── DS Tabs fix"
    if template_body_marker not in template:
        return False
    body_start = template.index(template_body_marker)
    template_body = template[body_start:].rstrip()

    # If the file already contains the tabs fix comment, refuse to fix automatically.
    if "DS Tabs fix" in text:
        return False

    # Find a clean insertion point: after the last @import or @source line.
    lines = text.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("@import") or line.startswith("@source"):
            insert_at = i + 1
    new_lines = lines[:insert_at] + [""] + template_body.splitlines() + [""] + lines[insert_at:]
    globals_css.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    return True


def print_human(report: Report) -> None:
    if not report.gaps:
        print(f"✓ DS-012 globals conformance: {report.apps_clean}/{report.apps_checked} admin apps clean.")
        return

    by_app: dict[str, list[Gap]] = {}
    for g in report.gaps:
        by_app.setdefault(g.app, []).append(g)

    print(f"DS-012 globals conformance: {report.apps_clean}/{report.apps_checked} clean.")
    print(f"Found {len(report.gaps)} gap(s) across {len(by_app)} app(s):\n")
    for app, gaps in by_app.items():
        print(f"## apps/{app}/admin/app/globals.css")
        for g in gaps:
            print(f"  [{g.marker_id}] {g.description}")
        print()
    print("Fix:  python3 scripts/ds-globals-audit.py --fix")
    print("Or:   copy required blocks from docs/foundations/admin-globals-template.css")


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit admin globals.css for DS-012 conformance.")
    parser.add_argument("--strict", action="store_true", help="Exit 1 if gaps found")
    parser.add_argument("--json",   action="store_true", help="Machine-readable output")
    parser.add_argument("--fix",    action="store_true",
                        help="Auto-prepend missing blocks. Refuses if Tabs fix already present (to avoid duplicates).")
    args = parser.parse_args()

    report = Report()
    globals_files = find_admin_globals()
    if not globals_files:
        print("No admin apps found at apps/*/admin/app/globals.css", file=sys.stderr)
        return 0

    if args.fix:
        for path in globals_files:
            if fix_one(path):
                print(f"  fixed: {path.relative_to(REPO_ROOT)}")
        # Re-audit after fix
        report = Report()

    for path in globals_files:
        audit_one(path, report)

    if args.json:
        print(json.dumps({
            "apps_checked": report.apps_checked,
            "apps_clean":   report.apps_clean,
            "gap_count":    len(report.gaps),
            "gaps":         [g.to_dict() for g in report.gaps],
        }, indent=2))
    else:
        print_human(report)

    return 1 if (args.strict and report.gaps) else 0


if __name__ == "__main__":
    sys.exit(main())
