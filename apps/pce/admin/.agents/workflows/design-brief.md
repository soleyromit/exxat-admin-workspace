---
description: Post a design brief and wait for user go-ahead before any IA/layout implementation.
---

# /design-brief — Senior UX gate

## When to use

User asks to create, rebuild, redesign, replace, or "make a new version of" any page, hub, wizard, dashboard, dialog, sheet, or layout — or attaches a screenshot/mockup.

## Steps

1. Load `.agents/skills/exxat-senior-ux/SKILL.md`.
2. Load `.agents/rules/exxat-ux-discovery-protocol.md`.
3. Output the **design brief** template from the skill (Problem, User, Product/Scope/Persona, Job-to-be-done, Pattern, References, Principles, Deviations, Out of scope, Open questions).
4. **Stop.** Do not edit files in the same turn.
5. Wait for `yes` / `proceed` / `ship it` / `LGTM`.
6. On confirmation, load the surface packet (`/surface-router`) and implement.

## Image uploads

- Extract **IA only** — never pixel-copy (`exxat-no-image-pixel-copy.md`).
- Map to DS reference hubs and primitives.
