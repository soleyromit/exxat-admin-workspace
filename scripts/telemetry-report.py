#!/usr/bin/env python3
"""Telemetry analyzer — read docs/telemetry/events.jsonl and produce a summary.

Usage:
  python3 scripts/telemetry-report.py                  # last 7 days
  python3 scripts/telemetry-report.py --days 30        # last 30 days
  python3 scripts/telemetry-report.py --quarterly      # last 90 days, governance-review format
  python3 scripts/telemetry-report.py --json           # machine-readable

Outputs:
  - Hook fire counts
  - Top trigger actions (UserPromptSubmit)
  - Top violation rules (PreToolUse) — tuning candidates
  - False-positive estimate (rule fired then immediate user override on same file)
  - Override-ledger drift (rules with 3+ active overrides → DESIGN.md amendment candidates)
  - ADR throughput (count of new ADRs in window)
"""
import argparse
import json
import os
import re
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path


WORKSPACE = Path("/Users/romitsoley/Work")
EVENTS_PATH = WORKSPACE / "docs/telemetry/events.jsonl"
WORKSPACE_DECISIONS = WORKSPACE / "docs/decisions"
EXCEPTIONS_LEDGER = WORKSPACE / "docs/governance/exceptions.md"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--days", type=int, default=7)
    p.add_argument("--quarterly", action="store_true",
                   help="90-day window, governance-review format")
    p.add_argument("--json", action="store_true",
                   help="Machine-readable JSON output")
    return p.parse_args()


def is_synthetic_path(file_path: str) -> bool:
    """Filter out smoke-test paths so they don't pollute real-edit stats."""
    if not file_path:
        return False
    # Smoke-test patterns I've seen in this codebase
    synthetic_markers = ("/foo.tsx", "/foo.ts", "/test.tsx", "/test.ts", "/__test__/", "/__tests__/")
    return any(m in file_path for m in synthetic_markers)


def load_events(days: int) -> list[dict]:
    if not EVENTS_PATH.exists():
        return []
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    events: list[dict] = []
    with EVENTS_PATH.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                ts = datetime.fromisoformat(rec.get("ts", "").replace("Z", "+00:00"))
                if ts < cutoff:
                    continue
                # Filter synthetic test paths from rule-tuning stats
                if is_synthetic_path(rec.get("file_path", "")):
                    continue
                events.append(rec)
            except (json.JSONDecodeError, ValueError):
                continue
    return events


def hook_fire_counts(events: list[dict]) -> dict[str, int]:
    return dict(Counter(e["event"] for e in events))


def skill_invocation_counts(events: list[dict]) -> dict[str, int]:
    """Count skill.invocation events by skill name."""
    c: Counter = Counter()
    for e in events:
        if e["event"] == "skill.invocation":
            c[e.get("skill", "unknown")] += 1
    return dict(c)


def command_invocation_counts(events: list[dict]) -> dict[str, int]:
    """Count command.invocation events by command name."""
    c: Counter = Counter()
    for e in events:
        if e["event"] == "command.invocation":
            c[e.get("command", "unknown")] += 1
    return dict(c)


def subagent_dispatch_counts(events: list[dict]) -> dict[str, int]:
    """Count subagent.dispatch events by type."""
    c: Counter = Counter()
    for e in events:
        if e["event"] == "subagent.dispatch":
            c[e.get("type", "unknown")] += 1
    return dict(c)


def top_actions(events: list[dict], top: int = 10) -> list[tuple[str, int]]:
    c: Counter = Counter()
    for e in events:
        if e["event"] == "userpromptsubmit":
            for a in e.get("actions", []):
                c[a] += 1
    return c.most_common(top)


def top_violations(events: list[dict], top: int = 10) -> list[tuple[str, int]]:
    c: Counter = Counter()
    for e in events:
        if e["event"] == "pretooluse.violation":
            for r in e.get("rules", []):
                c[r] += 1
    return c.most_common(top)


