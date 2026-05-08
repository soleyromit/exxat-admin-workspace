# PCE — Workflows

Long-form workflow specifications. Each `.md` here is one canonical flow, traceable to the prototype + HANDOFF FR-IDs.

## Five canonical flows (Phase 1)

| File | Persona | FRs covered |
|---|---|---|
| `setup-wizard.md` | Coordinator | FR-28 |
| `autopilot-lifecycle.md` | Coordinator + Autopilot | FR-08, FR-09, FR-10 |
| `template-authoring.md` | PD | FR-01, FR-05 |
| `student-response.md` | Student | FR-02, FR-04, FR-16 |
| `faculty-review.md` | Faculty | FR-03, FR-06, FR-11, FR-13, FR-18 |
| `cqi-loop.md` | PD + CCC | FR-14, FR-15 |

## Per-flow shape

Each workflow file should have:

1. **Trigger** — what starts the flow (event, time, user action)
2. **Preconditions** — what must be true before the flow can run
3. **Steps** — numbered; each step names actor, action, system response
4. **Edge cases** — at least 3 (the prototype has these — port them)
5. **Error states** — failure modes + recovery
6. **References** — FR-IDs from HANDOFF.md, screen IDs from prototype

(Empty until first workflow is written. Recommendation: start with `autopilot-lifecycle.md` since it's the highest-leverage flow.)
