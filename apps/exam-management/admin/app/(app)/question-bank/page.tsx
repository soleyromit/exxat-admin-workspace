import { SiteHeader } from '@/components/site-header'
import { QuestionBankClient } from './question-bank-client'

export default function QuestionBankPage() {
  return (
    <>
      <SiteHeader title="Question Bank" />
      <QuestionBankClient />
    </>
  )
}
