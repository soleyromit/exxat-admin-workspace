# TypeSafe for import interpretation (S-08): implementation design

**Date:** 2026-10-08 · **Status:** BUILT 2026-10-08 (see §10 for what was built, what differs from this design, and the live smoke evidence). Approved by Romit ("go, use typesafe for import"); the key is in `admin/.env.local`.
**Scope:** S-08 import only. Requirements: `[REQ IM-02]` (spreadsheet, document, PDF), `[REQ IM-04]` (candidate skills, descriptions, grouping), `[REQ IM-05]` (proposal not outcome), `[REQ IM-07]` (headings as categories), `[REQ IM-08]` (unread lines with original text), `[REQ IM-13]` (draft only, explicit human confirmation), `[OD-12]` OPEN (see §1.1).
**Tags:** `[TYPESAFE <url>]` = read in the live docs on 2026-10-08. `[INFER]` = my inference, needs measurement or confirmation. Nothing in this doc is a measured result.


> **Decision recorded 2026-10-08 (Romit):** TypeSafe's input-retention policy is acceptable for sending skill-list text (never student data) to the API. Enterprise zero-retention is not required for this prototype.

## 0. What this design decides (one screen)

| # | Decision |
|---|---|
| D1 | Code finds candidates and settles every line it can by rule; TypeSafe judges only the lines the rules leave ambiguous. Code owns the workflow `[TYPESAFE concepts/how-to-build-with-system-one]`. |
| D2 | TypeSafe never writes text. It returns typed answers (Choice, Noul) about spans that code extracted, so every name and description in the proposal is a verbatim span of the source (select, do not generate) `[TYPESAFE cookbooks/pre_parsed_value_extraction_cookbook]`, `[TYPESAFE model-jaggedness/jev-1.13 #13: not trained to generate]`. |
| D3 | The model proposes **names, descriptions and category/heading only**. It never proposes an evaluation model or achievement criteria `[OD-12 held OPEN: default = no]`. |
| D4 | AI is **optional and off by default per import**: an explicit switch in the input step, shown only when the server reports AI available. With no key, or on any failure, the existing deterministic reader runs and a `LocalBanner` says so. |
| D5 | The key lives only in a Next route handler (`TYPESAFE_API_KEY`). The browser never sees it `[TYPESAFE sdk/javascript/api/interfaces/TypeSafeClientConfig: dangerouslyAllowBrowser defaults false]`. |
| D6 | Only the text of the uploaded or pasted list is sent. The library, students and evaluations never leave the browser. Duplicate detection against the library stays client-side. |
| D7 | File extraction (`.xlsx`, `.docx`, text-layer `.pdf`) is code, in a separate route that works **without any AI key**, so IM-02 gets real file support independent of TypeSafe. |
| D8 | Probabilities drive a **"Check this row"** cue and the Not read list. They never auto-confirm anything and are never shown as percentages or accuracy `[REQ IM-13]`. |
| D9 | Model pinned to an exact version for threshold stability (`jev-1.13.0`; `jev-latest` is an alias of it today) `[TYPESAFE models]`, `[INFER]`. |
| D10 | The build must be fully testable without a key via an injected `fetch` (documented client option) and clearly labelled SYNTHETIC fixtures. |

## 1. What the docs establish (the contract with TypeSafe)

### 1.1 Facts used (all `[TYPESAFE]`, quoted or paraphrased from the pages named)
| Topic | Fact | Source |
|---|---|---|
| Endpoint | `POST https://api.typesafe.ai/v1/systemone`, header `Authorization: Bearer <API_KEY>`, `Content-Type: application/json` | `api.md` |
| Request | `{ state: string \| object \| array, model: string, questions: { <id>: Question } }`. Question keys are not sent to the model. | `api.md` |
| Question types | `noul`: `instructions` required, `criteria` optional `{true, false}`. `choice`: `instructions`, `criteria` required (option name to description, `null` allowed), max **255 options**. `score`: 2 to 10 levels. | `api.md`, `primitives/choice.md`, `primitives/noul.md` |
| Response | `{ model, answers: { <id>: ... }, usage: { input_tokens, output_tokens } }`. Noul answer: `noul` (0 to 1). Choice answer: `choice`, `probabilities` (sums to 1), `confidence` (0 to 1). Noul has no `confidence`. | `api.md`, `confidence.md` |
| Errors | `401`, `422` (names the offending field), `429`, `529`. Retry 429 and 529 with exponential backoff. | `api.md` |
| Model | `jev-1.13.0`; `jev-latest` and `jev-preview` both point to it today. | `models.md` |
| Limits | Context **64k tokens per request; 32k tokens for `state` plus the longest question**. Max questions per request: **not stated**. State is text only. | `models.md` |
| Price | $0.042 per million input tokens; output tokens free. | `models.md` |
| Rate limits | 100K tokens per second and 80 requests per second, "changing dynamically"; over limit returns 429. | `models.md` |
| Language | English primary; other languages accepted with lower accuracy. | `models.md`, `concepts/state.md` |
| Latency | "Most queries complete in about 100 ms"; 13 questions in one call over a ~53k-character document took 0.27 s (cost $0.000497). | `concepts/how-to-build-with-system-one.md`, `cookbooks/parallel_questions.md` |
| Parallel questions | "Questions are evaluated independently and in parallel." One answer does not feed another. Batch questions sharing a state into one request; answers are unchanged by batching. | `concepts/how-to-build-with-system-one.md`, `cookbooks/parallel_questions.md`, `patterns/fan-out.md` |
| Paths in questions | Reference state values by wrapping a dotted path in backticks, e.g. `` `ticket.sender.email` ``; the how-to page shows `` `support.tickets[0].message` ``. | `primitives/advanced.md`, `concepts/how-to-build-with-system-one.md` |
| Structured criteria | Choice option descriptions and Noul `true`/`false` may be objects with free field names such as `what`, `not_for`, `examples`. | `primitives/advanced.md` |
| Confidence | Thresholds are domain-specific; "Start with conservative thresholds, test with your own data, and adjust". Low Choice confidence = no clear winner. | `confidence.md` |
| JS SDK | `npm install @typesafe-ai/sdk` (Node 20+). `new TypeSafeClient()` reads `TYPESAFE_API_KEY`. `client.systemOne({ state, questions }, options?)` returns `APIPromise<SystemOneResult<Q>>`. Helpers `choice(instructions, criteria)` and `noul(instructions?, criteria?)`. Read `response.answers.<id>.choice`. | `sdk/javascript.md`, `sdk/javascript/api/classes/TypeSafeClient.md`, `.../functions/choice.md`, `.../functions/noul.md` |
| SDK config | `apiKey`, `baseURL`, `timeout` (per attempt, default 10000 ms, **no total retry budget**), `retry`, `fetch` ("Custom HTTP fetch implementation for transport configuration or tests"), `logger`, `logLevel` (default `warn`; `debug` logs bodies, which are not redacted), `defaultModel`, `defaultHeaders`, `dangerouslyAllowBrowser` (default false). | `.../interfaces/TypeSafeClientConfig.md` |
| SDK retries | `maxRetries` 2, `backoffInitialMs` 500, `backoffMaxMs` 5000, `backoffJitter` 0.25, retried statuses 408, 429, 500 to 599, `respectRetryAfter` true. Per-call `RequestOptions`: `headers`, `retry`, `signal` (AbortSignal), `timeout`. | `.../interfaces/RetryPolicy.md`, `.../interfaces/RequestOptions.md` |
| Jaggedness | Reads literally; unreliable at counting; leans toward the first Choice option; accuracy drops as irrelevant state grows ("context rot"); adversarial content in state can change answers; not trained to generate text. | `model-jaggedness/jev-1.13.md` |
| Data handling | Privacy Policy "commitment not to train models on user data"; Data Processing Agreement covers retention; "zero data retention (ZDR) for enterprise customers". The page does not say whether API inputs are stored. | `legal.md` |

