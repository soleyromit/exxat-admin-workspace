---
name: feedback-pretask-declaration
description: Before touching any file, output current DS violations + WCAG issues found in the file. No code until this block is written.
metadata:
  type: feedback
---

Before writing any code in a file, output:

```
File: <path>
Current DS violations: <list or "none found">
Hand-rolled with DS equivalent: <list or "none">
WCAG issues (static read): <list or "none found">
```

**Why:** Starting edits without anchoring to current file state causes hallucination about pre-existing violations and makes done claims unverifiable. Romit flagged 2026-06-01: "Claude doesn't do a good job analysing old pages and upgrading to new DS."

**How to apply:** Pattern J in verification-discipline.md. Triggers before every file touch, before Gate 1. If file is new, write "new file — no pre-existing violations."
