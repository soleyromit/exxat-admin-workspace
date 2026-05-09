# Context Architecture — Beyond Contextual Retrieval

> Question: how do we build the best Claude architecture for the Exxat workspace to reduce hallucination, given rr-insights + Granola transcripts + insights-hub files + ongoing product/persona/design-system context?
>
> This doc is the workspace's honest answer. It combines what we already have, what contextual retrieval (Anthropic, Sept 2024) actually solves, and what's available beyond it.

**Author:** Romit (with Claude support)
**Created:** 2026-05-09
**Status:** Living doc — update as techniques evolve

---

## 1. Honest framing

Contextual retrieval is one technique. It's a good one for **some** of the corpora in your workflow, but **not the whole answer**. Before building any retrieval infrastructure, the design intelligence harness already encodes a different model — file-system-native + read-on-demand — that's actually more accurate for workspace artifacts than RAG-style retrieval would be.

The right question isn't "should we do contextual retrieval?" It's: **for each corpus, what's the right access pattern?**

### What contextual retrieval actually solves

From the Anthropic article (Sept 2024):
- Standard RAG chunks documents and embeds chunks
- Chunks lose surrounding context ("Q3 revenue grew 5%" — Q3 of what year? which company?)
- Contextual retrieval: prepend a 50–100 token context summary to each chunk before embedding
- Uses Claude to generate per-chunk context from the whole doc
- Combines: contextual embeddings + contextual BM25 + reranking
- Result: **49% retrieval-failure reduction** (67% with reranker)

**Where it helps in your stack:** long-form raw content where coherent chunks would otherwise lose surrounding context. Granola transcripts (~125K chars each) are exactly this case.

**Where it's overkill in your stack:** workspace markdown files. DESIGN.md, ADRs, storytelling files, patterns are short enough that Claude reads them whole. Chunking them ADDS hallucination risk because chunks lose document structure that the markdown headers preserve.

---

## 2. The corpora and their right access patterns

