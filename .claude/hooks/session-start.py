#!/usr/bin/env python3
"""SessionStart hook — Design Intelligence Harness.

Detects active DS profile from cwd and emits a summary as additionalContext
so the session is grounded in DESIGN.md and the relevant profile.

Reads JSON from stdin (Claude Code hook contract). Emits JSON on stdout
with hookSpecificOutput.additionalContext.
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

try:
    from _registries import REPO_ROOT, snapshot_summary, reset as registries_reset
except ImportError:
    REPO_ROOT = Path("/Users/romitsoley/Work")
    def snapshot_summary() -> str: return ""
    def registries_reset() -> None: pass


def _practices_audit_staleness() -> str | None:
    """Return a one-line reminder if the Claude practices audit is overdue,
    None otherwise. Reads docs/governance/claude-practices.md frontmatter."""
    practices = REPO_ROOT / "docs" / "governance" / "claude-practices.md"
    if not practices.exists():
        return None
    try:
        import re
        from datetime import datetime, timezone
        text = practices.read_text(encoding="utf-8")
        m = re.search(r"^last_full_audit\s*:\s*(\d{4}-\d{2}-\d{2})\s*$",
                      text, re.MULTILINE)
        if not m:
            return None
        last = datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - last).days
        if age >= 60:
            return (f"⚠ Practices audit STALE ({age}d since last). "
                    "Invoke the practices-audit skill to refresh.")
        if age >= 30:
            return (f"○ Practices audit reminder: {age}d since last. "
                    "Consider invoking the practices-audit skill.")
        return None
    except Exception:
        return None


def _read_recent_adrs(product: str | None, limit: int = 5) -> list[str]:
    """Return titles of the most-recent ADRs for the active product +
    workspace. Used at compact-recovery to remind the assistant which
    decisions are load-bearing."""
    titles: list[str] = []
    candidate_dirs = [REPO_ROOT / "docs" / "decisions"]
    if product:
        candidate_dirs.append(REPO_ROOT / "apps" / product / "docs" / "decisions")
    for adr_dir in candidate_dirs:
        if not adr_dir.is_dir():
            continue
        for path in sorted(adr_dir.glob("*.md")):
            if path.name in {"README.md", "_override-template.md", "000-record-architecture-decisions.md"}:
                continue
            try:
                first_line = next(
                    (line.strip() for line in path.read_text(encoding="utf-8").splitlines()
                     if line.startswith("# ")),
                    None,
                )
                if first_line:
                    rel = path.relative_to(REPO_ROOT)
                    titles.append(f"  - {first_line.lstrip('# ')} ({rel})")
            except OSError:
                continue
    return titles[:limit]


def detect_profile(cwd: str) -> tuple[str | None, str | None]:
    """Return (profile_name, profile_relative_path) based on cwd."""
    if "/apps/" not in cwd:
        return None, None
    after_apps = cwd.split("/apps/", 1)[1]
    parts = after_apps.split("/")
    if len(parts) >= 2:
        app_type = parts[1]
        if app_type == "admin":
            return "admin", "docs/foundations/ds-profiles/admin.md"
        if app_type == "student":
            return "student", "docs/foundations/ds-profiles/student.md"
    return None, None


def detect_product(cwd: str) -> str | None:
    if "/apps/" not in cwd:
        return None
    after_apps = cwd.split("/apps/", 1)[1]
    parts = after_apps.split("/")
    return parts[0] if parts and parts[0] else None


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        payload = {}

    cwd = payload.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    profile, profile_path = detect_profile(cwd)
    product = detect_product(cwd)
    matcher = payload.get("hook_event_matcher", payload.get("matcher", ""))
    is_compact_recovery = matcher == "compact"

    _telemetry_emit(
        "session.start",
        cwd=cwd,
        product=product or "",
        profile=profile or "",
        matcher=matcher,
    )

    summary_lines = [
        "[Design Intelligence Harness — SessionStart]"
        + (" — POST-COMPACT RECOVERY" if is_compact_recovery else ""),
        "",
        "Spec: /DESIGN.md (canonical scholastic spec — read first for any UI work)",
        "Trigger map: docs/triggers.md (auto-fires skills/MCPs)",
        f"Active product: {product or 'workspace-level (not in apps/<product>/)'}",
        f"Active DS profile: {profile or 'not-detected (set when cwd enters apps/<product>/<admin|student>/)'}",
    ]
    if profile_path:
        summary_lines.append(f"Profile path: {profile_path}")
    summary_lines.extend([
        "",
        "Rules in force (DESIGN.md §4):",
        "  DS-001..011, A11Y-001..008, VIZ-001..005, CONTENT-001..004, INTAKE-001..004, I18N-001..003",
        "",
        "Memories loaded (apply unconditionally):",
        "  - Don't add visual treatments beyond what DS provides",
        "  - Viz first, text annotates",
        "  - Progress bars are last resort",
        "  - Aarti dislikes red in score/rating viz",
        "  - Execute after a clear recommendation (don't ask another confirmation)",
        "",
        "PreToolUse hook is in BLOCKING mode for DS-001..011 + A11Y-001/002/004/006.",
        "Telemetry: events written to docs/telemetry/events.jsonl. Run `python3 scripts/telemetry-report.py` for summary.",
    ])

    # Surface practices-audit staleness if relevant
    staleness = _practices_audit_staleness()
    if staleness:
        summary_lines.extend(["", staleness])

    # On compact-recovery (compaction wiped most context), surface load-bearing
    # registries + recent ADRs + the latest digest so the assistant doesn't
    # have to re-discover them.
    if is_compact_recovery:
        # Reset registry-state so the next UserPromptSubmit doesn't claim
        # things "changed" — they're fresh from the assistant's POV.
        registries_reset()

        summary_lines.extend([
            "",
            "=== POST-COMPACT — load-bearing context ===",
            "",
            snapshot_summary(),
            "",
            "Recent ADRs (most-recent first):",
        ])
        adr_titles = _read_recent_adrs(product)
        if adr_titles:
            summary_lines.extend(adr_titles)
        else:
            summary_lines.append("  (no ADRs found)")

        # Surface the latest digest if present — it's a one-line-per-artifact
        # summary that lets the assistant know what exists across the workspace
        # without re-reading every file. See scripts/generate-digest.py.
        digest_path = REPO_ROOT / "docs" / "digest" / "latest.md"
        if digest_path.exists():
            summary_lines.extend([
                "",
                f"Latest workspace digest: {digest_path.relative_to(REPO_ROOT)}",
                "  Read it for one-line summaries of every ADR / perspective / pattern.",
                "  Regenerate with: python3 scripts/generate-digest.py",
            ])

        summary_lines.extend([
            "",
            "Before continuing: skim DESIGN.md §4 if rule codes have shifted from your summary.",
            "Re-read the most-recent ADR if the active task touched its scope.",
            "Registries above are the source of truth for cross-product claims —",
            "  don't re-derive product lists, signals, analogies, or competitors.",
        ])

    print(json.dumps({
        "hookSpecificOutput": {
            "additionalContext": "\n".join(summary_lines)
        }
    }))


if __name__ == "__main__":
    main()
