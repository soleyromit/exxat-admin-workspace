#!/usr/bin/env python3
"""Validate every apps/**/vercel.json against Vercel's schema limits.

Run locally:  python3 scripts/check-vercel-json.py
In CI:        .github/workflows/vercel-config.yml

WHY (2026-07-15): a correct-but-270-character `ignoreCommand` failed Vercel's
schema validation — an UNDOCUMENTED 256-char cap. A schema failure errors the
deployment at 0ms, before any build runs, so the build log says nothing useful.
Seven Vercel projects watch this repo, so one push = seven failure emails.

Exit 0 = all good. Exit 1 = a file would break on Vercel.
"""

from __future__ import annotations

import json
import pathlib
import sys

# Vercel rejects vercel.json outright above this. Undocumented; discovered the
# hard way. Do not raise it "because our command needs the room" — Vercel wins.
IGNORE_COMMAND_MAX = 256

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent


def main() -> int:
    files = sorted(REPO_ROOT.glob("apps/**/vercel.json"))
    if not files:
        print("No apps/**/vercel.json found — nothing to validate.")
        return 0

    errors: list[str] = []

    for path in files:
        rel = path.relative_to(REPO_ROOT)

        try:
            config = json.loads(path.read_text())
        except json.JSONDecodeError as exc:
            errors.append(f"{rel}: not valid JSON — {exc}")
            continue

        ignore_command = config.get("ignoreCommand")
        if ignore_command is None:
            print(f"  ok    {rel}  (no ignoreCommand)")
            continue

        if not isinstance(ignore_command, str):
            errors.append(f"{rel}: ignoreCommand must be a string, got {type(ignore_command).__name__}")
            continue

        length = len(ignore_command)
        if length > IGNORE_COMMAND_MAX:
            errors.append(
                f"{rel}: ignoreCommand is {length} chars, limit is {IGNORE_COMMAND_MAX} "
                f"({length - IGNORE_COMMAND_MAX} over). Vercel will reject vercel.json "
                f"and error the deployment at 0ms. Shorten it — e.g. `R=$VERCEL_GIT_COMMIT_REF` "
                f"instead of repeating the variable, `-q` instead of `>/dev/null 2>&1`."
            )
        else:
            headroom = IGNORE_COMMAND_MAX - length
            print(f"  ok    {rel}  (ignoreCommand {length}/{IGNORE_COMMAND_MAX}, {headroom} to spare)")

    if errors:
        print("\nFAIL — vercel.json would be rejected by Vercel:\n", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print(f"\nOK — {len(files)} vercel.json file(s) within Vercel's schema limits.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
