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
    # Frustration / pattern-recurrence detection (priority 0 — highest)
    # Fires BEFORE any other action so self-reflection happens first.
    # Signals: "you keep", "you always", "you forgot", "again", "I keep having to",
    # "you never", "you tend to", "every time", "you still", "frustrated"
    (r"\b(you (keep|always|never|still|tend to|forget|forgot|don.?t remember))\b", "self:pattern-recognition"),
    (r"\b(i (keep|always) hav(e|ing) to (tell|remind|ask|repeat|say))\b", "self:pattern-recognition"),
    (r"\b(again|every time|each time|same (issue|problem|mistake)|you should (know|remember|have known))\b", "self:pattern-recognition"),
    (r"\b(frustrat(ed|ing)|annoying|why do you|i told you|you (missed|skipped|ignored))\b", "self:pattern-recognition"),
    (r"\b(without me (saying|asking|telling)|i (can.?t|shouldn.?t have to) (remember|tell|remind|ask))\b", "self:pattern-recognition"),

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

    # Design intent (priority 4) — broader noun set covers real prompt shapes
    # like "design the question navigator", not just "design a new screen"
    # (\w+\s+){0,3} allows up to 3 words before the noun (e.g. "course overview page")
    (r"\b(design|build|create|add|wire(\s+up)?)\s+(a|an|the)?\s*(new\s+)?(\w+\s+){0,3}(screen|page|view|dashboard|component|feature|flow|navigator|panel|widget|sidebar|toolbar|header|footer|modal|drawer|menu|tabs?|table|form|button|card|chart|graph|layout|UI|interface)\b", "intent:design"),
    (r"\b(redesign|refactor|rework|polish|improve|tighten)\s+(this|the|that)\b", "intent:redesign"),

    # DS reference lazy-load (priority 4.5) — when prompt suggests UI/DS work,
    # remind to read CLAUDE-DS-REFERENCE.md (which holds tokens, component
    # APIs, theme system; ~8K tokens, lazy-loaded to keep CLAUDE.md tight).
    (r"\b(Button|Badge|Sheet|DataTable|Sidebar|Dropdown|Dialog|Tooltip|Tabs?|Avatar|Card|Popover|InputGroup|Field|Select|Checkbox|RadioGroup|Toggle|Drawer|Banner|Calendar|Breadcrumb)\b", "lazy:ds-reference"),
    (r"\bvar\(--[a-z][a-z0-9-]+\)|\b(tokens?|theme(-one|-prism)?|DS reference|design system|component(s)? from (the )?DS)\b", "lazy:ds-reference"),
    (r"\b(scaffold|new product|new screen|new component|new admin|new student app)\b", "lazy:ds-reference"),

    # Library refs (priority 5)
    (r"\b(React|Next\.?js|Tailwind|Recharts|Radix|shadcn|TanStack|Framer|Zod|Zustand|Vercel AI SDK)\b", "lib:context7"),

    # Pre-task declaration (Pattern J, priority 5.5) — fires on any direct UI edit intent
    # not already covered by intent:design / intent:redesign
    (r"\b(fix|update|edit|change|tweak)\s+(the\s+|this\s+|that\s+)?(\w+\s+)?(page|component|screen|file|layout|header|table|form|drawer|dialog|sheet|sidebar|modal|card|tab|nav)\b", "precheck:pre-task-declaration"),

    # DS sweep (priority 5.6) — auto-suggest when user describes DS/WCAG gaps or asks to audit
    (r"\b(audit|sweep|upgrade|migrate|check)\s+(all\s+|the\s+|every\s+)?(\w+\s+)?(pages?|components?|app|DS|design system|adoption)\b", "sweep:ds-check"),
    (r"\b(DS|design system).{0,30}(not (being )?followed|gap|violation|adoption|issue|isn.?t (being )?followed)\b", "sweep:ds-check"),
    (r"\b(not following|not being followed|doesn.?t follow|missing|forgot(ten)?)\s+(the\s+)?(DS|design system|WCAG|accessibility)\b", "sweep:ds-check"),

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