def false_positive_estimate(events: list[dict]) -> dict:
    """Heuristic: a violation followed within 10 minutes by an override-action
    UserPromptSubmit is a likely false positive on the rule.
    """
    violations = [(e["ts"], e.get("file_path", ""), e.get("rules", []))
                  for e in events if e["event"] == "pretooluse.violation"]
    overrides = [(e["ts"], e.get("actions", []))
                 for e in events
                 if e["event"] == "userpromptsubmit"
                 and "intake:override" in e.get("actions", [])]

    suspicions: dict[str, int] = defaultdict(int)
    for vts, vpath, vrules in violations:
        try:
            v_dt = datetime.fromisoformat(vts.replace("Z", "+00:00"))
        except ValueError:
            continue
        for ots, _ in overrides:
            try:
                o_dt = datetime.fromisoformat(ots.replace("Z", "+00:00"))
            except ValueError:
                continue
            delta = (o_dt - v_dt).total_seconds()
            if 0 <= delta <= 600:  # 10 minutes
                for r in vrules:
                    suspicions[r] += 1

    return {
        "total_violations": len(violations),
        "total_overrides": len(overrides),
        "suspicions_by_rule": dict(suspicions),
    }


def overrides_by_rule_from_ledger() -> dict[str, list[str]]:
    """Parse docs/governance/exceptions.md to count active overrides per rule.

    Returns {rule_id: [adr_id, ...]}. Empty if ledger absent or no rows.
    """
    if not EXCEPTIONS_LEDGER.exists():
        return {}
    text = EXCEPTIONS_LEDGER.read_text()

    # Extract Active table rows. Look between "## Active overrides" and the next "##" header
    active_section = re.search(
        r"##\s*Active overrides[\s\S]+?(?=\n##\s|\Z)", text
    )
    if not active_section:
        return {}
    active_text = active_section.group(0)

    by_rule: dict[str, list[str]] = defaultdict(list)
    row_re = re.compile(r"^\|\s*(ADR-\d+)\s*\|\s*([\w-]+)\s*\|", re.MULTILINE)
    for m in row_re.finditer(active_text):
        adr_id = m.group(1)
        rule_id = m.group(2)
        by_rule[rule_id].append(adr_id)
    return dict(by_rule)


def adr_throughput(days: int) -> dict[str, int]:
    """Count ADRs created in window across workspace + per-product directories."""
    cutoff_dt = datetime.now(timezone.utc) - timedelta(days=days)
    counts: dict[str, int] = defaultdict(int)

    decision_dirs = [WORKSPACE / "docs/decisions"]
    for app_dir in (WORKSPACE / "apps").glob("*/docs/decisions"):
        decision_dirs.append(app_dir)

    for d in decision_dirs:
        if not d.exists():
            continue
        scope_label = "workspace" if d == WORKSPACE / "docs/decisions" else d.parent.parent.name
        for adr in d.glob("*.md"):
            if adr.name.startswith("_") or adr.name.upper() == "README.MD":
                continue
            try:
                # Use git log to find when the ADR was added (more reliable than mtime)
                out = subprocess.run(
                    ["git", "log", "--diff-filter=A", "--follow", "--format=%aI",
                     "--", str(adr.relative_to(WORKSPACE))],
                    cwd=str(WORKSPACE), capture_output=True, text=True, timeout=5,
                )
                lines = [l for l in out.stdout.strip().split("\n") if l]
                if not lines:
                    continue
                added = datetime.fromisoformat(lines[-1])
                if added >= cutoff_dt:
                    counts[scope_label] += 1
            except Exception:
                continue
    return dict(counts)


def amendment_candidates(by_rule: dict[str, list[str]], threshold: int = 3) -> list[tuple[str, int]]:
    return sorted([(r, len(adrs)) for r, adrs in by_rule.items() if len(adrs) >= threshold],
                  key=lambda x: -x[1])


