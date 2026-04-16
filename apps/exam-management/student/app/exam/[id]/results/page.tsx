import { ResultsClient } from './results-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params
  return <ResultsClient id={id} />
}
