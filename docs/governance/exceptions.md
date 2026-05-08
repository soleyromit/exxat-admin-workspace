# Exception Ledger

> Every active override of a workspace rule (DS / A11Y / VIZ / CONTENT / INTAKE) or pattern. Maintained by intake skill (P5 — Designer override loop, INTAKE-004).

**Why this exists:** the harness's scholastic guarantees rely on rules being followed OR overrides being explicitly acknowledged with rationale + sunset. Without this ledger, exceptions accumulate silently and DESIGN.md becomes aspirational rather than enforced.

---

## Active overrides

| ADR | Rule / Pattern | Scope | Rationale | Sunset criterion | Owner |
|---|---|---|---|---|---|

(Empty until first override. New rows inserted by intake skill on `intake:override` action.)

---

## Sunset (resolved)

| ADR | Rule | Closed date | How it was closed |
|---|---|---|---|

(Empty.)

---

## Permanent — pending DESIGN.md amendment

| ADR | Rule | Proposed amendment | Status |
|---|---|---|---|

(Empty.)

---

## How rows appear

When user says (e.g.) "override DS-001 in the assessment-taker — we use a local Button there because the DS doesn't support the lockdown copy/screenshot blocking we need":

1. Intake skill drafts override ADR (template at `docs/decisions/_override-template.md`)
2. Pattern exception appended to relevant pattern (or DESIGN.md §4 entry)
3. Row inserted here:

```
| ADR-NNN | DS-001 | apps/exam-management/assessment-taker/components/Button.tsx | Lockdown copy/screenshot blocking unavailable in DS Button | Until DS ships lockdown variant (Q1 2027) | Romit |
```

## How sunset works

When the sunset criterion is met:

1. Update override ADR status to `Sunset`
2. Move row from `Active` to `Sunset (resolved)` — note the close date and how
3. Verify the affected files now comply (or open a follow-up to fix)

## How permanent overrides escalate

If an override has no real sunset (the rule is wrong for this scope, generally), it becomes a **DESIGN.md amendment proposal**:

1. Update override ADR status to `Permanent-pending-amendment`
2. Move row to `Permanent — pending DESIGN.md amendment`
3. File a follow-up task: amend DESIGN.md §4 to expand or refine the rule

Permanent overrides without an amendment proposal are technical debt — flag them in quarterly governance review.

## Quarterly governance review

Every quarter (or before any major Phase shift):

1. List all `Active` overrides
2. For each: check sunset criterion. If met → close. If not → confirm still relevant.
3. List `Permanent-pending-amendment` and ensure each has an amendment task in flight.
4. Identify rules with 3+ active overrides → these are candidates for amendment.

## Maintenance

- Add rows: intake skill (P5 — `intake:override`)
- Close rows: intake skill or manual via `/intake` slash command
- DESIGN.md amendments: separate ADR + governance review (see L5 governance layer in `/DESIGN.md`)
