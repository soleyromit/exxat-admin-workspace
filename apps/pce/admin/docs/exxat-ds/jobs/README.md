# Exxat DS — Jobs library

> **What:** Canonical reference per **job-to-be-done**, not per component.
> **Why:** Components answer "how to render". Jobs answer "what to build".
> **Who:** Humans + AI agents writing design briefs
> ([`exxat-ux-discovery-protocol.mdc`](../../../.cursor/rules/exxat-ux-discovery-protocol.mdc)).

A **job** is what the user is trying to accomplish — not the screen they end
up on. **The job is the contract.**

**Index:** [`../INDEX.yaml`](../INDEX.yaml) → `jobs`.

## When to use this library

- Map user prompts to a **job** first, then pick the reference.
- Design briefs MUST cite the relevant job doc.
- If no job doc matches, **write one** (even short) as part of the work.

## Job → screen mapping

| Job | Doc | Canonical references |
|-----|-----|----------------------|
| **Triage / manage a list of records** | [`list-hub.md`](./list-hub.md) | `library-table.tsx`, `PlacementsClient` |
| **Focus task / timed exam** | [`focus-workflow.md`](./focus-workflow.md) | `exam-lock-showcase-client.tsx`, `new-library-item-form.tsx` |
| **Browse DS patterns / catalog** | [`catalog-browse.md`](./catalog-browse.md) | `catalog-client.tsx` |
| **Review a record's full state** | [`record-detail.md`](./record-detail.md) | Students / Placements / Library detail |
| **Settings / preferences** | [`settings-preferences.md`](./settings-preferences.md) | `src/views/settings.tsx` |
| **Dedicated search** | [`dedicated-search.md`](./dedicated-search.md) | `DedicatedSearch*` templates |
| **Scan many metrics for anomalies** | *future* | Dashboard route, `DashboardTabs` |
| **Search / find anything** | [`dedicated-search.md`](./dedicated-search.md) | `DedicatedSearch*`, `CommandMenu` |

## How a job doc is structured

Every job doc must include:

1. **Job-to-be-done** — user pain, decision, action.
2. **Decision** — when this job applies vs sibling jobs.
3. **Checklist** — build + ship gates.
4. **Rules & skills** — pointers to scoped rules (not full copies).

Long-form narrative lives in **`../focus-workflow-pattern.md`**, **`../data-views-pattern.md`**, etc.

## See also

- [`../modern-saas-patterns.md`](../modern-saas-patterns.md)
- [`../component-selection-guide.md`](../component-selection-guide.md)
- [`../blueprints/`](../blueprints/)
- [`.cursor/skills/exxat-senior-ux/SKILL.md`](../../../.cursor/skills/exxat-senior-ux/SKILL.md)
