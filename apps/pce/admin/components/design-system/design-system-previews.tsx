"use client"

/**
 * Maps registry slugs → live preview sections (shadcn-style stacked examples).
 */

import * as React from "react"

import {
  CatalogChartCardVariantPreview,
  CatalogDataTablePreview,
  CatalogHubTablePreview,
  CatalogKeyMetricsPreview,
  CatalogPageHeaderPreview,
} from "@/components/catalog-live-previews"
import {
  CommandPreview,
  SelectPreview,
  SelectionTileGridPreview,
  TableBulkActionBarPreview,
} from "@/components/design-system/data-display-previews"
import { getComponentDocSpec } from "@/lib/design-system/component-docs"
import { DesignSystemExampleCanvas } from "@/components/design-system/component-doc-shell"
import { DS_DOC_SECTION_TITLE } from "@/lib/design-system/doc-typography"
import { CalendarPreview, DatePickerPreview, DateRangePickerPreview, DateTextInputPreview } from "@/components/design-system/date-previews"
import {
  FieldLayoutsPreview,
  FormRhfPreview,
  RadioGroupChoiceCardPreview,
  RadioGroupDefaultPreview,
  RadioGroupDescriptionPreview,
  RadioGroupFieldsetPreview,
  RadioGroupInvalidPreview,
} from "@/components/design-system/form-previews"
import {
  InputDefaultPreview,
  InputGroupPreview,
  LabelPreview,
  SliderPreview,
  TextareaDefaultPreview,
} from "@/components/design-system/input-previews"
import {
  WizardAllVariantsPreview,
  WizardErrorStatePreview,
  WizardHorizontalCompactPreview,
  WizardHorizontalIconsPreview,
  WizardHorizontalNumberedPreview,
  WizardManyStepsPreview,
  WizardVerticalIconsPreview,
  WizardVerticalNumberedPreview,
} from "@/components/design-system/wizard-previews"
import {
  AccordionPreview,
  CollapsiblePreview,
  ScrollAreaPreview,
  SeparatorPreview,
} from "@/components/design-system/layout-previews"
import {
  BreadcrumbPreview,
  TabsPrimaryVariantsPreview,
  TabsSecondaryVariantsPreview,
} from "@/components/design-system/navigation-previews"
import {
  AlertDialogPreview,
  ContextMenuPreview,
  DialogPreview,
  DropdownMenuPreview,
  HoverCardPreview,
  PopoverPreview,
  TipPreview,
  TooltipPreview,
} from "@/components/design-system/overlay-previews"
import {
  AttachmentCountCellPreview,
  BooleanToggleCellPreview,
  CurrencyCellPreview,
  ExternalLinkCellPreview,
  NumericCellPreview,
  PeopleAvatarRailCellPreview,
  PillCellPreview,
  ProgressCellPreview,
  RatingCellPreview,
  RelativeTimeCellPreview,
  RowActionsCellPreview,
  SignalBarsCellPreview,
  TagListCellPreview,
} from "@/components/design-system/table-cell-previews"

export interface DesignSystemPreviewSection {
  id: string
  title: string
  description?: string
  bare?: boolean
  children: React.ReactNode
}

function section(
  id: string,
  title: string,
  children: React.ReactNode,
  description?: string,
  bare?: boolean,
): DesignSystemPreviewSection {
  return { id, title, description, children, bare }
}

