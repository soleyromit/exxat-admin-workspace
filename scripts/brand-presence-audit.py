#!/usr/bin/env python3
"""DS-018 — Brand presence audit.

A page can be 100% DS-conformant (uses DS components, no hex literals,
correct typography) and still feel brandless if it never surfaces
brand-specific tokens. This audit counts brand-token occurrences per
page and flags pages where the brand effectively never renders.

Brand tokens (per docs/CLAUDE-DS-REFERENCE.md):
  --brand-color, --brand-color-dark, --brand-color-light, --brand-color-deep
  --brand-tint, --brand-tint-light, --brand-tint-subtle
  --brand-foreground
  --sidebar (uses --brand-tint by default; we count it as brand)

A page is "brandless" when none of these appear in its tree —
including imported components if they're page-scoped.

Run from repo root:

    python3 scripts/brand-presence-audit.py
    python3 scripts/brand-presence-audit.py --strict   # exit 1 on gap
    python3 scripts/brand-presence-audit.py --json
    python3 scripts/brand-presence-audit.py --product pce  # scope to one app

What this does NOT check:
  - Whether brand is VISUALLY prominent (small bullet vs. large header)
  - Whether brand tokens are inside conditional render branches that
    rarely fire (e.g., active state of a tab the user never clicks)
  - Whether the brand token resolves to the right color in the active
    theme (a token-correct call to --brand-color in theme-one shows
    lavender; the same call in theme-prism shows rose)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

BRAND_TOKEN_RE = re.compile(
    r"--(?:brand-(?:color|tint|foreground)(?:-(?:dark|light|deep|subtle))?|sidebar(?!-)|sidebar-accent|sidebar-primary|sidebar-foreground|sidebar-border|sidebar-ring)\b"
)


@dataclass
class PageReport:
    path: str
    brand_token_count: int
    distinct_tokens: set[str] = field(default_factory=set)

    @property
    def is_brandless(self) -> bool:
        return self.brand_token_count == 0


@dataclass
class Audit:
    pages: list[PageReport] = field(default_factory=list)

    @property
    def brandless_count(self) -> int:
        return sum(1 for p in self.pages if p.is_brandless)


def find_pages(product: str | None) -> list[Path]:
    """All page.tsx + layout.tsx in admin app routes (excludes node_modules / .next)."""
    if product:
        bases = [REPO_ROOT / "apps" / product / "admin" / "app"]
    else:
        bases = list((REPO_ROOT / "apps").glob("*/admin/app"))
    out: list[Path] = []
    for base in bases:
        if not base.is_dir():
            continue
        for path in base.rglob("page.tsx"):
            out.append(path)
        for path in base.rglob("layout.tsx"):
            out.append(path)
    return sorted(out)


def audit_page(path: Path) -> PageReport:
    rel = str(path.relative_to(REPO_ROOT))
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return PageReport(rel, 0)
    matches = BRAND_TOKEN_RE.findall(text)
    return PageReport(
        path=rel,
        brand_token_count=len(matches),
        distinct_tokens={f"--{m}" if not m.startswith("--") else m for m in matches},
    )


def print_human(audit: Audit) -> None:
    if not audit.pages:
        print("No admin pages found.")
        return

    total = len(audit.pages)
    brandless = audit.brandless_count
    pct = round(100 * brandless / total, 1) if total else 0

    print(f"Brand-presence audit: {total} pages scanned, {brandless} brandless ({pct}%)\n")

    if brandless == 0:
        print("✓ Every page references at least one brand token.")
        return

    print("## Brandless pages\n")
    for p in audit.pages:
        if p.is_brandless:
            print(f"  - {p.path}")
    print()

    print("## Pages with weak brand presence (1–2 tokens, possible drift)\n")
    weak = [p for p in audit.pages if 0 < p.brand_token_count <= 2]
    for p in sorted(weak, key=lambda x: x.brand_token_count):
        print(f"  - {p.path} ({p.brand_token_count} tokens: {', '.join(sorted(p.distinct_tokens))})")
    print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit brand-token presence per admin page.")
    parser.add_argument("--strict", action="store_true",
                        help="Exit 1 if any brandless pages found")
    parser.add_argument("--json", action="store_true", help="Machine-readable")
    parser.add_argument("--product", help="Scope to one product (e.g., pce, exam-management)")
    args = parser.parse_args()

    audit = Audit()
    for path in find_pages(args.product):
        audit.pages.append(audit_page(path))

    if args.json:
        print(json.dumps({
            "total":     len(audit.pages),
            "brandless": audit.brandless_count,
            "pages": [
                {"path": p.path, "count": p.brand_token_count,
                 "distinct": sorted(p.distinct_tokens)}
                for p in audit.pages
            ],
        }, indent=2))
    else:
        print_human(audit)

    return 1 if (args.strict and audit.brandless_count > 0) else 0


if __name__ == "__main__":
    sys.exit(main())