### 1.2 Not stated in the docs (do not assume)
- A maximum number of questions per request, a maximum request body size, or a request timeout on the server side.
- The exact JSON of `usage` beyond `input_tokens` and `output_tokens` integers.
- That the JS SDK exposes the Noul value as `answers.<id>.noul` (the HTTP API does; the SDK page only shows `.choice`). **Verify against the installed `SystemOneResult` types before coding.**
- Retention of API inputs (see §8).
- Pages I did **not** read: `cookbooks/hierarchical_classification`, `function_calling`, `entity_alignment`, `skill_suggestion`, `classification_using_confidence`, `sdk/javascript/api/interfaces/SystemOneRequest`/`SystemOneResult`, the Python SDK pages. None failed to load; I did not need them for this design.

## 2. Pipeline

```
 input (paste text | uploaded file)
   │
   ├─ file? ──▶ POST /api/import/extract  (code only, no AI, no key needed)
   │              .xlsx (exceljs)  .docx (mammoth)  .pdf text layer (unpdf)  .csv/.txt (passthrough)
   │              ──▶ { text, columns?, skipHeader?, sourceName }
   ▼
 STAGE 1  RULES (pure TS, shared module, runs in browser and server)       [exists: interpretSource]
   settles: no letters (noise) · >160 chars (noise) · markdown "#" heading · trailing-colon heading ·
            "Section/Part/Chapter/Appendix" (unread heading) · CSV column rows · ALL-CAPS heading w/ items below (category)
   leaves:  AMBIGUOUS candidates (plain lines whose role is not settled)
   ▼
 STAGE 2  MODEL (only if the switch is on and the server reports AI available)
   POST /api/import/interpret {text, sourceName, columns?, skipHeader?}
   server: re-runs Stage 1 on the text, chunks the ambiguous candidates, calls TypeSafe, assembles
   ──▶ InterpretationResult { rows[], unread[], meta }
   ▼
 STAGE 3  ASSEMBLY (pure TS)  code decides; model answers are inputs, never actions
   thresholds → include / cue / Not read; categories recomputed positionally; names/descriptions are source spans
   ▼
 CLIENT: store action builds the batch in "review" (nothing created, IM-05/IM-13); duplicates vs library computed here
   ▼
 admin reviews, edits, confirms (existing review dialog, existing confirmImport)
 ANY failure above ──▶ deterministic proposeImport + LocalBanner (D4)
```

`[REQ IM-13]` holds because Stage 3 only fills the same `ImportBatch` proposal the deterministic reader fills today; `confirmImport` is untouched and still the only creator.

### 2.1 Candidate extraction (code)
- Reuse and split `interpretSource` in `lib/store/actions/importing.ts` into a **pure** `classifyByRules(text, opts)` returning, per non-blank line: `{ n, raw, decision: "skill" | "heading" | "category" | "noise" | "ambiguous", name?, description?, categoryName? }`. Behaviour for already-settled lines must be byte-identical to today (existing tests stay green): B3 (no-letter lines unread) and B4 (ALL-CAPS heading with items below becomes a category) are Stage-1 outcomes that the model can never override.
- **Ambiguous** = a line that is not settled by any rule above and is not a structured CSV row. For a pasted plain list this is most lines; that is fine, the model's job is to confirm them cheaply and to catch prose, notes and page furniture that rules cannot.
- Name/description split stays code (`splitNameDescription` on `\t | - – — :`). A candidate's `name` is a trimmed span with bullet/number stripped (`BULLET` regex). The model is never asked to produce a name.

### 2.2 Spreadsheets, documents, PDFs (code, in `/api/import/extract`)
Verified to exist on npm on 2026-10-08 with `npm view` `[INFER: choice of library; API usage must be confirmed from each package README at build time, I did not read them]`:

