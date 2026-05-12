#!/usr/bin/env python3
"""claude-updates-watch — Polls upstream Claude/Anthropic changelogs.

Runs weekly via launchd (see scripts/launchd/com.exxat.claude-updates.plist).
Compares each watched source's content hash against the last snapshot. When a
hash changes, writes the new content excerpt to pending-review.md so the
`claude-updates-watcher` subagent can map it to our architecture on next
invocation.

No Claude API calls here — this is pure data collection. The intelligence
layer (mapping features to subagents/audits/hooks) lives in the subagent at
.claude/agents/claude-updates-watcher.md.

Usage:
    python3 scripts/claude-updates-watch.py
    python3 scripts/claude-updates-watch.py --force   # re-fetch even if hash matches
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
WATCH_DIR = REPO_ROOT / "docs" / "governance" / "claude-updates"
SNAPSHOT = WATCH_DIR / "snapshot-current.json"
PENDING = WATCH_DIR / "pending-review.md"

SOURCES = {
    "claude-code-changelog": {
        "url": "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md",
        "label": "Claude Code CHANGELOG (anthropics/claude-code)",
        "excerpt_lines": 100,
    },
    "agent-sdk-ts-changelog": {
        "url": "https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md",
        "label": "Agent SDK TypeScript CHANGELOG",
        "excerpt_lines": 80,
    },
    "agent-sdk-python-changelog": {
        "url": "https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md",
        "label": "Agent SDK Python CHANGELOG",
        "excerpt_lines": 80,
    },
}

USER_AGENT = "claude-updates-watcher/1.0 (+exxat-ds-workspace)"
TIMEOUT_SECONDS = 20


def fetch(url: str) -> str | None:
    """Fetch URL content; return None on failure (network, 404, etc.)."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"  ! fetch failed for {url}: {exc}", file=sys.stderr)
        return None


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def load_snapshot() -> dict:
    if not SNAPSHOT.exists():
        return {"last_checked": None, "sources": {}}
    try:
        return json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"last_checked": None, "sources": {}}


def save_snapshot(data: dict) -> None:
    data["_note"] = (
        "Watcher state. Hashes of last-seen content per source. "
        "Updated by scripts/claude-updates-watch.py. Do not edit by hand."
    )
    SNAPSHOT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def excerpt(text: str, max_lines: int) -> str:
    """First max_lines lines of the text."""
    return "\n".join(text.splitlines()[:max_lines])


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--force", action="store_true",
                    help="Re-fetch and rewrite pending-review.md even if hashes match.")
    args = ap.parse_args()

    snapshot = load_snapshot()
    now_iso = datetime.now(timezone.utc).isoformat()
    changes: list[dict] = []

    print(f"claude-updates-watch — {now_iso}")
    for src_id, src in SOURCES.items():
        print(f"  fetching {src_id} ...")
        text = fetch(src["url"])
        if text is None:
            continue

        new_hash = content_hash(text)
        prev = snapshot["sources"].get(src_id, {})
        prev_hash = prev.get("hash")

        if new_hash == prev_hash and not args.force:
            print(f"    unchanged (hash={new_hash})")
            continue

        print(f"    CHANGED (was={prev_hash}, now={new_hash})")
        changes.append({
            "id": src_id,
            "label": src["label"],
            "url": src["url"],
            "prev_hash": prev_hash,
            "new_hash": new_hash,
            "excerpt": excerpt(text, src["excerpt_lines"]),
        })
        snapshot["sources"][src_id] = {
            "hash": new_hash,
            "last_seen": now_iso,
            "url": src["url"],
        }

    snapshot["last_checked"] = now_iso
    save_snapshot(snapshot)

    if not changes:
        # Touch pending-review.md back to "empty" only if it currently shows changes
        # from a prior run — preserves manual edits otherwise.
        if PENDING.exists() and "no changes detected" not in PENDING.read_text():
            print("  (changes from prior run remain in pending-review.md; not clearing)")
        else:
            PENDING.write_text(
                "# Pending review\n\n"
                "> Auto-populated by `scripts/claude-updates-watch.py` when upstream "
                "Claude/Anthropic sources change.\n"
                "> Empty file = nothing to review. The watcher subagent reads this "
                "file when invoked.\n\n"
                f"_Last checked: {now_iso} — no changes detected._\n",
                encoding="utf-8",
            )
        print(f"  no changes across {len(SOURCES)} sources")
        return 0

    # Write pending-review.md with the new excerpts
    body = [
        "# Pending review",
        "",
        f"> Auto-populated {now_iso} by `scripts/claude-updates-watch.py`.",
        f"> {len(changes)} of {len(SOURCES)} sources changed since last check.",
        f"> The `claude-updates-watcher` subagent reads this file when invoked.",
        "",
        "## Changed sources",
        "",
    ]
    for c in changes:
        body.append(f"### {c['label']}")
        body.append("")
        body.append(f"- **URL**: {c['url']}")
        body.append(f"- **Hash**: `{c['prev_hash'] or '(first time)'}` → `{c['new_hash']}`")
        body.append("")
        body.append("```")
        body.append(c["excerpt"])
        body.append("```")
        body.append("")

    body.append("---")
    body.append("")
    body.append("**Next step**: run `/check-claude-updates` in Claude Code, "
                "OR spawn `.claude/agents/claude-updates-watcher.md` directly. "
                "The subagent maps the changes above to our architecture and "
                "writes a proposal MD in this directory.")

    PENDING.write_text("\n".join(body) + "\n", encoding="utf-8")
    print(f"  wrote {PENDING.relative_to(REPO_ROOT)} with {len(changes)} change(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
