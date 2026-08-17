"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TablePropertiesDrawer } from "@/components/table-properties"
import type {
  ActiveFilter,
  FilterFieldDef,
  SortRule,
} from "@/components/table-properties/types"
import { Tip } from "@/components/ui/tip"
import {
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelHeader,
  FloatingSheetPanelToolbar,
  FloatingSheetPanelWorkflowFooter,
  type FloatingSheetSize,
} from "@/lib/floating-sheet-panel"

function Copy({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-4 text-sm text-muted-foreground">{children}</p>
}

/** Enough content to push the body into scroll, so the header border shows. */
function LongCopy() {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4 text-sm text-muted-foreground">
      {Array.from({ length: 28 }, (_, index) => (
        <p key={index}>
          Row {index + 1}. Scroll this body and the header grows a bottom border, so the title stays
          separated from the content moving under it.
        </p>
      ))}
    </div>
  )
}

function OpenButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      {children}
    </Button>
  )
}

/** Toolbar, header, scrolling body, and workflow footer in one rail. */
export function FloatingSheetAnatomyPreview() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <OpenButton onClick={() => setOpen(true)}>Open rail</OpenButton>

      <FloatingSheetPanel open={open} onOpenChange={setOpen}>
        <FloatingSheetPanelContent size="md" contentSlot="ds-rail-anatomy">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader
            title="Export data"
            description="128 records available for export."
          />
          <FloatingSheetPanelBody>
            <LongCopy />
          </FloatingSheetPanelBody>
          <FloatingSheetPanelWorkflowFooter
            onCancel={() => setOpen(false)}
            primaryLabel="Export"
            onPrimary={() => setOpen(false)}
          />
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}

const SIZES = [
  { size: "sm", label: "Small", width: "24rem" },
  { size: "md", label: "Medium", width: "32rem" },
  { size: "lg", label: "Large", width: "40rem" },
] as const satisfies readonly { size: FloatingSheetSize; label: string; width: string }[]

export function FloatingSheetSizePreview() {
  const [open, setOpen] = React.useState<FloatingSheetSize | null>(null)
  const active = SIZES.find(preset => preset.size === open)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SIZES.map(preset => (
        <OpenButton key={preset.size} onClick={() => setOpen(preset.size)}>
          {preset.label} {preset.width}
        </OpenButton>
      ))}

      <FloatingSheetPanel
        open={active != null}
        onOpenChange={next => {
          if (!next) setOpen(null)
        }}
      >
        <FloatingSheetPanelContent
          size={active?.size ?? "sm"}
          contentSlot={`ds-rail-size-${active?.size ?? "sm"}`}
        >
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader
            title={`${active?.label ?? "Small"} rail`}
            subtitle={`Opens at ${active?.width ?? "24rem"}`}
          />
          <FloatingSheetPanelBody>
            <Copy>
              Change the size from the toolbar menu, or drag the inner edge for a width in between.
              Either choice is remembered for this rail.
            </Copy>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}

const RECORDS = ["Avery Chen", "Jordan Lee", "Sam Rivera", "Priya Nair"]

/** Record stepping plus a filled right-hand actions cluster. */
export function FloatingSheetToolbarPreview() {
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [starred, setStarred] = React.useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <OpenButton onClick={() => setOpen(true)}>Open record</OpenButton>

      <FloatingSheetPanel open={open} onOpenChange={setOpen}>
        <FloatingSheetPanelContent size="md" contentSlot="ds-rail-toolbar">
          <FloatingSheetPanelToolbar
            onPrevious={index > 0 ? () => setIndex(n => n - 1) : undefined}
            onNext={index < RECORDS.length - 1 ? () => setIndex(n => n + 1) : undefined}
            previousLabel="Previous student"
            nextLabel="Next student"
            actions={
              <>
                <Tip label={starred ? "Remove from favorites" : "Add to favorites"} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-pressed={starred}
                    aria-label={starred ? "Remove from favorites" : "Add to favorites"}
                    onClick={() => setStarred(value => !value)}
                  >
                    <i
                      className={`${starred ? "fa-solid" : "fa-light"} fa-star text-xs`}
                      aria-hidden="true"
                    />
                  </Button>
                </Tip>
                <DropdownMenu>
                  <Tip label="More actions" side="bottom">
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                        <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                  </Tip>
                  <DropdownMenuContent align="end" className="z-[90]">
                    <DropdownMenuItem>
                      <i className="fa-light fa-link" aria-hidden="true" />
                      <span>Copy link</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <i className="fa-light fa-share-nodes" aria-hidden="true" />
                      <span>Share</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" />
                      <span>Open as page</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            }
          />
          <FloatingSheetPanelHeader
            title={RECORDS[index]}
            subtitle={`Student ${index + 1} of ${RECORDS.length}`}
          />
          <FloatingSheetPanelBody>
            <Copy>
              Step through the list without going back to the hub. Wire previous and next only when
              the rail is showing one of an ordered set; leave them off for Export or Properties.
            </Copy>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}

const HEADER_VARIANTS = [
  {
    id: "title",
    label: "Title only",
    title: "Resume instructions",
    body: "The quietest header. Use it when the title says everything.",
  },
  {
    id: "description",
    label: "With description",
    title: "Import students",
    description:
      "Nothing is overwritten. Existing records are matched on their workspace ID and updated in place.",
    body: "Use a description for a rule the user needs before they act.",
  },
  {
    id: "subtitle",
    label: "With subtitle",
    title: "Properties",
    subtitle: "Active placements",
    body: "A subtitle is one line of meta: a count, a state, a record ID. Not a sentence.",
  },
] as const

