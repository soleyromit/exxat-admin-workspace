# Claude updates review — 2026-09-16 (ui-hallucination-and-viz-comprehension)

> Source: `docs/governance/claude-updates/pending-review.md` (snapshot `14eceeda4cb6cbf6` to `e2b544b137bbac77`).
> Watcher: `.claude/agents/claude-updates-watcher.md`.
> Context: Romit reported UI hallucination and weak viz/chart comprehension as active pain points.

## Sources reviewed
- Claude Code CHANGELOG -- versions 2.1.260 through 2.1.263
- Agent SDK TypeScript -- versions 0.3.257 through 0.3.263
- Agent SDK Python -- versions 0.2.143 through 0.2.152

## Verdict summary

| Upstream feature | Version | Verdict | Maps to (ours) |
|---|---|---|---|
| /skill-doctor -- shows unused skills and context cost | CC 2.1.261 | ADOPT | .claude/skills/ (55 skills, 9170 lines) |
| bashOutputMaxChars / taskOutputMaxChars up to 128K | CC 2.1.261 | ADOPT | .claude/settings.json (currently unconfigured) |
| exxat-dataviz skill for PCE chart patterns | Architecture gap | ADOPT | Enabled by /skill-doctor visibility |
| --append-subagent-system-prompt-file | CC 2.1.261 | SKIP | .claude/agents/*.md already IS file-based |
| /advisor text form in headless sessions | CC 2.1.260 | SKIP | Not part of our gate protocol |
| /diff panel in fullscreen | CC 2.1.260 | SKIP | Terminal UX feature; no architectural impact |
| Prompt cache miss cause in /cost | CC 2.1.260 | ALREADY-HAVE | Informational; benefit automatic on CC upgrade |
| skillOverrides alias bug fixed | CC 2.1.260 | ALREADY-HAVE | Pre-condition for ADOPT-1; no immediate change needed |
| In-process agent-team skill re-announcement fix | CC 2.1.261 | ALREADY-HAVE | Fixed by upgrading Claude Code |
| SDK TS permissionPrompts: none | SDK TS 0.3.259 | SKIP | Auto-deny breaks our interactive gate workflow |
| SDK TS user_message_uuids + thinking_tokens | SDK TS 0.3.257 | SKIP | SDK consumer API; not our agent configuration |
| SDK Python forward_subagent_text | SDK Py 0.2.140 | SKIP | Python SDK in-process feature; we use CLI |
| SDK Python MCP 2.x in-process support | SDK Py 0.2.140 | SKIP | We use MCP via settings.json, not in-process Python |
| error_max_structured_output_retries detailed errors | SDK TS 0.3.260 | SKIP | We do not use structured output in our agent config |
| Remaining CC 2.1.261-2.1.263 bug fixes | CC 2.1.261 | SKIP | Remote Control/Bedrock/VSCode -- not our toolchain |

---

## ADOPT proposals

### ADOPT-1: Run /skill-doctor and produce a skill-prune plan
- **Upstream evidence**: Claude Code 2.1.261 -- Added /skill-doctor to show which loaded skills go unused and what they cost in context, so you can prune them.
- **Status upstream**: GA (shipped 2.1.261)
- **What it gives us**: We have 55 skills totaling 9,170 lines. Every loaded skill consumes context budget regardless of relevance to the current task. In a PCE design session, skills like graphify (1,144 lines -- knowledge-graph pipeline), intake (206 lines), morning-canvas (203 lines), and research-intake (188 lines) are almost certainly never invoked in design work. These consume context that should hold DS component API signal. The more irrelevant content in context, the more Claude interpolates from training-data patterns rather than grounding on real API -- that IS UI hallucination. The graphify skill alone is 12.5% of the entire skill context budget. Additionally, CC 2.1.261 fixed agent-team teammates re-sending skill announcements on every second agent turn (causing prompt cache misses) -- with 9,170 lines of skills, those misses were expensive. Both problems are acute now.
- **How to wire**:
  1. Romit runs /skill-doctor in a live PCE design session (any session that has completed Gate 1 + Gate 2 work).
  2. Capture the output -- list of unused skills and their token costs.
  3. Write a new doc docs/governance/skill-load-policy.md that defines which skills are active by default for (a) PCE design sessions, (b) code-only sessions, (c) governance/audit sessions. Include a never-load list for non-UI skills in design contexts.
  4. Apply pruning via Claude Code skill enable/disable UX or via skillOverrides deny rules in .claude/settings.json (the alias bug fix in CC 2.1.260 makes this reliable now).
- **Replaces / consolidates with**: Nothing deleted; off-topic skills get demoted to opt-in only. graphify/SKILL.md (1,144 lines) alone is 12.5% of the entire skill context budget.
- **Risk**: Pruned skills referenced by a command cause graceful fallback to baseline behavior. Fully reversible.

---

### ADOPT-2: Add bashOutputMaxChars: 128000 to root .claude/settings.json
- **Upstream evidence**: Claude Code 2.1.261 -- Added bashOutputMaxChars and taskOutputMaxChars settings to raise how much command and background-task output Claude receives inline before it is saved to a file, up to 128K characters.
- **Status upstream**: GA (shipped 2.1.261)
- **What it gives us**: Our primary anti-hallucination tool is node tools/ds/source.mjs <Component>, which reads the live @exxatdesignux/ui package and returns component source + props/variants. If this output exceeds the default inline cap, Claude silently sees only a truncated slice. If it misses a prop, it invents one from pattern memory -- that IS UI hallucination. Setting bashOutputMaxChars: 128000 ensures Claude sees the full component source in-context rather than receiving a file-redirect it may or may not follow. Currently: not configured anywhere in our settings files (confirmed via grep).
- **How to wire**: Add to /Users/romitsoley/Work/.claude/settings.json plus all per-app settings.json files, as peer keys alongside model and env:
  "bashOutputMaxChars": 128000,
  "taskOutputMaxChars": 128000
  Verify schema acceptance via claude doctor after adding.
- **Replaces / consolidates with**: No existing config -- net-new addition. Does not replace any hook.
- **Risk**: Larger inline output consumes more context per turn. Offset: better grounding means fewer hallucinated retries. Net context savings in practice.

---

### ADOPT-3: Create exxat-dataviz skill for PCE chart/viz/trend patterns
- **Upstream evidence**: CC 2.1.261 /skill-doctor makes it practical to add a targeted skill without context-bloat risk (we can now measure and manage). CC 2.1.260 skillOverrides alias fix ensures the skill can be gated reliably. Combined with Romit's explicit pain point, this is an actionable architectural gap.
- **Status upstream**: GA tooling enables it; this is an architecture addition, not a research-preview feature.
- **What it gives us**: We have exxat-chart-leo-spotting (98 lines -- detects Leo AI chart annotations), exxat-kpi (71 lines), exxat-kpi-flat-band (40 lines), exxat-kpi-trends (36 lines). None of these teach Claude how to render a trend line, scatter plot, heatmap, or grouped bar chart using Plot (Observable) or ECharts -- the libraries we use in PCE (memory atom: feedback_stop_recharts_pick_library_first.md). Claude defaults to Recharts patterns from training data when no explicit skill grounds it. A dedicated exxat-dataviz skill would contain: (a) Plot/ECharts API patterns for the 5 chart types in PCE analytics (KPI strip, trend-per-term band, response-rate bar, rating scatter, heatmap toggle), (b) the vendored ChartCard/ChartFigure+leoInsight wrapper contract (memory atom: feedback_use_vendored_chartcard_pce.md), (c) the Recharts hard-negative rule, and (d) RATING_THRESHOLD and data-shape conventions from the Sep15 rebuild.
- **How to wire**:
  1. Create .claude/skills/exxat-dataviz/SKILL.md (Claude can draft from vendored chart sources and memory atoms; Romit reviews before commit).
  2. Reference the skill in apps/pce/CLAUDE.md Gate 1 step 3 alongside ds-adoption-reviewer.
  3. After ADOPT-1, run /skill-doctor to confirm the skill is invoked in viz sessions, not loaded passively unused.
  4. Optionally consolidate exxat-kpi, exxat-kpi-flat-band, exxat-kpi-trends into sections inside exxat-dataviz to reduce skill count by 3 and context footprint by 147 lines.
- **Replaces / consolidates with**: Does not replace exxat-chart-leo-spotting (different purpose: annotation detection vs chart construction). Absorbs exxat-kpi* skills if Romit approves consolidation.
- **Risk**: Low -- additive. Only risk is writing the skill with wrong API patterns; mitigate by grounding content on vendored ChartCard source and localhost:4000 catalog.

---

## ALREADY-HAVE acknowledgments

### Prompt cache miss diagnosis
- **Upstream**: CC 2.1.260 added likely cause for prompt-cache misses to /cost output.
- **Ours**: _telemetry.py at .claude/hooks/_telemetry.py already logs prompt_id (applied in run v2186-2201). The /cost UI enhancement is informational; benefit automatic on CC upgrade.
- **Gap**: None -- automatic on upgrade.

### skillOverrides alias bug fix
- **Upstream**: CC 2.1.260 fixed skillOverrides entries keyed on bundled skill aliases not applying, and Skill(name) deny rules not covering nested skills.
- **Ours**: We do not yet use skillOverrides deny rules in any settings.json (.claude/settings.json has no skillOverrides block). This fix is a pre-condition for ADOPT-1 settings-based pruning approach.
- **Gap**: None architectural now; benefit comes once ADOPT-1 is applied.

### In-process agent-team skill re-announcement fix
- **Upstream**: CC 2.1.261 fixed agent-team teammates re-sending skill announcements on second turn, causing prompt cache misses.
- **Ours**: With 9,170 lines of skills, this cache miss was expensive on every second agent turn. Fixed by upgrading to CC 2.1.261. No config change needed.
- **Gap**: None -- automatic on upgrade.

---

## DEFER list

No items deferred this run.

---

## SKIP list

- --append-subagent-system-prompt-file (CC 2.1.261): Our subagent specs live as .claude/agents/*.md files; the file IS the system prompt already. This CLI arg is for programmatic claude -p invocations with dynamically-assembled prompts.
- /advisor text form (CC 2.1.260): Not part of our design workflow.
- /diff panel in fullscreen (CC 2.1.260): Terminal/IDE UX feature; no architectural relevance.
- permissionPrompts: none (SDK TS 0.3.259): Auto-deny breaks our interactive review gate workflow.
- All remaining SDK TS 0.3.257-0.3.263 items: Stream consumer APIs, UUID correlation, latency breakdowns -- not relevant to CLI-based agent configuration.
- SDK Python 0.2.140 forward_subagent_text and MCP 2.x in-process: Python SDK features; we use the CLI.
- All CC 2.1.261-2.1.263 bug fixes not mentioned above: Remote Control, Bedrock, Vertex AI, VSCode panel, Windows, TLS-proxy, iTerm2 progress -- none in our toolchain.

---

## What I (watcher) did NOT propose

- I considered flagging bashOutputMaxChars as ALREADY-HAVE. It is not configured anywhere in our settings files -- it is a net-new adoption.
- I considered a 4th ADOPT for splitting the exxat-kpi-* skills immediately as a standalone proposal. Consolidated into ADOPT-3 as the natural home.
- I considered ADOPT-ing --append-subagent-system-prompt-file to enable larger ds-conformance-reviewer prompts. Rejected: our .claude/agents/*.md approach already achieves file-based loading natively.
- I saw ~30 bug-fix lines in CC 2.1.261 across Remote Control, Bedrock, VSCode -- all SKIPPED, no architectural relevance to our stack.

---

## Open questions for Romit

1. After running /skill-doctor, prefer to prune via settings.json skillOverrides deny rules (permanent, applies across sessions) or via manual session-level disable (lower friction for multi-context work)?
2. Should exxat-dataviz consolidate the three exxat-kpi-* skills immediately (clean) or keep them separate and reference from the new skill (lower disruption)?
3. Any plan to adopt Claude Fable models? CC 2.1.260 has Fable 5.1 fixes. If yes, the model allow-list needs Agent(model:claude-fable-5*) added to .claude/settings.json. Not proposing without signal.

---

## Self-retiring queue

No proposals have been REJECTED 3+ times in past runs. Queue is empty.
