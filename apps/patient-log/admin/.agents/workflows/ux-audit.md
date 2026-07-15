---
description: Audit an existing Exxat DS surface against P1–P20, modern SaaS patterns, and binding rules.
---

# /ux-audit — UX audit

## Steps

1. Load `.agents/skills/exxat-ux-audit/SKILL.md`.
2. Identify target: route, component file, or user-provided path/screenshot.
3. If screenshot: **IA only** — map to DS patterns; no pixel-copy.
4. Produce findings report:
   - **Blocker** / **Issue** / **Nit**
   - Principle or rule citation (P-codes, rule name)
   - Code citation where applicable
   - Fix plan (component-level preferred)
5. Offer to auto-apply **text-only Blocker** fixes if user confirms.

## References

- `docs/exxat-ds/modern-saas-patterns.md` (M1–M12)
- `.agents/rules/_constitution.exxat-ds.md`
- `./AGENTS.md` §8 (a11y floor)
