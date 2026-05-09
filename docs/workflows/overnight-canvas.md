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

## Phase 2 — Scheduled (BUILT — one-time install)

**Zero commands during operation.** One-time install, then automatic forever.

### One-time install

```bash
bash scripts/install-overnight-launchd.sh
```

This:
1. Symlinks `scripts/launchd/com.exxat.overnight-variants.plist` → `~/Library/LaunchAgents/`
2. Symlinks `scripts/launchd/com.exxat.morning-canvas.plist` → `~/Library/LaunchAgents/`
3. Loads both jobs via `launchctl`
4. Creates `~/Inbox/briefs/` if missing

### How it runs

| Time | What fires | What happens |
|---|---|---|
| 11:00 PM | `scripts/overnight-variants.sh` | Finds newest `.md` in `~/Inbox/briefs/`. If newer than last-run mtime, invokes headless `claude --print "/design-variants 15 spec <brief>"`. macOS notification: "Overnight variants started". |
| 7:00 AM | `scripts/morning-canvas-auto.sh` | Checks if any `variants/*` branches have commits since last canvas. If yes, invokes `claude --print "/morning-canvas --no-open"`, then `open .review/canvas.html`. macOS notification: "Variant canvas ready — N variants". |

### Workflow with the install active

1. Before bed: dictate a brief into Notes (or any text editor) → save to `~/Inbox/briefs/<date>-<slug>.md`. Or use macOS dictation directly into a new file.
2. Sleep.
3. Wake up. macOS notification fires; canvas already open in browser.
4. Pick a direction; merge or refine.

You type **zero commands** during the loop. The install ran once.

### Voice → brief (optional)

To eliminate even typing the brief:

**macOS Shortcuts (recommended):** create a Shortcut with these actions:
1. "Record Audio" → captures voice memo
2. "Transcribe" (uses on-device Whisper, free) → text
3. "Save to file" → `~/Inbox/briefs/<timestamp>.md`

Bind to a Hot Key or Siri ("Hey Siri, log a design brief"). Speak the brief; file appears in inbox; tonight's job picks it up.

### Cost & caveats

- Mac must be open (or set to "stay awake" via Caffeine app) at 11pm for launchd to dispatch the job.
- `claude` CLI must be authenticated (one-time setup; install script warns if not in PATH).
- ~$3-6/night for spec mode N=15. ~$15-30/week if used most nights.
- Logs at `~/Library/Logs/exxat-overnight-variants.log` and `~/Library/Logs/exxat-morning-canvas.log` for debugging.
- Throttle/skip is built in: same brief twice → only first run dispatches; same canvas already opened → second tick skips.

### Uninstall

```bash
launchctl unload ~/Library/LaunchAgents/com.exxat.overnight-variants.plist
launchctl unload ~/Library/LaunchAgents/com.exxat.morning-canvas.plist
rm ~/Library/LaunchAgents/com.exxat.{overnight-variants,morning-canvas}.plist
```

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
