'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Input,
  Button,
  Separator,
} from '@exxat/ds/packages/ui/src'

const DEFAULT_ACCOUNT_MANAGER = { name: 'Sarah Chen', email: 'sarah.chen@exxat.com' }

export function LeoDrawer() {
  const [open, setOpen] = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  function handleTicketSubmit(e: React.FormEvent) {
    e.preventDefault()
    window.location.href =
      'mailto:support@exxat.com?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(description)
  }

  return (
    <>
      {/* Floating Leo button */}
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{ zIndex: 100 }}
      >
        <Button
          variant="default"
          size="icon"
          aria-label="Ask Leo"
          onClick={() => setOpen(true)}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'var(--brand-color)',
            color: 'white',
          }}
        >
          <i
            className="fa-duotone fa-solid fa-star-christmas text-lg"
            aria-hidden="true"
            style={{ color: 'white' }}
          />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Leo</SheetTitle>
            <SheetDescription>Your Exxat assistant</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 pb-4 overflow-y-auto flex-1">
            {/* Search */}
            <Input
              placeholder="Ask anything..."
              aria-label="Ask Leo anything"
            />

            <Separator />

            {/* Quick links */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Quick links
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 w-full"
                asChild
              >
                <a href="#" target="_blank" rel="noreferrer">
                  <i className="fa-light fa-book-open text-sm" aria-hidden="true" />
                  Help Center
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 w-full"
                onClick={() => setShowTicketForm(v => !v)}
              >
                <i className="fa-light fa-ticket text-sm" aria-hidden="true" />
                Submit a ticket
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 w-full"
                asChild
              >
                <a href="#" target="_blank" rel="noreferrer">
                  <i className="fa-light fa-sparkles text-sm" aria-hidden="true" />
                  Release notes
                </a>
              </Button>
            </div>

            {/* Ticket form */}
            {showTicketForm && (
              <form onSubmit={handleTicketSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground">New ticket</p>
                <div className="flex flex-col gap-1">
                  <label htmlFor="leo-ticket-subject" className="text-xs text-muted-foreground">
                    Subject
                  </label>
                  <Input
                    id="leo-ticket-subject"
                    placeholder="Brief description"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="leo-ticket-desc" className="text-xs text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    id="leo-ticket-desc"
                    placeholder="Describe the issue..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring resize-none"
                  />
                </div>
                <Button type="submit" size="sm" variant="default">
                  Submit
                </Button>
              </form>
            )}

            <Separator />

            {/* Account manager */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Your account manager
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color)' }}
                >
                  {DEFAULT_ACCOUNT_MANAGER.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{DEFAULT_ACCOUNT_MANAGER.name}</span>
                  <a
                    href={`mailto:${DEFAULT_ACCOUNT_MANAGER.email}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {DEFAULT_ACCOUNT_MANAGER.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
