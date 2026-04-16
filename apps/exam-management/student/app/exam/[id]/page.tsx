import { TakeExamClient } from './take-exam-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TakeExamPage({ params }: PageProps) {
  const { id } = await params
  return <TakeExamClient id={id} />
}
