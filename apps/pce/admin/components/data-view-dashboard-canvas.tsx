"use client"

/**
 * Customisable Data view dashboard canvas — drag reorder, width, chart type, KPI count.
 * Hub-specific chart bodies are supplied via `renderChartCard`.
 */

import * as React from "react"
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChartCard } from "@/components/charts-overview"
import { Card } from "@/components/ui/card"
import { KeyMetrics, type MetricInsight, type MetricItem } from "@/components/key-metrics"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ViewSegmentedControl } from "@/components/ui/view-segmented-control"
import { Tip } from "@/components/ui/tip"
import { DragHandleGripIcon } from "@/components/ui/drag-handle-grip"
import {
  KEY_METRICS_KPI_COUNT_MAX,
  KEY_METRICS_KPI_COUNT_MIN,
} from "@/lib/dashboard-layout-merge"
import {
  CHART_DASHBOARD_CELL_CLASS,
  CHART_DASHBOARD_ROW_GRID_CLASS,
} from "@/lib/chart-dashboard-layout"
import type { ChartType, DashboardCardDef } from "@/lib/data-view-dashboard-layout-types"
import { applyVisibleReorder } from "@/lib/data-view-dashboard-layout-types"
import { useChartVariant } from "@/contexts/chart-variant-context"
import { cn } from "@/lib/utils"

export interface DataViewDashboardCanvasProps {
  allCards: DashboardCardDef[]
  keyMetricsCardId: string
  keyMetrics: { metrics: MetricItem[]; insight: MetricInsight }
  visibleCards: string[]
  cardOrder: string[]
  cardSpans?: Record<string, 1 | 2>
  cardChartTypes?: Record<string, ChartType>
  keyMetricsKpiCount?: number
  layoutEditMode?: boolean
  onVisibleChange?: (visible: string[]) => void
  onOrderChange?: (order: string[]) => void
  onSpanChange?: (id: string, span: 1 | 2) => void
  onChartTypeChange?: (id: string, chartType: ChartType) => void
  onKeyMetricsKpiCountChange?: (count: number) => void
  onResetLayout?: () => void
  onLayoutEditDone?: () => void
  onLayoutEditCancel?: () => void
  renderChartCard: (cardId: string, chartType: ChartType) => React.ReactNode
}

