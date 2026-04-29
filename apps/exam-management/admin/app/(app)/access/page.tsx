import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable, type Column } from '@/components/data-table'
import { Badge, Button } from '@exxat/ds/packages/ui/src'

interface AccessEntry {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Faculty' | 'Viewer'
  addedDate: string
}

const MOCK_ACCESS: AccessEntry[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@university.edu',
    role: 'Admin',
    addedDate: '2026-01-15',
  },
  {
    id: '2',
    name: 'Dr. James Patel',
    email: 'james.patel@university.edu',
    role: 'Faculty',
    addedDate: '2026-02-03',
  },
  {
    id: '3',
    name: 'Dr. Maria Lopez',
    email: 'maria.lopez@university.edu',
    role: 'Faculty',
    addedDate: '2026-02-10',
  },
  {
    id: '4',
    name: 'Dr. Ahmed Hassan',
    email: 'ahmed.hassan@university.edu',
    role: 'Faculty',
    addedDate: '2026-03-01',
  },
  {
    id: '5',
    name: 'Prof. Linda Kim',
    email: 'linda.kim@university.edu',
    role: 'Viewer',
    addedDate: '2026-03-20',
  },
]

const ROLE_COLORS: Record<AccessEntry['role'], { bg: string; color: string }> = {
  Admin: { bg: 'var(--primary)', color: 'var(--primary-foreground)' },
  Faculty: { bg: 'var(--secondary)', color: 'var(--secondary-foreground)' },
  Viewer: { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
}

const columns: Column<AccessEntry>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => (
      <span className="text-muted-foreground">{row.email}</span>
    ),
  },
  {
    key: 'role',
    header: 'Role',
    render: (row) => {
      const s = ROLE_COLORS[row.role]
      return (
        <Badge
          variant="secondary"
          className="rounded-full text-xs font-medium"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {row.role}
        </Badge>
      )
    },
  },
  {
    key: 'addedDate',
    header: 'Added',
    render: (row) => (
      <span className="text-muted-foreground">{row.addedDate}</span>
    ),
  },
]

export default function AccessPage() {
  return (
    <>
      <SiteHeader title="Share Access" />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Share Access"
          subtitle="Manage who can access and collaborate on your question bank"
          actions={
            <Button variant="default" size="sm">
              <i className="fa-light fa-user-plus" aria-hidden="true" />
              Invite
            </Button>
          }
        />
        <div className="flex-1 p-6">
          <DataTable
            columns={columns}
            data={MOCK_ACCESS}
            emptyMessage="No users have been granted access."
          />
        </div>
      </main>
    </>
  )
}
