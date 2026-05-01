'use client'

interface ResponseGaugeProps {
  rate: number
  responseCount: number
  enrollmentCount: number
  showBar?: boolean
  size?: 'sm' | 'md'
}

export function ResponseGauge({
  rate,
  responseCount,
  enrollmentCount,
  showBar = true,
  size = 'sm',
}: ResponseGaugeProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      {showBar && (
        <div
          style={{
            height: size === 'md' ? 6 : 4,
            borderRadius: 3,
            backgroundColor: 'var(--muted)',
            overflow: 'hidden',
            minWidth: 80,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${rate}%`,
              borderRadius: 3,
              backgroundColor: 'var(--brand-color)',
              transition: 'width 400ms ease',
            }}
          />
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-semibold tabular-nums text-foreground"
          style={{ fontSize: size === 'md' ? 14 : 13 }}
        >
          {rate}%
        </span>
        <span className="text-xs text-muted-foreground">
          {responseCount} / {enrollmentCount}
        </span>
      </div>
    </div>
  )
}
