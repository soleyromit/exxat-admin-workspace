import { getRegistry } from '@/app/actions/registry'
import { LinkChecker } from '@/components/link-checker'
import { RegistryList } from '@/components/registry-list'

export const dynamic = 'force-dynamic'

export default async function RegistryPage() {
  const entries = await getRegistry()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Doc Watcher</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>{entries.length} doc{entries.length !== 1 ? 's' : ''} being watched</p>
      </div>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Add docs</h2>
        <LinkChecker onAdded={() => {}} />
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Currently watching</h2>
        <RegistryList entries={entries} onRemoved={() => {}} />
      </section>
    </div>
  )
}
