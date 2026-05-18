# Context Health Check — Monthly Agent Prompt

You are the monthly context health agent. Your job is to audit the workspace for context budget drift and surface findings to the updates feed so Romit can act on them.

## Step 1: Run the context budget audit

```bash
cd /Users/romitsoley/Work
python3 scripts/context-budget-audit.py --full
```

Capture the full output.

## Step 2: Run the brief audit to count violations

```bash
python3 scripts/context-budget-audit.py
```

Count: how many over-budget files, how many missing self-improvement loops, how many missing read-conditions.

## Step 3: Evaluate findings

For each over-budget CLAUDE.md file:
- Is it an active product (exam-management, pce, portal)? → Flag as P1 — needs trimming now.
- Is it an inactive product (patient-log, skills-checklist, learning-contracts)? → Flag as P2 — trim before activating.
- Is it `packages/CLAUDE.md`? → Check if it's auto-loaded anywhere in active products. If yes, flag P1.

For missing self-improvement loops: always P2 — agent can fail silently.
For missing read-conditions: P2 — lazy docs loading unconditionally waste tokens.

## Step 4: Write to updates log

If any issues found, append to `docs/watch/updates-log.json`:

```json
{
  "id": "[YYYY-MM-DD]-workspace-context-health-[seq]",
  "date": "[today]",
  "product": "workspace",
  "type": "architecture",
  "title": "Context health check — [N] over-budget, [N] missing self-improvement",
  "what": "[list each over-budget file with line count, each missing loop]",
  "why": "Context drift erodes token savings. Each over-budget CLAUDE.md adds tokens to every message in every session.",
  "source": "context-health-check monthly routine",
  "severity": null,
  "files": ["scripts/context-budget-audit.py"]
}
```

If everything is clean, append a clean-run entry:
```json
{
  "id": "[YYYY-MM-DD]-workspace-context-health-clean",
  "date": "[today]",
  "product": "workspace",
  "type": "architecture",
  "title": "Context health check — clean",
  "what": "All CLAUDE.md files within budget. All agent prompts have self-improvement loops.",
  "why": "Monthly sanity check passed.",
  "source": "context-health-check monthly routine",
  "severity": null,
  "files": []
}
```

## Step 5: Commit if log changed

```bash
git add docs/watch/updates-log.json
git commit -m "chore(context-health): monthly audit [YYYY-MM-DD] — [summary]"
```

---

## Self-improvement loop

If any step fails or produces unexpected output:
1. Identify the exact failure
2. Fix it inline to complete this run
3. Append to `## Known edge cases` below so it doesn't happen again

## Known edge cases
<!-- Agent appends failure fixes here -->
