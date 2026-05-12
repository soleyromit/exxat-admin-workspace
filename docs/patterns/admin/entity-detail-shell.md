# Entity-Detail Shell (Admin)

**Pattern ID:** `ADMIN-003`
**Binds rules:** A11Y-001, DS-006, DS-008
**Question answered:** What's the canonical layout for an admin `/<entity>/[id]/` detail page?

**Reference:** diagnostic findings in [`docs/governance/component-depth-audits/tabs.md`](../../governance/component-depth-audits/tabs.md) §"exam-mgmt: reference patterns" #2 and §"Recommended next 2 fixes" #2.

This doc is **forward-looking for PCE**. Exam-mgmt has one canonical implementation. PCE admin has **zero** `[id]` detail routes today (`admin/courses`, `admin/faculty`, etc. are list-only). When the first PCE detail page ships, it must adopt this shell verbatim — otherwise 11× admin entities will diverge.

---

## When to use

Any admin `app/(app)/<entity>/[id]/page.tsx` route showing **one record** with **2-4 sibling content panels** (Overview / Children / Related / Settings).

- **<2 panels** → single scrolling page, skip Tabs (e.g. PCE `templates/[id]/page.tsx`).
- **>4 panels** → consider whether some are really sub-routes; otherwise use `Select` (overflow risk).
- **Panels share data scope but show different viz** → still Tabs (e.g. `analytics-client.tsx` Overview / Per-question / Curving / Content-areas). Same shell.

## The shell

```
┌────────────────────────────────────────────────────────────┐
│ SiteHeader  (h1 = entity name, breadcrumbs)                │
├────────────────────────────────────────────────────────────┤
│ PageHeader  (title, subtitle, actions slot)                │
├────────────────────────────────────────────────────────────┤
│ TabsList variant="line" className="gap-0"                  │
│  ├ Trigger 1 [icon] Label  <Badge count>                   │
│  ├ Trigger 2 [icon] Label  <Badge count>                   │
│  └ Trigger N ...                                           │
├────────────────────────────────────────────────────────────┤
│ TabsContent (flex-1 overflow-auto p-6)                     │
│  ... panel-specific composition                            │
└────────────────────────────────────────────────────────────┘
```

Wrap everything inside `Tabs` so the `TabsList` lives in the page chrome, not the scrolling content area.

## Canonical example

`apps/exam-management/admin/app/(app)/courses/[id]/course-detail-client.tsx:167-251`

```tsx
<>
  <SiteHeader title={course.name} breadcrumbs={breadcrumbs} />
  <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-hidden">
    <PageHeader title={course.name} subtitle={subtitle} actions={headerActions} />

    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
      <div className="px-6 border-b border-border shrink-0">
        <TabsList variant="line" className="gap-0">
          <TabsTrigger value="assessments" className="gap-2">
            <i className="fa-light fa-clipboard-list text-xs" aria-hidden="true" />
            Assessments
            {(pendingReview > 0 || liveCount > 0) && (
              <span className="text-muted-foreground text-xs font-normal">
                {courseAssessments.length}
              </span>
            )}
          </TabsTrigger>
          {/* ...Students / Accommodations / Mapping */}
        </TabsList>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <TabsContent value="assessments" className="m-0">
          <AssessmentsTab ... />
        </TabsContent>
        {/* ...sibling TabsContent blocks */}
      </div>
    </Tabs>
  </div>
</>
```

Load-bearing details (all six are mandatory for the shell to read as canonical):

1. **Controlled Tabs.** `value={activeTab} onValueChange={setActiveTab}` — lets other surfaces drive the active panel (e.g., `onJumpToTab={setActiveTab}` at `course-detail-client.tsx:244`).
2. **`variant="line"`, never default pills.** All 4 production Tabs surfaces in exam-mgmt use line (tabs.md adoption snapshot); pills are demo-only.
3. **`className="gap-0"` on TabsList.** Drops the 4-px line-variant gap so triggers align flush.
4. **`TabsList` wrapped in `<div className="px-6 border-b border-border shrink-0">`** — page-chrome divider, not a per-trigger override.
5. **Content area `flex-1 overflow-auto p-6`** — only the panel scrolls; TabsList + PageHeader stay sticky.
6. **Icon-prefixed labels.** `fa-light` `text-xs` + `gap-2` on the trigger — 4th scannable axis alongside label + count + active underline.

## Count-chip rendering

DS Tabs ships **no first-class slot for tab counts** (tabs.md §"Library reality"). Pattern: a plain inline span inside the trigger.

```tsx
<TabsTrigger value="students" className="gap-2">
  <i className="fa-light fa-users text-xs" aria-hidden="true" />
  Students
  <span className="text-muted-foreground text-xs font-normal">{courseStudents.length}</span>
</TabsTrigger>
```

Reference: `course-detail-client.tsx:192-196`.

**Trade-off:** Badge's rounded pill geometry fights the line-variant underline. **Spans for neutral counts; Badges for attention counts** (e.g., the red attention chip on "Per-question" when `negativeDiscCount > 0` — `analytics-client.tsx:159-209`).

## Anti-patterns (with file:line of resolved cases)

- **Separate route for what's really a panel** (open). `apps/pce/admin/app/(app)/surveys/[id]/page.tsx` + `surveys/[id]/responses/page.tsx` — Responses is reachable only via a breadcrumb hop. Tabs.md §"PCE: where Tabs would fit" recommends merging into Overview / Responses / Instructors / Settings tabs.
- **Stacked cards instead of tabs for ≥3 distinct panels.** Same survey detail (lines 73-218) — 4 stacked cards in a single `max-w-2xl` scroll. Loses keyboard nav.
- **Default pills variant on entity detail.** Pills read as a top-level destination switcher (Settings page #1). Line variant reads as sub-views of one record.
- **Vertical Tabs for entity detail.** DS supports `orientation="vertical"`, but no production usage. Reserve for sidebar-style sub-nav inside a panel.

## API surface

`Tabs` exports from `@exxat/ds/packages/ui/src` — for entity detail, the locked configuration is:

```ts
Tabs        value / onValueChange       (controlled)
TabsList    variant="line"  className="gap-0"
TabsTrigger className="gap-2"           (per trigger)
TabsContent className="m-0"             (parent owns padding)
```

Source: `exxat-ds/packages/ui/src/components/ui/tabs.tsx` (90 LoC).

## Open questions / future considerations

- **Neutral vs attention count chips.** Codify the threshold rule before a second consumer ships an inconsistent variant — today only `analytics-client.tsx:159-209` upgrades neutral → attention (red Badge when `negativeDiscCount > 0`).
- **Deep-linkable tab.** `activeTab` is local state. URL `?tab=students` persistence is deferred until faculty start sharing links to specific tabs.
- **TabsList badge slot.** If 3+ products ship entity detail with count chips, propose a DS-level `TabsTrigger badge` prop to absorb the inline span pattern.
- **Mobile collapse.** 4 triggers fits ~720px; <600px line-variant labels truncate. No mobile fallback today.
- **First PCE detail page.** When `apps/pce/admin/app/(app)/admin/courses/[id]/page.tsx` (or any sibling) ships, lift this shell verbatim. Do NOT reinvent — that's what this doc exists to prevent.
