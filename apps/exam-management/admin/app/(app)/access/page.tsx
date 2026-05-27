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
 *
 * Migrated to canonical DataTable 2026-05-11 (was hand-rolled DataTable wrapper).
 */

import { useMemo, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import {
  Badge, Button,
  Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Field, FieldGroup, FieldLabel, FieldDescription, FieldError,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxatdesignux/ui'

type Role = 'Admin' | 'Faculty (Editor)' | 'Faculty (Viewer)'

interface AccessEntry extends Record<string, unknown> {
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
  'Faculty (Editor)':   { bg: 'color-mix(in oklch, var(--chart-1) 14%, var(--background))',     fg: 'color-mix(in oklch, var(--chart-1) 60%, var(--foreground))', icon: 'fa-pen' },
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

  const columns: ColumnDef<AccessEntry>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 240,
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: 280,
      cell: (row) => <span className="text-muted-foreground text-sm">{row.email}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      width: 240,
      filter: {
        type: 'select',
        icon: 'fa-shield-keyhole',
        options: (Object.keys(ROLE_TONE) as Role[]).map(r => ({ value: r, label: r })),
      },
      cell: (row) => (
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
      label: 'Added',
      sortable: true,
      width: 140,
      cell: (row) => <span className="text-muted-foreground text-sm">{row.addedDate}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove access for ${row.name}`}
          onClick={() => setRemoveTarget(row)}
        >
          <i className="fa-regular fa-user-xmark" aria-hidden="true" />
        </Button>
      ),
    },
  ], [])

  return (
    <>
      <SiteHeader title="Roles & Access" />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
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
          <DataTable<AccessEntry>
            data={users}
            columns={columns}
            getRowId={(row) => row.id}
            getRowSelectionLabel={(row) => row.name}
            selectable
            searchable
            emptyState={
              <div className="text-sm text-muted-foreground py-8 text-center">
                No users have been granted access.
              </div>
            }
          />
        </div>
      </div>

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
    <Card size="sm">
      <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
      </CardContent>
    </Card>
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => { setName(''); setEmail(''); setRole('Faculty (Editor)'); setErrors({}) }

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address (e.g., name@university.edu).'
    }
    return next
  }

  const submit = () => {
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return
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

        <FieldGroup>
          <Field orientation="vertical">
            <FieldLabel htmlFor="invite-name">Name *</FieldLabel>
            <Input
              id="invite-name"
              placeholder="Dr. Jane Doe"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }) }}
              autoFocus
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'invite-name-error' : undefined}
            />
            {errors.name && <FieldError id="invite-name-error">{errors.name}</FieldError>}
          </Field>
          <Field orientation="vertical">
            <FieldLabel htmlFor="invite-email">Email *</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              placeholder="jane.doe@university.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }) }}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-email-error' : undefined}
            />
            {errors.email && <FieldError id="invite-email-error">{errors.email}</FieldError>}
          </Field>
          <Field orientation="vertical">
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
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
            <FieldDescription>You can change this later from this page.</FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
