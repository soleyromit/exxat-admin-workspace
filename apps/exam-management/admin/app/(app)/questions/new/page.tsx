import { SiteHeader } from '@/components/site-header'
import { AddQuestionClient } from './add-question-client'

export default function AddQuestionPage() {
  return (
    <>
      <SiteHeader
        title="Add Question"
        breadcrumbs={[
          { label: 'Question Bank', href: '/question-bank' },
          { label: 'Add Question' },
        ]}
      />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <AddQuestionClient />
      </main>
    </>
  )
}
