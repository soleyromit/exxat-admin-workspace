# BOOTSTRAP v4 — Archive

> **Status:** Archived 2026-05-09. Source-of-record only — do not implement verbatim.
>
> **Why archived:** This bootstrap was authored before the Design Intelligence Harness was built. ~50% of its proposals already existed in different form; some proposed events (`PostCompact`, `FileChanged`) aren't real Claude Code events and were re-implemented using documented mechanisms (SessionStart matcher=compact, mtime-tracking inside UserPromptSubmit). Bash hooks were rejected in favor of the existing Python hooks (richer telemetry, structured `additionalContext`).
>
> **What was adopted:** B1-B6 + B8 of the May 9 plan — `PRODUCTS.md`, `ANALOGIES.md`, `RESEARCH-SIGNALS.md`, `COMPETITOR-INTEL.md`, compact-recovery, registry-freshness, `SUBAGENTS.md`.
>
> **What was rejected (with reasoning):**
> - **Bash hooks** — strict downgrade vs Python hooks. Python integrates with `_telemetry.py`, can do real DS-conformance regex, returns structured `additionalContext`.
> - **80-line CLAUDE.md** — DS reference is load-bearing for hallucination prevention. The right refactor is slim + lazy-load (B7), measured before committing.
> - **Stop hook anti-pattern check** — PreToolUse already prevents the same patterns at write-time, which is strictly better.
> - **"10 persona dimensions" framework** — underspecified; storytelling perspectives already capture this richer.
> - **"Aug 2026 Cohere" deadline** — real Aarti deadline, but workspace-irrelevant.
> - **Weekly Friday hook** — premature automation; not a current pain.
> - **`mobbin-mcp` via npx** — already wired via Claude plugins.
>
> **Plan executed:** see commits `6fdcb21` through `08e1554` on main (May 9 2026).
>
> ---
>
> Original BOOTSTRAP.md content follows below for source-of-record:
>

# Exxat Admin Workspace — Claude Code Bootstrap v4
# Zero-command architecture. You type what you want. Hooks and rules do the rest.
# Paste from inside exxat-admin-workspace. Claude audits then implements everything.

---

## THE DESIGN GOAL

Romit types naturally: "design the question navigator for students"
Claude already knows: which product, which persona, which DS, which competitors,
which signals are active, which analogies apply, what the gates are, what the
design standard is, and what the latest practice recommendations say.
No slash commands. No priming. No re-explaining context.

The mechanism: hooks intercept every prompt before Claude sees it and prepend
the right context automatically. Rules load when files are opened. Auto-memory
learns from corrections. Intelligence surfaces proactively as [REC] labels.

---

## PHASE 1 — AUDIT

Read full directory tree. For every file in Phase 2:
  EXISTS and matches spec → "correct", leave it
  EXISTS but incomplete   → "needs update", list gaps
  MISSING                 → "create"
Report only. No writes during Phase 1.

---

## PHASE 2 — IMPLEMENT

---

### FILE 1 — CLAUDE.md (repo root, target under 80 lines)
# This file loads every session every message. It must be a trigger table only.
# No verbose explanations. No examples. Pointers only.
# All intelligence lives in hooks, rules, and commands — not here.

```
# Exxat Admin Workspace — Romit Soley, Product Designer II
# Zero-command architecture. Hooks prime context. Rules load on file open.
# Do not add detail here. Add it to the right layer below.

## REPO
exxat-ds/          → @exxat/ds admin DS. READ ONLY. Himanshu owns.
student-ux/        → @exxat/student student DS. READ ONLY. Himanshu owns.
tokens/tokens.json → Romit's mirror. Propose here. Himanshu merges.
docs/              → platform registries. Read via hooks, not manually.
.claude/rules/     → loads automatically on file open. Never manually.
.claude/commands/  → available if needed. Not required.
.claude/hooks/     → primes all context before Claude sees any prompt.

## HOW CONTEXT LOADS (automatic — no commands needed)
Session opens       → session-start hook fires → reads all registries → injects context
You type anything   → prompt hook fires → detects product + intent → injects rules
You open a file     → matching rules file loads → product intelligence in context
Friday arrives      → weekly hook fires → Granola sync + email draft prepared
Claude proposes UI  → post-response hook checks → flags if anti-pattern detected

## GROWTH (CLAUDE.md never changes for growth)
New product     → docs/PRODUCTS.md row + .claude/rules/{id}.md + COMPETITOR-INTEL.md#{id}
New DS          → docs/DS-REGISTRY.md row. Gate 2 extends automatically.
New analogy     → hook detects gap → fetches Mobbin → Romit approves → ANALOGIES.md updated
New signal      → hook detects 3+ products → proposes → Romit approves → SIGNALS.md updated

## HARD RULES (enforced by hooks, not by reminders)
Never edit DS repos directly.
Never invent token names. TOKEN UNCONFIRMED if not in tokens/tokens.json.
Never produce Figma-template output. Post-response hook flags violations.
Never say done without gate results.
Never solve for one product when change affects platform.
Every decision → run 10 persona dimensions first (loaded by session hook).
Every feature → check ANALOGIES.md first (loaded by prompt hook).
Every claim → cite source or [INFERENCE].

## COMPACT
After /compact: hook re-fires → context restored automatically.
Custom: focus on design decisions, gate results, open questions, analogy IDs.
```

