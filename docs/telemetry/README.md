# Telemetry — Schema, Retention, Privacy

> Local telemetry for the design intelligence harness. Events are written by the three Claude Code hooks (SessionStart, UserPromptSubmit, PreToolUse) to a single JSONL file. The analyzer at `scripts/telemetry-report.py` produces summaries for tuning rules and quarterly governance.

---

## Privacy + retention

| Property | Value |
|---|---|
| **Storage** | Local-only — `docs/telemetry/events.jsonl` |
| **Network** | None. No external telemetry. No reports sent anywhere. |
| **Git** | The raw events file is **gitignored**. Analyzer outputs CAN be committed if you want to share a summary. |
| **Retention** | Append-only. Rotate manually if file grows large (`mv events.jsonl events-2026Q1.jsonl`). |
| **Sensitive data** | The hook writes `prompt_chars` and `prompt_lines` (counts, not content). It does NOT log full prompt text. File paths ARE logged (used for rule tuning). |
| **Sharing summaries** | Run `python3 scripts/telemetry-report.py --json` and share the output if needed. The summary contains counts + rule IDs + paths but no prompt content. |

If you want to log prompt content for deeper analysis, edit `.claude/hooks/_telemetry.py` to add a `prompt` field — but keep in mind it'll be in plaintext on disk.

---

## Event schema

All events share these fields:

```json
{
  "ts": "2026-05-08T20:30:00+00:00",   // ISO 8601 UTC
  "event": "<event-type>",              // see below
  "session": "<claude-session-id>",     // empty if env var not set
  ...event-specific fields
}
```

### `session.start`

Fires on every Claude Code session boot.

```json
{
  "event": "session.start",
  "cwd": "/Users/.../apps/exam-management/admin/components",
  "product": "exam-management",
  "profile": "admin",
  "matcher": "startup"  // startup | resume | clear
}
```

### `userpromptsubmit`

Fires on every user prompt. Recorded ONLY when triggers match (no events for benign prompts) — wait, scratch that, recorded for every prompt with the matched-actions list (empty list possible).

Fields:

```json
{
  "event": "userpromptsubmit",
  "prompt_chars": 34,           // length of prompt text
  "prompt_lines": 1,            // line count
  "actions": ["intake:adr-draft", "rule:cite-and-surface"],  // matched action IDs
  "action_count": 2
}
```

NOTE: only fires when actions matched (current implementation skips when `matches` is empty before the `_telemetry_emit` call). To track baseline prompt rate, see future work below.

### `pretooluse.pass`

Fires when a write tool succeeded without violations.

```json
{
  "event": "pretooluse.pass",
  "tool": "Write",        // Write | Edit | MultiEdit
  "file_path": "/.../foo.tsx",
  "profile": "admin",     // admin | student | (empty if undetected)
  "content_chars": 50
}
```

### `pretooluse.violation`

Fires when one or more rules tripped.

```json
{
  "event": "pretooluse.violation",
  "tool": "Write",
  "file_path": "/.../foo.tsx",
  "profile": "admin",
  "rules": ["DS-010", "DS-011a"],
  "violation_count": 2,
  "blocked": true        // true if any rule was blocking-mode
}
```

---

## Reading the data

```bash
# Last 7 days summary
python3 scripts/telemetry-report.py

# Last 30 days
python3 scripts/telemetry-report.py --days 30

# Quarterly governance review (90 days, action-oriented format)
python3 scripts/telemetry-report.py --quarterly

# Machine-readable JSON
python3 scripts/telemetry-report.py --json
```

The analyzer produces:

| Section | What it tells you |
|---|---|
| Hook fire counts | Volume — is the harness firing? |
| Top UserPromptSubmit actions | Which triggers fire most? Tuning signal for trigger patterns. |
| Top PreToolUse violations | Which rules trip most? Tuning signal for false-positive rate. |
| False-positive estimate | Heuristic: violation followed within 10 min by an override → suspect rule too strict. |
| ADR throughput | How many ADRs added per scope in window — productivity indicator. |
| Override ledger summary | Active overrides per rule from `docs/governance/exceptions.md`. |
| DESIGN.md amendment candidates | Rules with 3+ active overrides — propose amending the rule (per L5 governance). |
| Governance actions (quarterly only) | Concrete action checklist to run. |

---

## Tuning loop

The telemetry feeds two governance loops:

1. **Rule tuning** (weekly–monthly) — Top violations + false-positive estimate → tweak regex specificity, demote rule from blocking to warning, or split a too-broad rule.
2. **DESIGN.md amendments** (quarterly) — Amendment candidates list → file ADR to expand or relax a rule that's overridden constantly.

---

## Future work

- Track UserPromptSubmit baseline (every prompt, not just matched) for fire-rate denominators
- Track session duration / per-session event volume
- Track skill invocation events (when intake / ds-component-check / etc. are used)
- Track command (`/intake`, `/design-variants`) invocation events
- Track which subagents are dispatched and their durations
- Add a `--top-paths` flag to surface files that violate rules most often