export function FloatingSheetHeaderVariantsPreview() {
  const [open, setOpen] = React.useState<string | null>(null)
  const active = HEADER_VARIANTS.find(variant => variant.id === open)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {HEADER_VARIANTS.map(variant => (
        <OpenButton key={variant.id} onClick={() => setOpen(variant.id)}>
          {variant.label}
        </OpenButton>
      ))}

      <FloatingSheetPanel
        open={active != null}
        onOpenChange={next => {
          if (!next) setOpen(null)
        }}
      >
        <FloatingSheetPanelContent contentSlot="ds-rail-header-variants">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader
            title={active?.title ?? ""}
            subtitle={active && "subtitle" in active ? active.subtitle : undefined}
            description={active && "description" in active ? active.description : undefined}
          />
          <FloatingSheetPanelBody>
            <Copy>{active?.body}</Copy>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}

const NESTED_NAV_FIELDS = [
  { key: "name", label: "Name", sortable: true },
  { key: "topic", label: "Topic", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "updated", label: "Last updated", sortable: true },
]

const NESTED_NAV_FILTER_FIELDS: FilterFieldDef[] = [
  {
    key: "topic",
    label: "Topic",
    type: "select",
    icon: "fa-layer-group",
    operators: ["is", "is_not"],
    options: [
      { value: "cardiology", label: "Cardiology" },
      { value: "neurology", label: "Neurology" },
      { value: "orthopedics", label: "Orthopedics" },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    icon: "fa-circle-dot",
    operators: ["is", "is_not"],
    options: [
      { value: "published", label: "Published" },
      { value: "draft", label: "Draft" },
    ],
  },
]

/**
 * The shipped Properties rail, not a copy of it. Drill into Filter or Sort and
 * the back control appears in the toolbar next to close.
 */
export function FloatingSheetNestedNavPreview() {
  const [open, setOpen] = React.useState(false)
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([])
  const [sortRules, setSortRules] = React.useState<SortRule[]>([])
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(new Set())
  const [groupBy, setGroupBy] = React.useState<string | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <OpenButton onClick={() => setOpen(true)}>Open properties</OpenButton>

      <TablePropertiesDrawer
        open={open}
        onOpenChange={setOpen}
        lifecycleTabLabel="All questions"
        fieldDefinitions={NESTED_NAV_FIELDS}
        filterFields={NESTED_NAV_FILTER_FIELDS}
        totalRows={248}
        filteredRows={248}
        activeFilters={activeFilters}
        onAddFilter={fieldKey =>
          setActiveFilters(current => [
            ...current,
            { id: `${fieldKey}-${current.length}`, fieldKey, operator: "is", values: [] },
          ])
        }
        onUpdateFilter={(id, patch) =>
          setActiveFilters(current =>
            current.map(filter => (filter.id === id ? { ...filter, ...patch } : filter)),
          )
        }
        onRemoveFilter={id =>
          setActiveFilters(current => current.filter(filter => filter.id !== id))
        }
        sortRules={sortRules}
        onSortRulesChange={setSortRules}
        onAddSortRule={fieldKey =>
          setSortRules(current => [
            ...current,
            { id: `${fieldKey}-${current.length}`, fieldKey, direction: "asc" },
          ])
        }
        onRemoveSortRule={id => setSortRules(current => current.filter(rule => rule.id !== id))}
        onToggleSortDir={id =>
          setSortRules(current =>
            current.map(rule =>
              rule.id === id
                ? { ...rule, direction: rule.direction === "asc" ? "desc" : "asc" }
                : rule,
            ),
          )
        }
        hiddenCols={hiddenCols}
        onToggleColVisibility={key =>
          setHiddenCols(current => {
            const next = new Set(current)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
          })
        }
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
    </div>
  )
}

/** Two rails that compete for the same edge, to show the swap. */
export function FloatingSheetSingleRailPreview() {
  const [rail, setRail] = React.useState<"properties" | "export" | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <OpenButton onClick={() => setRail("properties")}>Open properties</OpenButton>
      <OpenButton onClick={() => setRail("export")}>Open export</OpenButton>

      <FloatingSheetPanel
        open={rail === "properties"}
        onOpenChange={next => {
          if (!next) setRail(current => (current === "properties" ? null : current))
        }}
      >
        <FloatingSheetPanelContent contentSlot="ds-rail-properties">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader title="Properties" />
          <FloatingSheetPanelBody>
            <Copy>Open export while this is up. This rail closes rather than stacking behind it.</Copy>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>

      <FloatingSheetPanel
        open={rail === "export"}
        onOpenChange={next => {
          if (!next) setRail(current => (current === "export" ? null : current))
        }}
      >
        <FloatingSheetPanelContent contentSlot="ds-rail-export">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader title="Export" />
          <FloatingSheetPanelBody>
            <Copy>
              Each rail still owns its own open state. The group only asks the previous one to close.
            </Copy>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}

/** Shows the non-modal page behind plus the drag handle. */
export function FloatingSheetLivePagePreview() {
  const [open, setOpen] = React.useState(false)
  const [count, setCount] = React.useState(0)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <OpenButton onClick={() => setOpen(true)}>Open rail</OpenButton>
      <Button type="button" variant="outline" size="sm" onClick={() => setCount(n => n + 1)}>
        Clicked {count} times
      </Button>

      <FloatingSheetPanel open={open} onOpenChange={setOpen}>
        <FloatingSheetPanelContent size="md" contentSlot="ds-rail-live-page">
          <FloatingSheetPanelToolbar />
          <FloatingSheetPanelHeader title="The page stays live" subtitle="Non-modal" />
          <FloatingSheetPanelBody>
            <Copy>
              With this open, the counter button behind still works and the page still scrolls.
              Clicking out there will not dismiss the rail, so a half-filled form survives a stray
              click. Escape and the toolbar close button are the way out.
            </Copy>
          </FloatingSheetPanelBody>
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </div>
  )
}