---

### FILE 2 — .claude/hooks/session-start.sh (executable)
# Fires once when session opens. Reads all registries. Injects full platform context.
# This replaces /session-start as a command. Romit types nothing.

```bash
#!/bin/bash
# SessionStart hook — fires automatically on every session open
# Reads all platform registries and outputs structured context to Claude

DOCS="docs"

# Read registry files
PRODUCTS=$(cat "$DOCS/PRODUCTS.md" 2>/dev/null || echo "PRODUCTS.md not found")
DS_REG=$(cat "$DOCS/DS-REGISTRY.md" 2>/dev/null || echo "DS-REGISTRY.md not found")
SIGNALS=$(cat "$DOCS/RESEARCH-SIGNALS.md" 2>/dev/null || echo "RESEARCH-SIGNALS.md not found")
ANALOGIES=$(cat "$DOCS/ANALOGIES.md" 2>/dev/null || echo "ANALOGIES.md not found")
PERSONAS=$(cat "$DOCS/PERSONAS.md" 2>/dev/null || echo "PERSONAS.md not found — populate from rr-insights SKILL.md Section 2")
TOKENS_SAMPLE=$(head -30 tokens/tokens.json 2>/dev/null || echo "tokens/tokens.json not found")

echo "=== EXXAT PLATFORM CONTEXT (auto-loaded) ==="
echo ""
echo "--- PRODUCTS ---"
echo "$PRODUCTS"
echo ""
echo "--- DESIGN SYSTEM REGISTRY ---"
echo "$DS_REG"
echo ""
echo "--- ACTIVE CROSS-PRODUCT SIGNALS ---"
echo "$SIGNALS"
echo ""
echo "--- PRODUCT ANALOGIES REGISTRY ---"
echo "$ANALOGIES"
echo ""
echo "--- PERSONA REGISTRY ---"
echo "$PERSONAS"
echo ""
echo "--- TOKEN CONVENTIONS (first 30 lines) ---"
echo "$TOKENS_SAMPLE"
echo ""
echo "=== GATES ACTIVE ==="
echo "Gate 1 EVIDENCE: cite file or Granola session. Uncited → [INFERENCE]"
echo "Gate 2 DS PARITY: read DS-REGISTRY.md for active product DS. TOKEN UNCONFIRMED if uncertain."
echo "Gate 3 COMPETITOR: read COMPETITOR-INTEL.md#{product} for active product."
echo "Gate 4 DEADLINE: Aug 2026 Cohere default. Beyond → [POST-COHERE SCOPE]"
echo "Format: Gates: [1 pass/flag] [2 pass/flag] [3 pass/flag] [4 pass/flag]"
echo ""
echo "=== DESIGN STANDARD ==="
echo "Reference: Linear, Superhuman, Vercel dashboard, Raycast."
echo "Never: gradient fills, inset shadows, colorful nav rails, stat dashboards by default,"
echo "pill buttons everywhere, tooltips with core info, bold headers in forms,"
echo "2+ font sizes per component, modals for inline actions, charts that don't earn their place."
echo "Motion: purposeful state feedback only. No entrance animations."
echo "Typography: DM Serif Display/Playfair for headings. JetBrains Mono/IBM Plex for data."
echo ""
echo "=== NORTH STAR ==="
echo "1. Who are the users? 2. What do they need? 3. What is their current experience?"
echo "Finish line: whose lives are we making better — not what feature we shipped."
echo ""
echo "=== READY ==="
exit 0
```

---

### FILE 3 — .claude/hooks/prompt-context.sh (executable)
# Fires on UserPromptSubmit — before Claude sees the prompt.
# Reads the prompt text from stdin, detects product and intent, injects relevant rules.
# This is the core zero-command mechanism. Romit types naturally. Hook does the work.

