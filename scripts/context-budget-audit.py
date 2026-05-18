#!/usr/bin/env python3
"""Context Budget Audit — enforces Ross Mike's context optimization principles.

Three checks:

  1. Agent prompts (docs/watch/agent-prompts/*.md) must contain a
     "## Self-improvement loop" section so agents patch themselves on failure
     rather than silently repeating the same mistake.

  2. CLAUDE.md doc map entries must have a non-empty "Read when" condition.
     Lazy docs without a condition get loaded unconditionally.

  3. CLAUDE.md files must stay within line-count budgets. Files that drift
     above the budget erode the token savings on every message.

     Budgets:
       Root CLAUDE.md (CLAUDE.md)         → 100 lines max
       Per-product CLAUDE.md              → 100 lines max
       Agent prompts (agent-prompts/*.md) → 300 lines max (they run once, not every message)

Severity: WARN only — never blocks commits. Run as scheduled routine for drift detection.

Usage:
  python3 scripts/context-budget-audit.py           # pre-commit mode (brief)
  python3 scripts/context-budget-audit.py --full    # full report with sizes
"""

import sys
import re
import argparse
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
AGENT_PROMPTS_DIR = REPO_ROOT / "docs" / "watch" / "agent-prompts"
CLAUDE_MD = REPO_ROOT / "CLAUDE.md"
SELF_IMPROVEMENT_MARKER = "## Self-improvement loop"
DOC_MAP_SECTION = "## 10. Workspace Doc Map"

# Line budget per file type
BUDGETS = {
    "root_claude":    100,
    "product_claude": 100,
    "agent_prompt":   300,
}


def find_claude_mds() -> list[Path]:
    """Find all CLAUDE.md files in the repo."""
    return [
        p for p in REPO_ROOT.rglob("CLAUDE.md")
        if "node_modules" not in str(p)
        and ".git" not in str(p)
        and "exxat-ds" not in str(p)
        and "studentUX" not in str(p)
    ]


def check_line_budgets() -> list[str]:
    """Warn if any CLAUDE.md or agent prompt exceeds its line budget."""
    issues = []

    # Check root CLAUDE.md
    if CLAUDE_MD.exists():
        lines = len(CLAUDE_MD.read_text().splitlines())
        budget = BUDGETS["root_claude"]
        if lines > budget:
            issues.append(
                f"  [over-budget] CLAUDE.md — {lines} lines (budget: {budget})\n"
                f"    → Move non-essential content to docs/CLAUDE-RULES.md or a lazy doc."
            )

    # Check per-product CLAUDE.md files
    for f in find_claude_mds():
        if f == CLAUDE_MD:
            continue
        lines = len(f.read_text().splitlines())
        budget = BUDGETS["product_claude"]
        if lines > budget:
            rel = f.relative_to(REPO_ROOT)
            issues.append(
                f"  [over-budget] {rel} — {lines} lines (budget: {budget})\n"
                f"    → Move DS component lists, scaffolding templates, and "
                f"canonical maps to lazy pattern docs."
            )

    # Check agent prompts
    if AGENT_PROMPTS_DIR.exists():
        for f in sorted(AGENT_PROMPTS_DIR.glob("*.md")):
            lines = len(f.read_text().splitlines())
            budget = BUDGETS["agent_prompt"]
            if lines > budget:
                rel = f.relative_to(REPO_ROOT)
                issues.append(
                    f"  [over-budget] {rel} — {lines} lines (budget: {budget})\n"
                    f"    → Split into sub-steps or move reference content out."
                )

    return issues


def check_agent_prompts() -> list[str]:
    """Warn if any agent prompt is missing the self-improvement loop."""
    issues = []
    if not AGENT_PROMPTS_DIR.exists():
        return issues
    for f in sorted(AGENT_PROMPTS_DIR.glob("*.md")):
        content = f.read_text()
        if SELF_IMPROVEMENT_MARKER not in content:
            rel = f.relative_to(REPO_ROOT)
            issues.append(
                f"  [missing-self-improvement] {rel}\n"
                f'    → Add "## Self-improvement loop" section — agent must patch '
                f"its own prompt when a step fails."
            )
    return issues


def check_claude_doc_map() -> list[str]:
    """Warn if any CLAUDE.md doc map entry is missing a 'Read when' condition."""
    issues = []
    if not CLAUDE_MD.exists():
        return issues
    content = CLAUDE_MD.read_text()
    if DOC_MAP_SECTION not in content:
        return issues
    after = content.split(DOC_MAP_SECTION, 1)[1]
    section = re.split(r"\n##\s", after)[0]
    rows = [ln for ln in section.split("\n") if ln.startswith("|") and "---" not in ln]
    if len(rows) < 2:
        return issues
    for row in rows[1:]:
        cells = [c.strip() for c in row.split("|") if c.strip()]
        if len(cells) < 2 or not cells[1]:
            doc = cells[0] if cells else row.strip()
            issues.append(
                f"  [missing-read-condition] {doc}\n"
                f"    → Add a 'Read when' condition — lazy docs without conditions "
                f"load unconditionally."
            )
    return issues


def full_report() -> str:
    """Generate a human-readable size report for all CLAUDE.md files and agent prompts."""
    lines = ["# Context Budget Report\n"]

    lines.append("## CLAUDE.md files\n")
    all_claudes = sorted(find_claude_mds(), key=lambda p: str(p))
    for f in all_claudes:
        count = len(f.read_text().splitlines())
        budget = BUDGETS["root_claude"] if f == CLAUDE_MD else BUDGETS["product_claude"]
        status = "✅" if count <= budget else "⚠️ OVER"
        rel = f.relative_to(REPO_ROOT)
        lines.append(f"  {status}  {rel}  ({count}/{budget} lines)")

    if AGENT_PROMPTS_DIR.exists():
        lines.append("\n## Agent prompts\n")
        for f in sorted(AGENT_PROMPTS_DIR.glob("*.md")):
            count = len(f.read_text().splitlines())
            budget = BUDGETS["agent_prompt"]
            status = "✅" if count <= budget else "⚠️ OVER"
            rel = f.relative_to(REPO_ROOT)
            lines.append(f"  {status}  {rel}  ({count}/{budget} lines)")

    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--full", action="store_true", help="Print full size report.")
    args = ap.parse_args()

    if args.full:
        print(full_report())
        sys.exit(0)

    budget_issues  = check_line_budgets()
    agent_issues   = check_agent_prompts()
    claude_issues  = check_claude_doc_map()
    all_issues     = budget_issues + agent_issues + claude_issues

    if not all_issues:
        print("pass")
        sys.exit(0)

    print(f"{len(all_issues)} context budget gap(s):\n")
    for issue in all_issues:
        print(issue)

    # Warn only — never blocks commits
    sys.exit(0)


if __name__ == "__main__":
    main()
