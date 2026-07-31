'use client'

// Sub-nav tabs for the consolidated Directory surface (matches live pce-three
// /directory). Router-driven so each tab is its own URL (/directory/courses …).
//
// The Tabs root wraps the panel content on purpose. Previously TabsList sat alone
// with no TabsContent anywhere, so Radix still emitted
// `aria-controls="radix-…-content-faculty"` on every trigger pointing at an element
// that never existed. axe flagged it CRITICAL (aria-valid-attr-value) on all four
// directory routes — a screen reader following the tab's own aria-controls landed
// on nothing. Rendering the route's content inside TabsContent for the active tab
// makes that reference resolve to the region the tab genuinely controls.
// Same DS components, same markup order, zero visual change.

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@exxatdesignux/ui'

const TABS = [
  { value: 'courses',  label: 'Courses' },
  { value: 'faculty',  label: 'Faculty' },
  { value: 'students', label: 'Students' },
  { value: 'term',     label: 'Term' },
] as const

export function DirectoryTabs({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const active = TABS.find(t => pathname?.includes(`/directory/${t.value}`))?.value ?? 'courses'

  return (
    <Tabs
      value={active}
      onValueChange={(v) => router.push(`/directory/${v}`)}
      className="flex flex-col flex-1 overflow-hidden"
    >
      <div className="px-7 pt-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <TabsList variant="line" aria-label="Directory sections">
          {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>
      </div>
      <TabsContent
        value={active}
        // The route already owns the heading/table; keep the panel a transparent
        // pass-through so the flex/scroll chain is unchanged.
        className="flex-1 overflow-hidden flex flex-col mt-0 data-[state=active]:flex"
      >
        {children}
      </TabsContent>
    </Tabs>
  )
}
