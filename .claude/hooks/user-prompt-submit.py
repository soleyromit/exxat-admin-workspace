#!/usr/bin/env python3
"""UserPromptSubmit hook — runs trigger patterns against the prompt.

Emits a required-actions list as additionalContext so the assistant
invokes the right skills/MCPs before responding.

Falls back to reading the most recent user message from transcript_path
if the prompt text isn't directly on stdin.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
try:
    from _registries import REPO_ROOT, get_changed
except ImportError:
    REPO_ROOT = Path("/Users/romitsoley/Work")
    def get_changed(): return []


# Subset for v0.1. Full canonical map: docs/triggers.md
# Tuple shape: (regex_pattern, action_id)
TRIGGERS: list[tuple[str, str]] = [
    # DS profile switch (priority 1)
    (r"\b(switch to|moving to|now (the )?)?student( app)?\b", "ds-profile-switch:student"),
    (r"\b(switch to|moving to|now (the )?)?admin( app)?\b", "ds-profile-switch:admin"),
    (r"\bstudentUX\b|@exxat/student", "ds-profile-switch:student"),
    (r"\bExxat-DS\b|@exxat/ds|\btheme-(one|prism)\b", "ds-profile-switch:admin"),

    # Living context / intake (priority 2)
    (r"\b(meeting|call|spoke|talked|discussed)\s+(with|to)\s+\w+\b", "intake:granola-query"),
    (r"\b(yesterday|today|this morning|last week)('?s)?\s+(meeting|call|sync|standup)\b", "intake:granola-query"),
    (r"\b(Aarti|Nipun|Himanshu)\s+(said|wants|decided|asked)\b", "intake:granola-query-by-person"),
    (r"\b(decided|going with|the answer is|let'?s commit to|final call)\b", "intake:adr-draft"),
    (r"\b(we call (this|it|them)|let'?s call (this|it|them)|term for (this|it|them) is|means)\b", "intake:glossary-add"),

    # Design references (priority 3)
    (r"figma\.com/(design|board|slides|make)/", "ref:figma-mcp"),
    (r"magicpatterns\.com/c/", "ref:magicpatterns-mcp"),

    # Design intent (priority 4)
    (r"\b(design|build|create|add)\s+(a|an|the)?\s*(new\s+)?(screen|page|view|dashboard|component|feature|flow)\b", "intent:design"),
    (r"\b(redesign|refactor|rework|polish|improve|tighten)\s+(this|the|that)\b", "intent:redesign"),

    # Library refs (priority 5)
    (r"\b(React|Next\.?js|Tailwind|Recharts|Radix|shadcn|TanStack|Framer|Zod|Zustand|Vercel AI SDK)\b", "lib:context7"),

    # Code work (priority 6)
    (r"\b(fix|debug|broken|why is(n'?t)?|not working|throws?|crashes?)\b", "work:debug"),
    (r"\b(ship|merge|ready|done|complete|PR|pull request)\b", "work:verify-before-complete"),

    # Stochastic variance (priority 7) — design N variants in parallel
    (r"\bdesign\s+\d+\s+(versions?|variants?|options|alternatives)\b", "stochastic:design-variants"),
    (r"\bshow me \d+ (ways|versions?|variants?|options)\b", "stochastic:design-variants"),
    (r"\b\d+\s+(versions?|variants?|options|alternatives)\s+of\b", "stochastic:design-variants"),
    (r"\b(three options|alternative approaches)\b", "stochastic:design-variants"),

    # Designer override loop (priority 8) — capture rule overrides as ADR + ledger
    (r"\b(ignore (the|this) rule|make an exception|override\s+(DS|A11Y|VIZ|CONTENT|INTAKE)-\d{3}|don'?t apply\s+(DS|A11Y|VIZ|CONTENT|INTAKE)-\d{3}|exception (here|to))\b", "intake:override"),

    # Rule citation (priority 8) — surface DESIGN.md §4 rule text when cited
    (r"\b(DS|A11Y|VIZ|CONTENT|INTAKE)-\d{3}\b", "rule:cite-and-surface"),

    # Research intake (priority 9) — rr-insights distillation, sibling to Granola intake
    # NOTE: trailing \b dropped after ':' because ':' is non-word; \b would only match
    # if next char is a word character. We want "insight: faculty…" to match.
    (r"\b(from rr-insights|rr-insights:|research insight|research finding|study finding|insight:|theme:)", "intake:research-insight"),
    (r"\b(from rr-insights|rr-insights:).+\b(theme|cluster)\b", "intake:research-theme"),
    (r"\b(across \d+ interviews?|N\s*=\s*\d+|consistently mentioned|majority of (participants|interviewees))\b", "intake:research-theme"),
    (r"\[(P\d+|Faculty\s+\d+|Participant\s+\d+)\]", "intake:research-insight"),
]

ACTION_DESCRIPTIONS: dict[str, str] = {
    "ds-profile-switch:student": "Load docs/foundations/ds-profiles/student.md and announce the switch (imports, fonts, templates, tone, a11y emphasis update)",
    "ds-profile-switch:admin": "Load docs/foundations/ds-profiles/admin.md and announce the switch",
    "intake:granola-query": "Invoke the intake skill (.claude/skills/intake/SKILL.md) with action=granola-query — runs mcp__claude_ai_Granola__query_granola_meetings, lists candidates, confirms before saving",
    "intake:granola-query-by-person": "Invoke the intake skill with action=granola-query-by-person — filters Granola query by person name + recent dates",
    "intake:adr-draft": "Invoke the intake skill with action=adr-draft — drafts an ADR; user confirms before write",
    "intake:glossary-add": "Invoke the intake skill with action=glossary-add — drafts a glossary entry for active product; user confirms before write",
    "intake:transcript-paste": "Invoke the intake skill with action=transcript-paste — saves transcript, extracts decisions + glossary candidates + persona refs, confirms each before write",
    "ref:figma-mcp": "Run mcp__claude_ai_Figma__get_design_context with parsed fileKey + nodeId before generating UI",
    "ref:magicpatterns-mcp": "Run mcp__claude_ai_Magic_Patterns__read_artifact_files to load the referenced prototype",
    "intent:design": "Invoke superpowers:brainstorming first; check Mobbin search_screens; check Granola for relevant meetings; only then generate UI via frontend-design",
    "intent:redesign": "Invoke superpowers:brainstorming and frontend-design before changing visuals",
    "lib:context7": "Run mcp__plugin_context7_context7__resolve-library-id then query-docs for current API; do not generate from memory",
    "work:debug": "Invoke superpowers:systematic-debugging skill before proposing fixes",
    "work:verify-before-complete": "Invoke superpowers:verification-before-completion before claiming complete; then superpowers:requesting-code-review",
    "stochastic:design-variants": "Invoke /design-variants slash command (.claude/commands/design-variants.md) — spawn N parallel agents in worktrees per docs/patterns/process/design-variants.md. Pre-flight: clean tree, active product, DS profile, then dispatch.",
    "intake:override": "Invoke the intake skill with action=override — capture as override ADR (template at docs/decisions/_override-template.md) + pattern exception + ledger row in docs/governance/exceptions.md. Sunset criterion + rationale mandatory. User confirms before write.",
    "rule:cite-and-surface": "User cited a workspace rule (DS-NNN / A11Y-NNN / VIZ-NNN / CONTENT-NNN / INTAKE-NNN). Read the rule's text from /DESIGN.md §4 and surface it in your response so the user knows you understand which rule binds. If they're proposing an override, route to intake:override.",
    "intake:research-insight": "Invoke the research-intake skill (.claude/skills/research-intake/SKILL.md) with action=insight — saves raw insight to apps/<product>/docs/research/insights/, extracts ADR-worthy decisions + persona updates + glossary candidates. Confirm-before-write each artifact.",
    "intake:research-theme": "Invoke the research-intake skill with action=theme — saves to research/insights/themes/, captures supporting quote count + sample quotes + implications.",
}


def get_prompt(payload: dict) -> str:
    """Best-effort extraction of the user prompt text."""
    # Direct (most setups)
    for key in ("prompt", "user_prompt", "message"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value

    # Fallback: read transcript JSONL
    transcript_path = payload.get("transcript_path", "")
    if not transcript_path or not Path(transcript_path).exists():
        return ""

    try:
        with open(transcript_path) as f:
            lines = f.readlines()
    except OSError:
        return ""

    # Walk transcript backward, return text of most recent user message
    for line in reversed(lines):
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get("type") != "user":
            continue
        content = entry.get("message", {}).get("content")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    return item.get("text", "")
        return ""
    return ""


TRANSCRIPT_LINE = re.compile(r"^\d{1,2}:\d{2}\s+\w+", re.MULTILINE)


def is_transcript_paste(prompt: str) -> bool:
    """Detect a Granola-style pasted transcript.

    Heuristic: 3+ lines starting with `HH:MM <Speaker>` or `MM:SS <Speaker>`,
    and the prompt is at least ~10 lines long (avoid matching short references).
    """
    if prompt.count("\n") < 10:
        return False
    return len(TRANSCRIPT_LINE.findall(prompt)) >= 3


def _registry_freshness_block() -> list[str]:
    """If any tracked registry changed since the last prompt, surface a
    short freshness note + the file paths so the assistant re-reads
    them. Updates the saved state."""
    changed = get_changed()
    if not changed:
        return []
    lines = [
        "[Registry freshness — files changed since last prompt]",
        "",
        "These workspace registries were edited since the previous prompt.",
        "Re-read before relying on prior summaries — your in-context view is stale:",
        "",
    ]
    for rel, _ in changed:
        lines.append(f"  - {rel}")
    lines.append("")
    return lines


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    prompt = get_prompt(payload)
    if not prompt:
        print(json.dumps({}))
        return

    matches: list[str] = []
    seen: set[str] = set()

    if is_transcript_paste(prompt):
        matches.append("intake:transcript-paste")
        seen.add("intake:transcript-paste")

    for pattern, action in TRIGGERS:
        if action in seen:
            continue
        try:
            if re.search(pattern, prompt, re.IGNORECASE):
                matches.append(action)
                seen.add(action)
        except re.error:
            # Skip malformed patterns rather than failing the hook
            continue

    freshness = _registry_freshness_block()

    if not matches and not freshness:
        print(json.dumps({}))
        return

    lines: list[str] = []

    # Freshness block first — it tells the assistant what to re-read
    # before evaluating the prompt itself.
    if freshness:
        lines.extend(freshness)

    if matches:
        lines.append("[Design Intelligence Harness — UserPromptSubmit triggers matched]")
        lines.append("")
        for action in matches:
            desc = ACTION_DESCRIPTIONS.get(action, action)
            lines.append(f"  - {action}: {desc}")
        lines.extend([
            "",
            "These actions are REQUIRED before generating a response. See docs/triggers.md for full map.",
        ])

    print(json.dumps({
        "hookSpecificOutput": {
            "additionalContext": "\n".join(lines)
        }
    }))


if __name__ == "__main__":
    main()
