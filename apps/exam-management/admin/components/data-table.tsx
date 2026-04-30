import type { ReactNode } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@exxat/ds/packages/ui/src'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

export interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  emptyMessage = 'No data found.',
}: DataTableProps<T>) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
