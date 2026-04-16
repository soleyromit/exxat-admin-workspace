export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data found.',
}: DataTableProps<T>) {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: '1px solid var(--border)' }}
    >
      <table
        className="w-full text-sm"
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${col.className ?? ''}`}
                style={{ color: 'var(--muted-foreground)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom:
                    rowIndex < data.length - 1
                      ? '1px solid var(--border)'
                      : undefined,
                }}
                className="transition-colors hover:opacity-80"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
