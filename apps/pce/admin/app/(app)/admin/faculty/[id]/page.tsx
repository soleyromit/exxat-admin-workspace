'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { FacultyProfileDashboard } from '@/components/pce/faculty-profile-dashboard'
import { MOCK_FACULTY } from '@/lib/pce-mock-data'

export default function FacultyAnalyticsProfile() {
  const params    = useParams<{ id: string }>()
  const facultyId = params?.id ?? ''
  const faculty   = MOCK_FACULTY.find(f => f.id === facultyId)

  if (!faculty) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-user-slash text-3xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Faculty not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/faculty">Back to Faculty</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <SiteHeader breadcrumbs={[{ label: 'Faculty', href: '/admin/faculty' }]} title={faculty.name} />
      <FacultyProfileDashboard facultyId={faculty.id} showPrismLink />
    </>
  )
}
