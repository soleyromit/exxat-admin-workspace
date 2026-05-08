# AI Pattern Rubric

> Workspace-level AI patterns. Binds workspace ADR-005 (AI-first thinking) + per-product `ai-layer.md` storytelling files.
> Per-feature AI lives in product-level docs; this rubric defines the cross-cutting shapes.

---

## The four AI patterns

| Pattern | When to use | Pattern file |
|---|---|---|
| **AI vs Pulled lane** | Any analytics surface mixing computed and AI-generated content | `docs/patterns/viz/ai-vs-pulled-lane.md` |
| **AI suggestion + accept/edit/clear/type-own** | AI-generated content the user can validate (action plans, generated questions, suggested tags) | (P4) `ai-suggestion-accept-edit.md` |
| **Confirm-before-write intake** | AI-driven capture from external context (Granola transcripts, decisions, glossary) | `.claude/skills/intake/SKILL.md` |
| **Right-rail copilot panel** | Authoring surfaces where AI critiques each component (question authoring, template builder) | (P4) `right-rail-copilot.md` |

---

## Trust contract rules (workspace-wide)

Per workspace ADR-005:

| Rule | Why |
|---|---|
| AI recommends, human decides | Aarti's foundational principle. AI cannot fabricate completeness claims. |
| Pulled vs AI visually distinguished | Users must know which content is computed vs generated. Trust is asymmetric. |
| Provenance always cited | "Based on 47 open-text responses · 6 themes" — never "AI says X" with no source |
| Edit affordance mandatory when content is editable | Accept / Edit / Clear / Type-own. Never auto-apply. |
| Per-question / per-suggestion validation, not bulk | Faculty are conservative. ~5–10% accept rate is normal for new questions. |
| AI provenance on the entity | Every record carries source = pulled / AI-generated / manual |
| No "explain why" in Phase 1 | Defer to Phase 2 |

## AI affordance — exact spec

```tsx
<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
  <i
    className="fa-light fa-sparkles"
    style={{ color: 'var(--brand-color)' }}
    aria-hidden="true"
  />
  <span>AI insight</span>
</div>
```

Don't deviate. Don't use `fa-star-christmas` (reserved for Leo). Don't use raw colors.

## Per-product AI layers

Each product's per-feature AI lives in `apps/<product>/docs/storytelling/ai-layer.md`. The workspace patterns above are the *shapes*; the per-product file specifies what AI does for each feature.

## Anti-patterns

- ❌ AI content visually identical to pulled-data content (ADR-005 violation)
- ❌ Mixing pulled metrics inside the AI lane card
- ❌ Using `fa-star-christmas` for AI (reserved for Leo)
- ❌ "Powered by AI" footer without per-card affordance (too easy to miss)
- ❌ AI content without source citation (users can't validate)
- ❌ Auto-applying AI suggestions without explicit accept (ADR-005 requires accept/edit/clear/type-own)
- ❌ AI editorialization ("This is concerning") — describe themes, don't judge
- ❌ Forcing pre-tagged taxonomies on user-authored content (Aarti — let it be dynamic)

## Pattern catalogue

P3 (this round):
- `docs/patterns/viz/ai-vs-pulled-lane.md` (workspace-shared; lives in viz/ for historical reasons)

P4 (later):
- `ai-suggestion-accept-edit.md` — accept/edit/clear/type-own affordance
- `right-rail-copilot.md` — authoring critique panel
- `bulk-import-confidence-marker.md` — high/low/needs-attention chips on imported content
