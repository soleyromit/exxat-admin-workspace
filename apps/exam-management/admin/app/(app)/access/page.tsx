'use client'

/**
 * Role Assignment — Aarti's "Admin can assign Roles" requirement.
 *
 * Three roles per Aarti's email:
 *   - Admin               → full access + role assignment
 *   - Faculty (Editor)    → edit courses they're associated with
 *   - Faculty (Viewer)    → read-only on associated courses
 *
 * Inline role select per row, remove action, and Invite dialog with form.
 */

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable, type Column } from '@/components/data-table'
import {
  Badge, Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxat/ds/packages/ui/src'

type Role = 'Admin' | 'Faculty (Editor)' | 'Faculty (Viewer)'

interface AccessEntry {
  id: string
  name: string
  email: string
  role: Role
  addedDate: string
}

const SEED: AccessEntry[] = [
  { id: '1', name: 'Dr. Sarah Chen',    email: 'sarah.chen@university.edu',    role: 'Admin',             addedDate: '2026-01-15' },
  { id: '2', name: 'Dr. James Patel',   email: 'james.patel@university.edu',   role: 'Faculty (Editor)',  addedDate: '2026-02-03' },
  { id: '3', name: 'Dr. Maria Lopez',   email: 'maria.lopez@university.edu',   role: 'Faculty (Editor)',  addedDate: '2026-02-10' },
  { id: '4', name: 'Dr. Ahmed Hassan',  email: 'ahmed.hassan@university.edu',  role: 'Faculty (Editor)',  addedDate: '2026-03-01' },
  { id: '5', name: 'Prof. Linda Kim',   email: 'linda.kim@university.edu',     role: 'Faculty (Viewer)',  addedDate: '2026-03-20' },
]

const ROLE_TONE: Record<Role, { bg: string; fg: string; icon: string }> = {
  'Admin':              { bg: 'color-mix(in oklch, var(--brand-color) 14%, var(--background))', fg: 'var(--brand-color-dark)', icon: 'fa-shield-keyhole' },
  'Faculty (Editor)':   { bg: 'color-mix(in oklch, var(--chart-1) 14%, var(--background))',     fg: 'var(--chart-1)',          icon: 'fa-pen' },
  'Faculty (Viewer)':   { bg: 'var(--muted)',                                                    fg: 'var(--muted-foreground)', icon: 'fa-eye' },
}

const ROLE_DESCRIPTION: Record<Role, string> = {
  'Admin':            'Full access · can assign roles and edit institution settings',
  'Faculty (Editor)': 'Can edit assigned courses · view-only on settings',
  'Faculty (Viewer)': 'Read-only access to assigned courses',
}

export default function AccessPage() {
  const [users, setUsers] = useState<AccessEntry[]>(SEED)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AccessEntry | null>(null)

  const updateRole = (id: string, role: Role) =>
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, role } : u)))

  const removeUser = (id: string) =>
    setUsers(prev => prev.filter(u => u.id !== id))

  const addUser = (name: string, email: string, role: Role) => {
    const id = String(Date.now())
    setUsers(prev => [
      { id, name, email, role, addedDate: new Date().toISOString().slice(0, 10) },
      ...prev,
    ])
  }

  const columns: Column<AccessEntry>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-muted-foreground text-sm">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Select value={row.role} onValueChange={(v) => updateRole(row.id, v as Role)}>
          <SelectTrigger
            size="sm"
            className="w-fit min-w-[180px] rounded-full font-medium gap-2"
            style={{
              backgroundColor: ROLE_TONE[row.role].bg,
              color: ROLE_TONE[row.role].fg,
              border: '1px solid transparent',
            }}
            aria-label={`Change role for ${row.name}`}
          >
            <i className={`fa-light ${ROLE_TONE[row.role].icon}`} aria-hidden="true" style={{ fontSize: 11 }} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_TONE) as Role[]).map(r => (
              <SelectItem key={r} value={r}>
                <div className="flex items-center gap-2">
                  <i className={`fa-light ${ROLE_TONE[r].icon} text-muted-foreground`} aria-hidden="true" style={{ fontSize: 11 }} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{r}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{ROLE_DESCRIPTION[r]}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'addedDate',
      header: 'Added',
      render: (row) => <span className="text-muted-foreground text-sm">{row.addedDate}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
              <i className="fa-regular fa-ellipsis" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem variant="destructive" onClick={() => setRemoveTarget(row)}>
              <i className="fa-light fa-user-xmark" aria-hidden="true" />
              Remove access
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      <SiteHeader title="Roles & Access" />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Roles & Access"
          subtitle={`${users.length} ${users.length === 1 ? 'person has' : 'people have'} access · admins can assign roles`}
          actions={
            <Button variant="default" size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
              <i className="fa-light fa-user-plus" aria-hidden="true" />
              Invite
            </Button>
          }
        />

        <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
          <RoleLegend />
          <DataTable
            columns={columns}
            data={users}
            emptyMessage="No users have been granted access."
          />
        </div>
      </main>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onAdd={addUser} />

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove access?</DialogTitle>
            <DialogDescription>
              {removeTarget?.name} will lose access to this institution&apos;s exam-management surface.
              You can re-invite them at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) removeUser(removeTarget.id)
                setRemoveTarget(null)
              }}
            >
              Remove access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RoleLegend() {
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      {(Object.keys(ROLE_TONE) as Role[]).map(r => (
        <Tooltip key={r}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <Badge
                variant="secondary"
                className="rounded-full font-medium gap-1.5"
                style={{ backgroundColor: ROLE_TONE[r].bg, color: ROLE_TONE[r].fg }}
              >
                <i className={`fa-light ${ROLE_TONE[r].icon}`} aria-hidden="true" style={{ fontSize: 10 }} />
                {r}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{ROLE_DESCRIPTION[r]}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{ROLE_DESCRIPTION[r]}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

function InviteDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onAdd: (name: string, email: string, role: Role) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Faculty (Editor)')

  const reset = () => { setName(''); setEmail(''); setRole('Faculty (Editor)') }

  const submit = () => {
    if (!name.trim() || !email.trim()) return
    onAdd(name.trim(), email.trim(), role)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite someone to this institution</DialogTitle>
          <DialogDescription>
            They&apos;ll receive an invitation email and can sign in using either Prism or direct login.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              placeholder="Dr. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="jane.doe@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_TONE) as Role[]).map(r => (
                  <SelectItem key={r} value={r}>
                    <div className="flex items-center gap-2">
                      <i className={`fa-light ${ROLE_TONE[r].icon} text-muted-foreground`} aria-hidden="true" style={{ fontSize: 11 }} />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{r}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{ROLE_DESCRIPTION[r]}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!name.trim() || !email.trim()}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
