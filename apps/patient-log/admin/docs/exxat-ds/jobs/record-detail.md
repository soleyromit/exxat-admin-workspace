# Job: Review a record's full state

> **Surface type:** Standalone route OR side-panel sheet.
> **Examples in product:** Student profile, Placement record, Library item,
> Site profile, Team member profile.

## 1. The job

The user lands on a single record and needs to **understand its current
state** in order to **decide what to do next**. Decisions can include:
contact someone, edit a field, change status, place / unplace, archive,
follow up later, or simply confirm correctness before another action.

This job is **not**: edit (separate flow), bulk action (lives on the list),
configure workspace settings.

## 2. When this job applies

- The record has > ~5 displayable fields.
- The user reaches it from a list, search, deep link, or notification.
- The user's next action depends on the record's state (status, ownership,
  data freshness).
- The record may have children (placements, attachments, comments) that
  matter to the decision.

## 3. Pattern: route vs sheet vs inline

| Pattern | When | DS comp |
|---------|------|---------|
| **Standalone route** (`/students/[id]`) | Deep link from email / notifications / reports; user may keep tab open; record has > 10 fields | `PrimaryPageTemplate` + `PageHeader` |
| **Sheet over hub** | User is triaging from a list and may open many records in sequence | `Sheet` over `ListPageTemplate` |
| **Inline expansion** (`HoverCard`) | Read-only quick preview; < 5 fields | `HoverCard` on row hover |

Pick **route** by default. Pick **sheet** if the user's primary path is
triaging from a list and they typically open many in a single session.

## 4. Information architecture

```
┌─ SiteHeader (breadcrumb only) ──────────────────────────────────┐
│  Dashboard › Students › Jordan Lee                              │  ← ancestors + title (P1, P2)
└──────────────────────────────────────────────────────────────────┘
┌─ Identity row ──────────────────────────────────────────────────┐
│  [Avatar] Jordan Lee                              [Edit] [⋯]    │  ← name, ID, primary action + overflow
│          STU-2026-1042 · jordan.lee@example.edu                 │
└──────────────────────────────────────────────────────────────────┘
┌─ Status row (above the fold, P13) ──────────────────────────────┐
│  ● Active   ✓ Compliant   ⊕ Placed at Sinai                     │
└──────────────────────────────────────────────────────────────────┘
┌─ Field groups (2-col card grid) ────────────────────────────────┐
│  Program     │  Academic                                         │
│  Placement   │  Compliance                                       │
└──────────────────────────────────────────────────────────────────┘
┌─ Activity timeline (M7, optional) ──────────────────────────────┐
│  Today · Compliance status updated by Maria                      │
│  Tue · Placement assigned · Sinai Hospital                       │
└──────────────────────────────────────────────────────────────────┘
```

### Layers, in priority order

1. **Identity** — name, system ID (mono), avatar, primary contact link.
2. **Status** — every status badge that drives a decision; visible without
   scrolling (P13).
3. **Field groups** — 2-column card grid by default. Group by **conceptual
   coherence** (Program / Academic / Placement / Compliance), not by table
   structure.
4. **Activity timeline** — if the record changes over time and the history
   matters (M7).
5. **Related lists** — placements, comments, attachments — if they exist for
   this entity.

### When to use section tabs

- **Don't tab** if total field count is ≤ ~20 and groups are ≤ 4. Single
  scroll is faster.
- **Do tab** if the record has rich children (placements history,
  supervisors, contracts, conversation threads) and the user typically
  deep-dives into one section.
- Tabs use `Tabs` + `TabsList` `w-fit` `variant="line"` — never full-width
  (`exxat-tabs-chrome.mdc`).

## 5. Navigation — the way back

**Exactly one path back** (P1).

| Reached from | Way back |
|--------------|----------|
| List route | `SiteHeader` breadcrumb (`Students`) |
| Deep link / email | `SiteHeader` breadcrumb to the canonical parent |
| Sheet from hub | `Sheet` close (X / Esc) |
| Notification | Breadcrumb to canonical parent (not "Back to notification") |

**Never** add a body-level "Back to <parent>" button when the breadcrumb is
present (`exxat-breadcrumbs-no-back.mdc`).

## 6. Actions

| Slot | Component | What goes here |
|------|-----------|----------------|
| Primary | `PageHeader.primaryAction` (`Button variant="default" size="lg"`) | The single most common next action — "Edit", "Place", "Approve" |
| Overflow | `Button variant="outline" size="icon-lg"` → `DropdownMenu` | Export, Archive, Duplicate, Share, dangerous-but-rare actions |
| Inline | Icon-only buttons with tooltip | Copy email, dial phone, open site |
| Status flip | `Sheet` or inline `Select` | Status changes that are audited (multi-step) |

