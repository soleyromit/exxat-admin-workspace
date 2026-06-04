---
name: morning-canvas
description: Use when user invokes `/morning-canvas` or asks to review overnight design variants (after `/design-variants` finished while they slept). Generates a static HTML canvas at `.review/canvas.html` showing all variant worktrees with name, direction, summary, files changed, and action buttons (open dir, diff vs main, pick winner). Opens automatically in the browser. Pairs with `design-variants` skill.
---

# Morning Canvas — Review Overnight Variants

Generates a single-page HTML "canvas" of all variant worktrees produced overnight (or since N days), so the user wakes up to a side-by-side review surface and picks a direction with one click.

This is the morning side of Riddering's pattern: talk to computer before bed → variants generate → wake up to canvas of N concepts → pick.

## When this skill fires

Triggers (UserPromptSubmit hook):
- "/morning-canvas"
- "show me last night's variants"
- "what did the variants come up with"
- "canvas"

If no variants exist (no `variants/*` branches OR `.worktrees/variants/*` directories), report friendly empty state.

## Workflow

### 1. Detect variant worktrees

Look for either or both:
- Branches matching `variants/*` (via `git branch --list 'variants/*'`)
- Worktree directories under `.worktrees/variants/` (via `git worktree list`)

If `--since <duration>` flag passed, filter to worktrees created in last N (e.g., `1d`, `12h`, `3d`).

### 2. Per-variant data extraction

For each variant:

```bash
git -C <worktree-path> log --oneline -1                         # last commit
git -C <worktree-path> diff --stat main..HEAD                   # files changed
git -C <worktree-path> log --format='%B' -1 HEAD                # full commit body (variant agent's summary)
ls <worktree-path>/.variants/*.md 2>/dev/null                   # spec-mode marker
```

Extract from agent's commit body (which the variant agent writes per design-variants skill):
- Direction (e.g., "minimal", "data-dense")
- Files changed count
- Key decisions (bulleted)
- Tradeoffs (pro / con)
- Where it shines / struggles

If the variant is `spec` mode, the spec markdown lives at `<worktree>/.variants/<slug>-N-<direction>.md` — surface its content as the primary preview.

### 3. Generate the canvas HTML

Write to `.review/canvas.html` (gitignored — see step 5). Layout:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Variant Canvas — <date></title>
  <style>
    /* Use workspace DS tokens via fetch from theme.css OR inline a minimal subset */
    :root {
      --background: oklch(1 0 0);
      --foreground: oklch(0.145 0 0);
      --muted: oklch(0.945 0.002 270);
      --muted-foreground: oklch(0.50 0.012 270);
      --border: oklch(0.92 0.002 270);
      --brand-color: oklch(0.50 0.14 286.1);
      --chart-1: oklch(0.55 0.22 264.116);
      --chart-4: oklch(0.65 0.18 84.429);
    }
    body { font-family: 'Inter', system-ui, sans-serif; padding: 24px; background: var(--background); color: var(--foreground); }
    h1 { font-family: 'ivypresto-text', Georgia, serif; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 16px; margin-top: 24px; }
    .card { border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--background); }
    .card h2 { margin: 0 0 4px; font-size: 16px; }
    .card .direction { font-size: 12px; color: var(--muted-foreground); margin-bottom: 8px; }
    .card pre { font-size: 11px; line-height: 1.4; background: var(--muted); padding: 8px; border-radius: 6px; overflow: auto; max-height: 320px; }
    .card .actions { display: flex; gap: 8px; margin-top: 12px; }
    .card button, .card a { font-family: inherit; font-size: 12px; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--background); color: var(--foreground); text-decoration: none; cursor: pointer; }
    .card button:hover, .card a:hover { background: var(--muted); }
    .card.outlier { border-color: var(--chart-4); }
    .meta { font-size: 12px; color: var(--muted-foreground); }
  </style>
</head>
<body>
  <h1>Variant Canvas — <date></h1>
  <p class="meta"><N> variants · brief: "<brief>" · generated <generated-at></p>

  <div class="grid">
    <!-- one .card per variant -->
    <article class="card">
      <h2>Variant 1 — minimal</h2>
      <div class="direction">branch: variants/2026-05-09-course-eval-1-minimal</div>
      <pre><spec markdown content (preserved)></pre>
      <div class="meta">Files: 1 .md · Commits: 1</div>
      <div class="actions">
        <a href="file:///<worktree-abs-path>" target="_blank">Open dir</a>
        <a href="vscode://file/<worktree-abs-path>" target="_blank">Open in VS Code</a>
        <a href="cursor://file/<worktree-abs-path>" target="_blank">Open in Cursor</a>
        <button onclick="navigator.clipboard.writeText('git checkout main && git merge variants/...'); this.textContent='Copied'">Copy merge cmd</button>
      </div>
    </article>
    <!-- ... -->
  </div>

  <footer style="margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 12px; color: var(--muted-foreground);">
    Generated by <code>/morning-canvas</code>. Pick a winner with <code>/pick &lt;branch&gt;</code> (TODO).
    Cleanup: <code>/design-variants cleanup</code>.
  </footer>
</body>
</html>
```

Use the workspace DS tokens (read first 30 lines of `node_modules/@exxatdesignux/ui/dist/index.d.ts` to extract). Don't fabricate colors.

### 4. Open in browser

```bash
open .review/canvas.html       # macOS
xdg-open .review/canvas.html   # Linux fallback
```

If `--no-open` flag, just print the path.

### 5. Ensure .review is gitignored

Once per workspace, append to `.gitignore`:

```
# Local-only canvas (regenerated on demand)
.review/
```

Check first; don't duplicate.

### 6. Telemetry

```bash
python3 -c "import sys; sys.path.insert(0, '/Users/romitsoley/Work/.claude/hooks'); \
  from _telemetry import emit; emit('skill.invocation', skill='morning-canvas', \
  variant_count=<N>, mode='<spec|render|refine|mixed>')"
```

## Output to the user

After generating canvas:

```
Wrote .review/canvas.html — N variants from <date range>:
  1. minimal — variants/<branch>
  2. data-dense — variants/<branch>
  ...

Opening in browser...

To pick a winner:
  git checkout main && git merge variants/<branch>

To cleanup:
  /design-variants cleanup
```

## Empty state

If no variant worktrees exist:

```
No variant worktrees found.

To create some:
  /design-variants 15 spec <your brief>
  (variants run in parallel; review with /morning-canvas when done)

Or read the spec at .claude/skills/design-variants/SKILL.md for detail.
```

## Honesty rules

- Don't fabricate variant content. If a worktree's commit has no body, surface "(no summary written by agent)" rather than inventing.
- Don't auto-merge anything. The "Pick" buttons should copy commands, never execute them.
- Don't delete worktrees from this skill — that's `/design-variants cleanup` territory.
- If a worktree's branch was already merged to main, mark it as `[MERGED]` in the card.

## Skip the skill when

- The user asks to review a SPECIFIC variant by branch name (use Read directly)
- The user wants to merge a winner (call out the merge command, don't render full canvas)
- There are zero `variants/*` branches (use empty state)

## Why this skill exists

Without it, reviewing 15 overnight variants means manually `git log` + `git diff` + `cd` 15 times. The canvas pattern (per Riddering, dive.club designers) collapses that to a single browser page where the eye picks the direction in 30 seconds.

This is the morning half of the loop. Pair with `design-variants` (night half).

## See also

- `.claude/skills/design-variants/SKILL.md`
- `docs/governance/context-architecture.md` (canvas workflow Phase 1)
- DESIGN.md §3 (stochastic axis)
