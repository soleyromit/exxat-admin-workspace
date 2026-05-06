# PCE Prototype

Standalone HTML prototype for the PCE (Post Course Evaluation) product, hosted as a static site.

## What's here

| File | Purpose |
|---|---|
| `index.html` | Landing page with links to the artifacts below |
| `pce-evaluation.html` | **Canonical product prototype.** Build engineering work from this. End-to-end across 8 personas. |
| `HANDOFF.md` | Engineering handoff document: personas, FR-by-FR coverage, data model, state machines, API surface, integrations, design token mapping, open product questions |
| `_reference/pce-autopilot.html` | Earlier exploratory prototype (autopilot model). Reference only. |
| `_reference/pce-interactive.html` | Earlier exploratory prototype (manual-flow model). Reference only. |
| `vercel.json` | Static deployment config with security headers |

## Local preview

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

The repo is wired to Vercel. Pushes to `main` deploy to production; branches get preview URLs.

## What this is not

- Not the production app. The production app lives in `apps/pce/admin/` (Next.js + `@exxat/ds`). Engineering should build the real app from `HANDOFF.md` plus this prototype as visual reference.
- Not a design source of truth indefinitely. Once the production app catches up, this folder can be archived.