def _detect_product(prompt: str) -> str | None:
    """Detect the active product from prompt keywords.

    Returns one of: 'pce', 'exam-management', 'portal', 'learning-contracts',
    'patient-log', 'skills-checklist', or None.
    Used by the coupling section to inject the right ui-patterns lazy-load.
    """
    p = prompt.lower()
    if re.search(r"\b(pce|clinical experience|preceptor|logbook|apps/pce)\b", p):
        return "pce"
    if re.search(r"\b(exam.?management|question bank|\bqb\b|assessment builder|assessment taker|apps/exam.?management)\b", p):
        return "exam-management"
    if re.search(r"\b(learning.?contracts?|apps/learning.?contracts?)\b", p):
        return "learning-contracts"
    if re.search(r"\b(patient.?log|patient encounter|apps/patient.?log)\b", p):
        return "patient-log"
    if re.search(r"\b(skills?.?checklist|competency checklist|apps/skills.?checklist)\b", p):
        return "skills-checklist"
    if re.search(r"\bapps/portal\b|\b(portal (page|app|admin|product|screen|component))\b", p):
        return "portal"
    return None


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
    "lazy:ds-reference": "Read docs/CLAUDE-DS-REFERENCE.md before generating any UI code, importing DS components, or using DS tokens beyond the ~15 in CLAUDE.md §6. The full token tables, component APIs, theme system, and font setup live there (~8K tokens). Don't guess token names — verify against the reference.",
    "lib:context7": "Run mcp__plugin_context7_context7__resolve-library-id then query-docs for current API; do not generate from memory",
    "work:debug": "Invoke superpowers:systematic-debugging skill before proposing fixes",
    "work:verify-before-complete": "Invoke superpowers:verification-before-completion before claiming complete; then superpowers:requesting-code-review",
    "stochastic:design-variants": "Invoke /design-variants slash command (.claude/commands/design-variants.md) — spawn N parallel agents in worktrees per docs/patterns/process/design-variants.md. Pre-flight: clean tree, active product, DS profile, then dispatch.",
    "intake:override": "Invoke the intake skill with action=override — capture as override ADR (template at docs/decisions/_override-template.md) + pattern exception + ledger row in docs/governance/exceptions.md. Sunset criterion + rationale mandatory. User confirms before write.",
    "rule:cite-and-surface": "User cited a workspace rule (DS-NNN / A11Y-NNN / VIZ-NNN / CONTENT-NNN / INTAKE-NNN). Read the rule's text from /DESIGN.md §4 and surface it in your response so the user knows you understand which rule binds. If they're proposing an override, route to intake:override.",
    "intake:research-insight": "Invoke the research-intake skill (.claude/skills/research-intake/SKILL.md) with action=insight — saves raw insight to apps/<product>/docs/research/insights/, extracts ADR-worthy decisions + persona updates + glossary candidates. Confirm-before-write each artifact.",
    "intake:research-theme": "Invoke the research-intake skill with action=theme — saves to research/insights/themes/, captures supporting quote count + sample quotes + implications.",
    "precheck:pre-task-declaration": "REQUIRED before any code. Read the target file(s) first, then output: File: <path> | Current DS violations: <list or none> | Hand-rolled with DS equivalent: <list or none> | WCAG issues (static read): <list or none>. No code until this block is written. See CLAUDE.md pre-task section and verification-discipline.md Pattern J.",
    "sweep:ds-check": "Run the ds-sweep skill (.claude/skills/ds-sweep/SKILL.md) for the active product before making changes. Output the prioritized backlog (CRITICAL / HIGH / MEDIUM / LOW). Ask which items to fix first. See .claude/skills/ds-sweep/SKILL.md for the full protocol.",
    "self:pattern-recognition": "A frustration or recurrence signal was detected. BEFORE responding to the task, do all four: (1) Read /Users/romitsoley/.claude/projects/-Users-romitsoley-Work/memory/MEMORY.md — identify the 2-3 entries most relevant to this complaint and quote them. (2) Read docs/governance/verification-discipline.md discipline log — identify the matching pattern (A-J) and most recent entry for it. (3) State in one sentence: what recurring failure this represents and why it keeps happening structurally. (4) Write a new `feedback` memory entry or update an existing one — then propose one concrete architecture change (rule, hook trigger, or audit) that prevents this from recurring. Only THEN respond to the actual task. Do not skip any of these four steps.",
    "lazy:ui-patterns-pce": "REQUIRED before any PCE JSX. Read apps/pce/docs/patterns/pce-ui-patterns.md — PCE-specific component patterns, supervisor/student flows, survey patterns, and banned anti-patterns. Do not write a single line of PCE UI code without reading this first.",
    "lazy:ui-patterns-exam-management": "REQUIRED before any exam-management JSX. Read apps/exam-management/docs/patterns/ui-patterns.md — EM-specific component patterns, assessment/QB flows, and banned anti-patterns. Do not write a single line of EM UI code without reading this first.",
    "lazy:ui-patterns-portal": "REQUIRED before any Portal JSX. Read apps/portal/docs/patterns/ui-patterns.md — Portal component patterns and banned anti-patterns. Do not write Portal UI code without reading this first.",
    "lazy:ui-patterns-learning-contracts": "REQUIRED before any Learning Contracts JSX. Read apps/learning-contracts/docs/patterns/ui-patterns.md — pre-scaffolding rules and DS import requirements. Apply even before the first line of code exists.",
    "lazy:ui-patterns-patient-log": "REQUIRED before any Patient Log JSX. Read apps/patient-log/docs/patterns/ui-patterns.md — pre-scaffolding rules, HIPAA note, and DS import requirements.",
    "lazy:ui-patterns-skills-checklist": "REQUIRED before any Skills Checklist JSX. Read apps/skills-checklist/docs/patterns/ui-patterns.md — pre-scaffolding rules, viz rules (no raw progress bars), and DS import requirements.",
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


