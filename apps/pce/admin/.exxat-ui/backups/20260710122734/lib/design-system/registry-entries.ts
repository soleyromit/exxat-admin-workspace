/**
 * Full component / pattern inventory — keep in sync when adding primitives.
 *
 * After adding a file under packages/ui/src/components/ui/, run:
 *   pnpm ds:registry:check
 */

import type { DesignSystemRegistryEntry } from "@/lib/design-system/registry-types"

const UI = "@exxatdesignux/ui/components/ui"
const DV = "@/components/data-views"
const DT = "@exxatdesignux/ui/components/data-table"

function c(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "component", status: "skeleton", ...partial }
}

function p(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "pattern", status: "skeleton", ...partial }
}

function cell(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "component", status: "skeleton", ...partial }
}

function tpl(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "template", status: "skeleton", ...partial }
}

function ex(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "example", status: "skeleton", ...partial }
}

function tok(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "token", status: "catalog", ...partial }
}

function rule(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "rule", status: "skeleton", ...partial }
}

function skill(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "skill", status: "skeleton", ...partial }
}

function agent(
  partial: Omit<DesignSystemRegistryEntry, "tier" | "status"> &
    Partial<Pick<DesignSystemRegistryEntry, "status">>,
): DesignSystemRegistryEntry {
  return { tier: "agent", status: "skeleton", ...partial }
}

