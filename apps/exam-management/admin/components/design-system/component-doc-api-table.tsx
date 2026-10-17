"use client"

import * as React from "react"

import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@/components/data-table/types"
import type { ComponentDocApiRow } from "@/lib/design-system/component-doc-types"
import {
  DS_DOC_SECTION_TITLE,
  DS_DOC_TABLE_BODY,
  DS_DOC_TABLE_CODE,
  DS_DOC_TABLE_META,
} from "@/lib/design-system/doc-typography"

type ApiDocTableRow = {
  prop: string
  type: string
  defaultValue: string
  description: string
}

const API_DOC_COLUMNS: ColumnDef<ApiDocTableRow>[] = [
  {
    key: "prop",
    label: "Prop",
    width: 160,
    minWidth: 120,
    sortable: true,
    cell: (row) => <span className={DS_DOC_TABLE_CODE}>{row.prop}</span>,
  },
  {
    key: "type",
    label: "Type",
    width: 180,
    minWidth: 120,
    sortable: true,
    cell: (row) => <span className={DS_DOC_TABLE_META}>{row.type}</span>,
  },
  {
    key: "defaultValue",
    label: "Default",
    width: 120,
    minWidth: 96,
    sortable: true,
    cell: (row) => <span className={DS_DOC_TABLE_META}>{row.defaultValue}</span>,
  },
  {
    key: "description",
    label: "Description",
    width: 360,
    minWidth: 200,
    sortable: true,
    cell: (row) => <span className={DS_DOC_TABLE_BODY}>{row.description}</span>,
  },
]

function toApiDocRows(rows: ComponentDocApiRow[]): ApiDocTableRow[] {
  return rows.map((row) => ({
    prop: row.prop,
    type: row.type,
    defaultValue: row.defaultValue ?? "none",
    description: row.description,
  }))
}

export function ComponentDocApiTable({ rows }: { rows: ComponentDocApiRow[] }) {
  const data = React.useMemo(() => toApiDocRows(rows), [rows])
  const columns = React.useMemo(() => API_DOC_COLUMNS, [])

  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h2 className={DS_DOC_SECTION_TITLE}>API</h2>
      <div className="min-w-0">
        <DataTable
          data={data}
          columns={columns}
          getRowId={(row) => row.prop}
          defaultSort={{ key: "prop", dir: "asc" }}
          selectable={false}
          searchable={false}
          showQueryControls={false}
          edgeInset={false}
          emptyState="No API props documented."
        />
      </div>
    </section>
  )
}