def render_text(window_days: int, events: list[dict], quarterly: bool) -> str:
    fires = hook_fire_counts(events)
    actions = top_actions(events)
    violations = top_violations(events)
    fp = false_positive_estimate(events)
    overrides_by_rule = overrides_by_rule_from_ledger()
    adrs = adr_throughput(window_days)
    candidates = amendment_candidates(overrides_by_rule)

    title = f"Quarterly governance review — last {window_days}d" if quarterly else f"Telemetry summary — last {window_days}d"
    lines = [
        f"# {title}",
        "",
        f"Window: last {window_days} days  ·  Events: {len(events)}",
        "",
        "## Hook fire counts",
    ]
    if fires:
        for k in sorted(fires.keys()):
            lines.append(f"  {k}: {fires[k]}")
    else:
        lines.append("  (no events in window)")

    lines += ["", "## Top UserPromptSubmit actions"]
    if actions:
        for a, n in actions:
            lines.append(f"  {n:>4}  {a}")
    else:
        lines.append("  (none)")

    lines += ["", "## Top PreToolUse violations (tuning candidates)"]
    if violations:
        for r, n in violations:
            lines.append(f"  {n:>4}  {r}")
    else:
        lines.append("  (none — clean window)")

    lines += [
        "",
        "## False-positive estimate",
        f"  Total violations: {fp['total_violations']}",
        f"  Total overrides:  {fp['total_overrides']}",
    ]
    if fp["suspicions_by_rule"]:
        lines.append("  Suspicions (violation followed by override within 10min):")
        for r, n in sorted(fp["suspicions_by_rule"].items(), key=lambda x: -x[1]):
            lines.append(f"    {n:>4}  {r}")
    else:
        lines.append("  No suspicions in window.")

    skills = skill_invocation_counts(events)
    commands = command_invocation_counts(events)
    subagents = subagent_dispatch_counts(events)

    lines += ["", "## Skill invocations"]
    if skills:
        for k, n in sorted(skills.items(), key=lambda x: -x[1]):
            lines.append(f"  {n:>4}  {k}")
    else:
        lines.append("  (none — skills not yet emitting telemetry; see docs/telemetry/README.md)")

    lines += ["", "## Slash command invocations"]
    if commands:
        for k, n in sorted(commands.items(), key=lambda x: -x[1]):
            lines.append(f"  {n:>4}  /{k}")
    else:
        lines.append("  (none)")

    lines += ["", "## Subagent dispatches"]
    if subagents:
        for k, n in sorted(subagents.items(), key=lambda x: -x[1]):
            lines.append(f"  {n:>4}  {k}")
    else:
        lines.append("  (none)")

    lines += ["", f"## ADR throughput (created in last {window_days}d)"]
    if adrs:
        for scope, n in sorted(adrs.items(), key=lambda x: -x[1]):
            lines.append(f"  {n:>4}  {scope}")
    else:
        lines.append("  (no ADRs created)")

    lines += ["", "## Override ledger summary"]
    if overrides_by_rule:
        lines.append("  Active overrides per rule:")
        for r in sorted(overrides_by_rule.keys()):
            lines.append(f"    {len(overrides_by_rule[r]):>4}  {r}")
    else:
        lines.append("  (no active overrides)")

    if candidates:
        lines += ["", "## DESIGN.md amendment candidates (rules with 3+ active overrides)"]
        for r, n in candidates:
            lines.append(f"  {r}: {n} active overrides → consider amending DESIGN.md §4")
    elif overrides_by_rule:
        lines += ["", "## DESIGN.md amendment candidates", "  None (no rule has 3+ active overrides)"]

    if quarterly:
        lines += [
            "",
            "## Governance actions to take",
            "  1. Review each Active override row in docs/governance/exceptions.md",
            "     - Sunset criterion met → mark Closed",
            "     - Sunset criterion not met → confirm still relevant",
            "  2. For each Permanent-pending-amendment row → confirm amendment task is in flight",
            "  3. For amendment candidates above → file ADR proposing DESIGN.md §4 update",
            "  4. For top violations → check if rule is too strict; possibly tighten or loosen",
        ]

    return "\n".join(lines)


def render_json(window_days: int, events: list[dict]) -> str:
    return json.dumps({
        "window_days": window_days,
        "event_count": len(events),
        "hook_fires": hook_fire_counts(events),
        "top_actions": top_actions(events),
        "top_violations": top_violations(events),
        "false_positive_estimate": false_positive_estimate(events),
        "active_overrides_by_rule": {k: len(v) for k, v in overrides_by_rule_from_ledger().items()},
        "adr_throughput": adr_throughput(window_days),
        "amendment_candidates": amendment_candidates(overrides_by_rule_from_ledger()),
    }, indent=2)


def main() -> None:
    args = parse_args()
    days = 90 if args.quarterly else args.days
    events = load_events(days)

    if args.json:
        print(render_json(days, events))
    else:
        print(render_text(days, events, args.quarterly))


if __name__ == "__main__":
    main()