```bash
#!/bin/bash
# UserPromptSubmit hook — fires before Claude processes each prompt
# Detects product and design intent from the prompt. Injects targeted context.

# Read the hook JSON input from stdin
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('prompt',''))" 2>/dev/null || echo "")
PROMPT_LOWER=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

# Product detection from prompt keywords and open files
detect_product() {
  if echo "$PROMPT_LOWER" | grep -qE "exam|question|assessment|lockdown|navigator|item|quiz|accommodation"; then
    echo "exam-management"
  elif echo "$PROMPT_LOWER" | grep -qE "faas|form|workflow|governance|survey|submission|reviewer"; then
    echo "faas"
  elif echo "$PROMPT_LOWER" | grep -qE "skills|competency|procedure|checklist|rotation|placement"; then
    echo "skills-checklist"
  elif echo "$PROMPT_LOWER" | grep -qE "learning.contract|contract|preceptor|site.coord"; then
    echo "learning-contracts"
  elif echo "$PROMPT_LOWER" | grep -qE "course.eval|faculty.eval|course evaluation|evaluation"; then
    echo "course-eval"
  elif echo "$PROMPT_LOWER" | grep -qE "pce|clinical.eval|performance"; then
    echo "pce"
  else
    echo "unknown"
  fi
}

# Intent detection
detect_intent() {
  if echo "$PROMPT_LOWER" | grep -qE "design|build|create|component|screen|flow|pattern|interaction|ux|ui|layout"; then
    echo "design"
  elif echo "$PROMPT_LOWER" | grep -qE "handoff|spec|token|variant|state|keyboard|aria|wcag|accessibility"; then
    echo "handoff"
  elif echo "$PROMPT_LOWER" | grep -qE "research|insight|granola|signal|persona|user|feedback|interview"; then
    echo "research"
  elif echo "$PROMPT_LOWER" | grep -qE "competitor|examsoft|surveymonkey|meditrek|d2l|blackboard|parity"; then
    echo "competitor"
  elif echo "$PROMPT_LOWER" | grep -qE "friday|email|aarti|weekly|status|update"; then
    echo "friday-email"
  elif echo "$PROMPT_LOWER" | grep -qE "analogy|reference|mobbin|inspiration|pattern|how does|example"; then
    echo "analogy"
  else
    echo "general"
  fi
}

PRODUCT=$(detect_product)
INTENT=$(detect_intent)

echo "=== AUTO-CONTEXT (prompt hook) ==="
echo "Detected product: $PRODUCT | Detected intent: $INTENT"
echo ""

# Load product-specific rules file content
if [ "$PRODUCT" != "unknown" ] && [ -f ".claude/rules/$PRODUCT.md" ]; then
  echo "--- PRODUCT RULES: $PRODUCT ---"
  cat ".claude/rules/$PRODUCT.md"
  echo ""
fi

# Load competitor intel for this product
if [ "$PRODUCT" != "unknown" ] && [ -f "docs/COMPETITOR-INTEL.md" ]; then
  echo "--- COMPETITOR INTEL: $PRODUCT ---"
  # Extract section for this product using anchor
  python3 -c "
import sys
content = open('docs/COMPETITOR-INTEL.md').read()
anchor = '#$PRODUCT'.replace('-', '-')
parts = content.split('#### #')
for part in parts:
  if part.startswith('$PRODUCT'.replace('exam-management','exam').replace('skills-checklist','skills').replace('learning-contracts','learning').replace('course-eval','course')):
    print(part[:2000])
    break
" 2>/dev/null || echo "(competitor intel not yet populated for $PRODUCT)"
  echo ""
fi

# Load analogies relevant to intent/product
if [ -f "docs/ANALOGIES.md" ]; then
  echo "--- RELEVANT ANALOGIES ---"
  # Show analogies matching this product
  grep -i "$PRODUCT\|platform" docs/ANALOGIES.md 2>/dev/null | head -20 || echo "(no analogies found for $PRODUCT)"
  echo ""
fi

# Intent-specific injections
if [ "$INTENT" = "design" ]; then
  echo "--- DESIGN TASK ACTIVATED ---"
  echo "Before proposing any pattern: check ANALOGIES.md above for domain match."
  echo "If no analogy exists for this feature domain: flag 'needs Mobbin reference' and fetch one."
  echo "Run all 10 persona dimensions before output:"
  echo "FRICTION / MENTAL MODEL / ACCESS NEEDS / FREQUENCY / VOCABULARY /"
  echo "EMOTIONAL STATE / WORKFLOW POSITION / PLATFORM LITERACY /"
  echo "CROSS-PRODUCT EXPOSURE / ACCREDITATION STAKES"
  echo "Surface [PERSONA CONFLICT] where dimensions conflict across personas."
  echo "Check cross-product applicability: does this pattern apply to other products?"
  echo "Apply 10 POV lenses. Label each lens used."
  echo ""
elif [ "$INTENT" = "handoff" ]; then
  echo "--- HANDOFF TASK ACTIVATED ---"
  echo "Read DS-REGISTRY.md. Confirm DS for $PRODUCT. Check tokens/tokens.json."
  echo "Required: tokens (confirmed), all states, keyboard nav, screen reader, WCAG by number."
  echo ""
elif [ "$INTENT" = "analogy" ]; then
  echo "--- ANALOGY FETCH ACTIVATED ---"
  echo "Check ANALOGIES.md first (shown above). If no match: fetch from Mobbin MCP."
  echo "Determine scope: product-specific or platform-wide. Check all products."
  echo "Propose registry entry. Wait for Romit approval before writing."
  echo ""
elif [ "$INTENT" = "friday-email" ]; then
  echo "--- FRIDAY EMAIL ACTIVATED ---"
  echo "Pull this week's Granola sessions via Granola MCP."
  echo "Group by product. Embed Granola links. Add [Screenshot: Product — Flow] placeholders."
  echo "Aarti format: 3 sentences (summary + outcome + what needed). Then product detail."
  echo "Do not send. Romit adds screenshots and sends via Outlook."
  echo ""
elif [ "$INTENT" = "research" ]; then
  echo "--- RESEARCH TASK ACTIVATED ---"
  echo "Evidence must cite Granola session by name or flag [INFERENCE]."
  echo "Check RESEARCH-SIGNALS.md above for relevant active signals."
  echo "Cross-product check: does this finding appear in other products?"
  echo ""
fi

echo "=== END AUTO-CONTEXT ==="
exit 0
```

