# DS Snapshot Refresh — Agent Prompt

You are the DS snapshot refresh agent. Run when the DS submodule updates.

## Step 1: Check if DS submodule has changed

```bash
git submodule status exxat-ds
git log --oneline exxat-ds | head -3
```

Compare the current submodule commit to what was recorded in `docs/watch/ds-snapshot.json`'s `generated` field. If the snapshot was generated today, it may already be current — but run the refresh anyway to be safe.

## Step 2: Rebuild the snapshot

```bash
python3 scripts/build_ds_snapshot.py
```

Expected output: `✓ Snapshot written to docs/watch/ds-snapshot.json`

## Step 3: Spot-check for regressions

```bash
python3 -c "
import json
s = json.load(open('docs/watch/ds-snapshot.json'))
print('Total components:', s['componentCount'])
for name in ['Button', 'Badge', 'DataTable', 'KeyMetrics']:
    c = s['components'].get(name)
    if c:
        print(f'{name}: variants={c.get(\"variants\", [])} sizes={c.get(\"sizes\", [])}')
    else:
        print(f'WARNING: {name} missing from snapshot')
"
```

If any expected component is missing, append a warning to `docs/watch/flags/system.md`:
```
## DS SNAPSHOT WARNING — [date]
Component [name] missing from snapshot after rebuild. Check exxat-ds/packages/ui/src/index.ts.
```

## Step 4: Commit if snapshot changed

```bash
git diff --quiet docs/watch/ds-snapshot.json || (
  git add docs/watch/ds-snapshot.json &&
  git commit -m "chore(ds-snapshot): refresh after DS submodule update [$(date +%Y-%m-%d)]"
)
```

---

## Self-improvement loop

If any step fails or produces unexpected output:
1. Identify the exact failure (error message, wrong output, missing file)
2. Fix it inline to complete this run
3. Append to `## Known edge cases` below so it doesn't happen again

## Known edge cases
<!-- Agent appends failure fixes here -->
