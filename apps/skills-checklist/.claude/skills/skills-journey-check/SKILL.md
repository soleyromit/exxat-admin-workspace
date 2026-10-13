---
name: skills-journey-check
description: Check a Skills Checklist design, screenshot, or built screen against the admin / student / evaluator journeys — verifies the why/so-what, moments of truth, failure modes, and journey continuity (what the previous and next screen assume). Use after drafting a contract or screen, and before claiming a flow is done.
---

# Journey check

1. Identify the journey (`docs/journeys/01-admin`, `02-student`, `03-evaluator-and-reviewer`) and stage.
2. For the stage, read the row: goal, REQ IDs, PROTO observation, emotion, moment of truth.
3. Answer in writing:
   - Does the screen answer the **moment-of-truth question** within 2 seconds?
   - What does the user know on arrival (previous stage output) and what must the next stage receive?
   - Which **failure modes** from the journey have a designed response?
   - Is anything the user needs hidden behind a click that REQ says must be visible (e.g. SH-03 failed rule, SH-05 per-setting progress, RP-09 explanation, EV-07 counts-vs-held)?
   - Does it leak data beyond the role (evaluator link, student scope)?
4. Cross-check the "Do-not-assume" list in `docs/strategy/07`.
5. Output a table: stage · pass/fail · evidence (file:line or screen) · fix. Paste literal result; never "looks good".