function SortableDashboardChartCard({
  card,
  span,
  chartType,
  cardIndex,
  totalCards,
  onSpanChange,
  onChartTypeChange,
  onRemove,
  onMoveStep,
  keyMetrics,
  keyMetricsKpiCount,
  onKeyMetricsKpiCountChange,
  keyMetricsCardId,
  renderChartCard,
}: {
  card: DashboardCardDef
  span: 1 | 2
  chartType: ChartType
  cardIndex: number
  totalCards: number
  onSpanChange: (id: string, span: 1 | 2) => void
  onChartTypeChange: (id: string, chartType: ChartType) => void
  onRemove: (id: string) => void
  onMoveStep: (direction: -1 | 1) => void
  keyMetrics: { metrics: MetricItem[]; insight: MetricInsight } | null
  keyMetricsKpiCount: number
  onKeyMetricsKpiCountChange?: (n: number) => void
  keyMetricsCardId: string
  renderChartCard: (cardId: string, chartType: ChartType) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })
  const { chartVariant } = useChartVariant()

  const style: React.CSSProperties = {
    ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
    transition,
  }

  const isKeyMetrics = card.id === keyMetricsCardId
  if (isKeyMetrics && !keyMetrics) return null

  const canMoveEarlier = cardIndex > 0
  const canMoveLater = cardIndex < totalCards - 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex min-h-0 w-full min-w-0 flex-col self-start rounded-xl border-2 border-dashed border-border bg-transparent p-2",
        span === 2 ? "lg:col-span-2" : undefined,
        isDragging && "z-20 opacity-95 ring-2 ring-ring",
      )}
    >
      <div
        className="mb-2 flex w-full min-w-0 flex-wrap items-center gap-2"
        role="toolbar"
        aria-label={`${card.title} layout controls`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Tip label="Drag to reorder" side="top">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              ref={setActivatorNodeRef}
              className="size-8 text-muted-foreground hover:bg-interactive-hover hover:text-foreground"
              aria-label={`Drag to reorder ${card.title}`}
              {...attributes}
              {...listeners}
            >
              <DragHandleGripIcon className="text-md" />
            </Button>
          </Tip>
          {card.chartTypes.length > 0 ? (
            <ViewSegmentedControl
              aria-label={`Chart type for ${card.title}`}
              iconOnly
              value={chartType}
              onValueChange={v => onChartTypeChange(card.id, v as ChartType)}
              options={card.chartTypes.map(opt => ({
                value: opt.type,
                label: opt.label,
                icon: opt.icon,
              }))}
            />
          ) : null}
          {isKeyMetrics && onKeyMetricsKpiCountChange ? (
            <ViewSegmentedControl
              aria-label="Number of KPIs to show"
              iconOnly={false}
              value={String(keyMetricsKpiCount)}
              onValueChange={v => onKeyMetricsKpiCountChange(Number(v))}
              options={Array.from(
                { length: KEY_METRICS_KPI_COUNT_MAX - KEY_METRICS_KPI_COUNT_MIN + 1 },
                (_, i) => {
                  const n = KEY_METRICS_KPI_COUNT_MIN + i
                  return { value: String(n), label: String(n) }
                },
              )}
            />
          ) : null}
          <ViewSegmentedControl
            aria-label={`Width for ${card.title}`}
            iconOnly
            value={String(span) as "1" | "2"}
            onValueChange={v => onSpanChange(card.id, Number(v) as 1 | 2)}
            options={[
              { value: "1", label: "Half width", icon: "fa-light fa-table-columns" },
              { value: "2", label: "Full width (all columns)", icon: "fa-light fa-maximize" },
            ]}
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div
            className="pointer-events-none flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
            role="group"
            aria-label={`Reorder ${card.title}`}
          >
            <div className="flex items-center gap-0.5 lg:hidden">
              <Tip label="Move up" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveEarlier}
                  aria-label={`Move ${card.title} up`}
                  onClick={() => onMoveStep(-1)}
                >
                  <i className="fa-light fa-chevron-up text-xs" aria-hidden="true" />
                </Button>
              </Tip>
              <Tip label="Move down" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveLater}
                  aria-label={`Move ${card.title} down`}
                  onClick={() => onMoveStep(1)}
                >
                  <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                </Button>
              </Tip>
            </div>
            <div className="hidden items-center gap-0.5 lg:flex">
              <Tip label="Move left" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveEarlier}
                  aria-label={`Move ${card.title} left`}
                  onClick={() => onMoveStep(-1)}
                >
                  <i className="fa-light fa-chevron-left text-xs" aria-hidden="true" />
                </Button>
              </Tip>
              <Tip label="Move right" side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  disabled={!canMoveLater}
                  aria-label={`Move ${card.title} right`}
                  onClick={() => onMoveStep(1)}
                >
                  <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
                </Button>
              </Tip>
            </div>
          </div>
          <Tip label={`Remove ${card.title}`} side="top">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive-ink"
              aria-label={`Remove ${card.title} from dashboard`}
              onClick={() => onRemove(card.id)}
            >
              <i className="fa-light fa-trash text-xs" aria-hidden="true" />
            </Button>
          </Tip>
        </div>
      </div>
      {isKeyMetrics && keyMetrics ? (
        <KeyMetrics
          variant="card"
          title={card.title}
          description={card.description}
          metrics={keyMetrics.metrics.slice(0, keyMetricsKpiCount)}
          insight={keyMetrics.insight}
          metricsSingleRow
          metricsHalfWidthLayout={span === 1}
          className="w-full min-w-0"
        />
      ) : (
        <ChartCard
          variant={chartVariant}
          title={card.title}
          description={card.description}
          className="min-h-0 flex-1"
        >
          {renderChartCard(card.id, chartType)}
        </ChartCard>
      )}
    </div>
  )
}

