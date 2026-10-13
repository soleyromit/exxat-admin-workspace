#!/usr/bin/env python3
"""
vault-citation-gate — Stop hook (NON-BLOCKING reminder only).

CLAUDE.md mandates consulting the Obsidian vault (~/Documents/research-repos)
FIRST on any design/UX task and citing the notes consulted at the top of the
response. This hook is a gentle nudge when the final assistant message looks
like a DESIGN output but cites NO vault note.

It is a SURFACE-ONLY reminder — it never blocks. Unlike ds-claim-gate.py (which
exits 2 + stderr to BLOCK), this uses the WARN path: exit 0 with a JSON
{"systemMessage": ...} on stdout, which shows the user a reminder and lets the
turn end normally.

Design notes (conservative on purpose — false NEGATIVES beat false positives):
- Only fires when design-output=true AND citation=false. When in any doubt it
  stays silent. Nagging on a non-design turn is worse than missing one.
- DESIGN-OUTPUT is detected off deliberate signals: a fenced tsx/jsx code block,
  an ASCII UI mockup, or design-verdict phrasing ("GREENLIGHT", "here's the
  design/mockup/layout"). Plain chat/explanation → silent.
- CITATION is detected broadly (any of: a "Consulted:" line, a topic path
  segment Decisions/|Research/|Meetings/|projects/, an Obsidian [[wikilink]],
  or the word "vault"). Any hit → assume the vault was consulted → silent.
- Everything is wrapped so it can never throw and never break the turn.
"""
import json
import os
import re
import sys


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            b.get("text", "")
            for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        )
    return ""


def last_assistant_text(transcript):
    """Most recent assistant text block in the transcript (mirrors ds-claim-gate)."""
    out = ""
    try:
        with open(transcript) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    e = json.loads(line)
                except json.JSONDecodeError:
                    continue
                role = e.get("type") or (e.get("message") or {}).get("role")
                if role == "assistant":
                    t = text_of((e.get("message") or {}).get("content"))
                    if t.strip():
                        out = t
    except OSError:
        pass
    return out


# --- DESIGN-OUTPUT detection (conservative) ----------------------------------

# Fenced tsx / jsx code block: ```tsx  or  ```jsx  (also react/t...x variants)
_FENCE_TSX = re.compile(r"```\s*(tsx|jsx|react)\b", re.IGNORECASE)

# Design-verdict / hand-off phrasing.
_DESIGN_PHRASES = (
    "greenlight",
    "here's the design",
    "here is the design",
    "here's the mockup",
    "here is the mockup",
    "here's the layout",
    "here is the layout",
    "here's a mockup",
    "here is a mockup",
)

# ASCII UI mockup: box-drawing chars, or several pipe-delimited "frame" lines.
_BOX_CHARS = "┌┐└┘├┤┬┴┼─│╭╮╰╯╔╗╚╝║═╠╣╦╩╬"


def looks_like_ascii_mockup(text):
    if any(ch in text for ch in _BOX_CHARS):
        return True
    # Fallback: 3+ lines that both start and end with a pipe (an ASCII frame).
    framed = 0
    for line in text.splitlines():
        s = line.strip()
        if len(s) >= 3 and s.startswith("|") and s.endswith("|"):
            framed += 1
            if framed >= 3:
                return True
    return False


def is_design_output(text, low):
    if _FENCE_TSX.search(text):
        return True
    if any(p in low for p in _DESIGN_PHRASES):
        return True
    if looks_like_ascii_mockup(text):
        return True
    return False


# --- CITATION detection (broad) ----------------------------------------------

# A topic-folder / pipeline-stage path segment from the vault.
_CITATION_PATH = re.compile(r"\b(Decisions|Research|Meetings|projects)/", re.IGNORECASE)
# An Obsidian wikilink [[...]].
_WIKILINK = re.compile(r"\[\[[^\]]+\]\]")


def has_citation(text, low):
    if "consulted:" in low:
        return True
    if "vault" in low:
        return True
    if _CITATION_PATH.search(text):
        return True
    if _WIKILINK.search(text):
        return True
    return False


REMINDER = (
    "Vault-citation reminder (non-blocking): this response looks like design "
    "output but cites no consulted vault note. Per CLAUDE.md, consult the "
    "Obsidian vault FIRST on any design/UX task — open _Insights.md, then the "
    "feature's matching Decisions/ / Meetings/ / Research/ notes plus the active "
    "projects/ file — and cite the notes you consulted at the top of the design "
    "response. If you already consulted the vault, just add a 'Consulted: ...' "
    "line so the record is intact."
)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    try:
        if payload.get("stop_hook_active"):  # avoid loops
            sys.exit(0)

        transcript = payload.get("transcript_path")
        if not transcript or not os.path.exists(transcript):
            sys.exit(0)

        text = last_assistant_text(transcript)
        if not text.strip():
            sys.exit(0)
        low = text.lower()

        if not is_design_output(text, low):
            sys.exit(0)  # not design output — silent
        if has_citation(text, low):
            sys.exit(0)  # vault was cited — silent

        # design-output=true AND citation=false → non-blocking nudge.
        print(json.dumps({"systemMessage": REMINDER}))
        sys.exit(0)
    except SystemExit:
        raise
    except Exception:
        # Never throw, never block the turn.
        sys.exit(0)


if __name__ == "__main__":
    main()
