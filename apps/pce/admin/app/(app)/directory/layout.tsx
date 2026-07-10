import { SiteHeader } from '@/components/site-header'
import { DirectoryTabs } from '@/components/pce/directory/directory-tabs'

// Consolidated Directory shell (Romit-approved, matches live pce-three IA):
// one "Directory" surface with Courses · Faculty · Students · Term sub-tabs over
// the existing entity tables.
export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader title="Directory" />
      <DirectoryTabs />
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  )
}