---

### FILE 4 — .claude/hooks/post-response-check.sh (executable)
# Fires on Stop — after Claude finishes responding.
# Checks for design anti-patterns. Flags violations automatically.
# This enforces the design standard without Romit having to remember to check.

```bash
#!/bin/bash
# Stop hook — fires after Claude finishes responding
# Reads last response for design anti-patterns. Outputs warnings if found.

INPUT=$(cat)
RESPONSE=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
# Extract assistant message text if available
print(d.get('response', d.get('text', '')))
" 2>/dev/null || echo "")

RESPONSE_LOWER=$(echo "$RESPONSE" | tr '[:upper:]' '[:lower:]')

VIOLATIONS=()

# Check for design anti-patterns in the response
if echo "$RESPONSE_LOWER" | grep -qE "progress bar|progress-bar" && echo "$RESPONSE_LOWER" | grep -qE "header|divider|section"; then
  VIOLATIONS+=("Progress bar used as header or divider — use typography hierarchy instead")
fi
if echo "$RESPONSE_LOWER" | grep -qE "gradient" && echo "$RESPONSE_LOWER" | grep -qE "background|fill|card|button"; then
  VIOLATIONS+=("Gradient fill detected — use flat surfaces and semantic color only")
fi
if echo "$RESPONSE_LOWER" | grep -qE "inset.shadow|box-shadow.*inset|shadow.*card"; then
  VIOLATIONS+=("Inset shadow on card — use border or background distinction instead")
fi
if echo "$RESPONSE_LOWER" | grep -qE "pill.button|rounded.button|border-radius.*9999|border-radius.*50" && echo "$RESPONSE_LOWER" | grep -qE "every|all|each|primary.*secondary|multiple"; then
  VIOLATIONS+=("Pill buttons on multiple elements — reserve pill shape for primary CTA only")
fi
if echo "$RESPONSE_LOWER" | grep -qE "tooltip" && echo "$RESPONSE_LOWER" | grep -qE "important|required|necessary|must|need"; then
  VIOLATIONS+=("Tooltip carrying core information — redesign so content is always visible")
fi
if echo "$RESPONSE_LOWER" | grep -qE "modal|dialog" && echo "$RESPONSE_LOWER" | grep -qE "confirm|delete|remove|are you sure"; then
  VIOLATIONS+=("Modal for confirmation — use inline confirmation instead")
fi
if echo "$RESPONSE_LOWER" | grep -qE "entrance animation|animate.*in|fade.in|slide.in|appear"; then
  VIOLATIONS+=("Entrance animation detected — motion must be purposeful state feedback only")
fi

# Check for missing gate results
if ! echo "$RESPONSE_LOWER" | grep -qE "gates:|gate 1|gate 2|gate 3|gate 4"; then
  VIOLATIONS+=("Gate results missing — end every substantive output with gate status")
fi

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo ""
  echo "=== DESIGN STANDARD FLAGS ==="
  for v in "${VIOLATIONS[@]}"; do
    echo "[FLAG] $v"
  done
  echo "Review the flagged items above before finalising this output."
  echo "==========================="
fi

exit 0
```