| Format | Package (latest, license) | Use | Notes |
|---|---|---|---|
| `.xlsx` | `exceljs` 4.4.0, MIT | Read first worksheet (and further sheets if the first is empty). If the first row contains cells matching `/^(skill|name)$/i`, `/^description$/i`, `/^(category|group|section)$/i`, map those columns deterministically and emit CSV-style text with `columns: true, skipHeader: true`; otherwise emit one line per row, cells joined by a tab. | Reads `.xlsx` only. Legacy `.xls` is **not supported**: show the unreadable-file state. Avoid the npm `xlsx` package: its latest npm release is 0.18.5 `[INFER: stale on npm; confirm before ruling it out or in]`. |
| `.docx` | `mammoth` 1.13.0, BSD-2-Clause | Start with `extractRawText` (one paragraph per line). Optionally `convertToHtml` to read `<h1>`/`<h2>` so real Word headings become `# ` markdown heading lines (strong Stage-1 signal, fewer model calls). | Legacy `.doc` not supported. |
| `.pdf` (text layer) | `unpdf` 1.8.1, MIT (alternatives seen: `pdf-parse` 2.4.5, `pdfjs-dist` 6.4.299, Apache-2.0) | Extract text per page, split into lines. | **No OCR.** A scanned PDF yields little or no text: report the unreadable-file state, never fake it. Two-column PDFs may scramble order; that is why category-by-model is enabled for PDF/DOCX (§2.5). |
| `.csv`, `.txt` | none | Passthrough text. | CSV header handling already exists (`preparePaste`, `skipHeader`). |

Safety: allowlist by extension **and** magic bytes; cap upload at **4 MB** (the common serverless request-body ceiling is about 4.5 MB `[INFER: platform-specific, verify for the deploy target]`); cap extracted text at 200,000 characters and 1,500 lines (reject beyond with a clear message); wall-clock limit 15 s for extraction; treat OOXML as zip with a decompressed-size ceiling to defuse zip bombs; no macro execution (none of the libraries execute macros); never write the upload to disk; never log file contents.

### 2.3 Per-candidate judgments (one request carries many candidates)
Every ambiguous candidate `i` in a chunk gets these questions. They are independent and run in parallel `[TYPESAFE concepts/how-to-build-with-system-one]`; the same state serves all of them.

**State** (named fields, only what the questions need; `[TYPESAFE concepts/state]` "Use an object for most requests"):
```json
{
  "list_context": {
    "kind": "A list of practice skills that a health-professions program expects students to perform, taken from a spreadsheet, document or PDF",
    "source": "pasted list",
    "headings_found_by_code": ["WOUND CARE SKILLS", "RESPIRATORY SKILLS"]
  },
  "lines": [
    { "n": 12, "text": "Insert a peripheral IV catheter", "before": "WOUND CARE SKILLS", "after": "Dress a sterile wound" },
    { "n": 13, "text": "Use the smallest gauge that allows adequate flow", "before": "Insert a peripheral IV catheter", "after": "Dress a sterile wound" }
  ]
}
```
`before`/`after` are the neighbouring non-blank lines, truncated to 120 characters. `n` is the 1-based source line number (same numbering as IM-08 "Line n"). Lines are indexed `lines[0]..lines[k-1]` inside the chunk; the question refers to its own index.

**Question 1, kind (Choice).** id `k{i}` (ids are for code only `[TYPESAFE api.md]`).
```ts
choice(
  {
    question: "What is `lines[i].text` in this list? Judge only this line. Use `lines[i].before` and `lines[i].after` as context only.",
    context: "`list_context.kind`"
  },
  {
    section_heading: {
      what: "A title that groups the lines beneath it, such as a body system, a unit, a course block or a category.",
      examples: ["RESPIRATORY SKILLS", "Section 2", "Medication skills"],
      not_for: "A single practice skill that has its own name."
    },
    skill: {
      what: "One practice skill that a student can be watched performing, named in a short phrase.",
      examples: ["Insert a peripheral IV catheter", "Vital signs assessment", "Sterile dressing change"],
      not_for: "Headings, notes, instructions to the reader, scales or criteria, page numbers."
    },
    other: {
      what: "Anything else: page numbers, headers and footers, instructions, notes, signatures, scoring scales, fragments that are not a skill and not a heading.",
      examples: ["Page 3 of 12", "Students must complete all items", "Date: ______"]
    }
  }
)
```
Option order is `section_heading, skill, other`. The model "leans toward the first option" `[TYPESAFE model-jaggedness/jev-1.13 #12]`, so the smoke script (§6.3) must run the swapped order `skill, section_heading, other` on the same lines and report disagreement; if material, ask the question twice in the same request (both orders, two ids) and average the probabilities in code `[INFER]`. `other` is the no-match outcome required by the Choice guidance `[TYPESAFE primitives/choice.md]`.

**Question 2, detail (Noul).** id `d{i}`. Phrase so a high value means yes `[TYPESAFE primitives/noul.md]`.
```ts
noul(
  "Does `lines[i].text` only add detail to the skill named in `lines[i].before` (a description, qualifier or note about that skill) instead of naming a different skill?",
  {
    true:  { what: "The line continues or explains the previous line.", examples: ["Use the smallest gauge that allows adequate flow"] },
    false: { what: "The line names its own skill, or is a heading, or is unrelated to the previous line.", examples: ["Dress a sterile wound"] }
  }
)
```
Asked only for candidates whose `before` is itself a skill candidate or an accepted skill (otherwise there is no skill to attach to). Used for IM-04 "accompanying details".

**Question 3 (optional), category (Choice).** id `c{i}`. Asked only when `categoryByModel` is true (default true for PDF/DOCX extraction where reading order can be scrambled; false for paste and CSV where position is reliable) and there are 2 to 60 headings (the option limit is 255 `[TYPESAFE api.md]`; the cap of 60 is mine, `[INFER]`).
```ts
choice(
  "Under which heading does the skill `lines[i].text` belong? Use the context lines only to decide, not the order of the headings.",
  { /* each detected heading text: null (the name is the description) */ ...headingsAsKeys, none: "No heading fits this line." }
)
```
`none` is placed **last**; headings stay in document order. Heading keys must be unique strings; duplicates get a `" (2)"` suffix in the key and are mapped back in code.

