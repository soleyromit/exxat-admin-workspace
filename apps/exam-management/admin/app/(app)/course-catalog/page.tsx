import type { Metadata } from 'next'
import CatalogClient from './catalog-client'

export const metadata: Metadata = { title: 'Course Catalog — Exam Management' }

export default function CourseCatalogPage() {
  return <CatalogClient />
}
