# Overnight Canvas Workflow

> Riddering's pattern (dive.club designers): talk to computer before bed → agents generate N concepts overnight → wake up, review canvas, pick a direction.
>
> Implemented as: `/design-variants` (night) + `/morning-canvas` (morning).

## Phase 1 — Manual orchestration (current)

You run the skills manually. No scheduling yet.

### Before bed

1. Write your brief to `~/Inbox/briefs/<date>-<slug>.md`. Example:

   ```bash
   mkdir -p ~/Inbox/briefs
   $EDITOR ~/Inbox/briefs/2026-05-09-course-eval-term-overview.md
   ```

   Brief shape:

   ```markdown
   # <Brief title>

   ## Goal
   What surface to design + the question it answers.

   ## Active product
   pce | exam-management | etc

   ## Active DS profile
   admin | student

   ## Constraints
   - Bullet 1
   - Bullet 2

   ## Reference
   Granola IDs / file paths / pattern IDs to read first.
   ```

2. Invoke `/design-variants` with N + mode + brief content:

   ```
   /design-variants 15 spec admin dashboard for PCE course-evaluation term overview, 18 courses across 14 faculty, AI insights row, faculty trajectory small multiples, course rankings cleveland dot, response funnel sankey
   ```

   - `15` — number of variants
   - `spec` — markdown-only mode (cheap, divergent)
   - rest — the brief

3. Skill creates 15 worktrees under `.worktrees/variants/2026-05-09-course-eval-...-N-<direction>` and dispatches 15 agents in parallel. Each agent produces a `.variants/<slug>-N-<direction>.md` file with ASCII mockup + decisions + tradeoffs.

4. Lock screen, sleep.

### In the morning

```
/morning-canvas
```

Generates `.review/canvas.html`, opens in browser. You see all 15 variants side-by-side. Each card shows:
- Direction (minimal / data-dense / narrative / mobile-first / accessibility-emphasis / ai-forward / pulled-data-forward)
- ASCII mockup preview
- Files changed count
- Tradeoffs
- Buttons: Open dir / Open in VS Code / Open in Cursor / Copy merge command

Pick the direction(s) you like. Either:
- Merge the winner: `git checkout main && git merge variants/2026-05-09-course-eval-N-<direction>`
- OR start a refine round: `/design-variants 5 refine <brief from picked variant>`

### Cleanup

```
/design-variants cleanup
```

Lists current variant worktrees + offers to remove. Confirms before each.

## Phase 2 — Scheduled (planned)

When Phase 1 feels good, automate the bedtime trigger:

### macOS launchd job

```xml
<!-- ~/Library/LaunchAgents/com.exxat.overnight-variants.plist -->
<plist>
  <dict>
    <key>Label</key>
    <string>com.exxat.overnight-variants</string>
    <key>ProgramArguments</key>
    <array>
      <string>/Users/romitsoley/Work/scripts/overnight-variants.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
      <key>Hour</key>
      <integer>23</integer>
      <key>Minute</key>
      <integer>0</integer>
    </dict>
  </dict>
</plist>
```

`scripts/overnight-variants.sh` would:
1. Find newest `.md` in `~/Inbox/briefs/`
2. If newer than last-run timestamp, dispatch `/design-variants` via headless `claude code` invocation
3. On finish, write a desktop notification

Build this when Phase 1 has a few good rounds under its belt.

### Voice → brief

Ideas:
- macOS Shortcuts: voice memo → Whisper → text → `~/Inbox/briefs/<timestamp>.md`
- Granola itself can capture voice notes (we already have the Granola MCP)
- Otto: native dictation app → text file

## Phase 3 — Sophisticated (later)

- Quality gate per variant runs `ds-check` + `design-critique` automatically before showing on canvas
- Native canvas UI via Magic Patterns / Figma export instead of HTML
- Notification when canvas ready
- Cross-product variant capability (ad-hoc: same brief, multiple products)

## Cost discipline

| Mode | Per-variant cost (approx, 2026) | Per-night N=15 |
|---|---|---|
| spec | $0.20-0.40 | $3-6 |
| render | $2-5 | $30-75 |
| refine | $1-3 | $5-15 (for N=5) |

Budget: spec mode 4-5 nights/week is comfortable. Render mode is splurge — only after spec narrows direction.

## What this is NOT

- A replacement for Figma. The canvas is for **divergent exploration**, not pixel-perfect mockups.
- A substitute for stakeholder feedback. Variants don't know what Aarti / Vishaka want — that's still your call.
- A way to "let Claude design for me." It's a way to surface 15 starting points so YOU can converge faster.

## See also

- `.claude/skills/design-variants/SKILL.md`
- `.claude/skills/morning-canvas/SKILL.md`
- `DESIGN.md` §3 (stochastic axis)
- Riddering's original post: dive.club designer canvas pattern