export function DataViewDashboardCanvas({
  allCards,
  keyMetricsCardId,
  keyMetrics,
  visibleCards,
  cardOrder,
  cardSpans = {},
  cardChartTypes = {},
  keyMetricsKpiCount = 4,
  layoutEditMode = false,
  onVisibleChange,
  onOrderChange,
  onSpanChange,
  onChartTypeChange,
  onKeyMetricsKpiCountChange,
  onResetLayout,
  onLayoutEditDone,
  onLayoutEditCancel,
  renderChartCard,
}: DataViewDashboardCanvasProps) {
  const { chartVariant } = useChartVariant()
  const cardDefs = React.useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards])
  const visibleCardIds = React.useMemo(() => new Set(visibleCards), [visibleCards])

  const orderedCards = React.useMemo(
    () =>
      cardOrder
        .filter(id => visibleCardIds.has(id) && cardDefs.has(id))
        .map(id => cardDefs.get(id)!),
    [visibleCardIds, cardOrder, cardDefs],
  )

  const hiddenCardDefs = React.useMemo(
    () => allCards.filter(c => !visibleCardIds.has(c.id)),
    [allCards, visibleCardIds],
  )

  const sortableIds = React.useMemo(() => orderedCards.map(c => c.id), [orderedCards])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      if (!onOrderChange) return
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = sortableIds.indexOf(String(active.id))
      const newIndex = sortableIds.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return
      const nextVisibleOrder = arrayMove(sortableIds, oldIndex, newIndex)
      onOrderChange(applyVisibleReorder(cardOrder, new Set(visibleCards), nextVisibleOrder))
    },
    [cardOrder, onOrderChange, sortableIds, visibleCards],
  )

  const moveStep = React.useCallback(
    (id: string, direction: -1 | 1) => {
      if (!onOrderChange) return
      const idx = sortableIds.indexOf(id)
      if (idx < 0) return
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= sortableIds.length) return
      const nextVisibleOrder = arrayMove(sortableIds, idx, newIdx)
      onOrderChange(applyVisibleReorder(cardOrder, new Set(visibleCards), nextVisibleOrder))
    },
    [cardOrder, onOrderChange, sortableIds, visibleCards],
  )

  const addCard = React.useCallback(
    (id: string) => {
      if (!onVisibleChange || visibleCards.includes(id)) return
      onVisibleChange([...visibleCards, id])
    },
    [onVisibleChange, visibleCards],
  )

  const removeCard = React.useCallback(
    (id: string) => {
      if (!onVisibleChange) return
      onVisibleChange(visibleCards.filter(v => v !== id))
    },
    [onVisibleChange, visibleCards],
  )

  if (orderedCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center lg:px-6">
        <i className="fa-light fa-chart-column text-2xl text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          No charts on the dashboard.
          {layoutEditMode && hiddenCardDefs.length > 0
            ? " Add a chart below."
            : " Turn on Edit layout and add charts back."}
        </p>
        {layoutEditMode && hiddenCardDefs.length > 0 && onVisibleChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="size-9 p-0" aria-label="Add chart">
                <i className="fa-light fa-plus text-sm" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {hiddenCardDefs.map(c => (
                <DropdownMenuItem key={c.id} onSelect={() => addCard(c.id)}>
                  {c.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    )
  }

  const grid = (
    <div
      className={cn(
        CHART_DASHBOARD_ROW_GRID_CLASS,
        layoutEditMode && "lg:items-start lg:content-start lg:auto-rows-min",
      )}
    >
      {orderedCards.map((card, cardIndex) => {
        const isKeyMetricsCard = card.id === keyMetricsCardId
        const span = cardSpans[card.id] ?? card.defaultSpan
        const requestedType = cardChartTypes[card.id] ?? card.defaultChartType
        const allowedTypes = card.chartTypes.map(o => o.type)
        const chartType =
          allowedTypes.length === 0
            ? card.defaultChartType
            : allowedTypes.includes(requestedType)
              ? requestedType
              : card.defaultChartType

        if (
          layoutEditMode &&
          onOrderChange &&
          onSpanChange &&
          onChartTypeChange &&
          onVisibleChange
        ) {
          return (
            <SortableDashboardChartCard
              key={card.id}
              card={card}
              span={span}
              chartType={chartType}
              cardIndex={cardIndex}
              totalCards={orderedCards.length}
              onSpanChange={onSpanChange}
              onChartTypeChange={onChartTypeChange}
              onRemove={removeCard}
              onMoveStep={dir => moveStep(card.id, dir)}
              keyMetrics={isKeyMetricsCard ? keyMetrics : null}
              keyMetricsKpiCount={keyMetricsKpiCount}
              onKeyMetricsKpiCountChange={isKeyMetricsCard ? onKeyMetricsKpiCountChange : undefined}
              keyMetricsCardId={keyMetricsCardId}
              renderChartCard={renderChartCard}
            />
          )
        }

        return (
          <div
            key={card.id}
            className={cn(CHART_DASHBOARD_CELL_CLASS, span === 2 ? "lg:col-span-2" : undefined)}
          >
            {isKeyMetricsCard ? (
              <KeyMetrics
                variant="card"
                title={card.title}
                description={card.description}
                metrics={keyMetrics.metrics.slice(0, keyMetricsKpiCount)}
                insight={keyMetrics.insight}
                metricsSingleRow
                metricsHalfWidthLayout={span === 1}
                className="h-full w-full min-w-0"
              />
            ) : (
              <ChartCard variant={chartVariant} title={card.title} description={card.description}>
                {renderChartCard(card.id, chartType)}
              </ChartCard>
            )}
          </div>
        )
      })}
    </div>
  )

  const editToolbar =
    layoutEditMode && onVisibleChange && onResetLayout ? (
      <Card
        size="sm"
        className="mb-3 flex-row flex-wrap items-center justify-between gap-3 bg-transparent py-2"
        role="region"
        aria-label="Dashboard layout options"
      >
        <p className="text-xs text-muted-foreground">
          Drag cards to reorder. Changes save automatically.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => onVisibleChange(allCards.map(c => c.id))}
          >
            Show all
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => onVisibleChange([])}
          >
            Hide all
          </Button>
          <Tip side="bottom" label="Reset visibility, order, widths, and chart types">
            <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={onResetLayout}>
              <i className="fa-light fa-rotate-left mr-1 text-xs" aria-hidden="true" />
              Reset
            </Button>
          </Tip>
          {hiddenCardDefs.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="size-8 p-0" aria-label="Add chart">
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hiddenCardDefs.map(c => (
                  <DropdownMenuItem key={c.id} onSelect={() => addCard(c.id)}>
                    {c.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {onLayoutEditCancel ? (
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={onLayoutEditCancel}>
              Cancel
            </Button>
          ) : null}
          {onLayoutEditDone ? (
            <Button type="button" size="sm" className="h-8 text-xs" onClick={onLayoutEditDone}>
              Done
            </Button>
          ) : null}
        </div>
      </Card>
    ) : null

  const gridBody =
    layoutEditMode && onOrderChange ? (
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          {grid}
        </SortableContext>
      </DndContext>
    ) : (
      grid
    )

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 px-4 pb-2 lg:px-6",
        layoutEditMode && "rounded-xl border border-dashed border-border/80 bg-transparent py-3",
      )}
    >
      {editToolbar}
      {gridBody}
    </div>
  )
}
