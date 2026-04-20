import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { MOCK_QUESTIONS } from '@/lib/mock-questions'

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  'true-false': 'True / False',
  'short-answer': 'Short Answer',
  essay: 'Essay',
}

const SCOPE_LABELS: Record<string, string> = {
  shared: 'Shared',
  course: 'Course-Based',
  private: 'Private',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { id } = await params
  const question = MOCK_QUESTIONS.find((q) => q.id === id)

  if (!question) {
    notFound()
  }

  return (
    <>
      <SiteHeader
        title={question.title}
        breadcrumbs={[
          { label: 'Question Bank', href: '/question-bank' },
          { label: question.title },
        ]}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-6 outline-none">
        <div
          className="mx-auto max-w-3xl rounded-xl p-8"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--card-foreground)',
          }}
        >
          <div className="mb-6 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
              }}
            >
              {TYPE_LABELS[question.type] ?? question.type}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: 'var(--muted)',
                color: 'var(--muted-foreground)',
              }}
            >
              {SCOPE_LABELS[question.scope] ?? question.scope}
            </span>
          </div>

          <h2 className="mb-6 text-xl font-semibold">{question.title}</h2>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt style={{ color: 'var(--muted-foreground)' }}>Course</dt>
              <dd className="mt-1 font-medium">{question.course}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted-foreground)' }}>Folder</dt>
              <dd className="mt-1 font-medium">{question.folder}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted-foreground)' }}>Created By</dt>
              <dd className="mt-1 font-medium">{question.createdBy}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted-foreground)' }}>Last Updated</dt>
              <dd className="mt-1 font-medium">{question.updatedAt}</dd>
            </div>
            {question.tags.length > 0 && (
              <div className="col-span-2">
                <dt style={{ color: 'var(--muted-foreground)' }}>Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-foreground)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </main>
    </>
  )
}
