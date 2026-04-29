import Link from 'next/link'
import { Badge } from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable, type Column } from '@/components/data-table'
import { MOCK_QUESTIONS, type Question } from '@/lib/mock-questions'

const TYPE_LABELS: Record<Question['type'], string> = {
  mcq: 'MCQ',
  'true-false': 'True / False',
  'short-answer': 'Short Answer',
  essay: 'Essay',
}

const columns: Column<Question>[] = [
  {
    key: 'title',
    header: 'Question',
    render: (row) => (
      <Link
        href={`/questions/${row.id}`}
        className="font-medium hover:underline text-primary"
      >
        {row.title}
      </Link>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    render: (row) => (
      <Badge variant="secondary" className="rounded-full text-xs font-medium">
        {TYPE_LABELS[row.type]}
      </Badge>
    ),
  },
  {
    key: 'course',
    header: 'Course',
    render: (row) => (
      <span className="text-foreground">{row.course}</span>
    ),
  },
  {
    key: 'updatedAt',
    header: 'Updated',
    render: (row) => (
      <span className="text-muted-foreground">{row.updatedAt}</span>
    ),
  },
]

export default function PrivatePage() {
  const privateQuestions = MOCK_QUESTIONS.filter((q) => q.scope === 'private')

  return (
    <>
      <SiteHeader title="Private Space" />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <PageHeader
          title="Private Space"
          subtitle="Questions visible only to you"
        />
        <div className="flex-1 p-6">
          <DataTable
            columns={columns}
            data={privateQuestions}
            emptyMessage="You have no private questions yet."
          />
        </div>
      </main>
    </>
  )
}