# Cascade check (Pattern B closure): when the user says "fix the X" /
# "X is broken" / "redesign X" / "X looks wrong" — enumerate ALL files
# that reference <X> before any edit, so the assistant doesn't silently
# fix one site and leave siblings. Class-level failure pattern confirmed
# 2026-05-12 across Toggle, Button, DataTable, "almost all components".
#
# Trigger shape is NARROW per Romit's call: explicit fix/broken verbs +
# a noun. Wider shapes (e.g. "update X") will get added if the narrow
# trigger misses things.
CASCADE_VERB_NOUN_RE = re.compile(
    r"\b(?:fix|redesign|rework|polish|tighten|improve)\b\s+(?:the\s+|this\s+|that\s+)?"
    r"(?P<noun>[A-Za-z][A-Za-z-]{2,30})",
    re.IGNORECASE,
)
CASCADE_NOUN_PREDICATE_RE = re.compile(
    r"\b(?P<noun>[A-Za-z][A-Za-z-]{2,30})\s+"
    r"(?:is\s+(?:broken|wrong|off|misaligned)|looks?\s+(?:wrong|off|broken|bad))",
    re.IGNORECASE,
)

# Words that aren't components — filter out common false positives.
CASCADE_STOPWORDS: set[str] = {
    "the", "this", "that", "it", "one", "two", "all", "some",
    "filter", "filters", "issue", "issues", "bug", "bugs", "problem", "problems",
    "page", "screen", "view", "thing", "stuff", "code", "test", "tests",
    "build", "deploy", "run", "now", "later", "today", "yesterday",
    "design", "spec", "rule", "rules", "audit", "hook", "hooks",
}


def _to_pascal_candidates(noun: str) -> list[str]:
    """Convert a noun to JSX-tag candidates. 'toggle' → ['Toggle'],
    'datatable' → ['DataTable', 'Datatable'], 'data-table' → ['DataTable'].
    Returns the prefix(es) to grep for (matches <Prefix and <PrefixSomething)."""
    raw = noun.replace("_", "-").strip("-").strip()
    if not raw or raw.lower() in CASCADE_STOPWORDS:
        return []
    parts = [p for p in raw.split("-") if p]
    pascal = "".join(p[0].upper() + p[1:].lower() for p in parts)
    candidates = {pascal}
    # 'datatable' → 'Datatable'; also yield 'DataTable' if it looks fused
    if len(parts) == 1 and len(raw) >= 6:
        # Heuristic: split into 2 words at common boundaries
        for boundary in ("table", "switch", "group", "menu", "bar", "panel",
                          "dialog", "drawer", "sheet", "card", "row", "list"):
            if raw.lower().endswith(boundary) and len(raw) > len(boundary) + 2:
                head = raw[: -len(boundary)]
                fused = head[0].upper() + head[1:].lower() + boundary[0].upper() + boundary[1:].lower()
                candidates.add(fused)
    return sorted(candidates, key=len, reverse=True)


