# Design lab

Real, clickable pages built from `@exxatdesignux/ui`, so variants are design system native by construction.

## Run it

From `apps/skills-checklist/admin` (no Turbopack in the worktree, `node_modules` is a symlink):

```
npx next dev --port 3017
```

- `/lab` is the coverage matrix: every screen per persona, tier, variants, built or planned.
- `/lab/<persona>/<screen>?variant=A|B|C` renders one screen. Default variant is the recommended one.
- Personas: admin, student, evaluator, reviewer, director, lab-instructor. Staff personas use the DS shell with the proposed nav; evaluator and lab instructor get a light header and no sidebar.
- Admin dashboard demo states: `?state=loading|empty|clear`. Scope: `?cohort=&group=&term=&course=`.

## Where things are

| What | Path |
|---|---|
| Screen registry (source of truth, JSON so the gate can read it) | `lib/lab/screens.json`, typed in `lib/lab/screens.ts` |
| Personas and proposed nav | `lib/lab/personas.ts` |
| Skill noun (`skill` / `skills`) | `lib/lab/terms.ts` |
| Scope in the URL | `lib/lab/scope.ts` |
| Dashboard data (pure, from `V2State` and v2 selectors) | `lib/lab/dashboard.ts` |
| Chrome, variant bar, DS used panel, placeholder | `components/lab/*` |
| Built variants | `components/lab/screens/*`, registered in `components/lab/screens/index.ts` |

## Add a variant

1. Build `components/lab/screens/<persona>-<screen>-<id>.tsx` from DS components. Import from `@exxatdesignux/ui/...`; use `PageFrame` for the header.
2. In `lib/lab/screens.json`, set `"file"` on that variant. The question it tests lives on the same entry.
3. Register the component in `components/lab/screens/index.ts` under `"persona/slug/id"`.
4. `node scripts/lab-ds-gate.mjs --write`, then `npx vitest run tests/lab`.

A variant without `file` renders a DS native "Planned" page, so every link works. Adding a screen is one entry in `screens.json` (tiers: 1 = three variants, 2 = two, 3 = one; the test enforces it).

## The gate

`node scripts/lab-ds-gate.mjs` (add `--write` to refresh `lib/lab/ds-used.generated.json`). There is no `lab:gate` npm script because `package.json` was outside this worker's scope; add `"lab:gate": "node scripts/lab-ds-gate.mjs"` if wanted.

For each built variant it follows local `@/components/**` imports three levels deep and compares the DS components used (directly or through a wrapper such as `PageFrame`, `V2Grid`) with `requiredDsComponents`. In the variant and in `components/lab/**` files it imports, it flags raw `<button>` and `<table>`, hex and `rgb()` colours, `uppercase tracking-wide`, `Button` without `variant` and `size`, and the word "items" in strings or JSX text. Exit 1 on any miss or when the generated file is stale. The vendored `components/chart-card` counts as `ChartCard`.

`<DsUsedPanel screenKey="persona/slug/variant"/>` reads the generated file and renders on every lab page.

## Open points

- `strategy/06-dashboard-patterns.md` did not exist when this was built. Dashboard specific logic is marked `TODO(strategy/06)` in `lib/lab/dashboard.ts` (hero thresholds, KPI choice, the cause named in the hero sentence, ranking of "Needs you"). Student row 1 is "Home" until 06 says otherwise.
- Term is display only: the v2 data model has no term filter.
- The DS has no `EmptyState` export; the placeholder composes `Card` and text.