---

### FILE 5 — .claude/hooks/file-change-intel.sh (executable)
# Fires on FileChanged for ANALOGIES.md, RESEARCH-SIGNALS.md, PRODUCTS.md.
# When these files are updated, automatically notifies Claude of the change
# so it can incorporate new intelligence without a new session.

```bash
#!/bin/bash
# FileChanged hook — fires when watched registry files change on disk
# Injects updated content into context automatically

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('file', ''))
" 2>/dev/null || echo "")

if [ -z "$FILE" ]; then exit 0; fi

echo "=== REGISTRY UPDATE DETECTED ==="
echo "File changed: $FILE"
echo ""
echo "Updated content:"
cat "$FILE" 2>/dev/null
echo ""
echo "Incorporate this updated registry into your context immediately."
echo "Check if this change affects the active design task."
echo "==========================="

exit 0
```

---

### FILE 6 — .claude/hooks/weekly-sync.sh (executable)
# Fires on a schedule (Friday) if using Claude Code Routines or Desktop scheduled tasks.
# Automatically triggers Granola sync and email draft preparation.
# Romit opens Claude Code on Friday and the work is already staged.

```bash
#!/bin/bash
# Weekly sync hook — triggers Friday workflow automatically
# Works with Claude Code Routines or Desktop scheduled tasks

DAY=$(date +%u)  # 1=Mon, 5=Fri

if [ "$DAY" = "5" ]; then
  echo "=== FRIDAY WORKFLOW AUTO-TRIGGERED ==="
  echo "Today is Friday. The following should happen automatically:"
  echo ""
  echo "1. Fetch new Granola sessions since last sync via Granola MCP"
  echo "2. Group by product (docs/PRODUCTS.md IDs)"
  echo "3. Extract insights using tagging schema:"
  echo "   product / persona / signal type / evidence confidence / severity"
  echo "4. Check against docs/RESEARCH-SIGNALS.md — reinforce, contradict, or new signal"
  echo "5. Check against docs/ANALOGIES.md — any new real-world reference revealed?"
  echo "6. Propose docs/RESEARCH-SIGNALS.md updates. Wait for Romit approval."
  echo "7. Draft weekly email to Aarti:"
  echo "   Line 1: business outcome (CEO summary)"
  echo "   Line 2: what moved forward"
  echo "   Line 3: what is needed from Aarti (if any)"
  echo "   Then: product-by-product detail with Granola links"
  echo "   Add: [Screenshot: ProductName — FlowName] placeholders"
  echo "8. Do not send. Romit adds screenshots and sends via Outlook."
  echo ""
  echo "Proceeding automatically..."
fi

exit 0
```

---

### FILE 7 — .claude/hooks/compact-restore.sh (executable)
# Fires on PostCompact — after context compaction.
# Re-injects platform context automatically so gates and standards survive compaction.

```bash
#!/bin/bash
# PostCompact hook — fires after /compact
# Re-injects critical platform context lost during compaction

echo "=== CONTEXT RESTORED AFTER COMPACT ==="
echo ""

# Re-inject active signals
if [ -f "docs/RESEARCH-SIGNALS.md" ]; then
  echo "--- ACTIVE SIGNALS ---"
  cat docs/RESEARCH-SIGNALS.md
  echo ""
fi

# Re-inject active product rules if detectable
# (Claude will re-read based on currently open files)
echo "--- GATES RESTORED ---"
echo "Gate 1 EVIDENCE: cite file or Granola session. Uncited → [INFERENCE]"
echo "Gate 2 DS PARITY: check DS-REGISTRY.md for active product."
echo "Gate 3 COMPETITOR: check COMPETITOR-INTEL.md for active product."
echo "Gate 4 DEADLINE: Aug 2026 Cohere default. Beyond → [POST-COHERE SCOPE]"
echo ""
echo "Design standard, north star, and persona dimensions restored from CLAUDE.md."
echo "Re-read active product rules file and continue from last design decision."
echo "======================================="

exit 0
```

---

### FILE 8 — .claude/settings.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "bash .claude/hooks/session-start.sh"
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/prompt-context.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-response-check.sh"
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "type": "command",
        "command": "bash .claude/hooks/compact-restore.sh"
      }
    ],
    "FileChanged": [
      {
        "matcher": "docs/ANALOGIES.md",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/file-change-intel.sh" }]
      },
      {
        "matcher": "docs/RESEARCH-SIGNALS.md",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/file-change-intel.sh" }]
      },
      {
        "matcher": "docs/PRODUCTS.md",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/file-change-intel.sh" }]
      }
    ]
  },
  "mcpServers": {
    "mobbin": {
      "command": "npx",
      "args": ["-y", "mobbin-mcp"]
    }
  },
  "env": {
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1"
  }
}
```

---

### FILE 9 — .claude/rules/exam-management.md

```
---
paths:
  - "**/*exam*"
  - "**/*assessment*"
  - "**/*question*"
  - "**/*lockdown*"
  - "**/*navigator*"