const PREVIEW_SECTIONS: Record<string, DesignSystemPreviewSection[]> = {
  // button, avatar, toggle-switch → component-docs/*.tsx

  // ── Forms ───────────────────────────────────────────────────────────────
  field: [
    section("layouts", "Top and left label layouts", <FieldLayoutsPreview />, "Vertical Field vs horizontal + SettingsFormRow."),
  ],
  form: [section("rhf", "react-hook-form", <FormRhfPreview />)],
  input: [
    section("default", "Input", <InputDefaultPreview />),
    section("textarea", "Textarea", <TextareaDefaultPreview />),
    section("input-group", "Input group", <InputGroupPreview />, "Leading/trailing addons."),
    section("label", "Label", <LabelPreview />, "Prefer FieldLabel in product forms."),
    section("slider", "Slider", <SliderPreview />),
  ],
  select: [section("default", "Default", <SelectPreview />)],
  // checkbox → component-docs/checkbox.tsx
  "radio-group": [
    section("default", "Default", <RadioGroupDefaultPreview />),
    section("fieldset", "Fieldset", <RadioGroupFieldsetPreview />),
    section("description", "With description", <RadioGroupDescriptionPreview />),
    section("choice-card", "Choice card", <RadioGroupChoiceCardPreview />),
    section("invalid", "Invalid", <RadioGroupInvalidPreview />),
    section("selection-tile-grid", "Selection tiles", <SelectionTileGridPreview />, "Radio/checkbox tile grid."),
  ],
  "date-picker": [
    section("date-picker", "Date picker", <DatePickerPreview />),
    section("date-range", "Date range", <DateRangePickerPreview />, "DateRangePickerField popover trigger."),
    section("date-text", "Masked text + calendar", <DateTextInputPreview />, "DateTextInputField for filters."),
    section("calendar", "Calendar", <CalendarPreview />, "Low-level date grid primitive."),
  ],
  wizard: [
    section("all-variants", "All variants", <WizardAllVariantsPreview />, "Full matrix for QA — numbered, icons, compact, vertical, error, 8-step scroll."),
    section("horizontal-numbered", "Horizontal numbered", <WizardHorizontalNumberedPreview />, "Brand completed · tint active · muted upcoming. Min 12px type."),
    section("horizontal-icons", "Horizontal icons", <WizardHorizontalIconsPreview />, "Icon markers; check replaces icon when done."),
    section("horizontal-compact", "Horizontal compact", <WizardHorizontalCompactPreview />, "Dot rail + Step N of M for dense flows."),
    section("vertical-numbered", "Vertical numbered", <WizardVerticalNumberedPreview />, "Sidebar rail — PatternFly wizard."),
    section("vertical-icons", "Vertical icons", <WizardVerticalIconsPreview />, "Vertical icon rail with descriptions."),
    section("error", "Error state", <WizardErrorStatePreview />, "Current-step validation failure."),
    section("many-steps", "Edge case: overflow", <WizardManyStepsPreview />, "8-step stress test for scroll + guidance — not a product pattern."),
  ],

  // ── Overlays ────────────────────────────────────────────────────────────
  dialog: [
    section("default", "Default", <DialogPreview />),
    section("alert-dialog", "Alert dialog", <AlertDialogPreview />, "Destructive / ack with actions."),
  ],
  popover: [
    section("default", "Default", <PopoverPreview />),
    section("hover-card", "Hover card", <HoverCardPreview />, "Row identity preview on hover."),
  ],
  "dropdown-menu": [
    section("default", "Default", <DropdownMenuPreview />),
    section("context-menu", "Context menu", <ContextMenuPreview />, "Right-click menu."),
  ],
  tip: [
    section("default", "Default", <TipPreview />, "Product tooltip wrapper; prefer in app code."),
    section("tooltip", "Tooltip primitive", <TooltipPreview />, "Low-level primitive; Tip is the default."),
  ],
  command: [section("default", "Default", <CommandPreview />)],

  // ── Navigation ──────────────────────────────────────────────────────────
  breadcrumb: [section("default", "Default", <BreadcrumbPreview />)],
  tabs: [
    section(
      "default-variant",
      "Default variant",
      <TabsPrimaryVariantsPreview />,
      "Pill tablist (`variant` default). Label only, with icon, or with TabsCountBadge.",
    ),
    section(
      "line-variant",
      "Line variant",
      <TabsSecondaryVariantsPreview />,
      "Underline tablist (`variant=\"line\"`). Same three trigger shapes.",
    ),
  ],

  // badge, card, coach-mark, kbd, skeleton → component-docs/*.tsx

  // ── Layout ──────────────────────────────────────────────────────────────
  accordion: [
    section("default", "Default", <AccordionPreview />),
    section("collapsible", "Collapsible", <CollapsiblePreview />),
  ],
  separator: [
    section("default", "Default", <SeparatorPreview />),
    section("scroll-area", "Scroll area", <ScrollAreaPreview />),
  ],

  // ── Data display ────────────────────────────────────────────────────────
  // avatar → component-docs/avatar.tsx
  // table → component-docs/table.tsx

  "chart-card": [
    section("normal", "Normal", <CatalogChartCardVariantPreview variant="normal" />, "Title, description, chart body, Ask Leo on card hover."),
    section(
      "tabs",
      "Tabs",
      <CatalogChartCardVariantPreview variant="tabs" />,
      "Chart and Trend panels. Uses the same line tab chrome as metrics tabs.",
    ),
    section("selector", "Selector", <CatalogChartCardVariantPreview variant="selector" />, "Header filter select."),
    section(
      "metrics-tabs",
      "Metrics tabs",
      <CatalogChartCardVariantPreview variant="metrics-tabs" />,
      "Metric cells are tab triggers.",
    ),
    section("kpi-chart", "KPI + chart", <CatalogChartCardVariantPreview variant="kpi-chart" />, "Hero metric above the chart."),
  ],

  // ── Patterns · Data views ───────────────────────────────────────────────
  "data-table": [
    section("grid", "Core grid", <CatalogDataTablePreview />, "Sort, filters, resize."),
    section("hub-table", "HubTable", <CatalogHubTablePreview />, "useTableState + toolbar + Properties."),
    section(
      "bulk-actions",
      "Bulk action bar",
      <TableBulkActionBarPreview />,
      "Floating bar when rows are selected; Esc clears.",
    ),
  ],
  "key-metrics": [section("variants", "Flat, card strip, and metric cards", <CatalogKeyMetricsPreview />)],
  "page-header": [section("default", "Hub header", <CatalogPageHeaderPreview />)],

  // ── Table cells ─────────────────────────────────────────────────────────
  "table-cells": [
    section("progress-cell", "Progress", <ProgressCellPreview />),
    section("currency-cell", "Currency", <CurrencyCellPreview />),
    section("numeric-cell", "Numeric", <NumericCellPreview />),
    section("rating-cell", "Rating", <RatingCellPreview />),
    section("signal-bars-cell", "Signal bars", <SignalBarsCellPreview />),
    section("boolean-toggle-cell", "Boolean toggle", <BooleanToggleCellPreview />),
    section("pill-cell", "Pill", <PillCellPreview />),
    section("tag-list-cell", "Tag list", <TagListCellPreview />),
    section("people-avatar-rail-cell", "People rail", <PeopleAvatarRailCellPreview />),
    section("external-link-cell", "External link", <ExternalLinkCellPreview />),
    section("relative-time-cell", "Relative time", <RelativeTimeCellPreview />),
    section("attachment-count-cell", "Attachment count", <AttachmentCountCellPreview />),
    section("row-actions-cell", "Row actions", <RowActionsCellPreview />),
  ],
}

