import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { QuestionBankClient } from "@/components/question-bank-client"

export default function QuestionBankPage() {
  return (
    <PrimaryPageTemplate siteHeader={{ title: "Question bank" }}>
      <QuestionBankClient />
    </PrimaryPageTemplate>
  )
}
