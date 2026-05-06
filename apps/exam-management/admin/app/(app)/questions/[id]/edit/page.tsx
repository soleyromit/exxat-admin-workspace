import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import { EditQuestionClient } from './edit-question-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditQuestionPage({ params }: PageProps) {
  const { id } = await params
  const question = MOCK_QB_QUESTIONS.find((q) => q.id === id)
  if (!question) notFound()

  return (
    <>
      <SiteHeader
        title={`Edit · ${question.title}`}
        breadcrumbs={[
          { label: 'Question Bank', href: '/question-bank' },
          { label: question.title, href: `/questions/${question.id}` },
          { label: 'Edit' },
        ]}
      />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <EditQuestionClient questionId={question.id} />
      </main>
    </>
  )
}
