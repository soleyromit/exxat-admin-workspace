import { notFound } from 'next/navigation'
import { Badge } from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import { MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  'true-false': 'True / False',
  'short-answer': 'Short Answer',
  essay: 'Essay',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { id } = await params
  const question = MOCK_QB_QUESTIONS.find((q) => q.id === id)

  if (!question) {
    notFound()
  }

  const folder = MOCK_QB_FOLDERS.find(f => f.id === question.folder)

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
            <Badge variant="secondary" className="rounded">
              {TYPE_LABELS[question.type] ?? question.type}
            </Badge>
            <Badge variant="secondary" className="rounded">
              {question.status}
            </Badge>
            <Badge variant="secondary" className="rounded font-mono text-xs">
              {question.code}
            </Badge>
          </div>

          <h2 className="mb-6 text-xl font-semibold">{question.title}</h2>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Difficulty</dt>
              <dd className="mt-1 font-medium">{question.difficulty}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bloom&apos;s Level</dt>
              <dd className="mt-1 font-medium">{question.blooms}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Folder</dt>
              <dd className="mt-1 font-medium">{folder?.name ?? question.folder}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Version</dt>
              <dd className="mt-1 font-medium">v{question.version}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="mt-1 font-medium">{question.age}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Usage</dt>
              <dd className="mt-1 font-medium">{question.usage} assessment{question.usage !== 1 ? 's' : ''}</dd>
            </div>
            {question.tags.length > 0 && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded text-xs">
                      {tag}
                    </Badge>
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
