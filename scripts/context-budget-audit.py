#!/usr/bin/env python3
"""Context Budget Audit — enforces Ross Mike's context optimization principles.

Two checks:

  1. Agent prompts (docs/watch/agent-prompts/*.md) must contain a
     "## Self-improvement loop" section so agents patch themselves on failure
     rather than silently repeating the same mistake.

  2. CLAUDE.md doc map entries must have a non-empty "Read when" condition.
     Lazy docs without a condition get loaded unconditionally, defeating the
     progressive-disclosure goal.

Severity: WARN only — never blocks. Surfaces gaps without stopping work.
"""

import sys
import re
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
AGENT_PROMPTS_DIR = REPO_ROOT / "docs" / "watch" / "agent-prompts"
CLAUDE_MD = REPO_ROOT / "CLAUDE.md"
SELF_IMPROVEMENT_MARKER = "## Self-improvement loop"
DOC_MAP_SECTION = "## 10. Workspace Doc Map"


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
    # Extract only the section up to the next ## heading
    after = content.split(DOC_MAP_SECTION, 1)[1]
    section = re.split(r"\n##\s", after)[0]
    rows = [ln for ln in section.split("\n") if ln.startswith("|") and "---" not in ln]
    if len(rows) < 2:
        return issues
    for row in rows[1:]:  # skip header
        cells = [c.strip() for c in row.split("|") if c.strip()]
        # Expect at least 2 cells: doc path + read-when condition
        if len(cells) < 2 or not cells[1]:
            doc = cells[0] if cells else row.strip()
            issues.append(
                f"  [missing-read-condition] {doc}\n"
                f"    → Add a 'Read when' condition. Docs without conditions "
                f"load unconditionally, defeating lazy-load."
            )
    return issues


def main() -> None:
    agent_issues = check_agent_prompts()
    claude_issues = check_claude_doc_map()
    all_issues = agent_issues + claude_issues

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
