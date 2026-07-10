"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  AvatarInitials,
  AvatarStatus,
  AvatarVerified,
} from "@/components/ui/avatar"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectionTileGrid } from "@/components/ui/selection-tile-grid"
import { Tip } from "@/components/ui/tip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { Button } from "@/components/ui/button"
import { ColumnsShowcase } from "@/components/columns-showcase"
import { DataTable } from "@/components/data-table"
import { useTableState } from "@/components/data-table/use-table-state"
import type { ColumnDef } from "@/components/data-table/types"
import { DS_DOC_BODY, DS_DOC_BODY_EMPHASIS } from "@/lib/design-system/doc-typography"
import { useProductDashboardHref } from "@/contexts/product-route-sync"
import { stockPortraitUrl } from "@/lib/stock-portrait"

const DS_PEOPLE = [
  { initials: "AC", name: "Alex Chen" },
  { initials: "MR", name: "Morgan Rivera" },
  { initials: "JT", name: "Jordan Taylor" },
  { initials: "PL", name: "Priya Lakshmi" },
] as const

export function AvatarInitialsPreview() {
  return <AvatarInitials initials="AC" size="lg" decorative />
}

export function AvatarSizesPreview() {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <AvatarInitials initials="SM" size="sm" decorative />
      <AvatarInitials initials="MD" size="default" decorative />
      <AvatarInitials initials="LG" size="lg" decorative />
    </div>
  )
}

export function AvatarImagePreview() {
  return (
    <Avatar size="lg">
      <AvatarImage src={stockPortraitUrl("ds-avatar-doc")} alt="Alex Chen" referrerPolicy="no-referrer" />
      <AvatarFallback>AC</AvatarFallback>
    </Avatar>
  )
}

export function AvatarStatusPreview() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <AvatarStatus status="online" label="Online">
        <AvatarInitials initials="AC" decorative />
      </AvatarStatus>
      <AvatarStatus status="busy" label="Busy">
        <AvatarInitials initials="MR" decorative />
      </AvatarStatus>
      <AvatarStatus status="away" label="Away" position="top-end">
        <AvatarInitials initials="JT" decorative />
      </AvatarStatus>
    </div>
  )
}

export function AvatarGroupPreview() {
  const visible = DS_PEOPLE.slice(0, 3)
  const overflow = DS_PEOPLE.length - visible.length
  return (
    <AvatarGroup data-size="default">
      {visible.map((person) => (
        <Tip key={person.initials} side="top" label={person.name}>
          <AvatarInitials initials={person.initials} decorative />
        </Tip>
      ))}
      {overflow > 0 ? (
        <Tip
          side="top"
          label={DS_PEOPLE.slice(3).map((p) => p.name).join(", ")}
        >
          <AvatarGroupCount tabIndex={0} aria-label={`${overflow} more`}>
            +{overflow}
          </AvatarGroupCount>
        </Tip>
      ) : null}
    </AvatarGroup>
  )
}

export function AvatarVerifiedPreview() {
  return (
    <AvatarVerified label="Verified coordinator">
      <AvatarInitials initials="PL" size="lg" decorative />
    </AvatarVerified>
  )
}

/** @deprecated Use section-specific previews — kept for catalog re-export. */
export function AvatarPreview() {
  return <AvatarInitialsPreview />
}

export function TablePreview() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Kind</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>HubTable</TableCell>
          <TableCell>Composition</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

/** Full column catalog — same HubTable as `/columns` (Column types showcase). */
export function TableColumnsPreview() {
  const navigate = useNavigate()
  const dashboardHref = useProductDashboardHref()
  const columnsHref = `${dashboardHref.replace(/\/dashboard$/, "")}/columns`

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className={DS_DOC_BODY}>
        Every shipped cell pattern: person identity, status, progress, currency, rating, tags,
        attachments, links, and row actions. Preview shows five rows —{" "}
        <span className={DS_DOC_BODY_EMPHASIS}>View more</span> opens the Column types hub.
        Select rows to open the floating bulk-action bar.
      </p>
      <ColumnsShowcase
        view="table"
        onViewChange={() => {}}
        embeddedPreview
        persistKey="design-system-table-columns"
        onEmbeddedPreviewViewMore={() => navigate(columnsHref)}
      />
    </div>
  )
}

type BulkBarDemoRow = {
  id: string
  name: string
  status: string
} & Record<string, unknown>

const BULK_BAR_DEMO_ROWS: BulkBarDemoRow[] = [
  { id: "q_101", name: "Diaphragm innervation", status: "Published" },
  { id: "q_102", name: "Brachial plexus roots", status: "Draft" },
  { id: "q_103", name: "Cranial nerve functions", status: "In review" },
  { id: "q_104", name: "Lower limb dermatomes", status: "Published" },
]

const BULK_BAR_DEMO_COLUMNS: ColumnDef<BulkBarDemoRow>[] = [
  { key: "select", label: "", width: 40, minWidth: 40, defaultPin: "left", lockPin: true },
  { key: "name", label: "Question", width: 280 },
  { key: "status", label: "Status", width: 120 },
]

