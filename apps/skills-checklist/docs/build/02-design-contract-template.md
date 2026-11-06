# Per-surface Design Contract (copy per surface; fill before any JSX)

> Definition of done for a built page: `docs/build/done-definition.md`.

> Draft copies live at `docs/build/contracts/_draft-<S-id>-<surface>.md`; renaming to drop `_draft-` (after Romit confirms) unlocks code for the gate hook. The `skills-surface-contract` skill enforces this.

```
Surface:              <name>                       Wave: W?
Persona(s) & role:    <admin | student | preceptor | faculty | lab instructor | reviewer>  (RBAC row cited)
Scope / data seen:    <what this role may see; what it must not>
Job-to-be-done:       <decision or action this enables, one sentence>
Why → So what:        <why this exists; what changes for the user>   (from journeys/*)
Requirements:         <IDs>                                              (must all exist in source/requirements.extracted.txt)
Open decisions hit:   <OD-n ... and the seam used>                       (strategy/05)
Prototype reference:  <screens/NN + what to keep / what NOT to copy>      (precedence REQ > CALL > PROTO)
Pattern:              <route | sheet | dialog | inline>   Reference hub: <repo path>
DS mapping:           <component → IMPORT|VENDOR|HAND-ROLL, via tools/ds/source.mjs>
States:               L E Er V S Su D P Bl  (strategy/06 row) — each designed
Edge cases:           <EC-n from strategy/06>
Copy:                 <microcopy; professional, no em-dashes/colloquialisms>
A11y:                 <keyboard path, focus, targets, status not colour-only>
Out of scope:         <incl. §14 items>
Acceptance tests:     <testable statements; at least 1 per requirement ID>
Risks / unknowns:     <max 3>
Vault notes consulted:<paths>
```

Reject the contract if: a requirement ID is missing from the source, a state is "TBD", an OD is treated as decided, or the only reference is the prototype.

## Page contract (required; the gate fails without it)

Added 2026-11-04 at Romit's request. `.claude/hooks/skills-code-gate.mjs` blocks edits to a page's files until its contract passes `node .claude/hooks/skills-contract-check.mjs <contract>`. Which files belong to which page: `docs/build/contracts/_page-registry.json`. Older contracts are not checked until their page is in the registry and being changed.

**Admin pages: do not rewrite the spec.** Section D of `docs/build/2026-11-04-admin-workflow-map.md` is the page spec. Name the contract as the registry says, add the line below, and supply only what `--needs` lists. The gate rejects a contract that restates what the map already says. If the spec is wrong, change the map, with Romit.

```
Page spec: docs/build/2026-11-04-admin-workflow-map.md#D1
```

`## Task test IDs` is always required. On a map page it must list every row of that page's section F table, and nothing else. `node .claude/hooks/skills-contract-check.mjs --needs` prints what each map page must supply.

**Any other page:** no `Page spec` line, and fill every section below. Delete any section the map covers. An unfilled copy of this template fails.

## Single job
<one sentence: the one job of this page>

## Primary action
<the one filled button, and when it is enabled>

## Other actions
| Action | Where | Why |
|---|---|---|
| <every other action on the page> | <where it lives> | <why there> |

## Tasks
| Task | Entry | Steps | Finish | Landing |
|---|---|---|---|---|
| <name> | <where the person starts> | <what they do, in order> | <what confirms it worked> | <where they end up> |

## States
Empty: <what shows>
Error: <what shows>

## Not on this page
<what must not appear here>

## Task test IDs
<IDs, one or more per task>