---
DS: exxat-ds. Competitors: ExamSoft (primary), D2L, Blackboard.
Contacts: Vishaka (PM/oversight), Nipun (PM/dev), Darshan (dev).
Milestones: Apr 17 2026 demo → Aug 2026 Cohere (HARD) → Nov 2026 full parity.
Critical dependency: UNF pilot blocked until accessibility V1 ships.

Gate 3 parity — must match by Aug 2026:
  LO tagging per question / difficulty + discrimination index /
  Question types: formula, hotspot, ordering, matching /
  Bulk accommodation (D2L does per-student per-quiz manually — beat it) /
  Focus mode with flag-for-review

Lockdown: no clipboard / no external links / no multi-tab /
  keyboard 100% complete / screen reader without visual UI reference.

Product analogies to apply:
  ANALOGY-01 TypeForm single question → question card display
  ANALOGY-02 ExamSoft cross-out → answer elimination interaction
  ANALOGY-05 Duolingo progress ring → exam completion (no anxiety)
  ANALOGY-06 Linear command palette → question bank navigation
  ANALOGY-08 Notion/Linear multi-select → bulk accommodation assignment

Product-specific persona note:
  Student: 80-90% build external tracking. Accessibility gaps are the #1 barrier.
  DCE: curriculum mapping is the ExamSoft retention anchor — must match this.
```

---

### FILE 10 — .claude/rules/faas.md

```
---
paths:
  - "**/*faas*"
  - "**/*form*"
  - "**/*workflow*"
  - "**/*governance*"
---
DS: exxat-ds. Competitors: SurveyMonkey, Qualtrics, Google Forms.
Contacts: Lauren (PM), Brooke (PM). NPS: 2/5. Tickets: 95k+. Forms: 17k+.

Gate 3 parity:
  Self-service form builder (replaces all Exxat-team manual config) /
  Tag validation with dropdown (no free-text drift) /
  Reviewer side-by-side comparison / form preview + simulator /
  Response analytics and theme extraction

Core problem (Granola: FaaS compliance interview Mar 20 2026):
  3-system fragmentation: Exxat + institution LMS + paper/email for clinical site.
  Touro: 7 survey types outside Exxat — active retention risk.

Governance (do not redesign without explicit direction):
  11 form types. CRITICAL / Manager approval / warning override model.

Analogies: ANALOGY-03 SurveyMonkey builder / ANALOGY-04 Figma side-by-side /
  ANALOGY-07 Linear priority filter / ANALOGY-08 multi-select + action bar.

Persona frictions:
  SCCE: external, mobile-first, lowest tolerance, relearning every session.
  DCE: Bloom's taxonomy + LO cross-referencing, progressive disclosure.
  Student: clinical forms during placement rotations.
```

---

### FILE 11 — .claude/rules/skills-checklist.md

```
---
paths:
  - "**/*skills*"
  - "**/*competency*"
  - "**/*procedure*"
  - "**/*checklist*"
---
DS: student-ux. Competitors: Meditrek. Scope: Q2-Q4 2026.

Gate 3 parity:
  Student-lifetime competency tracking (not placement-scoped) /
  Cross-rotation aggregate without Excel export /
  Procedure minimum counter / red filter for deficiency

Core gap: 80-90% of students build external spreadsheets.
Root cause: skills are placement-scoped, not student-lifetime.

Analogies: ANALOGY-05 Duolingo progress / ANALOGY-07 Linear priority filter.

Frictions:
  Student: "have I done this skill across all rotations?" — unanswerable today.
  DCE: deficient students invisible without manual scanning or Excel export.
```

---

### FILE 12 — .claude/rules/design-system.md

```
---
paths:
  - "exxat-ds/**"
  - "student-ux/**"
  - "tokens/**"
  - "**/*.tokens.json"
  - "**/*token*"
---
On load: read docs/DS-REGISTRY.md for full landscape.
READ ONLY: exxat-ds and student-ux. Never edit directly.
Token workflow: check tokens/tokens.json → propose → flag Himanshu → never invent.
TOKEN UNCONFIRMED: "TOKEN UNCONFIRMED: [description of intent]"
Base: Oracle DS. WCAG 2.1 AA hard floor.
New DS in DS-REGISTRY.md → Gate 2 extends automatically.