/** Compact grid with two rows pre-selected so the bulk-action bar is visible in docs. */
export function TableBulkActionBarPreview() {
  const columns = React.useMemo(() => BULK_BAR_DEMO_COLUMNS, [])
  const state = useTableState(BULK_BAR_DEMO_ROWS, columns, { key: "name", dir: "asc" })
  const seededRef = React.useRef(false)

  React.useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    state.setSelected(new Set(["q_101", "q_102"]))
  }, [state.setSelected])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className={DS_DOC_BODY}>
        Two rows are pre-selected. The bar pins to the viewport bottom, aligned to the table width.
        Pass structured <span className={DS_DOC_BODY_EMPHASIS}>bulkActions</span> on{" "}
        <span className={DS_DOC_BODY_EMPHASIS}>HubTable</span> or a custom{" "}
        <span className={DS_DOC_BODY_EMPHASIS}>bulkActionsSlot</span> on{" "}
        <span className={DS_DOC_BODY_EMPHASIS}>DataTable</span>.{" "}
        <span className={DS_DOC_BODY_EMPHASIS}>Esc</span> clears selection.
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <DataTable
          data={BULK_BAR_DEMO_ROWS}
          columns={columns}
          getRowId={(row) => row.id}
          getRowSelectionLabel={(row) => row.name}
          state={state}
          defaultSort={{ key: "name", dir: "asc" }}
          emptyState="No questions match your filters."
          edgeInset={false}
          bulkActionsSlot={() => (
            <>
              <Button type="button" size="sm" variant="outline" className="shrink-0">
                <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" /> Export
              </Button>
              <Button type="button" size="sm" variant="outline" className="shrink-0">
                <i className="fa-light fa-box-archive" aria-hidden="true" /> Archive
              </Button>
            </>
          )}
        />
      </div>
    </div>
  )
}

export function SelectPreview() {
  const [value, setValue] = React.useState("pt")
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor="ds-select">Program</FieldLabel>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id="ds-select" className="w-full max-w-sm" aria-label="Program">
          <SelectValue placeholder="Choose program" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pt">Physical therapy</SelectItem>
          <SelectItem value="nursing">Nursing</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  )
}

export function CommandPreview() {
  return (
    <Command className="max-w-sm rounded-lg border border-border shadow-sm">
      <CommandInput placeholder="Search commands…" aria-label="Search commands" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem>Go to Library</CommandItem>
          <CommandItem>Open settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function SelectionTileGridPreview() {
  const [tile, setTile] = React.useState("csv")
  return (
    <SelectionTileGrid
      sectionLabel="Format"
      interaction="radio"
      options={[
        { value: "csv", label: "CSV", icon: "fa-file-csv" },
        { value: "xlsx", label: "Excel", icon: "fa-file-excel" },
      ]}
      value={tile}
      onValueChange={setTile}
      columns={2}
    />
  )
}

/** Settings rows — fixed label column prevents wrap in doc examples */
const TOGGLE_SETTINGS_LABEL = "min-w-0 shrink-0 sm:min-w-[9rem]"

export function ToggleSwitchLabelLeftPreview() {
  const [on, setOn] = React.useState(true)
  return (
    <Field orientation="horizontal" className="w-full items-center gap-4">
      <FieldLabel htmlFor="ds-toggle-switch-left" className={TOGGLE_SETTINGS_LABEL}>
        Notifications
      </FieldLabel>
      <FieldContent className="flex min-w-0 flex-1 flex-col items-end gap-1">
        <ToggleSwitch checked={on} onChange={setOn} id="ds-toggle-switch-left" />
        <FieldDescription className="text-right">Email when published</FieldDescription>
      </FieldContent>
    </Field>
  )
}

export function ToggleSwitchLabelRightPreview() {
  const [on, setOn] = React.useState(false)
  return (
    <Field orientation="horizontal" className="w-full items-center gap-3">
      <ToggleSwitch checked={on} onChange={setOn} id="ds-toggle-switch-right" />
      <FieldLabel htmlFor="ds-toggle-switch-right" className="min-w-0 flex-1 font-normal">
        Dark mode
      </FieldLabel>
    </Field>
  )
}

export function ToggleSwitchGroupPreview() {
  const [email, setEmail] = React.useState(true)
  const [push, setPush] = React.useState(false)
  const [digest, setDigest] = React.useState(true)
  return (
    <FieldGroup className="w-full gap-4">
      <Field orientation="horizontal" className="w-full items-center justify-between gap-4">
        <FieldLabel htmlFor="ds-toggle-email" className={TOGGLE_SETTINGS_LABEL}>
          Email alerts
        </FieldLabel>
        <ToggleSwitch checked={email} onChange={setEmail} id="ds-toggle-email" />
      </Field>
      <Field orientation="horizontal" className="w-full items-center justify-between gap-4">
        <FieldLabel htmlFor="ds-toggle-push" className={TOGGLE_SETTINGS_LABEL}>
          Push notifications
        </FieldLabel>
        <ToggleSwitch checked={push} onChange={setPush} id="ds-toggle-push" />
      </Field>
      <Field orientation="horizontal" className="w-full items-center justify-between gap-4">
        <FieldLabel htmlFor="ds-toggle-digest" className={TOGGLE_SETTINGS_LABEL}>
          Weekly digest
        </FieldLabel>
        <ToggleSwitch checked={digest} onChange={setDigest} id="ds-toggle-digest" />
      </Field>
    </FieldGroup>
  )
}

/** @deprecated Use section-specific previews — kept for catalog re-export. */
export function ToggleSwitchPreview() {
  return <ToggleSwitchLabelLeftPreview />
}
