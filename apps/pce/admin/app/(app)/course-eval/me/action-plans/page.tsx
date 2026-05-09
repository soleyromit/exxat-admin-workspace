'use client'

/**
 * Course Evaluation — Faculty self-view, action plans (Sprint 4).
 * Spec §7: AI-suggested + faculty-authored action items.
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  Input,
  SidebarTrigger, Separator,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@exxat/ds/packages/ui/src'
import {
  CURRENT_FACULTY_ACTION_PLAN, type ActionPlanItem,
} from '@/lib/course-eval-mock'

export default function MyActionPlans() {
  const [items, setItems] = React.useState<ActionPlanItem[]>(CURRENT_FACULTY_ACTION_PLAN)
  const [tab, setTab] = React.useState<'pending' | 'in-progress' | 'completed'>('pending')
  const [draft, setDraft] = React.useState('')

  const filtered = items.filter(i => i.status === tab)
  const counts = {
    pending: items.filter(i => i.status === 'pending').length,
    'in-progress': items.filter(i => i.status === 'in-progress').length,
    completed: items.filter(i => i.status === 'completed').length,
  }

  function addItem() {
    if (!draft.trim()) return
    const newItem: ActionPlanItem = {
      id: `ap-${Date.now()}`,
      text: draft.trim(),
      source: 'faculty-authored',
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setItems([newItem, ...items])
    setDraft('')
  }

  function moveItem(id: string, status: ActionPlanItem['status']) {
    setItems(items.map(i => i.id === id ? { ...i, status } : i))
  }

  return (
    <>
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/course-eval/me" className="text-sm text-muted-foreground hover:underline">
          My Course Evaluations
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Action plans</h1>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 overflow-auto"
        style={{ padding: '20px 28px 40px', scrollPaddingTop: 60 }}
      >
        <div className="max-w-3xl flex flex-col gap-5">

          <p className="text-sm text-muted-foreground">
            Action items derived from your course evaluations and AI suggestions. Private to you until you choose to share.
          </p>

          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-2">Add a new action</h2>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What will you do this term?"
                aria-label="New action plan item"
                onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
              />
              <Button variant="default" onClick={addItem} disabled={!draft.trim()}>
                Add
              </Button>
            </div>
          </Card>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList variant="line">
              <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="in-progress">In progress ({counts['in-progress']})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {filtered.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No actions in this state.
                  </p>
                </Card>
              ) : (
                <ul className="flex flex-col gap-2">
                  {filtered.map(item => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-md p-3"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <i
                        className={
                          item.status === 'completed'   ? 'fa-solid fa-square-check text-sm' :
                          item.status === 'in-progress' ? 'fa-light fa-square-half-stroke text-sm' :
                                                          'fa-light fa-square text-sm'
                        }
                        style={{ color: item.status === 'completed' ? 'var(--chart-2)' : 'var(--muted-foreground)' }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-sm flex-1"
                        style={item.status === 'completed' ? { textDecoration: 'line-through', color: 'var(--muted-foreground)' } : undefined}
                      >
                        {item.text}
                      </span>
                      {item.source === 'ai-suggested' && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <i className="fa-light fa-sparkles" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
                          AI suggested
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {item.createdAt}
                      </span>
                      {item.status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => moveItem(item.id, 'in-progress')}>
                          Start
                        </Button>
                      )}
                      {item.status === 'in-progress' && (
                        <Button variant="ghost" size="sm" onClick={() => moveItem(item.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                      {item.status === 'completed' && (
                        <Button variant="ghost" size="sm" onClick={() => moveItem(item.id, 'pending')} aria-label="Reopen action">
                          <i className="fa-light fa-rotate-left" aria-hidden="true" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
