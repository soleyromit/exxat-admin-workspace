'use client'

/**
 * Private Space — questions visible only to the current author.
 *
 * Migrated to canonical DataTable 2026-05-11 (was hand-rolled DataTable wrapper).
 */

import { useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { MOCK_QUESTIONS, type Question } from '@/lib/mock-questions'

const TYPE_LABELS: Record<Question['type'], string> = {
  mcq: 'MCQ',
  'true-false': 'True / False',
  'short-answer': 'Short Answer',
  essay: 'Essay',
}

interface QuestionRow extends Record<string, unknown> {
  id: string
  title: string
  type: Question['type']
  typeLabel: string
  course: string
  updatedAt: string
}

export default function PrivatePage() {
  const rows: QuestionRow[] = useMemo(
    () => MOCK_QUESTIONS
      .filter((q) => q.scope === 'private')
      .map(q => ({
        id: q.id,
        title: q.title,
        type: q.type,
        typeLabel: TYPE_LABELS[q.type],
        course: q.course,
        updatedAt: q.updatedAt,
      })),
    []
  )

  const columns: ColumnDef<QuestionRow>[] = [
    {
      key: 'title',
      label: 'Question',
      sortable: true,
      width: 480,
      cell: (row) => (
        <Link
          href={`/questions/${row.id}`}
          className="font-medium hover:underline text-primary"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'typeLabel',
      label: 'Type',
      sortable: true,
      width: 140,
      filter: {
        type: 'select',
        icon: 'fa-shapes',
        options: (Object.entries(TYPE_LABELS) as [Question['type'], string][])
          .map(([, label]) => ({ value: label, label })),
      },
      cell: (row) => (
        <Badge variant="secondary" className="rounded-full text-xs font-medium">
          {row.typeLabel}
        </Badge>
      ),
    },
    {
      key: 'course',
      label: 'Course',
      sortable: true,
      width: 240,
      filter: { type: 'select', icon: 'fa-graduation-cap' },
      cell: (row) => <span className="text-foreground">{row.course}</span>,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      width: 140,
      cell: (row) => <span className="text-muted-foreground">{row.updatedAt}</span>,
    },
  ]

  return (
    <>
      <SiteHeader title="Private Space" />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Private Space"
          subtitle="Questions visible only to you"
        />
        <div className="flex-1 p-6">
          <DataTable<QuestionRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            getRowSelectionLabel={(row) => row.title}
            selectable
            searchable
            defaultSort={{ key: 'updatedAt', dir: 'desc' }}
            emptyState={
              <div className="text-sm text-muted-foreground py-8 text-center">
                You have no private questions yet.
              </div>
            }
          />
        </div>
      </main>
    </>
  )
}
