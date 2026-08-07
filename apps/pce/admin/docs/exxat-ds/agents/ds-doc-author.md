# Agent: DS Doc Author

**Command:** `pnpm ds:doc:author <slug>`

Generates ship-ready UX documentation for one design-system primitive using OpenRouter + repo context (registry, source, rules, previews, wizard gold standard).

---

## Prerequisites

1. Copy `.env.example` to `.env.local` (gitignored).
2. Set `OPENROUTER_API_KEY` from [OpenRouter](https://openrouter.ai/keys).
3. Optional: `DS_DOC_MODEL` (default `anthropic/claude-sonnet-4`).

```bash
cp .env.example .env.local
# edit .env.local — never commit the key
```

Load env for one command:

```bash
set -a && source .env.local && set +a && pnpm ds:doc:author tabs
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm ds:doc:collect tabs` | Dump JSON context (no API call) |
| `pnpm ds:doc:author tabs` | Generate + validate + write files |
| `pnpm ds:doc:author tabs --dry-run` | Context only |
| `pnpm ds:doc:author tabs --force` | Overwrite existing doc files |
| `pnpm ds:doc:author tabs --apply-only` | Write from `apps/web/.ds-doc-cache/tabs.json` |

---

## What it writes

| Artifact | Path |
|----------|------|
| Cache (review) | `apps/web/.ds-doc-cache/<slug>.json` |
| Component doc | `apps/web/lib/design-system/component-docs/<slug>.tsx` |
| Pattern narrative | `apps/web/docs/<slug>-pattern.md` |

Live previews stay in `design-system-previews.tsx`. Component doc uses `sections: []` when previews are already wired.

Auto-registration: `component-docs/index.ts` uses `import.meta.glob`.

After authoring:

```bash
pnpm ds:catalog:audit
pnpm --filter @exxat-ds/reference-app typecheck
```

---

## Review checklist (human)

- [ ] `ux.job` names a decision, not a feature list
- [ ] `whenNotToUse` calls out Wizard/Tabs/Dialog confusions where relevant
- [ ] Principles are real P-codes; modern refs include M-codes
- [ ] No em dashes in user-visible strings
- [ ] `guidelines.dont` matches binding rules (no toast, tokens only, a11y)
- [ ] Pattern doc links existing rule if one already exists
- [ ] API rows match source exports (no invented props)

---

## Architecture

```
collect-ds-doc-context.mjs  →  registry + source + rules + previews
ds-doc-author.mjs           →  OpenRouter JSON → validate → apply
lib/ds-doc-prompt.mjs       →  system prompt (wizard gold standard)
lib/validate-ds-doc-output.mjs
lib/ds-doc-apply.mjs        →  TSX + markdown writers
```

Gold standard reference: `wizard` (`wizard-pattern.md`, `component-docs/wizard.tsx`).

---

## Security

- **Never commit** `OPENROUTER_API_KEY`.
- Rotate the key if it was pasted into chat or logs.
- Cache JSON may be committed for review; it contains no secrets.

---

## INDEX.yaml

Listed under `agents.ds-doc-author` and `skills` router packets.
