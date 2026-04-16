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
      <AddQuestionClient />
    </>
  )
}