Exactly **one** filled CTA per surface (P3).

## 7. States

| State | What to show |
|-------|--------------|
| **Loading** | `Skeleton` matching the IA shape (identity → status → cards) — M9 |
| **Empty / not found** | `EmptyState` + "Return to <list>" outline button |
| **Error** | `LocalBanner` inside the body; identity row still renders if available |
| **Stale data** | Subtle "Updated <relative>" in identity meta |

## 8. Accessibility

- One `<h1>` (P2) — typically `PageHeader.title`.
- Status row is a `role="list"`; each badge is `role="listitem"` (already in
  `ListHubStatusBadge`).
- Inline mailto / tel links are real `<a>`s, not buttons.
- Tab order: breadcrumb → identity → primary action → overflow → status →
  fields → activity → related.
- Icon-only actions carry `aria-label` + a tooltip with the same text.

## 9. Modern SaaS analogues

| Product | What to study |
|---------|---------------|
| **Linear** issue detail | Identity + status + properties + activity; sheet variant for triage |
| **Stripe Dashboard** customer / charge | Identity + status badges + grouped data + audit log |
| **Notion** page-as-database row | Inline editing (M5), property panel |
| **Plain / Pylon** ticket | Conversation-as-document for support records |

Cite these in the design brief by name + Mx codes:
`Linear issue detail (M1, M4, M7)`.

## 10. Anti-patterns

| Anti-pattern | Use instead |
|--------------|-------------|
| `<h1>` + `PageHeader title` + breadcrumb leaf all repeating the name | One carrier: `PageHeader title` + ancestors-only breadcrumb (P2) |
| "Back to <parent>" button alongside the breadcrumb | Breadcrumb only (P1) |
| Two filled CTAs in the header ("Save" + "Submit") | One filled, others outline (P3) |
| Status only in detail (hidden on list / breadcrumb count) | Status visible everywhere the record appears (M4) |
| Status communicated by color only | Color + icon + label (`ListHubStatusBadge`) |
| Full-width section tab bar | `Tabs` `w-fit` (`exxat-tabs-chrome.mdc`) |
| Centered modal for "Edit name" | Inline edit (M5) or `Sheet` (M3) |
| Spinner overlay for initial load | `Skeleton` matched to IA (M9) |
| Activity timeline buried in a tab nobody opens | Show inline below cards, or remove it |
| New shared "ProfileHero" component invented per entity | Compose: `PageHeader` + identity-row primitives (P8) |
| `toast()` on save | Inline button label change + `LocalBanner` if persistent |

## 11. Quick checklist (post-build audit)

- [ ] Breadcrumb shows ancestors + title; no duplicate name.
- [ ] No body "Back to <parent>" button.
- [ ] One H1.
- [ ] Status row visible without scrolling.
- [ ] One filled primary action; overflow has the rest.
- [ ] 2-col card grid for fields (or tabs if ≥ 4 sections / 20+ fields).
- [ ] `Skeleton` matches the IA on load; empty state designed for "not found".
- [ ] Tab order: breadcrumb → identity → primary → overflow → fields.
- [ ] All status chips use `ListHubStatusBadge` + `lib/list-status-badges.ts`.
- [ ] No `toast()`, no Vaul, no pixel-copy of legacy.

## 12. Reference

- [`../../../.cursor/skills/exxat-senior-ux/SKILL.md`](../../../.cursor/skills/exxat-senior-ux/SKILL.md)
- [`../../../.cursor/rules/exxat-ux-discovery-protocol.mdc`](../../../.cursor/rules/exxat-ux-discovery-protocol.mdc)
- [`../../../.cursor/rules/exxat-ux-principles.mdc`](../../../.cursor/rules/exxat-ux-principles.mdc)
- [`../../../.cursor/rules/exxat-breadcrumbs-no-back.mdc`](../../../.cursor/rules/exxat-breadcrumbs-no-back.mdc)
- [`../../../.cursor/rules/exxat-tabs-chrome.mdc`](../../../.cursor/rules/exxat-tabs-chrome.mdc)
- [`../modern-saas-patterns.md`](../modern-saas-patterns.md)
- [`../blueprints/page-header.md`](../blueprints/page-header.md)
- [`../component-selection-guide.md`](../component-selection-guide.md) §1
