export interface Metric {
  id: string
  label: string
  value: number | string
  delta?: number
  trend?: 'up' | 'down' | 'neutral'
}

export interface KeyMetricsProps {
  metrics: Metric[]
}

export function KeyMetrics({ metrics }: KeyMetricsProps) {
  return (
    <div
      className="flex gap-px overflow-hidden rounded-lg"
      style={{ border: '1px solid var(--border)' }}
      role="list"
      aria-label="Key metrics"
    >
      {metrics.map((metric, index) => (
        <div
          key={metric.id}
          role="listitem"
          className="flex flex-1 flex-col gap-1 px-6 py-4"
          style={{
            backgroundColor: 'var(--card)',
            color: 'var(--card-foreground)',
            borderLeft: index > 0 ? '1px solid var(--border)' : undefined,
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {metric.label}
          </span>
          <span className="text-2xl font-bold">{metric.value}</span>
          {metric.delta !== undefined && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{
                color:
                  metric.trend === 'up'
                    ? 'var(--primary)'
                    : metric.trend === 'down'
                      ? 'var(--destructive)'
                      : 'var(--muted-foreground)',
              }}
            >
              {metric.trend === 'up' && (
                <i className="fa-light fa-arrow-up" aria-hidden="true" />
              )}
              {metric.trend === 'down' && (
                <i className="fa-light fa-arrow-down" aria-hidden="true" />
              )}
              {metric.delta > 0 ? '+' : ''}
              {metric.delta}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
