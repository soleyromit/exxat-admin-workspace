'use client'

// Sub-nav tabs for the consolidated Directory surface (matches live pce-three
// /directory). Router-driven so each tab is its own URL (/directory/courses …).

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@exxatdesignux/ui'

const TABS = [
  { value: 'courses',  label: 'Courses' },
  { value: 'faculty',  label: 'Faculty' },
  { value: 'students', label: 'Students' },
  { value: 'term',     label: 'Term' },
] as const

export function DirectoryTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const active = TABS.find(t => pathname?.includes(`/directory/${t.value}`))?.value ?? 'courses'

  return (
    <div className="px-7 pt-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
      <Tabs value={active} onValueChange={(v) => router.push(`/directory/${v}`)}>
        <TabsList variant="line" aria-label="Directory sections">
          {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
    </div>
  )
}
