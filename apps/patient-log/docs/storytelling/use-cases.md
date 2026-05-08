# Patient Log — Use Cases

⚠️ **Scaffold.** No use cases captured yet.

## When populated

Each use case follows the workspace storytelling template (`docs/storytelling-framework.md` §3):

```yaml
- name: <feature or surface>
  WHAT: <1 sentence — the noun>
  HOW: <2-3 sentences — mechanics>
  WHY: <1-2 sentences — stakeholder reasoning, with citation>
  for_persona: <admin / faculty / student / specific sub-archetype>
  under_conditions:
    - <condition 1>
  supported_elements:
    DS_components: [<list>]
    AI_capabilities: [<list>]
    data_dependencies: [<list>]
    integrations: [<list>]
  source:
    meeting: <granola_id>
    speaker: <name>
    quote: "<verbatim if pivotal>"
```

## What workspace patterns this product likely inherits

(To be confirmed via stakeholder discussion.)

- `docs/patterns/admin/master-list-admin.md` — for any encounter / patient / preceptor master lists
- `docs/patterns/admin/read-only-inherited-filtered-view.md` — accommodations, faculty roster
- `docs/patterns/dashboards/two-question-dashboard.md` — "Am I logging required encounters?" + "Are diagnoses distributed as expected?"
- `docs/patterns/viz/ai-vs-pulled-lane.md` — any AI surfaces

## Don't fabricate

Wait for real stakeholder input. The intake skill will write here on first Patient Log meeting.
