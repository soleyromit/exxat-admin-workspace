# Decision File Template

Every decision file follows this structure. Source quotes are mandatory — summaries without quotes are not accepted.

```markdown
# [Meeting ID] — [Title] — [Date]

**Participants:** [names]
**Product area:** exam-management | pce | portal

---

## User Flows
- **[Actor]** [action] → [outcome]
  > "[exact quote]"

## Design Decisions
- **[decision title]:** [decision]
  > "[exact quote from transcript]"
  > **Why:** [rationale if stated]

## Review & Approval Workflows
- **[trigger]:** [who triggers] → [reviewer] → [gate type: soft/hard] → [outcome]
  > "[exact quote]"

## Section & Collaboration Rules
- [rule]
  > "[quote]"

## Scope Constraints
- **IN (Phase 1):** [feature]
- **DEFERRED:** [feature] — deferred to phase [N]
- **OUT:** [feature explicitly excluded]
  > "[quote confirming scope]"

## Data / Entity Rules
- **[entity]:** [constraint/cardinality/ownership rule]
  > "[quote]"

## Open Questions
- [ ] [question] — owner: [name if stated]

## Implementation Gaps (vs. current code)
- [ ] [what's missing from the codebase based on this transcript]
```