### 2.4 Chunking, budget and latency (all `[INFER]`: estimates from published pricing and cookbook figures; measure `usage` in the smoke script)
- **Chunk size:** 25 ambiguous candidates per request. Each candidate asks 2 questions (3 with category). With the criteria objects above, a Choice question is roughly 150 tokens and a Noul about 80 `[INFER: chars/3.5]`, so a chunk is about 25 x (150 + 80) + state (~25 x 60 = 1.5k) ≈ **7.3k input tokens** (about 10.5k with the category question). Hard cap: estimate tokens as `chars / 3.5`; if a chunk exceeds **16k** estimated tokens, split it. This stays far below the stated limits (32k for state + longest question; 64k per request `[TYPESAFE models]`).
- **Why chunk and not one request:** 200 lines x 3 questions x ~110 tokens would be over 64k tokens of question text alone, and large state invites context rot (`[TYPESAFE model-jaggedness #8]`).
- **200-line list:** 8 requests, about 58k input tokens in total, about **$0.0025** (58k x $0.042 per million; output is free `[TYPESAFE models]`). With category questions about $0.0035. Even 10x off this is negligible. Rate limits (80 requests per second, 100K tokens per second `[TYPESAFE models]`) are not a constraint at this size.
- **Latency:** requests are independent, so send up to **4 in parallel** `[INFER]`. Docs show about 100 ms typical and 0.27 s for a 13-question call; expect **under 2 s of model time for 200 lines**, plus extraction time. The route enforces a 25 s total budget.

### 2.5 Combining rules and model (code first, model second)
1. **Rules are final** for lines they settle (noise, markdown/colon headings, Section/Part headings, CSV columns, ALL-CAPS heading with items below). The model is not asked about them. This preserves B3/B4 and keeps cost down.
2. For each ambiguous candidate, read `k{i}`:
   - `P(skill) >= 0.80` and `confidence >= 0.60`: **accept as a skill**, no cue.
   - `0.50 <= P(skill) < 0.80` or `confidence < 0.60`: accept as a skill **with the cue** `lowSkillConfidence`.
   - `P(section_heading) >= 0.80` and `confidence >= 0.60`: treat as a heading: it becomes a proposed **category** for the following rows (opt-in checkbox exactly as today, IM-07), not a skill.
   - `P(section_heading)` between `0.50` and `0.80`: goes to **Not read** with reason `heading` ("Looks like a section heading") and no category effect.
   - otherwise (`other` wins, or `P(skill) < 0.50`): **Not read**, reason `uncertain` when `confidence < 0.60`, else `unrecognised`, original text always shown (IM-08).
3. **Detail:** if `d{i} >= 0.70` and the previous line is an accepted skill, append this line's text to that skill's `description` (verbatim span, joined with a space) and **do not** create a row for it. If `0.40 <= d{i} < 0.70`, create the row as usual and add the cue `maybeDetail` (the admin can merge by hand: the review table already supports merge). Conservative direction chosen because merging hides a candidate skill, while a spurious row is visible and removable `[INFER]`.
4. **Category:** default positional (nearest preceding accepted heading or Stage-1 category) `[REQ IM-07]`. When `categoryByModel` is on and `c{i}` is available: use the model's pick only if `confidence >= 0.60` and it is not `none`; if it **differs** from the positional category, keep the model's pick **and** add the cue `categoryUncertain`.
5. **Disagreement with a rule:** if Stage 1 produced a category/heading by the ALL-CAPS rule but the model says `skill` with `P >= 0.80`, keep the rule's outcome and add the cue `rulesAndModelDisagree` to the heading's first row.
6. **Never** change `include` to false because of a cue (a cue is advice). Rows start `include: true`, except existing behaviours (repeated name in the source starts excluded; duplicates of existing library skills default to Skip).
7. **Numbers are examples.** `[TYPESAFE confidence.md]`: "Start with conservative thresholds, test with your own data, and adjust". Put every threshold in one `IMPORT_THRESHOLDS` constant and tune from the §6.3 smoke output and real lists.

## 3. Types (additive; keep existing fields)

```ts
// lib/domain/types.ts (additive)
export type ImportCueReason =
  | "lowSkillConfidence" | "maybeDetail" | "categoryUncertain" | "rulesAndModelDisagree"
export interface ImportRowCue { reasons: ImportCueReason[] }          // no probabilities in the domain model or UI
export interface ImportRow { /* existing */ cue?: ImportRowCue; origin?: "rules" | "model" }
export interface UnreadLine { /* existing */ reason: "heading" | "empty" | "unrecognised" | "uncertain" }
export interface ImportInterpretationMeta {
  mode: "rules" | "ai" | "ai-fallback"
  model?: string              // exact version used, e.g. "jev-1.13.0"
  candidatesAsked?: number
  requests?: number
  inputTokens?: number        // from response.usage, for cost tracking only
  fallbackReason?: "unavailable" | "timeout" | "rate_limited" | "error"
}
export interface ImportBatch { /* existing */ interpretation?: ImportInterpretationMeta }
```
Probabilities stay on the server and in test output; the browser receives only cue reasons (D8, IM-13: nothing that reads as an accuracy figure).

## 4. Server routes (Next route handlers, Node runtime)

Files: `app/api/import/status/route.ts`, `app/api/import/extract/route.ts`, `app/api/import/interpret/route.ts`, `lib/import-ai/{client.ts, questions.ts, assemble.ts, chunk.ts, thresholds.ts}`. Add `export const runtime = "nodejs"` and `export const dynamic = "force-dynamic"` on each.

### 4.1 Environment (add `.env.example` only; never commit a real key)
```
# TypeSafe (server only). Without a key the app runs on the standard reader.
TYPESAFE_API_KEY=
SKILLS_IMPORT_AI=off                 # on | off. Off or missing key means "unavailable" in /api/import/status
TYPESAFE_IMPORT_MODEL=jev-1.13.0     # pinned; jev-latest is an alias today
SKILLS_IMPORT_DAILY_CAP=200          # interpret calls per day per deployment (demo cost guard)
```
The current `.gitignore` has no `.env` rule; the implementer must add `.env*` with `!.env.example` `[INFER: observed in admin/.gitignore on 2026-10-08]`.

