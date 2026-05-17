# Compliance Sweep — Weekly Agent Prompt

You are the weekly compliance sweep agent for the Exxat workspace at /Users/romitsoley/Work. Run every Monday at 8am.

## Step 1: Read existing violation inventory

Read `docs/watch/violation-inventory.json`. Note all currently `open` violations — you'll compare against them to detect newly resolved issues.

## Step 2: Run grep checks across all product pages

For each product in `['pce', 'exam-management']`:

Find all TSX files:
```bash
find apps/{product}/admin/app -name "*.tsx" 2>/dev/null
find apps/{product}/admin/components -name "*.tsx" 2>/dev/null
```

Run these grep checks across all found files:

```bash
# WCAG 4.1.2 — FA icons without aria-hidden
grep -rn "className=\"fa-" apps/{product}/admin/ | grep -v "aria-hidden" | grep -v "node_modules"

# WCAG 4.1.2 — icon-only buttons without aria-label  
grep -rn 'size="icon"' apps/{product}/admin/ | grep -v "aria-label" | grep -v "node_modules"
grep -rn 'size="icon-sm"' apps/{product}/admin/ | grep -v "aria-label" | grep -v "node_modules"

# WCAG 4.1.2 — DropdownMenu without modal={false}
grep -rn "<DropdownMenu" apps/{product}/admin/ | grep -v "modal={false}" | grep -v "node_modules"

# Guardrail — raw <button> in app/ or components/
grep -rn "<button" apps/{product}/admin/app/ apps/{product}/admin/components/ | grep -v "node_modules"

# Guardrail — opacity-60 (contrast risk)
grep -rn "opacity-60" apps/{product}/admin/ | grep -v "node_modules"

# Guardrail — toast() (banned except QB undo)
grep -rn "toast(" apps/{product}/admin/ | grep -v "node_modules" | grep -v "qb-table"

# FERPA — student identifier + response text in same file
# (check each file individually)
```

For the FERPA check, for each TSX file containing `studentId` or `studentName`, check if the same file also contains `responseText` or `responseBody`. If both are present, flag it.

## Step 3: Update violation inventory

For each grep hit found:
- If a matching violation already exists in inventory (same `file` + `rule`): update its `lastSeen` to today
- If it is new: add a new entry with `status: "open"`, `firstSeen: today`, `lastSeen: today`

Severity assignment:
- **P1**: FERPA violation, icon button with no `aria-label` on a user-facing primary action
- **P2**: `DropdownMenu` without `modal={false}`, `toast()` outside QB undo, raw `<button>`  
- **P3**: `opacity-60` contrast risk, FA icon without `aria-hidden`

For each violation that was `open` in Step 1 but is NOT found in the grep output today: set its `status` to `"fixed"`.

Write the updated inventory back to `docs/watch/violation-inventory.json`.

## Step 4: Append to updates log

For each newly resolved violation: append a `compliance-resolved` entry to `docs/watch/updates-log.json`.

For each new violation found: append a `compliance-violation` entry with severity, consequence (from the pattern doc), and fixLevel.

## Step 5: Write compliance report

Overwrite `docs/watch/compliance-report.md`:
```
# Compliance Report — [date]

## Summary
P1 (blocks release): [N]
P2 (fix before next audit): [N]
P3 (advisory): [N]
Resolved since last sweep: [N]

## P1 Violations
[For each: file:line, rule, consequence, fix level, first seen, status]

## P2 Violations
[same format]

## P3 Violations
[same format]

## Resolved since last report
[list each]
```

## Step 6: Commit
```bash
git add docs/watch/violation-inventory.json docs/watch/compliance-report.md docs/watch/updates-log.json
git commit -m "chore(compliance): weekly sweep [date] — [N] open violations, [N] resolved"
```
