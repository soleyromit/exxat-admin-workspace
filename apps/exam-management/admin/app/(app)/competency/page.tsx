import type { Metadata } from 'next'
import CompetencyClient from './competency-client'

export const metadata: Metadata = { title: 'Competency — Exam Management' }

export default function CompetencyPage() {
  return <CompetencyClient />
}
