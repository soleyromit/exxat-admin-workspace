'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyMetrics } from '@/components/key-metrics'
import { PageHeader } from '@/components/page-header'
import { DataTable, type Column } from '@/components/data-table'
import { RoleToggle } from '@/components/role-toggle'
import { MOCK_QUESTIONS, QB_METRICS, type Question } from '@/lib/mock-questions'

type ViewMode = 'all' | 'by-course' | 'by-folder'

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'by-course', label: 'By Course' },
  { value: 'by-folder', label: 'By Folder' },
]

function ScopeBadge({ scope }: { scope: Question['scope'] }) {
  const styles: Record<Question['scope'], { bg: string; color: string }> = {
    shared: { bg: 'var(--success)', color: 'var(--success-foreground)' },
    course: { bg: 'var(--primary)', color: 'var(--primary-foreground)' },
    private: { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
  }
  const s = styles[scope]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {scope}
    </span>
  )
}

function TypeBadge({ type }: { type: Question['type'] }) {
  const labels: Record<Question['type'], string> = {
    mcq: 'MCQ',
    'true-false': 'True/False',
    'short-answer': 'Short Answer',
    essay: 'Essay',
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: 'var(--secondary)',
        color: 'var(--secondary-foreground)',
      }}
    >
      {labels[type]}
    </span>
  )
}

export function QuestionBankClient() {
  const [view, setView] = useState<ViewMode>('all')
  const [role, setRole] = useState<'admin' | 'faculty'>('admin')

  const filteredQuestions =
    role === 'faculty'
      ? MOCK_QUESTIONS.filter((q) => q.scope !== 'private')
      : MOCK_QUESTIONS

  const columns: Column<Question>[] = [
    {
      key: 'title',
      header: 'Question',
      render: (row) => (
        <Link
          href={`/questions/${row.id}`}
          className="font-medium hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <TypeBadge type={row.type} />,
    },
    {
      key: view === 'by-folder' ? 'folder' : 'course',
      header: view === 'by-folder' ? 'Folder' : 'Course',
      render: (row) => (
        <span style={{ color: 'var(--foreground)' }}>
          {view === 'by-folder' ? row.folder : row.course}
        </span>
      ),
    },
    {
      key: 'scope',
      header: 'Access',
      render: (row) => <ScopeBadge scope={row.scope} />,
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (row) => (
        <span style={{ color: 'var(--muted-foreground)' }}>{row.updatedAt}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12 text-right',
      render: (row) => (
        <button
          type="button"
          aria-label={`Actions for ${row.title}`}
          className="rounded p-1 transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <i className="fa-light fa-ellipsis-vertical" aria-hidden="true" />
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Question Bank"
        subtitle="Manage and organize your exam questions"
        actions={
          <>
            <RoleToggle onChange={setRole} />
            <Link
              href="/questions/new"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Question
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        <KeyMetrics metrics={QB_METRICS} />

        <div className="flex items-center gap-2">
          <div
            className="flex overflow-hidden rounded-md"
            style={{ border: '1px solid var(--border)' }}
            role="group"
            aria-label="View mode"
          >
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={view === opt.value}
                onClick={() => setView(opt.value)}
                className="px-4 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    view === opt.value ? 'var(--primary)' : 'transparent',
                  color:
                    view === opt.value
                      ? 'var(--primary-foreground)'
                      : 'var(--foreground)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredQuestions}
          emptyMessage="No questions found."
        />
      </div>
    </div>
  )
}
