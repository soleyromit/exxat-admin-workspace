import type { Metadata } from 'next'
import TermsClient from './terms-client'

export const metadata: Metadata = { title: 'Terms — Exam Management' }

export default function TermsPage() {
  return <TermsClient />
}