/** All registry rows — sorted at export. */
export const DESIGN_SYSTEM_REGISTRY_ENTRIES: DesignSystemRegistryEntry[] = [
  // ── Design tokens (categories → Tokens & themes hub) ─────────────────────
  tok({ slug: "tokens-colors", name: "Color tokens", group: "Categories", description: "Two-layer color system: L1 semantic OKLCH values, then L0 --exxat-* alias slots.", importPath: "packages/ui/src/globals.css", sourcePath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=color" }),
  tok({ slug: "tokens-aliases", name: "Alias tokens (L0)", group: "Categories", description: "L0 --exxat-* slots that point at L1 semantic colors — step 2 on Color tokens.", importPath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=alias", parentSlug: "tokens-colors" }),
  tok({ slug: "tokens-gradients", name: "Gradient tokens", group: "Categories", description: "Brand and surface gradient stops.", importPath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=gradient" }),
  tok({ slug: "tokens-radius", name: "Radius tokens", group: "Categories", description: "Corner radius scale (--exxat-radius-*).", importPath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=radius" }),
  tok({ slug: "tokens-size", name: "Size tokens", group: "Categories", description: "Spacing and dimension scale.", importPath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=size" }),
  tok({ slug: "tokens-shadow", name: "Shadow tokens", group: "Categories", description: "Elevation and shadow presets.", importPath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=shadow" }),
  tok({ slug: "tokens-typography", name: "Typography tokens", group: "Categories", description: "Font size, line height, and type scale (12px floor).", importPath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=typography" }),
  tok({ slug: "tokens-motion", name: "Motion tokens", group: "Categories", description: "Transition duration and easing.", importPath: "packages/ui/src/globals.css", routeSuffix: "/tokens-themes?category=transition" }),
  tok({ slug: "tokens-data-table", name: "Data table tokens", group: "Component tokens", description: "Row, header, group, and selection chrome (--dt-*).", importPath: "packages/ui/src/globals.css", sourcePath: "packages/ui/src/globals.css", keywords: "dt-row dt-header" }),
  tok({ slug: "tokens-interactive", name: "Interactive tokens", group: "Component tokens", description: "Hover, focus, and icon-button foreground mixes.", importPath: "packages/ui/src/globals.css", sourcePath: "packages/ui/src/globals.css", keywords: "interactive-hover icon-button" }),

  // ── Components · Actions ────────────────────────────────────────────────
  c({ slug: "button", name: "Button", group: "Actions", description: "Variants, sizes, icons, loading, ButtonGroup, Toggle, and ToggleGroup on one reference page.", importPath: `${UI}/button`, sourcePath: "packages/ui/src/components/ui/button.tsx", catalogId: "ui-button", routeSuffix: "/library/all", status: "live" }),
  c({ slug: "button-group", name: "Button Group", group: "Actions", description: "Grouped adjacent actions.", importPath: `${UI}/button-group`, sourcePath: "packages/ui/src/components/ui/button-group.tsx", catalogId: "ui-button-group", routeSuffix: "/exam-lock", parentSlug: "button" }),
  c({ slug: "toggle", name: "Toggle", group: "Actions", description: "Two-state icon toggle button.", importPath: `${UI}/toggle`, sourcePath: "packages/ui/src/components/ui/toggle.tsx", catalogId: "ui-toggle", parentSlug: "button" }),
  c({ slug: "toggle-group", name: "Toggle Group", group: "Actions", description: "Multiple toggles in a single group.", importPath: `${UI}/toggle-group`, sourcePath: "packages/ui/src/components/ui/toggle-group.tsx", parentSlug: "button" }),
  c({ slug: "toggle-switch", name: "Toggle Switch", group: "Actions", description: "On/off switch for settings rows.", importPath: `${UI}/toggle-switch`, sourcePath: "packages/ui/src/components/ui/toggle-switch.tsx", catalogId: "ui-toggle-switch", status: "live" }),

  // ── Components · Forms ──────────────────────────────────────────────────
  c({ slug: "field", name: "Field", group: "Forms", description: "Label + control + help text for top and left layouts.", importPath: `${UI}/field`, sourcePath: "packages/ui/src/components/ui/field.tsx", catalogId: "ui-field", status: "live" }),
  c({ slug: "form", name: "Form", group: "Forms", description: "react-hook-form shell with FormField and FormMessage.", importPath: `${UI}/form`, sourcePath: "packages/ui/src/components/ui/form.tsx", catalogId: "ui-form", status: "live" }),
  c({ slug: "input", name: "Input", group: "Forms", description: "Input, textarea, input group, label, and slider on one page.", importPath: `${UI}/input`, sourcePath: "packages/ui/src/components/ui/input.tsx", catalogId: "ui-input", status: "live" }),
  c({ slug: "input-group", name: "Input Group", group: "Forms", description: "Input with leading or trailing addons.", importPath: `${UI}/input-group`, sourcePath: "packages/ui/src/components/ui/input-group.tsx", catalogId: "ui-input-group", parentSlug: "input" }),
  c({ slug: "input-mask", name: "Input Mask", group: "Forms", description: "Masked input for formatted values.", importPath: `${UI}/input-mask`, sourcePath: "packages/ui/src/components/ui/input-mask.tsx", parentSlug: "input" }),
  c({ slug: "textarea", name: "Textarea", group: "Forms", description: "Multiline text input.", importPath: `${UI}/textarea`, sourcePath: "packages/ui/src/components/ui/textarea.tsx", catalogId: "ui-textarea", parentSlug: "input" }),
  c({ slug: "label", name: "Label", group: "Forms", description: "Accessible label primitive; prefer Field in forms.", importPath: `${UI}/label`, sourcePath: "packages/ui/src/components/ui/label.tsx", catalogId: "ui-label", parentSlug: "input" }),
  c({ slug: "select", name: "Select", group: "Forms", description: "Dropdown select with DS trigger chrome.", importPath: `${UI}/select`, sourcePath: "packages/ui/src/components/ui/select.tsx", catalogId: "ui-select", status: "live" }),
  c({ slug: "checkbox", name: "Checkbox", group: "Forms", description: "Tri-state checkbox: seven variants, three sizes, motion, Field + CheckboxLabel.", importPath: `${UI}/checkbox`, sourcePath: "packages/ui/src/components/ui/checkbox.tsx", catalogId: "ui-checkbox", status: "live" }),
  c({ slug: "radio-group", name: "Radio Group", group: "Forms", description: "Radio set, choice cards, and selection tiles.", importPath: `${UI}/radio-group`, sourcePath: "packages/ui/src/components/ui/radio-group.tsx", catalogId: "ui-radio-group", status: "live" }),
  c({ slug: "slider", name: "Slider", group: "Forms", description: "Range value picker.", importPath: `${UI}/slider`, sourcePath: "packages/ui/src/components/ui/slider.tsx", catalogId: "ui-slider", parentSlug: "input" }),
  c({ slug: "calendar", name: "Calendar", group: "Forms", description: "Date grid primitive.", importPath: `${UI}/calendar`, sourcePath: "packages/ui/src/components/ui/calendar.tsx", catalogId: "ui-calendar", parentSlug: "date-picker" }),
  c({ slug: "date-picker", name: "Date Picker", group: "Forms", description: "DatePickerField, DateRangePickerField, and DateTextInputField on one page.", importPath: `${UI}/date-picker-field`, sourcePath: "packages/ui/src/components/ui/date-picker-field.tsx", catalogId: "ui-date-picker", status: "live" }),
  c({ slug: "wizard", name: "Wizard", group: "Forms", description: "Sequential stepper — prefer ≤6 top-level steps; not Tabs. See wizard-pattern.md.", importPath: `${UI}/wizard`, sourcePath: "packages/ui/src/components/ui/wizard.tsx", catalogId: "ui-wizard", status: "live" }),
  c({ slug: "selection-tile-grid", name: "Selection Tile Grid", group: "Forms", description: "Radio or checkbox tile grid for export format picker, settings appearance, and read-only SelectionTileShowcase grids.", importPath: `${UI}/selection-tile-grid`, sourcePath: "packages/ui/src/components/ui/selection-tile-grid.tsx", catalogId: "ui-selection-tile", keywords: "tile picker icon grid showcase settings export format", parentSlug: "radio-group" }),
  c({ slug: "payment-card-fields", name: "Payment Card Fields", group: "Forms", description: "Card number / expiry / CVC grouped inputs.", importPath: `${UI}/payment-card-fields`, sourcePath: "packages/ui/src/components/ui/payment-card-fields.tsx" }),

  // ── Components · Overlays ───────────────────────────────────────────────
  c({ slug: "dialog", name: "Dialog", group: "Overlays", description: "Modal dialog and alert dialog on one page.", importPath: `${UI}/dialog`, sourcePath: "packages/ui/src/components/ui/dialog.tsx", catalogId: "ui-dialog", status: "live" }),
  c({ slug: "alert-dialog", name: "Alert Dialog", group: "Overlays", description: "Destructive / ack modal with actions.", importPath: `${UI}/alert-dialog`, sourcePath: "packages/ui/src/components/ui/alert-dialog.tsx", catalogId: "ui-alert-dialog", parentSlug: "dialog" }),
  c({ slug: "sheet", name: "Sheet", group: "Overlays", description: "Edge sheet; prefer FloatingSheetPanel on hubs.", importPath: `${UI}/sheet`, sourcePath: "packages/ui/src/components/ui/sheet.tsx" }),
  c({ slug: "popover", name: "Popover", group: "Overlays", description: "Popover and hover card surfaces.", importPath: `${UI}/popover`, sourcePath: "packages/ui/src/components/ui/popover.tsx", catalogId: "ui-popover", status: "live" }),
  c({ slug: "hover-card", name: "Hover Card", group: "Overlays", description: "Row identity preview on hover.", importPath: `${UI}/hover-card`, sourcePath: "packages/ui/src/components/ui/hover-card.tsx", catalogId: "ui-hover-card", parentSlug: "popover" }),
  c({ slug: "dropdown-menu", name: "Dropdown Menu", group: "Overlays", description: "Dropdown and context menus.", importPath: `${UI}/dropdown-menu`, sourcePath: "packages/ui/src/components/ui/dropdown-menu.tsx", catalogId: "ui-dropdown-menu", status: "live" }),
  c({ slug: "context-menu", name: "Context Menu", group: "Overlays", description: "Right-click action menu.", importPath: `${UI}/context-menu`, sourcePath: "packages/ui/src/components/ui/context-menu.tsx", catalogId: "ui-context-menu", parentSlug: "dropdown-menu" }),
  c({ slug: "command", name: "Command", group: "Overlays", description: "⌘K palette list primitive.", importPath: `${UI}/command`, sourcePath: "packages/ui/src/components/ui/command.tsx", catalogId: "ui-command", status: "live" }),
  c({ slug: "tooltip", name: "Tooltip", group: "Overlays", description: "Low-level tooltip; prefer Tip in product.", importPath: `${UI}/tooltip`, sourcePath: "packages/ui/src/components/ui/tooltip.tsx", parentSlug: "tip" }),
  c({ slug: "tip", name: "Tip", group: "Overlays", description: "Product tooltip wrapper with DS delay.", importPath: `${UI}/tip`, sourcePath: "packages/ui/src/components/ui/tip.tsx", catalogId: "ui-tip", status: "live" }),

  // ── Components · Navigation ─────────────────────────────────────────────
  c({ slug: "breadcrumb", name: "Breadcrumb", group: "Navigation", description: "Ancestor trail paired with SiteHeader.", importPath: `${UI}/breadcrumb`, sourcePath: "packages/ui/src/components/ui/breadcrumb.tsx", catalogId: "ui-breadcrumb", status: "live" }),
  c({ slug: "tabs", name: "Tabs", group: "Navigation", description: "Tablist, panels, and view segmented control.", importPath: `${UI}/tabs`, sourcePath: "packages/ui/src/components/ui/tabs.tsx", catalogId: "ui-tabs", status: "live" }),
  c({ slug: "sidebar", name: "Sidebar", group: "Navigation", description: "App shell primary navigation.", importPath: `${UI}/sidebar`, sourcePath: "packages/ui/src/components/ui/sidebar.tsx", catalogId: "ui-sidebar", status: "catalog" }),
  c({ slug: "sidebar-drill-in", name: "Sidebar Drill-In", group: "Navigation", description: "Nested nav panel beside primary sidebar.", importPath: `${UI}/sidebar-drill-in`, sourcePath: "packages/ui/src/components/ui/sidebar-drill-in.tsx", catalogId: "ui-sidebar-drill-in", parentSlug: "sidebar" }),
  c({ slug: "sidebar-nav-label", name: "Sidebar Nav Label", group: "Navigation", description: "Section label row in sidebar lists.", importPath: "@/components/ui/sidebar-nav-label", sourcePath: "apps/web/components/ui/sidebar-nav-label.tsx", parentSlug: "sidebar" }),
  c({ slug: "view-segmented-control", name: "Views segment", group: "Navigation", description: "Hub saved views — icon, label, count, chevron menu, and Add view.", importPath: `${UI}/view-segmented-control`, sourcePath: "packages/ui/src/components/ui/view-segmented-control.tsx", catalogId: "ui-view-segmented", parentSlug: "tabs" }),
  c({ slug: "button-segmented-control", name: "Button segmented control", group: "Navigation", description: "Exclusive mode picker on muted pill chrome (theme preview, compact toolbar modes).", importPath: `${UI}/button-segmented-control`, sourcePath: "packages/ui/src/components/ui/button-segmented-control.tsx", keywords: "pill segmented toolbar mode theme", parentSlug: "tabs", status: "live" }),
  c({ slug: "filter-chip-group", name: "Filter chip group", group: "Navigation", description: "Wrapping pill filter chips — brand fill for catalog tiers; muted tint for chart families and in-content pickers.", importPath: `${UI}/filter-chip-group`, sourcePath: "packages/ui/src/components/ui/filter-chip-group.tsx", catalogId: "ui-filter-chip-group", keywords: "pill filter chip category catalog chart toggle radiogroup", status: "live" }),
  c({ slug: "filter-button", name: "Filter button", group: "Data views", description: "Hub toolbar filter trigger — funnel icon with Badge count overlay and accent fill.", importPath: `${UI}/filter-button`, sourcePath: "packages/ui/src/components/ui/filter-button.tsx", catalogId: "ui-filter-button", keywords: "filter funnel count overlay toolbar hub table", status: "live" }),
  c({ slug: "filter-bar", name: "Filter bar", group: "Data views", description: "Inline active-filter chip row — FilterPill chips, Add filter, Clear all on hub toolbars.", importPath: `${UI}/filter-bar`, sourcePath: "packages/ui/src/components/ui/filter-bar.tsx", catalogId: "ui-filter-bar", keywords: "filter bar chips toolbar hub table", status: "live" }),

  // ── Components · Feedback ───────────────────────────────────────────────
  c({ slug: "badge", name: "Badge", group: "Feedback", description: "Badge primitive (variants, counts) and StatusBadge (semantic status + product chrome).", importPath: `${UI}/badge`, sourcePath: "packages/ui/src/components/ui/badge.tsx", catalogId: "ui-badge", status: "live" }),
  c({ slug: "status-badge", name: "Status Badge", group: "Feedback", description: "StatusBadge: semantic entity status (tone + icon) and product chrome (New, Beta).", importPath: `${UI}/status-badge`, sourcePath: "packages/ui/src/components/ui/status-badge.tsx", catalogId: "ui-status-badge", parentSlug: "badge" }),
  c({ slug: "banner", name: "Banner", group: "Feedback", description: "LocalBanner, SystemBanner, and MarketingBanner (hero + floating): info, warning, error, success, promo.", importPath: `${UI}/banner`, sourcePath: "packages/ui/src/components/ui/banner.tsx", catalogId: "ui-banner", keywords: "banner alert marketing hero floating promo", status: "live" }),
  c({ slug: "marketing-banner", name: "Marketing banner", group: "Feedback", description: "Hero inline promo (serif title, grid layout) and floating card or full-bleed media window.", importPath: `${UI}/marketing-banner`, sourcePath: "packages/ui/src/components/ui/marketing-banner.tsx", catalogId: "ui-marketing-banner", parentSlug: "banner", keywords: "marketing banner hero floating media video promo serif", status: "live" }),
  c({ slug: "skeleton", name: "Skeleton", group: "Feedback", description: "Pulse loading placeholders for text, list rows, table rows, and form fields.", importPath: `${UI}/skeleton`, sourcePath: "packages/ui/src/components/ui/skeleton.tsx", catalogId: "ui-skeleton", status: "live" }),
  c({ slug: "kbd", name: "Kbd", group: "Feedback", description: "Keyboard shortcut glyphs: tile on neutral surfaces, bare inside buttons, KbdGroup chords.", importPath: `${UI}/kbd`, sourcePath: "packages/ui/src/components/ui/kbd.tsx", catalogId: "ui-kbd", status: "live" }),
  c({ slug: "coach-mark", name: "Coach Mark", group: "Feedback", description: "Onboarding popover: single or multi-step, optional image per step, spotlight overlay via useCoachMark.", importPath: `${UI}/coach-mark`, sourcePath: "packages/ui/src/components/ui/coach-mark.tsx", catalogId: "ui-coach-mark", status: "live" }),

  // ── Components · Layout ─────────────────────────────────────────────────
  c({ slug: "card", name: "Card", group: "Layout", description: "Surface with header, body, footer.", importPath: `${UI}/card`, sourcePath: "packages/ui/src/components/ui/card.tsx", catalogId: "ui-card", status: "live" }),
  c({ slug: "accordion", name: "Accordion", group: "Layout", description: "Accordion and collapsible expand/collapse.", importPath: `${UI}/accordion`, sourcePath: "packages/ui/src/components/ui/accordion.tsx", catalogId: "ui-accordion", status: "live" }),
  c({ slug: "collapsible", name: "Collapsible", group: "Layout", description: "Single expand/collapse region.", importPath: `${UI}/collapsible`, sourcePath: "packages/ui/src/components/ui/collapsible.tsx", catalogId: "ui-collapsible", parentSlug: "accordion" }),
  c({ slug: "separator", name: "Separator", group: "Layout", description: "Divider and scroll area.", importPath: `${UI}/separator`, sourcePath: "packages/ui/src/components/ui/separator.tsx", catalogId: "ui-separator", status: "live" }),
  c({ slug: "scroll-area", name: "Scroll Area", group: "Layout", description: "Custom-styled scroll container.", importPath: `${UI}/scroll-area`, sourcePath: "packages/ui/src/components/ui/scroll-area.tsx", catalogId: "ui-scroll-area", parentSlug: "separator" }),
  c({ slug: "resizable", name: "Resizable", group: "Layout", description: "Drag-to-resize panel groups.", importPath: `${UI}/resizable`, sourcePath: "packages/ui/src/components/ui/resizable.tsx" }),
  c({ slug: "horizontal-scroll-region", name: "Horizontal Scroll Region", group: "Layout", description: "Overflow-x region with scroll controls.", importPath: `${UI}/horizontal-scroll-region`, sourcePath: "packages/ui/src/components/ui/horizontal-scroll-region.tsx" }),
  c({ slug: "horizontal-scroll-controls", name: "Horizontal Scroll Controls", group: "Layout", description: "Chevron controls for horizontal scroll.", importPath: `${UI}/horizontal-scroll-controls`, sourcePath: "packages/ui/src/components/ui/horizontal-scroll-controls.tsx" }),
  c({ slug: "dot-pattern", name: "Dot Pattern", group: "Layout", description: "Decorative dot grid background.", importPath: `${UI}/dot-pattern`, sourcePath: "packages/ui/src/components/ui/dot-pattern.tsx" }),
  c({ slug: "drag-handle-grip", name: "Drag Handle Grip", group: "Layout", description: "Sortable list drag affordance.", importPath: `${UI}/drag-handle-grip`, sourcePath: "packages/ui/src/components/ui/drag-handle-grip.tsx" }),

  // ── Components · Data display ───────────────────────────────────────────
  c({ slug: "avatar", name: "Avatar", group: "Data display", description: "Image or initials fallback.", importPath: `${UI}/avatar`, sourcePath: "packages/ui/src/components/ui/avatar.tsx", catalogId: "ui-avatar", status: "live" }),
  c({ slug: "table", name: "Table", group: "Data display", description: "Low-level HTML table styling.", importPath: `${UI}/table`, sourcePath: "packages/ui/src/components/ui/table.tsx", catalogId: "ui-table", status: "live" }),
  c({ slug: "chart", name: "Chart", group: "Data display", description: "ChartContainer and ChartFigure over Recharts: area, line, grouped/stacked/horizontal bar, donut, radial, composed, radar, scatter, funnel, and quota radial. Ask Leo plot insights where anchored.", importPath: `${UI}/chart`, sourcePath: "packages/ui/src/components/ui/chart.tsx", catalogId: "ui-chart", status: "live" }),

  // ── Components · Leo / AI chrome ────────────────────────────────────────
  c({ slug: "ai-thinking-surface", name: "AI Thinking Surface", group: "Leo", description: "Leo thinking / streaming surface chrome.", importPath: "@/components/ui/ai-thinking-surface", sourcePath: "apps/web/components/ui/ai-thinking-surface.tsx" }),
  c({ slug: "leo-icon", name: "Leo Icon", group: "Leo", description: "Brand Leo mark for buttons and chips.", importPath: "@/components/ui/leo-icon", sourcePath: "apps/web/components/ui/leo-icon.tsx" }),

  // ── Patterns · Data views ───────────────────────────────────────────────
  p({ slug: "data-table", name: "DataTable", group: "Data views", description: "Core grid and HubTable binding on one page.", importPath: DT, sourcePath: "packages/ui/src/components/data-table/index.tsx", catalogId: "comp-data-table", routeSuffix: "/columns", status: "live" }),
  p({ slug: "hub-table", name: "HubTable", group: "Data views", description: "Hub binding with useTableState, toolbar, and Properties.", importPath: DV, sourcePath: "packages/ui/src/components/data-views/hub-table.tsx", catalogId: "comp-hub-table", routeSuffix: "/columns", parentSlug: "data-table" }),
  p({ slug: "table-properties-drawer", name: "Table Properties Drawer", group: "Data views", description: "Columns, filters, sort, display, view-type tiles.", importPath: "@exxatdesignux/ui/components/table-properties", sourcePath: "packages/ui/src/components/table-properties/index.ts", catalogId: "comp-table-properties", routeSuffix: "/columns", parentSlug: "data-table" }),
  p({ slug: "data-row-list", name: "DataRowList", group: "Data views", description: "Virtualized list view body for hubs.", importPath: `${DV}/data-row-list`, sourcePath: "apps/web/components/data-views/data-row-list.tsx" }),
  p({ slug: "list-page-view-frame", name: "List Page View Frame", group: "Data views", description: "Centered gutter for folder / panel / grid views.", importPath: `${DV}/list-page-view-frame`, sourcePath: "apps/web/components/data-views/list-page-view-frame.tsx", catalogId: "comp-view-frame", status: "catalog" }),
  p({ slug: "folder-grid-view", name: "Folder Grid View", group: "Data views", description: "Icon folder grid for folder view tab.", importPath: `${DV}/folder-grid-view`, sourcePath: "apps/web/components/data-views/folder-grid-view.tsx" }),
  p({ slug: "finder-panel-view", name: "Finder Panel View", group: "Data views", description: "Miller-column finder panel view.", importPath: `${DV}/finder-panel-view`, sourcePath: "apps/web/components/data-views/finder-panel-view.tsx" }),
  p({ slug: "list-page-board-card", name: "List Page Board Card", group: "Data views", description: "Kanban card + list row shell.", importPath: `${DV}/list-page-board-card`, sourcePath: "apps/web/components/data-views/list-page-board-card.tsx", catalogId: "comp-board-card", status: "live" }),
  p({ slug: "list-page-board-template", name: "List Page Board Template", group: "Data views", description: "Board columns with virtualized cards.", importPath: `${DV}/list-page-board-template`, sourcePath: "apps/web/components/data-views/list-page-board-template.tsx" }),
  p({ slug: "list-page-tree-panel-shell", name: "List Page Tree Panel Shell", group: "Data views", description: "Tree + details split resizable shell.", importPath: `${DV}/list-page-tree-panel-shell`, sourcePath: "apps/web/components/data-views/list-page-tree-panel-shell.tsx" }),
  p({ slug: "outline-tree-menu", name: "Outline Tree Menu", group: "Data views", description: "VS Code–style outline tree chrome.", importPath: `${DV}/outline-tree-menu`, sourcePath: "apps/web/components/data-views/outline-tree-menu.tsx" }),

  // ── Patterns · Page chrome ──────────────────────────────────────────────
  p({ slug: "page-header", name: "PageHeader", group: "Page chrome", description: "Hub title row with CTA, overflow, and collaboration.", importPath: "@/components/page-header", sourcePath: "apps/web/components/page-header.tsx", catalogId: "comp-page-header", status: "live" }),
  p({ slug: "key-metrics", name: "KeyMetrics", group: "Page chrome", description: "KPI strip in flat or card variant with trends.", importPath: "@/components/key-metrics", sourcePath: "apps/web/components/key-metrics.tsx", catalogId: "comp-key-metrics", status: "live" }),
  p({ slug: "site-header", name: "SiteHeader", group: "Page chrome", description: "Global shell header with breadcrumbs.", importPath: "@/components/site-header", sourcePath: "apps/web/components/site-header.tsx" }),
  p({ slug: "settings-form-row", name: "Settings Form Row", group: "Page chrome", description: "Two-column settings label + control row.", importPath: "@/components/settings-form-row", sourcePath: "apps/web/components/settings-form-row.tsx" }),
  c({ slug: "chart-card", name: "ChartCard", group: "Data display", description: "Dashboard card shell over Chart: normal, tabs, metrics tabs, selector, and KPI variants. Ask Leo in the header and on the plot.", importPath: "@/components/charts-overview", sourcePath: "apps/web/components/charts-overview.tsx", catalogId: "comp-charts", status: "live" }),

  // ── Patterns · Overlays & commands ──────────────────────────────────────
  p({ slug: "floating-sheet-panel", name: "FloatingSheetPanel", group: "Overlays", description: "Inset hub side panel for export, properties, and invite.", importPath: "@/lib/floating-sheet-panel", sourcePath: "packages/ui/src/components/ui/floating-sheet-panel.tsx", catalogId: "comp-floating-sheet-panel", status: "catalog" }),
  p({ slug: "export-drawer", name: "ExportDrawer", group: "Overlays", description: "Hub export workflow sheet.", importPath: "@/components/export-drawer", sourcePath: "apps/web/components/export-drawer.tsx", catalogId: "comp-export-drawer", status: "catalog" }),
  p({ slug: "command-menu", name: "CommandMenu", group: "Overlays", description: "Workspace ⌘K command palette.", importPath: "@/components/command-menu", sourcePath: "apps/web/components/command-menu.tsx", catalogId: "comp-command-menu", status: "catalog" }),
  p({ slug: "invite-collaborators-drawer", name: "Invite Collaborators Drawer", group: "Overlays", description: "Hub face rail invite flow.", importPath: "@/components/invite-collaborators-drawer", sourcePath: "apps/web/components/invite-collaborators-drawer.tsx", catalogId: "comp-collaboration", status: "catalog" }),
  p({ slug: "dedicated-search", name: "Dedicated Search", group: "Search", description: "Search landing + results URL composer.", importPath: "@/components/dedicated-search-url-composer", sourcePath: "apps/web/components/dedicated-search-url-composer.tsx", catalogId: "comp-dedicated-search", routeSuffix: "/library/list", status: "catalog" }),

  // ── Table cells ─────────────────────────────────────────────────────────
  cell({ slug: "table-cells", name: "Table cells", group: "Table cells", description: "All DataTable column cell primitives on one page.", importPath: `${DV}/table-cells`, sourcePath: "apps/web/components/data-views/table-cells.tsx", routeSuffix: "/columns", status: "live" }),
  cell({ slug: "progress-cell", name: "ProgressCell", group: "Values", description: "Bar + percent progress column.", importPath: `${DV}/table-cells`, catalogId: "cell-progress", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "currency-cell", name: "CurrencyCell", group: "Values", description: "Formatted currency column.", importPath: `${DV}/table-cells`, catalogId: "cell-currency", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "numeric-cell", name: "NumericCell", group: "Values", description: "Tabular numeric column.", importPath: `${DV}/table-cells`, catalogId: "cell-numeric", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "rating-cell", name: "RatingCell", group: "Values", description: "Star rating column.", importPath: `${DV}/table-cells`, catalogId: "cell-rating", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "signal-bars-cell", name: "SignalBarsCell", group: "Values", description: "Signal strength bars column.", importPath: `${DV}/table-cells`, catalogId: "cell-signal", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "boolean-toggle-cell", name: "BooleanToggleCell", group: "Status", description: "Inline boolean toggle column.", importPath: `${DV}/table-cells`, catalogId: "cell-boolean", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "pill-cell", name: "PillCell", group: "Status", description: "Tinted pill label column.", importPath: `${DV}/table-cells`, catalogId: "cell-pill", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "tag-list-cell", name: "TagListCell", group: "Status", description: "Overflow tag list column.", importPath: `${DV}/table-cells`, catalogId: "cell-tags", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "people-avatar-rail-cell", name: "PeopleAvatarRailCell", group: "People", description: "Stacked avatar rail column.", importPath: `${DV}/table-cells`, catalogId: "cell-people-rail", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "person-identity-cell", name: "PersonIdentityCell", group: "People", description: "Avatar + name + email column.", importPath: "@exxatdesignux/ui/components/data-views/person-identity-cell", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "external-link-cell", name: "ExternalLinkCell", group: "Links", description: "External link column.", importPath: `${DV}/table-cells`, catalogId: "cell-external-link", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "relative-time-cell", name: "RelativeTimeCell", group: "Links", description: "Relative timestamp column.", importPath: `${DV}/table-cells`, catalogId: "cell-relative-time", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "attachment-count-cell", name: "AttachmentCountCell", group: "Links", description: "Attachment count column.", importPath: `${DV}/table-cells`, catalogId: "cell-attachment", routeSuffix: "/columns", parentSlug: "table-cells" }),
  cell({ slug: "row-actions-cell", name: "RowActionsCell", group: "Actions", description: "Per-row overflow actions column.", importPath: `${DV}/table-cells`, catalogId: "cell-row-actions", routeSuffix: "/columns", parentSlug: "table-cells" }),

  // ── Templates ───────────────────────────────────────────────────────────
  tpl({ slug: "list-page-template", name: "ListPageTemplate", group: "Hub shells", description: "View tabs shell: table, list, board, dashboard, folder, panel, tree.", importPath: "@/components/templates/list-page", sourcePath: "apps/web/components/templates/list-page.tsx", catalogId: "tpl-list-page", routeSuffix: "/library/all", status: "catalog" }),
  tpl({ slug: "primary-page-template", name: "PrimaryPageTemplate", group: "Hub shells", description: "SiteHeader + max-width column page shell.", importPath: "@/components/templates/primary-page-template", sourcePath: "apps/web/components/templates/primary-page-template.tsx", catalogId: "tpl-primary-page", routeSuffix: "/columns", status: "catalog" }),
  tpl({ slug: "secondary-panel-hub-template", name: "Secondary Panel Hub", group: "Hub shells", description: "Hub with nested scope rail (Library pattern).", importPath: "@/components/templates/secondary-panel-hub-template", sourcePath: "apps/web/components/templates/secondary-panel-hub-template.tsx", catalogId: "tpl-secondary-panel-hub", routeSuffix: "/library/all", status: "catalog" }),
  tpl({ slug: "discovery-hub-template", name: "Discovery Hub", group: "Search", description: "Library landing with search composer and recents.", importPath: "@/components/templates/discovery-hub-template", sourcePath: "apps/web/components/templates/discovery-hub-template.tsx", catalogId: "tpl-discovery-hub", routeSuffix: "/library", status: "catalog" }),
  tpl({ slug: "dedicated-search-landing-template", name: "Dedicated Search Landing", group: "Search", description: "Empty-query search shell.", importPath: "@/components/templates/dedicated-search-landing-template", sourcePath: "apps/web/components/templates/dedicated-search-landing-template.tsx", catalogId: "tpl-dedicated-search-landing", routeSuffix: "/library/list", status: "catalog" }),
  tpl({ slug: "dedicated-search-results-template", name: "Dedicated Search Results", group: "Search", description: "Non-empty ?q= results chrome.", importPath: "@/components/templates/dedicated-search-results-template", sourcePath: "apps/web/components/templates/dedicated-search-results-template.tsx", catalogId: "tpl-dedicated-search-results", routeSuffix: "/library/find", status: "catalog" }),
  tpl({ slug: "exam-lock-template", name: "Exam Lock", group: "Focus", description: "Locked assessment delivery with timer, nav, and settings.", importPath: "@/components/templates/exam-lock-template", sourcePath: "apps/web/components/templates/exam-lock-template.tsx", catalogId: "tpl-exam-lock", routeSuffix: "/exam-lock", status: "catalog" }),
  tpl({ slug: "focus-workflow-template", name: "Focus Workflow", group: "Focus", description: "Full-page task shell with sidebars hidden.", importPath: "@/components/templates/focus-workflow-template", sourcePath: "apps/web/components/templates/focus-workflow-template.tsx", catalogId: "tpl-focus-workflow", routeSuffix: "/focus-workflow", status: "catalog" }),
  tpl({ slug: "new-focus-template", name: "New Focus (authoring)", group: "Focus", description: "Library new question: form + inspector.", importPath: "@/components/templates/new-focus-template", sourcePath: "apps/web/components/templates/new-focus-template.tsx", catalogId: "tpl-new-focus", routeSuffix: "/library/new", status: "catalog" }),

  // ── Live examples (reference hubs) ────────────────────────────────────────
  ex({ slug: "library-hub", name: "Question bank (Library)", group: "Reference hubs", description: "Full seven-view hub with secondary panel.", importPath: "@/components/library-table", catalogId: "hub-library", routeSuffix: "/library/all", status: "catalog" }),
  ex({ slug: "columns-hub", name: "Column types showcase", group: "Reference hubs", description: "HubTable exercising every cell pattern.", importPath: "@/components/columns-showcase", catalogId: "hub-columns", routeSuffix: "/columns", status: "catalog" }),
  ex({ slug: "column-types-demo", name: "Column types rule demo", group: "Reference hubs", description: "Table-column-cells rule validation hub.", importPath: "@/components/column-types-rule-demo-client", catalogId: "hub-column-types-demo", routeSuffix: "/column-types-demo", status: "catalog" }),
  ex({ slug: "tokens-themes-hub", name: "Tokens & themes", group: "Reference hubs", description: "Design token browser with category drill-in.", importPath: "@/components/tokens-themes-client", catalogId: "hub-tokens", routeSuffix: "/tokens-themes", status: "catalog" }),

  // ── Cursor rules (agent context) ─────────────────────────────────────────
  rule({ slug: "rule-constitution", name: "DS constitution", group: "Foundation", description: "Ten commandments, precedence, and UX router for all surfaces.", importPath: ".cursor/rules/_constitution.exxat-ds.mdc", sourcePath: ".cursor/rules/_constitution.exxat-ds.mdc" }),
  rule({ slug: "rule-product-context", name: "Product context", group: "Product", description: "Product, scope, and persona lines in every design brief.", importPath: ".cursor/rules/exxat-product-context.mdc", sourcePath: ".cursor/rules/exxat-product-context.mdc" }),
  rule({ slug: "rule-product-routing", name: "Product routing", group: "Product", description: "Four-app URL roots, persistKey namespacing, and switcher behaviour.", importPath: ".cursor/rules/exxat-product-routing.mdc", sourcePath: ".cursor/rules/exxat-product-routing.mdc" }),
  rule({ slug: "rule-ux-discovery", name: "UX discovery protocol", group: "UX", description: "Design brief gate before IA or layout code changes.", importPath: ".cursor/rules/exxat-ux-discovery-protocol.mdc", sourcePath: ".cursor/rules/exxat-ux-discovery-protocol.mdc" }),
  rule({ slug: "rule-ux-principles", name: "UX principles", group: "UX", description: "P1–P20 ship gate and modern SaaS pattern references.", importPath: ".cursor/rules/exxat-ux-principles.mdc", sourcePath: ".cursor/rules/exxat-ux-principles.mdc" }),
  rule({ slug: "rule-data-tables", name: "Data tables", group: "Data views", description: "HubTable mandate, edge inset, and cell primitive reuse.", importPath: ".cursor/rules/exxat-data-tables.mdc", sourcePath: "apps/web/.cursor/rules/exxat-data-tables.mdc" }),
  rule({ slug: "rule-table-cells", name: "Table column cells", group: "Data views", description: "Data point to cellKind and named cell mapping.", importPath: ".cursor/rules/exxat-table-column-cells.mdc", sourcePath: ".cursor/rules/exxat-table-column-cells.mdc" }),
  rule({ slug: "rule-token-discipline", name: "Token discipline", group: "Tokens", description: "L0 --exxat-* tokens only; no hex or deprecated aliases.", importPath: ".cursor/rules/exxat-token-discipline.mdc", sourcePath: ".cursor/rules/exxat-token-discipline.mdc" }),
  rule({ slug: "rule-accessibility", name: "Accessibility", group: "Ship gate", description: "WCAG 2.1 AA floor, targets, contrast, and icon alt text cases.", importPath: ".cursor/rules/exxat-accessibility.mdc", sourcePath: ".cursor/rules/exxat-accessibility.mdc" }),
  rule({ slug: "rule-wizard", name: "Wizard", group: "Forms", description: "Sequential stepper step budget, scroll controls, and focus-workflow pairing.", importPath: ".cursor/rules/exxat-wizard.mdc", sourcePath: ".cursor/rules/exxat-wizard.mdc" }),
  rule({ slug: "rule-horizontal-scroll", name: "Horizontal scroll", group: "Layout", description: "Grouped scroll controls for overflowing tab and step rails.", importPath: ".cursor/rules/exxat-horizontal-scroll.mdc", sourcePath: ".cursor/rules/exxat-horizontal-scroll.mdc" }),

  // ── Agent skills ─────────────────────────────────────────────────────────
  skill({ slug: "skill-exxat-ds", name: "exxat-ds-skill", group: "Core", description: "Complete DS architecture, patterns, and hub walkthrough.", importPath: ".cursor/skills/exxat-ds-skill/SKILL.md", sourcePath: ".cursor/skills/exxat-ds-skill/SKILL.md" }),
  skill({ slug: "skill-senior-ux", name: "exxat-senior-ux", group: "UX", description: "Design brief protocol and modern SaaS analogue research.", importPath: ".cursor/skills/exxat-senior-ux/SKILL.md", sourcePath: ".cursor/skills/exxat-senior-ux/SKILL.md" }),
  skill({ slug: "skill-token-economy", name: "exxat-token-economy", group: "Agents", description: "Minimum file set and pre-flight for AI token savings.", importPath: ".cursor/skills/exxat-token-economy/SKILL.md", sourcePath: ".cursor/skills/exxat-token-economy/SKILL.md" }),
  skill({ slug: "skill-table-cells", name: "exxat-table-column-cells", group: "Data views", description: "ColumnDef cellKind and table-cells primitive selection.", importPath: ".cursor/skills/exxat-table-column-cells/SKILL.md", sourcePath: ".cursor/skills/exxat-table-column-cells/SKILL.md" }),
  skill({ slug: "skill-accessibility", name: "exxat-accessibility", group: "Ship gate", description: "WCAG checklist and audit follow-ups.", importPath: ".cursor/skills/exxat-accessibility/SKILL.md", sourcePath: ".cursor/skills/exxat-accessibility/SKILL.md" }),
  skill({ slug: "skill-ux-audit", name: "exxat-ux-audit", group: "UX", description: "Structured audit against P1–P20 and DS rules.", importPath: ".cursor/skills/exxat-ux-audit/SKILL.md", sourcePath: ".cursor/skills/exxat-ux-audit/SKILL.md" }),
  skill({ slug: "skill-domain-context", name: "exxat-domain-context", group: "Product", description: "Personas, scope map, and compliance terminology.", importPath: ".cursor/skills/exxat-domain-context/SKILL.md", sourcePath: ".cursor/skills/exxat-domain-context/SKILL.md" }),

  // ── Agent guides ─────────────────────────────────────────────────────────
  agent({ slug: "agent-handbook", name: "AGENTS.md", group: "Workspace", description: "Authoritative agent map, ship checklist, and hub patterns.", importPath: "apps/web/AGENTS.md", sourcePath: "apps/web/AGENTS.md" }),
  agent({ slug: "agent-handbook-human", name: "HANDBOOK.md", group: "Workspace", description: "Human-oriented DS orientation and six-step hub guide.", importPath: "apps/web/docs/HANDBOOK.md", sourcePath: "apps/web/docs/HANDBOOK.md" }),
  agent({ slug: "agent-component-selection", name: "Component selection guide", group: "Routing", description: "Surface router for primitives, patterns, and jobs.", importPath: "apps/web/docs/component-selection-guide.md", sourcePath: "apps/web/docs/component-selection-guide.md" }),
  agent({ slug: "agent-index", name: "INDEX.yaml", group: "Routing", description: "Machine index of rules, skills, patterns, and jobs.", importPath: "apps/web/docs/INDEX.yaml", sourcePath: "apps/web/docs/INDEX.yaml" }),
  agent({ slug: "agent-ds-doc-author", name: "DS Doc Author", group: "Documentation", description: "OpenRouter agent — generates UX guidelines and pattern docs for catalog primitives.", importPath: "apps/web/docs/agents/ds-doc-author.md", sourcePath: "apps/web/docs/agents/ds-doc-author.md" }),
]