export function getDesignSystemPreviewSections(slug: string): DesignSystemPreviewSection[] | null {
  const spec = getComponentDocSpec(slug)
  if (spec?.sections.length) {
    return spec.sections.map((block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      bare: block.bare,
      children: block.children,
    }))
  }
  const sections = PREVIEW_SECTIONS[slug]
  return sections && sections.length > 0 ? sections : null
}

export function designSystemHasLivePreview(slug: string): boolean {
  const spec = getComponentDocSpec(slug)
  if (spec?.sections.length) return true
  return Boolean(PREVIEW_SECTIONS[slug]?.length)
}

const WIDE_PREVIEW_SLUGS = new Set([
  "banner",
  "table",
  "data-table",
  "hub-table",
  "table-cells",
  "wizard",
  "coach-mark",
  "tokens-colors",
  "tokens-gradients",
  "tokens-aliases",
])

export function DesignSystemPreviewSections({ slug }: { slug: string }) {
  const sections = getDesignSystemPreviewSections(slug)
  if (!sections) return null
  const wideCanvas = WIDE_PREVIEW_SLUGS.has(slug) || slug.startsWith("tokens-")

  return (
    <div className="flex flex-col gap-8">
      {sections.map((block) => (
        <section key={block.id} id={block.id} className="flex flex-col gap-2 scroll-mt-20">
          {block.bare ? null : (
            <h2 className={DS_DOC_SECTION_TITLE}>{block.title}</h2>
          )}
          <DesignSystemExampleCanvas wide={wideCanvas}>{block.children}</DesignSystemExampleCanvas>
        </section>
      ))}
    </div>
  )
}
