---
name: feedback-evidence-required
description: Every verification claim requires evidence. Paste literal subagent verdict. "I ran compliance-reviewer" without output = not run.
metadata:
  type: feedback
---

Every done claim must include an evidence block:

```
axe-core: /tmp/visual-check/<path>.axe.json — 0 violations OR "not run — no dev server"
DS imports: ComponentName from '@exxatdesignux/ui' (file.tsx:line)
grep banned patterns: 0 hits
compliance-reviewer: [paste literal GREENLIGHT or NEEDS-MORE: ...]
state-review: [paste literal verdict]
verification-reviewer: [paste literal verdict]
```

**Why:** Romit flagged 2026-06-01: "Claude forgets WCAG, doesn't do proper visual review, doesn't execute what it recognizes, and hallucinates." Root cause: subagents claimed in text only — no evidence, no output pasted. Text assertion = not verification.

**How to apply:** Pattern I in verification-discipline.md. Triggers on every done claim, every "GREENLIGHT" claim, every "passes" claim. Paste the output or don't make the claim.
