# Definition of done for any page

Approved by Romit, 2026-11-04. A page is done only when all of this has happened, in this order. A passing step does not excuse a later one. Until then call it built, not done.

| # | Step | Run (from `apps/skills-checklist`) | Who signs off |
|---|---|---|---|
| 0 | Before building: the contract is valid | `node .claude/hooks/skills-contract-check.mjs docs/build/contracts/<contract>.md` | The Agent Manager confirms the contract against the approved map. Romit no longer renames files |
| 1 | Task tests pass | `cd admin && node scripts/lab-task-tests.mjs` | Builder pastes the output |
| 2 | Consistency gate passes | `cd admin && node scripts/lab-consistency-gate.mjs` (add `--page=D<n>` for one page while working; the full run decides) | Builder pastes the output |
| 3 | Independent reviewer passes | Agent `skills-task-reviewer`, given only the page ID and the URL. If it is not available yet, use the paste text at the end of `.claude/agents/skills-task-reviewer.md`. Never give it the builder's summary. Its verdict must read `PAGE PASS` | The reviewer. Paste its verdict and its "Did not test" list |
| 4 | Romit tries it | Romit uses the page himself | Romit, and only Romit |
| 5 | Prod | Nothing goes to prod until Romit says so | Romit |

Rules:
- A step that was not run is a failure, not a pass. Say which were not run.
- If code changes after step 3, steps 1 to 3 run again for that page.
- The other gates (`lab-ds-gate`, `lab-req-gate`, axe) are still required. Passing them is not done: they are what kept passing while flows, editing, button placement and consistency were wrong.
