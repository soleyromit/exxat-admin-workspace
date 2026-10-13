# Per-surface Design Contract (copy per surface; fill before any JSX)

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
