'use client'
// Table primitive used directly (not DataTable) — documented hand-roll.
// This is an editable roster inside a Sheet; DataTable's sort/resize chrome
// conflicts with the fixed-width layout. See docs/governance/ds-adoption.md.

import { useState } from 'react'
import {
  Button,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@exxatdesignux/ui'

export interface EmailContact {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface EmailListSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: EmailContact[]
  onCommit: (contacts: EmailContact[]) => void
}

export function EmailListSheet({ open, onOpenChange, contacts, onCommit }: EmailListSheetProps) {
  const [draft, setDraft] = useState<EmailContact[]>(contacts)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  function handleOpen(v: boolean) {
    if (v) setDraft(contacts)
    onOpenChange(v)
  }

  function addRecipient() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return
    setDraft(prev => [...prev, { id: `ec-${Date.now()}`, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }])
    setFirstName('')
    setLastName('')
    setEmail('')
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="right" className="flex flex-col p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">

        {/* Header */}
        <SheetHeader className="flex flex-row items-center gap-3 shrink-0 border-b border-border" style={{ padding: '14px 20px' }}>
          <SheetTitle className="flex-1 text-base font-semibold">Email List</SheetTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" style={{ fontSize: 12 }} />
              Upload CSV
            </Button>
            <Button variant="outline" size="sm">
              <i className="fa-light fa-arrow-down-to-bracket" aria-hidden="true" style={{ fontSize: 12 }} />
              Download CSV Template
            </Button>
            <Button variant="default" size="sm" onClick={() => onCommit(draft)}>
              Add / Update Recipients
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto flex flex-col gap-4" style={{ padding: '20px 24px' }}>

          {/* Count */}
          <div
            className="flex items-center gap-2"
            style={{ padding: '8px 12px', background: 'var(--muted)', borderRadius: 8 }}
          >
            <i className="fa-light fa-envelope text-sm" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-sm text-muted-foreground">{draft.length} email(s)</span>
          </div>

          {/* Entry form */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">
              Recipients <span style={{ color: 'var(--destructive)' }}>*</span>
            </p>
            <div
              className="flex flex-col gap-3 rounded-xl border border-border"
              style={{ padding: 16, background: 'var(--card)' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'el-first', label: 'First Name', value: firstName, onChange: setFirstName, placeholder: 'First name' },
                  { id: 'el-last',  label: 'Last Name',  value: lastName,  onChange: setLastName,  placeholder: 'Last name' },
                  { id: 'el-email', label: 'Email',      value: email,     onChange: setEmail,     placeholder: 'email@example.com' },
                ].map(({ id, label, value, onChange, placeholder }) => (
                  <div key={id} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      {label} <span style={{ color: 'var(--destructive)' }}>*</span>
                    </label>
                    <input
                      id={id}
                      type={id === 'el-email' ? 'email' : 'text'}
                      placeholder={placeholder}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addRecipient() }}
                      className="rounded-md text-sm w-full"
                      style={{ padding: '7px 10px', border: '1px solid var(--border-control-35)', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
                  onClick={addRecipient}
                >
                  Add Recipient
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setFirstName(''); setLastName(''); setEmail('') }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Contact list */}
          {draft.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <i className="fa-light fa-envelope text-3xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No contacts added yet. Click "Add Recipient" to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draft.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{c.firstName}</TableCell>
                      <TableCell className="text-sm font-medium">{c.lastName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${c.firstName} ${c.lastName}`}
                          onClick={() => setDraft(prev => prev.filter(x => x.id !== c.id))}
                        >
                          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