def _cascade_check(prompt: str) -> list[str]:
    """Enumerate workspace files referencing a component the user said
    they want fixed. Returns [] if no fix-shape detected or no hits found.

    The block format is short and action-oriented — its job is to make
    the assistant count siblings BEFORE editing, not to do the analysis."""
    if not prompt:
        return []

    candidates: set[str] = set()
    for m in CASCADE_VERB_NOUN_RE.finditer(prompt):
        candidates.update(_to_pascal_candidates(m.group("noun")))
    for m in CASCADE_NOUN_PREDICATE_RE.finditer(prompt):
        candidates.update(_to_pascal_candidates(m.group("noun")))

    if not candidates:
        return []

    import subprocess

    # Cap candidates so a wild prompt doesn't run grep 20 times.
    candidates = sorted(candidates, key=len, reverse=True)[:3]
    blocks: list[str] = []
    for cand in candidates:
        # Grep JSX usages across apps/ (consumer code). Stay out of
        # node_modules, .next, dist, etc. via the apps/-rooted scope.
        try:
            out = subprocess.run(
                ["grep", "-rln", f"<{cand}", str(REPO_ROOT / "apps"),
                 "--include=*.tsx", "--include=*.ts"],
                capture_output=True, text=True, timeout=2,
            )
        except (subprocess.TimeoutExpired, FileNotFoundError):
            continue

        if out.returncode != 0 or not out.stdout.strip():
            continue

        files = [
            line.replace(str(REPO_ROOT) + "/", "")
            for line in out.stdout.strip().splitlines()
            if line.strip()
        ]
        # Dedupe (same file matching multiple candidates).
        files = sorted(set(files))
        if not files:
            continue

        count = len(files)
        # Cap listing to keep additionalContext from exploding.
        listing = files[:15]
        more = count - len(listing)

        block: list[str] = [
            f"[Cascade check (Pattern B) — `<{cand}>` is referenced in {count} file(s).]",
            "",
            "  Before editing, enumerate the full set and decide cascade scope.",
            "  See `docs/governance/verification-discipline.md` § Pattern B.",
            "",
        ]
        for path in listing:
            block.append(f"  - {path}")
        if more > 0:
            block.append(f"  - … and {more} more.")
        block.append("")
        blocks.extend(block)

    return blocks


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

    # Coupled actions: design/redesign intent always benefits from the DS
    # reference. Add ds-reference as a follow-on when either fires.
    if ("intent:design" in seen or "intent:redesign" in seen) and "lazy:ds-reference" not in seen:
        matches.append("lazy:ds-reference")
        seen.add("lazy:ds-reference")

    # Coupled: design/redesign/direct-edit intent → pre-task declaration required.
    # Pattern J: read the file and declare current violations before writing any code.
    if ("intent:design" in seen or "intent:redesign" in seen or "precheck:pre-task-declaration" in seen) and "precheck:pre-task-declaration" not in seen:
        matches.append("precheck:pre-task-declaration")
        seen.add("precheck:pre-task-declaration")

    # Coupled: design/edit intent + product detected → inject per-product ui-patterns lazy-load.
    # Each product has banned patterns, component choices, and flows not in the global DS reference.
    # Without this, Claude writes generic DS code that violates PCE/EM-specific patterns.
    if "intent:design" in seen or "intent:redesign" in seen or "precheck:pre-task-declaration" in seen:
        product = _detect_product(prompt)
        product_action_map = {
            "pce": "lazy:ui-patterns-pce",
            "exam-management": "lazy:ui-patterns-exam-management",
            "portal": "lazy:ui-patterns-portal",
            "learning-contracts": "lazy:ui-patterns-learning-contracts",
            "patient-log": "lazy:ui-patterns-patient-log",
            "skills-checklist": "lazy:ui-patterns-skills-checklist",
        }
        if product and product in product_action_map:
            action = product_action_map[product]
            if action not in seen:
                matches.append(action)
                seen.add(action)

    freshness = _registry_freshness_block()
    cascade = _cascade_check(prompt)

    if not matches and not freshness and not cascade:
        print(json.dumps({}))
        return

    lines: list[str] = []

    # Cascade check first — it's the highest-leverage Pattern B closure.
    # The assistant must see the sibling list BEFORE picking up the edit.
    if cascade:
        lines.extend(cascade)

    # Freshness block second — it tells the assistant what to re-read
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
