import { KeyMetrics, type MetricItem } from '@/components/key-metrics'
import { getKPIs } from '@/lib/mock-data'

export function KpiBand() {
  const { total, onTrackPct, atRisk, avgLogged, target } = getKPIs()

  const metrics: MetricItem[] = [
    {
      id: 'total',
      label: 'Total Students',
      value: String(total),
      delta: 'Enrolled this term',
      trend: 'neutral',
    },
    {
      id: 'on-track',
      label: 'On Track',
      value: `${onTrackPct}%`,
      delta: '+3% vs last term',
      trend: 'up',
    },
    {
      id: 'at-risk',
      label: 'At Risk',
      value: String(atRisk),
      delta: 'Below 50% of target',
      trend: 'down',
    },
    {
      id: 'avg',
      label: 'Avg Encounters',
      value: `${avgLogged} / ${target}`,
      delta: 'Per student this term',
      trend: 'neutral',
    },
  ]

  return <KeyMetrics metrics={metrics} variant="flat" metricsSingleRow />
}
