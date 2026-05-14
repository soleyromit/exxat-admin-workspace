# Products Registry

> Workspace-wide product registry. Loaded on demand by SessionStart hook based on active product (cwd resolution). Mirrors the `apps/<id>/` directory structure.
>
> **Source of truth** for "which products exist, what state, what DS, what ports." Other docs reference rows here — don't duplicate.
>
> When adding a row: also add `apps/<id>/CLAUDE.md` from the workspace template (see CLAUDE.md §15).

## Schema

| Field | Meaning |
|---|---|
| `id` | Stable kebab-case slug. Used as anchor in COMPETITOR-INTEL.md, RESEARCH-SIGNALS.md, ANALOGIES.md |
| `product` | Human-readable name |
| `status` | `active` (live build) · `scoped` (scaffolded, not built) · `planned` (not yet scaffolded) · `alias` (alternate name for an existing product) |
| `admin_pkg` / `admin_port` | npm package + dev port for admin app |
| `student_pkg` / `student_port` | npm package + dev port for student app |
| `ds` | `@exxat-ds/ui` (admin DS) or `@exxat/student` (student DS) — usually both |
| `pm` / `dev` | Stakeholder ownership |
| `priority` | `very-high` · `high` · `med-high` · `medium` · `low` |
| `lifecycle` | Where this surface sits in the program lifecycle (didactic / clinical / culminating / advisory) |

## Registry

| id | product | status | admin_pkg | admin_port | student_pkg | student_port | ds | pm | dev | priority | lifecycle |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `exam-management` | Exam Management | active | `@exxat/exam-management-admin` | 3001 | `@exxat/exam-management-student` | 3002 | both | Vishaka, Nipun | Darshan | high | Didactic → Clinical |
| `pce` | PCE (Practice/Clinical Experience) | active | `@exxat/pce-admin` | 3005 | `@exxat/pce-student` | 3006 | both | Vishaka | TBC | med-high | Clinical |
| `course-eval` | Course & Faculty Evaluation | alias | — | — | — | — | — | Vishaka | TBC | med-high | Clinical → Advisory |
| `faas` | FaaS 2.0 (Forms-as-a-Service) | planned | — | — | — | — | both | Lauren, Brooke | TBC | very-high | Cross-stage |
| `patient-log` | Patient Log | scoped | `@exxat/patient-log-admin` | 3003 | `@exxat/patient-log-student` | 3004 | both | TBC | TBC | medium | Clinical |
| `skills-checklist` | Skills Checklist | scoped | `@exxat/skills-checklist-admin` | 3007 | `@exxat/skills-checklist-student` | 3008 | both | TBC | TBC | med-high | Clinical → Culminating |
| `learning-contracts` | Learning Contracts | scoped | `@exxat/learning-contracts-admin` | 3009 | `@exxat/learning-contracts-student` | 3010 | both | TBC | TBC | medium | Clinical |
| `portal` | Workspace Portal | active | `@exxat/portal` | 4000 | — | — | admin DS only | Romit | Romit | high | Cross-stage |

## Aliases

| Alias | Resolves to | Reason |
|---|---|---|
| `course-eval` | `pce` | Course & Faculty Evaluation is the post-survey workflow inside PCE; not a separate app. When prompts mention "course evaluation," route to PCE rules. |

## Stakeholder formats (referenced from storytelling files)

| Stakeholder | Format preference | Source |
|---|---|---|
| Aarti | 3 sentences max — summary + outcome + what's needed | `apps/exam-management/docs/storytelling/aarti-perspective.md` |
| Vishaka | Milestone progress + blockers, dated | `apps/exam-management/docs/storytelling/vishaka-perspective.md` |
| Himanshu | DS-specific changes only; never edits to submodules | `CLAUDE.md` §11 absolute rules |

## How this registry is used

| Consumer | What it reads |
|---|---|
| SessionStart hook | Product detected from cwd → loads relevant row + the `apps/<id>/CLAUDE.md` |
| UserPromptSubmit hook | Product mentioned in prompt → routes to the right rules / competitor intel |
| `docs/COMPETITOR-INTEL.md` | Anchored sections per `id` (e.g., `#exam-management`) |
| `docs/RESEARCH-SIGNALS.md` | "Products" column references `id` |
| `docs/ANALOGIES.md` | "Products" column references `id` |

## Adding a new product

1. Add a row above (use the schema)
2. Add `apps/<id>/CLAUDE.md` from the template at `CLAUDE.md` §15
3. Add a `#<id>` section to `docs/COMPETITOR-INTEL.md` (stub OK)
4. If the product introduces a new DS, also add a row to `docs/DS-REGISTRY.md` (when that file exists)
5. Update `pnpm-workspace.yaml`, scaffold `package.json`, `next.config.ts`, `app/layout.tsx`

## Maintenance

- This file is loaded on every SessionStart. Keep rows tight.
- When status changes (`scoped` → `active`), update the row + commit alongside the scaffolding work.
- Don't delete aliases — keep the row with `status: alias` so prompt routing still works.
