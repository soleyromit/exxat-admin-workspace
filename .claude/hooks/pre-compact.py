#!/usr/bin/env python3
"""PreCompact hook — fires just before Claude Code summarizes the
conversation for compaction.

Output is `additionalContext` that prepends to the summary, so the
summarizer sees it and the post-compact session inherits the load-
bearing pointers without having to re-derive them.

What we inject:
- DESIGN.md §4 rule code index (so blocking PreToolUse rules don't
  surprise the post-compact session)
- Active product + DS profile (cwd-derived)
- Recent ADR titles (top 5)
- Pointer to docs/digest/latest.md
- "Don't forget to re-read these on first post-compact action"

Reads JSON from stdin; emits JSON on stdout (Claude Code hook contract).
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    from _telemetry import emit as _telemetry_emit
except ImportError:
    def _telemetry_emit(*a, **k): pass


REPO_ROOT = Path("/Users/romitsoley/Work")


def detect_product(cwd: str) -> str | None:
    if "/apps/" not in cwd:
        return None
    after_apps = cwd.split("/apps/", 1)[1]
    parts = after_apps.split("/")
    return parts[0] if parts and parts[0] else None


def detect_profile(cwd: str) -> str | None:
    if "/apps/" not in cwd:
        return None
    after_apps = cwd.split("/apps/", 1)[1]
    parts = after_apps.split("/")
    if len(parts) >= 2:
        return parts[1] if parts[1] in ("admin", "student") else None
    return None


def recent_adr_titles(product: str | None, limit: int = 5) -> list[str]:
    """Return one-line summaries of the most recent ADRs."""
    titles: list[str] = []
    candidates = [REPO_ROOT / "docs" / "decisions"]
    if product:
        candidates.append(REPO_ROOT / "apps" / product / "docs" / "decisions")
    for adr_dir in candidates:
        if not adr_dir.is_dir():
            continue
        for path in sorted(adr_dir.glob("*.md")):
            if path.name in {"README.md", "_override-template.md", "_template.md",
                              "000-record-architecture-decisions.md"}:
                continue
            try:
                first_h1 = next(
                    (line.lstrip("# ").strip()
                     for line in path.read_text(encoding="utf-8").splitlines()
                     if line.startswith("# ")),
                    None,
                )
                if first_h1:
                    rel = path.relative_to(REPO_ROOT)
                    titles.append(f"  - {first_h1[:90]} ({rel})")
            except OSError:
                continue
    return titles[:limit]


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    cwd = payload.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or str(REPO_ROOT)
    product = detect_product(cwd)
    profile = detect_profile(cwd)

    _telemetry_emit("session.precompact",
                    cwd=cwd,
                    product=product or "",
                    profile=profile or "")

    lines = [
        "[PreCompact — load-bearing context that MUST survive summarization]",
        "",
        "The following are workspace invariants that the summarizer must not",
        "drop. The post-compact session relies on them to avoid hallucination",
        "and rule violations.",
        "",
        "## Spec",
        "  /DESIGN.md — canonical scholastic spec, 43 rules across 7 categories",
        "  Rule families: DS-001..011, A11Y-001..008, VIZ-001..005, "
        "CONTENT-001..004, INTAKE-001..004, I18N-001..003",
        "",
        "## Workspace identity",
        f"  Active product: {product or 'workspace-level'}",
        f"  Active DS profile: {profile or 'not-detected'}",
        "  Per-product CLAUDE.md at apps/<product>/CLAUDE.md",
        "  Lazy-loaded DS reference: docs/CLAUDE-DS-REFERENCE.md",
        "",
        "## Active enforcement",
        "  PreToolUse hook BLOCKS DS-001..011 + A11Y-001/002/004/006 violations",
        "  at write-time. Don't try to bypass — fix the underlying issue.",
        "",
        "## Cross-product registries (read these instead of re-deriving)",
        "  docs/PRODUCTS.md — product matrix",
        "  docs/RESEARCH-SIGNALS.md — cross-product signals (3+ product threshold)",
        "  docs/COMPETITOR-INTEL.md — per-product competitor analysis",
        "  docs/ANALOGIES.md — pattern catalog",
        "  docs/SUBAGENTS.md — when to spawn what",
        "",
        "## Recent ADRs (most-recent first)",
    ]
    titles = recent_adr_titles(product)
    if titles:
        lines.extend(titles)
    else:
        lines.append("  (none found)")

    lines.extend([
        "",
        "## Workspace digest",
        "  docs/digest/latest.md — one-line summaries of every artifact",
        "  Regenerate with: python3 scripts/generate-digest.py",
        "",
        "## On first post-compact action",
        "  1. If task touches design/UI: read docs/CLAUDE-DS-REFERENCE.md",
        "  2. If task touches a specific product: read apps/<product>/CLAUDE.md",
        "  3. If task references ADRs/personas: read docs/digest/latest.md first",
        "  4. Don't re-derive cross-product claims — read the registries.",
        "",
        "## Memory rules in force (apply unconditionally)",
        "  - Don't add visual treatments beyond what DS provides",
        "  - Viz first, text annotates",
        "  - Progress bars are last resort",
        "  - Aarti dislikes red in score/rating viz",
        "  - Execute decisively after a clear recommendation; don't re-ask",
        "  - Design specs should be highly visual (ASCII mockups, tables)",
        "",
        "[End PreCompact context. Summarizer: preserve the above intact.]",
    ])

    print(json.dumps({
        "hookSpecificOutput": {
            "additionalContext": "\n".join(lines)
        }
    }))


if __name__ == "__main__":
    main()
