import { SiteHeader } from '@/components/site-header'
import { KpiBand } from '@/components/dashboard/kpi-band'
import { AtRiskTable } from '@/components/dashboard/at-risk-table'
import { EncounterChart } from '@/components/dashboard/encounter-chart'
import { AllStudentsTable } from '@/components/dashboard/all-students-table'

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <SiteHeader title="Dashboard" />

      <main className="flex-1 overflow-y-auto" style={{ padding: 24, backgroundColor: 'var(--background)' }}>
        {/* KPI band */}
        <div className="mb-6">
          <KpiBand />
        </div>

        {/* At-risk + encounter type row */}
        <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: '1fr 340px' }}>
          <AtRiskTable />
          <EncounterChart />
        </div>

        {/* All students */}
        <AllStudentsTable />
      </main>
    </div>
  )
}