HANDOFF required per component:
  Confirmed tokens / all states / keyboard nav /
  Screen reader (role, label, live region, state change) /
  WCAG by number and name
```

---

### FILE 13 — docs/DS-REGISTRY.md

```
# Design System Registry — Gate 2 reads this via session hook
# New row = Gate 2 auto-extends. No CLAUDE.md edit needed.

| DS ID      | Package        | Owner    | Products                              | Access    | Token mirror       |
|------------|----------------|----------|---------------------------------------|-----------|--------------------|
| exxat-ds   | @exxat/ds      | Himanshu | Exam, FaaS, PCE, CourseEval           | READ ONLY | tokens/tokens.json |
| student-ux | @exxat/student | Himanshu | Skills Checklist, Learning Contracts  | READ ONLY | tokens/tokens.json |
```

---

### FILE 14 — docs/ANALOGIES.md

```
# Product Analogies Registry
# Prompt hook loads this before every design prompt.
# /analogy fetches new entries from Mobbin MCP. Romit approves before writing.
# Scope: platform = 2+ products. product = one product due to unique constraints.

| ID | Domain | Scope | Reference | Screen/flow | Pattern | Exxat products | Source | Date |
|----|--------|-------|-----------|-------------|---------|----------------|--------|------|
| ANALOGY-01 | Question display | platform | TypeForm | Single question | One-at-a-time reduces cognitive load | Exam Management | rr-insights | 2026-05-09 |
| ANALOGY-02 | Answer elimination | product | ExamSoft | Cross-out | Strikethrough reduces working memory | Exam Management | ExamSoft demo | 2026-05-09 |
| ANALOGY-03 | Form creation | platform | SurveyMonkey | Form builder | Drag-drop + live preview sets DCE expectation | FaaS 2.0 | rr-insights | 2026-05-09 |
| ANALOGY-04 | Reviewer comparison | platform | Figma | Comment mode | Side-by-side without view switching | FaaS 2.0, Exam Management | rr-insights | 2026-05-09 |
| ANALOGY-05 | Progress and completion | platform | Duolingo | Progress ring | Non-anxiety completion indicator | Exam, Skills Checklist | [INFERENCE] | 2026-05-09 |
| ANALOGY-06 | Command palette / power nav | platform | Linear, Raycast | K-bar | Jump anywhere without navigation traversal | All admin surfaces | [INFERENCE] | 2026-05-09 |
| ANALOGY-07 | Deficiency and alert filter | platform | Linear | Priority filter | Surface critical items without full-list scanning | Skills, FaaS, Exam | [INFERENCE] | 2026-05-09 |
| ANALOGY-08 | Bulk operations | platform | Notion, Linear | Multi-select + action bar | Select multiple → floating action bar | Exam, FaaS, Skills | [INFERENCE] | 2026-05-09 |
```

---

### FILE 15 — docs/PRODUCTS.md

```
# Products Registry — loaded by session hook every session

| ID                 | Product                  | Status          | PM / Dev                | DS         | Priority  | Lifecycle stage        |
|--------------------|--------------------------|-----------------|-------------------------|------------|-----------|------------------------|
| exam-management    | Exam Management          | Active redesign | Vishaka, Nipun, Darshan | exxat-ds   | High      | Didactic → Clinical    |
| faas               | FaaS 2.0                 | Active ownership| Lauren, Brooke          | exxat-ds   | Very high | Clinical → Culminating |
| pce                | PCE                      | Active          | Vishaka                 | exxat-ds   | Med-high  | Clinical               |
| skills-checklist   | Skills Checklist         | Q2-Q4 scope     | TBC                     | student-ux | Med-high  | Clinical → Culminating |
| learning-contracts | Learning Contracts       | Scoped          | TBC                     | student-ux | Medium    | Clinical               |
| course-eval        | Course and Faculty Eval  | New module      | TBC                     | exxat-ds   | Medium    | Didactic → Advisory    |

Key dates: Apr 17 2026 demo | Aug 2026 Cohere HARD | Nov 2026 full parity

Stakeholder formats:
Arun   → evidence + risk + ask (Status → rationale → risk → what I need)
Kunal  → business impact only (problem → finding → direction → outcome)
Aarti  → 3 sentences max (summary + outcome + what needed from her)
Vishaka → milestone progress + blockers vs Apr 17 and Aug
```

---

### FILE 16 — docs/RESEARCH-SIGNALS.md

```
# Cross-product signals — loaded by session hook
# Threshold: direct-quote or summarised evidence in 3+ independent products
# /sync-granola (Friday hook) proposes updates. Romit approves before writing.