### 4.2 `GET /api/import/status`
`200 { ai: boolean, extractors: { xlsx: true, docx: true, pdf: true }, maxUploadBytes: 4194304 }`. `ai` is `true` only if `SKILLS_IMPORT_AI === "on"` **and** `TYPESAFE_API_KEY` is set **and** the daily cap is not reached. It never returns the key or any key-derived value. The import dialog calls it once on open; if it fails, treat as `ai: false`.

### 4.3 `POST /api/import/extract` (no AI, works without a key)
`multipart/form-data` with one `file`. Returns `{ text, sourceName, columns?, skipHeader?, lines, truncated }` or `{ error: "unreadable" | "too_large" | "unsupported" | "empty" }` with 4xx. Pure code (§2.2). Used by the file path of the dialog whether or not AI is on, so IM-02 is real even with no key.

### 4.4 `POST /api/import/interpret`
Request JSON: `{ text: string, sourceName: string, sourceKind: "paste" | "file", columns?: boolean, skipHeader?: boolean }`.
Validation (reject with 422 and a short code, never echo the text back): `text` is a non-empty string of at most 200,000 characters and 1,500 non-blank lines; each line is truncated to 400 characters for the model (the original stays in `rows[].sourceRef`); `sourceName` at most 120 characters; unknown fields rejected.
Guards (the app has no sign-in, so the route is otherwise open to anyone who can reach it `[INFER]`): same-origin check on `Origin`/`Sec-Fetch-Site`; in-memory sliding-window limit of 10 requests per minute per client IP; the daily cap above; `Cache-Control: no-store`.
Behaviour:
1. Run Stage 1 on the text (pure module) and collect ambiguous candidates. If there are none, return the rules result with `meta.mode: "rules"` and **no TypeSafe call**.
2. Build chunks (§2.4) and call TypeSafe with up to 4 chunks in flight, using a **mockable client factory**:
```ts
// lib/import-ai/client.ts
import { TypeSafeClient } from "@typesafe-ai/sdk"
export function makeClient(opts?: { fetch?: typeof fetch }) {
  return new TypeSafeClient({
    // apiKey: falls back to TYPESAFE_API_KEY [TYPESAFE sdk/.../TypeSafeClientConfig]
    defaultModel: process.env.TYPESAFE_IMPORT_MODEL ?? "jev-1.13.0",
    timeout: 10_000,                       // per attempt; SDK has no total retry budget, so the route adds its own (below)
    retry: { maxRetries: 2 },              // SDK defaults retry 408, 429, 500-599 with backoff [TYPESAFE .../RetryPolicy]
    logLevel: "warn",                      // never "debug": bodies are not redacted [TYPESAFE .../TypeSafeClientConfig]
    fetch: opts?.fetch,                    // tests inject a mock [TYPESAFE .../TypeSafeClientConfig: "for ... tests"]
  })
}
// per chunk
const res = await client.systemOne({ state, questions }, { signal: abortSignal })   // [TYPESAFE .../TypeSafeClient.systemOne]
// read: res.answers["k3"].choice / .probabilities / .confidence ; Noul value: verify the SDK property name from SystemOneResult types
```
3. A route-level `AbortController` aborts everything at **25 s** total. Any chunk failure after SDK retries makes the **whole** result fall back (a half-AI list would be hard to reason about): respond `200` with `{ result: null, fallback: "timeout" | "rate_limited" | "error" | "unavailable" }`.
4. Success response: `{ result: InterpretationResult }` where `InterpretationResult = { rows: ImportRowProposal[], unread: UnreadLineProposal[], meta: ImportInterpretationMeta }`. `ImportRowProposal` carries `{ name, description, categoryName, sourceRef, line, cue?, origin }` only.
5. Logging: log counts and durations only (`requests`, `candidates`, `inputTokens`, status codes). **Never** log `text`, lines, answers or the key.

### 4.5 Client orchestration (in the R2 dialog, see §5)
`proposeImportInterpreted(db, input, ctx)` is a **new store action** next to `proposeImport` (do not touch `confirmImport`): it takes `InterpretationResult` plus source info, computes `match` (duplicate vs library) and repeated-name exclusion exactly as `proposeImport` does, and creates the batch in `review` with `interpretation` meta. The deterministic path stays `proposeImport`.

## 5. UI integration (prototype layout unchanged; additions only)

Read for this design: `components/import/{import-dialog,import-input,import-review}.tsx` (R2, being edited) `[INFER: confirm the current names when building]`.

