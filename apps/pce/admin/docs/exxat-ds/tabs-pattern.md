# Exxat DS: Tabs (peer view switcher)

**Audience:** engineers + AI agents. **Binding rule:** [`.cursor/rules/exxat-tabs-chrome.mdc`](../../.cursor/rules/exxat-tabs-chrome.mdc).

`Tabs` switch between **peer views** on one record or surface. They are **not** sequential steps (use `Wizard`) and **not** hub view switching (use `ViewSegmentedControl`).

**Job doc:** [`jobs/record-detail.md`](./jobs/record-detail.md). **Primitive:** `packages/ui/src/components/ui/tabs.tsx`.

---

## When to use

| Surface | Use |
|---------|-----|
| Record detail sections | Overview, Academics, Placements under one H1 |
| Token doc namespaces | Primary pill tabs + optional count badge |
| In-card panels | `variant="line"` for chart vs trend inside ChartCard |
| Related peer content | Sections users compare without changing URL |

**Modern analogues:** Height view tabs (M1, M4); Linear issue detail (M1, M4). **Principles:** P1, P2, P3, P6, P13.

---

## When NOT to use

| Job | Use instead |
|-----|-------------|
| Hub table / board / dashboard views | `ViewSegmentedControl` on `ListPageTemplate` |
| Sequential create with completed steps | `Wizard` |
| Theme or 2-5 mode chips | `ButtonSegmentedControl` |
| Six or more infrequent filters | `DropdownMenu` icon trigger |

---

## Overflow

When tabs exceed the viewport, wrap `TabsList` in `TabsListScrollRegion` (`controlsLayout="group-end"`). See [`horizontal-scroll-pattern.md`](./horizontal-scroll-pattern.md).

---

## Composition example

```tsx
<Tabs defaultValue="overview" className="w-full">
  <TabsListScrollRegion ariaLabel="Student sections">
    <TabsList variant="line" className="w-fit">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="placements">Placements</TabsTrigger>
    </TabsList>
  </TabsListScrollRegion>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="placements">...</TabsContent>
</Tabs>
```

---

## See also

- [`wizard-pattern.md`](./wizard-pattern.md)
- [`horizontal-scroll-pattern.md`](./horizontal-scroll-pattern.md)
- [`jobs/record-detail.md`](./jobs/record-detail.md)
