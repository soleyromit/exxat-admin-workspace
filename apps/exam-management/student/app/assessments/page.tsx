import { AssessmentsClient } from './assessments-client'

export default function AssessmentsPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6">
        <span className="text-sm font-semibold text-[var(--foreground)]">Exam Management</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-[var(--brand-color-surface)] text-[var(--brand-color-dark)]">
          <i className="fa-light fa-graduation-cap" aria-hidden="true" />
          Student DS
        </span>
      </header>
      <AssessmentsClient />
    </div>
  )
}
