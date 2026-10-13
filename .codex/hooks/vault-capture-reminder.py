#!/usr/bin/env python3
"""
vault-capture-reminder — Stop hook (NON-BLOCKING reminder only).

The WRITE-side mirror of vault-citation-gate.py (the READ side). CLAUDE.md
mandates that when you learn something DURABLE — a design/product DECISION, a
RESEARCH finding, or the user explicitly asked to remember/note something — you
capture it into the Obsidian vault (~/Documents/research-repos) so the shared
brain stays current. This hook is a gentle nudge when the final assistant
message PRODUCED durable knowledge but shows no sign it was CAPTURED.

It is a SURFACE-ONLY reminder — it never blocks. Like vault-citation-gate.py
(and unlike ds-claim-gate.py which exits 2 + stderr to BLOCK), this uses the
WARN path: exit 0 with a JSON {"systemMessage": ...} on stdout, which shows a
reminder and lets the turn end normally. It NEVER exits 2.

Design notes (conservative on purpose — false NEGATIVES beat false positives):
- Only fires when durable-knowledge=true AND captured=false. When in any doubt
  it stays silent. Nagging on an ordinary turn is worse than missing one.
- DURABLE-KNOWLEDGE is detected off a short allow-list of high-precision
  phrases stating a conclusion (a decision, a research finding) or an explicit
  memory intent — NOT broad keyword matching. Plain chat/explanation → silent.
- CAPTURED is detected broadly (any of: inbox/, a vault path segment
  Decisions/|Research/|Meetings/|research-repos, /harvest, the intake /
  research-intake skill, or "wrote to the vault"). Any hit → assume it was
  captured → silent.
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


# --- DURABLE-KNOWLEDGE detection (conservative allow-list) --------------------

# Decision phrasing — a conclusion STATED, not merely discussed.
_DECISION_PHRASES = (
    "we decided",
    "the decision is",
    "we'll go with",
    "we will go with",
    "settled on",
    "let's standardize on",
    "lets standardize on",
    "we're standardizing on",
    "we are standardizing on",
)

# Research-finding phrasing — a finding STATED as a conclusion.
_RESEARCH_PHRASES = (
    "research shows",
    "the analysis found",
    "the analysis shows",
    "competitor research",
    "user research",
    "the data says",
    "the data shows",
)

# Explicit memory intent — the user asked to remember / note / capture.
_MEMORY_PHRASES = (
    "remember this",
    "note this",
    "for the record",
    "capture this",
)


def is_durable_knowledge(low):
    if any(p in low for p in _DECISION_PHRASES):
        return True
    if any(p in low for p in _RESEARCH_PHRASES):
        return True
    if any(p in low for p in _MEMORY_PHRASES):
        return True
    return False


# --- CAPTURED detection (broad) ----------------------------------------------

# A vault path segment / pipeline-stage marker.
_CAPTURE_PATH = re.compile(
    r"\b(inbox|Decisions|Research|Meetings)/|research-repos", re.IGNORECASE
)


def is_captured(text, low):
    if _CAPTURE_PATH.search(text):
        return True
    if "harvest" in low:  # /harvest slash command or harvest skill
        return True
    if "intake" in low:  # covers intake + research-intake skill mentions
        return True
    if "wrote to the vault" in low or "wrote it to the vault" in low:
        return True
    return False


REMINDER = (
    "Vault-capture reminder (non-blocking): this turn produced a durable "
    "decision or research finding that isn't captured in the Obsidian vault. "
    "Per CLAUDE.md, keep the shared brain current — drop a raw note in "
    "~/Documents/research-repos/inbox/, or run the intake / research-intake "
    "skill, or /harvest it from the matching projects/ file. If you already "
    "captured it, mention the inbox/ or vault path so the record is intact."
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

        if not is_durable_knowledge(low):
            sys.exit(0)  # no durable knowledge — silent
        if is_captured(text, low):
            sys.exit(0)  # already captured — silent

        # durable-knowledge=true AND captured=false → non-blocking nudge.
        print(json.dumps({"systemMessage": REMINDER}))
        sys.exit(0)
    except SystemExit:
        raise
    except Exception:
        # Never throw, never block the turn.
        sys.exit(0)


if __name__ == "__main__":
    main()