| Where | Change | Copy proposal (voice: professional, sentence case, no accuracy claims; strings go in `lib/copy/r2-import.ts` extension, not retyped) |
|---|---|---|
| Input step (`ImportInputStep`) | Below the two cards, one `Field` with a `ToggleSwitch` "Use AI to help read this list". Rendered **only** when `/api/import/status` says `ai: true`. Default off. `ImportSource` gains `useAi?: boolean`. | Label: "Use AI to help read this list". Helper: "The text of this list is sent to TypeSafe to help tell skills from headings and notes. Nothing else from Prism is sent. Nothing is added until you confirm." (disclosure, D6) |
| Busy state | Existing "Read the list" button gets `aria-busy` and "Reading the list" while the request runs. Cancel aborts the request. | "Reading the list" |
| Fallback | Any failure shows a `LocalBanner variant="info"` on the review step (not an error: the list was still read) and the batch has `interpretation.mode = "ai-fallback"`. | "AI reading was not available, so the list was read with the standard reader. Review it as usual." |
| Review info bar | When `mode === "ai"`, append one sentence to the existing info bar. No percentages, no "powered by", no accuracy words. | "AI helped read this list. Rows marked "Check this row" were less clear; look at those first." |
| Review table, Skill cell | A row with a cue shows `StatusBadge` (semantic, `tone="warning"`, size `sm`, label "Check this row") beside the name, with a visually hidden reason list for screen readers (never colour only). | Reasons: `lowSkillConfidence` "This line may not be a skill." · `maybeDetail` "This line may belong to the skill above it." · `categoryUncertain` "The category for this skill is less clear." · `rulesAndModelDisagree` "The heading and the content below it did not agree." |
| Filter | A `ToggleSwitch` "Show only rows to check" above the table, shown only when at least one cue exists (same idea as Melio's "Show only rows with errors" `[docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md M-1]`). | "Show only rows to check" |
| Counters | Definitions unchanged: **Found** = proposed skill rows (flagged ones included); **Will be created** = rows still included; **Possible duplicates** = rows matching the library; **Not read** = Stage-1 unread plus model-rejected lines. A cue never changes a counter. | n/a |
| Not read list | Model-rejected lines appear with their **original text** and the existing "Add as skill" action. New reason text for `uncertain`. | "Not clearly a skill" |

`[REQ IM-13]` note: **docs/ux/09 §1 currently prohibits the words "AI" and "smart"** in import copy as accuracy claims. That rule's intent is no accuracy claim; plainly disclosing that an AI service reads the text is necessary for the data-handling disclosure. The implementer must amend `docs/ux/09` (§1 and the S-08 "Prohibited" row) to: *"AI" may appear only to disclose that text is sent to an AI service; never with "smart", "automatically understood", accuracy figures or "powered by"* `[INFER, needs Romit's confirmation]`.

## 6. Test plan

### 6.1 Unit and contract tests (no key, no network)
- **Mocked client:** `makeClient({ fetch: mockFetch })` where `mockFetch` validates the outgoing request against the documented shape (`POST /v1/systemone`, Bearer header, `{state, model, questions}` with `type`/`instructions`/`criteria`, choice options at most 255) and returns a typed response `{ model, answers, usage }` built by a fixture function. This tests our questions and assembly without claiming anything about model quality.
- **Fixtures are SYNTHETIC** (hand-authored probabilities) in `tests/fixtures/typesafe-import/*.json`, each file headed `"synthetic": true`. They exercise thresholds; they are not evidence of accuracy. When a key exists, `scripts/typesafe-smoke.mjs --record` may replace them with recorded real answers, marked `"recorded": "<date>"`.
- **Four paste samples** (each with expected assembly):
  1. *Prototype sample list* (`SAMPLE_LIST` in `lib/copy/r2-import.ts`, includes `SECTION 2 — ADVANCED PROCEDURES` and one description-less line): rules settle the Section line (unread heading); model confirms the rest; expect 7 or 8 skills, 3 categories proposed, nothing created.
  2. *Heading plus duplicate*: `RESPIRATORY SKILLS` / items / one name equal to an existing library skill: category proposed, duplicate defaults to Skip, unchanged from today.
  3. *Junk lines*: `-----`, `12345`, `Page 3 of 12`, `Date: ______`: first two by rule (never reach the model), the last two model `other` -> Not read with original text; none becomes a skill (B3).
  4. *Messy numbered list*: `1) Foley catheter insertion`, `   (use sterile technique)`, `2. Wound care - clean and dress`, `3 Tracheostomy care`, `NOTES: see handbook`: numbering stripped by code; the parenthetical joins the Foley row's description via `d >= 0.70`; `NOTES:` is `other`/colon-heading.
- **Assembly tests (table-driven):** every threshold boundary (`0.80`, `0.50`, `0.60` confidence, `d` at `0.40/0.70`), rule-wins-over-model, category positional vs model, order independence of chunk results, chunk-size cap, heading-key uniqueness (`" (2)"`), option `none` last, 255-option cap, a request never exceeds the token estimate cap.
- **Route contract tests** (Vitest with `Request`/`Response`): `GET status` with no key -> `ai:false` and no key material in the body; `POST interpret` 422 on oversize/unknown fields/empty; same-origin rejection; with the mock: success shape; chunk failure -> `{ result: null, fallback }` and HTTP 200; timeout path via a never-resolving mock and a short budget; 401/429/529 mapped to `fallback` values; **assert the response body and logs never contain the input text or the key**; `extract` with tiny `.xlsx`/`.docx`/`.pdf` fixtures generated in the test, scanned-PDF fixture (no text) -> `unreadable`, `.xls` -> `unsupported`.
- **UI tests:** the AI switch is absent when status says `ai:false`; present and default off otherwise; with a mocked fetch the review shows cue badges with reasons for screen readers; "Show only rows to check" filters; fallback shows the info banner and the deterministic rows; Cancel aborts; counters unchanged by cues; nothing is created before **Create** (IM-05); axe (contrast on in the real-browser pass) clean.
- **Requirement coverage:** tests named with `IM-02, IM-04, IM-05, IM-07, IM-08, IM-13` so `pnpm coverage:req` keeps passing.

### 6.2 Real-browser pass
With the mock server mode (`SKILLS_IMPORT_AI=on` plus a test-only mock transport behind `TYPESAFE_MOCK=1`), run paste -> AI read -> cues -> confirm; then with AI off; then forced fallback. Screenshots beside the prototype import captures.

### 6.3 Optional live smoke script (skipped without a key)
`scripts/typesafe-smoke.mjs`: exits 0 with "no TYPESAFE_API_KEY, skipped" when unset. Otherwise runs the 10 lines below through the exact production question builders, in **both Choice option orders**, and prints a table: line, kind answer, `P(skill)`, `P(heading)`, `P(other)`, confidence, detail Noul, usage tokens, latency. It never writes a key or full responses to disk unless `--record`.
```
 1 Insert a peripheral IV catheter
 2 RESPIRATORY SKILLS
 3 Use the smallest gauge that allows adequate flow         (detail of line 1)
 4 Vital signs assessment: temperature, pulse, respiration, blood pressure
 5 Page 3 of 12
 6 Students must complete all items by week 10
 7 Section 2 - Advanced procedures
 8 3) Tracheostomy care
 9 Medication reconciliation
10 Date: ______
```
Use its output to set `IMPORT_THRESHOLDS`; record the date, model version and results in `docs/research/meetings/`.

### 6.4 Success metrics (TO BE MEASURED; no targets are claimed today)
Collect at least three real client skill lists (Word, Excel, PDF) from Sankalp, Aarti or Vishaka, labelled by a human as skill / heading / description / noise. Measure: precision and recall of `skill` vs `noise`; heading detection precision and recall; the share of rows cued; error rate among cued rows vs uncued rows (a cue is only useful if cued rows are measurably worse); fraction merged as detail that should not have been; fallback rate; p50 and p95 end-to-end latency; cost per 200 lines from `usage`; admin time saved against hand entry. Set go/no-go thresholds only after the first measurement.

## 7. Secondary use (design only, not built)
- **Near-duplicate skill names (IM-06):** code blocks candidates (normalised names sharing a token or within a small edit distance), then one Noul per pair: "Do `pair.a` and `pair.b` name the same practice skill?", state `{ pair: { a, b } }`. Fan out all pairs in one request. Output only adds a cue "Looks like an existing skill" on the duplicate decision control; the three decisions (skip, replace, keep both) stay the admin's. This is the entity-alignment shape in the cookbook list `[TYPESAFE cookbooks/entity_alignment: title and summary only, page not read]`.
- **Lab instructor names (SL-09):** a student-typed name vs roster entries with email domain as evidence: one Noul per roster candidate, state `{ typed: { name, email }, roster_entry: { name, email } }`; result is a hint only ("May be the same person as K. Larsen") feeding the existing similar-name hint and the merge control. No auto-merge.
- Both stay client-triggered through server routes under the same key, cap and privacy rules, and need their own measurement.

## 8. Risks and open questions for Romit
1. **API key and account:** none exists on this machine. Until one does, the build ships with AI unavailable and only the mocked path tested. Who creates the account, and is the key per environment?
2. **Data-handling approval:** the docs do not say whether API inputs are retained; they point to the Data Processing Agreement and Privacy Policy and mention "zero data retention" for enterprise customers `[TYPESAFE legal.md]`. Skill lists are programme documents, not student data, but a client file could contain preceptor names or other PII. Needs a decision, and ideally a read of the DPA by whoever owns vendor review, before real client lists are sent. The dialog's disclosure sentence is the user-facing half of that.
3. **Cost:** negligible at expected sizes `[INFER]`, but the route is unauthenticated in this prototype: the daily cap and rate limit are guards for demos, not a real access-control design. A production deployment needs sign-in in front of the routes.
4. **OD-12 stays open:** this design deliberately stops at names, descriptions and category. Proposing an evaluation model or criteria would be a different, riskier feature (the model would be inventing program policy) and needs Sankalp's decision first.
5. **Copy rule conflict (IM-13 vs disclosure):** see §5. Needs Romit's confirmation of the amended wording.
6. **Model behaviour risks `[TYPESAFE model-jaggedness/jev-1.13]`:** literal reading of the criteria; option-order lean (mitigated by the swap test); context rot (mitigated by chunking and small state); adversarial text inside an uploaded file could try to steer answers (blast radius is limited to typed probabilities plus cues, and every row still needs human confirmation); non-English lists are lower accuracy (show no special handling yet; measure).
7. **Extraction limits:** scanned PDFs and legacy `.xls`/`.doc` are unsupported; two-column PDFs may scramble order. These stay the unreadable-file state, not a silent guess.
8. **Version drift:** pinning `jev-1.13.0` keeps thresholds stable but needs a deliberate bump and re-measurement when TypeSafe releases a new model.
9. **Deployment constraint:** the app currently has no backend; adding route handlers means the demo is no longer a pure static export. Confirm that is acceptable for how this will be hosted `[INFER]`.

## 9. Build order for the implementation worker
1. Split `classifyByRules` out of `interpretSource` with zero behaviour change (existing import tests stay green).
2. Types (§3) and the new store action `proposeImportInterpreted`, with tests.
3. `lib/import-ai/*` (questions, chunking, assembly, thresholds) with mock-fetch tests and SYNTHETIC fixtures.
4. `/api/import/status`, `/extract` (exceljs, mammoth, unpdf: read each package's README first and confirm APIs), `/interpret`; `.env.example` and `.gitignore`.
5. Dialog wiring (switch, busy, fallback, cues, filter, counters) and copy; amend `docs/ux/09`.
6. Smoke script, real-browser pass, `pnpm coverage:req`, full gates (lint, tsc, tests, build).

## 10. Build record (2026-10-08)

### 10.1 What was built
| Piece | Where |
|---|---|
| Stage 1 rules, pure and shared (`classifyByRules`); the standard reader (`interpretSource`) now derives from it with identical behaviour (67 existing import tests unchanged) | `lib/import-ai/rules.ts`, `lib/store/actions/importing.ts` |
| Question builders (Choice kind, Noul detail, optional Choice category), chunking (25 candidates, token cap), assembly with `IMPORT_THRESHOLDS` | `lib/import-ai/{questions,chunk,assemble,thresholds,types}.ts` |
| Server orchestration with a mockable client, 4 requests in parallel, 25 s total budget, whole-result fallback | `lib/import-ai/interpret.ts`, `client.ts` |
| Routes: `GET /api/import/status`, `POST /api/import/extract` (code only), `POST /api/import/interpret` | `app/api/import/*/route.ts` |
| Guards: body validation, same-origin, 10 per minute per client, daily cap | `lib/import-ai/guards.ts` |
| Extraction: exceljs 4.4.0, mammoth 1.13.0, unpdf 1.8.1 (APIs read from their type declarations); zip-bomb check from the central directory, magic bytes, 4 MB, 200k characters, 1,500 lines, 15 s | `lib/import-ai/extract.ts` |
| Store: `proposeImportInterpreted`; `proposeImport` accepts an `interpretation` stamp (used for `ai-fallback`); additive types `ImportRowCue`, `ImportInterpretationMeta`, `UnreadLine.reason: "uncertain"` | `lib/store/actions/importing.ts`, `lib/domain/types.ts` |
| Dialog: "Use AI to help read this list" switch (shown only when `/status` says available, default off), reading state with abort on Cancel, spreadsheet/document/PDF upload via `/extract`, "Check this row" cue with visible reasons, "Show only rows to check", info and fallback banners | `components/import/*`, `lib/copy/import-ai.ts` |
| Live smoke: `pnpm smoke:typesafe` (skips without a key; runs both option orders; never prints the key) | `scripts/typesafe-smoke.mjs`, `scripts/typesafe-smoke.live.test.ts` |
| `.env.example`; `.gitignore` now ignores `.env*` except the example | `admin/` |

### 10.2 Differences from the design above (all `[INFER]`)
1. **Availability flag.** `SKILLS_IMPORT_AI=off` disables the assist; otherwise a configured key makes it available (the design required an explicit `on`). The admin still chooses per import with the switch, default off.
2. **Rule-made ALL-CAPS headings are audited** with the kind question only, so §2.5 point 5 (the `rulesAndModelDisagree` cue) is implementable; they get no detail or category question.
3. **Token estimates were measured, not guessed.** One live call: 10 candidates with all three questions used 6,201 input tokens per request, about 630 per candidate, roughly twice the §2.4 estimate. `chunk.ts` now uses 300 / 150 / 120 tokens for the kind / detail / category questions. A 25-candidate chunk estimates at 12.7k tokens (15.7k with the category question), under the 16k cap. 200 lines is still about 8 requests; at the measured size that is about 104k input tokens, about $0.0044 at the published rate `[INFER: published price, not an invoice]`.
4. **Bare leading numbers are not stripped.** "1)" and "2." numbering is removed by code as before; "3 Tracheostomy care" keeps its "3". Changing the standard reader's bullet rule would alter lines the rules already settle; the admin edits the name in the review.
5. **Spreadsheet commas.** In a spreadsheet with a header row, commas inside a cell are replaced by semicolons because the standard CSV reader splits on commas.
6. **Smoke is run through vitest** (`scripts/typesafe-smoke.live.test.ts`, node environment, skipped without `SMOKE=1` and a key), because the question builders are TypeScript with path aliases. `--record` is not implemented; fixtures stay SYNTHETIC.
7. **Test-only mock transport** `TYPESAFE_MOCK=1` (synthetic answers, no key) exists for the browser pass and tests; `.env.example` says never to set it in a deployment.
8. **Not built:** the secondary uses in §7 (near-duplicate names, lab instructor names).

### 10.3 Live smoke (real key, 2026-10-08): measured on 10 lines only, not general accuracy
Model reported by the SDK: `jev-1.13.0`. Two requests (one per option order), 10 candidates each, all three question types.

| # | Line | Kind answer (both orders) | P(skill) / P(heading) / P(other) | Confidence | Detail |
|---|---|---|---|---|---|
| 1 | Insert a peripheral IV catheter | skill | 1.00 / 0.00 / 0.00 | 1.00 | n/a |
| 2 | RESPIRATORY SKILLS | section_heading | 0.00 / 1.00 / 0.00 | 1.00 | 0.06 |
| 3 | Use the smallest gauge that allows adequate flow | skill | 0.75 (A), 0.81 (B) / 0.01 / 0.24 | 0.62 (A), 0.71 (B) | **0.79** |
| 4 | Vital signs assessment: temperature, pulse, respiration, blood pressure | skill | 0.96 / 0.00 / 0.04 | 0.94 | 0.08 |
| 5 | Page 3 of 12 | other | 0.00 / 0.00 / 1.00 | 1.00 | 0.05 |
| 6 | Students must complete all items by week 10 | other | 0.00 / 0.01 / 0.99 | 0.98 | 0.12 |
| 7 | Section 2 - Advanced procedures | section_heading | 0.00 / 0.99 / 0.01 | 0.98 | 0.05 |
| 8 | 3) Tracheostomy care | skill | 1.00 / 0.00 / 0.00 | 1.00 | 0.07 |
| 9 | Medication reconciliation | skill | 0.92 / 0.00 / 0.08 | 0.88 | 0.05 |
| 10 | Date: ______ | other | 0.00 / 0.00 / 1.00 | 1.00 | 0.19 |

- **Option-order lean:** 0 of 10 disagreements between the two orders (the choice never changed). The one borderline line (#3, a detail sentence) moved from 0.75 to 0.81 in P(skill) and from 0.62 to 0.71 in confidence.
- **Cost and speed:** 12,402 input tokens for the two requests; 438 ms and 262 ms per request; 706 ms for both.
- **Threshold tuning: no change.** Every clear case sits far from every threshold; the only borderline line (#3) is a detail sentence that the Noul (0.79, above `detailMerge` 0.70) joins to the skill above before the kind verdict matters. Ten lines cannot tune thresholds; the numbers stay examples until measured on real client lists (§6.4).
- **Real-browser check with the live key** (production build, `admin/.verify/typesafe/run.mjs`, 24 of 24 checks): the same 11-line messy list read with AI off gave 8 rows (junk such as "Page 3 of 12", "Students must complete all items by week 10" and "Date: ______" became rows); with AI on gave 4 rows, with the notes, page furniture and junk in Not read with their original text, the headings as 2 proposed categories, "Use a closed system when possible" joined to Oxygen therapy as its description, and the end-to-end read took 850 ms. A forced fallback response (the interpret route intercepted in the browser) showed the fallback banner and the standard reader's rows; with no key the switch was absent. Uploaded .xlsx, .docx and text-layer .pdf were read by code; a scanned PDF reported "No text could be read". Axe with contrast on and the console were clean.

### 10.4 Still for Romit
Data retention (§8 item 2) and the `docs/ux/09` wording amendment (§5) are `[INFER]` and need confirmation; the routes are unauthenticated demo routes with demo guards; real client lists are needed to measure precision (§6.4); route handlers mean the app is no longer a pure static export (§8 item 9).
