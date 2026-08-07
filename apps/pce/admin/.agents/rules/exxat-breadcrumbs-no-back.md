---
description: Do not duplicate parent navigation with a Back control when breadcrumbs exist
activation: glob
globs: {components,lib,src}/**/*.{tsx,ts}
---

<!-- Synced from .agents/rules/exxat-breadcrumbs-no-back.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — breadcrumbs and back navigation

## MUST NOT

When a page uses **`SiteHeader`** with **`breadcrumbs`** (a visible trail such as Patterns → Library → current title), **do not** add a **“Back to …”** link or button in the page body that goes to the same parent as the breadcrumb segment. Breadcrumbs already provide hierarchy and one-click navigation up the tree.

**Do not** put the **current page title** in `breadcrumbs` when you also pass `title` to **`SiteHeader`**. `PageBreadcrumbTrail` appends `currentPage={title}` automatically. Duplicating the leaf (e.g. Components → Toggle Switch → Toggle Switch) breaks the trail.

## MAY

- Rely on **`SiteHeader`** breadcrumbs only for returning to parent routes.
- Use a **single** explicit back affordance on flows that **omit** breadcrumbs by design (e.g. full-screen step, modal route) where product copy requires it.

## SiteHeader breadcrumb overflow

When the header variant shows a multi-segment trail (`PageBreadcrumbTrail` **`variant="header"`**), wrap the list in **`HorizontalScrollRegion`** with **`alignEnd`** and **`ariaLabel="Breadcrumb"`** so long paths scroll horizontally with a grouped `[← | →]` control — **`.agents/rules/exxat-horizontal-scroll.md`**, **`components/page-breadcrumb-trail.tsx`**.

## See also

- `components/site-header.tsx`
- `components/page-breadcrumb-trail.tsx`
- `components/templates/primary-page-template.tsx`
