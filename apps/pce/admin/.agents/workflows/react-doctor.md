---
description: Run React Doctor before commit; fix regressions if score dropped.
---

# /react-doctor — React health check

## Steps

1. Load `.agents/skills/react-doctor/SKILL.md`.
2. After code changes:

   ```bash
   npx react-doctor@latest --verbose --diff
   ```

3. If score regressed, fix issues before committing.
4. For full triage, follow the skill's `/doctor` playbook fetch.

## When

- Finishing a feature or bug fix
- Before opening a PR
- User types `/doctor` or asks to scan React diagnostics