| ID   | Signal                                    | Products                    | Evidence                              | Implication                                  | Updated    |
|------|-------------------------------------------|-----------------------------|---------------------------------------|----------------------------------------------|------------|
| S-01 | Cognitive overload under constraint       | Exam / FaaS / Skills        | Exam accessibility Mar 20; FaaS Mar 20| Progressive disclosure not feature reduction | 2026-05-09 |
| S-02 | No self-serve accreditation reports       | FaaS / Exam / CourseEval    | Touro 7 surveys; ExamSoft retention   | PDs cannot wait for support exports          | 2026-05-09 |
| S-03 | AI opportunity layer confirmed            | All five products            | Assessment creation Mar 23            | AI is ambient inside workflows               | 2026-05-09 |
| S-04 | Manual configuration debt                 | FaaS / ExactOne / Skills    | 95k tickets; Excel mapping            | Self-service must replace all manual steps   | 2026-05-09 |
| S-05 | Multi-campus fragmentation                | Exam / FaaS / ExactOne      | Multiple sessions                     | Campus-level overrides without reconfig      | 2026-05-09 |
| S-06 | Standalone skills entity gap              | Skills / Learning Contracts | 80-90% external spreadsheets          | Skills at student lifetime not placement     | 2026-05-09 |
| S-07 | Mobile gap, SCCE underservice             | FaaS / Skills               | FaaS compliance Mar 20                | Mobile is SCCE's primary surface             | 2026-05-09 |
```

---

### FILE 17 — .claudeignore

```
node_modules/
.git/
dist/
build/
coverage/
*.log
*.lock
package-lock.json
yarn.lock
.DS_Store
*.map
```

---

### FILE 18 — docs/PERSONAS.md
Populate from rr-insights SKILL.md Section 2.
Add all 10 vector dimensions per persona as structured fields.
This file is loaded by the session hook every session.
Romit populates manually from existing SKILL.md content.

### FILE 19 — docs/COMPETITOR-INTEL.md
Populate from rr-insights SKILL.md Section 3.
Use markdown anchors #exam #faas #skills #course-eval #learning-contracts #pce.
Prompt hook extracts the right section per detected product automatically.
Romit populates manually from existing SKILL.md content.

---

## PHASE 3 — MAKE ALL HOOKS EXECUTABLE

```bash
chmod +x .claude/hooks/session-start.sh
chmod +x .claude/hooks/prompt-context.sh
chmod +x .claude/hooks/post-response-check.sh
chmod +x .claude/hooks/file-change-intel.sh
chmod +x .claude/hooks/weekly-sync.sh
chmod +x .claude/hooks/compact-restore.sh
```

---

## PHASE 4 — VERIFY

1. /memory — confirm CLAUDE.md loaded, line count under 80
2. Open Claude Code — confirm session-start hook fires and outputs platform context
3. Type "design the question navigator" — confirm prompt hook detects exam-management,
   injects product rules, competitor intel, analogies, and 10 persona dimensions
4. Open a file in exxat-ds/ — confirm design-system.md loads automatically
5. Get a response — confirm post-response hook checks for anti-patterns
6. Edit docs/ANALOGIES.md — confirm file-change hook fires and re-injects content
7. Run /compact — confirm compact-restore hook fires and restores gates
8. /context — confirm CLAUDE.md is under 15% of session token baseline
9. Type "show me a reference for bulk operations" — confirm analogies loaded from
   ANALOGIES.md without running any command
10. Type "friday email" — confirm weekly workflow primes automatically

---

## PHASE 5 — REPORT

Summary table: | File | Action | Lines | Purpose | Status |

Token architecture:
  CLAUDE.md: ~80 lines / ~500 tokens / loads every message
  Session hook: reads registries once at start / replaces on-demand doc reads
  Prompt hook: ~50 tokens of injected context per message / targeted not global
  Rules files: 0 tokens until file opened / then product-specific only
  Post-response hook: runs outside context window / 0 token cost
  Net: estimated 70-80% reduction vs loading all context at session start

What Romit never has to do again:
  Type any slash command / re-explain context / manually check anti-patterns /
  Remember to run gate checks / find Mobbin references / check cross-product applicability /
  Prime product context / restore context after compaction / trigger Friday workflow

What fires automatically:
  Session opens → full platform context loaded
  Any message → product detected → targeted rules injected
  Any response → design standard checked → violations flagged
  File opened → product rules loaded
  Registry updated → context updated mid-session
  Friday → Granola sync + email draft staged
  Compaction → context restored

Manual files still needed from Romit:
  docs/PERSONAS.md — from rr-insights SKILL.md Section 2
  docs/COMPETITOR-INTEL.md — from rr-insights SKILL.md Section 3
  Mobbin auth — npx -y mobbin-mcp auth (one time)