| Corpus | Size | Coherence per chunk | Access pattern today | Right pattern |
|---|---|---|---|---|
| **Workspace `/DESIGN.md`** | ~10K chars | High (one document) | Direct file read by Claude | ✅ Keep — read whole |
| **Workspace patterns/** | ~3K chars each, 26 files | High (each pattern is coherent) | Direct file read on reference | ✅ Keep — read on demand |
| **Workspace storytelling/** | 3-12K chars each, 30+ files | High | Direct file read | ✅ Keep — index for fast lookup |
| **Workspace ADRs** | ~1K chars each, 9 files | High | Direct read | ✅ Keep |
| **Granola transcripts** | 50–125K chars each | Low chunked (multi-topic) | MCP `query_granola_meetings` (already CR-style — returns citations with context) | ✅ Already correct |
| **rr-insights (research repo)** | Unknown — many cards/quotes/themes | Variable | None (not yet integrated) | **Contextual retrieval fits well** |
| **Insights hub files** (PDFs, screenshots, design refs) | Variable | Variable | Manual upload to chat | **Anthropic Projects** (auto-surfaced in conversation) + selective indexing |
| **Magic Patterns prototypes** | HTML/JS, 50–500 KB | Low chunked | MCP `read_artifact_files` | ✅ Already correct |
| **Figma designs** | Visual + metadata | Variable | MCP `get_design_context` | ✅ Already correct |
| **Customer interview recordings** | Audio | Low | None | Transcribe → Granola pipeline |

The pattern: **direct file read for coherent docs; MCP-mediated retrieval for long-form raw content; contextual retrieval specifically for chunked search across long unstructured corpora.**

---

## 3. The three-ring model of your context

```
                       ┌─────────────────────────────────┐
                       │   Ring 3 — Distillation         │
                       │   intake skills write Ring 2 → 1│
                       │   - Granola transcript intake   │
                       │   - rr-insights intake (TODO)   │
                       │   - hub-file intake (TODO)      │
                       └────────────┬────────────────────┘
                                    │ writes to
                                    ▼
        ┌────────────────────────────────────────────────────┐
        │   Ring 1 — Workspace (file-system native)          │
        │   /DESIGN.md, patterns/, storytelling/, decisions/ │
        │   Read on demand by Claude. No retrieval needed.   │
        │   Auto-loaded by SessionStart + UserPromptSubmit.  │
        └────────────────────────────────────────────────────┘
                                    ▲
                                    │ distilled from
                                    │
        ┌────────────────────────────────────────────────────┐
        │   Ring 2 — External corpora (MCP-mediated)         │
        │   ✅ Granola · ✅ Magic Patterns · ✅ Figma · ✅ Drive │
        │   ✅ Notion · ✅ Microsoft 365 · ✅ Mobbin            │
        │   ⏳ rr-insights · ⏳ Insights hub                   │
        │   On-demand retrieval; never auto-loaded full       │
        └────────────────────────────────────────────────────┘
```

### Why this works

- **Ring 1 is canonical.** Decisions live in markdown, signed by the workspace's spec layer. No retrieval needed.
- **Ring 2 is the firehose.** Don't try to load it all. Query on demand. Each MCP handles its own indexing.
- **Ring 3 is the bridge.** When something in Ring 2 matters, distill it into Ring 1. Permanent, queryable, auditable.

This is what the design intelligence harness already implements (P2 living context + L7 storytelling + intake skill for Granola). The question is whether to extend Ring 3 for rr-insights and hub files.

---

## 4. What's actually missing (concrete gaps)

### Gap A — rr-insights isn't integrated

**Problem:** Research repo lives outside the workspace. Claude can't see insight cards, themes, or quotes when designing.

**Options:**

1. **Build an rr-insights MCP** — exposes search + fetch tools. Best long-term answer. Requires owning the integration; depends on rr-insights' API.
2. **Periodic export to workspace** — scheduled script dumps insights as markdown to `apps/<product>/docs/research/insights/`. Simple but stale by definition.
3. **Manual paste + intake skill** — user pastes an insight into chat, intake skill distills it. Works today; manual.

**Recommended:** combination — option 3 today, option 1 as MCP infrastructure matures. If rr-insights has an API, option 1 is a Phase-2 priority.

### Gap B — Insights hub files aren't searchable

**Problem:** Files attached to your Anthropic Project (PDFs, design screenshots, customer artifacts) are visible in conversation but not indexed for cross-session retrieval.

**Options:**

1. **Anthropic Projects native** — Claude already surfaces these contextually within a project. Limited to that project's session.
2. **Mirror to workspace** — sync important hub files to `apps/<product>/docs/research/hub-files/` so they're git-tracked.
3. **Drive MCP** — if files live in Google Drive, the existing `claude_ai_Google_Drive` MCP can search them on demand.

**Recommended:** option 2 for files you reference repeatedly (paid for once, indexed forever). Option 1 + 3 for one-off references.

### Gap C — No cross-corpus query

**Problem:** "What did Aarti say across Granola + rr-insights + the May 8 audit?" requires walking each corpus separately.

**Options:**

1. **Subagent specialization** — already in use today. A "research subagent" can be given access to all 3 MCPs and cross-correlate.
2. **Living digest** — periodic script aggregates insights across corpora into one indexed JSON.
3. **Knowledge graph** — overkill for this workflow at current scale.

**Recommended:** option 1 (already shipping). Option 2 if scale demands it (>100 storytelling files).

### Gap D — Lifecycle drift

**Problem:** As the workspace grows, files get stale, decisions supersede each other, memories drift from reality.

**Telemetry-driven solutions** (already in P6):
- Quarterly governance review surfaces stale overrides
- Memory-staleness banner ("This memory is 2 days old…") nudges recheck
- Override sunset criteria force review

**What's missing:**
- No automated detection of "this storytelling file hasn't been touched in 90 days"
- No "this ADR was superseded but its content references aren't updated"
- No "this pattern's referenced DS components don't exist anymore"

**Recommended:** add a `scripts/staleness-check.py` that runs against snapshot + filesystem to flag drift.

---

## 5. Newer-than-contextual-retrieval techniques

The article is from Sept 2024. Since then:

| Technique | What it adds | Fit for this workspace |
|---|---|---|
| **Anthropic Memory tool** (2025) | Persistent memory across sessions — auto-recalled facts | ✅ Already using via `~/.claude/projects/.../memory/` directory; could expand |
| **Skill auto-discovery** (Claude Code 2.1+) | Skills auto-load based on conversation context | ✅ Already configured; tune trigger patterns over time |
| **Subagent specialization** | Per-task specialized agents with their own context | ✅ Heavy use today (audit subagents, Plan agent, Explore agent) |
| **Cache-aware prompting** | Prompt caching makes repeated context cheap | ✅ Active for SessionStart + workspace files |
| **MCP composition** | Chain multiple MCPs in one query | Can do today via subagents; explicit composition is a future framework |
| **Tool result extraction** | Long tool results saved to file, read in chunks | ✅ Already firing — Granola transcripts auto-save when too large |
| **Living context cards** | Auto-generated one-page summaries with backlinks | Workspace already has this for products via storytelling files; could extend to per-decision and per-persona cards |

Note that several of these are **already in use** in this workspace — the harness was designed with these patterns in mind even without explicitly naming them.

---

## 6. The right roadmap (priorities)

If your goal is "minimize hallucination across all the contexts I work in," the priorities ranked by ROI:

### Tier 1 — Highest leverage (do these)

1. ✅ **rr-insights intake skill** — `.claude/skills/research-intake/SKILL.md` (shipped 2026-05-09). Mirrors the Granola intake skill. Triggers on `from rr-insights:` / `insight:` / `theme:` / `[Pn]` participant tags.
2. ✅ **Hub-file mirror** — `apps/{exam-management,pce}/docs/research/hub-files/` with `README.md` + `INDEX.md` (shipped 2026-05-09). Workflow: download from Anthropic Project → save with naming convention → add row to INDEX → commit. Reference in citing artifact as a relative path.
3. ✅ **Backlink graph in storytelling files** — `scripts/backlink-audit.py` (shipped 2026-05-09). Run `python3 scripts/backlink-audit.py` from repo root. Checks ADRs (frontmatter `source:` + meeting/insight refs), perspective files (dated content + ADR/UC backrefs), and patterns (`Pattern ID:` + `Binds rules:`). Use `--strict` in CI for fail-on-gap; `--json` for tooling integration.

### Tier 2 — Medium leverage

4. **Staleness check script** — `scripts/staleness-check.py` flags files untouched > 90 days, ADRs with superseded refs, patterns with broken DS imports.
5. **Living digest** — `scripts/generate-digest.py` produces `docs/digest/<date>.md` with all-decisions / all-personas / all-glossary in one file. Loaded as additional SessionStart context.
6. **Cross-corpus research subagent** — explicit subagent type with all relevant MCPs preloaded. Spawns when user asks "what does the research say about X."

### Tier 3 — Future / scale

7. **rr-insights MCP** — if there's an API. Owns search/fetch on the research repo.
8. **Contextual retrieval over Granola archive** — when transcripts grow beyond what `query_granola_meetings` handles natively.
9. **Automated DESIGN.md amendments** — when 3+ overrides exist for a rule, auto-draft an amendment ADR for review.

### Don't do

- ❌ Don't build a workspace-wide vector index. Files are too coherent; chunking would hurt accuracy.
- ❌ Don't replicate Granola's contextual retrieval — their MCP already does it.
- ❌ Don't build "knowledge graph" infrastructure. ADRs + storytelling + memory backlinks already form a graph; just keep them tight.

---

## 7. How to keep this current

This doc is itself a Ring 1 artifact. Update it when:

- A new corpus joins your workflow (new MCP, new research repo, new design tool)
- A new Anthropic technique ships that's relevant
- A pattern in §6 graduates from "should do" to "did" — move to ✅
- The roadmap priorities shift based on actual usage telemetry (P6 analyzer)

When updating: cite the source (article URL, MCP doc, Anthropic blog) and date the change.

---

## 8. References

- Anthropic, "Introducing Contextual Retrieval" (Sept 2024) — the article that prompted this doc
- Workspace `/DESIGN.md` — the canonical scholastic spec
- Workspace `docs/storytelling-framework.md` — L7 layer codifying Ring 3 distillation
- Workspace `.claude/skills/intake/SKILL.md` — the existing Granola intake skill (template for rr-insights skill)
- Workspace `docs/telemetry/README.md` — P6 telemetry that surfaces lifecycle drift
- Workspace `docs/governance/exceptions.md` — override ledger, the lifecycle artifact

---

## TL;DR

**Reduce hallucination by:**

1. **Trusting Ring 1 (workspace files).** Read on demand. Chunking + embedding workspace files would HURT accuracy.
2. **Using MCPs for Ring 2 (raw corpora).** Granola already does contextual retrieval natively. Add MCPs for rr-insights when feasible.
3. **Distilling Ring 2 → Ring 1 (intake skills).** Build an rr-insights intake skill mirroring the Granola one.
4. **Letting telemetry surface lifecycle drift.** Quarterly governance review + staleness check script.
5. **Spawning specialized subagents for cross-corpus questions.** Already shipping; tune over time.

Contextual retrieval is one tool in a larger toolkit. The harness you already have implements most of the larger toolkit. The gaps are concrete and addressable — see §6 priorities.
