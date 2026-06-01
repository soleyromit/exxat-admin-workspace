---
type: meeting
date: 2026-05-27
product: exam-management, pce
participants: [Himanshu Suthar (DS author), Darshan, Nipun, Romit]
source: granola
granola_id: ae66b50f-2bbc-4981-ab13-8192b46bf167
---

# Design System Adoption — Navigation, Folder Structure, and Product Consistency with Himanshu

**Date:** 2026-05-27 · **Time:** 9:29 AM EDT
**Context:** First detailed design system review between Romit and Himanshu since Himanshu's architectural update to the DS. Himanshu noticed inconsistencies between the DS patterns and Romit's current product screens. Darshan (engineering) also on the call.

## Topics covered

1. DS is now a package — installable via npm, not just a GitHub file reference
2. DS ships with AI skills/agents — reduce AI tool context usage by ~50%
3. Navigation inconsistencies — Romit's custom folder panel vs. DS secondary navbar component
4. Navigation label truncation rule — labels must never be truncated in navigation
5. Product brand colors — each product has its own color (leadership-level decision)
6. KPI/metrics sections — collapsible, hidden by default acceptable
7. "Setup as tab" pattern critique — don't replicate Prism's structural mistakes
8. Structural architecture — apps should live inside DS (or install as package) to avoid context overflow
9. Design communication gap — Himanshu commits to posting updates in group channel
10. Design team sync scheduled for following week

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_DS01 | **Each product has its own brand color (leadership decision).** Prism = pink, ExactOne = indigo. Romit must define colors for exam-management and PCE. Himanshu: "each product will have its own color… I've just created something and picked some random color, but yeah, please [pick yours]." | All products | — |
| D_DS02 | **Navigation labels must never be truncated.** Himanshu rule: navigation is an important wayfinding element — users must always see the exact destination. Truncation is explicitly banned in navigation contexts. "I've also put a rule that you should never, in navigation related cases, have a truncated [label]." | All products | — |
| D_DS03 | **Secondary navbar component is the canonical pattern for nested navigation levels.** DS has had a collapsible secondary navbar since day one (primary → secondary → tertiary). Romit's custom folder panel approach should eventually be replaced by this component. The custom panel is acceptable short-term while product priorities take precedence. | All products | — |
| D_DS04 | **DS is now an installable npm package.** Himanshu restructured DS from a GitHub-only repo to a publishable package. Recommended usage: install the package inside each app folder rather than referencing from outside the DS monorepo. The previous approach (monorepo outside DS → external reference) causes context overflow in AI tools because the full DS gets pulled into context. "It could be possible that context is getting over because it is trying to put whole design system in context." | All products | — |
| D_DS05 | **Himanshu commits to posting major DS updates in the group channel.** Romit had not been notified of the architectural changes. Going forward: new components, new views, behavioral changes → group post. Changelogs also available on the DS website. | DS governance | — |
| D_DS06 | **KPI sections: collapsible and hideable is the right pattern.** If PM says "no metrics for now," implement the KPI section but hide it by default (user can unhide). Table headers stay sticky as page scrolls — user retains spatial context without KPI section consuming permanent real estate. | All products | — |
| D_DS07 | **"Setup" as a primary nav tab is a known Prism mistake — do not replicate.** Himanshu: "having 'setup' as one tab doesn't make sense at all… it's more like a setting or configuration." This aligns with T73 (comprehensive single-page config) — setup belongs as a settings/config surface, not a top-level navigation item. | exam-management, PCE | — |

---

## Verbatim quotes

> "Each product will have its own color. I think I've informed you during that meeting also that that's what leadership have defined — Prism will be pink, then ExactOne will be indigo, and you can pick your own color." — Himanshu

> "I've also put a rule that you should never, in navigation related cases, have a truncated [label]. It's an important way for you to navigate — you should know exactly where you are navigating." — Himanshu

> "This sort of navigation [secondary navbar] was always there from day one… Instead of creating a new [custom panel], you could have used the secondary navbar." — Himanshu

> "I think what you have done is you have created, like, outside the design system, you have created things. And then you are asking AI tool to refer to that design system. I think that could be the issue why it was hallucinating — it will try to put the whole design system in context, and since your context is full all the time, it will start hallucinating." — Himanshu

> "Having 'setup' as one tab doesn't make sense at all. Setup is like a one time thing. It's more like a setting or the configuration. Since it's a new product, we can think about removing all this issues with it." — Himanshu

> "I've added a [skill] that reduces token usage by 50%. So when you install the package, it will come with that skill as well." — Himanshu

> "If you feel [the KPI section] adds no value in my workflow, you can say hide that whole KPI section… when you scroll, that whole part scrolls and you will start utilizing the whole page." — Himanshu

> "We should now finalize design, and then only will we do any development… even though there is some level of design available for course page and student accommodation page, we have not started any work because we are waiting for PM team to confirm." — Darshan

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/exam-management/admin/app/(app)/layout.tsx` + globals.css | Current theme = `theme-one`. No product-specific color yet. | 🟡 T77 — define exam-management brand color |
| `apps/pce/admin/app/(app)/layout.tsx` + globals.css | Current theme = `theme-one`. No product-specific color yet. | 🟡 T55 (PCE) — define PCE brand color |
| `apps/exam-management/admin/components/app-sidebar.tsx` | No secondary navbar component in use. Custom sidebar + collapsible items. | WATCH — DS secondary navbar as future migration path (D_DS03) |
| `apps/pce/admin/components/app-sidebar.tsx` | No secondary navbar component in use. | WATCH — same as above |

---

## Design tasks generated

| Product | Task | Priority | Notes |
|---|---|---|---|
| exam-management | T77 — Define product brand color | P2 | Pick brand color (non-pink, non-indigo per D_DS01). Apply to `theme-one` extension or product-specific token. Design direction needed before engineering applies. |
| PCE | T55 — Define product brand color | P2 | Same as above for PCE. |
