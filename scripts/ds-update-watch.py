#!/usr/bin/env python3
"""ds-update-watch — Polls both DS submodules for changes that affect product code.

Tier 2 of the swap-ready architecture (see docs/governance/ds-updates/INDEX.md).
Sibling to claude-updates-watch — same propose-don't-apply contract, different
signal source.

What it tracks:
  - Admin DS (exxat-ds/packages/ui/src/index.ts) — export list
  - Admin DS theme.css — token names grouped by selector context
  - Student DS (studentUX/src/components/{ui,shared}/*.tsx) — filenames
  - Student DS globals.css — token names grouped by selector context

What it does NOT track yet (Tier 3+):
  - Component variant API surfaces (Button variants list, etc.)
  - Token VALUE changes (only presence/absence) — except those listed
    under the same selector with a different value, which surface as
    "value-changed" for the watcher subagent to evaluate

No Claude API calls — pure data collection. The intelligence layer
(mapping deltas to product code) lives in the watcher subagent.

Usage:
    python3 scripts/ds-update-watch.py
    python3 scripts/ds-update-watch.py --force   # re-snapshot even if hashes match
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WATCH_DIR = REPO_ROOT / "docs" / "governance" / "ds-updates"
SNAPSHOT = WATCH_DIR / "snapshot-current.json"
PENDING = WATCH_DIR / "pending-review.md"

EXXAT_INDEX = REPO_ROOT / "exxat-ds" / "packages" / "ui" / "src" / "index.ts"
EXXAT_THEME = REPO_ROOT / "exxat-ds" / "packages" / "ui" / "src" / "theme.css"
STUDENT_UI_DIR = REPO_ROOT / "studentUX" / "src" / "components" / "ui"
STUDENT_SHARED_DIR = REPO_ROOT / "studentUX" / "src" / "components" / "shared"
STUDENT_GLOBALS = REPO_ROOT / "studentUX" / "src" / "styles" / "globals.css"

# Token declaration regex — captures both light (--name) and value chunk.
TOKEN_RE = re.compile(r"^\s*(--[a-z][a-z0-9-]*)\s*:\s*([^;]+?)\s*;", re.MULTILINE | re.IGNORECASE)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def parse_exxat_components(text: str) -> list[str]:
    """Extract component path stems from index.ts export lines."""
    names: list[str] = []
    for m in re.finditer(r'export\s+\*\s+from\s+"\./components/(?:ui/)?([\w-]+)"', text):
        names.append(m.group(1))
    return sorted(set(names))


def parse_student_components(directory: Path) -> list[str]:
    """List .tsx files in a studentUX components directory."""
    if not directory.is_dir():
        return []
    return sorted(p.stem for p in directory.glob("*.tsx"))


def parse_theme_tokens(text: str) -> dict[str, dict[str, str]]:
    """Parse theme CSS into {selector_context: {token_name: value}}.

    Selector context examples:
      ':root', '.dark', '.theme-one', '.theme-one.dark',
      '@media (prefers-contrast: more) :root',
      '@media (forced-colors: active) :root'

    Heuristic: walk the file line by line, tracking the current selector
    (last seen { …) and any wrapping @media. We don't fully parse CSS —
    just track enough to attribute tokens to their nearest selector.
    """
    tokens: dict[str, dict[str, str]] = {}

    # Strip comments to simplify matching.
    text_nc = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)

    media_stack: list[str] = []
    sel_stack: list[str] = []
    pos = 0
    n = len(text_nc)

    while pos < n:
        # Find next interesting char: { } or end
        next_open = text_nc.find("{", pos)
        next_close = text_nc.find("}", pos)

        if next_open == -1 and next_close == -1:
            break
        if next_open == -1 or (next_close != -1 and next_close < next_open):
            # Closing brace — pop stack
            if media_stack and sel_stack and sel_stack[-1].startswith("@media"):
                media_stack.pop()
            if sel_stack:
                sel_stack.pop()
            pos = next_close + 1
            continue

        # Opening brace — read selector preceding it
        sel_text = text_nc[pos:next_open].strip()
        # Take only the last logical selector (after last } or ;)
        last_break = max(sel_text.rfind("}"), sel_text.rfind(";"))
        if last_break != -1:
            sel_text = sel_text[last_break + 1:].strip()
        sel_text = sel_text.strip()
        if not sel_text:
            # Anonymous block — just push placeholder
            sel_stack.append("")
            pos = next_open + 1
            continue

        if sel_text.startswith("@media"):
            media_stack.append(sel_text)
            sel_stack.append(sel_text)
        else:
            sel_stack.append(sel_text)

        # Extract tokens inside this block
        # Find matching closing brace (simple depth counter)
        depth = 1
        i = next_open + 1
        while i < n and depth > 0:
            if text_nc[i] == "{":
                depth += 1
            elif text_nc[i] == "}":
                depth -= 1
            i += 1
        block_end = i - 1
        block_text = text_nc[next_open + 1:block_end]

        # Token declarations inside THIS block (not nested children)
        # Simple approach: find tokens that aren't inside nested { }
        # For our purpose, only :root / .selector / @media+:root blocks
        # tend to declare tokens. Just extract all and dedupe.
        for m in TOKEN_RE.finditer(block_text):
            # Skip if there's a nested { before this match — token would
            # belong to a nested selector
            preceding = block_text[: m.start()]
            if preceding.count("{") > preceding.count("}"):
                continue
            name = m.group(1)
            value = m.group(2).strip()
            # Cap value length to keep snapshots reasonable
            value = value[:120]

            # Build a stable selector key: include the current @media + last non-media sel
            media_part = next((s for s in reversed(sel_stack) if s.startswith("@media")), "")
            non_media = next((s for s in reversed(sel_stack) if not s.startswith("@media")), "")
            key = f"{media_part} {non_media}".strip() if media_part else non_media
            if not key:
                continue
            tokens.setdefault(key, {})[name] = value

        # Move past this block; let the closing brace popping happen
        # via the main loop continuing
        pos = next_open + 1

    return tokens


def build_current_state() -> dict:
    """Build the current full state of both DS submodules."""
    state: dict = {
        "last_checked": datetime.now(timezone.utc).isoformat(),
        "exxat_ds": {
            "components": [],
            "tokens": {},
        },
        "student_ds": {
            "components_ui": [],
            "components_shared": [],
            "tokens": {},
        },
    }

    # Admin DS
    if EXXAT_INDEX.exists():
        state["exxat_ds"]["components"] = parse_exxat_components(read_text(EXXAT_INDEX))
    if EXXAT_THEME.exists():
        state["exxat_ds"]["tokens"] = parse_theme_tokens(read_text(EXXAT_THEME))

    # Student DS
    state["student_ds"]["components_ui"] = parse_student_components(STUDENT_UI_DIR)
    state["student_ds"]["components_shared"] = parse_student_components(STUDENT_SHARED_DIR)
    if STUDENT_GLOBALS.exists():
        state["student_ds"]["tokens"] = parse_theme_tokens(read_text(STUDENT_GLOBALS))

    return state


def load_snapshot() -> dict:
    if not SNAPSHOT.exists():
        return {}
    try:
        return json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_snapshot(state: dict) -> None:
    state["_note"] = (
        "Watcher state. Last-seen snapshot of both DS submodules. "
        "Updated by scripts/ds-update-watch.py. Do not edit by hand."
    )
    SNAPSHOT.write_text(json.dumps(state, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def diff_lists(label: str, prev: list, curr: list) -> tuple[list[str], list[str]]:
    added = sorted(set(curr) - set(prev))
    removed = sorted(set(prev) - set(curr))
    return added, removed


def diff_tokens(prev: dict, curr: dict) -> dict:
    """Returns added / removed / value_changed entries per selector."""
    diff = {"added": [], "removed": [], "value_changed": []}
    all_selectors = set(prev.keys()) | set(curr.keys())
    for sel in sorted(all_selectors):
        prev_tokens = prev.get(sel, {})
        curr_tokens = curr.get(sel, {})
        for name in sorted(set(curr_tokens) - set(prev_tokens)):
            diff["added"].append({"selector": sel, "token": name, "value": curr_tokens[name]})
        for name in sorted(set(prev_tokens) - set(curr_tokens)):
            diff["removed"].append({"selector": sel, "token": name, "value": prev_tokens[name]})
        for name in sorted(set(curr_tokens) & set(prev_tokens)):
            if prev_tokens[name] != curr_tokens[name]:
                diff["value_changed"].append({
                    "selector": sel, "token": name,
                    "from": prev_tokens[name], "to": curr_tokens[name],
                })
    return diff


def empty_pending_body(ts: str) -> str:
    return (
        "# Pending review — DS updates\n\n"
        "> Auto-populated by `scripts/ds-update-watch.py` when either DS submodule "
        "changes its component exports or theme tokens.\n"
        "> Empty file = nothing to review. The `ds-updates-watcher` subagent reads "
        "this when invoked.\n\n"
        f"_Last checked: {ts} — no DS deltas detected._\n"
    )


def render_pending(ts: str, exxat_diff: dict, student_diff: dict) -> str:
    """Render pending-review.md body when deltas exist."""
    lines: list[str] = [
        "# Pending review — DS updates",
        "",
        f"> Auto-populated {ts} by `scripts/ds-update-watch.py`.",
        "> The `ds-updates-watcher` subagent reads this file when invoked.",
        "",
    ]

    has_any = False

    # Admin DS section
    if any(exxat_diff.values()):
        has_any = True
        lines.extend(["## Admin DS (exxat-ds)", ""])
        comp_added, comp_removed = exxat_diff["components_added"], exxat_diff["components_removed"]
        if comp_added:
            lines.append("### Components added")
            for c in comp_added:
                lines.append(f"- `{c}` → import as `import {{ ... }} from '@exxat/ds/packages/ui/src'`")
            lines.append("")
        if comp_removed:
            lines.append("### Components removed")
            for c in comp_removed:
                lines.append(f"- `{c}` — **grep `apps/*/admin/` for usages before accepting**")
            lines.append("")
        tk = exxat_diff["tokens"]
        if tk["added"]:
            lines.append(f"### Tokens added ({len(tk['added'])})")
            for row in tk["added"][:50]:
                lines.append(f"- `{row['token']}` in `{row['selector']}` = `{row['value']}`")
            if len(tk["added"]) > 50:
                lines.append(f"- … and {len(tk['added']) - 50} more.")
            lines.append("")
        if tk["removed"]:
            lines.append(f"### Tokens removed ({len(tk['removed'])})")
            for row in tk["removed"][:50]:
                lines.append(f"- `{row['token']}` in `{row['selector']}` was `{row['value']}` — **grep product code for `var({row['token']})`**")
            if len(tk["removed"]) > 50:
                lines.append(f"- … and {len(tk['removed']) - 50} more.")
            lines.append("")
        if tk["value_changed"]:
            lines.append(f"### Token values changed ({len(tk['value_changed'])})")
            for row in tk["value_changed"][:30]:
                lines.append(f"- `{row['token']}` in `{row['selector']}`: `{row['from']}` → `{row['to']}`")
            if len(tk["value_changed"]) > 30:
                lines.append(f"- … and {len(tk['value_changed']) - 30} more.")
            lines.append("")

    # Student DS section
    if any(student_diff.values()):
        has_any = True
        lines.extend(["## Student DS (studentUX)", ""])
        for label, key_add, key_rem in (
            ("UI primitives", "ui_added", "ui_removed"),
            ("Shared composites", "shared_added", "shared_removed"),
        ):
            added = student_diff.get(key_add, [])
            removed = student_diff.get(key_rem, [])
            if added:
                lines.append(f"### {label} added")
                for c in added:
                    lines.append(f"- `{c}` → import from `@exxat/student/components/{'ui' if 'ui' in key_add else 'shared'}/{c}`")
                lines.append("")
            if removed:
                lines.append(f"### {label} removed")
                for c in removed:
                    lines.append(f"- `{c}` — **grep `apps/*/student/` for usages before accepting**")
                lines.append("")
        tk = student_diff["tokens"]
        if tk["added"]:
            lines.append(f"### Tokens added ({len(tk['added'])})")
            for row in tk["added"][:50]:
                lines.append(f"- `{row['token']}` in `{row['selector']}` = `{row['value']}`")
            if len(tk["added"]) > 50:
                lines.append(f"- … and {len(tk['added']) - 50} more.")
            lines.append("")
        if tk["removed"]:
            lines.append(f"### Tokens removed ({len(tk['removed'])})")
            for row in tk["removed"][:50]:
                lines.append(f"- `{row['token']}` in `{row['selector']}` was `{row['value']}` — **grep product code for `var({row['token']})`**")
            if len(tk["removed"]) > 50:
                lines.append(f"- … and {len(tk['removed']) - 50} more.")
            lines.append("")
        if tk["value_changed"]:
            lines.append(f"### Token values changed ({len(tk['value_changed'])})")
            for row in tk["value_changed"][:30]:
                lines.append(f"- `{row['token']}` in `{row['selector']}`: `{row['from']}` → `{row['to']}`")
            if len(tk["value_changed"]) > 30:
                lines.append(f"- … and {len(tk['value_changed']) - 30} more.")
            lines.append("")

    if not has_any:
        return empty_pending_body(ts)

    lines.extend([
        "---",
        "",
        "**Next step**: run `/check-ds-updates` in Claude Code, OR spawn "
        "`.claude/agents/ds-updates-watcher.md` directly. The subagent maps "
        "the deltas above to product code usages and writes a proposal MD "
        "with cited file:line references.",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true",
                    help="Re-snapshot and rewrite pending-review.md even if no deltas.")
    args = ap.parse_args()

    prev = load_snapshot()
    curr = build_current_state()
    ts = curr["last_checked"]

    is_first_run = not prev.get("exxat_ds", {}).get("components") and \
                   not prev.get("student_ds", {}).get("components_ui")

    if is_first_run:
        save_snapshot(curr)
        PENDING.write_text(empty_pending_body(ts), encoding="utf-8")
        print(f"ds-update-watch — baseline snapshot saved ({ts})")
        return 0

    # Compute deltas
    prev_exxat = prev.get("exxat_ds", {})
    prev_student = prev.get("student_ds", {})

    exxat_comp_added, exxat_comp_removed = diff_lists(
        "components", prev_exxat.get("components", []), curr["exxat_ds"]["components"]
    )
    exxat_tokens_diff = diff_tokens(prev_exxat.get("tokens", {}), curr["exxat_ds"]["tokens"])

    student_ui_added, student_ui_removed = diff_lists(
        "ui", prev_student.get("components_ui", []), curr["student_ds"]["components_ui"]
    )
    student_shared_added, student_shared_removed = diff_lists(
        "shared", prev_student.get("components_shared", []), curr["student_ds"]["components_shared"]
    )
    student_tokens_diff = diff_tokens(prev_student.get("tokens", {}), curr["student_ds"]["tokens"])

    exxat_diff = {
        "components_added": exxat_comp_added,
        "components_removed": exxat_comp_removed,
        "tokens": exxat_tokens_diff,
    }
    student_diff = {
        "ui_added": student_ui_added,
        "ui_removed": student_ui_removed,
        "shared_added": student_shared_added,
        "shared_removed": student_shared_removed,
        "tokens": student_tokens_diff,
    }

    has_deltas = any([
        exxat_comp_added, exxat_comp_removed,
        exxat_tokens_diff["added"], exxat_tokens_diff["removed"], exxat_tokens_diff["value_changed"],
        student_ui_added, student_ui_removed,
        student_shared_added, student_shared_removed,
        student_tokens_diff["added"], student_tokens_diff["removed"], student_tokens_diff["value_changed"],
    ])

    if has_deltas or args.force:
        PENDING.write_text(render_pending(ts, exxat_diff, student_diff), encoding="utf-8")
        print(f"ds-update-watch — DELTAS detected, wrote {PENDING.relative_to(REPO_ROOT)}")
    else:
        # Preserve any prior pending content unless empty already
        if not PENDING.exists() or "no DS deltas detected" not in PENDING.read_text(encoding="utf-8"):
            PENDING.write_text(empty_pending_body(ts), encoding="utf-8")
        print(f"ds-update-watch — no deltas ({ts})")

    save_snapshot(curr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
