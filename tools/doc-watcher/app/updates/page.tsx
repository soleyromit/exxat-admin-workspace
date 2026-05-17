import { getUpdates } from '@/app/actions/updates'
import { UpdatesFeed } from '@/components/updates-feed'

export const dynamic = 'force-dynamic'

export default async function UpdatesPage() {
  const initial = await getUpdates({ product: 'all', period: 'week', type: 'all' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Updates</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>PRD changes, compliance findings, and corrections — filterable</p>
      </div>
      <UpdatesFeed initial={initial} />
    </div>
  )
}
